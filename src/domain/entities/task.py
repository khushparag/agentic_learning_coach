"""
Task domain entity for the Agentic Learning Coach system.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any
from uuid import uuid4

from ..value_objects.enums import TaskType


@dataclass
class Task:
    """
    Domain entity representing a learning task within a module.
    
    Tasks are the atomic units of learning activities that learners
    complete as part of their curriculum.
    """
    module_id: str
    day_offset: int
    task_type: TaskType
    description: str
    estimated_minutes: int
    completion_criteria: str
    resources: List[Dict[str, Any]] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid4()))
    
    def __post_init__(self):
        """Validate the task data after initialization."""
        if not self.module_id:
            raise ValueError("module_id cannot be empty")
        
        if self.day_offset < 0:
            raise ValueError("day_offset must be non-negative")
        
        if not isinstance(self.task_type, TaskType):
            raise ValueError("task_type must be a TaskType enum")
        
        if not self.description or not self.description.strip():
            raise ValueError("description cannot be empty")
        
        if self.estimated_minutes <= 0:
            raise ValueError("estimated_minutes must be positive")
        
        if not self.completion_criteria or not self.completion_criteria.strip():
            raise ValueError("completion_criteria cannot be empty")
    
    def add_resource(self, resource: Dict[str, Any]) -> None:
        """Add a learning resource to this task."""
        if not isinstance(resource, dict):
            raise ValueError("resource must be a dictionary")
        
        required_fields = ['title', 'url', 'type']
        for field_name in required_fields:
            if field_name not in resource:
                raise ValueError(f"resource must contain '{field_name}' field")
        
        self.resources.append(resource)
    
    def remove_resource(self, resource_url: str) -> None:
        """Remove a resource by URL."""
        self.resources = [r for r in self.resources if r.get('url') != resource_url]
    
    def is_coding_task(self) -> bool:
        """Check if this is a coding task."""
        return self.task_type == TaskType.CODE
    
    def is_assessment_task(self) -> bool:
        """Check if this is an assessment task."""
        return self.task_type == TaskType.QUIZ
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the task to a dictionary representation."""
        return {
            'id': self.id,
            'module_id': self.module_id,
            'day_offset': self.day_offset,
            'task_type': self.task_type.value,
            'description': self.description,
            'estimated_minutes': self.estimated_minutes,
            'resources': self.resources.copy(),
            'completion_criteria': self.completion_criteria
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create a Task from a dictionary representation."""
        return cls(
            id=data['id'],
            module_id=data['module_id'],
            day_offset=data['day_offset'],
            task_type=TaskType(data['task_type']),
            description=data['description'],
            estimated_minutes=data['estimated_minutes'],
            resources=data['resources'],
            completion_criteria=data['completion_criteria']
        )