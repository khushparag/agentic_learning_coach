"""Database configuration and connection management."""

import os
from typing import AsyncGenerator

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from src.adapters.database.settings import DatabaseSettings


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self, settings: DatabaseSettings):
        self.settings = settings
        self._async_engine = None
        self._sync_engine = None
        self._async_session_factory = None
        self._sync_session_factory = None
    
    @property
    def async_engine(self):
        """Get or create async database engine."""
        if self._async_engine is None:
            self._async_engine = create_async_engine(
                self.settings.async_database_url,
                echo=self.settings.echo_sql,
                pool_pre_ping=True,
                pool_recycle=3600,
                **self._get_engine_kwargs()
            )
        return self._async_engine
    
    @property
    def sync_engine(self):
        """Get or create sync database engine (for migrations)."""
        if self._sync_engine is None:
            self._sync_engine = create_engine(
                self.settings.database_url,
                echo=self.settings.echo_sql,
                pool_pre_ping=True,
                pool_recycle=3600,
                **self._get_engine_kwargs()
            )
            # Setup SQLite pragma if needed
            setup_sqlite_pragma(self._sync_engine)
        return self._sync_engine
    
    @property
    def async_session_factory(self):
        """Get or create async session factory."""
        if self._async_session_factory is None:
            self._async_session_factory = async_sessionmaker(
                bind=self.async_engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False,
            )
        return self._async_session_factory
    
    @property
    def sync_session_factory(self):
        """Get or create sync session factory."""
        if self._sync_session_factory is None:
            self._sync_session_factory = sessionmaker(
                bind=self.sync_engine,
                autoflush=False,
                autocommit=False,
            )
        return self._sync_session_factory
    
    def _get_engine_kwargs(self) -> dict:
        """Get engine-specific configuration."""
        kwargs = {}
        
        # Test environment configuration
        if self.settings.environment == "test":
            kwargs.update({
                "poolclass": StaticPool,
                "connect_args": {"check_same_thread": False},
            })
        
        return kwargs
    
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async database session."""
        async with self.async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    def get_sync_session(self):
        """Get sync database session."""
        with self.sync_session_factory() as session:
            try:
                yield session
                session.commit()
            except Exception:
                session.rollback()
                raise
            finally:
                session.close()
    
    async def create_tables(self):
        """Create all database tables."""
        async with self.async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def drop_tables(self):
        """Drop all database tables."""
        async with self.async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    async def close(self):
        """Close database connections."""
        if self._async_engine:
            await self._async_engine.dispose()
        if self._sync_engine:
            self._sync_engine.dispose()


# Global database manager instance
_db_manager: DatabaseManager | None = None


def get_database_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    global _db_manager
    if _db_manager is None:
        settings = DatabaseSettings()
        _db_manager = DatabaseManager(settings)
    return _db_manager


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    db_manager = get_database_manager()
    async for session in db_manager.get_async_session():
        yield session


# Enable SQLite foreign key constraints if using SQLite
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite."""
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def setup_sqlite_pragma(engine):
    """Setup SQLite pragma for an engine."""
    if "sqlite" in str(engine.url):
        event.listens_for(engine, "connect")(set_sqlite_pragma)


# Import models to register them with SQLAlchemy
from src.adapters.database import models  # noqa: E402