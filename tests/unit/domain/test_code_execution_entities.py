"""Tests for code execution domain entities."""

import pytest
from datetime import datetime
from uuid import uuid4

from src.domain.entities.code_execution import (
    CodeExecutionRequest, CodeExecutionResult, ExecutionStatus,
    TestCase, TestResult, ResourceUsage, ExecutionLimits,
    SecurityViolation, ProgrammingLanguage, LanguageConfig
)


class TestCodeExecutionEntities:
    """Test cases for code execution entities."""
    
    def test_test_case_creation(self):
        """Test TestCase entity creation."""
        test_case = TestCase(
            name="test_addition",
            input_data="2, 3",
            expected_output="5",
            timeout=5
        )
        
        assert test_case.name == "test_addition"
        assert test_case.input_data == "2, 3"
        assert test_case.expected_output == "5"
        assert test_case.timeout == 5
    
    def test_test_result_creation(self):
        """Test TestResult entity creation."""
        test_result = TestResult(
            test_name="test_addition",
            passed=True,
            actual_output="5",
            expected_output="5",
            execution_time=0.1,
            error_message=None
        )
        
        assert test_result.test_name == "test_addition"
        assert test_result.passed is True
        assert test_result.actual_output == "5"
        assert test_result.expected_output == "5"
        assert test_result.execution_time == 0.1
        assert test_result.error_message is None
    
    def test_security_violation_creation(self):
        """Test SecurityViolation entity creation."""
        violation = SecurityViolation(
            pattern=r"\beval\s*\(",
            line_number=5,
            description="Use of eval() function",
            severity="critical"
        )
        
        assert violation.pattern == r"\beval\s*\("
        assert violation.line_number == 5
        assert violation.description == "Use of eval() function"
        assert violation.severity == "critical"
    
    def test_resource_usage_creation(self):
        """Test ResourceUsage entity creation."""
        usage = ResourceUsage(
            cpu_time=1.5,
            memory_peak=1024 * 1024,  # 1MB
            memory_average=512 * 1024,  # 512KB
            disk_read=2048,
            disk_write=1024
        )
        
        assert usage.cpu_time == 1.5
        assert usage.memory_peak == 1024 * 1024
        assert usage.memory_average == 512 * 1024
        assert usage.disk_read == 2048
        assert usage.disk_write == 1024
    
    def test_execution_limits_defaults(self):
        """Test ExecutionLimits default values."""
        limits = ExecutionLimits()
        
        assert limits.timeout == 10
        assert limits.memory_limit == 256 * 1024 * 1024  # 256MB
        assert limits.cpu_limit == 1.0
        assert limits.disk_limit == 100 * 1024 * 1024  # 100MB
        assert limits.network_access is False
        assert limits.file_system_access == "none"
    
    def test_execution_limits_custom(self):
        """Test ExecutionLimits with custom values."""
        limits = ExecutionLimits(
            timeout=30,
            memory_limit=512 * 1024 * 1024,  # 512MB
            cpu_limit=2.0,
            disk_limit=200 * 1024 * 1024,  # 200MB
            network_access=True,
            file_system_access="read-only"
        )
        
        assert limits.timeout == 30
        assert limits.memory_limit == 512 * 1024 * 1024
        assert limits.cpu_limit == 2.0
        assert limits.disk_limit == 200 * 1024 * 1024
        assert limits.network_access is True
        assert limits.file_system_access == "read-only"
    
    def test_code_execution_request_creation(self):
        """Test CodeExecutionRequest entity creation."""
        test_cases = [
            TestCase("test1", "input1", "output1"),
            TestCase("test2", "input2", "output2")
        ]
        
        limits = ExecutionLimits(timeout=15)
        user_id = uuid4()
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code="print('hello')",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=limits,
            user_id=user_id
        )
        
        assert request.code == "print('hello')"
        assert request.language == ProgrammingLanguage.PYTHON
        assert len(request.test_cases) == 2
        assert request.limits.timeout == 15
        assert request.user_id == user_id
        assert isinstance(request.created_at, datetime)
    
    def test_code_execution_request_auto_id(self):
        """Test CodeExecutionRequest auto-generates ID and timestamp."""
        request = CodeExecutionRequest(
            id=None,  # Should auto-generate
            code="print('test')",
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(),
            created_at=None  # Should auto-generate
        )
        
        assert request.id is not None
        assert isinstance(request.created_at, datetime)
    
    def test_code_execution_result_creation(self):
        """Test CodeExecutionResult entity creation."""
        request_id = uuid4()
        test_results = [
            TestResult("test1", True, "output1", "output1", 0.1),
            TestResult("test2", False, "output2", "expected2", 0.2, "Error message")
        ]
        
        resource_usage = ResourceUsage(1.0, 1024, 512, 100, 50)
        violations = [
            SecurityViolation("pattern1", 1, "Description1", "medium")
        ]
        
        result = CodeExecutionResult(
            request_id=request_id,
            status=ExecutionStatus.SUCCESS,
            output="Program output",
            errors=[],
            test_results=test_results,
            resource_usage=resource_usage,
            security_violations=violations,
            execution_time=2.5,
            created_at=datetime.utcnow()
        )
        
        assert result.request_id == request_id
        assert result.status == ExecutionStatus.SUCCESS
        assert result.output == "Program output"
        assert len(result.errors) == 0
        assert len(result.test_results) == 2
        assert result.execution_time == 2.5
    
    def test_code_execution_result_success_property(self):
        """Test CodeExecutionResult success property."""
        success_result = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="",
            errors=[],
            test_results=[],
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=[],
            execution_time=0,
            created_at=datetime.utcnow()
        )
        
        failed_result = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.FAILED,
            output="",
            errors=["Error occurred"],
            test_results=[],
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=[],
            execution_time=0,
            created_at=datetime.utcnow()
        )
        
        assert success_result.success is True
        assert failed_result.success is False
    
    def test_code_execution_result_all_tests_passed_property(self):
        """Test CodeExecutionResult all_tests_passed property."""
        passing_tests = [
            TestResult("test1", True, "output1", "output1", 0.1),
            TestResult("test2", True, "output2", "output2", 0.1)
        ]
        
        mixed_tests = [
            TestResult("test1", True, "output1", "output1", 0.1),
            TestResult("test2", False, "output2", "expected2", 0.1)
        ]
        
        result_all_pass = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="",
            errors=[],
            test_results=passing_tests,
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=[],
            execution_time=0,
            created_at=datetime.utcnow()
        )
        
        result_mixed = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SUCCESS,
            output="",
            errors=[],
            test_results=mixed_tests,
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=[],
            execution_time=0,
            created_at=datetime.utcnow()
        )
        
        assert result_all_pass.all_tests_passed is True
        assert result_mixed.all_tests_passed is False
    
    def test_code_execution_result_security_violations_properties(self):
        """Test CodeExecutionResult security violation properties."""
        violations = [
            SecurityViolation("pattern1", 1, "Medium issue", "medium"),
            SecurityViolation("pattern2", 2, "Critical issue", "critical"),
            SecurityViolation("pattern3", 3, "Low issue", "low")
        ]
        
        result = CodeExecutionResult(
            request_id=uuid4(),
            status=ExecutionStatus.SECURITY_VIOLATION,
            output="",
            errors=[],
            test_results=[],
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=violations,
            execution_time=0,
            created_at=datetime.utcnow()
        )
        
        assert result.has_security_violations is True
        assert len(result.critical_security_violations) == 1
        assert result.critical_security_violations[0].severity == "critical"
    
    def test_language_config_creation(self):
        """Test LanguageConfig entity creation."""
        config = LanguageConfig(
            name=ProgrammingLanguage.PYTHON,
            docker_image="python:3.11-alpine",
            file_extension=".py",
            compile_command=None,
            run_command="python /app/code.py",
            test_framework="unittest",
            allowed_imports=["math", "json"],
            blocked_patterns=["import os"],
            timeout_multiplier=1.0
        )
        
        assert config.name == ProgrammingLanguage.PYTHON
        assert config.docker_image == "python:3.11-alpine"
        assert config.file_extension == ".py"
        assert config.compile_command is None
        assert config.run_command == "python /app/code.py"
        assert config.test_framework == "unittest"
        assert "math" in config.allowed_imports
        assert "import os" in config.blocked_patterns
        assert config.timeout_multiplier == 1.0
    
    def test_programming_language_enum(self):
        """Test ProgrammingLanguage enum values."""
        assert ProgrammingLanguage.PYTHON == "python"
        assert ProgrammingLanguage.JAVASCRIPT == "javascript"
        assert ProgrammingLanguage.TYPESCRIPT == "typescript"
        assert ProgrammingLanguage.JAVA == "java"
        assert ProgrammingLanguage.GO == "go"
    
    def test_execution_status_enum(self):
        """Test ExecutionStatus enum values."""
        assert ExecutionStatus.SUCCESS == "success"
        assert ExecutionStatus.FAILED == "failed"
        assert ExecutionStatus.TIMEOUT == "timeout"
        assert ExecutionStatus.MEMORY_EXCEEDED == "memory_exceeded"
        assert ExecutionStatus.SECURITY_VIOLATION == "security_violation"
        assert ExecutionStatus.COMPILATION_ERROR == "compilation_error"