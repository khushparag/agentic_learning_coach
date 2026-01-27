#!/usr/bin/env python3
"""
Demo script for the Agentic Learning Coach.

This script demonstrates the complete learning journey workflow,
exercising all major functionality of the system.

Usage:
    python scripts/demo.py run              # Run the full demo
    python scripts/demo.py run --quick      # Run a quick demo
    python scripts/demo.py health           # Check system health
    python scripts/demo.py agents           # Demo agent interactions
"""
import asyncio
import json
import sys
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import click
import httpx


# Configuration
COACH_URL = "http://localhost:8000"
RUNNER_URL = "http://localhost:8001"
TIMEOUT = 30.0


class DemoRunner:
    """Runs demonstration scenarios for the Learning Coach."""
    
    def __init__(self, coach_url: str = COACH_URL, runner_url: str = RUNNER_URL):
        self.coach_url = coach_url
        self.runner_url = runner_url
        self.client: Optional[httpx.AsyncClient] = None
        self.demo_user_id: Optional[str] = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=TIMEOUT)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def check_health(self) -> dict:
        """Check health of all services."""
        results = {}
        
        # Check coach service
        try:
            response = await self.client.get(f"{self.coach_url}/health/detailed")
            results["coach_service"] = {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "details": response.json() if response.status_code == 200 else None
            }
        except Exception as e:
            results["coach_service"] = {"status": "unavailable", "error": str(e)}
        
        # Check runner service
        try:
            response = await self.client.get(f"{self.runner_url}/health")
            results["runner_service"] = {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_time_ms": response.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            results["runner_service"] = {"status": "unavailable", "error": str(e)}
        
        return results
    
    async def demo_profile_agent(self) -> dict:
        """Demonstrate ProfileAgent functionality."""
        click.echo("\n📋 Demo: ProfileAgent - Skill Assessment")
        click.echo("-" * 50)
        
        from src.agents.profile_agent import ProfileAgent
        from src.agents.base.types import LearningContext
        
        agent = ProfileAgent()
        
        # Create a learning context
        context = LearningContext(
            user_id=str(uuid4()),
            session_id=str(uuid4()),
            current_objective="skill_assessment"
        )
        
        # Simulate user responses to diagnostic questions
        user_responses = {
            "experience_level": "intermediate",
            "programming_languages": ["python", "javascript"],
            "learning_goals": ["Build a todo app with React", "Learn TypeScript"],
            "time_available": "5 hours per week",
            "learning_preference": "hands-on practice"
        }
        
        click.echo(f"   User ID: {context.user_id[:8]}...")
        click.echo(f"   Goals: {user_responses['learning_goals']}")
        click.echo(f"   Time: {user_responses['time_available']}")
        
        # Process with agent
        result = await agent.process({
            "action": "assess_skill_level",
            "responses": user_responses,
            "context": context
        })
        
        click.echo(f"\n   ✅ Assessment Result:")
        click.echo(f"      Success: {result.success}")
        if result.data:
            click.echo(f"      Skill Level: {result.data.get('skill_level', 'N/A')}")
            click.echo(f"      Recommendations: {result.data.get('recommendations', [])[:2]}")
        
        return {"agent": "ProfileAgent", "result": result.success, "data": result.data}
    
    async def demo_curriculum_planner(self) -> dict:
        """Demonstrate CurriculumPlannerAgent functionality."""
        click.echo("\n📚 Demo: CurriculumPlannerAgent - Learning Path Creation")
        click.echo("-" * 50)
        
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        from src.agents.base.types import LearningContext
        from src.domain.entities.user_profile import UserProfile, SkillLevel, LearningStyle
        
        agent = CurriculumPlannerAgent()
        
        # Create a user profile
        profile = UserProfile(
            user_id=str(uuid4()),
            email="demo@example.com",
            skill_level=SkillLevel.INTERMEDIATE,
            learning_style=LearningStyle.HANDS_ON,
            goals=["Learn React", "Build a todo app"],
            time_constraints={"hours_per_week": 5}
        )
        
        context = LearningContext(
            user_id=profile.user_id,
            session_id=str(uuid4()),
            current_objective="create_curriculum"
        )
        
        click.echo(f"   User: {profile.email}")
        click.echo(f"   Skill Level: {profile.skill_level.value}")
        click.echo(f"   Goals: {profile.goals}")
        
        # Generate curriculum
        result = await agent.process({
            "action": "create_learning_path",
            "profile": profile,
            "context": context
        })
        
        click.echo(f"\n   ✅ Curriculum Created:")
        click.echo(f"      Success: {result.success}")
        if result.data:
            plan = result.data.get("learning_plan")
            if plan:
                click.echo(f"      Title: {plan.get('title', 'N/A')}")
                click.echo(f"      Modules: {len(plan.get('modules', []))}")
                click.echo(f"      Estimated Hours: {plan.get('estimated_hours', 'N/A')}")
        
        return {"agent": "CurriculumPlannerAgent", "result": result.success, "data": result.data}
    
    async def demo_exercise_generator(self) -> dict:
        """Demonstrate ExerciseGeneratorAgent functionality."""
        click.echo("\n🎯 Demo: ExerciseGeneratorAgent - Exercise Creation")
        click.echo("-" * 50)
        
        from src.agents.exercise_generator_agent import ExerciseGeneratorAgent
        from src.agents.base.types import LearningContext
        
        agent = ExerciseGeneratorAgent()
        
        context = LearningContext(
            user_id=str(uuid4()),
            session_id=str(uuid4()),
            current_objective="variables_and_types",
            skill_level=2
        )
        
        click.echo(f"   Topic: {context.current_objective}")
        click.echo(f"   Skill Level: {context.skill_level}")
        
        # Generate exercise
        result = await agent.process({
            "action": "generate_exercise",
            "topic": "variables_and_types",
            "difficulty": 2,
            "context": context
        })
        
        click.echo(f"\n   ✅ Exercise Generated:")
        click.echo(f"      Success: {result.success}")
        if result.data:
            exercise = result.data.get("exercise", {})
            click.echo(f"      Title: {exercise.get('title', 'N/A')}")
            click.echo(f"      Type: {exercise.get('type', 'N/A')}")
            click.echo(f"      Difficulty: {exercise.get('difficulty_level', 'N/A')}")
            if exercise.get('hints'):
                click.echo(f"      Hints Available: {len(exercise.get('hints', []))}")
        
        return {"agent": "ExerciseGeneratorAgent", "result": result.success, "data": result.data}
    
    async def demo_reviewer_agent(self) -> dict:
        """Demonstrate ReviewerAgent functionality."""
        click.echo("\n📝 Demo: ReviewerAgent - Code Review")
        click.echo("-" * 50)
        
        from src.agents.reviewer_agent import ReviewerAgent
        from src.agents.base.types import LearningContext
        
        agent = ReviewerAgent()
        
        context = LearningContext(
            user_id=str(uuid4()),
            session_id=str(uuid4()),
            current_objective="code_review"
        )
        
        # Sample code submission
        code = '''
def add_numbers(a, b):
    """Add two numbers together."""
    return a + b

# Test the function
result = add_numbers(5, 3)
print(f"Result: {result}")
'''
        
        click.echo(f"   Submitted Code:")
        for line in code.strip().split('\n')[:5]:
            click.echo(f"      {line}")
        click.echo("      ...")
        
        # Review code
        result = await agent.process({
            "action": "review_code",
            "code": code,
            "language": "python",
            "exercise_id": str(uuid4()),
            "context": context
        })
        
        click.echo(f"\n   ✅ Review Complete:")
        click.echo(f"      Success: {result.success}")
        if result.data:
            review = result.data.get("review", {})
            click.echo(f"      Passed: {review.get('passed', 'N/A')}")
            click.echo(f"      Score: {review.get('score', 'N/A')}")
            if review.get('feedback'):
                click.echo(f"      Feedback: {review.get('feedback', '')[:100]}...")
        
        return {"agent": "ReviewerAgent", "result": result.success, "data": result.data}
    
    async def demo_resources_agent(self) -> dict:
        """Demonstrate ResourcesAgent functionality."""
        click.echo("\n📖 Demo: ResourcesAgent - Resource Discovery")
        click.echo("-" * 50)
        
        from src.agents.resources_agent import ResourcesAgent
        from src.agents.base.types import LearningContext
        
        agent = ResourcesAgent()
        
        context = LearningContext(
            user_id=str(uuid4()),
            session_id=str(uuid4()),
            current_objective="find_resources",
            skill_level=2
        )
        
        query = "React hooks useState useEffect"
        click.echo(f"   Query: {query}")
        click.echo(f"   Skill Level: {context.skill_level}")
        
        # Search for resources
        result = await agent.process({
            "action": "find_resources",
            "query": query,
            "context": context
        })
        
        click.echo(f"\n   ✅ Resources Found:")
        click.echo(f"      Success: {result.success}")
        if result.data:
            resources = result.data.get("resources", [])
            click.echo(f"      Count: {len(resources)}")
            for i, resource in enumerate(resources[:3]):
                click.echo(f"      {i+1}. {resource.get('title', 'N/A')}")
        
        return {"agent": "ResourcesAgent", "result": result.success, "data": result.data}


@click.group()
def cli():
    """Demo commands for the Agentic Learning Coach."""
    pass


@cli.command()
@click.option('--quick', is_flag=True, help='Run a quick demo (fewer steps)')
def run(quick: bool):
    """Run the complete learning journey demo."""
    click.echo("🎬 Agentic Learning Coach - Demo Script")
    click.echo("=" * 60)
    click.echo(f"   Started: {datetime.now(timezone.utc).isoformat()}")
    click.echo(f"   Mode: {'Quick' if quick else 'Full'}")
    
    async def run_demo():
        async with DemoRunner() as demo:
            results = []
            
            # Step 1: Health Check
            click.echo("\n🏥 Step 1: System Health Check")
            click.echo("-" * 50)
            health = await demo.check_health()
            
            all_healthy = True
            for service, status in health.items():
                icon = "✅" if status["status"] == "healthy" else "❌"
                click.echo(f"   {icon} {service}: {status['status']}")
                if status["status"] != "healthy":
                    all_healthy = False
            
            if not all_healthy:
                click.echo("\n⚠️  Some services are not healthy. Demo may not work correctly.")
            
            # Step 2: Profile Assessment
            try:
                result = await demo.demo_profile_agent()
                results.append(result)
            except Exception as e:
                click.echo(f"   ❌ ProfileAgent demo failed: {e}")
                results.append({"agent": "ProfileAgent", "result": False, "error": str(e)})
            
            if not quick:
                # Step 3: Curriculum Planning
                try:
                    result = await demo.demo_curriculum_planner()
                    results.append(result)
                except Exception as e:
                    click.echo(f"   ❌ CurriculumPlannerAgent demo failed: {e}")
                    results.append({"agent": "CurriculumPlannerAgent", "result": False, "error": str(e)})
                
                # Step 4: Exercise Generation
                try:
                    result = await demo.demo_exercise_generator()
                    results.append(result)
                except Exception as e:
                    click.echo(f"   ❌ ExerciseGeneratorAgent demo failed: {e}")
                    results.append({"agent": "ExerciseGeneratorAgent", "result": False, "error": str(e)})
                
                # Step 5: Code Review
                try:
                    result = await demo.demo_reviewer_agent()
                    results.append(result)
                except Exception as e:
                    click.echo(f"   ❌ ReviewerAgent demo failed: {e}")
                    results.append({"agent": "ReviewerAgent", "result": False, "error": str(e)})
                
                # Step 6: Resource Discovery
                try:
                    result = await demo.demo_resources_agent()
                    results.append(result)
                except Exception as e:
                    click.echo(f"   ❌ ResourcesAgent demo failed: {e}")
                    results.append({"agent": "ResourcesAgent", "result": False, "error": str(e)})
            
            # Summary
            click.echo("\n" + "=" * 60)
            click.echo("📊 Demo Summary")
            click.echo("-" * 50)
            
            successful = sum(1 for r in results if r.get("result"))
            total = len(results)
            
            click.echo(f"   Total Demos: {total}")
            click.echo(f"   Successful: {successful}")
            click.echo(f"   Failed: {total - successful}")
            
            for result in results:
                icon = "✅" if result.get("result") else "❌"
                click.echo(f"   {icon} {result.get('agent')}")
            
            click.echo(f"\n   Completed: {datetime.now(timezone.utc).isoformat()}")
            
            return successful == total
    
    success = asyncio.run(run_demo())
    
    if success:
        click.echo("\n✅ Demo completed successfully!")
    else:
        click.echo("\n⚠️  Demo completed with some failures")
        sys.exit(1)


@cli.command()
def health():
    """Check system health status."""
    click.echo("🏥 System Health Check")
    click.echo("=" * 50)
    
    async def check():
        async with DemoRunner() as demo:
            return await demo.check_health()
    
    health = asyncio.run(check())
    
    all_healthy = True
    for service, status in health.items():
        icon = "✅" if status["status"] == "healthy" else "❌"
        click.echo(f"\n{icon} {service}")
        click.echo(f"   Status: {status['status']}")
        if "response_time_ms" in status:
            click.echo(f"   Response Time: {status['response_time_ms']:.2f}ms")
        if "error" in status:
            click.echo(f"   Error: {status['error']}")
        if status["status"] != "healthy":
            all_healthy = False
    
    if all_healthy:
        click.echo("\n✅ All services are healthy!")
    else:
        click.echo("\n⚠️  Some services are not healthy")
        sys.exit(1)


@cli.command()
def agents():
    """Demo individual agent interactions."""
    click.echo("🤖 Agent Interaction Demo")
    click.echo("=" * 50)
    
    async def demo_agents():
        async with DemoRunner() as demo:
            results = []
            
            agents_to_demo = [
                ("ProfileAgent", demo.demo_profile_agent),
                ("CurriculumPlannerAgent", demo.demo_curriculum_planner),
                ("ExerciseGeneratorAgent", demo.demo_exercise_generator),
                ("ReviewerAgent", demo.demo_reviewer_agent),
                ("ResourcesAgent", demo.demo_resources_agent),
            ]
            
            for name, demo_func in agents_to_demo:
                try:
                    result = await demo_func()
                    results.append(result)
                except Exception as e:
                    click.echo(f"\n❌ {name} failed: {e}")
                    results.append({"agent": name, "result": False, "error": str(e)})
            
            return results
    
    results = asyncio.run(demo_agents())
    
    click.echo("\n" + "=" * 50)
    click.echo("📊 Results Summary")
    
    for result in results:
        icon = "✅" if result.get("result") else "❌"
        click.echo(f"   {icon} {result.get('agent')}")


if __name__ == "__main__":
    cli()
