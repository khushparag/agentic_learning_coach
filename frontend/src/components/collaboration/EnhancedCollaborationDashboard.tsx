/**
 * Enhanced Collaboration Dashboard
 * Comprehensive real-time collaboration interface with all features integrated
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Users, 
  MessageSquare, 
  Code, 
  Share2, 
  Settings, 
  Maximize2, 
  Minimize2,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MonitorOff,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Play,
  Square
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor'
import { RealTimeChat } from './RealTimeChat'
import { ProgressSharingFeed } from './ProgressSharingFeed'
import { CodeReviewInterface } from './CodeReviewInterface'
import { useCollaboration } from '../../hooks/useCollaboration'
import { collaborationService } from '../../services/collaborationService'
import type { 
  CollaborationUser, 
  CollaborationSession
} from '../../types/collaboration'

interface EnhancedCollaborationDashboardProps {
  currentUser: CollaborationUser
  initialCode?: string
  language?: string
  submissionId?: string
  onCodeChange?: (code: string) => void
  onSave?: (code: string) => void
  className?: string
}

interface PanelLayout {
  chat: { visible: boolean; width: number; position: 'left' | 'right' }
  review: { visible: boolean; width: number; position: 'left' | 'right' }
  progress: { visible: boolean; width: number; position: 'left' | 'right' }
  participants: { visible: boolean; width: number; position: 'left' | 'right' }
}

const DEFAULT_LAYOUT: PanelLayout = {
  chat: { visible: false, width: 320, position: 'right' },
  review: { visible: false, width: 400, position: 'right' },
  progress: { visible: false, width: 350, position: 'right' },
  participants: { visible: true, width: 280, position: 'left' }
}

export const EnhancedCollaborationDashboard: React.FC<EnhancedCollaborationDashboardProps> = ({
  currentUser,
  initialCode = '',
  language = 'typescript',
  submissionId,
  onCodeChange,
  onSave,
  className = ''
}) => {
  const [layout, setLayout] = useState<PanelLayout>(DEFAULT_LAYOUT)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionType, setSessionType] = useState<CollaborationSession['type']>('study_session')
  const [isRecording, setIsRecording] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [screenShareEnabled, setScreenShareEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showCursors, setShowCursors] = useState(true)
  const [isLocked, setIsLocked] = useState(false)

  const dashboardRef = useRef<HTMLDivElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Initialize collaboration
  const collaboration = useCollaboration(currentUser, {
    autoConnect: true,
    enableCursors: showCursors,
    enableChat: true,
    enableProgressSharing: true
  })

  // Toggle panel visibility
  const togglePanel = useCallback((panel: keyof PanelLayout) => {
    setLayout(prev => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        visible: !prev[panel].visible
      }
    }))
  }, [])

  // Update panel width
  const updatePanelWidth = useCallback((panel: keyof PanelLayout, width: number) => {
    setLayout(prev => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        width: Math.max(200, Math.min(600, width))
      }
    }))
  }, [])

  // Create new collaboration session
  const createSession = useCallback(async () => {
    if (!sessionName.trim()) return

    try {
      const session = await collaboration.createSession({
        type: sessionType,
        title: sessionName.trim(),
        maxParticipants: 10,
        settings: {
          allowChat: true,
          allowVoice: audioEnabled,
          allowScreenShare: screenShareEnabled,
          recordSession: isRecording,
          requireApproval: false
        }
      })

      setShowSessionModal(false)
      setSessionName('')
      
      // Show success notification
      if (notificationsEnabled) {
        new Notification('Session Created', {
          body: `Created collaboration session: ${session.title}`,
          icon: '/favicon.ico'
        })
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }, [sessionName, sessionType, audioEnabled, screenShareEnabled, isRecording, collaboration, notificationsEnabled])

  // Join existing session
  const joinSession = useCallback(async (sessionId: string) => {
    try {
      await collaboration.joinSession(sessionId)
      
      if (notificationsEnabled) {
        new Notification('Joined Session', {
          body: 'Successfully joined collaboration session',
          icon: '/favicon.ico'
        })
      }
    } catch (error) {
      console.error('Failed to join session:', error)
    }
  }, [collaboration, notificationsEnabled])

  // Leave current session
  const leaveSession = useCallback(async () => {
    try {
      await collaboration.leaveSession()
      
      // Stop media streams
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      
      setAudioEnabled(false)
      setVideoEnabled(false)
      setScreenShareEnabled(false)
      setIsRecording(false)
    } catch (error) {
      console.error('Failed to leave session:', error)
    }
  }, [collaboration])

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      if (!audioEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
        setAudioEnabled(true)
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach(track => track.stop())
        }
        setAudioEnabled(false)
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error)
    }
  }, [audioEnabled])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (!videoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (mediaStreamRef.current) {
          stream.getVideoTracks().forEach(track => {
            mediaStreamRef.current?.addTrack(track)
          })
        } else {
          mediaStreamRef.current = stream
        }
        setVideoEnabled(true)
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach(track => track.stop())
        }
        setVideoEnabled(false)
      }
    } catch (error) {
      console.error('Failed to toggle video:', error)
    }
  }, [videoEnabled])

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!screenShareEnabled) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        mediaStreamRef.current = stream
        setScreenShareEnabled(true)
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }
        setScreenShareEnabled(false)
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error)
    }
  }, [screenShareEnabled])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      dashboardRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [isFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [notificationsEnabled])

  // Calculate total panel width
  const totalPanelWidth = Object.values(layout).reduce((total, panel) => {
    return total + (panel.visible ? panel.width : 0)
  }, 0)

  // Get visible panels
  const visiblePanels = Object.entries(layout).filter(([_, panel]) => panel.visible)

  return (
    <div 
      ref={dashboardRef}
      className={`flex h-full bg-gray-50 ${className}`}
    >
      {/* Main Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {collaboration.currentSession?.title || 'No Session'}
              </span>
            </div>

            {collaboration.participants.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {collaboration.participants.length}
                </span>
              </div>
            )}
          </div>

          {/* Center Section - Media Controls */}
          {collaboration.currentSession && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAudio}
                className={audioEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVideo}
                className={videoEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleScreenShare}
                className={screenShareEnabled ? 'bg-blue-100 text-blue-700' : ''}
              >
                {screenShareEnabled ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                className={isRecording ? 'bg-red-100 text-red-700' : ''}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Panel Toggles */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('participants')}
              className={layout.participants.visible ? 'bg-blue-100' : ''}
            >
              <Users className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('chat')}
              className={layout.chat.visible ? 'bg-blue-100' : ''}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('review')}
              className={layout.review.visible ? 'bg-blue-100' : ''}
            >
              <Code className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel('progress')}
              className={layout.progress.visible ? 'bg-blue-100' : ''}
            >
              <Share2 className="w-4 h-4" />
            </Button>

            {/* Utility Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCursors(!showCursors)}
              className={showCursors ? 'bg-green-100' : ''}
            >
              {showCursors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              className={isLocked ? 'bg-red-100' : ''}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={notificationsEnabled ? 'bg-green-100' : ''}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pt-12">
        <div className="flex h-full">
          {/* Left Panels */}
          {visiblePanels
            .filter(([_, panel]) => panel.position === 'left')
            .map(([panelName, panel]) => (
              <div
                key={panelName}
                className="border-r bg-white"
                style={{ width: panel.width }}
              >
                {panelName === 'participants' && (
                  <ParticipantsPanel
                    participants={collaboration.participants}
                    currentUser={currentUser}
                    session={collaboration.currentSession}
                    onInvite={(userIds) => {
                      if (collaboration.currentSession) {
                        collaborationService.inviteToSession(collaboration.currentSession.id, userIds)
                      }
                    }}
                  />
                )}
              </div>
            ))}

          {/* Code Editor */}
          <div className="flex-1">
            <CollaborativeCodeEditor
              initialCode={initialCode}
              language={language}
              currentUser={currentUser}
              sessionId={collaboration.currentSession?.id}
              submissionId={submissionId}
              readOnly={isLocked}
              onCodeChange={onCodeChange}
              onSave={onSave}
            />
          </div>

          {/* Right Panels */}
          {visiblePanels
            .filter(([_, panel]) => panel.position === 'right')
            .map(([panelName, panel]) => (
              <div
                key={panelName}
                className="border-l bg-white"
                style={{ width: panel.width }}
              >
                {panelName === 'chat' && (
                  <RealTimeChat
                    session={collaboration.currentSession}
                    currentUser={currentUser}
                    className="h-full"
                  />
                )}
                
                {panelName === 'review' && (
                  <div className="p-4 h-full overflow-y-auto">
                    <h3 className="font-semibold mb-4">Code Review</h3>
                    <CodeReviewInterface
                      editor={null} // Will be connected via context
                      session={collaboration.currentSession}
                      currentUser={currentUser}
                      submissionId={submissionId}
                    />
                  </div>
                )}
                
                {panelName === 'progress' && (
                  <ProgressSharingFeed
                    session={collaboration.currentSession}
                    currentUser={currentUser}
                    className="h-full"
                  />
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Session Creation Modal */}
      {showSessionModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowSessionModal(false)}
          title="Create Collaboration Session"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Name
              </label>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Enter session name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <Select
                value={sessionType}
                onChange={(value) => setSessionType(value as CollaborationSession['type'])}
                options={[
                  { value: 'study_session', label: 'Study Session' },
                  { value: 'code_review', label: 'Code Review' },
                  { value: 'pair_programming', label: 'Pair Programming' },
                  { value: 'challenge', label: 'Challenge' }
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                />
                <span className="text-sm">Enable Audio</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={screenShareEnabled}
                  onChange={(e) => setScreenShareEnabled(e.target.checked)}
                />
                <span className="text-sm">Allow Screen Sharing</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isRecording}
                  onChange={(e) => setIsRecording(e.target.checked)}
                />
                <span className="text-sm">Record Session</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSessionModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createSession}
                disabled={!sessionName.trim()}
              >
                Create Session
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowSettingsModal(false)}
          title="Collaboration Settings"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Display Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCursors}
                    onChange={(e) => setShowCursors(e.target.checked)}
                  />
                  <span className="text-sm">Show Live Cursors</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <span className="text-sm">Enable Notifications</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowSettingsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Actions */}
      {!collaboration.currentSession && (
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={() => setShowSessionModal(true)}
            className="shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        </div>
      )}

      {collaboration.currentSession && (
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={leaveSession}
            variant="outline"
            className="shadow-lg"
          >
            Leave Session
          </Button>
        </div>
      )}
    </div>
  )
}

// Participants Panel Component
interface ParticipantsPanelProps {
  participants: CollaborationUser[]
  currentUser: CollaborationUser
  session: CollaborationSession | null
  onInvite?: (userIds: string[]) => void
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUser,
  session,
  onInvite
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Participants</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInviteModal(true)}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="relative">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {participant.username}
                {participant.id === currentUser.id && ' (You)'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {participant.role}
              </p>
            </div>

            {participant.role === 'owner' && (
              <div className="text-yellow-500">
                <Users className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {participants.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedCollaborationDashboard