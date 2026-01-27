"""
CurriculumPlannerAgent implementation for the Agentic Learning Coach system.

This agent designs adaptive learning paths including:
- LLM-powered curriculum generation with progressive difficulty
- Spaced repetition scheduling
- Module and task generation
- Mini-project integration
- Curriculum adaptation based on performance

NOTE: This agent uses LLM for intelligent curriculum design when available,
with template fallbacks for reliability.
"""
import json
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta

from .base.base_agent import BaseAgent
from .base.types import LearningContext, AgentResult, AgentType
from .base.exceptions import ValidationError, AgentProcessingError
from ..domain.entities.learning_plan import LearningPlan
from ..domain.entities.module import Module
from ..domain.entities.task import Task
from ..domain.entities.user_profile import UserProfile
from ..domain.value_objects.enums import SkillLevel, TaskType, LearningPlanStatus
from ..ports.repositories.curriculum_repository import CurriculumRepository
from ..ports.repositories.user_repository import UserRepository
from ..adapters.services.llm_service import LLMService, create_llm_service

logger = logging.getLogger(__name__)


class CurriculumPlannerAgent(BaseAgent):
    """
    Agent responsible for designing and adapting learning curricula.
    
    Creates personalized learning paths with progressive difficulty,
    spaced repetition, and adaptive adjustments based on performance.
    
    Uses LLM for intelligent curriculum design when available,
    with template fallbacks for reliability.
    """
    
    def __init__(
        self, 
        curriculum_repository: CurriculumRepository, 
        user_repository: UserRepository,
        llm_service: Optional[LLMService] = None
    ):
        """
        Initialize CurriculumPlannerAgent with required dependencies.
        
        Args:
            curriculum_repository: Repository for curriculum operations
            user_repository: Repository for user profile operations
            llm_service: Optional LLM service for AI-powered curriculum generation
        """
        super().__init__(AgentType.CURRICULUM_PLANNER)
        self.curriculum_repository = curriculum_repository
        self.user_repository = user_repository
        self.llm_service = llm_service or create_llm_service()
        
        # Learning path templates by domain and skill level (fallback)
        self._curriculum_templates = self._initialize_curriculum_templates()
        
        # Spaced repetition intervals (in days)
        self._spaced_repetition_intervals = [1, 3, 7, 14, 30]
        
        # Difficulty progression parameters
        self._difficulty_progression = self._initialize_difficulty_progression()
        
        # Mini-project templates (fallback)
        self._project_templates = self._initialize_project_templates()
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return [
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
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process curriculum planning requests.
        
        Args:
            context: Learning context with user information
            payload: Request payload with intent and data
            
        Returns:
            AgentResult with processing results
        """
        intent = payload.get("intent")
        
        try:
            if intent == "create_learning_path":
                return await self._create_learning_path(context, payload)
            elif intent == "adapt_difficulty":
                return await self._adapt_difficulty(context, payload)
            elif intent == "request_next_topic":
                return await self._request_next_topic(context, payload)
            elif intent == "generate_curriculum":
                return await self._generate_curriculum(context, payload)
            elif intent == "update_curriculum":
                return await self._update_curriculum(context, payload)
            elif intent == "get_curriculum_status":
                return await self._get_curriculum_status(context, payload)
            elif intent == "schedule_spaced_repetition":
                return await self._schedule_spaced_repetition(context, payload)
            elif intent == "add_mini_project":
                return await self._add_mini_project(context, payload)
            elif intent == "adjust_pacing":
                return await self._adjust_pacing(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except Exception as e:
            self.logger.log_error(f"CurriculumPlannerAgent processing failed for intent {intent}", e, context, intent)
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")
    
    async def _create_learning_path(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Create a personalized learning path based on user profile and goals.
        
        Args:
            context: Learning context
            payload: Contains learning goals, constraints, and preferences
            
        Returns:
            AgentResult with created learning plan
        """
        # Get user profile
        profile = await self.user_repository.get_user_profile(context.user_id)
        if not profile:
            raise ValidationError("User profile not found. Please complete profile setup first.")
        
        # Extract parameters
        goals = payload.get("goals", profile.learning_goals)
        time_constraints = payload.get("time_constraints", profile.time_constraints)
        preferences = payload.get("preferences", profile.preferences)
        
        if not goals:
            raise ValidationError("Learning goals are required to create a learning path")
        
        # Generate curriculum structure
        curriculum_plan = self._design_curriculum_structure(
            goals=goals,
            skill_level=profile.skill_level,
            time_constraints=time_constraints,
            preferences=preferences
        )
        
        # Create learning plan entity
        learning_plan = LearningPlan(
            user_id=context.user_id,
            title=curriculum_plan["title"],
            goal_description=curriculum_plan["description"],
            total_days=curriculum_plan["total_days"],
            status=LearningPlanStatus.DRAFT
        )
        
        # Generate modules and tasks
        for module_data in curriculum_plan["modules"]:
            module = self._create_module_from_template(learning_plan.id, module_data)
            learning_plan.add_module(module)
        
        # Save the learning plan
        saved_plan = await self.curriculum_repository.save_plan(learning_plan)
        
        return AgentResult.success_result(
            data={
                "learning_plan": saved_plan.to_dict(),
                "curriculum_summary": self._generate_curriculum_summary(saved_plan),
                "next_steps": ["activate_plan", "start_first_module"]
            },
            next_actions=["activate_learning_plan"]
        )
    
    async def _adapt_difficulty(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Adapt curriculum difficulty based on performance data.
        
        Args:
            context: Learning context
            payload: Contains performance metrics and adaptation triggers
            
        Returns:
            AgentResult with adaptation results
        """
        # Get current active plan
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        # Extract performance data
        performance_data = payload.get("performance_data", {})
        adaptation_trigger = payload.get("trigger", "manual")
        
        # Analyze performance and determine adaptations
        adaptations = self._analyze_performance_and_adapt(
            plan=active_plan,
            performance_data=performance_data,
            trigger=adaptation_trigger
        )
        
        # Apply adaptations
        adapted_plan = await self._apply_adaptations(active_plan, adaptations)
        
        return AgentResult.success_result(
            data={
                "adaptations_applied": adaptations,
                "updated_plan": adapted_plan.to_dict(),
                "adaptation_summary": self._generate_adaptation_summary(adaptations)
            },
            next_actions=["continue_learning"]
        )
    
    async def _request_next_topic(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Get the next topic/module in the learning sequence.
        
        Args:
            context: Learning context
            payload: Request parameters
            
        Returns:
            AgentResult with next topic information
        """
        # Get active plan
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        # Find next topic based on progress
        current_day = payload.get("current_day", 0)
        next_topic = self._find_next_topic(active_plan, current_day)
        
        if not next_topic:
            return AgentResult.success_result(
                data={
                    "next_topic": None,
                    "plan_completed": True,
                    "completion_message": "Congratulations! You've completed your learning plan."
                },
                next_actions=["celebrate_completion", "create_advanced_plan"]
            )
        
        return AgentResult.success_result(
            data={
                "next_topic": next_topic,
                "progress_percentage": self._calculate_progress_percentage(active_plan, current_day),
                "estimated_completion": self._estimate_topic_completion_time(next_topic)
            },
            next_actions=["start_topic"]
        )
    
    async def _generate_curriculum(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Generate a detailed curriculum structure without saving.
        
        Args:
            context: Learning context
            payload: Contains curriculum parameters
            
        Returns:
            AgentResult with generated curriculum structure
        """
        goals = payload.get("goals", [])
        skill_level = SkillLevel(payload.get("skill_level", "beginner"))
        time_constraints = payload.get("time_constraints", {})
        
        if not goals:
            raise ValidationError("Goals are required for curriculum generation")
        
        # Generate curriculum structure
        curriculum_structure = self._design_curriculum_structure(
            goals=goals,
            skill_level=skill_level,
            time_constraints=time_constraints,
            preferences={}
        )
        
        return AgentResult.success_result(
            data={
                "curriculum_structure": curriculum_structure,
                "estimated_timeline": curriculum_structure["total_days"],
                "difficulty_progression": self._analyze_difficulty_progression(curriculum_structure)
            }
        )
    
    async def _update_curriculum(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Update an existing curriculum with new requirements.
        
        Args:
            context: Learning context
            payload: Contains update parameters
            
        Returns:
            AgentResult with updated curriculum
        """
        plan_id = payload.get("plan_id")
        updates = payload.get("updates", {})
        
        if not plan_id:
            # Use active plan
            plan = await self.curriculum_repository.get_active_plan(context.user_id)
        else:
            plan = await self.curriculum_repository.get_plan(plan_id)
        
        if not plan:
            raise ValidationError("Learning plan not found")
        
        # Apply updates
        updated_plan = await self._apply_curriculum_updates(plan, updates)
        
        return AgentResult.success_result(
            data={
                "updated_plan": updated_plan.to_dict(),
                "changes_summary": self._summarize_curriculum_changes(updates)
            }
        )
    
    async def _get_curriculum_status(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Get status and progress of current curriculum.
        
        Args:
            context: Learning context
            payload: Request parameters
            
        Returns:
            AgentResult with curriculum status
        """
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        
        if not active_plan:
            return AgentResult.success_result(
                data={
                    "has_active_plan": False,
                    "message": "No active learning plan found"
                },
                next_actions=["create_learning_plan"]
            )
        
        # Calculate detailed status
        status = self._calculate_detailed_status(active_plan)
        
        return AgentResult.success_result(
            data={
                "has_active_plan": True,
                "plan": active_plan.to_dict(),
                "status": status,
                "recommendations": self._generate_status_recommendations(status)
            }
        )
    
    async def _schedule_spaced_repetition(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Schedule spaced repetition for completed topics.
        
        Args:
            context: Learning context
            payload: Contains topics for spaced repetition
            
        Returns:
            AgentResult with spaced repetition schedule
        """
        completed_topics = payload.get("completed_topics", [])
        current_day = payload.get("current_day", 0)
        
        if not completed_topics:
            raise ValidationError("Completed topics are required for spaced repetition scheduling")
        
        # Generate spaced repetition schedule
        repetition_schedule = self._generate_spaced_repetition_schedule(
            completed_topics, current_day
        )
        
        return AgentResult.success_result(
            data={
                "repetition_schedule": repetition_schedule,
                "next_review_date": repetition_schedule[0]["review_date"] if repetition_schedule else None
            }
        )
    
    async def _add_mini_project(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Add a mini-project to the curriculum.
        
        Args:
            context: Learning context
            payload: Contains project parameters
            
        Returns:
            AgentResult with added project details
        """
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        project_type = payload.get("project_type", "integration")
        topics_covered = payload.get("topics_covered", [])
        difficulty_level = payload.get("difficulty_level", 2)
        
        # Generate mini-project
        mini_project = self._generate_mini_project(
            project_type=project_type,
            topics_covered=topics_covered,
            difficulty_level=difficulty_level
        )
        
        # Add project as a new module
        project_module = self._create_project_module(active_plan.id, mini_project)
        active_plan.add_module(project_module)
        
        # Save updated plan
        updated_plan = await self.curriculum_repository.save_plan(active_plan)
        
        return AgentResult.success_result(
            data={
                "mini_project": mini_project,
                "updated_plan": updated_plan.to_dict(),
                "project_timeline": self._estimate_project_timeline(mini_project)
            }
        )
    
    async def _adjust_pacing(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Adjust the pacing of the curriculum based on progress.
        
        Args:
            context: Learning context
            payload: Contains pacing adjustment parameters
            
        Returns:
            AgentResult with pacing adjustments
        """
        active_plan = await self.curriculum_repository.get_active_plan(context.user_id)
        if not active_plan:
            raise ValidationError("No active learning plan found")
        
        pacing_factor = payload.get("pacing_factor", 1.0)  # 1.0 = normal, <1.0 = slower, >1.0 = faster
        reason = payload.get("reason", "manual_adjustment")
        
        # Apply pacing adjustments
        adjusted_plan = self._apply_pacing_adjustments(active_plan, pacing_factor, reason)
        
        return AgentResult.success_result(
            data={
                "adjusted_plan": adjusted_plan.to_dict(),
                "pacing_changes": self._summarize_pacing_changes(pacing_factor, reason),
                "new_timeline": adjusted_plan.total_days
            }
        )
    
    def _initialize_curriculum_templates(self) -> Dict[str, Any]:
        """Initialize curriculum templates for different domains and skill levels."""
        return {
            "javascript": {
                SkillLevel.BEGINNER: {
                    "modules": [
                        {
                            "title": "JavaScript Fundamentals",
                            "topics": ["variables", "data_types", "operators", "control_flow"],
                            "duration_days": 7,
                            "difficulty": 1
                        },
                        {
                            "title": "Functions and Scope",
                            "topics": ["functions", "scope", "closures", "hoisting"],
                            "duration_days": 5,
                            "difficulty": 2
                        },
                        {
                            "title": "Objects and Arrays",
                            "topics": ["objects", "arrays", "methods", "iteration"],
                            "duration_days": 6,
                            "difficulty": 2
                        },
                        {
                            "title": "DOM Manipulation",
                            "topics": ["dom", "events", "forms", "styling"],
                            "duration_days": 8,
                            "difficulty": 3
                        },
                        {
                            "title": "Asynchronous JavaScript",
                            "topics": ["callbacks", "promises", "async_await", "fetch"],
                            "duration_days": 7,
                            "difficulty": 4
                        }
                    ]
                },
                SkillLevel.INTERMEDIATE: {
                    "modules": [
                        {
                            "title": "Advanced Functions",
                            "topics": ["arrow_functions", "higher_order_functions", "decorators"],
                            "duration_days": 4,
                            "difficulty": 3
                        },
                        {
                            "title": "Modern JavaScript",
                            "topics": ["es6_features", "modules", "destructuring", "spread_operator"],
                            "duration_days": 5,
                            "difficulty": 3
                        },
                        {
                            "title": "Error Handling",
                            "topics": ["try_catch", "error_types", "debugging", "testing"],
                            "duration_days": 4,
                            "difficulty": 3
                        },
                        {
                            "title": "Performance Optimization",
                            "topics": ["optimization", "memory_management", "profiling"],
                            "duration_days": 6,
                            "difficulty": 4
                        }
                    ]
                }
            },
            "react": {
                SkillLevel.BEGINNER: {
                    "modules": [
                        {
                            "title": "React Basics",
                            "topics": ["components", "jsx", "props", "state"],
                            "duration_days": 6,
                            "difficulty": 2
                        },
                        {
                            "title": "Event Handling",
                            "topics": ["events", "forms", "controlled_components"],
                            "duration_days": 4,
                            "difficulty": 2
                        },
                        {
                            "title": "Component Lifecycle",
                            "topics": ["lifecycle_methods", "useEffect", "cleanup"],
                            "duration_days": 5,
                            "difficulty": 3
                        },
                        {
                            "title": "State Management",
                            "topics": ["useState", "useReducer", "context_api"],
                            "duration_days": 7,
                            "difficulty": 3
                        }
                    ]
                }
            }
        }
    
    def _initialize_difficulty_progression(self) -> Dict[str, Any]:
        """Initialize difficulty progression parameters."""
        return {
            "base_difficulty_by_level": {
                SkillLevel.BEGINNER: 1,
                SkillLevel.INTERMEDIATE: 2,
                SkillLevel.ADVANCED: 3,
                SkillLevel.EXPERT: 4
            },
            "progression_rate": 0.3,  # How quickly difficulty increases
            "max_difficulty_jump": 2,  # Maximum difficulty increase between modules
            "practice_to_theory_ratio": 0.7  # 70% practice, 30% theory
        }
    
    def _initialize_project_templates(self) -> Dict[str, Any]:
        """Initialize mini-project templates."""
        return {
            "javascript": [
                {
                    "title": "Todo List Application",
                    "description": "Build a simple todo list with add, edit, delete functionality",
                    "topics": ["dom_manipulation", "events", "local_storage"],
                    "difficulty": 2,
                    "estimated_hours": 8
                },
                {
                    "title": "Weather App",
                    "description": "Create a weather app using a public API",
                    "topics": ["fetch_api", "json", "error_handling"],
                    "difficulty": 3,
                    "estimated_hours": 12
                }
            ],
            "react": [
                {
                    "title": "React Calculator",
                    "description": "Build a functional calculator using React components",
                    "topics": ["components", "state", "event_handling"],
                    "difficulty": 2,
                    "estimated_hours": 10
                },
                {
                    "title": "Movie Search App",
                    "description": "Create a movie search app with API integration",
                    "topics": ["hooks", "api_calls", "conditional_rendering"],
                    "difficulty": 3,
                    "estimated_hours": 15
                }
            ]
        }
    
    def _design_curriculum_structure(
        self, 
        goals: List[str], 
        skill_level: SkillLevel, 
        time_constraints: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Design the overall curriculum structure based on goals and constraints.
        
        Uses LLM for intelligent curriculum design when available,
        with template fallbacks for reliability.
        
        Args:
            goals: Learning goals
            skill_level: Current skill level
            time_constraints: Available time constraints
            preferences: Learning preferences
            
        Returns:
            Dictionary with curriculum structure
        """
        # Determine primary domain from goals
        primary_domain = self._determine_primary_domain(goals)
        
        # Try LLM-powered curriculum generation first
        llm_curriculum = self._generate_curriculum_with_llm_sync(
            goals, skill_level, time_constraints, preferences, primary_domain
        )
        
        if llm_curriculum and llm_curriculum.get("modules"):
            logger.info(f"Using LLM-generated curriculum for {primary_domain}")
            return llm_curriculum
        
        # Fallback to template-based generation
        logger.info(f"Using template-based curriculum for {primary_domain}")
        return self._design_curriculum_from_templates(
            goals, skill_level, time_constraints, preferences, primary_domain
        )
    
    def _generate_curriculum_with_llm_sync(
        self,
        goals: List[str],
        skill_level: SkillLevel,
        time_constraints: Dict[str, Any],
        preferences: Dict[str, Any],
        primary_domain: str
    ) -> Optional[Dict[str, Any]]:
        """
        Synchronous wrapper for LLM curriculum generation.
        Uses asyncio to run the async method.
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, create a new task
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self._generate_curriculum_with_llm(
                            goals, skill_level, time_constraints, preferences, primary_domain
                        )
                    )
                    return future.result(timeout=30)
            else:
                return loop.run_until_complete(
                    self._generate_curriculum_with_llm(
                        goals, skill_level, time_constraints, preferences, primary_domain
                    )
                )
        except Exception as e:
            logger.warning(f"LLM curriculum generation failed: {e}")
            return None
    
    async def _generate_curriculum_with_llm(
        self,
        goals: List[str],
        skill_level: SkillLevel,
        time_constraints: Dict[str, Any],
        preferences: Dict[str, Any],
        primary_domain: str
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a personalized curriculum using LLM.
        
        This method creates truly adaptive, personalized learning paths
        based on the learner's specific goals and constraints.
        """
        hours_per_week = time_constraints.get("hours_per_week", 5)
        learning_style = preferences.get("learning_style", "balanced")
        practice_preference = preferences.get("practice_preference", "hands-on")
        
        system_prompt = """You are an expert curriculum designer for programming education.
Create personalized, adaptive learning paths that:
1. Progress logically from fundamentals to advanced topics
2. Include practical exercises and mini-projects
3. Adapt to the learner's available time and skill level
4. Follow industry best practices and modern approaches

Return your response as valid JSON with this structure:
{
    "title": "Learning Path Title",
    "description": "Brief description of the learning path",
    "modules": [
        {
            "title": "Module Title",
            "description": "What the learner will achieve",
            "topics": ["topic1", "topic2", "topic3"],
            "duration_days": 7,
            "difficulty": 2,
            "learning_objectives": ["objective1", "objective2"],
            "practical_exercises": ["exercise1", "exercise2"],
            "mini_project": "Optional project description"
        }
    ],
    "total_days": 30,
    "estimated_hours": 40,
    "prerequisites": ["prerequisite1"],
    "outcomes": ["outcome1", "outcome2"]
}"""

        prompt = f"""Create a personalized learning curriculum for:

**Learning Goals:** {', '.join(goals)}
**Primary Technology:** {primary_domain}
**Skill Level:** {skill_level.value}
**Available Time:** {hours_per_week} hours per week
**Learning Style Preference:** {learning_style}
**Practice Preference:** {practice_preference}

Design a curriculum that:
1. Starts at the appropriate level for a {skill_level.value} learner
2. Covers all the specified goals progressively
3. Includes 4-8 modules with clear learning objectives
4. Balances theory (30%) with hands-on practice (70%)
5. Includes at least one mini-project per 2-3 modules
6. Can be completed with {hours_per_week} hours/week commitment

Make the curriculum specific to {primary_domain} with real-world, practical examples."""

        try:
            response = await self.llm_service.generate(prompt, system_prompt)
            
            if response.success:
                content = response.content
                # Parse JSON from response
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                curriculum_data = json.loads(content.strip())
                
                # Validate and enhance the response
                if self._validate_llm_curriculum(curriculum_data):
                    # Add metadata
                    curriculum_data["primary_domain"] = primary_domain
                    curriculum_data["skill_level"] = skill_level.value
                    curriculum_data["llm_generated"] = True
                    curriculum_data["practice_ratio"] = self._calculate_practice_ratio(preferences)
                    
                    # Apply spaced repetition scheduling
                    if curriculum_data.get("modules"):
                        curriculum_data["modules"] = self._apply_spaced_repetition_scheduling(
                            curriculum_data["modules"]
                        )
                    
                    return curriculum_data
                    
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM curriculum response: {e}")
        except Exception as e:
            logger.warning(f"LLM curriculum generation error: {e}")
        
        return None
    
    def _validate_llm_curriculum(self, curriculum: Dict[str, Any]) -> bool:
        """Validate LLM-generated curriculum has required fields."""
        required_fields = ["title", "modules"]
        if not all(field in curriculum for field in required_fields):
            return False
        
        if not curriculum.get("modules") or len(curriculum["modules"]) == 0:
            return False
        
        # Validate each module has minimum required fields
        for module in curriculum["modules"]:
            if not module.get("title") or not module.get("topics"):
                return False
            # Set defaults for optional fields
            module.setdefault("duration_days", 7)
            module.setdefault("difficulty", 2)
            module.setdefault("learning_objectives", [])
            module.setdefault("practical_exercises", [])
        
        return True
    
    def _design_curriculum_from_templates(
        self,
        goals: List[str],
        skill_level: SkillLevel,
        time_constraints: Dict[str, Any],
        preferences: Dict[str, Any],
        primary_domain: str
    ) -> Dict[str, Any]:
        """
        Fallback template-based curriculum design.
        Used when LLM is unavailable or fails.
        """
        # Get base template
        template = self._get_curriculum_template(primary_domain, skill_level)
        
        # Customize based on specific goals
        customized_modules = self._customize_modules_for_goals(template["modules"], goals)
        
        # Adjust for time constraints
        adjusted_modules = self._adjust_modules_for_time_constraints(
            customized_modules, time_constraints
        )
        
        # Calculate total duration
        total_days = sum(module["duration_days"] for module in adjusted_modules)
        if total_days <= 0:
            total_days = 30  # Default minimum duration
        
        # Apply spaced repetition scheduling
        scheduled_modules = self._apply_spaced_repetition_scheduling(adjusted_modules)
        
        return {
            "title": f"{primary_domain.title()} Learning Path",
            "description": f"Personalized {primary_domain} curriculum for {skill_level.value} level",
            "primary_domain": primary_domain,
            "skill_level": skill_level.value,
            "total_days": total_days,
            "modules": scheduled_modules,
            "practice_ratio": self._calculate_practice_ratio(preferences),
            "estimated_hours": self._estimate_total_hours(scheduled_modules),
            "llm_generated": False
        }
    
    def _determine_primary_domain(self, goals: List[str]) -> str:
        """Determine the primary learning domain from goals."""
        domain_keywords = {
            "javascript": ["javascript", "js", "node", "express", "nodejs"],
            "react": ["react", "jsx", "components", "hooks", "redux"],
            "python": ["python", "django", "flask", "fastapi", "pandas"],
            "typescript": ["typescript", "ts", "types", "interfaces"],
            "web_development": ["html", "css", "frontend", "backend", "web"],
            "rust": ["rust", "cargo", "ownership", "borrowing"],
            "go": ["go", "golang", "goroutines", "channels"],
            "java": ["java", "spring", "maven", "gradle"],
            "csharp": ["c#", "csharp", ".net", "dotnet", "asp.net"],
            "kubernetes": ["kubernetes", "k8s", "kubectl", "helm", "pods"],
            "docker": ["docker", "containers", "dockerfile", "compose"],
            "aws": ["aws", "amazon", "ec2", "s3", "lambda"],
            "sql": ["sql", "database", "postgres", "mysql", "queries"],
            "vue": ["vue", "vuejs", "vuex", "nuxt"],
            "angular": ["angular", "rxjs", "ngrx"],
        }
        
        domain_scores = {}
        for domain, keywords in domain_keywords.items():
            score = sum(1 for goal in goals if any(keyword in goal.lower() for keyword in keywords))
            if score > 0:
                domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        
        # If no match found, use the first goal as the domain name
        # This allows dynamic curriculum generation for any technology
        if goals:
            # Clean up the goal to use as domain name
            primary_goal = goals[0].lower().strip()
            # Remove common prefixes/suffixes
            for prefix in ["learn ", "study ", "master "]:
                if primary_goal.startswith(prefix):
                    primary_goal = primary_goal[len(prefix):]
            return primary_goal
        
        # Default to JavaScript if no goals provided
        return "javascript"
    
    def _get_curriculum_template(self, domain: str, skill_level: SkillLevel) -> Dict[str, Any]:
        """Get curriculum template for domain and skill level."""
        templates = self._curriculum_templates.get(domain)
        
        if templates:
            template = templates.get(skill_level, templates.get(SkillLevel.BEGINNER, {}))
            if template.get("modules"):
                return template
        
        # Generate dynamic template for unknown technologies
        # This allows the system to create curricula for any technology
        return self._generate_dynamic_template(domain, skill_level)
    
    def _generate_dynamic_template(self, domain: str, skill_level: SkillLevel) -> Dict[str, Any]:
        """
        Generate a dynamic curriculum template for technologies not in predefined templates.
        
        This enables the system to create learning paths for ANY technology,
        not just the ones with predefined templates.
        """
        domain_title = domain.replace("_", " ").title()
        
        # Base structure varies by skill level
        if skill_level == SkillLevel.BEGINNER:
            modules = [
                {
                    "title": f"{domain_title} Fundamentals",
                    "topics": ["introduction", "basic_concepts", "setup", "first_steps"],
                    "duration_days": 7,
                    "difficulty": 1
                },
                {
                    "title": f"{domain_title} Core Concepts",
                    "topics": ["core_features", "syntax", "patterns", "best_practices"],
                    "duration_days": 7,
                    "difficulty": 2
                },
                {
                    "title": f"{domain_title} Practical Application",
                    "topics": ["hands_on_exercises", "mini_projects", "debugging"],
                    "duration_days": 8,
                    "difficulty": 2
                },
                {
                    "title": f"{domain_title} Building Projects",
                    "topics": ["project_structure", "real_world_examples", "integration"],
                    "duration_days": 8,
                    "difficulty": 3
                }
            ]
        elif skill_level == SkillLevel.INTERMEDIATE:
            modules = [
                {
                    "title": f"Advanced {domain_title} Concepts",
                    "topics": ["advanced_features", "optimization", "architecture"],
                    "duration_days": 5,
                    "difficulty": 3
                },
                {
                    "title": f"{domain_title} Best Practices",
                    "topics": ["design_patterns", "testing", "code_quality"],
                    "duration_days": 5,
                    "difficulty": 3
                },
                {
                    "title": f"{domain_title} Real-World Applications",
                    "topics": ["production_ready", "scalability", "performance"],
                    "duration_days": 6,
                    "difficulty": 4
                },
                {
                    "title": f"{domain_title} Integration & Ecosystem",
                    "topics": ["tools", "libraries", "ecosystem", "community"],
                    "duration_days": 4,
                    "difficulty": 3
                }
            ]
        elif skill_level == SkillLevel.ADVANCED:
            modules = [
                {
                    "title": f"{domain_title} Expert Techniques",
                    "topics": ["expert_patterns", "internals", "optimization"],
                    "duration_days": 5,
                    "difficulty": 4
                },
                {
                    "title": f"{domain_title} Architecture & Design",
                    "topics": ["system_design", "architecture_patterns", "scalability"],
                    "duration_days": 6,
                    "difficulty": 5
                },
                {
                    "title": f"{domain_title} Production Systems",
                    "topics": ["deployment", "monitoring", "maintenance"],
                    "duration_days": 5,
                    "difficulty": 4
                }
            ]
        else:  # EXPERT
            modules = [
                {
                    "title": f"{domain_title} Mastery",
                    "topics": ["cutting_edge", "contributions", "teaching"],
                    "duration_days": 10,
                    "difficulty": 5
                },
                {
                    "title": f"{domain_title} Innovation",
                    "topics": ["research", "new_approaches", "leadership"],
                    "duration_days": 10,
                    "difficulty": 5
                }
            ]
        
        return {"modules": modules}
    
    def _customize_modules_for_goals(self, base_modules: List[Dict[str, Any]], goals: List[str]) -> List[Dict[str, Any]]:
        """Customize modules based on specific learning goals."""
        customized = []
        
        for module in base_modules:
            # Check if module topics align with goals
            module_relevance = self._calculate_module_relevance(module, goals)
            
            if module_relevance > 0.3:  # Include if at least 30% relevant
                customized_module = module.copy()
                
                # Adjust module emphasis based on goal alignment
                if module_relevance > 0.7:
                    customized_module["emphasis"] = "high"
                    customized_module["duration_days"] = int(module["duration_days"] * 1.2)
                elif module_relevance < 0.5:
                    customized_module["emphasis"] = "low"
                    customized_module["duration_days"] = int(module["duration_days"] * 0.8)
                else:
                    customized_module["emphasis"] = "medium"
                
                customized.append(customized_module)
        
        # Ensure we have at least one module
        if not customized and base_modules:
            # Include the first module if none met the relevance threshold
            customized.append(base_modules[0].copy())
        
        return customized
    
    def _calculate_module_relevance(self, module: Dict[str, Any], goals: List[str]) -> float:
        """Calculate how relevant a module is to the learning goals."""
        module_topics = module.get("topics", [])
        
        if not module_topics or not goals:
            return 0.5  # Default relevance
        
        matches = 0
        for topic in module_topics:
            if any(topic.lower() in goal.lower() or goal.lower() in topic.lower() for goal in goals):
                matches += 1
        
        return matches / len(module_topics)
    
    def _adjust_modules_for_time_constraints(
        self, 
        modules: List[Dict[str, Any]], 
        time_constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Adjust module duration and content based on time constraints."""
        hours_per_week = time_constraints.get("hours_per_week", 5)
        
        # Calculate time adjustment factor
        if hours_per_week < 3:
            time_factor = 0.7  # Reduce content for very limited time
        elif hours_per_week > 15:
            time_factor = 1.3  # Add more content for abundant time
        else:
            time_factor = 1.0  # Normal pacing
        
        adjusted = []
        for module in modules:
            adjusted_module = module.copy()
            
            # Adjust duration
            original_days = module["duration_days"]
            adjusted_days = max(1, int(original_days * time_factor))
            adjusted_module["duration_days"] = adjusted_days
            
            # Adjust task density based on available time
            if time_factor < 1.0:
                adjusted_module["task_density"] = "light"
            elif time_factor > 1.2:
                adjusted_module["task_density"] = "intensive"
            else:
                adjusted_module["task_density"] = "normal"
            
            adjusted.append(adjusted_module)
        
        return adjusted
    
    def _apply_spaced_repetition_scheduling(self, modules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply spaced repetition scheduling to modules."""
        scheduled = []
        current_day = 0
        
        for i, module in enumerate(modules):
            scheduled_module = module.copy()
            scheduled_module["start_day"] = current_day
            scheduled_module["end_day"] = current_day + module["duration_days"] - 1
            
            # Add spaced repetition tasks
            repetition_days = []
            for interval in self._spaced_repetition_intervals:
                repetition_day = scheduled_module["end_day"] + interval
                if repetition_day < sum(m["duration_days"] for m in modules) + 30:  # Within reasonable range
                    repetition_days.append(repetition_day)
            
            scheduled_module["spaced_repetition_days"] = repetition_days
            
            current_day += module["duration_days"]
            scheduled.append(scheduled_module)
        
        return scheduled
    
    def _calculate_practice_ratio(self, preferences: Dict[str, Any]) -> float:
        """Calculate the practice-to-theory ratio based on preferences."""
        learning_style = preferences.get("learning_style", "balanced")
        
        if learning_style == "hands_on":
            return 0.8  # 80% practice
        elif learning_style == "theoretical":
            return 0.4  # 40% practice
        else:
            return 0.7  # Default 70% practice (practice-first approach)
    
    def _estimate_total_hours(self, modules: List[Dict[str, Any]]) -> int:
        """Estimate total hours needed for the curriculum."""
        total_hours = 0
        
        for module in modules:
            # Base hours per day varies by difficulty
            difficulty = module.get("difficulty", 2)
            hours_per_day = 1 + (difficulty * 0.5)  # 1-3.5 hours per day
            
            module_hours = module["duration_days"] * hours_per_day
            total_hours += module_hours
        
        return int(total_hours)
    
    def _create_module_from_template(self, plan_id: str, module_data: Dict[str, Any]) -> Module:
        """Create a Module entity from template data."""
        module = Module(
            plan_id=plan_id,
            title=module_data["title"],
            order_index=module_data.get("order_index", 0),
            summary=f"Learn {', '.join(module_data.get('topics', []))}"
        )
        
        # Create tasks for each day of the module
        for day in range(module_data["duration_days"]):
            task = self._create_task_for_day(module.id, day, module_data)
            module.add_task(task)
        
        return module
    
    def _create_task_for_day(self, module_id: str, day_offset: int, module_data: Dict[str, Any]) -> Task:
        """Create a task for a specific day within a module."""
        topics = module_data.get("topics", [])
        difficulty = module_data.get("difficulty", 2)
        practice_ratio = module_data.get("practice_ratio", 0.7)
        
        # Determine task type based on day and practice ratio
        if day_offset == 0:
            task_type = TaskType.READ  # Start with reading/overview
            description = f"Introduction to {topics[0] if topics else 'the topic'}"
        elif day_offset < len(topics):
            # Alternate between reading and coding based on practice ratio
            if (day_offset % 2 == 1 and practice_ratio > 0.5) or practice_ratio > 0.8:
                task_type = TaskType.CODE
                topic = topics[min(day_offset - 1, len(topics) - 1)]
                description = f"Practice coding exercises for {topic}"
            else:
                task_type = TaskType.READ
                topic = topics[min(day_offset, len(topics) - 1)]
                description = f"Study {topic} concepts and examples"
        else:
            # Final days are usually coding or quiz
            if day_offset == module_data["duration_days"] - 1:
                task_type = TaskType.QUIZ
                description = f"Assessment: {module_data['title']}"
            else:
                task_type = TaskType.CODE
                description = f"Advanced practice: {module_data['title']}"
        
        # Calculate estimated time based on difficulty and task type
        base_minutes = {
            TaskType.READ: 45,
            TaskType.WATCH: 30,
            TaskType.CODE: 90,
            TaskType.QUIZ: 30
        }
        
        estimated_minutes = int(base_minutes[task_type] * (1 + difficulty * 0.2))
        
        return Task(
            module_id=module_id,
            day_offset=day_offset,
            task_type=task_type,
            description=description,
            estimated_minutes=estimated_minutes,
            completion_criteria=self._generate_completion_criteria(task_type, difficulty)
        )
    
    def _generate_completion_criteria(self, task_type: TaskType, difficulty: int) -> str:
        """Generate completion criteria based on task type and difficulty."""
        criteria_templates = {
            TaskType.READ: [
                "Read and understand the key concepts",
                "Complete the reading and take notes on main points",
                "Read material and summarize key takeaways"
            ],
            TaskType.WATCH: [
                "Watch the video and complete any exercises",
                "View content and practice along with examples",
                "Complete video tutorial and implement examples"
            ],
            TaskType.CODE: [
                "Complete all coding exercises with passing tests",
                "Implement the solution and ensure all test cases pass",
                "Write working code that meets all requirements and passes validation"
            ],
            TaskType.QUIZ: [
                "Score at least 70% on the assessment",
                "Pass the quiz with 80% or higher",
                "Complete assessment with satisfactory score"
            ]
        }
        
        templates = criteria_templates.get(task_type, ["Complete the task"])
        difficulty_index = min(difficulty - 1, len(templates) - 1)
        return templates[difficulty_index]
    
    def _analyze_performance_and_adapt(
        self, 
        plan: LearningPlan, 
        performance_data: Dict[str, Any], 
        trigger: str
    ) -> List[Dict[str, Any]]:
        """Analyze performance data and determine necessary adaptations."""
        adaptations = []
        
        # Extract performance metrics
        success_rate = performance_data.get("success_rate", 0.8)
        average_attempts = performance_data.get("average_attempts", 1.5)
        time_per_task = performance_data.get("time_per_task_minutes", 60)
        consecutive_failures = performance_data.get("consecutive_failures", 0)
        
        # Adaptation rules based on performance
        if consecutive_failures >= 2:
            adaptations.append({
                "type": "reduce_difficulty",
                "reason": "consecutive_failures",
                "adjustment": -1,
                "add_recap_tasks": True
            })
        
        if success_rate < 0.6:
            adaptations.append({
                "type": "slow_pacing",
                "reason": "low_success_rate",
                "pacing_factor": 0.8,
                "add_extra_practice": True
            })
        
        if success_rate > 0.9 and average_attempts < 1.2:
            adaptations.append({
                "type": "increase_difficulty",
                "reason": "high_performance",
                "adjustment": 1,
                "add_stretch_tasks": True
            })
        
        if time_per_task > 120:  # Taking too long
            adaptations.append({
                "type": "simplify_tasks",
                "reason": "excessive_time",
                "simplification_factor": 0.7
            })
        
        return adaptations
    
    async def _apply_adaptations(self, plan: LearningPlan, adaptations: List[Dict[str, Any]]) -> LearningPlan:
        """Apply the determined adaptations to the learning plan."""
        for adaptation in adaptations:
            adaptation_type = adaptation["type"]
            
            if adaptation_type == "reduce_difficulty":
                self._reduce_plan_difficulty(plan, adaptation["adjustment"])
                if adaptation.get("add_recap_tasks"):
                    self._add_recap_tasks(plan)
            
            elif adaptation_type == "increase_difficulty":
                self._increase_plan_difficulty(plan, adaptation["adjustment"])
                if adaptation.get("add_stretch_tasks"):
                    self._add_stretch_tasks(plan)
            
            elif adaptation_type == "slow_pacing":
                self._adjust_plan_pacing(plan, adaptation["pacing_factor"])
                if adaptation.get("add_extra_practice"):
                    self._add_extra_practice_tasks(plan)
            
            elif adaptation_type == "simplify_tasks":
                self._simplify_plan_tasks(plan, adaptation["simplification_factor"])
        
        # Save the adapted plan
        return await self.curriculum_repository.save_plan(plan)
    
    def _reduce_plan_difficulty(self, plan: LearningPlan, adjustment: int) -> None:
        """Reduce the difficulty of upcoming tasks in the plan."""
        for module in plan.modules:
            for task in module.tasks:
                if task.task_type == TaskType.CODE:
                    # Reduce estimated time and complexity
                    task.estimated_minutes = max(30, int(task.estimated_minutes * 0.8))
                    # Update completion criteria to be more lenient
                    task.completion_criteria = task.completion_criteria.replace("all test cases", "basic test cases")
    
    def _increase_plan_difficulty(self, plan: LearningPlan, adjustment: int) -> None:
        """Increase the difficulty of upcoming tasks in the plan."""
        for module in plan.modules:
            for task in module.tasks:
                if task.task_type == TaskType.CODE:
                    # Increase estimated time and add complexity
                    task.estimated_minutes = int(task.estimated_minutes * 1.2)
                    # Update completion criteria to be more demanding
                    if "basic" in task.completion_criteria:
                        task.completion_criteria = task.completion_criteria.replace("basic", "all")
    
    def _add_recap_tasks(self, plan: LearningPlan) -> None:
        """Add recap tasks to reinforce struggling concepts."""
        # Find the current module and add a recap task
        if plan.modules:
            current_module = plan.modules[0]  # Simplified - would need better current module detection
            recap_task = Task(
                module_id=current_module.id,
                day_offset=len(current_module.tasks),
                task_type=TaskType.CODE,
                description=f"Recap and practice: {current_module.title}",
                estimated_minutes=60,
                completion_criteria="Review and practice previous concepts with guided exercises"
            )
            current_module.add_task(recap_task)
    
    def _add_stretch_tasks(self, plan: LearningPlan) -> None:
        """Add stretch tasks for high-performing learners."""
        if plan.modules:
            current_module = plan.modules[0]  # Simplified
            stretch_task = Task(
                module_id=current_module.id,
                day_offset=len(current_module.tasks),
                task_type=TaskType.CODE,
                description=f"Advanced challenge: {current_module.title}",
                estimated_minutes=120,
                completion_criteria="Complete advanced exercises that extend beyond basic requirements"
            )
            current_module.add_task(stretch_task)
    
    def _adjust_plan_pacing(self, plan: LearningPlan, pacing_factor: float) -> None:
        """Adjust the pacing of the entire plan."""
        new_total_days = int(plan.total_days / pacing_factor)
        plan.total_days = new_total_days
        
        # Redistribute tasks across the new timeline
        for module in plan.modules:
            for task in module.tasks:
                task.estimated_minutes = int(task.estimated_minutes / pacing_factor)
    
    def _add_extra_practice_tasks(self, plan: LearningPlan) -> None:
        """Add extra practice tasks for struggling learners."""
        for module in plan.modules:
            # Add an extra practice task to each module
            practice_task = Task(
                module_id=module.id,
                day_offset=len(module.tasks),
                task_type=TaskType.CODE,
                description=f"Extra practice: {module.title}",
                estimated_minutes=75,
                completion_criteria="Complete additional practice exercises to reinforce learning"
            )
            module.add_task(practice_task)
    
    def _simplify_plan_tasks(self, plan: LearningPlan, simplification_factor: float) -> None:
        """Simplify tasks to reduce cognitive load."""
        for module in plan.modules:
            for task in module.tasks:
                # Reduce estimated time
                task.estimated_minutes = int(task.estimated_minutes * simplification_factor)
                
                # Simplify completion criteria
                if "all" in task.completion_criteria:
                    task.completion_criteria = task.completion_criteria.replace("all", "basic")
    
    def _find_next_topic(self, plan: LearningPlan, current_day: int) -> Optional[Dict[str, Any]]:
        """Find the next topic/task for the given day."""
        for module in plan.modules:
            for task in module.tasks:
                if task.day_offset == current_day:
                    return {
                        "module_title": module.title,
                        "task": task.to_dict(),
                        "module_progress": f"{task.day_offset + 1}/{len(module.tasks)}",
                        "overall_progress": f"{current_day + 1}/{plan.total_days}"
                    }
        
        return None
    
    def _calculate_progress_percentage(self, plan: LearningPlan, current_day: int) -> float:
        """Calculate progress percentage for the plan."""
        if plan.total_days == 0:
            return 0.0
        
        return min(100.0, (current_day / plan.total_days) * 100)
    
    def _estimate_topic_completion_time(self, topic: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate completion time for a topic."""
        task_data = topic.get("task", {})
        estimated_minutes = task_data.get("estimated_minutes", 60)
        
        return {
            "estimated_minutes": estimated_minutes,
            "estimated_hours": round(estimated_minutes / 60, 1),
            "suggested_session_breaks": max(1, estimated_minutes // 45)
        }
    
    def _generate_curriculum_summary(self, plan: LearningPlan) -> Dict[str, Any]:
        """Generate a summary of the curriculum."""
        total_tasks = len(plan.get_all_tasks())
        coding_tasks = len([task for task in plan.get_all_tasks() if task.task_type == TaskType.CODE])
        
        return {
            "total_modules": len(plan.modules),
            "total_tasks": total_tasks,
            "coding_tasks": coding_tasks,
            "theory_tasks": total_tasks - coding_tasks,
            "estimated_completion_weeks": math.ceil(plan.total_days / 7),
            "practice_percentage": round((coding_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        }
    
    def _generate_adaptation_summary(self, adaptations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of applied adaptations."""
        adaptation_types = [a["type"] for a in adaptations]
        
        return {
            "total_adaptations": len(adaptations),
            "adaptation_types": adaptation_types,
            "reasons": [a["reason"] for a in adaptations],
            "impact": "The curriculum has been adjusted to better match your learning pace and performance."
        }
    
    def _calculate_detailed_status(self, plan: LearningPlan) -> Dict[str, Any]:
        """Calculate detailed status of the learning plan."""
        total_tasks = len(plan.get_all_tasks())
        
        # This would typically come from progress tracking
        # For now, using placeholder values
        completed_tasks = 0  # Would be calculated from actual progress
        
        return {
            "completion_percentage": (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "remaining_tasks": total_tasks - completed_tasks,
            "estimated_remaining_days": plan.total_days - completed_tasks,  # Simplified calculation
            "current_module": plan.modules[0].title if plan.modules else None
        }
    
    def _generate_status_recommendations(self, status: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on current status."""
        recommendations = []
        
        completion_percentage = status.get("completion_percentage", 0)
        
        if completion_percentage < 10:
            recommendations.append("Get started with your first module to build momentum")
        elif completion_percentage < 50:
            recommendations.append("You're making good progress! Keep up the consistent practice")
        elif completion_percentage < 80:
            recommendations.append("You're in the home stretch! Focus on completing the remaining modules")
        else:
            recommendations.append("Almost done! Consider planning your next learning goals")
        
        return recommendations
    
    def _generate_spaced_repetition_schedule(
        self, 
        completed_topics: List[Dict[str, Any]], 
        current_day: int
    ) -> List[Dict[str, Any]]:
        """Generate spaced repetition schedule for completed topics."""
        schedule = []
        
        for topic in completed_topics:
            completion_day = topic.get("completion_day", current_day)
            topic_id = topic.get("topic_id")
            
            for i, interval in enumerate(self._spaced_repetition_intervals):
                review_day = completion_day + interval
                
                schedule.append({
                    "topic_id": topic_id,
                    "topic_title": topic.get("title", "Unknown Topic"),
                    "review_day": review_day,
                    "review_date": (datetime.now() + timedelta(days=review_day - current_day)).isoformat(),
                    "repetition_number": i + 1,
                    "estimated_minutes": 15 + (i * 5)  # Increasing time for later repetitions
                })
        
        # Sort by review day
        return sorted(schedule, key=lambda x: x["review_day"])
    
    def _generate_mini_project(
        self, 
        project_type: str, 
        topics_covered: List[str], 
        difficulty_level: int
    ) -> Dict[str, Any]:
        """Generate a mini-project based on parameters."""
        # Get project template based on topics
        domain = self._determine_primary_domain(topics_covered)
        project_templates = self._project_templates.get(domain, self._project_templates["javascript"])
        
        # Select appropriate template based on difficulty
        suitable_templates = [p for p in project_templates if p["difficulty"] <= difficulty_level]
        
        if not suitable_templates:
            suitable_templates = project_templates
        
        # Select the most relevant template
        selected_template = suitable_templates[0]  # Simplified selection
        
        # Customize the project
        customized_project = selected_template.copy()
        customized_project["topics_integration"] = topics_covered
        customized_project["custom_requirements"] = self._generate_custom_requirements(
            topics_covered, difficulty_level
        )
        
        return customized_project
    
    def _generate_custom_requirements(self, topics: List[str], difficulty: int) -> List[str]:
        """Generate custom requirements based on topics and difficulty."""
        base_requirements = [
            "Implement clean, readable code",
            "Include proper error handling",
            "Add comments explaining key functionality"
        ]
        
        if difficulty >= 2:
            base_requirements.extend([
                "Include unit tests for core functionality",
                "Implement responsive design principles"
            ])
        
        if difficulty >= 3:
            base_requirements.extend([
                "Add advanced features beyond basic requirements",
                "Optimize for performance",
                "Include comprehensive documentation"
            ])
        
        return base_requirements
    
    def _create_project_module(self, plan_id: str, project_data: Dict[str, Any]) -> Module:
        """Create a module for a mini-project."""
        module = Module(
            plan_id=plan_id,
            title=f"Project: {project_data['title']}",
            order_index=999,  # Projects typically come at the end
            summary=project_data["description"]
        )
        
        # Create project tasks
        project_phases = [
            "Planning and Setup",
            "Core Implementation", 
            "Feature Enhancement",
            "Testing and Refinement",
            "Final Review and Documentation"
        ]
        
        estimated_hours = project_data.get("estimated_hours", 10)
        days_per_phase = max(1, estimated_hours // len(project_phases))
        
        for i, phase in enumerate(project_phases):
            task = Task(
                module_id=module.id,
                day_offset=i,
                task_type=TaskType.CODE,
                description=f"{phase}: {project_data['title']}",
                estimated_minutes=days_per_phase * 60,
                completion_criteria=f"Complete {phase.lower()} phase of the project"
            )
            module.add_task(task)
        
        return module
    
    def _estimate_project_timeline(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate timeline for project completion."""
        estimated_hours = project_data.get("estimated_hours", 10)
        
        return {
            "estimated_hours": estimated_hours,
            "estimated_days": math.ceil(estimated_hours / 2),  # Assuming 2 hours per day
            "phases": 5,
            "hours_per_phase": estimated_hours / 5
        }
    
    def _apply_pacing_adjustments(
        self, 
        plan: LearningPlan, 
        pacing_factor: float, 
        reason: str
    ) -> LearningPlan:
        """Apply pacing adjustments to the learning plan."""
        # Adjust total days
        plan.total_days = int(plan.total_days / pacing_factor)
        
        # Adjust individual task durations
        for module in plan.modules:
            for task in module.tasks:
                task.estimated_minutes = int(task.estimated_minutes / pacing_factor)
        
        return plan
    
    def _summarize_pacing_changes(self, pacing_factor: float, reason: str) -> Dict[str, Any]:
        """Summarize the pacing changes made."""
        if pacing_factor < 1.0:
            change_type = "slowed_down"
            impact = f"Pacing reduced by {int((1 - pacing_factor) * 100)}%"
        elif pacing_factor > 1.0:
            change_type = "accelerated"
            impact = f"Pacing increased by {int((pacing_factor - 1) * 100)}%"
        else:
            change_type = "unchanged"
            impact = "No pacing changes applied"
        
        return {
            "change_type": change_type,
            "pacing_factor": pacing_factor,
            "reason": reason,
            "impact": impact
        }
    
    def _analyze_difficulty_progression(self, curriculum_structure: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the difficulty progression in the curriculum."""
        modules = curriculum_structure.get("modules", [])
        
        if not modules:
            return {"progression": "none", "difficulty_curve": []}
        
        difficulty_curve = [module.get("difficulty", 1) for module in modules]
        
        # Calculate progression metrics
        avg_difficulty = sum(difficulty_curve) / len(difficulty_curve)
        max_jump = max(
            abs(difficulty_curve[i] - difficulty_curve[i-1]) 
            for i in range(1, len(difficulty_curve))
        ) if len(difficulty_curve) > 1 else 0
        
        progression_type = "gradual"
        if max_jump > 2:
            progression_type = "steep"
        elif max_jump < 0.5:
            progression_type = "flat"
        
        return {
            "progression": progression_type,
            "difficulty_curve": difficulty_curve,
            "average_difficulty": round(avg_difficulty, 1),
            "max_difficulty_jump": max_jump,
            "total_modules": len(modules)
        }
    
    async def _apply_curriculum_updates(
        self, 
        plan: LearningPlan, 
        updates: Dict[str, Any]
    ) -> LearningPlan:
        """Apply updates to an existing curriculum."""
        if "title" in updates:
            plan.title = updates["title"]
        
        if "goal_description" in updates:
            plan.goal_description = updates["goal_description"]
        
        if "add_modules" in updates:
            for module_data in updates["add_modules"]:
                # Set order_index to avoid conflicts
                module_data["order_index"] = len(plan.modules)
                module = self._create_module_from_template(plan.id, module_data)
                plan.add_module(module)
        
        if "remove_modules" in updates:
            for module_id in updates["remove_modules"]:
                plan.remove_module(module_id)
        
        # Save updated plan
        return await self.curriculum_repository.save_plan(plan)
    
    def _summarize_curriculum_changes(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize the changes made to the curriculum."""
        changes = []
        
        if "title" in updates:
            changes.append("Updated curriculum title")
        
        if "add_modules" in updates:
            changes.append(f"Added {len(updates['add_modules'])} new modules")
        
        if "remove_modules" in updates:
            changes.append(f"Removed {len(updates['remove_modules'])} modules")
        
        return {
            "changes_made": changes,
            "total_updates": len(updates),
            "impact": "Curriculum has been updated to better align with your learning goals"
        }
    
    async def _handle_timeout_fallback(
        self, 
        context: LearningContext, 
        payload: Dict[str, Any]
    ) -> Optional[AgentResult]:
        """Provide fallback behavior for timeout scenarios."""
        intent = payload.get("intent")
        
        if intent == "create_learning_path":
            # Return a basic learning path
            basic_plan = {
                "title": "Basic Learning Path",
                "modules": [
                    {
                        "title": "Getting Started",
                        "duration_days": 7,
                        "difficulty": 1,
                        "topics": ["basics"]
                    }
                ],
                "total_days": 7,
                "fallback": True
            }
            
            return AgentResult.success_result(
                data={"learning_plan": basic_plan, "fallback": True}
            )
        
        elif intent == "request_next_topic":
            # Return a generic next topic
            return AgentResult.success_result(
                data={
                    "next_topic": {
                        "module_title": "Continue Learning",
                        "task": {
                            "description": "Continue with your current studies",
                            "estimated_minutes": 60
                        }
                    },
                    "fallback": True
                }
            )
        
        return None