# WebSocket Integration for Real-time Updates

This directory contains the WebSocket integration components that provide real-time updates across the Agentic Learning Coach application.

## Architecture Overview

The WebSocket system follows a clean, layered architecture:

```
WebSocketContext (Global State)
├── WebSocketService (Connection Management)
├── Specialized Hooks (Feature-specific)
├── Real-time Components (UI Updates)
└── Notification System (User Feedback)
```

## Core Components

### 1. WebSocket Service (`/services/webSocketService.ts`)

**Purpose**: Centralized WebSocket connection management with automatic reconnection, message queuing, and event handling.

**Key Features**:
- Automatic reconnection with exponential backoff
- Message queuing during disconnections
- Heartbeat/ping-pong for connection health
- Type-safe message handling
- Circuit breaker pattern for reliability

```typescript
// Usage Example
const wsService = new WebSocketService({
  url: 'ws://localhost:8000/ws/progress/user123',
  reconnectAttempts: 5,
  heartbeatInterval: 30000
})

wsService.subscribe('progress_update', (data) => {
  console.log('Progress updated:', data)
})

wsService.send({ type: 'join_room', data: { roomId: 'study-group-1' } })
```

### 2. WebSocket Context (`/contexts/WebSocketContext.tsx`)

**Purpose**: Global WebSocket state management and automatic query invalidation.

**Key Features**:
- Manages multiple WebSocket connections
- Automatic React Query cache invalidation
- Connection state monitoring
- Centralized error handling

```typescript
// Usage in Components
const { isConnected, connectionStates, send } = useWebSocketContext()

// Send message through specific connection
send('progress', 'task_completed', { taskId: '123', xp: 50 })
```

### 3. Specialized Hooks (`/hooks/useWebSocket.ts`)

**Purpose**: Feature-specific WebSocket hooks for different real-time capabilities.

#### Available Hooks:

- `useProgressWebSocketUpdates()` - Progress and task completion updates
- `useAchievementWebSocket()` - Achievement unlock notifications
- `useLeaderboardWebSocket()` - Real-time leaderboard updates
- `useCollaborationWebSocket()` - Study group collaboration features

```typescript
// Progress Updates
const { progressUpdates, sendProgressUpdate } = useProgressWebSocketUpdates(userId)

// Achievement Notifications
const { achievements, clearAchievements } = useAchievementWebSocket(userId)

// Leaderboard Updates
const { leaderboardData, joinLeaderboard } = useLeaderboardWebSocket('global')

// Collaboration Features
const { participants, messages, sendMessage } = useCollaborationWebSocket(roomId, userId)
```

## Real-time Components

### 1. Notification System (`/components/notifications/`)

**Purpose**: Displays real-time notifications with animations and user feedback.

**Features**:
- Achievement unlock animations with confetti effects
- Progress update toasts
- Streak milestone celebrations
- Customizable notification types and durations

```typescript
// Automatic integration via WebSocketContext
// Notifications appear automatically based on WebSocket events
```

### 2. Real-time Leaderboard (`/components/leaderboard/`)

**Purpose**: Live leaderboard with position changes and user highlighting.

**Features**:
- Real-time rank updates with animations
- User position highlighting
- Connection status indicators
- Smooth transitions for rank changes

```typescript
<RealTimeLeaderboard
  leaderboardId="global"
  showUserHighlight={true}
  maxEntries={10}
/>
```

### 3. Study Group Collaboration (`/components/collaboration/`)

**Purpose**: Real-time collaboration features for study groups.

**Features**:
- Live chat with typing indicators
- Shared cursor positions
- Participant presence indicators
- Real-time activity updates

```typescript
<StudyGroupCollaboration
  roomId="study-group-123"
  studyGroupId="group-456"
  onParticipantUpdate={handleParticipants}
/>
```

## Message Types and Data Flow

### Progress Updates
```typescript
interface ProgressUpdateMessage {
  type: 'progress_update' | 'task_completed' | 'module_completed'
  data: {
    userId: string
    taskId?: string
    moduleId?: string
    progress?: number
    xp?: number
    completionTime?: string
  }
}
```

### Achievement Notifications
```typescript
interface AchievementMessage {
  type: 'achievement_unlocked' | 'badge_earned'
  data: {
    achievement: {
      id: string
      name: string
      badge: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      xp_reward: number
    }
  }
}
```

### Gamification Updates
```typescript
interface GamificationMessage {
  type: 'xp_awarded' | 'level_up' | 'streak_milestone'
  data: {
    xp_amount?: number
    level?: number
    streak?: {
      current_streak: number
      milestone?: { name: string; days: number }
    }
  }
}
```

## Integration Points

### 1. Dashboard Integration

The dashboard automatically receives real-time updates for:
- Task completion notifications
- Progress metric updates
- Achievement unlock celebrations
- Streak milestone alerts

### 2. Social Features Integration

Social components get real-time updates for:
- Challenge invitations and responses
- Study group activity
- Leaderboard position changes
- Peer solution sharing

### 3. Gamification Integration

Gamification features receive:
- XP award notifications
- Level up celebrations
- Achievement unlock animations
- Streak progress updates

## Configuration

### Environment Variables

```bash
# WebSocket Configuration
VITE_WS_URL=ws://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000

# Feature Flags
VITE_FEATURE_REAL_TIME_UPDATES=true
VITE_FEATURE_WEBSOCKET_RECONNECT=true
VITE_FEATURE_LIVE_COLLABORATION=true
VITE_FEATURE_REAL_TIME_LEADERBOARD=true
```

### WebSocket Service Configuration

```typescript
const config = {
  reconnectAttempts: 5,        // Max reconnection attempts
  reconnectDelay: 1000,        // Initial delay between reconnects (ms)
  heartbeatInterval: 30000,    // Heartbeat interval (ms)
  timeout: 10000,              // Connection timeout (ms)
  enableLogging: true          // Enable debug logging
}
```

## Error Handling and Resilience

### Connection Management
- **Automatic Reconnection**: Exponential backoff with jitter
- **Message Queuing**: Messages queued during disconnections
- **Circuit Breaker**: Prevents excessive reconnection attempts
- **Graceful Degradation**: App remains functional without WebSocket

### Error Recovery
- **Connection Timeout**: 10-second timeout with retry
- **Network Issues**: Automatic reconnection on network restore
- **Server Restart**: Seamless reconnection with state recovery
- **Browser Tab Visibility**: Reconnect when tab becomes active

## Performance Considerations

### Optimization Strategies
- **Message Throttling**: Cursor updates throttled to 100ms
- **Connection Pooling**: Reuse connections for same endpoints
- **Selective Subscriptions**: Only subscribe to needed message types
- **Memory Management**: Automatic cleanup of event listeners

### Monitoring
- **Connection State Tracking**: Real-time connection status
- **Message Rate Limiting**: Prevent message flooding
- **Performance Metrics**: Track message latency and throughput
- **Error Rate Monitoring**: Track connection failures and recoveries

## Security Considerations

### Authentication
- **User ID Validation**: Server validates user identity
- **Session Management**: WebSocket tied to user session
- **Permission Checks**: Server enforces user permissions
- **Rate Limiting**: Prevent abuse and spam

### Data Protection
- **Message Validation**: All messages validated on server
- **Sanitization**: User input sanitized before broadcast
- **Privacy**: No sensitive data in WebSocket messages
- **Audit Logging**: All WebSocket activity logged securely

## Testing Strategy

### Unit Tests
- WebSocket service connection management
- Message parsing and validation
- Error handling and recovery
- Hook state management

### Integration Tests
- End-to-end message flow
- Multi-user collaboration scenarios
- Connection failure recovery
- Performance under load

### Manual Testing
- Cross-browser compatibility
- Network condition simulation
- Real-time feature validation
- User experience testing

## Deployment Considerations

### Production Setup
- **Load Balancing**: Sticky sessions for WebSocket connections
- **SSL/TLS**: Secure WebSocket connections (wss://)
- **Monitoring**: Connection health and performance metrics
- **Scaling**: Horizontal scaling with Redis pub/sub

### Development Setup
- **Local WebSocket Server**: Mock WebSocket server for development
- **Hot Reloading**: WebSocket reconnection on code changes
- **Debug Tools**: Enhanced logging and connection state visibility
- **Mock Data**: Simulated real-time events for testing

This WebSocket integration provides a robust, scalable foundation for real-time features while maintaining clean architecture principles and excellent user experience.