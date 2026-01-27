"""
Integration tests for the FastAPI REST API endpoints.

Tests cover all core API functionality including:
- Goal setting endpoints
- Curriculum access endpoints
- Task retrieval endpoints
- Code submission and evaluation endpoints
- Progress tracking endpoints
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from httpx import AsyncClient

from src.adapters.api.main import app
from src.domain.entities.user_profile import UserProfile
from src.domain.entities.learning_plan import LearningPlan
from src.domain.entities.module import Module
from src.domain.entities.task import Task
from src.domain.entities.submission import Submission
from src.domain.entities.evaluation_result import EvaluationResult
from src.domain.value_objects.enums import SkillLevel, TaskType, LearningPlanStatus


# Test user ID for all tests
TEST_USER_ID = "test-user-123"


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create authentication headers for test requests."""
    return {"X-User-ID": TEST_USER_ID}


@pytest.fixture
def mock_user_profile():
    """Create a mock user profile."""
    return UserProfile(
        user_id=TEST_USER_ID,
        skill_level=SkillLevel.INTERMEDIATE,
        learning_goals=["Learn React", "Master TypeScript"],
        time_constraints={
            "hours_per_week": 10,
            "preferred_times": ["evening"],
            "available_days": ["monday", "wednesday", "saturday"],
            "session_length_minutes": 60
        },
        preferences={"learning_style": "hands-on"}
    )


@pytest.fixture
def mock_learning_plan():
    """Create a mock learning plan with modules and tasks."""
    plan = LearningPlan(
        user_id=TEST_USER_ID,
        title="React Learning Path",
        goal_description="Master React fundamentals",
        total_days=30,
        status=LearningPlanStatus.ACTIVE
    )
    
    # Add a module
    module = Module(
        plan_id=plan.id,
        title="React Basics",
        order_index=0,
        summary="Learn React fundamentals"
    )
    
    # Add tasks to the module
    task1 = Task(
        module_id=module.id,
        day_offset=0,
        task_type=TaskType.READ,
        description="Read React documentation",
        estimated_minutes=30,
        completion_criteria="Understand React basics"
    )
    
    task2 = Task(
        module_id=module.id,
        day_offset=1,
        task_type=TaskType.CODE,
        description="Create a React component",
        estimated_minutes=45,
        completion_criteria="Component renders correctly"
    )
    
    module.tasks = [task1, task2]
    plan.modules = [module]
    
    return plan


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_health_check(self, client):
        """Test basic health check endpoint."""
        response = client.get("/health/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_liveness_check(self, client):
        """Test liveness check endpoint."""
        response = client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["alive"] is True


class TestGoalsEndpoints:
    """Tests for goal setting endpoints."""
    
    @patch("src.adapters.api.routers.goals.PostgresUserRepository")
    def test_set_goals_success(self, mock_repo_class, client, auth_headers, mock_user_profile):
        """Test successful goal setting."""
        mock_repo = AsyncMock()
        mock_repo.get_user_profile.return_value = mock_user_profile
        mock_repo.update_user_profile.return_value = mock_user_profile
        mock_repo_class.return_value = mock_repo
        
        request_data = {
            "goals": ["Learn React", "Master TypeScript"],
            "time_constraints": {
                "hours_per_week": 10,
                "preferred_times": ["evening"],
                "available_days": ["monday", "wednesday"],
                "session_length_minutes": 60
            },
            "skill_level": "intermediate"
        }
        
        response = client.post(
            "/api/v1/goals",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["goals"] == request_data["goals"]
        assert "goal_categories" in data
        assert "estimated_timeline" in data
    
    def test_set_goals_missing_auth(self, client):
        """Test goal setting without authentication."""
        request_data = {
            "goals": ["Learn React"],
            "time_constraints": {
                "hours_per_week": 10,
                "preferred_times": [],
                "available_days": [],
                "session_length_minutes": 60
            }
        }
        
        response = client.post("/api/v1/goals", json=request_data)
        assert response.status_code == 401
    
    def test_set_goals_invalid_data(self, client, auth_headers):
        """Test goal setting with invalid data."""
        request_data = {
            "goals": [],  # Empty goals list
            "time_constraints": {
                "hours_per_week": 10,
                "preferred_times": [],
                "available_days": [],
                "session_length_minutes": 60
            }
        }
        
        response = client.post(
            "/api/v1/goals",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    @patch("src.adapters.api.routers.goals.PostgresUserRepository")
    def test_get_goals_success(self, mock_repo_class, client, auth_headers, mock_user_profile):
        """Test successful goal retrieval."""
        mock_repo = AsyncMock()
        mock_repo.get_user_profile.return_value = mock_user_profile
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/goals", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "goals" in data
    
    @patch("src.adapters.api.routers.goals.PostgresUserRepository")
    def test_get_goals_not_found(self, mock_repo_class, client, auth_headers):
        """Test goal retrieval when profile doesn't exist."""
        mock_repo = AsyncMock()
        mock_repo.get_user_profile.return_value = None
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/goals", headers=auth_headers)
        
        assert response.status_code == 404


class TestCurriculumEndpoints:
    """Tests for curriculum endpoints."""
    
    @patch("src.adapters.api.routers.curriculum.PostgresCurriculumRepository")
    def test_get_curriculum_success(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test successful curriculum retrieval."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = mock_learning_plan
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/curriculum", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == mock_learning_plan.title
        assert "modules" in data
    
    @patch("src.adapters.api.routers.curriculum.PostgresCurriculumRepository")
    def test_get_curriculum_not_found(self, mock_repo_class, client, auth_headers):
        """Test curriculum retrieval when no active plan exists."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = None
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/curriculum", headers=auth_headers)
        
        assert response.status_code == 404
    
    @patch("src.adapters.api.routers.curriculum.PostgresCurriculumRepository")
    @patch("src.adapters.api.routers.curriculum.PostgresUserRepository")
    def test_create_curriculum_success(
        self, mock_user_repo_class, mock_curriculum_repo_class,
        client, auth_headers, mock_user_profile
    ):
        """Test successful curriculum creation."""
        mock_user_repo = AsyncMock()
        mock_user_repo.get_user_profile.return_value = mock_user_profile
        mock_user_repo_class.return_value = mock_user_repo
        
        mock_curriculum_repo = AsyncMock()
        mock_curriculum_repo.save_plan.return_value = LearningPlan(
            user_id=TEST_USER_ID,
            title="Test Plan",
            goal_description="Test goals",
            total_days=30,
            status=LearningPlanStatus.DRAFT
        )
        mock_curriculum_repo_class.return_value = mock_curriculum_repo
        
        request_data = {
            "goals": ["Learn React", "Build a todo app"],
            "skill_level": "beginner"
        }
        
        response = client.post(
            "/api/v1/curriculum",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "modules" in data
    
    @patch("src.adapters.api.routers.curriculum.PostgresCurriculumRepository")
    def test_get_curriculum_status(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test curriculum status retrieval."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = mock_learning_plan
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/curriculum/status", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_active_plan"] is True
        assert "progress_percentage" in data


class TestTasksEndpoints:
    """Tests for task retrieval endpoints."""
    
    @patch("src.adapters.api.routers.tasks.PostgresCurriculumRepository")
    def test_get_today_tasks(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test getting today's tasks."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = mock_learning_plan
        mock_repo.get_tasks_for_day.return_value = mock_learning_plan.modules[0].tasks
        mock_repo.get_module.return_value = mock_learning_plan.modules[0]
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/tasks/today", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "date" in data
        assert "progress_message" in data
    
    @patch("src.adapters.api.routers.tasks.PostgresCurriculumRepository")
    def test_get_task_detail(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test getting task details."""
        task = mock_learning_plan.modules[0].tasks[0]
        module = mock_learning_plan.modules[0]
        
        mock_repo = AsyncMock()
        mock_repo.get_task.return_value = task
        mock_repo.get_module.return_value = module
        mock_repo.get_plan.return_value = mock_learning_plan
        mock_repo_class.return_value = mock_repo
        
        response = client.get(f"/api/v1/tasks/{task.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task.id
        assert data["description"] == task.description
    
    @patch("src.adapters.api.routers.tasks.PostgresCurriculumRepository")
    def test_get_task_not_found(self, mock_repo_class, client, auth_headers):
        """Test getting non-existent task."""
        mock_repo = AsyncMock()
        mock_repo.get_task.return_value = None
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/tasks/nonexistent-id", headers=auth_headers)
        
        assert response.status_code == 404
    
    @patch("src.adapters.api.routers.tasks.PostgresCurriculumRepository")
    def test_list_tasks(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test listing tasks."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = mock_learning_plan
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/tasks", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "total" in data


class TestSubmissionsEndpoints:
    """Tests for code submission endpoints."""
    
    @patch("src.adapters.api.routers.submissions.PostgresCurriculumRepository")
    @patch("src.adapters.api.routers.submissions.PostgresSubmissionRepository")
    def test_submit_code_success(
        self, mock_submission_repo_class, mock_curriculum_repo_class,
        client, auth_headers, mock_learning_plan
    ):
        """Test successful code submission."""
        task = mock_learning_plan.modules[0].tasks[1]  # CODE task
        module = mock_learning_plan.modules[0]
        
        mock_curriculum_repo = AsyncMock()
        mock_curriculum_repo.get_task.return_value = task
        mock_curriculum_repo.get_module.return_value = module
        mock_curriculum_repo.get_plan.return_value = mock_learning_plan
        mock_curriculum_repo_class.return_value = mock_curriculum_repo
        
        submission = Submission(
            task_id=task.id,
            user_id=TEST_USER_ID,
            code_content="def hello(): return 'Hello, World!'"
        )
        
        evaluation = EvaluationResult(
            submission_id=submission.id,
            passed=True,
            score=85.0,
            feedback={"overall_assessment": "Good work!"},
            execution_time=0.1
        )
        
        mock_submission_repo = AsyncMock()
        mock_submission_repo.save_submission.return_value = submission
        mock_submission_repo.save_evaluation.return_value = evaluation
        mock_submission_repo_class.return_value = mock_submission_repo
        
        request_data = {
            "task_id": task.id,
            "code": "def hello(): return 'Hello, World!'",
            "language": "python"
        }
        
        response = client.post(
            "/api/v1/submissions",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "submission_id" in data
        assert "passed" in data
        assert "score" in data
        assert "feedback" in data
    
    def test_submit_code_empty(self, client, auth_headers):
        """Test submitting empty code."""
        request_data = {
            "task_id": "task-123",
            "code": "   ",  # Whitespace only
            "language": "python"
        }
        
        response = client.post(
            "/api/v1/submissions",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_submit_code_invalid_language(self, client, auth_headers):
        """Test submitting code with invalid language."""
        request_data = {
            "task_id": "task-123",
            "code": "print('hello')",
            "language": "invalid_language"
        }
        
        response = client.post(
            "/api/v1/submissions",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    @patch("src.adapters.api.routers.submissions.PostgresSubmissionRepository")
    def test_list_submissions(self, mock_repo_class, client, auth_headers):
        """Test listing submissions."""
        mock_repo = AsyncMock()
        mock_repo.get_user_submissions.return_value = []
        mock_repo.get_submission_count.return_value = 0
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/submissions", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "submissions" in data
        assert "total" in data


class TestProgressEndpoints:
    """Tests for progress tracking endpoints."""
    
    @patch("src.adapters.api.routers.progress.PostgresCurriculumRepository")
    @patch("src.adapters.api.routers.progress.PostgresSubmissionRepository")
    def test_get_progress_summary(
        self, mock_submission_repo_class, mock_curriculum_repo_class,
        client, auth_headers, mock_learning_plan
    ):
        """Test getting progress summary."""
        mock_curriculum_repo = AsyncMock()
        mock_curriculum_repo.get_active_plan.return_value = mock_learning_plan
        mock_curriculum_repo_class.return_value = mock_curriculum_repo
        
        mock_submission_repo = AsyncMock()
        mock_submission_repo.get_user_progress_summary.return_value = {
            "completed_tasks": 5,
            "completed_modules": 1,
            "total_time_minutes": 120,
            "average_score": 85.0
        }
        mock_submission_repo_class.return_value = mock_submission_repo
        
        response = client.get("/api/v1/progress", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "overall_progress" in data
        assert "total_tasks" in data
        assert "completed_tasks" in data
    
    @patch("src.adapters.api.routers.progress.PostgresCurriculumRepository")
    @patch("src.adapters.api.routers.progress.PostgresSubmissionRepository")
    def test_get_progress_no_plan(
        self, mock_submission_repo_class, mock_curriculum_repo_class,
        client, auth_headers
    ):
        """Test getting progress when no plan exists."""
        mock_curriculum_repo = AsyncMock()
        mock_curriculum_repo.get_active_plan.return_value = None
        mock_curriculum_repo_class.return_value = mock_curriculum_repo
        
        mock_submission_repo = AsyncMock()
        mock_submission_repo_class.return_value = mock_submission_repo
        
        response = client.get("/api/v1/progress", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_active_plan"] is False
    
    @patch("src.adapters.api.routers.progress.PostgresCurriculumRepository")
    @patch("src.adapters.api.routers.progress.PostgresSubmissionRepository")
    def test_get_detailed_progress(
        self, mock_submission_repo_class, mock_curriculum_repo_class,
        client, auth_headers, mock_learning_plan
    ):
        """Test getting detailed progress."""
        mock_curriculum_repo = AsyncMock()
        mock_curriculum_repo.get_active_plan.return_value = mock_learning_plan
        mock_curriculum_repo_class.return_value = mock_curriculum_repo
        
        mock_submission_repo = AsyncMock()
        mock_submission_repo.get_user_progress_summary.return_value = {
            "completed_tasks": 5,
            "completed_modules": 1,
            "total_time_minutes": 120,
            "average_score": 85.0
        }
        mock_submission_repo.get_user_submissions.return_value = []
        mock_submission_repo_class.return_value = mock_submission_repo
        
        response = client.get("/api/v1/progress/detailed", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "modules" in data
        assert "recommendations" in data
    
    @patch("src.adapters.api.routers.progress.PostgresSubmissionRepository")
    def test_get_progress_stats(self, mock_repo_class, client, auth_headers):
        """Test getting progress statistics."""
        mock_repo = AsyncMock()
        mock_repo.get_user_progress_summary.return_value = {
            "total_time_minutes": 300,
            "tasks_this_week": 10,
            "tasks_this_month": 25,
            "days_active": 7,
            "total_tasks": 30,
            "completed_tasks": 15
        }
        mock_repo_class.return_value = mock_repo
        
        response = client.get("/api/v1/progress/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_learning_hours" in data
        assert "completion_rate" in data


class TestAPIDocumentation:
    """Tests for API documentation."""
    
    def test_openapi_schema_available(self, client):
        """Test that OpenAPI schema is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema
    
    def test_docs_endpoint_available(self, client):
        """Test that docs endpoint is available in non-production."""
        response = client.get("/docs")
        # Should redirect or return HTML
        assert response.status_code in [200, 307]
    
    def test_redoc_endpoint_available(self, client):
        """Test that ReDoc endpoint is available in non-production."""
        response = client.get("/redoc")
        assert response.status_code in [200, 307]


class TestErrorHandling:
    """Tests for API error handling."""
    
    def test_invalid_json(self, client, auth_headers):
        """Test handling of invalid JSON."""
        response = client.post(
            "/api/v1/goals",
            content="invalid json",
            headers={**auth_headers, "Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client, auth_headers):
        """Test handling of missing required fields."""
        response = client.post(
            "/api/v1/goals",
            json={},  # Missing required fields
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_unauthorized_access(self, client):
        """Test unauthorized access to protected endpoints."""
        response = client.get("/api/v1/curriculum")
        assert response.status_code == 401


class TestPagination:
    """Tests for pagination functionality."""
    
    @patch("src.adapters.api.routers.tasks.PostgresCurriculumRepository")
    def test_pagination_params(self, mock_repo_class, client, auth_headers, mock_learning_plan):
        """Test pagination parameters."""
        mock_repo = AsyncMock()
        mock_repo.get_active_plan.return_value = mock_learning_plan
        mock_repo_class.return_value = mock_repo
        
        response = client.get(
            "/api/v1/tasks?page=1&page_size=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10
    
    def test_invalid_pagination(self, client, auth_headers):
        """Test invalid pagination parameters."""
        response = client.get(
            "/api/v1/tasks?page=0",  # Invalid page number
            headers=auth_headers
        )
        assert response.status_code == 400
    
    def test_page_size_limit(self, client, auth_headers):
        """Test page size limit."""
        response = client.get(
            "/api/v1/tasks?page_size=200",  # Exceeds limit
            headers=auth_headers
        )
        assert response.status_code == 400
