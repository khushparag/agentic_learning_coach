"""
Custom exception classes for the agent framework.
Follows the error handling standards from the coding guidelines.
"""
from typing import Dict, Any, Optional


class LearningCoachError(Exception):
    """
    Base exception for all learning coach errors.
    Provides structured error information with context.
    """
    
    def __init__(self, message: str, error_code: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.error_code = error_code
        self.context = context or {}
        self.name = "LearningCoachError"


class AgentTimeoutError(LearningCoachError):
    """Raised when an agent operation times out."""
    
    def __init__(self, message: str = "Agent operation timed out", context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "AGENT_TIMEOUT", context)


class AgentCommunicationError(LearningCoachError):
    """Raised when inter-agent communication fails."""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "AGENT_COMMUNICATION_ERROR", context)


class ValidationError(LearningCoachError):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "VALIDATION_ERROR", context)


class ResourceNotFoundError(LearningCoachError):
    """Raised when required resources are not available."""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "RESOURCE_NOT_FOUND", context)


class CircuitBreakerOpenError(LearningCoachError):
    """Raised when circuit breaker is in OPEN state."""
    
    def __init__(self, message: str = "Circuit breaker is OPEN", context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "CIRCUIT_BREAKER_OPEN", context)


class AgentProcessingError(LearningCoachError):
    """Raised when agent processing fails."""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(message, "AGENT_PROCESSING_ERROR", context)