# Analytics Components

This directory contains comprehensive learning analytics widgets that provide AI-powered insights into user learning patterns, performance, and progress.

## Components Overview

### 1. AnalyticsDashboard
**Main dashboard component that orchestrates all analytics widgets**
- Configurable widget layout with drag-and-drop support
- Time range filtering (7d, 30d, 90d)
- Export and sharing functionality
- Settings panel for widget customization
- Integration with analytics API hooks

### 2. LearningVelocityChart
**Interactive chart showing learning speed and trends**
- Multi-metric visualization (tasks, XP, time, efficiency)
- Switchable chart types (area/line)
- Trend analysis with reference lines
- Brush control for time period zooming
- Summary statistics with trend indicators

### 3. ActivityHeatmap
**GitHub-style heatmap showing learning patterns**
- Calendar-based activity visualization
- Hover tooltips with detailed information
- Pattern analysis (weekday vs weekend, consistency)
- Streak tracking and milestone detection
- Color-coded intensity levels

### 4. PerformanceMetricsWidget
**Comprehensive performance analysis with multiple views**
- Radar chart for performance overview
- Individual metric cards with trend indicators
- Skill breakdown with target vs current comparison
- Performance trend analysis over time
- Configurable time ranges and metric toggles

### 5. KnowledgeRetentionAnalysis
**AI-powered retention tracking and review recommendations**
- Retention score visualization by topic
- Forgetting curve predictions
- Review urgency classification (none/low/medium/high/critical)
- Automated review scheduling
- Interactive topic detail modals

### 6. AIInsightsWidget
**AI-generated insights and personalized recommendations**
- Categorized insights (recommendations, warnings, achievements, predictions)
- Confidence scoring for AI predictions
- Actionable recommendations with effort estimation
- Dismissible insights with priority filtering
- Real-time learning pattern analysis

## Features

### Interactive Visualizations
- **Recharts Integration**: Professional charts with animations and interactions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data updates via WebSocket connections
- **Customizable Views**: Multiple chart types and filtering options

### AI-Powered Analytics
- **Learning Velocity Analysis**: Tracks speed and consistency of learning
- **Retention Predictions**: Uses forgetting curve algorithms to predict knowledge decay
- **Performance Optimization**: Identifies optimal study times and methods
- **Personalized Recommendations**: AI-generated suggestions based on learning patterns

### User Experience
- **Intuitive Interface**: Clean, modern design following design system
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation
- **Loading States**: Skeleton screens and progressive loading
- **Error Handling**: Graceful error states with retry mechanisms

## Data Integration

### API Integration
```typescript
// Uses analytics API hooks for data fetching
const { dashboard, isLoading, error, refetch } = useAnalyticsDashboard(userId)

// Integrates with multiple API endpoints
- /analytics/insights - Learning insights and patterns
- /analytics/retention - Knowledge retention analysis
- /analytics/heatmap - Activity heatmap data
- /analytics/predictions - AI predictions
- /analytics/recommendations - Personalized recommendations
```

### Real-time Updates
```typescript
// WebSocket integration for live updates
const { socket, isConnected } = useWebSocket(userId)

// Handles real-time events
- progress_update: Updates charts and metrics
- achievement_unlocked: Shows celebration animations
- retention_alert: Displays review reminders
```

## Usage Examples

### Basic Dashboard
```tsx
import { AnalyticsDashboard } from '../components/analytics'

function AnalyticsPage() {
  return <AnalyticsDashboard userId={user.id} />
}
```

### Individual Widgets
```tsx
import { 
  LearningVelocityChart, 
  ActivityHeatmap,
  PerformanceMetricsWidget 
} from '../components/analytics'

function CustomDashboard() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <LearningVelocityChart 
        data={velocityData}
        timeRange="30d"
        onTimeRangeChange={setTimeRange}
      />
      <ActivityHeatmap 
        data={activityData}
        weeks={12}
      />
      <PerformanceMetricsWidget
        metrics={performanceMetrics}
        trends={performanceTrends}
        skillBreakdown={skillBreakdown}
        timeRange="30d"
        onTimeRangeChange={setTimeRange}
      />
    </div>
  )
}
```

### AI Insights Integration
```tsx
import { AIInsightsWidget } from '../components/analytics'

function InsightsPanel() {
  const handleApplyRecommendation = (id: string) => {
    // Apply recommendation logic
    analyticsService.applyRecommendation(id)
  }

  const handleDismissInsight = (id: string) => {
    // Dismiss insight logic
    analyticsService.dismissInsight(id)
  }

  return (
    <AIInsightsWidget
      insights={aiInsights}
      predictions={predictions}
      recommendations={recommendations}
      onApplyRecommendation={handleApplyRecommendation}
      onDismissInsight={handleDismissInsight}
    />
  )
}
```

## Architecture

### Component Structure
```
analytics/
├── AnalyticsDashboard.tsx      # Main dashboard orchestrator
├── LearningVelocityChart.tsx   # Velocity and trends analysis
├── ActivityHeatmap.tsx         # Learning pattern heatmap
├── PerformanceMetricsWidget.tsx # Performance analysis
├── KnowledgeRetentionAnalysis.tsx # Retention tracking
├── AIInsightsWidget.tsx        # AI-powered insights
├── index.ts                    # Component exports
└── README.md                   # This documentation
```

### Data Flow
1. **API Layer**: Analytics service fetches data from backend
2. **Hooks Layer**: React Query hooks manage caching and state
3. **Component Layer**: Widgets render visualizations and handle interactions
4. **UI Layer**: Reusable UI components provide consistent styling

### State Management
- **React Query**: API state management and caching
- **Local State**: Component-specific state (filters, selections)
- **Context**: User authentication and preferences
- **WebSocket**: Real-time updates and notifications

## Performance Optimizations

### Code Splitting
- Lazy loading of chart components
- Dynamic imports for heavy visualizations
- Progressive enhancement for advanced features

### Data Optimization
- Efficient data transformations with useMemo
- Debounced API calls for filters
- Intelligent caching strategies
- Pagination for large datasets

### Rendering Optimization
- React.memo for expensive components
- Virtualization for large lists
- Optimized re-renders with dependency arrays
- Skeleton loading states

## Testing

### Unit Tests
```bash
# Run component tests
npm test src/components/analytics

# Test coverage
npm run test:coverage -- src/components/analytics
```

### Integration Tests
```bash
# Test API integration
npm run test:integration -- analytics

# Test user interactions
npm run test:e2e -- analytics
```

## Accessibility

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets AA standards for text and backgrounds
- **Focus Management**: Clear focus indicators and logical tab order

### Assistive Technology Support
- Chart data available in tabular format
- Alternative text for visual elements
- High contrast mode support
- Reduced motion preferences respected

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features require modern browser APIs
- Graceful degradation for older browsers

## Future Enhancements

### Planned Features
- **Advanced Filtering**: Multi-dimensional data filtering
- **Custom Dashboards**: User-configurable widget layouts
- **Export Options**: PDF, CSV, and image exports
- **Collaboration**: Shared dashboards and team analytics
- **Mobile App**: Native mobile analytics experience

### AI Improvements
- **Predictive Analytics**: Advanced machine learning models
- **Natural Language Insights**: AI-generated explanations
- **Adaptive Recommendations**: Context-aware suggestions
- **Anomaly Detection**: Automatic identification of learning issues

## Contributing

### Development Guidelines
1. Follow TypeScript strict mode requirements
2. Use SOLID principles for component design
3. Implement comprehensive error handling
4. Add unit tests for all new features
5. Follow accessibility best practices

### Code Style
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow naming conventions from style guide
- Use consistent error handling patterns
- Document complex algorithms and business logic