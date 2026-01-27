# Leaderboard Components

This directory contains components for displaying leaderboards, managing competitions, and providing competitive analytics for the learning platform.

## Components

### GlobalLeaderboard
- **Purpose**: Shows overall XP and achievement rankings across all users
- **Features**:
  - Real-time ranking updates
  - Multiple timeframes (daily, weekly, monthly, all-time)
  - Top 3 podium display
  - User position highlighting
  - Rank change animations
  - Performance percentiles

### RealTimeLeaderboard
- **Purpose**: Live competition leaderboard with WebSocket updates
- **Features**:
  - Real-time position changes
  - Competition-specific rankings
  - Live participant count
  - Time remaining display
  - User highlighting

### CompetitionInterface
- **Purpose**: Manages active competitions and participation
- **Features**:
  - Competition browsing and filtering
  - Join/leave competition functionality
  - Competition status tracking
  - Prize and reward display
  - Participant management

### CompetitiveAnalytics
- **Purpose**: Performance comparison and competitive insights
- **Features**:
  - Performance metrics tracking
  - Ranking trend analysis
  - Peer comparison
  - Competitive insights and recommendations
  - Skill breakdown visualization

### ChallengeParticipation
- **Purpose**: Real-time challenge participation interface
- **Features**:
  - Live coding environment
  - Timer and progress tracking
  - Real-time submission
  - Test result display
  - Live competition updates

## Usage Examples

### Basic Global Leaderboard
```tsx
import { GlobalLeaderboard } from '../components/leaderboard'

function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <GlobalLeaderboard 
        showFilters={true}
        maxEntries={50}
        refreshInterval={30000}
      />
    </div>
  )
}
```

### Competition Interface
```tsx
import { CompetitionInterface } from '../components/leaderboard'

function CompetitionsPage() {
  return (
    <CompetitionInterface 
      showUpcoming={true}
      showCompleted={true}
      maxCompetitions={10}
    />
  )
}
```

### Real-time Challenge Participation
```tsx
import { ChallengeParticipation } from '../components/leaderboard'

function ChallengePage({ challenge }) {
  const handleComplete = (result) => {
    console.log('Challenge completed:', result)
  }

  return (
    <ChallengeParticipation 
      challenge={challenge}
      onComplete={handleComplete}
      onExit={() => navigate('/competitions')}
    />
  )
}
```

### Competitive Analytics Dashboard
```tsx
import { CompetitiveAnalytics } from '../components/leaderboard'

function AnalyticsPage() {
  return (
    <CompetitiveAnalytics 
      timeframe="month"
      className="max-w-6xl mx-auto"
    />
  )
}
```

## Features

### Real-time Updates
- WebSocket integration for live leaderboard updates
- Automatic rank change detection and animation
- Live competition status tracking
- Real-time participant count updates

### Competition Management
- Multiple competition types (speed coding, code golf, best practices)
- Flexible scheduling and duration
- Participant limits and registration
- Prize and reward system integration

### Performance Analytics
- Comprehensive performance metrics
- Peer comparison and benchmarking
- Ranking trend analysis
- Competitive insights and recommendations

### User Experience
- Smooth animations and transitions
- Responsive design for all devices
- Accessibility compliance
- Loading states and error handling

## Integration

### API Services
- `GamificationService`: XP, achievements, and leaderboard data
- `SocialService`: Challenges, competitions, and peer interactions
- `WebSocketService`: Real-time updates and live features

### State Management
- React Query for API data caching
- WebSocket context for real-time updates
- Local state for UI interactions

### Styling
- Tailwind CSS for consistent styling
- Framer Motion for smooth animations
- Heroicons for consistent iconography
- Custom color schemes for different competition types

## Performance Considerations

### Optimization
- Efficient re-rendering with React.memo
- Debounced API calls for filters
- Lazy loading for large leaderboards
- Optimistic updates for better UX

### Caching
- React Query caching for leaderboard data
- Local storage for user preferences
- Efficient WebSocket message handling
- Minimal re-renders on updates

## Accessibility

### Features
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals
- ARIA labels and descriptions

### Testing
- Unit tests for all components
- Integration tests for API interactions
- Accessibility testing with axe-core
- Visual regression testing