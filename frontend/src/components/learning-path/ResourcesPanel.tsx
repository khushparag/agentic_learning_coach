import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  LinkIcon,
  StarIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  Squares2X2Icon,
  Bars3BottomLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/solid'
import { LearningResource, LearningModule, LearningTask } from '../../types/learning-path'
import { learningPathService } from '../../services/learningPathService'

interface ResourcesPanelProps {
  module?: LearningModule
  task?: LearningTask
  resources: LearningResource[]
  onResourceSelect?: (resource: LearningResource) => void
  onResourceUpdate?: (resource: LearningResource) => void
  className?: string
}

type ResourceFilter = 'all' | 'documentation' | 'tutorial' | 'video' | 'article' | 'example' | 'reference'
type ResourceSort = 'title' | 'type' | 'difficulty' | 'time' | 'rating' | 'created' | 'verified'
type ViewMode = 'list' | 'grid' | 'compact'

interface ResourceFilters {
  type: ResourceFilter
  difficulty: string[]
  verified: boolean | null
  timeRange: [number, number]
  ratingRange: [number, number]
  tags: string[]
}

interface ResourceStats {
  total: number
  byType: Record<string, number>
  byDifficulty: Record<string, number>
  verified: number
  averageRating: number
  totalTime: number
}

const ResourcesPanel: React.FC<ResourcesPanelProps> = ({
  module,
  task,
  resources,
  onResourceSelect,
  onResourceUpdate,
  className = ''
}) => {
  const [filters, setFilters] = useState<ResourceFilters>({
    type: 'all',
    difficulty: [],
    verified: null,
    timeRange: [0, 120],
    ratingRange: [0, 5],
    tags: []
  })
  const [sortBy, setSortBy] = useState<ResourceSort>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favoriteResources, setFavoriteResources] = useState<Set<string>>(new Set())
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())

  // Calculate resource statistics
  const resourceStats: ResourceStats = useMemo(() => {
    const stats: ResourceStats = {
      total: resources.length,
      byType: {},
      byDifficulty: {},
      verified: 0,
      averageRating: 0,
      totalTime: 0
    }

    let totalRating = 0
    let ratedResources = 0

    resources.forEach(resource => {
      // Type stats
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1
      
      // Difficulty stats
      stats.byDifficulty[resource.difficulty] = (stats.byDifficulty[resource.difficulty] || 0) + 1
      
      // Verified count
      if (resource.verified) {
        stats.verified++
      }
      
      // Rating stats
      if (resource.rating) {
        totalRating += resource.rating
        ratedResources++
      }
      
      // Total time
      stats.totalTime += resource.estimatedTimeMinutes
    })

    if (ratedResources > 0) {
      stats.averageRating = totalRating / ratedResources
    }

    return stats
  }, [resources])

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(resource => resource.type === filters.type)
    }

    // Apply difficulty filter
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(resource => filters.difficulty.includes(resource.difficulty))
    }

    // Apply verified filter
    if (filters.verified !== null) {
      filtered = filtered.filter(resource => resource.verified === filters.verified)
    }

    // Apply time range filter
    filtered = filtered.filter(resource => 
      resource.estimatedTimeMinutes >= filters.timeRange[0] && 
      resource.estimatedTimeMinutes <= filters.timeRange[1]
    )

    // Apply rating range filter
    filtered = filtered.filter(resource => {
      if (!resource.rating) return filters.ratingRange[0] === 0
      return resource.rating >= filters.ratingRange[0] && resource.rating <= filters.ratingRange[1]
    })

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.type.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Sort resources
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          break
        case 'time':
          comparison = a.estimatedTimeMinutes - b.estimatedTimeMinutes
          break
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0)
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'verified':
          comparison = (b.verified ? 1 : 0) - (a.verified ? 1 : 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [resources, filters, searchQuery, sortBy, sortOrder])

  const toggleFavorite = (resourceId: string) => {
    setFavoriteResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const toggleBookmark = (resourceId: string) => {
    setBookmarkedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const refreshResources = async () => {
    if (!module && !task) return
    
    setLoading(true)
    try {
      if (module) {
        await learningPathService.getModuleResources(module.id)
      }
      // Trigger parent component refresh if needed
    } catch (error) {
      console.error('Failed to refresh resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setFilters({
      type: 'all',
      difficulty: [],
      verified: null,
      timeRange: [0, 120],
      ratingRange: [0, 5],
      tags: []
    })
    setSearchQuery('')
    setSortBy('title')
    setSortOrder('asc')
  }

  const getResourceIcon = (type: LearningResource['type']) => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'documentation':
        return <DocumentTextIcon className={`${iconClass} text-blue-500`} />
      case 'tutorial':
        return <BookOpenIcon className={`${iconClass} text-green-500`} />
      case 'video':
        return <VideoCameraIcon className={`${iconClass} text-red-500`} />
      case 'article':
        return <DocumentTextIcon className={`${iconClass} text-purple-500`} />
      case 'example':
        return <CodeBracketIcon className={`${iconClass} text-orange-500`} />
      case 'reference':
        return <LinkIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100'
      case 'advanced':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const renderResourceCard = (resource: LearningResource, index: number) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getResourceIcon(resource.type)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
              {resource.difficulty}
            </span>
            {resource.verified && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                ✓ Verified
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleFavorite(resource.id)}
              className={`p-1 rounded transition-colors ${
                favoriteResources.has(resource.id) 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HeartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleBookmark(resource.id)}
              className={`p-1 rounded transition-colors ${
                bookmarkedResources.has(resource.id) 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatTime(resource.estimatedTimeMinutes)}
          </span>
          {resource.rating && (
            <span className="flex items-center">
              <StarIcon className="w-3 h-3 mr-1 text-yellow-400" />
              {resource.rating.toFixed(1)}
            </span>
          )}
          <span className="capitalize">{resource.type}</span>
        </div>

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => onResourceSelect?.(resource)}
            className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <EyeIcon className="w-3 h-3 mr-1" />
            View Details
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open(resource.url, '_blank')}
              className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
              Open
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderResourceListItem = (resource: LearningResource, index: number) => (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getResourceIcon(resource.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-base font-medium text-gray-900 pr-4">
                {resource.title}
              </h4>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {resource.verified && (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" title="Verified resource" />
                )}
                {resource.rating && (
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {resource.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                  {resource.difficulty}
                </span>
                <span className="text-gray-500 capitalize">{resource.type}</span>
                <span className="flex items-center text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatTime(resource.estimatedTimeMinutes)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFavorite(resource.id)}
                  className={`p-1 rounded transition-colors ${
                    favoriteResources.has(resource.id) 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <HeartIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleBookmark(resource.id)}
                  className={`p-1 rounded transition-colors ${
                    bookmarkedResources.has(resource.id) 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onResourceSelect?.(resource)}
                  className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <EyeIcon className="w-3 h-3 mr-1" />
                  Details
                </button>
                <button
                  onClick={() => window.open(resource.url, '_blank')}
                  className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                  Open
                </button>
              </div>
            </div>

            {resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {resource.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Learning Resources
              {module && <span className="text-gray-500"> - {module.title}</span>}
              {task && <span className="text-gray-500"> - {task.title}</span>}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedResources.length} of {resources.length} resources
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="List view"
              >
                <Bars3BottomLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Grid view"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            {/* Refresh button */}
            <button
              onClick={refreshResources}
              disabled={loading}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh resources"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resource statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{resourceStats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{resourceStats.verified}</div>
            <div className="text-xs text-gray-600">Verified</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{resourceStats.averageRating.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Avg Rating</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{formatTime(resourceStats.totalTime)}</div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{Object.keys(resourceStats.byType).length}</div>
            <div className="text-xs text-gray-600">Types</div>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Type filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as ResourceFilter }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="documentation">Documentation</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="example">Example</option>
                    <option value="reference">Reference</option>
                  </select>
                </div>

                {/* Verified filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                  <select
                    value={filters.verified === null ? 'all' : filters.verified.toString()}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      verified: e.target.value === 'all' ? null : e.target.value === 'true'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Resources</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>

                {/* Sort by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as ResourceSort)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="title">Title</option>
                    <option value="type">Type</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="time">Time</option>
                    <option value="rating">Rating</option>
                    <option value="verified">Verified</option>
                    <option value="created">Created</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-end space-x-2">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredAndSortedResources.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredAndSortedResources.map((resource, index) => 
                renderResourceListItem(resource, index)
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedResources.map((resource, index) => 
                renderResourceCard(resource, index)
              )}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-sm">Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResourcesPanel
