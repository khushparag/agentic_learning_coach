/**
 * Shared Solution Card Component
 * Displays a shared solution in the solution sharing interface
 */

import React from 'react'
import { Card } from '../ui/Card'
import type { SharedSolution as ApiSharedSolution } from '../../types/api'

interface SharedSolutionCardProps {
  solution: ApiSharedSolution
  currentUserId?: string
  onLike?: (id: string) => void
  onComment?: (id: string) => void
  onView?: (id: string) => void
  onUpdate?: () => void
}

export const SharedSolutionCard: React.FC<SharedSolutionCardProps> = ({
  solution,
  currentUserId,
  onLike,
  onComment,
  onView,
  onUpdate
}) => {
  // Map API fields to display values
  const displayUsername = `User ${solution.user_id.slice(0, 8)}`
  const displayExerciseTitle = `Exercise ${solution.exercise_id.slice(0, 8)}`
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(solution.id)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{displayExerciseTitle}</h3>
          <p className="text-sm text-gray-500">by {displayUsername}</p>
        </div>
        <div className="flex items-center space-x-2">
          {solution.is_featured && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Featured
            </span>
          )}
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {solution.language}
          </span>
        </div>
      </div>
      
      {solution.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{solution.description}</p>
      )}
      
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(solution.id) }}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>👍</span>
          <span>{solution.likes}</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onComment?.(solution.id) }}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>💬</span>
          <span>{solution.comments_count}</span>
        </button>
        <span className="text-xs">
          {new Date(solution.created_at).toLocaleDateString()}
        </span>
      </div>
    </Card>
  )
}

export default SharedSolutionCard
