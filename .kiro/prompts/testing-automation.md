---
description: Comprehensive testing automation for multi-agent learning system
---

# Testing Automation Prompt

Automate comprehensive testing for the Agentic Learning Coach system including unit tests, integration tests, property-based tests, and end-to-end testing.

## Context
You are testing a complex multi-agent system with:
- 7 specialized agents (Profile, Curriculum, Exercise, Reviewer, Resources, Progress, Orchestrator)
- FastAPI backend with 47+ endpoints
- PostgreSQL and Qdrant databases
- Code execution service
- React frontend with gamification and social features

## Input Parameters
- **test_type**: Type of testing (unit, integration, property, e2e, all)
- **coverage_threshold**: Minimum coverage percentage (default: 90)
- **parallel**: Run tests in parallel (default: true)
- **environment**: Test environment (local, ci, docker)
- **agents**: Specific agents to test (optional, defaults to all)

## Testing Strategy

### 1. Unit Testing (80% of test pyramid)
```bash
echo "🧪 Running unit tests..."

# Test domain entities
pytest tests/unit/domain/ -v --cov=src/domain --cov-report=term-missing

# Test individual agents
for agent in profile curriculum exercise reviewer resources progress orchestrator; do
    echo "Testing ${agent} agent..."
    pytest tests/unit/agents/test_${agent}_agent.py -v \
        --cov=src/agents/${agent}_agent.py \
        --cov-report=term-missing
done

# Test services and adapters
pytest tests/unit/adapters/ -v --cov=src/adapters --cov-report=term-missing
pytest tests/unit/ports/ -v --cov=src/ports --cov-report=term-missing
```

### 2. Integration Testing (15% of test pyramid)
```bash
echo "🔗 Running integration tests..."

# Database integration
pytest tests/integration/test_database_integration.py -v

# API endpoint integration
pytest tests/integration/test_api_endpoints.py -v

# Agent communication integration
pytest tests/integration/test_agents_integration.py -v

# External service integration (MCP tools)
pytest tests/integration/test_mcp_integration.py -v

# Code runner service integration
pytest tests/integration/test_code_runner_service.py -v
```

### 3. Property-Based Testing (Advanced)
```bash
echo "🎲 Running property-based tests..."

# Agent behavior properties
pytest tests/property/test_agent_properties.py -v \
    --hypothesis-show-statistics

# Database consistency properties
pytest tests/property/test_database_properties.py -v

# API contract properties
pytest tests/property/test_api_properties.py -v

# Curriculum adaptation properties
pytest tests/property/test_curriculum_adaptation.py -v
```

### 4. End-to-End Testing (5% of test pyramid)
```bash
echo "🎭 Running end-to-end tests..."

# Start test environment
docker-compose -f docker-compose.test.yml up -d
sleep 30

# Frontend E2E tests
cd frontend
npm run test:e2e

# API workflow tests
pytest tests/e2e/test_learning_journey.py -v
pytest tests/e2e/test_complete_workflow.py -v

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Test Categories

### Agent-Specific Testing
```bash
test_agent() {
    local agent_name=$1
    echo "🤖 Testing ${agent_name} agent..."
    
    # Unit tests
    pytest tests/unit/agents/test_${agent_name}_agent.py -v
    
    # Integration tests
    pytest tests/integration/test_${agent_name}_integration.py -v
    
    # Property tests
    pytest tests/property/test_${agent_name}_properties.py -v
    
    # Performance tests
    pytest tests/performance/test_${agent_name}_performance.py -v
}

# Test all agents
for agent in "${agents[@]}"; do
    test_agent $agent
done
```

### API Testing
```bash
echo "🌐 Testing API endpoints..."

# Health checks
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:8000/health/detailed || exit 1

# Authentication endpoints
pytest tests/api/test_auth_endpoints.py -v

# Core learning endpoints
pytest tests/api/test_goals_api.py -v
pytest tests/api/test_curriculum_api.py -v
pytest tests/api/test_tasks_api.py -v
pytest tests/api/test_submissions_api.py -v
pytest tests/api/test_progress_api.py -v

# Advanced features
pytest tests/api/test_analytics_api.py -v
pytest tests/api/test_gamification_api.py -v
pytest tests/api/test_social_api.py -v
```

### Security Testing
```bash
echo "🔒 Running security tests..."

# Input validation tests
pytest tests/security/test_input_validation.py -v

# Code execution security
pytest tests/security/test_code_execution_security.py -v

# Authentication and authorization
pytest tests/security/test_auth_security.py -v

# SQL injection prevention
pytest tests/security/test_sql_injection.py -v

# XSS prevention
pytest tests/security/test_xss_prevention.py -v
```

### Performance Testing
```bash
echo "⚡ Running performance tests..."

# Agent response times
pytest tests/performance/test_agent_performance.py -v

# API response times
pytest tests/performance/test_api_performance.py -v

# Database query performance
pytest tests/performance/test_database_performance.py -v

# Memory usage tests
pytest tests/performance/test_memory_usage.py -v

# Load testing with locust
locust -f tests/performance/locustfile.py --headless -u 50 -r 10 -t 60s
```

## Test Data Management

### Test Fixtures
```python
# Generate test data
@pytest.fixture
def sample_user_profile():
    return UserProfile(
        user_id="test-user-123",
        skill_level=SkillLevel.INTERMEDIATE,
        goals=["javascript", "react", "typescript"],
        time_constraints=TimeConstraints(hours_per_week=10),
        learning_style=LearningStyle.HANDS_ON
    )

@pytest.fixture
def sample_curriculum():
    return LearningPlan(
        user_id="test-user-123",
        title="JavaScript Fundamentals",
        modules=[
            Module(title="Variables and Types", difficulty=1),
            Module(title="Functions", difficulty=2),
            Module(title="Objects and Arrays", difficulty=3)
        ]
    )
```

### Database Test Setup
```bash
# Setup test database
setup_test_db() {
    echo "🗄️ Setting up test database..."
    
    # Create test database
    docker exec learning-coach-postgres createdb -U postgres learning_coach_test
    
    # Run migrations
    DATABASE_URL="postgresql://postgres:password@localhost:5432/learning_coach_test" \
        alembic upgrade head
    
    # Seed test data
    python scripts/seed_test_data.py
}

# Cleanup test database
cleanup_test_db() {
    echo "🧹 Cleaning up test database..."
    docker exec learning-coach-postgres dropdb -U postgres learning_coach_test
}
```

## Coverage Analysis

### Coverage Reporting
```bash
echo "📊 Generating coverage report..."

# Run all tests with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing --cov-report=xml

# Check coverage threshold
coverage report --fail-under=${coverage_threshold}

# Generate detailed coverage report
coverage html -d htmlcov/

echo "📈 Coverage report generated in htmlcov/"
```

### Coverage Targets
```bash
# Domain entities: 95%+ coverage
pytest tests/unit/domain/ --cov=src/domain --cov-fail-under=95

# Agents: 90%+ coverage
pytest tests/unit/agents/ --cov=src/agents --cov-fail-under=90

# API endpoints: 85%+ coverage
pytest tests/integration/test_api_endpoints.py --cov=src/adapters/api --cov-fail-under=85

# Services: 90%+ coverage
pytest tests/unit/adapters/services/ --cov=src/adapters/services --cov-fail-under=90
```

## Continuous Integration Integration

### GitHub Actions Workflow
```yaml
name: Comprehensive Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      qdrant:
        image: qdrant/qdrant:latest
        ports:
          - 6333:6333
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run comprehensive tests
        run: |
          kiro testing-automation \
            --test_type all \
            --coverage_threshold 90 \
            --parallel true \
            --environment ci
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

## Test Automation Scripts

### Parallel Test Execution
```bash
run_parallel_tests() {
    echo "🚀 Running tests in parallel..."
    
    # Unit tests in parallel
    pytest tests/unit/ -n auto --dist worksteal
    
    # Integration tests (sequential for database consistency)
    pytest tests/integration/ -v
    
    # Property tests with multiple workers
    pytest tests/property/ -n 4 --dist worksteal
}
```

### Test Result Analysis
```bash
analyze_test_results() {
    echo "📊 Analyzing test results..."
    
    # Parse test results
    total_tests=$(grep -c "PASSED\|FAILED" pytest_results.txt)
    passed_tests=$(grep -c "PASSED" pytest_results.txt)
    failed_tests=$(grep -c "FAILED" pytest_results.txt)
    
    success_rate=$((passed_tests * 100 / total_tests))
    
    echo "Test Results Summary:"
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo "Success Rate: $success_rate%"
    
    if [[ $success_rate -lt 95 ]]; then
        echo "❌ Test success rate below threshold (95%)"
        exit 1
    fi
}
```

## Expected Output

### Successful Test Run
```
🧪 Running unit tests...
✅ Domain entities: 156 tests passed (98% coverage)
✅ Profile agent: 23 tests passed (95% coverage)
✅ Curriculum agent: 28 tests passed (92% coverage)
✅ Exercise agent: 31 tests passed (94% coverage)
✅ Reviewer agent: 25 tests passed (96% coverage)
✅ Resources agent: 19 tests passed (91% coverage)
✅ Progress agent: 22 tests passed (93% coverage)
✅ Orchestrator agent: 18 tests passed (89% coverage)

🔗 Running integration tests...
✅ Database integration: 15 tests passed
✅ API endpoints: 47 tests passed
✅ Agent communication: 12 tests passed
✅ MCP integration: 8 tests passed
✅ Code runner service: 6 tests passed

🎲 Running property-based tests...
✅ Agent properties: 25 tests passed (1000 examples each)
✅ Database consistency: 12 tests passed
✅ API contracts: 18 tests passed
✅ Curriculum adaptation: 8 tests passed

🎭 Running end-to-end tests...
✅ Learning journey: 5 scenarios passed
✅ Complete workflow: 3 scenarios passed

📊 Coverage Summary:
Total Coverage: 92%
Domain: 98%
Agents: 93%
API: 89%
Services: 91%

🎉 All tests passed! (356/356)
```

## Usage Examples

### Run All Tests
```bash
kiro testing-automation --test_type all --coverage_threshold 90
```

### Test Specific Agent
```bash
kiro testing-automation --test_type unit --agents profile,curriculum
```

### CI Environment
```bash
kiro testing-automation --test_type all --environment ci --parallel true
```

This comprehensive testing automation ensures high code quality and system reliability across all components of the learning coach system.