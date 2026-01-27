# Tasks: Dashboard API Fixes

## Overview

This document breaks down the implementation of dashboard API fixes into manageable tasks. Each task includes acceptance criteria, estimated effort, and dependencies.

## Task Breakdown

### Phase 1: Backend API Endpoints (Priority: HIGH)

#### Task 1.1: Add Dashboard Stats Endpoint
**File:** `src/adapters/api/routers/progress.py`

**Description:** Implement `/api/progress/dashboard-stats` endpoint to provide comprehensive dashboard statistics.

**Acceptance Criteria:**
- [ ] Endpoint returns current streak, XP, tasks, level, and achievements
- [ ] Calculates streak from user activity dates
- [ ] Returns proper default values for new users
- [ ] Response time < 500ms
- [ ] Proper error handling with 500 status on failure
- [ ] Unit tests with 90%+ coverage

**Implementation Steps:**
1. Add `get_dashboard_stats` route handler
2. Implement `_calculate_streak` helper function
3. Implement `_calculate_level_xp` helper function
4. Query database for user progress data
5. Aggregate statistics from multiple tables
6. Return formatted response
7. Add error handling and logging

**Estimated Effort:** 4 hours

**Dependencies:** None

---

#### Task 1.2: Enhance Today's Tasks Endpoint
**File:** `src/adapters/api/routers/tasks.py`

**Description:** Enhance existing `/api/tasks/today` endpoint with filtering, sorting, and better response format.

**Acceptance Criteria:**
- [ ] Supports filtering by status, priority, and type
- [ ] Supports sorting by priority, due_date, estimated_time
- [ ] Returns task counts and time estimates
- [ ] Includes module information for each task
- [ ] Response time < 300ms
- [ ] Proper error handling

**Implementation Steps:**
1. Modify existing `get_today_tasks` function
2. Add query parameter parsing for filters
3. Implement filtering logic
4. Implement sorting logic
5. Add task count calculations
6. Update response model
7. Add tests for filtering and sorting

**Estimated Effort:** 3 hours

**Dependencies:** None

---


#### Task 1.3: Add Progress Metrics Endpoint
**File:** `src/adapters/api/routers/analytics.py`

**Description:** Create `/api/analytics/progress-metrics` endpoint for learning analytics and progress visualization.

**Acceptance Criteria:**
- [ ] Accepts time range parameter (7d, 30d, 90d)
- [ ] Returns learning velocity data
- [ ] Returns activity heatmap data
- [ ] Returns performance metrics
- [ ] Returns knowledge retention by topic
- [ ] Returns weekly progress summary
- [ ] Response time < 1 second
- [ ] Proper error handling

**Implementation Steps:**
1. Create new analytics router if not exists
2. Add `get_progress_metrics` route handler
3. Implement time range filtering
4. Query submissions and evaluations data
5. Calculate learning velocity
6. Generate activity heatmap
7. Calculate performance metrics
8. Aggregate knowledge retention data
9. Add tests for different time ranges

**Estimated Effort:** 5 hours

**Dependencies:** None

---

### Phase 2: Frontend Service Enhancements (Priority: HIGH)

#### Task 2.1: Implement Retry Logic with Exponential Backoff
**File:** `frontend/src/services/dashboardService.ts`

**Description:** Add robust retry mechanism for API calls with exponential backoff.

**Acceptance Criteria:**
- [ ] Retries failed requests up to 3 times
- [ ] Uses exponential backoff (1s, 2s, 4s)
- [ ] Maximum delay capped at 10 seconds
- [ ] Logs retry attempts
- [ ] Falls back to mock data after max retries
- [ ] Unit tests for retry logic

**Implementation Steps:**
1. Create `fetchWithRetry` helper function
2. Implement exponential backoff calculation
3. Add retry loop with error handling
4. Add logging for retry attempts
5. Integrate with existing API calls
6. Add unit tests

**Estimated Effort:** 2 hours

**Dependencies:** None

---

#### Task 2.2: Implement Response Caching
**File:** `frontend/src/services/dashboardService.ts`

**Description:** Add in-memory caching layer to reduce API calls and improve performance.

**Acceptance Criteria:**
- [ ] Caches API responses for 1 minute
- [ ] Implements cache key generation
- [ ] Checks cache before making API calls
- [ ] Invalidates expired cache entries
- [ ] Clears cache on logout
- [ ] Unit tests for cache behavior

**Implementation Steps:**
1. Add cache Map to DashboardService class
2. Implement `getFromCache` method
3. Implement `setCache` method
4. Add cache TTL checking
5. Integrate caching with API methods
6. Add cache clearing on logout
7. Add unit tests

**Estimated Effort:** 2 hours

**Dependencies:** Task 2.1

---

#### Task 2.3: Enhance Error Handling with Fallbacks
**File:** `frontend/src/services/dashboardService.ts`

**Description:** Improve error handling to gracefully fall back to mock data when API calls fail.

**Acceptance Criteria:**
- [ ] Catches all API errors
- [ ] Logs errors without exposing to users
- [ ] Returns mock data as fallback
- [ ] Provides different mock data for new vs returning users
- [ ] Shows subtle indicator when using fallback data
- [ ] Unit tests for error scenarios

**Implementation Steps:**
1. Wrap all API calls in try-catch blocks
2. Add error logging
3. Return appropriate mock data based on user state
4. Add fallback indicator to UI
5. Add unit tests for error handling

**Estimated Effort:** 2 hours

**Dependencies:** Task 2.1, Task 2.2

---


### Phase 3: Learning Content Scroll Fix (Priority: HIGH)

#### Task 3.1: Fix Scroll Behavior After Content Generation
**File:** `frontend/src/pages/learning-path/LearningPath.tsx`

**Description:** Fix the issue where page scrolls back to start button after content generation completes.

**Acceptance Criteria:**
- [ ] Page does not scroll back to start button after content loads
- [ ] Generated content remains visible
- [ ] Smooth scroll to generated content
- [ ] Loading indicator shows during generation
- [ ] Error handling for failed generation
- [ ] Scroll position maintained on re-renders

**Implementation Steps:**
1. Add scroll position tracking with useRef
2. Save scroll position before content generation
3. Prevent automatic scroll after content loads
4. Add smooth scroll to generated content
5. Add loading indicator during generation
6. Add error handling with retry option
7. Test scroll behavior in different scenarios

**Estimated Effort:** 3 hours

**Dependencies:** None

---

#### Task 3.2: Add Content Generation Loading State
**File:** `frontend/src/pages/learning-path/LearningPath.tsx`

**Description:** Improve user experience during content generation with proper loading states.

**Acceptance Criteria:**
- [ ] Shows loading spinner during generation
- [ ] Disables start button while loading
- [ ] Shows progress message
- [ ] Handles generation timeout
- [ ] Shows error message on failure
- [ ] Provides retry option

**Implementation Steps:**
1. Add loading state variable
2. Show loading spinner during generation
3. Disable start button while loading
4. Add progress message
5. Implement timeout handling
6. Add error state and retry button
7. Test loading states

**Estimated Effort:** 2 hours

**Dependencies:** Task 3.1

---

### Phase 4: Testing (Priority: MEDIUM)

#### Task 4.1: Backend Unit Tests
**Files:** `tests/unit/adapters/api/test_progress_router.py`, `tests/unit/adapters/api/test_tasks_router.py`, `tests/unit/adapters/api/test_analytics_router.py`

**Description:** Add comprehensive unit tests for new and modified backend endpoints.

**Acceptance Criteria:**
- [ ] Test dashboard stats endpoint with various user states
- [ ] Test today's tasks with filtering and sorting
- [ ] Test progress metrics with different time ranges
- [ ] Test error handling scenarios
- [ ] Test authentication requirements
- [ ] 90%+ code coverage
- [ ] All tests pass

**Implementation Steps:**
1. Create test files for each router
2. Write tests for successful responses
3. Write tests for error scenarios
4. Write tests for edge cases (new users, no data)
5. Write tests for authentication
6. Run coverage report
7. Fix any failing tests

**Estimated Effort:** 4 hours

**Dependencies:** Task 1.1, Task 1.2, Task 1.3

---

#### Task 4.2: Frontend Unit Tests
**Files:** `frontend/src/services/__tests__/dashboardService.test.ts`

**Description:** Add unit tests for enhanced dashboard service.

**Acceptance Criteria:**
- [ ] Test retry logic with exponential backoff
- [ ] Test caching behavior
- [ ] Test cache expiration
- [ ] Test fallback to mock data
- [ ] Test error handling
- [ ] 90%+ code coverage
- [ ] All tests pass

**Implementation Steps:**
1. Create test file for dashboard service
2. Mock API calls
3. Write tests for retry logic
4. Write tests for caching
5. Write tests for error handling
6. Write tests for mock data fallback
7. Run coverage report

**Estimated Effort:** 3 hours

**Dependencies:** Task 2.1, Task 2.2, Task 2.3

---

#### Task 4.3: Integration Tests
**Files:** `tests/integration/test_dashboard_api.py`, `frontend/cypress/e2e/dashboard-loading.cy.ts`

**Description:** Add integration tests for complete dashboard loading flow.

**Acceptance Criteria:**
- [ ] Test complete dashboard load with all API calls
- [ ] Test dashboard load with API failures
- [ ] Test scroll behavior after content generation
- [ ] Test retry mechanism in real scenarios
- [ ] Test cache behavior across page reloads
- [ ] All tests pass

**Implementation Steps:**
1. Create backend integration test
2. Test complete API flow
3. Test error scenarios
4. Create frontend E2E test
5. Test dashboard loading
6. Test scroll behavior
7. Test error recovery

**Estimated Effort:** 4 hours

**Dependencies:** All previous tasks

---


### Phase 5: Documentation and Deployment (Priority: LOW)

#### Task 5.1: Update API Documentation
**File:** `docs/API_REFERENCE.md`

**Description:** Document new and modified API endpoints.

**Acceptance Criteria:**
- [ ] Document dashboard stats endpoint
- [ ] Document enhanced today's tasks endpoint
- [ ] Document progress metrics endpoint
- [ ] Include request/response examples
- [ ] Document error responses
- [ ] Update OpenAPI/Swagger specs

**Implementation Steps:**
1. Add dashboard stats endpoint documentation
2. Add today's tasks endpoint documentation
3. Add progress metrics endpoint documentation
4. Add request/response examples
5. Document error codes
6. Update OpenAPI specs
7. Review documentation for clarity

**Estimated Effort:** 2 hours

**Dependencies:** Task 1.1, Task 1.2, Task 1.3

---

#### Task 5.2: Add Database Indexes
**File:** `alembic/versions/xxx_add_dashboard_indexes.py`

**Description:** Add recommended database indexes for improved query performance.

**Acceptance Criteria:**
- [ ] Index on tasks(user_id, due_date)
- [ ] Index on submissions(user_id, submitted_at)
- [ ] Index on evaluation_results(user_id, evaluated_at)
- [ ] Migration runs successfully
- [ ] Rollback works correctly
- [ ] Performance improvement verified

**Implementation Steps:**
1. Create new Alembic migration
2. Add index creation statements
3. Add index removal in downgrade
4. Test migration on development database
5. Test rollback
6. Verify query performance improvement
7. Document index purpose

**Estimated Effort:** 1 hour

**Dependencies:** None

---

#### Task 5.3: Update Deployment Documentation
**File:** `SETUP_GUIDE.md`

**Description:** Update deployment guide with any new requirements or considerations.

**Acceptance Criteria:**
- [ ] Document new endpoints
- [ ] Document database indexes
- [ ] Document monitoring recommendations
- [ ] Document rollback procedures
- [ ] Update troubleshooting section

**Implementation Steps:**
1. Review deployment guide
2. Add new endpoint information
3. Add database migration steps
4. Add monitoring recommendations
5. Add rollback procedures
6. Update troubleshooting section
7. Review for completeness

**Estimated Effort:** 1 hour

**Dependencies:** All previous tasks

---

## Task Summary

### By Priority

**HIGH Priority (Must Complete):**
- Task 1.1: Add Dashboard Stats Endpoint (4h)
- Task 1.2: Enhance Today's Tasks Endpoint (3h)
- Task 1.3: Add Progress Metrics Endpoint (5h)
- Task 2.1: Implement Retry Logic (2h)
- Task 2.2: Implement Response Caching (2h)
- Task 2.3: Enhance Error Handling (2h)
- Task 3.1: Fix Scroll Behavior (3h)
- Task 3.2: Add Loading State (2h)

**MEDIUM Priority (Should Complete):**
- Task 4.1: Backend Unit Tests (4h)
- Task 4.2: Frontend Unit Tests (3h)
- Task 4.3: Integration Tests (4h)

**LOW Priority (Nice to Have):**
- Task 5.1: Update API Documentation (2h)
- Task 5.2: Add Database Indexes (1h)
- Task 5.3: Update Deployment Documentation (1h)

### Total Estimated Effort

- **HIGH Priority:** 23 hours
- **MEDIUM Priority:** 11 hours
- **LOW Priority:** 4 hours
- **TOTAL:** 38 hours (~5 days)

### Recommended Sprint Plan

**Sprint 1 (Week 1):**
- Complete all HIGH priority tasks
- Begin MEDIUM priority testing tasks

**Sprint 2 (Week 2):**
- Complete MEDIUM priority testing tasks
- Complete LOW priority documentation tasks
- Final testing and deployment

## Dependencies Graph

```
Task 1.1 (Dashboard Stats) ──┐
Task 1.2 (Today's Tasks) ─────┼──> Task 4.1 (Backend Tests) ──┐
Task 1.3 (Progress Metrics) ──┘                                │
                                                                ├──> Task 4.3 (Integration Tests)
Task 2.1 (Retry Logic) ──┐                                     │
Task 2.2 (Caching) ───────┼──> Task 2.3 (Error Handling) ──┐  │
                          │                                  │  │
                          └──> Task 4.2 (Frontend Tests) ───┴──┘

Task 3.1 (Scroll Fix) ──> Task 3.2 (Loading State)

All Tasks ──> Task 5.1 (API Docs)
All Tasks ──> Task 5.3 (Deployment Docs)

Task 5.2 (DB Indexes) [Independent]
```

## Risk Assessment

### High Risk
- **Task 1.1**: Complex streak calculation logic
  - Mitigation: Start with simple implementation, iterate
  
- **Task 3.1**: Scroll behavior can be tricky across browsers
  - Mitigation: Test on multiple browsers, use standard APIs

### Medium Risk
- **Task 1.3**: Large data aggregation may be slow
  - Mitigation: Add database indexes, implement caching
  
- **Task 2.2**: Cache invalidation is complex
  - Mitigation: Use simple TTL-based expiration

### Low Risk
- **Task 2.1**: Retry logic is well-established pattern
- **Task 4.x**: Testing tasks are straightforward
- **Task 5.x**: Documentation tasks are low risk

## Success Metrics

### Functional Metrics
- ✅ Zero 404 errors in dashboard network logs
- ✅ All API endpoints return valid data
- ✅ Scroll behavior works correctly
- ✅ Error handling provides graceful fallbacks

### Performance Metrics
- ✅ Dashboard loads in < 2 seconds
- ✅ API response times < 500ms (p95)
- ✅ Cache hit rate > 50%
- ✅ Retry success rate > 80%

### Quality Metrics
- ✅ Code coverage > 90%
- ✅ All tests passing
- ✅ Zero critical bugs
- ✅ Documentation complete

## Next Steps

1. **Review and Approve**: Review this task breakdown with the team
2. **Assign Tasks**: Assign tasks to team members based on expertise
3. **Set Up Tracking**: Create tickets in project management tool
4. **Begin Implementation**: Start with HIGH priority tasks
5. **Daily Standups**: Track progress and address blockers
6. **Code Reviews**: Ensure quality through peer review
7. **Testing**: Continuous testing throughout implementation
8. **Deployment**: Deploy to staging, then production
9. **Monitor**: Monitor metrics and user feedback
10. **Iterate**: Address any issues and plan improvements
