/**
 * Competition Interface Component
 * Manages active competitions, participation, and real-time status updates
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrophyIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
  StarIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Card, Button, Badge, Modal, LoadingSpinner, Progress } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { SocialService } from '../../services/socialService'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { PeerChallenge } from '../../types/apiTypes'

interface Competition {
  id: string
  title: string
  description: string
  type: 'speed_coding' | 'code_golf' | 'best_practices' | 'streak_race'
  status: 'upcoming' | 'active' | 'completed'
  startTime: string
  endTime: string
  participants: number
  maxParticipants?: number
  prize: string
  difficulty: string
  topic: string
  userParticipating: boolean
  userRank?: number
  leaderboard: Array<{
    rank: number
    userId: string
    username: string
    score: number
    completedAt?: string
  }>
}

interface CompetitionInterfaceProps {
  className?: string
  showUpcoming?: boolean
  showCompleted?: boolean
  maxCompetitions?: number
}

export const CompetitionInterface: React.FC<CompetitionInterfaceProps> = ({
  className = '',
  showUpcoming = true,
  showCompleted = true,
  maxCompetitions = 10,
}) => {
  const { user } = useAuth()
  const { connectionState } = useWebSocket()
  
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [participationLoading, setParticipationLoading] = useState<string | null>(null)

  // Mock competition data - in real app, this would come from API
  const mockCompetitions: Competition[] = [
    {
      id: '1',
      title: 'Weekly Speed Challenge',
      description: 'Complete algorithm challenges as fast as possible',
      type: 'speed_coding',
      status: 'active',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      participants: 127,
      maxParticipants: 200,
      prize: '500 XP + Speed Demon Badge',
      difficulty: 'intermediate',
      topic: 'algorithms',
      userParticipating: true,
      userRank: 15,
      leaderboard: [
        { rank: 1, userId: 'user1', username: 'CodeNinja', score: 950, completedAt: '2024-01-15T10:30:00Z' },
        { rank: 2, userId: 'user2', username: 'AlgoMaster', score: 920, completedAt: '2024-01-15T10:35:00Z' },
        { rank: 3, userId: 'user3', username: 'SpeedCoder', score: 890, completedAt: '2024-01-15T10:40:00Z' },
      ]
    },
    {
      id: '2',
      title: 'Code Golf Championship',
      description: 'Write the shortest possible solutions',
      type: 'code_golf',
      status: 'upcoming',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      participants: 45,
      maxParticipants: 100,
      prize: '750 XP + Golf Master Badge',
      difficulty: 'advanced',
      topic: 'optimization',
      userParticipating: false,
      leaderboard: []
    },
    {
      id: '3',
      title: 'Best Practices Battle',
      description: 'Focus on code quality and maintainability',
      type: 'best_practices',
      status: 'completed',
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      participants: 89,
      prize: '600 XP + Clean Code Badge',
      difficulty: 'intermediate',
      topic: 'clean_code',
      userParticipating: true,
      userRank: 8,
      leaderboard: [
        { rank: 1, userId: 'user4', username: 'CleanCoder', score: 98, completedAt: '2024-01-14T15:45:00Z' },
        { rank: 2, userId: 'user5', username: 'QualityFirst', score: 95, completedAt: '2024-01-14T16:20:00Z' },
        { rank: 3, userId: 'user6', username: 'BestPractices', score: 92, completedAt: '2024-01-14T14:30:00Z' },
      ]
    }
  ]

  useEffect(() => {
    // Simulate loading competitions
    const loadCompetitions = async () => {
      try {
        setIsLoading(true)
        // In real app: const data = await CompetitionService.getCompetitions()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        setCompetitions(mockCompetitions)
        setActiveCompetitions(mockCompetitions.filter(c => c.status === 'active'))
      } catch (err) {
        setError('Failed to load competitions')
      } finally {
        setIsLoading(false)
      }
    }

    loadCompetitions()
  }, [])

  const getCompetitionTypeInfo = (type: string) => {
    return SocialService.getChallengeTypeInfo(type)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'upcoming': return 'warning'
      case 'completed': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const handleJoinCompetition = async (competitionId: string) => {
    if (!user) return

    setParticipationLoading(competitionId)
    try {
      // In real app: await CompetitionService.joinCompetition(competitionId, user.id)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setCompetitions(prev => prev.map(comp => 
        comp.id === competitionId 
          ? { ...comp, userParticipating: true, participants: comp.participants + 1 }
          : comp
      ))
    } catch (err) {
      console.error('Failed to join competition:', err)
    } finally {
      setParticipationLoading(null)
    }
  }

  const handleViewDetails = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowDetailsModal(true)
  }

  const filteredCompetitions = competitions.filter(comp => {
    if (comp.status === 'upcoming' && !showUpcoming) return false
    if (comp.status === 'completed' && !showCompleted) return false
    return true
  }).slice(0, maxCompetitions)

  if (isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-2">Loading competitions...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <TrophyIcon className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load competitions</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrophyIcon className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Competitions</h2>
              {connectionState.isConnected && (
                <Badge variant="success" size="sm">Live</Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {activeCompetitions.length} active • {competitions.length} total
            </div>
          </div>
        </div>

        {/* Active Competitions Highlight */}
        {activeCompetitions.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <PlayIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {activeCompetitions.length} Active Competition{activeCompetitions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCompetitions.map(comp => (
                <Badge key={comp.id} variant="success" size="sm">
                  {comp.title} • {formatTimeRemaining(comp.endTime)} left
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Competitions List */}
        <div className="divide-y divide-gray-100">
          {filteredCompetitions.length === 0 ? (
            <div className="p-8 text-center">
              <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">No competitions available</p>
              <p className="text-sm text-gray-500">Check back later for new challenges!</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredCompetitions.map((competition, index) => {
                const typeInfo = getCompetitionTypeInfo(competition.type)
                const isParticipating = competition.userParticipating
                const canJoin = competition.status === 'upcoming' || 
                              (competition.status === 'active' && !isParticipating)

                return (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Competition Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {competition.title}
                            </h3>
                            <p className="text-sm text-gray-600">{competition.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <UserGroupIcon className="w-4 h-4" />
                            <span>{competition.participants} participants</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {competition.status === 'active' 
                                ? `${formatTimeRemaining(competition.endTime)} left`
                                : competition.status === 'upcoming'
                                ? `Starts ${formatTimeRemaining(competition.startTime)}`
                                : 'Completed'
                              }
                            </span>
                          </div>

                          <Badge variant={getStatusColor(competition.status)} size="sm">
                            {competition.status}
                          </Badge>
                        </div>

                        {/* Progress Bar for Active Competitions */}
                        {competition.status === 'active' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Competition Progress</span>
                              <span>{formatTimeRemaining(competition.endTime)} remaining</span>
                            </div>
                            <Progress 
                              value={75} // Mock progress
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* User Status */}
                        {isParticipating && (
                          <div className="flex items-center space-x-4 text-sm">
                            <Badge variant="primary" size="sm">Participating</Badge>
                            {competition.userRank && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <ChartBarIcon className="w-4 h-4" />
                                <span>Rank #{competition.userRank}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prize Info */}
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Prize: </span>
                          <span className="font-medium text-yellow-600">{competition.prize}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          onClick={() => handleViewDetails(competition)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>View</span>
                        </Button>

                        {canJoin && (
                          <Button
                            onClick={() => handleJoinCompetition(competition.id)}
                            disabled={participationLoading === competition.id}
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            {participationLoading === competition.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <ArrowRightIcon className="w-4 h-4" />
                                <span>Join</span>
                              </>
                            )}
                          </Button>
                        )}

                        {competition.status === 'active' && isParticipating && (
                          <Button
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <PlayIcon className="w-4 h-4" />
                            <span>Continue</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Competition Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedCompetition?.title || ''}
        size="lg"
      >
        {selectedCompetition && (
          <div className="space-y-6">
            {/* Competition Overview */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
              <p className="text-gray-600">{selectedCompetition.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-sm text-gray-500">Type:</span>
                  <p className="font-medium">{getCompetitionTypeInfo(selectedCompetition.type).name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Difficulty:</span>
                  <p className="font-medium capitalize">{selectedCompetition.difficulty}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Topic:</span>
                  <p className="font-medium capitalize">{selectedCompetition.topic}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Prize:</span>
                  <p className="font-medium text-yellow-600">{selectedCompetition.prize}</p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            {selectedCompetition.leaderboard.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Leaderboard</h4>
                <div className="space-y-2">
                  {selectedCompetition.leaderboard.map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">#{entry.rank}</span>
                        </div>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{entry.score} pts</p>
                        {entry.completedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(entry.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Rules</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• {getCompetitionTypeInfo(selectedCompetition.type).description}</p>
                <p>• Fair play is expected - no cheating or collaboration</p>
                <p>• Submissions are final once submitted</p>
                <p>• Winners are determined by the competition scoring system</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default CompetitionInterface
