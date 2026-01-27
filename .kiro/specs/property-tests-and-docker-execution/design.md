# Design Document: Property-Based Tests and Docker Execution

## Overview

This design addresses two critical gaps in the Agentic Learning Coach system:

1. **Property-Based Testing Implementation**: Implementing the 30 correctness properties defined in the main design document using the Hypothesis library for Python
2. **Docker Execution Completion**: Replacing the current mocked code execution with actual Docker-based secure code execution

The implementation follows the existing clean architecture patterns and integrates seamlessly with the current codebase. Property-based tests will provide comprehensive validation of system correctness, while Docker execution will enable real, secure code evaluation for learners.

## Architecture

### Property-Based Testing Architecture

```
Test Suite
├── Unit Tests (existing)
├── Integration Tests (existing)
└── Property-Based Tests (new)
    ├── Agent Properties (10 properties)
    ├── Database Properties (5 properties)
    ├── Security Properties (8 properties)
    ├── Curriculum Properties (4 properties)
    └── API Properties (3 properties)
```

### Docker Execution Architecture

```
Code Submission Flow:
User Code → Security Validator → Docker Runner → Container Execution → Result Processing

Docker Runner Components:
├── Language Configurations (Python, JS, TS)
├── Container Manager (resource limits, isolation)
├── Test Runner Generator (per-language test harness)
└── Result Parser (output, test results, metrics)
```

## Components and Interfaces

### Property-Based Testing Framework

```python
from hypothesis import given, strategies as st, settings
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant
from typing import Any, Dict, List
import pytest

# Custom strategies for domain objects
@st.composite
def user_profile_strategy(draw):
    """Generate random valid user profiles."""
    return {
        'skill_level': draw(st.sampled_from(['beginner', 'intermediate', 'advanced', 'expert'])),
        'learning_goals': draw(st.lists(st.text(min_size=3, max_size=50), min_size=1, max_size=5)),
        'time_constraints': {
            'hours_per_week': draw(st.integers(min_value=1, max_value=40)),
            'preferred_times': draw(st.lists(st.sampled_from(['morning', 'afternoon', 'evening']), min_size=1))
        }
    }

@st.composite
def code_submission_strategy(draw, language='python'):
    """Generate random code submissions."""
    if language == 'python':
        code_templates = [
            'def solution(x):\n    return x * 2',
            'def solution(x):\n    return x + 1',
            'def solution(x):\n    return [i for i in range(x)]'
        ]
    else:
        code_templates = [
            'function solution(x) { return x * 2; }',
            'function solution(x) { return x + 1; }'
        ]
    
    return {
        'code': draw(st.sampled_from(code_templates)),
        'language': language,
        'test_cases': draw(st.lists(
            st.fixed_dictionaries({
                'input': st.integers(),
                'expected': st.integers()
            }),
            min_size=1,
            max_size=5
        ))
    }

# Property test configuration
PROPERTY_TEST_SETTINGS = settings(
    max_examples=100,  # Minimum 100 iterations per property
    deadline=None,  # No deadline for slow operations
    suppress_health_check=[HealthCheck.too_slow]
)
```

### Docker Runner Implementation

```python
import docker
import asyncio
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ContainerConfig:
    """Configuration for Docker container execution."""
    image: str
    command: str
    memory_limit: str = "256m"
    cpu_quota: int = 50000  # 50% of one CPU
    timeout: int = 10
    network_disabled: bool = True
    read_only: bool = True
    user: str = "nobody"
    security_opts: List[str] = None
    cap_drop: List[str] = None
    tmpfs: Dict[str, str] = None
    
    def __post_init__(self):
        if self.security_opts is None:
            self.security_opts = ['no-new-privileges:true']
        if self.cap_drop is None:
            self.cap_drop = ['ALL']
        if self.tmpfs is None:
            self.tmpfs = {'/tmp': 'size=100m,noexec'}

class DockerCodeRunner:
    """Secure code execution using Docker containers."""
    
    def __init__(self):
        self.docker_client = self._initialize_docker()
        self.language_configs = {
            'python': ContainerConfig(
                image='python:3.11-alpine',
                command='python /app/code.py'
            ),
            'javascript': ContainerConfig(
                image='node:18-alpine',
                command='node /app/code.js'
            ),
            'typescript': ContainerConfig(
                image='node:18-alpine',
                command='npx ts-node /app/code.ts'
            )
        }
    
    def _initialize_docker(self) -> docker.DockerClient:
        """Initialize Docker client with error handling."""
        try:
            client = docker.from_env()
            client.ping()
            return client
        except docker.errors.DockerException as e:
            raise DockerNotAvailableError(
                "Docker is not available. Please install Docker and ensure it's running.\n"
                "Installation instructions: https://docs.docker.com/get-docker/"
            ) from e
    
    async def execute_code(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]] = None,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute code in isolated Docker container."""
        
        # Get language configuration
        if language not in self.language_configs:
            return {
                'success': False,
                'error': f'Unsupported language: {language}',
                'output': ''
            }
        
        config = self.language_configs[language]
        if timeout:
            config.timeout = timeout
        
        # Create temporary directory for code
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Write code file
            code_file = temp_path / f'code.{self._get_extension(language)}'
            code_file.write_text(code)
            
            # Write test runner if tests provided
            if test_cases:
                test_runner = self._generate_test_runner(language, test_cases)
                test_file = temp_path / 'test_runner.py'
                test_file.write_text(test_runner)
                config.command = 'python /app/test_runner.py'
            
            # Execute in container
            return await self._run_container(temp_path, config)
    
    async def _run_container(
        self,
        code_path: Path,
        config: ContainerConfig
    ) -> Dict[str, Any]:
        """Run code in Docker container with resource limits."""
        
        try:
            # Create and start container
            container = self.docker_client.containers.run(
                image=config.image,
                command=config.command,
                volumes={str(code_path): {'bind': '/app', 'mode': 'ro'}},
                working_dir='/app',
                mem_limit=config.memory_limit,
                memswap_limit=config.memory_limit,
                cpu_quota=config.cpu_quota,
                cpu_period=100000,
                network_disabled=config.network_disabled,
                read_only=config.read_only,
                user=config.user,
                security_opt=config.security_opts,
                cap_drop=config.cap_drop,
                tmpfs=config.tmpfs,
                detach=True,
                remove=True
            )
            
            # Wait for completion with timeout
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(container.wait),
                    timeout=config.timeout
                )
                
                # Get logs
                logs = container.logs(stdout=True, stderr=True).decode('utf-8')
                
                # Get stats
                stats = container.stats(stream=False)
                memory_used = stats['memory_stats'].get('usage', 0)
                
                return {
                    'success': result['StatusCode'] == 0,
                    'exit_code': result['StatusCode'],
                    'output': logs,
                    'memory_used': memory_used,
                    'timeout': False
                }
                
            except asyncio.TimeoutError:
                container.kill()
                return {
                    'success': False,
                    'error': f'Execution timed out after {config.timeout} seconds',
                    'output': '',
                    'timeout': True
                }
                
        except docker.errors.ContainerError as e:
            return {
                'success': False,
                'error': f'Container error: {e.stderr.decode("utf-8") if e.stderr else str(e)}',
                'output': ''
            }
        except docker.errors.ImageNotFound:
            return {
                'success': False,
                'error': f'Docker image not found: {config.image}. Pulling image...',
                'output': ''
            }
    
    def _get_extension(self, language: str) -> str:
        """Get file extension for language."""
        extensions = {
            'python': 'py',
            'javascript': 'js',
            'typescript': 'ts'
        }
        return extensions.get(language, 'txt')
    
    def _generate_test_runner(
        self,
        language: str,
        test_cases: List[Dict[str, Any]]
    ) -> str:
        """Generate test runner code for language."""
        if language == 'python':
            return self._generate_python_test_runner(test_cases)
        elif language in ['javascript', 'typescript']:
            return self._generate_js_test_runner(test_cases)
        else:
            raise ValueError(f'Test runner not implemented for {language}')
    
    def _generate_python_test_runner(self, test_cases: List[Dict[str, Any]]) -> str:
        """Generate Python test runner with JSON output."""
        import json
        
        test_cases_json = json.dumps(test_cases)
        
        return f'''
import json
import sys
import traceback

# Import user code
try:
    from code import solution
except ImportError:
    print(json.dumps({{"error": "No solution function found in code"}}))
    sys.exit(1)

test_cases = {test_cases_json}
results = []

for i, test_case in enumerate(test_cases):
    try:
        actual = solution(test_case['input'])
        expected = test_case['expected']
        passed = actual == expected
        
        results.append({{
            'test_name': f'test_{{i+1}}',
            'passed': passed,
            'actual': str(actual),
            'expected': str(expected),
            'error': None
        }})
    except Exception as e:
        results.append({{
            'test_name': f'test_{{i+1}}',
            'passed': False,
            'actual': None,
            'expected': str(test_case['expected']),
            'error': str(e)
        }})

print(json.dumps({{"test_results": results}}))
'''
    
    def _generate_js_test_runner(self, test_cases: List[Dict[str, Any]]) -> str:
        """Generate JavaScript test runner with JSON output."""
        import json
        
        test_cases_json = json.dumps(test_cases)
        
        return f'''
const code = require('./code.js');
const testCases = {test_cases_json};
const results = [];

for (let i = 0; i < testCases.length; i++) {{
    try {{
        const actual = code.solution(testCases[i].input);
        const expected = testCases[i].expected;
        const passed = actual === expected;
        
        results.push({{
            test_name: `test_${{i+1}}`,
            passed: passed,
            actual: String(actual),
            expected: String(expected),
            error: null
        }});
    }} catch (e) {{
        results.push({{
            test_name: `test_${{i+1}}`,
            passed: false,
            actual: null,
            expected: String(testCases[i].expected),
            error: e.message
        }});
    }}
}}

console.log(JSON.stringify({{test_results: results}}));
'''
```

## Data Models

### Property Test Result Model

```python
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class PropertyTestResult:
    """Result of a property-based test execution."""
    property_name: str
    property_number: int
    validates_requirements: List[str]
    passed: bool
    iterations: int
    counterexample: Optional[Any] = None
    error_message: Optional[str] = None
    execution_time: float = 0.0
```

### Docker Execution Result Model

```python
@dataclass
class DockerExecutionResult:
    """Result of Docker code execution."""
    success: bool
    exit_code: int
    output: str
    errors: List[str]
    test_results: List[Dict[str, Any]]
    memory_used: int
    execution_time: float
    timeout: bool
    security_violations: List[str]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Container Isolation for All Code
*For any* code submission, executing it in the Docker_Runner should create an isolated container with enforced resource limits (memory, CPU, timeout).
**Validates: Requirements 2.1**

### Property 2: Timeout Enforcement
*For any* code that runs longer than the configured timeout, the Docker_Runner should terminate execution and return a timeout error.
**Validates: Requirements 2.3**

### Property 3: Memory Limit Enforcement
*For any* code that attempts to allocate more memory than the configured limit, the Docker_Runner should terminate execution and return a memory limit error.
**Validates: Requirements 2.4**

### Property 4: Network Access Blocking
*For any* code that attempts network access, the Docker_Runner should block the access and the code should fail or return an error.
**Validates: Requirements 2.5**

### Property 5: Security Scanning Before Execution
*For any* code submission, the Security_Validator should scan for dangerous patterns before Docker execution occurs.
**Validates: Requirements 3.1**

### Property 6: Critical Violation Rejection
*For any* code containing critical security violations (eval, exec, file system access), the system should reject execution and return specific violation details.
**Validates: Requirements 3.2**

### Property 7: Security Violation Logging
*For any* detected security violation, the system should create an audit log entry with violation details and timestamp.
**Validates: Requirements 3.4**

### Property 8: Test Failure Error Messages
*For any* property test failure, the Hypothesis framework should provide the specific counterexample that caused the failure.
**Validates: Requirements 4.5**

### Property 9: Container Security Configuration
*For any* Docker container created for code execution, it should have security options configured (no-new-privileges, cap-drop ALL).
**Validates: Requirements 5.2**

### Property 10: Read-Only Volume Mounting
*For any* code execution, the code should be mounted as a read-only volume, preventing modification of the code during execution.
**Validates: Requirements 5.3**

### Property 11: Tmpfs Configuration
*For any* Docker container created, it should have tmpfs configured for /tmp with size limits and noexec flag.
**Validates: Requirements 5.4**

### Property 12: Non-Root User Execution
*For any* Docker container created, it should run as a non-root user (nobody) to prevent privilege escalation.
**Validates: Requirements 5.5**

## Error Handling

### Docker Availability Handling

```python
class DockerNotAvailableError(Exception):
    """Raised when Docker is not available."""
    pass

class DockerExecutionFallback:
    """Fallback strategies when Docker is unavailable."""
    
    async def handle_docker_unavailable(
        self,
        code: str,
        language: str
    ) -> Dict[str, Any]:
        """Fallback to static analysis when Docker unavailable."""
        
        # Perform static analysis
        static_result = await self.static_analyzer.analyze(code, language)
        
        return {
            'success': False,
            'error': 'Docker execution unavailable',
            'fallback': 'static_analysis',
            'static_analysis': static_result,
            'message': (
                'Code execution requires Docker. '
                'Please install Docker: https://docs.docker.com/get-docker/'
            )
        }
```

### Property Test Failure Handling

```python
from hypothesis import example, seed

@given(user_profile=user_profile_strategy())
@settings(**PROPERTY_TEST_SETTINGS)
@example(user_profile={'skill_level': 'beginner', 'learning_goals': [], 'time_constraints': {}})
def test_curriculum_generation_with_examples(user_profile):
    """
    Property 4: Curriculum Generation Consistency
    Includes explicit examples for edge cases.
    """
    # Test implementation
    pass
```

## Testing Strategy

### Property-Based Test Organization

```
tests/
├── property/
│   ├── test_agent_properties.py (Properties 1-10 from main design)
│   ├── test_database_properties.py (Properties 3, 7, 13, 14, 24, 25)
│   ├── test_security_properties.py (Properties 12, 22, 26, 27)
│   ├── test_curriculum_properties.py (Properties 4, 5, 6, 16)
│   ├── test_docker_execution_properties.py (Properties 1-12 from this design)
│   └── conftest.py (shared fixtures and strategies)
```

### Test Execution Configuration

```python
# pytest.ini
[pytest]
markers =
    property: Property-based tests (run with --hypothesis-profile=ci)
    docker: Tests requiring Docker
    slow: Slow-running tests

# Hypothesis profiles
[tool.hypothesis]
profiles.default.max_examples = 100
profiles.ci.max_examples = 200
profiles.dev.max_examples = 50
```

### Docker Test Environment Setup

```python
import pytest
import docker

@pytest.fixture(scope="session")
def docker_client():
    """Provide Docker client for tests."""
    try:
        client = docker.from_env()
        client.ping()
        return client
    except docker.errors.DockerException:
        pytest.skip("Docker not available")

@pytest.fixture(scope="session")
def pull_test_images(docker_client):
    """Pull required Docker images before tests."""
    images = [
        'python:3.11-alpine',
        'node:18-alpine'
    ]
    
    for image in images:
        try:
            docker_client.images.pull(image)
        except docker.errors.ImageNotFound:
            pytest.skip(f"Could not pull image: {image}")
```

### Integration with Existing Tests

The property-based tests will complement the existing unit and integration tests:

- **Unit tests**: Test specific behaviors with known inputs
- **Property tests**: Validate universal properties across random inputs
- **Integration tests**: Test complete workflows end-to-end

All three test types will run in CI/CD, with property tests configured to run more iterations in the CI environment.

## Implementation Notes

### Hypothesis Library Usage

```python
# Example property test implementation
from hypothesis import given, strategies as st, settings
import pytest

@pytest.mark.property
@given(
    code=st.text(min_size=10, max_size=1000),
    language=st.sampled_from(['python', 'javascript', 'typescript'])
)
@settings(max_examples=100, deadline=None)
def test_property_1_container_isolation(code, language, docker_runner):
    """
    Feature: property-tests-and-docker-execution
    Property 1: Container Isolation for All Code
    
    For any code submission, executing it in the Docker_Runner should create
    an isolated container with enforced resource limits.
    """
    result = await docker_runner.execute_code(code, language)
    
    # Verify container was created with limits
    assert result is not None
    assert 'memory_used' in result
    assert result['memory_used'] <= 256 * 1024 * 1024  # 256MB limit
```

### Docker Image Management

```python
class DockerImageManager:
    """Manage Docker images for code execution."""
    
    def __init__(self, docker_client: docker.DockerClient):
        self.client = docker_client
        self.required_images = [
            'python:3.11-alpine',
            'node:18-alpine'
        ]
    
    async def ensure_images_available(self) -> bool:
        """Ensure all required images are available."""
        for image in self.required_images:
            try:
                self.client.images.get(image)
            except docker.errors.ImageNotFound:
                # Pull image
                self.client.images.pull(image)
        
        return True
    
    def get_image_info(self, image: str) -> Dict[str, Any]:
        """Get information about a Docker image."""
        try:
            img = self.client.images.get(image)
            return {
                'id': img.id,
                'tags': img.tags,
                'size': img.attrs['Size'],
                'created': img.attrs['Created']
            }
        except docker.errors.ImageNotFound:
            return None
```

## Deployment Considerations

### CI/CD Integration

```yaml
# .github/workflows/property-tests.yml
name: Property-Based Tests

on: [push, pull_request]

jobs:
  property-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt
          pip install hypothesis pytest-hypothesis
      
      - name: Run property tests
        run: |
          pytest tests/property/ -v --hypothesis-profile=ci
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: property-test-results
          path: test-results/

  docker-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker
        uses: docker/setup-buildx-action@v2
      
      - name: Pull test images
        run: |
          docker pull python:3.11-alpine
          docker pull node:18-alpine
      
      - name: Run Docker execution tests
        run: |
          pytest tests/property/test_docker_execution_properties.py -v -m docker
```

### Development Environment Setup

```bash
# setup-property-tests.sh
#!/bin/bash

echo "Setting up property-based testing environment..."

# Install Python dependencies
pip install hypothesis pytest-hypothesis

# Install Docker (if not present)
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi

# Pull required Docker images
echo "Pulling Docker images..."
docker pull python:3.11-alpine
docker pull node:18-alpine

# Run test suite
echo "Running property tests..."
pytest tests/property/ -v --hypothesis-profile=dev

echo "Setup complete!"
```

## Success Metrics

### Property Test Coverage

- All 30 properties from main design document implemented
- All 12 properties from this design document implemented
- Minimum 100 iterations per property test
- Property tests run in < 5 minutes in CI

### Docker Execution Metrics

- Code execution success rate > 95%
- Average execution time < 2 seconds for simple code
- Memory limit enforcement 100% effective
- Timeout enforcement 100% effective
- Zero security breaches from code execution

### Quality Metrics

- Property test failure rate < 1% (excluding intentional failures)
- Docker availability check success rate > 99%
- Fallback to static analysis works 100% when Docker unavailable
- All security violations detected before execution
