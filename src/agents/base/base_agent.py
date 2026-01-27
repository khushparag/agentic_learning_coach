"""
Base agent interface and common functionality for the Agentic Learning Coach system.

This module implements the foundational architecture for all learning agents,
providing a consistent interface and shared capabilities that ensure reliability,
observability, and maintainability across the entire agent ecosystem.

ARCHITECTURAL PRINCIPLES:
- Template Method Pattern: Defines the skeleton of agent operations while allowing
  subclasses to implement specific business logic
- Circuit Breaker Pattern: Prevents cascading failures when agents become unhealthy
- Decorator Pattern: Wraps agent operations with cross-cutting concerns (logging, timeouts)
- Strategy Pattern: Enables different fallback strategies per agent type

KEY DESIGN DECISIONS:
- All agents inherit from BaseAgent to ensure consistent behavior
- Circuit breaker protection is mandatory to prevent system-wide failures
- Structured logging is built-in for observability and debugging
- Graceful degradation is preferred over hard failures
- Input validation is standardized across all agents
"""
import time
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

from .types import LearningContext, AgentResult, AgentType
from .exceptions import AgentProcessingError, AgentTimeoutError
from .circuit_breaker import CircuitBreaker, CircuitBreakerConfig
from .logging import AgentLogger


class BaseAgent(ABC):
    """
    Abstract base class for all learning coach agents.
    
    This class implements the Template Method pattern, defining the common
    structure and behavior for all agents while allowing subclasses to
    implement domain-specific logic.
    
    CORE CAPABILITIES PROVIDED:
    - Structured logging with correlation IDs for request tracing
    - Circuit breaker protection against cascading failures
    - Timeout handling with configurable limits
    - Input validation with standardized error messages
    - Graceful degradation through fallback mechanisms
    - Health monitoring and status reporting
    
    DESIGN RATIONALE:
    - Abstract base ensures all agents follow the same contract
    - Circuit breaker prevents one failing agent from bringing down the system
    - Structured logging enables debugging and monitoring in production
    - Timeout handling prevents hanging requests from consuming resources
    - Fallback mechanisms maintain system availability during partial failures
    
    USAGE PATTERN:
    1. Inherit from BaseAgent
    2. Implement process() with domain-specific logic
    3. Implement get_supported_intents() to declare capabilities
    4. Optionally override fallback methods for graceful degradation
    5. Register with OrchestratorAgent for request routing
    """
    
    def __init__(self, 
                 agent_type: AgentType,
                 circuit_breaker_config: Optional[CircuitBreakerConfig] = None):
        """
        Initialize the base agent with common infrastructure.
        
        Args:
            agent_type: The type of agent (used for logging and identification)
            circuit_breaker_config: Optional circuit breaker configuration
                                   (uses defaults if not provided)
        
        INITIALIZATION STRATEGY:
        - Each agent gets its own circuit breaker instance to isolate failures
        - Logger is configured with agent type for easy filtering in logs
        - Supported intents list is initialized empty (subclasses must populate)
        - Circuit breaker uses conservative defaults to prevent false positives
        """
        self.agent_type = agent_type
        self.logger = AgentLogger(agent_type)
        # Each agent gets its own circuit breaker to isolate failures
        self.circuit_breaker = CircuitBreaker(circuit_breaker_config)
        # Subclasses must populate this list in their constructor
        self._supported_intents: List[str] = []
    
    @abstractmethod
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process a request within the given learning context.
        
        This is the core business logic method that each agent must implement.
        It should contain only domain-specific logic - all cross-cutting concerns
        (logging, timeouts, circuit breaking) are handled by execute_with_protection().
        
        IMPLEMENTATION GUIDELINES:
        - Focus only on business logic - infrastructure is handled by base class
        - Use context.user_id for user-specific operations
        - Use context.correlation_id for request tracing
        - Return AgentResult.success_result() for successful operations
        - Return AgentResult.error_result() for business logic failures
        - Raise exceptions only for unexpected technical failures
        - Include next_actions in successful results to guide user workflow
        
        Args:
            context: Learning context with user information and session state
                    Contains user_id, session_id, correlation_id for tracing
            payload: Request payload with intent and operation-specific data
                    Always contains 'intent' key, other keys vary by operation
            
        Returns:
            AgentResult with success/failure status and response data
            Should include next_actions to guide subsequent user interactions
            
        Raises:
            AgentProcessingError: When processing fails due to business logic
            ValidationError: When input validation fails (beyond basic validation)
            Any other exception: Will be caught and converted to error result
        """
        pass
    
    @abstractmethod
    def get_supported_intents(self) -> List[str]:
        """
        Return list of intents this agent can handle.
        
        This method is used by the orchestrator for routing decisions.
        The list should be comprehensive and accurate - missing intents
        will result in routing failures, while incorrect intents will
        cause validation errors.
        
        IMPLEMENTATION NOTES:
        - Return intent strings, not enum values
        - Include all intents the agent can process
        - Keep the list up-to-date when adding new capabilities
        - Consider using constants to avoid typos
        
        Returns:
            List of intent strings that this agent supports
            Example: ["assess_skill_level", "update_goals", "set_constraints"]
        """
        pass
    
    async def execute_with_protection(self, 
                                    context: LearningContext, 
                                    payload: Dict[str, Any],
                                    timeout: Optional[int] = None) -> AgentResult:
        """
        Execute agent processing with comprehensive protection and monitoring.
        
        This method implements the Template Method pattern, providing a consistent
        execution framework for all agents. It wraps the agent's process() method
        with cross-cutting concerns that ensure reliability and observability.
        
        PROTECTION MECHANISMS:
        - Circuit breaker protection prevents cascading failures
        - Timeout handling prevents hanging requests
        - Input validation ensures data integrity
        - Structured logging enables debugging and monitoring
        - Graceful degradation maintains system availability
        
        EXECUTION FLOW:
        1. Validate inputs (user_id, session_id, intent)
        2. Log operation start with correlation ID
        3. Execute process() method with circuit breaker protection
        4. Handle timeouts with optional fallback
        5. Handle errors with optional fallback
        6. Log operation completion with duration
        
        Args:
            context: Learning context with user and session information
            payload: Request payload (must contain 'intent' key)
            timeout: Optional timeout override (uses circuit breaker default if not provided)
            
        Returns:
            AgentResult with processing results or fallback data
            
        PERFORMANCE CONSIDERATIONS:
        - All operations are timed for monitoring
        - Circuit breaker prevents wasted resources on failing operations
        - Fallback mechanisms provide fast failure responses
        - Structured logging is optimized for high-throughput scenarios
        """
        operation = payload.get('intent', 'unknown')
        start_time = time.time()
        
        # Log operation start with correlation ID for request tracing
        self.logger.log_operation_start(operation, context, payload)
        
        try:
            # Validate inputs before processing (fail fast on bad data)
            self._validate_inputs(context, payload)
            
            # Execute with circuit breaker protection to prevent cascading failures
            result = await self.circuit_breaker.call(
                self.process,
                context,
                payload,
                timeout=timeout
            )
            
            # Log successful completion with performance metrics
            duration = time.time() - start_time
            self.logger.log_operation_complete(operation, context, result, duration)
            
            return result
            
        except AgentTimeoutError as e:
            # Handle timeout with graceful degradation
            duration = time.time() - start_time
            self.logger.log_error(f"Agent operation timed out: {operation}", e, context, operation)
            
            # Attempt graceful degradation (agent-specific fallback logic)
            fallback_result = await self._handle_timeout_fallback(context, payload)
            if fallback_result:
                self.logger.log_warning(
                    f"Using fallback result for timed out operation: {operation}",
                    context, operation
                )
                return fallback_result
            
            # No fallback available - return structured error
            return AgentResult.error_result(
                error=f"Operation timed out after {duration:.2f} seconds",
                error_code="TIMEOUT",
                metadata={"duration": duration, "operation": operation}
            )
            
        except Exception as e:
            # Handle general processing errors with fallback attempts
            duration = time.time() - start_time
            self.logger.log_error(f"Agent operation failed: {operation}", e, context, operation)
            
            # Attempt graceful degradation (agent-specific fallback logic)
            fallback_result = await self._handle_error_fallback(context, payload, e)
            if fallback_result:
                self.logger.log_warning(
                    f"Using fallback result for failed operation: {operation}",
                    context, operation
                )
                return fallback_result
            
            # No fallback available - return structured error with debugging info
            return AgentResult.error_result(
                error=str(e),
                error_code=getattr(e, 'error_code', 'PROCESSING_ERROR'),
                metadata={"duration": duration, "operation": operation}
            )
    
    def _validate_inputs(self, context: LearningContext, payload: Dict[str, Any]) -> None:
        """
        Validate input parameters with comprehensive checks.
        
        This method implements standardized validation across all agents
        to ensure data integrity and provide consistent error messages.
        
        VALIDATION RULES:
        - user_id is required for all operations (needed for personalization)
        - session_id is required for request correlation and state management
        - intent must be specified and supported by this agent
        - Additional validation can be added by subclasses
        
        Args:
            context: Learning context to validate
            payload: Payload to validate
            
        Raises:
            ValidationError: When validation fails with descriptive message
            
        DESIGN RATIONALE:
        - Fail fast on invalid inputs to prevent downstream errors
        - Provide specific error messages for easier debugging
        - Validate intent against supported list to catch routing errors
        - Centralized validation ensures consistency across all agents
        """
        from .exceptions import ValidationError
        
        # Validate required context fields
        if not context.user_id:
            raise ValidationError("user_id is required in context")
        
        if not context.session_id:
            raise ValidationError("session_id is required in context")
        
        # Validate intent is present and supported
        intent = payload.get('intent')
        if not intent:
            raise ValidationError("intent is required in payload")
        
        if intent not in self.get_supported_intents():
            raise ValidationError(
                f"Unsupported intent '{intent}' for agent {self.agent_type.value}",
                context={"supported_intents": self.get_supported_intents()}
            )
    
    async def _handle_timeout_fallback(self, 
                                     context: LearningContext, 
                                     payload: Dict[str, Any]) -> Optional[AgentResult]:
        """
        Handle timeout with graceful degradation.
        
        This method provides a hook for agents to implement custom fallback
        behavior when operations timeout. The default implementation returns
        None, indicating no fallback is available.
        
        IMPLEMENTATION GUIDELINES:
        - Return a simplified version of the expected result when possible
        - Include metadata indicating this is a fallback response
        - Provide helpful next actions for the user
        - Keep fallback logic simple to avoid additional timeouts
        
        Args:
            context: Learning context (same as original request)
            payload: Original request payload
            
        Returns:
            Optional fallback result, None if no fallback available
            
        EXAMPLE IMPLEMENTATIONS:
        - ExerciseGenerator: Return a simple pre-generated exercise
        - ResourcesAgent: Return cached or default resources
        - ReviewerAgent: Return a generic "please try again" message
        """
        return None
    
    async def _handle_error_fallback(self, 
                                   context: LearningContext, 
                                   payload: Dict[str, Any],
                                   error: Exception) -> Optional[AgentResult]:
        """
        Handle processing errors with graceful degradation.
        
        Subclasses can override this to provide specific fallback behavior.
        
        Args:
            context: Learning context
            payload: Original request payload
            error: The exception that occurred
            
        Returns:
            Optional fallback result, None if no fallback available
        """
        return None
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get agent health status including circuit breaker statistics.
        
        Returns:
            Dictionary with health information
        """
        return {
            "agent_type": self.agent_type.value,
            "supported_intents": self.get_supported_intents(),
            "circuit_breaker": self.circuit_breaker.get_stats(),
            "status": "healthy" if self.circuit_breaker.state.value == "CLOSED" else "degraded"
        }
    
    def reset_circuit_breaker(self) -> None:
        """Reset the circuit breaker to initial state."""
        self.circuit_breaker.reset()
        self.logger.log_debug(f"Circuit breaker reset for agent {self.agent_type.value}")