"""
API router for curriculum endpoints.

Handles curriculum/learning plan management including creation,
retrieval, activation, and status tracking.
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.api.models.curriculum import (
    CurriculumResponse,
    ModuleResponse,
    TaskResponse,
    CreateCurriculumRequest,
    CurriculumStatusResponse,
    CurriculumListResponse,
    ActivateCurriculumRequest,
)
from src.adapters.api.models.common import ErrorResponse, SuccessResponse
from src.adapters.api.dependencies import (
    get_current_user_id,
    get_db_session,
    PaginationParams,
)
from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
from src.adapters.database.repositories.postgres_user_repository import PostgresUserRepository
from src.domain.value_objects.enums import LearningPlanStatus


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/curriculum",
    tags=["curriculum"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


@router.get(
    "",
    response_model=CurriculumResponse,
    summary="Get user's curriculum",
    description="""
    Retrieve the user's active curriculum/learning plan.
    
    Returns the complete curriculum including all modules and tasks.
    If no active curriculum exists, returns a 404 error.
    """,
)
async def get_curriculum(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> CurriculumResponse:
    """
    Get the user's active curriculum.
    """
    try:
        logger.info(f"Getting curriculum for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active curriculum found. Create a curriculum first."
            )
        
        # Convert to response model
        response = _plan_to_response(plan)
        
        logger.info(f"Retrieved curriculum {plan.id} for user {user_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting curriculum for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get curriculum: {str(e)}"
        )


@router.get(
    "/all",
    response_model=CurriculumListResponse,
    summary="List all curricula",
    description="Retrieve all curricula for the user, including completed and paused ones.",
)
async def list_curricula(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> CurriculumListResponse:
    """
    List all curricula for the user.
    """
    try:
        logger.info(f"Listing curricula for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get all plans
        plans = await curriculum_repository.get_user_plans(user_id)
        
        # Find active plan
        active_plan_id = None
        for plan in plans:
            if plan.status == LearningPlanStatus.ACTIVE:
                active_plan_id = plan.id
                break
        
        # Convert to response models
        curricula = [_plan_to_response(plan) for plan in plans]
        
        return CurriculumListResponse(
            curricula=curricula,
            total=len(curricula),
            active_plan_id=active_plan_id
        )
        
    except Exception as e:
        logger.error(f"Error listing curricula for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list curricula: {str(e)}"
        )


@router.post(
    "",
    response_model=CurriculumResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create curriculum",
    description="""
    Create a new personalized curriculum based on learning goals.
    
    The system will generate a structured learning path with modules
    and tasks tailored to the user's goals and skill level.
    """,
)
async def create_curriculum(
    request: CreateCurriculumRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> CurriculumResponse:
    """
    Create a new curriculum for the user.
    """
    try:
        logger.info(f"Creating curriculum for user {user_id} with goals: {request.goals}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        user_repository = PostgresUserRepository(db)
        
        # Get user profile - auto-create if doesn't exist (for onboarding flow)
        profile = await user_repository.get_user_profile(user_id)
        if not profile:
            logger.info(f"Creating new profile for user {user_id} during curriculum creation")
            try:
                demo_email = f"{user_id}@onboarding.local"
                demo_name = f"Learner {user_id[:8]}"
                profile = await user_repository.create_user(
                    email=demo_email,
                    name=demo_name,
                    user_id=user_id
                )
                logger.info(f"Created new profile for user {user_id}")
            except ValueError as ve:
                logger.error(f"Invalid user_id format for user {user_id}: {ve}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format. Please refresh and try again."
                )
            except Exception as create_error:
                logger.error(f"Failed to create profile for user {user_id}: {create_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile. Please try again."
                )
        
        # Import domain entities
        from src.domain.entities.learning_plan import LearningPlan
        from src.domain.entities.module import Module
        from src.domain.entities.task import Task
        from src.domain.value_objects.enums import TaskType
        
        # Create learning plan
        # In a full implementation, this would use CurriculumPlannerAgent
        plan = LearningPlan(
            user_id=user_id,
            title=f"Learning Path: {', '.join(request.goals[:2])}",
            goal_description=f"Master {', '.join(request.goals)}",
            total_days=30,  # Default 30 days
            status=LearningPlanStatus.DRAFT
        )
        
        # Generate sample modules based on goals
        for i, goal in enumerate(request.goals[:5]):  # Limit to 5 modules
            module = Module(
                plan_id=plan.id,
                title=f"Module {i + 1}: {goal.title()}",
                order_index=i,
                summary=f"Learn the fundamentals of {goal}"
            )
            
            # Add sample tasks to each module
            for day in range(3):  # 3 tasks per module
                task = Task(
                    module_id=module.id,
                    day_offset=i * 3 + day,
                    task_type=TaskType.CODE if day % 2 == 0 else TaskType.READ,
                    description=f"Practice {goal} - Day {day + 1}",
                    estimated_minutes=30,
                    completion_criteria=f"Complete the {goal} exercise"
                )
                module.tasks.append(task)
            
            plan.add_module(module)
        
        # Save the plan
        saved_plan = await curriculum_repository.save_plan(plan)
        
        logger.info(f"Created curriculum {saved_plan.id} for user {user_id}")
        
        return _plan_to_response(saved_plan)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating curriculum for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create curriculum: {str(e)}"
        )


@router.get(
    "/status",
    response_model=CurriculumStatusResponse,
    summary="Get curriculum status",
    description="Get a summary of the user's curriculum progress and status.",
)
async def get_curriculum_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> CurriculumStatusResponse:
    """
    Get the status of the user's curriculum.
    """
    try:
        logger.info(f"Getting curriculum status for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            return CurriculumStatusResponse(
                has_active_plan=False,
                plan_id=None,
                status=None,
                progress_percentage=0.0,
                current_module=None,
                current_task=None,
                days_remaining=None,
                next_milestone=None,
                recommendations=["Create a curriculum to start learning"]
            )
        
        # Calculate progress
        total_tasks = sum(len(module.tasks) for module in plan.modules)
        # In a full implementation, we'd query progress tracking
        completed_tasks = 0  # Placeholder
        progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get current module and task
        current_module = plan.modules[0].title if plan.modules else None
        current_task = plan.modules[0].tasks[0].description if plan.modules and plan.modules[0].tasks else None
        
        return CurriculumStatusResponse(
            has_active_plan=True,
            plan_id=plan.id,
            status=plan.status.value,
            progress_percentage=progress,
            current_module=current_module,
            current_task=current_task,
            days_remaining=plan.total_days,
            next_milestone=f"Complete {current_module}" if current_module else None,
            recommendations=_get_recommendations(plan, progress)
        )
        
    except Exception as e:
        logger.error(f"Error getting curriculum status for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get curriculum status: {str(e)}"
        )


@router.post(
    "/activate",
    response_model=SuccessResponse,
    summary="Activate curriculum",
    description="Activate a draft curriculum to start learning.",
)
async def activate_curriculum(
    request: ActivateCurriculumRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SuccessResponse:
    """
    Activate a curriculum to start learning.
    """
    try:
        logger.info(f"Activating curriculum {request.plan_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the plan
        plan = await curriculum_repository.get_plan(request.plan_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum not found"
            )
        
        if plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to activate this curriculum"
            )
        
        # Deactivate any existing active plan
        existing_active = await curriculum_repository.get_active_plan(user_id)
        if existing_active and existing_active.id != plan.id:
            await curriculum_repository.update_plan_status(
                existing_active.id,
                LearningPlanStatus.PAUSED
            )
        
        # Activate the plan
        plan.activate()
        await curriculum_repository.update_plan_status(plan.id, LearningPlanStatus.ACTIVE)
        
        logger.info(f"Activated curriculum {plan.id} for user {user_id}")
        
        return SuccessResponse(
            success=True,
            message="Curriculum activated successfully. Start learning!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating curriculum for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate curriculum: {str(e)}"
        )


@router.post(
    "/pause",
    response_model=SuccessResponse,
    summary="Pause curriculum",
    description="Pause the active curriculum.",
)
async def pause_curriculum(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SuccessResponse:
    """
    Pause the user's active curriculum.
    """
    try:
        logger.info(f"Pausing curriculum for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active curriculum to pause"
            )
        
        # Pause the plan
        plan.pause()
        await curriculum_repository.update_plan_status(plan.id, LearningPlanStatus.PAUSED)
        
        logger.info(f"Paused curriculum {plan.id} for user {user_id}")
        
        return SuccessResponse(
            success=True,
            message="Curriculum paused. Resume anytime to continue learning."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing curriculum for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause curriculum: {str(e)}"
        )


@router.get(
    "/{plan_id}",
    response_model=CurriculumResponse,
    summary="Get curriculum by ID",
    description="Retrieve a specific curriculum by its ID.",
)
async def get_curriculum_by_id(
    plan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> CurriculumResponse:
    """
    Get a specific curriculum by ID.
    """
    try:
        logger.info(f"Getting curriculum {plan_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        plan = await curriculum_repository.get_plan(plan_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum not found"
            )
        
        if plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this curriculum"
            )
        
        return _plan_to_response(plan)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting curriculum {plan_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get curriculum: {str(e)}"
        )


@router.delete(
    "/{plan_id}",
    response_model=SuccessResponse,
    summary="Delete curriculum",
    description="Delete a curriculum and all associated data.",
)
async def delete_curriculum(
    plan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SuccessResponse:
    """
    Delete a curriculum.
    """
    try:
        logger.info(f"Deleting curriculum {plan_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        plan = await curriculum_repository.get_plan(plan_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum not found"
            )
        
        if plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this curriculum"
            )
        
        deleted = await curriculum_repository.delete_plan(plan_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete curriculum"
            )
        
        logger.info(f"Deleted curriculum {plan_id} for user {user_id}")
        
        return SuccessResponse(
            success=True,
            message="Curriculum deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting curriculum {plan_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete curriculum: {str(e)}"
        )


def _plan_to_response(plan) -> CurriculumResponse:
    """Convert a LearningPlan domain entity to API response model."""
    modules = []
    total_tasks = 0
    completed_tasks = 0
    
    for module in plan.modules:
        tasks = []
        for task in module.tasks:
            tasks.append(TaskResponse(
                id=task.id,
                module_id=task.module_id,
                day_offset=task.day_offset,
                task_type=task.task_type.value,
                description=task.description,
                estimated_minutes=task.estimated_minutes,
                completion_criteria=task.completion_criteria,
                resources=task.resources,
                hints=getattr(task, 'hints', []) or [],
                is_completed=False  # Would come from progress tracking
            ))
            total_tasks += 1
        
        module_completed = 0  # Would come from progress tracking
        modules.append(ModuleResponse(
            id=module.id,
            plan_id=module.plan_id,
            title=module.title,
            summary=module.summary,
            order_index=module.order_index,
            learning_objectives=getattr(module, 'learning_objectives', []) or [],
            estimated_minutes=module.get_total_estimated_time(),
            tasks=tasks,
            tasks_completed=module_completed,
            total_tasks=len(tasks),
            progress_percentage=(module_completed / len(tasks) * 100) if tasks else 0
        ))
    
    overall_progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return CurriculumResponse(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        goal_description=plan.goal_description,
        status=plan.status.value,
        total_days=plan.total_days,
        estimated_hours=plan.get_total_estimated_time() // 60 if hasattr(plan, 'get_total_estimated_time') else None,
        modules=modules,
        modules_completed=sum(1 for m in modules if m.progress_percentage == 100),
        total_modules=len(modules),
        overall_progress=overall_progress,
        current_module_index=0,  # Would be calculated from progress
        created_at=plan.created_at,
        updated_at=getattr(plan, 'updated_at', None)
    )


def _get_recommendations(plan, progress: float) -> List[str]:
    """Generate recommendations based on plan and progress."""
    recommendations = []
    
    if progress == 0:
        recommendations.append("Start with the first module to begin your learning journey!")
    elif progress < 25:
        recommendations.append("Great start! Keep up the momentum.")
    elif progress < 50:
        recommendations.append("You're making good progress. Stay consistent!")
    elif progress < 75:
        recommendations.append("More than halfway there! Keep pushing forward.")
    else:
        recommendations.append("Almost done! Finish strong!")
    
    if plan.modules:
        recommendations.append(f"Focus on: {plan.modules[0].title}")
    
    return recommendations
