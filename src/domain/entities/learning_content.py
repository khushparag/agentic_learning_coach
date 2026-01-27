"""
Domain entities for enriched learning content.

This module defines the data models for structured educational content
including lessons, concept cards, code examples, and knowledge checks.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4


class ContentSectionType(str, Enum):
    """Types of content sections within a lesson."""
    TEXT = "text"
    CONCEPT_CARD = "concept-card"
    CODE_EXAMPLE = "code-example"
    KNOWLEDGE_CHECK = "knowledge-check"
    DIAGRAM = "diagram"


class KnowledgeCheckType(str, Enum):
    """Types of knowledge check questions."""
    MULTIPLE_CHOICE = "multiple-choice"
    FILL_BLANK = "fill-blank"
    CODE_COMPLETION = "code-completion"
    TRUE_FALSE = "true-false"


class DiagramType(str, Enum):
    """Types of Mermaid diagrams."""
    FLOWCHART = "flowchart"
    SEQUENCE = "sequence"
    CLASS = "class"
    STATE = "state"
    ER = "er"


class ResourceCategory(str, Enum):
    """Categories for external resources."""
    ESSENTIAL = "essential"
    RECOMMENDED = "recommended"
    DEEP_DIVE = "deep-dive"


class ResourceType(str, Enum):
    """Types of external resources."""
    DOCUMENTATION = "documentation"
    TUTORIAL = "tutorial"
    VIDEO = "video"
    ARTICLE = "article"
    REFERENCE = "reference"


class ProgrammingLanguage(str, Enum):
    """Supported programming languages for code examples."""
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    PYTHON = "python"
    JAVA = "java"


@dataclass
class LessonMetadata:
    """Metadata for a lesson."""
    estimated_minutes: int
    difficulty: str  # beginner, intermediate, advanced
    prerequisites: List[str] = field(default_factory=list)
    technology: str = ""
    last_updated: str = ""


@dataclass
class TextBlock:
    """A block of text content."""
    content: str
    format: str = "markdown"  # markdown or html


@dataclass
class Mistake:
    """A common mistake with correction."""
    description: str
    example: str
    correction: str


@dataclass
class UseCase:
    """A practical use case for a concept."""
    scenario: str
    example: str
    benefit: str


@dataclass
class Analogy:
    """A real-world analogy for a concept."""
    title: str
    description: str
    mapping: Dict[str, str] = field(default_factory=dict)  # concept term -> analogy term


@dataclass
class CodeSnippet:
    """A small code snippet within a concept card."""
    language: str
    code: str
    description: str = ""


@dataclass
class MermaidDiagram:
    """A Mermaid diagram for visualization."""
    type: DiagramType
    code: str
    caption: str
    alt_text: str  # Accessibility


@dataclass
class ConceptCard:
    """A concept card with multiple explanation styles."""
    id: str
    concept_name: str
    primary_explanation: str
    analogy: Analogy
    diagram: Optional[MermaidDiagram] = None
    alternative_explanations: List[str] = field(default_factory=list)
    common_mistakes: List[Mistake] = field(default_factory=list)
    when_to_use: List[UseCase] = field(default_factory=list)
    code_snippet: Optional[CodeSnippet] = None


@dataclass
class TestCase:
    """A test case for code examples."""
    input: str
    expected_output: str
    description: str


@dataclass
class CodeExample:
    """An interactive code example."""
    id: str
    title: str
    description: str
    language: ProgrammingLanguage
    starter_code: str
    solution_code: str
    test_cases: List[TestCase] = field(default_factory=list)
    hints: List[str] = field(default_factory=list)
    is_editable: bool = True
    expected_output: Optional[str] = None


@dataclass
class Option:
    """An option for multiple choice questions."""
    id: str
    text: str
    is_correct: bool
    feedback: str


@dataclass
class KnowledgeCheck:
    """A knowledge check question."""
    id: str
    question: str
    type: KnowledgeCheckType
    options: List[Option] = field(default_factory=list)
    correct_answer: str = ""  # Can be string or JSON array for multiple answers
    explanation: str = ""
    hint: str = ""
    related_concept_id: Optional[str] = None
    difficulty: int = 1  # 1-5


@dataclass
class ContentSection:
    """A section of content within a lesson."""
    id: str
    type: ContentSectionType
    order: int
    content: Any  # TextBlock, ConceptCard, CodeExample, KnowledgeCheck, or MermaidDiagram
    completion_required: bool = True


@dataclass
class Resource:
    """An external learning resource."""
    id: str
    title: str
    url: str
    type: ResourceType
    category: ResourceCategory
    estimated_minutes: int
    verified: bool = False
    last_verified: str = ""


@dataclass
class StructuredLesson:
    """A complete structured lesson."""
    id: str
    title: str
    topic: str
    metadata: LessonMetadata
    objectives: List[str]
    sections: List[ContentSection]
    key_takeaways: List[str]
    related_resources: List[Resource] = field(default_factory=list)
    version: str = "1.0.0"
    
    def get_total_sections(self) -> int:
        """Get total number of sections."""
        return len(self.sections)
    
    def get_knowledge_checks(self) -> List[KnowledgeCheck]:
        """Get all knowledge checks in the lesson."""
        return [
            s.content for s in self.sections 
            if s.type == ContentSectionType.KNOWLEDGE_CHECK
        ]
    
    def get_code_examples(self) -> List[CodeExample]:
        """Get all code examples in the lesson."""
        return [
            s.content for s in self.sections 
            if s.type == ContentSectionType.CODE_EXAMPLE
        ]
    
    def get_concept_cards(self) -> List[ConceptCard]:
        """Get all concept cards in the lesson."""
        return [
            s.content for s in self.sections 
            if s.type == ContentSectionType.CONCEPT_CARD
        ]


@dataclass
class LessonProgress:
    """User progress through a lesson."""
    user_id: UUID
    lesson_id: UUID
    current_section_id: Optional[str] = None
    completed_sections: List[str] = field(default_factory=list)
    knowledge_check_results: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    scroll_position: int = 0
    time_spent_seconds: int = 0
    completed: bool = False
    completed_at: Optional[datetime] = None
    last_accessed_at: datetime = field(default_factory=datetime.now)
    
    def get_completion_percentage(self, total_sections: int) -> float:
        """Calculate completion percentage."""
        if total_sections == 0:
            return 0.0
        return (len(self.completed_sections) / total_sections) * 100


@dataclass
class UserNote:
    """A user's note or highlight."""
    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    lesson_id: UUID = field(default_factory=uuid4)
    section_id: Optional[str] = None
    note_type: str = "note"  # "highlight" or "note"
    content: str = ""
    selection_start: Optional[int] = None
    selection_end: Optional[int] = None
    color: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class KnowledgeCheckAttemptRecord:
    """Record of a knowledge check attempt."""
    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    lesson_id: UUID = field(default_factory=uuid4)
    check_id: str = ""
    answer: str = ""
    is_correct: bool = False
    attempt_number: int = 1
    time_taken_seconds: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)
