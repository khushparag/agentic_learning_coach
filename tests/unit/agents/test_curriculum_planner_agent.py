"""
Unit tests for CurriculumPlannerAgent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
from src.agents.base.types import LearningContext, AgentResult, AgentType
from src.agents.base.exceptions import ValidationError, AgentProcessingError
from src.domain.entities.learning_plan import LearningPlan
from src.domain.entities.module import Module
from src.domain.entities.task import Task
from src.domain.entities.user_profile import UserProfile
from src.domain.value_objects.enums import SkillLevel, TaskType, LearningPlanStatus


class TestCurriculumPlannerAgent:
    """Test cases for CurriculumPlannerAgent."""
    
    @pytest.fixture
    def mock_curriculum_repository(self):
        """Create a mock curriculum repository."""
        return AsyncMock()
    
    @pytest.fixture
    def mock_user_repository(self):
        """Create a mock user repository."""
        return AsyncMock()
    
    @pytest.fixture
    def curriculum_planner_agent(self, mock_curriculum_repository, mock_user_repository):
        """Create a CurriculumPlannerAgent instance with mocked dependencies."""
        return CurriculumPlannerAgent(mock_curriculum_repository, mock_user_repository)
    
    @pytest.fixture
    def sample_context(self):
        """Create a sample learning context."""
        return LearningContext(
            user_id="test-user-123",
            session_id="session-456",
            current_objective="create_curriculum",
            correlation_id="corr-789"
        )
    
    @pytest.fixture
    def sample_user_profile(self):
        """Create a sample user profile."""
        return UserProfile(
            user_id="test-user-123",
            skill_level=SkillLevel.INTERMEDIATE,
            learning_goals=["javascript", "react"],
            time_constraints={"hours_per_week": 10},
            preferences={"learning_style": "hands_on"}
        )
    
    @pytest.fixture
    def sample_learning_plan(self):
        """Create a sample learning plan."""
        plan = LearningPlan(
            user_id="test-user-123",
            title="JavaScript Learning Path",
            goal_description="Learn JavaScript fundamentals and React",
            total_days=30,
            status=LearningPlanStatus.ACTIVE
        )
        
        # Add a sample module
        module = Module(
            plan_id=plan.id,
            title="JavaScript Basics",
            order_index=0,
            summary="Learn JavaScript fundamentals"
        )
        
        # Add sample tasks
        for i in range(5):
            task = Task(
                module_id=module.id,
                day_offset=i,
                task_type=TaskType.CODE if i % 2 == 1 else TaskType.READ,
                description=f"Day {i+1} task",
                estimated_minutes=60,
                completion_criteria="Complete the task successfully"
            )
            module.add_task(task)
        
        plan.add_module(module)
        return plan
    
    def test_get_supported_intents(self, curriculum_planner_agent):
        """Test that CurriculumPlannerAgent returns correct supported intents."""
        intents = curriculum_planner_agent.get_supported_intents()
        
        expected_intents = [
            "create_learning_path",
            "adapt_difficulty",
            "request_next_topic",
            "generate_curriculum",
            "update_curriculum",
            "get_curriculum_status",
            "schedule_spaced_repetition",
            "add_mini_project",
            "adjust_pacing"
        ]
        
        assert all(intent in intents for intent in expected_intents)
        assert len(intents) == len(expected_intents)
    
    @pytest.mark.asyncio
    async def test_create_learning_path_success(self, curriculum_planner_agent, sample_context, mock_user_repository, mock_curriculum_repository, sample_user_profile, sample_learning_plan):
        """Test successful learning path creation."""
        mock_user_repository.get_user_profile.return_value = sample_user_profile
        mock_curriculum_repository.save_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "create_learning_path",
            "goals": ["javascript", "react"],
            "time_constraints": {"hours_per_week": 10}
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "learning_plan" in result.data
        assert "curriculum_summary" in result.data
        assert "next_steps" in result.data
        assert "activate_learning_plan" in result.next_actions
        
        mock_curriculum_repository.save_plan.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_learning_path_no_profile(self, curriculum_planner_agent, sample_context, mock_user_repository):
        """Test learning path creation fails when no profile exists."""
        mock_user_repository.get_user_profile.return_value = None
        
        payload = {
            "intent": "create_learning_path",
            "goals": ["javascript"]
        }
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_create_learning_path_no_goals(self, curriculum_planner_agent, sample_context, mock_user_repository, sample_user_profile):
        """Test learning path creation fails when no goals provided."""
        # Create profile with placeholder goals that we'll clear after creation
        profile_no_goals = UserProfile(
            user_id="test-user-123",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["placeholder"],  # Temporary to pass validation
            time_constraints={},
            preferences={}
        )
        # Clear goals after creation to simulate empty state
        profile_no_goals.learning_goals = []
        mock_user_repository.get_user_profile.return_value = profile_no_goals
        
        payload = {"intent": "create_learning_path"}
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_adapt_difficulty_success(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test successful difficulty adaptation."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_curriculum_repository.save_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "adapt_difficulty",
            "performance_data": {
                "success_rate": 0.4,  # Low success rate
                "consecutive_failures": 3,
                "average_attempts": 2.5
            },
            "trigger": "performance_analysis"
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "adaptations_applied" in result.data
        assert "updated_plan" in result.data
        assert "adaptation_summary" in result.data
        
        # Should have applied adaptations due to poor performance
        adaptations = result.data["adaptations_applied"]
        assert len(adaptations) > 0
    
    @pytest.mark.asyncio
    async def test_adapt_difficulty_no_active_plan(self, curriculum_planner_agent, sample_context, mock_curriculum_repository):
        """Test difficulty adaptation fails when no active plan exists."""
        mock_curriculum_repository.get_active_plan.return_value = None
        
        payload = {
            "intent": "adapt_difficulty",
            "performance_data": {"success_rate": 0.5}
        }
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_request_next_topic_success(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test successful next topic request."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "request_next_topic",
            "current_day": 0
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "next_topic" in result.data
        assert "progress_percentage" in result.data
        assert "estimated_completion" in result.data
        assert result.data["next_topic"] is not None
    
    @pytest.mark.asyncio
    async def test_request_next_topic_plan_completed(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test next topic request when plan is completed."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "request_next_topic",
            "current_day": 100  # Beyond plan duration
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["next_topic"] is None
        assert result.data["plan_completed"] is True
        assert "celebrate_completion" in result.next_actions
    
    @pytest.mark.asyncio
    async def test_generate_curriculum_success(self, curriculum_planner_agent, sample_context):
        """Test successful curriculum generation."""
        payload = {
            "intent": "generate_curriculum",
            "goals": ["javascript", "react"],
            "skill_level": "intermediate",
            "time_constraints": {"hours_per_week": 8}
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "curriculum_structure" in result.data
        assert "estimated_timeline" in result.data
        assert "difficulty_progression" in result.data
        
        curriculum = result.data["curriculum_structure"]
        assert curriculum["primary_domain"] in ["javascript", "react"]
        assert curriculum["total_days"] > 0
        assert len(curriculum["modules"]) > 0
    
    @pytest.mark.asyncio
    async def test_generate_curriculum_no_goals(self, curriculum_planner_agent, sample_context):
        """Test curriculum generation fails without goals."""
        payload = {
            "intent": "generate_curriculum",
            "skill_level": "beginner"
        }
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_update_curriculum_success(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test successful curriculum update."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_curriculum_repository.save_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "update_curriculum",
            "updates": {
                "title": "Updated JavaScript Path",
                "add_modules": [
                    {
                        "title": "Advanced JavaScript",
                        "duration_days": 5,
                        "difficulty": 3,
                        "topics": ["closures", "prototypes"]
                    }
                ]
            }
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "updated_plan" in result.data
        assert "changes_summary" in result.data
    
    @pytest.mark.asyncio
    async def test_get_curriculum_status_with_plan(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test curriculum status with active plan."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        
        payload = {"intent": "get_curriculum_status"}
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_active_plan"] is True
        assert "plan" in result.data
        assert "status" in result.data
        assert "recommendations" in result.data
    
    @pytest.mark.asyncio
    async def test_get_curriculum_status_no_plan(self, curriculum_planner_agent, sample_context, mock_curriculum_repository):
        """Test curriculum status without active plan."""
        mock_curriculum_repository.get_active_plan.return_value = None
        
        payload = {"intent": "get_curriculum_status"}
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert result.data["has_active_plan"] is False
        assert "create_learning_plan" in result.next_actions
    
    @pytest.mark.asyncio
    async def test_schedule_spaced_repetition_success(self, curriculum_planner_agent, sample_context):
        """Test successful spaced repetition scheduling."""
        payload = {
            "intent": "schedule_spaced_repetition",
            "completed_topics": [
                {
                    "topic_id": "topic-1",
                    "title": "JavaScript Variables",
                    "completion_day": 5
                },
                {
                    "topic_id": "topic-2", 
                    "title": "Functions",
                    "completion_day": 10
                }
            ],
            "current_day": 15
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "repetition_schedule" in result.data
        assert len(result.data["repetition_schedule"]) > 0
        
        # Check schedule structure
        schedule = result.data["repetition_schedule"]
        for item in schedule:
            assert "topic_id" in item
            assert "review_day" in item
            assert "repetition_number" in item
    
    @pytest.mark.asyncio
    async def test_schedule_spaced_repetition_no_topics(self, curriculum_planner_agent, sample_context):
        """Test spaced repetition scheduling fails without topics."""
        payload = {
            "intent": "schedule_spaced_repetition",
            "current_day": 10
        }
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    @pytest.mark.asyncio
    async def test_add_mini_project_success(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test successful mini-project addition."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        mock_curriculum_repository.save_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "add_mini_project",
            "project_type": "integration",
            "topics_covered": ["javascript", "dom"],
            "difficulty_level": 2
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "mini_project" in result.data
        assert "updated_plan" in result.data
        assert "project_timeline" in result.data
        
        project = result.data["mini_project"]
        assert "title" in project
        assert "description" in project
        assert "estimated_hours" in project
    
    @pytest.mark.asyncio
    async def test_adjust_pacing_success(self, curriculum_planner_agent, sample_context, mock_curriculum_repository, sample_learning_plan):
        """Test successful pacing adjustment."""
        mock_curriculum_repository.get_active_plan.return_value = sample_learning_plan
        
        payload = {
            "intent": "adjust_pacing",
            "pacing_factor": 0.8,  # Slow down
            "reason": "learner_request"
        }
        
        result = await curriculum_planner_agent.process(sample_context, payload)
        
        assert result.success is True
        assert "adjusted_plan" in result.data
        assert "pacing_changes" in result.data
        assert "new_timeline" in result.data
        
        changes = result.data["pacing_changes"]
        assert changes["change_type"] == "slowed_down"
        assert changes["pacing_factor"] == 0.8
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, curriculum_planner_agent, sample_context):
        """Test handling of unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        with pytest.raises(AgentProcessingError):
            await curriculum_planner_agent.process(sample_context, payload)
    
    def test_determine_primary_domain_javascript(self, curriculum_planner_agent):
        """Test primary domain determination for JavaScript goals."""
        goals = ["javascript", "node.js", "express"]
        domain = curriculum_planner_agent._determine_primary_domain(goals)
        
        assert domain == "javascript"
    
    def test_determine_primary_domain_react(self, curriculum_planner_agent):
        """Test primary domain determination for React goals."""
        goals = ["react", "jsx", "components"]
        domain = curriculum_planner_agent._determine_primary_domain(goals)
        
        assert domain == "react"
    
    def test_determine_primary_domain_default(self, curriculum_planner_agent):
        """Test primary domain determination returns the goal when no match found."""
        goals = ["unknown_technology"]
        domain = curriculum_planner_agent._determine_primary_domain(goals)
        
        # When no known domain matches, the method returns the goal itself
        assert domain == "unknown_technology"
    
    def test_determine_primary_domain_empty_goals(self, curriculum_planner_agent):
        """Test primary domain determination defaults to JavaScript when no goals."""
        goals = []
        domain = curriculum_planner_agent._determine_primary_domain(goals)
        
        assert domain == "javascript"  # Default when no goals
    
    def test_get_curriculum_template_beginner(self, curriculum_planner_agent):
        """Test getting curriculum template for beginner level."""
        template = curriculum_planner_agent._get_curriculum_template("javascript", SkillLevel.BEGINNER)
        
        assert "modules" in template
        assert len(template["modules"]) > 0
        
        # Check that modules have required fields
        for module in template["modules"]:
            assert "title" in module
            assert "topics" in module
            assert "duration_days" in module
            assert "difficulty" in module
    
    def test_calculate_module_relevance_high(self, curriculum_planner_agent):
        """Test module relevance calculation for highly relevant module."""
        module = {
            "topics": ["javascript", "variables", "functions"]
        }
        goals = ["javascript", "web development"]
        
        relevance = curriculum_planner_agent._calculate_module_relevance(module, goals)
        
        assert 0.0 <= relevance <= 1.0
        assert relevance > 0.3  # Should be relevant
    
    def test_calculate_module_relevance_low(self, curriculum_planner_agent):
        """Test module relevance calculation for low relevance module."""
        module = {
            "topics": ["advanced_algorithms", "data_structures"]
        }
        goals = ["basic_javascript"]
        
        relevance = curriculum_planner_agent._calculate_module_relevance(module, goals)
        
        assert 0.0 <= relevance <= 1.0
    
    def test_customize_modules_for_goals(self, curriculum_planner_agent):
        """Test module customization based on goals."""
        base_modules = [
            {
                "title": "JavaScript Basics",
                "topics": ["variables", "functions"],
                "duration_days": 5,
                "difficulty": 1
            },
            {
                "title": "Advanced Algorithms",
                "topics": ["sorting", "searching"],
                "duration_days": 7,
                "difficulty": 4
            }
        ]
        goals = ["javascript", "basic programming"]
        
        customized = curriculum_planner_agent._customize_modules_for_goals(base_modules, goals)
        
        # Should include JavaScript module, might exclude advanced algorithms
        assert len(customized) >= 1
        assert any("JavaScript" in module["title"] for module in customized)
    
    def test_adjust_modules_for_time_constraints_limited_time(self, curriculum_planner_agent):
        """Test module adjustment for limited time."""
        modules = [
            {
                "title": "Test Module",
                "duration_days": 10,
                "difficulty": 2
            }
        ]
        time_constraints = {"hours_per_week": 2}  # Very limited time
        
        adjusted = curriculum_planner_agent._adjust_modules_for_time_constraints(modules, time_constraints)
        
        assert len(adjusted) == 1
        # Duration should be reduced for limited time
        assert adjusted[0]["duration_days"] <= modules[0]["duration_days"]
        assert adjusted[0]["task_density"] == "light"
    
    def test_adjust_modules_for_time_constraints_abundant_time(self, curriculum_planner_agent):
        """Test module adjustment for abundant time."""
        modules = [
            {
                "title": "Test Module",
                "duration_days": 5,
                "difficulty": 2
            }
        ]
        time_constraints = {"hours_per_week": 20}  # Abundant time
        
        adjusted = curriculum_planner_agent._adjust_modules_for_time_constraints(modules, time_constraints)
        
        assert len(adjusted) == 1
        # Duration should be increased for abundant time
        assert adjusted[0]["duration_days"] >= modules[0]["duration_days"]
        assert adjusted[0]["task_density"] == "intensive"
    
    def test_apply_spaced_repetition_scheduling(self, curriculum_planner_agent):
        """Test spaced repetition scheduling application."""
        modules = [
            {
                "title": "Module 1",
                "duration_days": 5,
                "difficulty": 1
            },
            {
                "title": "Module 2", 
                "duration_days": 7,
                "difficulty": 2
            }
        ]
        
        scheduled = curriculum_planner_agent._apply_spaced_repetition_scheduling(modules)
        
        assert len(scheduled) == 2
        
        # Check scheduling fields
        for module in scheduled:
            assert "start_day" in module
            assert "end_day" in module
            assert "spaced_repetition_days" in module
            assert isinstance(module["spaced_repetition_days"], list)
    
    def test_calculate_practice_ratio_hands_on(self, curriculum_planner_agent):
        """Test practice ratio calculation for hands-on learner."""
        preferences = {"learning_style": "hands_on"}
        ratio = curriculum_planner_agent._calculate_practice_ratio(preferences)
        
        assert ratio == 0.8  # 80% practice for hands-on
    
    def test_calculate_practice_ratio_theoretical(self, curriculum_planner_agent):
        """Test practice ratio calculation for theoretical learner."""
        preferences = {"learning_style": "theoretical"}
        ratio = curriculum_planner_agent._calculate_practice_ratio(preferences)
        
        assert ratio == 0.4  # 40% practice for theoretical
    
    def test_calculate_practice_ratio_default(self, curriculum_planner_agent):
        """Test practice ratio calculation for default/balanced learner."""
        preferences = {}
        ratio = curriculum_planner_agent._calculate_practice_ratio(preferences)
        
        assert ratio == 0.7  # 70% practice (practice-first approach)
    
    def test_estimate_total_hours(self, curriculum_planner_agent):
        """Test total hours estimation."""
        modules = [
            {
                "duration_days": 5,
                "difficulty": 1
            },
            {
                "duration_days": 7,
                "difficulty": 3
            }
        ]
        
        total_hours = curriculum_planner_agent._estimate_total_hours(modules)
        
        assert total_hours > 0
        assert isinstance(total_hours, int)
    
    def test_create_task_for_day_first_day(self, curriculum_planner_agent):
        """Test task creation for first day (should be reading)."""
        module_data = {
            "topics": ["variables", "functions"],
            "difficulty": 2,
            "practice_ratio": 0.7,
            "duration_days": 5
        }
        
        task = curriculum_planner_agent._create_task_for_day("module-id", 0, module_data)
        
        assert task.task_type == TaskType.READ
        assert task.day_offset == 0
        assert "Introduction" in task.description
        assert task.estimated_minutes > 0
    
    def test_create_task_for_day_coding_day(self, curriculum_planner_agent):
        """Test task creation for coding day."""
        module_data = {
            "topics": ["variables", "functions"],
            "difficulty": 2,
            "practice_ratio": 0.8,  # High practice ratio
            "duration_days": 5
        }
        
        task = curriculum_planner_agent._create_task_for_day("module-id", 1, module_data)
        
        # With high practice ratio, day 1 should be coding
        assert task.task_type == TaskType.CODE
        assert task.day_offset == 1
        assert "Practice" in task.description
    
    def test_create_task_for_day_final_day(self, curriculum_planner_agent):
        """Test task creation for final day (should be quiz)."""
        module_data = {
            "topics": ["variables"],
            "difficulty": 2,
            "practice_ratio": 0.7,
            "duration_days": 3,
            "title": "JavaScript Basics"
        }
        
        task = curriculum_planner_agent._create_task_for_day("module-id", 2, module_data)  # Last day
        
        assert task.task_type == TaskType.QUIZ
        assert task.day_offset == 2
        assert "Assessment" in task.description
    
    def test_generate_completion_criteria_code_task(self, curriculum_planner_agent):
        """Test completion criteria generation for code task."""
        criteria = curriculum_planner_agent._generate_completion_criteria(TaskType.CODE, 2)
        
        assert isinstance(criteria, str)
        assert len(criteria) > 0
        assert "solution" in criteria.lower() or "exercise" in criteria.lower() or "test" in criteria.lower()
    
    def test_generate_completion_criteria_quiz_task(self, curriculum_planner_agent):
        """Test completion criteria generation for quiz task."""
        criteria = curriculum_planner_agent._generate_completion_criteria(TaskType.QUIZ, 1)
        
        assert isinstance(criteria, str)
        assert "score" in criteria.lower() or "quiz" in criteria.lower()
    
    def test_analyze_performance_and_adapt_poor_performance(self, curriculum_planner_agent, sample_learning_plan):
        """Test performance analysis for poor performance."""
        performance_data = {
            "success_rate": 0.4,  # Low success rate
            "consecutive_failures": 3,  # Multiple failures
            "average_attempts": 3.0,
            "time_per_task_minutes": 90
        }
        
        adaptations = curriculum_planner_agent._analyze_performance_and_adapt(
            sample_learning_plan, performance_data, "performance_analysis"
        )
        
        assert len(adaptations) > 0
        
        # Should suggest reducing difficulty and slowing pace
        adaptation_types = [a["type"] for a in adaptations]
        assert "reduce_difficulty" in adaptation_types
        assert "slow_pacing" in adaptation_types
    
    def test_analyze_performance_and_adapt_excellent_performance(self, curriculum_planner_agent, sample_learning_plan):
        """Test performance analysis for excellent performance."""
        performance_data = {
            "success_rate": 0.95,  # High success rate
            "consecutive_failures": 0,
            "average_attempts": 1.1,  # Few attempts needed
            "time_per_task_minutes": 30
        }
        
        adaptations = curriculum_planner_agent._analyze_performance_and_adapt(
            sample_learning_plan, performance_data, "performance_analysis"
        )
        
        assert len(adaptations) > 0
        
        # Should suggest increasing difficulty
        adaptation_types = [a["type"] for a in adaptations]
        assert "increase_difficulty" in adaptation_types
    
    def test_find_next_topic_exists(self, curriculum_planner_agent, sample_learning_plan):
        """Test finding next topic when it exists."""
        next_topic = curriculum_planner_agent._find_next_topic(sample_learning_plan, 0)
        
        assert next_topic is not None
        assert "module_title" in next_topic
        assert "task" in next_topic
        assert "module_progress" in next_topic
        assert "overall_progress" in next_topic
    
    def test_find_next_topic_not_exists(self, curriculum_planner_agent, sample_learning_plan):
        """Test finding next topic when it doesn't exist."""
        next_topic = curriculum_planner_agent._find_next_topic(sample_learning_plan, 999)
        
        assert next_topic is None
    
    def test_calculate_progress_percentage(self, curriculum_planner_agent, sample_learning_plan):
        """Test progress percentage calculation."""
        # Test beginning
        progress = curriculum_planner_agent._calculate_progress_percentage(sample_learning_plan, 0)
        assert progress == 0.0
        
        # Test middle
        progress = curriculum_planner_agent._calculate_progress_percentage(sample_learning_plan, 15)
        assert 0.0 < progress < 100.0
        
        # Test completion
        progress = curriculum_planner_agent._calculate_progress_percentage(sample_learning_plan, 30)
        assert progress == 100.0
    
    def test_estimate_topic_completion_time(self, curriculum_planner_agent):
        """Test topic completion time estimation."""
        topic = {
            "task": {
                "estimated_minutes": 90
            }
        }
        
        estimation = curriculum_planner_agent._estimate_topic_completion_time(topic)
        
        assert "estimated_minutes" in estimation
        assert "estimated_hours" in estimation
        assert "suggested_session_breaks" in estimation
        assert estimation["estimated_minutes"] == 90
        assert estimation["estimated_hours"] == 1.5
    
    def test_generate_curriculum_summary(self, curriculum_planner_agent, sample_learning_plan):
        """Test curriculum summary generation."""
        summary = curriculum_planner_agent._generate_curriculum_summary(sample_learning_plan)
        
        assert "total_modules" in summary
        assert "total_tasks" in summary
        assert "coding_tasks" in summary
        assert "theory_tasks" in summary
        assert "estimated_completion_weeks" in summary
        assert "practice_percentage" in summary
        
        assert summary["total_modules"] == len(sample_learning_plan.modules)
        assert summary["total_tasks"] > 0
    
    def test_generate_spaced_repetition_schedule(self, curriculum_planner_agent):
        """Test spaced repetition schedule generation."""
        completed_topics = [
            {
                "topic_id": "topic-1",
                "title": "Variables",
                "completion_day": 5
            },
            {
                "topic_id": "topic-2",
                "title": "Functions", 
                "completion_day": 10
            }
        ]
        
        schedule = curriculum_planner_agent._generate_spaced_repetition_schedule(
            completed_topics, 15
        )
        
        assert len(schedule) > 0
        
        # Check schedule structure
        for item in schedule:
            assert "topic_id" in item
            assert "topic_title" in item
            assert "review_day" in item
            assert "review_date" in item
            assert "repetition_number" in item
            assert "estimated_minutes" in item
        
        # Should be sorted by review day
        review_days = [item["review_day"] for item in schedule]
        assert review_days == sorted(review_days)
    
    def test_generate_mini_project_javascript(self, curriculum_planner_agent):
        """Test mini-project generation for JavaScript."""
        project = curriculum_planner_agent._generate_mini_project(
            "integration", ["javascript", "dom"], 2
        )
        
        assert "title" in project
        assert "description" in project
        assert "topics" in project
        assert "difficulty" in project
        assert "estimated_hours" in project
        assert "topics_integration" in project
        assert "custom_requirements" in project
    
    def test_generate_custom_requirements_basic(self, curriculum_planner_agent):
        """Test custom requirements generation for basic difficulty."""
        requirements = curriculum_planner_agent._generate_custom_requirements(
            ["javascript"], 1
        )
        
        assert isinstance(requirements, list)
        assert len(requirements) >= 3  # Base requirements
        assert any("clean" in req.lower() for req in requirements)
    
    def test_generate_custom_requirements_advanced(self, curriculum_planner_agent):
        """Test custom requirements generation for advanced difficulty."""
        requirements = curriculum_planner_agent._generate_custom_requirements(
            ["javascript", "react"], 3
        )
        
        assert isinstance(requirements, list)
        assert len(requirements) > 3  # Should have additional requirements
        assert any("test" in req.lower() for req in requirements)
        assert any("performance" in req.lower() for req in requirements)
    
    def test_estimate_project_timeline(self, curriculum_planner_agent):
        """Test project timeline estimation."""
        project_data = {"estimated_hours": 12}
        
        timeline = curriculum_planner_agent._estimate_project_timeline(project_data)
        
        assert "estimated_hours" in timeline
        assert "estimated_days" in timeline
        assert "phases" in timeline
        assert "hours_per_phase" in timeline
        
        assert timeline["estimated_hours"] == 12
        assert timeline["phases"] == 5
    
    def test_summarize_pacing_changes_slow_down(self, curriculum_planner_agent):
        """Test pacing changes summary for slowing down."""
        summary = curriculum_planner_agent._summarize_pacing_changes(0.8, "learner_struggling")
        
        assert summary["change_type"] == "slowed_down"
        assert summary["pacing_factor"] == 0.8
        assert summary["reason"] == "learner_struggling"
        assert "reduced" in summary["impact"].lower()
    
    def test_summarize_pacing_changes_speed_up(self, curriculum_planner_agent):
        """Test pacing changes summary for speeding up."""
        summary = curriculum_planner_agent._summarize_pacing_changes(1.2, "learner_excelling")
        
        assert summary["change_type"] == "accelerated"
        assert summary["pacing_factor"] == 1.2
        assert summary["reason"] == "learner_excelling"
        assert "increased" in summary["impact"].lower()
    
    def test_analyze_difficulty_progression_gradual(self, curriculum_planner_agent):
        """Test difficulty progression analysis for gradual progression."""
        curriculum_structure = {
            "modules": [
                {"difficulty": 1},
                {"difficulty": 2},
                {"difficulty": 2},
                {"difficulty": 3}
            ]
        }
        
        analysis = curriculum_planner_agent._analyze_difficulty_progression(curriculum_structure)
        
        assert analysis["progression"] == "gradual"
        assert analysis["difficulty_curve"] == [1, 2, 2, 3]
        assert analysis["max_difficulty_jump"] == 1
        assert analysis["total_modules"] == 4
    
    def test_analyze_difficulty_progression_steep(self, curriculum_planner_agent):
        """Test difficulty progression analysis for steep progression."""
        curriculum_structure = {
            "modules": [
                {"difficulty": 1},
                {"difficulty": 4}  # Big jump
            ]
        }
        
        analysis = curriculum_planner_agent._analyze_difficulty_progression(curriculum_structure)
        
        assert analysis["progression"] == "steep"
        assert analysis["max_difficulty_jump"] == 3
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_create_learning_path(self, curriculum_planner_agent, sample_context):
        """Test timeout fallback for learning path creation."""
        payload = {"intent": "create_learning_path"}
        
        result = await curriculum_planner_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is not None
        assert result.success is True
        assert result.data["fallback"] is True
        assert "learning_plan" in result.data
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_request_next_topic(self, curriculum_planner_agent, sample_context):
        """Test timeout fallback for next topic request."""
        payload = {"intent": "request_next_topic"}
        
        result = await curriculum_planner_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is not None
        assert result.success is True
        assert result.data["fallback"] is True
        assert "next_topic" in result.data
    
    @pytest.mark.asyncio
    async def test_timeout_fallback_unsupported_intent(self, curriculum_planner_agent, sample_context):
        """Test timeout fallback for unsupported intent."""
        payload = {"intent": "unsupported_intent"}
        
        result = await curriculum_planner_agent._handle_timeout_fallback(sample_context, payload)
        
        assert result is None