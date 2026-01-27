"""Code execution domain entities."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4


class ProgrammingLanguage(str, Enum):
    """Supported programming languages."""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"


class ExecutionStatus(str, Enum):
    """Code execution status."""
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    MEMORY_EXCEEDED = "memory_exceeded"
    SECURITY_VIOLATION = "security_violation"
    COMPILATION_ERROR = "compilation_error"


@dataclass(frozen=True)
class SecurityViolation:
    """Represents a security violation in code."""
    pattern: str
    line_number: Optional[int]
    description: str
    severity: str  # 'low', 'medium', 'high', 'critical'


@dataclass(frozen=True)
class TestCase:
    """Represents a test case for code execution."""
    name: str
    input_data: str
    expected_output: str
    timeout: Optional[int] = None


@dataclass(frozen=True)
class TestResult:
    """Result of a single test case execution."""
    test_name: str
    passed: bool
    actual_output: str
    expected_output: str
    execution_time: float
    error_message: Optional[str] = None


@dataclass(frozen=True)
class ResourceUsage:
    """Resource usage metrics for code execution."""
    cpu_time: float  # seconds
    memory_peak: int  # bytes
    memory_average: int  # bytes
    disk_read: int  # bytes
    disk_write: int  # bytes


@dataclass(frozen=True)
class ExecutionLimits:
    """Resource limits for code execution."""
    timeout: int = 10  # seconds
    memory_limit: int = 256 * 1024 * 1024  # 256MB in bytes
    cpu_limit: float = 1.0  # CPU cores
    disk_limit: int = 100 * 1024 * 1024  # 100MB in bytes
    network_access: bool = False
    file_system_access: str = "none"  # 'none', 'read-only', 'temp-only'


@dataclass(frozen=True)
class CodeExecutionRequest:
    """Request for code execution."""
    id: UUID
    code: str
    language: ProgrammingLanguage
    test_cases: List[TestCase]
    limits: ExecutionLimits
    user_id: Optional[UUID] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            object.__setattr__(self, 'created_at', datetime.utcnow())
        if self.id is None:
            object.__setattr__(self, 'id', uuid4())


@dataclass(frozen=True)
class CodeExecutionResult:
    """Result of code execution."""
    request_id: UUID
    status: ExecutionStatus
    output: str
    errors: List[str]
    test_results: List[TestResult]
    resource_usage: ResourceUsage
    security_violations: List[SecurityViolation]
    execution_time: float
    created_at: datetime
    
    @property
    def success(self) -> bool:
        """Check if execution was successful."""
        return self.status == ExecutionStatus.SUCCESS
    
    @property
    def all_tests_passed(self) -> bool:
        """Check if all test cases passed."""
        return all(test.passed for test in self.test_results)
    
    @property
    def has_security_violations(self) -> bool:
        """Check if there are any security violations."""
        return len(self.security_violations) > 0
    
    @property
    def critical_security_violations(self) -> List[SecurityViolation]:
        """Get critical security violations."""
        return [v for v in self.security_violations if v.severity == 'critical']


@dataclass(frozen=True)
class LanguageConfig:
    """Configuration for a programming language."""
    name: ProgrammingLanguage
    docker_image: str
    file_extension: str
    compile_command: Optional[str]
    run_command: str
    test_framework: Optional[str]
    allowed_imports: List[str]
    blocked_patterns: List[str]
    timeout_multiplier: float = 1.0