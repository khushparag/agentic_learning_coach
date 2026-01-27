"""Basic setup tests to verify project structure."""

import pytest
from pathlib import Path


def test_project_structure():
    """Test that the basic project structure exists."""
    # Check main source directories
    assert Path("src").exists()
    assert Path("src/domain").exists()
    assert Path("src/ports").exists()
    assert Path("src/adapters").exists()
    assert Path("src/agents").exists()
    
    # Check test directories
    assert Path("tests").exists()
    assert Path("tests/unit").exists()
    assert Path("tests/integration").exists()
    assert Path("tests/e2e").exists()
    
    # Check configuration files
    assert Path("pyproject.toml").exists()
    assert Path("requirements.txt").exists()
    assert Path("requirements-dev.txt").exists()
    assert Path("docker-compose.yml").exists()
    assert Path("Dockerfile").exists()
    assert Path("alembic.ini").exists()


def test_import_basic_modules():
    """Test that basic modules can be imported."""
    # Test domain imports
    import src.domain
    import src.domain.entities
    import src.domain.value_objects
    
    # Test ports imports
    import src.ports
    import src.ports.repositories
    import src.ports.services
    
    # Test adapters imports
    import src.adapters
    import src.adapters.database
    import src.adapters.api
    import src.adapters.external
    
    # Test agents imports
    import src.agents
    import src.agents.base
    import src.agents.orchestrator


def test_database_settings():
    """Test database settings configuration."""
    from src.adapters.database.settings import DatabaseSettings
    
    settings = DatabaseSettings()
    
    # Test basic properties
    assert hasattr(settings, 'database_url')
    assert hasattr(settings, 'environment')
    assert hasattr(settings, 'async_database_url')
    
    # Test URL conversion
    if settings.database_url.startswith("postgresql://"):
        assert settings.async_database_url.startswith("postgresql+asyncpg://")


def test_api_settings():
    """Test API settings configuration."""
    from src.adapters.api.settings import APISettings
    
    settings = APISettings()
    
    # Test basic properties
    assert hasattr(settings, 'environment')
    assert hasattr(settings, 'debug')
    assert hasattr(settings, 'host')
    assert hasattr(settings, 'port')
    assert hasattr(settings, 'secret_key')
    
    # Test environment detection methods
    assert hasattr(settings, 'is_development')
    assert hasattr(settings, 'is_production')
    assert hasattr(settings, 'is_testing')


@pytest.mark.asyncio
async def test_database_manager_creation():
    """Test that database manager can be created."""
    from src.adapters.database.config import DatabaseManager
    from src.adapters.database.settings import DatabaseSettings
    
    # Use SQLite for testing to avoid PostgreSQL dependency
    import os
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"
    
    settings = DatabaseSettings()
    db_manager = DatabaseManager(settings)
    
    # Test basic properties
    assert db_manager.settings == settings
    assert hasattr(db_manager, 'async_engine')
    assert hasattr(db_manager, 'sync_engine')
    assert hasattr(db_manager, 'async_session_factory')
    assert hasattr(db_manager, 'sync_session_factory')
    
    # Clean up
    os.environ.pop("DATABASE_URL", None)


def test_health_checker_creation():
    """Test that health checker can be created."""
    from src.adapters.api.health import HealthChecker
    
    health_checker = HealthChecker()
    
    # Test basic properties
    assert hasattr(health_checker, 'db_settings')
    assert hasattr(health_checker, 'check_database')
    assert hasattr(health_checker, 'check_redis')
    assert hasattr(health_checker, 'check_runner_service')
    assert hasattr(health_checker, 'check_qdrant')