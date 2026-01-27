---
description: Diagnose and resolve learner struggles with exercises or concepts
---

Analyze a learner's struggle pattern and provide targeted intervention strategies.

## Input

- **Learner ID**: User identifier
- **Recent Submissions**: Last 5-10 code submissions with results
- **Current Topic**: The concept being learned
- **Failure Pattern**: Consecutive failures, error types, time spent

## Analysis Process

### 1. Pattern Recognition
Identify the type of struggle:

| Pattern | Indicators | Likely Cause |
|---------|------------|--------------|
| **Syntax Errors** | Repeated parse errors | Fundamentals gap |
| **Logic Errors** | Tests fail, code runs | Conceptual misunderstanding |
| **Timeout** | Code hangs | Infinite loops, inefficiency |
| **Partial Success** | Some tests pass | Edge case blindness |
| **Quick Failures** | Fast submissions, all fail | Not reading instructions |

### 2. Root Cause Analysis

```json
{
  "struggle_analysis": {
    "pattern_type": "syntax | logic | timeout | partial | rushing",
    "confidence": 0.0-1.0,
    "evidence": ["specific observations"],
    "root_cause": "description of underlying issue",
    "knowledge_gaps": ["specific concepts missing"],
    "contributing_factors": ["time pressure", "complexity jump", etc.]
  }
}
```

### 3. Intervention Strategy

Based on pattern, recommend:

**For Syntax Errors:**
- Provide language fundamentals recap
- Suggest syntax reference materials
- Generate simpler warm-up exercise

**For Logic Errors:**
- Break down the concept step-by-step
- Provide worked examples
- Add intermediate checkpoints

**For Timeouts:**
- Review algorithm efficiency
- Provide complexity analysis hints
- Suggest optimization patterns

**For Partial Success:**
- Highlight edge cases explicitly
- Add test case explanations
- Encourage defensive programming

**For Rushing:**
- Slow down with comprehension checks
- Add reading time requirements
- Provide instruction highlights

## Output Format

```json
{
  "diagnosis": {
    "struggle_type": "string",
    "severity": "mild | moderate | severe",
    "root_cause": "string",
    "knowledge_gaps": ["string"]
  },
  "intervention": {
    "immediate_action": "string",
    "recommended_exercises": [
      {
        "type": "recap | practice | explanation",
        "topic": "string",
        "difficulty_adjustment": -2 to 0
      }
    ],
    "resources": ["relevant documentation/tutorials"],
    "encouragement_message": "string"
  },
  "curriculum_adjustment": {
    "reduce_difficulty": boolean,
    "add_prerequisites": ["topic"],
    "extend_timeline": boolean,
    "schedule_review": "date"
  }
}
```

## Intervention Guidelines

### Tone
- Supportive, never judgmental
- Normalize struggle as part of learning
- Celebrate effort, not just success
- Provide clear path forward

### Escalation Rules
- 3+ consecutive failures → Reduce difficulty
- 5+ failures on same concept → Add prerequisite review
- Learner requests help → Provide immediate hints
- Extended time without progress → Offer alternative explanation

## Example Diagnosis

```json
{
  "diagnosis": {
    "struggle_type": "logic_error",
    "severity": "moderate",
    "root_cause": "Misunderstanding of array index boundaries",
    "knowledge_gaps": ["zero-based indexing", "off-by-one errors"]
  },
  "intervention": {
    "immediate_action": "Provide visual explanation of array indexing",
    "recommended_exercises": [
      {
        "type": "recap",
        "topic": "Array Fundamentals",
        "difficulty_adjustment": -1
      },
      {
        "type": "practice",
        "topic": "Index Manipulation",
        "difficulty_adjustment": 0
      }
    ],
    "resources": [
      "MDN: Array indexing basics",
      "Visual guide to zero-based indexing"
    ],
    "encouragement_message": "Off-by-one errors trip up even experienced developers! Let's build a solid mental model of how array indices work."
  },
  "curriculum_adjustment": {
    "reduce_difficulty": true,
    "add_prerequisites": ["array-basics"],
    "extend_timeline": false,
    "schedule_review": "2025-01-14"
  }
}
```
