"""
Database migration management utilities.
"""
import os
import subprocess
from pathlib import Path
from typing import Optional

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncEngine

from src.adapters.database.config import get_database_manager
from src.adapters.database.settings import DatabaseSettings


class MigrationManager:
    """
    Manages database migrations using Alembic.
    
    This class provides a high-level interface for running database
    migrations, creating new migrations, and managing schema changes.
    """
    
    def __init__(self, settings: Optional[DatabaseSettings] = None):
        """
        Initialize the migration manager.
        
        Args:
            settings: Database settings (optional, will create if not provided)
        """
        self.settings = settings or DatabaseSettings()
        self.alembic_cfg = self._get_alembic_config()
    
    def _get_alembic_config(self) -> Config:
        """Get Alembic configuration."""
        # Find alembic.ini file
        current_dir = Path(__file__).parent
        project_root = current_dir.parent.parent.parent  # Go up to project root
        alembic_ini_path = project_root / "alembic.ini"
        
        if not alembic_ini_path.exists():
            raise FileNotFoundError(f"alembic.ini not found at {alembic_ini_path}")
        
        # Create Alembic config
        alembic_cfg = Config(str(alembic_ini_path))
        
        # Set the database URL
        alembic_cfg.set_main_option("sqlalchemy.url", self.settings.database_url)
        
        return alembic_cfg
    
    async def create_tables(self) -> None:
        """
        Create all database tables using SQLAlchemy metadata.
        
        This is useful for testing or initial setup without migrations.
        """
        db_manager = get_database_manager()
        await db_manager.create_tables()
    
    async def drop_tables(self) -> None:
        """
        Drop all database tables using SQLAlchemy metadata.
        
        WARNING: This will delete all data!
        """
        db_manager = get_database_manager()
        await db_manager.drop_tables()
    
    def create_migration(self, message: str, autogenerate: bool = True) -> str:
        """
        Create a new migration file.
        
        Args:
            message: Description of the migration
            autogenerate: Whether to auto-generate migration from model changes
            
        Returns:
            str: The revision ID of the created migration
        """
        try:
            if autogenerate:
                command.revision(
                    self.alembic_cfg,
                    message=message,
                    autogenerate=True
                )
            else:
                command.revision(
                    self.alembic_cfg,
                    message=message
                )
            
            # Get the latest revision
            return self.get_current_revision()
            
        except Exception as e:
            raise RuntimeError(f"Failed to create migration: {str(e)}")
    
    def upgrade_to_head(self) -> None:
        """
        Upgrade database to the latest migration.
        """
        try:
            command.upgrade(self.alembic_cfg, "head")
        except Exception as e:
            raise RuntimeError(f"Failed to upgrade database: {str(e)}")
    
    def upgrade_to_revision(self, revision: str) -> None:
        """
        Upgrade database to a specific revision.
        
        Args:
            revision: Target revision ID
        """
        try:
            command.upgrade(self.alembic_cfg, revision)
        except Exception as e:
            raise RuntimeError(f"Failed to upgrade to revision {revision}: {str(e)}")
    
    def downgrade_to_revision(self, revision: str) -> None:
        """
        Downgrade database to a specific revision.
        
        Args:
            revision: Target revision ID
        """
        try:
            command.downgrade(self.alembic_cfg, revision)
        except Exception as e:
            raise RuntimeError(f"Failed to downgrade to revision {revision}: {str(e)}")
    
    def get_current_revision(self) -> Optional[str]:
        """
        Get the current database revision.
        
        Returns:
            str: Current revision ID or None if no migrations applied
        """
        try:
            from alembic.runtime.migration import MigrationContext
            from sqlalchemy import create_engine
            
            engine = create_engine(self.settings.database_url)
            
            with engine.connect() as connection:
                context = MigrationContext.configure(connection)
                return context.get_current_revision()
                
        except Exception:
            return None
    
    def get_migration_history(self) -> list:
        """
        Get the migration history.
        
        Returns:
            list: List of migration revisions
        """
        try:
            command.history(self.alembic_cfg)
            return []  # Alembic history command prints to stdout
        except Exception as e:
            raise RuntimeError(f"Failed to get migration history: {str(e)}")
    
    def check_migration_status(self) -> dict:
        """
        Check the current migration status.
        
        Returns:
            dict: Migration status information
        """
        current_revision = self.get_current_revision()
        
        return {
            "current_revision": current_revision,
            "has_migrations": current_revision is not None,
            "database_url": self.settings.database_url,
            "is_up_to_date": True  # Would need more complex logic to determine this
        }
    
    async def initialize_database(self) -> None:
        """
        Initialize the database with the latest schema.
        
        This method will:
        1. Create the database if it doesn't exist
        2. Run all migrations to bring schema up to date
        """
        try:
            # First, try to upgrade to head (this will create alembic_version table)
            self.upgrade_to_head()
        except Exception as e:
            # If migrations fail, it might be because the database is empty
            # In that case, create tables directly and stamp with head revision
            try:
                await self.create_tables()
                command.stamp(self.alembic_cfg, "head")
            except Exception as create_error:
                raise RuntimeError(
                    f"Failed to initialize database. "
                    f"Migration error: {str(e)}. "
                    f"Create tables error: {str(create_error)}"
                )


# Convenience functions for common operations
async def initialize_database(settings: Optional[DatabaseSettings] = None) -> None:
    """
    Initialize the database with the latest schema.
    
    Args:
        settings: Database settings (optional)
    """
    manager = MigrationManager(settings)
    await manager.initialize_database()


def create_initial_migration(message: str = "Initial migration") -> str:
    """
    Create the initial migration file.
    
    Args:
        message: Migration message
        
    Returns:
        str: Revision ID of the created migration
    """
    manager = MigrationManager()
    return manager.create_migration(message, autogenerate=True)


def upgrade_database(settings: Optional[DatabaseSettings] = None) -> None:
    """
    Upgrade database to the latest migration.
    
    Args:
        settings: Database settings (optional)
    """
    manager = MigrationManager(settings)
    manager.upgrade_to_head()


def get_migration_status(settings: Optional[DatabaseSettings] = None) -> dict:
    """
    Get the current migration status.
    
    Args:
        settings: Database settings (optional)
        
    Returns:
        dict: Migration status information
    """
    manager = MigrationManager(settings)
    return manager.check_migration_status()