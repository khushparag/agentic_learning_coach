"""Code Runner Service - Entry point for the secure code execution service."""

from app.api import app

# Export the app for uvicorn
__all__ = ["app"]