"""Health check endpoints and functionality."""

import asyncio
import os
import re
from datetime import datetime, timezone
from typing import Dict, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.database.config import get_db_session
from src.adapters.database.settings import DatabaseSettings


router = APIRouter(prefix="/health", tags=["health"])


class HealthChecker:
    """Health check service for system components."""
    
    def __init__(self):
        self.db_settings = DatabaseSettings()
    
    async def check_database(self, db: AsyncSession) -> Dict[str, Any]:
        """Check database connectivity and basic functionality."""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Simple query to test connection
            result = await db.execute(text("SELECT 1 as health_check"))
            row = result.fetchone()
            
            end_time = datetime.now(timezone.utc)
            response_time = (end_time - start_time).total_seconds() * 1000
            
            if row and row.health_check == 1:
                return {
                    "status": "healthy",
                    "response_time_ms": round(response_time, 2),
                    "database_type": "postgresql" if self.db_settings.is_postgresql else "sqlite",
                    "timestamp": end_time.isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Database query returned unexpected result",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity."""
        try:
            import redis.asyncio as redis
            
            start_time = datetime.now(timezone.utc)
            
            # Try to connect to Redis
            redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
            await redis_client.ping()
            await redis_client.close()
            
            end_time = datetime.now(timezone.utc)
            response_time = (end_time - start_time).total_seconds() * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "timestamp": end_time.isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def check_runner_service(self) -> Dict[str, Any]:
        """Check code runner service connectivity."""
        try:
            start_time = datetime.now(timezone.utc)
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("http://localhost:8001/health")
                
            end_time = datetime.now(timezone.utc)
            response_time = (end_time - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time_ms": round(response_time, 2),
                    "timestamp": end_time.isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"HTTP {response.status_code}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def check_qdrant(self) -> Dict[str, Any]:
        """Check Qdrant vector database connectivity."""
        try:
            start_time = datetime.now(timezone.utc)
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("http://localhost:6333/health")
                
            end_time = datetime.now(timezone.utc)
            response_time = (end_time - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time_ms": round(response_time, 2),
                    "timestamp": end_time.isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": f"HTTP {response.status_code}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def check_llm_service(self) -> Dict[str, Any]:
        """Check LLM service configuration and connectivity."""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Check for API keys
            openai_key = os.getenv("OPENAI_API_KEY")
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            
            provider = None
            api_key = None
            key_valid = False
            
            if openai_key:
                provider = "openai"
                api_key = openai_key
                # Validate OpenAI key format (sk-...)
                key_valid = bool(re.match(r'^sk-[a-zA-Z0-9]{20,}$', openai_key))
            elif anthropic_key:
                provider = "anthropic"
                api_key = anthropic_key
                # Validate Anthropic key format (sk-ant-...)
                key_valid = bool(re.match(r'^sk-ant-[a-zA-Z0-9-]{20,}$', anthropic_key))
            else:
                provider = "mock"
                key_valid = True  # Mock mode is always valid
            
            end_time = datetime.now(timezone.utc)
            response_time = (end_time - start_time).total_seconds() * 1000
            
            # Determine status
            if provider == "mock":
                return {
                    "status": "healthy",
                    "provider": "mock",
                    "mode": "fallback",
                    "message": "No API key configured, using mock mode",
                    "response_time_ms": round(response_time, 2),
                    "timestamp": end_time.isoformat()
                }
            elif key_valid:
                # Optionally test API connectivity (lightweight check)
                connectivity_status = await self._test_llm_connectivity(provider, api_key)
                return {
                    "status": "healthy" if connectivity_status["connected"] else "degraded",
                    "provider": provider,
                    "mode": "live",
                    "key_format_valid": True,
                    "api_connected": connectivity_status["connected"],
                    "api_error": connectivity_status.get("error"),
                    "response_time_ms": round(response_time, 2),
                    "timestamp": end_time.isoformat()
                }
            else:
                return {
                    "status": "degraded",
                    "provider": provider,
                    "mode": "invalid_key",
                    "key_format_valid": False,
                    "message": f"Invalid {provider} API key format",
                    "response_time_ms": round(response_time, 2),
                    "timestamp": end_time.isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _test_llm_connectivity(self, provider: str, api_key: str) -> Dict[str, Any]:
        """Test LLM API connectivity with a lightweight request."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if provider == "openai":
                    # Test OpenAI models endpoint (lightweight)
                    response = await client.get(
                        "https://api.openai.com/v1/models",
                        headers={"Authorization": f"Bearer {api_key}"}
                    )
                    if response.status_code == 200:
                        return {"connected": True}
                    else:
                        return {"connected": False, "error": f"HTTP {response.status_code}"}
                        
                elif provider == "anthropic":
                    # Anthropic doesn't have a lightweight endpoint, so we just validate the key format
                    # A full test would require making a completion request
                    return {"connected": True, "note": "Key format validated, full test requires API call"}
                    
        except httpx.TimeoutException:
            return {"connected": False, "error": "Connection timeout"}
        except Exception as e:
            return {"connected": False, "error": str(e)}


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "learning-coach",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.0"
    }


@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db_session)):
    """Detailed health check for all system components."""
    health_checker = HealthChecker()
    
    # Run all health checks concurrently
    database_check, redis_check, runner_check, qdrant_check, llm_check = await asyncio.gather(
        health_checker.check_database(db),
        health_checker.check_redis(),
        health_checker.check_runner_service(),
        health_checker.check_qdrant(),
        health_checker.check_llm_service(),
        return_exceptions=True
    )
    
    # Handle exceptions from health checks
    def format_check_result(result, service_name):
        if isinstance(result, Exception):
            return {
                "status": "unhealthy",
                "error": str(result),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        return result
    
    health_status = {
        "service": "learning-coach",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.0",
        "components": {
            "database": format_check_result(database_check, "database"),
            "redis": format_check_result(redis_check, "redis"),
            "runner_service": format_check_result(runner_check, "runner_service"),
            "qdrant": format_check_result(qdrant_check, "qdrant"),
            "llm_service": format_check_result(llm_check, "llm_service")
        }
    }
    
    # Determine overall health status
    # Database is critical, others are optional
    critical_healthy = health_status["components"]["database"]["status"] == "healthy"
    all_healthy = all(
        component["status"] == "healthy" 
        for component in health_status["components"].values()
    )
    
    if all_healthy:
        health_status["overall_status"] = "healthy"
    elif critical_healthy:
        health_status["overall_status"] = "degraded"
    else:
        health_status["overall_status"] = "unhealthy"
    
    # Return appropriate HTTP status code
    if health_status["overall_status"] == "unhealthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db_session)):
    """Readiness check - service is ready to accept requests."""
    health_checker = HealthChecker()
    
    # Check critical components for readiness
    database_check = await health_checker.check_database(db)
    
    if database_check["status"] != "healthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "ready": False,
                "reason": "Database not available",
                "database": database_check
            }
        )
    
    return {
        "ready": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": database_check
    }


@router.get("/live")
async def liveness_check():
    """Liveness check - service is alive and running."""
    return {
        "alive": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "learning-coach"
    }


@router.get("/llm")
async def llm_status_check():
    """Check LLM service configuration and status."""
    health_checker = HealthChecker()
    llm_status = await health_checker.check_llm_service()
    
    return {
        "service": "llm",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **llm_status
    }