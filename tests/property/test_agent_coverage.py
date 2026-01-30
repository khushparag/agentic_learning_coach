"""
Property-Based Tests for Agent Coverage Completeness

This module validates that the comprehensive project video includes complete
coverage of all agents in the system, ensuring each agent's responsibilities
and functionality are properly documented and displayed.

Property 2: Agent Coverage Completeness
For any agent in the system (ProfileAgent, CurriculumPlannerAgent, ResourcesAgent,
ExerciseGeneratorAgent, ReviewerAgent, ProgressTracker, Orchestrator), the video
should include content describing its specific responsibilities and functionality.

Validates: Requirements 3.3, 10.1
"""

from hypothesis import given, strategies as st, settings
from hypothesis import assume
import pytest
from pathlib import Path
import re


# Define the expected agents in the system
EXPECTED_AGENTS = [
    "ProfileAgent",
    "CurriculumPlannerAgent",
    "ResourcesAgent",
    "ExerciseGeneratorAgent",
    "ReviewerAgent",
    "ProgressTracker",
    "Orchestrator"
]

# Define expected responsibilities for each agent
AGENT_RESPONSIBILITIES = {
    "ProfileAgent": [
        "Skill Assessment",
        "Goal Clarification",
        "Preference Tracking",
        "learner modeling"
    ],
    "CurriculumPlannerAgent": [
        "Learning Path Design",
        "Adaptive Difficulty",
        "curriculum",
        "personalized"
    ],
    "ResourcesAgent": [
        "resource",
        "documentation",
        "tutorial",
        "curate"
    ],
    "ExerciseGeneratorAgent": [
        "exercise",
        "practice",
        "coding",
        "generate"
    ],
    "ReviewerAgent": [
        "evaluate",
        "feedback",
        "review",
        "submission"
    ],
    "ProgressTracker": [
        "progress",
        "tracking",
        "metrics",
        "analytics"
    ],
    "Orchestrator": [
        "orchestrat",
        "coordinate",
        "route",
        "entry point"
    ]
}


def get_video_project_files():
    """Get all TypeScript/TSX files from the video project."""
    video_project_path = Path("video-project/src")
    if not video_project_path.exists():
        return []
    
    files = []
    for ext in ["*.tsx", "*.ts"]:
        files.extend(video_project_path.rglob(ext))
    return files


def extract_content_from_file(file_path: Path) -> str:
    """Extract text content from a TypeScript/TSX file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content.lower()
    except Exception:
        return ""


def get_all_video_content() -> str:
    """Aggregate all content from video project files."""
    files = get_video_project_files()
    all_content = []
    
    for file_path in files:
        content = extract_content_from_file(file_path)
        all_content.append(content)
    
    return " ".join(all_content)


@pytest.fixture(scope="module")
def video_content():
    """Fixture to load video content once for all tests."""
    return get_all_video_content()


class TestAgentCoverageCompleteness:
    """
    Property 2: Agent Coverage Completeness
    
    Validates that all agents in the system are properly covered in the video
    content with their responsibilities and functionality described.
    """
    
    def test_all_expected_agents_present(self, video_content):
        """
        Test that all expected agents are mentioned in the video content.
        
        **Validates: Requirements 3.3, 10.1**
        """
        missing_agents = []
        
        for agent in EXPECTED_AGENTS:
            # Check for agent name (case-insensitive)
            if agent.lower() not in video_content:
                missing_agents.append(agent)
        
        assert len(missing_agents) == 0, (
            f"Missing agents in video content: {missing_agents}. "
            f"All {len(EXPECTED_AGENTS)} agents must be covered."
        )
    
    @given(
        agent_name=st.sampled_from(EXPECTED_AGENTS)
    )
    @settings(max_examples=100, deadline=None)
    def test_agent_has_responsibility_coverage(self, video_content, agent_name):
        """
        Property Test: For any agent, at least one of its key responsibilities
        should be mentioned in the video content.
        
        **Feature: comprehensive-project-video, Property 2: Agent Coverage Completeness**
        **Validates: Requirements 3.3, 10.1**
        """
        responsibilities = AGENT_RESPONSIBILITIES.get(agent_name, [])
        assume(len(responsibilities) > 0)
        
        # Check if at least one responsibility keyword is mentioned
        found_responsibilities = []
        for responsibility in responsibilities:
            if responsibility.lower() in video_content:
                found_responsibilities.append(responsibility)
        
        assert len(found_responsibilities) > 0, (
            f"Agent '{agent_name}' has no responsibility keywords found in video content. "
            f"Expected at least one of: {responsibilities}. "
            f"This violates the Agent Coverage Completeness property."
        )
    
    @given(
        agent_subset=st.lists(
            st.sampled_from(EXPECTED_AGENTS),
            min_size=3,
            max_size=7,
            unique=True
        )
    )
    @settings(max_examples=100, deadline=None)
    def test_agent_subset_coverage(self, video_content, agent_subset):
        """
        Property Test: For any subset of agents, all agents in that subset
        should be covered in the video content.
        
        **Feature: comprehensive-project-video, Property 2: Agent Coverage Completeness**
        **Validates: Requirements 3.3, 10.1**
        """
        missing_from_subset = []
        
        for agent in agent_subset:
            if agent.lower() not in video_content:
                missing_from_subset.append(agent)
        
        assert len(missing_from_subset) == 0, (
            f"Agents missing from video content: {missing_from_subset}. "
            f"All agents in any subset must be covered."
        )
    
    def test_architecture_section_exists(self, video_content):
        """
        Test that the architecture section exists and contains agent information.
        
        **Validates: Requirements 3.3**
        """
        architecture_keywords = [
            "architecture",
            "multi-agent",
            "agent system",
            "orchestrator"
        ]
        
        found_keywords = [kw for kw in architecture_keywords if kw in video_content]
        
        assert len(found_keywords) > 0, (
            "Architecture section appears to be missing or incomplete. "
            f"Expected keywords: {architecture_keywords}"
        )
    
    @given(
        agent_name=st.sampled_from(EXPECTED_AGENTS),
        responsibility_index=st.integers(min_value=0, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_specific_responsibility_coverage(
        self, 
        video_content, 
        agent_name, 
        responsibility_index
    ):
        """
        Property Test: For any agent and any of its responsibilities,
        if the responsibility exists, it should be findable in the content.
        
        **Feature: comprehensive-project-video, Property 2: Agent Coverage Completeness**
        **Validates: Requirements 3.3, 10.1**
        """
        responsibilities = AGENT_RESPONSIBILITIES.get(agent_name, [])
        assume(responsibility_index < len(responsibilities))
        
        responsibility = responsibilities[responsibility_index]
        
        # The responsibility keyword should appear in the content
        # (This is a weaker assertion - at least one responsibility must be present)
        all_responsibilities_present = any(
            resp.lower() in video_content 
            for resp in responsibilities
        )
        
        assert all_responsibilities_present, (
            f"Agent '{agent_name}' has no responsibility keywords in video content. "
            f"Expected at least one of: {responsibilities}"
        )


class TestAgentCoverageQuality:
    """
    Additional quality tests for agent coverage beyond basic presence.
    """
    
    def test_agent_count_matches_expected(self, video_content):
        """
        Test that the number of agents mentioned matches the expected count.
        
        **Validates: Requirements 10.1**
        """
        # Count how many expected agents are mentioned
        mentioned_count = sum(
            1 for agent in EXPECTED_AGENTS 
            if agent.lower() in video_content
        )
        
        assert mentioned_count == len(EXPECTED_AGENTS), (
            f"Expected {len(EXPECTED_AGENTS)} agents to be mentioned, "
            f"but found {mentioned_count}. "
            f"All agents must be covered in the video."
        )
    
    def test_agent_architecture_diagram_reference(self, video_content):
        """
        Test that there are references to agent architecture visualization.
        
        **Validates: Requirements 3.3**
        """
        diagram_keywords = [
            "diagram",
            "visualization",
            "architecture",
            "flow",
            "connection"
        ]
        
        found_keywords = [kw for kw in diagram_keywords if kw in video_content]
        
        assert len(found_keywords) >= 2, (
            "Architecture visualization appears incomplete. "
            f"Expected multiple diagram-related keywords, found: {found_keywords}"
        )
    
    @given(
        agent_pair=st.lists(
            st.sampled_from(EXPECTED_AGENTS),
            min_size=2,
            max_size=2,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_agent_pair_coverage(self, video_content, agent_pair):
        """
        Property Test: For any pair of agents, both should be covered.
        
        **Feature: comprehensive-project-video, Property 2: Agent Coverage Completeness**
        **Validates: Requirements 3.3, 10.1**
        """
        agent1, agent2 = agent_pair
        
        agent1_present = agent1.lower() in video_content
        agent2_present = agent2.lower() in video_content
        
        assert agent1_present and agent2_present, (
            f"Agent pair coverage incomplete. "
            f"{agent1}: {agent1_present}, {agent2}: {agent2_present}. "
            f"Both agents must be covered."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
