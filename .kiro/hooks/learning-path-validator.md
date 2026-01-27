---
name: Learning Path Validator
description: Validate curriculum changes against pedagogical best practices
trigger: file-save
filePattern: "src/agents/curriculum_planner_agent.py"
enabled: true
---

# Learning Path Validator Hook

This hook validates curriculum and learning path changes against educational best practices.

## Purpose

Ensures that generated curricula follow:
- Practice-first approach (70% practice, 30% theory)
- Progressive difficulty scaling
- Spaced repetition principles
- Appropriate time estimates

## Validation Rules

### 1. Practice-Theory Balance
```
✅ PASS: 72% practice tasks, 28% theory tasks
❌ FAIL: 45% practice tasks - Below 70% threshold
```

### 2. Difficulty Progression
```
✅ PASS: Difficulty increases gradually (max +2 per module)
❌ FAIL: Difficulty jump from 2 to 7 in consecutive tasks
```

### 3. Time Estimates
```
✅ PASS: Total time matches learner constraints (5 hrs/week)
❌ FAIL: Curriculum requires 12 hrs/week, learner has 5 hrs
```

### 4. Prerequisites
```
✅ PASS: All prerequisites are satisfied before advanced topics
❌ FAIL: "React Hooks" scheduled before "React Basics"
```

## Trigger Actions

When curriculum changes are saved:

1. **Parse curriculum structure**
2. **Run validation checks**
3. **Report issues with suggestions**
4. **Block invalid curricula** (optional)

## Example Validation Output

```
📚 Learning Path Validator

Validating curriculum: "JavaScript Fundamentals"

✅ Practice-Theory Balance: 71% practice (target: 70%)
✅ Difficulty Progression: Gradual increase detected
⚠️ Time Estimate: 6.5 hrs/week (learner has 5 hrs)
   Suggestion: Consider removing optional module "Advanced Patterns"
✅ Prerequisites: All satisfied

Overall: PASS with warnings

[Apply Suggestions] [Ignore] [View Details]
```

## Configuration

```yaml
learning-path-validator:
  practice_ratio_min: 0.70
  max_difficulty_jump: 2
  time_buffer_percent: 10
  require_prerequisites: true
  block_on_failure: false
```

## Integration with Agents

This hook integrates with:
- `CurriculumPlannerAgent` - Validates generated curricula
- `ProgressTracker` - Validates adaptation decisions
- `ExerciseGeneratorAgent` - Validates exercise difficulty
