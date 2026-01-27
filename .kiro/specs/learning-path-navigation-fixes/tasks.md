# Implementation Plan: Learning Path Navigation Fixes

## Overview

Fix the 404 error when starting tasks and resolve scroll-induced navigation issues in the learning path interface.

## Tasks

- [x] 1. Add backend task lifecycle endpoints
  - [x] 1.1 Create TaskStartResponse and TaskCompleteResponse models
    - Add response models to `src/adapters/api/models/tasks.py`
    - Include task_id, timestamp, status, and message fields
    - _Requirements: 3.1, 3.5_

  - [x] 1.2 Implement POST /api/v1/tasks/{task_id}/start endpoint
    - Add endpoint to `src/adapters/api/routers/tasks.py`
    - Verify user owns the task (check via module → plan → user_id)
    - Record start timestamp (create or update task progress record)
    - Return TaskStartResponse with status "in_progress"
    - _Requirements: 3.1, 3.3, 5.4_

  - [x] 1.3 Implement POST /api/v1/tasks/{task_id}/complete endpoint
    - Add endpoint to `src/adapters/api/routers/tasks.py`
    - Verify user owns the task
    - Record completion timestamp
    - Calculate next task in sequence (if any)
    - Return TaskCompleteResponse with next_task_id
    - _Requirements: 3.2, 3.4, 5.4_

  - [ ]* 1.4 Write unit tests for new endpoints
    - Test start endpoint with valid task
    - Test start endpoint with invalid task (404)
    - Test complete endpoint with valid task
    - Test authorization checks (403 for wrong user)
    - _Requirements: 3.1, 3.2_

- [x] 2. Fix frontend error handling and navigation
  - [x] 2.1 Update learningPathService error handling
    - Modify `startTask` method to catch and log errors without throwing
    - Modify `completeTask` method to catch and log errors without throwing
    - Add graceful degradation for missing endpoints
    - _Requirements: 1.3, 4.1, 4.4_

  - [x] 2.2 Fix LearningPath.tsx navigation logic
    - Update `handleTaskStart` to separate API call from navigation
    - Ensure navigation occurs even if API call fails
    - Remove any scroll event listeners that might trigger navigation
    - Add proper error notifications for failed API calls
    - _Requirements: 1.1, 1.4, 2.1, 2.3, 4.1_

  - [x] 2.3 Verify exercises route configuration
    - Check that `/exercises/:taskId` route exists in App.tsx or routing config
    - Ensure Exercises component is properly imported and configured
    - Add 404 handling for invalid task IDs
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.4 Write frontend unit tests
    - Test startTask with successful response
    - Test startTask with 404 error (should not throw)
    - Test handleTaskStart navigation with API failure
    - Test scroll events don't trigger navigation
    - _Requirements: 1.1, 2.1, 4.1_

- [x] 3. Improve error messaging and user feedback
  - [x] 3.1 Add user-friendly error messages
    - Update error notifications to include actionable next steps
    - Add specific messages for 404, 403, 500, and network errors
    - Include "Try again" or "Go back" options in error messages
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 3.2 Add offline mode indicator
    - Show connection status in learning path header
    - Display offline mode message when backend is unavailable
    - Queue task start/complete actions for when connection returns
    - _Requirements: 4.4_

  - [ ]* 3.3 Write integration tests for error scenarios
    - Test complete flow with backend down
    - Test error recovery when connection restored
    - Test user can retry after error
    - _Requirements: 4.1, 4.3, 4.4_

- [ ] 4. Checkpoint - Verify fixes work end-to-end
  - Test clicking start button → no 404 error
  - Test scrolling learning path → no redirects
  - Test error messages display correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Priority: Complete tasks 1 and 2 first (fixes critical bugs)
- Task 3 improves UX but isn't blocking
- Each task references specific requirements for traceability
