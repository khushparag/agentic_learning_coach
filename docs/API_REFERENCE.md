# API Reference

Complete API documentation for the Agentic Learning Coach.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API endpoints (except health checks) require authentication via JWT token.

```bash
# Include in request headers
Authorization: Bearer <your-jwt-token>
```

---

## Health Endpoints

### GET /health
Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T10:00:00Z"
}
```

### GET /health/detailed
Detailed system health with service status.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "up", "latency_ms": 5},
    "redis": {"status": "up", "latency_ms": 2},
    "qdrant": {"status": "up", "latency_ms": 10},
    "runner_service": {"status": "up", "latency_ms": 15}
  },
  "agents": {
    "orchestrator": "healthy",
    "profile": "healthy",
    "curriculum_planner": "healthy",
    "exercise_generator": "healthy",
    "reviewer": "healthy",
    "resources": "healthy",
    "progress_tracker": "healthy"
  }
}
```

---

## Goals API

### POST /goals
Create a new learning goal.

**Request Body:**
```json
{
  "title": "Learn React",
  "description": "Master React fundamentals and hooks",
  "target_date": "2025-03-01",
  "priority": "high"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Learn React",
  "description": "Master React fundamentals and hooks",
  "target_date": "2025-03-01",
  "priority": "high",
  "status": "active",
  "created_at": "2025-01-11T10:00:00Z"
}
```

### GET /goals
List all goals for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (active, completed, paused)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "goals": [...],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### GET /goals/{goal_id}
Get a specific goal.

### PATCH /goals/{goal_id}
Update a goal.

### DELETE /goals/{goal_id}
Delete a goal.

---

## Curriculum API

### POST /curriculum
Create a new curriculum based on goals and profile.

**Request Body:**
```json
{
  "goal_ids": ["uuid1", "uuid2"],
  "time_per_week_hours": 5,
  "preferred_learning_style": "hands-on"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Personalized Learning Path",
  "modules": [
    {
      "id": "uuid",
      "title": "JavaScript Fundamentals",
      "order": 1,
      "estimated_hours": 10,
      "tasks": [...]
    }
  ],
  "total_hours": 30,
  "estimated_weeks": 6
}
```

### GET /curriculum
Get active curriculum for the user.

### GET /curriculum/{curriculum_id}
Get curriculum details with progress.

---

## Tasks API

### GET /tasks/today
Get today's recommended tasks.

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Variables and Data Types",
      "type": "CODE",
      "difficulty_level": 3,
      "estimated_minutes": 30,
      "status": "pending"
    }
  ],
  "total_estimated_minutes": 60
}
```

### GET /tasks/{task_id}
Get task details including exercise content.

### GET /tasks
List tasks with filters.

**Query Parameters:**
- `module_id`: Filter by module
- `status`: Filter by status (pending, in_progress, completed)
- `type`: Filter by type (READ, WATCH, CODE, QUIZ)

---

## Submissions API

### POST /submissions
Submit code for evaluation.

**Request Body:**
```json
{
  "task_id": "uuid",
  "code": "def solution():\n    return 42",
  "language": "python"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "status": "evaluated",
  "passed": true,
  "score": 95.0,
  "test_results": [
    {
      "name": "test_basic",
      "passed": true,
      "execution_time_ms": 5
    }
  ],
  "feedback": {
    "summary": "Excellent work!",
    "strengths": ["Clean code", "Efficient solution"],
    "suggestions": ["Consider adding error handling"]
  }
}
```

### GET /submissions/{submission_id}
Get submission details.

### GET /submissions
List user submissions.

---

## Progress API

### GET /progress
Get progress summary.

**Response:** `200 OK`
```json
{
  "overall_progress": 0.45,
  "current_streak": 5,
  "total_exercises_completed": 23,
  "total_time_spent_hours": 12.5,
  "skill_levels": {
    "javascript": "intermediate",
    "python": "beginner"
  }
}
```

### GET /progress/metrics
Get detailed learning metrics.

### GET /progress/streak
Get streak information.

---

## Analytics API

### GET /analytics/insights/{user_id}
Get comprehensive learning insights.

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "learning_velocity": 1.2,
  "strongest_topics": ["variables", "functions"],
  "areas_for_improvement": ["recursion", "algorithms"],
  "recommended_focus": "Practice more algorithm exercises",
  "engagement_score": 85.5,
  "predicted_completion_date": "2025-02-15",
  "insights": [
    "You learn best in the morning",
    "Your streak is improving motivation"
  ]
}
```

### GET /analytics/difficulty-prediction/{user_id}
Predict optimal difficulty for next exercise.

**Query Parameters:**
- `topic`: Topic for prediction

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "topic": "loops",
  "recommended_difficulty": "intermediate",
  "confidence": 0.85,
  "reasoning": "Based on recent performance in related topics"
}
```

### GET /analytics/retention/{user_id}
Analyze knowledge retention.

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "retention_scores": {
    "variables": 0.95,
    "functions": 0.82,
    "loops": 0.78
  },
  "topics_needing_review": ["loops"],
  "spaced_repetition_schedule": [
    {"topic": "loops", "review_date": "2025-01-12"}
  ]
}
```

---

## Gamification API

### GET /gamification/profile/{user_id}
Get complete gamification profile.

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "total_xp": 2450,
  "level": 8,
  "xp_to_next_level": 550,
  "level_progress": 0.82,
  "streak": {
    "current_streak": 12,
    "longest_streak": 23,
    "last_activity": "2025-01-11T10:00:00Z",
    "streak_status": "active",
    "next_milestone": {
      "days": 14,
      "name": "Fortnight Fighter",
      "badge": "⚡",
      "days_remaining": 2
    },
    "streak_multiplier": 1.1
  },
  "achievements_unlocked": 8,
  "total_achievements": 15,
  "badges": ["🌱", "🔥", "✨", "📚"]
}
```

### GET /gamification/achievements/{user_id}
Get all achievements with unlock status.

**Query Parameters:**
- `category` (optional): Filter by category (streak, skill, social, milestone)
- `unlocked_only` (optional): Only show unlocked achievements

**Response:** `200 OK`
```json
[
  {
    "id": "streak_7",
    "name": "Week Warrior",
    "description": "Maintain a 7-day learning streak",
    "badge": "🔥",
    "category": "streak",
    "rarity": "common",
    "xp_reward": 150,
    "unlocked": true,
    "unlocked_at": "2025-01-08T10:00:00Z",
    "progress": 1.0,
    "requirement": "7 consecutive days"
  }
]
```

### POST /gamification/xp/award
Award XP to a user.

**Request Body:**
```json
{
  "user_id": "uuid",
  "xp_amount": 50,
  "event_type": "exercise_completed",
  "source": "loops_exercise_1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "xp_awarded": 55,
  "total_xp": 2505,
  "level": 8,
  "level_up": false,
  "new_achievements": []
}
```

### POST /gamification/streak/update/{user_id}
Update user's learning streak.

**Response:** `200 OK`
```json
{
  "streak": 13,
  "longest_streak": 23,
  "status": "incremented",
  "new_achievements": [
    {"name": "Fortnight Fighter", "badge": "⚡", "xp": 300}
  ]
}
```

### GET /gamification/leaderboard
Get XP leaderboard.

**Query Parameters:**
- `timeframe`: daily, weekly, monthly, all_time
- `limit`: Number of results (default: 10)

**Response:** `200 OK`
```json
[
  {
    "rank": 1,
    "user_id": "uuid",
    "username": "learner_abc123",
    "total_xp": 5000,
    "level": 12,
    "streak": 30,
    "badges_count": 15
  }
]
```

### GET /gamification/badges/showcase/{user_id}
Get user's badge showcase.

**Response:** `200 OK`
```json
{
  "user_id": "uuid",
  "total_badges": 8,
  "badges_by_category": {
    "streak": [{"badge": "🔥", "name": "Week Warrior", "rarity": "common"}],
    "skill": [{"badge": "✨", "name": "Perfect Score", "rarity": "common"}]
  },
  "featured_badges": [...],
  "rarity_counts": {
    "common": 5,
    "rare": 2,
    "epic": 1,
    "legendary": 0
  }
}
```

---

## Social Learning API

### POST /social/challenges
Create a peer challenge.

**Request Body:**
```json
{
  "challenger_id": "uuid",
  "challenged_id": "uuid",
  "challenge_type": "speed_coding",
  "topic": "loops",
  "difficulty": "intermediate"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "challenger_id": "uuid",
  "challenged_id": "uuid",
  "challenge_type": "speed_coding",
  "topic": "loops",
  "difficulty": "intermediate",
  "status": "pending",
  "xp_reward": 100,
  "expires_at": "2025-01-18T10:00:00Z"
}
```

### GET /social/challenges/{user_id}
Get challenges for a user.

**Query Parameters:**
- `status`: Filter by status (pending, active, completed)
- `as_challenger`: Include challenges where user is challenger
- `as_challenged`: Include challenges where user is challenged

### POST /social/challenges/{challenge_id}/accept
Accept a peer challenge.

### POST /social/challenges/{challenge_id}/submit
Submit challenge result.

**Query Parameters:**
- `user_id`: User submitting
- `score`: Score achieved

### POST /social/solutions/share
Share a solution with the community.

**Request Body:**
```json
{
  "user_id": "uuid",
  "exercise_id": "uuid",
  "code": "def solution():\n    return 42",
  "language": "python",
  "description": "Clean recursive approach",
  "tags": ["recursion", "elegant"]
}
```

### GET /social/solutions
Get shared solutions.

**Query Parameters:**
- `exercise_id`: Filter by exercise
- `user_id`: Filter by user
- `featured_only`: Only featured solutions
- `sort_by`: recent, popular, helpful

### POST /social/solutions/{solution_id}/like
Like a shared solution.

### POST /social/solutions/{solution_id}/comment
Add a comment to a solution.

### GET /social/solutions/{solution_id}/comments
Get comments for a solution.

### POST /social/groups
Create a study group.

**Request Body:**
```json
{
  "name": "React Learners",
  "description": "Learning React together",
  "topic": "react",
  "creator_id": "uuid",
  "max_members": 10,
  "is_public": true,
  "weekly_goal": 5
}
```

### GET /social/groups
Get available study groups.

### POST /social/groups/{group_id}/join
Join a study group.

### GET /social/groups/{group_id}/progress
Get progress for all group members.

### POST /social/follow/{target_user_id}
Follow another learner.

### GET /social/following/{user_id}
Get list of followed users.

### GET /social/feed/{user_id}
Get activity feed from followed users.

**Response:** `200 OK`
```json
[
  {
    "type": "solution_shared",
    "user_id": "uuid",
    "content": "Shared a solution for exercise loops_1",
    "timestamp": "2025-01-11T10:00:00Z",
    "data": {"solution_id": "uuid"}
  },
  {
    "type": "challenge_won",
    "user_id": "uuid",
    "content": "Won a speed_coding challenge!",
    "timestamp": "2025-01-10T15:00:00Z",
    "data": {"challenge_id": "uuid"}
  }
]
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": "code",
      "issue": "Code cannot be empty"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 60 requests/minute |
| Code submissions | 10 submissions/minute |
| Exercise generation | 5 requests/minute |

---

## WebSocket Events (Future)

```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:8000/ws');

// Events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'progress_update':
      // Handle progress update
      break;
    case 'feedback_ready':
      // Handle feedback notification
      break;
  }
};
```
