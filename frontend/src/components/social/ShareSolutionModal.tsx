/**
 * Share Solution Modal Component
 * Modal for sharing a solution with the community
 */

import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Input } from '../ui/Input'

export interface ShareSolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onShare?: (data: { description: string; tags: string[] }) => Promise<void>
  onSuccess?: () => void
  exerciseTitle?: string
  language?: string
}

export const ShareSolutionModal: React.FC<ShareSolutionModalProps> = ({
  isOpen,
  onClose,
  onShare,
  onSuccess,
  exerciseTitle = 'Your Solution',
  language = 'JavaScript'
}) => {
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (onShare) {
        await onShare({
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to share solution:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Solution">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Share your solution for <strong>{exerciseTitle}</strong> ({language})
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain your approach or any interesting techniques you used..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., recursion, optimization, clean-code"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sharing...' : 'Share Solution'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ShareSolutionModal
