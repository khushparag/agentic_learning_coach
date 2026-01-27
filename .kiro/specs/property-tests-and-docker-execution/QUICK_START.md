# Property Tests - Quick Start Guide

## Prerequisites

1. **Python 3.11+** installed
2. **Hypothesis library** installed: `pip install hypothesis pytest-hypothesis`
3. **Docker** (optional, for Docker execution tests)

## Running Tests

### Quick Test Run (Development)
```bash
# Run all property tests with dev profile (10 examples)
pytest tests/property/ -v

# Run specific test file
pytest tests/property/test_docker_execution.py -v
```

### Comprehensive Test Run (CI Profile)
```bash
# Run with CI profile (200 examples per property)
pytest tests/property/ -v --hypothesis-profile=ci
```

### Docker Tests Only
```bash
# Run only tests that require Docker
pytest tests/property/ -v -m docker

# Skip Docker tests
pytest tests/property/ -v -m "not docker"
```

### Specific Property Tests
```bash
# Agent tests
pytest tests/property/test_agent_properties.py -v

# Database tests
pytest tests/property/test_database_properties.py -v

# Orchestration tests
pytest tests/property/test_orchestration_properties.py -v

# Resource discovery tests
pytest tests/property/test_resource_discovery.py -v

# Curriculum adaptation tests
pytest tests/property/test_curriculum_adaptation.py -v

# API tests
pytest tests/property/test_api_properties.py -v

# Configuration tests
pytest tests/property/test_configuration_properties.py -v
```

## Test Profiles

### Development Profile (Default)
- **Iterations**: 10 examples per property
- **Deadline**: 1 second
- **Use case**: Quick feedback during development

```bash
pytest tests/property/ -v
```

### CI Profile
- **Iterations**: 200 examples per property
- **Deadline**: None
- **Use case**: Comprehensive validation in CI/CD

```bash
pytest tests/property/ -v --hypothesis-profile=ci
```

### Custom Profile
```bash
# Run with custom number of examples
pytest tests/property/ -v --hypothesis-max-examples=500
```

## Understanding Test Output

### Successful Test
```
tests/property/test_docker_execution.py::test_property_1_container_isolation PASSED [100%]
```

### Failed Test with Counterexample
```
tests/property/test_agent_properties.py::test_property_1_goal_extraction FAILED
Falsifying example: test_property_1_goal_extraction(
    user_input='invalid input that breaks the property'
)
```

Hypothesis will show you the exact input that caused the failure.

## Common Issues

### Issue: Docker Not Available
```
SKIPPED [1] Docker is not available
```
**Solution**: Install Docker or skip Docker tests with `-m "not docker"`

### Issue: Tests Timeout
```
Hypothesis: Deadline exceeded
```
**Solution**: Use `--hypothesis-deadline=None` or increase deadline

### Issue: Import Errors
```
ModuleNotFoundError: No module named 'hypothesis'
```
**Solution**: Install dependencies: `pip install -r requirements-dev.txt`

## Test Coverage

### Run with Coverage Report
```bash
# Generate HTML coverage report
pytest tests/property/ -v --cov=src --cov-report=html

# View report
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
```

### Coverage by Component
```bash
# Coverage for specific module
pytest tests/property/ -v --cov=src.domain.services --cov-report=term-missing
```

## Debugging Tests

### Run Single Test
```bash
# Run specific test function
pytest tests/property/test_docker_execution.py::TestDockerInitialization::test_property_1_container_isolation -v
```

### Show Print Statements
```bash
# Show print output during tests
pytest tests/property/ -v -s
```

### Stop on First Failure
```bash
# Stop after first failure
pytest tests/property/ -v -x
```

### Show Full Traceback
```bash
# Show full error traceback
pytest tests/property/ -v --tb=long
```

## Property Test Examples

### Example 1: Container Isolation
```python
@given(code=st.text(min_size=1, max_size=1000))
def test_property_1_container_isolation(code):
    """All code should execute in isolated containers."""
    result = await code_runner.execute_code(code, 'python')
    assert result.status in ['success', 'failed', 'timeout']
```

### Example 2: Database Round-trip
```python
@given(profile=user_profile_strategy())
def test_property_3_profile_persistence(profile):
    """Saved profiles should be retrievable unchanged."""
    saved = await repo.save_profile(profile)
    retrieved = await repo.get_profile(saved.user_id)
    assert retrieved.user_id == profile.user_id
```

### Example 3: Intent Routing
```python
@given(message=st.text(min_size=5, max_size=200))
def test_property_20_intent_routing(message):
    """All messages should route to exactly one agent."""
    routing = orchestrator.route_message(message)
    assert routing.agent in VALID_AGENTS
```

## Performance Tips

### Parallel Execution
```bash
# Run tests in parallel (requires pytest-xdist)
pytest tests/property/ -v -n auto
```

### Selective Test Execution
```bash
# Run only fast tests
pytest tests/property/ -v -m "not slow"

# Run only critical tests
pytest tests/property/ -v -k "critical"
```

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Property Tests
  run: |
    pytest tests/property/ -v --hypothesis-profile=ci --junitxml=test-results.xml
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.xml
```

## Next Steps

1. **Run all tests**: `pytest tests/property/ -v`
2. **Check results**: All tests should pass
3. **Review coverage**: `pytest tests/property/ -v --cov=src --cov-report=html`
4. **Add to CI/CD**: Integrate into your pipeline

## Resources

- **Hypothesis Documentation**: https://hypothesis.readthedocs.io/
- **Property-Based Testing Guide**: `docs/PROPERTY_TESTING.md` (coming soon)
- **Docker Execution Guide**: `docs/DOCKER_EXECUTION.md` (coming soon)
- **Troubleshooting**: `docs/TROUBLESHOOTING.md` (coming soon)

## Support

For issues or questions:
1. Check the test output for counterexamples
2. Review the property definition in the test docstring
3. Check the design document for property specifications
4. Review the progress summary for implementation details
