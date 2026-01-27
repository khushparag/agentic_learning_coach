"""
API models for task retrieval endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskDetailResponse(BaseModel):
    """Detailed response model for a single task."""
    
    id: str = Field(..., description="Task unique identifier")
    module_id: str = Field(..., description="Parent module ID")
    module_title: str = Field(..., description="Parent module title")
    day_offset: int = Field(..., ge=0, description="Day offset from plan start")
    task_type: str = Field(..., description="Type of task (READ, WATCH, CODE, QUIZ)")
    description: str = Field(..., description="Task description")
    estimated_minutes: int = Field(..., gt=0, description="Estimated completion time")
    completion_criteria: str = Field(..., description="Criteria for task completion")
    resources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Learning resources for this task"
    )
    instructions: Optional[Dict[str, Any]] = Field(
        None,
        description="Detailed instructions for the task"
    )
    test_cases: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Test cases for code tasks"
    )
    solution_template: Optional[str] = Field(
        None,
        description="Starter code template"
    )
    hints: List[str] = Field(default_factory=list, description="Available hints")
    time_limit_minutes: Optional[int] = Field(
        None,
        description="Time limit for timed tasks"
    )
    is_completed: bool = Field(default=False, description="Whether task is completed")
    best_score: Optional[float] = Field(None, description="Best score achieved")
    attempts: int = Field(default=0, description="Number of attempts")
    last_attempt_at: Optional[datetime] = Field(None, description="Last attempt timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "task_abc123",
                "module_id": "module_xyz789",
                "module_title": "React Fundamentals",
                "day_offset": 0,
                "task_type": "CODE",
                "description": "Create a React component that displays a greeting message",
                "estimated_minutes": 30,
                "completion_criteria": "Component renders correctly and passes all tests",
                "resources": [
                    {
                        "title": "React Components Guide",
                        "url": "https://react.dev/learn",
                        "type": "documentation"
                    }
                ],
                "instructions": {
                    "objective": "Build a Greeting component",
                    "requirements": ["Accept a name prop", "Display 'Hello, {name}!'"]
                },
                "test_cases": [
                    {
                        "name": "renders greeting",
                        "input": {"name": "World"},
                        "expected_output": "Hello, World!"
                    }
                ],
                "solution_template": "function Greeting({ name }) {\n  // Your code here\n}",
                "hints": ["Use JSX to return the greeting", "Access props using destructuring"],
                "time_limit_minutes": None,
                "is_completed": False,
                "best_score": None,
                "attempts": 0,
                "last_attempt_at": None
            }
        }
    }


class TaskSummaryResponse(BaseModel):
    """Summary response model for a task (used in lists)."""
    
    id: str = Field(..., description="Task unique identifier")
    module_id: str = Field(..., description="Parent module ID")
    module_title: str = Field(..., description="Parent module title")
    task_type: str = Field(..., description="Type of task")
    description: str = Field(..., description="Task description")
    estimated_minutes: int = Field(..., description="Estimated completion time")
    is_completed: bool = Field(default=False, description="Whether task is completed")
    day_offset: int = Field(..., description="Day offset from plan start")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "task_abc123",
                "module_id": "module_xyz789",
                "module_title": "React Fundamentals",
                "task_type": "CODE",
                "description": "Create a React component",
                "estimated_minutes": 30,
                "is_completed": False,
                "day_offset": 0
            }
        }
    }


class TodayTasksResponse(BaseModel):
    """Response model for today's tasks."""
    
    date: str = Field(..., description="Current date (YYYY-MM-DD)")
    day_offset: int = Field(..., ge=0, description="Current day offset in the plan")
    tasks: List[TaskSummaryResponse] = Field(
        default_factory=list,
        description="Tasks scheduled for today"
    )
    total_tasks: int = Field(default=0, description="Total tasks for today")
    completed_tasks: int = Field(default=0, description="Completed tasks for today")
    total_estimated_minutes: int = Field(
        default=0,
        description="Total estimated time for today's tasks"
    )
    progress_message: str = Field(
        default="",
        description="Motivational progress message"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "date": "2024-01-15",
                "day_offset": 5,
                "tasks": [
                    {
                        "id": "task_abc123",
                        "module_id": "module_xyz789",
                        "module_title": "React Fundamentals",
                        "task_type": "CODE",
                        "description": "Create a React component",
                        "estimated_minutes": 30,
                        "is_completed": False,
                        "day_offset": 5
                    }
                ],
                "total_tasks": 3,
                "completed_tasks": 1,
                "total_estimated_minutes": 90,
                "progress_message": "Great progress! You've completed 1 of 3 tasks today."
            }
        }
    }


class TaskListResponse(BaseModel):
    """Response model for listing tasks."""
    
    tasks: List[TaskSummaryResponse] = Field(
        default_factory=list,
        description="List of tasks"
    )
    total: int = Field(default=0, description="Total number of tasks")
    page: int = Field(default=1, description="Current page")
    page_size: int = Field(default=20, description="Items per page")
    total_pages: int = Field(default=0, description="Total pages")
    filter_applied: Optional[str] = Field(None, description="Applied filter description")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "tasks": [],
                "total": 25,
                "page": 1,
                "page_size": 20,
                "total_pages": 2,
                "filter_applied": "module_id=module_xyz789"
            }
        }
    }


class TaskHintRequest(BaseModel):
    """Request model for getting a task hint."""
    
    task_id: str = Field(..., description="Task ID to get hint for")
    hint_index: int = Field(
        default=0,
        ge=0,
        description="Index of the hint to retrieve (0-based)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "hint_index": 0
            }
        }
    }


class TaskHintResponse(BaseModel):
    """Response model for a task hint."""
    
    task_id: str = Field(..., description="Task ID")
    hint_index: int = Field(..., description="Index of the returned hint")
    hint: str = Field(..., description="The hint content")
    total_hints: int = Field(..., description="Total available hints")
    has_more_hints: bool = Field(..., description="Whether more hints are available")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "hint_index": 0,
                "hint": "Start by creating a functional component using the function keyword or arrow syntax",
                "total_hints": 3,
                "has_more_hints": True
            }
        }
    }



class TaskStartResponse(BaseModel):
    """Response model for starting a task."""
    
    task_id: str = Field(..., description="Task unique identifier")
    started_at: datetime = Field(..., description="Timestamp when task was started")
    status: str = Field(default="in_progress", description="Task status after starting")
    message: str = Field(..., description="Success message")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "started_at": "2024-01-15T10:30:00Z",
                "status": "in_progress",
                "message": "Task started successfully. Good luck!"
            }
        }
    }


class TaskCompleteResponse(BaseModel):
    """Response model for completing a task."""
    
    task_id: str = Field(..., description="Task unique identifier")
    completed_at: datetime = Field(..., description="Timestamp when task was completed")
    status: str = Field(default="completed", description="Task status after completion")
    next_task_id: Optional[str] = Field(None, description="ID of the next task in sequence")
    message: str = Field(..., description="Success message")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "completed_at": "2024-01-15T11:00:00Z",
                "status": "completed",
                "next_task_id": "task_def456",
                "message": "Great job! Task completed successfully."
            }
        }
    }
