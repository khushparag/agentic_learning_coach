"""FastAPI application for the code runner service."""

import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from runner_service.app.models import (
    CodeExecutionRequest, CodeExecutionResponse, HealthResponse,
    LanguageInfoResponse, ErrorResponse
)
from runner_service.app.service import CodeExecutionService


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Secure Code Runner Service",
    description="Secure code execution service for the Agentic Learning Coach",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
code_execution_service = CodeExecutionService()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc),
            timestamp=datetime.now(timezone.utc)
        ).dict()
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "service": "Secure Code Runner Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    try:
        supported_languages = [lang.value for lang in code_execution_service.get_supported_languages()]
        docker_available = code_execution_service.code_runner.docker_client is not None
        
        status_value = "healthy" if docker_available else "degraded"
        
        return HealthResponse(
            status=status_value,
            service="code-runner",
            timestamp=datetime.now(timezone.utc),
            version="1.0.0",
            docker_available=docker_available,
            supported_languages=supported_languages
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            service="code-runner",
            timestamp=datetime.now(timezone.utc),
            version="1.0.0",
            docker_available=False,
            supported_languages=[]
        )


@app.post("/execute", response_model=CodeExecutionResponse, tags=["Execution"])
async def execute_code(request: CodeExecutionRequest):
    """Execute code in a secure environment."""
    logger.info(f"Executing code: language={request.language}, "
                f"code_length={len(request.code)}, "
                f"test_cases={len(request.test_cases)}")
    
    try:
        result = await code_execution_service.execute_code(request)
        
        logger.info(f"Code execution completed: success={result.success}, "
                   f"status={result.status}, "
                   f"execution_time={result.execution_time:.3f}s")
        
        return result
        
    except Exception as e:
        logger.error(f"Code execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution failed: {str(e)}"
        )


@app.get("/languages", response_model=List[LanguageInfoResponse], tags=["Languages"])
async def get_supported_languages():
    """Get list of supported programming languages with details."""
    try:
        return code_execution_service.get_language_info()
    except Exception as e:
        logger.error(f"Failed to get language info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get language information: {str(e)}"
        )


@app.get("/languages/{language}/validate", tags=["Validation"])
async def validate_language(language: str):
    """Validate if a language is supported."""
    try:
        from src.domain.entities.code_execution import ProgrammingLanguage
        
        # Check if language is valid
        try:
            lang_enum = ProgrammingLanguage(language.lower())
        except ValueError:
            return {
                "language": language,
                "supported": False,
                "error": f"Unknown language: {language}"
            }
        
        supported = code_execution_service.is_language_supported(lang_enum)
        
        return {
            "language": language,
            "supported": supported,
            "message": f"Language {language} is {'supported' if supported else 'not supported'}"
        }
        
    except Exception as e:
        logger.error(f"Language validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Language validation failed: {str(e)}"
        )


@app.post("/validate", tags=["Validation"])
async def validate_code(request: CodeExecutionRequest):
    """Validate code for security violations without executing it."""
    try:
        from src.domain.entities.code_execution import ProgrammingLanguage
        from src.domain.services.security_validator import SecurityValidator
        
        # Convert language
        try:
            language = ProgrammingLanguage(request.language.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language: {request.language}"
            )
        
        # Validate code
        validator = SecurityValidator()
        violations = validator.validate_code(request.code, language)
        
        # Convert violations to response format
        security_violations = [
            {
                "pattern": v.pattern,
                "line_number": v.line_number,
                "description": v.description,
                "severity": v.severity
            }
            for v in violations
        ]
        
        is_safe = validator.is_code_safe(request.code, language)
        
        return {
            "safe": is_safe,
            "violations": security_violations,
            "blocked_imports": validator.get_blocked_imports(language),
            "message": "Code is safe to execute" if is_safe else "Code contains security violations"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code validation failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "runner_service.app.api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )