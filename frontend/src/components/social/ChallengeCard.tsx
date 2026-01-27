/**
 * Challenge Card Component
 * 
 * Displays individual peer challenge with actions
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  TrophyIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { useAcceptChallenge, useSubmitChallengeResult, useSocialWithUtils } from '../../hooks/api/useSocial'
import { Card, Button, Badge, Modal, Input } from '../ui'
import type { PeerChallenge } from '../../types/apiTypes'

interface ChallengeCardProps {
  challenge: PeerChallenge
  currentUserId: string
  onUpdate?: () => void
  className?: string
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentUserId,
  onUpdate,
  className = '',
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [score, setScore] = useState('')

  const acceptChallengeMutation = useAcceptChallenge()
  const submitResultMutation = useSubmitChallengeResult()
  const socialUtils = useSocialWithUtils(currentUserId)

  // Determine user's role in the challenge
  const isChallenger = challenge.challenger_id === currentUserId
  const isChallenged = challenge.challenged_id === currentUserId
  const isParticipant = isChallenger || isChallenged

  // Get challenge type info
  const typeInfo = socialUtils.getChallengeTypeInfo(challenge.challenge_type)
  const statusColor = socialUtils.getChallengeStatusColor(challenge.status)
  const timeInfo = socialUtils.formatChallengeDuration(challenge.created_at, challenge.expires_at)

  // Handle accepting challenge
  const handleAcceptChallenge = async () => {
    try {
      await acceptChallengeMutation.mutateAsync({
        challengeId: challenge.id,
        userId: currentUserId,
      })
      onUpdate?.()
    } catch (error) {
      console.error('Failed to accept challenge:', error)
    }
  }

  // Handle submitting result
  const handleSubmitResult = async () => {
    if (!score || isNaN(Number(score))) return

    try {
      await submitResultMutation.mutateAsync({
        challengeId: challenge.id,
        userId: currentUserId,
        score: Number(score),
      })
      setShowSubmitModal(false)
      setScore('')
      onUpdate?.()
    } catch (error) {
      console.error('Failed to submit result:', error)
    }
  }

  // Get user's score
  const userScore = isChallenger ? challenge.challenger_score : challenge.challenged_score
  const opponentScore = isChallenger ? challenge.challenged_score : challenge.challenger_score

  return (
    <>
      <Card className={`p-6 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">{typeInfo.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {typeInfo.name}
              </h3>
              <p className="text-sm text-gray-600">{typeInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={statusColor === 'green' ? 'success' : 
                     statusColor === 'blue' ? 'primary' : 
                     statusColor === 'yellow' ? 'warning' : 'secondary'}
            >
              {challenge.status}
            </Badge>
            {timeInfo.urgency === 'high' && !timeInfo.isExpired && (
              <Badge variant="error">Urgent</Badge>
            )}
          </div>
        </div>

        {/* Challenge Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Topic</p>
            <p className="text-sm font-medium text-gray-900">{challenge.topic}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Difficulty</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{challenge.difficulty}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">XP Reward</p>
            <p className="text-sm font-medium text-gray-900">{challenge.xp_reward} XP</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Time Left</p>
            <p className={`text-sm font-medium ${
              timeInfo.isExpired ? 'text-red-600' : 
              timeInfo.urgency === 'high' ? 'text-orange-600' : 'text-gray-900'
            }`}>
              {timeInfo.timeLeft}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Challenger: {isChallenger ? 'You' : `User ${challenge.challenger_id.slice(0, 8)}`}
              </span>
              {challenge.challenger_score !== null && (
                <Badge variant="secondary">{challenge.challenger_score}</Badge>
              )}
            </div>
            <div className="text-gray-400">vs</div>
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Challenged: {isChallenged ? 'You' : `User ${challenge.challenged_id.slice(0, 8)}`}
              </span>
              {challenge.challenged_score !== null && (
                <Badge variant="secondary">{challenge.challenged_score}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Winner Display */}
        {challenge.status === 'completed' && challenge.winner_id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <TrophyIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Winner: {challenge.winner_id === currentUserId ? 'You!' : 
                        challenge.winner_id === challenge.challenger_id ? 'Challenger' : 'Challenged'}
              </span>
              {challenge.winner_id === currentUserId && (
                <Badge variant="success">+{challenge.xp_reward} XP</Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              Created {new Date(challenge.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Accept Challenge */}
            {challenge.status === 'pending' && isChallenged && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptChallenge}
                  disabled={acceptChallengeMutation.isPending}
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptChallenge}
                  disabled={acceptChallengeMutation.isPending}
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </>
            )}

            {/* Submit Result */}
            {challenge.status === 'active' && isParticipant && userScore === null && (
              <Button
                size="sm"
                onClick={() => setShowSubmitModal(true)}
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                Submit Result
              </Button>
            )}

            {/* Waiting for Opponent */}
            {challenge.status === 'active' && isParticipant && userScore !== null && opponentScore === null && (
              <Badge variant="secondary">
                Waiting for opponent
              </Badge>
            )}

            {/* View Exercise */}
            {challenge.exercise_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to exercise
                  window.open(`/exercises/${challenge.exercise_id}`, '_blank')
                }}
              >
                View Exercise
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Submit Result Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Challenge Result"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your score for the <strong>{typeInfo.name}</strong> challenge.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {challenge.challenge_type === 'code_golf' 
                ? 'Lower score is better (number of characters)'
                : 'Higher score is better'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score
            </label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter your score"
              min="0"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResult}
              disabled={!score || isNaN(Number(score)) || submitResultMutation.isPending}
            >
              {submitResultMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ChallengeCard
