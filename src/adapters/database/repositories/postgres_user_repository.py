"""
PostgreSQL implementation of the UserRepository interface.
"""
import uuid
from typing import Optional, List
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.domain.entities.user_profile import UserProfile
from src.domain.value_objects.enums import SkillLevel
from src.ports.repositories.user_repository import UserRepository
from src.ports.repositories.base_repository import (
    EntityNotFoundError, DuplicateEntityError, RepositoryError
)
from src.adapters.database.models import User, LearningProfile


class PostgresUserRepository(UserRepository):
    """
    PostgreSQL implementation of the UserRepository interface.
    
    This repository handles user profile persistence operations using
    SQLAlchemy and PostgreSQL as the backend database.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize the repository with a database session.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    async def create_user(self, email: str, name: str, user_id: Optional[str] = None) -> UserProfile:
        """
        Create a new user with basic information.
        
        Args:
            email: User's email address
            name: User's display name (stored as username)
            user_id: Optional user ID to use (must be a valid UUID string)
            
        Returns:
            UserProfile: The created user profile
            
        Raises:
            ValueError: If email or name is invalid
            DuplicateEntityError: If user with email already exists
        """
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")
        
        if not name or not name.strip():
            raise ValueError("Name cannot be empty")
        
        # Parse user_id if provided
        parsed_user_id = None
        if user_id:
            try:
                parsed_user_id = uuid.UUID(user_id)
            except ValueError:
                raise ValueError(f"Invalid user_id format: {user_id}. Must be a valid UUID.")
        
        try:
            # Create user record
            user = User(
                id=parsed_user_id if parsed_user_id else uuid.uuid4(),
                email=email.strip().lower(),
                username=name.strip(),
                password_hash="",  # Will be set by authentication system
            )
            self.session.add(user)
            await self.session.flush()  # Get the user ID
            
            # Create default learning profile
            profile = LearningProfile(
                user_id=user.id,
                skill_level=SkillLevel.BEGINNER,
                learning_goals=[],
                time_constraints={},
                preferences={}
            )
            self.session.add(profile)
            await self.session.commit()
            
            return self._profile_to_domain(profile, user)
            
        except IntegrityError as e:
            await self.session.rollback()
            if "email" in str(e):
                raise DuplicateEntityError("User", "email", email)
            raise RepositoryError(f"Failed to create user: {str(e)}")
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Retrieve a user profile by user ID.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            UserProfile or None if not found
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return None
        
        stmt = (
            select(LearningProfile, User)
            .join(User, LearningProfile.user_id == User.id)
            .where(User.id == user_uuid)
        )
        
        result = await self.session.execute(stmt)
        row = result.first()
        
        if row is None:
            return None
        
        profile, user = row
        return self._profile_to_domain(profile, user)
    
    async def get_user_profile_by_email(self, email: str) -> Optional[UserProfile]:
        """
        Retrieve a user profile by email address.
        
        Args:
            email: User's email address
            
        Returns:
            UserProfile or None if not found
        """
        stmt = (
            select(LearningProfile, User)
            .join(User, LearningProfile.user_id == User.id)
            .where(User.email == email.strip().lower())
        )
        
        result = await self.session.execute(stmt)
        row = result.first()
        
        if row is None:
            return None
        
        profile, user = row
        return self._profile_to_domain(profile, user)
    
    async def update_user_profile(self, profile: UserProfile) -> UserProfile:
        """
        Update an existing user profile.
        
        Args:
            profile: The user profile to update
            
        Returns:
            UserProfile: The updated user profile
            
        Raises:
            EntityNotFoundError: If user doesn't exist
        """
        try:
            user_uuid = uuid.UUID(profile.user_id)
        except ValueError:
            raise EntityNotFoundError("User", profile.user_id)
        
        # Update learning profile
        stmt = (
            update(LearningProfile)
            .where(LearningProfile.user_id == user_uuid)
            .values(
                skill_level=profile.skill_level,
                learning_goals=profile.learning_goals,
                time_constraints=profile.time_constraints,
                preferences=profile.preferences,
                updated_at=func.now()
            )
        )
        
        result = await self.session.execute(stmt)
        
        if result.rowcount == 0:
            raise EntityNotFoundError("User", profile.user_id)
        
        await self.session.commit()
        
        # Return updated profile
        return await self.get_user_profile(profile.user_id)
    
    async def update_skill_level(self, user_id: str, skill_level: SkillLevel) -> None:
        """
        Update a user's skill level.
        
        Args:
            user_id: Unique identifier for the user
            skill_level: New skill level
            
        Raises:
            EntityNotFoundError: If user doesn't exist
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise EntityNotFoundError("User", user_id)
        
        stmt = (
            update(LearningProfile)
            .where(LearningProfile.user_id == user_uuid)
            .values(
                skill_level=skill_level,
                updated_at=func.now()
            )
        )
        
        result = await self.session.execute(stmt)
        
        if result.rowcount == 0:
            raise EntityNotFoundError("User", user_id)
        
        await self.session.commit()
    
    async def delete_user_profile(self, user_id: str) -> bool:
        """
        Delete a user profile.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            return False
        
        # Delete user (cascade will handle profile and related data)
        stmt = delete(User).where(User.id == user_uuid)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    async def list_users(self, limit: int = 100, offset: int = 0) -> List[UserProfile]:
        """
        List user profiles with pagination.
        
        Args:
            limit: Maximum number of profiles to return
            offset: Number of profiles to skip
            
        Returns:
            List[UserProfile]: List of user profiles
        """
        stmt = (
            select(LearningProfile, User)
            .join(User, LearningProfile.user_id == User.id)
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.session.execute(stmt)
        rows = result.all()
        
        return [self._profile_to_domain(profile, user) for profile, user in rows]
    
    async def count_users(self) -> int:
        """
        Get the total count of users.
        
        Returns:
            int: Total number of users
        """
        stmt = select(func.count(User.id))
        result = await self.session.execute(stmt)
        return result.scalar() or 0
    
    def _profile_to_domain(self, profile: LearningProfile, user: User) -> UserProfile:
        """
        Convert database models to domain entity.
        
        Args:
            profile: LearningProfile database model
            user: User database model
            
        Returns:
            UserProfile: Domain entity
        """
        return UserProfile(
            id=str(profile.id),
            user_id=str(user.id),
            skill_level=profile.skill_level,
            learning_goals=profile.learning_goals or [],
            time_constraints=profile.time_constraints or {},
            preferences=profile.preferences or {},
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )