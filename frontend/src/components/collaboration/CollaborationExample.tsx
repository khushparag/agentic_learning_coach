/**
 * Collaboration Example Component
 * Demonstrates how to integrate all real-time collaboration features
 */

import React, { useState, useEffect } from 'react'
import { 
  EnhancedCollaborationDashboard,
  CollaborationNotifications,
  useCollaboration
} from './index'
import type { CollaborationUser } from '../../types/collaboration'

interface CollaborationExampleProps {
  userId: string
  username: string
  avatar?: string
  initialCode?: string
  language?: string
  submissionId?: string
}

export const CollaborationExample: React.FC<CollaborationExampleProps> = ({
  userId,
  username,
  avatar,
  initialCode = `// Welcome to collaborative coding!
// This editor supports real-time collaboration features:
// - Live cursors and selections
// - Real-time chat
// - Code review and comments
// - Progress sharing and celebrations
// - Voice and video calls
// - Screen sharing

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Try editing this code with others!
console.log(fibonacci(10));`,
  language = 'javascript',
  submissionId
}) => {
  const [currentUser] = useState<CollaborationUser>({
    id: userId,
    username,
    avatar,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    isOnline: true,
    role: 'member',
    joinedAt: new Date(),
    lastActivity: new Date()
  })

  const [code, setCode] = useState(initialCode)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize collaboration
  const collaboration = useCollaboration(currentUser, {
    autoConnect: true,
    enableCursors: true,
    enableChat: true,
    enableProgressSharing: true
  })

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    setHasUnsavedChanges(newCode !== initialCode)
  }

  // Handle save
  const handleSave = (codeToSave: string) => {
    console.log('Saving code:', codeToSave)
    setHasUnsavedChanges(false)
    
    // Simulate API call
    setTimeout(() => {
      // Share progress when code is saved
      collaboration.shareProgress('task_completed', {
        taskName: 'Code Exercise',
        xpGained: 25
      }, 'Successfully saved my solution!')
    }, 1000)
  }

  // Simulate some collaboration events for demo purposes
  useEffect(() => {
    if (!collaboration.isConnected) return

    const demoEvents = [
      () => {
        // Simulate user joining
        setTimeout(() => {
          collaboration.sendMessage('Hello everyone! 👋', 'text')
        }, 2000)
      },
      () => {
        // Simulate progress sharing
        setTimeout(() => {
          collaboration.shareProgress('streak_achieved', {
            streakDays: 5
          }, 'Keeping up the momentum!')
        }, 5000)
      },
      () => {
        // Simulate code comment
        setTimeout(() => {
          collaboration.addComment?.('Consider using memoization to optimize this recursive function', 8, 'suggestion')
        }, 8000)
      }
    ]

    // Run demo events
    demoEvents.forEach(event => event())
  }, [collaboration.isConnected])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Collaborative Code Editor</h1>
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {collaboration.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Notifications */}
          <CollaborationNotifications
            currentUser={currentUser}
            session={collaboration.currentSession}
            soundEnabled={true}
          />

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            {avatar ? (
              <img
                src={avatar}
                alt={username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium">{username}</span>
          </div>
        </div>
      </div>

      {/* Main Collaboration Dashboard */}
      <div className="flex-1">
        <EnhancedCollaborationDashboard
          currentUser={currentUser}
          initialCode={code}
          language={language}
          submissionId={submissionId}
          onCodeChange={handleCodeChange}
          onSave={handleSave}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Language: {language}</span>
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          {collaboration.currentSession && (
            <span>Session: {collaboration.currentSession.title}</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {collaboration.participants.length > 0 && (
            <span>{collaboration.participants.length} participant{collaboration.participants.length !== 1 ? 's' : ''}</span>
          )}
          <span>
            {collaboration.isConnected ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
      </div>

      {/* Demo Instructions */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-sm">
          <h4 className="font-medium text-blue-900 mb-2">Demo Features</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Real-time code editing with live cursors</li>
            <li>• Chat with other participants</li>
            <li>• Add code comments and reviews</li>
            <li>• Share progress and achievements</li>
            <li>• Voice/video calls and screen sharing</li>
            <li>• Desktop notifications</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default CollaborationExample