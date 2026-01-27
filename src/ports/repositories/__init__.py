"""
Repository interfaces for the Agentic Learning Coach system.
"""

from .base_repository import (
    BaseRepository,
    RepositoryError,
    EntityNotFoundError,
    DuplicateEntityError,
    RepositoryConnectionError
)
from .user_repository import UserRepository
from .curriculum_repository import CurriculumRepository
from .submission_repository import SubmissionRepository

__all__ = [
    # Base repository
    'BaseRepository',
    'RepositoryError',
    'EntityNotFoundError',
    'DuplicateEntityError',
    'RepositoryConnectionError',
    
    # Specific repositories
    'UserRepository',
    'CurriculumRepository',
    'SubmissionRepository'
]