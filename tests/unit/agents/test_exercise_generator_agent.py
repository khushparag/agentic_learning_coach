"""
Unit tests for ExerciseGeneratorAgent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from src.agents.exercise_generator_agent import ExerciseGeneratorAgent
from src.agents.base.types import AgentType, LearningContext, AgentResult
from src.ports.services.mcp_tools import ICodeAnalysisMCP, DifficultyLevel


class TestExerciseGeneratorAgent:
    """Test cases for ExerciseGeneratorAgent."""
    
    @pytest.fixture
    def mock_code_analysis_mcp(self):
        """Create mock code analysis MCP."""
        mock = AsyncMock(spec=ICodeAnalysisMCP)
        return mock
    
    @pytest.fixture
    def exercise_generator_agent(self, mock_code_analysis_mcp):
        """Create ExerciseGeneratorAgent instance for testing."""
        return ExerciseGeneratorAgent(mock_code_analysis_mcp)
    
    @pytest.fixture
    def learning_context(self):
        """Create learning context for testing."""
        return LearningContext(
            user_id="test-user-123",
            session_id="test-session-456",
            current_objective="python functions",
            skill_level="intermediate",
            learning_goals=["python", "programming fundamentals"],
            attempt_count=1,
            correlation_id="test-correlation-789"
        )
    
    def test_agent_initialization(self, exercise_generator_agent, mock_code_analysis_mcp):
        """Test agent initialization."""
        assert exercise_generator_agent.agent_type == AgentType.EXERCISE_GENERATOR
        assert exercise_generator_agent.code_analysis_mcp == mock_code_analysis_mcp
        
        supported_intents = exercise_generator_agent.get_supported_intents()
        expected_intents = [
            'generate_exercise',
            'create_test_cases',
            'generate_hints',
            'adapt_difficulty',
            'create_stretch_exercise',
            'create_recap_exercise',
            'generate_project_exercise'
        ]
        
        for intent in expected_intents:
            assert intent in supported_intents
    
    @pytest.mark.asyncio
    async def test_generate_coding_exercise_success(self, exercise_generator_agent, learning_context):
        """Test successful coding exercise generation."""
        payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python',
            'exercise_type': 'coding'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'id' in result.data
        assert 'title' in result.data
        assert 'description' in result.data
        assert 'instructions' in result.data
        assert 'test_cases' in result.data
        assert 'hints' in result.data
        assert result.data['topic'] == 'functions'
        assert result.data['difficulty'] == 'intermediate'
        assert result.data['language'] == 'python'
        assert result.data['exercise_type'] == 'coding'
        assert result.data['estimated_time_minutes'] > 0
        
        # Should have next actions
        assert 'submit_solution' in result.next_actions
    
    @pytest.mark.asyncio
    async def test_generate_quiz_exercise_success(self, exercise_generator_agent, learning_context):
        """Test successful quiz exercise generation."""
        payload = {
            'intent': 'generate_exercise',
            'topic': 'variables',
            'difficulty': 'beginner',
            'exercise_type': 'quiz'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['exercise_type'] == 'quiz'
        assert 'questions' in result.data
        assert 'total_points' in result.data
        assert isinstance(result.data['questions'], list)
    
    @pytest.mark.asyncio
    async def test_generate_project_exercise_success(self, exercise_generator_agent, learning_context):
        """Test successful project exercise generation."""
        payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'difficulty': 'advanced',
            'language': 'python',
            'exercise_type': 'project'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['exercise_type'] == 'project'
        assert 'requirements' in result.data
        assert 'deliverables' in result.data
        assert isinstance(result.data['requirements'], list)
        assert isinstance(result.data['deliverables'], list)
    
    @pytest.mark.asyncio
    async def test_generate_exercise_missing_topic(self, exercise_generator_agent):
        """Test exercise generation with missing topic."""
        context = LearningContext(
            user_id="test-user",
            session_id="test-session"
            # No current_objective
        )
        
        payload = {
            'intent': 'generate_exercise'
            # No topic specified
        }
        
        # Act
        result = await exercise_generator_agent.process(context, payload)
        
        # Assert
        assert not result.success
        assert "topic is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_generate_exercise_uses_context_objective(self, exercise_generator_agent, learning_context):
        """Test exercise generation using context objective when no topic specified."""
        payload = {
            'intent': 'generate_exercise'
            # No topic, should use context.current_objective
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['topic'] == learning_context.current_objective
    
    @pytest.mark.asyncio
    async def test_generate_exercise_unsupported_type(self, exercise_generator_agent, learning_context):
        """Test exercise generation with unsupported exercise type."""
        payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'exercise_type': 'unsupported_type'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "unsupported exercise type" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_create_test_cases_for_exercise(self, exercise_generator_agent, learning_context):
        """Test test case creation for an exercise."""
        exercise_data = {
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python'
        }
        
        payload = {
            'intent': 'create_test_cases',
            'exercise': exercise_data
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'test_cases' in result.data
        assert isinstance(result.data['test_cases'], list)
        assert len(result.data['test_cases']) > 0
        
        # Check test case structure
        test_case = result.data['test_cases'][0]
        assert 'name' in test_case
        assert 'input' in test_case
        assert 'expected_output' in test_case
        assert 'description' in test_case
    
    @pytest.mark.asyncio
    async def test_create_test_cases_for_code(self, exercise_generator_agent, learning_context, mock_code_analysis_mcp):
        """Test test case creation for existing code."""
        code = """
def add_numbers(a, b):
    return a + b
"""
        
        # Mock code analysis
        mock_analysis = MagicMock()
        mock_analysis.topics_covered = ['functions', 'arithmetic']
        mock_code_analysis_mcp.analyze_code_complexity.return_value = mock_analysis
        
        payload = {
            'intent': 'create_test_cases',
            'code': code,
            'language': 'python'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'test_cases' in result.data
        mock_code_analysis_mcp.analyze_code_complexity.assert_called_once_with(code, 'python')
    
    @pytest.mark.asyncio
    async def test_create_test_cases_missing_data(self, exercise_generator_agent, learning_context):
        """Test test case creation with missing data."""
        payload = {
            'intent': 'create_test_cases'
            # Missing both exercise and code
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "exercise data or code is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_generate_hints_success(self, exercise_generator_agent, learning_context):
        """Test successful hint generation."""
        exercise_data = {
            'topic': 'functions',
            'difficulty': 'beginner'
        }
        
        payload = {
            'intent': 'generate_hints',
            'exercise': exercise_data,
            'hint_level': 2
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'hints' in result.data
        assert 'hint_level' in result.data
        assert result.data['hint_level'] == 2
        assert isinstance(result.data['hints'], list)
        assert len(result.data['hints']) > 0
    
    @pytest.mark.asyncio
    async def test_generate_hints_missing_exercise(self, exercise_generator_agent, learning_context):
        """Test hint generation with missing exercise data."""
        payload = {
            'intent': 'generate_hints'
            # Missing exercise data
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "exercise data is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_adapt_difficulty_up(self, exercise_generator_agent, learning_context):
        """Test difficulty adaptation upward."""
        current_exercise = {
            'id': str(uuid4()),
            'topic': 'functions',
            'difficulty': 'beginner',
            'language': 'python'
        }
        
        performance_data = {
            'completion_time_minutes': 5,
            'estimated_time_minutes': 20
        }
        
        payload = {
            'intent': 'adapt_difficulty',
            'current_exercise': current_exercise,
            'performance_data': performance_data,
            'direction': 'up'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['difficulty'] == 'intermediate'  # Should increase from beginner
        assert result.metadata['adaptation_direction'] == 'up'
        assert result.metadata['original_difficulty'] == 'beginner'
        assert result.metadata['new_difficulty'] == 'intermediate'
    
    @pytest.mark.asyncio
    async def test_adapt_difficulty_down(self, exercise_generator_agent, learning_context):
        """Test difficulty adaptation downward."""
        current_exercise = {
            'id': str(uuid4()),
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python'
        }
        
        # Context with multiple failures
        context_with_failures = LearningContext(
            user_id=learning_context.user_id,
            session_id=learning_context.session_id,
            current_objective=learning_context.current_objective,
            skill_level=learning_context.skill_level,
            learning_goals=learning_context.learning_goals,
            attempt_count=3,
            last_feedback={'passed': False}
        )
        
        payload = {
            'intent': 'adapt_difficulty',
            'current_exercise': current_exercise,
            'direction': 'down'
        }
        
        # Act
        result = await exercise_generator_agent.process(context_with_failures, payload)
        
        # Assert
        assert result.success
        assert result.data['difficulty'] == 'beginner'  # Should decrease from intermediate
        assert result.metadata['adaptation_direction'] == 'down'
    
    @pytest.mark.asyncio
    async def test_adapt_difficulty_auto_down(self, exercise_generator_agent):
        """Test automatic difficulty adaptation downward based on performance."""
        context_with_failures = LearningContext(
            user_id="test-user",
            session_id="test-session",
            current_objective="functions",
            attempt_count=3,
            last_feedback={'passed': False}
        )
        
        current_exercise = {
            'topic': 'functions',
            'difficulty': 'intermediate'
        }
        
        payload = {
            'intent': 'adapt_difficulty',
            'current_exercise': current_exercise,
            'direction': 'auto'
        }
        
        # Act
        result = await exercise_generator_agent.process(context_with_failures, payload)
        
        # Assert
        assert result.success
        assert result.metadata['adaptation_direction'] == 'down'
    
    @pytest.mark.asyncio
    async def test_create_stretch_exercise_success(self, exercise_generator_agent, learning_context):
        """Test stretch exercise creation."""
        payload = {
            'intent': 'create_stretch_exercise',
            'topic': 'functions',
            'current_difficulty': 'intermediate',
            'language': 'python'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['is_stretch'] == True
        assert result.data['base_difficulty'] == 'intermediate'
        assert result.data['difficulty'] == 'advanced'  # Should be increased
        assert 'Stretch Challenge:' in result.data['title']
        assert result.metadata['exercise_type'] == 'stretch'
    
    @pytest.mark.asyncio
    async def test_create_recap_exercise_success(self, exercise_generator_agent, learning_context):
        """Test recap exercise creation."""
        topics = ['functions', 'loops', 'conditionals']
        
        payload = {
            'intent': 'create_recap_exercise',
            'topics': topics,
            'difficulty': 'beginner'
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['is_recap'] == True
        assert result.data['topics_covered'] == topics
        assert 'Recap:' in result.data['title']
        assert result.metadata['exercise_type'] == 'recap'
        assert result.metadata['topics_covered'] == topics
    
    @pytest.mark.asyncio
    async def test_generate_project_exercise_success(self, exercise_generator_agent, learning_context):
        """Test project exercise generation."""
        payload = {
            'intent': 'generate_project_exercise',
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python',
            'duration_hours': 6
        }
        
        # Act
        result = await exercise_generator_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['exercise_type'] == 'project'
        assert result.data['estimated_hours'] == 6
        assert 'milestones' in result.data
        assert isinstance(result.data['milestones'], list)
        assert len(result.data['milestones']) > 0
        
        # Check milestone structure
        milestone = result.data['milestones'][0]
        assert 'name' in milestone
        assert 'description' in milestone
        assert 'estimated_hours' in milestone
        assert 'deliverables' in milestone
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, exercise_generator_agent, learning_context):
        """Test handling of unsupported intent."""
        payload = {
            'intent': 'unsupported_intent'
        }
        
        # Act & Assert
        with pytest.raises(Exception):  # Should raise ValidationError
            await exercise_generator_agent.process(learning_context, payload)
    
    def test_get_exercise_template(self, exercise_generator_agent):
        """Test exercise template retrieval."""
        # Test existing template
        template = exercise_generator_agent._get_exercise_template('functions', 'beginner', 'python')
        assert 'title' in template
        assert 'description' in template
        assert 'instructions' in template
        
        # Test non-existing template (should create generic)
        template = exercise_generator_agent._get_exercise_template('nonexistent', 'beginner', 'python')
        assert 'title' in template
        assert 'Nonexistent Exercise' in template['title']
    
    def test_customize_exercise_template(self, exercise_generator_agent, learning_context):
        """Test exercise template customization."""
        template = {
            'title': 'Test Exercise',
            'description': 'Basic description',
            'instructions': 'Do something'
        }
        
        # Act
        customized = exercise_generator_agent._customize_exercise_template(template, learning_context)
        
        # Assert
        assert customized['title'] == template['title']
        # Should add learning goals to description
        assert 'python' in customized['description'] or 'programming fundamentals' in customized['description']
    
    def test_customize_exercise_template_with_failures(self, exercise_generator_agent):
        """Test template customization with multiple failures."""
        context_with_failures = LearningContext(
            user_id="test-user",
            session_id="test-session",
            attempt_count=3
        )
        
        template = {
            'title': 'Test Exercise',
            'description': 'Basic description',
            'instructions': 'Do something'
        }
        
        # Act
        customized = exercise_generator_agent._customize_exercise_template(template, context_with_failures)
        
        # Assert
        assert customized['difficulty_adjusted'] == True
        assert 'Take your time' in customized['instructions']
    
    def test_add_language_specific_elements(self, exercise_generator_agent):
        """Test adding language-specific elements."""
        exercise = {
            'title': 'Test Exercise',
            'description': 'Test description'
        }
        
        # Test Python
        python_exercise = exercise_generator_agent._add_language_specific_elements(exercise, 'python')
        assert python_exercise['language_info']['file_extension'] == '.py'
        assert python_exercise['language_info']['comment_style'] == '#'
        
        # Test JavaScript
        js_exercise = exercise_generator_agent._add_language_specific_elements(exercise, 'javascript')
        assert js_exercise['language_info']['file_extension'] == '.js'
        assert js_exercise['language_info']['comment_style'] == '//'
    
    def test_generate_variable_test_cases(self, exercise_generator_agent):
        """Test variable exercise test case generation."""
        test_cases = exercise_generator_agent._generate_variable_test_cases(3)
        
        assert len(test_cases) == 3
        for test_case in test_cases:
            assert 'name' in test_case
            assert 'expected_output' in test_case
            assert 'description' in test_case
    
    def test_generate_function_test_cases(self, exercise_generator_agent):
        """Test function exercise test case generation."""
        test_cases = exercise_generator_agent._generate_function_test_cases(2)
        
        assert len(test_cases) == 2
        for test_case in test_cases:
            assert 'name' in test_case
            assert 'input' in test_case
            assert 'expected_output' in test_case
    
    def test_generate_loop_test_cases(self, exercise_generator_agent):
        """Test loop exercise test case generation."""
        test_cases = exercise_generator_agent._generate_loop_test_cases(2)
        
        assert len(test_cases) == 2
        for test_case in test_cases:
            assert 'name' in test_case
            assert 'input' in test_case
            assert 'expected_output' in test_case
    
    def test_get_next_difficulty_level(self, exercise_generator_agent):
        """Test difficulty level progression."""
        assert exercise_generator_agent._get_next_difficulty_level('beginner') == 'intermediate'
        assert exercise_generator_agent._get_next_difficulty_level('intermediate') == 'advanced'
        assert exercise_generator_agent._get_next_difficulty_level('advanced') == 'expert'
        assert exercise_generator_agent._get_next_difficulty_level('expert') == 'expert'  # Max level
        assert exercise_generator_agent._get_next_difficulty_level('invalid') == 'intermediate'  # Default
    
    def test_get_previous_difficulty_level(self, exercise_generator_agent):
        """Test difficulty level regression."""
        assert exercise_generator_agent._get_previous_difficulty_level('expert') == 'advanced'
        assert exercise_generator_agent._get_previous_difficulty_level('advanced') == 'intermediate'
        assert exercise_generator_agent._get_previous_difficulty_level('intermediate') == 'beginner'
        assert exercise_generator_agent._get_previous_difficulty_level('beginner') == 'beginner'  # Min level
        assert exercise_generator_agent._get_previous_difficulty_level('invalid') == 'beginner'  # Default
    
    def test_determine_adaptation_direction(self, exercise_generator_agent):
        """Test adaptation direction determination."""
        # Test with consecutive failures
        context_with_failures = LearningContext(
            user_id="test",
            session_id="test",
            attempt_count=3,
            last_feedback={'passed': False}
        )
        
        direction = exercise_generator_agent._determine_adaptation_direction({}, context_with_failures)
        assert direction == 'down'
        
        # Test with quick completion
        performance_data = {
            'completion_time_minutes': 5,
            'estimated_time_minutes': 20
        }
        
        context_success = LearningContext(
            user_id="test",
            session_id="test",
            attempt_count=1
        )
        
        direction = exercise_generator_agent._determine_adaptation_direction(performance_data, context_success)
        assert direction == 'up'
        
        # Test maintain
        normal_performance = {
            'completion_time_minutes': 15,
            'estimated_time_minutes': 20
        }
        
        direction = exercise_generator_agent._determine_adaptation_direction(normal_performance, context_success)
        assert direction == 'maintain'
    
    def test_estimate_completion_time(self, exercise_generator_agent):
        """Test completion time estimation."""
        # Simple exercise
        simple_exercise = {
            'exercise_type': 'coding',
            'requirements': ['basic requirement']
        }
        
        time = exercise_generator_agent._estimate_completion_time(simple_exercise, 'beginner')
        assert time == 15  # Base time for beginner
        
        # Complex exercise
        complex_exercise = {
            'exercise_type': 'coding',
            'requirements': ['req1', 'req2', 'req3', 'req4']  # More than 3 requirements
        }
        
        time = exercise_generator_agent._estimate_completion_time(complex_exercise, 'intermediate')
        assert time == 45  # 30 * 1.5 for complexity
        
        # Project exercise
        project_exercise = {
            'exercise_type': 'project'
        }
        
        time = exercise_generator_agent._estimate_completion_time(project_exercise, 'advanced')
        assert time == 240  # 60 * 4 for project type
    
    def test_generate_quiz_questions(self, exercise_generator_agent):
        """Test quiz question generation."""
        # Test variables topic
        questions = exercise_generator_agent._generate_quiz_questions('variables', 'beginner')
        assert len(questions) > 0
        
        question = questions[0]
        assert 'question' in question
        assert 'type' in question
        assert 'correct_answer' in question
        
        # Test functions topic
        questions = exercise_generator_agent._generate_quiz_questions('functions', 'intermediate')
        assert len(questions) > 0
        
        # Test unknown topic
        questions = exercise_generator_agent._generate_quiz_questions('unknown_topic', 'beginner')
        assert len(questions) > 0  # Should return generic questions
    
    def test_get_project_template(self, exercise_generator_agent):
        """Test project template retrieval."""
        # Test existing template
        template = exercise_generator_agent._get_project_template('functions', 'intermediate', 'python')
        assert 'title' in template
        assert 'requirements' in template
        assert 'deliverables' in template
        
        # Test non-existing template
        template = exercise_generator_agent._get_project_template('unknown', 'beginner', 'python')
        assert 'title' in template
        assert 'Unknown Project' in template['title']
    
    def test_generate_project_milestones(self, exercise_generator_agent):
        """Test project milestone generation."""
        project_data = {
            'title': 'Test Project',
            'requirements': ['req1', 'req2']
        }
        
        milestones = exercise_generator_agent._generate_project_milestones(project_data, 8)
        
        assert len(milestones) == 4  # Standard milestone structure
        
        # Check milestone structure
        for milestone in milestones:
            assert 'name' in milestone
            assert 'description' in milestone
            assert 'estimated_hours' in milestone
            assert 'deliverables' in milestone
        
        # Check total hours allocation
        total_hours = sum(m['estimated_hours'] for m in milestones)
        assert abs(total_hours - 8) < 0.1  # Should approximately equal duration
    
    @pytest.mark.asyncio
    async def test_timeout_fallback(self, exercise_generator_agent, learning_context):
        """Test timeout fallback behavior."""
        payload = {
            'intent': 'generate_exercise',
            'topic': 'test_topic'
        }
        
        # Act
        result = await exercise_generator_agent._handle_timeout_fallback(learning_context, payload)
        
        # Assert
        assert result is not None
        assert result.success
        assert result.metadata['fallback'] == True
        assert result.metadata['reason'] == 'timeout'
        assert 'Simple test_topic Exercise' in result.data['title']