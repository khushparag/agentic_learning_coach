"""
Integration example showing ProfileAgent and CurriculumPlannerAgent working together.

This example demonstrates the complete workflow from user onboarding
through curriculum creation following the clean architecture principles.
"""
import asyncio
from typing import Dict, Any

from src.agents.profile_agent import ProfileAgent
from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
from src.agents.base.types import LearningContext, AgentResult
from src.domain.value_objects.enums import SkillLevel


class MockUserRepository:
    """Mock user repository for demonstration."""
    
    def __init__(self):
        self.profiles = {}
    
    async def create_user(self, email: str, name: str):
        from src.domain.entities.user_profile import UserProfile
        profile = UserProfile(
            user_id=f"user-{len(self.profiles) + 1}",
            skill_level=SkillLevel.BEGINNER,
            learning_goals=["general"],  # Start with a placeholder goal
            time_constraints={},
            preferences={}
        )
        self.profiles[profile.user_id] = profile
        return profile
    
    async def get_user_profile(self, user_id: str):
        return self.profiles.get(user_id)
    
    async def update_user_profile(self, profile):
        self.profiles[profile.user_id] = profile
        return profile


class MockCurriculumRepository:
    """Mock curriculum repository for demonstration."""
    
    def __init__(self):
        self.plans = {}
        self.active_plans = {}
    
    async def save_plan(self, plan):
        self.plans[plan.id] = plan
        if plan.status.value == "active":
            self.active_plans[plan.user_id] = plan
        return plan
    
    async def get_plan(self, plan_id: str):
        return self.plans.get(plan_id)
    
    async def get_active_plan(self, user_id: str):
        return self.active_plans.get(user_id)


async def demonstrate_complete_onboarding_workflow():
    """
    Demonstrate the complete learner onboarding workflow.
    
    This shows how ProfileAgent and CurriculumPlannerAgent work together
    to create a personalized learning experience.
    """
    print("🎓 Agentic Learning Coach - Complete Onboarding Demo")
    print("=" * 60)
    
    # Initialize repositories and agents
    user_repo = MockUserRepository()
    curriculum_repo = MockCurriculumRepository()
    
    profile_agent = ProfileAgent(user_repo)
    curriculum_agent = CurriculumPlannerAgent(curriculum_repo, user_repo)
    
    # Create learning context
    context = LearningContext(
        user_id="demo-user-123",
        session_id="demo-session-456",
        current_objective="onboarding"
    )
    
    print("\n📝 Step 1: Create User Profile")
    print("-" * 30)
    
    # Step 1: Create user profile
    create_profile_payload = {
        "intent": "create_profile",
        "email": "learner@example.com",
        "name": "Demo Learner"
    }
    
    profile_result = await profile_agent.process(context, create_profile_payload)
    print(f"✅ Profile created: {profile_result.success}")
    if profile_result.success:
        print(f"   User ID: {profile_result.data['profile']['user_id']}")
        print(f"   Next steps: {profile_result.data['next_steps']}")
        context.user_id = profile_result.data['profile']['user_id']
    
    print("\n🧠 Step 2: Skill Assessment")
    print("-" * 30)
    
    # Step 2: Get diagnostic questions
    assessment_payload = {
        "intent": "assess_skill_level",
        "domain": "javascript"
    }
    
    questions_result = await profile_agent.process(context, assessment_payload)
    print(f"✅ Diagnostic questions retrieved: {questions_result.success}")
    if questions_result.success:
        questions = questions_result.data['questions']
        print(f"   Number of questions: {len(questions)}")
        print(f"   Domain: {questions_result.data['domain']}")
        
        # Simulate answering questions (intermediate level responses)
        simulated_responses = [
            {
                "question_id": "js_basics_1",
                "selected": 1,  # Correct answer
                "answer": "true, false"
            },
            {
                "question_id": "js_basics_2",
                "answer": "function add(a, b) { return a + b; }"
            },
            {
                "question_id": "js_intermediate_1",
                "answer": "The map method creates a new array with transformed elements"
            }
        ]
        
        # Submit assessment responses
        assessment_response_payload = {
            "intent": "assess_skill_level",
            "domain": "javascript",
            "responses": simulated_responses
        }
        
        assessment_result = await profile_agent.process(context, assessment_response_payload)
        print(f"✅ Assessment completed: {assessment_result.success}")
        if assessment_result.success:
            skill_level = assessment_result.data['skill_level']
            print(f"   Assessed skill level: {skill_level}")
            print(f"   Next steps: {assessment_result.data['next_steps']}")
            context.skill_level = skill_level
    
    print("\n🎯 Step 3: Set Learning Goals")
    print("-" * 30)
    
    # Step 3: Set learning goals
    goals_payload = {
        "intent": "update_goals",
        "goals": "I want to learn React and Node.js to become a full-stack developer"
    }
    
    goals_result = await profile_agent.process(context, goals_payload)
    print(f"✅ Goals updated: {goals_result.success}")
    if goals_result.success:
        goals = goals_result.data['goals']
        print(f"   Parsed goals: {goals}")
        print(f"   Goal categories: {list(goals_result.data['goal_categories'].keys())}")
        context.learning_goals = goals
    
    print("\n⏰ Step 4: Set Time Constraints")
    print("-" * 30)
    
    # Step 4: Set time constraints
    constraints_payload = {
        "intent": "set_constraints",
        "constraints": "I can study 8 hours per week, mostly in the evenings and weekends"
    }
    
    constraints_result = await profile_agent.process(context, constraints_payload)
    print(f"✅ Time constraints set: {constraints_result.success}")
    if constraints_result.success:
        constraints = constraints_result.data['time_constraints']
        print(f"   Hours per week: {constraints['hours_per_week']}")
        print(f"   Preferred times: {constraints.get('preferred_times', [])}")
        print(f"   Feasibility: {constraints_result.data['realistic_goals']['feasibility']}")
        context.time_constraints = constraints
    
    print("\n📚 Step 5: Create Learning Plan")
    print("-" * 30)
    
    # Step 5: Create personalized learning plan
    curriculum_payload = {
        "intent": "create_learning_path",
        "goals": context.learning_goals,
        "time_constraints": context.time_constraints
    }
    
    curriculum_result = await curriculum_agent.process(context, curriculum_payload)
    print(f"✅ Learning plan created: {curriculum_result.success}")
    if curriculum_result.success:
        plan = curriculum_result.data['learning_plan']
        summary = curriculum_result.data['curriculum_summary']
        
        print(f"   Plan title: {plan['title']}")
        print(f"   Total days: {plan['total_days']}")
        print(f"   Total modules: {summary['total_modules']}")
        print(f"   Total tasks: {summary['total_tasks']}")
        print(f"   Practice percentage: {summary['practice_percentage']}%")
        print(f"   Estimated completion: {summary['estimated_completion_weeks']} weeks")
        
        # Activate the plan for the mock repository
        from src.domain.entities.learning_plan import LearningPlan
        from src.domain.value_objects.enums import LearningPlanStatus
        active_plan = LearningPlan.from_dict(plan)
        active_plan.status = LearningPlanStatus.ACTIVE
        curriculum_repo.active_plans[context.user_id] = active_plan
    
    print("\n🚀 Step 6: Get First Learning Topic")
    print("-" * 30)
    
    # Step 6: Get the first topic to start learning
    next_topic_payload = {
        "intent": "request_next_topic",
        "current_day": 0
    }
    
    topic_result = await curriculum_agent.process(context, next_topic_payload)
    print(f"✅ Next topic retrieved: {topic_result.success}")
    if topic_result.success:
        next_topic = topic_result.data['next_topic']
        if next_topic:
            print(f"   Module: {next_topic['module_title']}")
            print(f"   Task: {next_topic['task']['description']}")
            print(f"   Estimated time: {next_topic['task']['estimated_minutes']} minutes")
            print(f"   Progress: {next_topic['overall_progress']}")
        else:
            print("   No more topics available")
    
    print("\n📊 Step 7: Demonstrate Adaptive Behavior")
    print("-" * 30)
    
    # Step 7: Simulate performance data and adaptation
    performance_data = {
        "success_rate": 0.4,  # Struggling learner
        "consecutive_failures": 3,
        "average_attempts": 2.8,
        "time_per_task_minutes": 120
    }
    
    adaptation_payload = {
        "intent": "adapt_difficulty",
        "performance_data": performance_data,
        "trigger": "performance_analysis"
    }
    
    adaptation_result = await curriculum_agent.process(context, adaptation_payload)
    print(f"✅ Curriculum adapted: {adaptation_result.success}")
    if adaptation_result.success:
        adaptations = adaptation_result.data['adaptations_applied']
        print(f"   Adaptations applied: {len(adaptations)}")
        for adaptation in adaptations:
            print(f"   - {adaptation['type']}: {adaptation['reason']}")
        
        summary = adaptation_result.data['adaptation_summary']
        print(f"   Impact: {summary['impact']}")
    
    print("\n🔄 Step 8: Schedule Spaced Repetition")
    print("-" * 30)
    
    # Step 8: Schedule spaced repetition for completed topics
    completed_topics = [
        {
            "topic_id": "js-variables",
            "title": "JavaScript Variables",
            "completion_day": 3
        },
        {
            "topic_id": "js-functions",
            "title": "JavaScript Functions",
            "completion_day": 7
        }
    ]
    
    repetition_payload = {
        "intent": "schedule_spaced_repetition",
        "completed_topics": completed_topics,
        "current_day": 10
    }
    
    repetition_result = await curriculum_agent.process(context, repetition_payload)
    print(f"✅ Spaced repetition scheduled: {repetition_result.success}")
    if repetition_result.success:
        schedule = repetition_result.data['repetition_schedule']
        print(f"   Scheduled reviews: {len(schedule)}")
        if schedule:
            next_review = schedule[0]
            print(f"   Next review: {next_review['topic_title']} on day {next_review['review_day']}")
    
    print("\n🎯 Step 9: Add Mini-Project")
    print("-" * 30)
    
    # Step 9: Add a mini-project to integrate learning
    project_payload = {
        "intent": "add_mini_project",
        "project_type": "integration",
        "topics_covered": ["javascript", "dom", "events"],
        "difficulty_level": 2
    }
    
    project_result = await curriculum_agent.process(context, project_payload)
    print(f"✅ Mini-project added: {project_result.success}")
    if project_result.success:
        project = project_result.data['mini_project']
        timeline = project_result.data['project_timeline']
        
        print(f"   Project: {project['title']}")
        print(f"   Description: {project['description']}")
        print(f"   Estimated hours: {timeline['estimated_hours']}")
        print(f"   Estimated days: {timeline['estimated_days']}")
    
    print("\n📈 Step 10: Check Overall Status")
    print("-" * 30)
    
    # Step 10: Get curriculum status
    status_payload = {"intent": "get_curriculum_status"}
    
    status_result = await curriculum_agent.process(context, status_payload)
    print(f"✅ Status retrieved: {status_result.success}")
    if status_result.success:
        if status_result.data['has_active_plan']:
            status = status_result.data['status']
            recommendations = status_result.data['recommendations']
            
            print(f"   Completion: {status['completion_percentage']:.1f}%")
            print(f"   Remaining tasks: {status['remaining_tasks']}")
            print(f"   Current module: {status['current_module']}")
            print(f"   Recommendations: {recommendations}")
        else:
            print("   No active learning plan found")
    
    print("\n🎉 Onboarding Complete!")
    print("=" * 60)
    print("The learner now has:")
    print("✓ Assessed skill level")
    print("✓ Defined learning goals")
    print("✓ Set time constraints")
    print("✓ Personalized curriculum")
    print("✓ Adaptive difficulty system")
    print("✓ Spaced repetition schedule")
    print("✓ Integrated mini-projects")
    print("✓ Progress tracking")


async def demonstrate_timeframe_parsing():
    """Demonstrate natural language timeframe parsing capabilities."""
    print("\n🕒 Timeframe Parsing Demo")
    print("=" * 40)
    
    user_repo = MockUserRepository()
    profile_agent = ProfileAgent(user_repo)
    
    context = LearningContext(
        user_id="demo-user",
        session_id="demo-session"
    )
    
    # Test various timeframe inputs
    timeframe_examples = [
        "5 hours per week",
        "90 minutes per day",
        "2 hours per day on weekends only",
        "I can study in the evenings, about 8 hours per week",
        "30 minutes every morning before work",
        "weekends only, maybe 6 hours total"
    ]
    
    for timeframe_text in timeframe_examples:
        payload = {
            "intent": "parse_timeframe",
            "timeframe": timeframe_text
        }
        
        result = await profile_agent.process(context, payload)
        
        print(f"\nInput: '{timeframe_text}'")
        if result.success:
            constraints = result.data['parsed_constraints']
            confidence = result.data['confidence']
            
            print(f"  Hours/week: {constraints.get('hours_per_week', 'N/A')}")
            print(f"  Preferred times: {constraints.get('preferred_times', [])}")
            print(f"  Available days: {constraints.get('available_days', [])}")
            print(f"  Confidence: {confidence:.2f}")
        else:
            print(f"  ❌ Failed to parse: {result.error}")


async def demonstrate_curriculum_generation():
    """Demonstrate curriculum generation for different scenarios."""
    print("\n📚 Curriculum Generation Demo")
    print("=" * 40)
    
    user_repo = MockUserRepository()
    curriculum_repo = MockCurriculumRepository()
    curriculum_agent = CurriculumPlannerAgent(curriculum_repo, user_repo)
    
    context = LearningContext(
        user_id="demo-user",
        session_id="demo-session"
    )
    
    # Test different curriculum scenarios
    scenarios = [
        {
            "name": "Beginner JavaScript",
            "goals": ["javascript", "web development"],
            "skill_level": "beginner",
            "time_constraints": {"hours_per_week": 5}
        },
        {
            "name": "Intermediate React",
            "goals": ["react", "components", "hooks"],
            "skill_level": "intermediate", 
            "time_constraints": {"hours_per_week": 12}
        },
        {
            "name": "Full-Stack Development",
            "goals": ["javascript", "react", "node.js", "databases"],
            "skill_level": "intermediate",
            "time_constraints": {"hours_per_week": 15}
        }
    ]
    
    for scenario in scenarios:
        print(f"\n📖 Scenario: {scenario['name']}")
        print("-" * 30)
        
        payload = {
            "intent": "generate_curriculum",
            "goals": scenario["goals"],
            "skill_level": scenario["skill_level"],
            "time_constraints": scenario["time_constraints"]
        }
        
        result = await curriculum_agent.process(context, payload)
        
        if result.success:
            structure = result.data['curriculum_structure']
            progression = result.data['difficulty_progression']
            
            print(f"  Title: {structure['title']}")
            print(f"  Domain: {structure['primary_domain']}")
            print(f"  Duration: {structure['total_days']} days")
            print(f"  Modules: {len(structure['modules'])}")
            print(f"  Estimated hours: {structure['estimated_hours']}")
            print(f"  Practice ratio: {structure['practice_ratio']:.0%}")
            print(f"  Difficulty progression: {progression['progression']}")
            
            # Show first few modules
            print("  First modules:")
            for i, module in enumerate(structure['modules'][:3]):
                print(f"    {i+1}. {module['title']} ({module['duration_days']} days)")
        else:
            print(f"  ❌ Failed: {result.error}")


async def main():
    """Run all demonstration scenarios."""
    try:
        await demonstrate_complete_onboarding_workflow()
        await demonstrate_timeframe_parsing()
        await demonstrate_curriculum_generation()
        
        print("\n🎊 All demonstrations completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())