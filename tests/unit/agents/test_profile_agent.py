"""
Unit tests for ProfileAgent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from src.agents.profile_agent import ProfileAgent
from src.agents.base.types import LearningContext, AgentResult, AgentType
from src.agents.base.exceptions import ValidationError, AgentProcessingError
from src.domain.entities.user_profile import UserProfile
from src.domain.value_objects.enums import SkillLevel


class TestProfileAgent:
    """Test cases for ProfileAgent."""
    
    @pytest.fixture
    def mock_user_repository(self):
        """Create a mock user repository."""
        return AsyncMock()
    
    @pytest.fixture
    def profile_agent(self, mock_user_repository):
        """Create a ProfileAgent instance with mocked dependencies."""
        return ProfileAgent(mock_user_repository)
    
    @pytest.fixture
    def sample_context(self):
        """Create a sample learning context."""
        return LearningContext(
            user_id="test-user-123",
            session_id="session-456",
            current_objective="skill_assessment",
            correlation_id="corr-789"
        )
    
    @pytest.fixture
    def sample_user_profile(self):
        """Create a sample user profile."""
        return UserProfile(
            user_id="test-user-123",
            skill_level=SkillLevel.INTERMEDIATE,
            learning_goals=["javascript", "react"],
            time_constraints={"hours_per_week": 10},
            preferences={"learning_style": "hands_on"}
        )
    
    def test_get_supported_intents(self, profile_agent):
        """Test that ProfileAgent returns correct supported intents."""
        intents = profile_agent.get_supported_intents()
        
        expected_intents = [
            "assess_skill_level",
            "update_goals", 
            "set_constraints",
            "create_profile",
            "update_profile",
            "get_profile",
            "parse_timeframe"
        ]
        
        assert all(intent in intents for intent in expected_intents)
        assert len(intents) == len(expected_intents)
    
    @pytest.mark.asyncio
    async def test_assess_skill_level_returns_questions(self, profile_agent, sample_context):
        """Test skill assessment returns diagnostic questions when no responses provided."""
        payload = {
            "intent": "assess_skill_level",
            "domain": "javascript"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "questions" in result.data
        assert "domain" in result.data
        assert result.data["domain"] == "javascript"
        assert "submit_assessment_responses" in result.next_actions
    
    @pytest.mark.asyncio
    async def test_assess_skill_level_evaluates_responses(self, profile_agent, sample_context, mock_user_repository):
        """Test skill assessment evaluates responses and determines skill level."""
        # Mock repository to return None (no existing profile)
        mock_user_repository.get_user_profile.return_value = None
        
        payload = {
            "intent": "assess_skill_level",
            "domain": "javascript",
            "responses": [
                {
                    "question_id": "js_basics_1",
                    "selected": 1,  # Correct answer
                    "answer": "true, false"
                },
                {
                    "question_id": "js_basics_2",
                    "answer": "function add(a, b) { return a + b; }"
                }
            ]
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "skill_level" in result.data
        assert "assessment_summary" in result.data
        assert "next_steps" in result.data
        assert result.data["domain"] == "javascript"
    
    @pytest.mark.asyncio
    async def test_update_goals_parses_natural_language(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test goal updating with natural language input."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        mock_user_repository.update_user_profile.return_value = sample_user_profile
        
        payload = {
            "intent": "update_goals",
            "goals": "I want to learn React and Node.js for web development"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "goals" in result.data
        assert "goal_categories" in result.data
        assert "estimated_timeline" in result.data
        
        # Verify repository was called
        mock_user_repository.update_user_profile.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_goals_with_list_input(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test goal updating with list input."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        mock_user_repository.update_user_profile.return_value = sample_user_profile
        
        payload = {
            "intent": "update_goals",
            "goals": ["javascript", "react", "node.js"]
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "goals" in result.data
        assert len(result.data["goals"]) <= 10  # Should limit to 10 goals
    
    @pytest.mark.asyncio
    async def test_update_goals_no_profile_error(self, profile_agent, sample_context, mock_user_repository):
        """Test goal updating fails when no profile exists."""
        mock_user_repository.get_user_profile.return_value = None
        
        payload = {
            "intent": "update_goals",
            "goals": ["javascript"]
        }
        
        with pytest.raises(AgentProcessingError):
            await profile_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_set_constraints_parses_time_input(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test time constraint parsing from natural language."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        mock_user_repository.update_user_profile.return_value = sample_user_profile
        
        payload = {
            "intent": "set_constraints",
            "constraints": "I can study 10 hours per week, mostly in the evenings"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "time_constraints" in result.data
        assert "weekly_schedule" in result.data
        assert "realistic_goals" in result.data
        
        constraints = result.data["time_constraints"]
        assert constraints["hours_per_week"] == 10
        assert "evening" in constraints.get("preferred_times", [])
    
    @pytest.mark.asyncio
    async def test_create_profile_success(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test successful profile creation."""
        mock_user_repository.create_user.return_value = sample_user_profile
        
        payload = {
            "intent": "create_profile",
            "email": "test@example.com",
            "name": "Test User"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "profile" in result.data
        assert "next_steps" in result.data
        assert "assess_skill_level" in result.next_actions
        
        mock_user_repository.create_user.assert_called_once_with("test@example.com", "Test User")
    
    @pytest.mark.asyncio
    async def test_create_profile_missing_data(self, profile_agent, sample_context):
        """Test profile creation fails with missing data."""
        payload = {
            "intent": "create_profile",
            "email": "test@example.com"
            # Missing name
        }
        
        with pytest.raises(AgentProcessingError):
            await profile_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_update_profile_success(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test successful profile update."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        mock_user_repository.update_user_profile.return_value = sample_user_profile
        
        payload = {
            "intent": "update_profile",
            "preferences": {"learning_style": "visual"},
            "skill_level": "advanced"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "profile" in result.data
        
        mock_user_repository.update_user_profile.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_profile_exists(self, profile_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test getting existing profile."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        
        payload = {"intent": "get_profile"}
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["exists"] is True
        assert "profile" in result.data
        assert "completeness" in result.data
    
    @pytest.mark.asyncio
    async def test_get_profile_not_exists(self, profile_agent, sample_context, mock_user_repository):
        """Test getting non-existent profile."""
        mock_user_repository.get_user_profile.return_value = None
        
        payload = {"intent": "get_profile"}
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["exists"] is False
        assert result.data["profile"] is None
        assert "create_profile" in result.next_actions
    
    @pytest.mark.asyncio
    async def test_parse_timeframe_success(self, profile_agent, sample_context):
        """Test timeframe parsing."""
        payload = {
            "intent": "parse_timeframe",
            "timeframe": "5 hours per week in the evenings"
        }
        
        result = await profile_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "original_text" in result.data
        assert "parsed_constraints" in result.data
        assert "confidence" in result.data
        
        constraints = result.data["parsed_constraints"]
        assert constraints["hours_per_week"] == 5
    
    @pytest.mark.asyncio
    async def test_parse_timeframe_missing_input(self, profile_agent, sample_context):
        """Test timeframe parsing with missing input."""
        payload = {"intent": "parse_timeframe"}
        
        with pytest.raises(AgentProcessingError):
            await profile_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, profile_agent, sample_context):
        """Test handling of unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        with pytest.raises(AgentProcessingError):
            await profile_agent.process(sample_context, payload)
    
    def test_evaluate_skill_responses_beginner(self, profile_agent):
        """Test skill evaluation for beginner level responses."""
        responses = [
            {
                "question_id": "js_basics_1",
                "selected": 2,  # Wrong answer
                "answer": "false, false"
            }
        ]
        
        skill_level = profile_agent._evaluate_skill_responses(responses, "javascript")
        assert skill_level == SkillLevel.BEGINNER
    
    def test_evaluate_skill_responses_intermediate(self, profile_agent):
        """Test skill evaluation for intermediate level responses."""
        responses = [
            {
                "question_id": "js_basics_1",
                "selected": 1,  # Correct answer
                "answer": "true, false"
            },
            {
                "question_id": "js_intermediate_1",
                "answer": "Good explanation of array methods"
            }
        ]
        
        skill_level = profile_agent._evaluate_skill_responses(responses, "javascript")
        # Should be at least beginner, possibly intermediate depending on scoring
        assert skill_level in [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE]
    
    def test_parse_learning_goals_string_input(self, profile_agent):
        """Test parsing goals from string input."""
        goal_input = "I want to learn React and Node.js for web development"
        goals = profile_agent._parse_learning_goals(goal_input)
        
        assert isinstance(goals, list)
        assert len(goals) > 0
        # Should extract web development related goals (html, css, javascript are first 3)
        assert any(goal in ["html", "css", "javascript", "react", "node.js"] for goal in goals)
    
    def test_parse_learning_goals_list_input(self, profile_agent):
        """Test parsing goals from list input."""
        goal_input = ["JavaScript", "React", "Node.js"]
        goals = profile_agent._parse_learning_goals(goal_input)
        
        assert goals == ["javascript", "react", "node.js"]
    
    def test_validate_goals(self, profile_agent):
        """Test goal validation and normalization."""
        goals = ["js", "react.js", "  python  ", "", "machine learning"]
        validated = profile_agent._validate_goals(goals)
        
        assert "javascript" in validated  # js -> javascript
        assert "react" in validated  # react.js -> react
        assert "python" in validated  # trimmed
        assert "" not in validated  # empty removed
        assert len(validated) <= 10  # limited to 10
    
    def test_parse_time_constraints_hours_per_week(self, profile_agent):
        """Test parsing hours per week from text."""
        text = "I can study 8 hours per week"
        constraints = profile_agent._parse_time_constraints(text)
        
        assert constraints["hours_per_week"] == 8
    
    def test_parse_time_constraints_minutes_per_day(self, profile_agent):
        """Test parsing minutes per day from text."""
        text = "I have 90 minutes per day for learning"
        constraints = profile_agent._parse_time_constraints(text)
        
        # 90 minutes * 7 days / 60 minutes = 10.5 hours per week
        assert constraints["hours_per_week"] == 10.5
    
    def test_parse_time_constraints_preferred_times(self, profile_agent):
        """Test parsing preferred times from text."""
        text = "I prefer studying in the evening after work"
        constraints = profile_agent._parse_time_constraints(text)
        
        assert "evening" in constraints["preferred_times"]
    
    def test_validate_time_constraints(self, profile_agent):
        """Test time constraint validation."""
        constraints = {
            "hours_per_week": 50,  # Too high
            "session_length_minutes": 200,  # Too high
            "preferred_times": ["morning", "invalid_time"],
            "available_days": ["monday", "invalid_day"]
        }
        
        validated = profile_agent._validate_time_constraints(constraints)
        
        assert validated["hours_per_week"] == 40  # Capped at 40
        assert validated["session_length_minutes"] == 180  # Capped at 180
        assert "invalid_time" not in validated["preferred_times"]
        assert "invalid_day" not in validated["available_days"]
    
    def test_generate_weekly_schedule(self, profile_agent):
        """Test weekly schedule generation."""
        constraints = {
            "hours_per_week": 6,
            "available_days": ["monday", "wednesday", "friday"],
            "session_length_minutes": 120,
            "preferred_times": ["evening"]
        }
        
        schedule = profile_agent._generate_weekly_schedule(constraints)
        
        assert "weekly_schedule" in schedule
        assert "total_sessions_per_week" in schedule
        assert len(schedule["weekly_schedule"]) <= 3  # Max available days
    
    def test_assess_goal_feasibility_realistic(self, profile_agent):
        """Test goal feasibility assessment for realistic goals."""
        goals = ["javascript", "react"]
        constraints = {"hours_per_week": 10}
        
        assessment = profile_agent._assess_goal_feasibility(goals, constraints)
        
        assert assessment["feasibility"] in ["realistic", "challenging", "ambitious"]
        assert "estimated_completion_weeks" in assessment
        assert "recommended_adjustments" in assessment
    
    def test_assess_profile_completeness_complete(self, profile_agent, sample_user_profile):
        """Test profile completeness assessment for complete profile."""
        completeness = profile_agent._assess_profile_completeness(sample_user_profile)
        
        assert completeness["percentage"] > 0
        assert completeness["status"] in ["complete", "incomplete"]
        assert isinstance(completeness["missing_fields"], list)
    
    def test_assess_profile_completeness_incomplete(self, profile_agent):
        """Test profile completeness assessment for incomplete profile."""
        incomplete_profile = UserProfile(
            user_id="test-user",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["placeholder"],  # Need at least one goal to pass validation
            time_constraints={},  # Empty constraints
            preferences={}  # Empty preferences
        )
        # Clear goals after creation to test incomplete state
        incomplete_profile.learning_goals = []
        
        completeness = profile_agent._assess_profile_completeness(incomplete_profile)
        
        assert completeness["percentage"] < 100
        assert completeness["status"] == "incomplete"
        assert len(completeness["missing_fields"]) > 0
    
    def test_calculate_parsing_confidence(self, profile_agent):
        """Test parsing confidence calculation."""
        original_text = "5 hours per week in the evenings"
        parsed_result = {
            "hours_per_week": 5,
            "preferred_times": ["evening"],
            "available_days": [],
            "session_length_minutes": 60
        }
        
        confidence = profile_agent._calculate_parsing_confidence(original_text, parsed_result)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0  # Should have some confidence with extracted data
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_assess_skill_level(self, profile_agent, sample_context):
        """Test timeout fallback for skill assessment."""
        payload = {"intent": "assess_skill_level"}
        
        result = await profile_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is not None
        assert result.success is True
        assert result.data["fallback"] is True
        assert "questions" in result.data
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_parse_timeframe(self, profile_agent, sample_context):
        """Test timeout fallback for timeframe parsing."""
        payload = {"intent": "parse_timeframe"}
        
        result = await profile_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is not None
        assert result.success is True
        assert result.data["fallback"] is True
        assert "parsed_constraints" in result.data
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_unsupported_intent(self, profile_agent, sample_context):
        """Test timeout fallback for unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        result = await profile_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is None
    
    def test_score_code_response_good_code(self, profile_agent):
        """Test scoring of good code response."""
        code = "function add(a, b) { return a + b; }"
        question = {
            "concepts": ["functions", "parameters", "return"]
        }
        
        score = profile_agent._score_code_response(code, question)
        
        assert 0.0 <= score <= 1.0
        assert score > 0.5  # Should score well for good code
    
    def test_score_code_response_empty_code(self, profile_agent):
        """Test scoring of empty code response."""
        code = ""
        question = {"concepts": ["functions"]}
        
        score = profile_agent._score_code_response(code, question)
        
        assert score == 0.0
    
    def test_score_explanation_response_good_explanation(self, profile_agent):
        """Test scoring of good explanation response."""
        explanation = "Closures allow functions to access variables from their lexical scope"
        question = {"concepts": ["closures", "scope"]}
        
        score = profile_agent._score_explanation_response(explanation, question)
        
        assert 0.0 <= score <= 1.0
        assert score > 0.0  # Should score for relevant keywords
    
    def test_categorize_goals(self, profile_agent):
        """Test goal categorization."""
        goals = ["javascript", "react", "python", "docker"]
        categories = profile_agent._categorize_goals(goals)
        
        assert isinstance(categories, dict)
        assert "frontend" in categories
        assert "javascript" in categories["frontend"]
        assert "react" in categories["frontend"]
    
    def test_estimate_goal_timeline(self, profile_agent):
        """Test goal timeline estimation."""
        goals = ["javascript", "react"]
        skill_level = SkillLevel.INTERMEDIATE
        
        timeline = profile_agent._estimate_goal_timeline(goals, skill_level)
        
        assert "total_estimated_hours" in timeline
        assert "hours_per_goal" in timeline
        assert "estimated_weeks_at_10h_per_week" in timeline
        assert timeline["total_estimated_hours"] > 0