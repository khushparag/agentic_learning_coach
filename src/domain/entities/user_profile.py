"""
UserProfile domain entity for the Agentic Learning Coach system.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional
from uuid import uuid4

from ..value_objects.enums import SkillLevel


@dataclass
class UserProfile:
    """
    Domain entity representing a learner's profile and preferences.
    
    This entity encapsulates all learner-specific information including
    skill level, learning goals, time constraints, and preferences.
    """
    user_id: str
    skill_level: SkillLevel
    learning_goals: List[str]
    time_constraints: Dict[str, Any]
    preferences: Dict[str, Any]
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        """Validate the user profile data after initialization."""
        if not self.user_id:
            raise ValueError("user_id cannot be empty")
        
        if not isinstance(self.skill_level, SkillLevel):
            raise ValueError("skill_level must be a SkillLevel enum")
        
        if not self.learning_goals:
            raise ValueError("learning_goals cannot be empty")
        
        if not isinstance(self.time_constraints, dict):
            raise ValueError("time_constraints must be a dictionary")
    
    def update_skill_level(self, new_level: SkillLevel) -> None:
        """Update the learner's skill level."""
        if not isinstance(new_level, SkillLevel):
            raise ValueError("new_level must be a SkillLevel enum")
        
        self.skill_level = new_level
        self.updated_at = datetime.utcnow()
    
    def add_learning_goal(self, goal: str) -> None:
        """Add a new learning goal."""
        if not goal or not goal.strip():
            raise ValueError("goal cannot be empty")
        
        if goal not in self.learning_goals:
            self.learning_goals.append(goal)
            self.updated_at = datetime.utcnow()
    
    def remove_learning_goal(self, goal: str) -> None:
        """Remove a learning goal."""
        if goal in self.learning_goals:
            self.learning_goals.remove(goal)
            self.updated_at = datetime.utcnow()
    
    def update_time_constraints(self, constraints: Dict[str, Any]) -> None:
        """Update time constraints."""
        if not isinstance(constraints, dict):
            raise ValueError("constraints must be a dictionary")
        
        self.time_constraints.update(constraints)
        self.updated_at = datetime.utcnow()
    
    def update_preferences(self, preferences: Dict[str, Any]) -> None:
        """Update learner preferences."""
        if not isinstance(preferences, dict):
            raise ValueError("preferences must be a dictionary")
        
        self.preferences.update(preferences)
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the user profile to a dictionary representation."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'skill_level': self.skill_level.value,
            'learning_goals': self.learning_goals.copy(),
            'time_constraints': self.time_constraints.copy(),
            'preferences': self.preferences.copy(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserProfile':
        """Create a UserProfile from a dictionary representation."""
        return cls(
            id=data['id'],
            user_id=data['user_id'],
            skill_level=SkillLevel(data['skill_level']),
            learning_goals=data['learning_goals'],
            time_constraints=data['time_constraints'],
            preferences=data['preferences'],
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at'])
        )