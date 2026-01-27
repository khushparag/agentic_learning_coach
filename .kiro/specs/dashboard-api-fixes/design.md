# Design Document: Dashboard API Fixes

## 1. Overview

### 1.1 Problem Statement

The dashboard is experiencing multiple issues:
1. **Missing API Endpoints**: Several endpoints return 404 errors causing network failures
2. **Scroll Behavior Issue**: After clicking "Start" button and content generation, page scrolls back to the start button
3. **No Error Handling**: Failed API calls show errors instead of graceful fallbacks

### 1.2 Solution Approach

1. **Backend**: Add missing API endpoints with proper data aggregation
2. **Frontend**: Implement retry logic, caching, and fallback mechanisms
3. **Learning Content**: Fix scroll behavior after content generation

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Services   │  │  React Query │      │
│  │  Components  │──│  (API calls) │──│   (Caching)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routers    │  │  Services    │  │ Repositories │      │
│  │  (Endpoints) │──│  (Business)  │──│  (Database)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

## 2. API Endpoint Specifications

### 2.1 Dashboard Statistics Endpoint

**Endpoint:** `GET /api/progress/dashboard-stats`

**Authentication:** Required (JWT)

**Response:**
```typescript
interface DashboardStats {
  currentStreak: number;          // Days
  weeklyXP: number;               // XP earned this week
  totalXP: number;                // Total XP earned
  completedTasks: number;         // Tasks completed
  totalTasks: number;             // Total tasks assigned
  level: number;                  // Current level
  nextLevelXP: number;            // XP needed for next level
  achievements: Achievement[];    // Recent achievements
  learningTimeHours: number;      // Total learning time
  successRate: number;            // Percentage (0-100)
  skillsLearned: number;          // Number of skills mastered
}
```

**Example Response:**
```json
{
  "currentStreak": 7,
  "weeklyXP": 450,
  "totalXP": 2340,
  "completedTasks": 23,
  "totalTasks": 45,
  "level": 5,
  "nextLevelXP": 500,
  "achievements": [
    {
      "id": "1",
      "title": "First Steps",
      "description": "Complete your first exercise",
      "icon": "🎯",
      "unlockedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "learningTimeHours": 12.5,
  "successRate": 87.5,
  "skillsLearned": 6
}
```


### 2.2 Today's Tasks Endpoint

**Endpoint:** `GET /api/tasks/today`

**Authentication:** Required (JWT)

**Query Parameters:**
- `status` (optional): Filter by task status
- `priority` (optional): Filter by priority
- `type` (optional): Filter by task type
- `sort` (optional): Sort order

**Response:**
```typescript
interface TodayTasksResponse {
  tasks: TodayTask[];
  totalCount: number;
  completedCount: number;
  estimatedTotalMinutes: number;
}

interface TodayTask {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'exercise' | 'project' | 'review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedMinutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  moduleId: string;
  moduleName: string;
  dueDate?: string;
}
```

### 2.3 Progress Metrics Endpoint

**Endpoint:** `GET /api/analytics/progress-metrics`

**Authentication:** Required (JWT)

**Query Parameters:**
- `timeRange` (optional): '7d' | '30d' | '90d' (default: '7d')

**Response:**
```typescript
interface ProgressMetrics {
  learningVelocity: {
    date: string;
    tasksCompleted: number;
    xpEarned: number;
  }[];
  activityHeatmap: {
    date: string;
    intensity: number;
  }[];
  performanceMetrics: {
    accuracy: number;
    speed: number;
    consistency: number;
    retention: number;
  };
  knowledgeRetention: {
    topic: string;
    retentionRate: number;
  }[];
  weeklyProgress: {
    week: string;
    tasksCompleted: number;
    xpEarned: number;
    hoursSpent: number;
  }[];
}
```

## 3. Implementation Plan

### 3.1 Backend Implementation

#### Phase 1: Add Dashboard Stats Endpoint
1. Create `/api/progress/dashboard-stats` endpoint in `progress.py`
2. Implement stats calculation logic
3. Add database queries for streak, XP, tasks
4. Return proper response format

#### Phase 2: Enhance Today's Tasks Endpoint
1. Modify existing `/api/tasks/today` endpoint
2. Add filtering and sorting support
3. Include task counts and time estimates
4. Optimize database queries

#### Phase 3: Add Progress Metrics Endpoint
1. Create `/api/analytics/progress-metrics` endpoint
2. Implement time-range filtering
3. Calculate learning velocity and activity data
4. Add performance metrics calculation


### 3.2 Frontend Implementation

#### Phase 1: Enhanced Dashboard Service
1. Add retry logic with exponential backoff
2. Implement caching layer (1-minute TTL)
3. Add fallback to mock data on errors
4. Improve error logging

**File:** `frontend/src/services/dashboardService.ts`

```typescript
class DashboardService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard-stats';
    const cached = this.getFromCache<DashboardStats>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.fetchWithRetry(() =>
        apiClient.get<DashboardStats>('/api/progress/dashboard-stats')
      );
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return mockDashboardData.stats;
    }
  }
}
```

#### Phase 2: Fix Learning Content Scroll Behavior
1. Add scroll position tracking before content generation
2. Prevent automatic scroll after content loads
3. Add smooth scroll to generated content
4. Maintain scroll position on re-renders

**File:** `frontend/src/pages/learning-path/LearningPath.tsx`

```typescript
const [scrollPosition, setScrollPosition] = useState(0);
const contentRef = useRef<HTMLDivElement>(null);

const handleStartLearning = async () => {
  // Save current scroll position
  setScrollPosition(window.scrollY);
  
  // Generate content
  await generateContent();
  
  // Scroll to generated content (not back to start button)
  if (contentRef.current) {
    contentRef.current.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};
```

## 4. Database Schema

### 4.1 No Schema Changes Required

The existing schema supports all required functionality:
- `users` table for user data
- `learning_plans` table for curriculum
- `modules` and `tasks` tables for content
- `submissions` and `evaluation_results` for progress

### 4.2 Recommended Indexes

```sql
-- Index for today's tasks query
CREATE INDEX IF NOT EXISTS idx_tasks_user_date 
ON tasks(user_id, due_date) 
WHERE status != 'completed';

-- Index for progress metrics
CREATE INDEX IF NOT EXISTS idx_submissions_user_date 
ON submissions(user_id, submitted_at);

-- Index for streak calculation
CREATE INDEX IF NOT EXISTS idx_evaluation_user_date 
ON evaluation_results(user_id, evaluated_at);
```


## 5. Error Handling Strategy

### 5.1 Backend Error Responses

```python
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        stats = await calculate_dashboard_stats(user_id, db)
        return stats
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch dashboard statistics"
        )
```

### 5.2 Frontend Error Handling

```typescript
// Graceful degradation with fallback data
try {
  const data = await fetchWithRetry(() => api.get('/endpoint'));
  return data;
} catch (error) {
  console.error('API call failed, using fallback:', error);
  return mockData;
}

// User-friendly error messages
if (error) {
  return (
    <div className="error-state">
      <p>Unable to load data. Showing cached information.</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```

## 6. Performance Considerations

### 6.1 Backend Optimizations

1. **Database Query Optimization**
   - Use indexes for common queries
   - Batch related queries
   - Implement query result caching

2. **Response Time Targets**
   - Dashboard stats: < 500ms
   - Today's tasks: < 300ms
   - Progress metrics: < 1s

3. **Caching Strategy**
   - Cache frequently accessed data
   - Invalidate cache on updates
   - Use Redis for distributed caching (future)

### 6.2 Frontend Optimizations

1. **Request Caching**
   - Cache API responses for 1 minute
   - Invalidate on user actions
   - Use React Query for automatic caching

2. **Lazy Loading**
   - Load dashboard components progressively
   - Defer non-critical data fetching
   - Show loading skeletons

3. **Debouncing**
   - Debounce filter changes
   - Throttle scroll events
   - Batch state updates

## 7. Testing Strategy

### 7.1 Backend Tests

```python
# Test dashboard stats endpoint
async def test_get_dashboard_stats():
    response = await client.get(
        "/api/progress/dashboard-stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "currentStreak" in data
    assert "weeklyXP" in data
    assert isinstance(data["achievements"], list)

# Test error handling
async def test_dashboard_stats_unauthorized():
    response = await client.get("/api/progress/dashboard-stats")
    assert response.status_code == 401
```

### 7.2 Frontend Tests

```typescript
// Test dashboard service
describe('DashboardService', () => {
  it('should fetch dashboard stats', async () => {
    const stats = await dashboardService.getDashboardStats();
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('weeklyXP');
  });

  it('should use fallback on error', async () => {
    mockApiError();
    const stats = await dashboardService.getDashboardStats();
    expect(stats).toEqual(mockDashboardData.stats);
  });

  it('should cache responses', async () => {
    await dashboardService.getDashboardStats();
    const cachedStats = await dashboardService.getDashboardStats();
    expect(apiCallCount).toBe(1); // Only one API call
  });
});
```

### 7.3 Integration Tests

```typescript
// Test complete dashboard flow
describe('Dashboard Integration', () => {
  it('should load dashboard without errors', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/current streak/i)).toBeInTheDocument();
      expect(screen.getByText(/today's tasks/i)).toBeInTheDocument();
    });
  });

  it('should handle API failures gracefully', async () => {
    mockApiFailure();
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/showing cached/i)).toBeInTheDocument();
    });
  });
});
```


## 8. Deployment Considerations

### 8.1 Backend Deployment

1. **Environment Variables**
   - No new environment variables required
   - Use existing database connection settings

2. **Database Migrations**
   - No schema changes required
   - Add recommended indexes for performance

3. **API Documentation**
   - Update OpenAPI/Swagger docs
   - Add endpoint examples
   - Document error responses

### 8.2 Frontend Deployment

1. **Build Configuration**
   - No build changes required
   - Existing Vite configuration sufficient

2. **Environment Configuration**
   - Use existing API base URL
   - No new environment variables

3. **Cache Management**
   - In-memory cache (no persistence needed)
   - Automatic cache invalidation on logout

## 9. Monitoring and Observability

### 9.1 Backend Metrics

```python
# Track endpoint performance
@router.get("/dashboard-stats")
async def get_dashboard_stats(...):
    start_time = time.time()
    try:
        result = await calculate_stats(...)
        duration = time.time() - start_time
        logger.info(f"Dashboard stats fetched in {duration:.2f}s")
        return result
    except Exception as e:
        logger.error(f"Dashboard stats failed: {e}", exc_info=True)
        raise
```

### 9.2 Frontend Monitoring

```typescript
// Track API call success/failure rates
const trackApiCall = (endpoint: string, success: boolean, duration: number) => {
  console.log(`[API] ${endpoint}: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
  
  // In production, send to analytics service
  if (window.analytics) {
    window.analytics.track('api_call', {
      endpoint,
      success,
      duration
    });
  }
};
```

### 9.3 Key Metrics to Monitor

1. **API Performance**
   - Response times (p50, p95, p99)
   - Error rates by endpoint
   - Cache hit rates

2. **User Experience**
   - Dashboard load time
   - Time to interactive
   - Error recovery success rate

3. **System Health**
   - Database query performance
   - Memory usage
   - Connection pool utilization

## 10. Rollback Plan

### 10.1 Backend Rollback

If issues occur after deployment:

1. **Immediate Actions**
   - Revert to previous backend version
   - Monitor error logs
   - Check database connections

2. **Gradual Rollback**
   - Disable new endpoints via feature flag
   - Route traffic to old endpoints
   - Investigate issues offline

### 10.2 Frontend Rollback

1. **Immediate Actions**
   - Revert to previous frontend build
   - Clear CDN cache
   - Monitor user reports

2. **Partial Rollback**
   - Use feature flags to disable new features
   - Keep fallback data active
   - Test fixes in staging

## 11. Success Criteria

### 11.1 Functional Requirements

- ✅ All dashboard API endpoints return valid data
- ✅ No 404 errors in network logs
- ✅ Scroll behavior works correctly after content generation
- ✅ Error handling provides graceful fallbacks
- ✅ Mock data displays when API fails

### 11.2 Performance Requirements

- ✅ Dashboard loads in < 2 seconds
- ✅ API responses in < 500ms (p95)
- ✅ No visible loading delays
- ✅ Smooth scroll animations

### 11.3 User Experience Requirements

- ✅ No error messages visible to users
- ✅ Seamless fallback to cached data
- ✅ Clear loading indicators
- ✅ Responsive UI during data fetching

## 12. Future Enhancements

### 12.1 Short-term (Next Sprint)

1. **Real-time Updates**
   - WebSocket integration for live stats
   - Push notifications for achievements
   - Live progress updates

2. **Advanced Caching**
   - Redis integration for distributed cache
   - Persistent cache across sessions
   - Smart cache invalidation

### 12.2 Long-term (Future Releases)

1. **Personalization**
   - AI-driven dashboard layout
   - Custom widget configuration
   - Predictive task recommendations

2. **Analytics**
   - Advanced learning analytics
   - Comparative performance metrics
   - Trend analysis and predictions

3. **Collaboration**
   - Shared progress with mentors
   - Team leaderboards
   - Peer comparison features

## 13. Conclusion

This design provides a comprehensive solution to fix the dashboard API issues while maintaining clean architecture principles and ensuring excellent user experience. The implementation follows SOLID principles, includes proper error handling, and provides a clear path for testing and deployment.

Key benefits:
- **Reliability**: Graceful fallbacks ensure dashboard always works
- **Performance**: Caching and optimization reduce load times
- **Maintainability**: Clean separation of concerns and proper error handling
- **Scalability**: Design supports future enhancements without major refactoring
