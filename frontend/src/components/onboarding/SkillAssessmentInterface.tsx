import { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { SkillAssessmentQuestion, SkillAssessmentResult } from '../../types/onboarding'
import { onboardingService } from '../../services/onboardingService'

interface SkillAssessmentInterfaceProps {
  skillLevel: string
  onSkillLevelChange: (level: string) => void
  onValidationChange: (isValid: boolean) => void
}

export default function SkillAssessmentInterface({ 
  skillLevel, 
  onSkillLevelChange, 
  onValidationChange 
}: SkillAssessmentInterfaceProps) {
  const [assessmentMode, setAssessmentMode] = useState<'quick' | 'detailed'>('quick')
  const [questions, setQuestions] = useState<SkillAssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [results, setResults] = useState<SkillAssessmentResult[]>([])
  const [isAssessing, setIsAssessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    onValidationChange(skillLevel !== '' || isCompleted)
  }, [skillLevel, isCompleted, onValidationChange])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isAssessing && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (isAssessing && timeRemaining === 0) {
      handleTimeUp()
    }
    return () => clearTimeout(timer)
  }, [isAssessing, timeRemaining])

  const startAssessment = async () => {
    setLoading(true)
    try {
      const allQuestions = await onboardingService.getSkillAssessmentQuestions()
      
      // Filter questions based on mode
      let selectedQuestions = allQuestions
      if (assessmentMode === 'quick') {
        // Select 6 questions: 2 beginner, 2 intermediate, 2 advanced
        const beginnerQuestions = allQuestions.filter(q => q.difficulty === 'beginner').slice(0, 2)
        const intermediateQuestions = allQuestions.filter(q => q.difficulty === 'intermediate').slice(0, 2)
        const advancedQuestions = allQuestions.filter(q => q.difficulty === 'advanced').slice(0, 2)
        selectedQuestions = [...beginnerQuestions, ...intermediateQuestions, ...advancedQuestions]
      }
      
      setQuestions(selectedQuestions)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setIsAssessing(true)
      setTimeRemaining(selectedQuestions.length * 60) // 1 minute per question
    } catch (error) {
      console.error('Failed to load assessment questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    const newAnswers = { ...answers, [currentQuestion.id]: answerIndex }
    setAnswers(newAnswers)

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        completeAssessment(newAnswers)
      }
    }, 500)
  }

  const handleTimeUp = () => {
    completeAssessment(answers)
  }

  const completeAssessment = async (finalAnswers: Record<string, number>) => {
    setIsAssessing(false)
    setLoading(true)
    
    try {
      const assessmentResults = await onboardingService.evaluateSkillAssessment(finalAnswers)
      setResults(assessmentResults)
      
      // Determine overall skill level based on results
      const overallScore = assessmentResults.reduce((sum, result) => sum + result.score, 0) / assessmentResults.length
      let determinedLevel: string
      
      if (overallScore >= 85) {
        determinedLevel = 'expert'
      } else if (overallScore >= 70) {
        determinedLevel = 'advanced'
      } else if (overallScore >= 50) {
        determinedLevel = 'intermediate'
      } else {
        determinedLevel = 'beginner'
      }
      
      onSkillLevelChange(determinedLevel)
      setIsCompleted(true)
    } catch (error) {
      console.error('Failed to evaluate assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAssessment = () => {
    setIsAssessing(false)
    setIsCompleted(false)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setResults([])
    setTimeRemaining(0)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800'
      case 'advanced': return 'bg-blue-100 text-blue-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'beginner': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">What's your skill level?</h2>
        <p className="text-gray-600">
          Help us understand your current abilities so we can create the perfect learning path for you.
        </p>
      </div>

      {!isAssessing && !isCompleted && (
        <div className="space-y-6">
          {/* Quick Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Option 1: Quick Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: 'beginner', label: 'Beginner', description: 'New to programming or the technologies you want to learn' },
                { value: 'intermediate', label: 'Intermediate', description: 'Some experience with coding and basic concepts' },
                { value: 'advanced', label: 'Advanced', description: 'Experienced developer looking to expand skills' },
                { value: 'expert', label: 'Expert', description: 'Senior developer or architect with deep expertise' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => onSkillLevelChange(level.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-colors ${
                    skillLevel === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{level.label}</div>
                  <div className="text-sm text-gray-600">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Assessment Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Option 2: Take a Skill Assessment</h3>
            <p className="text-gray-600 mb-4">
              Get a more accurate assessment of your skills with our interactive quiz.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  assessmentMode === 'quick'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAssessmentMode('quick')}
              >
                <div className="flex items-center mb-2">
                  <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">Quick Assessment</span>
                </div>
                <p className="text-sm text-gray-600">6 questions • ~6 minutes</p>
              </div>
              
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  assessmentMode === 'detailed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAssessmentMode('detailed')}
              >
                <div className="flex items-center mb-2">
                  <AcademicCapIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">Detailed Assessment</span>
                </div>
                <p className="text-sm text-gray-600">15+ questions • ~15 minutes</p>
              </div>
            </div>

            <button
              onClick={startAssessment}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start {assessmentMode === 'quick' ? 'Quick' : 'Detailed'} Assessment
            </button>
          </div>
        </div>
      )}

      {/* Assessment in Progress */}
      {isAssessing && (
        <div className="space-y-6">
          {/* Progress and Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Current Question */}
          {questions[currentQuestionIndex] && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full mb-2">
                  {questions[currentQuestionIndex].category} • {questions[currentQuestionIndex].difficulty}
                </span>
                <h3 className="text-lg font-medium text-gray-900">
                  {questions[currentQuestionIndex].question}
                </h3>
              </div>
              
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-medium text-gray-700 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment Results */}
      {isCompleted && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Complete!</h3>
            <p className="text-gray-600">Here's your skill assessment breakdown:</p>
          </div>

          {/* Overall Level */}
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Your Overall Level</h4>
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getLevelBadgeColor(skillLevel)}`}>
              {skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
            </span>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Breakdown by Category:</h4>
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {result.category}
                  </span>
                  <span className={`font-semibold ${getScoreColor(result.score)}`}>
                    {result.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      result.score >= 80 ? 'bg-green-500' :
                      result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {result.recommendations.map((rec, recIndex) => (
                    <p key={recIndex} className="text-sm text-gray-600">• {rec}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={resetAssessment}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retake Assessment
            </button>
            <button
              onClick={() => onSkillLevelChange('')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Choose Manually
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
