"""Settings router for LLM configuration and testing."""

import logging
import time
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.adapters.services.llm_service import LLMService, LLMConfig, LLMProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])


# Request/Response Models
class LLMConfigurationRequest(BaseModel):
    """Request model for LLM configuration."""
    provider: str = Field(..., description="LLM provider: 'openai' or 'anthropic'")
    model: str = Field(..., description="Model name")
    apiKey: str = Field(..., description="API key for the provider")
    temperature: Optional[float] = Field(0.7, ge=0, le=2, description="Temperature for generation")
    maxTokens: Optional[int] = Field(2000, ge=1, le=100000, description="Maximum tokens")
    customEndpoint: Optional[str] = Field(None, description="Custom API endpoint")


class LLMTestResponse(BaseModel):
    """Response model for LLM test."""
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    latency: Optional[int] = None  # milliseconds
    model: Optional[str] = None
    provider: Optional[str] = None


class APIKeyValidationRequest(BaseModel):
    """Request model for API key validation."""
    provider: str = Field(..., description="LLM provider: 'openai' or 'anthropic'")
    apiKey: str = Field(..., description="API key to validate")


class APIKeyValidationResponse(BaseModel):
    """Response model for API key validation."""
    valid: bool
    provider: str
    error: Optional[str] = None
    models: Optional[List[str]] = None


class ModelsResponse(BaseModel):
    """Response model for available models."""
    models: List[str]


@router.post("/test-llm", response_model=LLMTestResponse)
async def test_llm_configuration(config: LLMConfigurationRequest) -> LLMTestResponse:
    """
    Test LLM configuration by making a simple API call.
    
    This endpoint validates the API key and tests connectivity
    by sending a simple prompt to the LLM provider.
    """
    try:
        # Validate provider
        provider_map = {
            "openai": LLMProvider.OPENAI,
            "anthropic": LLMProvider.ANTHROPIC,
        }
        
        if config.provider.lower() not in provider_map:
            return LLMTestResponse(
                success=False,
                error=f"Unsupported provider: {config.provider}. Supported: openai, anthropic",
                provider=config.provider
            )
        
        # Validate API key format
        if not config.apiKey or len(config.apiKey) < 10:
            return LLMTestResponse(
                success=False,
                error="API key is required and must be at least 10 characters",
                provider=config.provider
            )
        
        # Check API key format based on provider
        if config.provider.lower() == "openai" and not config.apiKey.startswith("sk-"):
            return LLMTestResponse(
                success=False,
                error="OpenAI API keys must start with 'sk-'",
                provider=config.provider
            )
        
        if config.provider.lower() == "anthropic" and not config.apiKey.startswith("sk-ant-"):
            return LLMTestResponse(
                success=False,
                error="Anthropic API keys must start with 'sk-ant-'",
                provider=config.provider
            )
        
        # Create LLM config
        llm_config = LLMConfig(
            provider=provider_map[config.provider.lower()],
            api_key=config.apiKey,
            model=config.model,
            max_tokens=config.maxTokens or 100,  # Use small token limit for test
            temperature=config.temperature or 0.7,
            timeout=15  # Short timeout for test
        )
        
        # Create LLM service and test
        llm_service = LLMService(llm_config)
        
        start_time = time.time()
        
        # Simple test prompt
        test_prompt = "Say 'Hello! LLM connection successful.' in exactly those words."
        response = await llm_service.generate(
            prompt=test_prompt,
            system_prompt="You are a helpful assistant. Respond exactly as instructed."
        )
        
        latency = int((time.time() - start_time) * 1000)
        
        # Close the client
        await llm_service.close()
        
        if response.success:
            return LLMTestResponse(
                success=True,
                response=response.content[:200],  # Truncate response
                latency=latency,
                model=response.model or config.model,
                provider=config.provider
            )
        else:
            return LLMTestResponse(
                success=False,
                error=response.error or "Unknown error occurred",
                latency=latency,
                provider=config.provider
            )
            
    except Exception as e:
        logger.error(f"LLM test failed: {e}")
        return LLMTestResponse(
            success=False,
            error=str(e),
            provider=config.provider
        )


@router.post("/validate-api-key", response_model=APIKeyValidationResponse)
async def validate_api_key(request: APIKeyValidationRequest) -> APIKeyValidationResponse:
    """
    Validate an API key for a specific provider.
    
    Performs format validation and optionally tests the key
    by making a minimal API call.
    """
    try:
        provider = request.provider.lower()
        api_key = request.apiKey
        
        # Basic format validation
        if not api_key or len(api_key) < 10:
            return APIKeyValidationResponse(
                valid=False,
                provider=provider,
                error="API key is required and must be at least 10 characters"
            )
        
        # Provider-specific format validation
        if provider == "openai":
            if not api_key.startswith("sk-"):
                return APIKeyValidationResponse(
                    valid=False,
                    provider=provider,
                    error="OpenAI API keys must start with 'sk-'"
                )
            
            # Test the key with a minimal request
            llm_config = LLMConfig(
                provider=LLMProvider.OPENAI,
                api_key=api_key,
                model="gpt-3.5-turbo",
                max_tokens=5,
                timeout=10
            )
            
            llm_service = LLMService(llm_config)
            response = await llm_service.generate("Hi", "Reply with 'ok'")
            await llm_service.close()
            
            if response.success:
                return APIKeyValidationResponse(
                    valid=True,
                    provider=provider,
                    models=["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
                )
            else:
                return APIKeyValidationResponse(
                    valid=False,
                    provider=provider,
                    error=response.error or "API key validation failed"
                )
                
        elif provider == "anthropic":
            if not api_key.startswith("sk-ant-"):
                return APIKeyValidationResponse(
                    valid=False,
                    provider=provider,
                    error="Anthropic API keys must start with 'sk-ant-'"
                )
            
            # Test the key with a minimal request
            llm_config = LLMConfig(
                provider=LLMProvider.ANTHROPIC,
                api_key=api_key,
                model="claude-3-haiku-20240307",
                max_tokens=5,
                timeout=10
            )
            
            llm_service = LLMService(llm_config)
            response = await llm_service.generate("Hi", "Reply with 'ok'")
            await llm_service.close()
            
            if response.success:
                return APIKeyValidationResponse(
                    valid=True,
                    provider=provider,
                    models=["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
                )
            else:
                return APIKeyValidationResponse(
                    valid=False,
                    provider=provider,
                    error=response.error or "API key validation failed"
                )
        else:
            return APIKeyValidationResponse(
                valid=False,
                provider=provider,
                error=f"Unsupported provider: {provider}. Supported: openai, anthropic"
            )
            
    except Exception as e:
        logger.error(f"API key validation failed: {e}")
        return APIKeyValidationResponse(
            valid=False,
            provider=request.provider,
            error=str(e)
        )


@router.get("/models/{provider}", response_model=ModelsResponse)
async def get_available_models(provider: str) -> ModelsResponse:
    """
    Get available models for a specific provider.
    """
    provider = provider.lower()
    
    if provider == "openai":
        return ModelsResponse(
            models=["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
        )
    elif provider == "anthropic":
        return ModelsResponse(
            models=["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider: {provider}. Supported: openai, anthropic"
        )
