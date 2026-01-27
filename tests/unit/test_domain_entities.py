"""
Unit tests for domain entities.
"""
import pytest
from datetime import datetime

from src.domain import (
    UserProfile, LearningPlan, Module, Task, Submission, EvaluationResult,
    SkillLevel, TaskType, SubmissionStatus, LearningPlanStatus
)


class TestUserProfile:
    """Test cases for UserProfile entity."""
    
    def test_create_valid_user_profile(self):
        """Test creating a valid user profile."""
        profile = UserProfile(
            user_id="user-123",
            skill_level=SkillLevel.INTERMEDIATE,
            learning_goals=["Python", "FastAPI"],
            time_constraints={"hours_per_week": 10},
            preferences={"learning_style": "hands-on"}
        )
        
        assert profile.user_id == "user-123"
        assert profile.skill_level == SkillLevel.INTERMEDIATE
        assert profile.learning_goals == ["Python", "FastAPI"]
        assert profile.time_constraints == {"hours_per_week": 10}
        assert profile.preferences == {"learning_style": "hands-on"}
        assert profile.id is not None
        assert isinstance(profile.created_at, datetime)
        assert isinstance(profile.updated_at, datetime)
    
    def test_user_profile_validation(self):
        """Test user profile validation."""
        # Test empty user_id
        with pytest.raises(ValueError, match="user_id cannot be empty"):
            UserProfile(
                user_id="",
                skill_level=SkillLevel.BEGINNER,
                learning_goals=["Python"],
                time_constraints={},
                preferences={}
            )
        
        # Test empty learning_goals
        with pytest.raises(ValueError, match="learning_goals cannot be empty"):
            UserProfile(
                user_id="user-123",
                skill_level=SkillLevel.BEGINNER,
                learning_goals=[],
                time_constraints={},
                preferences={}
            )
    
    def test_update_skill_level(self):
        """Test updating skill level."""
        profile = UserProfile(
            user_id="user-123",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["Python"],
            time_constraints={},
            preferences={}
        )
        
        original_updated_at = profile.updated_at
        profile.update_skill_level(SkillLevel.INTERMEDIATE)
        
        assert profile.skill_level == SkillLevel.INTERMEDIATE
        assert profile.updated_at > original_updated_at


class TestTask:
    """Test cases for Task entity."""
    
    def test_create_valid_task(self):
        """Test creating a valid task."""
        task = Task(
            module_id="module-123",
            day_offset=1,
            task_type=TaskType.CODE,
            description="Write a FastAPI endpoint",
            estimated_minutes=60,
            completion_criteria="API returns 200 status"
        )
        
        assert task.module_id == "module-123"
        assert task.day_offset == 1
        assert task.task_type == TaskType.CODE
        assert task.description == "Write a FastAPI endpoint"
        assert task.estimated_minutes == 60
        assert task.completion_criteria == "API returns 200 status"
        assert task.id is not None
        assert task.resources == []
    
    def test_task_validation(self):
        """Test task validation."""
        # Test negative day_offset
        with pytest.raises(ValueError, match="day_offset must be non-negative"):
            Task(
                module_id="module-123",
                day_offset=-1,
                task_type=TaskType.CODE,
                description="Test task",
                estimated_minutes=60,
                completion_criteria="Complete"
            )
        
        # Test zero estimated_minutes
        with pytest.raises(ValueError, match="estimated_minutes must be positive"):
            Task(
                module_id="module-123",
                day_offset=1,
                task_type=TaskType.CODE,
                description="Test task",
                estimated_minutes=0,
                completion_criteria="Complete"
            )
    
    def test_is_coding_task(self):
        """Test checking if task is a coding task."""
        coding_task = Task(
            module_id="module-123",
            day_offset=1,
            task_type=TaskType.CODE,
            description="Write code",
            estimated_minutes=60,
            completion_criteria="Complete"
        )
        
        reading_task = Task(
            module_id="module-123",
            day_offset=1,
            task_type=TaskType.READ,
            description="Read documentation",
            estimated_minutes=30,
            completion_criteria="Complete"
        )
        
        assert coding_task.is_coding_task() is True
        assert reading_task.is_coding_task() is False


class TestSubmission:
    """Test cases for Submission entity."""
    
    def test_create_valid_submission_with_code(self):
        """Test creating a valid submission with code content."""
        submission = Submission(
            task_id="task-123",
            user_id="user-123",
            code_content="print('Hello, World!')"
        )
        
        assert submission.task_id == "task-123"
        assert submission.user_id == "user-123"
        assert submission.code_content == "print('Hello, World!')"
        assert submission.repository_url is None
        assert submission.id is not None
        assert isinstance(submission.submitted_at, datetime)
    
    def test_create_valid_submission_with_repo_url(self):
        """Test creating a valid submission with repository URL."""
        submission = Submission(
            task_id="task-123",
            user_id="user-123",
            repository_url="https://github.com/user/repo"
        )
        
        assert submission.task_id == "task-123"
        assert submission.user_id == "user-123"
        assert submission.code_content is None
        assert submission.repository_url == "https://github.com/user/repo"
    
    def test_submission_validation(self):
        """Test submission validation."""
        # Test no content provided
        with pytest.raises(ValueError, match="Either code_content or repository_url must be provided"):
            Submission(
                task_id="task-123",
                user_id="user-123"
            )
        
        # Test invalid URL
        with pytest.raises(ValueError, match="repository_url must be a valid URL"):
            Submission(
                task_id="task-123",
                user_id="user-123",
                repository_url="invalid-url"
            )


class TestEvaluationResult:
    """Test cases for EvaluationResult entity."""
    
    def test_create_valid_evaluation_result(self):
        """Test creating a valid evaluation result."""
        evaluation = EvaluationResult(
            submission_id="submission-123",
            passed=True,
            score=95.0,
            feedback={"overall_assessment": "Great work!", "suggestions": []},
            execution_time=1.5,
            test_results={"tests_passed": 5, "tests_failed": 0}
        )
        
        assert evaluation.submission_id == "submission-123"
        assert evaluation.passed is True
        assert evaluation.test_results == {"tests_passed": 5, "tests_failed": 0}
        assert evaluation.score == 95.0
        assert evaluation.feedback["overall_assessment"] == "Great work!"
        assert evaluation.id is not None
        assert isinstance(evaluation.evaluated_at, datetime)
    
    def test_evaluation_result_validation(self):
        """Test evaluation result validation."""
        # Test invalid score (too high)
        with pytest.raises(ValueError, match="score must be between 0.0 and 100.0"):
            EvaluationResult(
                submission_id="submission-123",
                passed=True,
                score=150.0,
                feedback={},
                execution_time=1.0
            )
        
        # Test invalid score (negative)
        with pytest.raises(ValueError, match="score must be between 0.0 and 100.0"):
            EvaluationResult(
                submission_id="submission-123",
                passed=True,
                score=-10.0,
                feedback={},
                execution_time=1.0
            )
    
    def test_is_passing(self):
        """Test checking if evaluation is passing."""
        passing_eval = EvaluationResult(
            submission_id="submission-123",
            passed=True,
            score=95.0,
            feedback={"overall_assessment": "Great work!"},
            execution_time=1.0
        )
        
        failing_eval = EvaluationResult(
            submission_id="submission-123",
            passed=False,
            score=45.0,
            feedback={"overall_assessment": "Needs improvement"},
            execution_time=1.0
        )
        
        assert passing_eval.is_passing() is True
        assert failing_eval.is_passing() is False