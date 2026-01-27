"""
PostgreSQL implementation of the CurriculumRepository interface.
"""
import uuid
from typing import Optional, List
from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from src.domain.entities.learning_plan import LearningPlan
from src.domain.entities.module import Module
from src.domain.entities.task import Task
from src.domain.value_objects.enums import LearningPlanStatus
from src.ports.repositories.curriculum_repository import CurriculumRepository
from src.ports.repositories.base_repository import (
    EntityNotFoundError, RepositoryError
)
from src.adapters.database.models import (
    LearningPlan as LearningPlanModel,
    LearningModule as LearningModuleModel,
    LearningTask as LearningTaskModel
)


class PostgresCurriculumRepository(CurriculumRepository):
    """
    PostgreSQL implementation of the CurriculumRepository interface.
    
    This repository handles learning plan, module, and task persistence
    operations using SQLAlchemy and PostgreSQL as the backend database.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize the repository with a database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    # Learning Plan Operations
    async def save_plan(self, plan: LearningPlan) -> LearningPlan:
        """
        Save a learning plan (create or update).
        
        Args:
            plan: The learning plan to save
            
        Returns:
            LearningPlan: The saved learning plan
        """
        try:
            plan_uuid = uuid.UUID(plan.id)
            user_uuid = uuid.UUID(plan.user_id)
        except ValueError as e:
            raise RepositoryError(f"Invalid UUID format: {str(e)}")
        
        # Check if plan exists
        existing = await self.session.get(LearningPlanModel, plan_uuid)
        
        if existing:
            # Update existing plan
            existing.title = plan.title
            existing.goal_description = plan.goal_description
            existing.status = plan.status
            existing.total_days = plan.total_days
            existing.updated_at = func.now()
            
            plan_model = existing
        else:
            # Create new plan
            plan_model = LearningPlanModel(
                id=plan_uuid,
                user_id=user_uuid,
                title=plan.title,
                goal_description=plan.goal_description,
                status=plan.status,
                total_days=plan.total_days
            )
            self.session.add(plan_model)
        
        await self.session.flush()
        
        # Handle modules
        for module in plan.modules:
            await self._save_module_internal(module, plan_uuid)
        
        await self.session.commit()
        
        return await self.get_plan(plan.id)
    
    async def get_plan(self, plan_id: str) -> Optional[LearningPlan]:
        """
        Retrieve a learning plan by ID.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            LearningPlan or None if not found
        """
        try:
            plan_uuid = uuid.UUID(plan_id)
        except ValueError:
            return None
        
        stmt = (
            select(LearningPlanModel)
            .options(
                selectinload(LearningPlanModel.modules).selectinload(LearningModuleModel.tasks)
            )
            .where(LearningPlanModel.id == plan_uuid)
        )
        
        result = await self.session.execute(stmt)
        plan_model = result.scalar_one_or_none()
        
        if plan_model is None:
            return None
        
        return self._plan_to_domain(plan_model)
    
    async def get_active_plan(self, user_id: str) -> Optional[LearningPlan]:
        """
        Get the active learning plan for a user.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            LearningPlan or None if no active plan exists
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return None
        
        stmt = (
            select(LearningPlanModel)
            .options(
                selectinload(LearningPlanModel.modules).selectinload(LearningModuleModel.tasks)
            )
            .where(
                and_(
                    LearningPlanModel.user_id == user_uuid,
                    LearningPlanModel.status == LearningPlanStatus.ACTIVE
                )
            )
        )
        
        result = await self.session.execute(stmt)
        plan_model = result.scalar_one_or_none()
        
        if plan_model is None:
            return None
        
        return self._plan_to_domain(plan_model)
    
    async def get_user_plans(self, user_id: str) -> List[LearningPlan]:
        """
        Get all learning plans for a user.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            List[LearningPlan]: List of user's learning plans
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(LearningPlanModel)
            .options(
                selectinload(LearningPlanModel.modules).selectinload(LearningModuleModel.tasks)
            )
            .where(LearningPlanModel.user_id == user_uuid)
            .order_by(LearningPlanModel.created_at.desc())
        )
        
        result = await self.session.execute(stmt)
        plan_models = result.scalars().all()
        
        return [self._plan_to_domain(plan) for plan in plan_models]
    
    async def update_plan_status(self, plan_id: str, status: LearningPlanStatus) -> None:
        """
        Update the status of a learning plan.
        
        Args:
            plan_id: Unique identifier for the learning plan
            status: New status for the plan
            
        Raises:
            EntityNotFoundError: If plan doesn't exist
        """
        try:
            plan_uuid = uuid.UUID(plan_id)
        except ValueError:
            raise EntityNotFoundError("LearningPlan", plan_id)
        
        stmt = (
            update(LearningPlanModel)
            .where(LearningPlanModel.id == plan_uuid)
            .values(status=status, updated_at=func.now())
        )
        
        result = await self.session.execute(stmt)
        
        if result.rowcount == 0:
            raise EntityNotFoundError("LearningPlan", plan_id)
        
        await self.session.commit()
    
    async def delete_plan(self, plan_id: str) -> bool:
        """
        Delete a learning plan and all associated modules/tasks.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            plan_uuid = uuid.UUID(plan_id)
        except ValueError:
            return False
        
        stmt = delete(LearningPlanModel).where(LearningPlanModel.id == plan_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    # Module Operations
    async def save_module(self, module: Module) -> Module:
        """
        Save a module (create or update).
        
        Args:
            module: The module to save
            
        Returns:
            Module: The saved module
        """
        try:
            plan_uuid = uuid.UUID(module.plan_id)
        except ValueError as e:
            raise RepositoryError(f"Invalid plan_id UUID format: {str(e)}")
        
        await self._save_module_internal(module, plan_uuid)
        await self.session.commit()
        
        return await self.get_module(module.id)
    
    async def _save_module_internal(self, module: Module, plan_uuid: uuid.UUID) -> None:
        """Internal method to save a module without committing."""
        try:
            module_uuid = uuid.UUID(module.id)
        except ValueError as e:
            raise RepositoryError(f"Invalid module UUID format: {str(e)}")
        
        # Check if module exists
        existing = await self.session.get(LearningModuleModel, module_uuid)
        
        if existing:
            # Update existing module
            existing.title = module.title
            existing.summary = module.summary
            existing.order_index = module.order_index
            
            module_model = existing
        else:
            # Create new module
            module_model = LearningModuleModel(
                id=module_uuid,
                plan_id=plan_uuid,
                title=module.title,
                summary=module.summary,
                order_index=module.order_index
            )
            self.session.add(module_model)
        
        await self.session.flush()
        
        # Handle tasks
        for task in module.tasks:
            await self._save_task_internal(task, module_uuid)
    
    async def get_module(self, module_id: str) -> Optional[Module]:
        """
        Retrieve a module by ID.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            Module or None if not found
        """
        try:
            module_uuid = uuid.UUID(module_id)
        except ValueError:
            return None
        
        stmt = (
            select(LearningModuleModel)
            .options(selectinload(LearningModuleModel.tasks))
            .where(LearningModuleModel.id == module_uuid)
        )
        
        result = await self.session.execute(stmt)
        module_model = result.scalar_one_or_none()
        
        if module_model is None:
            return None
        
        return self._module_to_domain(module_model)
    
    async def get_plan_modules(self, plan_id: str) -> List[Module]:
        """
        Get all modules for a learning plan.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            List[Module]: List of modules ordered by order_index
        """
        try:
            plan_uuid = uuid.UUID(plan_id)
        except ValueError:
            return []
        
        stmt = (
            select(LearningModuleModel)
            .options(selectinload(LearningModuleModel.tasks))
            .where(LearningModuleModel.plan_id == plan_uuid)
            .order_by(LearningModuleModel.order_index)
        )
        
        result = await self.session.execute(stmt)
        module_models = result.scalars().all()
        
        return [self._module_to_domain(module) for module in module_models]
    
    async def delete_module(self, module_id: str) -> bool:
        """
        Delete a module and all associated tasks.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            module_uuid = uuid.UUID(module_id)
        except ValueError:
            return False
        
        stmt = delete(LearningModuleModel).where(LearningModuleModel.id == module_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    # Task Operations
    async def save_task(self, task: Task) -> Task:
        """
        Save a task (create or update).
        
        Args:
            task: The task to save
            
        Returns:
            Task: The saved task
        """
        try:
            module_uuid = uuid.UUID(task.module_id)
        except ValueError as e:
            raise RepositoryError(f"Invalid module_id UUID format: {str(e)}")
        
        await self._save_task_internal(task, module_uuid)
        await self.session.commit()
        
        return await self.get_task(task.id)
    
    async def _save_task_internal(self, task: Task, module_uuid: uuid.UUID) -> None:
        """Internal method to save a task without committing."""
        try:
            task_uuid = uuid.UUID(task.id)
        except ValueError as e:
            raise RepositoryError(f"Invalid task UUID format: {str(e)}")
        
        # Check if task exists
        existing = await self.session.get(LearningTaskModel, task_uuid)
        
        if existing:
            # Update existing task
            existing.day_offset = task.day_offset
            existing.task_type = task.task_type
            existing.description = task.description
            existing.estimated_minutes = task.estimated_minutes
            existing.completion_criteria = task.completion_criteria
            existing.resources = task.resources
        else:
            # Create new task
            task_model = LearningTaskModel(
                id=task_uuid,
                module_id=module_uuid,
                day_offset=task.day_offset,
                task_type=task.task_type,
                description=task.description,
                estimated_minutes=task.estimated_minutes,
                completion_criteria=task.completion_criteria,
                resources=task.resources
            )
            self.session.add(task_model)
    
    async def get_task(self, task_id: str) -> Optional[Task]:
        """
        Retrieve a task by ID.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            Task or None if not found
        """
        try:
            task_uuid = uuid.UUID(task_id)
        except ValueError:
            return None
        
        task_model = await self.session.get(LearningTaskModel, task_uuid)
        
        if task_model is None:
            return None
        
        return self._task_to_domain(task_model)
    
    async def get_module_tasks(self, module_id: str) -> List[Task]:
        """
        Get all tasks for a module.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            List[Task]: List of tasks ordered by day_offset
        """
        try:
            module_uuid = uuid.UUID(module_id)
        except ValueError:
            return []
        
        stmt = (
            select(LearningTaskModel)
            .where(LearningTaskModel.module_id == module_uuid)
            .order_by(LearningTaskModel.day_offset)
        )
        
        result = await self.session.execute(stmt)
        task_models = result.scalars().all()
        
        return [self._task_to_domain(task) for task in task_models]
    
    async def get_tasks_for_day(self, user_id: str, day_offset: int) -> List[Task]:
        """
        Get all tasks scheduled for a specific day for a user.
        
        Args:
            user_id: Unique identifier for the user
            day_offset: Day offset from plan start (0-based)
            
        Returns:
            List[Task]: List of tasks for the specified day
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(LearningTaskModel)
            .join(LearningModuleModel, LearningTaskModel.module_id == LearningModuleModel.id)
            .join(LearningPlanModel, LearningModuleModel.plan_id == LearningPlanModel.id)
            .where(
                and_(
                    LearningPlanModel.user_id == user_uuid,
                    LearningPlanModel.status == LearningPlanStatus.ACTIVE,
                    LearningTaskModel.day_offset == day_offset
                )
            )
            .order_by(LearningModuleModel.order_index, LearningTaskModel.day_offset)
        )
        
        result = await self.session.execute(stmt)
        task_models = result.scalars().all()
        
        return [self._task_to_domain(task) for task in task_models]
    
    async def get_user_tasks_by_date_range(
        self, 
        user_id: str, 
        start_day: int, 
        end_day: int
    ) -> List[Task]:
        """
        Get all tasks for a user within a date range.
        
        Args:
            user_id: Unique identifier for the user
            start_day: Starting day offset (inclusive)
            end_day: Ending day offset (inclusive)
            
        Returns:
            List[Task]: List of tasks within the date range
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(LearningTaskModel)
            .join(LearningModuleModel, LearningTaskModel.module_id == LearningModuleModel.id)
            .join(LearningPlanModel, LearningModuleModel.plan_id == LearningPlanModel.id)
            .where(
                and_(
                    LearningPlanModel.user_id == user_uuid,
                    LearningPlanModel.status == LearningPlanStatus.ACTIVE,
                    LearningTaskModel.day_offset >= start_day,
                    LearningTaskModel.day_offset <= end_day
                )
            )
            .order_by(LearningTaskModel.day_offset, LearningModuleModel.order_index)
        )
        
        result = await self.session.execute(stmt)
        task_models = result.scalars().all()
        
        return [self._task_to_domain(task) for task in task_models]
    
    async def delete_task(self, task_id: str) -> bool:
        """
        Delete a task.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            task_uuid = uuid.UUID(task_id)
        except ValueError:
            return False
        
        stmt = delete(LearningTaskModel).where(LearningTaskModel.id == task_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    # Domain conversion methods
    def _plan_to_domain(self, plan_model: LearningPlanModel) -> LearningPlan:
        """Convert database model to domain entity."""
        modules = [self._module_to_domain(module) for module in plan_model.modules]
        
        return LearningPlan(
            id=str(plan_model.id),
            user_id=str(plan_model.user_id),
            title=plan_model.title,
            goal_description=plan_model.goal_description,
            total_days=plan_model.total_days,
            status=plan_model.status,
            modules=modules,
            created_at=plan_model.created_at
        )
    
    def _module_to_domain(self, module_model: LearningModuleModel) -> Module:
        """Convert database model to domain entity."""
        tasks = [self._task_to_domain(task) for task in module_model.tasks]
        
        return Module(
            id=str(module_model.id),
            plan_id=str(module_model.plan_id),
            title=module_model.title,
            order_index=module_model.order_index,
            summary=module_model.summary,
            tasks=tasks
        )
    
    def _task_to_domain(self, task_model: LearningTaskModel) -> Task:
        """Convert database model to domain entity."""
        return Task(
            id=str(task_model.id),
            module_id=str(task_model.module_id),
            day_offset=task_model.day_offset,
            task_type=task_model.task_type,
            description=task_model.description,
            estimated_minutes=task_model.estimated_minutes,
            completion_criteria=task_model.completion_criteria,
            resources=task_model.resources or []
        )