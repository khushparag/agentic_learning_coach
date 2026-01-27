# Design Document: Learning Path Navigation Fixes

## Overview

This design addresses two critical issues in the learning path interface:
1. A 404 error when clicking the start button on tasks
2. Unexpected redirects when scrolling in the learning path view

The root cause is that the frontend calls non-existent backend endpoints (`/api/v1/tasks/{taskId}/start` and `/api/v1/tasks/{taskId}/complete`), and the error handling causes navigation issues.

## Architecture

### Component Interaction

```
┌─────────────────┐
│  LearningPath   │
│     Page        │
└────────┬────────┘
         │
         ├──> useLearningPath Hook
         │    └──> learningPathService
         │         └──> API Calls
         │              ├──> /api/v1/tasks/{id}/start (404)
         │              └──> /api/v1/tasks/{id}/complete (404)
         │
         └──> navigate('/exercises/{taskId}')
              └──> Exercises Page (may not exist)
```

### Data Flow

1. User clicks "Start" button on a task
2. `handleTaskStart` calls `startTask(taskId)`
3. `startTask` makes POST to `/api/v1/tasks/{taskId}/start` → **404 Error**
4. Error is caught, but navigation still attempts
5. Navigation may fail or redirect incorrectly

## Components and Interfaces

### Backend API Endpoints (New)

#### POST /api/v1/tasks/{task_id}/start

```python
@router.post(
    "/{task_id}/start",
    response_model=TaskStartResponse,
    summary="Start a task",
    description="Mark a task as started and record the start timestamp"
)
async def start_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskStartResponse
```

**Response Model:**
```python
class TaskStartResponse(BaseModel):
    task_id: str
    started_at: datetime
    status: str  # "in_progress"
    message: str
```

#### POST /api/v1/tasks/{task_id}/complete

```python
@router.post(
    "/{task_id}/complete",
    response_model=TaskCompleteResponse,
    summary="Complete a task",
    description="Mark a task as completed and record the completion timestamp"
)
async def complete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> TaskCompleteResponse
```

**Response Model:**
```python
class TaskCompleteResponse(BaseModel):
    task_id: str
    completed_at: datetime
    status: str  # "completed"
    next_task_id: Optional[str]
    message: str
```

### Frontend Service Updates

#### learningPathService.ts

Update the `startTask` and `completeTask` methods to handle errors gracefully:

```typescript
async startTask(taskId: string): Promise<void> {
  try {
    await api.post(`/api/v1/tasks/${taskId}/start`)
  } catch (error) {
    // Log but don't throw - allow navigation to proceed
    console.warn('Failed to start task via API:', error)
    // In demo mode or when endpoint is missing, continue anyway
  }
}

async completeTask(taskId: string): Promise<void> {
  try {
    await api.post(`/api/v1/tasks/${taskId}/complete`)
  } catch (error) {
    console.warn('Failed to complete task via API:', error)
    // Continue with local state update
  }
}
```

### Frontend Navigation Fixes

#### LearningPath.tsx

Fix the `handleTaskStart` function to prevent scroll issues:

```typescript
const handleTaskStart = async (taskId: string): Promise<void> => {
  try {
    setIsGeneratingContent(true)
    
    // Try to start task (may fail if endpoint doesn't exist)
    try {
      await startTask(taskId)
    } catch (error) {
      // Log but continue - don't block navigation
      console.warn('Task start API call failed, continuing anyway:', error)
    }
    
    setIsGeneratingContent(false)
    
    // Navigate regardless of API success
    navigate(`/exercises/${taskId}`, { replace: false })
  } catch (error) {
    console.error('Failed to start task:', error)
    setIsGeneratingContent(false)
    
    // Show error notification
    setNotifications(prev => [{
      id: `error-${Date.now()}`,
      type: 'warning',
      message: '⚠️ Failed to start task. Please try again.',
      timestamp: new Date()
    }, ...prev.slice(0, 4)])
  }
}
```

### Route Configuration

Ensure the exercises route exists in the routing configuration:

```typescript
// frontend/src/App.tsx or routes configuration
<Route path="/exercises/:taskId" element={<Exercises />} />
```

If the Exercises page doesn't exist or isn't properly configured, create a placeholder or redirect to an appropriate page.

## Data Models

### Task Progress Tracking (Backend)

```python
class TaskProgress(Base):
    __tablename__ = "task_progress"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    task_id: Mapped[str] = mapped_column(String, ForeignKey("tasks.id"))
    status: Mapped[str] = mapped_column(String)  # "not_started", "in_progress", "completed"
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    best_score: Mapped[Optional[float]] = mapped_column(Float)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task Start API Success
*For any* valid task ID and authenticated user, calling the start task endpoint should return a 200 status code and update the task status to "in_progress"
**Validates: Requirements 1.1, 1.2**

### Property 2: Navigation Resilience
*For any* task start attempt (successful or failed), the system should navigate to the exercises page without causing redirects or navigation loops
**Validates: Requirements 1.4, 2.1, 2.3**

### Property 3: Error Handling Graceful Degradation
*For any* API error (404, 500, network failure), the system should display an appropriate error message and allow the user to continue or retry
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Scroll Event Independence
*For any* scroll event within the learning path view, the system should not trigger navigation events or state changes that cause redirects
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Task Status Persistence
*For any* task that is started or completed, the status change should be persisted to the database and reflected in subsequent API calls
**Validates: Requirements 3.3, 3.4, 3.5**

## Error Handling

### API Error Scenarios

1. **404 Not Found**: Endpoint doesn't exist
   - Frontend: Log warning, continue with navigation
   - User: Show notification that offline mode is active
   - Recovery: Implement endpoints in backend

2. **403 Forbidden**: User doesn't have permission
   - Frontend: Show error message
   - User: Redirect to login or show permission error
   - Recovery: Check authentication state

3. **500 Server Error**: Backend failure
   - Frontend: Show error with retry option
   - User: Display "Try again" button
   - Recovery: Retry with exponential backoff

4. **Network Error**: No connection
   - Frontend: Enable offline mode
   - User: Show offline indicator
   - Recovery: Queue actions for when connection returns

### Navigation Error Scenarios

1. **Invalid Task ID**: Task doesn't exist
   - Show 404 page with link back to learning path
   - Log error for debugging

2. **Missing Route**: Exercises page not configured
   - Redirect to learning path with error message
   - Log configuration error

3. **Scroll-Induced Redirect**: Error in event handler
   - Remove any scroll event listeners that trigger navigation
   - Use CSS for scroll behavior instead of JS

## Testing Strategy

### Unit Tests

1. **Backend Endpoint Tests**
   - Test POST /api/v1/tasks/{id}/start with valid task
   - Test POST /api/v1/tasks/{id}/start with invalid task (404)
   - Test POST /api/v1/tasks/{id}/complete with valid task
   - Test authorization checks

2. **Frontend Service Tests**
   - Test startTask with successful API response
   - Test startTask with 404 error (should not throw)
   - Test completeTask with network error
   - Test error handling and logging

3. **Navigation Tests**
   - Test handleTaskStart navigates correctly
   - Test navigation with API failure
   - Test scroll events don't trigger navigation
   - Test error notifications display correctly

### Integration Tests

1. **End-to-End Flow**
   - User clicks start button → API called → Navigation occurs
   - User scrolls learning path → No redirects occur
   - API fails → Error shown → User can retry

2. **Error Recovery**
   - Start task with backend down → Offline mode activates
   - Network restored → Pending actions sync

### Property-Based Tests

1. **Property 1 Test**: Generate random valid task IDs, call start endpoint, verify 200 response
2. **Property 2 Test**: Generate random task IDs (valid/invalid), verify navigation always occurs
3. **Property 4 Test**: Generate random scroll events, verify no navigation triggered

## Implementation Notes

### Priority Order

1. **High Priority**: Add backend endpoints (fixes 404 error)
2. **High Priority**: Fix navigation error handling (prevents redirects)
3. **Medium Priority**: Improve error messages
4. **Low Priority**: Add offline mode support

### Backward Compatibility

- Frontend changes are backward compatible (graceful degradation)
- Backend endpoints are new (no breaking changes)
- Existing task data structure unchanged

### Performance Considerations

- Task start/complete endpoints should be fast (<100ms)
- No additional database queries needed (use existing tables)
- Frontend error handling adds minimal overhead

### Security Considerations

- Verify user owns the task before allowing start/complete
- Validate task_id format to prevent injection
- Rate limit task start/complete endpoints (max 10/minute per user)
