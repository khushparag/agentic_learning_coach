"""Database settings and configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Database connection
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/learning_coach",
        description="Database connection URL"
    )
    
    # Environment
    environment: str = Field(default="development", description="Environment name")
    
    # Database configuration
    echo_sql: bool = Field(default=False, description="Echo SQL queries to console")
    pool_size: int = Field(default=5, description="Database connection pool size")
    max_overflow: int = Field(default=10, description="Maximum connection pool overflow")
    pool_timeout: int = Field(default=30, description="Connection pool timeout in seconds")
    pool_recycle: int = Field(default=3600, description="Connection recycle time in seconds")
    
    @property
    def async_database_url(self) -> str:
        """Get async database URL."""
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("sqlite://"):
            return self.database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return self.database_url
    
    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite database."""
        return "sqlite" in self.database_url.lower()
    
    @property
    def is_postgresql(self) -> bool:
        """Check if using PostgreSQL database."""
        return "postgresql" in self.database_url.lower()
    
    @property
    def is_test_environment(self) -> bool:
        """Check if running in test environment."""
        return self.environment.lower() in ("test", "testing")
    
    @property
    def is_development_environment(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() in ("development", "dev", "local")