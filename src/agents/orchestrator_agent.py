"""
OrchestratorAgent implementation for the Agentic Learning Coach system.

This agent serves as the single entry point and coordinator for all learning operations.
It routes user intents to appropriate specialist agents and coordinates multi-agent workflows.

Key responsibilities:
- Route user intents to appropriate agents
- Manage conversation state and context
- Coordinate multi-agent workflows
- Handle error recovery and fallbacks
- NEVER contain business logic (delegates to specialist agents)
"""
import asyncio
from typing import Dict, Any, List, Optional, Type, Callable, Awaitable
from datetime import datetime, timezone
from dataclasses import dataclass, field

from .base.base_agent import BaseAgent
from .base.types import LearningContext, AgentResult, AgentType, AgentMessage
from .base.exceptions import (
    ValidationError, 
    AgentProcessingError, 
    AgentCommunicationError,
    AgentTimeoutError
)
from .intent_router import IntentRouter, LearningIntent, INTENT_ROUTING


@dataclass
class WorkflowStep:
    """Represents a step in a multi-agent workflow."""
    agent_type: AgentType
    intent: str
    payload_transformer: Optional[Callable[[Dict[str, Any], AgentResult], Dict[str, Any]]] = None
    required: bool = True
    timeout: Optional[int] = None


@dataclass
class WorkflowDefinition:
    """Defines a multi-agent workflow."""
    name: str
    description: str
    steps: List[WorkflowStep]
    on_step_failure: str = "abort"  # "abort", "skip", "retry"
    max_retries: int = 2


@dataclass
class AgentRegistration:
    """Registration information for a specialist agent."""
    agent_type: AgentType
    agent_instance: BaseAgent
    supported_intents: List[str]
    priority: int = 0  # Higher priority agents are preferred for ambiguous intents


class AgentRegistry:
    """
    Registry for managing specialist agents.
    
    Provides dependency injection and agent lookup functionality.
    """
    
    def __init__(self):
        self._agents: Dict[AgentType, AgentRegistration] = {}
        self._intent_to_agent: Dict[str, AgentType] = {}
    
    def register(self, agent: BaseAgent, priority: int = 0) -> None:
        """
        Register a specialist agent.
        
        Args:
            agent: The agent instance to register
            priority: Priority for intent resolution (higher = preferred)
        """
        registration = AgentRegistration(
            agent_type=agent.agent_type,
            agent_instance=agent,
            supported_intents=agent.get_supported_intents(),
            priority=priority
        )
        
        self._agents[agent.agent_type] = registration
        
        # Map intents to this agent
        for intent in registration.supported_intents:
            self._intent_to_agent[intent] = agent.agent_type
    
    def unregister(self, agent_type: AgentType) -> None:
        """Unregister an agent."""
        if agent_type in self._agents:
            registration = self._agents[agent_type]
            for intent in registration.supported_intents:
                if self._intent_to_agent.get(intent) == agent_type:
                    del self._intent_to_agent[intent]
            del self._agents[agent_type]
    
    def get_agent(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """Get an agent by type."""
        registration = self._agents.get(agent_type)
        return registration.agent_instance if registration else None
    
    def get_agent_for_intent(self, intent: str) -> Optional[BaseAgent]:
        """Get the agent that handles a specific intent."""
        agent_type = self._intent_to_agent.get(intent)
        if agent_type:
            return self.get_agent(agent_type)
        return None
    
    def get_all_agents(self) -> List[BaseAgent]:
        """Get all registered agents."""
        return [reg.agent_instance for reg in self._agents.values()]
    
    def get_registered_types(self) -> List[AgentType]:
        """Get all registered agent types."""
        return list(self._agents.keys())
    
    def is_registered(self, agent_type: AgentType) -> bool:
        """Check if an agent type is registered."""
        return agent_type in self._agents


class OrchestratorAgent(BaseAgent):
    """
    Orchestrator agent that coordinates all learning operations.
    
    Serves as the single entry point for the learning coach system,
    routing requests to appropriate specialist agents and coordinating
    multi-agent workflows.
    
    Key principles:
    - No business logic - only routing and coordination
    - Clean handoffs with explicit contracts
    - Graceful error handling and fallbacks
    - Comprehensive logging of all operations
    """
    
    def __init__(self, agent_registry: Optional[AgentRegistry] = None):
        """
        Initialize the OrchestratorAgent.
        
        Args:
            agent_registry: Registry of specialist agents (creates new if not provided)
        """
        super().__init__(AgentType.ORCHESTRATOR)
        self.registry = agent_registry or AgentRegistry()
        self.intent_router = IntentRouter()
        
        # Standard workflow definitions
        self._workflows = self._initialize_workflows()
        
        # Conversation state tracking
        self._active_workflows: Dict[str, Dict[str, Any]] = {}
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        # Orchestrator can handle all intents by routing to specialists
        return [intent.value for intent in LearningIntent]
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """
        Process a request by routing to the appropriate specialist agent.
        
        Args:
            context: Learning context with user information
            payload: Request payload with intent and data
            
        Returns:
            AgentResult from the specialist agent or workflow
        """
        intent_str = payload.get("intent")
        
        if not intent_str:
            # Try to classify intent from natural language
            user_input = payload.get("message", payload.get("query", ""))
            if user_input:
                return await self._handle_natural_language_input(context, user_input, payload)
            raise ValidationError("Intent or message is required")
        
        # Check if this is a workflow request
        workflow_name = payload.get("workflow")
        if workflow_name:
            return await self._execute_workflow(context, workflow_name, payload)
        
        # Route to specialist agent
        return await self._route_to_specialist(context, intent_str, payload)
    
    async def _handle_natural_language_input(
        self, 
        context: LearningContext, 
        user_input: str,
        payload: Dict[str, Any]
    ) -> AgentResult:
        """
        Handle natural language input by classifying intent and routing.
        
        Args:
            context: Learning context
            user_input: Natural language input from user
            payload: Original payload
            
        Returns:
            AgentResult from the appropriate specialist
        """
        # Classify intent
        classification = self.intent_router.classify_intent(user_input)
        
        if not classification.intent:
            return AgentResult.error_result(
                error="Could not understand your request. Please try rephrasing.",
                error_code="INTENT_CLASSIFICATION_FAILED",
                metadata={
                    "raw_input": user_input,
                    "confidence": classification.confidence
                }
            )
        
        if classification.confidence < 0.3:
            # Low confidence - ask for clarification
            return AgentResult.success_result(
                data={
                    "needs_clarification": True,
                    "detected_intent": classification.intent.value,
                    "confidence": classification.confidence,
                    "alternatives": [
                        {
                            "intent": alt[0].value,
                            "confidence": alt[1],
                            "description": self.intent_router.get_intent_description(alt[0])
                        }
                        for alt in classification.alternative_intents
                    ],
                    "message": "I'm not sure I understood correctly. Did you mean one of these?"
                },
                next_actions=["clarify_intent"]
            )
        
        # Route to specialist with classified intent
        updated_payload = {**payload, "intent": classification.intent.value}
        
        self.logger.log_info(
            f"Classified intent: {classification.intent.value} (confidence: {classification.confidence:.2f})",
            context, "intent_classification"
        )
        
        return await self._route_to_specialist(context, classification.intent.value, updated_payload)
    
    async def _route_to_specialist(
        self, 
        context: LearningContext, 
        intent_str: str,
        payload: Dict[str, Any]
    ) -> AgentResult:
        """
        Route a request to the appropriate specialist agent.
        
        Args:
            context: Learning context
            intent_str: Intent string
            payload: Request payload
            
        Returns:
            AgentResult from the specialist agent
        """
        # Determine target agent
        target_agent_type = self.intent_router.route_intent_string(intent_str)
        
        if not target_agent_type:
            # Try to find agent from registry
            agent = self.registry.get_agent_for_intent(intent_str)
            if agent:
                target_agent_type = agent.agent_type
            else:
                return AgentResult.error_result(
                    error=f"No agent found to handle intent: {intent_str}",
                    error_code="NO_AGENT_FOR_INTENT"
                )
        
        # Get the specialist agent
        specialist = self.registry.get_agent(target_agent_type)
        
        if not specialist:
            return AgentResult.error_result(
                error=f"Agent {target_agent_type.value} is not registered",
                error_code="AGENT_NOT_REGISTERED",
                metadata={"registered_agents": [t.value for t in self.registry.get_registered_types()]}
            )
        
        # Create agent message for logging
        message = AgentMessage(
            from_agent=AgentType.ORCHESTRATOR,
            to_agent=target_agent_type,
            intent=intent_str,
            payload=payload,
            context=context,
            priority="normal"
        )
        
        self.logger.log_debug(
            f"Routing to {target_agent_type.value} for intent: {intent_str}",
            context, "route_to_specialist"
        )
        
        # Execute with protection
        try:
            result = await specialist.execute_with_protection(context, payload)
            
            # Log successful handoff
            self.logger.log_info(
                f"Specialist {target_agent_type.value} completed: success={result.success}",
                context, "specialist_response"
            )
            
            return result
            
        except Exception as e:
            self.logger.log_error(
                f"Specialist {target_agent_type.value} failed",
                e, context, "specialist_error"
            )
            
            # Attempt fallback
            fallback_result = await self._handle_specialist_failure(
                context, target_agent_type, intent_str, payload, e
            )
            
            if fallback_result:
                return fallback_result
            
            return AgentResult.error_result(
                error=f"Agent {target_agent_type.value} failed: {str(e)}",
                error_code="SPECIALIST_FAILED"
            )
    
    async def _handle_specialist_failure(
        self,
        context: LearningContext,
        agent_type: AgentType,
        intent: str,
        payload: Dict[str, Any],
        error: Exception
    ) -> Optional[AgentResult]:
        """
        Handle specialist agent failure with fallback strategies.
        
        Args:
            context: Learning context
            agent_type: The failed agent type
            intent: The intent that was being processed
            payload: Original payload
            error: The exception that occurred
            
        Returns:
            Fallback result or None if no fallback available
        """
        # Define fallback strategies for different agent types
        fallback_strategies = {
            AgentType.EXERCISE_GENERATOR: self._fallback_exercise_generator,
            AgentType.RESOURCES: self._fallback_resources,
            AgentType.REVIEWER: self._fallback_reviewer,
        }
        
        fallback_handler = fallback_strategies.get(agent_type)
        if fallback_handler:
            try:
                return await fallback_handler(context, intent, payload)
            except Exception as fallback_error:
                self.logger.log_warning(
                    f"Fallback for {agent_type.value} also failed: {fallback_error}",
                    context, "fallback_failed"
                )
        
        return None
    
    async def _fallback_exercise_generator(
        self, 
        context: LearningContext, 
        intent: str, 
        payload: Dict[str, Any]
    ) -> AgentResult:
        """Fallback for exercise generator failures."""
        return AgentResult.success_result(
            data={
                "fallback": True,
                "message": "Exercise generation is temporarily unavailable. Please try again later.",
                "suggestion": "In the meantime, you can review previous exercises or explore resources."
            },
            next_actions=["check_progress", "search_resources"]
        )
    
    async def _fallback_resources(
        self, 
        context: LearningContext, 
        intent: str, 
        payload: Dict[str, Any]
    ) -> AgentResult:
        """Fallback for resources agent failures."""
        return AgentResult.success_result(
            data={
                "fallback": True,
                "message": "Resource search is temporarily unavailable.",
                "suggestion": "Try searching for official documentation directly."
            },
            next_actions=["request_exercise"]
        )
    
    async def _fallback_reviewer(
        self, 
        context: LearningContext, 
        intent: str, 
        payload: Dict[str, Any]
    ) -> AgentResult:
        """Fallback for reviewer agent failures."""
        return AgentResult.success_result(
            data={
                "fallback": True,
                "message": "Code review is temporarily unavailable. Your submission has been saved.",
                "suggestion": "Please try submitting again in a few moments."
            },
            next_actions=["check_progress"]
        )
    
    def _initialize_workflows(self) -> Dict[str, WorkflowDefinition]:
        """Initialize standard multi-agent workflows."""
        return {
            "new_learner_onboarding": WorkflowDefinition(
                name="new_learner_onboarding",
                description="Complete onboarding workflow for new learners",
                steps=[
                    WorkflowStep(
                        agent_type=AgentType.PROFILE,
                        intent="assess_skill_level",
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.PROFILE,
                        intent="update_goals",
                        payload_transformer=lambda p, r: {
                            **p,
                            "skill_level": r.data.get("skill_level") if r.data else None
                        },
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.PROFILE,
                        intent="set_constraints",
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.CURRICULUM_PLANNER,
                        intent="create_learning_path",
                        payload_transformer=lambda p, r: {
                            **p,
                            "profile_complete": True
                        },
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.EXERCISE_GENERATOR,
                        intent="generate_exercise",
                        payload_transformer=lambda p, r: {
                            **p,
                            "topic": r.data.get("first_topic") if r.data else None,
                            "difficulty": "beginner"
                        },
                        required=False
                    ),
                ],
                on_step_failure="abort"
            ),
            
            "exercise_submission": WorkflowDefinition(
                name="exercise_submission",
                description="Handle exercise submission with feedback and adaptation",
                steps=[
                    WorkflowStep(
                        agent_type=AgentType.REVIEWER,
                        intent="evaluate_submission",
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.PROGRESS_TRACKER,
                        intent="update_progress",
                        payload_transformer=lambda p, r: {
                            **p,
                            "evaluation": r.data.get("evaluation") if r.data else None,
                            "passed": r.data.get("evaluation", {}).get("passed") if r.data else False
                        },
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.CURRICULUM_PLANNER,
                        intent="adapt_difficulty",
                        payload_transformer=lambda p, r: {
                            **p,
                            "performance_data": r.data
                        },
                        required=False
                    ),
                    WorkflowStep(
                        agent_type=AgentType.EXERCISE_GENERATOR,
                        intent="generate_exercise",
                        payload_transformer=self._determine_next_exercise_payload,
                        required=False
                    ),
                ],
                on_step_failure="skip"
            ),
            
            "resource_discovery": WorkflowDefinition(
                name="resource_discovery",
                description="Find and curate learning resources",
                steps=[
                    WorkflowStep(
                        agent_type=AgentType.RESOURCES,
                        intent="search_resources",
                        required=True
                    ),
                    WorkflowStep(
                        agent_type=AgentType.RESOURCES,
                        intent="verify_resource_quality",
                        payload_transformer=lambda p, r: {
                            **p,
                            "resources": r.data.get("resources", []) if r.data else []
                        },
                        required=False
                    ),
                ],
                on_step_failure="skip"
            ),
        }
    
    def _determine_next_exercise_payload(
        self, 
        payload: Dict[str, Any], 
        previous_result: AgentResult
    ) -> Dict[str, Any]:
        """Determine the payload for the next exercise based on performance."""
        if not previous_result.data:
            return payload
        
        progress_data = previous_result.data
        consecutive_failures = progress_data.get("consecutive_failures", 0)
        quick_success = progress_data.get("quick_success", False)
        
        if consecutive_failures >= 2:
            # Create recap exercise
            return {
                **payload,
                "intent": "create_recap_exercise",
                "difficulty": "reduced"
            }
        elif quick_success:
            # Create stretch exercise
            return {
                **payload,
                "intent": "create_stretch_exercise",
                "difficulty": "increased"
            }
        
        return payload
    
    async def _execute_workflow(
        self, 
        context: LearningContext, 
        workflow_name: str,
        payload: Dict[str, Any]
    ) -> AgentResult:
        """
        Execute a multi-agent workflow.
        
        Args:
            context: Learning context
            workflow_name: Name of the workflow to execute
            payload: Initial payload
            
        Returns:
            AgentResult with workflow results
        """
        workflow = self._workflows.get(workflow_name)
        
        if not workflow:
            return AgentResult.error_result(
                error=f"Unknown workflow: {workflow_name}",
                error_code="UNKNOWN_WORKFLOW",
                metadata={"available_workflows": list(self._workflows.keys())}
            )
        
        self.logger.log_info(
            f"Starting workflow: {workflow_name}",
            context, "workflow_start"
        )
        
        # Track workflow state
        workflow_state = {
            "workflow_name": workflow_name,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "steps_completed": [],
            "steps_failed": [],
            "current_payload": payload.copy(),
            "results": []
        }
        
        self._active_workflows[context.correlation_id] = workflow_state
        
        try:
            for i, step in enumerate(workflow.steps):
                step_result = await self._execute_workflow_step(
                    context, step, workflow_state, workflow
                )
                
                workflow_state["results"].append({
                    "step_index": i,
                    "agent": step.agent_type.value,
                    "intent": step.intent,
                    "success": step_result.success,
                    "data": step_result.data
                })
                
                if step_result.success:
                    workflow_state["steps_completed"].append(i)
                    
                    # Transform payload for next step if transformer provided
                    if step.payload_transformer and step_result.data:
                        workflow_state["current_payload"] = step.payload_transformer(
                            workflow_state["current_payload"],
                            step_result
                        )
                else:
                    workflow_state["steps_failed"].append(i)
                    
                    if step.required and workflow.on_step_failure == "abort":
                        self.logger.log_warning(
                            f"Workflow {workflow_name} aborted at step {i}",
                            context, "workflow_abort"
                        )
                        return AgentResult.error_result(
                            error=f"Workflow failed at step {i}: {step_result.error}",
                            error_code="WORKFLOW_STEP_FAILED",
                            metadata=workflow_state
                        )
            
            # Workflow completed
            self.logger.log_info(
                f"Workflow {workflow_name} completed successfully",
                context, "workflow_complete"
            )
            
            return AgentResult.success_result(
                data={
                    "workflow_name": workflow_name,
                    "steps_completed": len(workflow_state["steps_completed"]),
                    "steps_failed": len(workflow_state["steps_failed"]),
                    "results": workflow_state["results"],
                    "final_data": workflow_state["results"][-1]["data"] if workflow_state["results"] else None
                },
                next_actions=self._determine_workflow_next_actions(workflow_name, workflow_state)
            )
            
        finally:
            # Clean up workflow state
            if context.correlation_id in self._active_workflows:
                del self._active_workflows[context.correlation_id]
    
    async def _execute_workflow_step(
        self,
        context: LearningContext,
        step: WorkflowStep,
        workflow_state: Dict[str, Any],
        workflow: WorkflowDefinition
    ) -> AgentResult:
        """Execute a single workflow step."""
        # Get the specialist agent
        specialist = self.registry.get_agent(step.agent_type)
        
        if not specialist:
            if step.required:
                return AgentResult.error_result(
                    error=f"Required agent {step.agent_type.value} not registered",
                    error_code="AGENT_NOT_REGISTERED"
                )
            return AgentResult.success_result(
                data={"skipped": True, "reason": "Agent not registered"}
            )
        
        # Prepare payload
        step_payload = {
            **workflow_state["current_payload"],
            "intent": step.intent
        }
        
        # Execute with retry logic
        retries = 0
        last_error = None
        
        while retries <= workflow.max_retries:
            try:
                result = await specialist.execute_with_protection(
                    context, step_payload, timeout=step.timeout
                )
                
                if result.success:
                    return result
                
                last_error = result.error
                
                if workflow.on_step_failure != "retry":
                    break
                    
                retries += 1
                
            except Exception as e:
                last_error = str(e)
                
                if workflow.on_step_failure != "retry":
                    break
                    
                retries += 1
        
        return AgentResult.error_result(
            error=last_error or "Step execution failed",
            error_code="WORKFLOW_STEP_FAILED"
        )
    
    def _determine_workflow_next_actions(
        self, 
        workflow_name: str, 
        workflow_state: Dict[str, Any]
    ) -> List[str]:
        """Determine next actions after workflow completion."""
        next_actions_map = {
            "new_learner_onboarding": ["start_learning", "view_curriculum"],
            "exercise_submission": ["continue_learning", "check_progress"],
            "resource_discovery": ["start_exercise", "explore_resources"],
        }
        
        return next_actions_map.get(workflow_name, ["continue"])
    
    # Public API methods for agent management
    
    def register_agent(self, agent: BaseAgent, priority: int = 0) -> None:
        """
        Register a specialist agent with the orchestrator.
        
        Args:
            agent: The agent to register
            priority: Priority for intent resolution
        """
        self.registry.register(agent, priority)
        self.logger.log_debug(
            f"Registered agent: {agent.agent_type.value}"
        )
    
    def unregister_agent(self, agent_type: AgentType) -> None:
        """Unregister an agent."""
        self.registry.unregister(agent_type)
        self.logger.log_debug(f"Unregistered agent: {agent_type.value}")
    
    def get_registered_agents(self) -> List[AgentType]:
        """Get list of registered agent types."""
        return self.registry.get_registered_types()
    
    def get_available_workflows(self) -> List[str]:
        """Get list of available workflow names."""
        return list(self._workflows.keys())
    
    def get_workflow_info(self, workflow_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific workflow."""
        workflow = self._workflows.get(workflow_name)
        if not workflow:
            return None
        
        return {
            "name": workflow.name,
            "description": workflow.description,
            "steps": [
                {
                    "agent": step.agent_type.value,
                    "intent": step.intent,
                    "required": step.required
                }
                for step in workflow.steps
            ],
            "on_failure": workflow.on_step_failure,
            "max_retries": workflow.max_retries
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get orchestrator health status including all registered agents."""
        base_status = super().get_health_status()
        
        # Add agent registry status
        agent_statuses = {}
        for agent_type in self.registry.get_registered_types():
            agent = self.registry.get_agent(agent_type)
            if agent:
                agent_statuses[agent_type.value] = agent.get_health_status()
        
        base_status["registered_agents"] = agent_statuses
        base_status["available_workflows"] = self.get_available_workflows()
        base_status["active_workflows"] = len(self._active_workflows)
        
        return base_status
    
    async def _handle_timeout_fallback(
        self, 
        context: LearningContext, 
        payload: Dict[str, Any]
    ) -> Optional[AgentResult]:
        """Handle orchestrator timeout with graceful degradation."""
        return AgentResult.success_result(
            data={
                "timeout": True,
                "message": "The request is taking longer than expected. Please try again.",
                "suggestion": "You can check your progress or try a simpler request."
            },
            next_actions=["check_progress", "get_profile"]
        )
