"""
Submission repository interface for the Agentic Learning Coach system.
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime

from ...domain.entities import Submission, EvaluationResult
from ...domain.value_objects import SubmissionStatus


class SubmissionRepository(ABC):
    """
    Abstract repository interface for submission and evaluation operations.
    
    This interface defines the contract for submission and evaluation result
    persistence operations following the dependency inversion principle.
    """
    
    # Submission Operations
    @abstractmethod
    async def save_submission(self, submission: Submission) -> Submission:
        """
        Save a submission (create or update).
        
        Args:
            submission: The submission to save
            
        Returns:
            Submission: The saved submission
        """
        pass
    
    # Alias for save_submission to support both naming conventions
    async def save(self, submission: Submission) -> Submission:
        """Alias for save_submission."""
        return await self.save_submission(submission)
    
    @abstractmethod
    async def get_submission(self, submission_id: str) -> Optional[Submission]:
        """
        Retrieve a submission by ID.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            Submission or None if not found
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def delete_submission(self, submission_id: str) -> bool:
        """
        Delete a submission and all associated evaluations.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    # Evaluation Operations
    @abstractmethod
    async def save_evaluation(self, evaluation: EvaluationResult) -> EvaluationResult:
        """
        Save an evaluation result (create or update).
        
        Args:
            evaluation: The evaluation result to save
            
        Returns:
            EvaluationResult: The saved evaluation result
        """
        pass
    
    @abstractmethod
    async def get_evaluation(self, evaluation_id: str) -> Optional[EvaluationResult]:
        """
        Retrieve an evaluation result by ID.
        
        Args:
            evaluation_id: Unique identifier for the evaluation
            
        Returns:
            EvaluationResult or None if not found
        """
        pass
    
    @abstractmethod
    async def get_submission_evaluations(self, submission_id: str) -> List[EvaluationResult]:
        """
        Get all evaluation results for a submission.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            List[EvaluationResult]: List of evaluation results
        """
        pass
    
    @abstractmethod
    async def get_latest_evaluation(self, submission_id: str) -> Optional[EvaluationResult]:
        """
        Get the most recent evaluation result for a submission.
        
        Args:
            submission_id: Unique identifier for the submission
            
        Returns:
            EvaluationResult or None if no evaluations exist
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def get_task_evaluation_stats(self, task_id: str) -> dict:
        """
        Get evaluation statistics for a task.
        
        Args:
            task_id: Unique identifier for the task
            
        Returns:
            dict: Statistics including pass rate, average score, etc.
        """
        pass
    
    @abstractmethod
    async def delete_evaluation(self, evaluation_id: str) -> bool:
        """
        Delete an evaluation result.
        
        Args:
            evaluation_id: Unique identifier for the evaluation
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    # Analytics and Reporting
    @abstractmethod
    async def get_user_progress_summary(self, user_id: str) -> dict:
        """
        Get a summary of user's progress across all submissions.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            dict: Progress summary with completion rates, scores, etc.
        """
        pass
    
    @abstractmethod
    async def get_submission_count(self, user_id: Optional[str] = None) -> int:
        """
        Get total count of submissions, optionally filtered by user.
        
        Args:
            user_id: Optional user filter
            
        Returns:
            int: Total number of submissions
        """
        pass


# Alias for interface naming convention (I-prefix style)
ISubmissionRepository = SubmissionRepository
