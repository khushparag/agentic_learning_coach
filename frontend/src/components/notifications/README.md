# Notification System

A comprehensive notification system for the Learning Coach application with toast notifications, notification center, push notifications, and advanced configuration options.

## Features

### 🍞 Toast Notifications
- Multiple notification types (success, error, warning, info, achievement, progress, streak, collaboration, system)
- Customizable positioning (top-right, top-left, bottom-right, bottom-left, top-center, bottom-center)
- Auto-dismiss with progress bars
- Action buttons support
- Priority indicators
- Rich metadata display (XP, streaks, etc.)

### 🔔 Notification Center
- Complete notification history
- Advanced filtering and search
- Bulk actions (mark as read, dismiss, delete)
- Real-time statistics
- Notification management

### 📱 Push Notifications
- Browser push notification support
- Service worker integration
- Offline notification handling
- Action buttons in notifications
- Automatic subscription management

### ⚙️ Advanced Configuration
- Per-type notification preferences
- Do Not Disturb scheduling
- Rate limiting and batching
- Sound and vibration controls
- Push notification permissions

### 🔄 Real-time Integration
- WebSocket integration for live updates
- Achievement unlock animations
- Progress update notifications
- Collaboration notifications
- System alerts

## Components

### Core Components

#### `NotificationSystem`
Main notification system component that orchestrates all notification functionality.

```tsx
import { NotificationSystem } from '@/components/notifications'

<NotificationSystem
  enableWebSocket={true}
  enablePushNotifications={true}
  maxToasts={5}
  toastPosition="top-right"
/>
```

#### `NotificationCenter`
Comprehensive notification management interface.

```tsx
import { NotificationCenter } from '@/components/notifications'

<NotificationCenter
  isOpen={showCenter}
  onClose={() => setShowCenter(false)}
/>
```

#### `Toast`
Individual toast notification component.

```tsx
import { Toast } from '@/components/notifications'

<Toast
  notification={notification}
  onClose={handleClose}
  onAction={handleAction}
/>
```

#### `ToastContainer`
Container for managing multiple toast notifications.

```tsx
import { ToastContainer } from '@/components/notifications'

<ToastContainer
  maxToasts={5}
  position="top-right"
  spacing={12}
/>
```

#### `NotificationPreferences`
Full notification preferences configuration interface.

```tsx
import { NotificationPreferences } from '@/components/notifications'

<NotificationPreferences onClose={handleClose} />
```

### Hooks

#### `useNotifications`
Main hook for notification management.

```tsx
import { useNotifications } from '@/hooks/useNotifications'

const {
  notifications,
  unreadNotifications,
  stats,
  preferences,
  createNotification,
  markAsRead,
  dismiss,
  delete: deleteNotification,
  markAllAsRead,
  clearAll,
  updatePreferences,
  requestPushPermission
} = useNotifications()
```

#### `useToastNotifications`
Hook specifically for toast notifications.

```tsx
import { useToastNotifications } from '@/hooks/useNotifications'

const {
  toasts,
  showToast,
  dismissToast,
  clearToasts
} = useToastNotifications()
```

#### `useNotificationSounds`
Hook for managing notification sounds.

```tsx
import { useNotificationSounds } from '@/hooks/useNotifications'

const {
  playSound,
  preloadSounds,
  setSoundEnabled
} = useNotificationSounds()
```

#### `useNotificationFilters`
Hook for filtering notifications.

```tsx
import { useNotificationFilters } from '@/hooks/useNotifications'

const {
  filteredNotifications,
  filters,
  setTypeFilter,
  setPriorityFilter,
  setShowRead,
  setShowDismissed,
  setSearch,
  setDateRange,
  clearFilters
} = useNotificationFilters(notifications)
```

### Services

#### `NotificationManager`
Core notification management service.

```tsx
import { notificationManager } from '@/utils/notifications'

// Create notification
const id = notificationManager.createNotification({
  type: 'success',
  title: 'Task Completed',
  message: 'Great job!',
  priority: 'normal',
  persistent: false
})

// Manage preferences
notificationManager.setPreferences({
  enabled: true,
  types: {
    success: { enabled: true, toast: true, push: false, sound: false, vibration: false }
  }
})
```

#### `PushNotificationService`
Push notification service with service worker integration.

```tsx
import { pushNotificationService } from '@/services/pushNotificationService'

// Request permission
const permission = await pushNotificationService.requestPermission()

// Show notification
await pushNotificationService.showNotification({
  title: 'Achievement Unlocked!',
  body: 'You earned a new badge!',
  icon: '/icons/achievement.png',
  actions: [
    { action: 'view', title: 'View Achievement' }
  ]
})
```

### Utility Functions

```tsx
import {
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
  createInfoNotification,
  createAchievementNotification
} from '@/utils/notifications'

// Quick notification creation
createSuccessNotification('Task Completed', 'Great job on finishing the exercise!')
createErrorNotification('Submission Failed', 'Please check your code and try again.')
createAchievementNotification('Badge Earned', 'You unlocked the "JavaScript Master" badge!')
```

## Types

### Core Types

```tsx
interface BaseNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  timestamp: Date
  read: boolean
  dismissed: boolean
  persistent: boolean
  actions?: NotificationAction[]
  metadata?: Record<string, any>
}

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'progress' | 'streak' | 'collaboration' | 'system'

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
```

### Configuration Types

```tsx
interface NotificationPreferences {
  enabled: boolean
  types: {
    [K in NotificationType]: {
      enabled: boolean
      toast: boolean
      push: boolean
      sound: boolean
      vibration: boolean
    }
  }
  doNotDisturb: {
    enabled: boolean
    startTime: string
    endTime: string
    days: number[]
  }
  batching: {
    enabled: boolean
    maxPerMinute: number
    maxPerHour: number
    groupSimilar: boolean
  }
  push: {
    enabled: boolean
    permission: NotificationPermission
    endpoint?: string
    keys?: {
      p256dh: string
      auth: string
    }
  }
}
```

## WebSocket Integration

The notification system integrates with WebSocket for real-time updates:

```tsx
// WebSocket message handling
const handleWebSocketMessage = (message) => {
  switch (message.type) {
    case 'achievement_unlocked':
      handleAchievementUnlocked(message.data)
      break
    case 'progress_update':
      handleProgressUpdate(message.data)
      break
    case 'streak_milestone':
      handleStreakMilestone(message.data)
      break
    // ... more handlers
  }
}
```

## Service Worker Integration

The system includes comprehensive service worker support for push notifications:

```javascript
// Service worker handles push events
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      actions: data.actions,
      data: data.data
    })
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // Handle action or open app
  if (event.action) {
    handleNotificationAction(event.action, event.notification.data)
  } else {
    clients.openWindow(event.notification.data.url || '/')
  }
})
```

## Rate Limiting & Batching

The system includes intelligent rate limiting to prevent notification spam:

- **Per-minute limits**: Configurable maximum notifications per minute
- **Per-hour limits**: Configurable maximum notifications per hour
- **Batching**: Group similar notifications together
- **Do Not Disturb**: Respect user's quiet hours
- **Priority override**: Urgent notifications bypass rate limits

## Accessibility

The notification system is built with accessibility in mind:

- **Screen reader support**: Proper ARIA labels and announcements
- **Keyboard navigation**: Full keyboard support for all interactions
- **High contrast**: Supports high contrast themes
- **Reduced motion**: Respects user's motion preferences
- **Focus management**: Proper focus handling for modals and popups

## Performance

The system is optimized for performance:

- **Lazy loading**: Components are loaded on demand
- **Virtual scrolling**: Efficient rendering of large notification lists
- **Debounced updates**: Batched state updates to prevent excessive re-renders
- **Memory management**: Automatic cleanup of old notifications
- **Service worker caching**: Efficient offline support

## Security

Security considerations are built into the system:

- **Input sanitization**: All user input is properly sanitized
- **XSS protection**: Safe rendering of notification content
- **Permission validation**: Proper permission checks for push notifications
- **Rate limiting**: Protection against notification spam
- **Secure storage**: Encrypted storage of sensitive preferences

## Browser Support

The notification system supports all modern browsers:

- **Chrome**: Full support including push notifications
- **Firefox**: Full support including push notifications
- **Safari**: Toast notifications (push notifications require iOS 16.4+)
- **Edge**: Full support including push notifications

## Migration Guide

If migrating from the old notification system:

1. **Update imports**: Change from old notification components to new ones
2. **Update preferences**: Migrate old preference format to new structure
3. **Update WebSocket handlers**: Use new message format and handlers
4. **Test push notifications**: Verify push notification setup works
5. **Update service worker**: Deploy updated service worker with push support

## Examples

### Basic Usage

```tsx
import { NotificationSystem, useNotifications } from '@/components/notifications'

function App() {
  return (
    <div>
      {/* Your app content */}
      <NotificationSystem />
    </div>
  )
}

function MyComponent() {
  const { createNotification } = useNotifications()
  
  const handleSuccess = () => {
    createNotification({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      priority: 'normal',
      persistent: false
    })
  }
  
  return <button onClick={handleSuccess}>Show Success</button>
}
```

### Advanced Configuration

```tsx
import { NotificationSystem, NotificationPreferences } from '@/components/notifications'

function AdvancedApp() {
  const [showPreferences, setShowPreferences] = useState(false)
  
  return (
    <div>
      <NotificationSystem
        enableWebSocket={true}
        enablePushNotifications={true}
        maxToasts={3}
        toastPosition="bottom-right"
      />
      
      {showPreferences && (
        <NotificationPreferences
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  )
}
```

### Custom Notification Types

```tsx
import { useNotifications } from '@/components/notifications'

function CustomNotifications() {
  const { createNotification } = useNotifications()
  
  const showCustomAchievement = () => {
    createNotification({
      type: 'achievement',
      title: 'Coding Streak Master!',
      message: 'You\'ve coded for 30 days straight!',
      priority: 'high',
      persistent: false,
      metadata: {
        xp: 500,
        streak: 30,
        badge: '🔥'
      },
      actions: [
        {
          id: 'share',
          label: 'Share Achievement',
          type: 'primary',
          handler: () => shareAchievement()
        },
        {
          id: 'view',
          label: 'View Profile',
          type: 'secondary',
          handler: () => viewProfile()
        }
      ]
    })
  }
  
  return <button onClick={showCustomAchievement}>Unlock Achievement</button>
}
```

This notification system provides a comprehensive, accessible, and performant solution for all notification needs in the Learning Coach application.