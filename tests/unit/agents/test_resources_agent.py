"""
Unit tests for ResourcesAgent.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from src.agents.resources_agent import ResourcesAgent
from src.agents.base.types import AgentType, LearningContext, AgentResult
from src.ports.services.mcp_tools import (
    IDocumentationMCP, 
    LearningResource, 
    ResourceType, 
    DifficultyLevel
)


class TestResourcesAgent:
    """Test cases for ResourcesAgent."""
    
    @pytest.fixture
    def mock_documentation_mcp(self):
        """Create mock documentation MCP."""
        mock = AsyncMock(spec=IDocumentationMCP)
        return mock
    
    @pytest.fixture
    def resources_agent(self, mock_documentation_mcp):
        """Create ResourcesAgent instance for testing."""
        return ResourcesAgent(mock_documentation_mcp)
    
    @pytest.fixture
    def learning_context(self):
        """Create learning context for testing."""
        return LearningContext(
            user_id="test-user-123",
            session_id="test-session-456",
            current_objective="python functions",
            skill_level="intermediate",
            learning_goals=["python", "web development"],
            correlation_id="test-correlation-789"
        )
    
    @pytest.fixture
    def sample_resources(self):
        """Create sample learning resources."""
        return [
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
            ),
            LearningResource(
                title="JavaScript Functions Guide",
                url="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
                description="Complete guide to JavaScript functions",
                resource_type=ResourceType.DOCUMENTATION,
                difficulty_level=DifficultyLevel.INTERMEDIATE,
                topics=["javascript", "functions"],
                language="javascript",
                quality_score=0.85,
                source="developer.mozilla.org"
            ),
            LearningResource(
                title="Functions in Programming",
                url="https://example.com/functions-tutorial",
                description="General tutorial about functions",
                resource_type=ResourceType.TUTORIAL,
                difficulty_level=DifficultyLevel.BEGINNER,
                topics=["functions", "programming"],
                quality_score=0.7,
                source="example.com"
            )
        ]
    
    def test_agent_initialization(self, resources_agent, mock_documentation_mcp):
        """Test agent initialization."""
        assert resources_agent.agent_type == AgentType.RESOURCES
        assert resources_agent.documentation_mcp == mock_documentation_mcp
        
        supported_intents = resources_agent.get_supported_intents()
        expected_intents = [
            'search_resources',
            'get_resource_content',
            'recommend_resources',
            'verify_resource_quality',
            'find_related_resources',
            'curate_learning_path_resources'
        ]
        
        for intent in expected_intents:
            assert intent in supported_intents
    
    @pytest.mark.asyncio
    async def test_search_resources_success(self, resources_agent, mock_documentation_mcp, 
                                          learning_context, sample_resources):
        """Test successful resource search."""
        # Arrange
        mock_documentation_mcp.search_documentation.return_value = sample_resources
        mock_documentation_mcp.verify_resource_quality.return_value = 0.8
        
        payload = {
            'intent': 'search_resources',
            'query': 'python functions',
            'language': 'python',
            'max_results': 5
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'resources' in result.data
        assert 'query' in result.data
        assert result.data['query'] == 'python functions'
        
        resources = result.data['resources']
        assert len(resources) <= 5
        
        # Should have called MCP search
        mock_documentation_mcp.search_documentation.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_search_resources_missing_query(self, resources_agent, learning_context):
        """Test resource search with missing query."""
        payload = {
            'intent': 'search_resources'
            # Missing query
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "query is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_get_resource_content_success(self, resources_agent, mock_documentation_mcp, 
                                              learning_context):
        """Test successful resource content retrieval."""
        # Arrange
        test_url = "https://example.com/tutorial"
        test_content = "This is the tutorial content about Python functions..."
        mock_documentation_mcp.get_resource_content.return_value = test_content
        
        payload = {
            'intent': 'get_resource_content',
            'url': test_url
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['url'] == test_url
        assert result.data['content'] == test_content
        assert result.data['content_length'] == len(test_content)
        
        mock_documentation_mcp.get_resource_content.assert_called_once_with(test_url)
    
    @pytest.mark.asyncio
    async def test_get_resource_content_missing_url(self, resources_agent, learning_context):
        """Test resource content retrieval with missing URL."""
        payload = {
            'intent': 'get_resource_content'
            # Missing url
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "url is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_get_resource_content_unavailable(self, resources_agent, mock_documentation_mcp, 
                                                   learning_context):
        """Test resource content retrieval when content is unavailable."""
        # Arrange
        mock_documentation_mcp.get_resource_content.return_value = None
        
        payload = {
            'intent': 'get_resource_content',
            'url': 'https://unavailable.com'
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert result.error_code == "CONTENT_UNAVAILABLE"
    
    @pytest.mark.asyncio
    async def test_recommend_resources_success(self, resources_agent, mock_documentation_mcp, 
                                             learning_context, sample_resources):
        """Test successful resource recommendations."""
        # Arrange
        mock_documentation_mcp.search_documentation.return_value = sample_resources
        
        payload = {
            'intent': 'recommend_resources',
            'topic': 'functions',
            'max_recommendations': 3
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'recommendations' in result.data
        assert result.data['topic'] == 'functions'
        assert len(result.data['recommendations']) <= 3
    
    @pytest.mark.asyncio
    async def test_recommend_resources_no_topic(self, resources_agent, mock_documentation_mcp, 
                                              learning_context, sample_resources):
        """Test resource recommendations using context objective."""
        # Arrange
        mock_documentation_mcp.search_documentation.return_value = sample_resources
        
        payload = {
            'intent': 'recommend_resources'
            # No topic specified, should use context.current_objective
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert result.data['topic'] == learning_context.current_objective
    
    @pytest.mark.asyncio
    async def test_verify_resource_quality_success(self, resources_agent, mock_documentation_mcp, 
                                                 learning_context, sample_resources):
        """Test successful resource quality verification."""
        # Arrange
        resource = sample_resources[0]
        mock_documentation_mcp.verify_resource_quality.return_value = 0.85
        
        payload = {
            'intent': 'verify_resource_quality',
            'resource': resource.to_dict()
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'quality_score' in result.data
        assert 'quality_rating' in result.data
        assert result.data['quality_score'] > 0.8
        
        mock_documentation_mcp.verify_resource_quality.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_find_related_resources_success(self, resources_agent, mock_documentation_mcp, 
                                                learning_context, sample_resources):
        """Test finding related resources."""
        # Arrange
        base_resource = sample_resources[0]
        related_resources = sample_resources[1:3]  # Return other resources as related
        mock_documentation_mcp.get_related_resources.return_value = related_resources
        mock_documentation_mcp.verify_resource_quality.return_value = 0.8
        
        payload = {
            'intent': 'find_related_resources',
            'resource': base_resource.to_dict(),
            'max_related': 2
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'related_resources' in result.data
        assert 'base_resource' in result.data
        assert len(result.data['related_resources']) <= 2
        
        mock_documentation_mcp.get_related_resources.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_curate_learning_path_resources_success(self, resources_agent, mock_documentation_mcp, 
                                                        learning_context, sample_resources):
        """Test learning path resource curation."""
        # Arrange
        topics = ["functions", "loops", "conditionals"]
        mock_documentation_mcp.search_documentation.return_value = sample_resources
        
        payload = {
            'intent': 'curate_learning_path_resources',
            'topics': topics,
            'resources_per_topic': 2
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert result.success
        assert 'curated_resources' in result.data
        assert result.data['topics'] == topics
        
        curated = result.data['curated_resources']
        assert len(curated) == len(topics)
        
        for topic in topics:
            assert topic in curated
            assert len(curated[topic]) <= 2
    
    @pytest.mark.asyncio
    async def test_curate_learning_path_resources_missing_topics(self, resources_agent, learning_context):
        """Test learning path curation with missing topics."""
        payload = {
            'intent': 'curate_learning_path_resources'
            # Missing topics
        }
        
        # Act
        result = await resources_agent.process(learning_context, payload)
        
        # Assert
        assert not result.success
        assert "topics list is required" in result.error.lower()
    
    @pytest.mark.asyncio
    async def test_unsupported_intent(self, resources_agent, learning_context):
        """Test handling of unsupported intent."""
        payload = {
            'intent': 'unsupported_intent'
        }
        
        # Act & Assert
        with pytest.raises(Exception):  # Should raise ValidationError
            await resources_agent.process(learning_context, payload)
    
    def test_infer_language_from_context(self, resources_agent):
        """Test language inference from learning context."""
        # Test Python detection
        context = LearningContext(
            user_id="test",
            session_id="test",
            learning_goals=["learn python programming"]
        )
        language = resources_agent._infer_language_from_context(context)
        assert language == "python"
        
        # Test JavaScript detection
        context.learning_goals = ["javascript fundamentals", "react development"]
        language = resources_agent._infer_language_from_context(context)
        assert language == "javascript"
        
        # Test TypeScript detection
        context.learning_goals = ["typescript basics"]
        language = resources_agent._infer_language_from_context(context)
        assert language == "typescript"
        
        # Test Java detection
        context.learning_goals = ["java programming"]
        language = resources_agent._infer_language_from_context(context)
        assert language == "java"
        
        # Test Go detection
        context.learning_goals = ["golang tutorial"]
        language = resources_agent._infer_language_from_context(context)
        assert language == "go"
        
        # Test React -> JavaScript mapping
        context.learning_goals = ["react components"]
        language = resources_agent._infer_language_from_context(context)
        assert language == "javascript"
        
        # Test current objective
        context.learning_goals = []
        context.current_objective = "python functions"
        language = resources_agent._infer_language_from_context(context)
        assert language == "python"
        
        # Test no language detected
        context.learning_goals = ["general programming"]
        context.current_objective = "algorithms"
        language = resources_agent._infer_language_from_context(context)
        assert language is None
    
    def test_filter_resources_by_context(self, resources_agent, sample_resources):
        """Test resource filtering by context."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            skill_level="intermediate",
            learning_goals=["python"]
        )
        
        # Act
        filtered = resources_agent._filter_resources_by_context(sample_resources, context)
        
        # Assert
        # Should only include Python resources at appropriate difficulty
        assert len(filtered) == 1  # Only the Python tutorial should match
        assert filtered[0].language == "python"
        assert filtered[0].difficulty_level == DifficultyLevel.INTERMEDIATE
    
    def test_is_difficulty_appropriate(self, resources_agent):
        """Test difficulty appropriateness check."""
        # Beginner learner
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.BEGINNER, "beginner")
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.INTERMEDIATE, "beginner")
        assert not resources_agent._is_difficulty_appropriate(DifficultyLevel.EXPERT, "beginner")
        
        # Advanced learner
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.INTERMEDIATE, "advanced")
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.ADVANCED, "advanced")
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.EXPERT, "advanced")
        assert not resources_agent._is_difficulty_appropriate(DifficultyLevel.BEGINNER, "advanced")
        
        # No learner level specified
        assert resources_agent._is_difficulty_appropriate(DifficultyLevel.EXPERT, None)
    
    def test_is_topically_relevant(self, resources_agent, sample_resources):
        """Test topical relevance check."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            current_objective="functions",
            learning_goals=["python"]
        )
        
        python_resource = sample_resources[0]  # Python functions tutorial
        javascript_resource = sample_resources[1]  # JavaScript functions guide
        
        # Python resource should be relevant (matches both objective and goals)
        assert resources_agent._is_topically_relevant(python_resource, context)
        
        # JavaScript resource should be relevant (matches objective)
        assert resources_agent._is_topically_relevant(javascript_resource, context)
    
    def test_calculate_relevance_score(self, resources_agent, sample_resources):
        """Test relevance score calculation."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            current_objective="functions",
            learning_goals=["python"]
        )
        
        python_resource = sample_resources[0]
        
        # Act
        score = resources_agent._calculate_relevance_score(python_resource, context)
        
        # Assert
        assert 0.0 <= score <= 1.0
        assert score > 0.5  # Should be highly relevant
    
    def test_calculate_difficulty_score(self, resources_agent, sample_resources):
        """Test difficulty score calculation."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            skill_level="intermediate"
        )
        
        intermediate_resource = sample_resources[0]  # Intermediate difficulty
        
        # Act
        score = resources_agent._calculate_difficulty_score(intermediate_resource, context)
        
        # Assert
        assert 0.0 <= score <= 1.0
        assert score == 1.0  # Perfect match should get highest score
    
    def test_build_recommendation_query(self, resources_agent):
        """Test recommendation query building."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            skill_level="intermediate",
            learning_goals=["python"]
        )
        
        # Act
        query = resources_agent._build_recommendation_query("functions", context)
        
        # Assert
        assert "functions" in query
        assert "python" in query
        assert "intermediate" in query
    
    def test_get_quality_rating(self, resources_agent):
        """Test quality rating conversion."""
        assert resources_agent._get_quality_rating(0.9) == "excellent"
        assert resources_agent._get_quality_rating(0.7) == "good"
        assert resources_agent._get_quality_rating(0.5) == "fair"
        assert resources_agent._get_quality_rating(0.3) == "poor"
    
    def test_select_diverse_resources(self, resources_agent, sample_resources):
        """Test diverse resource selection."""
        # Act
        selected = resources_agent._select_diverse_resources(sample_resources, 2)
        
        # Assert
        assert len(selected) == 2
        
        # Should prefer different types
        types = [r.resource_type for r in selected]
        # At least try to get different types if available
        assert len(set(types)) >= 1
    
    def test_process_resource_content(self, resources_agent):
        """Test resource content processing."""
        context = LearningContext(
            user_id="test",
            session_id="test",
            skill_level="beginner"
        )
        
        long_content = "A" * 5000  # Very long content
        
        # Act
        processed = resources_agent._process_resource_content(long_content, context)
        
        # Assert
        assert len(processed) <= 2000 + 50  # Should be truncated for beginners + truncation message
        assert "truncated" in processed.lower()
    
    @pytest.mark.asyncio
    async def test_timeout_fallback(self, resources_agent, learning_context):
        """Test timeout fallback behavior."""
        payload = {
            'intent': 'search_resources',
            'query': 'test query'
        }
        
        # Act
        result = await resources_agent._handle_timeout_fallback(learning_context, payload)
        
        # Assert
        assert result is not None
        assert result.success
        assert result.metadata['fallback'] == True
        assert result.metadata['reason'] == 'timeout'
    
    @pytest.mark.asyncio
    async def test_error_fallback(self, resources_agent, learning_context):
        """Test error fallback behavior."""
        payload = {
            'intent': 'search_resources',
            'query': 'test query'
        }
        error = Exception("Test error")
        
        # Act
        result = await resources_agent._handle_error_fallback(learning_context, payload, error)
        
        # Assert
        assert result is not None
        assert result.success
        assert result.metadata['fallback'] == True
        assert result.metadata['reason'] == 'service_error'