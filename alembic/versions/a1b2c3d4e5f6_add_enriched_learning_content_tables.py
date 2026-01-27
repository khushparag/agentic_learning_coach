"""Add enriched learning content tables

Revision ID: a1b2c3d4e5f6
Revises: cd42d69f3345
Create Date: 2026-01-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'cd42d69f3345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create skill_level_enum if not exists (for lesson_content)
    skill_level_enum = postgresql.ENUM(
        'beginner', 'intermediate', 'advanced', 'expert',
        name='skill_level_enum',
        create_type=False
    )
    
    # Create lesson_content table
    op.create_table(
        'lesson_content',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, 
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('learning_tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content_json', postgresql.JSONB, nullable=False,
                  comment='Stores StructuredLesson with sections, concept cards, code examples'),
        sa.Column('version', sa.String(20), nullable=False, server_default='1.0.0'),
        sa.Column('skill_level', skill_level_enum, nullable=False),
        sa.Column('estimated_minutes', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
        sa.CheckConstraint('estimated_minutes > 0', name='ck_lesson_content_estimated_minutes_positive'),
    )
    
    # Create indexes for lesson_content
    op.create_index('idx_lesson_content_topic_id', 'lesson_content', ['topic_id'])
    op.create_index('idx_lesson_content_skill_level', 'lesson_content', ['skill_level'])
    
    # Create reading_progress table
    op.create_table(
        'reading_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('lesson_content.id', ondelete='CASCADE'), nullable=False),
        sa.Column('current_section_id', sa.String(100), nullable=True,
                  comment='ID of the current section being read'),
        sa.Column('completed_sections', postgresql.JSONB, server_default='[]',
                  comment='Array of completed section IDs'),
        sa.Column('knowledge_check_results', postgresql.JSONB, server_default='{}',
                  comment='Map of check_id to result object'),
        sa.Column('scroll_position', sa.Integer, server_default='0',
                  comment='Pixel position for resume'),
        sa.Column('time_spent_seconds', sa.Integer, server_default='0'),
        sa.Column('completed', sa.Boolean, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'lesson_id', name='uq_reading_progress_user_lesson'),
        sa.CheckConstraint('scroll_position >= 0', name='ck_reading_progress_scroll_position_non_negative'),
        sa.CheckConstraint('time_spent_seconds >= 0', name='ck_reading_progress_time_spent_non_negative'),
    )
    
    # Create indexes for reading_progress
    op.create_index('idx_reading_progress_user_id', 'reading_progress', ['user_id'])
    op.create_index('idx_reading_progress_lesson_id', 'reading_progress', ['lesson_id'])
    
    # Create user_content_notes table
    op.create_table(
        'user_content_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('lesson_content.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', sa.String(100), nullable=True,
                  comment='Section ID the note/highlight is attached to'),
        sa.Column('note_type', sa.String(20), nullable=False,
                  comment='highlight or note'),
        sa.Column('content', sa.Text, nullable=False,
                  comment='Note text or highlighted text'),
        sa.Column('selection_start', sa.Integer, nullable=True,
                  comment='Character offset for highlight start'),
        sa.Column('selection_end', sa.Integer, nullable=True,
                  comment='Character offset for highlight end'),
        sa.Column('color', sa.String(20), nullable=True,
                  comment='Highlight color (yellow, green, blue, pink)'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
        sa.CheckConstraint("note_type IN ('highlight', 'note')", name='ck_user_content_notes_type'),
    )
    
    # Create indexes for user_content_notes
    op.create_index('idx_user_content_notes_user_lesson', 'user_content_notes', ['user_id', 'lesson_id'])
    
    # Create knowledge_check_attempts table
    op.create_table(
        'knowledge_check_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('lesson_content.id', ondelete='CASCADE'), nullable=False),
        sa.Column('check_id', sa.String(100), nullable=False,
                  comment='ID of the knowledge check within the lesson'),
        sa.Column('answer', sa.Text, nullable=False,
                  comment='User submitted answer'),
        sa.Column('is_correct', sa.Boolean, nullable=False),
        sa.Column('attempt_number', sa.Integer, nullable=False),
        sa.Column('time_taken_seconds', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('attempt_number > 0', name='ck_knowledge_check_attempts_attempt_positive'),
        sa.CheckConstraint('time_taken_seconds IS NULL OR time_taken_seconds >= 0',
                          name='ck_knowledge_check_attempts_time_non_negative'),
    )
    
    # Create indexes for knowledge_check_attempts
    op.create_index('idx_kc_attempts_user_lesson', 'knowledge_check_attempts', ['user_id', 'lesson_id'])
    op.create_index('idx_kc_attempts_check_id', 'knowledge_check_attempts', ['check_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('idx_kc_attempts_check_id', table_name='knowledge_check_attempts')
    op.drop_index('idx_kc_attempts_user_lesson', table_name='knowledge_check_attempts')
    op.drop_table('knowledge_check_attempts')
    
    op.drop_index('idx_user_content_notes_user_lesson', table_name='user_content_notes')
    op.drop_table('user_content_notes')
    
    op.drop_index('idx_reading_progress_lesson_id', table_name='reading_progress')
    op.drop_index('idx_reading_progress_user_id', table_name='reading_progress')
    op.drop_table('reading_progress')
    
    op.drop_index('idx_lesson_content_skill_level', table_name='lesson_content')
    op.drop_index('idx_lesson_content_topic_id', table_name='lesson_content')
    op.drop_table('lesson_content')
