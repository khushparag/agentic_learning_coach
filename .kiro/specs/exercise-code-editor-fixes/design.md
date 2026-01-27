# Design: Exercise Code Editor Bug Fixes

## Overview

This design document outlines the technical approach to fix the exercise code editor issues where problem statements are missing and code execution doesn't work.

## Architecture

### Current State (Broken)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Exercises.tsx │ ──X─│   Backend API   │ ──X─│ Runner Service  │
│   (Mock Data)   │     │  (No endpoint)  │     │   (Port 8001)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Target State (Fixed)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Exercises.tsx │ ───►│   Backend API   │ ───►│ Runner Service  │
│ (Real API calls)│     │ /api/v1/code/*  │     │   (Port 8001)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────►│ /api/v1/submit  │
                        │   (Existing)    │
                        └─────────────────┘
```

## Component Design

### 1. Code Execution Router (Backend)

**File**: `src/adapters/api/routers/code_execution.py`

```python
# New router for code execution
router = APIRouter(prefix="/api/v1/code", tags=["code-execution"])

# Endpoints:
# POST /execute - Execute code in sandbox
# GET /languages - Get supported languages
```

**Request/Response Models**:

```python
class ExecuteCodeRequest(BaseModel):
    code: str
    language: str
    test_cases: Optional[List[TestCase]] = []
    timeout: Optional[int] = 10
    memory_limit: Optional[int] = 256

class ExecuteCodeResponse(BaseModel):
    success: bool
    output: str
    errors: List[str]
    execution_time_ms: float
    memory_used_mb: float
    test_results: Optional[List[TestResultResponse]]
```

### 2. Exercise Conversion (Frontend)

**File**: `frontend/src/pages/exercises/Exercises.tsx`

**convertTaskToExercise function**:
- Input: `LearningTask` from learning path
- Output: `Exercise` with complete instructions

```typescript
const convertTaskToExercise = (task: LearningTask): Exercise => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    instructions: {
      overview: generateOverview(task),
      requirements: task.requirements,
      examples: generateExamples(task),
      starter_code: generateStarterCode(task)
    },
    test_cases: generateTestCases(task),
    hints: generateHints(task),
    // ... other fields
  }
}
```

### 3. API Integration (Frontend)

**handleSubmit function**:
```typescript
const handleSubmit = async (files: Record<string, string>): Promise<Evaluation> => {
  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/v1/submissions`, {
      method: 'POST',
      body: JSON.stringify({ task_id, code, language, files })
    })
    
    if (response.ok) {
      return transformBackendResponse(await response.json())
    }
  } catch (error) {
    console.warn('Backend unavailable, using fallback')
  }
  
  // Fallback to local evaluation
  return localEvaluation(files)
}
```

**handleTest function**:
```typescript
const handleTest = async (files: Record<string, string>): Promise<CodeExecutionResult> => {
  try {
    // Try backend API first
    const response = await fetch(`${API_URL}/api/v1/code/execute`, {
      method: 'POST',
      body: JSON.stringify({ code, language })
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Backend unavailable, using fallback')
  }
  
  // Fallback to local syntax validation
  return localSyntaxValidation(files)
}
```

## Data Flow

### Code Execution Flow

```
1. User clicks "Test Code"
2. Frontend collects code from all files
3. POST /api/v1/code/execute with code and language
4. Backend proxies to runner service at CODE_RUNNER_URL
5. Runner service executes code in sandbox
6. Results returned through chain
7. Frontend displays output, errors, test results
```

### Submission Flow

```
1. User clicks "Submit Solution"
2. Frontend collects code from all files
3. POST /api/v1/submissions with task_id, code, language
4. Backend evaluates submission (may use runner service)
5. Evaluation results returned
6. Frontend displays score, feedback, suggestions
7. Progress updated in learning path
```

## Error Handling

### Backend Unavailable
- Frontend detects connection error
- Falls back to local validation/evaluation
- Shows warning that full execution unavailable
- Allows user to continue working

### Runner Service Unavailable
- Backend detects connection error to runner
- Returns fallback response with syntax validation
- Logs warning for monitoring
- Returns partial results to frontend

### Timeout/Memory Exceeded
- Runner service enforces limits
- Returns appropriate error message
- Frontend displays user-friendly error
- Suggests code optimization

## Security Considerations

### Code Execution
- All code runs in sandboxed environment
- Resource limits enforced (timeout, memory)
- Dangerous patterns blocked by security validator
- No network access from sandbox

### API Security
- CORS configured for frontend origin
- Rate limiting on execution endpoints
- Input validation on all requests
- No PII in logs

## Configuration

### Environment Variables

**Backend**:
```
CODE_RUNNER_URL=http://localhost:8001
```

**Frontend**:
```
VITE_API_URL=http://localhost:8000
```

### Docker Compose Integration

```yaml
services:
  api:
    environment:
      - CODE_RUNNER_URL=http://runner:8001
  
  runner:
    ports:
      - "8001:8001"
  
  frontend:
    environment:
      - VITE_API_URL=http://api:8000
```

## Testing Strategy

### Unit Tests
- Mock httpx for backend tests
- Mock fetch for frontend tests
- Test all error scenarios
- Test response transformations

### Integration Tests
- Test with real runner service
- Test fallback behavior
- Test concurrent requests
- Test timeout handling

### E2E Tests
- Complete exercise workflow
- Error recovery scenarios
- Performance under load

## Implementation Order

1. **Backend**: Create code_execution.py router
2. **Backend**: Register router in main.py
3. **Frontend**: Update handleTest to call API
4. **Frontend**: Update handleSubmit to call API
5. **Frontend**: Improve convertTaskToExercise
6. **Testing**: Add integration tests
7. **Documentation**: Update API reference

## Rollback Plan

If issues arise:
1. Frontend can fall back to local evaluation
2. Backend can disable runner proxy
3. Previous mock behavior preserved as fallback
4. No data loss possible (stateless operations)
