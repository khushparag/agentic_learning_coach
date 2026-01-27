"""Example usage of the secure code execution service."""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.domain.entities.code_execution import (
    CodeExecutionRequest, ExecutionLimits, TestCase, ProgrammingLanguage
)
from src.domain.services.code_runner import SecureCodeRunner
from src.domain.services.security_validator import SecurityValidator


async def example_basic_execution():
    """Example of basic code execution."""
    print("=== Basic Code Execution Example ===")
    
    code_runner = SecureCodeRunner()
    
    # Simple Python code
    code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
"""
    
    request = CodeExecutionRequest(
        id=uuid4(),
        code=code,
        language=ProgrammingLanguage.PYTHON,
        test_cases=[],
        limits=ExecutionLimits(timeout=5),
        created_at=datetime.utcnow()
    )
    
    result = await code_runner.execute_code(request)
    
    print(f"Execution Status: {result.status}")
    print(f"Success: {result.success}")
    print(f"Output: {result.output}")
    print(f"Execution Time: {result.execution_time:.3f}s")
    print(f"Memory Used: {result.resource_usage.memory_peak} bytes")
    
    if result.errors:
        print(f"Errors: {result.errors}")


async def example_with_test_cases():
    """Example of code execution with test cases."""
    print("\n=== Code Execution with Test Cases Example ===")
    
    code_runner = SecureCodeRunner()
    
    # Code with a function to test
    code = """
def calculate_area(shape, **kwargs):
    if shape == "rectangle":
        return kwargs["width"] * kwargs["height"]
    elif shape == "circle":
        import math
        return math.pi * kwargs["radius"] ** 2
    elif shape == "triangle":
        return 0.5 * kwargs["base"] * kwargs["height"]
    else:
        return 0

def main(input_data):
    # Parse input: "shape,param1=value1,param2=value2"
    parts = input_data.split(',')
    shape = parts[0]
    params = {}
    for part in parts[1:]:
        key, value = part.split('=')
        params[key] = float(value)
    
    result = calculate_area(shape, **params)
    return f"{result:.2f}"
"""
    
    test_cases = [
        TestCase(
            name="test_rectangle",
            input_data="rectangle,width=5,height=3",
            expected_output="15.00"
        ),
        TestCase(
            name="test_circle",
            input_data="circle,radius=2",
            expected_output="12.57"
        ),
        TestCase(
            name="test_triangle",
            input_data="triangle,base=4,height=6",
            expected_output="12.00"
        )
    ]
    
    request = CodeExecutionRequest(
        id=uuid4(),
        code=code,
        language=ProgrammingLanguage.PYTHON,
        test_cases=test_cases,
        limits=ExecutionLimits(timeout=10),
        created_at=datetime.utcnow()
    )
    
    result = await code_runner.execute_code(request)
    
    print(f"Execution Status: {result.status}")
    print(f"Success: {result.success}")
    print(f"All Tests Passed: {result.all_tests_passed}")
    
    for test_result in result.test_results:
        status = "PASS" if test_result.passed else "FAIL"
        print(f"  {test_result.test_name}: {status}")
        if not test_result.passed:
            print(f"    Expected: {test_result.expected_output}")
            print(f"    Actual: {test_result.actual_output}")
            if test_result.error_message:
                print(f"    Error: {test_result.error_message}")


async def example_security_validation():
    """Example of security validation."""
    print("\n=== Security Validation Example ===")
    
    validator = SecurityValidator()
    
    # Safe code
    safe_code = """
import math
import json

def process_data(data):
    parsed = json.loads(data)
    result = math.sqrt(parsed['value'])
    return result
"""
    
    # Dangerous code
    dangerous_code = """
import os
import subprocess

def dangerous_function():
    os.system('rm -rf /')
    subprocess.run(['cat', '/etc/passwd'])
    eval("__import__('os').system('ls')")
"""
    
    print("Validating safe code:")
    safe_violations = validator.validate_code(safe_code, ProgrammingLanguage.PYTHON)
    print(f"  Violations found: {len(safe_violations)}")
    print(f"  Code is safe: {validator.is_code_safe(safe_code, ProgrammingLanguage.PYTHON)}")
    
    print("\nValidating dangerous code:")
    dangerous_violations = validator.validate_code(dangerous_code, ProgrammingLanguage.PYTHON)
    print(f"  Violations found: {len(dangerous_violations)}")
    print(f"  Code is safe: {validator.is_code_safe(dangerous_code, ProgrammingLanguage.PYTHON)}")
    
    print("\nSecurity violations in dangerous code:")
    for violation in dangerous_violations:
        print(f"  Line {violation.line_number}: {violation.description} (Severity: {violation.severity})")


async def example_security_blocked_execution():
    """Example of execution being blocked due to security violations."""
    print("\n=== Security Blocked Execution Example ===")
    
    code_runner = SecureCodeRunner()
    
    # Code with security violations
    malicious_code = """
import subprocess
import os

def hack_system():
    # Try to list files
    result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
    print(result.stdout)
    
    # Try to access system files
    os.system('cat /etc/passwd')

hack_system()
"""
    
    request = CodeExecutionRequest(
        id=uuid4(),
        code=malicious_code,
        language=ProgrammingLanguage.PYTHON,
        test_cases=[],
        limits=ExecutionLimits(),
        created_at=datetime.utcnow()
    )
    
    result = await code_runner.execute_code(request)
    
    print(f"Execution Status: {result.status}")
    print(f"Success: {result.success}")
    print(f"Has Security Violations: {result.has_security_violations}")
    
    if result.security_violations:
        print("Security violations detected:")
        for violation in result.security_violations:
            print(f"  - {violation.description} (Severity: {violation.severity})")
    
    if result.errors:
        print(f"Errors: {result.errors}")


async def example_resource_limits():
    """Example of resource limit enforcement."""
    print("\n=== Resource Limits Example ===")
    
    code_runner = SecureCodeRunner()
    
    # Memory-intensive code
    memory_code = """
def memory_test():
    # Allocate increasingly large lists
    data = []
    for i in range(1000):
        data.append([0] * 10000)  # 10k integers per iteration
    return len(data)

result = memory_test()
print(f"Allocated {result} lists")
"""
    
    # Test with low memory limit
    request = CodeExecutionRequest(
        id=uuid4(),
        code=memory_code,
        language=ProgrammingLanguage.PYTHON,
        test_cases=[],
        limits=ExecutionLimits(
            timeout=5,
            memory_limit=64 * 1024 * 1024,  # 64MB
            cpu_limit=1.0
        ),
        created_at=datetime.utcnow()
    )
    
    result = await code_runner.execute_code(request)
    
    print(f"Execution Status: {result.status}")
    print(f"Success: {result.success}")
    print(f"Execution Time: {result.execution_time:.3f}s")
    print(f"Memory Peak: {result.resource_usage.memory_peak / (1024*1024):.2f} MB")
    
    if not result.success:
        print(f"Execution failed: {result.errors}")


async def example_javascript_execution():
    """Example of JavaScript code execution."""
    print("\n=== JavaScript Execution Example ===")
    
    code_runner = SecureCodeRunner()
    
    # JavaScript code
    js_code = """
function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

function findPrimes(limit) {
    const primes = [];
    for (let i = 2; i <= limit; i++) {
        if (isPrime(i)) {
            primes.push(i);
        }
    }
    return primes;
}

const primes = findPrimes(20);
console.log('Primes up to 20:', primes);
"""
    
    request = CodeExecutionRequest(
        id=uuid4(),
        code=js_code,
        language=ProgrammingLanguage.JAVASCRIPT,
        test_cases=[],
        limits=ExecutionLimits(timeout=5),
        created_at=datetime.utcnow()
    )
    
    result = await code_runner.execute_code(request)
    
    print(f"Execution Status: {result.status}")
    print(f"Success: {result.success}")
    if result.success:
        print(f"Output: {result.output}")
    else:
        print(f"Errors: {result.errors}")


async def main():
    """Run all examples."""
    print("Secure Code Execution Service Examples")
    print("=" * 50)
    
    try:
        await example_basic_execution()
        await example_with_test_cases()
        await example_security_validation()
        await example_security_blocked_execution()
        await example_resource_limits()
        await example_javascript_execution()
        
    except Exception as e:
        print(f"Example failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("Examples completed!")


if __name__ == "__main__":
    asyncio.run(main())