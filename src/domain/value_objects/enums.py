"""
Domain enums and value objects for the Agentic Learning Coach system.
"""
from enum import Enum


class SkillLevel(Enum):
    """Enumeration of learner skill levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class TaskType(Enum):
    """Enumeration of task types in the learning system."""
    READ = "READ"
    WATCH = "WATCH"
    CODE = "CODE"
    QUIZ = "QUIZ"


class SubmissionStatus(Enum):
    """Enumeration of submission evaluation statuses."""
    PASS = "PASS"
    FAIL = "FAIL"
    PARTIAL = "PARTIAL"


class LearningPlanStatus(Enum):
    """Enumeration of learning plan statuses."""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"