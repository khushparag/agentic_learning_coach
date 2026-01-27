"""
API models for goal setting endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class TimeConstraints(BaseModel):
    """Time constraints for learning schedule."""
    
    hours_per_week: int = Field(
        ..., 
        ge=1, 
        le=40, 
        description="Available hours per week for learning"
    )
    preferred_times: List[str] = Field(
        default_factory=list,
        description="Preferred learning times (e.g., 'morning', 'evening', 'weekends')"
    )
    available_days: List[str] = Field(
        default_factory=list,
        description="Days available for learning"
    )
    session_length_minutes: int = Field(
        default=60,
        ge=15,
        le=240,
        description="Preferred session length in minutes"
    )
    
    @field_validator("preferred_times")
    @classmethod
    def validate_preferred_times(cls, v: List[str]) -> List[str]:
        """Validate preferred times are valid options."""
        valid_times = {"morning", "afternoon", "evening", "night", "weekends", "weekdays"}
        for time in v:
            if time.lower() not in valid_times:
                raise ValueError(f"Invalid preferred time: {time}. Valid options: {valid_times}")
        return [t.lower() for t in v]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "hours_per_week": 10,
                "preferred_times": ["evening", "weekends"],
                "available_days": ["monday", "wednesday", "saturday", "sunday"],
                "session_length_minutes": 60
            }
        }
    }


class GoalItem(BaseModel):
    """Individual learning goal."""
    
    name: str = Field(..., min_length=2, max_length=100, description="Goal name")
    description: Optional[str] = Field(None, max_length=500, description="Goal description")
    priority: int = Field(default=1, ge=1, le=5, description="Priority level (1=highest)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Learn React",
                "description": "Master React fundamentals including hooks and state management",
                "priority": 1
            }
        }
    }


class SetGoalsRequest(BaseModel):
    """Request model for setting learning goals."""
    
    goals: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of learning goals (1-10 goals)"
    )
    time_constraints: TimeConstraints = Field(
        ...,
        description="Time availability constraints"
    )
    skill_level: Optional[str] = Field(
        None,
        description="Current skill level (beginner, intermediate, advanced, expert)"
    )
    preferences: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional learning preferences"
    )
    
    @field_validator("goals")
    @classmethod
    def validate_goals(cls, v: List[str]) -> List[str]:
        """Validate goals are non-empty strings."""
        validated = []
        for goal in v:
            goal = goal.strip()
            if len(goal) < 2:
                raise ValueError("Each goal must be at least 2 characters long")
            if len(goal) > 200:
                raise ValueError("Each goal must be at most 200 characters long")
            validated.append(goal)
        return validated
    
    @field_validator("skill_level")
    @classmethod
    def validate_skill_level(cls, v: Optional[str]) -> Optional[str]:
        """Validate skill level is a valid option."""
        if v is None:
            return v
        valid_levels = {"beginner", "intermediate", "advanced", "expert"}
        if v.lower() not in valid_levels:
            raise ValueError(f"Invalid skill level: {v}. Valid options: {valid_levels}")
        return v.lower()
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "goals": ["Learn React", "Master TypeScript", "Build a full-stack app"],
                "time_constraints": {
                    "hours_per_week": 10,
                    "preferred_times": ["evening", "weekends"],
                    "available_days": ["monday", "wednesday", "saturday"],
                    "session_length_minutes": 60
                },
                "skill_level": "intermediate",
                "preferences": {
                    "learning_style": "hands-on",
                    "prefer_video": False
                }
            }
        }
    }


class UpdateGoalsRequest(BaseModel):
    """Request model for updating learning goals."""
    
    goals: Optional[List[str]] = Field(
        None,
        min_length=1,
        max_length=10,
        description="Updated list of learning goals"
    )
    time_constraints: Optional[TimeConstraints] = Field(
        None,
        description="Updated time constraints"
    )
    preferences: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated learning preferences"
    )
    
    @field_validator("goals")
    @classmethod
    def validate_goals(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate goals if provided."""
        if v is None:
            return v
        validated = []
        for goal in v:
            goal = goal.strip()
            if len(goal) < 2:
                raise ValueError("Each goal must be at least 2 characters long")
            validated.append(goal)
        return validated


class GoalCategoryResponse(BaseModel):
    """Response model for goal categories."""
    
    category: str = Field(..., description="Category name")
    goals: List[str] = Field(..., description="Goals in this category")


class SetGoalsResponse(BaseModel):
    """Response model for goal setting."""
    
    success: bool = Field(default=True)
    user_id: str = Field(..., description="User ID")
    goals: List[str] = Field(..., description="Confirmed learning goals")
    goal_categories: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Goals organized by category"
    )
    time_constraints: TimeConstraints = Field(..., description="Confirmed time constraints")
    estimated_timeline: Dict[str, Any] = Field(
        default_factory=dict,
        description="Estimated timeline for achieving goals"
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="Recommended next steps"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "user_id": "user_123",
                "goals": ["Learn React", "Master TypeScript"],
                "goal_categories": {
                    "frontend": ["Learn React"],
                    "languages": ["Master TypeScript"]
                },
                "time_constraints": {
                    "hours_per_week": 10,
                    "preferred_times": ["evening"],
                    "available_days": ["monday", "wednesday"],
                    "session_length_minutes": 60
                },
                "estimated_timeline": {
                    "total_estimated_hours": 80,
                    "estimated_weeks_at_10h_per_week": 8
                },
                "next_steps": ["Complete skill assessment", "Start first module"],
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    }
