---
name: Auto Test Generator
description: Automatically generate test cases when new agent methods are created
trigger: file-save
filePattern: "src/agents/**/*.py"
enabled: true
---

# Auto Test Generator Hook

This hook automatically suggests test cases when you save changes to agent files.

## Trigger Conditions

- File saved in `src/agents/` directory
- File is a Python file (`.py`)
- File contains new method definitions

## Actions

When triggered, this hook will:

1. **Analyze the changed file** for new or modified methods
2. **Generate test case suggestions** based on:
   - Method signatures and parameters
   - Return type annotations
   - Docstrings and comments
   - Similar existing tests

3. **Create test file** if it doesn't exist
4. **Suggest test implementations** following project patterns

## Test Generation Rules

### For Agent Methods
```python
# Input: New method in ProfileAgent
async def assess_skill_level(self, context: LearningContext, payload: Dict) -> AgentResult:
    ...

# Generated test suggestion:
@pytest.mark.asyncio
async def test_assess_skill_level_success():
    """Test successful skill assessment."""
    agent = ProfileAgent(mock_repository)
    context = create_test_context()
    payload = {"responses": [...]}
    
    result = await agent.process(context, {"intent": "assess_skill_level", **payload})
    
    assert result.success
    assert "skill_level" in result.data
```

### Test Categories Generated
- **Happy path tests** - Normal successful execution
- **Error handling tests** - Invalid inputs, exceptions
- **Edge case tests** - Boundary conditions
- **Integration tests** - Agent interactions

## Configuration

```yaml
# .kiro/hooks/config.yaml
auto-test-generator:
  min_coverage_target: 90
  test_framework: pytest
  async_support: true
  mock_library: unittest.mock
```

## Usage

1. Create or modify an agent method
2. Save the file
3. Review suggested tests in the notification
4. Accept, modify, or dismiss suggestions

## Example Output

```
🧪 Test Generator: Found 2 new methods in profile_agent.py

Suggested tests for `assess_skill_level`:
  ✅ test_assess_skill_level_success
  ✅ test_assess_skill_level_invalid_responses
  ✅ test_assess_skill_level_empty_context

Suggested tests for `parse_learning_goals`:
  ✅ test_parse_learning_goals_valid_input
  ✅ test_parse_learning_goals_empty_string
  ✅ test_parse_learning_goals_special_characters

[Apply All] [Review] [Dismiss]
```
