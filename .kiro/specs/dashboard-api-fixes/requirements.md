# Requirements Document: Dashboard API Fixes

## Introduction

The dashboard is experiencing multiple API endpoint failures when loading, causing network errors and preventing proper data display. Additionally, the "Start" button behavior needs investigation as content appears to generate but then scrolls back to the start button.

## Glossary

- **Dashboard**: The main user interface showing learning progress, tasks, and statistics
- **API Endpoint**: A backend URL that provides data to the frontend
- **Mock Data**: Fallback data used when API calls fail
- **Backend Service**: The Python FastAPI application running on port 8002
- **Frontend Application**: The React application running on port 3000

## Requirements

### Requirement 1: Fix Missing Dashboard API Endpoints

**User Story:** As a user, I want the dashboard to load without errors, so that I can see my learning progress and tasks.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL provide valid responses for all required API endpoints
2. WHEN `/api/progress/dashboard-stats` is called, THE System SHALL return user statistics including streak, XP, tasks, and achievements
3. WHEN `/api/tasks/today` is called, THE System SHALL return today's tasks for the user
4. WHEN `/api/analytics/progress-metrics` is called, THE System SHALL return progress metrics with learning velocity and activity data
5. WHEN `/api/v1/dashboard/comprehensive` is called, THE System SHALL return comprehensive dashboard data including gamification, progress, and notifications
6. WHEN any API endpoint fails, THE Frontend SHALL display mock data gracefully without showing error messages to the user

### Requirement 2: Implement Dashboard Statistics Endpoint

**User Story:** As a user, I want to see my current learning statistics, so that I can track my progress.

#### Acceptance Criteria

1. THE System SHALL provide a `/api/progress/dashboard-stats` endpoint
2. THE Endpoint SHALL return current streak, weekly XP, total XP, completed tasks, total tasks, level, next level XP, achievements, learning time hours, success rate, and skills learned
3. THE Endpoint SHALL calculate statistics from the database for authenticated users
4. THE Endpoint SHALL return appropriate default values for new users with no progress
5. THE Response SHALL complete within 500ms for typical queries

### Requirement 3: Implement Today's Tasks Endpoint

**User Story:** As a user, I want to see my tasks for today, so that I know what to work on.

#### Acceptance Criteria

1. THE System SHALL provide a `/api/tasks/today` endpoint
2. THE Endpoint SHALL return tasks assigned for the current day
3. THE Endpoint SHALL include task ID, title, description, type, priority, estimated minutes, status, module ID, and module name
4. THE Endpoint SHALL support filtering by status, priority, and type
5. THE Endpoint SHALL support sorting by priority, due date, or estimated time

### Requirement 4: Implement Progress Metrics Endpoint

**User Story:** As a user, I want to see my learning progress over time, so that I can understand my learning patterns.

#### Acceptance Criteria

1. THE System SHALL provide a `/api/analytics/progress-metrics` endpoint
2. THE Endpoint SHALL accept a time range parameter (7d, 30d, 90d)
3. THE Endpoint SHALL return learning velocity data (tasks completed and XP earned per day)
4. THE Endpoint SHALL return activity heatmap data
5. THE Endpoint SHALL return performance metrics (accuracy, speed, consistency, retention)
6. THE Endpoint SHALL return knowledge retention data by topic
7. THE Endpoint SHALL return weekly progress data

### Requirement 5: Implement Comprehensive Dashboard Endpoint

**User Story:** As a user, I want all my dashboard data loaded efficiently, so that the dashboard loads quickly.

#### Acceptance Criteria

1. THE System SHALL provide a `/api/v1/dashboard/comprehensive` endpoint
2. THE Endpoint SHALL return gamification data (level, XP, streak, achievements)
3. THE Endpoint SHALL return today's focus (tasks, progress percentage)
4. THE Endpoint SHALL return progress metrics summary
5. THE Endpoint SHALL return notifications (streak at risk, new achievements, pending challenges)
6. THE Endpoint SHALL aggregate data from multiple sources in a single request
7. THE Response SHALL complete within 1 second

### Requirement 6: Fix "Start" Button Behavior

**User Story:** As a user, when I click the "Start" button, I want to see the generated content, so that I can begin learning.

#### Acceptance Criteria

1. WHEN the user clicks the "Start" button, THE System SHALL generate learning content using the LLM
2. WHEN content generation completes, THE System SHALL display the content on the page
3. THE Page SHALL NOT scroll back to the start button after content loads
4. THE System SHALL show a loading indicator while content is being generated
5. IF content generation fails, THE System SHALL display an error message with retry option
6. THE Generated content SHALL remain visible until the user navigates away

### Requirement 7: Implement Error Handling and Fallbacks

**User Story:** As a user, I want the dashboard to work even when some API calls fail, so that I can still use the application.

#### Acceptance Criteria

1. WHEN an API endpoint returns an error, THE Frontend SHALL use mock data as fallback
2. THE System SHALL log API errors for debugging without exposing them to users
3. THE Frontend SHALL display a subtle indicator when using fallback data
4. THE System SHALL retry failed requests with exponential backoff
5. THE Frontend SHALL cache successful responses to reduce API calls

### Requirement 8: Add API Endpoint Documentation

**User Story:** As a developer, I want clear API documentation, so that I can understand and maintain the endpoints.

#### Acceptance Criteria

1. THE System SHALL document all dashboard API endpoints in the API reference
2. THE Documentation SHALL include request parameters, response format, and example responses
3. THE Documentation SHALL include error codes and their meanings
4. THE Documentation SHALL be accessible via `/docs` endpoint in development mode
5. THE Documentation SHALL be kept up-to-date with code changes
