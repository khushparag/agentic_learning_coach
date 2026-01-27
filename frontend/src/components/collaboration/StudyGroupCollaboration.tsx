/**
 * Study Group Collaboration Component
 * Real-time collaboration features for study groups including chat, shared cursors, and live progress
 */

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ShareIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline'
import { useCollaborationWebSocket } from '../../hooks/useWebSocket'
import { useAuth } from '../../contexts/AuthContext'

interface Participant {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen: string
  role: 'owner' | 'moderator' | 'member'
  currentActivity?: string
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'code_share'
  data?: any
}

interface CursorPosition {
  userId: string
  username: string
  x: number
  y: number
  color: string
  lastUpdate: string
}

interface StudyGroupCollaborationProps {
  roomId: string
  studyGroupId: string
  onParticipantUpdate?: (participants: Participant[]) => void
  onActivityShare?: (activity: any) => void
}

export const StudyGroupCollaboration: React.FC<StudyGroupCollaborationProps> = ({
  roomId,
  studyGroupId,
  onParticipantUpdate,
  onActivityShare
}) => {
  const { user } = useAuth()
  const { 
    connectionState, 
    participants, 
    messages, 
    cursors,
    sendMessage,
    updateCursor,
    joinRoom,
    leaveRoom
  } = useCollaborationWebSocket(roomId, user?.id)

  const [chatInput, setChatInput] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout>()

  // Handle mouse movement for cursor sharing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectionState.isConnected && user?.id) {
        // Throttle cursor updates
        if (mouseMoveTimeoutRef.current) {
          clearTimeout(mouseMoveTimeoutRef.current)
        }

        mouseMoveTimeoutRef.current = setTimeout(() => {
          updateCursor({
            x: e.clientX,
            y: e.clientY,
            timestamp: new Date().toISOString()
          })
        }, 100)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current)
      }
    }
  }, [connectionState.isConnected, user?.id, updateCursor])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Notify parent of participant updates
  useEffect(() => {
    if (onParticipantUpdate) {
      onParticipantUpdate(participants)
    }
  }, [participants, onParticipantUpdate])

  const handleSendMessage = () => {
    if (chatInput.trim() && user?.id) {
      sendMessage(chatInput.trim())
      setChatInput('')
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value)
    
    // Handle typing indicators
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true)
      // Send typing indicator
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false)
      // Send stop typing indicator
    }
  }

  const getParticipantColor = (userId: string) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ]
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="relative">
      {/* Shared Cursors */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {Array.from(cursors.entries()).map(([userId, cursor]) => {
            if (userId === user?.id) return null
            
            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  color: getParticipantColor(userId)
                }}
                className="absolute transform -translate-x-1 -translate-y-1"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
                <div className="ml-2 mt-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
                  {cursor.username}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Participants Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Study Group</h3>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {connectionState.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{participants.length} online</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="relative">
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: getParticipantColor(participant.id) }}
                    >
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {participant.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {participant.username}
                    {participant.id === user?.id && (
                      <span className="ml-1 text-xs text-blue-600">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.currentActivity || 'Idle'}
                  </p>
                </div>

                {participant.role === 'owner' && (
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Owner
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Group Chat</h3>
              {messages.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            
            <motion.div
              animate={{ rotate: isChatOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ChatBubbleLeftIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-xs lg:max-w-md px-3 py-2 rounded-lg
                          ${message.userId === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          }
                        `}
                      >
                        {message.userId !== user?.id && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.username}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${message.userId === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Typing Indicators */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!connectionState.isConnected}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || !connectionState.isConnected}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StudyGroupCollaboration
