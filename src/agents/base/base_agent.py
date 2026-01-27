"""
Base agent interface and common functionality.
Implements the abstract base class that all agents must inherit from.
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
    
    Provides common functionality including:
    - Structured logging
    - Circuit breaker protection
    - Timeout handling
    - Error handling and graceful degradation
    """
    
    def __init__(self, 
                 agent_type: AgentType,
                 circuit_breaker_config: Optional[CircuitBreakerConfig] = None):
        self.agent_type = agent_type
        self.logger = AgentLogger(agent_type)
        self.circuit_breaker = CircuitBreaker(circuit_breaker_config)
        self._supported_intents: List[str] = []
    
    @abstractmethod
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process a request within the given learning context.
        
        This is the main entry point for all agent operations.
        Implementations should handle the specific business logic for their domain.
        
        Args:
            context: Learning context with user information and session state
            payload: Request payload with intent and operation-specific data
            
        Returns:
            AgentResult with success/failure status and response data
            
        Raises:
            AgentProcessingError: When processing fails
            ValidationError: When input validation fails
        """
        pass
    
    @abstractmethod
    def get_supported_intents(self) -> List[str]:
        """
        Return list of intents this agent can handle.
        
        Returns:
            List of intent strings that this agent supports
        """
        pass
    
    async def execute_with_protection(self, 
                                    context: LearningContext, 
                                    payload: Dict[str, Any],
                                    timeout: Optional[int] = None) -> AgentResult:
        """
        Execute agent processing with circuit breaker protection and timeout handling.
        
        This method wraps the process() method with:
        - Circuit breaker protection against cascading failures
        - Timeout handling
        - Structured logging
        - Error handling and graceful degradation
        
        Args:
            context: Learning context
            payload: Request payload
            timeout: Optional timeout override
            
        Returns:
            AgentResult with processing results
        """
        operation = payload.get('intent', 'unknown')
        start_time = time.time()
        
        # Log operation start
        self.logger.log_operation_start(operation, context, payload)
        
        try:
            # Validate inputs
            self._validate_inputs(context, payload)
            
            # Execute with circuit breaker protection
            result = await self.circuit_breaker.call(
                self.process,
                context,
                payload,
                timeout=timeout
            )
            
            # Log successful completion
            duration = time.time() - start_time
            self.logger.log_operation_complete(operation, context, result, duration)
            
            return result
            
        except AgentTimeoutError as e:
            # Handle timeout with graceful degradation
            duration = time.time() - start_time
            self.logger.log_error(f"Agent operation timed out: {operation}", e, context, operation)
            
            # Attempt graceful degradation
            fallback_result = await self._handle_timeout_fallback(context, payload)
            if fallback_result:
                self.logger.log_warning(
                    f"Using fallback result for timed out operation: {operation}",
                    context, operation
                )
                return fallback_result
            
            return AgentResult.error_result(
                error=f"Operation timed out after {duration:.2f} seconds",
                error_code="TIMEOUT",
                metadata={"duration": duration, "operation": operation}
            )
            
        except Exception as e:
            # Handle general processing errors
            duration = time.time() - start_time
            self.logger.log_error(f"Agent operation failed: {operation}", e, context, operation)
            
            # Attempt graceful degradation
            fallback_result = await self._handle_error_fallback(context, payload, e)
            if fallback_result:
                self.logger.log_warning(
                    f"Using fallback result for failed operation: {operation}",
                    context, operation
                )
                return fallback_result
            
            return AgentResult.error_result(
                error=str(e),
                error_code=getattr(e, 'error_code', 'PROCESSING_ERROR'),
                metadata={"duration": duration, "operation": operation}
            )
    
    def _validate_inputs(self, context: LearningContext, payload: Dict[str, Any]) -> None:
        """
        Validate input parameters.
        
        Args:
            context: Learning context to validate
            payload: Payload to validate
            
        Raises:
            ValidationError: When validation fails
        """
        from .exceptions import ValidationError
        
        if not context.user_id:
            raise ValidationError("user_id is required in context")
        
        if not context.session_id:
            raise ValidationError("session_id is required in context")
        
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
        
        Subclasses can override this to provide specific fallback behavior.
        
        Args:
            context: Learning context
            payload: Original request payload
            
        Returns:
            Optional fallback result, None if no fallback available
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