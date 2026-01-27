"""
Unit tests for the OrchestratorAgent and IntentRouter.

Tests cover:
- Intent classification and routing
- Agent registration and management
- Multi-agent workflow coordination
- Error handling and fallbacks
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from src.agents.orchestrator_agent import (
    OrchestratorAgent,
    AgentRegistry,
    AgentRegistration,
    WorkflowStep,
    WorkflowDefinition
)
from src.agents.intent_router import (
    IntentRouter,
    LearningIntent,
    INTENT_ROUTING,
    IntentClassificationResult
)
from src.agents.base.base_agent import BaseAgent
from src.agents.base.types import AgentType, LearningContext, AgentResult
from src.agents.base.exceptions import ValidationError, AgentProcessingError


class MockSpecialistAgent(BaseAgent):
    """Mock specialist agent for testing."""
    
    def __init__(self, agent_type: AgentType, supported_intents: list[str] = None):
        super().__init__(agent_type)
        self._supported_intents = supported_intents or ["test_intent"]
        self._should_fail = False
        self._response_data = {"processed": True}
        self._call_count = 0
    
    async def process(self, context: LearningContext, payload: dict) -> AgentResult:
        self._call_count += 1
        
        if self._should_fail:
            raise AgentProcessingError("Simulated failure")
        
        return AgentResult.success_result(
            data=self._response_data,
            next_actions=["continue"]
        )
    
    def get_supported_intents(self) -> list[str]:
        return self._supported_intents


class TestIntentRouter:
    """Test cases for IntentRouter."""
    
    @pytest.fixture
    def router(self):
        """Create an intent router instance."""
        return IntentRouter()
    
    def test_classify_intent_skill_assessment(self, router):
        """Test classification of skill assessment intent."""
        result = router.classify_intent("I want to assess my skill level")
        
        assert result.intent == LearningIntent.ASSESS_SKILL_LEVEL
        assert result.target_agent == AgentType.PROFILE
        assert result.confidence > 0
    
    def test_classify_intent_learning_path(self, router):
        """Test classification of learning path intent."""
        result = router.classify_intent("Create a learning path for me")
        
        assert result.intent == LearningIntent.CREATE_LEARNING_PATH
        assert result.target_agent == AgentType.CURRICULUM_PLANNER
    
    def test_classify_intent_exercise_request(self, router):
        """Test classification of exercise request intent."""
        result = router.classify_intent("Give me an exercise to practice")
        
        assert result.intent == LearningIntent.REQUEST_EXERCISE
        assert result.target_agent == AgentType.EXERCISE_GENERATOR
    
    def test_classify_intent_submit_solution(self, router):
        """Test classification of solution submission intent."""
        result = router.classify_intent("Submit my code for review")
        
        assert result.intent == LearningIntent.SUBMIT_SOLUTION
        assert result.target_agent == AgentType.REVIEWER
    
    def test_classify_intent_find_documentation(self, router):
        """Test classification of documentation search intent."""
        result = router.classify_intent("Find documentation about React hooks")
        
        assert result.intent == LearningIntent.FIND_DOCUMENTATION
        assert result.target_agent == AgentType.RESOURCES
    
    def test_classify_intent_check_progress(self, router):
        """Test classification of progress check intent."""
        result = router.classify_intent("Show me my progress")
        
        assert result.intent == LearningIntent.CHECK_PROGRESS
        assert result.target_agent == AgentType.PROGRESS_TRACKER
    
    def test_classify_intent_empty_input(self, router):
        """Test classification with empty input."""
        result = router.classify_intent("")
        
        assert result.intent is None
        assert result.target_agent is None
        assert result.confidence == 0.0
    
    def test_classify_intent_unrecognized_input(self, router):
        """Test classification with unrecognized input."""
        result = router.classify_intent("xyzzy foobar baz")
        
        # Should return None or low confidence
        assert result.confidence < 0.3 or result.intent is None
    
    def test_classify_intent_provides_alternatives(self, router):
        """Test that classification provides alternative intents."""
        result = router.classify_intent("I need help with my learning")
        
        # Should have some alternatives when input is ambiguous
        assert isinstance(result.alternative_intents, list)
    
    def test_route_intent_valid(self, router):
        """Test routing a valid intent."""
        agent_type = router.route_intent(LearningIntent.ASSESS_SKILL_LEVEL)
        
        assert agent_type == AgentType.PROFILE
    
    def test_route_intent_string_valid(self, router):
        """Test routing an intent string."""
        agent_type = router.route_intent_string("assess_skill_level")
        
        assert agent_type == AgentType.PROFILE
    
    def test_route_intent_string_invalid(self, router):
        """Test routing an invalid intent string."""
        agent_type = router.route_intent_string("invalid_intent")
        
        assert agent_type is None
    
    def test_get_intents_for_agent(self, router):
        """Test getting intents for a specific agent."""
        profile_intents = router.get_intents_for_agent(AgentType.PROFILE)
        
        assert LearningIntent.ASSESS_SKILL_LEVEL in profile_intents
        assert LearningIntent.UPDATE_GOALS in profile_intents
        assert LearningIntent.SET_CONSTRAINTS in profile_intents
    
    def test_get_all_intents(self, router):
        """Test getting all available intents."""
        all_intents = router.get_all_intents()
        
        assert len(all_intents) > 0
        assert LearningIntent.ASSESS_SKILL_LEVEL in all_intents
        assert LearningIntent.CREATE_LEARNING_PATH in all_intents
    
    def test_get_intent_description(self, router):
        """Test getting intent descriptions."""
        description = router.get_intent_description(LearningIntent.ASSESS_SKILL_LEVEL)
        
        assert isinstance(description, str)
        assert len(description) > 0


class TestAgentRegistry:
    """Test cases for AgentRegistry."""
    
    @pytest.fixture
    def registry(self):
        """Create an agent registry instance."""
        return AgentRegistry()
    
    @pytest.fixture
    def mock_profile_agent(self):
        """Create a mock profile agent."""
        return MockSpecialistAgent(
            AgentType.PROFILE,
            ["assess_skill_level", "update_goals", "set_constraints"]
        )
    
    @pytest.fixture
    def mock_curriculum_agent(self):
        """Create a mock curriculum agent."""
        return MockSpecialistAgent(
            AgentType.CURRICULUM_PLANNER,
            ["create_learning_path", "adapt_difficulty"]
        )
    
    def test_register_agent(self, registry, mock_profile_agent):
        """Test registering an agent."""
        registry.register(mock_profile_agent)
        
        assert registry.is_registered(AgentType.PROFILE)
        assert registry.get_agent(AgentType.PROFILE) == mock_profile_agent
    
    def test_register_multiple_agents(self, registry, mock_profile_agent, mock_curriculum_agent):
        """Test registering multiple agents."""
        registry.register(mock_profile_agent)
        registry.register(mock_curriculum_agent)
        
        assert registry.is_registered(AgentType.PROFILE)
        assert registry.is_registered(AgentType.CURRICULUM_PLANNER)
        assert len(registry.get_registered_types()) == 2
    
    def test_unregister_agent(self, registry, mock_profile_agent):
        """Test unregistering an agent."""
        registry.register(mock_profile_agent)
        registry.unregister(AgentType.PROFILE)
        
        assert not registry.is_registered(AgentType.PROFILE)
        assert registry.get_agent(AgentType.PROFILE) is None
    
    def test_get_agent_for_intent(self, registry, mock_profile_agent):
        """Test getting agent by intent."""
        registry.register(mock_profile_agent)
        
        agent = registry.get_agent_for_intent("assess_skill_level")
        
        assert agent == mock_profile_agent
    
    def test_get_agent_for_unknown_intent(self, registry, mock_profile_agent):
        """Test getting agent for unknown intent."""
        registry.register(mock_profile_agent)
        
        agent = registry.get_agent_for_intent("unknown_intent")
        
        assert agent is None
    
    def test_get_all_agents(self, registry, mock_profile_agent, mock_curriculum_agent):
        """Test getting all registered agents."""
        registry.register(mock_profile_agent)
        registry.register(mock_curriculum_agent)
        
        agents = registry.get_all_agents()
        
        assert len(agents) == 2
        assert mock_profile_agent in agents
        assert mock_curriculum_agent in agents


class TestOrchestratorAgent:
    """Test cases for OrchestratorAgent."""
    
    @pytest.fixture
    def context(self):
        """Create a test learning context."""
        return LearningContext(
            user_id="test-user-123",
            session_id="test-session-456",
            current_objective="testing",
            skill_level="intermediate"
        )
    
    @pytest.fixture
    def mock_profile_agent(self):
        """Create a mock profile agent."""
        agent = MockSpecialistAgent(
            AgentType.PROFILE,
            ["assess_skill_level", "update_goals", "set_constraints", "get_profile"]
        )
        agent._response_data = {
            "skill_level": "intermediate",
            "assessment_complete": True
        }
        return agent
    
    @pytest.fixture
    def mock_curriculum_agent(self):
        """Create a mock curriculum agent."""
        agent = MockSpecialistAgent(
            AgentType.CURRICULUM_PLANNER,
            ["create_learning_path", "adapt_difficulty", "request_next_topic"]
        )
        agent._response_data = {
            "learning_plan": {"id": "plan-123"},
            "first_topic": "variables"
        }
        return agent
    
    @pytest.fixture
    def mock_exercise_agent(self):
        """Create a mock exercise generator agent."""
        agent = MockSpecialistAgent(
            AgentType.EXERCISE_GENERATOR,
            ["generate_exercise", "request_hint", "create_stretch_exercise", "create_recap_exercise"]
        )
        agent._response_data = {
            "exercise": {"id": "ex-123", "title": "Test Exercise"}
        }
        return agent
    
    @pytest.fixture
    def mock_reviewer_agent(self):
        """Create a mock reviewer agent."""
        agent = MockSpecialistAgent(
            AgentType.REVIEWER,
            ["evaluate_submission", "run_tests", "check_code_quality"]
        )
        agent._response_data = {
            "evaluation": {"passed": True, "score": 85}
        }
        return agent
    
    @pytest.fixture
    def mock_resources_agent(self):
        """Create a mock resources agent."""
        agent = MockSpecialistAgent(
            AgentType.RESOURCES,
            ["search_resources", "find_documentation", "recommend_resources"]
        )
        agent._response_data = {
            "resources": [{"title": "Test Resource"}]
        }
        return agent
    
    @pytest.fixture
    def mock_progress_agent(self):
        """Create a mock progress tracker agent."""
        agent = MockSpecialistAgent(
            AgentType.PROGRESS_TRACKER,
            ["check_progress", "update_progress", "get_recommendations"]
        )
        agent._response_data = {
            "progress": {"completed": 5, "total": 10}
        }
        return agent
    
    @pytest.fixture
    def orchestrator_with_agents(
        self, 
        mock_profile_agent, 
        mock_curriculum_agent,
        mock_exercise_agent,
        mock_reviewer_agent,
        mock_resources_agent,
        mock_progress_agent
    ):
        """Create an orchestrator with all mock agents registered."""
        orchestrator = OrchestratorAgent()
        orchestrator.register_agent(mock_profile_agent)
        orchestrator.register_agent(mock_curriculum_agent)
        orchestrator.register_agent(mock_exercise_agent)
        orchestrator.register_agent(mock_reviewer_agent)
        orchestrator.register_agent(mock_resources_agent)
        orchestrator.register_agent(mock_progress_agent)
        return orchestrator
    
    @pytest.mark.asyncio
    async def test_route_to_profile_agent(self, orchestrator_with_agents, context):
        """Test routing to profile agent."""
        payload = {"intent": "assess_skill_level"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert result.data.get("skill_level") == "intermediate"
    
    @pytest.mark.asyncio
    async def test_route_to_curriculum_agent(self, orchestrator_with_agents, context):
        """Test routing to curriculum planner agent."""
        payload = {"intent": "create_learning_path", "goals": ["python"]}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert "learning_plan" in result.data
    
    @pytest.mark.asyncio
    async def test_route_to_exercise_agent(self, orchestrator_with_agents, context):
        """Test routing to exercise generator agent."""
        payload = {"intent": "generate_exercise", "topic": "variables"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert "exercise" in result.data
    
    @pytest.mark.asyncio
    async def test_route_to_reviewer_agent(self, orchestrator_with_agents, context):
        """Test routing to reviewer agent."""
        payload = {
            "intent": "evaluate_submission",
            "submission": {"code": "print('hello')"},
            "exercise": {"id": "ex-123"}
        }
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert "evaluation" in result.data
    
    @pytest.mark.asyncio
    async def test_route_to_resources_agent(self, orchestrator_with_agents, context):
        """Test routing to resources agent."""
        payload = {"intent": "search_resources", "query": "python basics"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert "resources" in result.data
    
    @pytest.mark.asyncio
    async def test_route_to_progress_agent(self, orchestrator_with_agents, context):
        """Test routing to progress tracker agent."""
        payload = {"intent": "check_progress"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert "progress" in result.data
    
    @pytest.mark.asyncio
    async def test_natural_language_routing(self, orchestrator_with_agents, context):
        """Test routing from natural language input."""
        payload = {"message": "I want to assess my skill level"}
        
        # Natural language routing should work when intent is classified
        result = await orchestrator_with_agents.process(context, payload)
        
        # Should either succeed or ask for clarification
        assert result.success is True or result.data.get("needs_clarification") is True
    
    @pytest.mark.asyncio
    async def test_unknown_intent_error(self, orchestrator_with_agents, context):
        """Test error handling for unknown intent."""
        payload = {"intent": "completely_unknown_intent"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "NO_AGENT_FOR_INTENT" in result.error_code or "VALIDATION_ERROR" in result.error_code
    
    @pytest.mark.asyncio
    async def test_unregistered_agent_error(self, context):
        """Test error when target agent is not registered."""
        orchestrator = OrchestratorAgent()
        # Don't register any agents
        
        payload = {"intent": "assess_skill_level"}
        
        result = await orchestrator.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "AGENT_NOT_REGISTERED" in result.error_code
    
    @pytest.mark.asyncio
    async def test_specialist_failure_handling(self, orchestrator_with_agents, context, mock_profile_agent):
        """Test handling of specialist agent failure."""
        mock_profile_agent._should_fail = True
        
        payload = {"intent": "assess_skill_level"}
        
        result = await orchestrator_with_agents.execute_with_protection(context, payload)
        
        assert result.success is False
    
    def test_register_agent(self, mock_profile_agent):
        """Test agent registration."""
        orchestrator = OrchestratorAgent()
        orchestrator.register_agent(mock_profile_agent)
        
        assert AgentType.PROFILE in orchestrator.get_registered_agents()
    
    def test_unregister_agent(self, mock_profile_agent):
        """Test agent unregistration."""
        orchestrator = OrchestratorAgent()
        orchestrator.register_agent(mock_profile_agent)
        orchestrator.unregister_agent(AgentType.PROFILE)
        
        assert AgentType.PROFILE not in orchestrator.get_registered_agents()
    
    def test_get_available_workflows(self):
        """Test getting available workflows."""
        orchestrator = OrchestratorAgent()
        workflows = orchestrator.get_available_workflows()
        
        assert "new_learner_onboarding" in workflows
        assert "exercise_submission" in workflows
        assert "resource_discovery" in workflows
    
    def test_get_workflow_info(self):
        """Test getting workflow information."""
        orchestrator = OrchestratorAgent()
        info = orchestrator.get_workflow_info("new_learner_onboarding")
        
        assert info is not None
        assert info["name"] == "new_learner_onboarding"
        assert "steps" in info
        assert len(info["steps"]) > 0
    
    def test_get_workflow_info_unknown(self):
        """Test getting info for unknown workflow."""
        orchestrator = OrchestratorAgent()
        info = orchestrator.get_workflow_info("unknown_workflow")
        
        assert info is None
    
    def test_health_status(self, orchestrator_with_agents):
        """Test health status reporting."""
        status = orchestrator_with_agents.get_health_status()
        
        assert status["agent_type"] == "orchestrator"
        assert "registered_agents" in status
        assert "available_workflows" in status
        assert len(status["registered_agents"]) > 0
    
    def test_get_supported_intents(self):
        """Test getting supported intents."""
        orchestrator = OrchestratorAgent()
        intents = orchestrator.get_supported_intents()
        
        assert len(intents) > 0
        assert "assess_skill_level" in intents
        assert "create_learning_path" in intents


class TestWorkflowExecution:
    """Test cases for multi-agent workflow execution."""
    
    @pytest.fixture
    def context(self):
        """Create a test learning context."""
        return LearningContext(
            user_id="test-user-123",
            session_id="test-session-456",
            current_objective="testing",
            skill_level="intermediate"
        )
    
    @pytest.fixture
    def orchestrator_with_mock_agents(self):
        """Create orchestrator with mock agents for workflow testing."""
        orchestrator = OrchestratorAgent()
        
        # Create mock agents
        profile_agent = MockSpecialistAgent(
            AgentType.PROFILE,
            ["assess_skill_level", "update_goals", "set_constraints"]
        )
        profile_agent._response_data = {"skill_level": "beginner"}
        
        curriculum_agent = MockSpecialistAgent(
            AgentType.CURRICULUM_PLANNER,
            ["create_learning_path", "adapt_difficulty"]
        )
        curriculum_agent._response_data = {"learning_plan": {"id": "plan-1"}, "first_topic": "basics"}
        
        exercise_agent = MockSpecialistAgent(
            AgentType.EXERCISE_GENERATOR,
            ["generate_exercise", "create_recap_exercise", "create_stretch_exercise"]
        )
        exercise_agent._response_data = {"exercise": {"id": "ex-1"}}
        
        reviewer_agent = MockSpecialistAgent(
            AgentType.REVIEWER,
            ["evaluate_submission"]
        )
        reviewer_agent._response_data = {"evaluation": {"passed": True}}
        
        progress_agent = MockSpecialistAgent(
            AgentType.PROGRESS_TRACKER,
            ["update_progress", "check_progress"]
        )
        progress_agent._response_data = {"progress_updated": True}
        
        resources_agent = MockSpecialistAgent(
            AgentType.RESOURCES,
            ["search_resources", "verify_resource_quality"]
        )
        resources_agent._response_data = {"resources": []}
        
        orchestrator.register_agent(profile_agent)
        orchestrator.register_agent(curriculum_agent)
        orchestrator.register_agent(exercise_agent)
        orchestrator.register_agent(reviewer_agent)
        orchestrator.register_agent(progress_agent)
        orchestrator.register_agent(resources_agent)
        
        return orchestrator
    
    @pytest.mark.asyncio
    async def test_onboarding_workflow(self, orchestrator_with_mock_agents, context):
        """Test the new learner onboarding workflow."""
        payload = {
            "intent": "assess_skill_level",
            "workflow": "new_learner_onboarding",
            "goals": ["python"],
            "constraints": {"hours_per_week": 5}
        }
        
        result = await orchestrator_with_mock_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert result.data["workflow_name"] == "new_learner_onboarding"
        assert result.data["steps_completed"] > 0
    
    @pytest.mark.asyncio
    async def test_resource_discovery_workflow(self, orchestrator_with_mock_agents, context):
        """Test the resource discovery workflow."""
        payload = {
            "intent": "search_resources",
            "workflow": "resource_discovery",
            "query": "python basics"
        }
        
        result = await orchestrator_with_mock_agents.execute_with_protection(context, payload)
        
        assert result.success is True
        assert result.data["workflow_name"] == "resource_discovery"
    
    @pytest.mark.asyncio
    async def test_unknown_workflow_error(self, orchestrator_with_mock_agents, context):
        """Test error handling for unknown workflow."""
        payload = {
            "intent": "assess_skill_level",  # Use a valid intent
            "workflow": "unknown_workflow"
        }
        
        result = await orchestrator_with_mock_agents.process(context, payload)
        
        assert result.success is False
        assert "UNKNOWN_WORKFLOW" in result.error_code


class TestIntentRoutingMapping:
    """Test cases for intent to agent mapping."""
    
    def test_all_intents_have_routing(self):
        """Test that all intents have a routing defined."""
        for intent in LearningIntent:
            assert intent in INTENT_ROUTING, f"Intent {intent} has no routing defined"
    
    def test_profile_intents_route_to_profile_agent(self):
        """Test profile-related intents route to ProfileAgent."""
        profile_intents = [
            LearningIntent.ASSESS_SKILL_LEVEL,
            LearningIntent.UPDATE_GOALS,
            LearningIntent.SET_CONSTRAINTS,
            LearningIntent.CREATE_PROFILE,
            LearningIntent.UPDATE_PROFILE,
            LearningIntent.GET_PROFILE,
        ]
        
        for intent in profile_intents:
            assert INTENT_ROUTING[intent] == AgentType.PROFILE
    
    def test_curriculum_intents_route_to_curriculum_agent(self):
        """Test curriculum-related intents route to CurriculumPlannerAgent."""
        curriculum_intents = [
            LearningIntent.CREATE_LEARNING_PATH,
            LearningIntent.ADAPT_DIFFICULTY,
            LearningIntent.REQUEST_NEXT_TOPIC,
            LearningIntent.GENERATE_CURRICULUM,
            LearningIntent.UPDATE_CURRICULUM,
            LearningIntent.GET_CURRICULUM_STATUS,
        ]
        
        for intent in curriculum_intents:
            assert INTENT_ROUTING[intent] == AgentType.CURRICULUM_PLANNER
    
    def test_exercise_intents_route_to_exercise_agent(self):
        """Test exercise-related intents route to ExerciseGeneratorAgent."""
        exercise_intents = [
            LearningIntent.REQUEST_EXERCISE,
            LearningIntent.GENERATE_EXERCISE,
            LearningIntent.REQUEST_HINT,
            LearningIntent.CREATE_STRETCH_EXERCISE,
            LearningIntent.CREATE_RECAP_EXERCISE,
        ]
        
        for intent in exercise_intents:
            assert INTENT_ROUTING[intent] == AgentType.EXERCISE_GENERATOR
    
    def test_review_intents_route_to_reviewer_agent(self):
        """Test review-related intents route to ReviewerAgent."""
        review_intents = [
            LearningIntent.SUBMIT_SOLUTION,
            LearningIntent.EVALUATE_SUBMISSION,
            LearningIntent.RUN_TESTS,
            LearningIntent.CHECK_CODE_QUALITY,
        ]
        
        for intent in review_intents:
            assert INTENT_ROUTING[intent] == AgentType.REVIEWER
    
    def test_resource_intents_route_to_resources_agent(self):
        """Test resource-related intents route to ResourcesAgent."""
        resource_intents = [
            LearningIntent.FIND_DOCUMENTATION,
            LearningIntent.SEARCH_RESOURCES,
            LearningIntent.EXPLAIN_CONCEPT,
            LearningIntent.GET_EXAMPLES,
            LearningIntent.RECOMMEND_RESOURCES,
        ]
        
        for intent in resource_intents:
            assert INTENT_ROUTING[intent] == AgentType.RESOURCES
    
    def test_progress_intents_route_to_progress_agent(self):
        """Test progress-related intents route to ProgressTracker."""
        progress_intents = [
            LearningIntent.CHECK_PROGRESS,
            LearningIntent.REVIEW_MISTAKES,
            LearningIntent.GET_RECOMMENDATIONS,
            LearningIntent.UPDATE_PROGRESS,
            LearningIntent.GET_DAILY_TASKS,
        ]
        
        for intent in progress_intents:
            assert INTENT_ROUTING[intent] == AgentType.PROGRESS_TRACKER
