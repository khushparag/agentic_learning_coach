# Collaboration Components

This directory contains all real-time collaboration features for the Agentic Learning Coach web UI. The collaboration system provides a comprehensive suite of tools for real-time learning, code review, and social interaction.

## 🚀 Features

### Real-Time Collaboration
- **Live Cursors & Selections**: See where other users are editing in real-time
- **Collaborative Code Editor**: Monaco Editor with real-time synchronization
- **Real-Time Chat**: Text messaging with emoji reactions and code snippets
- **Code Review System**: Line-by-line commenting and review workflows
- **Progress Sharing**: Achievement celebrations and progress feeds
- **Voice & Video Calls**: WebRTC-based audio/video communication
- **Screen Sharing**: Share your screen with other participants
- **Session Recording**: Record collaboration sessions for later review

### Advanced Features
- **Smart Notifications**: Contextual notifications with sound and desktop alerts
- **Conflict Resolution**: Automatic handling of concurrent edits
- **Presence Awareness**: See who's online and their current activity
- **Permission System**: Role-based access control (owner, moderator, member)
- **Session Management**: Create, join, and manage collaboration sessions
- **Settings & Preferences**: Customizable collaboration experience

## 📁 Component Structure

### Core Components

#### `EnhancedCollaborationDashboard`
The main collaboration interface that orchestrates all features.

**Features:**
- Integrated code editor with collaboration features
- Resizable panels for chat, review, and progress
- Media controls for voice/video/screen sharing
- Session management and participant list
- Customizable layout and settings

**Usage:**
```tsx
import { EnhancedCollaborationDashboard } from '../components/collaboration'

<EnhancedCollaborationDashboard
  currentUser={user}
  initialCode="console.log('Hello, World!')"
  language="javascript"
  onCodeChange={handleCodeChange}
  onSave={handleSave}
/>
```

#### `CollaborativeCodeEditor`
Enhanced Monaco Editor with real-time collaboration features.

**Features:**
- Real-time code synchronization
- Live cursor and selection sharing
- Conflict-free collaborative editing
- Integrated chat and review panels
- Keyboard shortcuts and commands
- Lock/unlock editing capabilities

**Usage:**
```tsx
import { CollaborativeCodeEditor } from '../components/collaboration'

<CollaborativeCodeEditor
  initialCode={code}
  language="typescript"
  currentUser={user}
  sessionId="session-123"
  onCodeChange={setCode}
  onSave={saveCode}
/>
```

#### `RealTimeChat`
Real-time chat system for study groups and collaboration sessions.

**Features:**
- Text messages with emoji reactions
- Code snippet sharing with syntax highlighting
- Typing indicators and presence
- Message history and persistence
- Reply functionality and threads
- System messages and celebrations

**Usage:**
```tsx
import { RealTimeChat } from '../components/collaboration'

<RealTimeChat
  session={collaborationSession}
  currentUser={user}
/>
```

#### `CodeReviewInterface`
Collaborative code review with real-time commenting and feedback.

**Features:**
- Line-by-line commenting
- Comment types (suggestion, question, issue, praise)
- Comment threads and replies
- Comment resolution workflow
- Review summary and ratings
- Real-time comment synchronization

**Usage:**
```tsx
import { CodeReviewInterface } from '../components/collaboration'

<CodeReviewInterface
  editor={monacoEditor}
  session={collaborationSession}
  currentUser={user}
  submissionId="submission-123"
/>
```

#### `ProgressSharingFeed`
Real-time progress sharing and celebration system.

**Features:**
- Achievement sharing with animations
- Progress celebrations (confetti, fireworks, sparkles)
- Social reactions and comments
- Achievement types (task completion, streaks, level ups)
- Celebration animations and sound effects

**Usage:**
```tsx
import { ProgressSharingFeed } from '../components/collaboration'

<ProgressSharingFeed
  session={collaborationSession}
  currentUser={user}
/>
```

#### `LiveCursorSharing`
Displays real-time cursors and selections from other users in Monaco Editor.

**Features:**
- Live cursor positions with user colors
- Selection highlighting
- User identification labels
- Automatic cleanup of stale cursors
- Configurable display options

**Usage:**
```tsx
import { LiveCursorSharing } from '../components/collaboration'

<LiveCursorSharing
  editor={monacoEditor}
  currentUser={user}
  enabled={true}
/>
```

#### `CollaborationNotifications`
Real-time notifications for collaboration events with sound and visual effects.

**Features:**
- Smart notification system
- Sound notifications with different tones
- Desktop notifications
- Priority filtering (low, medium, high)
- Customizable notification settings
- Action buttons for quick responses

**Usage:**
```tsx
import { CollaborationNotifications } from '../components/collaboration'

<CollaborationNotifications
  currentUser={user}
  session={session}
  soundEnabled={true}
/>
```

### Supporting Components

#### `CollaborationDashboard`
Original collaboration dashboard (legacy, use Enhanced version).

#### `StudyGroupCollaboration`
Enhanced study group interface with collaboration features.

## 🔧 Services & Hooks

### `collaborationService`
Singleton service for WebSocket communication and API calls.

**Features:**
- WebSocket connection management
- Real-time event handling
- API integration for persistence
- Settings management
- Error handling and reconnection

**Usage:**
```tsx
import { collaborationService } from '../services/collaborationService'

// Send chat message
collaborationService.sendChatMessage('Hello!', 'text')

// Share progress
collaborationService.shareProgress({
  userId: user.id,
  type: 'task_completed',
  data: { taskName: 'Array Challenge', xpGained: 50 }
})

// Listen for events
const unsubscribe = collaborationService.on('chat_message', (message) => {
  console.log('New message:', message)
})
```

### `useCollaboration`
Main hook for managing collaboration state and functionality.

**Features:**
- Connection management
- Session management
- Real-time event handling
- Settings management
- Error handling

**Usage:**
```tsx
import { useCollaboration } from '../hooks/useCollaboration'

const collaboration = useCollaboration(currentUser, {
  autoConnect: true,
  enableCursors: true,
  enableChat: true,
  enableProgressSharing: true
})

// Create session
const session = await collaboration.createSession({
  type: 'study_session',
  title: 'JavaScript Study Group'
})

// Send message
collaboration.sendMessage('Hello everyone!')

// Share progress
collaboration.shareProgress('task_completed', {
  taskName: 'Completed exercise',
  xpGained: 25
})
```

## 🎯 Integration Examples

### Basic Integration
```tsx
import React from 'react'
import { EnhancedCollaborationDashboard } from '../components/collaboration'

function CodeEditor() {
  const currentUser = {
    id: 'user-123',
    username: 'john_doe',
    avatar: '/avatars/john.jpg',
    color: '#3b82f6',
    isOnline: true,
    role: 'member',
    joinedAt: new Date(),
    lastActivity: new Date()
  }

  return (
    <EnhancedCollaborationDashboard
      currentUser={currentUser}
      initialCode="// Start coding together!"
      language="javascript"
      onCodeChange={(code) => console.log('Code changed:', code)}
      onSave={(code) => console.log('Code saved:', code)}
    />
  )
}
```

### Advanced Integration with Session Management
```tsx
import React, { useState, useEffect } from 'react'
import { 
  EnhancedCollaborationDashboard,
  CollaborationNotifications,
  useCollaboration 
} from '../components/collaboration'

function AdvancedCollaborationExample() {
  const [currentUser] = useState({
    id: 'user-123',
    username: 'john_doe',
    // ... other user properties
  })

  const collaboration = useCollaboration(currentUser, {
    autoConnect: true,
    enableCursors: true,
    enableChat: true,
    enableProgressSharing: true
  })

  // Auto-join session from URL
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session')
    if (sessionId) {
      collaboration.joinSession(sessionId)
    }
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Header with notifications */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h1>Collaborative Coding</h1>
        <CollaborationNotifications
          currentUser={currentUser}
          session={collaboration.currentSession}
        />
      </div>

      {/* Main collaboration interface */}
      <div className="flex-1">
        <EnhancedCollaborationDashboard
          currentUser={currentUser}
          initialCode="// Welcome to collaborative coding!"
          language="javascript"
        />
      </div>
    </div>
  )
}
```

## 🔊 Real-Time Features

### WebSocket Events
The collaboration system uses WebSocket for real-time communication:

```typescript
// Event types
type CollaborationEvent = 
  | 'user_joined'
  | 'user_left' 
  | 'chat_message'
  | 'cursor_update'
  | 'code_change'
  | 'comment_added'
  | 'progress_shared'
  | 'session_updated'

// Event handling
collaborationService.on('chat_message', (message) => {
  // Handle new chat message
})

collaborationService.on('cursor_update', (cursor) => {
  // Update live cursor position
})

collaborationService.on('progress_shared', (share) => {
  // Show progress celebration
})
```

### Conflict Resolution
The system handles concurrent edits using operational transformation:

```typescript
// Code changes are automatically synchronized
// No manual conflict resolution needed
editor.onDidChangeModelContent((changes) => {
  // Changes are automatically broadcast to other users
  // Conflicts are resolved using operational transformation
})
```

### Presence Awareness
Track user presence and activity:

```typescript
// User presence is automatically tracked
const participants = collaboration.participants

// Check if user is online
const isOnline = participants.find(p => p.id === userId)?.isOnline

// Get user's last activity
const lastActivity = participants.find(p => p.id === userId)?.lastActivity
```

## 🎨 Styling & Themes

### CSS Classes
The components use Tailwind CSS classes and custom animations:

```css
/* Live cursor styling */
.live-cursor {
  border-left: 2px solid;
  animation: cursor-blink 1s infinite;
}

/* Comment decorations */
.code-review-line-with-comments {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}

/* Celebration animations */
@keyframes celebration-confetti {
  0% { transform: scale(0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0.8) rotate(360deg); opacity: 0; }
}
```

### Customization
Components accept className props for custom styling:

```tsx
<RealTimeChat
  session={session}
  currentUser={user}
  className="custom-chat-styles"
/>
```

## 🔧 Configuration

### Environment Variables
```env
VITE_WS_URL=ws://localhost:8000/ws/collaboration
VITE_COLLABORATION_ENABLED=true
VITE_MAX_PARTICIPANTS=20
VITE_MESSAGE_HISTORY_LIMIT=100
```

### Settings
Collaboration settings are stored in localStorage:

```typescript
interface CollaborationSettings {
  showCursors: boolean
  showUsernames: boolean
  enableChat: boolean
  enableVoice: boolean
  enableProgressSharing: boolean
  notificationPreferences: {
    userJoined: boolean
    newMessage: boolean
    codeComments: boolean
    progressShares: boolean
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run collaboration component tests
npm test -- --testPathPattern=collaboration

# Run specific component tests
npm test -- RealTimeChat.test.tsx
npm test -- CodeReviewInterface.test.tsx
```

### Integration Tests
```bash
# Run collaboration integration tests
npm test -- --testPathPattern=integration/collaboration
```

### E2E Tests
```bash
# Run end-to-end collaboration tests
npm run test:e2e -- --spec="collaboration-flow.cy.ts"
```

## 🚀 Performance

### Optimization Features
- Efficient cursor update throttling (300ms)
- Message history limits (100 messages)
- Progress share limits (50 shares)
- Automatic cleanup of stale data
- Optimized re-renders with React.memo
- WebSocket connection pooling
- Lazy loading of collaboration features

### Memory Management
- Automatic cleanup of event listeners
- Timeout management for animations
- Efficient data structures for real-time updates
- Garbage collection of unused cursors and comments

## 🔒 Security

### Data Protection
- Input sanitization for all user content
- Rate limiting on message sending
- Secure WebSocket connections (WSS)
- User permission validation
- Content filtering for inappropriate material
- No PII in logs or analytics

### Authentication
- JWT-based session authentication
- Role-based access control
- Session timeout management
- Secure user identification

## 📱 Mobile Support

### Responsive Design
- Touch-friendly interface
- Mobile-optimized layouts
- Gesture support for collaboration features
- Adaptive panel sizing
- Mobile-specific notifications

### PWA Features
- Offline collaboration support
- Background sync for messages
- Push notifications
- App-like experience

## 🎵 Audio & Media

### Notification Sounds
- Different sounds for different event types
- Volume control and mute options
- Browser audio permission handling
- Fallback for silent environments

### Voice & Video
- WebRTC-based communication
- Screen sharing capabilities
- Audio/video controls
- Bandwidth optimization
- Fallback for unsupported browsers

## 🔄 Migration Guide

### From Legacy Components
If migrating from older collaboration components:

```tsx
// Old way
import { CollaborationDashboard } from './collaboration'

// New way
import { EnhancedCollaborationDashboard } from './collaboration'

// The API is mostly compatible, with additional features
<EnhancedCollaborationDashboard
  // All old props work
  currentUser={user}
  // Plus new features
  onCodeChange={handleCodeChange}
  onSave={handleSave}
/>
```

## 📚 API Reference

### Types
```typescript
interface CollaborationUser {
  id: string
  username: string
  avatar?: string
  color: string
  isOnline: boolean
  role: 'owner' | 'moderator' | 'member'
  joinedAt: Date
  lastActivity: Date
}

interface CollaborationSession {
  id: string
  type: 'code_review' | 'pair_programming' | 'study_session' | 'challenge'
  title: string
  participants: CollaborationUser[]
  settings: SessionSettings
  // ... other properties
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  type: 'text' | 'code' | 'system' | 'celebration'
  timestamp: Date
  reactions?: MessageReaction[]
  // ... other properties
}
```

### Methods
```typescript
// Collaboration Service
collaborationService.connect(): Promise<void>
collaborationService.disconnect(): void
collaborationService.createSession(data): Promise<CollaborationSession>
collaborationService.joinSession(sessionId): Promise<CollaborationSession>
collaborationService.sendChatMessage(content, type): void
collaborationService.shareProgress(data): void
collaborationService.on(event, handler): () => void

// Collaboration Hook
const collaboration = useCollaboration(user, options)
collaboration.createSession(data): Promise<CollaborationSession>
collaboration.sendMessage(content): void
collaboration.shareProgress(type, data): void
collaboration.addComment(content, line): Promise<CodeComment>
```

## 🤝 Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Build for production: `npm run build`

### Code Style
- Use TypeScript for all new components
- Follow existing naming conventions
- Add comprehensive JSDoc comments
- Include unit tests for new features
- Update this README for new components

### Pull Request Guidelines
1. Create feature branch from main
2. Add tests for new functionality
3. Update documentation
4. Ensure all tests pass
5. Request review from team members

This collaboration system provides a comprehensive foundation for real-time learning and coding collaboration. The modular design allows for easy customization and extension while maintaining performance and security.