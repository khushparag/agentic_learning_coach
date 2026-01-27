"""
API models for progress tracking endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskProgressResponse(BaseModel):
    """Response model for task-level progress."""
    
    task_id: str = Field(..., description="Task unique identifier")
    task_description: str = Field(..., description="Task description")
    task_type: str = Field(..., description="Type of task")
    completed: bool = Field(default=False, description="Whether task is completed")
    attempts: int = Field(default=0, description="Number of attempts")
    best_score: Optional[float] = Field(None, description="Best score achieved")
    time_spent_minutes: int = Field(default=0, description="Total time spent")
    last_attempt_at: Optional[datetime] = Field(None, description="Last attempt timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "task_description": "Create a React component",
                "task_type": "CODE",
                "completed": True,
                "attempts": 2,
                "best_score": 95.0,
                "time_spent_minutes": 45,
                "last_attempt_at": "2024-01-15T10:30:00Z",
                "completed_at": "2024-01-15T10:30:00Z"
            }
        }
    }


class ModuleProgressResponse(BaseModel):
    """Response model for module-level progress."""
    
    module_id: str = Field(..., description="Module unique identifier")
    module_title: str = Field(..., description="Module title")
    order_index: int = Field(..., description="Module order in the plan")
    total_tasks: int = Field(default=0, description="Total tasks in module")
    completed_tasks: int = Field(default=0, description="Completed tasks")
    progress_percentage: float = Field(default=0.0, description="Completion percentage")
    average_score: Optional[float] = Field(None, description="Average score across tasks")
    total_time_spent_minutes: int = Field(default=0, description="Total time spent")
    status: str = Field(
        default="not_started",
        description="Module status (not_started, in_progress, completed)"
    )
    tasks: List[TaskProgressResponse] = Field(
        default_factory=list,
        description="Task-level progress details"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "module_id": "module_xyz789",
                "module_title": "React Fundamentals",
                "order_index": 0,
                "total_tasks": 5,
                "completed_tasks": 3,
                "progress_percentage": 60.0,
                "average_score": 88.5,
                "total_time_spent_minutes": 120,
                "status": "in_progress",
                "tasks": []
            }
        }
    }


class ProgressSummaryResponse(BaseModel):
    """Response model for progress summary."""
    
    user_id: str = Field(..., description="User ID")
    has_active_plan: bool = Field(..., description="Whether user has an active plan")
    plan_id: Optional[str] = Field(None, description="Active plan ID")
    plan_title: Optional[str] = Field(None, description="Active plan title")
    overall_progress: float = Field(default=0.0, description="Overall completion percentage")
    total_modules: int = Field(default=0, description="Total modules in plan")
    completed_modules: int = Field(default=0, description="Completed modules")
    total_tasks: int = Field(default=0, description="Total tasks in plan")
    completed_tasks: int = Field(default=0, description="Completed tasks")
    total_time_spent_minutes: int = Field(default=0, description="Total learning time")
    average_score: Optional[float] = Field(None, description="Average score across all tasks")
    current_streak_days: int = Field(default=0, description="Current learning streak")
    longest_streak_days: int = Field(default=0, description="Longest learning streak")
    last_activity_at: Optional[datetime] = Field(None, description="Last activity timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "user_123",
                "has_active_plan": True,
                "plan_id": "plan_def456",
                "plan_title": "React Learning Path",
                "overall_progress": 45.5,
                "total_modules": 5,
                "completed_modules": 2,
                "total_tasks": 25,
                "completed_tasks": 11,
                "total_time_spent_minutes": 480,
                "average_score": 87.3,
                "current_streak_days": 5,
                "longest_streak_days": 12,
                "last_activity_at": "2024-01-15T10:30:00Z"
            }
        }
    }


class DetailedProgressResponse(BaseModel):
    """Response model for detailed progress information."""
    
    summary: ProgressSummaryResponse = Field(..., description="Progress summary")
    modules: List[ModuleProgressResponse] = Field(
        default_factory=list,
        description="Module-level progress"
    )
    recent_submissions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Recent submission history"
    )
    skill_breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="Progress by skill/topic area"
    )
    learning_velocity: Dict[str, Any] = Field(
        default_factory=dict,
        description="Learning pace metrics"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Personalized recommendations"
    )
    achievements: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Earned achievements"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "summary": {
                    "user_id": "user_123",
                    "has_active_plan": True,
                    "plan_id": "plan_def456",
                    "plan_title": "React Learning Path",
                    "overall_progress": 45.5,
                    "total_modules": 5,
                    "completed_modules": 2,
                    "total_tasks": 25,
                    "completed_tasks": 11,
                    "total_time_spent_minutes": 480,
                    "average_score": 87.3,
                    "current_streak_days": 5,
                    "longest_streak_days": 12,
                    "last_activity_at": "2024-01-15T10:30:00Z"
                },
                "modules": [],
                "recent_submissions": [
                    {
                        "task_id": "task_abc123",
                        "score": 95.0,
                        "submitted_at": "2024-01-15T10:30:00Z"
                    }
                ],
                "skill_breakdown": {
                    "react_basics": 0.8,
                    "hooks": 0.6,
                    "state_management": 0.4
                },
                "learning_velocity": {
                    "tasks_per_day": 2.5,
                    "average_time_per_task": 25,
                    "trend": "improving"
                },
                "recommendations": [
                    "Great progress on React basics!",
                    "Consider spending more time on hooks"
                ],
                "achievements": [
                    {
                        "id": "first_module",
                        "title": "First Module Complete",
                        "earned_at": "2024-01-10T15:00:00Z"
                    }
                ]
            }
        }
    }


class ProgressUpdateRequest(BaseModel):
    """Request model for updating progress (e.g., marking task complete)."""
    
    task_id: str = Field(..., description="Task ID to update")
    completed: bool = Field(default=True, description="Mark as completed")
    time_spent_minutes: Optional[int] = Field(
        None,
        ge=0,
        description="Time spent on this session"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "completed": True,
                "time_spent_minutes": 30
            }
        }
    }


class ProgressStatsResponse(BaseModel):
    """Response model for progress statistics."""
    
    total_learning_hours: float = Field(default=0.0, description="Total hours spent learning")
    tasks_completed_this_week: int = Field(default=0, description="Tasks completed this week")
    tasks_completed_this_month: int = Field(default=0, description="Tasks completed this month")
    average_daily_time_minutes: float = Field(default=0.0, description="Average daily learning time")
    most_productive_day: Optional[str] = Field(None, description="Most productive day of week")
    most_productive_time: Optional[str] = Field(None, description="Most productive time of day")
    completion_rate: float = Field(default=0.0, description="Overall completion rate")
    improvement_trend: str = Field(
        default="stable",
        description="Performance trend (improving, stable, declining)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total_learning_hours": 24.5,
                "tasks_completed_this_week": 8,
                "tasks_completed_this_month": 25,
                "average_daily_time_minutes": 45,
                "most_productive_day": "Saturday",
                "most_productive_time": "evening",
                "completion_rate": 0.85,
                "improvement_trend": "improving"
            }
        }
    }
