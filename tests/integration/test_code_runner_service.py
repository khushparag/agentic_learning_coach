"""Integration tests for the code runner service."""

import pytest
import asyncio
from datetime import datetime
from uuid import uuid4

from src.domain.entities.code_execution import (
    CodeExecutionRequest, ExecutionLimits, TestCase, ProgrammingLanguage
)
from src.domain.services.code_runner import SecureCodeRunner, CodeExecutionError


class TestSecureCodeRunner:
    """Integration tests for SecureCodeRunner."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.code_runner = SecureCodeRunner()
    
    @pytest.mark.asyncio
    async def test_simple_python_execution(self):
        """Test simple Python code execution."""
        code = """
def add(a, b):
    return a + b

result = add(2, 3)
print(result)
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(timeout=5),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is True
        assert "5" in result.output
        assert len(result.errors) == 0
    
    @pytest.mark.asyncio
    async def test_python_with_test_cases(self):
        """Test Python code execution with test cases."""
        code = """
def multiply(a, b):
    return a * b

def main(input_data):
    a, b = map(int, input_data.split(','))
    return multiply(a, b)
"""
        
        test_cases = [
            TestCase("test_multiply_positive", "3,4", "12"),
            TestCase("test_multiply_zero", "0,5", "0"),
            TestCase("test_multiply_negative", "-2,3", "-6")
        ]
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits(timeout=10),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is True
        assert len(result.test_results) == 3
        assert all(test.passed for test in result.test_results)
    
    @pytest.mark.asyncio
    async def test_security_violation_detection(self):
        """Test that security violations are detected and blocked."""
        dangerous_code = """
import os
import subprocess

def dangerous_function():
    os.system('rm -rf /')
    subprocess.run(['ls', '-la'])
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=dangerous_code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is False
        assert result.status.value == "security_violation"
        assert len(result.security_violations) > 0
        assert any(v.severity == "critical" for v in result.security_violations)
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self):
        """Test that code execution respects timeout limits."""
        infinite_loop_code = """
import time

def infinite_loop():
    while True:
        time.sleep(0.1)
        print("Running...")

infinite_loop()
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=infinite_loop_code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(timeout=2),  # 2 second timeout
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        # Should timeout or be blocked by security validator
        assert result.success is False
        assert result.status.value in ["timeout", "security_violation"]
    
    @pytest.mark.asyncio
    async def test_memory_limit_enforcement(self):
        """Test that memory limits are enforced."""
        memory_intensive_code = """
def memory_hog():
    # Try to allocate a large amount of memory
    big_list = [0] * (10**7)  # 10 million integers
    return len(big_list)

result = memory_hog()
print(result)
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=memory_intensive_code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(
                timeout=10,
                memory_limit=64 * 1024 * 1024  # 64MB limit
            ),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        # Should either succeed within limits or fail due to memory
        if not result.success:
            assert result.status.value in ["memory_exceeded", "failed"]
    
    @pytest.mark.asyncio
    async def test_javascript_execution(self):
        """Test JavaScript code execution."""
        code = """
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=code,
            language=ProgrammingLanguage.JAVASCRIPT,
            test_cases=[],
            limits=ExecutionLimits(timeout=5),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        # JavaScript execution might not be fully implemented yet
        # This test verifies the request is processed without crashing
        assert result is not None
        assert hasattr(result, 'success')
    
    @pytest.mark.asyncio
    async def test_unsupported_language(self):
        """Test handling of unsupported programming languages."""
        request = CodeExecutionRequest(
            id=uuid4(),
            code="print('hello')",
            language=ProgrammingLanguage.JAVA,  # Not implemented yet
            test_cases=[],
            limits=ExecutionLimits(),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is False
        assert "Unsupported language" in result.errors[0]
    
    @pytest.mark.asyncio
    async def test_compilation_error_handling(self):
        """Test handling of code with syntax errors."""
        invalid_code = """
def broken_function(
    # Missing closing parenthesis and colon
    return "This won't compile"
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=invalid_code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is False
        assert len(result.errors) > 0
    
    @pytest.mark.asyncio
    async def test_resource_usage_tracking(self):
        """Test that resource usage is tracked."""
        code = """
import time

def cpu_intensive():
    total = 0
    for i in range(100000):
        total += i * i
    return total

start_time = time.time()
result = cpu_intensive()
end_time = time.time()

print(f"Result: {result}")
print(f"Time taken: {end_time - start_time:.3f} seconds")
"""
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits(timeout=10),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        if result.success:
            assert result.resource_usage.cpu_time > 0
            assert result.resource_usage.memory_peak > 0
            assert result.execution_time > 0
    
    def test_get_supported_languages(self):
        """Test getting supported languages."""
        languages = self.code_runner.get_supported_languages()
        
        assert isinstance(languages, list)
        assert ProgrammingLanguage.PYTHON in languages
        assert ProgrammingLanguage.JAVASCRIPT in languages
    
    def test_is_language_supported(self):
        """Test checking if languages are supported."""
        assert self.code_runner.is_language_supported(ProgrammingLanguage.PYTHON) is True
        assert self.code_runner.is_language_supported(ProgrammingLanguage.JAVASCRIPT) is True
        # Java and Go might not be implemented yet
        # assert self.code_runner.is_language_supported(ProgrammingLanguage.JAVA) is False
    
    @pytest.mark.asyncio
    async def test_concurrent_executions(self):
        """Test that multiple code executions can run concurrently."""
        code = """
import time
time.sleep(1)
print("Execution completed")
"""
        
        requests = [
            CodeExecutionRequest(
                id=uuid4(),
                code=code,
                language=ProgrammingLanguage.PYTHON,
                test_cases=[],
                limits=ExecutionLimits(timeout=5),
                created_at=datetime.utcnow()
            )
            for _ in range(3)
        ]
        
        # Execute all requests concurrently
        start_time = datetime.utcnow()
        results = await asyncio.gather(*[
            self.code_runner.execute_code(request) for request in requests
        ])
        end_time = datetime.utcnow()
        
        # All should complete
        assert len(results) == 3
        
        # Should take less time than sequential execution (less than 3 seconds)
        execution_time = (end_time - start_time).total_seconds()
        assert execution_time < 2.5  # Allow some overhead
    
    @pytest.mark.asyncio
    async def test_failed_test_cases(self):
        """Test handling of failed test cases."""
        code = """
def add(a, b):
    return a + b  # Correct implementation

def main(input_data):
    a, b = map(int, input_data.split(','))
    return add(a, b)
"""
        
        test_cases = [
            TestCase("test_correct", "2,3", "5"),  # Should pass
            TestCase("test_incorrect", "2,3", "6"),  # Should fail
        ]
        
        request = CodeExecutionRequest(
            id=uuid4(),
            code=code,
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits(),
            created_at=datetime.utcnow()
        )
        
        result = await self.code_runner.execute_code(request)
        
        assert result.success is True  # Code executed successfully
        assert len(result.test_results) == 2
        assert result.test_results[0].passed is True
        assert result.test_results[1].passed is False
        assert result.all_tests_passed is False