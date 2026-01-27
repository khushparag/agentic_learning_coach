"""Test complete infrastructure setup."""

import pytest
import os
from pathlib import Path


def test_project_structure_complete():
    """Test that all required project structure exists."""
    # Core directories
    required_dirs = [
        "src/domain",
        "src/ports",
        "src/adapters",
        "src/agents",
        "tests/unit",
        "tests/integration",
        "tests/e2e",
        "alembic",
        "scripts",
        "runner-service"
    ]
    
    for dir_path in required_dirs:
        assert Path(dir_path).exists(), f"Directory {dir_path} should exist"


def test_configuration_files_exist():
    """Test that all configuration files exist."""
    required_files = [
        "pyproject.toml",
        "requirements.txt",
        "requirements-dev.txt",
        "docker-compose.yml",
        "Dockerfile",
        "alembic.ini",
        ".env.example",
        ".gitignore",
        "README.md",
        "Makefile"
    ]
    
    for file_path in required_files:
        assert Path(file_path).exists(), f"File {file_path} should exist"


def test_runner_service_structure():
    """Test that runner service structure exists."""
    runner_files = [
        "runner-service/Dockerfile",
        "runner-service/requirements.txt",
        "runner-service/main.py"
    ]
    
    for file_path in runner_files:
        assert Path(file_path).exists(), f"Runner service file {file_path} should exist"


def test_database_configuration():
    """Test database configuration works."""
    from src.adapters.database.settings import DatabaseSettings
    from src.adapters.database.config import DatabaseManager
    
    # Test with SQLite for testing
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"
    
    settings = DatabaseSettings()
    assert settings.is_sqlite
    assert settings.async_database_url.startswith("sqlite+aiosqlite://")
    
    db_manager = DatabaseManager(settings)
    assert db_manager is not None
    
    # Clean up
    os.environ.pop("DATABASE_URL", None)


def test_api_configuration():
    """Test API configuration works."""
    from src.adapters.api.settings import APISettings
    from src.adapters.api.main import app
    
    settings = APISettings()
    assert settings.environment == "development"
    
    # Test FastAPI app creation
    assert app is not None
    assert app.title == "Agentic Learning Coach"


def test_health_check_functionality():
    """Test health check functionality."""
    from src.adapters.api.health import HealthChecker
    
    health_checker = HealthChecker()
    assert health_checker is not None
    assert hasattr(health_checker, 'check_database')
    assert hasattr(health_checker, 'check_redis')
    assert hasattr(health_checker, 'check_runner_service')
    assert hasattr(health_checker, 'check_qdrant')


def test_agent_structure():
    """Test agent structure is properly set up."""
    agent_dirs = [
        "src/agents/base",
        "src/agents/orchestrator",
        "src/agents/profile",
        "src/agents/curriculum",
        "src/agents/resources",
        "src/agents/exercise_generator",
        "src/agents/reviewer",
        "src/agents/progress_tracker"
    ]
    
    for dir_path in agent_dirs:
        assert Path(dir_path).exists(), f"Agent directory {dir_path} should exist"
        init_file = Path(dir_path) / "__init__.py"
        assert init_file.exists(), f"Init file {init_file} should exist"


def test_clean_architecture_layers():
    """Test clean architecture layers are properly separated."""
    # Domain layer should not import from other layers
    domain_files = list(Path("src/domain").rglob("*.py"))
    for file_path in domain_files:
        if file_path.name == "__init__.py":
            continue
        
        content = file_path.read_text()
        # Domain should not import from adapters or agents
        assert "from src.adapters" not in content, f"Domain file {file_path} should not import from adapters"
        assert "from src.agents" not in content, f"Domain file {file_path} should not import from agents"


def test_docker_compose_services():
    """Test Docker Compose configuration includes all required services."""
    import yaml
    
    with open("docker-compose.yml", "r") as f:
        compose_config = yaml.safe_load(f)
    
    required_services = [
        "postgres",
        "redis", 
        "coach-service",
        "runner-service",
        "qdrant"
    ]
    
    services = compose_config.get("services", {})
    for service in required_services:
        assert service in services, f"Service {service} should be defined in docker-compose.yml"


def test_environment_configuration():
    """Test environment configuration is properly set up."""
    # Test .env.example exists and has required variables
    env_example = Path(".env.example")
    assert env_example.exists()
    
    content = env_example.read_text()
    required_vars = [
        "DATABASE_URL",
        "REDIS_URL",
        "QDRANT_URL",
        "SECRET_KEY",
        "ENVIRONMENT"
    ]
    
    for var in required_vars:
        assert var in content, f"Environment variable {var} should be in .env.example"