---
name: Learning Streak Notifier
description: Track and celebrate learning streaks with gamification elements
trigger: on-submission
event: exercise_completed
enabled: true
---

# Learning Streak Notifier Hook

This hook tracks learner engagement and celebrates milestones to boost motivation.

## Trigger Conditions

- Fires when a learner completes an exercise
- Tracks consecutive days of learning activity
- Monitors achievement progress

## Streak Tracking Logic

```python
class StreakTracker:
    """Track learning streaks and achievements."""
    
    STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365]
    
    async def on_exercise_completed(self, user_id: str, exercise_id: str):
        """Handle exercise completion event."""
        # Update streak
        streak = await self.update_streak(user_id)
        
        # Check for milestones
        achievements = await self.check_achievements(user_id, streak)
        
        # Generate notifications
        notifications = self.generate_notifications(streak, achievements)
        
        return notifications
    
    async def update_streak(self, user_id: str) -> int:
        """Update user's learning streak."""
        last_activity = await self.get_last_activity(user_id)
        today = datetime.utcnow().date()
        
        if last_activity == today - timedelta(days=1):
            # Consecutive day - increment streak
            return await self.increment_streak(user_id)
        elif last_activity == today:
            # Same day - maintain streak
            return await self.get_current_streak(user_id)
        else:
            # Streak broken - reset to 1
            return await self.reset_streak(user_id)
```

## Achievement System

### Streak Achievements
| Achievement | Requirement | XP Reward | Badge |
|-------------|-------------|-----------|-------|
| First Steps | 3-day streak | 50 XP | 🌱 |
| Week Warrior | 7-day streak | 150 XP | 🔥 |
| Fortnight Fighter | 14-day streak | 300 XP | ⚡ |
| Monthly Master | 30-day streak | 750 XP | 🏆 |
| Dedication Champion | 60-day streak | 1500 XP | 💎 |
| Century Club | 100-day streak | 3000 XP | 👑 |
| Year of Code | 365-day streak | 10000 XP | 🌟 |

### Skill Achievements
| Achievement | Requirement | XP Reward | Badge |
|-------------|-------------|-----------|-------|
| Quick Learner | Complete 5 exercises in one session | 100 XP | ⚡ |
| Perfect Score | Pass exercise on first attempt | 25 XP | ✨ |
| Topic Master | Complete all exercises in a topic | 500 XP | 📚 |
| Bug Hunter | Fix 10 failing test cases | 200 XP | 🐛 |
| Code Reviewer | Review 5 peer submissions | 150 XP | 👀 |

## Notification Templates

### Streak Milestone
```json
{
  "type": "streak_milestone",
  "title": "🔥 {streak_days}-Day Streak!",
  "message": "Amazing dedication! You've been learning for {streak_days} days straight.",
  "achievement": {
    "name": "{achievement_name}",
    "badge": "{badge_emoji}",
    "xp_earned": {xp_amount}
  },
  "encouragement": "{personalized_message}",
  "next_milestone": {
    "days": {next_milestone_days},
    "achievement": "{next_achievement_name}"
  }
}
```

### Streak at Risk
```json
{
  "type": "streak_reminder",
  "title": "⏰ Don't Break Your Streak!",
  "message": "You have {hours_remaining} hours to complete an exercise and maintain your {current_streak}-day streak.",
  "quick_exercise": {
    "id": "{exercise_id}",
    "title": "{exercise_title}",
    "estimated_time": "5 minutes"
  },
  "motivation": "You're so close to {next_milestone}!"
}
```

### Achievement Unlocked
```json
{
  "type": "achievement_unlocked",
  "title": "🏆 Achievement Unlocked!",
  "achievement": {
    "name": "{achievement_name}",
    "description": "{achievement_description}",
    "badge": "{badge_emoji}",
    "xp_earned": {xp_amount},
    "rarity": "{common|rare|epic|legendary}"
  },
  "total_xp": {user_total_xp},
  "level": {user_level},
  "share_options": ["twitter", "linkedin", "copy_link"]
}
```

## Example Notifications

### 7-Day Streak
```
🔥 7-Day Streak Achieved!

Congratulations! You've been coding every day for a week.
That's the kind of consistency that builds real skills!

Achievement Unlocked: Week Warrior ⚡
+150 XP earned

Your Progress:
████████░░ 70% to Monthly Master (30 days)

Keep it up! Just 23 more days to unlock the Monthly Master badge.

[Continue Learning] [Share Achievement]
```

### Streak at Risk
```
⏰ Your 12-Day Streak is at Risk!

You have 4 hours left to complete an exercise today.
Don't let your hard work go to waste!

Quick Exercise Available:
📝 "Variable Basics Review" (5 min)

You're just 2 days away from the Fortnight Fighter achievement!

[Start Quick Exercise] [Remind Me Later]
```

## Integration Points

### API Endpoints
```python
# GET /api/v1/gamification/streak/{user_id}
{
  "current_streak": 12,
  "longest_streak": 23,
  "last_activity": "2025-01-11T10:30:00Z",
  "streak_status": "active",
  "next_milestone": {
    "days": 14,
    "name": "Fortnight Fighter"
  }
}

# GET /api/v1/gamification/achievements/{user_id}
{
  "unlocked": [...],
  "in_progress": [...],
  "total_xp": 2450,
  "level": 8,
  "next_level_xp": 3000
}
```

### Event Bus Integration
```python
# Subscribe to exercise completion events
@event_handler("exercise.completed")
async def handle_exercise_completed(event: ExerciseCompletedEvent):
    notifier = LearningStreakNotifier()
    notifications = await notifier.process(event.user_id, event.exercise_id)
    
    for notification in notifications:
        await notification_service.send(event.user_id, notification)
```

## Configuration

```yaml
# .kiro/hooks/config.yaml
learning-streak-notifier:
  enabled: true
  
  notifications:
    streak_milestone: true
    streak_at_risk: true
    achievement_unlocked: true
    
  reminder_hours_before_midnight: 4
  
  channels:
    - in_app
    - email  # Optional
    - push   # Optional
    
  xp_multipliers:
    weekend_bonus: 1.5
    streak_bonus_per_week: 0.1  # +10% per week of streak
```
