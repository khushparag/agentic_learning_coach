"""
Unit tests for ProgressTracker agent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta

from src.agents.progress_tracker import (
    ProgressTracker,
    ProgressMetrics,
    AdaptationTrigger,
    DailyTaskInfo
)
from src.agents.base.types import LearningContext, AgentResult, AgentType
from src.agents.base.exceptions import ValidationError, AgentProcessingError
from src.domain.entities.learning_plan import LearningPlan
from src.domain.entities.module import Module
from src.domain.entities.task import Task
from src.domain.entities.submission import Submission
from src.domain.entities.evaluation_result import EvaluationResult
from src.domain.value_objects.enums import LearningPlanStatus, TaskType, SubmissionStatus


class TestProgressTracker:
    """Test cases for ProgressTracker agent."""
    
    @pytest.fixture
    def mock_curriculum_repository(self):
        """Create a mock curriculum repository."""
        return AsyncMock()
    
    @pytest.fixture
    def mock_submission_repository(self):
        """Create a mock submission repository."""
        return AsyncMock()

    @pytest.fixture
    def progress_tracker(self, mock_curriculum_repository, mock_submission_repository):
        """Create a ProgressTracker instance with mocked dependencies."""
        return ProgressTracker(mock_curriculum_repository, mock_submission_repository)
    
    @pytest.fixture
    def sample_context(self):
        """Create a sample learning context."""
        return LearningContext(
            user_id="test-user-123",
            session_id="session-456",
            current_objective="track_progress",
            correlation_id="corr-789"
        )
    
    @pytest.fixture
    def sample_learning_plan(self):
        """Create a sample learning plan with modules and tasks."""
        plan = LearningPlan(
            user_id="test-user-123",
            title="JavaScript Learning Path",
            goal_description="Learn JavaScript fundamentals",
            total_days=30,
            status=LearningPlanStatus.ACTIVE
        )
        plan.created_at = datetime.utcnow() - timedelta(days=5)
        
        # Add a sample module with tasks
        module = Module(
            plan_id=plan.id,
            title="JavaScript Basics",
            order_index=0,
            summary="Learn JavaScript fundamentals"
        )
        
        for i in range(5):
            task = Task(
                module_id=module.id,
                day_offset=i,
                task_type=TaskType.CODE if i % 2 == 1 else TaskType.READ,
                description=f"Day {i+1} task: Learn about topic {i+1}",
                estimated_minutes=60,
                completion_criteria="Complete the task successfully"
            )
            module.tasks.append(task)
        
        plan.modules.append(module)
        return plan

    @pytest.fixture
    def sample_submissions(self):
        """Create sample submissions."""
        submissions = []
        for i in range(5):
            submission = Submission(
                task_id=f"task-{i}",
                user_id="test-user-123",
                code_content=f"console.log('solution {i}');"
            )
            submission.submitted_at = datetime.utcnow() - timedelta(days=i)
            submissions.append(submission)
        return submissions
    
    @pytest.fixture
    def sample_evaluations(self):
        """Create sample evaluation results."""
        evaluations = []
        for i in range(3):
            evaluation = EvaluationResult(
                submission_id=f"submission-{i}",
                passed=i % 2 == 0,  # Alternating pass/fail
                score=80.0 if i % 2 == 0 else 40.0,
                feedback={"overall_assessment": f"Feedback for submission {i}"},
                execution_time=1.5
            )
            evaluations.append(evaluation)
        return evaluations

    # ==================== Basic Tests ====================
    
    def test_get_supported_intents(self, progress_tracker):
        """Test that ProgressTracker returns correct supported intents."""
        intents = progress_tracker.get_supported_intents()
        
        expected_intents = [
            "check_progress",
            "review_mistakes",
            "get_recommendations",
            "get_daily_tasks",
            "record_attempt",
            "detect_adaptation_triggers",
            "get_progress_visualization",
            "get_streak_info",
            "calculate_metrics"
        ]
        
        assert all(intent in intents for intent in expected_intents)
        assert len(intents) == len(expected_intents)
    
    def test_agent_type(self, progress_tracker):
        """Test that ProgressTracker has correct agent type."""
        assert progress_tracker.agent_type == AgentType.PROGRESS_TRACKER

    # ==================== Check Progress Tests ====================
    
    @pytest.mark.asyncio
    async def test_check_progress_success(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test successful progress check."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_user_progress_summary.return_value = {
            "total_submissions": 10,
            "passed_submissions": 7,
            "failed_submissions": 3,
            "completed_tasks": 3,
            "average_score": 75.0,
            "time_spent_minutes": 180
        }
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "check_progress"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_active_plan"] is True
        assert "metrics" in result.data
        assert "summary" in result.data
        assert result.data["plan_title"] == "JavaScript Learning Path"
    
    @pytest.mark.asyncio
    async def test_check_progress_no_active_plan(
        self, progress_tracker, sample_context, mock_curriculum_repository
    ):
        """Test progress check when no active plan exists."""
        mock_curriculum_repository.get_active_plan.return_value = None
        
        payload = {"intent": "check_progress"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_active_plan"] is False
        assert "create_learning_plan" in result.next_actions

    # ==================== Daily Tasks Tests ====================
    
    @pytest.mark.asyncio
    async def test_get_daily_tasks_success(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test successful daily tasks retrieval."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        
        # Return tasks for day 0
        tasks = sample_learning_plan.get_tasks_for_day(0)
        mock_curriculum_repository.get_tasks_for_day.return_value = tasks
        mock_submission_repository.get_task_submissions.return_value = []
        mock_submission_repository.get_latest_evaluation.return_value = None
        
        payload = {"intent": "get_daily_tasks", "day_offset": 0}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert "tasks" in result.data
        assert result.data["day_offset"] == 0
        assert "total_tasks" in result.data
        assert "daily_summary" in result.data
    
    @pytest.mark.asyncio
    async def test_get_daily_tasks_no_plan(
        self, progress_tracker, sample_context, mock_curriculum_repository
    ):
        """Test daily tasks retrieval fails without active plan."""
        mock_curriculum_repository.get_active_plan.return_value = None
        
        payload = {"intent": "get_daily_tasks", "day_offset": 0}
        
        with pytest.raises(ValidationError):
            await progress_tracker.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_get_daily_tasks_with_target_date(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test daily tasks retrieval with target date."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_curriculum_repository.get_tasks_for_day.return_value = []
        
        target_date = (sample_learning_plan.created_at + timedelta(days=3)).isoformat()
        payload = {"intent": "get_daily_tasks", "target_date": target_date}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["day_offset"] == 3

    # ==================== Record Attempt Tests ====================
    
    @pytest.mark.asyncio
    async def test_record_attempt_success_passed(
        self, progress_tracker, sample_context, mock_submission_repository
    ):
        """Test recording a successful attempt."""
        mock_submission_repository.get_task_submissions.return_value = []
        
        payload = {
            "intent": "record_attempt",
            "task_id": "task-123",
            "passed": True,
            "score": 95.0
        }
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["task_id"] == "task-123"
        assert result.data["passed"] is True
        assert result.data["attempt_count"] == 1
        assert result.data["consecutive_failures"] == 0
    
    @pytest.mark.asyncio
    async def test_record_attempt_quick_success_trigger(
        self, progress_tracker, sample_context, mock_submission_repository
    ):
        """Test that quick success triggers adaptation."""
        mock_submission_repository.get_task_submissions.return_value = []
        
        payload = {
            "intent": "record_attempt",
            "task_id": "task-123",
            "passed": True,
            "score": 95.0  # High score on first attempt
        }
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["needs_adaptation"] is True
        
        triggers = result.data["adaptation_triggers"]
        assert len(triggers) > 0
        assert any(t["trigger_type"] == "quick_success" for t in triggers)
    
    @pytest.mark.asyncio
    async def test_record_attempt_consecutive_failures_trigger(
        self, progress_tracker, sample_context, mock_submission_repository,
        sample_submissions
    ):
        """Test that consecutive failures trigger adaptation."""
        # Simulate 2 previous failed submissions
        mock_submission_repository.get_task_submissions.return_value = sample_submissions[:2]
        
        payload = {
            "intent": "record_attempt",
            "task_id": "task-123",
            "passed": False,
            "score": 30.0
        }
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["passed"] is False
        assert result.data["consecutive_failures"] >= 2
        assert result.data["needs_adaptation"] is True
        
        triggers = result.data["adaptation_triggers"]
        assert any(t["trigger_type"] == "consecutive_failures" for t in triggers)
    
    @pytest.mark.asyncio
    async def test_record_attempt_missing_task_id(
        self, progress_tracker, sample_context
    ):
        """Test that record attempt fails without task_id."""
        payload = {"intent": "record_attempt", "passed": True}
        
        with pytest.raises(ValidationError):
            await progress_tracker.process(sample_context, payload)

    # ==================== Review Mistakes Tests ====================
    
    @pytest.mark.asyncio
    async def test_review_mistakes_with_failures(
        self, progress_tracker, sample_context, mock_submission_repository,
        sample_evaluations
    ):
        """Test reviewing mistakes when failures exist."""
        failed_evals = [e for e in sample_evaluations if not e.passed]
        mock_submission_repository.get_user_evaluations.return_value = failed_evals
        
        payload = {"intent": "review_mistakes", "limit": 10}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_mistakes"] is True
        assert "mistakes" in result.data
        assert "analysis" in result.data
        assert "common_issues" in result.data
    
    @pytest.mark.asyncio
    async def test_review_mistakes_no_failures(
        self, progress_tracker, sample_context, mock_submission_repository
    ):
        """Test reviewing mistakes when no failures exist."""
        mock_submission_repository.get_user_evaluations.return_value = []
        
        payload = {"intent": "review_mistakes"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_mistakes"] is False

    # ==================== Get Recommendations Tests ====================
    
    @pytest.mark.asyncio
    async def test_get_recommendations_with_plan(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test getting recommendations with active plan."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_user_progress_summary.return_value = {
            "total_submissions": 5,
            "passed_submissions": 2,
            "failed_submissions": 3,
            "completed_tasks": 2,
            "average_score": 60.0,
            "time_spent_minutes": 90
        }
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "get_recommendations"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert "recommendations" in result.data
        assert len(result.data["recommendations"]) > 0
    
    @pytest.mark.asyncio
    async def test_get_recommendations_no_plan(
        self, progress_tracker, sample_context, mock_curriculum_repository
    ):
        """Test getting recommendations without active plan."""
        mock_curriculum_repository.get_active_plan.return_value = None
        
        payload = {"intent": "get_recommendations"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert "recommendations" in result.data
        assert any(r["action"] == "create_learning_plan" for r in result.data["recommendations"])

    # ==================== Adaptation Triggers Tests ====================
    
    @pytest.mark.asyncio
    async def test_detect_adaptation_triggers_low_success(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test detecting low success rate trigger."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_user_progress_summary.return_value = {
            "total_submissions": 10,
            "passed_submissions": 3,  # 30% success rate
            "failed_submissions": 7,
            "completed_tasks": 2,
            "average_score": 40.0,
            "time_spent_minutes": 120
        }
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "detect_adaptation_triggers"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["triggers_detected"] is True
        
        triggers = result.data["triggers"]
        assert any(t["trigger_type"] == "low_success_rate" for t in triggers)
    
    @pytest.mark.asyncio
    async def test_detect_adaptation_triggers_high_success(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test detecting high success rate trigger."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_user_progress_summary.return_value = {
            "total_submissions": 10,
            "passed_submissions": 10,  # 100% success rate
            "failed_submissions": 0,
            "completed_tasks": 5,
            "average_score": 95.0,
            "time_spent_minutes": 200
        }
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "detect_adaptation_triggers"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        
        triggers = result.data["triggers"]
        assert any(t["trigger_type"] == "high_success_rate" for t in triggers)

    # ==================== Streak Tests ====================
    
    @pytest.mark.asyncio
    async def test_get_streak_info_with_activity(
        self, progress_tracker, sample_context, mock_submission_repository,
        sample_submissions
    ):
        """Test getting streak info with recent activity."""
        mock_submission_repository.get_submissions_by_date_range.return_value = sample_submissions
        
        payload = {"intent": "get_streak_info"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert "current_streak" in result.data
        assert "longest_streak" in result.data
        assert "streak_at_risk" in result.data
    
    @pytest.mark.asyncio
    async def test_get_streak_info_no_activity(
        self, progress_tracker, sample_context, mock_submission_repository
    ):
        """Test getting streak info with no activity."""
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "get_streak_info"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["current_streak"] == 0
        assert result.data["longest_streak"] == 0

    # ==================== Visualization Tests ====================
    
    @pytest.mark.asyncio
    async def test_get_progress_visualization_timeline(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan, sample_submissions
    ):
        """Test getting timeline visualization data."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_submissions_by_date_range.return_value = sample_submissions
        
        payload = {
            "intent": "get_progress_visualization",
            "visualization_type": "timeline",
            "days_back": 30
        }
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["visualization_type"] == "timeline"
        assert "data" in result.data
        assert result.data["data"]["type"] == "timeline"
    
    @pytest.mark.asyncio
    async def test_get_progress_visualization_heatmap(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan, sample_submissions
    ):
        """Test getting heatmap visualization data."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_submissions_by_date_range.return_value = sample_submissions
        
        payload = {
            "intent": "get_progress_visualization",
            "visualization_type": "heatmap",
            "days_back": 30
        }
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["visualization_type"] == "heatmap"
        assert "weeks" in result.data["data"]

    # ==================== Calculate Metrics Tests ====================
    
    @pytest.mark.asyncio
    async def test_calculate_metrics_success(
        self, progress_tracker, sample_context, mock_curriculum_repository,
        mock_submission_repository, sample_learning_plan
    ):
        """Test calculating metrics."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_submission_repository.get_user_progress_summary.return_value = {
            "total_submissions": 15,
            "passed_submissions": 12,
            "failed_submissions": 3,
            "completed_tasks": 4,
            "average_score": 82.5,
            "time_spent_minutes": 240
        }
        mock_submission_repository.get_submissions_by_date_range.return_value = []
        
        payload = {"intent": "calculate_metrics"}
        result = await progress_tracker.process(sample_context, payload)
        
        assert result.success is True
        assert "metrics" in result.data
        
        metrics = result.data["metrics"]
        assert metrics["total_submissions"] == 15
        assert metrics["passed_submissions"] == 12
        assert metrics["success_rate"] == 80.0  # 12/15 * 100

    # ==================== Helper Method Tests ====================
    
    def test_calculate_streak_consecutive_days(self, progress_tracker):
        """Test streak calculation with consecutive days."""
        today = datetime.utcnow()
        submissions = []
        
        # Create submissions for 5 consecutive days
        for i in range(5):
            submission = Submission(
                task_id=f"task-{i}",
                user_id="test-user",
                code_content="test code"
            )
            submission.submitted_at = today - timedelta(days=i)
            submissions.append(submission)
        
        streak_info = progress_tracker._calculate_streak(submissions)
        
        assert streak_info["current_streak"] == 5
        assert streak_info["longest_streak"] == 5
    
    def test_calculate_streak_with_gap(self, progress_tracker):
        """Test streak calculation with gap in activity."""
        today = datetime.utcnow()
        submissions = []
        
        # Create submissions with a gap
        for i in [0, 1, 5, 6, 7]:  # Gap between day 1 and 5
            submission = Submission(
                task_id=f"task-{i}",
                user_id="test-user",
                code_content="test code"
            )
            submission.submitted_at = today - timedelta(days=i)
            submissions.append(submission)
        
        streak_info = progress_tracker._calculate_streak(submissions)
        
        # Current streak should be 2 (today and yesterday)
        assert streak_info["current_streak"] == 2
        # Longest streak should be 3 (days 5, 6, 7)
        assert streak_info["longest_streak"] == 3
    
    def test_calculate_streak_empty(self, progress_tracker):
        """Test streak calculation with no submissions."""
        streak_info = progress_tracker._calculate_streak([])
        
        assert streak_info["current_streak"] == 0
        assert streak_info["longest_streak"] == 0
        assert streak_info["last_activity_date"] is None
    
    def test_generate_progress_summary_ahead(self, progress_tracker, sample_learning_plan):
        """Test progress summary when ahead of schedule."""
        metrics = ProgressMetrics(
            completion_rate=50.0,  # 50% complete
            success_rate=85.0,
            average_score=82.0,
            total_tasks=10,
            completed_tasks=5,
            total_submissions=8,
            passed_submissions=7,
            failed_submissions=1,
            average_attempts_per_task=1.6,
            time_spent_minutes=180,
            streak_days=3
        )
        
        # Plan is 5 days old out of 30 days = ~17% expected
        summary = progress_tracker._generate_progress_summary(metrics, sample_learning_plan)
        
        assert summary["status"] == "ahead"
        assert "ahead" in summary["message"].lower() or "great" in summary["message"].lower()
    
    def test_generate_progress_summary_behind(self, progress_tracker, sample_learning_plan):
        """Test progress summary when behind schedule."""
        metrics = ProgressMetrics(
            completion_rate=5.0,  # Only 5% complete
            success_rate=60.0,
            average_score=55.0,
            total_tasks=10,
            completed_tasks=1,
            total_submissions=3,
            passed_submissions=2,
            failed_submissions=1,
            average_attempts_per_task=3.0,
            time_spent_minutes=60,
            streak_days=0
        )
        
        summary = progress_tracker._generate_progress_summary(metrics, sample_learning_plan)
        
        assert summary["status"] in ["behind", "slightly_behind"]

    def test_analyze_mistakes_with_issues(self, progress_tracker):
        """Test mistake analysis with common issues."""
        evaluations = [
            EvaluationResult(
                submission_id="sub-1",
                passed=False,
                score=40.0,
                feedback={
                    "overall_assessment": "Syntax errors",
                    "issues": [{"type": "syntax_error"}, {"type": "logic_error"}]
                },
                execution_time=1.0
            ),
            EvaluationResult(
                submission_id="sub-2",
                passed=False,
                score=35.0,
                feedback={
                    "overall_assessment": "Logic issues",
                    "issues": [{"type": "logic_error"}, {"type": "logic_error"}]
                },
                execution_time=1.2
            )
        ]
        
        analysis = progress_tracker._analyze_mistakes(evaluations)
        
        assert "common_issues" in analysis
        assert "recommendations" in analysis
        assert analysis["total_failures"] == 2
        
        # Logic error should be most common
        common_issues = analysis["common_issues"]
        assert len(common_issues) > 0
    
    def test_generate_recommendations_low_success(self, progress_tracker, sample_learning_plan):
        """Test recommendations for low success rate."""
        metrics = ProgressMetrics(
            completion_rate=30.0,
            success_rate=40.0,  # Low success rate
            average_score=45.0,
            total_tasks=10,
            completed_tasks=3,
            total_submissions=10,
            passed_submissions=4,
            failed_submissions=6,
            average_attempts_per_task=3.3,
            time_spent_minutes=120,
            streak_days=1
        )
        
        recommendations = progress_tracker._generate_recommendations(metrics, sample_learning_plan)
        
        assert len(recommendations) > 0
        assert any(r["type"] == "practice" for r in recommendations)
        assert any(r["action"] == "review_mistakes" for r in recommendations)
    
    def test_generate_recommendations_high_success(self, progress_tracker, sample_learning_plan):
        """Test recommendations for high success rate."""
        metrics = ProgressMetrics(
            completion_rate=60.0,
            success_rate=95.0,  # High success rate
            average_score=92.0,
            total_tasks=10,
            completed_tasks=6,
            total_submissions=8,
            passed_submissions=8,
            failed_submissions=0,
            average_attempts_per_task=1.3,
            time_spent_minutes=200,
            streak_days=5
        )
        
        recommendations = progress_tracker._generate_recommendations(metrics, sample_learning_plan)
        
        assert len(recommendations) > 0
        assert any(r["type"] == "challenge" for r in recommendations)
    
    def test_prioritize_triggers(self, progress_tracker):
        """Test trigger prioritization."""
        triggers = [
            AdaptationTrigger(
                trigger_type="quick_success",
                severity="low",
                confidence=0.8
            ),
            AdaptationTrigger(
                trigger_type="consecutive_failures",
                severity="high",
                confidence=0.95
            ),
            AdaptationTrigger(
                trigger_type="slow_progress",
                severity="medium",
                confidence=0.7
            )
        ]
        
        prioritized = progress_tracker._prioritize_triggers(triggers)
        
        # High severity should come first
        assert prioritized[0].severity == "high"
        assert prioritized[1].severity == "medium"
        assert prioritized[2].severity == "low"

    # ==================== Unsupported Intent Test ====================
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, progress_tracker, sample_context):
        """Test handling of unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        with pytest.raises(ValidationError):
            await progress_tracker.process(sample_context, payload)

    # ==================== Data Conversion Tests ====================
    
    def test_metrics_to_dict(self, progress_tracker):
        """Test ProgressMetrics to dict conversion."""
        metrics = ProgressMetrics(
            completion_rate=75.5,
            success_rate=80.0,
            average_score=78.5,
            total_tasks=20,
            completed_tasks=15,
            total_submissions=25,
            passed_submissions=20,
            failed_submissions=5,
            average_attempts_per_task=1.67,
            time_spent_minutes=300,
            streak_days=7,
            last_activity_date=datetime(2024, 1, 15)
        )
        
        result = progress_tracker._metrics_to_dict(metrics)
        
        assert result["completion_rate"] == 75.5
        assert result["success_rate"] == 80.0
        assert result["total_tasks"] == 20
        assert result["streak_days"] == 7
        assert "2024-01-15" in result["last_activity_date"]
    
    def test_trigger_to_dict(self, progress_tracker):
        """Test AdaptationTrigger to dict conversion."""
        trigger = AdaptationTrigger(
            trigger_type="consecutive_failures",
            severity="high",
            details={"count": 3, "task_id": "task-123"},
            recommended_action="reduce_difficulty",
            confidence=0.95
        )
        
        result = progress_tracker._trigger_to_dict(trigger)
        
        assert result["trigger_type"] == "consecutive_failures"
        assert result["severity"] == "high"
        assert result["details"]["count"] == 3
        assert result["confidence"] == 0.95
    
    def test_task_info_to_dict(self, progress_tracker):
        """Test DailyTaskInfo to dict conversion."""
        task_info = DailyTaskInfo(
            task_id="task-123",
            module_id="module-456",
            title="Learn Variables",
            description="Learn about JavaScript variables",
            task_type="CODE",
            estimated_minutes=45,
            day_offset=2,
            is_completed=True,
            attempts=2,
            best_score=85.0
        )
        
        result = progress_tracker._task_info_to_dict(task_info)
        
        assert result["task_id"] == "task-123"
        assert result["is_completed"] is True
        assert result["best_score"] == 85.0
        assert result["attempts"] == 2
