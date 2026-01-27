"""
Base agent interfaces and common functionality.

This module provides the core framework for all agents in the learning coach system:
- BaseAgent: Abstract base class for all agents
- Types: Core data structures (LearningContext, AgentResult, AgentType)
- Circuit Breaker: Failure protection and recovery
- Logging: Structured logging with privacy protection
- Exceptions: Custom exception hierarchy
"""

from .base_agent import BaseAgent
from .types import (
    AgentType,
    LearningContext, 
    AgentResult,
    AgentMessage
)
from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitBreakerState
)
from .logging import AgentLogger
from .exceptions import (
    LearningCoachError,
    AgentTimeoutError,
    AgentCommunicationError,
    ValidationError,
    ResourceNotFoundError,
    CircuitBreakerOpenError,
    AgentProcessingError
)

__all__ = [
    # Core interfaces
    'BaseAgent',
    
    # Types and data structures
    'AgentType',
    'LearningContext',
    'AgentResult', 
    'AgentMessage',
    
    # Circuit breaker
    'CircuitBreaker',
    'CircuitBreakerConfig',
    'CircuitBreakerState',
    
    # Logging
    'AgentLogger',
    
    # Exceptions
    'LearningCoachError',
    'AgentTimeoutError',
    'AgentCommunicationError',
    'ValidationError',
    'ResourceNotFoundError',
    'CircuitBreakerOpenError',
    'AgentProcessingError'
]