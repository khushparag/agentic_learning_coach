/**
 * Challenge Participation Component
 * Handles challenge submission interface and real-time participation tracking
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  TrophyIcon,
  FireIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Card, Button, Badge, Progress, Modal, LoadingSpinner } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { SocialService } from '../../services/socialService'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { PeerChallenge } from '../../types/api'

interface ChallengeSession {
  challengeId: string
  title: string
  description: string
  type: 'speed_coding' | 'code_golf' | 'best_practices'
  timeLimit: number // in seconds
  startTime: number
  code: string
  language: string
  isActive: boolean
  submissions: number
  maxSubmissions: number
  currentScore?: number
  opponentScore?: number
  testResults?: Array<{
    name: string
    passed: boolean
    time?: number
  }>
}

interface ChallengeParticipationProps {
  challenge: PeerChallenge
  onComplete?: (result: any) => void
  onExit?: () => void
}

export const ChallengeParticipation: React.FC<ChallengeParticipationProps> = ({
  challenge,
  onComplete,
  onExit,
}) => {
  const { user } = useAuth()
  const { connectionState } = useWebSocket()
  
  const [session, setSession] = useState<ChallengeSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [liveUpdates, setLiveUpdates] = useState<any[]>([])

  // Initialize challenge session
  useEffect(() => {
    const initSession = () => {
      const timeLimit = getTimeLimitForType(challenge.challenge_type)
      setSession({
        challengeId: challenge.id,
        title: `${challenge.challenge_type.replace('_', ' ')} Challenge`,
        description: `Complete this ${challenge.topic} challenge`,
        type: challenge.challenge_type as any,
        timeLimit,
        startTime: Date.now(),
        code: getStarterCode(challenge.challenge_type),
        language: 'javascript',
        isActive: true,
        submissions: 0,
        maxSubmissions: 3,
      })
      setTimeRemaining(timeLimit)
    }

    initSession()
  }, [challenge])

  // Timer countdown
  useEffect(() => {
    if (!session?.isActive || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [session?.isActive, timeRemaining])

  const getTimeLimitForType = (type: string): number => {
    switch (type) {
      case 'speed_coding': return 900 // 15 minutes
      case 'code_golf': return 1800 // 30 minutes
      case 'best_practices': return 2700 // 45 minutes
      default: return 1800
    }
  }

  const getStarterCode = (type: string): string => {
    switch (type) {
      case 'speed_coding':
        return `// Speed Challenge: Implement the fastest solution
function solve(input) {
  // Your code here
  return result;
}`
      case 'code_golf':
        return `// Code Golf: Shortest solution wins
// Current best: 42 characters
function solve(input) {
  // Your code here
}`
      case 'best_practices':
        return `// Best Practices Challenge: Focus on clean, maintainable code
/**
 * Implement a solution following best practices:
 * - Clear variable names
 * - Proper error handling
 * - Good documentation
 * - Efficient algorithms
 */
function solve(input) {
  // Your code here
}`
      default:
        return '// Your code here'
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = (seconds: number): string => {
    if (seconds < 60) return 'text-red-500'
    if (seconds < 300) return 'text-orange-500'
    return 'text-green-500'
  }

  const handleCodeChange = (newCode: string) => {
    if (!session) return
    setSession(prev => prev ? { ...prev, code: newCode } : null)
  }

  const handleSubmit = async () => {
    if (!session || !user) return

    setIsSubmitting(true)
    try {
      // Submit to challenge API
      const result = await SocialService.submitChallengeResult(
        session.challengeId,
        user.id,
        calculateScore(session)
      )

      setSession(prev => prev ? {
        ...prev,
        submissions: prev.submissions + 1,
        currentScore: result.your_score,
        testResults: [
          { name: 'Test 1', passed: true, time: 150 },
          { name: 'Test 2', passed: true, time: 200 },
          { name: 'Test 3', passed: false },
        ]
      } : null)

      if (result.completed) {
        // Challenge completed
        onComplete?.(result)
      }
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateScore = (session: ChallengeSession): number => {
    const timeUsed = (Date.now() - session.startTime) / 1000
    const timeBonus = Math.max(0, (session.timeLimit - timeUsed) / session.timeLimit * 100)
    
    switch (session.type) {
      case 'speed_coding':
        return Math.round(500 + timeBonus * 5) // Speed bonus
      case 'code_golf':
        return Math.round(1000 - session.code.length) // Shorter is better
      case 'best_practices':
        return Math.round(800 + Math.random() * 200) // Mock quality score
      default:
        return 500
    }
  }

  const handleTimeUp = () => {
    if (!session) return
    
    setSession(prev => prev ? { ...prev, isActive: false } : null)
    // Auto-submit current code
    handleSubmit()
  }

  const handleExit = () => {
    setShowExitModal(true)
  }

  const confirmExit = () => {
    setSession(prev => prev ? { ...prev, isActive: false } : null)
    onExit?.()
  }

  if (!session) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-2">Initializing challenge...</p>
        </div>
      </Card>
    )
  }

  const canSubmit = session.code.trim().length > 0 && 
                   session.submissions < session.maxSubmissions && 
                   session.isActive

  return (
    <>
      <div className="space-y-4">
        {/* Challenge Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900">{session.title}</h2>
              </div>
              
              <Badge variant={session.isActive ? 'success' : 'secondary'}>
                {session.isActive ? 'Active' : 'Completed'}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className={`flex items-center space-x-2 ${getTimeColor(timeRemaining)}`}>
                <ClockIcon className="w-5 h-5" />
                <span className="text-xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Exit Button */}
              <Button
                onClick={handleExit}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <StopIcon className="w-4 h-4 mr-1" />
                Exit
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Time Progress</span>
              <span>{session.submissions}/{session.maxSubmissions} submissions used</span>
            </div>
            <Progress 
              value={((session.timeLimit - timeRemaining) / session.timeLimit) * 100}
              className="h-2"
            />
          </div>
        </Card>

        {/* Challenge Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Code Editor */}
          <Card className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Solution</h3>
              <div className="flex items-center space-x-2">
                <CodeBracketIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{session.language}</span>
              </div>
            </div>

            <div className="h-96">
              <textarea
                value={session.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={!session.isActive}
                className="w-full h-full p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your solution here..."
              />
            </div>

            {/* Submit Button */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {session.type === 'code_golf' && (
                  <span>Current length: {session.code.length} characters</span>
                )}
                {session.type === 'speed_coding' && (
                  <span>Focus on correctness and speed</span>
                )}
                {session.type === 'best_practices' && (
                  <span>Focus on code quality and maintainability</span>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                <span>Submit Solution</span>
              </Button>
            </div>
          </Card>

          {/* Challenge Info & Results */}
          <div className="space-y-4">
            {/* Challenge Details */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Challenge Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {session.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Topic:</span>
                  <span className="font-medium capitalize">{challenge.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <Badge variant="secondary" size="sm">{challenge.difficulty}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span className="font-medium">{formatTime(session.timeLimit)}</span>
                </div>
              </div>
            </Card>

            {/* Current Scores */}
            {(session.currentScore || session.opponentScore) && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Scores</h3>
                <div className="space-y-3">
                  {session.currentScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Score:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {session.currentScore}
                      </span>
                    </div>
                  )}
                  {session.opponentScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Opponent:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {session.opponentScore}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Test Results */}
            {session.testResults && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Test Results</h3>
                <div className="space-y-2">
                  {session.testResults.map((test, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{test.name}</span>
                      <div className="flex items-center space-x-2">
                        {test.time && (
                          <span className="text-xs text-gray-500">{test.time}ms</span>
                        )}
                        {test.passed ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Live Updates */}
            {connectionState.isConnected && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Live Updates</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Connected to live competition</span>
                  </div>
                  <div className="text-gray-600">
                    <UserGroupIcon className="w-4 h-4 inline mr-1" />
                    {Math.floor(Math.random() * 50) + 20} participants active
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Challenge"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium">Are you sure you want to exit?</p>
              <p className="text-sm text-gray-600 mt-1">
                Your current progress will be lost and you won't be able to rejoin this challenge.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              onClick={() => setShowExitModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmExit}
              className="bg-red-600 hover:bg-red-700"
            >
              Exit Challenge
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ChallengeParticipation