"""
LLM Service for AI-powered content generation.

This service provides integration with LLM providers (OpenAI, Anthropic)
for generating exercises, feedback, and educational content.
"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

import httpx

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    MOCK = "mock"  # For testing


@dataclass
class LLMConfig:
    """Configuration for LLM service."""
    provider: LLMProvider
    api_key: Optional[str] = None
    model: str = "gpt-4o-mini"
    max_tokens: int = 2000
    temperature: float = 0.7
    timeout: int = 30


@dataclass
class LLMResponse:
    """Response from LLM service."""
    success: bool
    content: str
    usage: Optional[Dict[str, int]] = None
    error: Optional[str] = None
    model: Optional[str] = None


class ILLMService(ABC):
    """Interface for LLM service."""
    
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> LLMResponse:
        """Generate content from a prompt."""
        pass
    
    @abstractmethod
    async def generate_exercise(self, topic: str, difficulty: str, language: str) -> Dict[str, Any]:
        """Generate a coding exercise."""
        pass
    
    @abstractmethod
    async def generate_feedback(self, code: str, test_results: List[Dict], context: Dict) -> Dict[str, Any]:
        """Generate feedback for code submission."""
        pass
    
    @abstractmethod
    async def explain_concept(self, concept: str, skill_level: str) -> str:
        """Explain a programming concept."""
        pass


class LLMService(ILLMService):
    """
    LLM Service implementation supporting multiple providers.
    
    Provides AI-powered content generation for:
    - Exercise generation with test cases
    - Code review and feedback
    - Concept explanations
    - Hint generation
    """
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or self._get_default_config()
        self._client: Optional[httpx.AsyncClient] = None
        
    def _get_default_config(self) -> LLMConfig:
        """Get default configuration from environment."""
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        
        if os.getenv("OPENAI_API_KEY"):
            provider = LLMProvider.OPENAI
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        elif os.getenv("ANTHROPIC_API_KEY"):
            provider = LLMProvider.ANTHROPIC
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        else:
            provider = LLMProvider.MOCK
            model = "mock"
            
        return LLMConfig(
            provider=provider,
            api_key=api_key,
            model=model,
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "2000")),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7"))
        )
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.config.timeout)
        return self._client
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> LLMResponse:
        """Generate content from a prompt."""
        if self.config.provider == LLMProvider.MOCK:
            return await self._mock_generate(prompt, system_prompt)
        elif self.config.provider == LLMProvider.OPENAI:
            return await self._openai_generate(prompt, system_prompt)
        elif self.config.provider == LLMProvider.ANTHROPIC:
            return await self._anthropic_generate(prompt, system_prompt)
        else:
            return LLMResponse(
                success=False,
                content="",
                error=f"Unsupported provider: {self.config.provider}"
            )
    
    async def _openai_generate(self, prompt: str, system_prompt: Optional[str] = None) -> LLMResponse:
        """Generate using OpenAI API."""
        try:
            client = await self._get_client()
            
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.config.model,
                    "messages": messages,
                    "max_tokens": self.config.max_tokens,
                    "temperature": self.config.temperature
                }
            )
            
            if response.status_code != 200:
                return LLMResponse(
                    success=False,
                    content="",
                    error=f"OpenAI API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            return LLMResponse(
                success=True,
                content=content,
                usage=data.get("usage"),
                model=self.config.model
            )
            
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return LLMResponse(success=False, content="", error=str(e))
    
    async def _anthropic_generate(self, prompt: str, system_prompt: Optional[str] = None) -> LLMResponse:
        """Generate using Anthropic API."""
        try:
            client = await self._get_client()
            
            request_body = {
                "model": self.config.model,
                "max_tokens": self.config.max_tokens,
                "messages": [{"role": "user", "content": prompt}]
            }
            
            if system_prompt:
                request_body["system"] = system_prompt
            
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.config.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json=request_body
            )
            
            if response.status_code != 200:
                return LLMResponse(
                    success=False,
                    content="",
                    error=f"Anthropic API error: {response.status_code}"
                )
            
            data = response.json()
            content = data["content"][0]["text"]
            
            return LLMResponse(
                success=True,
                content=content,
                usage={"input_tokens": data.get("usage", {}).get("input_tokens", 0),
                       "output_tokens": data.get("usage", {}).get("output_tokens", 0)},
                model=self.config.model
            )
            
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            return LLMResponse(success=False, content="", error=str(e))
    
    async def _mock_generate(self, prompt: str, system_prompt: Optional[str] = None) -> LLMResponse:
        """Mock generation for testing without API keys."""
        # Return intelligent mock responses based on prompt content
        if "exercise" in prompt.lower():
            content = self._mock_exercise_response(prompt)
        elif "feedback" in prompt.lower():
            content = self._mock_feedback_response(prompt)
        elif "explain" in prompt.lower():
            content = self._mock_explanation_response(prompt)
        else:
            content = "This is a mock LLM response. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY for real AI generation."
        
        return LLMResponse(
            success=True,
            content=content,
            model="mock"
        )
    
    def _mock_exercise_response(self, prompt: str) -> str:
        """Generate mock exercise response."""
        return json.dumps({
            "title": "Practice Exercise",
            "description": "A practice exercise generated by the learning coach.",
            "instructions": "Complete the following coding challenge.",
            "starter_code": "# Write your solution here\ndef solution():\n    pass",
            "test_cases": [
                {"name": "test_basic", "input": "", "expected_output": "success"}
            ],
            "hints": [
                "Think about the problem step by step",
                "Consider edge cases"
            ]
        }, indent=2)
    
    def _mock_feedback_response(self, prompt: str) -> str:
        """Generate mock feedback response."""
        return json.dumps({
            "summary": "Good attempt! Here's some feedback to help you improve.",
            "strengths": ["Clear code structure", "Good variable naming"],
            "areas_for_improvement": [
                {"issue": "Consider adding error handling", "suggestion": "Use try-except blocks"}
            ],
            "next_steps": ["Practice more exercises on this topic"]
        }, indent=2)
    
    def _mock_explanation_response(self, prompt: str) -> str:
        """Generate mock explanation response."""
        return "This concept is fundamental to programming. It involves understanding how data flows through your code and how different components interact with each other."
    
    async def generate_exercise(self, topic: str, difficulty: str, language: str) -> Dict[str, Any]:
        """Generate a coding exercise using LLM."""
        system_prompt = """You are an expert programming instructor creating coding exercises.
Generate exercises that are:
- Clear and well-structured
- Appropriate for the specified difficulty level
- Include test cases and hints
- Focus on practical, real-world scenarios

Return your response as valid JSON with the following structure:
{
    "title": "Exercise title",
    "description": "Brief description",
    "instructions": "Detailed instructions",
    "starter_code": "Code template",
    "test_cases": [{"name": "test_name", "input": "input", "expected_output": "output"}],
    "hints": ["hint1", "hint2"],
    "solution": "Complete solution code"
}"""
        
        prompt = f"""Create a {difficulty} level coding exercise about {topic} in {language}.

The exercise should:
1. Be appropriate for a {difficulty} learner
2. Include 3-5 test cases
3. Provide 2-3 progressive hints
4. Have clear success criteria

Topic: {topic}
Difficulty: {difficulty}
Language: {language}"""
        
        response = await self.generate(prompt, system_prompt)
        
        if response.success:
            try:
                # Try to parse JSON from response
                content = response.content
                # Handle markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return json.loads(content.strip())
            except json.JSONDecodeError:
                # Return structured response even if JSON parsing fails
                return {
                    "title": f"{topic.title()} Exercise",
                    "description": response.content[:200],
                    "instructions": response.content,
                    "starter_code": f"# {topic} exercise\n",
                    "test_cases": [],
                    "hints": [],
                    "llm_generated": True
                }
        else:
            return {
                "error": response.error,
                "fallback": True
            }
    
    async def generate_feedback(self, code: str, test_results: List[Dict], context: Dict) -> Dict[str, Any]:
        """Generate feedback for code submission using LLM."""
        system_prompt = """You are a supportive programming mentor providing feedback on code submissions.
Your feedback should be:
- Encouraging and constructive
- Specific with line numbers when relevant
- Include actionable suggestions
- Appropriate for the learner's skill level

Return your response as valid JSON with the following structure:
{
    "summary": "Brief overall assessment",
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": [
        {"issue": "description", "line": null, "suggestion": "how to fix"}
    ],
    "next_steps": ["recommendation1", "recommendation2"],
    "encouragement": "Motivational message"
}"""
        
        test_summary = f"Tests passed: {sum(1 for t in test_results if t.get('passed', False))}/{len(test_results)}"
        
        prompt = f"""Review this code submission and provide educational feedback.

Code:
```
{code[:2000]}  # Truncate for token limits
```

Test Results: {test_summary}
Skill Level: {context.get('skill_level', 'intermediate')}
Topic: {context.get('topic', 'general programming')}

Provide constructive feedback that helps the learner improve."""
        
        response = await self.generate(prompt, system_prompt)
        
        if response.success:
            try:
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return json.loads(content.strip())
            except json.JSONDecodeError:
                return {
                    "summary": response.content[:500],
                    "strengths": [],
                    "areas_for_improvement": [],
                    "next_steps": [],
                    "llm_generated": True
                }
        else:
            return {"error": response.error, "fallback": True}
    
    async def explain_concept(self, concept: str, skill_level: str) -> str:
        """Explain a programming concept using LLM."""
        system_prompt = f"""You are an expert programming instructor explaining concepts to {skill_level} learners.
Your explanations should be:
- Clear and concise
- Use appropriate analogies
- Include simple code examples
- Build on foundational knowledge"""
        
        prompt = f"""Explain the concept of "{concept}" to a {skill_level} programmer.

Include:
1. A simple definition
2. Why it's important
3. A practical code example
4. Common mistakes to avoid"""
        
        response = await self.generate(prompt, system_prompt)
        return response.content if response.success else f"Unable to generate explanation: {response.error}"
    
    async def generate_hints(self, exercise: Dict, attempt_count: int) -> List[str]:
        """Generate progressive hints for an exercise."""
        system_prompt = """You are a helpful programming tutor providing hints.
Generate hints that guide without giving away the solution.
Each hint should be more specific than the previous one."""
        
        prompt = f"""Generate {min(attempt_count + 1, 3)} hints for this exercise:

Title: {exercise.get('title', 'Exercise')}
Description: {exercise.get('description', '')}
Current attempt: {attempt_count}

Provide hints that progressively guide the learner toward the solution."""
        
        response = await self.generate(prompt, system_prompt)
        
        if response.success:
            # Parse hints from response
            hints = []
            for line in response.content.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    # Clean up the hint
                    hint = line.lstrip('0123456789.-•) ').strip()
                    if hint:
                        hints.append(hint)
            return hints[:3] if hints else [response.content]
        else:
            return ["Think about the problem step by step"]
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Factory function for creating LLM service
def create_llm_service(config: Optional[LLMConfig] = None) -> LLMService:
    """Create an LLM service instance."""
    return LLMService(config)
