"""
Unit tests for ReviewerAgent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from src.agents.reviewer_agent import ReviewerAgent
from src.agents.base.types import AgentType, LearningContext, AgentResult
from src.ports.services.code_execution_service import ICodeExecutionService
from src.ports.repositories.submission_repository import ISubmissionRepository
from src.domain.entities.code_execution import (
    CodeExecutionResult, ExecutionStatus, TestResult, ResourceUsage, 
    SecurityViolation, ProgrammingLanguage
)
from src.domain.entities.submission import Submission
from src.domain.entities.evaluation_result import EvaluationResult


class TestReviewerAgent:
    """Test cases for ReviewerAgent."""
    
    @pytest.fixture
    def mock_code_execution_service(self):
        """Create mock code execution service."""
        mock = AsyncMock(spec=ICodeExecutionService)
        return mock
    
    @pytest.fixture
    def mock_submission_repository(self):
        """Create mock submission repository."""
        mock = AsyncMock(spec=ISubmissionRepository)
        return mock
    
    @pytest.fixture
    def reviewer_agent(self, mock_code_execution_service, mock_submission_repository):
        """Create ReviewerAgent instance for testing."""
        return ReviewerAgent(mock_code_execution_service, mock_submission_repository)
    
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
    
    @pytest.fixture
    def sample_submission_data(self):
        """Create sample submission data."""
        return {
            'code': '''
def add_numbers(a, b):
    """Add two numbers and return the result."""
    return a + b

result = add_numbers(5, 3)
print(result)
''',
            'language': 'python'
        }
    
    @pytest.fixture
    def sample_exercise_data(self):
        """Create sample exercise data."""
        return {
            'id': str(uuid4()),
            'title': 'Add Numbers Function',
            'description': 'Create a function that adds two numbers',
            'test_cases': [
                {
                    'name': 'test_add_positive',
                    'input': '5, 3',
                    'expected_output': '8',
                    'timeout': 5
                },
                {
                    'name': 'test_add_negative',
                    'input': '-2, 4',
                    'expected_output': '2',
                    'timeout': 5
                },
                {
                    'name': 'test_add_zero',
                    'input': '0, 0',
                    'expected_output': '0',
                    'timeout': 5
                }
            ]
        }
    
    @pytest.fixture
    def successful_execution_result(self):
        """Create successful code execution result."""
        return CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="8\n",
            errors=[],
            test_results=[
                TestResult(
                    test_name="test_add_positive",
                    passed=True,
                    actual_output="8",
                    expected_output="8",
                    execution_time=0.1
                ),
                TestResult(
                    test_name="test_add_negative",
                    passed=True,
                    actual_output="2",
                    expected_output="2",
                    execution_time=0.1
                ),
                TestResult(
                    test_name="test_add_zero",
                    passed=True,
                    actual_output="0",
                    expected_output="0",
                    execution_time=0.1
                )
            ],
            resource_usage=ResourceUsage(0.3, 1024*1024, 512*1024, 0, 0),
            security_violations=[],
            execution_time=0.5,
            created_at=None
        )
    
    @pytest.fixture
    def failed_execution_result(self):
        """Create failed code execution result."""
        return CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.FAILED,
            output="",
            errors=["NameError: name 'undefined_variable' is not defined"],
            test_results=[
                TestResult(
                    test_name="test_add_positive",
                    passed=False,
                    actual_output="",
                    expected_output="8",
                    execution_time=0.0,
                    error_message="NameError: name 'undefined_variable' is not defined"
                )
            ],
            resource_usage=ResourceUsage(0.1, 512*1024, 256*1024, 0, 0),
            security_violations=[],
            execution_time=0.1,
            created_at=None
        )
    
    def test_agent_initialization(self, reviewer_agent, mock_code_execution_service, mock_submission_repository):
        """Test agent initialization."""
        assert reviewer_agent.agent_type == AgentType.REVIEWER
        assert reviewer_agent.code_execution_service == mock_code_execution_service
        assert reviewer_agent.submission_repository == mock_submission_repository
        
        supported_intents = reviewer_agent.get_supported_intents()
        expected_intents = [
            'evaluate_submission',
            'run_tests',
            'generate_feedback',
            'check_code_quality',
            'compare_submissions',
            'validate_solution'
        ]
        
        for intent in expected_intents:
            assert intent in supported_intents
    
    @pytest.mark.asyncio
    async def test_evaluate_submission_success(self, reviewer_agent, mock_code_execution_service, 
                                             mock_submission_repository, learning_context, 
                                             sample_submission_data, sample_exercise_data, 
                                             successful_execution_result):
        """Test successful submission evaluation."""
        # Arrange
        saved_submission = Submission(
            task_id=sample_exercise_data['id'],
            user_id=learning_context.user_id,
            code_content=sample_submission_data['code']
        )
        saved_submission.id = str(uuid4())
        
        mock_submission_repository.save.return_value = saved_submission
        mock_code_execution_service.execute_code.return_value = successful_execution_result
        
        payload = {
            'intent': 'evaluate_submission',
            'submission': sample_submission_data,
            'exercise': sample_exercise_data
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'evaluation' in result.data
        assert 'submission_id' in result.data
        assert 'execution_result' in result.data
        assert 'quality_analysis' in result.data
        assert 'feedback' in result.data
        
        evaluation = result.data['evaluation']
        assert evaluation['passed'] == True
        assert evaluation['score'] > 0
        
        # Should have called services
        mock_submission_repository.save.assert_called_once()
        mock_code_execution_service.execute_code.assert_called_once()
        
        # Should have next actions
        assert len(result.next_actions) > 0
    
    @pytest.mark.asyncio
    async def test_evaluate_submission_failed(self, reviewer_agent, mock_code_execution_service, 
                                            mock_submission_repository, learning_context, 
                                            sample_submission_data, sample_exercise_data, 
                                            failed_execution_result):
        """Test submission evaluation with failed execution."""
        # Arrange
        saved_submission = Submission(
            task_id=sample_exercise_data['id'],
            user_id=learning_context.user_id,
            code_content=sample_submission_data['code']
        )
        saved_submission.id = str(uuid4())
        
        mock_submission_repository.save.return_value = saved_submission
        mock_code_execution_service.execute_code.return_value = failed_execution_result
        
        payload = {
            'intent': 'evaluate_submission',
            'submission': sample_submission_data,
            'exercise': sample_exercise_data
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        evaluation = result.data['evaluation']
        assert evaluation['passed'] == False
        assert evaluation['score'] >= 0
        
        # Should suggest retry actions
        assert 'retry_submission' in result.next_actions or 'request_hint' in result.next_actions
    
    @pytest.mark.asyncio
    async def test_evaluate_submission_missing_data(self, reviewer_agent, learning_context):
        """Test submission evaluation with missing data."""
        # Missing submission data
        payload = {
            'intent': 'evaluate_submission',
            'exercise': {'id': 'test'}
        }
        
        result = await reviewer_agent.process(learning_context, payload)
        assert not result.success
        assert "submission data is required" in result.error.lower()
        
        # Missing exercise data
        payload = {
            'intent': 'evaluate_submission',
            'submission': {'code': 'print("hello")'}
        }
        
        result = await reviewer_agent.process(learning_context, payload)
        assert not result.success
        assert "exercise data is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_evaluate_submission_empty_code(self, reviewer_agent, learning_context, sample_exercise_data):
        """Test submission evaluation with empty code."""
        payload = {
            'intent': 'evaluate_submission',
            'submission': {'code': '   ', 'language': 'python'},
            'exercise': sample_exercise_data
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "code cannot be empty" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_run_tests_success(self, reviewer_agent, mock_code_execution_service, 
                                   learning_context, successful_execution_result):
        """Test successful test execution."""
        # Arrange
        mock_code_execution_service.execute_code.return_value = successful_execution_result
        
        payload = {
            'intent': 'run_tests',
            'code': 'def add(a, b): return a + b',
            'language': 'python',
            'test_cases': [
                {'name': 'test_add', 'input': '2, 3', 'expected_output': '5'}
            ]
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'test_results' in result.data
        assert 'summary' in result.data
        
        summary = result.data['summary']
        assert summary['total_tests'] == 3
        assert summary['passed_tests'] == 3
        assert summary['success_rate'] == 1.0
    
    @pytest.mark.asyncio
    async def test_run_tests_empty_code(self, reviewer_agent, learning_context):
        """Test test execution with empty code."""
        payload = {
            'intent': 'run_tests',
            'code': '',
            'test_cases': []
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "code cannot be empty" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_generate_feedback_success(self, reviewer_agent, learning_context):
        """Test successful feedback generation."""
        payload = {
            'intent': 'generate_feedback',
            'code': 'def add(a, b): return a + b',
            'language': 'python',
            'test_results': [
                {'name': 'test_add', 'passed': True, 'expected': '5', 'actual': '5'}
            ],
            'exercise_context': {'topic': 'functions'}
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'feedback' in result.data
        assert 'quality_analysis' in result.data
        
        feedback = result.data['feedback']
        assert isinstance(feedback, dict)
    
    @pytest.mark.asyncio
    async def test_check_code_quality_success(self, reviewer_agent, learning_context):
        """Test successful code quality check."""
        payload = {
            'intent': 'check_code_quality',
            'code': '''
def calculate_sum(numbers):
    """Calculate the sum of a list of numbers."""
    total = 0
    for number in numbers:
        total += number
    return total
''',
            'language': 'python'
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'quality_analysis' in result.data
        assert 'overall_score' in result.data
        assert 'quality_rating' in result.data
        
        assert 0.0 <= result.data['overall_score'] <= 10.0
        assert result.data['quality_rating'] in ['excellent', 'good', 'fair', 'needs_improvement']
    
    @pytest.mark.asyncio
    async def test_compare_submissions_success(self, reviewer_agent, learning_context):
        """Test successful submission comparison."""
        submissions = [
            {
                'id': str(uuid4()),
                'code': 'def add(a, b): return a + b',
                'language': 'python'
            },
            {
                'id': str(uuid4()),
                'code': '''
def add_numbers(first_number, second_number):
    """Add two numbers together."""
    result = first_number + second_number
    return result
''',
                'language': 'python'
            }
        ]
        
        payload = {
            'intent': 'compare_submissions',
            'submissions': submissions
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'comparison' in result.data
        assert 'analyses' in result.data
        assert result.data['submission_count'] == 2
        
        comparison = result.data['comparison']
        assert 'best_submission_index' in comparison
    
    @pytest.mark.asyncio
    async def test_compare_submissions_insufficient_data(self, reviewer_agent, learning_context):
        """Test submission comparison with insufficient submissions."""
        payload = {
            'intent': 'compare_submissions',
            'submissions': [{'id': '1', 'code': 'print("hello")'}]  # Only one submission
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "at least 2 submissions are required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_validate_solution_success(self, reviewer_agent, learning_context):
        """Test successful solution validation."""
        requirements = [
            "Use a function",
            "Include comments",
            "Handle edge cases"
        ]
        
        payload = {
            'intent': 'validate_solution',
            'code': '''
def calculate_factorial(n):
    """Calculate factorial of a number."""
    if n < 0:
        return None  # Handle negative numbers
    elif n == 0 or n == 1:
        return 1
    else:
        return n * calculate_factorial(n - 1)
''',
            'language': 'python',
            'requirements': requirements
        }
        
        # Act
        result = await reviewer_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'validation_results' in result.data
        assert 'validation_score' in result.data
        assert len(result.data['validation_results']) == len(requirements)
        
        # Should detect function and comments
        validation_results = result.data['validation_results']
        function_result = next((r for r in validation_results if 'function' in r['requirement'].lower()), None)
        assert function_result is not None
        assert function_result['met'] == True
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, reviewer_agent, learning_context):
        """Test handling of unsupported intent."""
        payload = {
            'intent': 'unsupported_intent'
        }
        
        # Act & Assert
        with pytest.raises(Exception):  # Should raise ValidationError
            await reviewer_agent.process(learning_context, payload)
    
    def test_analyze_readability(self, reviewer_agent):
        """Test code readability analysis."""
        # Good readability code
        good_code = '''
def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)
'''
        
        analysis = reviewer_agent._analyze_readability(good_code, 'python')
        assert analysis['score'] > 0.5
        assert analysis['comment_ratio'] > 0
        
        # Poor readability code
        poor_code = 'def f(x):return x*2 if x>0 else 0'
        
        analysis = reviewer_agent._analyze_readability(poor_code, 'python')
        assert analysis['comment_ratio'] == 0
    
    def test_analyze_structure(self, reviewer_agent):
        """Test code structure analysis."""
        structured_code = '''
import math

class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

def main():
    calc = Calculator()
    result = calc.add(5, 3)
    print(result)
'''
        
        analysis = reviewer_agent._analyze_structure(structured_code, 'python')
        assert analysis['functions_count'] > 0
        assert analysis['classes_count'] > 0
        assert analysis['imports_count'] > 0
        assert analysis['score'] > 0.5
    
    def test_analyze_best_practices(self, reviewer_agent):
        """Test best practices analysis."""
        # Code with violations
        bad_code = '''
from math import *
try:
    result = 10 / 0
except:
    pass
'''
        
        analysis = reviewer_agent._analyze_best_practices(bad_code, 'python')
        assert len(analysis['violations']) > 0
        assert analysis['score'] < 0.5
        
        # Good code
        good_code = '''
import math

try:
    result = 10 / 2
except ZeroDivisionError as e:
    print(f"Error: {e}")
'''
        
        analysis = reviewer_agent._analyze_best_practices(good_code, 'python')
        assert len(analysis['violations']) == 0
    
    def test_analyze_complexity(self, reviewer_agent):
        """Test complexity analysis."""
        # Simple code
        simple_code = '''
def greet(name):
    return f"Hello, {name}!"
'''
        
        analysis = reviewer_agent._analyze_complexity(simple_code, 'python')
        assert analysis['max_nesting_level'] <= 1
        assert analysis['score'] > 0.7
        
        # Complex code
        complex_code = '''
def complex_function(data):
    for item in data:
        if item > 0:
            for i in range(item):
                if i % 2 == 0:
                    for j in range(i):
                        if j > 5:
                            print(j)
'''
        
        analysis = reviewer_agent._analyze_complexity(complex_code, 'python')
        assert analysis['max_nesting_level'] > 2
        assert analysis['score'] < 0.7
    
    def test_find_code_issues(self, reviewer_agent):
        """Test code issue detection."""
        problematic_code = '''
def very_long_function_name_that_exceeds_reasonable_length_and_should_be_flagged_as_too_long():
    print("Debug statement")
    x = 5:
    return x
'''
        
        issues = reviewer_agent._find_code_issues(problematic_code, 'python')
        
        # Should find long line and debug print
        issue_types = [issue['type'] for issue in issues]
        assert 'style' in issue_types  # Long line
        assert 'debug' in issue_types  # Print statement
    
    def test_generate_improvement_suggestions(self, reviewer_agent):
        """Test improvement suggestion generation."""
        code_needing_improvement = '''
x = 5
y = 10
z = x + y
print(z)
'''
        
        suggestions = reviewer_agent._generate_improvement_suggestions(code_needing_improvement, 'python')
        
        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
        
        # Should suggest better variable names and comments
        suggestion_text = ' '.join(suggestions).lower()
        assert 'comment' in suggestion_text or 'variable' in suggestion_text
    
    def test_calculate_overall_score(self, reviewer_agent, successful_execution_result):
        """Test overall score calculation."""
        quality_analysis = {
            'readability': {'score': 0.8},
            'structure': {'score': 0.7},
            'best_practices': {'score': 0.9},
            'complexity': {'score': 0.6}
        }
        
        score = reviewer_agent._calculate_overall_score(successful_execution_result, quality_analysis)
        
        assert isinstance(score, float)
        assert 0.0 <= score <= 100.0
        assert score > 50.0  # Should be good score for passing tests and decent quality
    
    def test_calculate_quality_score(self, reviewer_agent):
        """Test quality score calculation."""
        quality_analysis = {
            'readability': {'score': 0.8},
            'structure': {'score': 0.7},
            'best_practices': {'score': 0.9},
            'complexity': {'score': 0.6}
        }
        
        score = reviewer_agent._calculate_quality_score(quality_analysis)
        
        assert isinstance(score, float)
        assert 0.0 <= score <= 10.0
    
    def test_get_quality_rating(self, reviewer_agent):
        """Test quality rating conversion."""
        assert reviewer_agent._get_quality_rating(9.0) == "excellent"
        assert reviewer_agent._get_quality_rating(7.0) == "good"
        assert reviewer_agent._get_quality_rating(5.0) == "fair"
        assert reviewer_agent._get_quality_rating(3.0) == "needs_improvement"
    
    def test_determine_next_actions_passed(self, reviewer_agent):
        """Test next action determination for passed evaluation."""
        evaluation = EvaluationResult(
            submission_id="test",
            passed=True,
            score=85.0,
            feedback={'overall_assessment': 'Great job!'},
            execution_time=1.0
        )
        
        context = LearningContext(
            user_id="test",
            session_id="test",
            attempt_count=1
        )
        
        actions = reviewer_agent._determine_next_actions(evaluation, context)
        
        assert 'continue_to_next_exercise' in actions
        assert 'request_stretch_exercise' in actions
    
    def test_determine_next_actions_failed(self, reviewer_agent):
        """Test next action determination for failed evaluation."""
        evaluation = EvaluationResult(
            submission_id="test",
            passed=False,
            score=30.0,
            feedback={'overall_assessment': 'Needs work'},
            execution_time=1.0
        )
        
        context = LearningContext(
            user_id="test",
            session_id="test",
            attempt_count=3  # Multiple failures
        )
        
        actions = reviewer_agent._determine_next_actions(evaluation, context)
        
        assert 'request_hint' in actions
        assert 'retry_submission' in actions
        assert 'request_recap_exercise' in actions  # Due to multiple failures
    
    def test_generate_comparison_insights(self, reviewer_agent):
        """Test comparison insights generation."""
        analyses = [
            {
                'submission_index': 0,
                'quality_analysis': {
                    'readability': {'score': 0.6},
                    'structure': {'score': 0.5},
                    'best_practices': {'score': 0.7},
                    'complexity': {'score': 0.8}
                }
            },
            {
                'submission_index': 1,
                'quality_analysis': {
                    'readability': {'score': 0.9},
                    'structure': {'score': 0.8},
                    'best_practices': {'score': 0.9},
                    'complexity': {'score': 0.7}
                }
            }
        ]
        
        comparison = reviewer_agent._generate_comparison_insights(analyses)
        
        assert 'best_submission_index' in comparison
        assert comparison['best_submission_index'] == 1  # Second submission should be better
        assert 'quality_trend' in comparison
        assert 'average_quality' in comparison
    
    @pytest.mark.asyncio
    async def test_validate_requirement_function(self, reviewer_agent, learning_context):
        """Test requirement validation for functions."""
        code_with_function = '''
def calculate_sum(numbers):
    return sum(numbers)
'''
        
        result = await reviewer_agent._validate_requirement(
            code_with_function, 'python', 'Use a function', learning_context
        )
        
        assert result['requirement'] == 'Use a function'
        assert result['met'] == True
        assert 'function' in result['explanation'].lower()
    
    @pytest.mark.asyncio
    async def test_validate_requirement_loop(self, reviewer_agent, learning_context):
        """Test requirement validation for loops."""
        code_with_loop = '''
for i in range(10):
    print(i)
'''
        
        result = await reviewer_agent._validate_requirement(
            code_with_loop, 'python', 'Use a loop', learning_context
        )
        
        assert result['met'] == True
        
        code_without_loop = 'print("hello")'
        
        result = await reviewer_agent._validate_requirement(
            code_without_loop, 'python', 'Use a loop', learning_context
        )
        
        assert result['met'] == False
    
    @pytest.mark.asyncio
    async def test_timeout_fallback(self, reviewer_agent, learning_context):
        """Test timeout fallback behavior."""
        payload = {
            'intent': 'evaluate_submission',
            'submission': {'code': 'print("hello")', 'language': 'python'},
            'exercise': {'id': 'test'}
        }
        
        # Act
        result = await reviewer_agent._handle_timeout_fallback(learning_context, payload)
        
        # Assert
        assert result is not None
        assert result.success == True  # Fallback should still return success with message
        assert result.metadata['fallback'] == True
        assert result.metadata['reason'] == 'timeout'
        assert result.data['evaluation']['passed'] == False  # But evaluation should show failure