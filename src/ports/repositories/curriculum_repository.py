"""
Curriculum repository interface for the Agentic Learning Coach system.
"""
from abc import ABC, abstractmethod
from typing import Optional, List

from ...domain.entities import LearningPlan, Module, Task
from ...domain.value_objects import LearningPlanStatus


class CurriculumRepository(ABC):
    """
    Abstract repository interface for curriculum and learning plan operations.
    
    This interface defines the contract for learning plan, module, and task
    persistence operations following the dependency inversion principle.
    """
    
    # Learning Plan Operations
    @abstractmethod
    async def save_plan(self, plan: LearningPlan) -> LearningPlan:
        """
        Save a learning plan (create or update).
        
        Args:
            plan: The learning plan to save
            
        Returns:
            LearningPlan: The saved learning plan
        """
        pass
    
    @abstractmethod
    async def get_plan(self, plan_id: str) -> Optional[LearningPlan]:
        """
        Retrieve a learning plan by ID.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            LearningPlan or None if not found
        """
        pass
    
    @abstractmethod
    async def get_active_plan(self, user_id: str) -> Optional[LearningPlan]:
        """
        Get the active learning plan for a user.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            LearningPlan or None if no active plan exists
        """
        pass
    
    @abstractmethod
    async def get_user_plans(self, user_id: str) -> List[LearningPlan]:
        """
        Get all learning plans for a user.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            List[LearningPlan]: List of user's learning plans
        """
        pass
    
    @abstractmethod
    async def update_plan_status(self, plan_id: str, status: LearningPlanStatus) -> None:
        """
        Update the status of a learning plan.
        
        Args:
            plan_id: Unique identifier for the learning plan
            status: New status for the plan
            
        Raises:
            PlanNotFoundError: If plan doesn't exist
        """
        pass
    
    @abstractmethod
    async def delete_plan(self, plan_id: str) -> bool:
        """
        Delete a learning plan and all associated modules/tasks.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    # Module Operations
    @abstractmethod
    async def save_module(self, module: Module) -> Module:
        """
        Save a module (create or update).
        
        Args:
            module: The module to save
            
        Returns:
            Module: The saved module
        """
        pass
    
    @abstractmethod
    async def get_module(self, module_id: str) -> Optional[Module]:
        """
        Retrieve a module by ID.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            Module or None if not found
        """
        pass
    
    @abstractmethod
    async def get_plan_modules(self, plan_id: str) -> List[Module]:
        """
        Get all modules for a learning plan.
        
        Args:
            plan_id: Unique identifier for the learning plan
            
        Returns:
            List[Module]: List of modules ordered by order_index
        """
        pass
    
    @abstractmethod
    async def delete_module(self, module_id: str) -> bool:
        """
        Delete a module and all associated tasks.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    # Task Operations
    @abstractmethod
    async def save_task(self, task: Task) -> Task:
        """
        Save a task (create or update).
        
        Args:
            task: The task to save
            
        Returns:
            Task: The saved task
        """
        pass
    
    @abstractmethod
    async def get_task(self, task_id: str) -> Optional[Task]:
        """
        Retrieve a task by ID.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            Task or None if not found
        """
        pass
    
    @abstractmethod
    async def get_module_tasks(self, module_id: str) -> List[Task]:
        """
        Get all tasks for a module.
        
        Args:
            module_id: Unique identifier for the module
            
        Returns:
            List[Task]: List of tasks ordered by day_offset
        """
        pass
    
    @abstractmethod
    async def get_tasks_for_day(self, user_id: str, day_offset: int) -> List[Task]:
        """
        Get all tasks scheduled for a specific day for a user.
        
        Args:
            user_id: Unique identifier for the user
            day_offset: Day offset from plan start (0-based)
            
        Returns:
            List[Task]: List of tasks for the specified day
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def delete_task(self, task_id: str) -> bool:
        """
        Delete a task.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass