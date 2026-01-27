---
description: Review a code submission and provide educational feedback
---

Review a learner's code submission and provide constructive, educational feedback.

## Input

- **Submitted Code**: The learner's code solution
- **Exercise**: The original exercise with requirements and test cases
- **Learner Context**: Skill level, learning goals, attempt count

## Review Process

### 1. Correctness Analysis
- Run all test cases against the submission
- Identify which tests pass/fail
- Determine if the solution meets all requirements

### 2. Code Quality Assessment
Evaluate:
- **Readability**: Variable naming, code structure, comments
- **Efficiency**: Time/space complexity, unnecessary operations
- **Best Practices**: Language idioms, design patterns
- **Error Handling**: Edge cases, input validation

### 3. Educational Feedback Generation

#### For Passing Submissions:
- Acknowledge what was done well
- Suggest potential improvements
- Introduce advanced concepts for stretch learning
- Provide "next level" challenge ideas

#### For Failing Submissions:
- Identify specific issues with line numbers
- Explain WHY the code doesn't work
- Provide HOW TO FIX guidance
- Offer encouragement and next steps

## Feedback Structure

```json
{
  "passed": boolean,
  "score": number,  // 0-100
  "test_results": [
    {
      "test_name": "string",
      "passed": boolean,
      "actual_output": "string",
      "expected_output": "string",
      "error_message": "string | null"
    }
  ],
  "feedback": {
    "summary": "string",  // 1-2 sentence overview
    "strengths": ["string"],  // What was done well
    "issues": [
      {
        "line": number,
        "problem": "string",
        "why": "string",
        "how_to_fix": "string"
      }
    ],
    "suggestions": ["string"],  // Improvement ideas
    "next_steps": ["string"]  // What to learn/practice next
  },
  "execution_metrics": {
    "time_ms": number,
    "memory_mb": number
  }
}
```

## Feedback Guidelines

### Tone
- Supportive and encouraging
- Specific and actionable
- Educational, not just evaluative
- Appropriate for skill level

### Content Rules
- NEVER just say "wrong" - explain why
- ALWAYS provide at least one positive comment
- Include code examples when helpful
- Reference relevant documentation/concepts

### Adaptation by Skill Level

**Beginner:**
- Focus on fundamentals
- Provide more detailed explanations
- Use simple language
- Celebrate small wins

**Intermediate:**
- Introduce best practices
- Discuss efficiency
- Suggest refactoring opportunities
- Connect to real-world applications

**Advanced:**
- Focus on optimization
- Discuss trade-offs
- Introduce advanced patterns
- Challenge with edge cases

## Example Output

```json
{
  "passed": false,
  "score": 65,
  "test_results": [
    {"test_name": "basic_sum", "passed": true, "actual_output": "6", "expected_output": "6"},
    {"test_name": "empty_array", "passed": false, "actual_output": "undefined", "expected_output": "0", "error_message": "TypeError: Cannot read property 'reduce' of undefined"}
  ],
  "feedback": {
    "summary": "Good progress! Your solution handles the basic case well, but needs to handle empty arrays.",
    "strengths": [
      "Correct use of reduce() for summing",
      "Clean, readable code structure"
    ],
    "issues": [
      {
        "line": 2,
        "problem": "No check for empty or undefined array",
        "why": "When the input array is empty or undefined, reduce() throws an error because there's no initial value",
        "how_to_fix": "Add a guard clause: `if (!arr || arr.length === 0) return 0;` at the start of your function"
      }
    ],
    "suggestions": [
      "Consider adding a default value to reduce(): `arr.reduce((sum, n) => sum + n, 0)`"
    ],
    "next_steps": [
      "Practice defensive programming patterns",
      "Learn about JavaScript's optional chaining operator"
    ]
  }
}
```
