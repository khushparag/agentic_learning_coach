"""
API routers for the Agentic Learning Coach.

This module contains FastAPI routers for different API domains.
"""

from .goals import router as goals_router
from .curriculum import router as curriculum_router
from .tasks import router as tasks_router
from .submissions import router as submissions_router
from .progress import router as progress_router

__all__ = [
    "goals_router",
    "curriculum_router",
    "tasks_router",
    "submissions_router",
    "progress_router",
]
