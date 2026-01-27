"""
MCP (Model Context Protocol) tool interfaces for external service integration.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum


class ResourceType(str, Enum):
    """Types of learning resources."""
    DOCUMENTATION = "documentation"
    TUTORIAL = "tutorial"
    EXAMPLE = "example"
    REFERENCE = "reference"
    VIDEO = "video"
    ARTICLE = "article"


class DifficultyLevel(str, Enum):
    """Difficulty levels for resources and code analysis."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


@dataclass
class LearningResource:
    """Represents a learning resource from external sources."""
    title: str
    url: str
    description: str
    resource_type: ResourceType
    difficulty_level: DifficultyLevel
    topics: List[str]
    language: Optional[str] = None
    last_updated: Optional[str] = None
    quality_score: float = 0.0
    source: str = "unknown"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LearningResource':
        """Create a LearningResource from a dictionary."""
        # Handle enum conversion
        resource_type = data.get('resource_type')
        if isinstance(resource_type, str):
            resource_type = ResourceType(resource_type)
        
        difficulty_level = data.get('difficulty_level')
        if isinstance(difficulty_level, str):
            difficulty_level = DifficultyLevel(difficulty_level)
        
        return cls(
            title=data['title'],
            url=data['url'],
            description=data['description'],
            resource_type=resource_type,
            difficulty_level=difficulty_level,
            topics=data.get('topics', []),
            language=data.get('language'),
            last_updated=data.get('last_updated'),
            quality_score=data.get('quality_score', 0.0),
            source=data.get('source', 'unknown')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'title': self.title,
            'url': self.url,
            'description': self.description,
            'resource_type': self.resource_type.value,
            'difficulty_level': self.difficulty_level.value,
            'topics': self.topics,
            'language': self.language,
            'last_updated': self.last_updated,
            'quality_score': self.quality_score,
            'source': self.source
        }


@dataclass
class CodeAnalysisResult:
    """Result of static code analysis."""
    complexity_score: float  # 0.0 to 1.0
    difficulty_level: DifficultyLevel
    issues: List[Dict[str, Any]]
    suggestions: List[str]
    estimated_time_minutes: int
    topics_covered: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'complexity_score': self.complexity_score,
            'difficulty_level': self.difficulty_level.value,
            'issues': self.issues,
            'suggestions': self.suggestions,
            'estimated_time_minutes': self.estimated_time_minutes,
            'topics_covered': self.topics_covered
        }


class IDocumentationMCP(ABC):
    """Interface for documentation retrieval MCP tool."""
    
    @abstractmethod
    async def search_documentation(self, 
                                 query: str, 
                                 language: Optional[str] = None,
                                 max_results: int = 10) -> List[LearningResource]:
        """
        Search for documentation resources.
        
        Args:
            query: Search query
            language: Programming language filter
            max_results: Maximum number of results
            
        Returns:
            List of learning resources
        """
        pass
    
    @abstractmethod
    async def get_resource_content(self, url: str) -> Optional[str]:
        """
        Retrieve content from a resource URL.
        
        Args:
            url: Resource URL
            
        Returns:
            Resource content or None if unavailable
        """
        pass
    
    @abstractmethod
    async def verify_resource_quality(self, resource: LearningResource) -> float:
        """
        Verify and score resource quality.
        
        Args:
            resource: Resource to verify
            
        Returns:
            Quality score (0.0 to 1.0)
        """
        pass
    
    @abstractmethod
    async def get_related_resources(self, 
                                  resource: LearningResource,
                                  max_results: int = 5) -> List[LearningResource]:
        """
        Find resources related to the given resource.
        
        Args:
            resource: Base resource
            max_results: Maximum number of results
            
        Returns:
            List of related resources
        """
        pass


class ICodeAnalysisMCP(ABC):
    """Interface for static code analysis MCP tool."""
    
    @abstractmethod
    async def analyze_code_complexity(self, 
                                    code: str, 
                                    language: str) -> CodeAnalysisResult:
        """
        Analyze code complexity and difficulty.
        
        Args:
            code: Source code to analyze
            language: Programming language
            
        Returns:
            Analysis result with complexity metrics
        """
        pass
    
    @abstractmethod
    async def estimate_difficulty(self, 
                                code: str, 
                                language: str) -> DifficultyLevel:
        """
        Estimate the difficulty level of code.
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            Estimated difficulty level
        """
        pass
    
    @abstractmethod
    async def suggest_improvements(self, 
                                 code: str, 
                                 language: str) -> List[str]:
        """
        Suggest code improvements.
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            List of improvement suggestions
        """
        pass
    
    @abstractmethod
    async def extract_topics(self, 
                           code: str, 
                           language: str) -> List[str]:
        """
        Extract programming topics/concepts from code.
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            List of topics covered in the code
        """
        pass