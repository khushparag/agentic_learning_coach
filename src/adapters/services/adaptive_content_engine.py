"""
Adaptive Content Engine.

Adapts learning content based on user skill level and performance.
Implements the adaptation policy: 2 failures → reduce difficulty + recap;
quick pass → add stretch task.
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from src.domain.entities.learning_content import (
    StructuredLesson, ContentSection, ContentSectionType,
    ConceptCard, CodeExample, KnowledgeCheck
)

logger = logging.getLogger(__name__)


class AdaptationAction(str, Enum):
    """Types of content adaptation actions."""
    NONE = "none"
    SIMPLIFY = "simplify"
    ADD_EXAMPLES = "add_examples"
    ADD_ANALOGIES = "add_analogies"
    REDUCE_DIFFICULTY = "reduce_difficulty"
    INCREASE_DIFFICULTY = "increase_difficulty"
    ADD_RECAP = "add_recap"
    SKIP_REDUNDANT = "skip_redundant"


@dataclass
class PerformanceData:
    """User performance data for adaptation decisions."""
    user_id: str
    lesson_id: str
    knowledge_check_results: Dict[str, Dict[str, Any]]
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    time_spent_seconds: int = 0
    hints_requested: int = 0
    alternative_explanations_requested: int = 0


@dataclass
class ContentAdjustment:
    """Describes an adjustment to be made to content."""
    action: AdaptationAction
    target_section_id: Optional[str] = None
    reason: str = ""
    parameters: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}


@dataclass
class AdaptedContent:
    """Content that has been adapted for a user."""
    lesson: StructuredLesson
    adjustments_made: List[ContentAdjustment]
    skill_level_adjusted: bool = False
    new_skill_level: Optional[str] = None


class AdaptiveContentEngine:
    """
    Adapts learning content based on user performance and skill level.
    
    Adaptation rules:
    - Beginner: More analogies, simpler explanations, more examples
    - Intermediate: Balanced theory and practice, best practices
    - Advanced: Focus on edge cases, performance, advanced patterns
    
    Performance-based adaptation:
    - 2+ consecutive failures: Reduce difficulty, add recap
    - 3+ consecutive successes: Reduce redundancy, add stretch content
    """
    
    # Thresholds for adaptation
    FAILURE_THRESHOLD = 2  # Consecutive failures before reducing difficulty
    SUCCESS_THRESHOLD = 3  # Consecutive successes before increasing difficulty
    HINT_THRESHOLD = 3     # Hints requested before adding more examples
    
    def __init__(self):
        self.adaptation_history: Dict[str, List[ContentAdjustment]] = {}
    
    def adapt_lesson_for_skill_level(
        self,
        lesson: StructuredLesson,
        skill_level: str
    ) -> AdaptedContent:
        """
        Adapt lesson content based on skill level.
        
        Args:
            lesson: The lesson to adapt
            skill_level: beginner, intermediate, or advanced
            
        Returns:
            AdaptedContent with skill-appropriate modifications
        """
        logger.info(f"Adapting lesson {lesson.id} for {skill_level} level")
        
        adjustments = []
        adapted_sections = []
        
        for section in lesson.sections:
            adapted_section, section_adjustments = self._adapt_section_for_level(
                section, skill_level
            )
            adapted_sections.append(adapted_section)
            adjustments.extend(section_adjustments)
        
        # Create adapted lesson
        adapted_lesson = StructuredLesson(
            id=lesson.id,
            title=lesson.title,
            topic=lesson.topic,
            metadata=lesson.metadata,
            objectives=self._adapt_objectives(lesson.objectives, skill_level),
            sections=adapted_sections,
            key_takeaways=lesson.key_takeaways,
            related_resources=lesson.related_resources,
            version=lesson.version
        )
        
        return AdaptedContent(
            lesson=adapted_lesson,
            adjustments_made=adjustments,
            skill_level_adjusted=False
        )
    
    def adapt_based_on_performance(
        self,
        lesson: StructuredLesson,
        performance: PerformanceData
    ) -> AdaptedContent:
        """
        Adapt content based on user performance.
        
        Args:
            lesson: The lesson to adapt
            performance: User's performance data
            
        Returns:
            AdaptedContent with performance-based modifications
        """
        logger.info(
            f"Adapting lesson {lesson.id} based on performance: "
            f"failures={performance.consecutive_failures}, "
            f"successes={performance.consecutive_successes}"
        )
        
        adjustments = []
        skill_level_adjusted = False
        new_skill_level = None
        
        # Check for struggle indicators
        if performance.consecutive_failures >= self.FAILURE_THRESHOLD:
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.REDUCE_DIFFICULTY,
                reason=f"User has {performance.consecutive_failures} consecutive failures"
            ))
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.ADD_RECAP,
                reason="Adding recap content to reinforce concepts"
            ))
            skill_level_adjusted = True
            new_skill_level = self._reduce_skill_level(lesson.metadata.difficulty)
        
        # Check for mastery indicators
        elif performance.consecutive_successes >= self.SUCCESS_THRESHOLD:
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.SKIP_REDUNDANT,
                reason=f"User has {performance.consecutive_successes} consecutive successes"
            ))
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.INCREASE_DIFFICULTY,
                reason="User is ready for more challenging content"
            ))
        
        # Check for hint usage
        if performance.hints_requested >= self.HINT_THRESHOLD:
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.ADD_EXAMPLES,
                reason=f"User requested {performance.hints_requested} hints"
            ))
        
        # Check for alternative explanation requests
        if performance.alternative_explanations_requested > 0:
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.ADD_ANALOGIES,
                reason="User requested alternative explanations"
            ))
        
        # Apply adjustments
        adapted_lesson = self._apply_adjustments(lesson, adjustments)
        
        return AdaptedContent(
            lesson=adapted_lesson,
            adjustments_made=adjustments,
            skill_level_adjusted=skill_level_adjusted,
            new_skill_level=new_skill_level
        )

    def get_recommended_adjustments(
        self,
        performance: PerformanceData
    ) -> List[ContentAdjustment]:
        """
        Get recommended adjustments based on performance without applying them.
        
        Args:
            performance: User's performance data
            
        Returns:
            List of recommended adjustments
        """
        adjustments = []
        
        # Analyze knowledge check performance
        total_checks = len(performance.knowledge_check_results)
        if total_checks > 0:
            correct_count = sum(
                1 for result in performance.knowledge_check_results.values()
                if result.get("is_correct", False)
            )
            accuracy = correct_count / total_checks
            
            if accuracy < 0.5:
                adjustments.append(ContentAdjustment(
                    action=AdaptationAction.SIMPLIFY,
                    reason=f"Knowledge check accuracy is {accuracy:.0%}",
                    parameters={"accuracy": accuracy}
                ))
            elif accuracy > 0.9:
                adjustments.append(ContentAdjustment(
                    action=AdaptationAction.INCREASE_DIFFICULTY,
                    reason=f"Knowledge check accuracy is {accuracy:.0%}",
                    parameters={"accuracy": accuracy}
                ))
        
        # Analyze time spent
        if performance.time_spent_seconds > 0:
            # If spending too much time, might need simpler content
            # This is a simplified heuristic
            if performance.time_spent_seconds > 1800:  # 30 minutes
                adjustments.append(ContentAdjustment(
                    action=AdaptationAction.ADD_EXAMPLES,
                    reason="User is spending significant time on content"
                ))
        
        return adjustments
    
    def _adapt_section_for_level(
        self,
        section: ContentSection,
        skill_level: str
    ) -> tuple[ContentSection, List[ContentAdjustment]]:
        """Adapt a single section based on skill level."""
        adjustments = []
        
        if section.type == ContentSectionType.CONCEPT_CARD:
            adapted_content, adj = self._adapt_concept_card(section.content, skill_level)
            adjustments.extend(adj)
            return ContentSection(
                id=section.id,
                type=section.type,
                order=section.order,
                content=adapted_content,
                completion_required=section.completion_required
            ), adjustments
        
        elif section.type == ContentSectionType.CODE_EXAMPLE:
            adapted_content, adj = self._adapt_code_example(section.content, skill_level)
            adjustments.extend(adj)
            return ContentSection(
                id=section.id,
                type=section.type,
                order=section.order,
                content=adapted_content,
                completion_required=section.completion_required
            ), adjustments
        
        elif section.type == ContentSectionType.KNOWLEDGE_CHECK:
            adapted_content, adj = self._adapt_knowledge_check(section.content, skill_level)
            adjustments.extend(adj)
            return ContentSection(
                id=section.id,
                type=section.type,
                order=section.order,
                content=adapted_content,
                completion_required=section.completion_required
            ), adjustments
        
        # Return unchanged for other types
        return section, adjustments
    
    def _adapt_concept_card(
        self,
        card: ConceptCard,
        skill_level: str
    ) -> tuple[ConceptCard, List[ContentAdjustment]]:
        """Adapt a concept card based on skill level."""
        adjustments = []
        
        if skill_level == "beginner":
            # Beginners get more emphasis on analogies
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.ADD_ANALOGIES,
                target_section_id=card.id,
                reason="Beginner level - emphasizing analogies"
            ))
        elif skill_level == "advanced":
            # Advanced users focus on edge cases and best practices
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.SKIP_REDUNDANT,
                target_section_id=card.id,
                reason="Advanced level - focusing on nuances"
            ))
        
        return card, adjustments
    
    def _adapt_code_example(
        self,
        example: CodeExample,
        skill_level: str
    ) -> tuple[CodeExample, List[ContentAdjustment]]:
        """Adapt a code example based on skill level."""
        adjustments = []
        
        if skill_level == "beginner":
            # Beginners get more hints
            if len(example.hints) < 3:
                adjustments.append(ContentAdjustment(
                    action=AdaptationAction.ADD_EXAMPLES,
                    target_section_id=example.id,
                    reason="Beginner level - adding more hints"
                ))
        elif skill_level == "advanced":
            # Advanced users get fewer hints by default
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.INCREASE_DIFFICULTY,
                target_section_id=example.id,
                reason="Advanced level - reducing hints"
            ))
        
        return example, adjustments
    
    def _adapt_knowledge_check(
        self,
        check: KnowledgeCheck,
        skill_level: str
    ) -> tuple[KnowledgeCheck, List[ContentAdjustment]]:
        """Adapt a knowledge check based on skill level."""
        adjustments = []
        
        # Adjust difficulty based on skill level
        target_difficulty = {"beginner": 2, "intermediate": 3, "advanced": 4}.get(skill_level, 3)
        
        if check.difficulty != target_difficulty:
            adjustments.append(ContentAdjustment(
                action=AdaptationAction.REDUCE_DIFFICULTY if check.difficulty > target_difficulty 
                       else AdaptationAction.INCREASE_DIFFICULTY,
                target_section_id=check.id,
                reason=f"Adjusting difficulty from {check.difficulty} to {target_difficulty}"
            ))
        
        return check, adjustments
    
    def _adapt_objectives(self, objectives: List[str], skill_level: str) -> List[str]:
        """Adapt learning objectives based on skill level."""
        if skill_level == "beginner":
            # Add foundational objectives
            return [
                obj.replace("Understand", "Learn the basics of").replace("Master", "Understand")
                for obj in objectives
            ]
        elif skill_level == "advanced":
            # Add advanced objectives
            return [
                obj.replace("Understand", "Master").replace("Learn", "Apply")
                for obj in objectives
            ]
        return objectives
    
    def _reduce_skill_level(self, current_level: str) -> str:
        """Reduce skill level by one step."""
        levels = ["beginner", "intermediate", "advanced"]
        try:
            current_index = levels.index(current_level)
            new_index = max(0, current_index - 1)
            return levels[new_index]
        except ValueError:
            return "beginner"
    
    def _increase_skill_level(self, current_level: str) -> str:
        """Increase skill level by one step."""
        levels = ["beginner", "intermediate", "advanced"]
        try:
            current_index = levels.index(current_level)
            new_index = min(len(levels) - 1, current_index + 1)
            return levels[new_index]
        except ValueError:
            return "intermediate"
    
    def _apply_adjustments(
        self,
        lesson: StructuredLesson,
        adjustments: List[ContentAdjustment]
    ) -> StructuredLesson:
        """Apply adjustments to a lesson."""
        # For now, return the lesson as-is
        # In a full implementation, this would modify the lesson structure
        # based on the adjustments
        return lesson
    
    def should_show_recap(self, performance: PerformanceData) -> bool:
        """Determine if recap content should be shown."""
        return performance.consecutive_failures >= self.FAILURE_THRESHOLD
    
    def should_skip_section(
        self,
        section: ContentSection,
        performance: PerformanceData
    ) -> bool:
        """Determine if a section can be skipped based on performance."""
        if not section.completion_required:
            return False
        
        # Don't skip if user is struggling
        if performance.consecutive_failures > 0:
            return False
        
        # Can skip if user has demonstrated mastery
        return performance.consecutive_successes >= self.SUCCESS_THRESHOLD
    
    def get_stretch_content_recommendation(
        self,
        lesson: StructuredLesson,
        performance: PerformanceData
    ) -> Optional[str]:
        """Get recommendation for stretch content if user is excelling."""
        if performance.consecutive_successes >= self.SUCCESS_THRESHOLD:
            return (
                f"Great job! You're mastering {lesson.topic}. "
                f"Consider exploring advanced topics or trying more challenging exercises."
            )
        return None


# Factory function
def create_adaptive_content_engine() -> AdaptiveContentEngine:
    """Create an AdaptiveContentEngine instance."""
    return AdaptiveContentEngine()
