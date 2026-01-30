"""
Property-Based Tests for Technology Stack Completeness

This module validates that the comprehensive project video includes complete
coverage of all technologies in the system stack, ensuring each technology's
role and implementation are properly showcased.

Property 5: Technology Stack Completeness
For any technology in the system stack (Python, FastAPI, PostgreSQL, React,
TypeScript, Docker, Qdrant), the video should include content showcasing that
technology's role and implementation.

Validates: Requirements 10.4
"""

from hypothesis import given, strategies as st, settings
from hypothesis import assume
import pytest
from pathlib import Path


# Define the expected technologies in the system
EXPECTED_TECHNOLOGIES = {
    "backend": [
        "Python",
        "FastAPI",
        "PostgreSQL",
        "Redis",
        "Alembic"
    ],
    "frontend": [
        "React",
        "TypeScript",
        "Vite",
        "TailwindCSS",
        "WebSocket"
    ],
    "database": [
        "PostgreSQL",
        "Qdrant",
        "Redis"
    ],
    "infrastructure": [
        "Docker",
        "Docker Compose",
        "Nginx"
    ],
    "testing": [
        "Pytest",
        "Hypothesis",
        "Jest",
        "Cypress"
    ]
}

# Flatten all technologies for easier testing
ALL_TECHNOLOGIES = list(set(
    tech
    for category in EXPECTED_TECHNOLOGIES.values()
    for tech in category
))

# Define technology keywords and variations
TECHNOLOGY_KEYWORDS = {
    "Python": ["python", "py"],
    "FastAPI": ["fastapi", "fast api"],
    "PostgreSQL": ["postgresql", "postgres", "pg"],
    "Redis": ["redis"],
    "Alembic": ["alembic", "migration"],
    "React": ["react", "jsx"],
    "TypeScript": ["typescript", "ts"],
    "Vite": ["vite"],
    "TailwindCSS": ["tailwind", "tailwindcss"],
    "WebSocket": ["websocket", "ws"],
    "Qdrant": ["qdrant", "vector"],
    "Docker": ["docker", "container"],
    "Docker Compose": ["docker compose", "docker-compose"],
    "Nginx": ["nginx"],
    "Pytest": ["pytest"],
    "Hypothesis": ["hypothesis", "property"],
    "Jest": ["jest"],
    "Cypress": ["cypress", "e2e"]
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


def technology_is_mentioned(content: str, technology: str) -> bool:
    """Check if a technology is mentioned in the content using keywords."""
    keywords = TECHNOLOGY_KEYWORDS.get(technology, [technology.lower()])
    return any(keyword in content for keyword in keywords)


@pytest.fixture(scope="module")
def video_content():
    """Fixture to load video content once for all tests."""
    return get_all_video_content()


class TestTechnologyStackCompleteness:
    """
    Property 5: Technology Stack Completeness
    
    Validates that all technologies in the system stack are properly covered
    in the video content with their roles and implementations showcased.
    """
    
    def test_all_backend_technologies_present(self, video_content):
        """
        Test that all backend technologies are mentioned in the video content.
        
        **Validates: Requirements 10.4**
        """
        missing_technologies = []
        
        for tech in EXPECTED_TECHNOLOGIES["backend"]:
            if not technology_is_mentioned(video_content, tech):
                missing_technologies.append(tech)
        
        assert len(missing_technologies) == 0, (
            f"Missing backend technologies in video content: {missing_technologies}. "
            f"All backend technologies must be covered."
        )
    
    def test_all_frontend_technologies_present(self, video_content):
        """
        Test that all frontend technologies are mentioned in the video content.
        
        **Validates: Requirements 10.4**
        """
        missing_technologies = []
        
        for tech in EXPECTED_TECHNOLOGIES["frontend"]:
            if not technology_is_mentioned(video_content, tech):
                missing_technologies.append(tech)
        
        assert len(missing_technologies) == 0, (
            f"Missing frontend technologies in video content: {missing_technologies}. "
            f"All frontend technologies must be covered."
        )
    
    def test_all_database_technologies_present(self, video_content):
        """
        Test that all database technologies are mentioned in the video content.
        
        **Validates: Requirements 10.4**
        """
        missing_technologies = []
        
        for tech in EXPECTED_TECHNOLOGIES["database"]:
            if not technology_is_mentioned(video_content, tech):
                missing_technologies.append(tech)
        
        assert len(missing_technologies) == 0, (
            f"Missing database technologies in video content: {missing_technologies}. "
            f"All database technologies must be covered."
        )
    
    def test_all_infrastructure_technologies_present(self, video_content):
        """
        Test that all infrastructure technologies are mentioned in the video content.
        
        **Validates: Requirements 10.4**
        """
        missing_technologies = []
        
        for tech in EXPECTED_TECHNOLOGIES["infrastructure"]:
            if not technology_is_mentioned(video_content, tech):
                missing_technologies.append(tech)
        
        assert len(missing_technologies) == 0, (
            f"Missing infrastructure technologies in video content: {missing_technologies}. "
            f"All infrastructure technologies must be covered."
        )
    
    @given(
        technology=st.sampled_from(ALL_TECHNOLOGIES)
    )
    @settings(max_examples=100, deadline=None)
    def test_any_technology_is_covered(self, video_content, technology):
        """
        Property Test: For any technology in the stack, it should be mentioned
        in the video content.
        
        **Feature: comprehensive-project-video, Property 5: Technology Stack Completeness**
        **Validates: Requirements 10.4**
        """
        is_mentioned = technology_is_mentioned(video_content, technology)
        
        assert is_mentioned, (
            f"Technology '{technology}' is not mentioned in video content. "
            f"All technologies in the stack must be covered. "
            f"This violates the Technology Stack Completeness property."
        )
    
    @given(
        category=st.sampled_from(list(EXPECTED_TECHNOLOGIES.keys()))
    )
    @settings(max_examples=50, deadline=None)
    def test_technology_category_coverage(self, video_content, category):
        """
        Property Test: For any technology category, at least 80% of technologies
        in that category should be mentioned.
        
        **Feature: comprehensive-project-video, Property 5: Technology Stack Completeness**
        **Validates: Requirements 10.4**
        """
        technologies = EXPECTED_TECHNOLOGIES[category]
        mentioned_count = sum(
            1 for tech in technologies
            if technology_is_mentioned(video_content, tech)
        )
        
        coverage_percentage = (mentioned_count / len(technologies)) * 100
        
        assert coverage_percentage >= 80, (
            f"Technology category '{category}' has insufficient coverage: "
            f"{coverage_percentage:.1f}% (expected >= 80%). "
            f"Mentioned: {mentioned_count}/{len(technologies)} technologies."
        )
    
    @given(
        tech_subset=st.lists(
            st.sampled_from(ALL_TECHNOLOGIES),
            min_size=3,
            max_size=10,
            unique=True
        )
    )
    @settings(max_examples=100, deadline=None)
    def test_technology_subset_coverage(self, video_content, tech_subset):
        """
        Property Test: For any subset of technologies, all technologies in that
        subset should be covered in the video content.
        
        **Feature: comprehensive-project-video, Property 5: Technology Stack Completeness**
        **Validates: Requirements 10.4**
        """
        missing_from_subset = []
        
        for tech in tech_subset:
            if not technology_is_mentioned(video_content, tech):
                missing_from_subset.append(tech)
        
        assert len(missing_from_subset) == 0, (
            f"Technologies missing from video content: {missing_from_subset}. "
            f"All technologies in any subset must be covered."
        )


class TestTechnologyStackQuality:
    """
    Additional quality tests for technology stack coverage.
    """
    
    def test_technology_section_exists(self, video_content):
        """
        Test that the technology stack section exists in the video.
        
        **Validates: Requirements 10.4**
        """
        section_keywords = [
            "technology",
            "stack",
            "tech stack",
            "technologies"
        ]
        
        found_keywords = [kw for kw in section_keywords if kw in video_content]
        
        assert len(found_keywords) > 0, (
            "Technology stack section appears to be missing. "
            f"Expected keywords: {section_keywords}"
        )
    
    def test_minimum_technology_count(self, video_content):
        """
        Test that a minimum number of technologies are mentioned.
        
        **Validates: Requirements 10.4**
        """
        mentioned_count = sum(
            1 for tech in ALL_TECHNOLOGIES
            if technology_is_mentioned(video_content, tech)
        )
        
        minimum_required = int(len(ALL_TECHNOLOGIES) * 0.9)  # 90% coverage
        
        assert mentioned_count >= minimum_required, (
            f"Insufficient technology coverage: {mentioned_count}/{len(ALL_TECHNOLOGIES)} "
            f"(expected >= {minimum_required}). "
            f"At least 90% of technologies must be covered."
        )
    
    @given(
        tech_pair=st.lists(
            st.sampled_from(ALL_TECHNOLOGIES),
            min_size=2,
            max_size=2,
            unique=True
        )
    )
    @settings(max_examples=50, deadline=None)
    def test_technology_pair_coverage(self, video_content, tech_pair):
        """
        Property Test: For any pair of technologies, both should be covered.
        
        **Feature: comprehensive-project-video, Property 5: Technology Stack Completeness**
        **Validates: Requirements 10.4**
        """
        tech1, tech2 = tech_pair
        
        tech1_present = technology_is_mentioned(video_content, tech1)
        tech2_present = technology_is_mentioned(video_content, tech2)
        
        assert tech1_present and tech2_present, (
            f"Technology pair coverage incomplete. "
            f"{tech1}: {tech1_present}, {tech2}: {tech2_present}. "
            f"Both technologies must be covered."
        )
    
    def test_code_examples_reference(self, video_content):
        """
        Test that there are references to code examples or implementations.
        
        **Validates: Requirements 10.4**
        """
        code_keywords = [
            "code",
            "implementation",
            "example",
            "snippet"
        ]
        
        found_keywords = [kw for kw in code_keywords if kw in video_content]
        
        assert len(found_keywords) >= 2, (
            "Code examples appear to be missing or insufficient. "
            f"Expected multiple code-related keywords, found: {found_keywords}"
        )
    
    @given(
        category1=st.sampled_from(list(EXPECTED_TECHNOLOGIES.keys())),
        category2=st.sampled_from(list(EXPECTED_TECHNOLOGIES.keys()))
    )
    @settings(max_examples=50, deadline=None)
    def test_cross_category_coverage(self, video_content, category1, category2):
        """
        Property Test: For any two technology categories, both should have
        at least one technology mentioned.
        
        **Feature: comprehensive-project-video, Property 5: Technology Stack Completeness**
        **Validates: Requirements 10.4**
        """
        assume(category1 != category2)
        
        cat1_has_coverage = any(
            technology_is_mentioned(video_content, tech)
            for tech in EXPECTED_TECHNOLOGIES[category1]
        )
        
        cat2_has_coverage = any(
            technology_is_mentioned(video_content, tech)
            for tech in EXPECTED_TECHNOLOGIES[category2]
        )
        
        assert cat1_has_coverage and cat2_has_coverage, (
            f"Cross-category coverage incomplete. "
            f"{category1}: {cat1_has_coverage}, {category2}: {cat2_has_coverage}. "
            f"Both categories must have at least one technology covered."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
