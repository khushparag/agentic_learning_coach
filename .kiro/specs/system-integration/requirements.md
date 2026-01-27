# Requirements Document: System Integration & End-to-End Setup

## Introduction

This spec defines the requirements for ensuring the Agentic Learning Coach system works end-to-end with proper frontend-backend connectivity, database persistence, and dynamic LLM-powered learning path generation for any technology.

## Glossary

- **Frontend**: React/TypeScript web application for user interaction
- **Backend**: FastAPI Python service providing REST APIs
- **LLM Service**: AI service (OpenAI/Anthropic) for dynamic content generation
- **Mock Mode**: Fallback mode when LLM APIs are unavailable
- **Learning Path**: Personalized curriculum generated based on selected technology

## Requirements

### Requirement 1: Frontend-Backend Connectivity

**User Story:** As a developer, I want the frontend to properly connect to the backend API, so that user interactions result in real data operations.

#### Acceptance Criteria

1. WHEN the frontend starts, IT SHALL attempt to connect to the backend at the configured `VITE_API_BASE_URL`
2. WHEN the backend is unavailable, THE frontend SHALL gracefully fallback to mock data with a visible indicator
3. WHEN the backend becomes available, THE frontend SHALL automatically reconnect and use real API data
4. THE frontend SHALL display connection status to inform users of system state
5. THE API service SHALL include proper error handling for network failures

### Requirement 2: Database Persistence

**User Story:** As a learner, I want my profile, progress, and learning data to be saved in the database, so that my learning journey persists across sessions.

#### Acceptance Criteria

1. WHEN a user completes onboarding, THE system SHALL save their profile to PostgreSQL
2. WHEN a user selects technologies, THE system SHALL persist their preferences in the database
3. WHEN a user completes exercises, THE system SHALL record submissions and evaluations
4. WHEN a user returns to the application, THE system SHALL restore their progress from the database
5. THE system SHALL use proper database transactions to ensure data consistency

### Requirement 3: Dynamic Learning Path Generation

**User Story:** As a learner, I want to select any technology and have a personalized learning path generated using AI, so that I can learn any programming topic with a structured curriculum.

#### Acceptance Criteria

1. WHEN a user selects a technology (e.g., "Rust", "Go", "Kubernetes"), THE CurriculumPlannerAgent SHALL generate a relevant learning path
2. WHEN LLM services are available, THE system SHALL use AI to generate contextually appropriate modules and exercises
3. WHEN LLM services are unavailable, THE system SHALL fallback to template-based generation with reasonable defaults
4. THE generated learning path SHALL include progressive difficulty and spaced repetition
5. THE system SHALL support any technology, not just pre-defined templates

### Requirement 4: LLM Configuration and Setup

**User Story:** As a developer, I want clear instructions for configuring LLM services, so that I can enable AI-powered features.

#### Acceptance Criteria

1. THE system SHALL provide clear documentation for configuring OpenAI API keys
2. THE system SHALL provide clear documentation for configuring Anthropic API keys
3. WHEN no API key is configured, THE system SHALL operate in mock mode with rule-based responses
4. THE system SHALL validate API keys on startup and report configuration status
5. THE LLM service SHALL support switching providers without code changes

### Requirement 5: One-Command Startup

**User Story:** As a developer, I want to start the entire system with a single command, so that I can quickly get the application running.

#### Acceptance Criteria

1. THE system SHALL provide a startup script that launches all required services
2. THE startup script SHALL check for Docker availability before starting
3. THE startup script SHALL create `.env` from `.env.example` if not present
4. THE startup script SHALL wait for services to be healthy before reporting success
5. THE startup script SHALL provide clear status messages and service URLs

### Requirement 6: Health Monitoring

**User Story:** As a developer, I want to easily check the health of all system components, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. THE system SHALL provide health check endpoints for all services
2. THE startup script SHALL include a `--status` option to check all services
3. THE health checks SHALL report database connectivity status
4. THE health checks SHALL report LLM service configuration status
5. THE frontend SHALL display backend health status to users

## Dependencies

- Docker and Docker Compose for containerized services
- PostgreSQL for data persistence
- Redis for caching (optional)
- Qdrant for vector search (optional)
- OpenAI or Anthropic API key for AI features (optional, falls back to mock)

## Success Metrics

- Frontend successfully connects to backend API
- User data persists across browser sessions
- Learning paths generate for any technology selection
- System starts with single command in under 60 seconds
- Health checks accurately report system status
