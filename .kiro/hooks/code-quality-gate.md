---
name: Code Quality Gate
description: Enforce code quality standards before commits with automated analysis
trigger: pre-commit
filePattern: "src/**/*.py"
enabled: true
severity: blocking
---

# Code Quality Gate Hook

This hook enforces code quality standards by analyzing code before commits are allowed.

## Trigger Conditions

- Pre-commit hook on Python files in `src/` directory
- Runs automatically before `git commit`
- Blocks commit if quality thresholds are not met

## Quality Checks Performed

### 1. Static Analysis
```yaml
checks:
  - name: Type Hints Coverage
    threshold: 90%
    action: block
    
  - name: Docstring Coverage
    threshold: 80%
    action: warn
    
  - name: Cyclomatic Complexity
    max_value: 10
    action: block
    
  - name: Function Length
    max_lines: 50
    action: warn
```

### 2. Security Scanning
```yaml
security_checks:
  - name: Hardcoded Secrets
    patterns:
      - "api_key\\s*=\\s*['\"][^'\"]+['\"]"
      - "password\\s*=\\s*['\"][^'\"]+['\"]"
    action: block
    
  - name: SQL Injection Patterns
    patterns:
      - "f\".*SELECT.*{.*}.*\""
      - "execute\\(.*\\+.*\\)"
    action: block
    
  - name: Unsafe Imports
    blocked_imports:
      - pickle
      - eval
      - exec
    action: warn
```

### 3. Test Coverage Verification
```yaml
coverage:
  minimum_overall: 85%
  minimum_new_code: 90%
  exclude_patterns:
    - "*/migrations/*"
    - "*/__init__.py"
```

## Actions

When triggered, this hook will:

1. **Analyze changed files** for quality issues
2. **Calculate metrics** for complexity, coverage, and style
3. **Check security patterns** for potential vulnerabilities
4. **Generate report** with findings and suggestions
5. **Block or warn** based on severity configuration

## Integration with CI/CD

```yaml
# .github/workflows/quality-gate.yml
quality-gate:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Run Quality Gate
      run: |
        python -m pytest --cov=src --cov-fail-under=85
        python -m mypy src/ --strict
        python -m flake8 src/ --max-complexity=10
```

## Example Output

```
🔍 Code Quality Gate Analysis

📊 Metrics Summary:
  ├── Type Hints Coverage: 94% ✅
  ├── Docstring Coverage: 87% ✅
  ├── Avg Cyclomatic Complexity: 6.2 ✅
  └── Test Coverage: 91% ✅

🔒 Security Scan:
  ├── Hardcoded Secrets: None found ✅
  ├── SQL Injection Patterns: None found ✅
  └── Unsafe Imports: None found ✅

📝 Style Issues:
  ├── src/agents/reviewer_agent.py:45 - Line too long (92 > 88)
  └── src/adapters/api/routers/tasks.py:23 - Missing docstring

✅ Quality Gate: PASSED
   Commit allowed to proceed.
```

## Failure Example

```
🔍 Code Quality Gate Analysis

📊 Metrics Summary:
  ├── Type Hints Coverage: 72% ❌ (threshold: 90%)
  ├── Docstring Coverage: 65% ⚠️ (threshold: 80%)
  ├── Avg Cyclomatic Complexity: 12.5 ❌ (max: 10)
  └── Test Coverage: 78% ❌ (threshold: 85%)

🔒 Security Scan:
  └── src/config.py:15 - Potential hardcoded secret detected ❌

❌ Quality Gate: FAILED
   Commit blocked. Please fix the following issues:
   
   1. Add type hints to 12 functions
   2. Reduce complexity in exercise_generator_agent.py:_generate_exercise
   3. Remove hardcoded value in config.py:15
   4. Add tests to achieve 85% coverage

[View Details] [Override (requires approval)]
```

## Configuration

```yaml
# .kiro/hooks/config.yaml
code-quality-gate:
  enabled: true
  severity: blocking
  
  thresholds:
    type_hints: 90
    docstrings: 80
    complexity: 10
    coverage: 85
    
  security:
    block_on_secrets: true
    block_on_injection: true
    warn_on_unsafe_imports: true
    
  exceptions:
    - path: "tests/**"
      skip: ["complexity", "docstrings"]
    - path: "scripts/**"
      skip: ["coverage"]
```

## Override Process

For exceptional cases where override is needed:

1. Add `[QUALITY-OVERRIDE]` to commit message
2. Provide justification in commit body
3. Requires approval from code owner
4. Override is logged for audit trail

```bash
git commit -m "[QUALITY-OVERRIDE] Emergency hotfix for production issue

Justification: Critical bug fix required immediate deployment.
Approved by: @tech-lead
Ticket: PROD-1234"
```
