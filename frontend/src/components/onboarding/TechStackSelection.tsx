import { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, CheckIcon, StarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { TechStackOption } from '../../types/onboarding'
import { onboardingService } from '../../services/onboardingService'

interface TechStackSelectionProps {
  selectedTechStack: string[]
  onTechStackChange: (techStack: string[]) => void
  onValidationChange: (isValid: boolean) => void
}

export default function TechStackSelection({ 
  selectedTechStack, 
  onTechStackChange, 
  onValidationChange 
}: TechStackSelectionProps) {
  const [techOptions, setTechOptions] = useState<TechStackOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'difficulty'>('popularity')

  useEffect(() => {
    loadTechOptions()
  }, [])

  useEffect(() => {
    onValidationChange(selectedTechStack.length > 0)
  }, [selectedTechStack, onValidationChange])

  const loadTechOptions = async () => {
    try {
      const options = await onboardingService.getTechStackOptions()
      setTechOptions(options)
    } catch (error) {
      console.error('Failed to load tech stack options:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedOptions = useMemo(() => {
    let filtered = techOptions.filter(tech => {
      const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tech.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || tech.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === 'all' || tech.difficulty === selectedDifficulty
      
      return matchesSearch && matchesCategory && matchesDifficulty
    })

    // Sort options
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity
        case 'name':
          return a.name.localeCompare(b.name)
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        default:
          return 0
      }
    })

    return filtered
  }, [techOptions, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(techOptions.map(t => t.category))]
    return cats
  }, [techOptions])

  const toggleTech = (techName: string) => {
    const newTechStack = selectedTechStack.includes(techName)
      ? selectedTechStack.filter(t => t !== techName)
      : [...selectedTechStack, techName]
    
    onTechStackChange(newTechStack)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPopularityStars = (popularity: number) => {
    const stars = Math.round(popularity / 20) // Convert to 1-5 scale
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const hasUnmetPrerequisites = (tech: TechStackOption) => {
    if (!tech.prerequisites) return false
    return tech.prerequisites.some(prereq => 
      !selectedTechStack.some(selected => 
        selected.toLowerCase().includes(prereq.toLowerCase()) ||
        prereq.toLowerCase().includes(selected.toLowerCase())
      )
    )
  }

  const getRecommendedTechs = () => {
    // Simple recommendation logic based on selected technologies
    const recommendations: string[] = []
    
    if (selectedTechStack.includes('JavaScript') && !selectedTechStack.includes('TypeScript')) {
      recommendations.push('TypeScript')
    }
    
    if (selectedTechStack.includes('React') && !selectedTechStack.includes('Node.js')) {
      recommendations.push('Node.js')
    }
    
    if (selectedTechStack.some(tech => ['React', 'Vue.js', 'Angular'].includes(tech)) && 
        !selectedTechStack.includes('JavaScript')) {
      recommendations.push('JavaScript')
    }

    return recommendations.filter(rec => 
      techOptions.some(tech => tech.name === rec) &&
      !selectedTechStack.includes(rec)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const recommendedTechs = getRecommendedTechs()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Which technologies interest you?</h2>
        <p className="text-gray-600 mb-4">
          Select the technologies you want to focus on. We'll create a learning path that covers these areas.
        </p>
        
        {selectedTechStack.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Selected {selectedTechStack.length} technolog{selectedTechStack.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search technologies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-white text-gray-900">
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-white text-gray-900">All Levels</option>
                <option value="beginner" className="bg-white text-gray-900">Beginner</option>
                <option value="intermediate" className="bg-white text-gray-900">Intermediate</option>
                <option value="advanced" className="bg-white text-gray-900">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popularity' | 'name' | 'difficulty')}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popularity" className="bg-white text-gray-900">Popularity</option>
                <option value="name" className="bg-white text-gray-900">Name</option>
                <option value="difficulty" className="bg-white text-gray-900">Difficulty</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendedTechs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 Recommended for you:</h4>
          <div className="flex flex-wrap gap-2">
            {recommendedTechs.map(tech => (
              <button
                key={tech}
                onClick={() => toggleTech(tech)}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition-colors"
              >
                + {tech}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Technology Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedOptions.map((tech) => {
          const isSelected = selectedTechStack.includes(tech.name)
          const hasUnmetPrereqs = hasUnmetPrerequisites(tech)
          
          return (
            <div
              key={tech.id}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : hasUnmetPrereqs
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => toggleTech(tech.name)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}

              {/* Warning for unmet prerequisites */}
              {hasUnmetPrereqs && !isSelected && (
                <div className="absolute top-2 right-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                </div>
              )}

              <div className="pr-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{tech.name}</h3>
                  <div className="flex items-center">
                    {getPopularityStars(tech.popularity)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{tech.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(tech.difficulty)}`}>
                    {tech.difficulty}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {tech.category}
                  </span>
                </div>

                {/* Prerequisites warning */}
                {hasUnmetPrereqs && (
                  <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-700">
                    <strong>Prerequisites:</strong> {tech.prerequisites?.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAndSortedOptions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No technologies found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedDifficulty('all')
            }}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Selected Technologies Summary */}
      {selectedTechStack.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Selected Technologies:</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTechStack.map((tech, index) => {
              const techOption = techOptions.find(t => t.name === tech)
              return (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tech}
                  {techOption && (
                    <span className={`ml-2 px-1 text-xs rounded ${getDifficultyColor(techOption.difficulty)}`}>
                      {techOption.difficulty.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTech(tech)
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>
              <strong>Categories covered:</strong> {
                [...new Set(
                  selectedTechStack
                    .map(tech => techOptions.find(t => t.name === tech)?.category)
                    .filter(Boolean)
                )].join(', ')
              }
            </p>
            <p className="mt-1">
              <strong>Difficulty range:</strong> {
                [...new Set(
                  selectedTechStack
                    .map(tech => techOptions.find(t => t.name === tech)?.difficulty)
                    .filter(Boolean)
                )].join(', ')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}