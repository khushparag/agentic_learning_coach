/**
 * Real-Time Chat Component
 * Chat system for study groups and collaboration sessions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Smile, Code, Trophy, Users, Settings, MoreVertical } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import type { ChatMessage, CollaborationUser, CollaborationSession } from '../../types/collaboration'
import { collaborationService } from '../../services/collaborationService'
import { formatDistanceToNow } from 'date-fns'

interface RealTimeChatProps {
  session: CollaborationSession | null
  currentUser: CollaborationUser
  className?: string
}

interface EmojiReaction {
  emoji: string
  label: string
}

const QUICK_REACTIONS: EmojiReaction[] = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '🤔', label: 'Think' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👏', label: 'Clap' }
]

const CELEBRATION_EMOJIS = ['🎉', '🎊', '🥳', '🏆', '⭐', '💫', '🔥', '💪']

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
  session,
  currentUser,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<CollaborationUser[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Handle new message
  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
    scrollToBottom()
  }, [scrollToBottom])

  // Handle user typing
  const handleUserTyping = useCallback((data: { userId: string; username: string; isTyping: boolean }) => {
    setIsTyping(prev => {
      if (data.isTyping && data.userId !== currentUser.id) {
        return prev.includes(data.username) ? prev : [...prev, data.username]
      } else {
        return prev.filter(name => name !== data.username)
      }
    })
  }, [currentUser.id])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !session) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      collaborationService.sendChatMessage(messageContent, 'text', {
        replyTo: replyingTo
      })
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Restore message on error
      setNewMessage(messageContent)
    }
  }, [newMessage, session, replyingTo])

  // Send code snippet
  const sendCodeSnippet = useCallback((code: string, language: string) => {
    if (!session) return

    collaborationService.sendCodeSnippet(code, language)
  }, [session])

  // Send celebration message
  const sendCelebration = useCallback((achievement: string) => {
    if (!session) return

    const emoji = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]
    collaborationService.sendChatMessage(
      `${emoji} Congratulations on ${achievement}! ${emoji}`,
      'celebration'
    )
  }, [session])

  // React to message
  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    collaborationService.reactToMessage(messageId, emoji)
  }, [])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!session) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing start
    collaborationService.sendTypingStatus(true)

    // Set timeout to send typing stop
    typingTimeoutRef.current = setTimeout(() => {
      collaborationService.sendTypingStatus(false)
    }, 2000)
  }, [session])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.key === 'Escape') {
      setReplyingTo(null)
    }
  }, [sendMessage])

  // Format message timestamp
  const formatMessageTime = useCallback((timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }, [])

  // Get message type styling
  const getMessageTypeClass = useCallback((type: ChatMessage['type']) => {
    switch (type) {
      case 'code':
        return 'bg-gray-100 border-l-4 border-blue-500 font-mono text-sm'
      case 'system':
        return 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800'
      case 'celebration':
        return 'bg-green-50 border-l-4 border-green-400 text-green-800'
      default:
        return 'bg-white'
    }
  }, [])

  // Setup event listeners
  useEffect(() => {
    if (!session) return

    const unsubscribers = [
      collaborationService.on('chat_message', handleNewMessage),
      collaborationService.on('user_typing', handleUserTyping),
      collaborationService.on('connection_status', (data: { connected: boolean }) => {
        setIsConnected(data.connected)
      }),
      collaborationService.on('session_updated', (updatedSession: CollaborationSession) => {
        setParticipants(updatedSession.participants)
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [session, handleNewMessage, handleUserTyping])

  // Load initial messages
  useEffect(() => {
    if (!session) return

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/collaboration/sessions/${session.id}/messages`)
        if (response.ok) {
          const initialMessages = await response.json()
          setMessages(initialMessages)
          scrollToBottom()
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }

    loadMessages()
  }, [session, scrollToBottom])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  if (!session) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Join a collaboration session to start chatting</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="font-semibold">Chat</h3>
          <span className="text-sm text-gray-500">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.userId === currentUser.id ? 'order-2' : 'order-1'}`}>
              {message.userId !== currentUser.id && (
                <div className="flex items-center space-x-2 mb-1">
                  {message.avatar && (
                    <img
                      src={message.avatar}
                      alt={message.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {message.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
              )}

              <div className={`p-3 rounded-lg ${getMessageTypeClass(message.type)} ${
                message.userId === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.replyTo && (
                  <div className="text-xs opacity-75 mb-2 border-l-2 border-gray-300 pl-2">
                    Replying to previous message
                  </div>
                )}

                {message.type === 'code' ? (
                  <div>
                    <div className="text-xs opacity-75 mb-1">
                      Code ({message.metadata?.language})
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </pre>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() => reactToMessage(message.id, reaction.emoji)}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-200 rounded-full text-xs hover:bg-gray-300 transition-colors"
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {message.userId === currentUser.id && (
                <div className="text-xs text-gray-500 text-right mt-1">
                  {formatMessageTime(message.timestamp)}
                </div>
              )}
            </div>

            {/* Message actions */}
            <div className={`flex items-center space-x-1 ${
              message.userId === currentUser.id ? 'order-1 mr-2' : 'order-2 ml-2'
            }`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(message.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {isTyping.length === 1
                ? `${isTyping[0]} is typing...`
                : `${isTyping.length} people are typing...`
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-b flex items-center justify-between">
          <span className="text-sm text-gray-600">Replying to message</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-20"
              disabled={!isConnected}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Open code snippet modal
                  // This would open a modal for code sharing
                }}
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick reactions */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {QUICK_REACTIONS.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + reaction.emoji)
                    setShowEmojiPicker(false)
                    inputRef.current?.focus()
                  }}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default RealTimeChat