"""
API router for goal setting endpoints.

Handles learning goal management including setting, updating, and retrieving goals.
"""

import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.api.models.goals import (
    SetGoalsRequest,
    SetGoalsResponse,
    UpdateGoalsRequest,
    TimeConstraints,
)
from src.adapters.api.models.common import ErrorResponse, SuccessResponse
from src.adapters.api.dependencies import get_current_user_id, get_db_session
from src.adapters.database.repositories.postgres_user_repository import PostgresUserRepository
from src.domain.value_objects.enums import SkillLevel


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/goals",
    tags=["goals"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


@router.post(
    "",
    response_model=SetGoalsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Set learning goals",
    description="""
    Set learning goals and time constraints for a user.
    
    This endpoint allows users to define their learning objectives and availability.
    The system will use this information to create a personalized curriculum.
    
    **Required fields:**
    - `goals`: List of 1-10 learning goals
    - `time_constraints`: Available time for learning
    
    **Optional fields:**
    - `skill_level`: Current skill level (beginner, intermediate, advanced, expert)
    - `preferences`: Additional learning preferences
    """,
    responses={
        201: {
            "description": "Goals set successfully",
            "model": SetGoalsResponse,
        },
    },
)
async def set_goals(
    request: SetGoalsRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SetGoalsResponse:
    """
    Set learning goals for the current user.
    
    Creates or updates the user's learning profile with goals and constraints.
    If no profile exists, one will be automatically created during onboarding.
    """
    try:
        logger.info(f"Setting goals for user {user_id}: {len(request.goals)} goals")
        
        user_repository = PostgresUserRepository(db)
        
        # Get or create user profile
        profile = await user_repository.get_user_profile(user_id)
        
        if not profile:
            # Auto-create a new user profile during onboarding
            logger.info(f"Creating new profile for user {user_id} during onboarding")
            try:
                # Generate a placeholder email for demo/onboarding users
                demo_email = f"{user_id}@onboarding.local"
                demo_name = f"Learner {user_id[:8]}"
                
                profile = await user_repository.create_user(
                    email=demo_email,
                    name=demo_name,
                    user_id=user_id  # Use the ID from the frontend
                )
                logger.info(f"Created new profile for user {user_id}")
            except ValueError as ve:
                logger.error(f"Invalid user_id format for user {user_id}: {ve}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid user ID format. Please refresh and try again."
                )
            except Exception as create_error:
                logger.error(f"Failed to create profile for user {user_id}: {create_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile. Please try again."
                )
        
        # Update profile with goals
        profile.learning_goals = request.goals
        profile.update_time_constraints({
            "hours_per_week": request.time_constraints.hours_per_week,
            "preferred_times": request.time_constraints.preferred_times,
            "available_days": request.time_constraints.available_days,
            "session_length_minutes": request.time_constraints.session_length_minutes,
        })
        
        if request.skill_level:
            profile.update_skill_level(SkillLevel(request.skill_level))
        
        if request.preferences:
            profile.update_preferences(request.preferences)
        
        # Save updated profile
        await user_repository.update_user_profile(profile)
        
        # Categorize goals (simplified implementation)
        goal_categories = _categorize_goals(request.goals)
        
        # Estimate timeline
        estimated_timeline = _estimate_timeline(
            request.goals,
            request.time_constraints.hours_per_week,
            profile.skill_level
        )
        
        logger.info(f"Goals set successfully for user {user_id}")
        
        return SetGoalsResponse(
            success=True,
            user_id=user_id,
            goals=request.goals,
            goal_categories=goal_categories,
            time_constraints=request.time_constraints,
            estimated_timeline=estimated_timeline,
            next_steps=[
                "Create your personalized curriculum",
                "Start your first learning module",
                "Track your progress daily"
            ],
            created_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting goals for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set goals: {str(e)}"
        )


@router.get(
    "",
    response_model=SetGoalsResponse,
    summary="Get current goals",
    description="Retrieve the current learning goals and constraints for the user.",
)
async def get_goals(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SetGoalsResponse:
    """
    Get the current learning goals for the user.
    """
    try:
        logger.info(f"Getting goals for user {user_id}")
        
        user_repository = PostgresUserRepository(db)
        profile = await user_repository.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Convert time constraints to response model
        time_constraints = TimeConstraints(
            hours_per_week=profile.time_constraints.get("hours_per_week", 5),
            preferred_times=profile.time_constraints.get("preferred_times", []),
            available_days=profile.time_constraints.get("available_days", []),
            session_length_minutes=profile.time_constraints.get("session_length_minutes", 60),
        )
        
        goal_categories = _categorize_goals(profile.learning_goals)
        estimated_timeline = _estimate_timeline(
            profile.learning_goals,
            time_constraints.hours_per_week,
            profile.skill_level
        )
        
        return SetGoalsResponse(
            success=True,
            user_id=user_id,
            goals=profile.learning_goals,
            goal_categories=goal_categories,
            time_constraints=time_constraints,
            estimated_timeline=estimated_timeline,
            next_steps=_get_next_steps(profile),
            created_at=profile.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting goals for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get goals: {str(e)}"
        )


@router.patch(
    "",
    response_model=SetGoalsResponse,
    summary="Update goals",
    description="Update learning goals or time constraints.",
)
async def update_goals(
    request: UpdateGoalsRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SetGoalsResponse:
    """
    Update the user's learning goals or constraints.
    
    Only provided fields will be updated.
    """
    try:
        logger.info(f"Updating goals for user {user_id}")
        
        user_repository = PostgresUserRepository(db)
        profile = await user_repository.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Update goals if provided
        if request.goals is not None:
            profile.learning_goals = request.goals
        
        # Update time constraints if provided
        if request.time_constraints is not None:
            profile.update_time_constraints({
                "hours_per_week": request.time_constraints.hours_per_week,
                "preferred_times": request.time_constraints.preferred_times,
                "available_days": request.time_constraints.available_days,
                "session_length_minutes": request.time_constraints.session_length_minutes,
            })
        
        # Update preferences if provided
        if request.preferences is not None:
            profile.update_preferences(request.preferences)
        
        # Save updated profile
        await user_repository.update_user_profile(profile)
        
        # Build response
        time_constraints = TimeConstraints(
            hours_per_week=profile.time_constraints.get("hours_per_week", 5),
            preferred_times=profile.time_constraints.get("preferred_times", []),
            available_days=profile.time_constraints.get("available_days", []),
            session_length_minutes=profile.time_constraints.get("session_length_minutes", 60),
        )
        
        goal_categories = _categorize_goals(profile.learning_goals)
        estimated_timeline = _estimate_timeline(
            profile.learning_goals,
            time_constraints.hours_per_week,
            profile.skill_level
        )
        
        logger.info(f"Goals updated successfully for user {user_id}")
        
        return SetGoalsResponse(
            success=True,
            user_id=user_id,
            goals=profile.learning_goals,
            goal_categories=goal_categories,
            time_constraints=time_constraints,
            estimated_timeline=estimated_timeline,
            next_steps=_get_next_steps(profile),
            created_at=profile.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating goals for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update goals: {str(e)}"
        )


@router.delete(
    "",
    response_model=SuccessResponse,
    summary="Clear goals",
    description="Clear all learning goals for the user.",
)
async def clear_goals(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SuccessResponse:
    """
    Clear all learning goals for the user.
    """
    try:
        logger.info(f"Clearing goals for user {user_id}")
        
        user_repository = PostgresUserRepository(db)
        profile = await user_repository.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Clear goals
        profile.learning_goals = []
        await user_repository.update_user_profile(profile)
        
        logger.info(f"Goals cleared for user {user_id}")
        
        return SuccessResponse(
            success=True,
            message="Learning goals cleared successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing goals for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear goals: {str(e)}"
        )


def _categorize_goals(goals: list[str]) -> dict[str, list[str]]:
    """Categorize goals into learning domains."""
    categories = {
        "frontend": [],
        "backend": [],
        "data_science": [],
        "mobile": [],
        "devops": [],
        "other": [],
    }
    
    category_keywords = {
        "frontend": ["html", "css", "javascript", "react", "vue", "angular", "frontend", "ui", "ux"],
        "backend": ["python", "java", "node", "express", "django", "flask", "api", "backend", "server"],
        "data_science": ["data", "pandas", "numpy", "machine learning", "ml", "ai", "statistics"],
        "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile"],
        "devops": ["docker", "kubernetes", "ci/cd", "aws", "azure", "cloud", "devops"],
    }
    
    for goal in goals:
        goal_lower = goal.lower()
        categorized = False
        
        for category, keywords in category_keywords.items():
            if any(keyword in goal_lower for keyword in keywords):
                categories[category].append(goal)
                categorized = True
                break
        
        if not categorized:
            categories["other"].append(goal)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}


def _estimate_timeline(goals: list[str], hours_per_week: int, skill_level: SkillLevel) -> dict:
    """Estimate timeline for achieving goals."""
    # Base hours per goal by skill level
    base_hours = {
        SkillLevel.BEGINNER: 40,
        SkillLevel.INTERMEDIATE: 25,
        SkillLevel.ADVANCED: 15,
        SkillLevel.EXPERT: 10,
    }
    
    hours_per_goal = base_hours.get(skill_level, 30)
    total_hours = len(goals) * hours_per_goal
    
    weeks_needed = total_hours / hours_per_week if hours_per_week > 0 else 0
    
    return {
        "total_estimated_hours": total_hours,
        "hours_per_goal": hours_per_goal,
        "estimated_weeks": round(weeks_needed, 1),
        "estimated_days": round(weeks_needed * 7, 0),
    }


def _get_next_steps(profile) -> list[str]:
    """Get recommended next steps based on profile state."""
    steps = []
    
    if not profile.learning_goals:
        steps.append("Set your learning goals")
    else:
        steps.append("Create your personalized curriculum")
    
    if not profile.time_constraints.get("hours_per_week"):
        steps.append("Define your time availability")
    
    steps.append("Start your first learning module")
    steps.append("Track your progress daily")
    
    return steps
