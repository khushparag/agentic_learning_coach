"""Test health check endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import os

from src.adapters.api.main import app


@pytest.fixture
def client():
    """Create test client."""
    # Set test environment
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"
    os.environ["ENVIRONMENT"] = "test"
    
    with TestClient(app) as client:
        yield client
    
    # Clean up
    os.environ.pop("DATABASE_URL", None)
    os.environ.pop("ENVIRONMENT", None)


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Agentic Learning Coach"
    assert data["version"] == "0.1.0"
    assert data["status"] == "running"


def test_basic_health_check(client):
    """Test basic health check endpoint."""
    response = client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "learning-coach"
    assert "timestamp" in data
    assert data["version"] == "0.1.0"


@patch('src.adapters.api.health.HealthChecker.check_database')
def test_readiness_check_healthy(mock_check_db, client):
    """Test readiness check when database is healthy."""
    # Mock healthy database
    mock_check_db.return_value = {
        "status": "healthy",
        "response_time_ms": 10.5,
        "database_type": "sqlite",
        "timestamp": "2024-01-01T00:00:00"
    }
    
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert "timestamp" in data
    assert "database" in data


@patch('src.adapters.api.health.HealthChecker.check_database')
def test_readiness_check_unhealthy(mock_check_db, client):
    """Test readiness check when database is unhealthy."""
    # Mock unhealthy database
    mock_check_db.return_value = {
        "status": "unhealthy",
        "error": "Connection failed",
        "timestamp": "2024-01-01T00:00:00"
    }
    
    response = client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["detail"]["ready"] is False
    assert "reason" in data["detail"]


def test_liveness_check(client):
    """Test liveness check endpoint."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["alive"] is True
    assert data["service"] == "learning-coach"
    assert "timestamp" in data