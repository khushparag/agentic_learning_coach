"""
API router for enriched learning content.

Provides endpoints for:
- Generating structured lessons
- Tracking reading progress
- Submitting knowledge check answers
- Managing notes and highlights
- Getting alternative explanations
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from src.adapters.api.models.common import ErrorResponse
from src.adapters.api.dependencies import get_current_user_id
from src.adapters.services.content_generator_service import (
    ContentGeneratorService, create_content_generator_service
)
from src.adapters.services.adaptive_content_engine import (
    AdaptiveContentEngine, create_adaptive_content_engine, PerformanceData
)
from src.domain.entities.learning_content import (
    StructuredLesson, KnowledgeCheckType
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/content",
    tags=["learning-content"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


# ============================================================================
# Request/Response Models
# ============================================================================

class GenerateLessonRequest(BaseModel):
    """Request model for lesson generation."""
    topic: str = Field(..., description="The main topic of the lesson")
    task_title: str = Field(..., description="Title of the learning task")
    skill_level: str = Field(
        default="intermediate",
        description="Skill level: beginner, intermediate, advanced"
    )
    technology: Optional[str] = Field(None, description="Programming language/framework")
    requirements: List[str] = Field(default_factory=list, description="Topics to cover")


class LessonMetadataResponse(BaseModel):
    """Lesson metadata in response."""
    estimated_minutes: int
    difficulty: str
    prerequisites: List[str]
    technology: str
    last_updated: str


class ContentSectionResponse(BaseModel):
    """Content section in response."""
    id: str
    type: str
    order: int
    content: dict
    completion_required: bool


class StructuredLessonResponse(BaseModel):
    """Response model for structured lesson."""
    id: str
    title: str
    topic: str
    metadata: LessonMetadataResponse
    objectives: List[str]
    sections: List[ContentSectionResponse]
    key_takeaways: List[str]
    related_resources: List[dict]
    version: str


class GenerateLessonResponse(BaseModel):
    """Response for lesson generation."""
    lesson: StructuredLessonResponse
    generated: bool = True


class SaveProgressRequest(BaseModel):
    """Request to save reading progress."""
    lesson_id: str = Field(..., description="ID of the lesson")
    current_section_id: Optional[str] = Field(None, description="Current section ID")
    completed_sections: List[str] = Field(default_factory=list, description="Completed section IDs")
    scroll_position: int = Field(default=0, description="Scroll position in pixels")
    time_spent_seconds: int = Field(default=0, description="Time spent reading")


class SaveProgressResponse(BaseModel):
    """Response for progress save."""
    success: bool
    completion_percentage: float
    message: str


class SubmitKnowledgeCheckRequest(BaseModel):
    """Request to submit knowledge check answer."""
    lesson_id: str = Field(..., description="ID of the lesson")
    check_id: str = Field(..., description="ID of the knowledge check")
    answer: str = Field(..., description="User's answer")
    time_taken_seconds: Optional[int] = Field(None, description="Time taken to answer")


class SubmitKnowledgeCheckResponse(BaseModel):
    """Response for knowledge check submission."""
    is_correct: bool
    feedback: str
    explanation: str
    attempt_number: int
    should_re_explain: bool


class ExplainDifferentlyRequest(BaseModel):
    """Request for alternative explanation."""
    concept_id: str = Field(..., description="ID of the concept")
    previous_explanations: List[str] = Field(
        default_factory=list,
        description="Previously provided explanations"
    )


class ExplainDifferentlyResponse(BaseModel):
    """Response with alternative explanation."""
    explanation: str
    analogy: Optional[dict] = None


class CreateNoteRequest(BaseModel):
    """Request to create a note or highlight."""
    lesson_id: str = Field(..., description="ID of the lesson")
    section_id: Optional[str] = Field(None, description="Section ID")
    note_type: str = Field(..., description="Type: highlight or note")
    content: str = Field(..., description="Note content or highlighted text")
    selection_start: Optional[int] = Field(None, description="Selection start offset")
    selection_end: Optional[int] = Field(None, description="Selection end offset")
    color: Optional[str] = Field(None, description="Highlight color")


class NoteResponse(BaseModel):
    """Response for note operations."""
    id: str
    lesson_id: str
    section_id: Optional[str]
    note_type: str
    content: str
    color: Optional[str]
    created_at: str


class ExportNotesResponse(BaseModel):
    """Response for notes export."""
    markdown: str
    filename: str


class LessonProgressResponse(BaseModel):
    """Response for lesson progress."""
    lesson_id: str
    current_section_id: Optional[str]
    completed_sections: List[str]
    completion_percentage: float
    time_spent_seconds: int
    completed: bool
    last_accessed_at: str


# ============================================================================
# Service instances (singleton pattern)
# ============================================================================

_content_generator: Optional[ContentGeneratorService] = None
_adaptive_engine: Optional[AdaptiveContentEngine] = None


def get_content_generator() -> ContentGeneratorService:
    """Get or create content generator service."""
    global _content_generator
    if _content_generator is None:
        _content_generator = create_content_generator_service()
    return _content_generator


def get_adaptive_engine() -> AdaptiveContentEngine:
    """Get or create adaptive content engine."""
    global _adaptive_engine
    if _adaptive_engine is None:
        _adaptive_engine = create_adaptive_content_engine()
    return _adaptive_engine


# ============================================================================
# Helper functions
# ============================================================================

def _lesson_to_response(lesson: StructuredLesson) -> StructuredLessonResponse:
    """Convert domain lesson to response model."""
    from dataclasses import asdict
    
    sections = []
    for section in lesson.sections:
        # Convert content to dict
        content_dict = {}
        if hasattr(section.content, '__dict__'):
            content_dict = _dataclass_to_dict(section.content)
        elif isinstance(section.content, dict):
            content_dict = section.content
        else:
            content_dict = {"value": str(section.content)}
        
        sections.append(ContentSectionResponse(
            id=section.id,
            type=section.type.value if hasattr(section.type, 'value') else str(section.type),
            order=section.order,
            content=content_dict,
            completion_required=section.completion_required
        ))
    
    resources = []
    for resource in lesson.related_resources:
        if hasattr(resource, '__dict__'):
            resources.append(_dataclass_to_dict(resource))
        elif isinstance(resource, dict):
            resources.append(resource)
    
    return StructuredLessonResponse(
        id=lesson.id,
        title=lesson.title,
        topic=lesson.topic,
        metadata=LessonMetadataResponse(
            estimated_minutes=lesson.metadata.estimated_minutes,
            difficulty=lesson.metadata.difficulty,
            prerequisites=lesson.metadata.prerequisites,
            technology=lesson.metadata.technology,
            last_updated=lesson.metadata.last_updated
        ),
        objectives=lesson.objectives,
        sections=sections,
        key_takeaways=lesson.key_takeaways,
        related_resources=resources,
        version=lesson.version
    )


def _dataclass_to_dict(obj) -> dict:
    """Convert a dataclass to dict, handling nested objects."""
    if hasattr(obj, '__dataclass_fields__'):
        result = {}
        for field_name in obj.__dataclass_fields__:
            value = getattr(obj, field_name)
            result[field_name] = _dataclass_to_dict(value)
        return result
    elif isinstance(obj, list):
        return [_dataclass_to_dict(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: _dataclass_to_dict(v) for k, v in obj.items()}
    elif hasattr(obj, 'value'):  # Enum
        return obj.value
    else:
        return obj


# ============================================================================
# API Endpoints
# ============================================================================

@router.post(
    "/lesson/generate",
    response_model=GenerateLessonResponse,
    summary="Generate structured lesson",
    description="""
    Generate a structured lesson with concept cards, code examples,
    and knowledge checks. The content is adapted to the user's skill level.
    """,
)
async def generate_lesson(
    request: GenerateLessonRequest,
    user_id: str = Depends(get_current_user_id),
) -> GenerateLessonResponse:
    """Generate a structured lesson for a topic."""
    try:
        # Validate and sanitize inputs
        topic = request.topic.strip() if request.topic else ""
        if not topic:
            logger.warning(f"Empty topic received, using task_title as fallback")
            topic = request.task_title or "Programming Fundamentals"
        
        logger.info(f"Generating lesson for topic '{topic}' (title: '{request.task_title}') for user {user_id}")
        logger.debug(f"Request details - skill_level: {request.skill_level}, technology: {request.technology}, requirements: {request.requirements}")
        
        content_generator = get_content_generator()
        adaptive_engine = get_adaptive_engine()
        
        # Generate the lesson
        lesson = await content_generator.generate_lesson(
            topic=topic,
            task_title=request.task_title,
            skill_level=request.skill_level,
            technology=request.technology,
            requirements=request.requirements
        )
        
        logger.info(f"Lesson generated successfully with {len(lesson.sections)} sections")
        
        # Adapt for skill level
        adapted = adaptive_engine.adapt_lesson_for_skill_level(lesson, request.skill_level)
        
        return GenerateLessonResponse(
            lesson=_lesson_to_response(adapted.lesson),
            generated=True
        )
        
    except Exception as e:
        logger.error(f"Error generating lesson: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate lesson: {str(e)}"
        )


@router.get(
    "/lesson/{lesson_id}",
    response_model=GenerateLessonResponse,
    summary="Get lesson by ID",
    description="Retrieve a structured lesson by its ID, adapted to user's level.",
)
async def get_lesson(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id),
) -> GenerateLessonResponse:
    """Get a lesson by ID."""
    # TODO: Implement database retrieval
    # For now, return a placeholder
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Lesson {lesson_id} not found"
    )


@router.post(
    "/progress",
    response_model=SaveProgressResponse,
    summary="Save reading progress",
    description="Save user's reading progress including position and completed sections.",
)
async def save_progress(
    request: SaveProgressRequest,
    user_id: str = Depends(get_current_user_id),
) -> SaveProgressResponse:
    """Save reading progress for a lesson."""
    try:
        logger.info(f"Saving progress for lesson {request.lesson_id} for user {user_id}")
        
        # TODO: Implement database persistence
        # For now, return success
        
        # Calculate completion percentage (placeholder)
        total_sections = 10  # Would come from lesson
        completed = len(request.completed_sections)
        completion_percentage = (completed / total_sections) * 100 if total_sections > 0 else 0
        
        return SaveProgressResponse(
            success=True,
            completion_percentage=completion_percentage,
            message="Progress saved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error saving progress: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save progress: {str(e)}"
        )


@router.get(
    "/progress/{lesson_id}",
    response_model=LessonProgressResponse,
    summary="Get reading progress",
    description="Get user's reading progress for a lesson.",
)
async def get_progress(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id),
) -> LessonProgressResponse:
    """Get reading progress for a lesson."""
    # TODO: Implement database retrieval
    # Return default progress for now
    from datetime import datetime
    
    return LessonProgressResponse(
        lesson_id=lesson_id,
        current_section_id=None,
        completed_sections=[],
        completion_percentage=0.0,
        time_spent_seconds=0,
        completed=False,
        last_accessed_at=datetime.utcnow().isoformat()
    )


@router.post(
    "/knowledge-check",
    response_model=SubmitKnowledgeCheckResponse,
    summary="Submit knowledge check answer",
    description="Submit an answer to a knowledge check and receive feedback.",
)
async def submit_knowledge_check(
    request: SubmitKnowledgeCheckRequest,
    user_id: str = Depends(get_current_user_id),
) -> SubmitKnowledgeCheckResponse:
    """Submit a knowledge check answer."""
    try:
        logger.info(
            f"Knowledge check submission for lesson {request.lesson_id}, "
            f"check {request.check_id} by user {user_id}"
        )
        
        # TODO: Implement actual answer checking against stored lesson
        # For now, return placeholder response
        
        # Placeholder logic - would check against actual correct answer
        is_correct = len(request.answer) > 0  # Simplified
        
        return SubmitKnowledgeCheckResponse(
            is_correct=is_correct,
            feedback="Good attempt!" if is_correct else "Not quite right. Try again!",
            explanation="This is the explanation for the correct answer.",
            attempt_number=1,
            should_re_explain=not is_correct
        )
        
    except Exception as e:
        logger.error(f"Error processing knowledge check: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process knowledge check: {str(e)}"
        )


@router.post(
    "/explain-differently",
    response_model=ExplainDifferentlyResponse,
    summary="Get alternative explanation",
    description="Request an alternative explanation for a concept.",
)
async def explain_differently(
    request: ExplainDifferentlyRequest,
    user_id: str = Depends(get_current_user_id),
) -> ExplainDifferentlyResponse:
    """Get an alternative explanation for a concept."""
    try:
        logger.info(f"Alternative explanation requested for concept {request.concept_id}")
        
        content_generator = get_content_generator()
        
        explanation = await content_generator.get_alternative_explanation(
            concept=request.concept_id,
            previous_explanations=request.previous_explanations
        )
        
        return ExplainDifferentlyResponse(
            explanation=explanation,
            analogy=None  # Could generate a new analogy too
        )
        
    except Exception as e:
        logger.error(f"Error generating alternative explanation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(e)}"
        )


@router.post(
    "/notes",
    response_model=NoteResponse,
    summary="Create note or highlight",
    description="Create a note or highlight on lesson content.",
)
async def create_note(
    request: CreateNoteRequest,
    user_id: str = Depends(get_current_user_id),
) -> NoteResponse:
    """Create a note or highlight."""
    try:
        logger.info(f"Creating {request.note_type} for lesson {request.lesson_id}")
        
        # TODO: Implement database persistence
        from datetime import datetime
        import uuid
        
        return NoteResponse(
            id=str(uuid.uuid4()),
            lesson_id=request.lesson_id,
            section_id=request.section_id,
            note_type=request.note_type,
            content=request.content,
            color=request.color,
            created_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error creating note: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )


@router.get(
    "/notes/{lesson_id}",
    response_model=List[NoteResponse],
    summary="Get notes for lesson",
    description="Get all notes and highlights for a lesson.",
)
async def get_notes(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id),
) -> List[NoteResponse]:
    """Get all notes for a lesson."""
    # TODO: Implement database retrieval
    return []


@router.delete(
    "/notes/{note_id}",
    summary="Delete note",
    description="Delete a note or highlight.",
)
async def delete_note(
    note_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a note."""
    # TODO: Implement database deletion
    return {"success": True, "message": "Note deleted"}


@router.get(
    "/notes/{lesson_id}/export",
    response_model=ExportNotesResponse,
    summary="Export notes to markdown",
    description="Export all notes and highlights for a lesson to markdown format.",
)
async def export_notes(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ExportNotesResponse:
    """Export notes to markdown."""
    # TODO: Implement actual export
    markdown = f"""# Notes for Lesson

## Highlights

No highlights yet.

## Notes

No notes yet.

---
*Exported from Learning Coach*
"""
    
    return ExportNotesResponse(
        markdown=markdown,
        filename=f"notes_{lesson_id}.md"
    )
