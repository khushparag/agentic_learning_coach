"""
Demonstration of the implemented agents and MCP tools usage.

This example shows how to use the ResourcesAgent, ExerciseGeneratorAgent, 
and ReviewerAgent in a complete learning workflow.
"""
import asyncio
from uuid import uuid4
from datetime import datetime

# Import agents and dependencies
from src.agents.resources_agent import ResourcesAgent
from src.agents.exercise_generator_agent import ExerciseGeneratorAgent
from src.agents.reviewer_agent import ReviewerAgent
from src.agents.base.types import LearningContext

# Import MCP implementations
from src.adapters.services.documentation_mcp import DocumentationMCP
from src.adapters.services.code_analysis_mcp import CodeAnalysisMCP

# Import code execution service
from src.adapters.services.code_execution_adapter import CodeExecutionServiceAdapter

# Import repositories (mock implementations for demo)
from src.adapters.database.repositories.postgres_submission_repository import PostgresSubmissionRepository


class MockSubmissionRepository:
    """Mock submission repository for demo purposes."""
    
    async def save(self, submission):
        """Mock save method."""
        submission.id = str(uuid4())
        return submission
    
    async def find_by_id(self, submission_id):
        """Mock find method."""
        return None


async def demonstrate_complete_learning_workflow():
    """Demonstrate a complete learning workflow using all agents."""
    
    print("🎓 Agentic Learning Coach - Complete Workflow Demo")
    print("=" * 60)
    
    # Initialize MCP tools
    print("\n📚 Initializing MCP tools...")
    documentation_mcp = DocumentationMCP()
    code_analysis_mcp = CodeAnalysisMCP()
    
    # Initialize services
    print("🔧 Initializing services...")
    code_execution_service = CodeExecutionServiceAdapter()
    submission_repository = MockSubmissionRepository()
    
    # Initialize agents
    print("🤖 Initializing agents...")
    resources_agent = ResourcesAgent(documentation_mcp)
    exercise_generator_agent = ExerciseGeneratorAgent(code_analysis_mcp)
    reviewer_agent = ReviewerAgent(code_execution_service, submission_repository)
    
    # Create learning context
    learning_context = LearningContext(
        user_id="demo-user-123",
        session_id="demo-session-456",
        current_objective="python functions",
        skill_level="intermediate",
        learning_goals=["python", "programming fundamentals"],
        attempt_count=1
    )
    
    print(f"\n👤 Learning Context:")
    print(f"   User: {learning_context.user_id}")
    print(f"   Objective: {learning_context.current_objective}")
    print(f"   Skill Level: {learning_context.skill_level}")
    print(f"   Goals: {', '.join(learning_context.learning_goals)}")
    
    # Step 1: Discover Learning Resources
    print("\n" + "="*60)
    print("📖 STEP 1: Discovering Learning Resources")
    print("="*60)
    
    resource_payload = {
        'intent': 'search_resources',
        'query': 'python functions tutorial',
        'language': 'python',
        'max_results': 3
    }
    
    print(f"🔍 Searching for resources: '{resource_payload['query']}'")
    resource_result = await resources_agent.