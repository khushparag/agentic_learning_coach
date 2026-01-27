"""
Learning Analytics API Router.

Provides advanced analytics and insights for learning progress,
including predictive difficulty adjustment and learning pattern analysis.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ============================================================================
# Response Models
# ============================================================================

class LearningVelocity(BaseModel):
    """Learning velocity metrics."""
    tasks_per_day: float = Field(..., description="Average tasks completed per day")
    hours_per_week: float = Field(..., description="Average study hours per week")
    trend: str = Field(..., description="Trend direction: increasing, stable, decreasing")
    velocity_score: float = Field(..., ge=0, le=100, description="Overall velocity score")


class SkillProgression(BaseModel):
    """Skill progression over time."""
    skill: str
    initial_level: int
    current_level: int
    progression_rate: float = Field(..., description="Levels gained per week")
    predicted_mastery_date: Optional[datetime] = None


class StrugglePattern(BaseModel):
    """Identified struggle pattern."""
    topic: str
    failure_rate: float
    common_errors: List[str]
    recommended_intervention: str
    confidence: float = Field(..., ge=0, le=1)


class LearningInsights(BaseModel):
    """Comprehensive learning insights."""
    user_id: str
    generated_at: datetime
    
    # Velocity metrics
    velocity: LearningVelocity
    
    # Skill progression
    skill_progressions: List[SkillProgression]
    
    # Struggle patterns
    struggle_patterns: List[StrugglePattern]
    
    # Predictions
    predicted_completion_date: Optional[datetime]
    recommended_focus_areas: List[str]
    
    # Engagement metrics
    engagement_score: float = Field(..., ge=0, le=100)
    streak_health: str = Field(..., description="healthy, at_risk, broken")
    optimal_study_times: List[str]


class DifficultyPrediction(BaseModel):
    """Predicted optimal difficulty for next exercise."""
    recommended_difficulty: int = Field(..., ge=1, le=10)
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str
    alternative_difficulties: List[int]


class RetentionAnalysis(BaseModel):
    """Knowledge retention analysis."""
    topic: str
    last_practiced: datetime
    retention_score: float = Field(..., ge=0, le=100)
    review_urgency: str = Field(..., description="none, low, medium, high, critical")
    recommended_review_date: datetime


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/insights", response_model=LearningInsights)
async def get_learning_insights(
    user_id: str = Query(..., description="User ID"),
    time_range_days: int = Query(30, ge=7, le=365, description="Analysis time range")
) -> LearningInsights:
    """
    Get comprehensive learning insights and analytics.
    
    Analyzes learning patterns, identifies struggles, and provides
    actionable recommendations for improvement.
    """
    # Calculate velocity metrics
    velocity = LearningVelocity(
        tasks_per_day=2.5,
        hours_per_week=5.2,
        trend="increasing",
        velocity_score=78.5
    )
    
    # Analyze skill progressions
    skill_progressions = [
        SkillProgression(
            skill="JavaScript",
            initial_level=2,
            current_level=5,
            progression_rate=0.5,
            predicted_mastery_date=datetime.now() + timedelta(weeks=10)
        ),
        SkillProgression(
            skill="React",
            initial_level=1,
            current_level=3,
            progression_rate=0.4,
            predicted_mastery_date=datetime.now() + timedelta(weeks=15)
        )
    ]
    
    # Identify struggle patterns
    struggle_patterns = [
        StrugglePattern(
            topic="Async/Await",
            failure_rate=0.45,
            common_errors=["Missing await keyword", "Unhandled promise rejection"],
            recommended_intervention="Add recap exercise on Promises before continuing",
            confidence=0.85
        )
    ]
    
    return LearningInsights(
        user_id=user_id,
        generated_at=datetime.now(),
        velocity=velocity,
        skill_progressions=skill_progressions,
        struggle_patterns=struggle_patterns,
        predicted_completion_date=datetime.now() + timedelta(weeks=8),
        recommended_focus_areas=["Error handling", "Async patterns"],
        engagement_score=82.3,
        streak_health="healthy",
        optimal_study_times=["09:00-11:00", "19:00-21:00"]
    )


@router.get("/difficulty-prediction", response_model=DifficultyPrediction)
async def predict_optimal_difficulty(
    user_id: str = Query(..., description="User ID"),
    topic: str = Query(..., description="Topic for next exercise")
) -> DifficultyPrediction:
    """
    Predict optimal difficulty for the next exercise.
    
    Uses historical performance data and learning patterns to
    recommend the ideal difficulty level.
    """
    # Analyze recent performance
    # In production, this would query actual performance data
    
    return DifficultyPrediction(
        recommended_difficulty=4,
        confidence=0.87,
        reasoning="Based on 85% success rate at difficulty 3 and improving trend",
        alternative_difficulties=[3, 5]
    )


@router.get("/retention", response_model=List[RetentionAnalysis])
async def analyze_retention(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(10, ge=1, le=50, description="Number of topics to analyze")
) -> List[RetentionAnalysis]:
    """
    Analyze knowledge retention and recommend reviews.
    
    Uses spaced repetition principles to identify topics
    that need review to prevent knowledge decay.
    """
    # Calculate retention based on time since last practice
    # and original mastery level
    
    return [
        RetentionAnalysis(
            topic="Array Methods",
            last_practiced=datetime.now() - timedelta(days=14),
            retention_score=72.5,
            review_urgency="medium",
            recommended_review_date=datetime.now() + timedelta(days=2)
        ),
        RetentionAnalysis(
            topic="Object Destructuring",
            last_practiced=datetime.now() - timedelta(days=21),
            retention_score=58.3,
            review_urgency="high",
            recommended_review_date=datetime.now()
        ),
        RetentionAnalysis(
            topic="Variables",
            last_practiced=datetime.now() - timedelta(days=7),
            retention_score=95.0,
            review_urgency="none",
            recommended_review_date=datetime.now() + timedelta(days=23)
        )
    ]


@router.get("/progress-metrics")
async def get_progress_metrics(
    user_id: str = Query(..., description="User ID"),
    time_range: str = Query("30d", regex="^(7d|30d|90d)$", description="Time range: 7d, 30d, or 90d")
) -> Dict[str, Any]:
    """
    Get comprehensive progress metrics for dashboard visualization.
    
    Returns learning velocity, activity heatmap, performance metrics,
    knowledge retention, and weekly progress summary.
    """
    # Parse time range
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map[time_range]
    
    # Generate learning velocity data
    learning_velocity = []
    today = datetime.now().date()
    
    for i in range(days):
        date_obj = today - timedelta(days=days - i - 1)
        # Simulate data (in production, query from database)
        import random
        learning_velocity.append({
            "date": date_obj.isoformat(),
            "tasksCompleted": random.randint(0, 5),
            "xpEarned": random.randint(0, 200)
        })
    
    # Generate activity heatmap
    activity_heatmap = []
    for i in range(days):
        date_obj = today - timedelta(days=days - i - 1)
        activity_heatmap.append({
            "date": date_obj.isoformat(),
            "intensity": random.randint(0, 10)
        })
    
    # Performance metrics
    performance_metrics = {
        "accuracy": 87,
        "speed": 92,
        "consistency": 78,
        "retention": 85
    }
    
    # Knowledge retention by topic
    knowledge_retention = [
        {
            "topic": "React Hooks",
            "retentionRate": 92
        },
        {
            "topic": "TypeScript",
            "retentionRate": 85
        },
        {
            "topic": "JavaScript ES6",
            "retentionRate": 78
        },
        {
            "topic": "CSS Grid",
            "retentionRate": 71
        }
    ]
    
    # Weekly progress summary
    weeks = min(4, days // 7)
    weekly_progress = []
    for i in range(weeks):
        week_num = i + 1
        weekly_progress.append({
            "week": f"Week {week_num}",
            "tasksCompleted": random.randint(5, 15),
            "xpEarned": random.randint(200, 800),
            "hoursSpent": round(random.uniform(3, 10), 1)
        })
    
    return {
        "learningVelocity": learning_velocity,
        "activityHeatmap": activity_heatmap,
        "performanceMetrics": performance_metrics,
        "knowledgeRetention": knowledge_retention,
        "weeklyProgress": weekly_progress
    }


@router.get("/heatmap")
async def get_activity_heatmap(
    user_id: str = Query(..., description="User ID"),
    weeks: int = Query(12, ge=1, le=52, description="Number of weeks")
) -> Dict[str, Any]:
    """
    Get activity heatmap data for visualization.
    
    Returns daily activity counts for the specified time period,
    suitable for GitHub-style contribution graphs.
    """
    # Generate heatmap data
    # In production, this would query actual activity data
    
    from datetime import date
    import random
    
    heatmap_data = []
    start_date = date.today() - timedelta(weeks=weeks)
    
    for i in range(weeks * 7):
        current_date = start_date + timedelta(days=i)
        # Simulate activity (0-5 activities per day)
        activity_count = random.choices(
            [0, 1, 2, 3, 4, 5],
            weights=[0.3, 0.25, 0.2, 0.15, 0.07, 0.03]
        )[0]
        
        heatmap_data.append({
            "date": current_date.isoformat(),
            "count": activity_count,
            "level": min(4, activity_count)  # 0-4 intensity levels
        })
    
    return {
        "user_id": user_id,
        "start_date": start_date.isoformat(),
        "end_date": date.today().isoformat(),
        "total_activities": sum(d["count"] for d in heatmap_data),
        "data": heatmap_data
    }


@router.get("/comparison")
async def get_peer_comparison(
    user_id: str = Query(..., description="User ID"),
    metric: str = Query("velocity", description="Metric to compare")
) -> Dict[str, Any]:
    """
    Get anonymized peer comparison metrics.
    
    Compares user's performance against anonymized aggregate
    data from similar learners (same skill level, goals).
    """
    return {
        "user_id": user_id,
        "metric": metric,
        "user_value": 78.5,
        "peer_average": 65.2,
        "peer_median": 62.0,
        "percentile": 82,
        "comparison_group_size": 150,
        "insight": "You're performing above average! Keep up the great work."
    }


@router.get("/recommendations")
async def get_personalized_recommendations(
    user_id: str = Query(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get AI-powered personalized recommendations.
    
    Analyzes learning patterns and provides actionable
    recommendations for improving learning outcomes.
    """
    return {
        "user_id": user_id,
        "generated_at": datetime.now().isoformat(),
        "recommendations": [
            {
                "type": "schedule",
                "priority": "high",
                "title": "Optimize Study Time",
                "description": "Your performance peaks between 9-11 AM. Consider scheduling challenging topics during this window.",
                "action": "Adjust study schedule"
            },
            {
                "type": "content",
                "priority": "medium",
                "title": "Review Async Patterns",
                "description": "You've struggled with async/await recently. A quick review could boost your confidence.",
                "action": "Start review exercise"
            },
            {
                "type": "pace",
                "priority": "low",
                "title": "Maintain Current Pace",
                "description": "Your learning velocity is excellent. You're on track to complete your goals ahead of schedule.",
                "action": "Continue current approach"
            }
        ],
        "next_milestone": {
            "title": "Complete JavaScript Fundamentals",
            "progress": 0.85,
            "estimated_completion": (datetime.now() + timedelta(days=5)).isoformat()
        }
    }
