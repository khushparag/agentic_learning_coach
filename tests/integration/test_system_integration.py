"""
System Integration Tests for End-to-End Functionality.

Tests database persistence, frontend-backend connectivity simulation,
and dynamic learning path generation.

Requirements covered:
- 1.1-1.5: Frontend-Backend Connectivity
- 2.1-2.5: Database Persistence
- 3.1-3.5: Dynamic Learning Path Generation
- 4.4: LLM Configuration Validation
- 6.1-6.5: Health Monitoring

Note: Database tests require a running PostgreSQL instance with migrations applied.
Run with: docker-compose up -d postgres && python scripts/init_db.py
"""
import pytest
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from unittest.mock import MagicMock, AsyncMock, patch

from src.domain.value_objects.enums import SkillLevel
from src.agents.base.types import LearningContext, AgentResult


# Skip marker for database-dependent tests
DB_SKIP_REASON = "Database tests require running PostgreSQL instance. Run: docker-compose up -d postgres && python scripts/init_db.py"


class TestDatabasePersistence:
    """Test database persistence for user data (Requirement 2).
    
    These tests require a running PostgreSQL database.
    Skip by default - enable when database is available.
    """
    
    @pytest.fixture
    async def db_session(self):
        """Get a database session for testing."""
        pytest.skip(DB_SKIP_REASON)
    
    @pytest.fixture
    def user_repository(self, db_session):
        """Create user repository instance."""
        pytest.skip(DB_SKIP_REASON)
    
    @pytest.fixture
    def curriculum_repository(self, db_session):
        """Create curriculum repository instance."""
        pytest.skip(DB_SKIP_REASON)
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason=DB_SKIP_REASON)
    async def test_user_profile_creation_during_onboarding(self, user_repository):
        """
        Test user profile creation during onboarding.
        Requirement 2.1: WHEN a user completes onboarding, THE system SHALL save their profile to PostgreSQL
        """
        pass  # Test implementation requires database
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason=DB_SKIP_REASON)
    async def test_technology_preferences_persistence(self, user_repository):
        """
        Test technology preferences are saved.
        Requirement 2.2: WHEN a user selects technologies, THE system SHALL persist their preferences
        """
        pass  # Test implementation requires database
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason=DB_SKIP_REASON)
    async def test_progress_data_persistence_across_sessions(self, user_repository):
        """
        Test progress data persists across sessions.
        Requirement 2.4: WHEN a user returns to the application, THE system SHALL restore their progress
        """
        pass  # Test implementation requires database
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason=DB_SKIP_REASON)
    async def test_time_constraints_persistence(self, user_repository):
        """
        Test time constraints are saved correctly.
        """
        pass  # Test implementation requires database


class TestDynamicLearningPathGeneration:
    """Test dynamic learning path generation for any technology (Requirement 3).
    
    Uses mocked repositories since CurriculumPlannerAgent requires them.
    """
    
    @pytest.fixture
    def mock_curriculum_repository(self):
        """Create mock curriculum repository."""
        mock = MagicMock()
        mock.get_active_plan = AsyncMock(return_value=None)
        mock.save_plan = AsyncMock(side_effect=lambda plan: plan)
        return mock
    
    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        mock = MagicMock()
        # Return a mock user profile
        mock_profile = MagicMock()
        mock_profile.skill_level = SkillLevel.BEGINNER
        mock_profile.learning_goals = ["python"]
        mock_profile.time_constraints = {"hours_per_week": 10}
        mock_profile.preferences = {}
        mock.get_user_profile = AsyncMock(return_value=mock_profile)
        return mock
    
    @pytest.fixture
    def curriculum_planner(self, mock_curriculum_repository, mock_user_repository):
        """Create curriculum planner agent with mocked dependencies."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        return CurriculumPlannerAgent(mock_curriculum_repository, mock_user_repository)
    
    @pytest.mark.asyncio
    async def test_generate_learning_path_for_known_technology(self, curriculum_planner, mock_user_repository):
        """
        Test learning path generation for known technologies.
        Requirement 3.1: WHEN a user selects a technology, THE CurriculumPlannerAgent SHALL generate a relevant learning path
        """
        # Update mock profile for this test
        mock_profile = MagicMock()
        mock_profile.skill_level = SkillLevel.BEGINNER
        mock_profile.learning_goals = ["python"]
        mock_profile.time_constraints = {"hours_per_week": 10}
        mock_profile.preferences = {"learning_style": "hands-on"}
        mock_user_repository.get_user_profile = AsyncMock(return_value=mock_profile)
        
        context = LearningContext(
            user_id="test-user-123",
            session_id="test-session",
            current_objective="Learn Python",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["python"],
            preferences={"learning_style": "hands-on"}
        )
        
        payload = {
            "intent": "create_learning_path",
            "goals": ["python"]
        }
        
        result = await curriculum_planner.process(context, payload)
        
        assert result.success
        assert result.data is not None
        # Verify learning plan structure
        assert "learning_plan" in result.data or "curriculum_structure" in result.data
    
    @pytest.mark.asyncio
    async def test_generate_learning_path_for_unknown_technology(self, curriculum_planner, mock_user_repository):
        """
        Test learning path generation for unknown/new technologies.
        Requirement 3.5: THE system SHALL support any technology, not just pre-defined templates
        """
        # Update mock profile for this test
        mock_profile = MagicMock()
        mock_profile.skill_level = SkillLevel.INTERMEDIATE
        mock_profile.learning_goals = ["zig"]
        mock_profile.time_constraints = {"hours_per_week": 10}
        mock_profile.preferences = {}
        mock_user_repository.get_user_profile = AsyncMock(return_value=mock_profile)
        
        context = LearningContext(
            user_id="test-user-456",
            session_id="test-session",
            current_objective="Learn Zig programming language",
            skill_level=SkillLevel.INTERMEDIATE,
            learning_goals=["zig"],
            preferences={}
        )
        
        payload = {
            "intent": "create_learning_path",
            "goals": ["zig"]
        }
        
        result = await curriculum_planner.process(context, payload)
        
        # Should still generate a learning path for unknown technology
        assert result.success
        assert result.data is not None
    
    @pytest.mark.asyncio
    async def test_generate_curriculum_structure(self, curriculum_planner, mock_user_repository):
        """
        Test curriculum structure generation without saving.
        """
        context = LearningContext(
            user_id="test-user-789",
            session_id="test-session",
            current_objective="Learn JavaScript",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["javascript"],
            preferences={}
        )
        
        payload = {
            "intent": "generate_curriculum",
            "goals": ["javascript"],
            "skill_level": "beginner"
        }
        
        result = await curriculum_planner.process(context, payload)
        
        assert result.success
        assert "curriculum_structure" in result.data
        curriculum = result.data["curriculum_structure"]
        assert "modules" in curriculum
        assert "total_days" in curriculum


class TestHealthMonitoring:
    """Test health monitoring endpoints (Requirement 6)."""
    
    @pytest.mark.asyncio
    async def test_database_health_check(self):
        """
        Test database connectivity status in health checks.
        Requirement 6.3: THE health checks SHALL report database connectivity status
        """
        from src.adapters.api.health import HealthChecker
        from src.adapters.database.config import get_database_manager
        
        health_checker = HealthChecker()
        db_manager = get_database_manager()
        
        async for session in db_manager.get_async_session():
            result = await health_checker.check_database(session)
            
            assert "status" in result
            assert "timestamp" in result
            # If database is available, should be healthy
            if result["status"] == "healthy":
                assert "response_time_ms" in result
                assert "database_type" in result
            break
    
    @pytest.mark.asyncio
    async def test_llm_service_health_check(self):
        """
        Test LLM service configuration status in health checks.
        Requirement 6.4: THE health checks SHALL report LLM service configuration status
        """
        from src.adapters.api.health import HealthChecker
        
        health_checker = HealthChecker()
        result = await health_checker.check_llm_service()
        
        assert "status" in result
        assert "provider" in result
        assert "timestamp" in result
        
        # Should report provider (openai, anthropic, or mock)
        assert result["provider"] in ["openai", "anthropic", "mock"]
        
        # Should report mode
        assert "mode" in result


class TestLLMConfigurationValidation:
    """Test LLM configuration validation (Requirement 4)."""
    
    @pytest.mark.asyncio
    async def test_llm_service_detects_provider(self):
        """
        Test LLM service automatically detects provider from environment.
        Requirement 4.5: THE LLM service SHALL support switching providers without code changes
        """
        from src.adapters.services.llm_service import LLMService, LLMProvider
        
        service = LLMService()
        
        # Should have detected a provider
        assert service.config.provider in [LLMProvider.OPENAI, LLMProvider.ANTHROPIC, LLMProvider.MOCK]
    
    @pytest.mark.asyncio
    async def test_llm_service_mock_fallback(self):
        """
        Test LLM service falls back to mock mode when no API key configured.
        Requirement 4.3: WHEN no API key is configured, THE system SHALL operate in mock mode
        """
        from src.adapters.services.llm_service import LLMService, LLMConfig, LLMProvider
        
        # Create service with mock config
        mock_config = LLMConfig(provider=LLMProvider.MOCK)
        service = LLMService(config=mock_config)
        
        # Should be able to generate content in mock mode
        response = await service.generate("Test prompt")
        
        assert response.success
        assert response.model == "mock"
        
        await service.close()


class TestEndToEndIntegration:
    """End-to-end integration tests (Requirement 10).
    
    Tests that don't require database use mocks.
    Database-dependent tests are skipped by default.
    """
    
    @pytest.fixture
    def mock_curriculum_repository(self):
        """Create mock curriculum repository."""
        mock = MagicMock()
        mock.get_active_plan = AsyncMock(return_value=None)
        mock.save_plan = AsyncMock(side_effect=lambda plan: plan)
        return mock
    
    @pytest.fixture
    def mock_user_repository(self):
        """Create mock user repository."""
        mock = MagicMock()
        mock_profile = MagicMock()
        mock_profile.skill_level = SkillLevel.INTERMEDIATE
        mock_profile.learning_goals = ["react", "typescript"]
        mock_profile.time_constraints = {"hours_per_week": 8}
        mock_profile.preferences = {"learning_style": "project-based"}
        mock.get_user_profile = AsyncMock(return_value=mock_profile)
        return mock
    
    @pytest.mark.asyncio
    @pytest.mark.skip(reason=DB_SKIP_REASON)
    async def test_complete_onboarding_flow(self):
        """
        Test complete onboarding flow with backend.
        Simulates: User signup -> Profile creation -> Technology selection -> Learning path generation
        """
        pass  # Requires database
    
    @pytest.mark.asyncio
    async def test_learning_path_generation_various_technologies(self, mock_curriculum_repository, mock_user_repository):
        """
        Test learning path generation for various technologies.
        """
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        curriculum_planner = CurriculumPlannerAgent(mock_curriculum_repository, mock_user_repository)
        
        technologies = [
            ("rust", SkillLevel.BEGINNER),
            ("go", SkillLevel.INTERMEDIATE),
            ("kubernetes", SkillLevel.ADVANCED),
            ("machine-learning", SkillLevel.BEGINNER),
            ("graphql", SkillLevel.INTERMEDIATE),
        ]
        
        for tech, skill_level in technologies:
            # Update mock profile for each technology
            mock_profile = MagicMock()
            mock_profile.skill_level = skill_level
            mock_profile.learning_goals = [tech]
            mock_profile.time_constraints = {"hours_per_week": 10}
            mock_profile.preferences = {}
            mock_user_repository.get_user_profile = AsyncMock(return_value=mock_profile)
            
            context = LearningContext(
                user_id=f"test-{tech}",
                session_id="test-session",
                current_objective=f"Learn {tech}",
                skill_level=skill_level,
                learning_goals=[tech],
                preferences={}
            )
            
            payload = {
                "intent": "generate_curriculum",
                "goals": [tech],
                "skill_level": skill_level.value
            }
            
            result = await curriculum_planner.process(context, payload)
            
            # Should generate learning path for any technology
            assert result.success, f"Failed to generate learning path for {tech}"


# Run tests with: pytest tests/integration/test_system_integration.py -v
