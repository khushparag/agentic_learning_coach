"""
Unit tests for DocumentationMCP implementation.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from src.adapters.services.documentation_mcp import DocumentationMCP
from src.ports.services.mcp_tools import LearningResource, ResourceType, DifficultyLevel


class TestDocumentationMCP:
    """Test cases for DocumentationMCP."""
    
    @pytest.fixture
    def documentation_mcp(self):
        """Create DocumentationMCP instance for testing."""
        return DocumentationMCP(cache_ttl_hours=1)
    
    @pytest.fixture
    def sample_resource(self):
        """Create sample learning resource."""
        return LearningResource(
            title="Python Functions Tutorial",
            url="https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
            description="Learn how to define and use functions in Python",
            resource_type=ResourceType.DOCUMENTATION,
            difficulty_level=DifficultyLevel.BEGINNER,
            topics=["python", "functions"],
            language="python",
            quality_score=0.9,
            source="docs.python.org"
        )
    
    @pytest.mark.asyncio
    async def test_search_documentation_success(self, documentation_mcp):
        """Test successful documentation search."""
        # Act
        resources = await documentation_mcp.search_documentation(
            query="python functions",
            language="python",
            max_results=5
        )
        
        # Assert
        assert isinstance(resources, list)
        assert len(resources) <= 5
        
        if resources:
            resource = resources[0]
            assert isinstance(resource, LearningResource)
            assert resource.title
            assert resource.url
            assert resource.description
    
    @pytest.mark.asyncio
    async def test_search_documentation_with_cache(self, documentation_mcp):
        """Test documentation search with caching."""
        query = "python loops"
        language = "python"
        
        # First search
        resources1 = await documentation_mcp.search_documentation(query, language, 3)
        
        # Second search (should use cache)
        resources2 = await documentation_mcp.search_documentation(query, language, 3)
        
        # Should return same results
        assert len(resources1) == len(resources2)
        if resources1:
            assert resources1[0].title == resources2[0].title
    
    @pytest.mark.asyncio
    async def test_get_resource_content_success(self, documentation_mcp):
        """Test successful resource content retrieval."""
        url = "https://example.com/tutorial"
        
        with patch.object(documentation_mcp.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.text = "<html><body><h1>Tutorial</h1><p>Content here</p></body></html>"
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            # Act
            content = await documentation_mcp.get_resource_content(url)
            
            # Assert
            assert content is not None
            assert "Tutorial" in content
            assert "Content here" in content
            mock_get.assert_called_once_with(url, follow_redirects=True)
    
    @pytest.mark.asyncio
    async def test_get_resource_content_failure(self, documentation_mcp):
        """Test resource content retrieval failure."""
        url = "https://invalid-url.com"
        
        with patch.object(documentation_mcp.client, 'get') as mock_get:
            mock_get.side_effect = Exception("Network error")
            
            # Act
            content = await documentation_mcp.get_resource_content(url)
            
            # Assert
            assert content is None
    
    @pytest.mark.asyncio
    async def test_verify_resource_quality(self, documentation_mcp, sample_resource):
        """Test resource quality verification."""
        # Act
        quality_score = await documentation_mcp.verify_resource_quality(sample_resource)
        
        # Assert
        assert isinstance(quality_score, float)
        assert 0.0 <= quality_score <= 1.0
        
        # Should give high score for trusted source
        assert quality_score >= 0.8  # docs.python.org is trusted
    
    @pytest.mark.asyncio
    async def test_verify_resource_quality_unknown_source(self, documentation_mcp):
        """Test quality verification for unknown source."""
        resource = LearningResource(
            title="Random Tutorial",
            url="https://unknown-site.com/tutorial",
            description="Some tutorial",
            resource_type=ResourceType.TUTORIAL,
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            topics=["programming"],
            quality_score=0.0,
            source="unknown-site.com"
        )
        
        # Act
        quality_score = await documentation_mcp.verify_resource_quality(resource)
        
        # Assert
        assert isinstance(quality_score, float)
        assert 0.0 <= quality_score <= 1.0
        # Should give lower score for unknown source
        assert quality_score < 0.8
    
    @pytest.mark.asyncio
    async def test_get_related_resources(self, documentation_mcp, sample_resource):
        """Test finding related resources."""
        # Act
        related_resources = await documentation_mcp.get_related_resources(
            sample_resource, max_results=3
        )
        
        # Assert
        assert isinstance(related_resources, list)
        assert len(related_resources) <= 3
        
        # Should not include the original resource
        for resource in related_resources:
            assert resource.url != sample_resource.url
    
    def test_calculate_relevance(self, documentation_mcp):
        """Test relevance calculation."""
        resource = LearningResource(
            title="Python Functions Guide",
            url="https://example.com",
            description="Learn about Python functions",
            resource_type=ResourceType.DOCUMENTATION,
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            topics=["python", "functions"],
            language="python"
        )
        
        # Test relevance calculation
        relevance = documentation_mcp._calculate_relevance(resource, "python functions")
        assert relevance > 0.5  # Should have high relevance
        
        # Test low relevance
        low_relevance = documentation_mcp._calculate_relevance(resource, "java classes")
        assert low_relevance < relevance
    
    def test_extract_content(self, documentation_mcp):
        """Test content extraction from HTML."""
        html = "<html><body><h1>Title</h1><p>This is content.</p></body></html>"
        
        content = documentation_mcp._extract_content(html, "https://example.com")
        
        assert "Title" in content
        assert "This is content" in content
        assert "<html>" not in content  # HTML tags should be removed
    
    def test_analyze_content_quality(self, documentation_mcp):
        """Test content quality analysis."""
        # Good content with code examples
        good_content = """
        This is a comprehensive tutorial about Python functions.
        
        def example_function():
            return "Hello, World!"
        
        The function above demonstrates basic function syntax.
        """
        
        good_score = documentation_mcp._analyze_content_quality(good_content)
        assert good_score > 0.5
        
        # Poor content (too short)
        poor_content = "Short text"
        poor_score = documentation_mcp._analyze_content_quality(poor_content)
        assert poor_score <= good_score
    
    def test_deduplicate_resources(self, documentation_mcp):
        """Test resource deduplication."""
        resources = [
            LearningResource(
                title="Python Tutorial 1",
                url="https://example.com/1",
                description="Tutorial 1",
                resource_type=ResourceType.TUTORIAL,
                difficulty_level=DifficultyLevel.BEGINNER,
                topics=["python"],
                language="python"
            ),
            LearningResource(
                title="Python Tutorial 2",
                url="https://example.com/1",  # Same URL - should be deduplicated
                description="Tutorial 2",
                resource_type=ResourceType.TUTORIAL,
                difficulty_level=DifficultyLevel.BEGINNER,
                topics=["python"],
                language="python"
            ),
            LearningResource(
                title="Python Tutorial 3",
                url="https://example.com/3",
                description="Tutorial 3",
                resource_type=ResourceType.DOCUMENTATION,
                difficulty_level=DifficultyLevel.INTERMEDIATE,
                topics=["python"],
                language="python"
            )
        ]
        
        # Act
        unique = documentation_mcp._deduplicate_resources(resources)
        
        # Assert
        assert len(unique) == 2  # Should remove duplicate URL
    
    def test_cache_functionality(self, documentation_mcp):
        """Test caching functionality."""
        key = "test_key"
        data = {"test": "data"}
        
        # Test cache miss
        result = documentation_mcp._get_cached_result(key, documentation_mcp._resource_cache)
        assert result is None
        
        # Test cache set
        documentation_mcp._cache_result(key, data, documentation_mcp._resource_cache)
        
        # Test cache hit
        result = documentation_mcp._get_cached_result(key, documentation_mcp._resource_cache)
        assert result == data
        
        # Test cache expiration
        # Manually expire the cache entry
        documentation_mcp._resource_cache[key]['expires'] = datetime.now() - timedelta(hours=1)
        result = documentation_mcp._get_cached_result(key, documentation_mcp._resource_cache)
        assert result is None
        assert key not in documentation_mcp._resource_cache
    
    @pytest.mark.asyncio
    async def test_close(self, documentation_mcp):
        """Test proper cleanup."""
        with patch.object(documentation_mcp.client, 'aclose') as mock_close:
            await documentation_mcp.close()
            mock_close.assert_called_once()
