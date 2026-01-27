"""
Example demonstrating how to use the base agent framework.
Shows how to create a custom agent and use it with circuit breaker protection.
"""
import asyncio
from typing import Dict, Any, List

from src.agents.base import (
    BaseAgent,
    AgentType,
    LearningContext,
    AgentResult,
    CircuitBreakerConfig
)


class ExampleProfileAgent(BaseAgent):
    """
    Example implementation of a ProfileAgent.
    Demonstrates how to extend BaseAgent with specific functionality.
    """
    
    def __init__(self):
        # Configure circuit breaker for this agent
        circuit_config = CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=30,
            success_threshold=2,
            timeout=10
        )
        super().__init__(AgentType.PROFILE, circuit_config)
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process profile-related requests.
        """
        intent = payload.get('intent')
        
        if intent == 'assess_skill_level':
            return await self._assess_skill_level(context, payload)
        elif intent == 'update_goals':
            return await self._update_goals(context, payload)
        elif intent == 'get_profile':
            return await self._get_profile(context, payload)
        else:
            return AgentResult.error_result(
                error=f"Unsupported intent: {intent}",
                error_code="UNSUPPORTED_INTENT"
            )
    
    def get_supported_intents(self) -> List[str]:
        """Return list of supported intents."""
        return ['assess_skill_level', 'update_goals', 'get_profile']
    
    async def _assess_skill_level(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Assess user's skill level through diagnostic questions."""
        
        # Simulate some processing time
        await asyncio.sleep(0.1)
        
        responses = payload.get('responses', [])
        
        if not responses:
            # Return diagnostic questions
            questions = [
                {
                    "id": 1,
                    "question": "How comfortable are you with variables and data types?",
                    "options": ["Not at all", "Somewhat", "Very comfortable"]
                },
                {
                    "id": 2,
                    "question": "Have you worked with functions and classes?",
                    "options": ["Never", "Basic understanding", "Advanced usage"]
                }
            ]
            
            return AgentResult.success_result(
                data={"questions": questions},
                next_actions=["await_responses"]
            )
        
        # Evaluate responses and determine skill level
        skill_level = self._calculate_skill_level(responses)
        
        return AgentResult.success_result(
            data={
                "skill_level": skill_level,
                "assessment_complete": True
            },
            next_actions=["update_profile", "create_curriculum"]
        )
    
    async def _update_goals(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Update user's learning goals."""
        
        goals = payload.get('goals', [])
        
        if not goals:
            return AgentResult.error_result(
                error="No goals provided",
                error_code="MISSING_GOALS"
            )
        
        # Simulate updating goals in database
        await asyncio.sleep(0.05)
        
        return AgentResult.success_result(
            data={
                "goals": goals,
                "updated": True
            },
            next_actions=["adapt_curriculum"]
        )
    
    async def _get_profile(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Get user's current profile."""
        
        # Simulate database lookup
        await asyncio.sleep(0.05)
        
        profile = {
            "user_id": context.user_id,
            "skill_level": context.skill_level or "beginner",
            "learning_goals": context.learning_goals,
            "preferences": context.preferences
        }
        
        return AgentResult.success_result(data={"profile": profile})
    
    def _calculate_skill_level(self, responses: List[Dict[str, Any]]) -> str:
        """Calculate skill level based on assessment responses."""
        
        # Simple scoring logic for demonstration
        total_score = 0
        for response in responses:
            answer = response.get('answer', 0)
            if isinstance(answer, int):
                total_score += answer
        
        avg_score = total_score / len(responses) if responses else 0
        
        if avg_score < 1:
            return "beginner"
        elif avg_score < 2:
            return "intermediate"
        else:
            return "advanced"
    
    async def _handle_timeout_fallback(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Provide fallback behavior for timeouts."""
        intent = payload.get('intent')
        
        if intent == 'get_profile':
            # Return cached or default profile
            return AgentResult.success_result(
                data={
                    "profile": {
                        "user_id": context.user_id,
                        "skill_level": "beginner",  # Default fallback
                        "learning_goals": [],
                        "preferences": {}
                    },
                    "fallback": True
                },
                metadata={"source": "fallback_cache"}
            )
        
        return None  # No fallback available for other intents


async def main():
    """
    Demonstrate usage of the base agent framework.
    """
    print("🤖 Base Agent Framework Demo")
    print("=" * 40)
    
    # Create an agent instance
    agent = ExampleProfileAgent()
    
    # Create learning context
    context = LearningContext(
        user_id="demo-user-123",
        session_id="demo-session-456",
        skill_level="intermediate",
        learning_goals=["python", "web-development"]
    )
    
    print(f"📊 Agent Health Status:")
    health = agent.get_health_status()
    print(f"   Type: {health['agent_type']}")
    print(f"   Status: {health['status']}")
    print(f"   Supported Intents: {health['supported_intents']}")
    print()
    
    # Example 1: Get user profile
    print("📋 Example 1: Get User Profile")
    payload = {"intent": "get_profile"}
    
    result = await agent.execute_with_protection(context, payload)
    
    if result.success:
        print(f"   ✅ Success: {result.data}")
    else:
        print(f"   ❌ Error: {result.error}")
    print()
    
    # Example 2: Start skill assessment
    print("📝 Example 2: Start Skill Assessment")
    payload = {"intent": "assess_skill_level"}
    
    result = await agent.execute_with_protection(context, payload)
    
    if result.success:
        print(f"   ✅ Assessment Questions Generated:")
        for q in result.data['questions']:
            print(f"      {q['id']}. {q['question']}")
            print(f"         Options: {q['options']}")
    else:
        print(f"   ❌ Error: {result.error}")
    print()
    
    # Example 3: Complete skill assessment
    print("📊 Example 3: Complete Skill Assessment")
    payload = {
        "intent": "assess_skill_level",
        "responses": [
            {"question_id": 1, "answer": 2},  # Very comfortable
            {"question_id": 2, "answer": 1}   # Basic understanding
        ]
    }
    
    result = await agent.execute_with_protection(context, payload)
    
    if result.success:
        print(f"   ✅ Assessment Complete:")
        print(f"      Skill Level: {result.data['skill_level']}")
        print(f"      Next Actions: {result.next_actions}")
    else:
        print(f"   ❌ Error: {result.error}")
    print()
    
    # Example 4: Update learning goals
    print("🎯 Example 4: Update Learning Goals")
    payload = {
        "intent": "update_goals",
        "goals": ["python", "machine-learning", "data-science"]
    }
    
    result = await agent.execute_with_protection(context, payload)
    
    if result.success:
        print(f"   ✅ Goals Updated: {result.data['goals']}")
        print(f"   Next Actions: {result.next_actions}")
    else:
        print(f"   ❌ Error: {result.error}")
    print()
    
    # Example 5: Test error handling
    print("⚠️  Example 5: Test Error Handling")
    payload = {"intent": "unsupported_intent"}
    
    result = await agent.execute_with_protection(context, payload)
    
    if result.success:
        print(f"   ✅ Unexpected success: {result.data}")
    else:
        print(f"   ❌ Expected Error: {result.error}")
        print(f"      Error Code: {result.error_code}")
    print()
    
    # Show final circuit breaker stats
    print("📈 Final Circuit Breaker Statistics:")
    stats = agent.circuit_breaker.get_stats()
    print(f"   State: {stats['state']}")
    print(f"   Total Calls: {stats['total_calls']}")
    print(f"   Success Count: {stats['success_count']}")
    print(f"   Failure Count: {stats['failure_count']}")
    print()
    
    print("✨ Demo Complete!")


if __name__ == "__main__":
    asyncio.run(main())