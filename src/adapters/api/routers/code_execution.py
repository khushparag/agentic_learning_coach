"""
API router for code execution endpoints.

Provides a proxy to the code runner service for executing user code.
"""

import logging
import os
from typing import Optional, List

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/code",
    tags=["code-execution"],
)

# Code runner service URL
CODE_RUNNER_URL = os.getenv("CODE_RUNNER_URL", "http://localhost:8001")


class TestCase(BaseModel):
    """Test case for code execution."""
    input: str = Field(..., description="Input for the test case")
    expected_output: str = Field(..., description="Expected output")
    name: Optional[str] = Field(None, description="Test case name")


class ExecuteCodeRequest(BaseModel):
    """Request model for code execution."""
    code: str = Field(..., min_length=1, max_length=50000, description="Code to execute")
    language: str = Field(..., description="Programming language")
    test_cases: Optional[List[TestCase]] = Field(default=[], description="Test cases to run")
    timeout: Optional[int] = Field(default=10, ge=1, le=30, description="Execution timeout in seconds")
    memory_limit: Optional[int] = Field(default=256, ge=64, le=512, description="Memory limit in MB")


class TestResultResponse(BaseModel):
    """Test result response."""
    name: str
    passed: bool
    actual_output: Optional[str] = None
    expected_output: Optional[str] = None
    error_message: Optional[str] = None
    execution_time_ms: Optional[float] = None


class ExecuteCodeResponse(BaseModel):
    """Response model for code execution."""
    success: bool
    output: str
    errors: List[str] = []
    execution_time_ms: float
    memory_used_mb: float
    test_results: Optional[List[TestResultResponse]] = None


@router.post(
    "/execute",
    response_model=ExecuteCodeResponse,
    summary="Execute code",
    description="""
    Execute code in a secure sandboxed environment.
    
    Supports multiple programming languages including:
    - JavaScript
    - TypeScript
    - Python
    - Java
    - Go
    - Rust
    
    The code is executed with resource limits to prevent abuse.
    """,
)
async def execute_code(request: ExecuteCodeRequest) -> ExecuteCodeResponse:
    """
    Execute code in a secure environment.
    """
    try:
        logger.info(f"Executing code: language={request.language}, code_length={len(request.code)}")
        
        # Prepare request for code runner service
        runner_request = {
            "code": request.code,
            "language": request.language.lower(),
            "test_cases": [
                {
                    "input": tc.input,
                    "expected_output": tc.expected_output,
                    "name": tc.name or f"Test {i+1}"
                }
                for i, tc in enumerate(request.test_cases or [])
            ],
            "limits": {
                "timeout_seconds": request.timeout or 10,
                "memory_mb": request.memory_limit or 256
            }
        }
        
        # Call code runner service
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{CODE_RUNNER_URL}/execute",
                    json=runner_request
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Transform response
                    test_results = None
                    if data.get("test_results"):
                        test_results = [
                            TestResultResponse(
                                name=tr.get("name", f"Test {i+1}"),
                                passed=tr.get("passed", False),
                                actual_output=tr.get("actual_output"),
                                expected_output=tr.get("expected_output"),
                                error_message=tr.get("error_message"),
                                execution_time_ms=tr.get("execution_time_ms")
                            )
                            for i, tr in enumerate(data["test_results"])
                        ]
                    
                    return ExecuteCodeResponse(
                        success=data.get("success", False),
                        output=data.get("output", ""),
                        errors=data.get("errors", []),
                        execution_time_ms=data.get("execution_time", 0) * 1000,
                        memory_used_mb=data.get("memory_used", 0),
                        test_results=test_results
                    )
                else:
                    error_detail = response.json().get("detail", "Unknown error")
                    logger.error(f"Code runner returned error: {error_detail}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Code execution failed: {error_detail}"
                    )
                    
            except httpx.ConnectError:
                logger.warning("Code runner service unavailable, using fallback")
                # Fallback: basic syntax validation
                return _fallback_execution(request)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code execution error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution failed: {str(e)}"
        )


def _fallback_execution(request: ExecuteCodeRequest) -> ExecuteCodeResponse:
    """
    Fallback execution when code runner service is unavailable.
    Performs basic syntax validation only.
    """
    code = request.code
    errors = []
    success = True
    
    # Basic syntax checks
    open_braces = code.count('{')
    close_braces = code.count('}')
    if open_braces != close_braces:
        errors.append("Syntax Error: Mismatched braces { }")
        success = False
    
    open_parens = code.count('(')
    close_parens = code.count(')')
    if open_parens != close_parens:
        errors.append("Syntax Error: Mismatched parentheses ( )")
        success = False
    
    open_brackets = code.count('[')
    close_brackets = code.count(']')
    if open_brackets != close_brackets:
        errors.append("Syntax Error: Mismatched brackets [ ]")
        success = False
    
    # Check for common issues
    if 'function' not in code and '=>' not in code and 'def ' not in code:
        errors.append("Warning: No function definition found")
    
    if 'return' not in code:
        errors.append("Warning: No return statement found")
    
    output = (
        "✓ Code validation passed (local mode)\n\n"
        "Note: Full code execution is unavailable. "
        "This is a basic syntax check only."
    ) if success else (
        "✗ Code validation failed\n\n" + "\n".join(errors)
    )
    
    return ExecuteCodeResponse(
        success=success,
        output=output,
        errors=errors,
        execution_time_ms=0,
        memory_used_mb=0,
        test_results=None
    )


@router.get(
    "/languages",
    summary="Get supported languages",
    description="Get list of supported programming languages for code execution.",
)
async def get_supported_languages():
    """
    Get list of supported programming languages.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{CODE_RUNNER_URL}/languages")
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.warning(f"Could not fetch languages from runner: {e}")
    
    # Fallback list
    return [
        {"language": "javascript", "version": "Node.js 18", "extensions": [".js"]},
        {"language": "typescript", "version": "TypeScript 5", "extensions": [".ts"]},
        {"language": "python", "version": "Python 3.11", "extensions": [".py"]},
        {"language": "java", "version": "Java 17", "extensions": [".java"]},
        {"language": "go", "version": "Go 1.21", "extensions": [".go"]},
        {"language": "rust", "version": "Rust 1.70", "extensions": [".rs"]}
    ]
