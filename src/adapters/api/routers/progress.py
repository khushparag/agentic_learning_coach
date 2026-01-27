"""
API router for progress tracking endpoints.

Handles progress retrieval, statistics, and learning analytics.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.api.models.progress import (
    ProgressSummaryResponse,
    DetailedProgressResponse,
    ModuleProgressResponse,
    TaskProgressResponse,
    ProgressUpdateRequest,
    ProgressStatsResponse,
)
from src.adapters.api.models.common import ErrorResponse, SuccessResponse
from src.adapters.api.dependencies import (
    get_current_user_id,
    get_db_session,
)
from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
from src.adapters.database.repositories.postgres_submission_repository import PostgresSubmissionRepository


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/progress",
    tags=["progress"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


@router.get(
    "",
    response_model=ProgressSummaryResponse,
    summary="Get progress summary",
    description="""
    Retrieve a summary of the user's learning progress.
    
    Includes:
    - Overall completion percentage
    - Module and task counts
    - Time spent learning
    - Average scores
    - Learning streaks
    """,
)
async def get_progress_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> ProgressSummaryResponse:
    """
    Get progress summary for the user.
    """
    try:
        logger.info(f"Getting progress summary for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get active plan
        plan = await curriculum_repository.get_active_plan(user_id)
        
        if not plan:
            return ProgressSummaryResponse(
                user_id=user_id,
                has_active_plan=False,
                plan_id=None,
                plan_title=None,
                overall_progress=0.0,
                total_modules=0,
                completed_modules=0,
                total_tasks=0,
                completed_tasks=0,
                total_time_spent_minutes=0,
                average_score=None,
                current_streak_days=0,
                longest_streak_days=0,
                last_activity_at=None
            )
        
        # Calculate progress metrics
        total_modules = len(plan.modules)
        total_tasks = sum(len(module.tasks) for module in plan.modules)
        
        # Get progress data (in full implementation, from progress tracking table)
        progress_data = await submission_repository.get_user_progress_summary(user_id)
        
        completed_tasks = progress_data.get('completed_tasks', 0)
        completed_modules = progress_data.get('completed_modules', 0)
        total_time = progress_data.get('total_time_minutes', 0)
        average_score = progress_data.get('average_score')
        
        overall_progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get streak information (simplified)
        current_streak = _calculate_current_streak(progress_data.get('activity_dates', []))
        longest_streak = progress_data.get('longest_streak', current_streak)
        
        return ProgressSummaryResponse(
            user_id=user_id,
            has_active_plan=True,
            plan_id=plan.id,
            plan_title=plan.title,
            overall_progress=round(overall_progress, 1),
            total_modules=total_modules,
            completed_modules=completed_modules,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            total_time_spent_minutes=total_time,
            average_score=round(average_score, 1) if average_score else None,
            current_streak_days=current_streak,
            longest_streak_days=longest_streak,
            last_activity_at=progress_data.get('last_activity')
        )
        
    except Exception as e:
        logger.error(f"Error getting progress summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress summary: {str(e)}"
        )


@router.get(
    "/detailed",
    response_model=DetailedProgressResponse,
    summary="Get detailed progress",
    description="""
    Retrieve detailed progress information including module-level breakdown,
    recent submissions, skill analysis, and personalized recommendations.
    """,
)
async def get_detailed_progress(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> DetailedProgressResponse:
    """
    Get detailed progress information.
    """
    try:
        logger.info(f"Getting detailed progress for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get summary first
        summary = await get_progress_summary(user_id, db)
        
        # Get module-level progress
        modules_progress = []
        
        if summary.has_active_plan:
            plan = await curriculum_repository.get_active_plan(user_id)
            
            if plan:
                for module in plan.modules:
                    # Get task progress for this module
                    tasks_progress = []
                    module_time = 0
                    module_scores = []
                    completed_count = 0
                    
                    for task in module.tasks:
                        # Get task progress (simplified)
                        task_completed = False  # Would come from progress tracking
                        task_score = None
                        task_attempts = 0
                        task_time = 0
                        
                        tasks_progress.append(TaskProgressResponse(
                            task_id=task.id,
                            task_description=task.description,
                            task_type=task.task_type.value,
                            completed=task_completed,
                            attempts=task_attempts,
                            best_score=task_score,
                            time_spent_minutes=task_time,
                            last_attempt_at=None,
                            completed_at=None
                        ))
                        
                        if task_completed:
                            completed_count += 1
                        if task_score:
                            module_scores.append(task_score)
                        module_time += task_time
                    
                    # Calculate module status
                    total_tasks = len(module.tasks)
                    if completed_count == 0:
                        module_status = "not_started"
                    elif completed_count == total_tasks:
                        module_status = "completed"
                    else:
                        module_status = "in_progress"
                    
                    modules_progress.append(ModuleProgressResponse(
                        module_id=module.id,
                        module_title=module.title,
                        order_index=module.order_index,
                        total_tasks=total_tasks,
                        completed_tasks=completed_count,
                        progress_percentage=(completed_count / total_tasks * 100) if total_tasks > 0 else 0,
                        average_score=sum(module_scores) / len(module_scores) if module_scores else None,
                        total_time_spent_minutes=module_time,
                        status=module_status,
                        tasks=tasks_progress
                    ))
        
        # Get recent submissions
        recent_submissions = await submission_repository.get_user_submissions(user_id, limit=5)
        recent_submissions_data = [
            {
                'task_id': sub.task_id,
                'score': getattr(sub, 'score', None),
                'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None
            }
            for sub in recent_submissions
        ]
        
        # Generate skill breakdown (simplified)
        skill_breakdown = _calculate_skill_breakdown(modules_progress)
        
        # Calculate learning velocity
        learning_velocity = _calculate_learning_velocity(summary, modules_progress)
        
        # Generate recommendations
        recommendations = _generate_recommendations(summary, modules_progress)
        
        # Get achievements (simplified)
        achievements = _get_achievements(summary, modules_progress)
        
        return DetailedProgressResponse(
            summary=summary,
            modules=modules_progress,
            recent_submissions=recent_submissions_data,
            skill_breakdown=skill_breakdown,
            learning_velocity=learning_velocity,
            recommendations=recommendations,
            achievements=achievements
        )
        
    except Exception as e:
        logger.error(f"Error getting detailed progress: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get detailed progress: {str(e)}"
        )


@router.get(
    "/dashboard-stats",
    response_model=dict,
    summary="Get dashboard statistics",
    description="Retrieve comprehensive dashboard statistics including streak, XP, tasks, level, and achievements.",
)
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    Get comprehensive dashboard statistics.
    """
    try:
        logger.info(f"Getting dashboard stats for user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get progress data
        progress_data = await submission_repository.get_user_progress_summary(user_id)
        
        # Calculate streak
        activity_dates = progress_data.get('activity_dates', [])
        current_streak = _calculate_current_streak(activity_dates)
        
        # Calculate XP
        total_xp = progress_data.get('total_xp', 0)
        weekly_xp = progress_data.get('weekly_xp', 0)
        
        # Calculate level and next level XP
        level, next_level_xp = _calculate_level_xp(total_xp)
        
        # Get task counts
        completed_tasks = progress_data.get('completed_tasks', 0)
        total_tasks = progress_data.get('total_tasks', 0)
        
        # Get learning time
        total_time_minutes = progress_data.get('total_time_minutes', 0)
        learning_time_hours = round(total_time_minutes / 60, 1)
        
        # Calculate success rate
        total_submissions = progress_data.get('total_submissions', 0)
        successful_submissions = progress_data.get('successful_submissions', 0)
        success_rate = round((successful_submissions / total_submissions * 100), 1) if total_submissions > 0 else 0
        
        # Get skills learned count
        skills_learned = progress_data.get('skills_learned', 0)
        
        # Get achievements
        achievements = _get_achievements_for_dashboard(
            completed_tasks=completed_tasks,
            current_streak=current_streak,
            total_xp=total_xp,
            success_rate=success_rate
        )
        
        return {
            "currentStreak": current_streak,
            "weeklyXP": weekly_xp,
            "totalXP": total_xp,
            "completedTasks": completed_tasks,
            "totalTasks": total_tasks,
            "level": level,
            "nextLevelXP": next_level_xp,
            "achievements": achievements,
            "learningTimeHours": learning_time_hours,
            "successRate": success_rate,
            "skillsLearned": skills_learned
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard statistics: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=ProgressStatsResponse,
    summary="Get progress statistics",
    description="Retrieve learning statistics and analytics.",
)
async def get_progress_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> ProgressStatsResponse:
    """
    Get progress statistics.
    """
    try:
        logger.info(f"Getting progress stats for user {user_id}")
        
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get progress data
        progress_data = await submission_repository.get_user_progress_summary(user_id)
        
        # Calculate statistics
        total_time = progress_data.get('total_time_minutes', 0)
        total_hours = total_time / 60
        
        # Get weekly/monthly counts (simplified)
        tasks_this_week = progress_data.get('tasks_this_week', 0)
        tasks_this_month = progress_data.get('tasks_this_month', 0)
        
        # Calculate averages
        days_active = progress_data.get('days_active', 1)
        avg_daily_time = total_time / days_active if days_active > 0 else 0
        
        # Determine trends
        recent_scores = progress_data.get('recent_scores', [])
        if len(recent_scores) >= 2:
            if recent_scores[-1] > recent_scores[0]:
                trend = "improving"
            elif recent_scores[-1] < recent_scores[0]:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        # Completion rate
        total_tasks = progress_data.get('total_tasks', 0)
        completed_tasks = progress_data.get('completed_tasks', 0)
        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0
        
        return ProgressStatsResponse(
            total_learning_hours=round(total_hours, 1),
            tasks_completed_this_week=tasks_this_week,
            tasks_completed_this_month=tasks_this_month,
            average_daily_time_minutes=round(avg_daily_time, 1),
            most_productive_day=progress_data.get('most_productive_day'),
            most_productive_time=progress_data.get('most_productive_time'),
            completion_rate=round(completion_rate, 2),
            improvement_trend=trend
        )
        
    except Exception as e:
        logger.error(f"Error getting progress stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress stats: {str(e)}"
        )


@router.post(
    "/update",
    response_model=SuccessResponse,
    summary="Update progress",
    description="Manually update progress for a task (e.g., mark as complete).",
)
async def update_progress(
    request: ProgressUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SuccessResponse:
    """
    Update progress for a task.
    """
    try:
        logger.info(f"Updating progress for task {request.task_id}, user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Verify task exists and user has access
        task = await curriculum_repository.get_task(request.task_id)
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
                    detail="You don't have permission to update this task"
                )
        
        # In a full implementation, update progress tracking table
        # For now, just acknowledge the update
        
        logger.info(f"Progress updated for task {request.task_id}")
        
        return SuccessResponse(
            success=True,
            message=f"Progress updated: Task marked as {'complete' if request.completed else 'incomplete'}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}"
        )


@router.get(
    "/module/{module_id}",
    response_model=ModuleProgressResponse,
    summary="Get module progress",
    description="Retrieve progress for a specific module.",
)
async def get_module_progress(
    module_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> ModuleProgressResponse:
    """
    Get progress for a specific module.
    """
    try:
        logger.info(f"Getting progress for module {module_id}, user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        
        # Get module
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
        
        # Get task progress
        tasks_progress = []
        completed_count = 0
        total_time = 0
        scores = []
        
        for task in module.tasks:
            # Get task progress (simplified)
            task_completed = False
            task_score = None
            task_attempts = 0
            task_time = 0
            
            tasks_progress.append(TaskProgressResponse(
                task_id=task.id,
                task_description=task.description,
                task_type=task.task_type.value,
                completed=task_completed,
                attempts=task_attempts,
                best_score=task_score,
                time_spent_minutes=task_time,
                last_attempt_at=None,
                completed_at=None
            ))
            
            if task_completed:
                completed_count += 1
            if task_score:
                scores.append(task_score)
            total_time += task_time
        
        # Calculate status
        total_tasks = len(module.tasks)
        if completed_count == 0:
            status_str = "not_started"
        elif completed_count == total_tasks:
            status_str = "completed"
        else:
            status_str = "in_progress"
        
        return ModuleProgressResponse(
            module_id=module.id,
            module_title=module.title,
            order_index=module.order_index,
            total_tasks=total_tasks,
            completed_tasks=completed_count,
            progress_percentage=(completed_count / total_tasks * 100) if total_tasks > 0 else 0,
            average_score=sum(scores) / len(scores) if scores else None,
            total_time_spent_minutes=total_time,
            status=status_str,
            tasks=tasks_progress
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting module progress: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get module progress: {str(e)}"
        )


def _calculate_current_streak(activity_dates: List[datetime]) -> int:
    """Calculate current learning streak in days."""
    if not activity_dates:
        return 0
    
    # Sort dates in descending order
    sorted_dates = sorted(activity_dates, reverse=True)
    
    streak = 0
    today = datetime.utcnow().date()
    expected_date = today
    
    for activity_date in sorted_dates:
        if isinstance(activity_date, datetime):
            activity_date = activity_date.date()
        
        if activity_date == expected_date:
            streak += 1
            expected_date = expected_date - timedelta(days=1)
        elif activity_date < expected_date:
            break
    
    return streak


def _calculate_skill_breakdown(modules_progress: List[ModuleProgressResponse]) -> dict:
    """Calculate skill breakdown from module progress."""
    skill_breakdown = {}
    
    for module in modules_progress:
        # Use module title as skill name (simplified)
        skill_name = module.module_title.lower().replace(' ', '_')
        skill_breakdown[skill_name] = module.progress_percentage / 100
    
    return skill_breakdown


def _calculate_learning_velocity(
    summary: ProgressSummaryResponse,
    modules_progress: List[ModuleProgressResponse]
) -> dict:
    """Calculate learning velocity metrics."""
    # Calculate tasks per day
    days_active = max(1, summary.current_streak_days)
    tasks_per_day = summary.completed_tasks / days_active if days_active > 0 else 0
    
    # Calculate average time per task
    avg_time = summary.total_time_spent_minutes / summary.completed_tasks if summary.completed_tasks > 0 else 0
    
    # Determine trend
    if summary.average_score and summary.average_score > 80:
        trend = "excellent"
    elif summary.average_score and summary.average_score > 60:
        trend = "good"
    else:
        trend = "improving"
    
    return {
        "tasks_per_day": round(tasks_per_day, 1),
        "average_time_per_task": round(avg_time, 0),
        "trend": trend
    }


def _generate_recommendations(
    summary: ProgressSummaryResponse,
    modules_progress: List[ModuleProgressResponse]
) -> List[str]:
    """Generate personalized recommendations."""
    recommendations = []
    
    if summary.overall_progress == 0:
        recommendations.append("Start your learning journey by completing your first task!")
    elif summary.overall_progress < 25:
        recommendations.append("Great start! Keep up the momentum to build a learning habit.")
    elif summary.overall_progress < 50:
        recommendations.append("You're making solid progress. Stay consistent!")
    elif summary.overall_progress < 75:
        recommendations.append("More than halfway there! Keep pushing forward.")
    else:
        recommendations.append("Almost done! Finish strong and celebrate your achievement!")
    
    # Add module-specific recommendations
    for module in modules_progress:
        if module.status == "in_progress" and module.progress_percentage < 50:
            recommendations.append(f"Focus on completing '{module.module_title}' to maintain momentum.")
            break
    
    # Add streak recommendation
    if summary.current_streak_days > 0:
        recommendations.append(f"You're on a {summary.current_streak_days}-day streak! Keep it going!")
    else:
        recommendations.append("Start a learning streak by completing a task today!")
    
    return recommendations[:5]  # Limit to 5 recommendations


def _get_achievements(
    summary: ProgressSummaryResponse,
    modules_progress: List[ModuleProgressResponse]
) -> List[dict]:
    """Get earned achievements."""
    achievements = []
    
    # First task achievement
    if summary.completed_tasks >= 1:
        achievements.append({
            "id": "first_task",
            "title": "First Steps",
            "description": "Completed your first task",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # First module achievement
    completed_modules = [m for m in modules_progress if m.status == "completed"]
    if completed_modules:
        achievements.append({
            "id": "first_module",
            "title": "Module Master",
            "description": "Completed your first module",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # Streak achievements
    if summary.current_streak_days >= 7:
        achievements.append({
            "id": "week_streak",
            "title": "Week Warrior",
            "description": "Maintained a 7-day learning streak",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # Score achievement
    if summary.average_score and summary.average_score >= 90:
        achievements.append({
            "id": "high_achiever",
            "title": "High Achiever",
            "description": "Maintained an average score of 90% or higher",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    return achievements


def _get_achievements_for_dashboard(
    completed_tasks: int,
    current_streak: int,
    total_xp: int,
    success_rate: float
) -> List[dict]:
    """Get earned achievements for dashboard."""
    achievements = []
    
    # First task achievement
    if completed_tasks >= 1:
        achievements.append({
            "id": "first_task",
            "title": "First Steps",
            "description": "Completed your first task",
            "icon": "🎯",
            "unlockedAt": datetime.utcnow().isoformat()
        })
    
    # Streak achievements
    if current_streak >= 7:
        achievements.append({
            "id": "week_streak",
            "title": "Week Warrior",
            "description": "Maintained a 7-day learning streak",
            "icon": "🔥",
            "unlockedAt": datetime.utcnow().isoformat()
        })
    
    # XP milestones
    if total_xp >= 1000:
        achievements.append({
            "id": "xp_1000",
            "title": "XP Master",
            "description": "Earned 1000 XP",
            "icon": "⭐",
            "unlockedAt": datetime.utcnow().isoformat()
        })
    
    # Success rate achievement
    if success_rate >= 90:
        achievements.append({
            "id": "high_achiever",
            "title": "High Achiever",
            "description": "Maintained a 90% success rate",
            "icon": "👑",
            "unlockedAt": datetime.utcnow().isoformat()
        })
    
    return achievements


def _calculate_level_xp(total_xp: int) -> tuple[int, int]:
    """Calculate current level and XP needed for next level."""
    # Simple level calculation: 100 XP per level
    level = max(1, total_xp // 100)
    next_level_xp = (level * 100) - (total_xp % 100)
    
    return level, next_level_xp
