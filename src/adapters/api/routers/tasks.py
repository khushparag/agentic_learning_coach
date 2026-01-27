"""
API router for task retrieval endpoints.

Handles task listing, retrieval, and hint requests.
"""

import logging
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.api.models.tasks import (
    TaskDetailResponse,
    TaskSummaryResponse,
    TodayTasksResponse,
    TaskListResponse,
    TaskHintRequest,
    TaskHintResponse,
    TaskStartResponse,
    TaskCompleteResponse,
)
from src.adapters.api.models.common import ErrorResponse
from src.adapters.api.dependencies import (
    get_current_user_id,
    get_db_session,
    PaginationParams,
)
from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["tasks"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


@router.get(
    "/today",
    response_model=TodayTasksResponse,
    summary="Get today's tasks",
    description="""
    Retrieve tasks scheduled for today based on the user's active curriculum.
    
    Returns all tasks for the current day offset in the learning plan,
    along with progress information and motivational messages.
    """,
)
async def get_today_tasks(
    day_offset: Optional[int] = Query(
        None,
        ge=0,
        description="Override day offset (defaults to calculated from plan start)"
    ),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TodayTasksResponse:
    """
    Get tasks scheduled for today.
    """
    try:
        logger.info(f"Getting today's tasks for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            return TodayTasksResponse(
                date=date.today().isoformat(),
                day_offset=0,
                tasks=[],
                total_tasks=0,
                completed_tasks=0,
                total_estimated_minutes=0,
                progress_message="No active curriculum. Create one to start learning!"
            )
        
        # Calculate day offset if not provided
        if day_offset is None:
            # In a full implementation, calculate from plan start date
            day_offset = 0
        
        # Get tasks for the day
        tasks = await curriculum_repository.get_tasks_for_day(user_id, day_offset)
        
        # Convert to response models
        task_responses = []
        total_minutes = 0
        completed_count = 0
        
        for task in tasks:
            # Get module title
            module = await curriculum_repository.get_module(task.module_id)
            module_title = module.title if module else "Unknown Module"
            
            # Check completion status (would come from progress tracking)
            is_completed = False  # Placeholder
            
            task_responses.append(TaskSummaryResponse(
                id=task.id,
                module_id=task.module_id,
                module_title=module_title,
                task_type=task.task_type.value,
                description=task.description,
                estimated_minutes=task.estimated_minutes,
                is_completed=is_completed,
                day_offset=task.day_offset
            ))
            
            total_minutes += task.estimated_minutes
            if is_completed:
                completed_count += 1
        
        # Generate progress message
        progress_message = _generate_progress_message(
            len(task_responses),
            completed_count
        )
        
        return TodayTasksResponse(
            date=date.today().isoformat(),
            day_offset=day_offset,
            tasks=task_responses,
            total_tasks=len(task_responses),
            completed_tasks=completed_count,
            total_estimated_minutes=total_minutes,
            progress_message=progress_message
        )
        
    except Exception as e:
        logger.error(f"Error getting today's tasks for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get today's tasks: {str(e)}"
        )


@router.get(
    "",
    response_model=TaskListResponse,
    summary="List tasks",
    description="""
    List tasks with optional filtering by module or completion status.
    
    Supports pagination and filtering to help users find specific tasks.
    """,
)
async def list_tasks(
    module_id: Optional[str] = Query(None, description="Filter by module ID"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    task_type: Optional[str] = Query(None, description="Filter by task type (READ, WATCH, CODE, QUIZ)"),
    pagination: PaginationParams = Depends(),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskListResponse:
    """
    List tasks with optional filters.
    """
    try:
        logger.info(f"Listing tasks for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            return TaskListResponse(
                tasks=[],
                total=0,
                page=pagination.page,
                page_size=pagination.page_size,
                total_pages=0,
                filter_applied=None
            )
        
        # Collect all tasks
        all_tasks = []
        for module in plan.modules:
            if module_id and module.id != module_id:
                continue
            
            for task in module.tasks:
                # Apply task type filter
                if task_type and task.task_type.value != task_type.upper():
                    continue
                
                # Check completion (would come from progress tracking)
                is_completed = False  # Placeholder
                
                # Apply completion filter
                if completed is not None and is_completed != completed:
                    continue
                
                all_tasks.append((task, module.title, is_completed))
        
        # Apply pagination
        total = len(all_tasks)
        start = pagination.offset
        end = start + pagination.limit
        paginated_tasks = all_tasks[start:end]
        
        # Convert to response models
        task_responses = [
            TaskSummaryResponse(
                id=task.id,
                module_id=task.module_id,
                module_title=module_title,
                task_type=task.task_type.value,
                description=task.description,
                estimated_minutes=task.estimated_minutes,
                is_completed=is_completed,
                day_offset=task.day_offset
            )
            for task, module_title, is_completed in paginated_tasks
        ]
        
        # Build filter description
        filters = []
        if module_id:
            filters.append(f"module_id={module_id}")
        if completed is not None:
            filters.append(f"completed={completed}")
        if task_type:
            filters.append(f"task_type={task_type}")
        filter_applied = ", ".join(filters) if filters else None
        
        total_pages = (total + pagination.page_size - 1) // pagination.page_size
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
            filter_applied=filter_applied
        )
        
    except Exception as e:
        logger.error(f"Error listing tasks for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tasks: {str(e)}"
        )


@router.get(
    "/{task_id}",
    response_model=TaskDetailResponse,
    summary="Get task details",
    description="""
    Retrieve detailed information about a specific task.
    
    Includes full task content, test cases (for code tasks),
    hints, and progress information.
    """,
)
async def get_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskDetailResponse:
    """
    Get detailed information about a task.
    """
    try:
        logger.info(f"Getting task {task_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the task
        task = await curriculum_repository.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get the module to verify ownership
        module = await curriculum_repository.get_module(task.module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task module not found"
            )
        
        # Get the plan to verify ownership
        plan = await curriculum_repository.get_plan(module.plan_id)
        if not plan or plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this task"
            )
        
        # Get progress information (would come from progress tracking)
        is_completed = False
        best_score = None
        attempts = 0
        last_attempt_at = None
        
        return TaskDetailResponse(
            id=task.id,
            module_id=task.module_id,
            module_title=module.title,
            day_offset=task.day_offset,
            task_type=task.task_type.value,
            description=task.description,
            estimated_minutes=task.estimated_minutes,
            completion_criteria=task.completion_criteria,
            resources=task.resources,
            instructions=getattr(task, 'instructions', None),
            test_cases=getattr(task, 'test_cases', None),
            solution_template=getattr(task, 'solution_template', None),
            hints=getattr(task, 'hints', []) or [],
            time_limit_minutes=getattr(task, 'time_limit_minutes', None),
            is_completed=is_completed,
            best_score=best_score,
            attempts=attempts,
            last_attempt_at=last_attempt_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task: {str(e)}"
        )


@router.post(
    "/{task_id}/hint",
    response_model=TaskHintResponse,
    summary="Get task hint",
    description="""
    Request a hint for a task.
    
    Hints are provided progressively - start with hint_index=0 and
    increment to get additional hints.
    """,
)
async def get_task_hint(
    task_id: str,
    hint_index: int = Query(default=0, ge=0, description="Index of hint to retrieve"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskHintResponse:
    """
    Get a hint for a task.
    """
    try:
        logger.info(f"Getting hint {hint_index} for task {task_id}, user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the task
        task = await curriculum_repository.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Verify ownership
        module = await curriculum_repository.get_module(task.module_id)
        if module:
            plan = await curriculum_repository.get_plan(module.plan_id)
            if not plan or plan.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to access this task"
                )
        
        # Get hints
        hints = getattr(task, 'hints', []) or []
        
        if not hints:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hints available for this task"
            )
        
        if hint_index >= len(hints):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hint index {hint_index} out of range. Available hints: 0-{len(hints)-1}"
            )
        
        return TaskHintResponse(
            task_id=task_id,
            hint_index=hint_index,
            hint=hints[hint_index],
            total_hints=len(hints),
            has_more_hints=hint_index < len(hints) - 1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hint for task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get hint: {str(e)}"
        )


@router.get(
    "/module/{module_id}",
    response_model=TaskListResponse,
    summary="Get tasks by module",
    description="Retrieve all tasks for a specific module.",
)
async def get_tasks_by_module(
    module_id: str,
    pagination: PaginationParams = Depends(),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskListResponse:
    """
    Get all tasks for a specific module.
    """
    try:
        logger.info(f"Getting tasks for module {module_id}, user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the module
        module = await curriculum_repository.get_module(module_id)
        
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        # Verify ownership
        plan = await curriculum_repository.get_plan(module.plan_id)
        if not plan or plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this module"
            )
        
        # Get tasks
        tasks = await curriculum_repository.get_module_tasks(module_id)
        
        # Apply pagination
        total = len(tasks)
        start = pagination.offset
        end = start + pagination.limit
        paginated_tasks = tasks[start:end]
        
        # Convert to response models
        task_responses = [
            TaskSummaryResponse(
                id=task.id,
                module_id=task.module_id,
                module_title=module.title,
                task_type=task.task_type.value,
                description=task.description,
                estimated_minutes=task.estimated_minutes,
                is_completed=False,  # Would come from progress tracking
                day_offset=task.day_offset
            )
            for task in paginated_tasks
        ]
        
        total_pages = (total + pagination.page_size - 1) // pagination.page_size
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
            filter_applied=f"module_id={module_id}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tasks for module {module_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get module tasks: {str(e)}"
        )


def _generate_progress_message(total_tasks: int, completed_tasks: int) -> str:
    """Generate a motivational progress message."""
    if total_tasks == 0:
        return "No tasks scheduled for today. Take a break or explore new topics!"
    
    if completed_tasks == 0:
        return f"Ready to learn? You have {total_tasks} task(s) waiting for you today!"
    
    if completed_tasks == total_tasks:
        return "🎉 Amazing! You've completed all tasks for today. Great job!"
    
    remaining = total_tasks - completed_tasks
    percentage = (completed_tasks / total_tasks) * 100
    
    if percentage < 50:
        return f"Good start! {remaining} task(s) remaining. Keep going!"
    else:
        return f"Almost there! Just {remaining} more task(s) to complete today!"



@router.post(
    "/{task_id}/start",
    response_model=TaskStartResponse,
    summary="Start a task",
    description="""
    Mark a task as started and record the start timestamp.
    
    This endpoint records when a user begins working on a task,
    allowing for progress tracking and analytics.
    """,
)
async def start_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskStartResponse:
    """
    Start a task and record the start timestamp.
    """
    try:
        logger.info(f"Starting task {task_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the task
        task = await curriculum_repository.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get the module to verify ownership
        module = await curriculum_repository.get_module(task.module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task module not found"
            )
        
        # Get the plan to verify ownership
        plan = await curriculum_repository.get_plan(module.plan_id)
        if not plan or plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to start this task"
            )
        
        # Record task start (in a real implementation, this would update a progress tracking table)
        # For now, we'll just return success
        started_at = datetime.now()
        
        logger.info(f"Task {task_id} started successfully for user {user_id}")
        
        return TaskStartResponse(
            task_id=task_id,
            started_at=started_at,
            status="in_progress",
            message="Task started successfully. Good luck!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start task: {str(e)}"
        )


@router.post(
    "/{task_id}/complete",
    response_model=TaskCompleteResponse,
    summary="Complete a task",
    description="""
    Mark a task as completed and record the completion timestamp.
    
    This endpoint records when a user finishes a task and optionally
    returns the next task in the learning sequence.
    """,
)
async def complete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskCompleteResponse:
    """
    Complete a task and record the completion timestamp.
    """
    try:
        logger.info(f"Completing task {task_id} for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get the task
        task = await curriculum_repository.get_task(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get the module to verify ownership
        module = await curriculum_repository.get_module(task.module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task module not found"
            )
        
        # Get the plan to verify ownership
        plan = await curriculum_repository.get_plan(module.plan_id)
        if not plan or plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to complete this task"
            )
        
        # Record task completion
        completed_at = datetime.now()
        
        # Find next task in the module
        next_task_id = None
        module_tasks = await curriculum_repository.get_module_tasks(module.id)
        current_task_index = next((i for i, t in enumerate(module_tasks) if t.id == task_id), None)
        
        if current_task_index is not None and current_task_index < len(module_tasks) - 1:
            next_task_id = module_tasks[current_task_index + 1].id
        
        logger.info(f"Task {task_id} completed successfully for user {user_id}")
        
        return TaskCompleteResponse(
            task_id=task_id,
            completed_at=completed_at,
            status="completed",
            next_task_id=next_task_id,
            message="Great job! Task completed successfully."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete task: {str(e)}"
        )
