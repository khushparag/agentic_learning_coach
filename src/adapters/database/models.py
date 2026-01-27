"""
SQLAlchemy models for the Agentic Learning Coach system.

This module defines the database schema using SQLAlchemy ORM models
that correspond to the domain entities. The models follow the database
design principles outlined in the steering documents.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, 
    String, Text, JSON, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from src.adapters.database.config import Base
from src.domain.value_objects.enums import (
    SkillLevel, TaskType, SubmissionStatus, LearningPlanStatus
)


class User(Base):
    """User table for authentication and basic user information."""
    
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    profile: Mapped[Optional["LearningProfile"]] = relationship(
        "LearningProfile", 
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    learning_plans: Mapped[List["LearningPlan"]] = relationship(
        "LearningPlan",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    progress_records: Mapped[List["ProgressTracking"]] = relationship(
        "ProgressTracking",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class LearningProfile(Base):
    """Learning profile table for user preferences and skill assessment."""
    
    __tablename__ = "learning_profiles"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    skill_level: Mapped[SkillLevel] = mapped_column(
        Enum(SkillLevel), 
        nullable=False
    )
    learning_goals: Mapped[List[str]] = mapped_column(
        JSON, 
        nullable=False, 
        default=list
    )
    time_constraints: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False, 
        default=dict
    )
    preferences: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False, 
        default=dict
    )
    assessment_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_learning_profiles_user_id"),
    )


class LearningPlan(Base):
    """Learning plan table for curriculum and learning paths."""
    
    __tablename__ = "learning_plans"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    goal_description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LearningPlanStatus] = mapped_column(
        Enum(LearningPlanStatus, values_callable=lambda x: [e.value for e in x]), 
        default=LearningPlanStatus.DRAFT
    )
    total_days: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_hours: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="learning_plans")
    modules: Mapped[List["LearningModule"]] = relationship(
        "LearningModule",
        back_populates="learning_plan",
        cascade="all, delete-orphan",
        order_by="LearningModule.order_index"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("total_days > 0", name="ck_learning_plans_total_days_positive"),
        CheckConstraint("estimated_hours IS NULL OR estimated_hours > 0", 
                       name="ck_learning_plans_estimated_hours_positive"),
    )


class LearningModule(Base):
    """Learning module table for grouping related tasks."""
    
    __tablename__ = "learning_modules"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("learning_plans.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    learning_objectives: Mapped[List[str]] = mapped_column(
        JSON, 
        nullable=False, 
        default=list
    )
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    learning_plan: Mapped["LearningPlan"] = relationship(
        "LearningPlan", 
        back_populates="modules"
    )
    tasks: Mapped[List["LearningTask"]] = relationship(
        "LearningTask",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="LearningTask.day_offset"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("order_index >= 0", name="ck_learning_modules_order_index_non_negative"),
        CheckConstraint("estimated_minutes IS NULL OR estimated_minutes > 0", 
                       name="ck_learning_modules_estimated_minutes_positive"),
        UniqueConstraint("plan_id", "order_index", name="uq_learning_modules_plan_order"),
    )


class LearningTask(Base):
    """Learning task table for individual learning activities."""
    
    __tablename__ = "learning_tasks"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("learning_modules.id", ondelete="CASCADE"),
        nullable=False
    )
    day_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    task_type: Mapped[TaskType] = mapped_column(Enum(TaskType), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_criteria: Mapped[str] = mapped_column(Text, nullable=False)
    resources: Mapped[List[dict]] = mapped_column(
        JSON, 
        nullable=False, 
        default=list
    )
    instructions: Mapped[Optional[dict]] = mapped_column(JSON)
    test_cases: Mapped[Optional[List[dict]]] = mapped_column(JSON)
    solution_template: Mapped[Optional[str]] = mapped_column(Text)
    hints: Mapped[List[str]] = mapped_column(JSON, default=list)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    module: Mapped["LearningModule"] = relationship(
        "LearningModule", 
        back_populates="tasks"
    )
    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    progress_records: Mapped[List["ProgressTracking"]] = relationship(
        "ProgressTracking",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("day_offset >= 0", name="ck_learning_tasks_day_offset_non_negative"),
        CheckConstraint("estimated_minutes > 0", name="ck_learning_tasks_estimated_minutes_positive"),
        CheckConstraint("time_limit_minutes IS NULL OR time_limit_minutes > 0", 
                       name="ck_learning_tasks_time_limit_positive"),
        UniqueConstraint("module_id", "day_offset", name="uq_learning_tasks_module_day"),
    )


class Submission(Base):
    """Submission table for learner code submissions."""
    
    __tablename__ = "submissions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("learning_tasks.id", ondelete="CASCADE"),
        nullable=False
    )
    code_content: Mapped[Optional[str]] = mapped_column(Text)
    repository_url: Mapped[Optional[str]] = mapped_column(String(500))
    language: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus), 
        default=SubmissionStatus.FAIL
    )
    score: Mapped[Optional[float]] = mapped_column(Float)
    execution_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    memory_used_mb: Mapped[Optional[int]] = mapped_column(Integer)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    evaluated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="submissions")
    task: Mapped["LearningTask"] = relationship("LearningTask", back_populates="submissions")
    evaluations: Mapped[List["Evaluation"]] = relationship(
        "Evaluation",
        back_populates="submission",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("score IS NULL OR (score >= 0.0 AND score <= 100.0)", 
                       name="ck_submissions_score_range"),
        CheckConstraint("execution_time_ms IS NULL OR execution_time_ms >= 0", 
                       name="ck_submissions_execution_time_non_negative"),
        CheckConstraint("memory_used_mb IS NULL OR memory_used_mb >= 0", 
                       name="ck_submissions_memory_used_non_negative"),
        CheckConstraint(
            "code_content IS NOT NULL OR repository_url IS NOT NULL",
            name="ck_submissions_content_required"
        ),
    )


class Evaluation(Base):
    """Evaluation table for submission assessment results."""
    
    __tablename__ = "evaluations"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False
    )
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    test_results: Mapped[Optional[dict]] = mapped_column(JSON)
    feedback: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    suggestions: Mapped[List[str]] = mapped_column(JSON, default=list)
    static_analysis: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    submission: Mapped["Submission"] = relationship("Submission", back_populates="evaluations")


class ProgressTracking(Base):
    """Progress tracking table for learning analytics."""
    
    __tablename__ = "progress_tracking"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("learning_tasks.id", ondelete="CASCADE"),
        nullable=False
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)
    best_score: Mapped[Optional[float]] = mapped_column(Float)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress_records")
    task: Mapped["LearningTask"] = relationship("LearningTask", back_populates="progress_records")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("attempts >= 0", name="ck_progress_tracking_attempts_non_negative"),
        CheckConstraint("consecutive_failures >= 0", 
                       name="ck_progress_tracking_consecutive_failures_non_negative"),
        CheckConstraint("best_score IS NULL OR (best_score >= 0.0 AND best_score <= 100.0)", 
                       name="ck_progress_tracking_best_score_range"),
        CheckConstraint("time_spent_minutes >= 0", 
                       name="ck_progress_tracking_time_spent_non_negative"),
        UniqueConstraint("user_id", "task_id", name="uq_progress_tracking_user_task"),
    )


# ============================================================================
# Enriched Learning Content Models
# ============================================================================

class LessonContent(Base):
    """Lesson content table for structured educational content."""
    
    __tablename__ = "lesson_content"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("learning_tasks.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_json: Mapped[dict] = mapped_column(
        JSON, 
        nullable=False,
        comment="Stores StructuredLesson with sections, concept cards, code examples"
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    skill_level: Mapped[SkillLevel] = mapped_column(
        Enum(SkillLevel), 
        nullable=False
    )
    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    topic: Mapped["LearningTask"] = relationship("LearningTask")
    reading_progress: Mapped[List["ReadingProgress"]] = relationship(
        "ReadingProgress",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
    notes: Mapped[List["UserContentNote"]] = relationship(
        "UserContentNote",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
    knowledge_check_attempts: Mapped[List["KnowledgeCheckAttempt"]] = relationship(
        "KnowledgeCheckAttempt",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estimated_minutes > 0", name="ck_lesson_content_estimated_minutes_positive"),
    )


class ReadingProgress(Base):
    """Reading progress table for tracking user progress through lessons."""
    
    __tablename__ = "reading_progress"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("lesson_content.id", ondelete="CASCADE"),
        nullable=False
    )
    current_section_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        comment="ID of the current section being read"
    )
    completed_sections: Mapped[List[str]] = mapped_column(
        JSON, 
        default=list,
        comment="Array of completed section IDs"
    )
    knowledge_check_results: Mapped[dict] = mapped_column(
        JSON, 
        default=dict,
        comment="Map of check_id to result object"
    )
    scroll_position: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Pixel position for resume"
    )
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    lesson: Mapped["LessonContent"] = relationship(
        "LessonContent", 
        back_populates="reading_progress"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_reading_progress_user_lesson"),
        CheckConstraint("scroll_position >= 0", name="ck_reading_progress_scroll_position_non_negative"),
        CheckConstraint("time_spent_seconds >= 0", name="ck_reading_progress_time_spent_non_negative"),
    )


class UserContentNote(Base):
    """User content notes table for highlights and personal notes."""
    
    __tablename__ = "user_content_notes"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("lesson_content.id", ondelete="CASCADE"),
        nullable=False
    )
    section_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        comment="Section ID the note/highlight is attached to"
    )
    note_type: Mapped[str] = mapped_column(
        String(20), 
        nullable=False,
        comment="highlight or note"
    )
    content: Mapped[str] = mapped_column(
        Text, 
        nullable=False,
        comment="Note text or highlighted text"
    )
    selection_start: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Character offset for highlight start"
    )
    selection_end: Mapped[Optional[int]] = mapped_column(
        Integer,
        comment="Character offset for highlight end"
    )
    color: Mapped[Optional[str]] = mapped_column(
        String(20),
        comment="Highlight color (yellow, green, blue, pink)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    lesson: Mapped["LessonContent"] = relationship(
        "LessonContent", 
        back_populates="notes"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("note_type IN ('highlight', 'note')", name="ck_user_content_notes_type"),
    )


class KnowledgeCheckAttempt(Base):
    """Knowledge check attempts table for tracking quiz answers."""
    
    __tablename__ = "knowledge_check_attempts"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("lesson_content.id", ondelete="CASCADE"),
        nullable=False
    )
    check_id: Mapped[str] = mapped_column(
        String(100), 
        nullable=False,
        comment="ID of the knowledge check within the lesson"
    )
    answer: Mapped[str] = mapped_column(
        Text, 
        nullable=False,
        comment="User submitted answer"
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    lesson: Mapped["LessonContent"] = relationship(
        "LessonContent", 
        back_populates="knowledge_check_attempts"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("attempt_number > 0", name="ck_knowledge_check_attempts_attempt_positive"),
        CheckConstraint("time_taken_seconds IS NULL OR time_taken_seconds >= 0",
                       name="ck_knowledge_check_attempts_time_non_negative"),
    )
