---
description: Create a personalized learning curriculum based on learner profile
---

Create a personalized learning curriculum for a developer based on their profile, goals, and constraints.

## Input Requirements

- **Learner Profile**:
  - Current skill level (beginner/intermediate/advanced/expert)
  - Programming background
  - Learning style preferences
  
- **Learning Goals**:
  - Target skills/technologies
  - Specific objectives
  - Career aspirations
  
- **Constraints**:
  - Available time per week
  - Preferred session duration
  - Deadline (if any)

## Curriculum Design Principles

### 1. Practice-First Approach
- 70% hands-on coding exercises
- 30% theory and reading
- Every concept followed by immediate practice

### 2. Progressive Difficulty
- Start at appropriate level based on assessment
- Gradual difficulty increase
- Stretch tasks for quick learners
- Recap tasks for struggling learners

### 3. Spaced Repetition
- Review intervals: 1, 3, 7, 14, 30 days
- Reinforce key concepts
- Prevent knowledge decay

### 4. Real-World Context
- Industry-relevant examples
- Practical applications
- Portfolio-worthy projects

## Curriculum Structure

### Module Organization
```json
{
  "curriculum": {
    "title": "string",
    "description": "string",
    "estimated_duration_weeks": number,
    "total_hours": number,
    "modules": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "order": number,
        "estimated_hours": number,
        "learning_objectives": ["string"],
        "prerequisites": ["module_id"],
        "tasks": [
          {
            "id": "string",
            "title": "string",
            "type": "READ | WATCH | CODE | QUIZ | PROJECT",
            "difficulty_level": number,
            "estimated_minutes": number,
            "description": "string"
          }
        ]
      }
    ],
    "mini_projects": [
      {
        "title": "string",
        "description": "string",
        "modules_required": ["module_id"],
        "estimated_hours": number,
        "skills_practiced": ["string"]
      }
    ]
  }
}
```

### Task Type Distribution
- **READ**: Documentation, articles (15%)
- **WATCH**: Video tutorials (15%)
- **CODE**: Coding exercises (50%)
- **QUIZ**: Knowledge checks (10%)
- **PROJECT**: Integration projects (10%)

## Adaptation Rules

### Performance-Based Adjustments
- **2+ consecutive failures**: Reduce difficulty, add recap
- **>90% success rate**: Increase difficulty, add stretch tasks
- **<60% success rate**: Slow pacing, add extra practice

### Time-Based Adjustments
- Adjust task count based on available hours
- Prioritize high-impact topics if time-constrained
- Suggest extended timeline if goals are ambitious

## Output Format

Generate a complete curriculum JSON with:

1. **Overview**: Title, description, timeline
2. **Modules**: Ordered learning modules with tasks
3. **Dependencies**: Module prerequisites
4. **Milestones**: Key checkpoints
5. **Mini-Projects**: Integration projects
6. **Review Schedule**: Spaced repetition plan

## Quality Checklist

- [ ] Appropriate for learner's current level
- [ ] Achievable within time constraints
- [ ] Covers all stated learning goals
- [ ] Includes practical exercises for each concept
- [ ] Has clear progression path
- [ ] Includes review/reinforcement opportunities
- [ ] Contains portfolio-worthy projects

## Example Curriculum Snippet

```json
{
  "title": "React Fundamentals for JavaScript Developers",
  "description": "Master React basics through hands-on practice",
  "estimated_duration_weeks": 6,
  "total_hours": 30,
  "modules": [
    {
      "id": "react-basics",
      "title": "React Fundamentals",
      "order": 1,
      "estimated_hours": 5,
      "learning_objectives": [
        "Understand component-based architecture",
        "Create functional components",
        "Use JSX syntax effectively"
      ],
      "tasks": [
        {
          "id": "task-1",
          "title": "Introduction to React",
          "type": "READ",
          "difficulty_level": 1,
          "estimated_minutes": 20
        },
        {
          "id": "task-2",
          "title": "Your First Component",
          "type": "CODE",
          "difficulty_level": 2,
          "estimated_minutes": 30
        }
      ]
    }
  ]
}
```
