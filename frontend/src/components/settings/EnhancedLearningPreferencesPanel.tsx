import React, { useState } from 'react'
import {
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  CogIcon,
  EyeIcon,
  SpeakerWaveIcon,
  BellIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  BookOpenIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import SettingsSection from './SettingsSection'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSettings } from './useSettings'
import { 
  PROGRAMMING_LANGUAGES, 
  SUPPORTED_LANGUAGES,
  CODE_EDITOR_THEMES,
  FONT_FAMILIES,
  ACCENT_COLORS,
  CONTENT_COMPLEXITY_OPTIONS,
} from '../../types/settings'

const LEARNING_STYLES = [
  {
    id: 'visual',
    name: 'Visual Learner',
    description: 'Learn best through diagrams, charts, and visual examples',
    icon: '👁️',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    id: 'hands-on',
    name: 'Hands-on Learner',
    description: 'Learn by doing, practicing, and experimenting with code',
    icon: '🛠️',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  {
    id: 'reading',
    name: 'Reading Learner',
    description: 'Prefer documentation, articles, and written explanations',
    icon: '📚',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  {
    id: 'auditory',
    name: 'Auditory Learner',
    description: 'Learn through explanations, discussions, and verbal feedback',
    icon: '🎧',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
  },
]

const DIFFICULTY_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to programming or the technology',
    icon: '🌱',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some experience, comfortable with basics',
    icon: '🌿',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced, ready for complex challenges',
    icon: '🌳',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Highly experienced, seeking mastery',
    icon: '🏆',
  },
]

const PACE_PREFERENCES = [
  {
    value: 'slow',
    label: 'Slow & Steady',
    description: 'Take time to thoroughly understand each concept',
    icon: '🐢',
  },
  {
    value: 'normal',
    label: 'Normal Pace',
    description: 'Balanced approach with adequate practice time',
    icon: '🚶',
  },
  {
    value: 'fast',
    label: 'Fast Track',
    description: 'Quick progression, minimal repetition',
    icon: '🏃',
  },
]

const FEEDBACK_DETAIL_LEVELS = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Brief feedback, just the essentials',
    icon: '📝',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Balanced feedback with explanations',
    icon: '📋',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Comprehensive feedback with examples and suggestions',
    icon: '📚',
  },
]

const EXERCISE_TYPES = [
  { id: 'coding', name: 'Coding Exercises', description: 'Write and debug code', icon: '💻' },
  { id: 'quiz', name: 'Knowledge Quizzes', description: 'Multiple choice and concept questions', icon: '❓' },
  { id: 'project', name: 'Mini Projects', description: 'Build small applications', icon: '🏗️' },
  { id: 'review', name: 'Code Reviews', description: 'Analyze and improve existing code', icon: '🔍' },
  { id: 'debugging', name: 'Debugging Challenges', description: 'Find and fix bugs', icon: '🐛' },
  { id: 'algorithm', name: 'Algorithm Practice', description: 'Data structures and algorithms', icon: '🧮' },
]

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
]

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"></div>
    </label>
  )
}

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  unit?: string
}

function Slider({ value, onChange, min, max, step = 1, label, unit }: SliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">{label}</span>
          <span className="text-gray-500">{value}{unit}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

export default function EnhancedLearningPreferencesPanel() {
  const { settings, updateLearningPrefs } = useSettings()
  const prefs = settings.learningPreferences
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['style']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleExerciseTypeToggle = (typeId: string) => {
    const currentTypes = prefs.exerciseTypes || []
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(id => id !== typeId)
      : [...currentTypes, typeId]
    
    updateLearningPrefs({ exerciseTypes: newTypes })
  }

  const handleLanguageToggle = (langId: string) => {
    const currentLangs = prefs.preferredLanguages || []
    const newLangs = currentLangs.includes(langId)
      ? currentLangs.filter(id => id !== langId)
      : [...currentLangs, langId]
    
    updateLearningPrefs({ preferredLanguages: newLangs })
  }

  const handleStudyTimeToggle = (time: string) => {
    const currentTimes = prefs.preferredStudyTimes || []
    const newTimes = currentTimes.includes(time)
      ? currentTimes.filter(t => t !== time)
      : [...currentTimes, time].sort()
    
    updateLearningPrefs({ preferredStudyTimes: newTimes })
  }

  return (
    <div className="space-y-6">
      {/* Learning Style & Approach */}
      <SettingsSection
        title="Learning Style & Approach"
        description="Customize how you prefer to learn and receive content"
        icon={UserIcon}
      >
        <div className="space-y-6">
          {/* Learning Style Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Learning Style</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEARNING_STYLES.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all ${
                    prefs.learningStyle === style.id
                      ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => updateLearningPrefs({ learningStyle: style.id as any })}
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{style.icon}</span>
                      <h5 className="font-medium text-gray-900">{style.name}</h5>
                      {prefs.learningStyle === style.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{style.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Difficulty & Pace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Difficulty Level</h4>
              <div className="space-y-2">
                {DIFFICULTY_LEVELS.map((level) => (
                  <label key={level.value} className="flex items-start cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level.value}
                      checked={prefs.difficulty === level.value}
                      onChange={(e) => updateLearningPrefs({ difficulty: e.target.value as any })}
                      className="mt-1 mr-3"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{level.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Learning Pace</h4>
              <div className="space-y-2">
                {PACE_PREFERENCES.map((pace) => (
                  <label key={pace.value} className="flex items-start cursor-pointer p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="pace"
                      value={pace.value}
                      checked={prefs.pacePreference === pace.value}
                      onChange={(e) => updateLearningPrefs({ pacePreference: e.target.value as any })}
                      className="mt-1 mr-3"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{pace.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{pace.label}</div>
                        <div className="text-sm text-gray-600">{pace.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Content Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Content Complexity</h4>
              <Select
                value={prefs.contentComplexity || 'balanced'}
                onChange={(complexity) => updateLearningPrefs({ contentComplexity: complexity as any })}
                options={CONTENT_COMPLEXITY_OPTIONS.map(option => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                {CONTENT_COMPLEXITY_OPTIONS.find(o => o.value === prefs.contentComplexity)?.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Practice vs Theory Balance</h4>
              <Slider
                value={prefs.practiceToTheoryRatio || 70}
                onChange={(ratio) => updateLearningPrefs({ practiceToTheoryRatio: ratio })}
                min={0}
                max={100}
                label="Practice Focus"
                unit="%"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>More Theory</span>
                <span>More Practice</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Feedback Preferences */}
      <SettingsSection
        title="Feedback & Assessment"
        description="Customize how you receive feedback and assessments"
        icon={ChatBubbleLeftRightIcon}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Feedback Detail Level</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FEEDBACK_DETAIL_LEVELS.map((level) => (
                <Card
                  key={level.value}
                  className={`cursor-pointer transition-all ${
                    prefs.feedbackDetail === level.value
                      ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => updateLearningPrefs({ feedbackDetail: level.value as any })}
                >
                  <div className="p-4 text-center">
                    <div className="text-2xl mb-2">{level.icon}</div>
                    <div className="font-medium text-gray-900 mb-1">{level.label}</div>
                    <div className="text-xs text-gray-600">{level.description}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Exercise Types */}
      <SettingsSection
        title="Preferred Exercise Types"
        description="Select the types of exercises you want to focus on"
        icon={CodeBracketIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXERCISE_TYPES.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all ${
                prefs.exerciseTypes?.includes(type.id)
                  ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleExerciseTypeToggle(type.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                  </div>
                  {prefs.exerciseTypes?.includes(type.id) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </SettingsSection>

      {/* Programming Languages */}
      <SettingsSection
        title="Preferred Programming Languages"
        description="Select the languages you want to focus on learning"
        icon={CodeBracketIcon}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROGRAMMING_LANGUAGES.map((lang) => (
            <Card
              key={lang.id}
              className={`cursor-pointer transition-all ${
                prefs.preferredLanguages?.includes(lang.id)
                  ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleLanguageToggle(lang.id)}
            >
              <div className="p-3 text-center">
                <div className="text-2xl mb-1">{lang.icon}</div>
                <div className="font-medium text-sm text-gray-900">{lang.name}</div>
                {prefs.preferredLanguages?.includes(lang.id) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </SettingsSection>

      {/* Learning Environment */}
      <SettingsSection
        title="Learning Environment"
        description="Customize your learning environment and focus settings"
        icon={CogIcon}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Focus Mode</div>
                  <div className="text-sm text-gray-600">Hide distracting elements during learning</div>
                </div>
                <ToggleSwitch
                  enabled={prefs.focusMode || false}
                  onChange={(enabled) => updateLearningPrefs({ focusMode: enabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Background Music</div>
                  <div className="text-sm text-gray-600">Play ambient sounds while learning</div>
                </div>
                <ToggleSwitch
                  enabled={prefs.backgroundMusic || false}
                  onChange={(enabled) => updateLearningPrefs({ backgroundMusic: enabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Dark Mode for Coding</div>
                  <div className="text-sm text-gray-600">Use dark theme for code editor</div>
                </div>
                <ToggleSwitch
                  enabled={prefs.darkModeForCoding || false}
                  onChange={(enabled) => updateLearningPrefs({ darkModeForCoding: enabled })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code Editor Theme
                </label>
                <Select
                  value={prefs.codeEditorTheme || 'vs-dark'}
                  onChange={(theme) => updateLearningPrefs({ codeEditorTheme: String(theme) })}
                  options={CODE_EDITOR_THEMES.map(theme => ({
                    value: theme.id,
                    label: theme.name,
                  }))}
                />
              </div>

              <div>
                <Slider
                  value={prefs.fontSize || 14}
                  onChange={(size) => updateLearningPrefs({ fontSize: size })}
                  min={10}
                  max={24}
                  label="Font Size"
                  unit="px"
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Schedule & Timing */}
      <SettingsSection
        title="Schedule & Timing"
        description="Set up your learning schedule and time preferences"
        icon={ClockIcon}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone
              </label>
              <Select
                value={prefs.timeZone}
                onChange={(timeZone) => updateLearningPrefs({ timeZone: String(timeZone) })}
                options={(() => {
                  // Use Intl.supportedValuesOf if available, otherwise use common timezones
                  const timezones = typeof (Intl as any).supportedValuesOf === 'function'
                    ? (Intl as any).supportedValuesOf('timeZone').slice(0, 50)
                    : [
                        'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                        'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
                        'Europe/Berlin', 'Europe/Rome', 'Asia/Tokyo', 'Asia/Shanghai',
                        'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland'
                      ]
                  return timezones.map((tz: string) => ({
                    value: tz,
                    label: tz.replace(/_/g, ' '),
                  }))
                })()}
                placeholder="Select your time zone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Reminder Time
              </label>
              <Input
                type="time"
                value={prefs.reminderTime}
                onChange={(e) => updateLearningPrefs({ reminderTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Preferred Study Times</h4>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => handleStudyTimeToggle(time)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    prefs.preferredStudyTimes?.includes(time)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Slider
                value={prefs.weeklyGoalHours || 10}
                onChange={(hours) => updateLearningPrefs({ weeklyGoalHours: hours })}
                min={1}
                max={40}
                label="Weekly Learning Goal"
                unit=" hours"
              />
            </div>

            <div>
              <Slider
                value={prefs.breakInterval || 25}
                onChange={(interval) => updateLearningPrefs({ breakInterval: interval })}
                min={15}
                max={120}
                step={5}
                label="Break Reminder Interval"
                unit=" min"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Study Reminders</div>
                <div className="text-sm text-gray-600">Get daily reminders to continue learning</div>
              </div>
              <ToggleSwitch
                enabled={prefs.studyReminders}
                onChange={(enabled) => updateLearningPrefs({ studyReminders: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Break Reminders</div>
                <div className="text-sm text-gray-600">Get reminders to take breaks during long sessions</div>
              </div>
              <ToggleSwitch
                enabled={prefs.breakReminders || false}
                onChange={(enabled) => updateLearningPrefs({ breakReminders: enabled })}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Motivation & Gamification */}
      <SettingsSection
        title="Motivation & Gamification"
        description="Customize motivational features and progress celebrations"
        icon={SparklesIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Progress Indicators</div>
                <div className="text-sm text-gray-600">Display progress bars and completion percentages</div>
              </div>
              <ToggleSwitch
                enabled={prefs.showProgress !== false}
                onChange={(enabled) => updateLearningPrefs({ showProgress: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Celebrate Achievements</div>
                <div className="text-sm text-gray-600">Show animations and notifications for milestones</div>
              </div>
              <ToggleSwitch
                enabled={prefs.celebrateAchievements !== false}
                onChange={(enabled) => updateLearningPrefs({ celebrateAchievements: enabled })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Competitive Mode</div>
                <div className="text-sm text-gray-600">Enable leaderboards and peer comparisons</div>
              </div>
              <ToggleSwitch
                enabled={prefs.competitiveMode || false}
                onChange={(enabled) => updateLearningPrefs({ competitiveMode: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Streak Motivation</div>
                <div className="text-sm text-gray-600">Track and celebrate learning streaks</div>
              </div>
              <ToggleSwitch
                enabled={prefs.streakMotivation !== false}
                onChange={(enabled) => updateLearningPrefs({ streakMotivation: enabled })}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Accessibility */}
      <SettingsSection
        title="Accessibility"
        description="Customize accessibility features for better usability"
        icon={EyeIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">High Contrast Mode</div>
                <div className="text-sm text-gray-600">Increase contrast for better visibility</div>
              </div>
              <ToggleSwitch
                enabled={prefs.highContrast || false}
                onChange={(enabled) => updateLearningPrefs({ highContrast: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Reduced Motion</div>
                <div className="text-sm text-gray-600">Minimize animations and transitions</div>
              </div>
              <ToggleSwitch
                enabled={prefs.reducedMotion || false}
                onChange={(enabled) => updateLearningPrefs({ reducedMotion: enabled })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Screen Reader Optimized</div>
                <div className="text-sm text-gray-600">Optimize interface for screen readers</div>
              </div>
              <ToggleSwitch
                enabled={prefs.screenReaderOptimized || false}
                onChange={(enabled) => updateLearningPrefs({ screenReaderOptimized: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Keyboard Navigation Only</div>
                <div className="text-sm text-gray-600">Optimize for keyboard-only navigation</div>
              </div>
              <ToggleSwitch
                enabled={prefs.keyboardNavigationOnly || false}
                onChange={(enabled) => updateLearningPrefs({ keyboardNavigationOnly: enabled })}
              />
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}