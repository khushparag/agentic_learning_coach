"""
Documentation MCP implementation for resource discovery and retrieval.
"""
import asyncio
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
from urllib.parse import urljoin, urlparse

from ...ports.services.mcp_tools import (
    IDocumentationMCP, 
    LearningResource, 
    ResourceType, 
    DifficultyLevel
)


logger = logging.getLogger(__name__)


class DocumentationMCP(IDocumentationMCP):
    """
    Documentation MCP implementation using web search and content retrieval.
    
    This implementation provides:
    - Resource search and discovery
    - Content retrieval and caching
    - Quality assessment
    - Resource prioritization
    """
    
    def __init__(self, cache_ttl_hours: int = 24):
        self.cache_ttl_hours = cache_ttl_hours
        self._resource_cache: Dict[str, Dict[str, Any]] = {}
        self._content_cache: Dict[str, Dict[str, Any]] = {}
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Known high-quality documentation sources
        self.trusted_sources = {
            'developer.mozilla.org': {'quality': 0.95, 'type': ResourceType.DOCUMENTATION},
            'docs.python.org': {'quality': 0.95, 'type': ResourceType.DOCUMENTATION},
            'nodejs.org': {'quality': 0.9, 'type': ResourceType.DOCUMENTATION},
            'reactjs.org': {'quality': 0.9, 'type': ResourceType.DOCUMENTATION},
            'stackoverflow.com': {'quality': 0.8, 'type': ResourceType.REFERENCE},
            'github.com': {'quality': 0.7, 'type': ResourceType.EXAMPLE},
            'medium.com': {'quality': 0.6, 'type': ResourceType.TUTORIAL},
            'dev.to': {'quality': 0.6, 'type': ResourceType.TUTORIAL}
        }
    
    async def search_documentation(self, 
                                 query: str, 
                                 language: Optional[str] = None,
                                 max_results: int = 10) -> List[LearningResource]:
        """Search for documentation resources."""
        try:
            # Check cache first
            cache_key = f"search:{query}:{language}:{max_results}"
            cached_result = self._get_cached_result(cache_key, self._resource_cache)
            if cached_result:
                return [LearningResource(**resource) for resource in cached_result]
            
            # Build search query
            search_query = self._build_search_query(query, language)
            
            # Perform search using multiple strategies
            resources = []
            
            # Strategy 1: Search official documentation
            official_docs = await self._search_official_docs(search_query, language)
            resources.extend(official_docs)
            
            # Strategy 2: Search community resources
            community_resources = await self._search_community_resources(search_query, language)
            resources.extend(community_resources)
            
            # Strategy 3: Search code examples
            code_examples = await self._search_code_examples(search_query, language)
            resources.extend(code_examples)
            
            # Deduplicate and rank resources
            unique_resources = self._deduplicate_resources(resources)
            ranked_resources = await self._rank_resources(unique_resources, query)
            
            # Limit results
            final_resources = ranked_resources[:max_results]
            
            # Cache results
            self._cache_result(cache_key, [r.to_dict() for r in final_resources], self._resource_cache)
            
            return final_resources
            
        except Exception as e:
            logger.error(f"Documentation search failed: {e}")
            return []
    
    async def get_resource_content(self, url: str) -> Optional[str]:
        """Retrieve content from a resource URL."""
        try:
            # Check cache first
            cached_content = self._get_cached_result(url, self._content_cache)
            if cached_content:
                return cached_content
            
            # Fetch content
            response = await self.client.get(url, follow_redirects=True)
            response.raise_for_status()
            
            # Extract meaningful content
            content = self._extract_content(response.text, url)
            
            # Cache content
            self._cache_result(url, content, self._content_cache)
            
            return content
            
        except Exception as e:
            logger.error(f"Failed to retrieve content from {url}: {e}")
            return None
    
    async def verify_resource_quality(self, resource: LearningResource) -> float:
        """Verify and score resource quality."""
        try:
            quality_score = 0.0
            
            # Base score from trusted sources
            domain = urlparse(resource.url).netloc.lower()
            for trusted_domain, info in self.trusted_sources.items():
                if trusted_domain in domain:
                    quality_score = info['quality']
                    break
            else:
                quality_score = 0.5  # Default for unknown sources
            
            # Adjust based on content analysis
            content = await self.get_resource_content(resource.url)
            if content:
                content_score = self._analyze_content_quality(content)
                quality_score = (quality_score + content_score) / 2
            
            # Adjust based on metadata
            metadata_score = self._analyze_metadata_quality(resource)
            quality_score = (quality_score * 0.7) + (metadata_score * 0.3)
            
            return min(1.0, max(0.0, quality_score))
            
        except Exception as e:
            logger.error(f"Quality verification failed for {resource.url}: {e}")
            return 0.3  # Low default score for failed verification
    
    async def get_related_resources(self, 
                                  resource: LearningResource,
                                  max_results: int = 5) -> List[LearningResource]:
        """Find resources related to the given resource."""
        try:
            # Build related search query from resource topics
            related_query = " ".join(resource.topics[:3])  # Use top 3 topics
            
            # Search for related resources
            related_resources = await self.search_documentation(
                related_query, 
                resource.language, 
                max_results * 2  # Get more to filter out the original
            )
            
            # Filter out the original resource and similar URLs
            filtered_resources = [
                r for r in related_resources 
                if r.url != resource.url and not self._are_similar_urls(r.url, resource.url)
            ]
            
            return filtered_resources[:max_results]
            
        except Exception as e:
            logger.error(f"Failed to find related resources: {e}")
            return []
    
    def _build_search_query(self, query: str, language: Optional[str]) -> str:
        """Build optimized search query."""
        search_terms = [query]
        
        if language:
            search_terms.append(language)
            
        # Add common documentation keywords
        search_terms.extend(["documentation", "tutorial", "guide"])
        
        return " ".join(search_terms)
    
    async def _search_official_docs(self, query: str, language: Optional[str]) -> List[LearningResource]:
        """Search official documentation sources."""
        resources = []
        
        # Language-specific official docs
        official_sites = {
            'python': ['docs.python.org', 'python.org'],
            'javascript': ['developer.mozilla.org', 'nodejs.org'],
            'typescript': ['typescriptlang.org'],
            'react': ['reactjs.org', 'react.dev'],
            'java': ['docs.oracle.com/javase', 'openjdk.org'],
            'go': ['golang.org', 'go.dev']
        }
        
        if language and language.lower() in official_sites:
            for site in official_sites[language.lower()]:
                try:
                    # Simulate search on official site
                    # In real implementation, this would use site-specific APIs
                    resource = LearningResource(
                        title=f"{language.title()} Official Documentation - {query}",
                        url=f"https://{site}/search?q={query}",
                        description=f"Official {language} documentation for {query}",
                        resource_type=ResourceType.DOCUMENTATION,
                        difficulty_level=DifficultyLevel.INTERMEDIATE,
                        topics=[language, query],
                        language=language,
                        quality_score=0.95,
                        source=site
                    )
                    resources.append(resource)
                except Exception as e:
                    logger.debug(f"Failed to create official doc resource: {e}")
        
        return resources
    
    async def _search_community_resources(self, query: str, language: Optional[str]) -> List[LearningResource]:
        """Search community resources like Stack Overflow, tutorials."""
        resources = []
        
        # Simulate community resource search
        community_sources = [
            {
                'name': 'Stack Overflow',
                'url': 'stackoverflow.com',
                'type': ResourceType.REFERENCE,
                'quality': 0.8
            },
            {
                'name': 'Dev.to',
                'url': 'dev.to',
                'type': ResourceType.TUTORIAL,
                'quality': 0.6
            },
            {
                'name': 'Medium',
                'url': 'medium.com',
                'type': ResourceType.ARTICLE,
                'quality': 0.6
            }
        ]
        
        for source in community_sources:
            try:
                resource = LearningResource(
                    title=f"{query} - {source['name']} Tutorial",
                    url=f"https://{source['url']}/search?q={query}",
                    description=f"Community tutorial about {query}",
                    resource_type=source['type'],
                    difficulty_level=DifficultyLevel.INTERMEDIATE,
                    topics=[query] + ([language] if language else []),
                    language=language,
                    quality_score=source['quality'],
                    source=source['name']
                )
                resources.append(resource)
            except Exception as e:
                logger.debug(f"Failed to create community resource: {e}")
        
        return resources
    
    async def _search_code_examples(self, query: str, language: Optional[str]) -> List[LearningResource]:
        """Search for code examples."""
        resources = []
        
        if language:
            try:
                resource = LearningResource(
                    title=f"{query} Code Examples in {language}",
                    url=f"https://github.com/search?q={query}+language:{language}",
                    description=f"Code examples for {query} in {language}",
                    resource_type=ResourceType.EXAMPLE,
                    difficulty_level=DifficultyLevel.INTERMEDIATE,
                    topics=[query, language, "examples"],
                    language=language,
                    quality_score=0.7,
                    source="GitHub"
                )
                resources.append(resource)
            except Exception as e:
                logger.debug(f"Failed to create code example resource: {e}")
        
        return resources
    
    def _deduplicate_resources(self, resources: List[LearningResource]) -> List[LearningResource]:
        """Remove duplicate resources."""
        seen_urls = set()
        unique_resources = []
        
        for resource in resources:
            if resource.url not in seen_urls:
                seen_urls.add(resource.url)
                unique_resources.append(resource)
        
        return unique_resources
    
    async def _rank_resources(self, resources: List[LearningResource], query: str) -> List[LearningResource]:
        """Rank resources by relevance and quality."""
        scored_resources = []
        
        for resource in resources:
            # Calculate relevance score
            relevance_score = self._calculate_relevance(resource, query)
            
            # Verify quality if not already set
            if resource.quality_score == 0.0:
                resource.quality_score = await self.verify_resource_quality(resource)
            
            # Combined score
            combined_score = (relevance_score * 0.6) + (resource.quality_score * 0.4)
            scored_resources.append((combined_score, resource))
        
        # Sort by combined score (descending)
        scored_resources.sort(key=lambda x: x[0], reverse=True)
        
        return [resource for _, resource in scored_resources]
    
    def _calculate_relevance(self, resource: LearningResource, query: str) -> float:
        """Calculate relevance score for a resource."""
        score = 0.0
        query_lower = query.lower()
        
        # Title relevance
        if query_lower in resource.title.lower():
            score += 0.4
        
        # Description relevance
        if query_lower in resource.description.lower():
            score += 0.3
        
        # Topic relevance
        for topic in resource.topics:
            if query_lower in topic.lower():
                score += 0.2
                break
        
        # Resource type bonus
        if resource.resource_type == ResourceType.DOCUMENTATION:
            score += 0.1
        
        return min(1.0, score)
    
    def _extract_content(self, html: str, url: str) -> str:
        """Extract meaningful content from HTML."""
        # Simple content extraction (in real implementation, use proper HTML parser)
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit content length
        max_length = 5000
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        return text
    
    def _analyze_content_quality(self, content: str) -> float:
        """Analyze content quality based on various factors."""
        score = 0.5  # Base score
        
        # Length check
        if len(content) > 500:
            score += 0.2
        
        # Code examples check
        if 'def ' in content or 'function' in content or 'class ' in content:
            score += 0.2
        
        # Structure check (headings, lists)
        if any(marker in content for marker in ['#', '*', '1.', '2.']):
            score += 0.1
        
        return min(1.0, score)
    
    def _analyze_metadata_quality(self, resource: LearningResource) -> float:
        """Analyze resource metadata quality."""
        score = 0.5  # Base score
        
        # Title quality
        if len(resource.title) > 10 and len(resource.title) < 100:
            score += 0.2
        
        # Description quality
        if len(resource.description) > 20:
            score += 0.2
        
        # Topics coverage
        if len(resource.topics) >= 2:
            score += 0.1
        
        return min(1.0, score)
    
    def _are_similar_urls(self, url1: str, url2: str) -> bool:
        """Check if two URLs are similar."""
        parsed1 = urlparse(url1)
        parsed2 = urlparse(url2)
        
        # Same domain and similar path
        return (parsed1.netloc == parsed2.netloc and 
                parsed1.path[:20] == parsed2.path[:20])
    
    def _get_cached_result(self, key: str, cache: Dict[str, Dict[str, Any]]) -> Any:
        """Get cached result if still valid."""
        if key in cache:
            cached_data = cache[key]
            if datetime.now() < cached_data['expires']:
                return cached_data['data']
            else:
                del cache[key]
        return None
    
    def _cache_result(self, key: str, data: Any, cache: Dict[str, Dict[str, Any]]) -> None:
        """Cache result with expiration."""
        expires = datetime.now() + timedelta(hours=self.cache_ttl_hours)
        cache[key] = {
            'data': data,
            'expires': expires
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()