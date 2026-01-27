"""
Ports layer for the Agentic Learning Coach system.
"""

# Import repository interfaces
from .repositories import (
    BaseRepository,
    RepositoryError,
    EntityNotFoundError,
    DuplicateEntityError,
    RepositoryConnectionError,
    UserRepository,
    CurriculumRepository,
    SubmissionRepository
)

__all__ = [
    # Base repository
    'BaseRepository',
    'RepositoryError',
    'EntityNotFoundError',
    'DuplicateEntityError',
    'RepositoryConnectionError',
    
    # Repository interfaces
    'UserRepository',
    'CurriculumRepository',
    'SubmissionRepository'
]