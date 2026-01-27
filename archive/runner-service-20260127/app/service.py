"""Code execution service implementation - Simplified standalone version."""

import asyncio
import logging
import subprocess
import tempfile
import os
import re
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from .models import (
    CodeExecutionRequest, CodeExecutionResponse, TestResultResponse,
    ResourceUsageResponse, SecurityViolationResponse, LanguageInfoResponse
)


logger = logging.getLogger(__name__)


# Dangerous patterns to check for security violations
DANGEROUS_PATTERNS = [
    (r'eval\s*\(', 'eval() usage detected', 'high'),
    (r'exec\s*\(', 'exec() usage detected', 'high'),
    (r'__import__\s*\(', 'Dynamic import detected', 'medium'),
    (r'subprocess', 'subprocess module usage', 'high'),
    (r'os\.system', 'os.system() usage detected', 'high'),
    (r'os\.popen', 'os.popen() usage detected', 'high'),
    (r'open\s*\([^)]*["\']w', 'File write operation detected', 'medium'),
    (r'socket\s*\(', 'Socket creation detected', 'high'),
    (r'import\s+ctypes', 'ctypes import detected', 'high'),
]


class CodeExecutionService:
    """Simplified code execution service for standalone operation."""
    
    def __init__(self):
        self.supported_languages = ['python', 'javascript', 'typescript']
    
    async def execute_code(self, request: CodeExecutionRequest) -> CodeExecutionResponse:
        """Execute code in a sandboxed environment."""
        start_time = datetime.utcnow()
        request_id = uuid4()
        
        try:
            # Check for security violations
            violations = self._check_security(request.code)
            if violations:
                return CodeExecutionResponse(
                    request_id=request_id,
                    success=False,
                    status="security_violation",
                    output="",
                    errors=["Security violations detected in code"],
                    test_results=[],
                    resource_usage=ResourceUsageResponse(
                        cpu_time=0.0, memory_peak=0, memory_average=0,
                        disk_read=0, disk_write=0
                    ),
                    security_violations=violations,
                    execution_time=0.0,
                    all_tests_passed=False,
                    has_security_violations=True,
                    created_at=start_time
                )
            
            # Execute the code
            output, errors, exec_time = await self._run_code(
                request.code, 
                request.language,
                request.limits.timeout
            )
            
            # Run test cases if provided
            test_results = []
            all_passed = True
            
            if request.test_cases:
                for tc in request.test_cases:
                    result = await self._run_test(
                        request.code, 
                        request.language,
                        tc.input_data,
                        tc.expected_output,
                        tc.name,
                        tc.timeout or request.limits.timeout
                    )
                    test_results.append(result)
                    if not result.passed:
                        all_passed = False
            
            success = len(errors) == 0 and (not request.test_cases or all_passed)
            
            return CodeExecutionResponse(
                request_id=request_id,
                success=success,
                status="completed" if success else "failed",
                output=output,
                errors=errors,
                test_results=test_results,
                resource_usage=ResourceUsageResponse(
                    cpu_time=exec_time, memory_peak=0, memory_average=0,
                    disk_read=0, disk_write=0
                ),
                security_violations=[],
                execution_time=exec_time,
                all_tests_passed=all_passed,
                has_security_violations=False,
                created_at=start_time
            )
            
        except asyncio.TimeoutError:
            return CodeExecutionResponse(
                request_id=request_id,
                success=False,
                status="timeout",
                output="",
                errors=["Execution timed out"],
                test_results=[],
                resource_usage=ResourceUsageResponse(
                    cpu_time=request.limits.timeout, memory_peak=0, memory_average=0,
                    disk_read=0, disk_write=0
                ),
                security_violations=[],
                execution_time=float(request.limits.timeout),
                all_tests_passed=False,
                has_security_violations=False,
                created_at=start_time
            )
        except Exception as e:
            logger.error(f"Code execution failed: {e}", exc_info=True)
            return CodeExecutionResponse(
                request_id=request_id,
                success=False,
                status="error",
                output="",
                errors=[f"Internal error: {str(e)}"],
                test_results=[],
                resource_usage=ResourceUsageResponse(
                    cpu_time=0.0, memory_peak=0, memory_average=0,
                    disk_read=0, disk_write=0
                ),
                security_violations=[],
                execution_time=0.0,
                all_tests_passed=False,
                has_security_violations=False,
                created_at=start_time
            )
    
    def _check_security(self, code: str) -> List[SecurityViolationResponse]:
        """Check code for security violations."""
        violations = []
        lines = code.split('\n')
        
        for pattern, description, severity in DANGEROUS_PATTERNS:
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line, re.IGNORECASE):
                    violations.append(SecurityViolationResponse(
                        pattern=pattern,
                        line_number=i,
                        description=description,
                        severity=severity
                    ))
        
        return violations
    
    async def _run_code(self, code: str, language: str, timeout: int) -> tuple:
        """Run code and return output, errors, and execution time."""
        start = datetime.utcnow()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            if language == 'python':
                filepath = os.path.join(tmpdir, 'code.py')
                cmd = ['python', filepath]
            elif language in ['javascript', 'typescript']:
                filepath = os.path.join(tmpdir, 'code.js')
                cmd = ['node', filepath]
            else:
                return "", [f"Unsupported language: {language}"], 0.0
            
            with open(filepath, 'w') as f:
                f.write(code)
            
            try:
                proc = await asyncio.wait_for(
                    asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd=tmpdir
                    ),
                    timeout=timeout
                )
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=timeout
                )
                
                exec_time = (datetime.utcnow() - start).total_seconds()
                output = stdout.decode('utf-8', errors='replace')
                errors = []
                if stderr:
                    errors = [stderr.decode('utf-8', errors='replace')]
                if proc.returncode != 0 and not errors:
                    errors = [f"Process exited with code {proc.returncode}"]
                
                return output, errors, exec_time
                
            except asyncio.TimeoutError:
                raise
            except Exception as e:
                exec_time = (datetime.utcnow() - start).total_seconds()
                return "", [str(e)], exec_time
    
    async def _run_test(self, code: str, language: str, input_data: str, 
                        expected_output: str, test_name: str, timeout: int) -> TestResultResponse:
        """Run a single test case."""
        start = datetime.utcnow()
        
        # Wrap code with test input
        if language == 'python':
            test_code = f'''
import sys
from io import StringIO
sys.stdin = StringIO("""{input_data}""")
{code}
'''
        else:
            test_code = code
        
        output, errors, exec_time = await self._run_code(test_code, language, timeout)
        
        passed = output.strip() == expected_output.strip()
        
        return TestResultResponse(
            test_name=test_name,
            passed=passed,
            actual_output=output.strip(),
            expected_output=expected_output.strip(),
            execution_time=exec_time,
            error_message=errors[0] if errors else None
        )
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported programming languages."""
        return self.supported_languages
    
    def is_language_supported(self, language: str) -> bool:
        """Check if a programming language is supported."""
        return language.lower() in self.supported_languages
    
    def get_language_info(self) -> List[LanguageInfoResponse]:
        """Get detailed information about supported languages."""
        return [
            LanguageInfoResponse(
                name='python',
                version='3.11',
                supported=True,
                docker_image='python:3.11-slim',
                file_extension='.py',
                test_framework='pytest'
            ),
            LanguageInfoResponse(
                name='javascript',
                version='18',
                supported=True,
                docker_image='node:18-alpine',
                file_extension='.js',
                test_framework='jest'
            ),
            LanguageInfoResponse(
                name='typescript',
                version='5.0',
                supported=True,
                docker_image='node:18-alpine',
                file_extension='.ts',
                test_framework='jest'
            ),
        ]
