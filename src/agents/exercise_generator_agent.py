"""
ExerciseGeneratorAgent implementation for intelligent practice exercise creation.

This agent serves as the pedagogical content creation engine of the learning system,
generating targeted, adaptive exercises that provide optimal practice opportunities
for skill development and knowledge consolidation.

CORE RESPONSIBILITIES:
- Intelligent exercise generation using LLM-powered content creation with template fallbacks
- Adaptive difficulty calibration based on learner performance and skill progression
- Comprehensive test case generation for automated assessment and validation
- Contextual hint generation to provide scaffolded learning support
- Specialized exercise types (stretch, recap, project) for diverse learning needs

EXERCISE GENERATION STRATEGIES:
The agent employs a multi-layered approach to content creation:
1. LLM-Powered Generation: Uses advanced language models for context-aware exercise creation
2. Template-Based Fallbacks: Ensures reliability with pre-designed exercise structures
3. Adaptive Customization: Tailors content complexity to individual learner needs
4. Real-World Relevance: Creates industry-relevant scenarios and practical applications
5. Progressive Difficulty: Implements scientifically-based challenge progression

ADAPTIVE DIFFICULTY SYSTEM:
- Performance Analysis: Monitors completion time, attempt patterns, and success rates
- Dynamic Adjustment: Automatically increases or decreases challenge levels
- Stretch Exercises: Provides advanced challenges for high-performing learners
- Recap Exercises: Offers reinforcement opportunities for struggling concepts
- Contextual Adaptation: Considers learner goals, constraints, and preferences

LLM INTEGRATION ARCHITECTURE:
- Primary Generation: Leverages AI for creative, contextual exercise creation
- Quality Validation: Ensures generated content meets pedagogical standards
- Fallback Mechanisms: Maintains functionality when LLM services are unavailable
- Template Enhancement: Combines AI creativity with structured educational design

EXERCISE TYPES & SPECIALIZATIONS:
- Coding Exercises: Hands-on programming challenges with automated testing
- Quiz Exercises: Knowledge assessment with multiple choice and open-ended questions
- Project Exercises: Comprehensive applications integrating multiple concepts
- Stretch Challenges: Advanced problems for accelerated learners
- Recap Reviews: Reinforcement exercises for concept consolidation
"""
import logging
import json
import random
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from uuid import uuid4

from .base.base_agent import BaseAgent
from .base.types import AgentType, LearningContext, AgentResult
from .base.exceptions import ValidationError, AgentProcessingError
from ..ports.services.mcp_tools import ICodeAnalysisMCP, DifficultyLevel
from ..domain.entities.task import Task, TaskType
from ..domain.value_objects.enums import TaskType as DomainTaskType
from ..adapters.services.llm_service import LLMService, ILLMService, create_llm_service


logger = logging.getLogger(__name__)


class ExerciseGeneratorAgent(BaseAgent):
    """
    Agent responsible for intelligent generation of targeted coding exercises and practice opportunities.
    
    This agent represents the creative pedagogical intelligence of the learning system,
    combining educational theory, adaptive algorithms, and AI-powered content generation
    to create optimal practice experiences for individual learners.
    
    EXERCISE GENERATION CAPABILITIES:
    - LLM-Powered Creation: Uses advanced language models for context-aware exercise generation
    - Multi-Language Support: Handles Python, JavaScript, Java, and other programming languages
    - Adaptive Difficulty: Dynamically adjusts challenge levels based on learner performance
    - Comprehensive Testing: Generates thorough test cases for automated assessment
    - Scaffolded Learning: Provides progressive hint systems for guided problem-solving
    
    SPECIALIZED EXERCISE TYPES:
    - Standard Exercises: Core practice opportunities aligned with learning objectives
    - Stretch Challenges: Advanced problems for high-performing learners
    - Recap Reviews: Reinforcement exercises for concept consolidation
    - Project Exercises: Comprehensive applications integrating multiple concepts
    - Adaptive Variants: Dynamically modified exercises based on performance patterns
    
    DIFFICULTY PROGRESSION SYSTEM:
    The agent implements a sophisticated difficulty management system:
    - Performance Monitoring: Tracks completion time, attempt patterns, success rates
    - Adaptive Calibration: Automatically adjusts challenge levels based on learner data
    - Progressive Complexity: Ensures appropriate skill building without overwhelming
    - Contextual Adaptation: Considers learner goals, constraints, and preferences
    
    CONTENT QUALITY ASSURANCE:
    - Educational Alignment: Ensures exercises match stated learning objectives
    - Real-World Relevance: Creates industry-relevant scenarios and applications
    - Comprehensive Testing: Generates thorough test cases for reliable assessment
    - Accessibility: Adapts content presentation to diverse learning styles
    - Continuous Improvement: Learns from learner interactions to enhance future content
    
    INTEGRATION ARCHITECTURE:
    - CurriculumPlannerAgent: Receives learning objectives and skill level requirements
    - ReviewerAgent: Collaborates on assessment criteria and feedback generation
    - ProgressTracker: Provides performance data for adaptive difficulty adjustments
    - ResourcesAgent: Coordinates with content curation for supplementary materials
    """
    
    def __init__(self, 
                 code_analysis_mcp: Optional[ICodeAnalysisMCP] = None,
                 llm_service: Optional[ILLMService] = None):
        super().__init__(AgentType.EXERCISE_GENERATOR)
        self.code_analysis_mcp = code_analysis_mcp
        self.llm_service = llm_service or create_llm_service()
        self._supported_intents = [
            'generate_exercise',
            'create_test_cases',
            'generate_hints',
            'adapt_difficulty',
            'create_stretch_exercise',
            'create_recap_exercise',
            'generate_project_exercise'
        ]
        
        # Exercise templates by topic and difficulty
        self.exercise_templates = self._initialize_exercise_templates()
        
        # Difficulty progression rules
        self.difficulty_rules = {
            'beginner': {
                'concepts': ['variables', 'basic_operations', 'print_statements', 'input'],
                'max_lines': 20,
                'max_functions': 1,
                'test_cases': 3
            },
            'intermediate': {
                'concepts': ['functions', 'loops', 'conditionals', 'lists', 'dictionaries'],
                'max_lines': 50,
                'max_functions': 3,
                'test_cases': 5
            },
            'advanced': {
                'concepts': ['classes', 'file_io', 'error_handling', 'algorithms'],
                'max_lines': 100,
                'max_functions': 5,
                'test_cases': 7
            },
            'expert': {
                'concepts': ['design_patterns', 'optimization', 'concurrency', 'testing'],
                'max_lines': 200,
                'max_functions': 10,
                'test_cases': 10
            }
        }
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return self._supported_intents.copy()
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Process exercise generation requests."""
        intent = payload.get('intent')
        
        try:
            if intent == 'generate_exercise':
                return await self._generate_exercise(context, payload)
            elif intent == 'create_test_cases':
                return await self._create_test_cases(context, payload)
            elif intent == 'generate_hints':
                return await self._generate_hints(context, payload)
            elif intent == 'adapt_difficulty':
                return await self._adapt_difficulty(context, payload)
            elif intent == 'create_stretch_exercise':
                return await self._create_stretch_exercise(context, payload)
            elif intent == 'create_recap_exercise':
                return await self._create_recap_exercise(context, payload)
            elif intent == 'generate_project_exercise':
                return await self._generate_project_exercise(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except Exception as e:
            self.logger.log_error(f"Exercise generation failed for intent {intent}", e, context, intent)
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")
    
    async def _generate_exercise(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Generate a coding exercise based on learning objectives."""
        try:
            # Extract parameters
            topic = payload.get('topic') or context.current_objective
            if not topic:
                raise ValidationError("Topic is required for exercise generation")
            
            difficulty = payload.get('difficulty') or context.skill_level or 'intermediate'
            language = payload.get('language', 'python')
            exercise_type = payload.get('exercise_type', 'coding')
            
            self.logger.log_debug(
                f"Generating {exercise_type} exercise for topic: {topic}, difficulty: {difficulty}",
                context, 'generate_exercise'
            )
            
            # Generate exercise based on type
            if exercise_type == 'coding':
                exercise_data = await self._generate_coding_exercise(topic, difficulty, language, context)
            elif exercise_type == 'quiz':
                exercise_data = await self._generate_quiz_exercise(topic, difficulty, context)
            elif exercise_type == 'project':
                exercise_data = await self._generate_project_exercise_internal(topic, difficulty, language, context)
            else:
                raise ValidationError(f"Unsupported exercise type: {exercise_type}")
            
            # Create test cases
            if exercise_type == 'coding':
                test_cases = await self._create_test_cases_for_exercise(exercise_data, context)
                exercise_data['test_cases'] = test_cases
            
            # Generate hints
            hints = await self._generate_hints_for_exercise(exercise_data, context)
            exercise_data['hints'] = hints
            
            # Add metadata
            exercise_data.update({
                'id': str(uuid4()),
                'created_at': datetime.utcnow().isoformat(),
                'topic': topic,
                'difficulty': difficulty,
                'language': language,
                'exercise_type': exercise_type,
                'estimated_time_minutes': self._estimate_completion_time(exercise_data, difficulty)
            })
            
            self.logger.log_info(
                f"Generated {exercise_type} exercise: {exercise_data['title']}",
                context, 'generate_exercise'
            )
            
            return AgentResult.success_result(
                data=exercise_data,
                next_actions=['submit_solution'],
                metadata={
                    'topic': topic,
                    'difficulty': difficulty,
                    'exercise_type': exercise_type,
                    'language': language
                }
            )
            
        except Exception as e:
            self.logger.log_error("Exercise generation failed", e, context, 'generate_exercise')
            return AgentResult.error_result(
                error=f"Exercise generation failed: {str(e)}",
                error_code="GENERATION_FAILED"
            )
    
    async def _generate_coding_exercise(self, 
                                      topic: str, 
                                      difficulty: str, 
                                      language: str, 
                                      context: LearningContext) -> Dict[str, Any]:
        """Generate a coding exercise using LLM with template fallback."""
        # Try LLM-powered generation first
        if self.llm_service:
            try:
                self.logger.log_debug(
                    f"Attempting LLM-powered exercise generation for {topic}",
                    context, 'generate_coding_exercise'
                )
                
                llm_exercise = await self.llm_service.generate_exercise(
                    topic=topic,
                    difficulty=difficulty,
                    language=language
                )
                
                # Check if LLM generation was successful
                if llm_exercise and not llm_exercise.get('error') and not llm_exercise.get('fallback'):
                    self.logger.log_info(
                        f"LLM-generated exercise: {llm_exercise.get('title', 'Untitled')}",
                        context, 'generate_coding_exercise'
                    )
                    
                    # Ensure required fields exist
                    llm_exercise.setdefault('title', f"{topic.title()} Exercise")
                    llm_exercise.setdefault('description', f"Practice {topic} concepts")
                    llm_exercise.setdefault('instructions', f"Complete the {topic} exercise")
                    llm_exercise.setdefault('starter_code', f"# {topic} exercise\n")
                    llm_exercise['llm_generated'] = True
                    llm_exercise['generation_method'] = 'llm'
                    
                    return llm_exercise
                    
            except Exception as e:
                self.logger.log_warning(
                    f"LLM exercise generation failed, falling back to templates: {e}"
                )
        
        # Fallback to template-based generation
        template = self._get_exercise_template(topic, difficulty, language)
        exercise = self._customize_exercise_template(template, context)
        exercise = self._add_language_specific_elements(exercise, language)
        exercise['generation_method'] = 'template'
        
        return exercise
    
    async def _generate_quiz_exercise(self, 
                                    topic: str, 
                                    difficulty: str, 
                                    context: LearningContext) -> Dict[str, Any]:
        """Generate a quiz exercise."""
        questions = self._generate_quiz_questions(topic, difficulty)
        
        return {
            'title': f"{topic.title()} Quiz",
            'description': f"Test your understanding of {topic}",
            'instructions': "Answer all questions to the best of your ability.",
            'questions': questions,
            'total_points': len(questions) * 10
        }
    
    async def _generate_project_exercise_internal(self, 
                                                topic: str, 
                                                difficulty: str, 
                                                language: str, 
                                                context: LearningContext) -> Dict[str, Any]:
        """Generate a project-based exercise."""
        project_template = self._get_project_template(topic, difficulty, language)
        
        return {
            'title': project_template['title'],
            'description': project_template['description'],
            'instructions': project_template['instructions'],
            'requirements': project_template['requirements'],
            'deliverables': project_template['deliverables'],
            'starter_code': project_template.get('starter_code', ''),
            'resources': project_template.get('resources', [])
        }
    
    async def _create_test_cases(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Create test cases for a given exercise or code."""
        try:
            exercise_data = payload.get('exercise')
            code = payload.get('code')
            language = payload.get('language', 'python')
            
            if not exercise_data and not code:
                raise ValidationError("Either exercise data or code is required")
            
            self.logger.log_debug(
                "Creating test cases",
                context, 'create_test_cases'
            )
            
            if exercise_data:
                test_cases = await self._create_test_cases_for_exercise(exercise_data, context)
            else:
                test_cases = await self._create_test_cases_for_code(code, language, context)
            
            return AgentResult.success_result(
                data={'test_cases': test_cases},
                metadata={'test_case_count': len(test_cases)}
            )
            
        except Exception as e:
            self.logger.log_error("Test case creation failed", e, context, 'create_test_cases')
            return AgentResult.error_result(
                error=f"Test case creation failed: {str(e)}",
                error_code="TEST_CASE_CREATION_FAILED"
            )
    
    async def _generate_hints(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Generate hints for an exercise."""
        try:
            exercise_data = payload.get('exercise')
            if not exercise_data:
                raise ValidationError("Exercise data is required")
            
            hint_level = payload.get('hint_level', 1)  # 1-3, increasing specificity
            
            self.logger.log_debug(
                f"Generating hints (level {hint_level})",
                context, 'generate_hints'
            )
            
            hints = await self._generate_hints_for_exercise(exercise_data, context, hint_level)
            
            return AgentResult.success_result(
                data={'hints': hints, 'hint_level': hint_level},
                metadata={'hint_count': len(hints)}
            )
            
        except Exception as e:
            self.logger.log_error("Hint generation failed", e, context, 'generate_hints')
            return AgentResult.error_result(
                error=f"Hint generation failed: {str(e)}",
                error_code="HINT_GENERATION_FAILED"
            )
    
    async def _adapt_difficulty(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Adapt exercise difficulty based on performance."""
        try:
            current_exercise = payload.get('current_exercise')
            performance_data = payload.get('performance_data')
            adaptation_direction = payload.get('direction', 'auto')  # 'up', 'down', 'auto'
            
            if not current_exercise:
                raise ValidationError("Current exercise data is required")
            
            self.logger.log_debug(
                f"Adapting difficulty {adaptation_direction}",
                context, 'adapt_difficulty'
            )
            
            # Determine adaptation direction if auto
            if adaptation_direction == 'auto':
                adaptation_direction = self._determine_adaptation_direction(performance_data, context)
            
            # Create adapted exercise
            adapted_exercise = await self._create_adapted_exercise(
                current_exercise, adaptation_direction, context
            )
            
            return AgentResult.success_result(
                data=adapted_exercise,
                next_actions=['submit_solution'],
                metadata={
                    'adaptation_direction': adaptation_direction,
                    'original_difficulty': current_exercise.get('difficulty'),
                    'new_difficulty': adapted_exercise.get('difficulty')
                }
            )
            
        except Exception as e:
            self.logger.log_error("Difficulty adaptation failed", e, context, 'adapt_difficulty')
            return AgentResult.error_result(
                error=f"Difficulty adaptation failed: {str(e)}",
                error_code="ADAPTATION_FAILED"
            )
    
    async def _create_stretch_exercise(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Create a stretch exercise for advanced learners."""
        try:
            base_topic = payload.get('topic') or context.current_objective
            current_difficulty = payload.get('current_difficulty', context.skill_level)
            
            self.logger.log_debug(
                f"Creating stretch exercise for topic: {base_topic}",
                context, 'create_stretch_exercise'
            )
            
            # Increase difficulty level
            stretch_difficulty = self._get_next_difficulty_level(current_difficulty)
            
            # Generate challenging exercise
            stretch_exercise = await self._generate_coding_exercise(
                base_topic, stretch_difficulty, payload.get('language', 'python'), context
            )
            
            # Add stretch-specific elements
            stretch_exercise['is_stretch'] = True
            stretch_exercise['base_difficulty'] = current_difficulty
            stretch_exercise['difficulty'] = stretch_difficulty  # Add difficulty field
            stretch_exercise['title'] = f"Stretch Challenge: {stretch_exercise['title']}"
            stretch_exercise['description'] += "\n\nThis is a stretch exercise designed to challenge you beyond your current level."
            
            return AgentResult.success_result(
                data=stretch_exercise,
                next_actions=['submit_solution'],
                metadata={
                    'exercise_type': 'stretch',
                    'base_difficulty': current_difficulty,
                    'stretch_difficulty': stretch_difficulty
                }
            )
            
        except Exception as e:
            self.logger.log_error("Stretch exercise creation failed", e, context, 'create_stretch_exercise')
            return AgentResult.error_result(
                error=f"Stretch exercise creation failed: {str(e)}",
                error_code="STRETCH_CREATION_FAILED"
            )
    
    async def _create_recap_exercise(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Create a recap exercise for reinforcement."""
        try:
            topics = payload.get('topics', [context.current_objective])
            difficulty = payload.get('difficulty', 'beginner')
            
            self.logger.log_debug(
                f"Creating recap exercise for topics: {topics}",
                context, 'create_recap_exercise'
            )
            
            # Create simplified exercise covering multiple topics
            recap_exercise = await self._generate_recap_exercise_content(topics, difficulty, context)
            
            # Add recap-specific elements
            recap_exercise['is_recap'] = True
            recap_exercise['topics_covered'] = topics
            recap_exercise['title'] = f"Recap: {', '.join(topics)}"
            recap_exercise['description'] += "\n\nThis recap exercise helps reinforce key concepts."
            
            return AgentResult.success_result(
                data=recap_exercise,
                next_actions=['submit_solution'],
                metadata={
                    'exercise_type': 'recap',
                    'topics_covered': topics,
                    'difficulty': difficulty
                }
            )
            
        except Exception as e:
            self.logger.log_error("Recap exercise creation failed", e, context, 'create_recap_exercise')
            return AgentResult.error_result(
                error=f"Recap exercise creation failed: {str(e)}",
                error_code="RECAP_CREATION_FAILED"
            )
    
    async def _generate_project_exercise(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Generate a comprehensive project exercise."""
        try:
            topic = payload.get('topic') or context.current_objective
            difficulty = payload.get('difficulty', context.skill_level)
            language = payload.get('language', 'python')
            duration_hours = payload.get('duration_hours', 4)
            
            self.logger.log_debug(
                f"Generating project exercise for topic: {topic}",
                context, 'generate_project_exercise'
            )
            
            project_exercise = await self._generate_project_exercise_internal(
                topic, difficulty, language, context
            )
            
            # Add project-specific metadata
            project_exercise.update({
                'id': str(uuid4()),
                'created_at': datetime.utcnow().isoformat(),
                'exercise_type': 'project',
                'estimated_hours': duration_hours,
                'milestones': self._generate_project_milestones(project_exercise, duration_hours)
            })
            
            return AgentResult.success_result(
                data=project_exercise,
                next_actions=['submit_solution'],
                metadata={
                    'exercise_type': 'project',
                    'topic': topic,
                    'difficulty': difficulty,
                    'estimated_hours': duration_hours
                }
            )
            
        except Exception as e:
            self.logger.log_error("Project exercise generation failed", e, context, 'generate_project_exercise')
            return AgentResult.error_result(
                error=f"Project exercise generation failed: {str(e)}",
                error_code="PROJECT_GENERATION_FAILED"
            )
    
    def _initialize_exercise_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize exercise templates for different topics and difficulties."""
        return {
            'variables': {
                'beginner': {
                    'title': 'Variable Basics',
                    'description': 'Learn to create and use variables',
                    'instructions': 'Create variables to store different types of data',
                    'starter_code': '# Create your variables here\n',
                    'concepts': ['variable_declaration', 'data_types']
                },
                'intermediate': {
                    'title': 'Variable Manipulation',
                    'description': 'Practice advanced variable operations',
                    'instructions': 'Manipulate variables using various operations',
                    'starter_code': '# Perform variable operations here\n',
                    'concepts': ['variable_operations', 'type_conversion']
                }
            },
            'functions': {
                'beginner': {
                    'title': 'Function Basics',
                    'description': 'Learn to define and call functions',
                    'instructions': 'Create a simple function that takes parameters',
                    'starter_code': 'def my_function():\n    # Your code here\n    pass\n',
                    'concepts': ['function_definition', 'parameters', 'return_values']
                },
                'intermediate': {
                    'title': 'Function Design',
                    'description': 'Design functions with multiple parameters and return values',
                    'instructions': 'Create functions that solve specific problems',
                    'starter_code': '# Define your functions here\n',
                    'concepts': ['function_design', 'parameter_handling', 'error_handling']
                }
            },
            'loops': {
                'beginner': {
                    'title': 'Loop Fundamentals',
                    'description': 'Learn basic loop structures',
                    'instructions': 'Use loops to repeat operations',
                    'starter_code': '# Write your loop here\n',
                    'concepts': ['for_loops', 'while_loops', 'iteration']
                },
                'intermediate': {
                    'title': 'Advanced Looping',
                    'description': 'Master complex loop patterns',
                    'instructions': 'Implement nested loops and loop control',
                    'starter_code': '# Implement advanced loops here\n',
                    'concepts': ['nested_loops', 'loop_control', 'break_continue']
                }
            }
        }
    
    def _get_exercise_template(self, topic: str, difficulty: str, language: str) -> Dict[str, Any]:
        """Get exercise template for topic and difficulty."""
        topic_templates = self.exercise_templates.get(topic.lower(), {})
        
        # Try exact difficulty match first
        if difficulty in topic_templates:
            template = topic_templates[difficulty].copy()
        else:
            # Fall back to closest difficulty
            available_difficulties = list(topic_templates.keys())
            if available_difficulties:
                fallback_difficulty = available_difficulties[0]
                template = topic_templates[fallback_difficulty].copy()
            else:
                # Create generic template
                template = self._create_generic_template(topic, difficulty)
        
        return template
    
    def _create_generic_template(self, topic: str, difficulty: str) -> Dict[str, Any]:
        """Create a generic exercise template."""
        return {
            'title': f"{topic.title()} Exercise",
            'description': f"Practice {topic} concepts",
            'instructions': f"Complete the {topic} exercise according to the requirements",
            'starter_code': '# Your code here\n',
            'concepts': [topic]
        }
    
    def _customize_exercise_template(self, template: Dict[str, Any], context: LearningContext) -> Dict[str, Any]:
        """Customize exercise template based on learner context."""
        customized = template.copy()
        
        # Add context-specific elements
        if context.learning_goals:
            # Incorporate learning goals into description
            goals_text = ", ".join(context.learning_goals[:3])
            customized['description'] += f" This exercise aligns with your goals: {goals_text}."
        
        # Adjust complexity based on attempt count
        if context.attempt_count > 2:
            customized['instructions'] += "\n\nTake your time and break the problem into smaller steps."
            customized['difficulty_adjusted'] = True
        
        return customized
    
    def _add_language_specific_elements(self, exercise: Dict[str, Any], language: str) -> Dict[str, Any]:
        """Add language-specific elements to exercise."""
        language_specifics = {
            'python': {
                'file_extension': '.py',
                'comment_style': '#',
                'common_imports': ['import math', 'import random']
            },
            'javascript': {
                'file_extension': '.js',
                'comment_style': '//',
                'common_imports': ['// No imports needed for basic exercises']
            },
            'java': {
                'file_extension': '.java',
                'comment_style': '//',
                'common_imports': ['import java.util.*;']
            }
        }
        
        lang_info = language_specifics.get(language, language_specifics['python'])
        exercise['language_info'] = lang_info
        
        return exercise
    
    async def _create_test_cases_for_exercise(self, exercise_data: Dict[str, Any], context: LearningContext) -> List[Dict[str, Any]]:
        """Create test cases for an exercise."""
        difficulty = exercise_data.get('difficulty', 'intermediate')
        topic = exercise_data.get('topic', 'general')
        
        # Get number of test cases based on difficulty
        num_test_cases = self.difficulty_rules.get(difficulty, {}).get('test_cases', 5)
        
        # Generate test cases based on topic
        test_cases = []
        
        if topic == 'variables':
            test_cases = self._generate_variable_test_cases(num_test_cases)
        elif topic == 'functions':
            test_cases = self._generate_function_test_cases(num_test_cases)
        elif topic == 'loops':
            test_cases = self._generate_loop_test_cases(num_test_cases)
        else:
            test_cases = self._generate_generic_test_cases(num_test_cases, topic)
        
        return test_cases
    
    async def _create_test_cases_for_code(self, code: str, language: str, context: LearningContext) -> List[Dict[str, Any]]:
        """Create test cases for existing code."""
        # Use code analysis MCP if available
        if self.code_analysis_mcp:
            try:
                analysis = await self.code_analysis_mcp.analyze_code_complexity(code, language)
                topics = analysis.topics_covered
                
                # Generate test cases based on detected topics
                test_cases = []
                for topic in topics[:3]:  # Limit to top 3 topics
                    topic_tests = self._generate_topic_specific_test_cases(topic, 2)
                    test_cases.extend(topic_tests)
                
                return test_cases
            except Exception as e:
                self.logger.log_warning(f"Code analysis failed, using generic test cases: {e}")
        
        # Fallback to generic test cases
        return self._generate_generic_test_cases(5, 'general')
    
    def _generate_variable_test_cases(self, num_cases: int) -> List[Dict[str, Any]]:
        """Generate test cases for variable exercises."""
        test_cases = [
            {
                'name': 'test_string_variable',
                'input': '',
                'expected_output': 'Hello, World!',
                'description': 'Test string variable creation'
            },
            {
                'name': 'test_number_variable',
                'input': '',
                'expected_output': '42',
                'description': 'Test number variable creation'
            },
            {
                'name': 'test_boolean_variable',
                'input': '',
                'expected_output': 'True',
                'description': 'Test boolean variable creation'
            }
        ]
        
        return test_cases[:num_cases]
    
    def _generate_function_test_cases(self, num_cases: int) -> List[Dict[str, Any]]:
        """Generate test cases for function exercises."""
        test_cases = [
            {
                'name': 'test_function_call',
                'input': '5',
                'expected_output': '10',
                'description': 'Test function with parameter'
            },
            {
                'name': 'test_function_return',
                'input': '3, 4',
                'expected_output': '7',
                'description': 'Test function return value'
            },
            {
                'name': 'test_function_edge_case',
                'input': '0',
                'expected_output': '0',
                'description': 'Test function edge case'
            }
        ]
        
        return test_cases[:num_cases]
    
    def _generate_loop_test_cases(self, num_cases: int) -> List[Dict[str, Any]]:
        """Generate test cases for loop exercises."""
        test_cases = [
            {
                'name': 'test_loop_iteration',
                'input': '5',
                'expected_output': '0 1 2 3 4',
                'description': 'Test loop iteration'
            },
            {
                'name': 'test_loop_sum',
                'input': '10',
                'expected_output': '55',
                'description': 'Test loop accumulation'
            },
            {
                'name': 'test_empty_loop',
                'input': '0',
                'expected_output': '',
                'description': 'Test empty loop case'
            }
        ]
        
        return test_cases[:num_cases]
    
    def _generate_generic_test_cases(self, num_cases: int, topic: str) -> List[Dict[str, Any]]:
        """Generate generic test cases."""
        test_cases = []
        
        for i in range(num_cases):
            test_cases.append({
                'name': f'test_{topic}_{i+1}',
                'input': f'test_input_{i+1}',
                'expected_output': f'expected_output_{i+1}',
                'description': f'Test case {i+1} for {topic}'
            })
        
        return test_cases
    
    def _generate_topic_specific_test_cases(self, topic: str, num_cases: int) -> List[Dict[str, Any]]:
        """Generate test cases for a specific topic."""
        if topic == 'functions':
            return self._generate_function_test_cases(num_cases)
        elif topic == 'loops':
            return self._generate_loop_test_cases(num_cases)
        elif topic == 'variables':
            return self._generate_variable_test_cases(num_cases)
        else:
            return self._generate_generic_test_cases(num_cases, topic)
    
    async def _generate_hints_for_exercise(self, 
                                         exercise_data: Dict[str, Any], 
                                         context: LearningContext,
                                         hint_level: int = 1) -> List[str]:
        """Generate hints for an exercise using LLM with template fallback."""
        topic = exercise_data.get('topic', 'general')
        difficulty = exercise_data.get('difficulty', 'intermediate')
        
        # Try LLM-powered hint generation
        if self.llm_service and hint_level > 1:
            try:
                llm_hints = await self.llm_service.generate_hints(
                    exercise=exercise_data,
                    attempt_count=context.attempt_count
                )
                if llm_hints and len(llm_hints) > 0:
                    return llm_hints[:hint_level]
            except Exception as e:
                self.logger.log_warning(f"LLM hint generation failed: {e}")
        
        # Fallback to template-based hints
        hint_templates = {
            'variables': [
                "Think about what type of data you need to store",
                "Remember to give your variables descriptive names",
                "Consider the operations you need to perform on the data"
            ],
            'functions': [
                "Break down the problem into smaller steps",
                "Think about what inputs your function needs",
                "Consider what your function should return"
            ],
            'loops': [
                "Identify what needs to be repeated",
                "Think about your loop condition",
                "Consider what happens in each iteration"
            ]
        }
        
        base_hints = hint_templates.get(topic, [
            "Read the problem carefully",
            "Break the problem into smaller parts",
            "Test your solution with simple examples"
        ])
        
        # Adjust hints based on level
        if hint_level == 1:
            return base_hints[:1]
        elif hint_level == 2:
            return base_hints[:2]
        else:
            return base_hints
    
    def _determine_adaptation_direction(self, performance_data: Dict[str, Any], context: LearningContext) -> str:
        """Determine whether to increase or decrease difficulty."""
        if not performance_data:
            performance_data = {}
        
        # Check consecutive failures from context
        if context.attempt_count >= 2 and context.last_feedback and not context.last_feedback.get('passed'):
            return 'down'
        
        # Check if exercise was completed too quickly/easily
        completion_time = performance_data.get('completion_time_minutes', 0)
        estimated_time = performance_data.get('estimated_time_minutes', 30)
        
        if completion_time > 0 and completion_time < estimated_time * 0.5:
            return 'up'
        
        return 'maintain'
    
    async def _create_adapted_exercise(self, 
                                     current_exercise: Dict[str, Any], 
                                     direction: str, 
                                     context: LearningContext) -> Dict[str, Any]:
        """Create an adapted version of the current exercise."""
        if direction == 'maintain':
            return current_exercise
        
        topic = current_exercise.get('topic', 'general')
        current_difficulty = current_exercise.get('difficulty', 'intermediate')
        language = current_exercise.get('language', 'python')
        
        # Adjust difficulty
        if direction == 'up':
            new_difficulty = self._get_next_difficulty_level(current_difficulty)
        else:  # direction == 'down'
            new_difficulty = self._get_previous_difficulty_level(current_difficulty)
        
        # Generate new exercise with adjusted difficulty
        adapted_exercise = await self._generate_coding_exercise(topic, new_difficulty, language, context)
        
        # Add difficulty field and mark as adapted
        adapted_exercise['difficulty'] = new_difficulty
        adapted_exercise['topic'] = topic
        adapted_exercise['language'] = language
        adapted_exercise['adapted_from'] = current_exercise.get('id')
        adapted_exercise['adaptation_direction'] = direction
        
        return adapted_exercise
    
    def _get_next_difficulty_level(self, current_level: str) -> str:
        """Get the next higher difficulty level."""
        levels = ['beginner', 'intermediate', 'advanced', 'expert']
        try:
            current_index = levels.index(current_level.lower())
            return levels[min(current_index + 1, len(levels) - 1)]
        except ValueError:
            return 'intermediate'
    
    def _get_previous_difficulty_level(self, current_level: str) -> str:
        """Get the next lower difficulty level."""
        levels = ['beginner', 'intermediate', 'advanced', 'expert']
        try:
            current_index = levels.index(current_level.lower())
            return levels[max(current_index - 1, 0)]
        except ValueError:
            return 'beginner'
    
    async def _generate_recap_exercise_content(self, 
                                             topics: List[str], 
                                             difficulty: str, 
                                             context: LearningContext) -> Dict[str, Any]:
        """Generate content for a recap exercise covering multiple topics."""
        # Combine elements from multiple topics
        combined_exercise = {
            'title': f"Recap: {', '.join(topics)}",
            'description': f"This exercise combines concepts from: {', '.join(topics)}",
            'instructions': "Complete the exercise using concepts from all covered topics.",
            'starter_code': '# Combine multiple concepts here\n',
            'concepts': topics,
            'difficulty': difficulty
        }
        
        # Add topic-specific requirements
        requirements = []
        for topic in topics:
            if topic == 'variables':
                requirements.append("Use appropriate variable names and types")
            elif topic == 'functions':
                requirements.append("Define and use at least one function")
            elif topic == 'loops':
                requirements.append("Use a loop to process data")
        
        combined_exercise['requirements'] = requirements
        
        return combined_exercise
    
    def _get_project_template(self, topic: str, difficulty: str, language: str) -> Dict[str, Any]:
        """Get project template for topic and difficulty."""
        project_templates = {
            'functions': {
                'intermediate': {
                    'title': 'Calculator Project',
                    'description': 'Build a calculator with multiple functions',
                    'instructions': 'Create a calculator that can perform basic arithmetic operations',
                    'requirements': [
                        'Implement addition, subtraction, multiplication, and division functions',
                        'Handle division by zero errors',
                        'Provide a user interface for input'
                    ],
                    'deliverables': [
                        'Calculator module with all functions',
                        'Test cases for each function',
                        'User interface (console or GUI)'
                    ]
                }
            },
            'loops': {
                'intermediate': {
                    'title': 'Data Analysis Project',
                    'description': 'Analyze a dataset using loops and conditionals',
                    'instructions': 'Process data to find patterns and statistics',
                    'requirements': [
                        'Read data from a file or list',
                        'Calculate basic statistics (mean, max, min)',
                        'Find patterns in the data'
                    ],
                    'deliverables': [
                        'Data processing script',
                        'Analysis results',
                        'Summary report'
                    ]
                }
            }
        }
        
        topic_projects = project_templates.get(topic, {})
        if difficulty in topic_projects:
            return topic_projects[difficulty]
        
        # Generic project template
        return {
            'title': f"{topic.title()} Project",
            'description': f"A comprehensive project focusing on {topic}",
            'instructions': f"Build a project that demonstrates mastery of {topic} concepts",
            'requirements': [f"Use {topic} concepts effectively", "Write clean, readable code"],
            'deliverables': ["Working code", "Documentation", "Test cases"]
        }
    
    def _generate_project_milestones(self, project_data: Dict[str, Any], duration_hours: int) -> List[Dict[str, Any]]:
        """Generate milestones for a project."""
        milestones = []
        
        # Basic milestone structure
        milestone_templates = [
            {
                'name': 'Planning and Setup',
                'description': 'Plan the project structure and set up the development environment',
                'estimated_hours': duration_hours * 0.2,
                'deliverables': ['Project plan', 'Code structure']
            },
            {
                'name': 'Core Implementation',
                'description': 'Implement the main functionality',
                'estimated_hours': duration_hours * 0.5,
                'deliverables': ['Core features', 'Basic functionality']
            },
            {
                'name': 'Testing and Refinement',
                'description': 'Test the implementation and refine the code',
                'estimated_hours': duration_hours * 0.2,
                'deliverables': ['Test cases', 'Bug fixes']
            },
            {
                'name': 'Documentation and Submission',
                'description': 'Document the project and prepare for submission',
                'estimated_hours': duration_hours * 0.1,
                'deliverables': ['Documentation', 'Final submission']
            }
        ]
        
        return milestone_templates
    
    def _generate_quiz_questions(self, topic: str, difficulty: str) -> List[Dict[str, Any]]:
        """Generate quiz questions for a topic."""
        question_templates = {
            'variables': [
                {
                    'question': 'What is the correct way to declare a variable in Python?',
                    'type': 'multiple_choice',
                    'options': ['var x = 5', 'x = 5', 'int x = 5', 'declare x = 5'],
                    'correct_answer': 'x = 5',
                    'explanation': 'Python uses simple assignment to declare variables'
                },
                {
                    'question': 'What data type is the value "Hello"?',
                    'type': 'multiple_choice',
                    'options': ['int', 'float', 'str', 'bool'],
                    'correct_answer': 'str',
                    'explanation': 'Text values in quotes are strings'
                }
            ],
            'functions': [
                {
                    'question': 'What keyword is used to define a function in Python?',
                    'type': 'multiple_choice',
                    'options': ['function', 'def', 'func', 'define'],
                    'correct_answer': 'def',
                    'explanation': 'The def keyword is used to define functions in Python'
                }
            ]
        }
        
        return question_templates.get(topic, [
            {
                'question': f'What is an important concept in {topic}?',
                'type': 'open_ended',
                'correct_answer': f'Key concepts in {topic}',
                'explanation': f'This tests understanding of {topic}'
            }
        ])
    
    def _estimate_completion_time(self, exercise_data: Dict[str, Any], difficulty: str) -> int:
        """Estimate completion time for an exercise."""
        base_times = {
            'beginner': 15,
            'intermediate': 30,
            'advanced': 60,
            'expert': 120
        }
        
        base_time = base_times.get(difficulty, 30)
        
        # Adjust based on exercise complexity
        if exercise_data.get('exercise_type') == 'project':
            base_time *= 4
        elif len(exercise_data.get('requirements', [])) > 3:
            base_time *= 1.5
        
        return base_time
    
    async def _handle_timeout_fallback(self, 
                                     context: LearningContext, 
                                     payload: Dict[str, Any]) -> Optional[AgentResult]:
        """Handle timeout with simplified exercise generation."""
        intent = payload.get('intent')
        
        if intent == 'generate_exercise':
            # Return simple exercise
            topic = payload.get('topic', 'basic_programming')
            return AgentResult.success_result(
                data={
                    'id': str(uuid4()),
                    'title': f"Simple {topic} Exercise",
                    'description': f"A basic exercise for {topic}",
                    'instructions': "Complete the exercise to the best of your ability",
                    'starter_code': '# Your code here\n',
                    'test_cases': [],
                    'hints': ["Take your time and think through the problem"],
                    'difficulty': 'beginner',
                    'estimated_time_minutes': 15
                },
                metadata={'fallback': True, 'reason': 'timeout'}
            )
        
        return None