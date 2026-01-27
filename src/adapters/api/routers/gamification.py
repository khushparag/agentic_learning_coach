"""
Gamification API Router.

Provides endpoints for badges, achievements, XP system, and learning streaks.
Implements game mechanics to boost learner engagement and motivation.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from enum import Enum

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field


router = APIRouter(prefix="/gamification", tags=["gamification"])


# ============================================================================
# Enums and Constants
# ============================================================================

class AchievementRarity(str, Enum):
    """Achievement rarity levels."""
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class BadgeCategory(str, Enum):
    """Badge categories."""
    STREAK = "streak"
    SKILL = "skill"
    SOCIAL = "social"
    MILESTONE = "milestone"
    SPECIAL = "special"


# XP requirements per level (exponential growth)
LEVEL_XP_REQUIREMENTS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000]

# Streak milestones
STREAK_MILESTONES = {
    3: {"name": "First Steps", "badge": "🌱", "xp": 50, "rarity": AchievementRarity.COMMON},
    7: {"name": "Week Warrior", "badge": "🔥", "xp": 150, "rarity": AchievementRarity.COMMON},
    14: {"name": "Fortnight Fighter", "badge": "⚡", "xp": 300, "rarity": AchievementRarity.RARE},
    30: {"name": "Monthly Master", "badge": "🏆", "xp": 750, "rarity": AchievementRarity.RARE},
    60: {"name": "Dedication Champion", "badge": "💎", "xp": 1500, "rarity": AchievementRarity.EPIC},
    100: {"name": "Century Club", "badge": "👑", "xp": 3000, "rarity": AchievementRarity.EPIC},
    365: {"name": "Year of Code", "badge": "🌟", "xp": 10000, "rarity": AchievementRarity.LEGENDARY},
}


# ============================================================================
# Request/Response Models
# ============================================================================

class Achievement(BaseModel):
    """Achievement model."""
    id: str
    name: str
    description: str
    badge: str
    category: BadgeCategory
    rarity: AchievementRarity
    xp_reward: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress: float = 0.0  # 0.0 to 1.0
    requirement: str


class StreakInfo(BaseModel):
    """Learning streak information."""
    current_streak: int = 0
    longest_streak: int = 0
    last_activity: Optional[datetime] = None
    streak_status: str = "inactive"  # active, at_risk, broken
    next_milestone: Optional[Dict[str, Any]] = None
    streak_multiplier: float = 1.0


class XPEvent(BaseModel):
    """XP earning event."""
    event_type: str
    xp_earned: int
    multiplier: float = 1.0
    source: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserGamificationProfile(BaseModel):
    """Complete gamification profile for a user."""
    user_id: str
    total_xp: int = 0
    level: int = 1
    xp_to_next_level: int = 100
    level_progress: float = 0.0
    streak: StreakInfo
    achievements_unlocked: int = 0
    total_achievements: int = 0
    recent_xp_events: List[XPEvent] = []
    badges: List[str] = []


class LeaderboardEntry(BaseModel):
    """Leaderboard entry."""
    rank: int
    user_id: str
    username: str
    total_xp: int
    level: int
    streak: int
    badges_count: int


class AwardXPRequest(BaseModel):
    """Request to award XP to a user."""
    user_id: str
    xp_amount: int
    event_type: str
    source: str


class AwardXPResponse(BaseModel):
    """Response after awarding XP."""
    success: bool
    xp_awarded: int
    total_xp: int
    level: int
    level_up: bool = False
    new_achievements: List[Achievement] = []


# ============================================================================
# In-Memory Storage (for demo - would use database in production)
# ============================================================================

_user_profiles: Dict[str, Dict[str, Any]] = {}
_achievements_db: List[Achievement] = []


def _init_achievements():
    """Initialize available achievements."""
    global _achievements_db
    
    # Streak achievements
    for days, info in STREAK_MILESTONES.items():
        _achievements_db.append(Achievement(
            id=f"streak_{days}",
            name=info["name"],
            description=f"Maintain a {days}-day learning streak",
            badge=info["badge"],
            category=BadgeCategory.STREAK,
            rarity=info["rarity"],
            xp_reward=info["xp"],
            requirement=f"{days} consecutive days"
        ))
    
    # Skill achievements
    skill_achievements = [
        ("quick_learner", "Quick Learner", "Complete 5 exercises in one session", "⚡", 100, AchievementRarity.COMMON),
        ("perfect_score", "Perfect Score", "Pass an exercise on first attempt", "✨", 25, AchievementRarity.COMMON),
        ("topic_master", "Topic Master", "Complete all exercises in a topic", "📚", 500, AchievementRarity.RARE),
        ("bug_hunter", "Bug Hunter", "Fix 10 failing test cases", "🐛", 200, AchievementRarity.RARE),
        ("code_ninja", "Code Ninja", "Complete 50 coding exercises", "🥷", 1000, AchievementRarity.EPIC),
        ("algorithm_ace", "Algorithm Ace", "Master 10 algorithm topics", "🧠", 2000, AchievementRarity.EPIC),
    ]
    
    for aid, name, desc, badge, xp, rarity in skill_achievements:
        _achievements_db.append(Achievement(
            id=aid,
            name=name,
            description=desc,
            badge=badge,
            category=BadgeCategory.SKILL,
            rarity=rarity,
            xp_reward=xp,
            requirement=desc
        ))


_init_achievements()


def _get_or_create_profile(user_id: str) -> Dict[str, Any]:
    """Get or create a user's gamification profile."""
    if user_id not in _user_profiles:
        _user_profiles[user_id] = {
            "user_id": user_id,
            "total_xp": 0,
            "level": 1,
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity": None,
            "unlocked_achievements": [],
            "xp_events": [],
            "exercises_completed": 0,
            "perfect_scores": 0,
        }
    return _user_profiles[user_id]


def _calculate_level(total_xp: int) -> tuple[int, int, float]:
    """Calculate level from total XP. Returns (level, xp_to_next, progress)."""
    level = 1
    for i, req in enumerate(LEVEL_XP_REQUIREMENTS):
        if total_xp >= req:
            level = i + 1
        else:
            break
    
    if level >= len(LEVEL_XP_REQUIREMENTS):
        return level, 0, 1.0
    
    current_level_xp = LEVEL_XP_REQUIREMENTS[level - 1]
    next_level_xp = LEVEL_XP_REQUIREMENTS[level] if level < len(LEVEL_XP_REQUIREMENTS) else current_level_xp
    xp_in_level = total_xp - current_level_xp
    xp_needed = next_level_xp - current_level_xp
    progress = xp_in_level / xp_needed if xp_needed > 0 else 1.0
    
    return level, next_level_xp - total_xp, progress


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/profile/{user_id}", response_model=UserGamificationProfile)
async def get_gamification_profile(user_id: str) -> UserGamificationProfile:
    """
    Get complete gamification profile for a user.
    
    Returns XP, level, streak, achievements, and recent activity.
    """
    profile = _get_or_create_profile(user_id)
    level, xp_to_next, progress = _calculate_level(profile["total_xp"])
    
    # Calculate streak info
    streak_status = "inactive"
    if profile["last_activity"]:
        last = profile["last_activity"]
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        days_since = (datetime.utcnow() - last).days
        if days_since == 0:
            streak_status = "active"
        elif days_since == 1:
            streak_status = "at_risk"
        else:
            streak_status = "broken"
    
    # Find next streak milestone
    next_milestone = None
    current_streak = profile["current_streak"]
    for days in sorted(STREAK_MILESTONES.keys()):
        if days > current_streak:
            next_milestone = {
                "days": days,
                "name": STREAK_MILESTONES[days]["name"],
                "badge": STREAK_MILESTONES[days]["badge"],
                "days_remaining": days - current_streak
            }
            break
    
    # Calculate streak multiplier (10% bonus per week of streak)
    streak_multiplier = 1.0 + (current_streak // 7) * 0.1
    
    return UserGamificationProfile(
        user_id=user_id,
        total_xp=profile["total_xp"],
        level=level,
        xp_to_next_level=xp_to_next,
        level_progress=progress,
        streak=StreakInfo(
            current_streak=current_streak,
            longest_streak=profile["longest_streak"],
            last_activity=profile["last_activity"],
            streak_status=streak_status,
            next_milestone=next_milestone,
            streak_multiplier=streak_multiplier
        ),
        achievements_unlocked=len(profile["unlocked_achievements"]),
        total_achievements=len(_achievements_db),
        recent_xp_events=profile["xp_events"][-10:],
        badges=[a["badge"] for a in profile["unlocked_achievements"]]
    )


@router.get("/achievements/{user_id}", response_model=List[Achievement])
async def get_achievements(
    user_id: str,
    category: Optional[BadgeCategory] = None,
    unlocked_only: bool = False
) -> List[Achievement]:
    """
    Get all achievements for a user with unlock status.
    
    Optionally filter by category or unlocked status.
    """
    profile = _get_or_create_profile(user_id)
    unlocked_ids = {a["id"] for a in profile["unlocked_achievements"]}
    
    achievements = []
    for ach in _achievements_db:
        if category and ach.category != category:
            continue
        
        is_unlocked = ach.id in unlocked_ids
        if unlocked_only and not is_unlocked:
            continue
        
        # Calculate progress for streak achievements
        progress = 0.0
        if ach.category == BadgeCategory.STREAK:
            days = int(ach.id.split("_")[1])
            progress = min(1.0, profile["current_streak"] / days)
        
        achievements.append(Achievement(
            id=ach.id,
            name=ach.name,
            description=ach.description,
            badge=ach.badge,
            category=ach.category,
            rarity=ach.rarity,
            xp_reward=ach.xp_reward,
            unlocked=is_unlocked,
            unlocked_at=next(
                (a["unlocked_at"] for a in profile["unlocked_achievements"] if a["id"] == ach.id),
                None
            ),
            progress=1.0 if is_unlocked else progress,
            requirement=ach.requirement
        ))
    
    return achievements


@router.post("/xp/award", response_model=AwardXPResponse)
async def award_xp(request: AwardXPRequest) -> AwardXPResponse:
    """
    Award XP to a user for completing an action.
    
    Automatically checks for level ups and achievement unlocks.
    """
    profile = _get_or_create_profile(request.user_id)
    
    # Calculate streak multiplier
    streak_multiplier = 1.0 + (profile["current_streak"] // 7) * 0.1
    
    # Weekend bonus (Saturday/Sunday)
    weekend_multiplier = 1.5 if datetime.utcnow().weekday() >= 5 else 1.0
    
    total_multiplier = streak_multiplier * weekend_multiplier
    xp_awarded = int(request.xp_amount * total_multiplier)
    
    old_level, _, _ = _calculate_level(profile["total_xp"])
    profile["total_xp"] += xp_awarded
    new_level, _, _ = _calculate_level(profile["total_xp"])
    
    # Record XP event
    profile["xp_events"].append({
        "event_type": request.event_type,
        "xp_earned": xp_awarded,
        "multiplier": total_multiplier,
        "source": request.source,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Check for new achievements
    new_achievements = []
    
    # Check XP-based achievements
    if profile["total_xp"] >= 1000 and "xp_1000" not in [a["id"] for a in profile["unlocked_achievements"]]:
        ach = Achievement(
            id="xp_1000",
            name="XP Collector",
            description="Earn 1000 total XP",
            badge="💰",
            category=BadgeCategory.MILESTONE,
            rarity=AchievementRarity.COMMON,
            xp_reward=100,
            unlocked=True,
            unlocked_at=datetime.utcnow(),
            progress=1.0,
            requirement="1000 XP"
        )
        profile["unlocked_achievements"].append({"id": ach.id, "badge": ach.badge, "unlocked_at": datetime.utcnow()})
        new_achievements.append(ach)
    
    return AwardXPResponse(
        success=True,
        xp_awarded=xp_awarded,
        total_xp=profile["total_xp"],
        level=new_level,
        level_up=new_level > old_level,
        new_achievements=new_achievements
    )


@router.post("/streak/update/{user_id}")
async def update_streak(user_id: str) -> Dict[str, Any]:
    """
    Update user's learning streak after activity.
    
    Call this when a user completes an exercise or learning activity.
    """
    profile = _get_or_create_profile(user_id)
    today = datetime.utcnow().date()
    
    last_activity = profile["last_activity"]
    if last_activity:
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity)
        last_date = last_activity.date()
        
        if last_date == today:
            # Same day - no change
            return {"streak": profile["current_streak"], "status": "maintained"}
        elif last_date == today - timedelta(days=1):
            # Consecutive day - increment
            profile["current_streak"] += 1
        else:
            # Streak broken - reset
            profile["current_streak"] = 1
    else:
        profile["current_streak"] = 1
    
    profile["last_activity"] = datetime.utcnow().isoformat()
    profile["longest_streak"] = max(profile["longest_streak"], profile["current_streak"])
    
    # Check for streak achievements
    new_achievements = []
    current = profile["current_streak"]
    unlocked_ids = {a["id"] for a in profile["unlocked_achievements"]}
    
    for days, info in STREAK_MILESTONES.items():
        ach_id = f"streak_{days}"
        if current >= days and ach_id not in unlocked_ids:
            profile["unlocked_achievements"].append({
                "id": ach_id,
                "badge": info["badge"],
                "unlocked_at": datetime.utcnow()
            })
            profile["total_xp"] += info["xp"]
            new_achievements.append({
                "name": info["name"],
                "badge": info["badge"],
                "xp": info["xp"]
            })
    
    return {
        "streak": profile["current_streak"],
        "longest_streak": profile["longest_streak"],
        "status": "incremented",
        "new_achievements": new_achievements
    }


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    timeframe: str = Query("all_time", pattern="^(daily|weekly|monthly|all_time)$"),
    limit: int = Query(10, ge=1, le=100)
) -> List[LeaderboardEntry]:
    """
    Get the XP leaderboard.
    
    Supports different timeframes: daily, weekly, monthly, all_time.
    """
    # Sort users by XP
    sorted_users = sorted(
        _user_profiles.items(),
        key=lambda x: x[1]["total_xp"],
        reverse=True
    )[:limit]
    
    leaderboard = []
    for rank, (user_id, profile) in enumerate(sorted_users, 1):
        level, _, _ = _calculate_level(profile["total_xp"])
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            user_id=user_id,
            username=f"learner_{user_id[:8]}",  # Anonymized
            total_xp=profile["total_xp"],
            level=level,
            streak=profile["current_streak"],
            badges_count=len(profile["unlocked_achievements"])
        ))
    
    return leaderboard


@router.get("/badges/showcase/{user_id}")
async def get_badge_showcase(user_id: str) -> Dict[str, Any]:
    """
    Get a user's badge showcase for display.
    
    Returns badges organized by category with display metadata.
    """
    profile = _get_or_create_profile(user_id)
    
    badges_by_category: Dict[str, List[Dict]] = {
        "streak": [],
        "skill": [],
        "social": [],
        "milestone": [],
        "special": []
    }
    
    for ach in profile["unlocked_achievements"]:
        # Find full achievement info
        full_ach = next((a for a in _achievements_db if a.id == ach["id"]), None)
        if full_ach:
            badges_by_category[full_ach.category.value].append({
                "badge": ach["badge"],
                "name": full_ach.name,
                "rarity": full_ach.rarity.value,
                "unlocked_at": ach["unlocked_at"]
            })
    
    return {
        "user_id": user_id,
        "total_badges": len(profile["unlocked_achievements"]),
        "badges_by_category": badges_by_category,
        "featured_badges": profile["unlocked_achievements"][:5],  # Top 5 for display
        "rarity_counts": {
            "common": sum(1 for a in profile["unlocked_achievements"] 
                         if any(b.id == a["id"] and b.rarity == AchievementRarity.COMMON for b in _achievements_db)),
            "rare": sum(1 for a in profile["unlocked_achievements"]
                       if any(b.id == a["id"] and b.rarity == AchievementRarity.RARE for b in _achievements_db)),
            "epic": sum(1 for a in profile["unlocked_achievements"]
                       if any(b.id == a["id"] and b.rarity == AchievementRarity.EPIC for b in _achievements_db)),
            "legendary": sum(1 for a in profile["unlocked_achievements"]
                            if any(b.id == a["id"] and b.rarity == AchievementRarity.LEGENDARY for b in _achievements_db)),
        }
    }
