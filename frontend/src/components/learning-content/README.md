# Learning Content Components

Rich, interactive learning content components for the Agentic Learning Coach.

## Overview

These components transform placeholder reading materials into engaging, structured lessons with:
- **Concept Cards** - Multiple explanation styles with analogies and examples
- **Interactive Code Examples** - Editable code with execution and hints
- **Knowledge Checks** - Inline quizzes with immediate feedback
- **Progress Tracking** - Auto-save and resume functionality
- **Notes & Highlights** - Personal annotations with export

## Components

### StructuredLessonViewer
Main container for displaying a complete lesson with navigation and progress tracking.

```tsx
import { StructuredLessonViewer } from './learning-content';

<StructuredLessonViewer
  lesson={lesson}
  progress={progress}
  onProgressUpdate={handleProgressUpdate}
  onComplete={handleComplete}
/>
```

### ConceptCardComponent
Displays a concept with multiple explanation styles.

```tsx
import { ConceptCardComponent } from './learning-content';

<ConceptCardComponent
  card={conceptCard}
  onComplete={handleComplete}
  onRequestAlternative={handleAlternative}
/>
```

### InteractiveCodeExample
Code editor with execution, hints, and solution reveal.

```tsx
import { InteractiveCodeExample } from './learning-content';

<InteractiveCodeExample
  example={codeExample}
  onComplete={handleComplete}
  onRun={handleCodeRun}
/>
```

### KnowledgeCheckComponent
Quiz component with multiple question types and feedback.

```tsx
import { KnowledgeCheckComponent } from './learning-content';

<KnowledgeCheckComponent
  check={knowledgeCheck}
  lessonId={lessonId}
  onComplete={handleComplete}
  maxAttempts={3}
/>
```

### NotesPanel
Manages user notes and highlights with export functionality.

```tsx
import { NotesPanel } from './learning-content';

<NotesPanel
  lessonId={lessonId}
  notes={notes}
  onNotesChange={handleNotesChange}
/>
```

## Hooks

### useLessonProgress
Manages lesson progress with auto-save.

```tsx
import { useLessonProgress } from '../hooks/useLessonProgress';

const {
  progress,
  notes,
  completionPercentage,
  markSectionComplete,
  saveProgress,
} = useLessonProgress({
  lessonId: 'lesson-123',
  lesson: lessonData,
  autoSaveInterval: 30000,
});
```

## Services

### learningContentService
API integration for lesson generation and progress tracking.

```tsx
import { learningContentService } from '../services/learningContentService';

// Generate a lesson
const { lesson } = await learningContentService.generateLesson({
  topic: 'React Hooks',
  taskTitle: 'Understanding useState',
  skillLevel: 'intermediate',
});

// Save progress
await learningContentService.saveProgress({
  lessonId: lesson.id,
  completedSections: ['section-1', 'section-2'],
  timeSpentSeconds: 300,
});
```

## Features

### Adaptive Content
Content adapts based on:
- User skill level (beginner/intermediate/advanced)
- Performance on knowledge checks
- Time spent on sections

### "Explain Differently"
Users can request alternative explanations for concepts they don't understand.

### Progressive Hints
Code examples reveal hints progressively to guide without giving away solutions.

### Auto-Save
Progress is automatically saved every 30 seconds and on section completion.

### Resume
Returning users are prompted to continue where they left off.

## Types

See `frontend/src/types/learning-content.ts` for complete type definitions.
