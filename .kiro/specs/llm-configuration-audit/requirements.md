# Requirements Document: LLM Configuration Audit

## Introduction

This spec ensures the Agentic Learning Coach properly uses LLM/AI services for dynamic content generation instead of serving static content. The system should leverage AI for curriculum generation, exercise creation, feedback, and explanations while maintaining graceful fallbacks when LLM services are unavailable.

## Glossary

- **LLM Service**: The core service that interfaces with AI providers (OpenAI/Anthropic) for content generation
- **Template Fallback**: Pre-defined templates used when LLM services are unavailable
- **Dynamic Content**: AI-generated content personalized to the learner's context
- **Static Content**: Pre-defined, non-personalized content templates

## Requirements

### Requirement 1: LLM Service Configuration

**User Story:** As a system administrator, I want clear documentation and configuration for LLM API keys, so that the system can use AI-powered features.

#### Acceptance Criteria

1. THE system SHALL document required environment variables for LLM configuration in `.env.example`
2. THE system SHALL support both OpenAI and Anthropic as LLM providers
3. WHEN no LLM API key is configured, THE system SHALL log a warning and use template fallbacks
4. THE system SHALL validate LLM API keys on startup and report configuration status
5. THE frontend SHALL NOT require LLM API keys (backend handles all LLM calls)

### Requirement 2: Curriculum Generation with LLM

**User Story:** As a learner, I want my curriculum to be dynamically generated based on my specific goals and context, not from static templates.

#### Acceptance Criteria

1. WHEN LLM is available, THE CurriculumPlannerAgent SHALL use LLM to generate personalized curricula
2. THE LLM-generated curriculum SHALL include specific learning objectives tailored to the learner's goals
3. WHEN LLM fails, THE system SHALL gracefully fallback to template-based curriculum generation
4. THE system SHALL log whether curriculum was LLM-generated or template-based

### Requirement 3: Exercise Generation with LLM

**User Story:** As a learner, I want exercises that are dynamically generated and relevant to my current learning context.

#### Acceptance Criteria

1. WHEN LLM is available, THE ExerciseGeneratorAgent SHALL use LLM to create contextual exercises
2. THE LLM-generated exercises SHALL include relevant test cases and hints
3. WHEN LLM fails, THE system SHALL use pre-defined exercise templates as fallback
4. THE system SHALL track exercise generation source (LLM vs template) for analytics

### Requirement 4: Feedback Generation with LLM

**User Story:** As a learner, I want personalized, contextual feedback on my code submissions.

#### Acceptance Criteria

1. WHEN LLM is available, THE ReviewerAgent SHALL use LLM to generate detailed feedback
2. THE feedback SHALL be specific to the learner's code and skill level
3. WHEN LLM fails, THE system SHALL provide basic test result feedback
4. THE system SHALL include actionable suggestions in LLM-generated feedback

### Requirement 5: Concept Explanations with LLM

**User Story:** As a learner, I want explanations of programming concepts that are adapted to my skill level.

#### Acceptance Criteria

1. WHEN LLM is available, THE system SHALL generate skill-level-appropriate explanations
2. THE explanations SHALL include relevant code examples
3. WHEN LLM fails, THE system SHALL serve cached or template explanations
4. THE system SHALL support multiple programming languages for explanations

### Requirement 6: LLM Usage Monitoring

**User Story:** As a system administrator, I want to monitor LLM usage and costs.

#### Acceptance Criteria

1. THE system SHALL log all LLM API calls with token usage
2. THE system SHALL track LLM success/failure rates
3. THE system SHALL provide metrics on LLM vs fallback usage
4. THE system SHALL support rate limiting for LLM calls

## Current Status

Based on code audit:

### Implemented ✅
- LLMService with OpenAI/Anthropic support (`src/adapters/services/llm_service.py`)
- Mock fallback when no API key configured
- CurriculumPlannerAgent LLM integration (`src/agents/curriculum_planner_agent.py`)
- ExerciseGeneratorAgent LLM integration (`src/agents/exercise_generator_agent.py`)
- ContentGeneratorService for lesson generation (`src/adapters/services/content_generator_service.py`)

### Configuration Required ⚠️
- `.env` file needs actual LLM API key (currently commented out)
- Backend server restart required after adding API key

## Configuration Instructions

To enable LLM-powered features:

1. Edit the root `.env` file and add your API key:
   ```
   # For OpenAI (recommended):
   OPENAI_API_KEY=sk-your-actual-key-here
   OPENAI_MODEL=gpt-4o-mini
   
   # OR for Anthropic:
   ANTHROPIC_API_KEY=your-anthropic-key-here
   ANTHROPIC_MODEL=claude-3-haiku-20240307
   ```

2. Restart the backend service:
   ```bash
   docker-compose restart coach
   ```
   Or if running locally, restart the Python backend.

3. The frontend does NOT need any LLM configuration - it calls the backend API.
