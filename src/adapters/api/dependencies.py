"""
FastAPI dependencies for the Agentic Learning Coach API.

This module provides dependency injection for database sessions,
authentication, and other shared resources.
"""

import logging
from typing import AsyncGenerator, Optional
from uuid import uuid4

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.database.config import get_db_session as db_session_generator


logger = logging.getLogger(__name__)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.
    
    Yields:
        AsyncSession: Database session for the request
    """
    async for session in db_session_generator():
        yield session


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[str] = Header(None),
) -> str:
    """
    Dependency that extracts and validates the current user ID.
    
    In a production environment, this would validate JWT tokens
    and extract the user ID from the token claims.
    
    For development/testing, accepts X-User-ID header directly.
    
    Args:
        x_user_id: User ID from header (development mode)
        authorization: Bearer token for authentication
        
    Returns:
        str: The authenticated user's ID
        
    Raises:
        HTTPException: If authentication fails
    """
    # Development mode: accept X-User-ID header
    if x_user_id:
        logger.debug(f"Using X-User-ID header: {x_user_id}")
        return x_user_id
    
    # Production mode: validate JWT token
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = authorization[7:]  # Remove "Bearer " prefix
        
        # TODO: Implement JWT validation
        # For now, we'll use a placeholder that extracts user_id from token
        # In production, this would decode and validate the JWT
        try:
            # Placeholder: In production, decode JWT and extract user_id
            # user_id = decode_jwt(token)["sub"]
            # For now, treat the token as the user_id for testing
            user_id = token
            return user_id
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_optional_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    """
    Dependency that optionally extracts the current user ID.
    
    Returns None if no authentication is provided instead of raising an error.
    
    Args:
        x_user_id: User ID from header (development mode)
        authorization: Bearer token for authentication
        
    Returns:
        Optional[str]: The user's ID or None
    """
    if x_user_id:
        return x_user_id
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            # Placeholder: In production, decode JWT
            return token
        except Exception:
            return None
    
    return None


def get_request_id(
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
) -> str:
    """
    Dependency that provides a request correlation ID.
    
    Uses the X-Request-ID header if provided, otherwise generates a new UUID.
    
    Args:
        x_request_id: Request ID from header
        
    Returns:
        str: Request correlation ID
    """
    return x_request_id or str(uuid4())


class PaginationParams:
    """Pagination parameters dependency."""
    
    def __init__(
        self,
        page: int = 1,
        page_size: int = 20,
    ):
        """
        Initialize pagination parameters.
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
        """
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page number must be at least 1"
            )
        if page_size < 1 or page_size > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page size must be between 1 and 100"
            )
        
        self.page = page
        self.page_size = page_size
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Return limit for database queries."""
        return self.page_size
