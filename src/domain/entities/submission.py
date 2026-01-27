"""
Submission domain entity for the Agentic Learning Coach system.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional, Any
from uuid import uuid4


@dataclass
class Submission:
    """
    Domain entity representing a learner's submission for a task.
    
    Submissions contain the learner's work (code, answers, etc.) and
    are evaluated to provide feedback and track progress.
    """
    task_id: str
    user_id: str
    code_content: Optional[str] = None
    repository_url: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid4()))
    submitted_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        """Validate the submission data after initialization."""
        if not self.task_id:
            raise ValueError("task_id cannot be empty")
        
        if not self.user_id:
            raise ValueError("user_id cannot be empty")
        
        # At least one of code_content or repository_url must be provided
        if not self.code_content and not self.repository_url:
            raise ValueError("Either code_content or repository_url must be provided")
        
        # If repository_url is provided, validate it's a proper URL format
        if self.repository_url and not self._is_valid_url(self.repository_url):
            raise ValueError("repository_url must be a valid URL")
    
    def _is_valid_url(self, url: str) -> bool:
        """Basic URL validation."""
        return url.startswith(('http://', 'https://')) and len(url) > 10
    
    def has_code_content(self) -> bool:
        """Check if this submission has inline code content."""
        return self.code_content is not None and len(self.code_content.strip()) > 0
    
    def has_repository_url(self) -> bool:
        """Check if this submission has a repository URL."""
        return self.repository_url is not None and len(self.repository_url.strip()) > 0
    
    def get_content_type(self) -> str:
        """Get the type of content in this submission."""
        if self.has_code_content() and self.has_repository_url():
            return "hybrid"
        elif self.has_code_content():
            return "inline_code"
        elif self.has_repository_url():
            return "repository"
        else:
            return "empty"
    
    def get_content_summary(self) -> str:
        """Get a summary of the submission content."""
        if self.has_code_content():
            lines = len(self.code_content.split('\n'))
            chars = len(self.code_content)
            return f"Inline code: {lines} lines, {chars} characters"
        elif self.has_repository_url():
            return f"Repository: {self.repository_url}"
        else:
            return "No content"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the submission to a dictionary representation."""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'code_content': self.code_content,
            'repository_url': self.repository_url,
            'submitted_at': self.submitted_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Submission':
        """Create a Submission from a dictionary representation."""
        return cls(
            id=data['id'],
            task_id=data['task_id'],
            user_id=data['user_id'],
            code_content=data.get('code_content'),
            repository_url=data.get('repository_url'),
            submitted_at=datetime.fromisoformat(data['submitted_at'])
        )