# Agents layer - AI agents and orchestration

# Base agent framework
from .base.base_agent import BaseAgent
from .base.types import AgentType, LearningContext, AgentResult, AgentMessage
from .base.exceptions import (
    LearningCoachError,
    AgentTimeoutError,
    AgentCommunicationError,
    ValidationError,
    ResourceNotFoundError,
    CircuitBreakerOpenError,
    AgentProcessingError
)
from .base.circuit_breaker import CircuitBreaker, CircuitBreakerConfig

# Orchestrator and intent routing
from .orchestrator_agent import (
    OrchestratorAgent,
    AgentRegistry,
    AgentRegistration,
    WorkflowStep,
    WorkflowDefinition
)
from .intent_router import (
    IntentRouter,
    LearningIntent,
    INTENT_ROUTING,
    IntentClassificationResult
)

__all__ = [
    # Base framework
    "BaseAgent",
    "AgentType",
    "LearningContext",
    "AgentResult",
    "AgentMessage",
    "CircuitBreaker",
    "CircuitBreakerConfig",
    
    # Exceptions
    "LearningCoachError",
    "AgentTimeoutError",
    "AgentCommunicationError",
    "ValidationError",
    "ResourceNotFoundError",
    "CircuitBreakerOpenError",
    "AgentProcessingError",
    
    # Orchestrator
    "OrchestratorAgent",
    "AgentRegistry",
    "AgentRegistration",
    "WorkflowStep",
    "WorkflowDefinition",
    
    # Intent routing
    "IntentRouter",
    "LearningIntent",
    "INTENT_ROUTING",
    "IntentClassificationResult",
]

# Note: Specialist agents (ProfileAgent, CurriculumPlannerAgent, etc.) 
# should be imported directly from their modules to avoid circular imports
# Example: from src.agents.profile_agent import ProfileAgent
# Example: from src.agents.progress_tracker import ProgressTracker
