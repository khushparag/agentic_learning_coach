"""
LearningPlan domain entity for the Agentic Learning Coach system.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any
from uuid import uuid4

from .module import Module
from ..value_objects.enums import LearningPlanStatus


@dataclass
class LearningPlan:
    """
    Domain entity representing a complete learning plan for a user.
    
    A learning plan contains multiple modules organized in a logical
    sequence to achieve specific learning goals.
    """
    user_id: str
    title: str
    goal_description: str
    total_days: int
    status: LearningPlanStatus = LearningPlanStatus.DRAFT
    modules: List[Module] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        """Validate the learning plan data after initialization."""
        if not self.user_id:
            raise ValueError("user_id cannot be empty")
        
        if not self.title or not self.title.strip():
            raise ValueError("title cannot be empty")
        
        if not self.goal_description or not self.goal_description.strip():
            raise ValueError("goal_description cannot be empty")
        
        if self.total_days <= 0:
            raise ValueError("total_days must be positive")
        
        if not isinstance(self.status, LearningPlanStatus):
            raise ValueError("status must be a LearningPlanStatus enum")
    
    def add_module(self, module: Module) -> None:
        """Add a module to this learning plan."""
        if not isinstance(module, Module):
            raise ValueError("module must be a Module instance")
        
        if module.plan_id != self.id:
            raise ValueError("module plan_id must match this plan's id")
        
        # Check for duplicate order_index
        existing_indices = {m.order_index for m in self.modules}
        if module.order_index in existing_indices:
            raise ValueError(f"Module with order_index {module.order_index} already exists")
        
        self.modules.append(module)
        # Sort modules by order_index to maintain sequence
        self.modules.sort(key=lambda m: m.order_index)
    
    def remove_module(self, module_id: str) -> None:
        """Remove a module by ID."""
        self.modules = [m for m in self.modules if m.id != module_id]
    
    def get_module_by_index(self, order_index: int) -> Module | None:
        """Get a module by its order index."""
        for module in self.modules:
            if module.order_index == order_index:
                return module
        return None
    
    def activate(self) -> None:
        """Activate this learning plan."""
        if self.status == LearningPlanStatus.COMPLETED:
            raise ValueError("Cannot activate a completed plan")
        
        self.status = LearningPlanStatus.ACTIVE
    
    def pause(self) -> None:
        """Pause this learning plan."""
        if self.status != LearningPlanStatus.ACTIVE:
            raise ValueError("Can only pause an active plan")
        
        self.status = LearningPlanStatus.PAUSED
    
    def complete(self) -> None:
        """Mark this learning plan as completed."""
        if self.status not in [LearningPlanStatus.ACTIVE, LearningPlanStatus.PAUSED]:
            raise ValueError("Can only complete an active or paused plan")
        
        self.status = LearningPlanStatus.COMPLETED
    
    def get_total_estimated_time(self) -> int:
        """Get the total estimated time for all modules in minutes."""
        return sum(module.get_total_estimated_time() for module in self.modules)
    
    def get_all_tasks(self) -> List:
        """Get all tasks from all modules."""
        from .task import Task
        all_tasks: List[Task] = []
        for module in self.modules:
            all_tasks.extend(module.tasks)
        return all_tasks
    
    def get_tasks_for_day(self, day_offset: int) -> List:
        """Get all tasks scheduled for a specific day."""
        from .task import Task
        tasks: List[Task] = []
        for module in self.modules:
            for task in module.tasks:
                if task.day_offset == day_offset:
                    tasks.append(task)
        return tasks
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the learning plan to a dictionary representation."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'goal_description': self.goal_description,
            'total_days': self.total_days,
            'status': self.status.value,
            'modules': [module.to_dict() for module in self.modules],
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LearningPlan':
        """Create a LearningPlan from a dictionary representation."""
        plan = cls(
            id=data['id'],
            user_id=data['user_id'],
            title=data['title'],
            goal_description=data['goal_description'],
            total_days=data['total_days'],
            status=LearningPlanStatus(data['status']),
            created_at=datetime.fromisoformat(data['created_at'])
        )
        
        # Add modules
        for module_data in data.get('modules', []):
            module = Module.from_dict(module_data)
            plan.modules.append(module)
        
        return plan