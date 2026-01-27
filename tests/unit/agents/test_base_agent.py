"""
Unit tests for the base agent framework.
Tests the core functionality including circuit breaker, logging, and error handling.
"""
import pytest
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime

from src.agents.base import (
    BaseAgent,
    AgentType,
    LearningContext,
    AgentResult,
    CircuitBreaker,
    CircuitBreakerConfig,
    AgentTimeoutError,
    ValidationError,
    AgentProcessingError
)


class MockAgent(BaseAgent):
    """Test implementation of BaseAgent for testing."""
    
    def __init__(self):
        super().__init__(AgentType.PROFILE)
        self._should_fail = False
        self._should_timeout = False
        self._call_count = 0
    
    async def process(self, context: LearningContext, payload: dict) -> AgentResult:
        """Test implementation that can simulate failures."""
        self._call_count += 1
        
        if self._should_timeout:
            await asyncio.sleep(2)  # Simulate long operation
        
        if self._should_fail:
            raise AgentProcessingError("Simulated failure")
        
        return AgentResult.success_result(
            data={"processed": True, "call_count": self._call_count},
            next_actions=["continue"]
        )
    
    def get_supported_intents(self) -> list[str]:
        return ["test_intent", "another_intent"]


class TestBaseAgent:
    """Test cases for BaseAgent functionality."""
    
    @pytest.fixture
    def agent(self):
        """Create a test agent instance."""
        return MockAgent()
    
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
    def payload(self):
        """Create a test payload."""
        return {
            "intent": "test_intent",
            "data": {"test": True}
        }
    
    @pytest.mark.asyncio
    async def test_successful_processing(self, agent, context, payload):
        """Test successful agent processing."""
        result = await agent.execute_with_protection(context, payload)
        
        assert result.success is True
        assert result.data["processed"] is True
        assert result.data["call_count"] == 1
        assert "continue" in result.next_actions
        assert result.error is None
    
    @pytest.mark.asyncio
    async def test_input_validation_missing_user_id(self, agent, payload):
        """Test validation fails when user_id is missing."""
        context = LearningContext(user_id="", session_id="test-session")
        
        result = await agent.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "user_id is required" in result.error
        assert result.error_code == "VALIDATION_ERROR"
    
    @pytest.mark.asyncio
    async def test_input_validation_missing_intent(self, agent, context):
        """Test validation fails when intent is missing."""
        payload = {"data": {"test": True}}
        
        result = await agent.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "intent is required" in result.error
        assert result.error_code == "VALIDATION_ERROR"
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, agent, context):
        """Test validation fails for unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        result = await agent.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "Unsupported intent" in result.error
        assert result.error_code == "VALIDATION_ERROR"
    
    @pytest.mark.asyncio
    async def test_processing_error_handling(self, agent, context, payload):
        """Test handling of processing errors."""
        agent._should_fail = True
        
        result = await agent.execute_with_protection(context, payload)
        
        assert result.success is False
        assert "Simulated failure" in result.error
        assert result.error_code == "AGENT_PROCESSING_ERROR"
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, agent, context, payload):
        """Test timeout handling."""
        agent._should_timeout = True
        
        result = await agent.execute_with_protection(context, payload, timeout=1)
        
        assert result.success is False
        assert "timed out" in result.error.lower()
        assert result.error_code == "TIMEOUT"
    
    def test_get_supported_intents(self, agent):
        """Test getting supported intents."""
        intents = agent.get_supported_intents()
        
        assert "test_intent" in intents
        assert "another_intent" in intents
        assert len(intents) == 2
    
    def test_health_status(self, agent):
        """Test health status reporting."""
        status = agent.get_health_status()
        
        assert status["agent_type"] == "profile"
        assert status["supported_intents"] == ["test_intent", "another_intent"]
        assert "circuit_breaker" in status
        assert status["status"] == "healthy"


class TestCircuitBreaker:
    """Test cases for CircuitBreaker functionality."""
    
    @pytest.fixture
    def circuit_breaker(self):
        """Create a circuit breaker with test configuration."""
        config = CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=1,
            success_threshold=2,
            timeout=1
        )
        return CircuitBreaker(config)
    
    @pytest.mark.asyncio
    async def test_successful_calls(self, circuit_breaker):
        """Test successful function calls."""
        async def success_func():
            return "success"
        
        result = await circuit_breaker.call(success_func)
        assert result == "success"
        
        stats = circuit_breaker.get_stats()
        assert stats["state"] == "CLOSED"
        assert stats["success_count"] == 1
        assert stats["failure_count"] == 0
    
    @pytest.mark.asyncio
    async def test_failure_threshold(self, circuit_breaker):
        """Test circuit breaker opens after failure threshold."""
        async def failing_func():
            raise Exception("Test failure")
        
        # Cause failures up to threshold
        for i in range(3):
            with pytest.raises(Exception):
                await circuit_breaker.call(failing_func)
        
        stats = circuit_breaker.get_stats()
        assert stats["state"] == "OPEN"
        assert stats["failure_count"] == 3
    
    @pytest.mark.asyncio
    async def test_circuit_breaker_open_rejection(self, circuit_breaker):
        """Test that calls are rejected when circuit breaker is open."""
        async def failing_func():
            raise Exception("Test failure")
        
        # Trigger circuit breaker to open
        for i in range(3):
            with pytest.raises(Exception):
                await circuit_breaker.call(failing_func)
        
        # Next call should be rejected immediately
        from src.agents.base.exceptions import CircuitBreakerOpenError
        with pytest.raises(CircuitBreakerOpenError):
            await circuit_breaker.call(failing_func)
    
    @pytest.mark.asyncio
    async def test_recovery_after_timeout(self, circuit_breaker):
        """Test circuit breaker recovery after timeout."""
        async def failing_func():
            raise Exception("Test failure")
        
        async def success_func():
            return "recovered"
        
        # Trigger circuit breaker to open
        for i in range(3):
            with pytest.raises(Exception):
                await circuit_breaker.call(failing_func)
        
        # Wait for recovery timeout
        await asyncio.sleep(1.1)
        
        # Should transition to half-open and allow calls
        result = await circuit_breaker.call(success_func)
        assert result == "recovered"
        
        # Another success should close the circuit
        result = await circuit_breaker.call(success_func)
        assert result == "recovered"
        
        stats = circuit_breaker.get_stats()
        assert stats["state"] == "CLOSED"
    
    def test_circuit_breaker_reset(self, circuit_breaker):
        """Test circuit breaker reset functionality."""
        # Manually set some state
        circuit_breaker.stats.failure_count = 5
        circuit_breaker.stats.total_calls = 10
        
        circuit_breaker.reset()
        
        stats = circuit_breaker.get_stats()
        assert stats["state"] == "CLOSED"
        assert stats["failure_count"] == 0
        assert stats["total_calls"] == 0


class TestLearningContext:
    """Test cases for LearningContext."""
    
    def test_context_creation_with_defaults(self):
        """Test creating context with minimal required fields."""
        context = LearningContext(
            user_id="test-user",
            session_id="test-session"
        )
        
        assert context.user_id == "test-user"
        assert context.session_id == "test-session"
        assert context.current_objective is None
        assert context.learning_goals == []
        assert context.correlation_id is not None  # Should be auto-generated
    
    def test_context_creation_with_all_fields(self):
        """Test creating context with all fields."""
        context = LearningContext(
            user_id="test-user",
            session_id="test-session",
            current_objective="learn-python",
            skill_level="beginner",
            learning_goals=["python", "web-dev"],
            time_constraints={"hours_per_week": 10},
            correlation_id="custom-correlation-id",
            attempt_count=3,
            last_feedback={"score": 85},
            preferences={"style": "hands-on"}
        )
        
        assert context.user_id == "test-user"
        assert context.session_id == "test-session"
        assert context.current_objective == "learn-python"
        assert context.skill_level == "beginner"
        assert context.learning_goals == ["python", "web-dev"]
        assert context.time_constraints == {"hours_per_week": 10}
        assert context.correlation_id == "custom-correlation-id"
        assert context.attempt_count == 3
        assert context.last_feedback == {"score": 85}
        assert context.preferences == {"style": "hands-on"}


class TestAgentResult:
    """Test cases for AgentResult."""
    
    def test_success_result_creation(self):
        """Test creating successful results."""
        result = AgentResult.success_result(
            data={"key": "value"},
            next_actions=["action1", "action2"],
            metadata={"meta": "data"}
        )
        
        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.next_actions == ["action1", "action2"]
        assert result.metadata == {"meta": "data"}
        assert result.error is None
        assert result.error_code is None
    
    def test_error_result_creation(self):
        """Test creating error results."""
        result = AgentResult.error_result(
            error="Something went wrong",
            error_code="TEST_ERROR",
            metadata={"context": "test"}
        )
        
        assert result.success is False
        assert result.error == "Something went wrong"
        assert result.error_code == "TEST_ERROR"
        assert result.metadata == {"context": "test"}
        assert result.data is None
        assert result.next_actions == []