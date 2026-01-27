# Design Document: LLM Configuration Audit

## Overview

This document describes the architecture for LLM integration in the Agentic Learning Coach, ensuring dynamic AI-powered content generation instead of static content serving.

## Architecture

### LLM Service Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  - No LLM keys needed                                           │
│  - Calls backend API endpoints                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (FastAPI)                        │
│  - /api/v1/curriculum                                           │
│  - /api/v1/exercises                                            │
│  - /api/v1/content/generate                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Layer                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ CurriculumPlanner│  │ExerciseGenerator│  │   Reviewer      │ │
│  │     Agent       │  │     Agent       │  │    Agent        │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      LLM Service                            ││
│  │  - Provider abstraction (OpenAI/Anthropic)                  ││
│  │  - Graceful fallback to templates                           ││
│  │  - Token usage tracking                                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  OpenAI  │   │Anthropic │   │   Mock   │
        │   API    │   │   API    │   │ Fallback │
        └──────────┘   └──────────┘   └──────────┘
```

## Components

### 1. LLMService (`src/adapters/services/llm_service.py`)

The core service that handles all LLM interactions:

```python
class LLMService:
    """
    Provider-agnostic LLM service with automatic fallback.
    
    Configuration priority:
    1. OPENAI_API_KEY → Use OpenAI
    2. ANTHROPIC_API_KEY → Use Anthropic  
    3. Neither → Use Mock (template fallback)
    """
    
    async def generate(self, prompt: str, system_prompt: str = None) -> LLMResponse:
        """Generate content from prompt with automatic provider selection."""
        
    async def generate_exercise(self, topic: str, difficulty: str, language: str) -> Dict:
        """Generate a coding exercise with test cases and hints."""
        
    async def generate_feedback(self, code: str, test_results: List, context: Dict) -> Dict:
        """Generate personalized feedback for code submission."""
        
    async def explain_concept(self, concept: str, skill_level: str) -> str:
        """Explain a programming concept at appropriate level."""
```

### 2. CurriculumPlannerAgent LLM Integration

The curriculum planner uses LLM for personalized path generation:

```python
async def _generate_curriculum_with_llm(self, goals, skill_level, time_constraints, preferences, domain):
    """
    Generate personalized curriculum using LLM.
    
    Returns None if LLM fails, triggering template fallback.
    """
    system_prompt = """You are an expert curriculum designer..."""
    
    prompt = f"""Create a personalized learning curriculum for:
    Goals: {goals}
    Skill Level: {skill_level}
    Available Time: {time_constraints}
    ..."""
    
    response = await self.llm_service.generate(prompt, system_prompt)
    
    if response.success:
        return self._parse_and_validate_curriculum(response.content)
    return None  # Triggers template fallback
```

### 3. ExerciseGeneratorAgent LLM Integration

Exercises are dynamically generated based on learner context:

```python
async def generate_exercise(self, topic: str, difficulty: str, language: str) -> Dict:
    """
    Generate exercise using LLM with template fallback.
    
    LLM generates:
    - Contextual problem description
    - Relevant test cases
    - Progressive hints
    - Solution template
    """
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | No* | None | OpenAI API key |
| `OPENAI_MODEL` | No | gpt-4o-mini | OpenAI model to use |
| `ANTHROPIC_API_KEY` | No* | None | Anthropic API key |
| `ANTHROPIC_MODEL` | No | claude-3-haiku-20240307 | Anthropic model |
| `LLM_MAX_TOKENS` | No | 2000 | Max tokens per request |
| `LLM_TEMPERATURE` | No | 0.7 | Generation temperature |

*At least one API key recommended for full AI features

### Provider Selection Logic

```python
def _get_default_config(self) -> LLMConfig:
    if os.getenv("OPENAI_API_KEY"):
        return LLMConfig(provider=LLMProvider.OPENAI, ...)
    elif os.getenv("ANTHROPIC_API_KEY"):
        return LLMConfig(provider=LLMProvider.ANTHROPIC, ...)
    else:
        return LLMConfig(provider=LLMProvider.MOCK, ...)  # Template fallback
```

## Fallback Strategy

### Graceful Degradation

1. **LLM Available**: Full AI-powered content generation
2. **LLM Timeout/Error**: Retry once, then fallback
3. **No API Key**: Use intelligent template-based generation

### Template Fallbacks

When LLM is unavailable, the system uses:

- **Curriculum**: Pre-defined learning path templates by domain/skill level
- **Exercises**: Template exercises with parameterized content
- **Feedback**: Basic test result analysis without AI insights
- **Explanations**: Cached concept explanations

## Monitoring

### Logging

```python
logger.info(f"Using LLM-generated curriculum for {domain}")
logger.info(f"Using template-based curriculum for {domain}")
logger.warning(f"LLM curriculum generation failed: {error}")
```

### Metrics to Track

- LLM API call count
- Token usage per request
- Success/failure rates
- Fallback trigger frequency
- Response latency

## Security Considerations

1. **API Key Storage**: Keys stored in environment variables, never in code
2. **Key Validation**: Keys validated on service initialization
3. **Rate Limiting**: Implement rate limits to prevent abuse
4. **Content Filtering**: LLM responses validated before use
5. **No Frontend Keys**: Frontend never has direct LLM access
