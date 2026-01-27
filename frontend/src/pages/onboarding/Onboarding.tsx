import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { OnboardingData, OnboardingStep, ValidationError } from '../../types/onboarding'
import { onboardingService } from '../../services/onboardingService'
import { useAuth } from '../../contexts/AuthContext'
import GoalSetupWizard from '../../components/onboarding/GoalSetupWizard'
import SkillAssessmentInterface from '../../components/onboarding/SkillAssessmentInterface'
import TechStackSelection from '../../components/onboarding/TechStackSelection'
import ErrorMessage from '../../components/ui/ErrorMessage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  const [formData, setFormData] = useState<OnboardingData>({
    goals: [],
    techStack: [],
    skillLevel: '',
    timeConstraints: {
      hoursPerWeek: 5,
      preferredTimes: [],
      availableDays: [],
      sessionLengthMinutes: 60,
    },
    preferences: {
      learningStyle: '',
      difficulty: 'intermediate',
    },
  })

  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({
    1: false, // Goals
    2: false, // Tech Stack
    3: false, // Skill Assessment
    4: false, // Time Constraints
    5: false, // Preferences
  })

  const steps: OnboardingStep[] = [
    { id: 1, title: 'Learning Goals', description: 'What do you want to achieve?', component: 'goals', isValid: stepValidation[1], isCompleted: false },
    { id: 2, title: 'Tech Stack', description: 'Which technologies interest you?', component: 'techstack', isValid: stepValidation[2], isCompleted: false },
    { id: 3, title: 'Skill Level', description: 'What\'s your current level?', component: 'skills', isValid: stepValidation[3], isCompleted: false },
    { id: 4, title: 'Time & Schedule', description: 'How much time can you dedicate?', component: 'time', isValid: stepValidation[4], isCompleted: false },
    { id: 5, title: 'Preferences', description: 'How do you prefer to learn?', component: 'preferences', isValid: stepValidation[5], isCompleted: false },
  ]

  const totalSteps = steps.length

  useEffect(() => {
    // Mark completed steps
    steps.forEach(step => {
      if (step.id < currentStep) {
        step.isCompleted = true
      }
    })
  }, [currentStep])

  const handleStepValidation = (stepNumber: number, isValid: boolean) => {
    setStepValidation(prev => ({
      ...prev,
      [stepNumber]: isValid
    }))
  }

  const handleNext = async () => {
    setError(null)
    setValidationErrors([])

    // Validate current step
    if (!stepValidation[currentStep]) {
      setError('Please complete all required fields before continuing.')
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate all data
      const validation = onboardingService.validateOnboardingData(formData)
      if (!validation.isValid) {
        setError('Please complete all required fields.')
        setValidationErrors(validation.errors.map(error => ({ field: 'general', message: error })))
        setLoading(false)
        return
      }

      // Step 1: Set goals and constraints (will use mock if backend unavailable)
      await onboardingService.setGoals({
        goals: formData.goals,
        time_constraints: {
          hours_per_week: formData.timeConstraints.hoursPerWeek,
          preferred_times: formData.timeConstraints.preferredTimes,
          available_days: formData.timeConstraints.availableDays,
          session_length_minutes: formData.timeConstraints.sessionLengthMinutes,
        },
        skill_level: formData.skillLevel,
        preferences: {
          learning_style: formData.preferences.learningStyle,
          difficulty: formData.preferences.difficulty,
          tech_stack: formData.techStack,
        }
      })

      // Step 2: Create curriculum based on goals (will use mock if backend unavailable)
      const curriculumResponse = await onboardingService.createCurriculum({
        goals: formData.goals,
        time_constraints: {
          hours_per_week: formData.timeConstraints.hoursPerWeek,
          preferred_times: formData.timeConstraints.preferredTimes,
          available_days: formData.timeConstraints.availableDays,
          session_length_minutes: formData.timeConstraints.sessionLengthMinutes,
        },
        preferences: {
          learning_style: formData.preferences.learningStyle,
          difficulty: formData.preferences.difficulty,
          tech_stack: formData.techStack,
        },
        skill_level: formData.skillLevel
      })

      // Step 3: Activate the curriculum (will use mock if backend unavailable)
      await onboardingService.activateCurriculum(curriculumResponse.id)

      // Store completion flag and user data
      localStorage.setItem('onboarding_completed', 'true')
      localStorage.setItem('user_goals', JSON.stringify(formData.goals))
      localStorage.setItem('user_skill_level', formData.skillLevel)
      localStorage.setItem('user_tech_stack', JSON.stringify(formData.techStack))
      localStorage.setItem('user_preferences', JSON.stringify(formData.preferences))
      localStorage.setItem('user_time_constraints', JSON.stringify(formData.timeConstraints))
      localStorage.setItem('current_curriculum', JSON.stringify(curriculumResponse))

      // Update user state to mark onboarding as complete
      updateUser({ isOnboardingComplete: true })

      // Navigate to dashboard (root path)
      navigate('/', { 
        state: { 
          message: 'Welcome! Your personalized learning path is ready.',
          curriculum: curriculumResponse 
        }
      })

    } catch (error: any) {
      console.error('Onboarding completion failed:', error)
      setError(error.message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GoalSetupWizard
            selectedGoals={formData.goals}
            onGoalsChange={(goals) => setFormData(prev => ({ ...prev, goals }))}
            onValidationChange={(isValid) => handleStepValidation(1, isValid)}
          />
        )
      case 2:
        return (
          <TechStackSelection
            selectedTechStack={formData.techStack}
            onTechStackChange={(techStack) => setFormData(prev => ({ ...prev, techStack }))}
            onValidationChange={(isValid) => handleStepValidation(2, isValid)}
          />
        )
      case 3:
        return (
          <SkillAssessmentInterface
            skillLevel={formData.skillLevel}
            onSkillLevelChange={(skillLevel) => setFormData(prev => ({ ...prev, skillLevel }))}
            onValidationChange={(isValid) => handleStepValidation(3, isValid)}
          />
        )
      case 4:
        return <TimeConstraintsStep data={formData} onChange={setFormData} onValidationChange={(isValid) => handleStepValidation(4, isValid)} />
      case 5:
        return <PreferencesStep data={formData} onChange={setFormData} onValidationChange={(isValid) => handleStepValidation(5, isValid)} />
      default:
        return null
    }
  }

  const getStepIcon = (step: OnboardingStep) => {
    if (step.isCompleted) {
      return <CheckCircleIcon className="w-6 h-6 text-green-600" />
    }
    if (step.id === currentStep && !stepValidation[step.id]) {
      return <ExclamationCircleIcon className="w-6 h-6 text-yellow-600" />
    }
    return (
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
        step.id === currentStep 
          ? 'bg-blue-600 text-white' 
          : step.id < currentStep 
            ? 'bg-green-600 text-white'
            : 'bg-gray-300 text-gray-600'
      }`}>
        {step.id}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Learning Coach</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  {getStepIcon(step)}
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 py-6">
          {error && (
            <ErrorMessage
              message={error}
              details={validationErrors.map(e => e.message)}
              onDismiss={() => {
                setError(null)
                setValidationErrors([])
              }}
              className="mb-6"
            />
          )}
          
          <div className="min-h-[400px]">
            {renderStep()}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 py-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Previous
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Step validation indicator */}
            {stepValidation[currentStep] ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ready to continue
              </div>
            ) : (
              <div className="flex items-center text-yellow-600 text-sm">
                <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                Complete required fields
              </div>
            )}
            
            <button
              onClick={handleNext}
              disabled={!stepValidation[currentStep] || loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
                  {currentStep < totalSteps && <ChevronRightIcon className="w-5 h-5 ml-1" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components
interface StepProps {
  data: OnboardingData
  onChange: (data: OnboardingData) => void
  onValidationChange: (isValid: boolean) => void
}

function TimeConstraintsStep({ data, onChange, onValidationChange }: StepProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(data.timeConstraints.availableDays)
  const [selectedTimes, setSelectedTimes] = useState<string[]>(data.timeConstraints.preferredTimes)

  useEffect(() => {
    const isValid = data.timeConstraints.hoursPerWeek > 0 && selectedDays.length > 0
    onValidationChange(isValid)
  }, [data.timeConstraints.hoursPerWeek, selectedDays, onValidationChange])

  const days = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]

  const times = [
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 10PM)' },
    { value: 'night', label: 'Night (10PM - 12AM)' },
  ]

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    
    setSelectedDays(newDays)
    onChange({
      ...data,
      timeConstraints: {
        ...data.timeConstraints,
        availableDays: newDays
      }
    })
  }

  const toggleTime = (time: string) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time]
    
    setSelectedTimes(newTimes)
    onChange({
      ...data,
      timeConstraints: {
        ...data.timeConstraints,
        preferredTimes: newTimes
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">How much time can you dedicate?</h2>
        <p className="text-gray-600 mb-6">We'll create a personalized schedule that fits your availability.</p>
      </div>
      
      <div className="space-y-6">
        {/* Hours per week */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours per week *
          </label>
          <input
            type="range"
            min="1"
            max="40"
            value={data.timeConstraints.hoursPerWeek}
            onChange={(e) => onChange({
              ...data,
              timeConstraints: {
                ...data.timeConstraints,
                hoursPerWeek: parseInt(e.target.value)
              }
            })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1 hour</span>
            <span className="font-medium text-blue-600">{data.timeConstraints.hoursPerWeek} hours</span>
            <span>40 hours</span>
          </div>
        </div>

        {/* Available days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Available days * (select at least one)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {days.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred times (optional)
          </label>
          <div className="space-y-2">
            {times.map((time) => (
              <button
                key={time.value}
                onClick={() => toggleTime(time.value)}
                className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                  selectedTimes.includes(time.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred session length
          </label>
          <select
            value={data.timeConstraints.sessionLengthMinutes}
            onChange={(e) => onChange({
              ...data,
              timeConstraints: {
                ...data.timeConstraints,
                sessionLengthMinutes: parseInt(e.target.value)
              }
            })}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={15} className="bg-white text-gray-900">15 minutes</option>
            <option value={30} className="bg-white text-gray-900">30 minutes</option>
            <option value={45} className="bg-white text-gray-900">45 minutes</option>
            <option value={60} className="bg-white text-gray-900">1 hour</option>
            <option value={90} className="bg-white text-gray-900">1.5 hours</option>
            <option value={120} className="bg-white text-gray-900">2 hours</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Your Schedule Summary:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {data.timeConstraints.hoursPerWeek} hours per week</li>
          <li>• Available on: {selectedDays.join(', ') || 'No days selected'}</li>
          {selectedTimes.length > 0 && (
            <li>• Preferred times: {selectedTimes.join(', ')}</li>
          )}
          <li>• {data.timeConstraints.sessionLengthMinutes} minute sessions</li>
        </ul>
      </div>
    </div>
  )
}

function PreferencesStep({ data, onChange, onValidationChange }: StepProps) {
  useEffect(() => {
    const isValid = data.preferences.learningStyle !== ''
    onValidationChange(isValid)
  }, [data.preferences.learningStyle, onValidationChange])

  const learningStyles = [
    { 
      value: 'visual', 
      label: 'Visual Learner', 
      description: 'Learn best through diagrams, charts, and visual examples',
      icon: '👁️'
    },
    { 
      value: 'hands-on', 
      label: 'Hands-on Learner', 
      description: 'Learn best by doing and practicing with real code',
      icon: '🛠️'
    },
    { 
      value: 'reading', 
      label: 'Reading Learner', 
      description: 'Learn best through documentation, articles, and written content',
      icon: '📚'
    },
    { 
      value: 'auditory', 
      label: 'Auditory Learner', 
      description: 'Learn best through videos, podcasts, and explanations',
      icon: '🎧'
    },
  ]

  const difficultyLevels = [
    { value: 'easy', label: 'Take it slow', description: 'I prefer a gentle learning pace' },
    { value: 'intermediate', label: 'Balanced approach', description: 'Mix of theory and practice' },
    { value: 'challenging', label: 'Challenge me', description: 'I want to be pushed to learn faster' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Learning Preferences</h2>
        <p className="text-gray-600 mb-6">Help us customize your learning experience to match your style.</p>
      </div>
      
      <div className="space-y-6">
        {/* Learning Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How do you prefer to learn? *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {learningStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => onChange({
                  ...data,
                  preferences: { ...data.preferences, learningStyle: style.value }
                })}
                className={`p-4 text-left rounded-lg border-2 transition-colors ${
                  data.preferences.learningStyle === style.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{style.icon}</span>
                  <span className="font-medium text-gray-900">{style.label}</span>
                </div>
                <div className="text-sm text-gray-600">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Learning pace preference
          </label>
          <div className="space-y-3">
            {difficultyLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => onChange({
                  ...data,
                  preferences: { ...data.preferences, difficulty: level.value }
                })}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                  data.preferences.difficulty === level.value
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
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🎯 Perfect! We'll customize your experience:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Learning style: {learningStyles.find(s => s.value === data.preferences.learningStyle)?.label || 'Not selected'}</li>
          <li>• Pace: {difficultyLevels.find(d => d.value === data.preferences.difficulty)?.label}</li>
          <li>• Focus areas: {data.techStack.join(', ') || 'General programming'}</li>
          <li>• Goals: {data.goals.slice(0, 2).join(', ')}{data.goals.length > 2 ? ` and ${data.goals.length - 2} more` : ''}</li>
        </ul>
      </div>
    </div>
  )
}