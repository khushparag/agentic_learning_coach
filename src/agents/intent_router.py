"""
Intent Router for the Agentic Learning Coach system.

This module provides intent classification and routing logic that maps
user intents to the appropriate specialist agents.
"""
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from .base.types import AgentType


class LearningIntent(Enum):
    """
    Enumeration of all learning intents in the system.
    
    Intents are categorized by the agent responsible for handling them.
    """
    # Profile Management Intents (ProfileAgent)
    ASSESS_SKILL_LEVEL = "assess_skill_level"
    UPDATE_GOALS = "update_goals"
    SET_CONSTRAINTS = "set_constraints"
    CREATE_PROFILE = "create_profile"
    UPDATE_PROFILE = "update_profile"
    GET_PROFILE = "get_profile"
    
    # Curriculum Planning Intents (CurriculumPlannerAgent)
    CREATE_LEARNING_PATH = "create_learning_path"
    ADAPT_DIFFICULTY = "adapt_difficulty"
    REQUEST_NEXT_TOPIC = "request_next_topic"
    GENERATE_CURRICULUM = "generate_curriculum"
    UPDATE_CURRICULUM = "update_curriculum"
    GET_CURRICULUM_STATUS = "get_curriculum_status"
    
    # Exercise Intents (ExerciseGeneratorAgent)
    REQUEST_EXERCISE = "request_exercise"
    GENERATE_EXERCISE = "generate_exercise"
    REQUEST_HINT = "request_hint"
    CREATE_STRETCH_EXERCISE = "create_stretch_exercise"
    CREATE_RECAP_EXERCISE = "create_recap_exercise"
    
    # Review Intents (ReviewerAgent)
    SUBMIT_SOLUTION = "submit_solution"
    EVALUATE_SUBMISSION = "evaluate_submission"
    RUN_TESTS = "run_tests"
    CHECK_CODE_QUALITY = "check_code_quality"
    
    # Resource Intents (ResourcesAgent)
    FIND_DOCUMENTATION = "find_documentation"
    SEARCH_RESOURCES = "search_resources"
    EXPLAIN_CONCEPT = "explain_concept"
    GET_EXAMPLES = "get_examples"
    RECOMMEND_RESOURCES = "recommend_resources"
    
    # Progress Tracking Intents (ProgressTracker)
    CHECK_PROGRESS = "check_progress"
    REVIEW_MISTAKES = "review_mistakes"
    GET_RECOMMENDATIONS = "get_recommendations"
    UPDATE_PROGRESS = "update_progress"
    GET_DAILY_TASKS = "get_daily_tasks"


# Intent to Agent Type mapping
INTENT_ROUTING: Dict[LearningIntent, AgentType] = {
    # Profile intents → ProfileAgent
    LearningIntent.ASSESS_SKILL_LEVEL: AgentType.PROFILE,
    LearningIntent.UPDATE_GOALS: AgentType.PROFILE,
    LearningIntent.SET_CONSTRAINTS: AgentType.PROFILE,
    LearningIntent.CREATE_PROFILE: AgentType.PROFILE,
    LearningIntent.UPDATE_PROFILE: AgentType.PROFILE,
    LearningIntent.GET_PROFILE: AgentType.PROFILE,
    
    # Curriculum intents → CurriculumPlannerAgent
    LearningIntent.CREATE_LEARNING_PATH: AgentType.CURRICULUM_PLANNER,
    LearningIntent.ADAPT_DIFFICULTY: AgentType.CURRICULUM_PLANNER,
    LearningIntent.REQUEST_NEXT_TOPIC: AgentType.CURRICULUM_PLANNER,
    LearningIntent.GENERATE_CURRICULUM: AgentType.CURRICULUM_PLANNER,
    LearningIntent.UPDATE_CURRICULUM: AgentType.CURRICULUM_PLANNER,
    LearningIntent.GET_CURRICULUM_STATUS: AgentType.CURRICULUM_PLANNER,
    
    # Exercise intents → ExerciseGeneratorAgent
    LearningIntent.REQUEST_EXERCISE: AgentType.EXERCISE_GENERATOR,
    LearningIntent.GENERATE_EXERCISE: AgentType.EXERCISE_GENERATOR,
    LearningIntent.REQUEST_HINT: AgentType.EXERCISE_GENERATOR,
    LearningIntent.CREATE_STRETCH_EXERCISE: AgentType.EXERCISE_GENERATOR,
    LearningIntent.CREATE_RECAP_EXERCISE: AgentType.EXERCISE_GENERATOR,
    
    # Review intents → ReviewerAgent
    LearningIntent.SUBMIT_SOLUTION: AgentType.REVIEWER,
    LearningIntent.EVALUATE_SUBMISSION: AgentType.REVIEWER,
    LearningIntent.RUN_TESTS: AgentType.REVIEWER,
    LearningIntent.CHECK_CODE_QUALITY: AgentType.REVIEWER,
    
    # Resource intents → ResourcesAgent
    LearningIntent.FIND_DOCUMENTATION: AgentType.RESOURCES,
    LearningIntent.SEARCH_RESOURCES: AgentType.RESOURCES,
    LearningIntent.EXPLAIN_CONCEPT: AgentType.RESOURCES,
    LearningIntent.GET_EXAMPLES: AgentType.RESOURCES,
    LearningIntent.RECOMMEND_RESOURCES: AgentType.RESOURCES,
    
    # Progress intents → ProgressTracker
    LearningIntent.CHECK_PROGRESS: AgentType.PROGRESS_TRACKER,
    LearningIntent.REVIEW_MISTAKES: AgentType.PROGRESS_TRACKER,
    LearningIntent.GET_RECOMMENDATIONS: AgentType.PROGRESS_TRACKER,
    LearningIntent.UPDATE_PROGRESS: AgentType.PROGRESS_TRACKER,
    LearningIntent.GET_DAILY_TASKS: AgentType.PROGRESS_TRACKER,
}


@dataclass
class IntentClassificationResult:
    """Result of intent classification."""
    intent: Optional[LearningIntent]
    target_agent: Optional[AgentType]
    confidence: float
    alternative_intents: List[Tuple[LearningIntent, float]]
    raw_input: str


class IntentRouter:
    """
    Routes user intents to appropriate specialist agents.
    
    Provides intent classification from natural language or structured input,
    and determines the appropriate agent to handle each request.
    """
    
    def __init__(self):
        """Initialize the intent router with keyword mappings."""
        self._intent_keywords = self._initialize_intent_keywords()
        self._agent_intents = self._build_agent_intent_map()
    
    def _initialize_intent_keywords(self) -> Dict[LearningIntent, List[str]]:
        """Initialize keyword mappings for intent classification."""
        return {
            # Profile intents
            LearningIntent.ASSESS_SKILL_LEVEL: [
                "assess", "skill level", "evaluate my skills", "test my knowledge",
                "what level am i", "diagnostic", "skill assessment"
            ],
            LearningIntent.UPDATE_GOALS: [
                "update goals", "change goals", "new goals", "modify goals",
                "set goals", "learning goals", "want to learn"
            ],
            LearningIntent.SET_CONSTRAINTS: [
                "time constraints", "available time", "hours per week",
                "schedule", "availability", "how much time"
            ],
            LearningIntent.CREATE_PROFILE: [
                "create profile", "new profile", "sign up", "register",
                "get started", "begin learning"
            ],
            LearningIntent.GET_PROFILE: [
                "my profile", "show profile", "view profile", "profile info"
            ],
            
            # Curriculum intents
            LearningIntent.CREATE_LEARNING_PATH: [
                "create learning path", "learning path", "learning plan", "curriculum",
                "study plan", "roadmap", "learning journey", "create a learning"
            ],
            LearningIntent.ADAPT_DIFFICULTY: [
                "too hard", "too easy", "adjust difficulty", "change difficulty",
                "easier", "harder", "struggling"
            ],
            LearningIntent.REQUEST_NEXT_TOPIC: [
                "next topic", "what's next", "continue learning", "next lesson",
                "move on", "proceed"
            ],
            LearningIntent.GET_CURRICULUM_STATUS: [
                "curriculum status", "plan status", "where am i",
                "current progress", "learning status"
            ],
            
            # Exercise intents
            LearningIntent.REQUEST_EXERCISE: [
                "give me an exercise", "practice", "exercise", "challenge",
                "coding exercise", "problem to solve"
            ],
            LearningIntent.GENERATE_EXERCISE: [
                "generate exercise", "create exercise", "new exercise",
                "another exercise", "more practice"
            ],
            LearningIntent.REQUEST_HINT: [
                "hint", "help me", "stuck", "clue", "guidance",
                "don't understand", "confused"
            ],
            LearningIntent.CREATE_STRETCH_EXERCISE: [
                "stretch exercise", "challenge me", "harder exercise",
                "advanced exercise", "push myself"
            ],
            LearningIntent.CREATE_RECAP_EXERCISE: [
                "recap", "review exercise", "practice again",
                "reinforce", "go over again"
            ],
            
            # Review intents
            LearningIntent.SUBMIT_SOLUTION: [
                "submit", "check my code", "evaluate", "review my solution",
                "grade my code", "test my solution"
            ],
            LearningIntent.EVALUATE_SUBMISSION: [
                "evaluate submission", "check submission", "review submission"
            ],
            LearningIntent.RUN_TESTS: [
                "run tests", "test code", "execute tests", "check tests"
            ],
            LearningIntent.CHECK_CODE_QUALITY: [
                "code quality", "code review", "improve code",
                "best practices", "code style"
            ],
            
            # Resource intents
            LearningIntent.FIND_DOCUMENTATION: [
                "documentation", "docs", "reference", "api docs",
                "official docs", "manual"
            ],
            LearningIntent.SEARCH_RESOURCES: [
                "find resources", "search", "look up", "find tutorials",
                "learning materials", "resources"
            ],
            LearningIntent.EXPLAIN_CONCEPT: [
                "explain", "what is", "how does", "tell me about",
                "understand", "concept"
            ],
            LearningIntent.GET_EXAMPLES: [
                "examples", "show me examples", "demonstrate", "sample code",
                "code example", "illustration", "show example"
            ],
            LearningIntent.RECOMMEND_RESOURCES: [
                "recommend", "suggest", "what should i read",
                "good resources", "best tutorials"
            ],
            
            # Progress intents
            LearningIntent.CHECK_PROGRESS: [
                "my progress", "how am i doing", "progress report",
                "achievements", "completed", "statistics", "show me my progress",
                "check progress", "view progress"
            ],
            LearningIntent.REVIEW_MISTAKES: [
                "mistakes", "errors", "what did i do wrong",
                "review errors", "learn from mistakes"
            ],
            LearningIntent.GET_RECOMMENDATIONS: [
                "recommendations", "what should i focus on",
                "areas to improve", "suggestions"
            ],
            LearningIntent.GET_DAILY_TASKS: [
                "daily tasks", "today's tasks", "what to do today",
                "daily plan", "today's exercises"
            ],
        }
    
    def _build_agent_intent_map(self) -> Dict[AgentType, List[LearningIntent]]:
        """Build a map of agents to their supported intents."""
        agent_intents: Dict[AgentType, List[LearningIntent]] = {}
        
        for intent, agent_type in INTENT_ROUTING.items():
            if agent_type not in agent_intents:
                agent_intents[agent_type] = []
            agent_intents[agent_type].append(intent)
        
        return agent_intents
    
    def classify_intent(self, user_input: str) -> IntentClassificationResult:
        """
        Classify user input into a learning intent.
        
        Args:
            user_input: Natural language input from the user
            
        Returns:
            IntentClassificationResult with classified intent and confidence
        """
        if not user_input or not user_input.strip():
            return IntentClassificationResult(
                intent=None,
                target_agent=None,
                confidence=0.0,
                alternative_intents=[],
                raw_input=user_input
            )
        
        input_lower = user_input.lower().strip()
        
        # Score each intent based on keyword matches
        intent_scores: Dict[LearningIntent, float] = {}
        
        for intent, keywords in self._intent_keywords.items():
            score = self._calculate_intent_score(input_lower, keywords)
            if score > 0:
                intent_scores[intent] = score
        
        if not intent_scores:
            return IntentClassificationResult(
                intent=None,
                target_agent=None,
                confidence=0.0,
                alternative_intents=[],
                raw_input=user_input
            )
        
        # Sort by score and get top results
        sorted_intents = sorted(
            intent_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        best_intent, best_score = sorted_intents[0]
        target_agent = INTENT_ROUTING.get(best_intent)
        
        # Get alternative intents (top 3 excluding best)
        alternatives = [
            (intent, score) 
            for intent, score in sorted_intents[1:4]
        ]
        
        return IntentClassificationResult(
            intent=best_intent,
            target_agent=target_agent,
            confidence=min(best_score, 1.0),
            alternative_intents=alternatives,
            raw_input=user_input
        )
    
    def _calculate_intent_score(self, input_text: str, keywords: List[str]) -> float:
        """
        Calculate a score for how well input matches intent keywords.
        
        Args:
            input_text: Lowercase user input
            keywords: List of keywords for an intent
            
        Returns:
            Score between 0.0 and 1.0
        """
        score = 0.0
        matched_keywords = 0
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in input_text:
                # Exact phrase match gets higher score
                if len(keyword_lower.split()) > 1:
                    score += 0.4
                else:
                    score += 0.2
                matched_keywords += 1
        
        # Normalize score based on number of matches
        if matched_keywords > 0:
            score = min(score, 1.0)
        
        return score
    
    def route_intent(self, intent: LearningIntent) -> AgentType:
        """
        Get the target agent for a specific intent.
        
        Args:
            intent: The learning intent to route
            
        Returns:
            AgentType that should handle this intent
            
        Raises:
            ValueError: If intent is not recognized
        """
        if intent not in INTENT_ROUTING:
            raise ValueError(f"Unknown intent: {intent}")
        
        return INTENT_ROUTING[intent]
    
    def route_intent_string(self, intent_string: str) -> Optional[AgentType]:
        """
        Get the target agent for an intent string.
        
        Args:
            intent_string: String representation of the intent
            
        Returns:
            AgentType that should handle this intent, or None if not found
        """
        try:
            intent = LearningIntent(intent_string)
            return INTENT_ROUTING.get(intent)
        except ValueError:
            return None
    
    def get_intents_for_agent(self, agent_type: AgentType) -> List[LearningIntent]:
        """
        Get all intents that a specific agent can handle.
        
        Args:
            agent_type: The agent type to query
            
        Returns:
            List of intents the agent can handle
        """
        return self._agent_intents.get(agent_type, [])
    
    def get_all_intents(self) -> List[LearningIntent]:
        """Get all available learning intents."""
        return list(LearningIntent)
    
    def get_intent_description(self, intent: LearningIntent) -> str:
        """
        Get a human-readable description of an intent.
        
        Args:
            intent: The intent to describe
            
        Returns:
            Description string
        """
        descriptions = {
            LearningIntent.ASSESS_SKILL_LEVEL: "Assess your current skill level through diagnostic questions",
            LearningIntent.UPDATE_GOALS: "Update your learning goals and objectives",
            LearningIntent.SET_CONSTRAINTS: "Set your time constraints and availability",
            LearningIntent.CREATE_PROFILE: "Create a new learner profile",
            LearningIntent.UPDATE_PROFILE: "Update your existing profile",
            LearningIntent.GET_PROFILE: "View your profile information",
            LearningIntent.CREATE_LEARNING_PATH: "Create a personalized learning path",
            LearningIntent.ADAPT_DIFFICULTY: "Adjust the difficulty of your curriculum",
            LearningIntent.REQUEST_NEXT_TOPIC: "Get the next topic in your learning path",
            LearningIntent.GENERATE_CURRICULUM: "Generate a new curriculum structure",
            LearningIntent.UPDATE_CURRICULUM: "Update your existing curriculum",
            LearningIntent.GET_CURRICULUM_STATUS: "Check your curriculum progress status",
            LearningIntent.REQUEST_EXERCISE: "Request a practice exercise",
            LearningIntent.GENERATE_EXERCISE: "Generate a new exercise",
            LearningIntent.REQUEST_HINT: "Get a hint for the current exercise",
            LearningIntent.CREATE_STRETCH_EXERCISE: "Create a challenging stretch exercise",
            LearningIntent.CREATE_RECAP_EXERCISE: "Create a recap exercise for review",
            LearningIntent.SUBMIT_SOLUTION: "Submit your code solution for evaluation",
            LearningIntent.EVALUATE_SUBMISSION: "Evaluate a code submission",
            LearningIntent.RUN_TESTS: "Run tests against your code",
            LearningIntent.CHECK_CODE_QUALITY: "Check the quality of your code",
            LearningIntent.FIND_DOCUMENTATION: "Find relevant documentation",
            LearningIntent.SEARCH_RESOURCES: "Search for learning resources",
            LearningIntent.EXPLAIN_CONCEPT: "Get an explanation of a concept",
            LearningIntent.GET_EXAMPLES: "Get code examples",
            LearningIntent.RECOMMEND_RESOURCES: "Get resource recommendations",
            LearningIntent.CHECK_PROGRESS: "Check your learning progress",
            LearningIntent.REVIEW_MISTAKES: "Review your past mistakes",
            LearningIntent.GET_RECOMMENDATIONS: "Get personalized recommendations",
            LearningIntent.UPDATE_PROGRESS: "Update your progress tracking",
            LearningIntent.GET_DAILY_TASKS: "Get your daily learning tasks",
        }
        
        return descriptions.get(intent, f"Handle {intent.value} request")
