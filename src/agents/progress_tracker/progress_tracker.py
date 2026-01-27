"""
ProgressTracker agent implementation for the Agentic Learning Coach system.

This agent monitors and adapts learning effectiveness including:
- Progress calculation and metrics generation
- Pattern detection for adaptation triggers
- Daily task retrieval with date-based filtering
- Progress visualization data preparation
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from ..base.base_agent import BaseAgent
from ..base.types import LearningContext, AgentResult, AgentType
from ..base.exceptions import ValidationError, AgentProcessingError
from ...domain.entities.learning_plan import LearningPlan
from ...domain.entities.submission import Submission
from ...domain.entities.evaluation_result import EvaluationResult
from ...domain.value_objects.enums import LearningPlanStatus, SubmissionStatus
from ...ports.repositories.curriculum_repository import CurriculumRepository
from ...ports.repositories.submission_repository import SubmissionRepository


@dataclass
class ProgressMetrics:
    """Data class for progress metrics."""
    completion_rate: float
    success_rate: float
    average_score: float
    total_tasks: int
    completed_tasks: int
    total_submissions: int
    passed_submissions: int
    failed_submissions: int
    average_attempts_per_task: float
    time_spent_minutes: int
    streak_days: int
    last_activity_date: Optional[datetime] = None


@dataclass
class AdaptationTrigger:
    """Data class for adaptation triggers."""
    trigger_type: str  # 'consecutive_failures', 'quick_success', 'slow_progress', 'fast_progress'
    severity: str  # 'low', 'medium', 'high'
    details: Dict[str, Any] = field(default_factory=dict)
    recommended_action: str = ""
    confidence: float = 0.0


@dataclass
class DailyTaskInfo:
    """Data class for daily task information."""
    task_id: str
    module_id: str
    title: str
    description: str
    task_type: str
    estimated_minutes: int
    day_offset: int
    is_completed: bool
    attempts: int
    best_score: Optional[float] = None


class ProgressTracker(BaseAgent):
    """
    Agent responsible for tracking progress and triggering adaptations.
    
    Monitors learner performance, detects patterns, and triggers
    curriculum adaptations based on the adaptation policy:
    - 2 consecutive failures → reduce difficulty + recap
    - Quick success → add stretch task
    """
    
    # Adaptation thresholds
    CONSECUTIVE_FAILURE_THRESHOLD = 2
    QUICK_SUCCESS_THRESHOLD = 1.2  # Attempts ratio (avg attempts < 1.2 = quick success)
    LOW_SUCCESS_RATE_THRESHOLD = 0.5  # Below 50% success rate
    HIGH_SUCCESS_RATE_THRESHOLD = 0.9  # Above 90% success rate
    SLOW_PROGRESS_DAYS_THRESHOLD = 3  # Days behind schedule
    
    def __init__(
        self, 
        curriculum_repository: CurriculumRepository,
        submission_repository: SubmissionRepository
    ):
        """
        Initialize ProgressTracker with required dependencies.
        
        Args:
            curriculum_repository: Repository for curriculum operations
            submission_repository: Repository for submission operations
        """
        super().__init__(AgentType.PROGRESS_TRACKER)
        self.curriculum_repository = curriculum_repository
        self.submission_repository = submission_repository

    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return [
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
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process progress tracking requests.
        
        Args:
            context: Learning context with user information
            payload: Request payload with intent and data
            
        Returns:
            AgentResult with processing results
        """
        intent = payload.get("intent")
        
        try:
            if intent == "check_progress":
                return await self._check_progress(context, payload)
            elif intent == "review_mistakes":
                return await self._review_mistakes(context, payload)
            elif intent == "get_recommendations":
                return await self._get_recommendations(context, payload)
            elif intent == "get_daily_tasks":
                return await self._get_daily_tasks(context, payload)
            elif intent == "record_attempt":
                return await self._record_attempt(context, payload)
            elif intent == "detect_adaptation_triggers":
                return await self._detect_adaptation_triggers(context, payload)
            elif intent == "get_progress_visualization":
                return await self._get_progress_visualization(context, payload)
            elif intent == "get_streak_info":
                return await self._get_streak_info(context, payload)
            elif intent == "calculate_metrics":
                return await self._calculate_metrics(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except ValidationError:
            raise
        except Exception as e:
            self.logger.log_error(
                f"ProgressTracker processing failed for intent {intent}", 
                e, context, intent
            )
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")

    async def _check_progress(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Check overall progress for a user."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        
        if not active_plan:
            return AgentResult.success_result(
                data={"has_active_plan": False, "message": "No active learning plan found"},
                next_actions=["create_learning_plan"]
            )
        
        metrics = await self._calculate_progress_metrics(context.user_id, active_plan)
        triggers = await self._analyze_for_triggers(context.user_id, active_plan, metrics)
        summary = self._generate_progress_summary(metrics, active_plan)
        
        return AgentResult.success_result(
            data={
                "has_active_plan": True,
                "plan_id": active_plan.id,
                "plan_title": active_plan.title,
                "metrics": self._metrics_to_dict(metrics),
                "summary": summary,
                "adaptation_triggers": [self._trigger_to_dict(t) for t in triggers],
                "needs_adaptation": len(triggers) > 0
            },
            next_actions=self._determine_next_actions(metrics, triggers)
        )

    async def _review_mistakes(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Review past mistakes and failed submissions."""
        limit = payload.get("limit", 10)
        evaluations = await self.submission_repository.get_user_evaluations(
            user_id=context.user_id, status_filter=SubmissionStatus.FAIL, limit=limit
        )
        
        if not evaluations:
            return AgentResult.success_result(
                data={"has_mistakes": False, "message": "No failed submissions found. Great job!"}
            )
        
        mistake_analysis = self._analyze_mistakes(evaluations)
        return AgentResult.success_result(
            data={
                "has_mistakes": True,
                "total_mistakes": len(evaluations),
                "mistakes": [self._format_mistake(e) for e in evaluations],
                "analysis": mistake_analysis,
                "common_issues": mistake_analysis.get("common_issues", []),
                "recommendations": mistake_analysis.get("recommendations", [])
            },
            next_actions=["practice_weak_areas", "request_hints"]
        )

    async def _get_recommendations(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Get personalized recommendations based on progress."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        
        if not active_plan:
            return AgentResult.success_result(
                data={"recommendations": [{
                    "type": "action", "priority": "high",
                    "message": "Create a learning plan to get started",
                    "action": "create_learning_plan"
                }]}
            )
        
        metrics = await self._calculate_progress_metrics(context.user_id, active_plan)
        recommendations = self._generate_recommendations(metrics, active_plan)
        
        return AgentResult.success_result(
            data={
                "recommendations": recommendations,
                "priority_action": recommendations[0] if recommendations else None,
                "metrics_summary": {
                    "completion_rate": metrics.completion_rate,
                    "success_rate": metrics.success_rate,
                    "streak_days": metrics.streak_days
                }
            }
        )

    async def _get_daily_tasks(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Get tasks scheduled for a specific day."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        day_offset = self._calculate_day_offset(active_plan, payload)
        tasks = await self.curriculum_repository.get_tasks_for_day(
            user_id=context.user_id, day_offset=day_offset
        )
        enriched_tasks = await self._enrich_tasks_with_status(context.user_id, tasks, active_plan)
        daily_summary = self._calculate_daily_summary(enriched_tasks, day_offset)
        
        return AgentResult.success_result(
            data={
                "day_offset": day_offset,
                "date": self._get_date_for_offset(active_plan, day_offset).isoformat(),
                "tasks": [self._task_info_to_dict(t) for t in enriched_tasks],
                "total_tasks": len(enriched_tasks),
                "completed_tasks": sum(1 for t in enriched_tasks if t.is_completed),
                "estimated_time_minutes": sum(t.estimated_minutes for t in enriched_tasks),
                "daily_summary": daily_summary
            },
            next_actions=self._get_daily_next_actions(enriched_tasks)
        )

    async def _record_attempt(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Record a task attempt and update progress."""
        task_id = payload.get("task_id")
        passed = payload.get("passed", False)
        score = payload.get("score", 0.0)
        
        if not task_id:
            raise ValidationError("task_id is required")
        
        task_submissions = await self.submission_repository.get_task_submissions(
            task_id=task_id, user_id=context.user_id
        )
        
        attempt_count = len(task_submissions) + 1
        consecutive_failures = self._count_consecutive_failures(task_submissions)
        
        if not passed:
            consecutive_failures += 1
        else:
            consecutive_failures = 0
        
        triggers = []
        
        # Adaptation policy: 2 consecutive failures → reduce difficulty + recap
        if consecutive_failures >= self.CONSECUTIVE_FAILURE_THRESHOLD:
            triggers.append(AdaptationTrigger(
                trigger_type="consecutive_failures", severity="high",
                details={"consecutive_failures": consecutive_failures, "task_id": task_id, "total_attempts": attempt_count},
                recommended_action="reduce_difficulty_and_recap", confidence=0.95
            ))
        
        # Quick success detection
        if passed and attempt_count == 1 and score >= 90:
            triggers.append(AdaptationTrigger(
                trigger_type="quick_success", severity="low",
                details={"score": score, "task_id": task_id},
                recommended_action="add_stretch_task", confidence=0.8
            ))
        
        return AgentResult.success_result(
            data={
                "task_id": task_id, "attempt_count": attempt_count, "passed": passed,
                "score": score, "consecutive_failures": consecutive_failures,
                "adaptation_triggers": [self._trigger_to_dict(t) for t in triggers],
                "needs_adaptation": len(triggers) > 0
            },
            next_actions=self._get_post_attempt_actions(passed, triggers)
        )

    async def _detect_adaptation_triggers(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Detect patterns that should trigger curriculum adaptation."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        metrics = await self._calculate_progress_metrics(context.user_id, active_plan)
        triggers = await self._analyze_for_triggers(context.user_id, active_plan, metrics)
        prioritized_triggers = self._prioritize_triggers(triggers)
        
        return AgentResult.success_result(
            data={
                "triggers_detected": len(triggers) > 0,
                "trigger_count": len(triggers),
                "triggers": [self._trigger_to_dict(t) for t in prioritized_triggers],
                "primary_trigger": self._trigger_to_dict(prioritized_triggers[0]) if prioritized_triggers else None,
                "recommended_adaptations": self._get_recommended_adaptations(prioritized_triggers)
            },
            next_actions=["adapt_curriculum"] if triggers else ["continue_learning"]
        )

    async def _get_progress_visualization(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Get data prepared for progress visualization."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        visualization_type = payload.get("visualization_type", "overview")
        days_back = payload.get("days_back", 30)
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        submissions = await self.submission_repository.get_submissions_by_date_range(
            user_id=context.user_id, start_date=start_date, end_date=end_date
        )
        
        if visualization_type == "timeline":
            viz_data = self._prepare_timeline_data(submissions, start_date, end_date)
        elif visualization_type == "heatmap":
            viz_data = self._prepare_heatmap_data(submissions, start_date, end_date)
        elif visualization_type == "progress_chart":
            viz_data = self._prepare_progress_chart_data(submissions, active_plan)
        else:
            viz_data = self._prepare_overview_data(submissions, active_plan)
        
        return AgentResult.success_result(
            data={
                "visualization_type": visualization_type,
                "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
                "data": viz_data
            }
        )

    async def _get_streak_info(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Get streak information for the user."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        
        submissions = await self.submission_repository.get_submissions_by_date_range(
            user_id=context.user_id, start_date=start_date, end_date=end_date
        )
        streak_info = self._calculate_streak(submissions)
        
        return AgentResult.success_result(data={
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "last_activity_date": streak_info["last_activity_date"],
            "streak_at_risk": streak_info["streak_at_risk"],
            "days_until_streak_lost": streak_info["days_until_streak_lost"]
        })

    async def _calculate_metrics(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Calculate detailed progress metrics."""
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        metrics = await self._calculate_progress_metrics(context.user_id, active_plan)
        return AgentResult.success_result(data={
            "metrics": self._metrics_to_dict(metrics),
            "plan_id": active_plan.id,
            "calculated_at": datetime.utcnow().isoformat()
        })

    # ==================== Helper Methods ====================
    
    async def _calculate_progress_metrics(self, user_id: str, plan: LearningPlan) -> ProgressMetrics:
        """Calculate comprehensive progress metrics for a user."""
        all_tasks = plan.get_all_tasks()
        total_tasks = len(all_tasks)
        
        progress_summary = await self.submission_repository.get_user_progress_summary(user_id)
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        submissions = await self.submission_repository.get_submissions_by_date_range(
            user_id=user_id, start_date=start_date, end_date=end_date
        )
        streak_info = self._calculate_streak(submissions)
        
        total_submissions = progress_summary.get("total_submissions", 0)
        passed_submissions = progress_summary.get("passed_submissions", 0)
        failed_submissions = progress_summary.get("failed_submissions", 0)
        completed_tasks = progress_summary.get("completed_tasks", 0)
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
        success_rate = (passed_submissions / total_submissions * 100) if total_submissions > 0 else 0.0
        average_score = progress_summary.get("average_score", 0.0)
        avg_attempts = (total_submissions / completed_tasks) if completed_tasks > 0 else 0.0
        
        return ProgressMetrics(
            completion_rate=round(completion_rate, 2), success_rate=round(success_rate, 2),
            average_score=round(average_score, 2), total_tasks=total_tasks,
            completed_tasks=completed_tasks, total_submissions=total_submissions,
            passed_submissions=passed_submissions, failed_submissions=failed_submissions,
            average_attempts_per_task=round(avg_attempts, 2),
            time_spent_minutes=progress_summary.get("time_spent_minutes", 0),
            streak_days=streak_info["current_streak"],
            last_activity_date=streak_info.get("last_activity_date")
        )

    async def _analyze_for_triggers(self, user_id: str, plan: LearningPlan, metrics: ProgressMetrics) -> List[AdaptationTrigger]:
        """Analyze metrics and submissions for adaptation triggers."""
        triggers = []
        
        if metrics.success_rate < self.LOW_SUCCESS_RATE_THRESHOLD * 100:
            triggers.append(AdaptationTrigger(
                trigger_type="low_success_rate", severity="high",
                details={"success_rate": metrics.success_rate, "threshold": self.LOW_SUCCESS_RATE_THRESHOLD * 100},
                recommended_action="reduce_difficulty", confidence=0.9
            ))
        
        if metrics.success_rate > self.HIGH_SUCCESS_RATE_THRESHOLD * 100 and metrics.total_submissions >= 5:
            triggers.append(AdaptationTrigger(
                trigger_type="high_success_rate", severity="low",
                details={"success_rate": metrics.success_rate, "threshold": self.HIGH_SUCCESS_RATE_THRESHOLD * 100},
                recommended_action="increase_difficulty", confidence=0.85
            ))
        
        if metrics.average_attempts_per_task < self.QUICK_SUCCESS_THRESHOLD and metrics.completed_tasks >= 3:
            triggers.append(AdaptationTrigger(
                trigger_type="quick_success", severity="low",
                details={"average_attempts": metrics.average_attempts_per_task, "threshold": self.QUICK_SUCCESS_THRESHOLD},
                recommended_action="add_stretch_task", confidence=0.8
            ))
        
        expected_completion = self._calculate_expected_completion(plan)
        if metrics.completion_rate < expected_completion - 20:
            triggers.append(AdaptationTrigger(
                trigger_type="slow_progress", severity="medium",
                details={"actual_completion": metrics.completion_rate, "expected_completion": expected_completion},
                recommended_action="adjust_pacing", confidence=0.75
            ))
        
        return triggers

    def _calculate_day_offset(self, plan: LearningPlan, payload: Dict[str, Any]) -> int:
        """Calculate day offset from payload or current date."""
        if "day_offset" in payload:
            return payload["day_offset"]
        if "target_date" in payload:
            target_date = datetime.fromisoformat(payload["target_date"])
            delta = target_date - plan.created_at
            return max(0, delta.days)
        delta = datetime.utcnow() - plan.created_at
        return max(0, delta.days)
    
    def _get_date_for_offset(self, plan: LearningPlan, day_offset: int) -> datetime:
        """Get the actual date for a day offset."""
        return plan.created_at + timedelta(days=day_offset)

    async def _enrich_tasks_with_status(self, user_id: str, tasks: List, plan: LearningPlan) -> List[DailyTaskInfo]:
        """Enrich tasks with completion status and attempt information."""
        enriched = []
        for task in tasks:
            submissions = await self.submission_repository.get_task_submissions(task_id=task.id, user_id=user_id)
            is_completed = False
            best_score = None
            
            for submission in submissions:
                evaluation = await self.submission_repository.get_latest_evaluation(submission.id)
                if evaluation:
                    if evaluation.passed:
                        is_completed = True
                    if best_score is None or evaluation.score > best_score:
                        best_score = evaluation.score
            
            enriched.append(DailyTaskInfo(
                task_id=task.id, module_id=task.module_id,
                title=task.description[:50] + "..." if len(task.description) > 50 else task.description,
                description=task.description, task_type=task.task_type.value,
                estimated_minutes=task.estimated_minutes, day_offset=task.day_offset,
                is_completed=is_completed, attempts=len(submissions), best_score=best_score
            ))
        return enriched

    def _calculate_streak(self, submissions: List[Submission]) -> Dict[str, Any]:
        """Calculate streak information from submissions."""
        if not submissions:
            return {"current_streak": 0, "longest_streak": 0, "last_activity_date": None,
                    "streak_at_risk": False, "days_until_streak_lost": 0}
        
        activity_dates = sorted(set(s.submitted_at.date() for s in submissions), reverse=True)
        if not activity_dates:
            return {"current_streak": 0, "longest_streak": 0, "last_activity_date": None,
                    "streak_at_risk": False, "days_until_streak_lost": 0}
        
        today = datetime.utcnow().date()
        last_activity = activity_dates[0]
        
        current_streak = 0
        check_date = today
        for activity_date in activity_dates:
            if activity_date == check_date or activity_date == check_date - timedelta(days=1):
                current_streak += 1
                check_date = activity_date - timedelta(days=1)
            else:
                break
        
        longest_streak = 0
        temp_streak = 1
        for i in range(1, len(activity_dates)):
            if (activity_dates[i-1] - activity_dates[i]).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak, current_streak)
        
        days_since_activity = (today - last_activity).days
        streak_at_risk = days_since_activity >= 1 and current_streak > 0
        days_until_lost = max(0, 2 - days_since_activity) if current_streak > 0 else 0
        
        return {"current_streak": current_streak, "longest_streak": longest_streak,
                "last_activity_date": last_activity.isoformat() if last_activity else None,
                "streak_at_risk": streak_at_risk, "days_until_streak_lost": days_until_lost}

    def _count_consecutive_failures(self, submissions: List[Submission]) -> int:
        """Count consecutive failures from most recent submissions."""
        return len(submissions) if submissions else 0
    
    def _calculate_expected_completion(self, plan: LearningPlan) -> float:
        """Calculate expected completion percentage based on elapsed time."""
        if plan.total_days <= 0:
            return 0.0
        elapsed_days = (datetime.utcnow() - plan.created_at).days
        expected = (elapsed_days / plan.total_days) * 100
        return min(100.0, max(0.0, expected))
    
    def _generate_progress_summary(self, metrics: ProgressMetrics, plan: LearningPlan) -> Dict[str, Any]:
        """Generate a human-readable progress summary."""
        expected = self._calculate_expected_completion(plan)
        
        if metrics.completion_rate >= expected:
            status, message = "ahead", "Great progress! You're ahead of schedule."
        elif metrics.completion_rate >= expected - 10:
            status, message = "on_track", "You're on track with your learning plan."
        elif metrics.completion_rate >= expected - 25:
            status, message = "slightly_behind", "You're slightly behind schedule. Consider dedicating more time."
        else:
            status, message = "behind", "You're behind schedule. Let's adjust your plan."
        
        return {"status": status, "message": message, "expected_completion": round(expected, 1),
                "actual_completion": metrics.completion_rate,
                "days_elapsed": (datetime.utcnow() - plan.created_at).days, "total_days": plan.total_days}

    def _analyze_mistakes(self, evaluations: List[EvaluationResult]) -> Dict[str, Any]:
        """Analyze failed evaluations for patterns."""
        if not evaluations:
            return {"common_issues": [], "recommendations": []}
        
        all_issues = []
        for evaluation in evaluations:
            feedback = evaluation.feedback
            if isinstance(feedback, dict):
                all_issues.extend(feedback.get("issues", []))
        
        issue_counts: Dict[str, int] = {}
        for issue in all_issues:
            issue_type = issue.get("type", "unknown") if isinstance(issue, dict) else str(issue)
            issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
        
        common_issues = sorted([{"type": k, "count": v} for k, v in issue_counts.items()],
                               key=lambda x: x["count"], reverse=True)[:5]
        
        recommendations = [{"issue": issue["type"],
                           "recommendation": f"Practice more exercises focusing on {issue['type']}",
                           "priority": "high" if issue["count"] >= 3 else "medium"} for issue in common_issues]
        
        return {"common_issues": common_issues, "recommendations": recommendations,
                "total_failures": len(evaluations), "unique_issue_types": len(issue_counts)}

    def _generate_recommendations(self, metrics: ProgressMetrics, plan: LearningPlan) -> List[Dict[str, Any]]:
        """Generate personalized recommendations based on metrics."""
        recommendations = []
        
        if metrics.completion_rate < 30:
            recommendations.append({"type": "motivation", "priority": "high",
                                   "message": "Start with small, achievable goals. Complete one task today!",
                                   "action": "get_daily_tasks"})
        if metrics.success_rate < 50:
            recommendations.append({"type": "practice", "priority": "high",
                                   "message": "Review your mistakes and practice similar exercises",
                                   "action": "review_mistakes"})
        if metrics.success_rate > 90 and metrics.completed_tasks >= 5:
            recommendations.append({"type": "challenge", "priority": "medium",
                                   "message": "You're doing great! Try some stretch exercises",
                                   "action": "request_stretch_exercise"})
        if metrics.streak_days > 0:
            recommendations.append({"type": "streak", "priority": "medium",
                                   "message": f"Keep your {metrics.streak_days}-day streak going!",
                                   "action": "continue_learning"})
        elif metrics.streak_days == 0 and metrics.total_submissions > 0:
            recommendations.append({"type": "streak", "priority": "high",
                                   "message": "Start a new streak today!", "action": "get_daily_tasks"})
        if metrics.time_spent_minutes < 30 and metrics.completed_tasks < 3:
            recommendations.append({"type": "time", "priority": "medium",
                                   "message": "Try to dedicate at least 30 minutes daily for best results",
                                   "action": "set_reminder"})
        
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 2))
        return recommendations

    def _calculate_daily_summary(self, tasks: List[DailyTaskInfo], day_offset: int) -> Dict[str, Any]:
        """Calculate summary for daily tasks."""
        if not tasks:
            return {"status": "no_tasks", "message": "No tasks scheduled for this day", "progress_percentage": 0}
        
        completed = sum(1 for t in tasks if t.is_completed)
        total = len(tasks)
        progress = (completed / total * 100) if total > 0 else 0
        
        if completed == total:
            status, message = "completed", "All tasks completed! Great job!"
        elif completed > 0:
            status, message = "in_progress", f"{completed} of {total} tasks completed"
        else:
            status, message = "not_started", f"{total} tasks waiting to be completed"
        
        return {"status": status, "message": message, "progress_percentage": round(progress, 1),
                "completed_count": completed, "total_count": total}

    def _prioritize_triggers(self, triggers: List[AdaptationTrigger]) -> List[AdaptationTrigger]:
        """Prioritize triggers by severity and confidence."""
        severity_order = {"high": 0, "medium": 1, "low": 2}
        return sorted(triggers, key=lambda t: (severity_order.get(t.severity, 2), -t.confidence))
    
    def _get_recommended_adaptations(self, triggers: List[AdaptationTrigger]) -> List[Dict[str, Any]]:
        """Get recommended adaptations based on triggers."""
        adaptations = []
        action_map = {
            "reduce_difficulty_and_recap": ("reduce_difficulty", "Reduce exercise difficulty and add recap content", "high"),
            "add_stretch_task": ("add_challenge", "Add stretch exercises for additional challenge", "low"),
            "increase_difficulty": ("increase_difficulty", "Increase exercise difficulty", "medium"),
            "adjust_pacing": ("adjust_pacing", "Adjust learning pace to match progress", "medium"),
            "reduce_difficulty": ("reduce_difficulty", "Reduce exercise difficulty", "high")
        }
        for trigger in triggers:
            if trigger.recommended_action in action_map:
                t, d, p = action_map[trigger.recommended_action]
                adaptations.append({"type": t, "description": d, "trigger": trigger.trigger_type, "priority": p})
        return adaptations

    def _determine_next_actions(self, metrics: ProgressMetrics, triggers: List[AdaptationTrigger]) -> List[str]:
        """Determine next actions based on metrics and triggers."""
        actions = []
        if triggers:
            actions.append("adapt_curriculum")
        if metrics.completion_rate < 100:
            actions.append("continue_learning")
        if metrics.success_rate < 70:
            actions.append("review_mistakes")
        if metrics.streak_days == 0:
            actions.append("start_streak")
        return actions if actions else ["continue_learning"]
    
    def _get_daily_next_actions(self, tasks: List[DailyTaskInfo]) -> List[str]:
        """Get next actions based on daily tasks."""
        incomplete = [t for t in tasks if not t.is_completed]
        if not incomplete:
            return ["celebrate_completion", "request_next_day"]
        
        first_incomplete = incomplete[0]
        action_map = {"CODE": "start_coding_exercise", "READ": "start_reading", "QUIZ": "start_quiz"}
        return [action_map.get(first_incomplete.task_type, "start_task")]
    
    def _get_post_attempt_actions(self, passed: bool, triggers: List[AdaptationTrigger]) -> List[str]:
        """Get actions after recording an attempt."""
        actions = ["celebrate_success", "request_next_task"] if passed else ["review_feedback", "retry_task"]
        if triggers:
            actions.append("adapt_curriculum")
        return actions

    # ==================== Visualization Data Preparation ====================
    
    def _prepare_timeline_data(self, submissions: List[Submission], start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Prepare data for timeline visualization."""
        daily_data: Dict[str, Dict[str, Any]] = {}
        current = start_date
        while current <= end_date:
            date_str = current.strftime("%Y-%m-%d")
            daily_data[date_str] = {"date": date_str, "submissions": 0, "passed": 0, "failed": 0}
            current += timedelta(days=1)
        
        for submission in submissions:
            date_str = submission.submitted_at.strftime("%Y-%m-%d")
            if date_str in daily_data:
                daily_data[date_str]["submissions"] += 1
        
        return {"type": "timeline", "data": list(daily_data.values()),
                "total_days": len(daily_data),
                "active_days": sum(1 for d in daily_data.values() if d["submissions"] > 0)}
    
    def _prepare_heatmap_data(self, submissions: List[Submission], start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Prepare data for activity heatmap visualization."""
        weeks: List[List[Dict[str, Any]]] = []
        current_week: List[Dict[str, Any]] = []
        current = start_date
        
        while current <= end_date:
            date_str = current.strftime("%Y-%m-%d")
            day_submissions = sum(1 for s in submissions if s.submitted_at.strftime("%Y-%m-%d") == date_str)
            intensity = min(4, day_submissions)
            current_week.append({"date": date_str, "day_of_week": current.weekday(),
                                "submissions": day_submissions, "intensity": intensity})
            if current.weekday() == 6:
                weeks.append(current_week)
                current_week = []
            current += timedelta(days=1)
        
        if current_week:
            weeks.append(current_week)
        
        return {"type": "heatmap", "weeks": weeks,
                "legend": {0: "No activity", 1: "1 submission", 2: "2-3 submissions", 3: "4-5 submissions", 4: "6+ submissions"}}
    
    def _prepare_progress_chart_data(self, submissions: List[Submission], plan: LearningPlan) -> Dict[str, Any]:
        """Prepare data for progress chart visualization."""
        total_tasks = len(plan.get_all_tasks())
        if not submissions:
            return {"type": "progress_chart", "data_points": [], "total_tasks": total_tasks, "current_completion": 0}
        
        sorted_submissions = sorted(submissions, key=lambda s: s.submitted_at)
        data_points = []
        completed_tasks = set()
        
        for submission in sorted_submissions:
            completed_tasks.add(submission.task_id)
            completion_pct = (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0
            data_points.append({"date": submission.submitted_at.isoformat(),
                               "completed_tasks": len(completed_tasks), "completion_percentage": round(completion_pct, 1)})
        
        return {"type": "progress_chart", "data_points": data_points, "total_tasks": total_tasks,
                "current_completion": round(len(completed_tasks) / total_tasks * 100 if total_tasks > 0 else 0, 1)}
    
    def _prepare_overview_data(self, submissions: List[Submission], plan: LearningPlan) -> Dict[str, Any]:
        """Prepare overview data for general visualization."""
        total_tasks = len(plan.get_all_tasks())
        unique_tasks = len(set(s.task_id for s in submissions))
        return {"type": "overview", "total_submissions": len(submissions), "unique_tasks_attempted": unique_tasks,
                "total_tasks": total_tasks,
                "completion_percentage": round(unique_tasks / total_tasks * 100 if total_tasks > 0 else 0, 1),
                "plan_title": plan.title, "plan_status": plan.status.value}

    # ==================== Conversion Methods ====================
    
    def _metrics_to_dict(self, metrics: ProgressMetrics) -> Dict[str, Any]:
        """Convert ProgressMetrics to dictionary."""
        return {
            "completion_rate": metrics.completion_rate, "success_rate": metrics.success_rate,
            "average_score": metrics.average_score, "total_tasks": metrics.total_tasks,
            "completed_tasks": metrics.completed_tasks, "total_submissions": metrics.total_submissions,
            "passed_submissions": metrics.passed_submissions, "failed_submissions": metrics.failed_submissions,
            "average_attempts_per_task": metrics.average_attempts_per_task,
            "time_spent_minutes": metrics.time_spent_minutes, "streak_days": metrics.streak_days,
            "last_activity_date": metrics.last_activity_date.isoformat() if metrics.last_activity_date else None
        }
    
    def _trigger_to_dict(self, trigger: AdaptationTrigger) -> Dict[str, Any]:
        """Convert AdaptationTrigger to dictionary."""
        return {"trigger_type": trigger.trigger_type, "severity": trigger.severity,
                "details": trigger.details, "recommended_action": trigger.recommended_action,
                "confidence": trigger.confidence}
    
    def _task_info_to_dict(self, task_info: DailyTaskInfo) -> Dict[str, Any]:
        """Convert DailyTaskInfo to dictionary."""
        return {"task_id": task_info.task_id, "module_id": task_info.module_id,
                "title": task_info.title, "description": task_info.description,
                "task_type": task_info.task_type, "estimated_minutes": task_info.estimated_minutes,
                "day_offset": task_info.day_offset, "is_completed": task_info.is_completed,
                "attempts": task_info.attempts, "best_score": task_info.best_score}
    
    def _format_mistake(self, evaluation: EvaluationResult) -> Dict[str, Any]:
        """Format a failed evaluation for display."""
        return {"evaluation_id": evaluation.id, "submission_id": evaluation.submission_id,
                "score": evaluation.score, "feedback_summary": evaluation.get_feedback_summary(),
                "test_summary": evaluation.get_test_summary(), "evaluated_at": evaluation.evaluated_at.isoformat()}
