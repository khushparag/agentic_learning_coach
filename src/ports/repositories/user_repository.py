"""
User repository interface for the Agentic Learning Coach system.
"""
from abc import ABC, abstractmethod
from typing import Optional, List

from ...domain.entities import UserProfile
from ...domain.value_objects import SkillLevel


class UserRepository(ABC):
    """
    Abstract repository interface for user profile operations.
    
    This interface defines the contract for user profile persistence
    operations following the dependency inversion principle.
    """
    
    @abstractmethod
    async def create_user(self, email: str, name: str) -> UserProfile:
        """
        Create a new user with basic information.
        
        Args:
            email: User's email address
            name: User's display name
            
        Returns:
            UserProfile: The created user profile
            
        Raises:
            ValueError: If email or name is invalid
            DuplicateUserError: If user with email already exists
        """
        pass
    
    @abstractmethod
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """
        Retrieve a user profile by user ID.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            UserProfile or None if not found
        """
        pass
    
    @abstractmethod
    async def get_user_profile_by_email(self, email: str) -> Optional[UserProfile]:
        """
        Retrieve a user profile by email address.
        
        Args:
            email: User's email address
            
        Returns:
            UserProfile or None if not found
        """
        pass
    
    @abstractmethod
    async def update_user_profile(self, profile: UserProfile) -> UserProfile:
        """
        Update an existing user profile.
        
        Args:
            profile: The user profile to update
            
        Returns:
            UserProfile: The updated user profile
            
        Raises:
            UserNotFoundError: If user doesn't exist
        """
        pass
    
    @abstractmethod
    async def update_skill_level(self, user_id: str, skill_level: SkillLevel) -> None:
        """
        Update a user's skill level.
        
        Args:
            user_id: Unique identifier for the user
            skill_level: New skill level
            
        Raises:
            UserNotFoundError: If user doesn't exist
        """
        pass
    
    @abstractmethod
    async def delete_user_profile(self, user_id: str) -> bool:
        """
        Delete a user profile.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def list_users(self, limit: int = 100, offset: int = 0) -> List[UserProfile]:
        """
        List user profiles with pagination.
        
        Args:
            limit: Maximum number of profiles to return
            offset: Number of profiles to skip
            
        Returns:
            List[UserProfile]: List of user profiles
        """
        pass
    
    @abstractmethod
    async def count_users(self) -> int:
        """
        Get the total count of users.
        
        Returns:
            int: Total number of users
        """
        pass