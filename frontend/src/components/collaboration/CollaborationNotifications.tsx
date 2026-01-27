/**
 * Collaboration Notifications Component
 * Real-time notifications for collaboration events with sound and visual effects
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Bell, 
  X, 
  Users, 
  MessageSquare, 
  Code, 
  Trophy, 
  Star,
  Zap,
  Target,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import type { 
  CollaborationUser, 
  CollaborationSession,
  ChatMessage,
  ProgressShare,
  CodeComment
} from '../../types/collaboration'
import { collaborationService } from '../../services/collaborationService'
import { formatDistanceToNow } from 'date-fns'

interface CollaborationNotification {
  id: string
  type: 'user_joined' | 'user_left' | 'chat_message' | 'code_comment' | 'progress_share' | 'session_invite'
  title: string
  message: string
  icon: React.ReactNode
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
  data?: any
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
}

interface CollaborationNotificationsProps {
  currentUser: CollaborationUser
  session: CollaborationSession | null
  soundEnabled?: boolean
  className?: string
}

interface NotificationSettings {
  userJoined: boolean
  userLeft: boolean
  chatMessages: boolean
  codeComments: boolean
  progressShares: boolean
  sessionInvites: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
  priority: 'all' | 'high' | 'none'
}

const DEFAULT_SETTINGS: NotificationSettings = {
  userJoined: true,
  userLeft: false,
  chatMessages: true,
  codeComments: true,
  progressShares: true,
  sessionInvites: true,
  soundEnabled: true,
  desktopNotifications: true,
  priority: 'all'
}

// Notification sounds (base64 encoded or URLs)
const NOTIFICATION_SOUNDS = {
  user_joined: '/sounds/user-joined.mp3',
  user_left: '/sounds/user-left.mp3',
  chat_message: '/sounds/message.mp3',
  code_comment: '/sounds/comment.mp3',
  progress_share: '/sounds/achievement.mp3',
  session_invite: '/sounds/invite.mp3'
}

export const CollaborationNotifications: React.FC<CollaborationNotificationsProps> = ({
  currentUser,
  session,
  soundEnabled = true,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [unreadCount, setUnreadCount] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notificationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Create notification
  const createNotification = useCallback((
    type: CollaborationNotification['type'],
    title: string,
    message: string,
    priority: CollaborationNotification['priority'] = 'medium',
    data?: any,
    actions?: CollaborationNotification['actions']
  ): CollaborationNotification => {
    const icons = {
      user_joined: <Users className="w-5 h-5 text-green-600" />,
      user_left: <Users className="w-5 h-5 text-gray-600" />,
      chat_message: <MessageSquare className="w-5 h-5 text-blue-600" />,
      code_comment: <Code className="w-5 h-5 text-purple-600" />,
      progress_share: <Trophy className="w-5 h-5 text-yellow-600" />,
      session_invite: <Bell className="w-5 h-5 text-indigo-600" />
    }

    return {
      id: `notification-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      icon: icons[type],
      timestamp: new Date(),
      read: false,
      priority,
      data,
      actions
    }
  }, [])

  // Add notification
  const addNotification = useCallback((notification: CollaborationNotification) => {
    // Check if this type of notification is enabled
    const typeEnabled = {
      user_joined: settings.userJoined,
      user_left: settings.userLeft,
      chat_message: settings.chatMessages,
      code_comment: settings.codeComments,
      progress_share: settings.progressShares,
      session_invite: settings.sessionInvites
    }

    if (!typeEnabled[notification.type]) return

    // Check priority filter
    if (settings.priority === 'high' && notification.priority !== 'high') return
    if (settings.priority === 'none') return

    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
    setUnreadCount(prev => prev + 1)

    // Play sound
    if (settings.soundEnabled && soundEnabled) {
      playNotificationSound(notification.type)
    }

    // Show desktop notification
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }

    // Auto-remove low priority notifications after 5 seconds
    if (notification.priority === 'low') {
      const timeout = setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
      notificationTimeoutRef.current.set(notification.id, timeout)
    }
  }, [settings, soundEnabled])

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    
    const timeout = notificationTimeoutRef.current.get(notificationId)
    if (timeout) {
      clearTimeout(timeout)
      notificationTimeoutRef.current.delete(notificationId)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback((type: CollaborationNotification['type']) => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const soundUrl = NOTIFICATION_SOUNDS[type]
    if (soundUrl) {
      audioRef.current.src = soundUrl
      audioRef.current.play().catch(console.error)
    }
  }, [])

  // Handle user joined
  const handleUserJoined = useCallback((user: CollaborationUser) => {
    if (user.id === currentUser.id) return

    const notification = createNotification(
      'user_joined',
      'User Joined',
      `${user.username} joined the session`,
      'low',
      { user }
    )
    addNotification(notification)
  }, [currentUser.id, createNotification, addNotification])

  // Handle user left
  const handleUserLeft = useCallback((data: { userId: string; username: string }) => {
    if (data.userId === currentUser.id) return

    const notification = createNotification(
      'user_left',
      'User Left',
      `${data.username} left the session`,
      'low',
      data
    )
    addNotification(notification)
  }, [currentUser.id, createNotification, addNotification])

  // Handle chat message
  const handleChatMessage = useCallback((message: ChatMessage) => {
    if (message.userId === currentUser.id) return

    const notification = createNotification(
      'chat_message',
      'New Message',
      `${message.username}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      'medium',
      { message },
      [
        {
          label: 'Reply',
          action: () => {
            // Open chat and focus on reply
            setShowNotifications(false)
            // This would trigger opening the chat panel
          },
          variant: 'primary'
        }
      ]
    )
    addNotification(notification)
  }, [currentUser.id, createNotification, addNotification])

  // Handle code comment
  const handleCodeComment = useCallback((comment: CodeComment) => {
    if (comment.userId === currentUser.id) return

    const notification = createNotification(
      'code_comment',
      'Code Comment',
      `${comment.username} commented on line ${comment.position.lineNumber}`,
      'high',
      { comment },
      [
        {
          label: 'View',
          action: () => {
            // Navigate to the comment
            setShowNotifications(false)
            // This would trigger opening the review panel and scrolling to the comment
          },
          variant: 'primary'
        },
        {
          label: 'Reply',
          action: () => {
            // Open reply interface
            setShowNotifications(false)
          },
          variant: 'secondary'
        }
      ]
    )
    addNotification(notification)
  }, [currentUser.id, createNotification, addNotification])

  // Handle progress share
  const handleProgressShare = useCallback((share: ProgressShare) => {
    if (share.userId === currentUser.id) return

    const achievementText = {
      task_completed: `completed "${share.data.taskName}"`,
      milestone_reached: `reached milestone: ${share.data.milestoneName}`,
      streak_achieved: `achieved a ${share.data.streakDays} day streak`,
      level_up: `leveled up to Level ${share.data.newLevel}`
    }

    const notification = createNotification(
      'progress_share',
      'Achievement Unlocked',
      `${share.username} ${achievementText[share.type]}!`,
      'medium',
      { share },
      [
        {
          label: 'Celebrate',
          action: () => {
            collaborationService.celebrateProgress(share.id, '🎉')
            markAsRead(notification.id)
          },
          variant: 'primary'
        }
      ]
    )
    addNotification(notification)
  }, [currentUser.id, createNotification, addNotification, markAsRead])

  // Handle session invite
  const handleSessionInvite = useCallback((data: { sessionId: string; sessionName: string; inviterName: string }) => {
    const notification = createNotification(
      'session_invite',
      'Session Invite',
      `${data.inviterName} invited you to join "${data.sessionName}"`,
      'high',
      data,
      [
        {
          label: 'Join',
          action: async () => {
            try {
              await collaborationService.joinSession(data.sessionId)
              removeNotification(notification.id)
            } catch (error) {
              console.error('Failed to join session:', error)
            }
          },
          variant: 'primary'
        },
        {
          label: 'Decline',
          action: () => {
            removeNotification(notification.id)
          },
          variant: 'secondary'
        }
      ]
    )
    addNotification(notification)
  }, [createNotification, addNotification, removeNotification])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    
    // Save to localStorage
    localStorage.setItem('collaboration_notification_settings', JSON.stringify({
      ...settings,
      ...newSettings
    }))
  }, [settings])

  // Setup event listeners
  useEffect(() => {
    if (!session) return

    const unsubscribers = [
      collaborationService.on('user_joined', handleUserJoined),
      collaborationService.on('user_left', handleUserLeft),
      collaborationService.on('chat_message', handleChatMessage),
      collaborationService.on('comment_added', handleCodeComment),
      collaborationService.on('progress_shared', handleProgressShare),
      collaborationService.on('session_invite', handleSessionInvite)
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [session, handleUserJoined, handleUserLeft, handleChatMessage, handleCodeComment, handleProgressShare, handleSessionInvite])

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collaboration_notification_settings')
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      }
    }
  }, [])

  // Request notification permission
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [settings.desktopNotifications])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notificationTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
      notificationTimeoutRef.current.clear()
    }
  }, [])

  return (
    <>
      {/* Notification Bell */}
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  title={settings.soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                >
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  title="Notification settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="w-full text-left"
                >
                  Mark all as read
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                          
                          {notification.actions && (
                            <div className="flex items-center space-x-2">
                              {notification.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant={action.variant === 'primary' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => {
                                    action.action()
                                    if (!notification.read) {
                                      markAsRead(notification.id)
                                    }
                                  }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettings(false)}
          title="Notification Settings"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Event Types</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.userJoined}
                    onChange={(e) => updateSettings({ userJoined: e.target.checked })}
                  />
                  <span className="text-sm">User joined session</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.userLeft}
                    onChange={(e) => updateSettings({ userLeft: e.target.checked })}
                  />
                  <span className="text-sm">User left session</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.chatMessages}
                    onChange={(e) => updateSettings({ chatMessages: e.target.checked })}
                  />
                  <span className="text-sm">Chat messages</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.codeComments}
                    onChange={(e) => updateSettings({ codeComments: e.target.checked })}
                  />
                  <span className="text-sm">Code comments</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.progressShares}
                    onChange={(e) => updateSettings({ progressShares: e.target.checked })}
                  />
                  <span className="text-sm">Progress achievements</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.sessionInvites}
                    onChange={(e) => updateSettings({ sessionInvites: e.target.checked })}
                  />
                  <span className="text-sm">Session invites</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Delivery Options</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  />
                  <span className="text-sm">Sound notifications</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.desktopNotifications}
                    onChange={(e) => updateSettings({ desktopNotifications: e.target.checked })}
                  />
                  <span className="text-sm">Desktop notifications</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Priority Filter</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="priority"
                    checked={settings.priority === 'all'}
                    onChange={() => updateSettings({ priority: 'all' })}
                  />
                  <span className="text-sm">All notifications</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="priority"
                    checked={settings.priority === 'high'}
                    onChange={() => updateSettings({ priority: 'high' })}
                  />
                  <span className="text-sm">High priority only</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="priority"
                    checked={settings.priority === 'none'}
                    onChange={() => updateSettings({ priority: 'none' })}
                  />
                  <span className="text-sm">No notifications</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowSettings(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CollaborationNotifications
