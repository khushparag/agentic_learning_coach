"""Database adapter package for the Agentic Learning Coach system."""

from .config import Base, DatabaseManager, get_database_manager, get_db_session
from .models import (
    User, LearningProfile, LearningPlan, LearningModule, LearningTask,
    Submission, Evaluation, ProgressTracking
)
from .settings import DatabaseSettings
from .migration_manager import (
    MigrationManager, initialize_database, upgrade_database, 
    get_migration_status, create_initial_migration
)

__all__ = [
    "Base",
    "DatabaseManager", 
    "get_database_manager",
    "get_db_session",
    "DatabaseSettings",
    "User",
    "LearningProfile", 
    "LearningPlan",
    "LearningModule",
    "LearningTask",
    "Submission",
    "Evaluation",
    "ProgressTracking",
    "MigrationManager",
    "initialize_database",
    "upgrade_database",
    "get_migration_status",
    "create_initial_migration",
]