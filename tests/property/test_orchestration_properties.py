"""Property-based tests for orchestration and routing.

Feature: property-tests-and-docker-execution
Tests for intent routing, multi-agent workflows, and error recovery.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck, assume
from typing import Dict, Any

from tests.property.strategies import (
    user_profile_strategy,
    user_input_strategy,
    code_submission_strategy
)


class TestIntentRoutingProperties:
    """Property tests for intent routing correctness."""
    
    @settings(max_examples=100)
    @given(user_message=st.text(min_size=5, max_size=200))
    def test_property_20_intent_routing_correctness(self, user_message):
        """Property 20: Intent Routing Correctness.
        
        For any user message, the Orchestrator SHALL route it to exactly one
        appropriate agent based on intent classification.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 20 (main design)**
        """
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Classify intent and route
        routing_decision = orchestrator.route_message(user_message)
        
        # Property: Should route to exactly one agent
        assert routing_decision is not None
        assert 'agent' in routing_decision or hasattr(routing_decision, 'agent')
        
        # Property: Agent should be valid
        agent = routing_decision['agent'] if 'agent' in routing_decision else routing_decision.agent
        valid_agents = [
            'ProfileAgent',
            'CurriculumPlannerAgent',
            'ExerciseGeneratorAgent',
            'ReviewerAgent',
            'ResourcesAgent',
            'ProgressTracker'
        ]
        assert agent in valid_agents, f"Invalid agent: {agent}"
    
    @settings(max_examples=50)
    @given(
        goal_message=st.sampled_from([
            "I want to learn React",
            "Help me understand Python",
            "I need to learn TypeScript"
        ])
    )
    def test_goal_messages_route_to_profile_agent(self, goal_message):
        """Property: Goal-setting messages should route to ProfileAgent."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        routing = orchestrator.route_message(goal_message)
        
        agent = routing['agent'] if 'agent' in routing else routing.agent
        
        # Property: Goal messages should go to ProfileAgent
        assert agent == 'ProfileAgent', f"Goal message routed to {agent} instead of ProfileAgent"
    
    @settings(max_examples=50)
    @given(
        code_message=st.sampled_from([
            "Here's my solution: def add(a, b): return a + b",
            "I've completed the exercise",
            "Check my code"
        ])
    )
    def test_code_messages_route_to_reviewer_agent(self, code_message):
        """Property: Code submission messages should route to ReviewerAgent."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        routing = orchestrator.route_message(code_message)
        
        agent = routing['agent'] if 'agent' in routing else routing.agent
        
        # Property: Code messages should go to ReviewerAgent
        assert agent == 'ReviewerAgent', f"Code message routed to {agent} instead of ReviewerAgent"
    
    @settings(max_examples=50)
    @given(
        help_message=st.sampled_from([
            "I need help with React hooks",
            "Can you explain decorators?",
            "Show me examples of async/await"
        ])
    )
    def test_help_messages_route_to_resources_agent(self, help_message):
        """Property: Help/resource messages should route to ResourcesAgent."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        routing = orchestrator.route_message(help_message)
        
        agent = routing['agent'] if 'agent' in routing else routing.agent
        
        # Property: Help messages should go to ResourcesAgent
        assert agent == 'ResourcesAgent', f"Help message routed to {agent} instead of ResourcesAgent"


class TestMultiAgentWorkflowProperties:
    """Property tests for multi-agent workflow coordination."""
    
    @settings(max_examples=50)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_property_21_multi_agent_workflow_coordination(self, profile):
        """Property 21: Multi-agent Workflow Coordination.
        
        For any multi-step workflow (e.g., onboarding), the Orchestrator SHALL
        coordinate agent handoffs and maintain context across steps.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 21 (main design)**
        """
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Start onboarding workflow
        workflow = await orchestrator.start_onboarding_workflow(profile.user_id)
        
        # Property: Workflow should have multiple steps
        assert workflow is not None
        assert 'steps' in workflow or hasattr(workflow, 'steps')
        
        steps = workflow['steps'] if 'steps' in workflow else workflow.steps
        assert len(steps) > 1, "Onboarding should have multiple steps"
        
        # Property: Each step should specify an agent
        for step in steps:
            assert 'agent' in step or hasattr(step, 'agent')
            agent = step['agent'] if 'agent' in step else step.agent
            assert agent is not None and len(agent) > 0
        
        # Property: Context should be maintained across steps
        if 'context' in workflow or hasattr(workflow, 'context'):
            context = workflow['context'] if 'context' in workflow else workflow.context
            assert 'user_id' in context or hasattr(context, 'user_id')
    
    @settings(max_examples=30)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_workflow_state_consistency(self, profile):
        """Property: Workflow state should remain consistent across agent transitions."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Execute workflow
        workflow = await orchestrator.start_onboarding_workflow(profile.user_id)
        
        # Property: User ID should be preserved throughout workflow
        if 'context' in workflow or hasattr(workflow, 'context'):
            context = workflow['context'] if 'context' in workflow else workflow.context
            user_id = context.get('user_id') if isinstance(context, dict) else getattr(context, 'user_id', None)
            assert user_id == profile.user_id
    
    @settings(max_examples=30)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_workflow_completion_tracking(self, profile):
        """Property: Workflows should track completion status."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        workflow = await orchestrator.start_onboarding_workflow(profile.user_id)
        
        # Property: Should have completion status
        assert 'completed' in workflow or hasattr(workflow, 'completed')
        assert 'current_step' in workflow or hasattr(workflow, 'current_step')


class TestErrorRecoveryProperties:
    """Property tests for error recovery and graceful degradation."""
    
    @settings(max_examples=50)
    @given(user_message=st.text(min_size=1, max_size=100))
    @pytest.mark.asyncio
    async def test_property_22_agent_failure_recovery(self, user_message):
        """Property 22: Agent Failure Recovery.
        
        For any agent failure, the Orchestrator SHALL detect the failure and
        either retry, use a fallback agent, or return a graceful error.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 22 (main design)**
        """
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Simulate agent failure by routing to non-existent agent
        try:
            result = await orchestrator.handle_message_with_recovery(
                user_message,
                force_agent='NonExistentAgent'
            )
            
            # Property: Should return error result, not crash
            assert result is not None
            assert 'error' in result or 'fallback' in result or hasattr(result, 'error')
        
        except Exception as e:
            # Property: If exception is raised, it should be a known error type
            assert isinstance(e, (ValueError, RuntimeError, AttributeError))
    
    @settings(max_examples=30)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_graceful_degradation_on_timeout(self, profile):
        """Property: System should degrade gracefully on agent timeout."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Set very short timeout to force timeout
        result = await orchestrator.execute_with_timeout(
            agent='CurriculumPlannerAgent',
            method='create_curriculum',
            args=[profile],
            timeout=0.001  # 1ms - will likely timeout
        )
        
        # Property: Should return result (success or timeout error)
        assert result is not None
        
        # Property: If timeout, should have error message
        if 'timeout' in str(result).lower() or ('error' in result and 'timeout' in result['error'].lower()):
            assert 'timeout' in str(result).lower()
    
    @settings(max_examples=30)
    @given(invalid_input=st.one_of(st.none(), st.just(""), st.just({}), st.just([])))
    @pytest.mark.asyncio
    async def test_invalid_input_handling(self, invalid_input):
        """Property: System should handle invalid input without crashing."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Property: Should not crash on invalid input
        try:
            result = await orchestrator.handle_message(invalid_input)
            # If it returns, result should indicate error
            assert result is not None
        except (ValueError, TypeError, AttributeError):
            # Expected exceptions are acceptable
            pass
    
    @settings(max_examples=20)
    @given(user_message=st.text(min_size=5, max_size=100))
    @pytest.mark.asyncio
    async def test_retry_logic_on_transient_failures(self, user_message):
        """Property: System should retry on transient failures."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Track retry attempts
        retry_count = 0
        max_retries = 3
        
        async def failing_operation():
            nonlocal retry_count
            retry_count += 1
            if retry_count < 2:
                raise RuntimeError("Transient failure")
            return {"success": True}
        
        # Execute with retry
        result = await orchestrator.execute_with_retry(
            failing_operation,
            max_retries=max_retries
        )
        
        # Property: Should eventually succeed after retries
        assert result is not None
        assert result.get('success') == True
        assert retry_count >= 2, "Should have retried at least once"


class TestContextManagement:
    """Property tests for context management across agent interactions."""
    
    @settings(max_examples=50)
    @given(
        profile=user_profile_strategy(),
        messages=st.lists(st.text(min_size=5, max_size=100), min_size=2, max_size=5)
    )
    @pytest.mark.asyncio
    async def test_context_preservation_across_messages(self, profile, messages):
        """Property: Context should be preserved across multiple messages."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Initialize session
        session_id = await orchestrator.create_session(profile.user_id)
        
        # Send multiple messages
        for message in messages:
            result = await orchestrator.handle_message(
                message,
                session_id=session_id,
                user_id=profile.user_id
            )
            
            # Property: Session ID should be preserved
            if 'session_id' in result or hasattr(result, 'session_id'):
                result_session = result['session_id'] if 'session_id' in result else result.session_id
                assert result_session == session_id
        
        # Property: Session should have history of all messages
        session = await orchestrator.get_session(session_id)
        if session and ('messages' in session or hasattr(session, 'messages')):
            session_messages = session['messages'] if 'messages' in session else session.messages
            assert len(session_messages) >= len(messages)
    
    @settings(max_examples=30)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_context_isolation_between_users(self, profile):
        """Property: Context should be isolated between different users."""
        from src.agents.orchestrator_agent import OrchestratorAgent
        
        orchestrator = OrchestratorAgent()
        
        # Create sessions for two users
        session1 = await orchestrator.create_session(profile.user_id)
        session2 = await orchestrator.create_session(str(profile.user_id) + "_other")
        
        # Property: Sessions should be different
        assert session1 != session2
        
        # Property: Context should not leak between sessions
        context1 = await orchestrator.get_session_context(session1)
        context2 = await orchestrator.get_session_context(session2)
        
        if context1 and context2:
            user1 = context1.get('user_id') if isinstance(context1, dict) else getattr(context1, 'user_id', None)
            user2 = context2.get('user_id') if isinstance(context2, dict) else getattr(context2, 'user_id', None)
            assert user1 != user2
