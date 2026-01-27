"""
PostgreSQL implementation of the SubmissionRepository interface.
"""
import uuid
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, update, delete, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from src.domain.entities.submission import Submission
from src.domain.entities.evaluation_result import EvaluationResult
from src.domain.value_objects.enums import SubmissionStatus
from src.ports.repositories.submission_repository import SubmissionRepository
from src.ports.repositories.base_repository import (
    EntityNotFoundError, RepositoryError
)
from src.adapters.database.models import (
    Submission as SubmissionModel,
    Evaluation as EvaluationModel,
    User, LearningTask as LearningTaskModel
)


class PostgresSubmissionRepository(SubmissionRepository):
    """
    PostgreSQL implementation of the SubmissionRepository interface.
    
    This repository handles submission and evaluation result persistence
    operations using SQLAlchemy and PostgreSQL as the backend database.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize the repository with a database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    # Submission Operations
    async def save_submission(self, submission: Submission) -> Submission:
        """
        Save a submission (create or update).
        
        Args:
            submission: The submission to save
            
        Returns:
            Submission: The saved submission
        """
        try:
            submission_uuid = uuid.UUID(submission.id)
            user_uuid = uuid.UUID(submission.user_id)
            task_uuid = uuid.UUID(submission.task_id)
        except ValueError as e:
            raise RepositoryError(f"Invalid UUID format: {str(e)}")
        
        # Check if submission exists
        existing = await self.session.get(SubmissionModel, submission_uuid)
        
        if existing:
            # Update existing submission
            existing.code_content = submission.code_content
            existing.repository_url = submission.repository_url
            existing.submitted_at = submission.submitted_at
            
            submission_model = existing
        else:
            # Create new submission
            submission_model = SubmissionModel(
                id=submission_uuid,
                user_id=user_uuid,
                task_id=task_uuid,
                code_content=submission.code_content,
                repository_url=submission.repository_url,
                submitted_at=submission.submitted_at
            )
            self.session.add(submission_model)
        
        await self.session.commit()
        
        return self._submission_to_domain(submission_model)
    
    async def get_submission(self, submission_id: str) -> Optional[Submission]:
        """
        Retrieve a submission by ID.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            Submission or None if not found
        """
        try:
            submission_uuid = uuid.UUID(submission_id)
        except ValueError:
            return None
        
        submission_model = await self.session.get(SubmissionModel, submission_uuid)
        
        if submission_model is None:
            return None
        
        return self._submission_to_domain(submission_model)
    
    async def get_user_submissions(
        self, 
        user_id: str, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[Submission]:
        """
        Get all submissions for a user with pagination.
        
        Args:
            user_id: Unique identifier for the user
            limit: Maximum number of submissions to return
            offset: Number of submissions to skip
            
        Returns:
            List[Submission]: List of user's submissions
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(SubmissionModel)
            .where(SubmissionModel.user_id == user_uuid)
            .order_by(desc(SubmissionModel.submitted_at))
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.session.execute(stmt)
        submission_models = result.scalars().all()
        
        return [self._submission_to_domain(submission) for submission in submission_models]
    
    async def get_task_submissions(
        self, 
        task_id: str, 
        user_id: Optional[str] = None
    ) -> List[Submission]:
        """
        Get all submissions for a task, optionally filtered by user.
        
        Args:
            task_id: Unique identifier for the task
            user_id: Optional user filter
            
        Returns:
            List[Submission]: List of submissions for the task
        """
        try:
            task_uuid = uuid.UUID(task_id)
        except ValueError:
            return []
        
        stmt = select(SubmissionModel).where(SubmissionModel.task_id == task_uuid)
        
        if user_id:
            try:
                user_uuid = uuid.UUID(user_id)
                stmt = stmt.where(SubmissionModel.user_id == user_uuid)
            except ValueError:
                return []
        
        stmt = stmt.order_by(desc(SubmissionModel.submitted_at))
        
        result = await self.session.execute(stmt)
        submission_models = result.scalars().all()
        
        return [self._submission_to_domain(submission) for submission in submission_models]
    
    async def get_submissions_by_date_range(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Submission]:
        """
        Get submissions within a date range for a user.
        
        Args:
            user_id: Unique identifier for the user
            start_date: Start of date range (inclusive)
            end_date: End of date range (inclusive)
            
        Returns:
            List[Submission]: List of submissions within date range
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(SubmissionModel)
            .where(
                and_(
                    SubmissionModel.user_id == user_uuid,
                    SubmissionModel.submitted_at >= start_date,
                    SubmissionModel.submitted_at <= end_date
                )
            )
            .order_by(desc(SubmissionModel.submitted_at))
        )
        
        result = await self.session.execute(stmt)
        submission_models = result.scalars().all()
        
        return [self._submission_to_domain(submission) for submission in submission_models]
    
    async def delete_submission(self, submission_id: str) -> bool:
        """
        Delete a submission and all associated evaluations.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            submission_uuid = uuid.UUID(submission_id)
        except ValueError:
            return False
        
        stmt = delete(SubmissionModel).where(SubmissionModel.id == submission_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    # Evaluation Operations
    async def save_evaluation(self, evaluation: EvaluationResult) -> EvaluationResult:
        """
        Save an evaluation result (create or update).
        
        Args:
            evaluation: The evaluation result to save
            
        Returns:
            EvaluationResult: The saved evaluation result
        """
        try:
            evaluation_uuid = uuid.UUID(evaluation.id)
            submission_uuid = uuid.UUID(evaluation.submission_id)
        except ValueError as e:
            raise RepositoryError(f"Invalid UUID format: {str(e)}")
        
        # Check if evaluation exists
        existing = await self.session.get(EvaluationModel, evaluation_uuid)
        
        if existing:
            # Update existing evaluation
            existing.passed = evaluation.is_passing()
            existing.test_results = evaluation.test_output
            existing.feedback = {"message": evaluation.feedback_message}
            existing.static_analysis = evaluation.static_feedback
            existing.created_at = evaluation.evaluated_at
            
            evaluation_model = existing
        else:
            # Create new evaluation
            evaluation_model = EvaluationModel(
                id=evaluation_uuid,
                submission_id=submission_uuid,
                agent_type="ReviewerAgent",  # Default agent type
                passed=evaluation.is_passing(),
                test_results=evaluation.test_output,
                feedback={"message": evaluation.feedback_message},
                static_analysis=evaluation.static_feedback,
                created_at=evaluation.evaluated_at
            )
            self.session.add(evaluation_model)
        
        # Update submission with evaluation results
        await self._update_submission_from_evaluation(submission_uuid, evaluation)
        
        await self.session.commit()
        
        return self._evaluation_to_domain(evaluation_model)
    
    async def _update_submission_from_evaluation(
        self, 
        submission_uuid: uuid.UUID, 
        evaluation: EvaluationResult
    ) -> None:
        """Update submission with evaluation results."""
        stmt = (
            update(SubmissionModel)
            .where(SubmissionModel.id == submission_uuid)
            .values(
                status=evaluation.status,
                score=evaluation.score,
                evaluated_at=evaluation.evaluated_at
            )
        )
        
        await self.session.execute(stmt)
    
    async def get_evaluation(self, evaluation_id: str) -> Optional[EvaluationResult]:
        """
        Retrieve an evaluation result by ID.
        
        Args:
            evaluation_id: Unique identifier for the evaluation
            
        Returns:
            EvaluationResult or None if not found
        """
        try:
            evaluation_uuid = uuid.UUID(evaluation_id)
        except ValueError:
            return None
        
        evaluation_model = await self.session.get(EvaluationModel, evaluation_uuid)
        
        if evaluation_model is None:
            return None
        
        return self._evaluation_to_domain(evaluation_model)
    
    async def get_submission_evaluations(self, submission_id: str) -> List[EvaluationResult]:
        """
        Get all evaluation results for a submission.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            List[EvaluationResult]: List of evaluation results
        """
        try:
            submission_uuid = uuid.UUID(submission_id)
        except ValueError:
            return []
        
        stmt = (
            select(EvaluationModel)
            .where(EvaluationModel.submission_id == submission_uuid)
            .order_by(desc(EvaluationModel.created_at))
        )
        
        result = await self.session.execute(stmt)
        evaluation_models = result.scalars().all()
        
        return [self._evaluation_to_domain(evaluation) for evaluation in evaluation_models]
    
    async def get_latest_evaluation(self, submission_id: str) -> Optional[EvaluationResult]:
        """
        Get the most recent evaluation result for a submission.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            EvaluationResult or None if no evaluations exist
        """
        try:
            submission_uuid = uuid.UUID(submission_id)
        except ValueError:
            return None
        
        stmt = (
            select(EvaluationModel)
            .where(EvaluationModel.submission_id == submission_uuid)
            .order_by(desc(EvaluationModel.created_at))
            .limit(1)
        )
        
        result = await self.session.execute(stmt)
        evaluation_model = result.scalar_one_or_none()
        
        if evaluation_model is None:
            return None
        
        return self._evaluation_to_domain(evaluation_model)
    
    async def get_user_evaluations(
        self, 
        user_id: str, 
        status_filter: Optional[SubmissionStatus] = None,
        limit: int = 100, 
        offset: int = 0
    ) -> List[EvaluationResult]:
        """
        Get evaluation results for a user with optional status filter.
        
        Args:
            user_id: Unique identifier for the user
            status_filter: Optional status to filter by
            limit: Maximum number of evaluations to return
            offset: Number of evaluations to skip
            
        Returns:
            List[EvaluationResult]: List of evaluation results
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return []
        
        stmt = (
            select(EvaluationModel)
            .join(SubmissionModel, EvaluationModel.submission_id == SubmissionModel.id)
            .where(SubmissionModel.user_id == user_uuid)
        )
        
        if status_filter:
            stmt = stmt.where(SubmissionModel.status == status_filter)
        
        stmt = (
            stmt.order_by(desc(EvaluationModel.created_at))
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.session.execute(stmt)
        evaluation_models = result.scalars().all()
        
        return [self._evaluation_to_domain(evaluation) for evaluation in evaluation_models]
    
    async def get_task_evaluation_stats(self, task_id: str) -> dict:
        """
        Get evaluation statistics for a task.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            dict: Statistics including pass rate, average score, etc.
        """
        try:
            task_uuid = uuid.UUID(task_id)
        except ValueError:
            return {}
        
        # Get submission statistics
        submission_stats = await self.session.execute(
            select(
                func.count(SubmissionModel.id).label('total_submissions'),
                func.count(
                    func.case((SubmissionModel.status == SubmissionStatus.PASS, 1))
                ).label('passed_submissions'),
                func.avg(SubmissionModel.score).label('average_score'),
                func.max(SubmissionModel.score).label('max_score'),
                func.min(SubmissionModel.score).label('min_score')
            )
            .where(SubmissionModel.task_id == task_uuid)
        )
        
        stats = submission_stats.first()
        
        if stats.total_submissions == 0:
            return {
                'total_submissions': 0,
                'pass_rate': 0.0,
                'average_score': 0.0,
                'max_score': 0.0,
                'min_score': 0.0
            }
        
        pass_rate = (stats.passed_submissions / stats.total_submissions) * 100
        
        return {
            'total_submissions': stats.total_submissions,
            'pass_rate': round(pass_rate, 2),
            'average_score': round(float(stats.average_score or 0), 2),
            'max_score': float(stats.max_score or 0),
            'min_score': float(stats.min_score or 0)
        }
    
    async def delete_evaluation(self, evaluation_id: str) -> bool:
        """
        Delete an evaluation result.
        
        Args:
            evaluation_id: Unique identifier for the evaluation
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            evaluation_uuid = uuid.UUID(evaluation_id)
        except ValueError:
            return False
        
        stmt = delete(EvaluationModel).where(EvaluationModel.id == evaluation_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    # Analytics and Reporting
    async def get_user_progress_summary(self, user_id: str) -> dict:
        """
        Get a summary of user's progress across all submissions.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            dict: Progress summary with completion rates, scores, etc.
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return {}
        
        # Get user submission statistics
        submission_stats = await self.session.execute(
            select(
                func.count(SubmissionModel.id).label('total_submissions'),
                func.count(
                    func.case((SubmissionModel.status == SubmissionStatus.PASS, 1))
                ).label('passed_submissions'),
                func.avg(SubmissionModel.score).label('average_score'),
                func.sum(SubmissionModel.execution_time_ms).label('total_execution_time')
            )
            .where(SubmissionModel.user_id == user_uuid)
        )
        
        stats = submission_stats.first()
        
        if stats.total_submissions == 0:
            return {
                'total_submissions': 0,
                'completion_rate': 0.0,
                'average_score': 0.0,
                'total_execution_time_ms': 0
            }
        
        completion_rate = (stats.passed_submissions / stats.total_submissions) * 100
        
        return {
            'total_submissions': stats.total_submissions,
            'completion_rate': round(completion_rate, 2),
            'average_score': round(float(stats.average_score or 0), 2),
            'total_execution_time_ms': int(stats.total_execution_time or 0)
        }
    
    async def get_submission_count(self, user_id: Optional[str] = None) -> int:
        """
        Get total count of submissions, optionally filtered by user.
        
        Args:
            user_id: Optional user filter
            
        Returns:
            int: Total number of submissions
        """
        stmt = select(func.count(SubmissionModel.id))
        
        if user_id:
            try:
                user_uuid = uuid.UUID(user_id)
                stmt = stmt.where(SubmissionModel.user_id == user_uuid)
            except ValueError:
                return 0
        
        result = await self.session.execute(stmt)
        return result.scalar() or 0
    
    # Domain conversion methods
    def _submission_to_domain(self, submission_model: SubmissionModel) -> Submission:
        """Convert database model to domain entity."""
        return Submission(
            id=str(submission_model.id),
            task_id=str(submission_model.task_id),
            user_id=str(submission_model.user_id),
            code_content=submission_model.code_content,
            repository_url=submission_model.repository_url,
            submitted_at=submission_model.submitted_at
        )
    
    def _evaluation_to_domain(self, evaluation_model: EvaluationModel) -> EvaluationResult:
        """Convert database model to domain entity."""
        # Determine status from passed flag
        if evaluation_model.passed:
            status = SubmissionStatus.PASS
        else:
            status = SubmissionStatus.FAIL
        
        # Extract feedback message
        feedback_message = ""
        if evaluation_model.feedback and isinstance(evaluation_model.feedback, dict):
            feedback_message = evaluation_model.feedback.get("message", "")
        
        # Calculate score from test results if available
        score = 0.0
        if evaluation_model.test_results and isinstance(evaluation_model.test_results, dict):
            score = evaluation_model.test_results.get("score", 0.0)
        
        return EvaluationResult(
            id=str(evaluation_model.id),
            submission_id=str(evaluation_model.submission_id),
            status=status,
            test_output=evaluation_model.test_results or {},
            static_feedback=evaluation_model.static_analysis,
            score=score,
            feedback_message=feedback_message,
            evaluated_at=evaluation_model.created_at
        )