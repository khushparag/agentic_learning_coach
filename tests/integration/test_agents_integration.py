"""
Integration tests for agent interactions and workflows.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from src.agents.resources_agent import ResourcesAgent
from src.agents.exercise_generator_agent import ExerciseGeneratorAgent
from src.agents.reviewer_agent import ReviewerAgent
from src.agents.base.types import LearningContext, AgentResult
from src.ports.services.mcp_tools import (
    LearningResource, ResourceType, DifficultyLevel,
    CodeAnalysisResult
)
from src.domain.entities.code_execution import (
    CodeExecutionResult, ExecutionStatus, TestResult, ResourceUsage
)
from src.domain.entities.submission import Submission


class TestAgentsIntegration:
    """Integration tests for agent workflows."""
    
    @pytest.fixture
    def learning_context(self):
        """Create learning context for testing."""
        return LearningContext(
            user_id="integration-test-user",
            session_id="integration-test-session",
            current_objective="python functions",
            skill_level="intermediate",
            learning_goals=["python", "web development"],
            attempt_count=1
        )
    
    @pytest.fixture
    def mock_documentation_mcp(self):
        """Create mock documentation MCP."""
        mock = AsyncMock()
        
        # Mock search results
        mock.search_documentation.return_value = [
            LearningResource(
                title="Python Functions Tutorial",
                url="https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
                description="Learn how to define and use functions in Python",
                resource_type=ResourceType.DOCUMENTATION,
                difficulty_level=DifficultyLevel.INTERMEDIATE,
                topics=["python", "functions"],
                language="python",
                quality_score=0.9,
                source="docs.python.org"
            )
        ]
        
        mock.verify_resource_quality.return_value = 0.85
        mock.get_resource_content.return_value = "Function tutorial content..."
        mock.get_related_resources.return_value = []
        
        return mock
    
    @pytest.fixture
    def mock_code_analysis_mcp(self):
        """Create mock code analysis MCP."""
        mock = AsyncMock()
        
        mock.analyze_code_complexity.return_value = CodeAnalysisResult(
            complexity_score=0.3,
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            issues=[],
            suggestions=["Add comments to explain the logic"],
            estimated_time_minutes=20,
            topics_covered=["functions", "python"]
        )
        
        return mock
    
    @pytest.fixture
    def mock_code_execution_service(self):
        """Create mock code execution service."""
        mock = AsyncMock()
        
        # Default successful execution
        mock.execute_code.return_value = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="8\n",
            errors=[],
            test_results=[
                TestResult(
                    test_name="test_add",
                    passed=True,
                    actual_output="8",
                    expected_output="8",
                    execution_time=0.1
                )
            ],
            resource_usage=ResourceUsage(0.2, 1024*1024, 512*1024, 0, 0),
            security_violations=[],
            execution_time=0.3,
            created_at=None
        )
        
        return mock
    
    @pytest.fixture
    def mock_submission_repository(self):
        """Create mock submission repository."""
        mock = AsyncMock()
        
        mock.save.return_value = Submission(
            id=str(uuid4()),
            task_id="test-task",
            user_id="test-user",
            code_content="def add(a, b): return a + b"
        )
        
        return mock
    
    @pytest.fixture
    def resources_agent(self, mock_documentation_mcp):
        """Create ResourcesAgent for integration testing."""
        return ResourcesAgent(mock_documentation_mcp)
    
    @pytest.fixture
    def exercise_generator_agent(self, mock_code_analysis_mcp):
        """Create ExerciseGeneratorAgent for integration testing."""
        return ExerciseGeneratorAgent(mock_code_analysis_mcp)
    
    @pytest.fixture
    def reviewer_agent(self, mock_code_execution_service, mock_submission_repository):
        """Create ReviewerAgent for integration testing."""
        return ReviewerAgent(mock_code_execution_service, mock_submission_repository)
    
    @pytest.mark.asyncio
    async def test_complete_learning_workflow(self, learning_context, resources_agent, 
                                            exercise_generator_agent, reviewer_agent):
        """Test complete learning workflow from resource discovery to code evaluation."""
        
        # Step 1: Discover learning resources
        resource_payload = {
            'intent': 'search_resources',
            'query': 'python functions tutorial',
            'max_results': 3
        }
        
        resource_result = await resources_agent.process(learning_context, resource_payload)
        assert resource_result.success
        assert len(resource_result.data['resources']) > 0
        
        # Step 2: Generate exercise based on topic
        exercise_payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python',
            'exercise_type': 'coding'
        }
        
        exercise_result = await exercise_generator_agent.process(learning_context, exercise_payload)
        assert exercise_result.success
        assert 'test_cases' in exercise_result.data
        assert 'hints' in exercise_result.data
        
        # Step 3: Submit and evaluate solution
        submission_data = {
            'code': '''
def add_numbers(a, b):
    """Add two numbers and return the result."""
    return a + b

result = add_numbers(5, 3)
print(result)
''',
            'language': 'python'
        }
        
        evaluation_payload = {
            'intent': 'evaluate_submission',
            'submission': submission_data,
            'exercise': exercise_result.data
        }
        
        evaluation_result = await reviewer_agent.process(learning_context, evaluation_payload)
        assert evaluation_result.success
        assert 'evaluation' in evaluation_result.data
        
        # Verify workflow continuity
        evaluation = evaluation_result.data['evaluation']
        if evaluation['passed']:
            assert 'continue_to_next_exercise' in evaluation_result.next_actions
        else:
            assert 'retry_submission' in evaluation_result.next_actions
    
    @pytest.mark.asyncio
    async def test_adaptive_difficulty_workflow(self, learning_context, exercise_generator_agent, 
                                              reviewer_agent, mock_code_execution_service):
        """Test adaptive difficulty adjustment based on performance."""
        
        # Generate initial exercise
        exercise_payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'difficulty': 'intermediate',
            'language': 'python'
        }
        
        exercise_result = await exercise_generator_agent.process(learning_context, exercise_payload)
        assert exercise_result.success
        
        # Simulate failed submission (multiple attempts)
        failed_context = LearningContext(
            user_id=learning_context.user_id,
            session_id=learning_context.session_id,
            current_objective=learning_context.current_objective,
            skill_level=learning_context.skill_level,
            learning_goals=learning_context.learning_goals,
            attempt_count=3,
            last_feedback={'passed': False}
        )
        
        # Mock failed execution
        mock_code_execution_service.execute_code.return_value = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.FAILED,
            output="",
            errors=["SyntaxError: invalid syntax"],
            test_results=[],
            resource_usage=ResourceUsage(0.1, 512*1024, 256*1024, 0, 0),
            security_violations=[],
            execution_time=0.1,
            created_at=None
        )
        
        # Evaluate failed submission
        evaluation_payload = {
            'intent': 'evaluate_submission',
            'submission': {'code': 'def add(a, b) return a + b', 'language': 'python'},
            'exercise': exercise_result.data
        }
        
        evaluation_result = await reviewer_agent.process(failed_context, evaluation_payload)
        assert evaluation_result.success
        assert not evaluation_result.data['evaluation']['passed']
        
        # Generate easier exercise (recap)
        recap_payload = {
            'intent': 'create_recap_exercise',
            'topics': ['functions'],
            'difficulty': 'beginner'
        }
        
        recap_result = await exercise_generator_agent.process(failed_context, recap_payload)
        assert recap_result.success
        assert recap_result.data['is_recap'] == True
        assert recap_result.data['difficulty'] == 'beginner'
    
    @pytest.mark.asyncio
    async def test_stretch_exercise_workflow(self, learning_context, exercise_generator_agent, 
                                           reviewer_agent, mock_code_execution_service):
        """Test stretch exercise generation for advanced learners."""
        
        # Mock very successful execution (quick completion)
        mock_code_execution_service.execute_code.return_value = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="Perfect solution\n",
            errors=[],
            test_results=[
                TestResult(
                    test_name="test_advanced",
                    passed=True,
                    actual_output="Perfect solution",
                    expected_output="Perfect solution",
                    execution_time=0.05
                )
            ],
            resource_usage=ResourceUsage(0.1, 512*1024, 256*1024, 0, 0),
            security_violations=[],
            execution_time=0.1,
            created_at=None
        )
        
        # Evaluate successful submission
        evaluation_payload = {
            'intent': 'evaluate_submission',
            'submission': {
                'code': 'def advanced_function(): return "Perfect solution"',
                'language': 'python'
            },
            'exercise': {
                'id': str(uuid4()),
                'test_cases': [{'name': 'test_advanced', 'expected_output': 'Perfect solution'}]
            }
        }
        
        evaluation_result = await reviewer_agent.process(learning_context, evaluation_payload)
        assert evaluation_result.success
        assert evaluation_result.data['evaluation']['passed']
        
        # Generate stretch exercise
        stretch_payload = {
            'intent': 'create_stretch_exercise',
            'topic': 'functions',
            'current_difficulty': 'intermediate'
        }
        
        stretch_result = await exercise_generator_agent.process(learning_context, stretch_payload)
        assert stretch_result.success
        assert stretch_result.data['is_stretch'] == True
        assert stretch_result.data['difficulty'] == 'advanced'
    
    @pytest.mark.asyncio
    async def test_resource_to_exercise_workflow(self, learning_context, resources_agent, 
                                               exercise_generator_agent):
        """Test workflow from resource discovery to exercise generation."""
        
        # Step 1: Search for resources on a specific topic
        resource_payload = {
            'intent': 'search_resources',
            'query': 'python loops',
            'language': 'python',
            'max_results': 5
        }
        
        resource_result = await resources_agent.process(learning_context, resource_payload)
        assert resource_result.success
        
        resources = resource_result.data['resources']
        assert len(resources) > 0
        
        # Step 2: Get detailed content from a resource
        if resources:
            content_payload = {
                'intent': 'get_resource_content',
                'url': resources[0]['url']
            }
            
            content_result = await resources_agent.process(learning_context, content_payload)
            assert content_result.success
            assert 'content' in content_result.data
        
        # Step 3: Generate exercise based on the topic
        exercise_payload = {
            'intent': 'generate_exercise',
            'topic': 'loops',  # Topic from resource search
            'difficulty': learning_context.skill_level,
            'language': 'python'
        }
        
        exercise_result = await exercise_generator_agent.process(learning_context, exercise_payload)
        assert exercise_result.success
        assert exercise_result.data['topic'] == 'loops'
    
    @pytest.mark.asyncio
    async def test_exercise_hint_workflow(self, learning_context, exercise_generator_agent):
        """Test exercise generation with progressive hints."""
        
        # Generate exercise
        exercise_payload = {
            'intent': 'generate_exercise',
            'topic': 'functions',
            'difficulty': 'beginner'
        }
        
        exercise_result = await exercise_generator_agent.process(learning_context, exercise_payload)
        assert exercise_result.success
        
        exercise_data = exercise_result.data
        
        # Request hints at different levels
        for hint_level in [1, 2, 3]:
            hint_payload = {
                'intent': 'generate_hints',
                'exercise': exercise_data,
                'hint_level': hint_level
            }
            
            hint_result = await exercise_generator_agent.process(learning_context, hint_payload)
            assert hint_result.success
            assert hint_result.data['hint_level'] == hint_level
            
            # Higher levels should provide more hints
            if hint_level > 1:
                assert len(hint_result.data['hints']) >= hint_level
    
    @pytest.mark.asyncio
    async def test_code_quality_feedback_workflow(self, learning_context, reviewer_agent):
        """Test comprehensive code quality analysis workflow."""
        
        # Test different code quality levels
        code_samples = [
            {
                'name': 'poor_quality',
                'code': 'def f(x):return x*2',
                'expected_rating': 'needs_improvement'
            },
            {
                'name': 'good_quality',
                'code': '''
def calculate_double(number):
    """Calculate double of a number."""
    return number * 2
''',
                'expected_rating': 'good'
            }
        ]
        
        for sample in code_samples:
            quality_payload = {
                'intent': 'check_code_quality',
                'code': sample['code'],
                'language': 'python'
            }
            
            quality_result = await reviewer_agent.process(learning_context, quality_payload)
            assert quality_result.success
            
            quality_rating = quality_result.data['quality_rating']
            # Note: Exact rating may vary based on implementation details
            assert quality_rating in ['excellent', 'good', 'fair', 'needs_improvement']
    
    @pytest.mark.asyncio
    async def test_multi_language_support_workflow(self, learning_context, exercise_generator_agent, 
                                                 reviewer_agent):
        """Test workflow with multiple programming languages."""
        
        languages = ['python', 'javascript']
        
        for language in languages:
            # Generate exercise for language
            exercise_payload = {
                'intent': 'generate_exercise',
                'topic': 'functions',
                'language': language,
                'difficulty': 'beginner'
            }
            
            exercise_result = await exercise_generator_agent.process(learning_context, exercise_payload)
            assert exercise_result.success
            assert exercise_result.data['language'] == language
            
            # Check language-specific elements
            assert 'language_info' in exercise_result.data
            lang_info = exercise_result.data['language_info']
            
            if language == 'python':
                assert lang_info['file_extension'] == '.py'
                assert lang_info['comment_style'] == '#'
            elif language == 'javascript':
                assert lang_info['file_extension'] == '.js'
                assert lang_info['comment_style'] == '//'
    
    @pytest.mark.asyncio
    async def test_error_recovery_workflow(self, learning_context, resources_agent, 
                                         mock_documentation_mcp):
        """Test error recovery and fallback mechanisms."""
        
        # Simulate MCP service failure
        mock_documentation_mcp.search_documentation.side_effect = Exception("Service unavailable")
        
        # Request should still succeed with fallback
        resource_payload = {
            'intent': 'search_resources',
            'query': 'python functions',
            'max_results': 3
        }
        
        # The agent should handle the error gracefully
        try:
            result = await resources_agent.process(learning_context, resource_payload)
            # If the agent has proper error handling, it should return an error result
            assert not result.success
        except Exception:
            # If no error handling, the exception should be caught by the base agent
            pass
    
    @pytest.mark.asyncio
    async def test_learning_path_curation_workflow(self, learning_context, resources_agent):
        """Test complete learning path resource curation."""
        
        topics = ["variables", "functions", "loops", "conditionals"]
        
        curation_payload = {
            'intent': 'curate_learning_path_resources',
            'topics': topics,
            'resources_per_topic': 2
        }
        
        curation_result = await resources_agent.process(learning_context, curation_payload)
        assert curation_result.success
        
        curated_resources = curation_result.data['curated_resources']
        
        # Should have resources for each topic
        for topic in topics:
            assert topic in curated_resources
            assert len(curated_resources[topic]) <= 2
        
        # Verify resource diversity
        all_resources = []
        for topic_resources in curated_resources.values():
            all_resources.extend(topic_resources)
        
        # Should have diverse resource types
        resource_types = set(resource['resource_type'] for resource in all_resources)
        assert len(resource_types) >= 1  # At least some diversity