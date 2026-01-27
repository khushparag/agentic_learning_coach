"""
ResourcesAgent implementation for learning resource discovery and curation.
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from .base.base_agent import BaseAgent
from .base.types import AgentType, LearningContext, AgentResult
from .base.exceptions import ValidationError, AgentProcessingError
from ..ports.services.mcp_tools import (
    IDocumentationMCP, 
    LearningResource, 
    ResourceType, 
    DifficultyLevel
)


logger = logging.getLogger(__name__)


class ResourcesAgent(BaseAgent):
    """
    Agent responsible for discovering, curating, and managing learning resources.
    
    Capabilities:
    - Search and discover relevant learning materials
    - Curate resources based on learner context
    - Verify resource quality and relevance
    - Provide resource recommendations
    - Cache and manage resource metadata
    """
    
    def __init__(self, documentation_mcp: IDocumentationMCP):
        super().__init__(AgentType.RESOURCES)
        self.documentation_mcp = documentation_mcp
        self._supported_intents = [
            'search_resources',
            'get_resource_content',
            'recommend_resources',
            'verify_resource_quality',
            'find_related_resources',
            'curate_learning_path_resources'
        ]
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return self._supported_intents.copy()
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Process resource-related requests."""
        intent = payload.get('intent')
        
        try:
            if intent == 'search_resources':
                return await self._search_resources(context, payload)
            elif intent == 'get_resource_content':
                return await self._get_resource_content(context, payload)
            elif intent == 'recommend_resources':
                return await self._recommend_resources(context, payload)
            elif intent == 'verify_resource_quality':
                return await self._verify_resource_quality(context, payload)
            elif intent == 'find_related_resources':
                return await self._find_related_resources(context, payload)
            elif intent == 'curate_learning_path_resources':
                return await self._curate_learning_path_resources(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except Exception as e:
            self.logger.log_error(f"Resource processing failed for intent {intent}", e, context, intent)
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")
    
    async def _search_resources(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Search for learning resources based on query and context."""
        try:
            # Extract search parameters
            query = payload.get('query', '')
            if not query:
                raise ValidationError("Search query is required")
            
            language = payload.get('language') or self._infer_language_from_context(context)
            max_results = payload.get('max_results', 10)
            resource_types = payload.get('resource_types', [])
            difficulty_filter = payload.get('difficulty_level')
            
            self.logger.log_debug(
                f"Searching resources for query: {query}",
                context, 'search_resources'
            )
            
            # Search using MCP tool
            resources = await self.documentation_mcp.search_documentation(
                query=query,
                language=language,
                max_results=max_results * 2  # Get more to filter
            )
            
            # Filter resources based on context and preferences
            filtered_resources = self._filter_resources_by_context(
                resources, context, resource_types, difficulty_filter
            )
            
            # Limit to requested number
            final_resources = filtered_resources[:max_results]
            
            # Enhance resources with metadata
            enhanced_resources = await self._enhance_resources_metadata(final_resources, context)
            
            self.logger.log_info(
                f"Found {len(enhanced_resources)} resources for query: {query}",
                context, 'search_resources'
            )
            
            return AgentResult.success_result(
                data={
                    'resources': [r.to_dict() for r in enhanced_resources],
                    'query': query,
                    'total_found': len(resources),
                    'filtered_count': len(enhanced_resources)
                },
                next_actions=['verify_resource_quality', 'get_resource_content'],
                metadata={
                    'search_query': query,
                    'language': language,
                    'result_count': len(enhanced_resources)
                }
            )
            
        except Exception as e:
            self.logger.log_error("Resource search failed", e, context, 'search_resources')
            return AgentResult.error_result(
                error=f"Resource search failed: {str(e)}",
                error_code="SEARCH_FAILED"
            )
    
    async def _get_resource_content(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Retrieve content from a specific resource URL."""
        try:
            url = payload.get('url')
            if not url:
                raise ValidationError("Resource URL is required")
            
            self.logger.log_debug(
                f"Retrieving content from URL: {url}",
                context, 'get_resource_content'
            )
            
            # Get content using MCP tool
            content = await self.documentation_mcp.get_resource_content(url)
            
            if content is None:
                return AgentResult.error_result(
                    error="Failed to retrieve resource content",
                    error_code="CONTENT_UNAVAILABLE"
                )
            
            # Process and clean content
            processed_content = self._process_resource_content(content, context)
            
            return AgentResult.success_result(
                data={
                    'url': url,
                    'content': processed_content,
                    'content_length': len(content),
                    'processed_length': len(processed_content)
                },
                metadata={
                    'url': url,
                    'content_available': True
                }
            )
            
        except Exception as e:
            self.logger.log_error("Content retrieval failed", e, context, 'get_resource_content')
            return AgentResult.error_result(
                error=f"Content retrieval failed: {str(e)}",
                error_code="CONTENT_RETRIEVAL_FAILED"
            )
    
    async def _recommend_resources(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Recommend resources based on learner context and preferences."""
        try:
            # Extract recommendation parameters
            topic = payload.get('topic') or context.current_objective
            if not topic:
                raise ValidationError("Topic is required for recommendations")
            
            max_recommendations = payload.get('max_recommendations', 5)
            include_types = payload.get('include_types', [])
            
            self.logger.log_debug(
                f"Generating recommendations for topic: {topic}",
                context, 'recommend_resources'
            )
            
            # Search for resources related to the topic
            search_query = self._build_recommendation_query(topic, context)
            resources = await self.documentation_mcp.search_documentation(
                query=search_query,
                language=self._infer_language_from_context(context),
                max_results=max_recommendations * 3
            )
            
            # Score and rank resources for this learner
            scored_resources = await self._score_resources_for_learner(resources, context)
            
            # Select top recommendations
            recommendations = scored_resources[:max_recommendations]
            
            # Add recommendation reasons
            enhanced_recommendations = self._add_recommendation_reasons(recommendations, context)
            
            return AgentResult.success_result(
                data={
                    'recommendations': [r.to_dict() for r in enhanced_recommendations],
                    'topic': topic,
                    'recommendation_count': len(enhanced_recommendations)
                },
                next_actions=['get_resource_content'],
                metadata={
                    'topic': topic,
                    'learner_level': context.skill_level,
                    'recommendation_strategy': 'context_based'
                }
            )
            
        except Exception as e:
            self.logger.log_error("Resource recommendation failed", e, context, 'recommend_resources')
            return AgentResult.error_result(
                error=f"Resource recommendation failed: {str(e)}",
                error_code="RECOMMENDATION_FAILED"
            )
    
    async def _verify_resource_quality(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Verify the quality of a learning resource."""
        try:
            resource_data = payload.get('resource')
            if not resource_data:
                raise ValidationError("Resource data is required")
            
            # Convert to LearningResource object using from_dict
            resource = LearningResource.from_dict(resource_data)
            
            self.logger.log_debug(
                f"Verifying quality for resource: {resource.title}",
                context, 'verify_resource_quality'
            )
            
            # Verify quality using MCP tool
            quality_score = await self.documentation_mcp.verify_resource_quality(resource)
            
            # Additional context-based quality assessment
            context_relevance = self._assess_context_relevance(resource, context)
            
            # Combined quality score
            final_score = (quality_score * 0.7) + (context_relevance * 0.3)
            
            # Determine quality rating
            quality_rating = self._get_quality_rating(final_score)
            
            return AgentResult.success_result(
                data={
                    'resource': resource.to_dict(),
                    'quality_score': final_score,
                    'quality_rating': quality_rating,
                    'base_quality': quality_score,
                    'context_relevance': context_relevance
                },
                metadata={
                    'resource_url': resource.url,
                    'quality_verified': True
                }
            )
            
        except Exception as e:
            self.logger.log_error("Quality verification failed", e, context, 'verify_resource_quality')
            return AgentResult.error_result(
                error=f"Quality verification failed: {str(e)}",
                error_code="QUALITY_VERIFICATION_FAILED"
            )
    
    async def _find_related_resources(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Find resources related to a given resource."""
        try:
            resource_data = payload.get('resource')
            if not resource_data:
                raise ValidationError("Resource data is required")
            
            max_related = payload.get('max_related', 5)
            
            # Convert to LearningResource object using from_dict
            base_resource = LearningResource.from_dict(resource_data)
            
            self.logger.log_debug(
                f"Finding related resources for: {base_resource.title}",
                context, 'find_related_resources'
            )
            
            # Find related resources using MCP tool
            related_resources = await self.documentation_mcp.get_related_resources(
                resource=base_resource,
                max_results=max_related
            )
            
            # Filter and enhance related resources
            filtered_related = self._filter_resources_by_context(related_resources, context)
            enhanced_related = await self._enhance_resources_metadata(filtered_related, context)
            
            return AgentResult.success_result(
                data={
                    'base_resource': base_resource.to_dict(),
                    'related_resources': [r.to_dict() for r in enhanced_related],
                    'related_count': len(enhanced_related)
                },
                next_actions=['verify_resource_quality'],
                metadata={
                    'base_resource_url': base_resource.url,
                    'related_found': len(enhanced_related)
                }
            )
            
        except Exception as e:
            self.logger.log_error("Related resource search failed", e, context, 'find_related_resources')
            return AgentResult.error_result(
                error=f"Related resource search failed: {str(e)}",
                error_code="RELATED_SEARCH_FAILED"
            )
    
    async def _curate_learning_path_resources(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Curate resources for a complete learning path."""
        try:
            topics = payload.get('topics', [])
            if not topics:
                raise ValidationError("Topics list is required")
            
            resources_per_topic = payload.get('resources_per_topic', 3)
            
            self.logger.log_debug(
                f"Curating resources for {len(topics)} topics",
                context, 'curate_learning_path_resources'
            )
            
            curated_resources = {}
            
            for topic in topics:
                # Search resources for each topic
                topic_resources = await self.documentation_mcp.search_documentation(
                    query=topic,
                    language=self._infer_language_from_context(context),
                    max_results=resources_per_topic * 2
                )
                
                # Filter and select best resources for this topic
                filtered_resources = self._filter_resources_by_context(topic_resources, context)
                scored_resources = await self._score_resources_for_learner(filtered_resources, context)
                
                # Select diverse resource types
                diverse_resources = self._select_diverse_resources(
                    scored_resources, resources_per_topic
                )
                
                curated_resources[topic] = [r.to_dict() for r in diverse_resources]
            
            # Calculate curation statistics
            total_resources = sum(len(resources) for resources in curated_resources.values())
            
            return AgentResult.success_result(
                data={
                    'curated_resources': curated_resources,
                    'topics': topics,
                    'total_resources': total_resources,
                    'resources_per_topic': resources_per_topic
                },
                next_actions=['verify_resource_quality'],
                metadata={
                    'topics_count': len(topics),
                    'total_resources': total_resources,
                    'curation_strategy': 'diverse_types'
                }
            )
            
        except Exception as e:
            self.logger.log_error("Learning path curation failed", e, context, 'curate_learning_path_resources')
            return AgentResult.error_result(
                error=f"Learning path curation failed: {str(e)}",
                error_code="CURATION_FAILED"
            )
    
    def _infer_language_from_context(self, context: LearningContext) -> Optional[str]:
        """Infer programming language from learning context."""
        # Check learning goals for language hints
        for goal in context.learning_goals:
            goal_lower = goal.lower()
            goal_words = goal_lower.split()
            
            if 'python' in goal_lower:
                return 'python'
            elif 'typescript' in goal_lower:
                return 'typescript'
            elif 'javascript' in goal_lower or 'js' in goal_words:
                return 'javascript'
            elif 'react' in goal_lower or 'vue' in goal_lower or 'angular' in goal_lower:
                return 'javascript'
            elif 'java' in goal_words or (goal_lower.startswith('java ') or goal_lower.endswith(' java') or goal_lower == 'java'):
                return 'java'
            elif 'golang' in goal_lower or 'go' in goal_words:
                return 'go'
        
        # Check current objective
        if context.current_objective:
            objective_lower = context.current_objective.lower()
            objective_words = objective_lower.split()
            
            if 'python' in objective_lower:
                return 'python'
            elif 'javascript' in objective_lower or 'js' in objective_words:
                return 'javascript'
            elif 'java' in objective_words:
                return 'java'
            elif 'go' in objective_words or 'golang' in objective_lower:
                return 'go'
        
        return None
    
    def _filter_resources_by_context(self, 
                                   resources: List[LearningResource], 
                                   context: LearningContext,
                                   resource_types: List[str] = None,
                                   difficulty_filter: str = None) -> List[LearningResource]:
        """Filter resources based on learner context and preferences."""
        filtered = []
        
        for resource in resources:
            # Filter by resource type if specified
            if resource_types and resource.resource_type.value not in resource_types:
                continue
            
            # Filter by difficulty if specified
            if difficulty_filter and resource.difficulty_level.value != difficulty_filter:
                continue
            
            # Filter by skill level compatibility
            if not self._is_difficulty_appropriate(resource.difficulty_level, context.skill_level):
                continue
            
            # Filter by topic relevance
            if not self._is_topically_relevant(resource, context):
                continue
            
            filtered.append(resource)
        
        return filtered
    
    def _is_difficulty_appropriate(self, resource_difficulty: DifficultyLevel, learner_level: Optional[str]) -> bool:
        """Check if resource difficulty is appropriate for learner level."""
        if not learner_level:
            return True
        
        # Map learner levels to difficulty levels
        level_mapping = {
            'beginner': [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE],
            'intermediate': [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED],
            'advanced': [DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT],
            'expert': [DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
        }
        
        appropriate_levels = level_mapping.get(learner_level.lower(), [])
        return resource_difficulty in appropriate_levels
    
    def _is_topically_relevant(self, resource: LearningResource, context: LearningContext) -> bool:
        """Check if resource is topically relevant to learning context."""
        # Check against learning goals
        for goal in context.learning_goals:
            goal_lower = goal.lower()
            # Check if goal matches any topic
            if any(goal_lower in topic.lower() or topic.lower() in goal_lower for topic in resource.topics):
                return True
            # Check if goal matches resource language
            if resource.language and goal_lower == resource.language.lower():
                return True
        
        # Check against current objective
        if context.current_objective:
            objective_lower = context.current_objective.lower()
            if any(objective_lower in topic.lower() or topic.lower() in objective_lower for topic in resource.topics):
                return True
        
        # If no learning goals or objectives, be permissive
        if not context.learning_goals and not context.current_objective:
            return len(resource.topics) > 0
        
        return False
    
    async def _enhance_resources_metadata(self, 
                                        resources: List[LearningResource], 
                                        context: LearningContext) -> List[LearningResource]:
        """Enhance resources with additional metadata."""
        enhanced = []
        
        for resource in resources:
            # Create a copy to avoid modifying original
            enhanced_resource = LearningResource(
                title=resource.title,
                url=resource.url,
                description=resource.description,
                resource_type=resource.resource_type,
                difficulty_level=resource.difficulty_level,
                topics=resource.topics,
                language=resource.language,
                last_updated=resource.last_updated,
                quality_score=resource.quality_score,
                source=resource.source
            )
            
            # Enhance quality score if not set
            if enhanced_resource.quality_score == 0.0:
                try:
                    enhanced_resource.quality_score = await self.documentation_mcp.verify_resource_quality(resource)
                except Exception as e:
                    self.logger.log_warning(f"Failed to verify quality for {resource.url}: {e}")
                    enhanced_resource.quality_score = 0.5
            
            enhanced.append(enhanced_resource)
        
        return enhanced
    
    async def _score_resources_for_learner(self, 
                                         resources: List[LearningResource], 
                                         context: LearningContext) -> List[LearningResource]:
        """Score and rank resources for a specific learner."""
        scored_resources = []
        
        for resource in resources:
            # Calculate learner-specific score
            relevance_score = self._calculate_relevance_score(resource, context)
            difficulty_score = self._calculate_difficulty_score(resource, context)
            quality_score = resource.quality_score
            
            # Combined score
            combined_score = (relevance_score * 0.4) + (difficulty_score * 0.3) + (quality_score * 0.3)
            
            # Store score in metadata (we can't modify the dataclass)
            resource_dict = resource.to_dict()
            resource_dict['learner_score'] = combined_score
            
            scored_resources.append((combined_score, resource))
        
        # Sort by score (descending)
        scored_resources.sort(key=lambda x: x[0], reverse=True)
        
        return [resource for _, resource in scored_resources]
    
    def _calculate_relevance_score(self, resource: LearningResource, context: LearningContext) -> float:
        """Calculate relevance score for a resource."""
        score = 0.0
        
        # Check topic overlap with learning goals
        for goal in context.learning_goals:
            if any(goal.lower() in topic.lower() for topic in resource.topics):
                score += 0.3
        
        # Check current objective relevance
        if context.current_objective:
            if any(context.current_objective.lower() in topic.lower() for topic in resource.topics):
                score += 0.4
        
        # Language match bonus
        inferred_language = self._infer_language_from_context(context)
        if inferred_language and resource.language == inferred_language:
            score += 0.3
        
        return min(1.0, score)
    
    def _calculate_difficulty_score(self, resource: LearningResource, context: LearningContext) -> float:
        """Calculate difficulty appropriateness score."""
        if not context.skill_level:
            return 0.5
        
        # Perfect match gets highest score
        if resource.difficulty_level.value == context.skill_level.lower():
            return 1.0
        
        # Adjacent levels get medium score
        level_order = ['beginner', 'intermediate', 'advanced', 'expert']
        try:
            learner_idx = level_order.index(context.skill_level.lower())
            resource_idx = level_order.index(resource.difficulty_level.value)
            
            diff = abs(learner_idx - resource_idx)
            if diff == 1:
                return 0.7
            elif diff == 2:
                return 0.4
            else:
                return 0.2
        except ValueError:
            return 0.5
    
    def _build_recommendation_query(self, topic: str, context: LearningContext) -> str:
        """Build an optimized query for resource recommendations."""
        query_parts = [topic]
        
        # Add language context
        language = self._infer_language_from_context(context)
        if language:
            query_parts.append(language)
        
        # Add skill level context
        if context.skill_level:
            query_parts.append(context.skill_level)
        
        return " ".join(query_parts)
    
    def _add_recommendation_reasons(self, 
                                  resources: List[LearningResource], 
                                  context: LearningContext) -> List[LearningResource]:
        """Add recommendation reasons to resources."""
        # In a real implementation, we would add recommendation reasons
        # For now, we just return the resources as-is
        return resources
    
    def _assess_context_relevance(self, resource: LearningResource, context: LearningContext) -> float:
        """Assess how relevant a resource is to the current learning context."""
        relevance = 0.0
        
        # Topic relevance
        relevance += self._calculate_relevance_score(resource, context) * 0.6
        
        # Difficulty appropriateness
        relevance += self._calculate_difficulty_score(resource, context) * 0.4
        
        return relevance
    
    def _get_quality_rating(self, score: float) -> str:
        """Convert quality score to rating."""
        if score >= 0.8:
            return "excellent"
        elif score >= 0.6:
            return "good"
        elif score >= 0.4:
            return "fair"
        else:
            return "poor"
    
    def _select_diverse_resources(self, 
                                resources: List[LearningResource], 
                                max_count: int) -> List[LearningResource]:
        """Select diverse resources by type and source."""
        if len(resources) <= max_count:
            return resources
        
        selected = []
        used_types = set()
        used_sources = set()
        
        # First pass: select one of each type
        for resource in resources:
            if len(selected) >= max_count:
                break
            
            if resource.resource_type not in used_types:
                selected.append(resource)
                used_types.add(resource.resource_type)
                used_sources.add(resource.source)
        
        # Second pass: fill remaining slots with best remaining resources
        for resource in resources:
            if len(selected) >= max_count:
                break
            
            if resource not in selected:
                selected.append(resource)
        
        return selected[:max_count]
    
    def _process_resource_content(self, content: str, context: LearningContext) -> str:
        """Process and clean resource content for learner consumption."""
        # Basic content processing
        processed = content.strip()
        
        # Limit content length based on learner level
        max_lengths = {
            'beginner': 2000,
            'intermediate': 4000,
            'advanced': 6000,
            'expert': 8000
        }
        
        max_length = max_lengths.get(context.skill_level, 4000)
        
        if len(processed) > max_length:
            processed = processed[:max_length] + "\n\n[Content truncated for readability...]"
        
        return processed
    
    async def _handle_timeout_fallback(self, 
                                     context: LearningContext, 
                                     payload: Dict[str, Any]) -> Optional[AgentResult]:
        """Handle timeout with cached or simplified results."""
        intent = payload.get('intent')
        
        if intent == 'search_resources':
            # Return basic search results
            query = payload.get('query', '')
            return AgentResult.success_result(
                data={
                    'resources': [],
                    'query': query,
                    'message': 'Search timed out, please try again with a more specific query'
                },
                metadata={'fallback': True, 'reason': 'timeout'}
            )
        
        return None
    
    async def _handle_error_fallback(self, 
                                   context: LearningContext, 
                                   payload: Dict[str, Any],
                                   error: Exception) -> Optional[AgentResult]:
        """Handle errors with graceful degradation."""
        intent = payload.get('intent')
        
        if intent == 'search_resources':
            # Return empty results with helpful message
            return AgentResult.success_result(
                data={
                    'resources': [],
                    'query': payload.get('query', ''),
                    'message': 'Resource search temporarily unavailable, please try again later'
                },
                metadata={'fallback': True, 'reason': 'service_error'}
            )
        
        return None