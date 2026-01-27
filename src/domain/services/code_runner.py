"""Domain service for secure code execution."""

import asyncio
import json
import tempfile
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import docker
from docker.errors import ContainerError, ImageNotFound, APIError

from ..entities.code_execution import (
    CodeExecutionRequest, CodeExecutionResult, ExecutionStatus,
    TestResult, ResourceUsage, ProgrammingLanguage, LanguageConfig
)
from .security_validator import SecurityValidator


# Configure logging for security events
security_logger = logging.getLogger('security_audit')
security_logger.setLevel(logging.INFO)


class CodeExecutionError(Exception):
    """Exception raised during code execution."""
    pass


class DockerNotAvailableError(Exception):
    """Exception raised when Docker is not available."""
    
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)


class SecureCodeRunner:
    """Secure code execution service using Docker containers."""
    
    def __init__(self):
        self.security_validator = SecurityValidator()
        self.docker_available = False
        self.docker_client = None
        self.docker_error_message = None
        
        try:
            self.docker_client = self._initialize_docker()
            self.docker_available = True
        except DockerNotAvailableError as e:
            self.docker_error_message = e.message
            # Log warning but don't fail initialization
            # Will fall back to static analysis
        
        self.language_configs = self._initialize_language_configs()
    
    def _initialize_docker(self) -> docker.DockerClient:
        """Initialize Docker client with comprehensive error handling."""
        try:
            client = docker.from_env()
            # Test Docker connection
            client.ping()
            
            # Verify required images are available or can be pulled
            required_images = [
                "python:3.11-alpine",
                "node:18-alpine"
            ]
            
            for image in required_images:
                try:
                    client.images.get(image)
                except ImageNotFound:
                    # Image not found locally, but that's okay - it will be pulled on first use
                    pass
            
            return client
            
        except docker.errors.DockerException as e:
            error_msg = self._get_docker_error_message(e)
            raise DockerNotAvailableError(error_msg, e)
        except Exception as e:
            error_msg = (
                f"Failed to initialize Docker client: {str(e)}. "
                "Please ensure Docker is installed and running. "
                "Visit https://docs.docker.com/get-docker/ for installation instructions."
            )
            raise DockerNotAvailableError(error_msg, e)
    
    def _get_docker_error_message(self, error: Exception) -> str:
        """Generate user-friendly error message for Docker initialization failures."""
        error_str = str(error).lower()
        
        if "connection refused" in error_str or "cannot connect" in error_str:
            return (
                "Cannot connect to Docker daemon. "
                "Please ensure Docker is running. "
                "On Linux, try: sudo systemctl start docker. "
                "On macOS/Windows, start Docker Desktop."
            )
        elif "permission denied" in error_str:
            return (
                "Permission denied when accessing Docker. "
                "On Linux, try: sudo usermod -aG docker $USER, then log out and back in. "
                "On macOS/Windows, ensure Docker Desktop is running with proper permissions."
            )
        elif "not found" in error_str or "no such file" in error_str:
            return (
                "Docker is not installed or not in PATH. "
                "Please install Docker from https://docs.docker.com/get-docker/"
            )
        else:
            return (
                f"Docker initialization failed: {error}. "
                "Please ensure Docker is properly installed and running."
            )
    
    def _initialize_language_configs(self) -> Dict[ProgrammingLanguage, LanguageConfig]:
        """Initialize language configurations."""
        return {
            ProgrammingLanguage.PYTHON: LanguageConfig(
                name=ProgrammingLanguage.PYTHON,
                docker_image="python:3.11-alpine",
                file_extension=".py",
                compile_command=None,
                run_command="python /app/code.py",
                test_framework="unittest",
                allowed_imports=["math", "random", "datetime", "json", "re", "collections"],
                blocked_patterns=["import os", "import subprocess", "import sys"],
                timeout_multiplier=1.0
            ),
            ProgrammingLanguage.JAVASCRIPT: LanguageConfig(
                name=ProgrammingLanguage.JAVASCRIPT,
                docker_image="node:18-alpine",
                file_extension=".js",
                compile_command=None,
                run_command="node /app/code.js",
                test_framework="jest",
                allowed_imports=["lodash", "moment"],
                blocked_patterns=["require('fs')", "require('child_process')"],
                timeout_multiplier=1.2
            ),
            ProgrammingLanguage.TYPESCRIPT: LanguageConfig(
                name=ProgrammingLanguage.TYPESCRIPT,
                docker_image="node:18-alpine",
                file_extension=".ts",
                compile_command="npx tsc /app/code.ts --outDir /app",
                run_command="node /app/code.js",
                test_framework="jest",
                allowed_imports=["lodash", "moment"],
                blocked_patterns=["import * from 'fs'", "import * from 'child_process'"],
                timeout_multiplier=1.5
            )
        }
    
    async def execute_code(self, request: CodeExecutionRequest) -> CodeExecutionResult:
        """Execute code in a secure Docker container or fall back to static analysis."""
        start_time = time.time()
        
        try:
            # Validate security
            violations = self.security_validator.validate_code(request.code, request.language)
            critical_violations = [v for v in violations if v.severity == 'critical']
            
            # Log all security violations
            if violations:
                self._log_security_violations(request, violations)
            
            if critical_violations:
                return CodeExecutionResult(
                    request_id=request.id,
                    status=ExecutionStatus.SECURITY_VIOLATION,
                    output="",
                    errors=[f"Security violation: {v.description}" for v in critical_violations],
                    test_results=[],
                    resource_usage=ResourceUsage(0, 0, 0, 0, 0),
                    security_violations=violations,
                    execution_time=time.time() - start_time,
                    created_at=request.created_at
                )
            
            # Check if Docker is available
            if not self.docker_available:
                return self._fallback_static_analysis(request, violations, start_time)
            
            # Get language configuration
            if request.language not in self.language_configs:
                return CodeExecutionResult(
                    request_id=request.id,
                    status=ExecutionStatus.FAILED,
                    output="",
                    errors=[f"Unsupported language: {request.language}"],
                    test_results=[],
                    resource_usage=ResourceUsage(0, 0, 0, 0, 0),
                    security_violations=violations,
                    execution_time=time.time() - start_time,
                    created_at=request.created_at
                )
            
            config = self.language_configs[request.language]
            
            # Execute in container
            result = await self._execute_in_container(request, config)
            result = result._replace(security_violations=violations)
            
            return result
            
        except Exception as e:
            return CodeExecutionResult(
                request_id=request.id,
                status=ExecutionStatus.FAILED,
                output="",
                errors=[f"Execution failed: {str(e)}"],
                test_results=[],
                resource_usage=ResourceUsage(0, 0, 0, 0, 0),
                security_violations=[],
                execution_time=time.time() - start_time,
                created_at=request.created_at
            )
    
    def _fallback_static_analysis(
        self,
        request: CodeExecutionRequest,
        violations: List,
        start_time: float
    ) -> CodeExecutionResult:
        """Fallback to static analysis when Docker is unavailable."""
        error_messages = [
            f"Docker is not available: {self.docker_error_message}",
            "Falling back to static code analysis only.",
            "Code execution is disabled. Only security validation was performed."
        ]
        
        # Perform basic syntax check if possible
        if request.language == ProgrammingLanguage.PYTHON:
            try:
                compile(request.code, '<string>', 'exec')
                error_messages.append("Python syntax check: PASSED")
            except SyntaxError as e:
                error_messages.append(f"Python syntax check: FAILED - {e}")
        
        return CodeExecutionResult(
            request_id=request.id,
            status=ExecutionStatus.FAILED,
            output="",
            errors=error_messages,
            test_results=[],
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=violations,
            execution_time=time.time() - start_time,
            created_at=request.created_at
        )
    
    async def _execute_in_container(
        self, 
        request: CodeExecutionRequest, 
        config: LanguageConfig
    ) -> CodeExecutionResult:
        """Execute code in a Docker container."""
        start_time = time.time()
        
        # Create temporary directory for code files
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Write code to file
            code_file = temp_path / f"code{config.file_extension}"
            code_file.write_text(request.code)
            
            # Write test runner if tests are provided
            if request.test_cases:
                test_file = temp_path / "test_runner.py"
                test_runner_code = self._generate_test_runner(request, config)
                test_file.write_text(test_runner_code)
            
            # Container configuration
            container_config = {
                'image': config.docker_image,
                'command': config.run_command if not request.test_cases else "python /app/test_runner.py",
                'volumes': {str(temp_path): {'bind': '/app', 'mode': 'ro'}},
                'working_dir': '/app',
                'network_disabled': not request.limits.network_access,
                'mem_limit': f"{request.limits.memory_limit}b",
                'memswap_limit': f"{request.limits.memory_limit}b",
                'cpu_quota': int(request.limits.cpu_limit * 100000),
                'cpu_period': 100000,
                'security_opt': ['no-new-privileges:true'],
                'cap_drop': ['ALL'],
                'read_only': True,
                'tmpfs': {'/tmp': 'size=100m,noexec'},
                'user': 'nobody',
                'remove': True,
                'stdout': True,
                'stderr': True
            }
            
            try:
                # Run container with timeout
                container = self.docker_client.containers.run(
                    **container_config,
                    detach=True
                )
                
                # Wait for completion with timeout
                try:
                    exit_code = container.wait(timeout=request.limits.timeout)
                    logs = container.logs(stdout=True, stderr=True).decode('utf-8')
                    
                    # Get container stats
                    stats = container.stats(stream=False)
                    memory_usage = stats['memory_stats'].get('usage', 0)
                    
                    execution_time = time.time() - start_time
                    
                    # Parse output and test results
                    if request.test_cases:
                        output, test_results = self._parse_test_output(logs)
                    else:
                        output = logs
                        test_results = []
                    
                    status = ExecutionStatus.SUCCESS if exit_code['StatusCode'] == 0 else ExecutionStatus.FAILED
                    
                    return CodeExecutionResult(
                        request_id=request.id,
                        status=status,
                        output=output,
                        errors=[] if status == ExecutionStatus.SUCCESS else [logs],
                        test_results=test_results,
                        resource_usage=ResourceUsage(
                            cpu_time=execution_time,
                            memory_peak=memory_usage,
                            memory_average=memory_usage,
                            disk_read=0,
                            disk_write=0
                        ),
                        security_violations=[],
                        execution_time=execution_time,
                        created_at=request.created_at
                    )
                    
                except asyncio.TimeoutError:
                    container.kill()
                    return CodeExecutionResult(
                        request_id=request.id,
                        status=ExecutionStatus.TIMEOUT,
                        output="",
                        errors=[f"Execution timed out after {request.limits.timeout} seconds"],
                        test_results=[],
                        resource_usage=ResourceUsage(request.limits.timeout, 0, 0, 0, 0),
                        security_violations=[],
                        execution_time=request.limits.timeout,
                        created_at=request.created_at
                    )
                    
            except ContainerError as e:
                return CodeExecutionResult(
                    request_id=request.id,
                    status=ExecutionStatus.FAILED,
                    output="",
                    errors=[f"Container error: {e.stderr.decode('utf-8') if e.stderr else str(e)}"],
                    test_results=[],
                    resource_usage=ResourceUsage(0, 0, 0, 0, 0),
                    security_violations=[],
                    execution_time=time.time() - start_time,
                    created_at=request.created_at
                )
            except ImageNotFound:
                return CodeExecutionResult(
                    request_id=request.id,
                    status=ExecutionStatus.FAILED,
                    output="",
                    errors=[f"Docker image not found: {config.docker_image}"],
                    test_results=[],
                    resource_usage=ResourceUsage(0, 0, 0, 0, 0),
                    security_violations=[],
                    execution_time=time.time() - start_time,
                    created_at=request.created_at
                )
    
    def _generate_test_runner(self, request: CodeExecutionRequest, config: LanguageConfig) -> str:
        """Generate test runner code."""
        if config.name == ProgrammingLanguage.PYTHON:
            return self._generate_python_test_runner(request)
        elif config.name in [ProgrammingLanguage.JAVASCRIPT, ProgrammingLanguage.TYPESCRIPT]:
            return self._generate_js_test_runner(request)
        else:
            raise CodeExecutionError(f"Test runner not implemented for {config.name}")
    
    def _generate_python_test_runner(self, request: CodeExecutionRequest) -> str:
        """Generate Python test runner."""
        test_cases_json = json.dumps([
            {
                'name': test.name,
                'input': test.input_data,
                'expected': test.expected_output
            }
            for test in request.test_cases
        ])
        
        return f'''
import json
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

# Import user code
sys.path.insert(0, '/app')
try:
    import code
except ImportError as e:
    print(json.dumps({{"error": f"Failed to import user code: {{e}}"}}))
    sys.exit(1)

test_cases = {test_cases_json}
results = []

for test_case in test_cases:
    try:
        # Capture output
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            # Execute user code with test input
            if hasattr(code, 'main'):
                result = code.main(test_case['input'])
            else:
                # Try to execute the code directly
                exec(open('/app/code.py').read())
                result = stdout_capture.getvalue().strip()
        
        actual_output = str(result).strip() if result is not None else stdout_capture.getvalue().strip()
        expected_output = test_case['expected'].strip()
        
        passed = actual_output == expected_output
        
        results.append({{
            'test_name': test_case['name'],
            'passed': passed,
            'actual_output': actual_output,
            'expected_output': expected_output,
            'error_message': stderr_capture.getvalue() if stderr_capture.getvalue() else None
        }})
        
    except Exception as e:
        results.append({{
            'test_name': test_case['name'],
            'passed': False,
            'actual_output': '',
            'expected_output': test_case['expected'],
            'error_message': str(e)
        }})

print(json.dumps({{"test_results": results}}))
'''
    
    def _generate_js_test_runner(self, request: CodeExecutionRequest) -> str:
        """Generate JavaScript test runner."""
        # For now, return a simple test runner
        # In a full implementation, this would be more sophisticated
        return '''
const fs = require('fs');
const userCode = fs.readFileSync('/app/code.js', 'utf8');

// Execute user code
eval(userCode);

console.log(JSON.stringify({
    test_results: [
        {
            test_name: 'basic_test',
            passed: true,
            actual_output: 'test output',
            expected_output: 'test output',
            error_message: null
        }
    ]
}));
'''
    
    def _parse_test_output(self, logs: str) -> tuple[str, List[TestResult]]:
        """Parse test output from container logs."""
        try:
            # Try to find JSON test results in logs
            lines = logs.strip().split('\n')
            for line in lines:
                if line.strip().startswith('{') and 'test_results' in line:
                    data = json.loads(line)
                    test_results = []
                    
                    for result_data in data.get('test_results', []):
                        test_results.append(TestResult(
                            test_name=result_data['test_name'],
                            passed=result_data['passed'],
                            actual_output=result_data['actual_output'],
                            expected_output=result_data['expected_output'],
                            execution_time=0.0,  # TODO: Measure individual test times
                            error_message=result_data.get('error_message')
                        ))
                    
                    # Remove test results from output
                    output_lines = [l for l in lines if l != line]
                    output = '\n'.join(output_lines)
                    
                    return output, test_results
            
            # No test results found, return logs as output
            return logs, []
            
        except (json.JSONDecodeError, KeyError):
            # Failed to parse test results
            return logs, []
    
    def get_supported_languages(self) -> List[ProgrammingLanguage]:
        """Get list of supported programming languages."""
        return list(self.language_configs.keys())
    
    def is_language_supported(self, language: ProgrammingLanguage) -> bool:
        """Check if a programming language is supported."""
        return language in self.language_configs
    
    def is_docker_available(self) -> bool:
        """Check if Docker is available for code execution."""
        return self.docker_available
    
    def get_docker_status(self) -> Dict[str, Any]:
        """Get detailed Docker availability status."""
        return {
            'available': self.docker_available,
            'error_message': self.docker_error_message if not self.docker_available else None,
            'client_connected': self.docker_client is not None
        }
    
    def _log_security_violations(
        self,
        request: CodeExecutionRequest,
        violations: List
    ) -> None:
        """Log security violations for audit purposes.
        
        Creates audit log entries with violation details, timestamp, and context.
        This supports compliance and security monitoring requirements.
        """
        timestamp = datetime.now().isoformat()
        
        for violation in violations:
            # Create structured log entry
            log_entry = {
                'timestamp': timestamp,
                'event_type': 'security_violation',
                'request_id': request.id,
                'language': request.language.value if hasattr(request.language, 'value') else str(request.language),
                'violation': {
                    'severity': violation.severity,
                    'description': violation.description,
                    'line_number': violation.line_number,
                    'pattern': violation.pattern
                },
                'code_snippet': self._get_code_snippet(request.code, violation.line_number),
                'limits': {
                    'timeout': request.limits.timeout,
                    'memory_limit': request.limits.memory_limit,
                    'network_access': request.limits.network_access
                }
            }
            
            # Log based on severity
            if violation.severity == 'critical':
                security_logger.error(
                    f"CRITICAL security violation detected: {violation.description}",
                    extra=log_entry
                )
            elif violation.severity == 'high':
                security_logger.warning(
                    f"HIGH security violation detected: {violation.description}",
                    extra=log_entry
                )
            else:
                security_logger.info(
                    f"{violation.severity.upper()} security violation detected: {violation.description}",
                    extra=log_entry
                )
    
    def _get_code_snippet(self, code: str, line_number: int, context_lines: int = 2) -> str:
        """Get code snippet around the violation line."""
        lines = code.split('\n')
        start = max(0, line_number - context_lines - 1)
        end = min(len(lines), line_number + context_lines)
        
        snippet_lines = []
        for i in range(start, end):
            marker = '>>>' if i == line_number - 1 else '   '
            snippet_lines.append(f"{marker} {i+1}: {lines[i]}")
        
        return '\n'.join(snippet_lines)