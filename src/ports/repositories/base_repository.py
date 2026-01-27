"""
Base repository interface for the Agentic Learning Coach system.
"""
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List, Any

# Generic type for domain entities
T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository interface defining common CRUD operations.
    
    This interface provides a foundation for all repository implementations
    following the dependency inversion principle and generic patterns.
    """
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        """
        Save an entity (create or update).
        
        Args:
            entity: The entity to save
            
        Returns:
            T: The saved entity
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """
        Retrieve an entity by its unique identifier.
        
        Args:
            entity_id: Unique identifier for the entity
            
        Returns:
            T or None if not found
        """
        pass
    
    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """
        Delete an entity by its unique identifier.
        
        Args:
            entity_id: Unique identifier for the entity
            
        Returns:
            bool: True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def exists(self, entity_id: str) -> bool:
        """
        Check if an entity exists by its unique identifier.
        
        Args:
            entity_id: Unique identifier for the entity
            
        Returns:
            bool: True if entity exists, False otherwise
        """
        pass
    
    @abstractmethod
    async def list_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """
        List all entities with pagination.
        
        Args:
            limit: Maximum number of entities to return
            offset: Number of entities to skip
            
        Returns:
            List[T]: List of entities
        """
        pass
    
    @abstractmethod
    async def count(self) -> int:
        """
        Get the total count of entities.
        
        Returns:
            int: Total number of entities
        """
        pass


class RepositoryError(Exception):
    """Base exception for repository operations."""
    
    def __init__(self, message: str, entity_type: str = None, entity_id: str = None):
        super().__init__(message)
        self.entity_type = entity_type
        self.entity_id = entity_id


class EntityNotFoundError(RepositoryError):
    """Exception raised when an entity is not found."""
    
    def __init__(self, entity_type: str, entity_id: str):
        message = f"{entity_type} with ID '{entity_id}' not found"
        super().__init__(message, entity_type, entity_id)


class DuplicateEntityError(RepositoryError):
    """Exception raised when attempting to create a duplicate entity."""
    
    def __init__(self, entity_type: str, field: str, value: str):
        message = f"{entity_type} with {field} '{value}' already exists"
        super().__init__(message, entity_type)
        self.field = field
        self.value = value


class RepositoryConnectionError(RepositoryError):
    """Exception raised when repository connection fails."""
    
    def __init__(self, message: str = "Repository connection failed"):
        super().__init__(message)