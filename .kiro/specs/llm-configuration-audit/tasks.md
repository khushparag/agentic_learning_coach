# Implementation Tasks: LLM Configuration Audit

## Overview

This task list ensures the Agentic Learning Coach properly uses LLM services for dynamic content generation.

## Tasks

- [x] 1. Audit existing LLM integration
  - [x] 1.1 Review LLMService implementation
    - Verified: `src/adapters/services/llm_service.py` implements OpenAI/Anthropic support
    - Verified: Mock fallback exists when no API key configured
    - _Requirements: 1.2, 1.3_

  - [x] 1.2 Review CurriculumPlannerAgent LLM integration
    - Verified: `src/agents/curriculum_planner_agent.py` has `_generate_curriculum_with_llm()` method
    - Verified: Falls back to `_design_curriculum_from_templates()` when LLM fails
    - _Requirements: 2.1, 2.3_

  - [x] 1.3 Review ExerciseGeneratorAgent LLM integration
    - Verified: `src/agents/exercise_generator_agent.py` uses LLMService
    - Verified: Template fallback exists
    - _Requirements: 3.1, 3.3_

  - [x] 1.4 Review ContentGeneratorService
    - Verified: `src/adapters/services/content_generator_service.py` uses LLM for lessons
    - _Requirements: 5.1_

- [x] 2. Update environment configuration
  - [x] 2.1 Update `.env.example` with clear LLM documentation
    - Added comprehensive LLM configuration section
    - Documented both OpenAI and Anthropic options
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Update root `.env` with LLM configuration section
    - Added commented LLM configuration section
    - User needs to uncomment and add actual API key
    - _Requirements: 1.1_

- [ ] 3. User action required: Configure LLM API key
  - [ ] 3.1 Add OpenAI or Anthropic API key to `.env`
    - Edit `.env` file in project root
    - Uncomment and set `OPENAI_API_KEY=sk-your-key-here`
    - Or set `ANTHROPIC_API_KEY=your-key-here`
    - _Requirements: 1.1_

  - [ ] 3.2 Restart backend service
    - Run: `docker-compose restart coach`
    - Or restart local Python backend
    - _Requirements: 1.4_

  - [ ] 3.3 Verify LLM is working
    - Check backend logs for "Using LLM-generated" messages
    - Test curriculum generation endpoint
    - _Requirements: 1.4, 2.4_

- [x] 4. Document LLM configuration
  - [x] 4.1 Create this spec with requirements and design
    - Documents LLM architecture and configuration
    - _Requirements: 1.1_

  - [x] 4.2 Verify frontend doesn't need LLM keys
    - Confirmed: `frontend/.env` only has `VITE_API_BASE_URL`
    - Frontend calls backend API, no direct LLM access
    - _Requirements: 1.5_

## Current Status

### ✅ Code Implementation Complete
- LLMService with provider abstraction
- CurriculumPlannerAgent LLM integration
- ExerciseGeneratorAgent LLM integration
- ContentGeneratorService LLM integration
- Graceful fallback mechanisms

### ⚠️ Configuration Required
The root `.env` file has LLM configuration commented out. To enable AI-powered features:

1. **Edit `.env`** in project root:
   ```bash
   # Uncomment and add your key:
   OPENAI_API_KEY=sk-your-actual-openai-key
   OPENAI_MODEL=gpt-4o-mini
   ```

2. **Restart backend**:
   ```bash
   docker-compose restart coach
   ```

3. **Verify** by checking logs for "Using LLM-generated" messages

### Frontend Configuration
The frontend does NOT need any LLM configuration. It calls the backend API which handles all LLM interactions.

## Notes

- Without an API key, the system uses intelligent template-based fallbacks
- The mock provider returns reasonable responses for testing
- LLM integration is optional but recommended for full AI-powered experience
- Token usage is logged for cost monitoring
