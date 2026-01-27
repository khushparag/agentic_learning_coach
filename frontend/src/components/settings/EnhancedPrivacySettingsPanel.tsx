import React, { useState } from 'react'
import {
  ShieldCheckIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  ClockIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import SettingsSection from './SettingsSection'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSettings } from './useSettings'

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    description: 'Your profile is visible to everyone on the platform',
    icon: '🌍',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    value: 'friends',
    label: 'Friends Only',
    description: 'Only people in your study groups and connections can see your profile',
    icon: '👥',
    color: 'bg-green-50 border-green-200',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Your profile is completely private and hidden from others',
    icon: '🔒',
    color: 'bg-gray-50 border-gray-200',
  },
]

const DATA_RETENTION_OPTIONS = [
  { value: 0, label: 'Keep indefinitely' },
  { value: 30, label: '30 days' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: 730, label: '2 years' },
]

interface PrivacyToggleProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
  onChange: (enabled: boolean) => void
  warning?: string
  recommendation?: 'recommended' | 'caution' | 'advanced'
}

function PrivacyToggle({
  title,
  description,
  icon: Icon,
  enabled,
  onChange,
  warning,
  recommendation,
}: PrivacyToggleProps) {
  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'recommended':
        return 'text-green-600'
      case 'caution':
        return 'text-amber-600'
      case 'advanced':
        return 'text-blue-600'
      default:
        return ''
    }
  }

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'recommended':
        return '✓ Recommended'
      case 'caution':
        return '⚠ Use with caution'
      case 'advanced':
        return '⚙ Advanced setting'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start space-x-3 flex-1">
        <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-gray-900">{title}</div>
            {recommendation && (
              <span className={`text-xs font-medium ${getRecommendationColor()}`}>
                {getRecommendationText()}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">{description}</div>
          {warning && (
            <div className="flex items-center space-x-1 mt-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-600">{warning}</span>
            </div>
          )}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )
}

interface DataControlCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actionLabel: string
  onAction: () => void
  variant?: 'default' | 'warning' | 'danger'
  disabled?: boolean
}

function DataControlCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  variant = 'default',
  disabled = false,
}: DataControlCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-amber-200 bg-amber-50'
      case 'danger':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive'
      case 'warning':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card className={getVariantStyles()}>
      <div className="p-4">
        <div className="flex items-start space-x-3 mb-4">
          <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <Button
          variant={getButtonVariant() as any}
          size="sm"
          onClick={onAction}
          disabled={disabled}
          className="w-full"
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  )
}

export default function EnhancedPrivacySettingsPanel() {
  const { settings, updatePrivacy } = useSettings()
  const privacy = settings.privacy
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')

  const handleToggle = (key: keyof typeof privacy) => (enabled: boolean) => {
    updatePrivacy({ [key]: enabled })
  }

  const handleDataExport = () => {
    // Implement data export functionality
    console.log('Exporting user data...')
  }

  const handleAccountDeletion = () => {
    if (deleteConfirmationText === 'DELETE MY ACCOUNT') {
      // Implement account deletion
      console.log('Deleting account...')
      setShowDeleteConfirmation(false)
      setDeleteConfirmationText('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <SettingsSection
        title="Profile Visibility"
        description="Control who can see your learning profile and activity"
        icon={EyeIcon}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VISIBILITY_OPTIONS.map((option) => (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  privacy.profileVisibility === option.value
                    ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                    : 'hover:border-gray-300'
                } ${option.color}`}
                onClick={() => updatePrivacy({ profileVisibility: option.value as any })}
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{option.icon}</span>
                    <h4 className="font-medium text-gray-900">{option.label}</h4>
                    {privacy.profileVisibility === option.value && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <EyeIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Current Visibility: {privacy.profileVisibility}</p>
                <p>
                  {privacy.profileVisibility === 'public' && 'Your profile, progress, and achievements are visible to all users.'}
                  {privacy.profileVisibility === 'friends' && 'Only your study group members and connections can see your profile.'}
                  {privacy.profileVisibility === 'private' && 'Your profile is completely hidden from other users.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Sharing Preferences */}
      <SettingsSection
        title="Content Sharing"
        description="Choose what information you want to share with others"
        icon={UserGroupIcon}
      >
        <div className="space-y-1">
          <PrivacyToggle
            title="Share Learning Progress"
            description="Allow others to see your learning progress, completed exercises, and skill development"
            icon={ChartBarIcon}
            enabled={privacy.shareProgress}
            onChange={handleToggle('shareProgress')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Share Achievements & Badges"
            description="Show your badges, achievements, and milestones on your profile"
            icon={ShieldCheckIcon}
            enabled={privacy.shareAchievements}
            onChange={handleToggle('shareAchievements')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Share Code Solutions"
            description="Allow your code solutions to be visible to other learners for educational purposes"
            icon={DocumentArrowDownIcon}
            enabled={privacy.shareCodeSolutions}
            onChange={handleToggle('shareCodeSolutions')}
            warning="Your code will be visible to other users in your study groups"
          />
        </div>
      </SettingsSection>

      {/* Social Features */}
      <SettingsSection
        title="Social Features"
        description="Control your participation in social and collaborative features"
        icon={UserGroupIcon}
      >
        <div className="space-y-1">
          <PrivacyToggle
            title="Allow Challenge Invites"
            description="Let other users invite you to coding challenges and competitions"
            icon={UserGroupIcon}
            enabled={privacy.allowChallenges}
            onChange={handleToggle('allowChallenges')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Allow Study Group Invites"
            description="Receive invitations to join study groups and collaborative learning sessions"
            icon={UserGroupIcon}
            enabled={privacy.allowStudyGroupInvites}
            onChange={handleToggle('allowStudyGroupInvites')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Allow Mentoring Requests"
            description="Let other learners request mentoring or guidance from you"
            icon={UserGroupIcon}
            enabled={privacy.allowMentoring}
            onChange={handleToggle('allowMentoring')}
          />
          
          <PrivacyToggle
            title="Show Online Status"
            description="Display when you're actively learning or online to other users"
            icon={GlobeAltIcon}
            enabled={privacy.showOnlineStatus}
            onChange={handleToggle('showOnlineStatus')}
            warning="Other users will see when you're active on the platform"
          />
        </div>
      </SettingsSection>

      {/* Communication Settings */}
      <SettingsSection
        title="Communication & Interaction"
        description="Control how others can communicate with you"
        icon={ChatBubbleLeftRightIcon}
      >
        <div className="space-y-1">
          <PrivacyToggle
            title="Allow Direct Messages"
            description="Let other users send you private messages and start conversations"
            icon={ChatBubbleLeftRightIcon}
            enabled={privacy.allowDirectMessages}
            onChange={handleToggle('allowDirectMessages')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Allow Public Comments"
            description="Let others comment on your shared solutions and achievements"
            icon={ChatBubbleLeftRightIcon}
            enabled={privacy.allowPublicComments}
            onChange={handleToggle('allowPublicComments')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Moderate Comments"
            description="Require approval before comments appear on your content"
            icon={ShieldCheckIcon}
            enabled={privacy.moderateComments}
            onChange={handleToggle('moderateComments')}
            recommendation="caution"
          />
        </div>
      </SettingsSection>

      {/* Data Collection & Analytics */}
      <SettingsSection
        title="Data Collection & Analytics"
        description="Control how your data is used to improve the learning experience"
        icon={ChartBarIcon}
      >
        <div className="space-y-1">
          <PrivacyToggle
            title="Learning Analytics"
            description="Allow collection of learning patterns to improve personalized recommendations"
            icon={ChartBarIcon}
            enabled={privacy.analyticsOptIn}
            onChange={handleToggle('analyticsOptIn')}
            warning={!privacy.analyticsOptIn ? "Disabling may reduce personalization quality" : undefined}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Usage Data Collection"
            description="Help improve the platform by sharing anonymous usage statistics and performance data"
            icon={ChartBarIcon}
            enabled={privacy.dataCollection}
            onChange={handleToggle('dataCollection')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="AI Improvement Suggestions"
            description="Allow the system to analyze your learning patterns and provide AI-powered improvement suggestions"
            icon={CogIcon}
            enabled={privacy.improvementSuggestions}
            onChange={handleToggle('improvementSuggestions')}
            recommendation="recommended"
          />
          
          <PrivacyToggle
            title="Research Participation"
            description="Participate in educational research studies to help improve learning methodologies"
            icon={DocumentArrowDownIcon}
            enabled={privacy.researchParticipation}
            onChange={handleToggle('researchParticipation')}
            recommendation="advanced"
          />
        </div>
      </SettingsSection>

      {/* Data Retention */}
      <SettingsSection
        title="Data Retention & Control"
        description="Manage how long your data is stored and control data lifecycle"
        icon={ClockIcon}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention Period
              </label>
              <Select
                value={privacy.dataRetentionPeriod?.toString() || '0'}
                onChange={(value) => updatePrivacy({ dataRetentionPeriod: parseInt(String(value)) })}
                options={DATA_RETENTION_OPTIONS.map(option => ({
                  value: option.value.toString(),
                  label: option.label,
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to keep your learning data after account deletion
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Auto-delete Inactive Data</div>
                <div className="text-sm text-gray-600">Automatically remove old, unused data</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.autoDeleteInactiveData}
                  onChange={(e) => updatePrivacy({ autoDeleteInactiveData: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Data Security Information */}
      <SettingsSection
        title="Data Security & Protection"
        description="Information about how your data is protected and secured"
        icon={LockClosedIcon}
      >
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="space-y-3 text-sm text-green-800">
            <div className="flex items-start space-x-2">
              <LockClosedIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>End-to-End Encryption:</strong> All your data is encrypted in transit and at rest using industry-standard AES-256 encryption.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <KeyIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>API Key Security:</strong> Your API keys are encrypted with separate keys and never logged, exposed, or shared.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <ShieldCheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Code Privacy:</strong> Your code submissions are only used for evaluation and feedback. They are never shared without explicit permission.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <UserGroupIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>No Third-Party Sharing:</strong> We never sell or share your personal data with third parties for marketing purposes.
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Data Rights & Controls */}
      <SettingsSection
        title="Your Data Rights"
        description="Exercise your data protection rights and manage your information"
        icon={DocumentArrowDownIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataControlCard
            title="Export Your Data"
            description="Download a complete copy of all your personal data, learning progress, and activity"
            icon={DocumentArrowDownIcon}
            actionLabel="Request Data Export"
            onAction={handleDataExport}
          />

          <DataControlCard
            title="Data Correction"
            description="Request corrections to any inaccurate or incomplete personal information"
            icon={CogIcon}
            actionLabel="Request Correction"
            onAction={() => console.log('Request correction')}
          />

          <DataControlCard
            title="Data Portability"
            description="Export your data in a machine-readable format to transfer to another service"
            icon={DocumentArrowDownIcon}
            actionLabel="Export for Transfer"
            onAction={() => console.log('Export for transfer')}
          />

          <DataControlCard
            title="Delete Account"
            description="Permanently delete your account and all associated data (this action cannot be undone)"
            icon={TrashIcon}
            actionLabel="Delete Account"
            onAction={() => setShowDeleteConfirmation(true)}
            variant="danger"
          />
        </div>
      </SettingsSection>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  This action will permanently delete your account and all associated data, including:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
                  <li>Learning progress and achievements</li>
                  <li>Code submissions and solutions</li>
                  <li>Study group memberships</li>
                  <li>Social connections and messages</li>
                  <li>All personal settings and preferences</li>
                </ul>
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE MY ACCOUNT" to confirm:
                </label>
                <Input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirmation(false)
                    setDeleteConfirmationText('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleAccountDeletion}
                  disabled={deleteConfirmationText !== 'DELETE MY ACCOUNT'}
                  className="flex-1"
                >
                  Delete Account
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Links */}
      <SettingsSection
        title="Privacy Information"
        description="Learn more about our privacy practices and policies"
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              We are committed to protecting your privacy and being transparent about how we collect, 
              use, and share your information. Our privacy practices are designed to give you control 
              over your personal data.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Privacy Policy
              </button>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Data Processing Agreement
              </button>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Cookie Policy
              </button>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}