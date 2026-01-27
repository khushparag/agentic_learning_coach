"""Main FastAPI application."""

import logging
import os
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from src.adapters.api.health import router as health_router
from src.adapters.api.routers import (
    goals_router,
    curriculum_router,
    tasks_router,
    submissions_router,
    progress_router,
)
from src.adapters.api.routers.analytics import router as analytics_router
from src.adapters.api.routers.gamification import router as gamification_router
from src.adapters.api.routers.social import router as social_router
from src.adapters.api.routers.settings import router as settings_router
from src.adapters.api.routers.content import router as content_router
from src.adapters.api.routers.code_execution import router as code_execution_router
from src.adapters.api.routers.learning_content import router as learning_content_router
from src.adapters.database.config import get_database_manager
from src.adapters.api.settings import APISettings


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def run_database_migrations() -> bool:
    """
    Run database migrations on startup.
    
    Returns:
        bool: True if migrations ran successfully, False otherwise
    """
    # Check if migrations should run
    run_migrations = os.getenv("RUN_MIGRATIONS", "true").lower() in ("true", "1", "yes")
    
    if not run_migrations:
        logger.info("Database migrations disabled via RUN_MIGRATIONS environment variable")
        return True
    
    try:
        from src.adapters.database.migration_manager import MigrationManager
        
        logger.info("Running database migrations...")
        manager = MigrationManager()
        
        # Check current status
        status = manager.check_migration_status()
        logger.info(f"Current migration status: {status}")
        
        # Run migrations to head
        manager.upgrade_to_head()
        logger.info("Database migrations completed successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to run database migrations: {e}")
        # In development, we might want to continue even if migrations fail
        # In production, this should be a fatal error
        environment = os.getenv("ENVIRONMENT", "development")
        if environment.lower() == "production":
            raise
        logger.warning("Continuing despite migration failure (non-production environment)")
        return False


async def verify_database_connection() -> bool:
    """
    Verify database connection is working.
    
    Returns:
        bool: True if connection is successful
    """
    db_manager = get_database_manager()
    try:
        async for session in db_manager.get_async_session():
            logger.info("Database connection established successfully")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


def validate_llm_configuration() -> dict:
    """
    Validate LLM configuration on startup.
    
    Returns:
        dict: LLM configuration status
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    config_status = {
        "provider": None,
        "mode": None,
        "key_valid": False,
        "warnings": []
    }
    
    if openai_key:
        config_status["provider"] = "openai"
        # Validate OpenAI key format (sk-...)
        if re.match(r'^sk-[a-zA-Z0-9]{20,}$', openai_key):
            config_status["key_valid"] = True
            config_status["mode"] = "live"
            logger.info("✓ OpenAI API key configured and format validated")
        else:
            config_status["mode"] = "invalid"
            config_status["warnings"].append("OpenAI API key format appears invalid (expected sk-...)")
            logger.warning("⚠ OpenAI API key format appears invalid")
            
    elif anthropic_key:
        config_status["provider"] = "anthropic"
        # Validate Anthropic key format (sk-ant-...)
        if re.match(r'^sk-ant-[a-zA-Z0-9-]{20,}$', anthropic_key):
            config_status["key_valid"] = True
            config_status["mode"] = "live"
            logger.info("✓ Anthropic API key configured and format validated")
        else:
            config_status["mode"] = "invalid"
            config_status["warnings"].append("Anthropic API key format appears invalid (expected sk-ant-...)")
            logger.warning("⚠ Anthropic API key format appears invalid")
            
    else:
        config_status["provider"] = "mock"
        config_status["mode"] = "mock"
        config_status["key_valid"] = True  # Mock mode is always valid
        logger.info("ℹ No LLM API key configured - using mock mode")
        logger.info("  Set OPENAI_API_KEY or ANTHROPIC_API_KEY for AI-powered features")
    
    return config_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Learning Coach API...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Log Level: {os.getenv('LOG_LEVEL', 'INFO')}")
    
    # Run database migrations
    migration_success = run_database_migrations()
    if not migration_success:
        logger.warning("Database migrations did not complete successfully")
    
    # Verify database connection
    await verify_database_connection()
    
    # Validate LLM configuration
    llm_config = validate_llm_configuration()
    app.state.llm_config = llm_config
    
    logger.info("Learning Coach API started successfully")
    logger.info(f"LLM Provider: {llm_config['provider']} (mode: {llm_config['mode']})")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Learning Coach API...")
    db_manager = get_database_manager()
    await db_manager.close()
    logger.info("Learning Coach API shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = APISettings()
    
    app = FastAPI(
        title="Agentic Learning Coach",
        description="An intelligent multi-agent system for personalized coding education",
        version="0.1.0",
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
        lifespan=lifespan,
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    if settings.environment == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_hosts
        )
    
    # Add exception handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global exception handler."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc) if settings.debug else "An unexpected error occurred"
            }
        )
    
    # Include routers
    app.include_router(health_router)
    app.include_router(goals_router)
    app.include_router(curriculum_router)
    app.include_router(tasks_router)
    app.include_router(submissions_router)
    app.include_router(progress_router)
    app.include_router(analytics_router, prefix="/api/v1")
    app.include_router(gamification_router, prefix="/api/v1")
    app.include_router(social_router, prefix="/api/v1")
    app.include_router(settings_router)  # Settings router for LLM configuration
    app.include_router(content_router)  # Content generation router
    app.include_router(code_execution_router)  # Code execution router
    app.include_router(learning_content_router)  # Enriched learning content router
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "service": "Agentic Learning Coach",
            "version": "0.1.0",
            "status": "running",
            "docs": "/docs" if settings.environment != "production" else None
        }
    
    return app


# Create the application instance
app = create_app()