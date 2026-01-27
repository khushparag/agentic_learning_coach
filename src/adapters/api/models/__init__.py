"""
API request and response models for the Agentic Learning Coach.

This module contains Pydantic models for API validation and serialization.
"""

from .goals import (
    SetGoalsRequest,
    SetGoalsResponse,
    GoalItem,
    TimeConstraints,
    UpdateGoalsRequest,
)
from .curriculum import (
    CurriculumResponse,
    ModuleResponse,
    TaskResponse,
    CreateCurriculumRequest,
    CurriculumStatusResponse,
)
from .tasks import (
    TaskDetailResponse,
    TodayTasksResponse,
    TaskListResponse,
)
from .submissions import (
    SubmitCodeRequest,
    SubmissionResponse,
    EvaluationResponse,
    TestResultResponse,
    FeedbackResponse,
)
from .progress import (
    ProgressSummaryResponse,
    DetailedProgressResponse,
    ModuleProgressResponse,
    TaskProgressResponse,
)
from .common import (
    ErrorResponse,
    SuccessResponse,
    PaginatedResponse,
    PaginationParams,
)

__all__ = [
    # Goals
    "SetGoalsRequest",
    "SetGoalsResponse",
    "GoalItem",
    "TimeConstraints",
    "UpdateGoalsRequest",
    # Curriculum
    "CurriculumResponse",
    "ModuleResponse",
    "TaskResponse",
    "CreateCurriculumRequest",
    "CurriculumStatusResponse",
    # Tasks
    "TaskDetailResponse",
    "TodayTasksResponse",
    "TaskListResponse",
    # Submissions
    "SubmitCodeRequest",
    "SubmissionResponse",
    "EvaluationResponse",
    "TestResultResponse",
    "FeedbackResponse",
    # Progress
    "ProgressSummaryResponse",
    "DetailedProgressResponse",
    "ModuleProgressResponse",
    "TaskProgressResponse",
    # Common
    "ErrorResponse",
    "SuccessResponse",
    "PaginatedResponse",
    "PaginationParams",
]
