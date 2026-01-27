"""Initial migration with all tables

Revision ID: cd42d69f3345
Revises:
Create Date: 2026-01-11 16:46:08.578555

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "cd42d69f3345"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums with checkfirst=True to avoid errors if they already exist
    skill_level_enum = postgresql.ENUM(
        'beginner', 'intermediate', 'advanced', 'expert',
        name='skilllevel',
        create_type=False
    )
    skill_level_enum.create(op.get_bind(), checkfirst=True)
    
    task_type_enum = postgresql.ENUM(
        'READ', 'WATCH', 'CODE', 'QUIZ',
        name='tasktype',
        create_type=False
    )
    task_type_enum.create(op.get_bind(), checkfirst=True)
    
    submission_status_enum = postgresql.ENUM(
        'PASS', 'FAIL', 'PARTIAL',
        name='submissionstatus',
        create_type=False
    )
    submission_status_enum.create(op.get_bind(), checkfirst=True)
    
    learning_plan_status_enum = postgresql.ENUM(
        'draft', 'active', 'completed', 'paused',
        name='learningplanstatus',
        create_type=False
    )
    learning_plan_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('username', sa.String(50), unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create learning_profiles table
    op.create_table(
        'learning_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('skill_level', skill_level_enum, nullable=False),
        sa.Column('learning_goals', postgresql.JSON, nullable=False, default=sa.text("'[]'")),
        sa.Column('time_constraints', postgresql.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('preferences', postgresql.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('assessment_completed', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', name='uq_learning_profiles_user_id'),
    )
    
    # Create learning_plans table
    op.create_table(
        'learning_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('goal_description', sa.Text(), nullable=False),
        sa.Column('status', learning_plan_status_enum, default='draft'),
        sa.Column('total_days', sa.Integer(), nullable=False),
        sa.Column('estimated_hours', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('total_days > 0', name='ck_learning_plans_total_days_positive'),
        sa.CheckConstraint('estimated_hours IS NULL OR estimated_hours > 0', name='ck_learning_plans_estimated_hours_positive'),
    )
    
    # Create learning_modules table
    op.create_table(
        'learning_modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('learning_plans.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('learning_objectives', postgresql.JSON, nullable=False, default=sa.text("'[]'")),
        sa.Column('estimated_minutes', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('order_index >= 0', name='ck_learning_modules_order_index_non_negative'),
        sa.CheckConstraint('estimated_minutes IS NULL OR estimated_minutes > 0', name='ck_learning_modules_estimated_minutes_positive'),
        sa.UniqueConstraint('plan_id', 'order_index', name='uq_learning_modules_plan_order'),
    )
    
    # Create learning_tasks table
    op.create_table(
        'learning_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('module_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('learning_modules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('day_offset', sa.Integer(), nullable=False),
        sa.Column('task_type', task_type_enum, nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('estimated_minutes', sa.Integer(), nullable=False),
        sa.Column('completion_criteria', sa.Text(), nullable=False),
        sa.Column('resources', postgresql.JSON, nullable=False, default=sa.text("'[]'")),
        sa.Column('instructions', postgresql.JSON),
        sa.Column('test_cases', postgresql.JSON),
        sa.Column('solution_template', sa.Text()),
        sa.Column('hints', postgresql.JSON, default=sa.text("'[]'")),
        sa.Column('time_limit_minutes', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('day_offset >= 0', name='ck_learning_tasks_day_offset_non_negative'),
        sa.CheckConstraint('estimated_minutes > 0', name='ck_learning_tasks_estimated_minutes_positive'),
        sa.CheckConstraint('time_limit_minutes IS NULL OR time_limit_minutes > 0', name='ck_learning_tasks_time_limit_positive'),
        sa.UniqueConstraint('module_id', 'day_offset', name='uq_learning_tasks_module_day'),
    )
    
    # Create submissions table
    op.create_table(
        'submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('learning_tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code_content', sa.Text()),
        sa.Column('repository_url', sa.String(500)),
        sa.Column('language', sa.String(50)),
        sa.Column('status', submission_status_enum, default='FAIL'),
        sa.Column('score', sa.Float()),
        sa.Column('execution_time_ms', sa.Integer()),
        sa.Column('memory_used_mb', sa.Integer()),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('evaluated_at', sa.DateTime(timezone=True)),
        sa.CheckConstraint('score IS NULL OR (score >= 0.0 AND score <= 100.0)', name='ck_submissions_score_range'),
        sa.CheckConstraint('execution_time_ms IS NULL OR execution_time_ms >= 0', name='ck_submissions_execution_time_non_negative'),
        sa.CheckConstraint('memory_used_mb IS NULL OR memory_used_mb >= 0', name='ck_submissions_memory_used_non_negative'),
        sa.CheckConstraint('code_content IS NOT NULL OR repository_url IS NOT NULL', name='ck_submissions_content_required'),
    )
    
    # Create evaluations table
    op.create_table(
        'evaluations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('submission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_type', sa.String(50), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('test_results', postgresql.JSON),
        sa.Column('feedback', postgresql.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('suggestions', postgresql.JSON, default=sa.text("'[]'")),
        sa.Column('static_analysis', postgresql.JSON),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create progress_tracking table
    op.create_table(
        'progress_tracking',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('learning_tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('attempts', sa.Integer(), default=0),
        sa.Column('consecutive_failures', sa.Integer(), default=0),
        sa.Column('best_score', sa.Float()),
        sa.Column('time_spent_minutes', sa.Integer(), default=0),
        sa.Column('completed', sa.Boolean(), default=False),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('last_attempt_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('attempts >= 0', name='ck_progress_tracking_attempts_non_negative'),
        sa.CheckConstraint('consecutive_failures >= 0', name='ck_progress_tracking_consecutive_failures_non_negative'),
        sa.CheckConstraint('best_score IS NULL OR (best_score >= 0.0 AND best_score <= 100.0)', name='ck_progress_tracking_best_score_range'),
        sa.CheckConstraint('time_spent_minutes >= 0', name='ck_progress_tracking_time_spent_non_negative'),
        sa.UniqueConstraint('user_id', 'task_id', name='uq_progress_tracking_user_task'),
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('progress_tracking')
    op.drop_table('evaluations')
    op.drop_table('submissions')
    op.drop_table('learning_tasks')
    op.drop_table('learning_modules')
    op.drop_table('learning_plans')
    op.drop_table('learning_profiles')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS learningplanstatus')
    op.execute('DROP TYPE IF EXISTS submissionstatus')
    op.execute('DROP TYPE IF EXISTS tasktype')
    op.execute('DROP TYPE IF EXISTS skilllevel')
