"""
API models for curriculum endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskResponse(BaseModel):
    """Response model for a learning task."""
    
    id: str = Field(..., description="Task unique identifier")
    module_id: str = Field(..., description="Parent module ID")
    day_offset: int = Field(..., ge=0, description="Day offset from plan start")
    task_type: str = Field(..., description="Type of task (READ, WATCH, CODE, QUIZ)")
    description: str = Field(..., description="Task description")
    estimated_minutes: int = Field(..., gt=0, description="Estimated completion time")
    completion_criteria: str = Field(..., description="Criteria for task completion")
    resources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Learning resources for this task"
    )
    hints: List[str] = Field(default_factory=list, description="Available hints")
    is_completed: bool = Field(default=False, description="Whether task is completed")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "task_abc123",
                "module_id": "module_xyz789",
                "day_offset": 0,
                "task_type": "CODE",
                "description": "Create a simple React component that displays a greeting",
                "estimated_minutes": 30,
                "completion_criteria": "Component renders correctly and passes all tests",
                "resources": [
                    {"title": "React Components Guide", "url": "https://react.dev/learn", "type": "documentation"}
                ],
                "hints": ["Start with a functional component", "Use JSX for the return statement"],
                "is_completed": False
            }
        }
    }


class ModuleResponse(BaseModel):
    """Response model for a learning module."""
    
    id: str = Field(..., description="Module unique identifier")
    plan_id: str = Field(..., description="Parent learning plan ID")
    title: str = Field(..., description="Module title")
    summary: str = Field(..., description="Module summary")
    order_index: int = Field(..., ge=0, description="Order in the learning plan")
    learning_objectives: List[str] = Field(
        default_factory=list,
        description="Learning objectives for this module"
    )
    estimated_minutes: Optional[int] = Field(None, description="Total estimated time")
    tasks: List[TaskResponse] = Field(default_factory=list, description="Tasks in this module")
    tasks_completed: int = Field(default=0, description="Number of completed tasks")
    total_tasks: int = Field(default=0, description="Total number of tasks")
    progress_percentage: float = Field(default=0.0, description="Module completion percentage")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "module_xyz789",
                "plan_id": "plan_def456",
                "title": "React Fundamentals",
                "summary": "Learn the core concepts of React including components, props, and state",
                "order_index": 0,
                "learning_objectives": [
                    "Understand React component structure",
                    "Use props to pass data between components",
                    "Manage component state with useState"
                ],
                "estimated_minutes": 180,
                "tasks": [],
                "tasks_completed": 2,
                "total_tasks": 5,
                "progress_percentage": 40.0
            }
        }
    }


class CurriculumResponse(BaseModel):
    """Response model for a complete curriculum/learning plan."""
    
    id: str = Field(..., description="Learning plan unique identifier")
    user_id: str = Field(..., description="User ID")
    title: str = Field(..., description="Curriculum title")
    goal_description: str = Field(..., description="Learning goal description")
    status: str = Field(..., description="Plan status (draft, active, completed, paused)")
    total_days: int = Field(..., gt=0, description="Total duration in days")
    estimated_hours: Optional[int] = Field(None, description="Total estimated hours")
    modules: List[ModuleResponse] = Field(default_factory=list, description="Learning modules")
    modules_completed: int = Field(default=0, description="Number of completed modules")
    total_modules: int = Field(default=0, description="Total number of modules")
    overall_progress: float = Field(default=0.0, description="Overall completion percentage")
    current_module_index: int = Field(default=0, description="Current module index")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "plan_def456",
                "user_id": "user_123",
                "title": "React Learning Path",
                "goal_description": "Master React fundamentals and build a complete application",
                "status": "active",
                "total_days": 30,
                "estimated_hours": 40,
                "modules": [],
                "modules_completed": 1,
                "total_modules": 5,
                "overall_progress": 20.0,
                "current_module_index": 1,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-20T15:45:00Z"
            }
        }
    }


class CreateCurriculumRequest(BaseModel):
    """Request model for creating a new curriculum."""
    
    goals: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Learning goals for the curriculum"
    )
    time_constraints: Optional[Dict[str, Any]] = Field(
        None,
        description="Time availability constraints"
    )
    preferences: Dict[str, Any] = Field(
        default_factory=dict,
        description="Learning preferences"
    )
    skill_level: Optional[str] = Field(
        None,
        description="Current skill level"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "goals": ["Learn React", "Build a todo app"],
                "time_constraints": {
                    "hours_per_week": 10,
                    "preferred_times": ["evening"]
                },
                "preferences": {
                    "learning_style": "hands-on"
                },
                "skill_level": "beginner"
            }
        }
    }


class CurriculumStatusResponse(BaseModel):
    """Response model for curriculum status."""
    
    has_active_plan: bool = Field(..., description="Whether user has an active plan")
    plan_id: Optional[str] = Field(None, description="Active plan ID if exists")
    status: Optional[str] = Field(None, description="Plan status")
    progress_percentage: float = Field(default=0.0, description="Overall progress")
    current_module: Optional[str] = Field(None, description="Current module title")
    current_task: Optional[str] = Field(None, description="Current task description")
    days_remaining: Optional[int] = Field(None, description="Days remaining in plan")
    next_milestone: Optional[str] = Field(None, description="Next milestone description")
    recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations based on progress"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "has_active_plan": True,
                "plan_id": "plan_def456",
                "status": "active",
                "progress_percentage": 35.5,
                "current_module": "React Hooks",
                "current_task": "Implement useState in a counter component",
                "days_remaining": 20,
                "next_milestone": "Complete React Hooks module",
                "recommendations": [
                    "You're making great progress!",
                    "Consider reviewing the previous module before continuing"
                ]
            }
        }
    }


class ActivateCurriculumRequest(BaseModel):
    """Request model for activating a curriculum."""
    
    plan_id: str = Field(..., description="Plan ID to activate")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "plan_id": "plan_def456"
            }
        }
    }


class CurriculumListResponse(BaseModel):
    """Response model for listing user's curricula."""
    
    curricula: List[CurriculumResponse] = Field(
        default_factory=list,
        description="List of user's curricula"
    )
    total: int = Field(default=0, description="Total number of curricula")
    active_plan_id: Optional[str] = Field(None, description="Currently active plan ID")
