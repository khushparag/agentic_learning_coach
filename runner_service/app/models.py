"""Pydantic models for the runner service API."""

from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class TestCaseRequest(BaseModel):
    """Test case for code execution."""
    name: str = Field(..., description="Test case name")
    input_data: str = Field(..., description="Input data for the test")
    expected_output: str = Field(..., description="Expected output")
    timeout: Optional[int] = Field(None, description="Test timeout in seconds")


class ExecutionLimitsRequest(BaseModel):
    """Resource limits for code execution."""
    timeout: int = Field(default=10, description="Timeout in seconds", ge=1, le=30)
    memory_limit: int = Field(default=256, description="Memory limit in MB", ge=64, le=512)
    cpu_limit: float = Field(default=1.0, description="CPU limit in cores", ge=0.1, le=2.0)
    disk_limit: int = Field(default=100, description="Disk limit in MB", ge=10, le=500)
    network_access: bool = Field(default=False, description="Allow network access")
    file_system_access: str = Field(default="none", description="File system access level")
    
    @validator('file_system_access')
    def validate_fs_access(cls, v):
        if v not in ['none', 'read-only', 'temp-only']:
            raise ValueError('file_system_access must be one of: none, read-only, temp-only')
        return v


class CodeExecutionRequest(BaseModel):
    """Request model for code execution."""
    code: str = Field(..., description="Code to execute", max_length=50000)
    language: str = Field(..., description="Programming language")
    test_cases: List[TestCaseRequest] = Field(default=[], description="Test cases to run")
    limits: ExecutionLimitsRequest = Field(default_factory=ExecutionLimitsRequest)
    user_id: Optional[UUID] = Field(None, description="User ID for tracking")
    
    @validator('language')
    def validate_language(cls, v):
        allowed_languages = ['python', 'javascript', 'typescript', 'java', 'go']
        if v.lower() not in allowed_languages:
            raise ValueError(f'Language must be one of: {", ".join(allowed_languages)}')
        return v.lower()
    
    @validator('code')
    def validate_code_length(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Code cannot be empty')
        return v


class SecurityViolationResponse(BaseModel):
    """Security violation in code."""
    pattern: str
    line_number: Optional[int]
    description: str
    severity: str


class TestResultResponse(BaseModel):
    """Result of a single test case."""
    test_name: str
    passed: bool
    actual_output: str
    expected_output: str
    execution_time: float
    error_message: Optional[str] = None


class ResourceUsageResponse(BaseModel):
    """Resource usage metrics."""
    cpu_time: float
    memory_peak: int
    memory_average: int
    disk_read: int
    disk_write: int


class CodeExecutionResponse(BaseModel):
    """Response model for code execution."""
    request_id: UUID
    success: bool
    status: str
    output: str
    errors: List[str] = []
    test_results: List[TestResultResponse] = []
    resource_usage: ResourceUsageResponse
    security_violations: List[SecurityViolationResponse] = []
    execution_time: float
    all_tests_passed: bool
    has_security_violations: bool
    created_at: datetime


class LanguageInfoResponse(BaseModel):
    """Information about a supported language."""
    name: str
    version: str
    supported: bool
    docker_image: str
    file_extension: str
    test_framework: Optional[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    timestamp: datetime
    version: str
    docker_available: bool
    supported_languages: List[str]


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: str
    timestamp: datetime
    request_id: Optional[UUID] = None