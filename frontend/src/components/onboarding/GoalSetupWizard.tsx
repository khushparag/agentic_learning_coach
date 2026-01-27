import { useState, useEffect } from 'react'
import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { GoalOption } from '../../types/onboarding'
import { onboardingService } from '../../services/onboardingService'

interface GoalSetupWizardProps {
  selectedGoals: string[]
  onGoalsChange: (goals: string[]) => void
  onValidationChange: (isValid: boolean) => void
}

export default function GoalSetupWizard({ selectedGoals, onGoalsChange, onValidationChange }: GoalSetupWizardProps) {
  const [goalOptions, setGoalOptions] = useState<GoalOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    loadGoalOptions()
  }, [])

  useEffect(() => {
    onValidationChange(selectedGoals.length > 0)
  }, [selectedGoals, onValidationChange])

  const loadGoalOptions = async () => {
    try {
      const options = await onboardingService.getGoalOptions()
      setGoalOptions(options)
    } catch (error) {
      console.error('Failed to load goal options:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGoal = (goalId: string) => {
    const goalOption = goalOptions.find(g => g.id === goalId)
    if (!goalOption) return

    const goalTitle = goalOption.title
    const newGoals = selectedGoals.includes(goalTitle)
      ? selectedGoals.filter(g => g !== goalTitle)
      : [...selectedGoals, goalTitle]
    
    onGoalsChange(newGoals)
  }

  const isGoalSelected = (goalId: string) => {
    const goalOption = goalOptions.find(g => g.id === goalId)
    return goalOption ? selectedGoals.includes(goalOption.title) : false
  }

  const filteredGoals = goalOptions.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(goalOptions.map(g => g.category))]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">What do you want to learn?</h2>
        <p className="text-gray-600 mb-4">
          Select your learning goals. You can choose multiple goals to create a comprehensive learning path.
        </p>
        
        {selectedGoals.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Selected {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category} className="bg-white text-gray-900">
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Goal Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map((goal) => {
          const isSelected = isGoalSelected(goal.id)
          
          return (
            <div
              key={goal.id}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => toggleGoal(goal.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}

              <div className="pr-8">
                <h3 className="font-medium text-gray-900 mb-2">{goal.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(goal.difficulty)}`}>
                      {goal.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      ~{goal.estimatedHours}h
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(showDetails === goal.id ? null : goal.id)
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <InformationCircleIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Prerequisites */}
                {goal.prerequisites && goal.prerequisites.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Prerequisites: {goal.prerequisites.join(', ')}
                    </p>
                  </div>
                )}

                {/* Expanded details */}
                {showDetails === goal.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>
                        <span className="font-medium">Category:</span> {goal.category}
                      </div>
                      <div>
                        <span className="font-medium">Estimated time:</span> {goal.estimatedHours} hours
                      </div>
                      <div>
                        <span className="font-medium">Difficulty:</span> {goal.difficulty}
                      </div>
                      {goal.prerequisites && (
                        <div>
                          <span className="font-medium">Prerequisites:</span>
                          <ul className="list-disc list-inside ml-2">
                            {goal.prerequisites.map((prereq, index) => (
                              <li key={index}>{prereq}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No goals found matching your search criteria.</p>
        </div>
      )}

      {/* Summary */}
      {selectedGoals.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Goals:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedGoals.map((goal, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {goal}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Total estimated time: {goalOptions
              .filter(g => selectedGoals.includes(g.title))
              .reduce((sum, g) => sum + g.estimatedHours, 0)} hours
          </p>
        </div>
      )}
    </div>
  )
}
