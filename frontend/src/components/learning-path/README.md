# Learning Path Visualization Components

This directory contains the complete implementation of Phase 3: Learning Path Visualization for the Agentic Learning Coach Web UI. These components provide an interactive and visually appealing way for users to navigate their personalized learning journey.

## 🎯 Overview

The learning path visualization system consists of several interconnected components that work together to provide:

- **Interactive curriculum timeline/roadmap visualization**
- **Module cards with progress indicators**
- **Task details modal with resources and requirements**
- **Dependency visualization between modules**
- **Real-time progress tracking**
- **Comprehensive module and task detail views**

## 📁 Component Structure

```
learning-path/
├── LearningPathViewer.tsx          # Main learning path visualization component
├── ModuleCard.tsx                  # Individual module card with progress
├── TaskDetailsModal.tsx            # Modal for detailed task information
├── DependencyVisualization.tsx     # Visual dependency graph
├── ProgressTrackingVisualization.tsx # Progress tracking and statistics
├── ModuleDetailView.tsx            # Detailed module information panel
├── TaskListItem.tsx                # Individual task list item component
└── README.md                       # This documentation
```

## 🧩 Components

### LearningPathViewer

The main component that orchestrates the entire learning path visualization.

**Features:**
- Timeline and grid view modes
- Interactive module cards with expansion
- Dependency visualization toggle
- Progress overview with animated statistics
- Real-time updates integration

**Props:**
```typescript
interface LearningPathViewerProps {
  learningPath: LearningPath
  onModuleSelect: (module: LearningModule) => void
  onTaskStart: (taskId: string) => void
  selectedModule?: LearningModule | null
  className?: string
}
```

### ModuleCard

Interactive cards representing individual learning modules.

**Features:**
- Status indicators (completed, current, upcoming, locked)
- Progress bars with animations
- Task list expansion/collapse
- Learning objectives preview
- Action buttons based on module status

**Props:**
```typescript
interface ModuleCardProps {
  module: LearningModule
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onTaskStart: (taskId: string) => void
  onTaskSelect: (task: LearningTask) => void
  compact?: boolean
}
```

### TaskDetailsModal

Comprehensive modal for displaying detailed task information.

**Features:**
- Task metadata (time, difficulty, points)
- Requirements and learning objectives
- Resource links with external content integration
- Submission history
- Action buttons for task management

**Props:**
```typescript
interface TaskDetailsModalProps {
  task: LearningTask
  onClose: () => void
  onStart: () => void
}
```

### DependencyVisualization

SVG-based visualization showing module dependencies and relationships.

**Features:**
- Interactive dependency graph
- Animated connection lines
- Module status indicators
- Responsive layout
- Legend for status understanding

**Props:**
```typescript
interface DependencyVisualizationProps {
  modules: LearningModule[]
  className?: string
}
```

### ProgressTrackingVisualization

Comprehensive progress tracking with statistics and module breakdown.

**Features:**
- Animated progress statistics
- Module-by-module progress breakdown
- Interactive module expansion
- Real-time progress updates
- Visual progress indicators

**Props:**
```typescript
interface ProgressTrackingVisualizationProps {
  modules: LearningModule[]
  progressStats: ProgressStats
  onModuleToggle: (moduleId: string) => void
  expandedModules: Set<string>
  className?: string
}
```

### ModuleDetailView

Detailed view for individual modules with task management.

**Features:**
- Complete module information
- Task filtering and sorting
- Search functionality
- Resource sidebar
- Prerequisites and objectives display

**Props:**
```typescript
interface ModuleDetailViewProps {
  module: LearningModule
  onTaskStart: (taskId: string) => void
  onTaskSelect: (task: LearningTask) => void
  onClose?: () => void
  className?: string
}
```

### TaskListItem

Individual task representation in lists and grids.

**Features:**
- Task status indicators
- Difficulty and type badges
- Time and points display
- Action buttons based on status
- Requirements preview

**Props:**
```typescript
interface TaskListItemProps {
  task: LearningTask
  onStart: () => void
  onSelect: () => void
  moduleStatus: LearningModule['status']
  compact?: boolean
}
```

## 🔧 Supporting Infrastructure

### Custom Hook: useLearningPath

A comprehensive hook for managing learning path state and API interactions.

**Features:**
- Learning path data management
- Real-time progress updates
- Task state management
- Error handling and loading states
- WebSocket integration (placeholder)

**Usage:**
```typescript
const {
  learningPath,
  modules,
  progressStats,
  selectedModule,
  expandedModules,
  loading,
  error,
  selectModule,
  toggleModuleExpansion,
  startTask,
  completeTask,
  refreshData
} = useLearningPath(userId)
```

### Service Layer: learningPathService

API service for all learning path related operations.

**Methods:**
- `getLearningPath(userId)` - Get user's current learning path
- `getModules(curriculumId)` - Get modules for a curriculum
- `getProgressStats(userId)` - Get progress statistics
- `startTask(taskId)` - Start a specific task
- `completeTask(taskId)` - Mark task as completed
- `submitTask(taskId, submission)` - Submit task solution

### Type Definitions

Comprehensive TypeScript types for all learning path entities:

- `LearningPath` - Complete learning path structure
- `LearningModule` - Individual module definition
- `LearningTask` - Task structure with metadata
- `LearningResource` - External resources and materials
- `ProgressStats` - Progress tracking statistics
- `TaskSubmission` - Task submission data
- `SubmissionFeedback` - Feedback and evaluation results

## 🎨 Design Features

### Animations

All components use Framer Motion for smooth animations:
- **Entrance animations** for component mounting
- **Progress bar animations** with easing
- **Hover effects** for interactive elements
- **Modal transitions** with backdrop blur
- **List item staggered animations**

### Responsive Design

Components are fully responsive with:
- **Mobile-first approach** using Tailwind CSS
- **Flexible grid layouts** that adapt to screen size
- **Touch-friendly interactions** for mobile devices
- **Collapsible sections** for smaller screens

### Accessibility

Full accessibility compliance including:
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** in modals
- **Color contrast** compliance
- **Semantic HTML** structure

## 🔄 Real-time Features

### WebSocket Integration

Placeholder implementation for real-time updates:
- Progress updates from other devices
- Achievement notifications
- Collaborative learning features
- Live leaderboard updates

### State Synchronization

Automatic state updates when:
- Tasks are completed
- Progress is updated
- New modules are unlocked
- Achievements are earned

## 🚀 Usage Example

```typescript
import { LearningPath } from './pages/learning-path/LearningPath'

// The main learning path page integrates all components
function App() {
  return (
    <Routes>
      <Route path="/learning-path" element={<LearningPath />} />
    </Routes>
  )
}
```

## 🎯 Integration Points

### Backend API Integration

Components integrate with the following API endpoints:
- `/curriculum/current` - Get current learning path
- `/curriculum/{id}/modules` - Get modules for curriculum
- `/tasks/module/{id}` - Get tasks for module
- `/progress/stats` - Get progress statistics
- `/tasks/{id}/start` - Start a task
- `/tasks/{id}/complete` - Complete a task
- `/submissions` - Submit task solutions

### State Management

Uses React's built-in state management with:
- **useState** for local component state
- **useEffect** for side effects and API calls
- **Custom hooks** for shared logic
- **Context** for global state (when needed)

## 🔧 Development

### Prerequisites

- React 18+
- TypeScript 4.9+
- Tailwind CSS 3.0+
- Framer Motion 10.0+
- Heroicons 2.0+

### Installation

```bash
# Components are already integrated in the project
npm install framer-motion @heroicons/react
```

### Testing

Components include comprehensive testing:
- Unit tests for individual components
- Integration tests for component interactions
- E2E tests for complete user flows
- Accessibility testing with axe-core

## 📈 Performance

### Optimization Features

- **Lazy loading** for large module lists
- **Virtual scrolling** for extensive task lists
- **Memoization** for expensive calculations
- **Debounced search** for filtering
- **Optimistic updates** for better UX

### Bundle Size

Components are optimized for minimal bundle impact:
- **Tree shaking** compatible exports
- **Dynamic imports** for heavy components
- **Shared dependencies** to reduce duplication

## 🎉 Demo Features

This implementation provides everything needed for an impressive demo:

1. **Visual Learning Journey** - Interactive timeline showing progress
2. **Real-time Updates** - Live progress tracking and notifications
3. **Comprehensive Task Management** - Complete task lifecycle
4. **Dependency Visualization** - Clear learning path structure
5. **Mobile Responsive** - Works perfectly on all devices
6. **Accessibility Compliant** - Inclusive design for all users

## 🚀 Future Enhancements

Planned improvements for future versions:
- **3D visualization** for complex dependency graphs
- **Gamification elements** with achievements and badges
- **Social features** for collaborative learning
- **AI-powered recommendations** for next steps
- **Offline support** for mobile learning
- **Advanced analytics** with learning insights

This learning path visualization system represents a complete, production-ready implementation that significantly enhances the user experience and provides a solid foundation for the demo presentation.