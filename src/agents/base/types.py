"""
Core types and enums for the agent framework.
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from datetime import datetime


class AgentType(Enum):
    """Enumeration of all agent types in the system."""
    ORCHESTRATOR = "orchestrator"
    PROFILE = "profile"
    CURRICULUM_PLANNER = "curriculum_planner"
    RESOURCES = "resources"
    EXERCISE_GENERATOR = "exercise_generator"
    REVIEWER = "reviewer"
    PROGRESS_TRACKER = "progress_tracker"


@dataclass
class LearningContext:
    """
    Context information passed between agents during learning workflows.
    Contains all necessary information for agents to make informed decisions.
    """
    user_id: str
    session_id: str
    current_objective: Optional[str] = None
    skill_level: Optional[str] = None
    learning_goals: List[str] = field(default_factory=list)
    time_constraints: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    attempt_count: int = 0
    last_feedback: Optional[Dict[str, Any]] = None
    preferences: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Generate correlation ID if not provided."""
        if self.correlation_id is None:
            import uuid
            self.correlation_id = str(uuid.uuid4())


@dataclass
class AgentResult:
    """
    Standard result format returned by all agents.
    Provides consistent interface for success/failure handling.
    """
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    next_actions: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @classmethod
    def success_result(cls, data: Any = None, next_actions: List[str] = None, 
                      metadata: Dict[str, Any] = None) -> 'AgentResult':
        """Create a successful result."""
        return cls(
            success=True,
            data=data,
            next_actions=next_actions or [],
            metadata=metadata or {}
        )
    
    @classmethod
    def error_result(cls, error: str, error_code: str = None, 
                    metadata: Dict[str, Any] = None) -> 'AgentResult':
        """Create an error result."""
        return cls(
            success=False,
            error=error,
            error_code=error_code,
            metadata=metadata or {}
        )


@dataclass
class AgentMessage:
    """
    Message format for inter-agent communication.
    """
    from_agent: AgentType
    to_agent: AgentType
    intent: str
    payload: Dict[str, Any]
    context: LearningContext
    priority: str = "normal"  # low, normal, high
    timeout: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.now)