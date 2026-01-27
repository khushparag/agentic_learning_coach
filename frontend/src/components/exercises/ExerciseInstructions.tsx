import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpenIcon, 
  LightBulbIcon, 
  CodeBracketIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import type { Exercise, Hint } from '../../types/exercises'

interface ExerciseInstructionsProps {
  exercise: Exercise
  hints: Hint[]
  onRequestHint: (level: number) => void
  className?: string
}

export const ExerciseInstructions: React.FC<ExerciseInstructionsProps> = ({
  exercise,
  hints,
  onRequestHint,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'instructions' | 'examples' | 'hints'>('instructions')
  const [expandedHint, setExpandedHint] = useState<number | null>(null)

  const tabs = [
    { id: 'instructions' as const, label: 'Instructions', icon: BookOpenIcon },
    { id: 'examples' as const, label: 'Examples', icon: CodeBracketIcon },
    { id: 'hints' as const, label: 'Hints', icon: LightBulbIcon, badge: hints.length }
  ]

  const getDifficultyColor = (level: number): string => {
    if (level <= 3) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
    if (level <= 6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
  }

  const getDifficultyLabel = (level: number): string => {
    if (level <= 3) return 'Easy'
    if (level <= 6) return 'Medium'
    return 'Hard'
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {exercise.title}
          </h1>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty_level)}`}>
              {getDifficultyLabel(exercise.difficulty_level)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Level {exercise.difficulty_level}
            </span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {exercise.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {exercise.estimated_minutes && (
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              {exercise.estimated_minutes} min
            </div>
          )}
          
          <div className="flex items-center">
            <CodeBracketIcon className="w-4 h-4 mr-1" />
            {exercise.language.toUpperCase()}
          </div>

          {exercise.tags.length > 0 && (
            <div className="flex items-center">
              <TagIcon className="w-4 h-4 mr-1" />
              {exercise.tags.slice(0, 3).join(', ')}
              {exercise.tags.length > 3 && ` +${exercise.tags.length - 3}`}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
            {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'instructions' && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="prose dark:prose-invert max-w-none">
                <h3>Overview</h3>
                <p>{exercise.instructions.overview}</p>

                <h3>Requirements</h3>
                <ul>
                  {exercise.instructions.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>

                {exercise.instructions.starter_code && (
                  <>
                    <h3>Starter Files</h3>
                    <div className="space-y-2">
                      {Object.entries(exercise.instructions.starter_code).map(([filename, code]) => (
                        <div key={filename} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {filename}
                          </div>
                          <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
                            <code>{code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {exercise.instructions.examples && exercise.instructions.examples.length > 0 ? (
                <div className="space-y-6">
                  {exercise.instructions.examples.map((example, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {example.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {example.explanation}
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CodeBracketIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No examples available for this exercise.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'hints' && (
            <motion.div
              key="hints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {hints.length > 0 ? (
                <div className="space-y-4">
                  {hints.map((hint, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => setExpandedHint(expandedHint === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center">
                          <LightBulbIcon className="w-5 h-5 text-yellow-500 mr-3" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {hint.title}
                          </span>
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            Level {hint.level}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedHint === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedHint === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-gray-600 dark:text-gray-300 mb-3">
                                {hint.content}
                              </p>
                              {hint.code_snippet && (
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                  <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                                    <code>{hint.code_snippet}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <LightBulbIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-4">No hints available yet.</p>
                    <p className="text-sm">Try working on the exercise first, then request a hint if you get stuck.</p>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() => onRequestHint(level)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Request Level {level} Hint
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ExerciseInstructions