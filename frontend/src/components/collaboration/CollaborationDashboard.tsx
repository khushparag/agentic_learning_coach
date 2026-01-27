/**
 * Collaboration Dashboard Component
 * Main interface for real-time collaboration features
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  MessageSquare, 
  Code, 
  TrendingUp, 
  Plus,
  Search,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import RealTimeChat from './RealTimeChat'
import CodeReviewInterface from './CodeReviewInterface'
import ProgressSharingFeed from './ProgressSharingFeed'
import LiveCursorSharing from './LiveCursorSharing'
import useCollaboration from '../../hooks/useCollaboration'
import type { editor } from 'monaco-editor'
import type { 
  StudyGroup, 
  CollaborationSession, 
  CollaborationUser 
} from '../../types/collaboration'

interface CollaborationDashboardProps {
  currentUser: CollaborationUser
  editor?: editor.IStandaloneCodeEditor | null
  submissionId?: string
  className?: string
}

interface CreateSessionData {
  title: string
  description: string
  type: CollaborationSession['type']
  maxParticipants: number
  studyGroupId?: string
}

const SESSION_TYPES = [
  { value: 'code_review', label: 'Code Review', icon: Code },
  { value: 'pair_programming', label: 'Pair Programming', icon: Users },
  { value: 'study_session', label: 'Study Session', icon: MessageSquare },
  { value: 'challenge', label: 'Challenge', icon: TrendingUp }
] as const

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  currentUser,
  editor,
  submissionId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'review' | 'progress'>('chat')
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showJoinSession, setShowJoinSession] = useState(false)
  const [showStudyGroups, setShowStudyGroups] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [availableSessions, setAvailableSessions] = useState<CollaborationSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const [createSessionData, setCreateSessionData] = useState<CreateSessionData>({
    title: '',
    description: '',
    type: 'study_session',
    maxParticipants: 10,
    studyGroupId: undefined
  })

  const collaboration = useCollaboration(currentUser, {
    autoConnect: true,
    enableCursors: true,
    enableChat: true,
    enableProgressSharing: true
  })

  const dashboardRef = useRef<HTMLDivElement>(null)

  // Load study groups
  useEffect(() => {
    const loadStudyGroups = async () => {
      try {
        const response = await fetch('/api/collaboration/study-groups')
        if (response.ok) {
          const groups = await response.json()
          setStudyGroups(groups)
        }
      } catch (error) {
        console.error('Failed to load study groups:', error)
      }
    }

    loadStudyGroups()
  }, [])

  // Load available sessions
  useEffect(() => {
    const loadAvailableSessions = async () => {
      try {
        const response = await fetch('/api/collaboration/sessions/available')
        if (response.ok) {
          const sessions = await response.json()
          setAvailableSessions(sessions)
        }
      } catch (error) {
        console.error('Failed to load available sessions:', error)
      }
    }

    loadAvailableSessions()
  }, [])

  // Create new session
  const handleCreateSession = async () => {
    try {
      await collaboration.createSession({
        ...createSessionData,
        hostId: currentUser.id,
        participants: [currentUser],
        status: 'waiting',
        settings: {
          allowChat: true,
          allowVoice: false,
          allowScreenShare: false,
          recordSession: false,
          requireApproval: false
        }
      })

      setShowCreateSession(false)
      setCreateSessionData({
        title: '',
        description: '',
        type: 'study_session',
        maxParticipants: 10,
        studyGroupId: undefined
      })
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  // Join existing session
  const handleJoinSession = async (sessionId: string) => {
    try {
      await collaboration.joinSession(sessionId)
      setShowJoinSession(false)
    } catch (error) {
      console.error('Failed to join session:', error)
    }
  }

  // Filter available sessions
  const filteredSessions = availableSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || session.type === filterType
    return matchesSearch && matchesType
  })

  // Get tab content
  const getTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <RealTimeChat
            session={collaboration.currentSession}
            currentUser={currentUser}
            className="h-full"
          />
        )
      case 'review':
        return (
          <CodeReviewInterface
            editor={editor ?? null}
            session={collaboration.currentSession}
            currentUser={currentUser}
            submissionId={submissionId}
          />
        )
      case 'progress':
        return (
          <ProgressSharingFeed
            session={collaboration.currentSession}
            currentUser={currentUser}
            className="h-full"
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Live Cursor Sharing (invisible component) */}
      <LiveCursorSharing
        editor={editor ?? null}
        currentUser={currentUser}
        enabled={collaboration.settings.showCursors}
      />

      {/* Main Dashboard */}
      <div
        ref={dashboardRef}
        className={`bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'fixed inset-4 z-50' : 'relative'
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Collaboration</h2>
              <div className={`w-2 h-2 rounded-full ${
                collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>

            {collaboration.currentSession && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>•</span>
                <span>{collaboration.currentSession.title}</span>
                <span>•</span>
                <span>{collaboration.participants.length} participant{collaboration.participants.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!collaboration.currentSession ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJoinSession(true)}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Join
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateSession(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={collaboration.leaveSession}
              >
                <X className="w-4 h-4 mr-1" />
                Leave
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {collaboration.currentSession ? (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
                {collaboration.messages.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {collaboration.messages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('review')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'review'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Review</span>
                {collaboration.comments.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {collaboration.comments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
                {collaboration.progressShares.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {collaboration.progressShares.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className={`flex-1 ${isExpanded ? 'h-[calc(100vh-200px)]' : 'h-96'}`}>
              {getTabContent()}
            </div>
          </>
        ) : (
          /* No Session State */
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Collaboration
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Join an existing study session or create a new one to start collaborating with other learners.
            </p>
            <div className="flex space-x-3">
              <Button onClick={() => setShowJoinSession(true)}>
                <Search className="w-4 h-4 mr-2" />
                Browse Sessions
              </Button>
              <Button variant="outline" onClick={() => setShowCreateSession(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {collaboration.error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{collaboration.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={collaboration.clearError}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateSession(false)}
          title="Create Collaboration Session"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Title
              </label>
              <Input
                value={createSessionData.title}
                onChange={(e) => setCreateSessionData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter session title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <Input
                value={createSessionData.description}
                onChange={(e) => setCreateSessionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you'll be working on..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setCreateSessionData(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      createSessionData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <type.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <Select
                value={createSessionData.maxParticipants.toString()}
                onChange={(value) => setCreateSessionData(prev => ({ ...prev, maxParticipants: parseInt(String(value)) }))}
                options={[
                  { value: '2', label: '2 participants' },
                  { value: '5', label: '5 participants' },
                  { value: '10', label: '10 participants' },
                  { value: '20', label: '20 participants' }
                ]}
              />
            </div>

            {studyGroups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Group (optional)
                </label>
                <Select
                  value={createSessionData.studyGroupId || ''}
                  onChange={(value) => setCreateSessionData(prev => ({ ...prev, studyGroupId: String(value) || undefined }))}
                  options={[
                    { value: '', label: 'No study group' },
                    ...studyGroups.map(group => ({ value: group.id, label: group.name }))
                  ]}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateSession(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={!createSessionData.title.trim()}
              >
                Create Session
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Join Session Modal */}
      {showJoinSession && (
        <Modal
          isOpen={true}
          onClose={() => setShowJoinSession(false)}
          title="Join Collaboration Session"
        >
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full"
                />
              </div>
              <Select
                value={filterType}
                onChange={(value) => setFilterType(String(value))}
                options={[
                  { value: 'all', label: 'All Types' },
                  ...SESSION_TYPES.map(type => ({ value: type.value, label: type.label }))
                ]}
              />
            </div>

            {/* Available Sessions */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions found</p>
                  <p className="text-sm">Try adjusting your search or create a new session</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{session.title}</h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            {session.type.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            session.status === 'active' ? 'bg-green-100 text-green-800' :
                            session.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{session.participants.length}/{session.maxParticipants} participants</span>
                          <span>Host: {session.participants.find(p => p.id === session.hostId)?.username}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(session.id)}
                        disabled={session.participants.length >= session.maxParticipants}
                      >
                        Join
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowJoinSession(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateSession(true)}
              >
                Create New Session
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CollaborationDashboard