# Gamification Components

This directory contains all gamification-related UI components for the Agentic Learning Coach. These components provide an engaging and motivating experience through XP tracking, achievements, badges, streaks, and leaderboards.

## Components

### XPProgressBar
Displays user's XP progress with level indicators and smooth animations.

**Features:**
- Real-time XP tracking with animated counters
- Level progression visualization
- XP multiplier display
- Recent activity feed
- Level-up celebrations with animations
- Responsive design with compact mode

**Props:**
- `userId?: string` - Target user ID (defaults to current user)
- `showDetails?: boolean` - Show detailed information (default: true)
- `compact?: boolean` - Compact display mode (default: false)
- `animated?: boolean` - Enable animations (default: true)
- `className?: string` - Additional CSS classes

### AchievementGallery
Comprehensive achievement showcase with categories, filtering, and unlock animations.

**Features:**
- Achievement grid with rarity-based styling
- Category filtering (streak, skill, social, milestone, special)
- Progress tracking for locked achievements
- Unlock animations and "NEW" indicators
- Achievement detail modal with requirements
- Sorting options (rarity, name, date, progress)

**Props:**
- `userId?: string` - Target user ID
- `category?: string` - Filter by specific category
- `showUnlockedOnly?: boolean` - Show only unlocked achievements
- `compact?: boolean` - Compact grid layout
- `className?: string` - Additional CSS classes

### BadgeCollection
Badge showcase with rarity display and collection statistics.

**Features:**
- Badge grid organized by category
- Rarity-based visual effects and borders
- Collection statistics and completion rates
- Badge detail modal with unlock information
- Filtering and sorting capabilities
- Responsive grid layout

**Props:**
- `userId?: string` - Target user ID
- `showStats?: boolean` - Display collection statistics (default: true)
- `compact?: boolean` - Compact badge display
- `className?: string` - Additional CSS classes

### StreakTracker
Learning streak visualization with milestone celebrations.

**Features:**
- Current streak display with status indicators
- Streak multiplier calculation and display
- Milestone progress tracking
- Celebration animations for milestone achievements
- Weekend bonus indicators
- Motivational messages based on streak status

**Props:**
- `userId?: string` - Target user ID
- `showMilestones?: boolean` - Display milestone information (default: true)
- `compact?: boolean` - Compact display mode
- `className?: string` - Additional CSS classes

### GamificationDashboard
Complete gamification interface combining all components.

**Features:**
- Tabbed interface (Overview, Achievements, Badges, Leaderboard)
- Statistics overview with key metrics
- Daily XP goal tracking
- Next achievement suggestions
- Recent activity feed
- Leaderboard with rankings
- Responsive layout with smooth transitions

**Props:**
- `userId?: string` - Target user ID
- `className?: string` - Additional CSS classes

## Usage Examples

### Basic XP Progress Bar
```tsx
import { XPProgressBar } from '../components/gamification'

function Dashboard() {
  return (
    <div>
      <XPProgressBar showDetails={true} animated={true} />
    </div>
  )
}
```

### Achievement Gallery with Category Filter
```tsx
import { AchievementGallery } from '../components/gamification'

function AchievementsPage() {
  return (
    <AchievementGallery 
      category="skill" 
      showUnlockedOnly={false}
    />
  )
}
```

### Complete Gamification Dashboard
```tsx
import { GamificationDashboard } from '../components/gamification'

function GamificationPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <GamificationDashboard />
    </div>
  )
}
```

### Compact Components for Sidebar
```tsx
import { XPProgressBar, StreakTracker } from '../components/gamification'

function Sidebar() {
  return (
    <div className="space-y-4">
      <XPProgressBar compact={true} showDetails={false} />
      <StreakTracker compact={true} showMilestones={false} />
    </div>
  )
}
```

## API Integration

All components use the `useGamification` hooks for data fetching:

- `useGamificationProfile(userId)` - User's complete gamification profile
- `useAchievements(userId, options)` - Achievement data with filtering
- `useBadgeShowcase(userId)` - Badge collection data
- `useLeaderboard(options)` - Leaderboard rankings
- `useAwardXP()` - Mutation for awarding XP
- `useUpdateStreak()` - Mutation for updating streaks

## Animations

Components use Framer Motion for smooth animations:

- **Level-up celebrations** - Scale and fade animations with confetti effects
- **Milestone achievements** - Bounce and glow effects
- **Progress bars** - Smooth width transitions with easing
- **Achievement unlocks** - Scale and rotation animations
- **Tab transitions** - Fade and slide effects

## Accessibility

All components include proper accessibility features:

- **Screen reader support** - ARIA labels and descriptions
- **Keyboard navigation** - Full keyboard accessibility
- **High contrast** - Proper color contrast ratios
- **Focus indicators** - Clear focus states for interactive elements
- **Semantic HTML** - Proper heading hierarchy and structure

## Styling

Components use Tailwind CSS with:

- **Responsive design** - Mobile-first approach
- **Dark mode support** - Automatic theme switching
- **Custom gradients** - Rarity-based color schemes
- **Consistent spacing** - Design system compliance
- **Smooth transitions** - Hover and focus effects

## Real-time Updates

Components automatically update when:

- XP is awarded through task completion
- Achievements are unlocked
- Streaks are updated
- Leaderboard positions change

Updates are handled through React Query cache invalidation and WebSocket connections for real-time synchronization.

## Performance

- **Lazy loading** - Components load data on demand
- **Caching** - React Query handles intelligent caching
- **Optimistic updates** - Immediate UI feedback for mutations
- **Debounced animations** - Smooth performance on lower-end devices
- **Virtualization** - Large lists use virtual scrolling

## Testing

Components include comprehensive tests:

- **Unit tests** - Individual component functionality
- **Integration tests** - API integration and data flow
- **Accessibility tests** - Screen reader and keyboard navigation
- **Visual regression tests** - UI consistency across updates
- **Performance tests** - Animation and rendering performance