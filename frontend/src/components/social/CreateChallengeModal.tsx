/**
 * Create Challenge Modal Component
 * 
 * Modal for creating new peer challenges
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrophyIcon,
  UserIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useCreateChallenge, useSocialWithUtils } from '../../hooks/api/useSocial'
import { useAuthContext } from '../../contexts/AuthContext'
import { Modal, Button, Input, Select, Textarea } from '../ui'
import type { CreateChallengeRequest } from '../../types/api'

interface CreateChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthContext()
  const [formData, setFormData] = useState<Partial<CreateChallengeRequest>>({
    challenger_id: user?.id || '',
    challenged_id: '',
    challenge_type: 'speed_coding',
    topic: '',
    difficulty: 'intermediate',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createChallengeMutation = useCreateChallenge()
  const socialUtils = useSocialWithUtils(user?.id || null)

  // Challenge type options
  const challengeTypes = [
    {
      value: 'speed_coding',
      label: 'Speed Coding',
      description: 'Complete the exercise as fast as possible',
      icon: '⚡',
    },
    {
      value: 'code_golf',
      label: 'Code Golf',
      description: 'Write the shortest solution possible',
      icon: '⛳',
    },
    {
      value: 'best_practices',
      label: 'Best Practices',
      description: 'Focus on code quality and best practices',
      icon: '✨',
    },
    {
      value: 'streak_race',
      label: 'Streak Race',
      description: 'Maintain the longest learning streak',
      icon: '🔥',
    },
  ]

  // Difficulty options
  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'orange' },
    { value: 'expert', label: 'Expert', color: 'red' },
  ]

  // Popular topics
  const popularTopics = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'Data Structures', 'Algorithms', 'System Design', 'Database',
    'API Design', 'Testing', 'Performance', 'Security'
  ]

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.challenged_id?.trim()) {
      newErrors.challenged_id = 'Please enter the user ID to challenge'
    }

    if (formData.challenged_id === formData.challenger_id) {
      newErrors.challenged_id = 'You cannot challenge yourself'
    }

    if (!formData.topic?.trim()) {
      newErrors.topic = 'Please enter a topic for the challenge'
    }

    if (!formData.challenge_type) {
      newErrors.challenge_type = 'Please select a challenge type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await createChallengeMutation.mutateAsync(formData as CreateChallengeRequest)
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error('Failed to create challenge:', error)
    }
  }

  // Handle closing modal
  const handleClose = () => {
    setFormData({
      challenger_id: user?.id || '',
      challenged_id: '',
      challenge_type: 'speed_coding',
      topic: '',
      difficulty: 'intermediate',
    })
    setErrors({})
    onClose()
  }

  // Update form data
  const updateFormData = (field: keyof CreateChallengeRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedChallengeType = challengeTypes.find(t => t.value === formData.challenge_type)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Peer Challenge"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Challenge Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Challenge Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {challengeTypes.map((type) => (
              <motion.button
                key={type.value}
                type="button"
                onClick={() => updateFormData('challenge_type', type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.challenge_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {errors.challenge_type && (
            <p className="mt-1 text-sm text-red-600">{errors.challenge_type}</p>
          )}
        </div>

        {/* Selected Challenge Type Info */}
        {selectedChallengeType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">{selectedChallengeType.icon}</span>
              <h4 className="font-medium text-blue-900">{selectedChallengeType.label}</h4>
            </div>
            <p className="text-sm text-blue-700">{selectedChallengeType.description}</p>
          </motion.div>
        )}

        {/* Opponent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenge Opponent
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              value={formData.challenged_id}
              onChange={(e) => updateFormData('challenged_id', e.target.value)}
              placeholder="Enter user ID or username"
              className="pl-10"
              error={errors.challenged_id}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter the user ID of the person you want to challenge
          </p>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic
          </label>
          <Input
            type="text"
            value={formData.topic}
            onChange={(e) => updateFormData('topic', e.target.value)}
            placeholder="e.g., JavaScript Arrays, React Hooks, Algorithms"
            error={errors.topic}
          />
          
          {/* Popular Topics */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Popular topics:</p>
            <div className="flex flex-wrap gap-1">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => updateFormData('topic', topic)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData('difficulty', option.value)}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.difficulty === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  option.color === 'green' ? 'bg-green-500' :
                  option.color === 'yellow' ? 'bg-yellow-500' :
                  option.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrophyIcon className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Challenge Preview</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Type:</strong> {selectedChallengeType?.label || 'Not selected'}</p>
            <p><strong>Topic:</strong> {formData.topic || 'Not specified'}</p>
            <p><strong>Difficulty:</strong> {formData.difficulty}</p>
            <p><strong>Expires:</strong> 7 days from creation</p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createChallengeMutation.isPending}
            className="flex items-center space-x-2"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>
              {createChallengeMutation.isPending ? 'Creating...' : 'Create Challenge'}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateChallengeModal