"""
Social Learning API Router.

Provides endpoints for peer challenges, code sharing, and collaborative learning.
Implements social features to enhance engagement through community interaction.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field


router = APIRouter(prefix="/social", tags=["social"])


# ============================================================================
# Enums and Models
# ============================================================================

class ChallengeStatus(str, Enum):
    """Challenge status."""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    DECLINED = "declined"


class ChallengeType(str, Enum):
    """Types of peer challenges."""
    SPEED_CODING = "speed_coding"  # Complete exercise fastest
    CODE_GOLF = "code_golf"  # Shortest solution
    BEST_PRACTICES = "best_practices"  # Highest code quality score
    STREAK_RACE = "streak_race"  # Longest streak in timeframe


class PeerChallenge(BaseModel):
    """Peer challenge model."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    challenger_id: str
    challenged_id: str
    challenge_type: ChallengeType
    exercise_id: Optional[str] = None
    topic: str
    difficulty: str
    status: ChallengeStatus = ChallengeStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=7))
    challenger_score: Optional[float] = None
    challenged_score: Optional[float] = None
    winner_id: Optional[str] = None
    xp_reward: int = 100


class SharedSolution(BaseModel):
    """Shared code solution."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    exercise_id: str
    code: str
    language: str
    description: Optional[str] = None
    likes: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_featured: bool = False
    tags: List[str] = []


class Comment(BaseModel):
    """Comment on shared solution."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    solution_id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = 0
    is_helpful: bool = False


class StudyGroup(BaseModel):
    """Study group for collaborative learning."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    topic: str
    creator_id: str
    members: List[str] = []
    max_members: int = 10
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_public: bool = True
    weekly_goal: Optional[int] = None  # Exercises per week


class CreateChallengeRequest(BaseModel):
    """Request to create a peer challenge."""
    challenger_id: str
    challenged_id: str
    challenge_type: ChallengeType
    topic: str
    difficulty: str = "intermediate"


class ShareSolutionRequest(BaseModel):
    """Request to share a solution."""
    user_id: str
    exercise_id: str
    code: str
    language: str
    description: Optional[str] = None
    tags: List[str] = []


class CreateStudyGroupRequest(BaseModel):
    """Request to create a study group."""
    name: str
    description: str
    topic: str
    creator_id: str
    max_members: int = 10
    is_public: bool = True
    weekly_goal: Optional[int] = None


# ============================================================================
# In-Memory Storage (for demo)
# ============================================================================

_challenges: Dict[str, PeerChallenge] = {}
_shared_solutions: Dict[str, SharedSolution] = {}
_comments: Dict[str, List[Comment]] = {}
_study_groups: Dict[str, StudyGroup] = {}
_user_follows: Dict[str, List[str]] = {}  # user_id -> list of followed user_ids


# ============================================================================
# Peer Challenges Endpoints
# ============================================================================

@router.post("/challenges", response_model=PeerChallenge)
async def create_challenge(request: CreateChallengeRequest) -> PeerChallenge:
    """
    Create a peer challenge.
    
    Challenge another learner to compete on an exercise.
    """
    challenge = PeerChallenge(
        challenger_id=request.challenger_id,
        challenged_id=request.challenged_id,
        challenge_type=request.challenge_type,
        topic=request.topic,
        difficulty=request.difficulty,
        xp_reward=_calculate_challenge_xp(request.challenge_type, request.difficulty)
    )
    
    _challenges[challenge.id] = challenge
    return challenge


@router.get("/challenges/{user_id}", response_model=List[PeerChallenge])
async def get_user_challenges(
    user_id: str,
    status: Optional[ChallengeStatus] = None,
    as_challenger: bool = True,
    as_challenged: bool = True
) -> List[PeerChallenge]:
    """
    Get challenges for a user.
    
    Filter by status and role (challenger/challenged).
    """
    challenges = []
    for challenge in _challenges.values():
        if status and challenge.status != status:
            continue
        
        is_challenger = challenge.challenger_id == user_id
        is_challenged = challenge.challenged_id == user_id
        
        if (as_challenger and is_challenger) or (as_challenged and is_challenged):
            challenges.append(challenge)
    
    return sorted(challenges, key=lambda c: c.created_at, reverse=True)


@router.post("/challenges/{challenge_id}/accept")
async def accept_challenge(challenge_id: str, user_id: str) -> Dict[str, Any]:
    """Accept a peer challenge."""
    if challenge_id not in _challenges:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge = _challenges[challenge_id]
    
    if challenge.challenged_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this challenge")
    
    if challenge.status != ChallengeStatus.PENDING:
        raise HTTPException(status_code=400, detail="Challenge is not pending")
    
    challenge.status = ChallengeStatus.ACTIVE
    
    return {
        "success": True,
        "challenge_id": challenge_id,
        "status": "active",
        "message": "Challenge accepted! Complete the exercise to compete."
    }


@router.post("/challenges/{challenge_id}/submit")
async def submit_challenge_result(
    challenge_id: str,
    user_id: str,
    score: float
) -> Dict[str, Any]:
    """Submit a challenge result."""
    if challenge_id not in _challenges:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge = _challenges[challenge_id]
    
    if challenge.status != ChallengeStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Challenge is not active")
    
    # Record score
    if user_id == challenge.challenger_id:
        challenge.challenger_score = score
    elif user_id == challenge.challenged_id:
        challenge.challenged_score = score
    else:
        raise HTTPException(status_code=403, detail="Not a participant in this challenge")
    
    # Check if both have submitted
    result = {"success": True, "your_score": score}
    
    if challenge.challenger_score is not None and challenge.challenged_score is not None:
        challenge.status = ChallengeStatus.COMPLETED
        
        # Determine winner based on challenge type
        if challenge.challenge_type == ChallengeType.CODE_GOLF:
            # Lower is better for code golf
            if challenge.challenger_score < challenge.challenged_score:
                challenge.winner_id = challenge.challenger_id
            else:
                challenge.winner_id = challenge.challenged_id
        else:
            # Higher is better for other types
            if challenge.challenger_score > challenge.challenged_score:
                challenge.winner_id = challenge.challenger_id
            else:
                challenge.winner_id = challenge.challenged_id
        
        result["completed"] = True
        result["winner_id"] = challenge.winner_id
        result["you_won"] = challenge.winner_id == user_id
        result["xp_earned"] = challenge.xp_reward if challenge.winner_id == user_id else challenge.xp_reward // 2
    
    return result


@router.get("/challenges/leaderboard")
async def get_challenge_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """Get challenge wins leaderboard."""
    wins: Dict[str, int] = {}
    
    for challenge in _challenges.values():
        if challenge.status == ChallengeStatus.COMPLETED and challenge.winner_id:
            wins[challenge.winner_id] = wins.get(challenge.winner_id, 0) + 1
    
    sorted_users = sorted(wins.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    return [
        {"rank": i + 1, "user_id": uid, "wins": w}
        for i, (uid, w) in enumerate(sorted_users)
    ]


# ============================================================================
# Solution Sharing Endpoints
# ============================================================================

@router.post("/solutions/share", response_model=SharedSolution)
async def share_solution(request: ShareSolutionRequest) -> SharedSolution:
    """
    Share a solution with the community.
    
    Other learners can view, like, and comment on shared solutions.
    """
    solution = SharedSolution(
        user_id=request.user_id,
        exercise_id=request.exercise_id,
        code=request.code,
        language=request.language,
        description=request.description,
        tags=request.tags
    )
    
    _shared_solutions[solution.id] = solution
    _comments[solution.id] = []
    
    return solution


@router.get("/solutions", response_model=List[SharedSolution])
async def get_shared_solutions(
    exercise_id: Optional[str] = None,
    user_id: Optional[str] = None,
    featured_only: bool = False,
    sort_by: str = Query("recent", pattern="^(recent|popular|helpful)$"),
    limit: int = Query(20, ge=1, le=100)
) -> List[SharedSolution]:
    """
    Get shared solutions with filtering and sorting.
    """
    solutions = list(_shared_solutions.values())
    
    # Filter
    if exercise_id:
        solutions = [s for s in solutions if s.exercise_id == exercise_id]
    if user_id:
        solutions = [s for s in solutions if s.user_id == user_id]
    if featured_only:
        solutions = [s for s in solutions if s.is_featured]
    
    # Sort
    if sort_by == "recent":
        solutions.sort(key=lambda s: s.created_at, reverse=True)
    elif sort_by == "popular":
        solutions.sort(key=lambda s: s.likes, reverse=True)
    elif sort_by == "helpful":
        solutions.sort(key=lambda s: s.comments_count, reverse=True)
    
    return solutions[:limit]


@router.post("/solutions/{solution_id}/like")
async def like_solution(solution_id: str, user_id: str) -> Dict[str, Any]:
    """Like a shared solution."""
    if solution_id not in _shared_solutions:
        raise HTTPException(status_code=404, detail="Solution not found")
    
    _shared_solutions[solution_id].likes += 1
    
    return {
        "success": True,
        "likes": _shared_solutions[solution_id].likes
    }


@router.post("/solutions/{solution_id}/comment", response_model=Comment)
async def add_comment(
    solution_id: str,
    user_id: str,
    content: str
) -> Comment:
    """Add a comment to a shared solution."""
    if solution_id not in _shared_solutions:
        raise HTTPException(status_code=404, detail="Solution not found")
    
    comment = Comment(
        solution_id=solution_id,
        user_id=user_id,
        content=content
    )
    
    _comments[solution_id].append(comment)
    _shared_solutions[solution_id].comments_count += 1
    
    return comment


@router.get("/solutions/{solution_id}/comments", response_model=List[Comment])
async def get_comments(solution_id: str) -> List[Comment]:
    """Get comments for a solution."""
    if solution_id not in _comments:
        raise HTTPException(status_code=404, detail="Solution not found")
    
    return _comments[solution_id]


# ============================================================================
# Study Groups Endpoints
# ============================================================================

@router.post("/groups", response_model=StudyGroup)
async def create_study_group(request: CreateStudyGroupRequest) -> StudyGroup:
    """
    Create a study group for collaborative learning.
    """
    group = StudyGroup(
        name=request.name,
        description=request.description,
        topic=request.topic,
        creator_id=request.creator_id,
        members=[request.creator_id],
        max_members=request.max_members,
        is_public=request.is_public,
        weekly_goal=request.weekly_goal
    )
    
    _study_groups[group.id] = group
    return group


@router.get("/groups", response_model=List[StudyGroup])
async def get_study_groups(
    topic: Optional[str] = None,
    public_only: bool = True
) -> List[StudyGroup]:
    """Get available study groups."""
    groups = list(_study_groups.values())
    
    if topic:
        groups = [g for g in groups if g.topic.lower() == topic.lower()]
    if public_only:
        groups = [g for g in groups if g.is_public]
    
    return groups


@router.post("/groups/{group_id}/join")
async def join_study_group(group_id: str, user_id: str) -> Dict[str, Any]:
    """Join a study group."""
    if group_id not in _study_groups:
        raise HTTPException(status_code=404, detail="Group not found")
    
    group = _study_groups[group_id]
    
    if user_id in group.members:
        raise HTTPException(status_code=400, detail="Already a member")
    
    if len(group.members) >= group.max_members:
        raise HTTPException(status_code=400, detail="Group is full")
    
    group.members.append(user_id)
    
    return {
        "success": True,
        "group_id": group_id,
        "members_count": len(group.members)
    }


@router.get("/groups/{group_id}/progress")
async def get_group_progress(group_id: str) -> Dict[str, Any]:
    """Get progress for all members in a study group."""
    if group_id not in _study_groups:
        raise HTTPException(status_code=404, detail="Group not found")
    
    group = _study_groups[group_id]
    
    # Mock progress data
    member_progress = []
    for member_id in group.members:
        member_progress.append({
            "user_id": member_id,
            "exercises_this_week": 5,  # Would come from actual data
            "streak": 7,
            "contribution_score": 85
        })
    
    return {
        "group_id": group_id,
        "group_name": group.name,
        "weekly_goal": group.weekly_goal,
        "members": member_progress,
        "group_average": sum(m["exercises_this_week"] for m in member_progress) / len(member_progress) if member_progress else 0
    }


# ============================================================================
# Follow System Endpoints
# ============================================================================

@router.post("/follow/{target_user_id}")
async def follow_user(user_id: str, target_user_id: str) -> Dict[str, Any]:
    """Follow another learner."""
    if user_id not in _user_follows:
        _user_follows[user_id] = []
    
    if target_user_id in _user_follows[user_id]:
        raise HTTPException(status_code=400, detail="Already following")
    
    _user_follows[user_id].append(target_user_id)
    
    return {"success": True, "following": target_user_id}


@router.get("/following/{user_id}")
async def get_following(user_id: str) -> List[str]:
    """Get list of users being followed."""
    return _user_follows.get(user_id, [])


@router.get("/feed/{user_id}")
async def get_activity_feed(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get activity feed from followed users.
    
    Shows recent solutions, achievements, and challenge results.
    """
    following = _user_follows.get(user_id, [])
    
    feed = []
    
    # Get solutions from followed users
    for solution in _shared_solutions.values():
        if solution.user_id in following:
            feed.append({
                "type": "solution_shared",
                "user_id": solution.user_id,
                "content": f"Shared a solution for exercise {solution.exercise_id}",
                "timestamp": solution.created_at,
                "data": {"solution_id": solution.id}
            })
    
    # Get challenge completions
    for challenge in _challenges.values():
        if challenge.status == ChallengeStatus.COMPLETED:
            if challenge.winner_id in following:
                feed.append({
                    "type": "challenge_won",
                    "user_id": challenge.winner_id,
                    "content": f"Won a {challenge.challenge_type.value} challenge!",
                    "timestamp": challenge.created_at,
                    "data": {"challenge_id": challenge.id}
                })
    
    # Sort by timestamp
    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return feed[:limit]


# ============================================================================
# Helper Functions
# ============================================================================

def _calculate_challenge_xp(challenge_type: ChallengeType, difficulty: str) -> int:
    """Calculate XP reward for a challenge."""
    base_xp = {
        ChallengeType.SPEED_CODING: 100,
        ChallengeType.CODE_GOLF: 150,
        ChallengeType.BEST_PRACTICES: 200,
        ChallengeType.STREAK_RACE: 250
    }
    
    difficulty_multiplier = {
        "beginner": 0.5,
        "intermediate": 1.0,
        "advanced": 1.5,
        "expert": 2.0
    }
    
    return int(base_xp.get(challenge_type, 100) * difficulty_multiplier.get(difficulty, 1.0))
