# Design Document: System Integration & End-to-End Setup

## Overview

This design document outlines the architecture and implementation approach for ensuring end-to-end system integration between the frontend, backend, database, and LLM services.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Browser                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3000)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ Onboarding  │  │  Dashboard  │  │  Learning Path      │  │   │
│  │  │ Flow        │  │  & Stats    │  │  Viewer             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  │                         │                                    │   │
│  │              ┌──────────▼──────────┐                        │   │
│  │              │   API Service       │                        │   │
│  │              │   (axios client)    │                        │   │
│  │              └──────────┬──────────┘                        │   │
│  └─────────────────────────┼────────────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Services (Docker)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              FastAPI Backend (Port 8000)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ Orchestrator│  │ Curriculum  │  │  Exercise           │  │   │
│  │  │ Agent       │  │ Planner     │  │  Generator          │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  │         │                │                    │              │   │
│  │         └────────────────┼────────────────────┘              │   │
│  │                          ▼                                   │   │
│  │              ┌──────────────────────┐                       │   │
│  │              │    LLM Service       │                       │   │
│  │              │ (OpenAI/Anthropic)   │                       │   │
│  │              └──────────────────────┘                       │   │
│  └─────────────────────────┬────────────────────────────────────┘   │
│                            │                                        │
│  ┌─────────────────────────▼────────────────────────────────────┐   │
│  │                    Data Layer                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ PostgreSQL  │  │   Redis     │  │     Qdrant          │  │   │
│  │  │ (Port 5432) │  │ (Port 6379) │  │   (Port 6333)       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Frontend API Service

The frontend uses a centralized API service (`frontend/src/services/api.ts`) that:
- Configures axios with base URL from `VITE_API_BASE_URL`
- Adds authentication headers automatically
- Tracks request performance
- Handles errors gracefully with fallback to mock data

**Configuration:**
```typescript
// frontend/.env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 2. Backend API Layer

The backend exposes REST APIs via FastAPI (`src/adapters/api/main.py`):
- Health endpoints: `/health/live`, `/health/ready`
- Goals API: `/api/v1/goals`
- Curriculum API: `/api/v1/curriculum`
- Tasks API: `/api/v1/tasks`
- Submissions API: `/api/v1/submissions`
- Progress API: `/api/v1/progress`

### 3. LLM Service Integration

The LLM service (`src/adapters/services/llm_service.py`) provides:
- Provider abstraction (OpenAI, Anthropic, Mock)
- Automatic provider detection from environment variables
- Graceful fallback to mock responses
- Exercise generation, feedback, and explanations

**Configuration Priority:**
1. `OPENAI_API_KEY` → Use OpenAI
2. `ANTHROPIC_API_KEY` → Use Anthropic
3. Neither → Use Mock mode

### 4. Database Layer

PostgreSQL stores all transactional data:
- User profiles and preferences
- Learning plans and curricula
- Modules and tasks
- Submissions and evaluations
- Progress tracking

### 5. Startup Script

The startup script (`scripts/start-all.sh`) orchestrates:
1. Docker availability check
2. Environment file setup
3. LLM configuration validation
4. Service startup sequence
5. Health check verification

## Data Flow

### Learning Path Generation Flow

```
User selects technology
        │
        ▼
Frontend sends POST /api/v1/curriculum
        │
        ▼
OrchestratorAgent routes to CurriculumPlannerAgent
        │
        ▼
CurriculumPlannerAgent calls LLM Service
        │
        ├─── LLM Available ───► Generate AI-powered curriculum
        │
        └─── LLM Unavailable ─► Use template-based generation
        │
        ▼
Save curriculum to PostgreSQL
        │
        ▼
Return learning path to frontend
```

### User Data Persistence Flow

```
User completes onboarding
        │
        ▼
Frontend sends POST /api/v1/goals
        │
        ▼
ProfileAgent creates/updates user profile
        │
        ▼
PostgresUserRepository saves to database
        │
        ▼
User returns later
        │
        ▼
Frontend sends GET /api/v1/progress
        │
        ▼
ProgressTracker retrieves from database
        │
        ▼
Return persisted progress to frontend
```

## Error Handling Strategy

### Frontend Fallback Chain

1. **API Available**: Use real backend data
2. **API Timeout**: Retry with exponential backoff
3. **API Error**: Show error message, offer retry
4. **API Unavailable**: Fall back to mock data with indicator

### Backend Fallback Chain

1. **LLM Available**: Use AI-generated content
2. **LLM Timeout**: Use cached responses if available
3. **LLM Error**: Fall back to template-based generation
4. **Database Error**: Return error with retry guidance

## Security Considerations

- API keys stored in environment variables, never in code
- CORS configured for frontend origin only
- Database credentials isolated in Docker network
- Code execution sandboxed in separate container

## Testing Strategy

- Unit tests for individual components
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Health check tests for service availability
