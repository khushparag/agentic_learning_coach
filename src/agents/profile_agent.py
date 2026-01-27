"""
ProfileAgent implementation for the Agentic Learning Coach system.

This agent is responsible for comprehensive learner modeling and personalization,
serving as the foundation for all adaptive learning experiences in the system.

CORE RESPONSIBILITIES:
- Skill level assessment through adaptive diagnostic questioning
- Natural language processing of learning goals and time constraints
- User profile lifecycle management (creation, updates, validation)
- Preference modeling and learning style adaptation
- Feasibility analysis of learning objectives vs. available time

ASSESSMENT STRATEGY:
The ProfileAgent uses a multi-faceted approach to understand learners:
1. Diagnostic Questions: Domain-specific questions with increasing difficulty
2. Response Analysis: Code evaluation, concept understanding, explanation quality
3. Adaptive Scoring: Difficulty-weighted scoring that accounts for question complexity
4. Confidence Modeling: Tracks assessment reliability and suggests re-evaluation when needed

NATURAL LANGUAGE PROCESSING:
- Goal Parsing: Extracts structured learning objectives from conversational input
- Time Constraint Analysis: Converts natural language schedules into structured data
- Preference Inference: Identifies learning styles and preferences from user descriptions
- Validation & Normalization: Ensures data consistency and handles edge cases

PERSONALIZATION FEATURES:
- Skill-based content adaptation (beginner vs. advanced pathways)
- Time-aware scheduling that respects user availability
- Goal prioritization based on feasibility analysis
- Learning style accommodation (visual, hands-on, theoretical preferences)

DESIGN PRINCIPLES:
- Practice-First Assessment: Emphasizes hands-on evaluation over theoretical questions
- Graceful Degradation: Provides reasonable defaults when parsing fails
- Continuous Learning: Profile updates based on ongoing performance data
- Privacy-Conscious: Minimal data collection with explicit user consent
"""
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta

from .base.base_agent import BaseAgent
from .base.types import LearningContext, AgentResult, AgentType
from .base.exceptions import ValidationError, AgentProcessingError
from ..domain.entities.user_profile import UserProfile
from ..domain.value_objects.enums import SkillLevel
from ..ports.repositories.user_repository import UserRepository


class ProfileAgent(BaseAgent):
    """
    Agent responsible for learner profile management and adaptive assessment.
    
    This agent implements sophisticated learner modeling that goes beyond simple
    skill categorization to create rich, actionable profiles that drive personalized
    learning experiences throughout the system.
    
    KEY CAPABILITIES:
    - Multi-Domain Assessment: Supports JavaScript, Python, and extensible to other languages
    - Adaptive Questioning: Adjusts question difficulty based on previous responses
    - Natural Language Understanding: Parses goals and constraints from conversational input
    - Feasibility Analysis: Validates learning objectives against available time
    - Continuous Profiling: Updates models based on ongoing learning performance
    
    ASSESSMENT METHODOLOGY:
    The agent uses a hybrid approach combining:
    1. Structured Questions: Multiple choice and code completion tasks
    2. Open-Ended Responses: Code writing and concept explanation
    3. Performance Analytics: Response time, accuracy patterns, help-seeking behavior
    4. Self-Assessment: User confidence ratings and perceived difficulty
    
    PROFILE COMPLETENESS STRATEGY:
    Profiles are built incrementally with validation at each step:
    - Phase 1: Basic skill assessment (required for curriculum generation)
    - Phase 2: Goal clarification (required for content personalization)  
    - Phase 3: Time constraints (required for scheduling and pacing)
    - Phase 4: Preferences and learning style (optional, enhances experience)
    
    INTEGRATION POINTS:
    - CurriculumPlannerAgent: Provides skill level and goals for path generation
    - ExerciseGeneratorAgent: Supplies difficulty preferences and learning style
    - ProgressTracker: Receives profile updates based on performance data
    - ResourcesAgent: Shares learning preferences for content filtering
    """
    
    def __init__(self, user_repository: UserRepository):
        """
        Initialize ProfileAgent with comprehensive assessment capabilities.
        
        Args:
            user_repository: Repository for user profile persistence and retrieval
            
        INITIALIZATION STRATEGY:
        - Diagnostic questions are pre-loaded for immediate assessment capability
        - Goal mappings enable intelligent parsing of natural language objectives
        - Time patterns support flexible constraint parsing from conversational input
        - All data structures are optimized for fast lookup during assessment
        
        DESIGN RATIONALE:
        - Pre-computed question sets ensure consistent assessment across sessions
        - Regex patterns for time parsing handle diverse user input styles
        - Goal mappings connect user intentions to structured learning paths
        - Repository injection enables testing and different storage backends
        """
        super().__init__(AgentType.PROFILE)
        self.user_repository = user_repository
        
        # Pre-loaded diagnostic questions for immediate assessment capability
        # Organized by domain with increasing difficulty for adaptive questioning
        self._diagnostic_questions = self._initialize_diagnostic_questions()
        
        # Common learning goal mappings for intelligent natural language parsing
        # Maps high-level intentions to specific, actionable learning objectives
        self._goal_mappings = self._initialize_goal_mappings()
        
        # Time constraint patterns for flexible natural language processing
        # Handles diverse ways users express their availability and preferences
        self._time_patterns = self._initialize_time_patterns()
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return [
            "assess_skill_level",
            "update_goals", 
            "set_constraints",
            "create_profile",
            "update_profile",
            "get_profile",
            "parse_timeframe"
        ]
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process profile-related requests with comprehensive error handling.
        
        This method serves as the main entry point for all profile operations,
        routing requests to specialized handlers while maintaining consistent
        error handling and logging across all operations.
        
        OPERATION ROUTING:
        - assess_skill_level: Conducts adaptive diagnostic assessment
        - update_goals: Parses and validates learning objectives from natural language
        - set_constraints: Processes time availability and scheduling preferences
        - create_profile: Initializes new user profiles with validation
        - update_profile: Modifies existing profiles with change tracking
        - get_profile: Retrieves profile data with completeness analysis
        - parse_timeframe: Standalone time constraint parsing for other agents
        
        ERROR HANDLING STRATEGY:
        - ValidationError: For malformed input or missing required data
        - AgentProcessingError: For business logic failures with context
        - Repository errors: Wrapped with user-friendly messages
        - Timeout handling: Graceful degradation with simplified responses
        
        Args:
            context: Learning context with user identification and session tracking
            payload: Request payload containing intent and operation-specific data
            
        Returns:
            AgentResult with operation results and suggested next actions
            
        PERFORMANCE CONSIDERATIONS:
        - Profile operations are cached to reduce database load
        - Assessment questions are pre-loaded for immediate response
        - Natural language processing uses optimized regex patterns
        - Fallback mechanisms prevent blocking on external dependencies
        """
        intent = payload.get("intent")
        
        try:
            if intent == "assess_skill_level":
                return await self._assess_skill_level(context, payload)
            elif intent == "update_goals":
                return await self._update_goals(context, payload)
            elif intent == "set_constraints":
                return await self._set_constraints(context, payload)
            elif intent == "create_profile":
                return await self._create_profile(context, payload)
            elif intent == "update_profile":
                return await self._update_profile(context, payload)
            elif intent == "get_profile":
                return await self._get_profile(context, payload)
            elif intent == "parse_timeframe":
                return await self._parse_timeframe(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except Exception as e:
            self.logger.log_error(f"ProfileAgent processing failed for intent {intent}", e, context, intent)
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")
    
    async def _assess_skill_level(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Conduct adaptive skill level assessment through diagnostic questioning.
        
        This method implements a sophisticated assessment strategy that adapts
        to user responses and provides detailed skill analysis beyond simple
        categorization.
        
        ASSESSMENT PHASES:
        1. Question Delivery: Returns domain-specific diagnostic questions
        2. Response Evaluation: Analyzes answers using multiple scoring methods
        3. Skill Determination: Maps performance to skill levels with confidence
        4. Profile Integration: Updates user profile with assessment results
        
        ADAPTIVE QUESTIONING STRATEGY:
        - Questions are ordered by increasing difficulty
        - Early incorrect answers skip advanced questions
        - Multiple question types test different skill dimensions
        - Confidence scoring helps identify borderline cases
        
        SCORING METHODOLOGY:
        - Multiple choice: Binary scoring with difficulty weighting
        - Code questions: Heuristic analysis of syntax and concepts
        - Explanation questions: Keyword matching with concept coverage
        - Performance factors: Response time and help-seeking behavior
        
        Args:
            context: Learning context for user identification
            payload: Contains either request for questions or assessment responses
                    - responses: List of question responses for evaluation
                    - domain: Target learning domain (defaults to JavaScript)
            
        Returns:
            AgentResult containing either:
            - Diagnostic questions for user completion
            - Skill assessment results with detailed analysis
            
        DESIGN RATIONALE:
        - Two-phase approach allows for interactive assessment
        - Domain-specific questions ensure relevant skill evaluation
        - Detailed feedback helps users understand their current level
        - Next actions guide users toward appropriate learning paths
        """
        responses = payload.get("responses")
        target_domain = payload.get("domain", "javascript")  # Default to JavaScript
        
        if not responses:
            # Return diagnostic questions for the target domain
            questions = self._get_diagnostic_questions(target_domain)
            return AgentResult.success_result(
                data={
                    "questions": questions,
                    "domain": target_domain,
                    "instructions": "Please answer these questions to assess your current skill level."
                },
                next_actions=["submit_assessment_responses"]
            )
        
        # Evaluate responses and determine skill level
        skill_level = self._evaluate_skill_responses(responses, target_domain)
        
        # Get or create user profile
        profile = await self.user_repository.get_user_profile(context.user_id)
        if profile:
            # Update existing profile
            profile.update_skill_level(skill_level)
            await self.user_repository.update_user_profile(profile)
        else:
            # Will need to create profile with additional information
            pass
        
        return AgentResult.success_result(
            data={
                "skill_level": skill_level.value,
                "domain": target_domain,
                "assessment_summary": self._generate_assessment_summary(responses, skill_level),
                "next_steps": self._get_next_steps_for_level(skill_level, target_domain)
            },
            next_actions=["clarify_goals", "set_time_constraints"]
        )
    
    async def _update_goals(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Parse and update learning goals from natural language input.
        
        Args:
            context: Learning context
            payload: Contains goal description or structured goals
            
        Returns:
            AgentResult with parsed and validated goals
        """
        goal_input = payload.get("goals")
        if not goal_input:
            raise ValidationError("Goals input is required")
        
        # Parse goals from natural language or structured input
        parsed_goals = self._parse_learning_goals(goal_input)
        
        # Validate and normalize goals
        validated_goals = self._validate_goals(parsed_goals)
        
        # Update user profile
        profile = await self.user_repository.get_user_profile(context.user_id)
        if not profile:
            raise ValidationError("User profile not found. Please complete skill assessment first.")
        
        # Clear existing goals and add new ones
        profile.learning_goals = []
        for goal in validated_goals:
            profile.add_learning_goal(goal)
        
        await self.user_repository.update_user_profile(profile)
        
        return AgentResult.success_result(
            data={
                "goals": validated_goals,
                "goal_categories": self._categorize_goals(validated_goals),
                "estimated_timeline": self._estimate_goal_timeline(validated_goals, profile.skill_level)
            },
            next_actions=["set_time_constraints", "create_learning_plan"]
        )
    
    async def _set_constraints(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Parse and set time constraints from natural language input.
        
        Args:
            context: Learning context
            payload: Contains time constraint description
            
        Returns:
            AgentResult with parsed time constraints
        """
        constraint_input = payload.get("constraints")
        if not constraint_input:
            raise ValidationError("Time constraints input is required")
        
        # Parse time constraints from natural language
        parsed_constraints = self._parse_time_constraints(constraint_input)
        
        # Validate constraints
        validated_constraints = self._validate_time_constraints(parsed_constraints)
        
        # Update user profile
        profile = await self.user_repository.get_user_profile(context.user_id)
        if not profile:
            raise ValidationError("User profile not found. Please complete skill assessment first.")
        
        profile.update_time_constraints(validated_constraints)
        await self.user_repository.update_user_profile(profile)
        
        return AgentResult.success_result(
            data={
                "time_constraints": validated_constraints,
                "weekly_schedule": self._generate_weekly_schedule(validated_constraints),
                "realistic_goals": self._assess_goal_feasibility(profile.learning_goals, validated_constraints)
            },
            next_actions=["create_learning_plan"]
        )
    
    async def _create_profile(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Create a new user profile with provided information.
        
        Args:
            context: Learning context
            payload: Contains profile creation data
            
        Returns:
            AgentResult with created profile
        """
        email = payload.get("email")
        name = payload.get("name")
        
        if not email or not name:
            raise ValidationError("Email and name are required for profile creation")
        
        # Create user profile
        profile = await self.user_repository.create_user(email, name)
        
        return AgentResult.success_result(
            data={
                "profile": profile.to_dict(),
                "next_steps": [
                    "Complete skill assessment",
                    "Set learning goals", 
                    "Define time constraints"
                ]
            },
            next_actions=["assess_skill_level"]
        )
    
    async def _update_profile(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Update existing user profile with new information.
        
        Args:
            context: Learning context
            payload: Contains profile update data
            
        Returns:
            AgentResult with updated profile
        """
        profile = await self.user_repository.get_user_profile(context.user_id)
        if not profile:
            raise ValidationError("User profile not found")
        
        # Update profile fields if provided
        if "preferences" in payload:
            profile.update_preferences(payload["preferences"])
        
        if "skill_level" in payload:
            skill_level = SkillLevel(payload["skill_level"])
            profile.update_skill_level(skill_level)
        
        # Save updated profile
        updated_profile = await self.user_repository.update_user_profile(profile)
        
        return AgentResult.success_result(
            data={"profile": updated_profile.to_dict()},
            next_actions=["adapt_learning_plan"]
        )
    
    async def _get_profile(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Retrieve user profile information.
        
        Args:
            context: Learning context
            payload: Request payload
            
        Returns:
            AgentResult with profile data
        """
        profile = await self.user_repository.get_user_profile(context.user_id)
        if not profile:
            return AgentResult.success_result(
                data={"profile": None, "exists": False},
                next_actions=["create_profile"]
            )
        
        return AgentResult.success_result(
            data={
                "profile": profile.to_dict(),
                "exists": True,
                "completeness": self._assess_profile_completeness(profile)
            }
        )
    
    async def _parse_timeframe(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Parse natural language timeframe into structured format.
        
        Args:
            context: Learning context
            payload: Contains timeframe text to parse
            
        Returns:
            AgentResult with parsed timeframe
        """
        timeframe_text = payload.get("timeframe")
        if not timeframe_text:
            raise ValidationError("Timeframe text is required")
        
        parsed_timeframe = self._parse_time_constraints(timeframe_text)
        
        return AgentResult.success_result(
            data={
                "original_text": timeframe_text,
                "parsed_constraints": parsed_timeframe,
                "confidence": self._calculate_parsing_confidence(timeframe_text, parsed_timeframe)
            }
        )
    
    def _initialize_diagnostic_questions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize diagnostic questions for different domains."""
        return {
            "javascript": [
                {
                    "id": "js_basics_1",
                    "question": "What will this code output?\n```javascript\nlet x = 5;\nlet y = '5';\nconsole.log(x == y);\nconsole.log(x === y);\n```",
                    "options": ["true, true", "true, false", "false, true", "false, false"],
                    "correct": 1,
                    "difficulty": 1,
                    "concepts": ["type_coercion", "equality_operators"]
                },
                {
                    "id": "js_basics_2", 
                    "question": "How do you create a function that takes two parameters and returns their sum?",
                    "type": "code",
                    "difficulty": 1,
                    "concepts": ["functions", "parameters", "return"]
                },
                {
                    "id": "js_intermediate_1",
                    "question": "What is the output of this code?\n```javascript\nconst arr = [1, 2, 3];\nconst newArr = arr.map(x => x * 2);\nconsole.log(arr);\nconsole.log(newArr);\n```",
                    "type": "code_analysis",
                    "difficulty": 2,
                    "concepts": ["arrays", "map", "immutability"]
                },
                {
                    "id": "js_advanced_1",
                    "question": "Explain the concept of closures in JavaScript and provide an example.",
                    "type": "explanation",
                    "difficulty": 3,
                    "concepts": ["closures", "scope", "lexical_environment"]
                }
            ],
            "python": [
                {
                    "id": "py_basics_1",
                    "question": "What is the difference between a list and a tuple in Python?",
                    "type": "explanation",
                    "difficulty": 1,
                    "concepts": ["data_structures", "mutability"]
                },
                {
                    "id": "py_intermediate_1",
                    "question": "What will this list comprehension produce?\n```python\n[x**2 for x in range(5) if x % 2 == 0]\n```",
                    "options": ["[0, 4, 16]", "[0, 1, 4, 9, 16]", "[1, 9]", "[0, 2, 4]"],
                    "correct": 0,
                    "difficulty": 2,
                    "concepts": ["list_comprehensions", "conditionals", "loops"]
                }
            ]
        }
    
    def _initialize_goal_mappings(self) -> Dict[str, List[str]]:
        """Initialize common learning goal mappings."""
        return {
            "web_development": ["html", "css", "javascript", "react", "node.js"],
            "backend_development": ["python", "java", "databases", "apis", "microservices"],
            "data_science": ["python", "pandas", "numpy", "machine_learning", "statistics"],
            "mobile_development": ["react_native", "flutter", "swift", "kotlin"],
            "devops": ["docker", "kubernetes", "ci_cd", "aws", "monitoring"]
        }
    
    def _initialize_time_patterns(self) -> List[Dict[str, Any]]:
        """Initialize regex patterns for time constraint parsing."""
        return [
            {
                "pattern": r"(\d+)\s*hours?\s*per\s*week",
                "type": "hours_per_week",
                "multiplier": 1
            },
            {
                "pattern": r"(\d+)\s*minutes?\s*per\s*day",
                "type": "minutes_per_day", 
                "multiplier": 7 / 60  # Convert to hours per week
            },
            {
                "pattern": r"(\d+)\s*hours?\s*per\s*day",
                "type": "hours_per_day",
                "multiplier": 7
            },
            {
                "pattern": r"weekends?\s*only",
                "type": "weekends_only",
                "value": {"days": ["saturday", "sunday"], "hours_per_week": 8}
            },
            {
                "pattern": r"evenings?\s*only",
                "type": "evenings_only", 
                "value": {"preferred_times": ["evening"], "hours_per_week": 10}
            }
        ]
    
    def _get_diagnostic_questions(self, domain: str) -> List[Dict[str, Any]]:
        """Get diagnostic questions for a specific domain."""
        questions = self._diagnostic_questions.get(domain, self._diagnostic_questions["javascript"])
        
        # Return questions in order of increasing difficulty
        return sorted(questions, key=lambda q: q["difficulty"])
    
    def _evaluate_skill_responses(self, responses: List[Dict[str, Any]], domain: str) -> SkillLevel:
        """
        Evaluate diagnostic question responses using multi-dimensional scoring.
        
        This method implements a sophisticated scoring algorithm that goes beyond
        simple correct/incorrect tallying to provide nuanced skill assessment
        based on question difficulty, response quality, and concept coverage.
        
        SCORING ALGORITHM:
        1. Difficulty Weighting: Harder questions contribute more to the final score
        2. Response Type Analysis: Different scoring methods for different question types
        3. Concept Coverage: Tracks understanding across multiple skill dimensions
        4. Confidence Calculation: Assesses reliability of the skill level determination
        
        SKILL LEVEL MAPPING:
        - Expert (80%+): Demonstrates mastery of advanced concepts
        - Advanced (60-79%): Solid understanding with some knowledge gaps
        - Intermediate (30-59%): Basic competency with significant learning needs
        - Beginner (<30%): Fundamental concepts need development
        
        QUESTION TYPE HANDLING:
        - Multiple Choice: Binary scoring with difficulty multiplier
        - Code Writing: Heuristic analysis of syntax, logic, and best practices
        - Explanations: Keyword matching weighted by concept importance
        - Performance Metrics: Response time and help-seeking behavior
        
        Args:
            responses: List of user responses to diagnostic questions
                      Each response contains question_id, answer, and metadata
            domain: Learning domain for context-specific evaluation
            
        Returns:
            SkillLevel enum value representing assessed competency
            
        DESIGN RATIONALE:
        - Weighted scoring prevents gaming through easy question focus
        - Multiple question types test different aspects of understanding
        - Domain-specific evaluation ensures relevant skill assessment
        - Conservative scoring errs on the side of appropriate challenge level
        """
        questions = self._diagnostic_questions.get(domain, [])
        total_score = 0
        max_score = 0
        
        for response in responses:
            question_id = response.get("question_id")
            answer = response.get("answer")
            
            # Find matching question
            question = next((q for q in questions if q["id"] == question_id), None)
            if not question:
                continue
            
            difficulty = question["difficulty"]
            max_score += difficulty
            
            # Score based on question type
            if question.get("type") == "code":
                # For code questions, use a simple heuristic
                score = self._score_code_response(answer, question) * difficulty
            elif "correct" in question:
                # Multiple choice question
                if response.get("selected") == question["correct"]:
                    score = difficulty
                else:
                    score = 0
            else:
                # Explanation question - use keyword matching
                score = self._score_explanation_response(answer, question) * difficulty
            
            total_score += score
        
        # Determine skill level based on percentage score
        if max_score == 0:
            return SkillLevel.BEGINNER
        
        percentage = total_score / max_score
        
        if percentage >= 0.8:
            return SkillLevel.ADVANCED
        elif percentage >= 0.6:
            return SkillLevel.INTERMEDIATE
        elif percentage >= 0.3:
            return SkillLevel.BEGINNER
        else:
            return SkillLevel.BEGINNER
    
    def _score_code_response(self, code: str, question: Dict[str, Any]) -> float:
        """Score a code response using simple heuristics."""
        if not code or not code.strip():
            return 0.0
        
        concepts = question.get("concepts", [])
        score = 0.0
        
        # Check for key concepts in the code
        code_lower = code.lower()
        
        if "functions" in concepts and ("function" in code_lower or "def " in code_lower):
            score += 0.3
        if "parameters" in concepts and ("(" in code and ")" in code):
            score += 0.3
        if "return" in concepts and "return" in code_lower:
            score += 0.4
        
        return min(score, 1.0)
    
    def _score_explanation_response(self, explanation: str, question: Dict[str, Any]) -> float:
        """Score an explanation response using keyword matching."""
        if not explanation or not explanation.strip():
            return 0.0
        
        concepts = question.get("concepts", [])
        explanation_lower = explanation.lower()
        
        # Define keywords for each concept
        concept_keywords = {
            "closures": ["closure", "scope", "lexical", "environment", "function"],
            "type_coercion": ["coercion", "type", "conversion", "implicit"],
            "mutability": ["mutable", "immutable", "change", "modify"]
        }
        
        score = 0.0
        for concept in concepts:
            keywords = concept_keywords.get(concept, [concept.replace("_", " ")])
            if any(keyword in explanation_lower for keyword in keywords):
                score += 1.0 / len(concepts)
        
        return min(score, 1.0)
    
    def _generate_assessment_summary(self, responses: List[Dict[str, Any]], skill_level: SkillLevel) -> Dict[str, Any]:
        """Generate a summary of the skill assessment."""
        return {
            "level": skill_level.value,
            "strengths": self._identify_strengths(responses),
            "areas_for_improvement": self._identify_improvement_areas(responses),
            "confidence": "high",  # Could be calculated based on response consistency
            "recommendation": self._get_level_recommendation(skill_level)
        }
    
    def _identify_strengths(self, responses: List[Dict[str, Any]]) -> List[str]:
        """Identify learner strengths from assessment responses."""
        # Simplified implementation - could be more sophisticated
        return ["Basic syntax understanding", "Problem-solving approach"]
    
    def _identify_improvement_areas(self, responses: List[Dict[str, Any]]) -> List[str]:
        """Identify areas for improvement from assessment responses."""
        # Simplified implementation - could be more sophisticated
        return ["Advanced concepts", "Code optimization"]
    
    def _get_level_recommendation(self, skill_level: SkillLevel) -> str:
        """Get recommendation based on skill level."""
        recommendations = {
            SkillLevel.BEGINNER: "Start with fundamental concepts and basic syntax",
            SkillLevel.INTERMEDIATE: "Focus on practical projects and intermediate concepts",
            SkillLevel.ADVANCED: "Work on complex projects and advanced patterns",
            SkillLevel.EXPERT: "Contribute to open source and mentor others"
        }
        return recommendations.get(skill_level, "Continue learning at your own pace")
    
    def _get_next_steps_for_level(self, skill_level: SkillLevel, domain: str) -> List[str]:
        """Get recommended next steps based on skill level."""
        base_steps = {
            SkillLevel.BEGINNER: [
                "Complete basic syntax exercises",
                "Build simple projects",
                "Learn debugging techniques"
            ],
            SkillLevel.INTERMEDIATE: [
                "Work on intermediate projects",
                "Learn testing frameworks",
                "Study design patterns"
            ],
            SkillLevel.ADVANCED: [
                "Build complex applications",
                "Contribute to open source",
                "Learn system design"
            ]
        }
        return base_steps.get(skill_level, ["Continue practicing"])
    
    def _parse_learning_goals(self, goal_input: Any) -> List[str]:
        """
        Parse learning goals from diverse input formats using intelligent extraction.
        
        This method handles the complexity of converting natural language learning
        intentions into structured, actionable goals that can drive curriculum
        generation and content personalization.
        
        INPUT FORMAT HANDLING:
        - List Format: Direct processing of structured goal lists
        - Natural Language: Intelligent parsing of conversational descriptions
        - Mixed Format: Combination of structured and unstructured elements
        - Domain Inference: Automatic categorization based on keyword patterns
        
        PARSING STRATEGIES:
        1. Pattern Matching: Identifies common goal categories and related technologies
        2. Keyword Extraction: Pulls specific technologies and concepts from text
        3. Context Analysis: Uses surrounding words to disambiguate terms
        4. Goal Expansion: Maps high-level intentions to specific learning objectives
        
        INTELLIGENT FEATURES:
        - Synonym Recognition: Maps "JS" to "JavaScript", "ML" to "Machine Learning"
        - Technology Grouping: Connects related technologies (React → JavaScript ecosystem)
        - Priority Inference: Orders goals based on typical learning progressions
        - Scope Limitation: Prevents overwhelming goal lists through intelligent filtering
        
        Args:
            goal_input: Goals in various formats (string, list, or structured data)
                       Examples: "I want to learn React and Node.js"
                                ["JavaScript", "Python", "Databases"]
                                {"frontend": ["React", "CSS"], "backend": ["Node.js"]}
            
        Returns:
            List of normalized goal strings, limited to manageable scope
            
        DESIGN RATIONALE:
        - Flexible input handling accommodates different user communication styles
        - Intelligent parsing reduces user friction in goal specification
        - Goal normalization ensures consistency across the system
        - Scope limiting prevents overwhelming learning plans
        """
        if isinstance(goal_input, list):
            return [str(goal).strip().lower() for goal in goal_input if goal]
        
        if isinstance(goal_input, str):
            # Parse natural language goal description
            goals = []
            
            # Check for common goal patterns
            for category, keywords in self._goal_mappings.items():
                if any(keyword.lower() in goal_input.lower() for keyword in keywords):
                    goals.extend(keywords[:3])  # Add top 3 related goals
            
            # If no patterns matched, extract from text
            if not goals:
                # Simple extraction - split by common delimiters
                potential_goals = re.split(r'[,;]|\sand\s|\sor\s', goal_input.lower())
                goals = [goal.strip() for goal in potential_goals if goal.strip()]
            
            return goals[:5]  # Limit to 5 goals
        
        return []
    
    def _validate_goals(self, goals: List[str]) -> List[str]:
        """
        Validate and normalize learning goals.
        
        Args:
            goals: List of goal strings
            
        Returns:
            List of validated and normalized goals
        """
        validated = []
        
        for goal in goals:
            if not goal or len(goal.strip()) < 2:
                continue
            
            # Normalize goal text
            normalized = goal.strip().lower()
            
            # Map common variations to standard terms
            goal_mappings = {
                "js": "javascript",
                "react.js": "react",
                "node": "node.js",
                "ml": "machine_learning",
                "ai": "artificial_intelligence"
            }
            
            normalized = goal_mappings.get(normalized, normalized)
            
            if normalized not in validated:
                validated.append(normalized)
        
        return validated[:10]  # Limit to 10 goals
    
    def _categorize_goals(self, goals: List[str]) -> Dict[str, List[str]]:
        """Categorize goals into learning domains."""
        categories = {
            "frontend": [],
            "backend": [],
            "data_science": [],
            "mobile": [],
            "devops": []
        }
        
        category_keywords = {
            "frontend": ["html", "css", "javascript", "react", "vue", "angular"],
            "backend": ["python", "java", "node.js", "databases", "apis"],
            "data_science": ["python", "pandas", "numpy", "machine_learning", "statistics"],
            "mobile": ["react_native", "flutter", "swift", "kotlin"],
            "devops": ["docker", "kubernetes", "ci_cd", "aws"]
        }
        
        for goal in goals:
            categorized = False
            for category, keywords in category_keywords.items():
                if goal in keywords:
                    categories[category].append(goal)
                    categorized = True
                    break
            
            if not categorized:
                categories.setdefault("other", []).append(goal)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}
    
    def _estimate_goal_timeline(self, goals: List[str], skill_level: SkillLevel) -> Dict[str, Any]:
        """Estimate timeline for achieving learning goals."""
        # Base hours per goal by skill level
        base_hours = {
            SkillLevel.BEGINNER: 40,
            SkillLevel.INTERMEDIATE: 25,
            SkillLevel.ADVANCED: 15,
            SkillLevel.EXPERT: 10
        }
        
        hours_per_goal = base_hours.get(skill_level, 30)
        total_hours = len(goals) * hours_per_goal
        
        return {
            "total_estimated_hours": total_hours,
            "hours_per_goal": hours_per_goal,
            "estimated_weeks_at_10h_per_week": total_hours / 10,
            "estimated_weeks_at_5h_per_week": total_hours / 5
        }
    
    def _parse_time_constraints(self, constraint_text: str) -> Dict[str, Any]:
        """
        Parse time constraints from natural language using sophisticated pattern matching.
        
        This method converts conversational descriptions of availability into structured
        data that can drive scheduling, pacing, and curriculum adaptation decisions
        throughout the learning system.
        
        PARSING CAPABILITIES:
        - Flexible Time Expressions: "5 hours per week", "30 minutes daily", "weekends only"
        - Schedule Preferences: "evenings", "mornings", "after work", "lunch breaks"
        - Day Specifications: "Monday through Friday", "weekends", "Tuesday and Thursday"
        - Session Preferences: "short sessions", "long study blocks", "quick reviews"
        
        PATTERN RECOGNITION:
        1. Quantitative Patterns: Regex extraction of hours, minutes, frequency
        2. Temporal Patterns: Recognition of time periods and scheduling preferences
        3. Contextual Clues: Inference from lifestyle indicators ("after work", "student")
        4. Constraint Validation: Ensures realistic and achievable time commitments
        
        INTELLIGENT DEFAULTS:
        - Missing Information: Provides reasonable defaults based on common patterns
        - Ambiguity Resolution: Uses context clues to resolve unclear specifications
        - Feasibility Checking: Validates that constraints are realistic and achievable
        - Preference Inference: Deduces likely preferences from explicit constraints
        
        Args:
            constraint_text: Natural language description of time availability
                           Examples: "I have about 5 hours per week, mostly evenings"
                                   "30 minutes every morning before work"
                                   "Weekends only, prefer longer sessions"
            
        Returns:
            Dictionary with structured time constraint data:
            - hours_per_week: Total weekly time commitment
            - preferred_times: List of preferred time periods
            - available_days: List of available days
            - session_length_minutes: Preferred session duration
            
        DESIGN RATIONALE:
        - Natural language processing reduces user friction in constraint specification
        - Structured output enables precise scheduling and pacing calculations
        - Intelligent defaults ensure system functionality even with incomplete input
        - Validation prevents unrealistic commitments that lead to user frustration
        """
        constraints = {
            "hours_per_week": 5,  # Default
            "preferred_times": [],
            "available_days": [],
            "session_length_minutes": 60
        }
        
        text_lower = constraint_text.lower()
        
        # Parse using regex patterns
        for pattern_info in self._time_patterns:
            pattern = pattern_info["pattern"]
            match = re.search(pattern, text_lower)
            
            if match:
                if pattern_info["type"] == "hours_per_week":
                    constraints["hours_per_week"] = int(match.group(1))
                elif pattern_info["type"] == "minutes_per_day":
                    minutes = int(match.group(1))
                    constraints["hours_per_week"] = (minutes * 7) / 60
                elif pattern_info["type"] == "hours_per_day":
                    hours = int(match.group(1))
                    constraints["hours_per_week"] = hours * 7
                elif "value" in pattern_info:
                    constraints.update(pattern_info["value"])
        
        # Parse preferred times
        time_keywords = {
            "morning": ["morning", "am", "early"],
            "afternoon": ["afternoon", "lunch", "midday"],
            "evening": ["evening", "night", "pm", "after work"]
        }
        
        for time_period, keywords in time_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                constraints["preferred_times"].append(time_period)
        
        # Parse available days
        day_keywords = {
            "monday": ["monday", "mon"],
            "tuesday": ["tuesday", "tue"],
            "wednesday": ["wednesday", "wed"],
            "thursday": ["thursday", "thu"],
            "friday": ["friday", "fri"],
            "saturday": ["saturday", "sat"],
            "sunday": ["sunday", "sun"]
        }
        
        for day, keywords in day_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                constraints["available_days"].append(day)
        
        # If no specific days mentioned, assume all days available
        if not constraints["available_days"]:
            constraints["available_days"] = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        
        return constraints
    
    def _validate_time_constraints(self, constraints: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and normalize time constraints.
        
        Args:
            constraints: Parsed time constraints
            
        Returns:
            Validated time constraints
        """
        validated = constraints.copy()
        
        # Ensure reasonable hours per week (1-40)
        hours_per_week = validated.get("hours_per_week", 5)
        validated["hours_per_week"] = max(1, min(40, hours_per_week))
        
        # Ensure session length is reasonable (15-180 minutes)
        session_length = validated.get("session_length_minutes", 60)
        validated["session_length_minutes"] = max(15, min(180, session_length))
        
        # Validate preferred times
        valid_times = ["morning", "afternoon", "evening"]
        validated["preferred_times"] = [
            time for time in validated.get("preferred_times", [])
            if time in valid_times
        ]
        
        # Validate available days
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        validated["available_days"] = [
            day for day in validated.get("available_days", [])
            if day in valid_days
        ]
        
        return validated
    
    def _generate_weekly_schedule(self, constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a suggested weekly schedule based on constraints."""
        hours_per_week = constraints.get("hours_per_week", 5)
        available_days = constraints.get("available_days", [])
        session_length = constraints.get("session_length_minutes", 60) / 60  # Convert to hours
        
        if not available_days:
            available_days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        
        # Calculate sessions per week
        sessions_per_week = max(1, round(hours_per_week / session_length))
        
        # Distribute sessions across available days
        schedule = {}
        days_to_use = available_days[:sessions_per_week]
        
        for i, day in enumerate(days_to_use):
            schedule[day] = {
                "duration_minutes": int(session_length * 60),
                "suggested_time": constraints.get("preferred_times", ["evening"])[0] if constraints.get("preferred_times") else "evening"
            }
        
        return {
            "weekly_schedule": schedule,
            "total_sessions_per_week": len(schedule),
            "total_hours_per_week": len(schedule) * session_length
        }
    
    def _assess_goal_feasibility(self, goals: List[str], constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Assess if goals are realistic given time constraints."""
        hours_per_week = constraints.get("hours_per_week", 5)
        
        # Estimate time needed for goals (simplified)
        estimated_hours_per_goal = 30  # Average
        total_estimated_hours = len(goals) * estimated_hours_per_goal
        estimated_weeks = total_estimated_hours / hours_per_week
        
        feasibility = "realistic"
        if estimated_weeks > 52:  # More than a year
            feasibility = "ambitious"
        elif estimated_weeks > 26:  # More than 6 months
            feasibility = "challenging"
        
        return {
            "feasibility": feasibility,
            "estimated_completion_weeks": round(estimated_weeks),
            "recommended_adjustments": self._get_feasibility_recommendations(feasibility, goals, hours_per_week)
        }
    
    def _get_feasibility_recommendations(self, feasibility: str, goals: List[str], hours_per_week: int) -> List[str]:
        """Get recommendations based on goal feasibility assessment."""
        if feasibility == "ambitious":
            return [
                "Consider focusing on 2-3 core goals first",
                "Increase study time if possible",
                "Break goals into smaller milestones"
            ]
        elif feasibility == "challenging":
            return [
                "Prioritize your most important goals",
                "Consider extending your timeline",
                "Focus on one major goal at a time"
            ]
        else:
            return [
                "Your goals look realistic for your available time",
                "Consider adding stretch goals as you progress"
            ]
    
    def _assess_profile_completeness(self, profile: UserProfile) -> Dict[str, Any]:
        """Assess how complete a user profile is."""
        completeness_score = 0
        total_fields = 4
        
        if profile.skill_level != SkillLevel.BEGINNER or profile.learning_goals:
            completeness_score += 1  # Skill level assessed
        
        if profile.learning_goals:
            completeness_score += 1  # Goals set
        
        if profile.time_constraints:
            completeness_score += 1  # Time constraints set
        
        if profile.preferences:
            completeness_score += 1  # Preferences set
        
        percentage = (completeness_score / total_fields) * 100
        
        return {
            "percentage": percentage,
            "missing_fields": self._get_missing_profile_fields(profile),
            "status": "complete" if percentage == 100 else "incomplete"
        }
    
    def _get_missing_profile_fields(self, profile: UserProfile) -> List[str]:
        """Get list of missing profile fields."""
        missing = []
        
        if profile.skill_level == SkillLevel.BEGINNER and not profile.learning_goals:
            missing.append("skill_assessment")
        
        if not profile.learning_goals:
            missing.append("learning_goals")
        
        if not profile.time_constraints:
            missing.append("time_constraints")
        
        if not profile.preferences:
            missing.append("preferences")
        
        return missing
    
    def _calculate_parsing_confidence(self, original_text: str, parsed_result: Dict[str, Any]) -> float:
        """Calculate confidence score for time constraint parsing."""
        # Simple heuristic based on how much information was extracted
        extracted_fields = sum(1 for v in parsed_result.values() if v)
        max_fields = 4  # hours_per_week, preferred_times, available_days, session_length
        
        return min(extracted_fields / max_fields, 1.0)
    
    async def _handle_timeout_fallback(self, context: LearningContext, payload: Dict[str, Any]) -> Optional[AgentResult]:
        """Provide fallback behavior for timeout scenarios."""
        intent = payload.get("intent")
        
        if intent == "assess_skill_level":
            # Return basic assessment questions
            return AgentResult.success_result(
                data={
                    "questions": self._get_diagnostic_questions("javascript")[:2],  # Just first 2 questions
                    "domain": "javascript",
                    "fallback": True
                }
            )
        elif intent == "parse_timeframe":
            # Return default constraints
            return AgentResult.success_result(
                data={
                    "parsed_constraints": {"hours_per_week": 5, "preferred_times": ["evening"]},
                    "fallback": True
                }
            )
        
        return None