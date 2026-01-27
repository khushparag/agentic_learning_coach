# Dashboard Components

This directory contains all the components for the Interactive Learning Dashboard (Phase 4 of the Web UI implementation).

## Components Overview

### Core Layout Components

#### `DashboardGrid.tsx`
- **Purpose**: Provides responsive grid layout for dashboard widgets
- **Features**: 
  - 12-column grid system
  - Responsive breakpoints
  - Framer Motion animations
  - Configurable widget spans

#### `DashboardWidget.tsx`
- **Purpose**: Wrapper component for dashboard content sections
- **Features**:
  - Consistent styling and spacing
  - Optional titles and actions
  - Configurable column spans
  - Smooth animations

### Stats and Metrics Components

#### `StatsCards.tsx`
- **Purpose**: Displays key learning statistics in card format
- **Features**:
  - 6 key metrics (streak, XP, progress, achievements, total XP, learning time)
  - Trend indicators with percentage changes
  - Loading skeleton states
  - Responsive grid layout
  - Icon-based visual hierarchy

#### `ProgressAnalytics.tsx`
- **Purpose**: Comprehensive analytics dashboard with interactive charts
- **Features**:
  - Learning velocity area chart (XP and tasks over time)
  - Activity heatmap (GitHub-style contribution graph)
  - Performance metrics radar/progress bars
  - Knowledge retention horizontal bar chart
  - Weekly progress comparison chart
  - Time range selector (7d, 30d, 90d)
  - Recharts integration for all visualizations

### Task Management Components

#### `TodayTasks.tsx`
- **Purpose**: Displays and manages today's learning tasks
- **Features**:
  - Task cards with status indicators
  - Priority-based color coding
  - Type icons (exercise, reading, project, quiz)
  - Quick action buttons (Start, Pause, Complete)
  - Filter tabs (All, Pending, In Progress)
  - Overdue task warnings
  - Estimated time display

#### `TaskManagement.tsx`
- **Purpose**: Advanced task filtering, sorting, and management interface
- **Features**:
  - Multi-criteria filtering (status, priority, type, module)
  - Sortable columns (priority, due date, duration, title)
  - Search functionality
  - Dropdown filter menus with Headless UI
  - Task cards with detailed information
  - Bulk actions support
  - Empty state handling

#### `TaskDetailModal.tsx`
- **Purpose**: Detailed view of individual tasks with resources and instructions
- **Features**:
  - Full task information display
  - Learning objectives list
  - Resource links with type indicators
  - Step-by-step instructions
  - Action buttons based on task status
  - Responsive modal design
  - Framer Motion animations

### Interactive Components

#### `QuickActions.tsx`
- **Purpose**: Provides quick access to common learning actions
- **Features**:
  - 6 predefined actions (new topic, practice, quiz, progress, study group, customize)
  - Color-coded action cards
  - Hover animations and interactions
  - Customizable action grid
  - Icon-based visual design

## Data Management

### `useDashboard.ts` Hook
- **Purpose**: Centralized state management for dashboard data
- **Features**:
  - React Query integration for caching and synchronization
  - Optimistic updates for task status changes
  - Error handling and retry logic
  - Real-time update preparation (WebSocket ready)
  - Filter and sort state management
  - Automatic data refresh intervals

### `dashboardService.ts`
- **Purpose**: API service layer for dashboard data
- **Features**:
  - RESTful API integration
  - Mock data fallbacks for development
  - Error handling and logging
  - Type-safe API calls
  - Caching strategies

## Type Definitions

### `dashboard.ts`
Comprehensive TypeScript interfaces for:
- `DashboardStats`: User statistics and achievements
- `TodayTask`: Task information and metadata
- `ProgressMetrics`: Analytics and performance data
- `TaskFilter` & `TaskSort`: Filtering and sorting options
- `QuickAction`: Action button configurations

## Integration Points

### Backend APIs
- `/api/progress/dashboard-stats` - User statistics
- `/api/tasks/today` - Today's tasks
- `/api/analytics/progress-metrics` - Learning analytics
- `/api/tasks/{id}/status` - Task status updates
- `/api/tasks/filtered` - Filtered task queries

### Real-time Features
- WebSocket connection for live updates
- Optimistic UI updates
- Automatic data synchronization
- Push notifications for achievements

## Usage Example

```tsx
import { useDashboard } from '../../hooks/useDashboard'
import DashboardGrid, { DashboardWidget } from './DashboardGrid'
import StatsCards from './StatsCards'
import TodayTasks from './TodayTasks'

function Dashboard() {
  const {
    stats,
    todayTasks,
    updateTaskStatus,
    isLoadingStats
  } = useDashboard()

  return (
    <DashboardGrid>
      <DashboardWidget colSpan={12}>
        <StatsCards stats={stats} isLoading={isLoadingStats} />
      </DashboardWidget>
      
      <DashboardWidget colSpan={8} title="Today's Tasks">
        <TodayTasks
          tasks={todayTasks}
          onTaskAction={updateTaskStatus}
          onTaskClick={handleTaskClick}
        />
      </DashboardWidget>
    </DashboardGrid>
  )
}
```

## Performance Considerations

- **Lazy Loading**: Charts and heavy components load on demand
- **Memoization**: Expensive calculations cached with useMemo
- **Virtualization**: Large task lists use virtual scrolling
- **Optimistic Updates**: Immediate UI feedback for user actions
- **Smart Caching**: React Query handles data freshness automatically

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Color schemes work with accessibility tools
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: All icons and charts have descriptive text

## Mobile Responsiveness

- **Responsive Grid**: Adapts from 1 to 6 columns based on screen size
- **Touch Interactions**: Optimized for mobile touch targets
- **Swipe Gestures**: Card interactions support swipe actions
- **Compact Views**: Mobile-optimized layouts for smaller screens
- **Progressive Enhancement**: Core functionality works on all devices

This dashboard implementation provides a comprehensive, interactive learning experience that adapts to user behavior and provides real-time insights into learning progress.