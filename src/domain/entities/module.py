"""
Module domain entity for the Agentic Learning Coach system.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any
from uuid import uuid4

from .task import Task


@dataclass
class Module:
    """
    Domain entity representing a learning module within a learning plan.
    
    Modules group related tasks together and represent a cohesive
    learning unit with a specific focus or topic.
    """
    plan_id: str
    title: str
    order_index: int
    summary: str
    tasks: List[Task] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid4()))
    
    def __post_init__(self):
        """Validate the module data after initialization."""
        if not self.plan_id:
            raise ValueError("plan_id cannot be empty")
        
        if not self.title or not self.title.strip():
            raise ValueError("title cannot be empty")
        
        if self.order_index < 0:
            raise ValueError("order_index must be non-negative")
        
        if not self.summary or not self.summary.strip():
            raise ValueError("summary cannot be empty")
    
    def add_task(self, task: Task) -> None:
        """Add a task to this module."""
        if not isinstance(task, Task):
            raise ValueError("task must be a Task instance")
        
        if task.module_id != self.id:
            raise ValueError("task module_id must match this module's id")
        
        # Check for duplicate day_offset
        existing_offsets = {t.day_offset for t in self.tasks}
        if task.day_offset in existing_offsets:
            raise ValueError(f"Task with day_offset {task.day_offset} already exists")
        
        self.tasks.append(task)
        # Sort tasks by day_offset to maintain order
        self.tasks.sort(key=lambda t: t.day_offset)
    
    def remove_task(self, task_id: str) -> None:
        """Remove a task by ID."""
        self.tasks = [t for t in self.tasks if t.id != task_id]
    
    def get_task_by_day(self, day_offset: int) -> Task | None:
        """Get the task for a specific day offset."""
        for task in self.tasks:
            if task.day_offset == day_offset:
                return task
        return None
    
    def get_total_estimated_time(self) -> int:
        """Get the total estimated time for all tasks in minutes."""
        return sum(task.estimated_minutes for task in self.tasks)
    
    def get_coding_tasks(self) -> List[Task]:
        """Get all coding tasks in this module."""
        return [task for task in self.tasks if task.is_coding_task()]
    
    def get_assessment_tasks(self) -> List[Task]:
        """Get all assessment tasks in this module."""
        return [task for task in self.tasks if task.is_assessment_task()]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the module to a dictionary representation."""
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'title': self.title,
            'order_index': self.order_index,
            'summary': self.summary,
            'tasks': [task.to_dict() for task in self.tasks]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Module':
        """Create a Module from a dictionary representation."""
        module = cls(
            id=data['id'],
            plan_id=data['plan_id'],
            title=data['title'],
            order_index=data['order_index'],
            summary=data['summary']
        )
        
        # Add tasks
        for task_data in data.get('tasks', []):
            task = Task.from_dict(task_data)
            module.tasks.append(task)
        
        return module