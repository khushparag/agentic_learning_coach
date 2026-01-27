import React, { useState } from 'react'
import {
  BellIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  FireIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  SpeakerWaveIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import SettingsSection from './SettingsSection'
import { useSettings } from './useSettings'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationType } from '../../types/notifications'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import { NOTIFICATION_FREQUENCIES } from '../../types/settings'

interface NotificationToggleProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
  onTest?: () => void
  frequency?: string
  onFrequencyChange?: (frequency: string | number) => void
}

function NotificationToggle({
  title,
  description,
  icon: Icon,
  enabled,
  onChange,
  disabled = false,
  onTest,
  frequency,
  onFrequencyChange,
}: NotificationToggleProps) {
  return (
    <div className={`p-4 border rounded-lg ${disabled ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-600 mt-1">{description}</div>
            
            {enabled && frequency && onFrequencyChange && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <Select
                  value={frequency}
                  onChange={onFrequencyChange}
                  options={NOTIFICATION_FREQUENCIES}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 ml-4">
          {onTest && enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTest}
              disabled={disabled}
              className="text-xs"
            >
              Test
            </Button>
          )}
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
        </div>
      </div>
    </div>
  )
}

interface DeliveryMethodCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
  onChange: (enabled: boolean) => void
  status?: 'available' | 'permission-required' | 'unavailable'
  onRequestPermission?: () => void
}

function DeliveryMethodCard({
  title,
  description,
  icon: Icon,
  enabled,
  onChange,
  status = 'available',
  onRequestPermission,
}: DeliveryMethodCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      case 'permission-required':
        return 'border-amber-200 bg-amber-50'
      case 'unavailable':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return enabled ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : null
      case 'permission-required':
        return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
      case 'unavailable':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Card className={`cursor-pointer transition-all ${getStatusColor()}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">{title}</h4>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {status === 'available' && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => onChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        {status === 'permission-required' && onRequestPermission && (
          <Button
            size="sm"
            onClick={onRequestPermission}
            className="w-full"
          >
            Request Permission
          </Button>
        )}
        
        {status === 'unavailable' && (
          <p className="text-xs text-red-600">
            Not available in your browser or device
          </p>
        )}
      </div>
    </Card>
  )
}

export default function EnhancedNotificationSettingsPanel() {
  const { settings, updateNotifications } = useSettings()
  const { 
    preferences, 
    updatePreferences, 
    requestPushPermission,
    createNotification 
  } = useNotifications()
  
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [testNotification, setTestNotification] = useState<{ type: NotificationType; sent: boolean } | null>(null)
  
  const notifications = settings.notifications

  const handleToggle = (key: keyof typeof notifications) => (enabled: boolean) => {
    updateNotifications({ [key]: enabled })
  }

  const handleFrequencyChange = (key: keyof typeof notifications.frequency) => (frequency: string | number) => {
    updateNotifications({
      frequency: {
        ...notifications.frequency,
        [key]: String(frequency)
      }
    })
  }

  const handleDeliveryMethodChange = (method: keyof typeof notifications.deliveryMethods) => (enabled: boolean) => {
    updateNotifications({
      deliveryMethods: {
        ...notifications.deliveryMethods,
        [method]: enabled
      }
    })
  }

  const handleRequestPushPermission = async () => {
    setIsRequestingPermission(true)
    try {
      const permission = await requestPushPermission()
      if (permission === 'granted') {
        updateNotifications({
          deliveryMethods: {
            ...notifications.deliveryMethods,
            push: true
          }
        })
      }
    } catch (error) {
      console.error('Failed to request push permission:', error)
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleTestNotification = (type: NotificationType, title: string, message: string) => {
    createNotification({
      type,
      title,
      message,
      priority: 'normal',
      persistent: false
    })
    
    setTestNotification({ type, sent: true })
    setTimeout(() => setTestNotification(null), 3000)
  }

  const handleQuietHoursChange = (field: string, value: any) => {
    updateNotifications({
      quietHours: {
        ...notifications.quietHours,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Master Control */}
      <SettingsSection
        title="Notification Master Control"
        description="Global settings for all notifications"
        icon={BellIcon}
      >
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Enable All Notifications</h4>
                <p className="text-sm text-gray-600">Master switch for all notification types</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.enabled !== false}
                onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>
      </SettingsSection>

      {/* Learning Notifications */}
      <SettingsSection
        title="Learning Notifications"
        description="Get notified about your learning progress and achievements"
        icon={AcademicCapIcon}
      >
        <div className="space-y-4">
          <NotificationToggle
            title="Achievement Unlocks"
            description="Get notified when you unlock new achievements, badges, and milestones"
            icon={TrophyIcon}
            enabled={notifications.achievements}
            onChange={handleToggle('achievements')}
            disabled={!preferences?.enabled}
            frequency={notifications.frequency?.achievements}
            onFrequencyChange={handleFrequencyChange('achievements')}
            onTest={() => handleTestNotification('achievement', 'Achievement Unlocked!', 'You earned the "Code Master" badge! 🏆')}
          />
          
          <NotificationToggle
            title="Progress Updates"
            description="Notifications when you complete tasks, modules, and learning milestones"
            icon={CheckCircleIcon}
            enabled={notifications.weeklyProgress}
            onChange={handleToggle('weeklyProgress')}
            disabled={!preferences?.enabled}
            onTest={() => handleTestNotification('progress', 'Task Completed!', 'Great job on completing the React Hooks exercise! 🎉')}
          />
          
          <NotificationToggle
            title="Learning Reminders"
            description="Daily reminders to continue your learning journey and maintain momentum"
            icon={ClockIcon}
            enabled={notifications.reminders}
            onChange={handleToggle('reminders')}
            disabled={!preferences?.enabled}
            frequency={notifications.frequency?.reminders}
            onFrequencyChange={handleFrequencyChange('reminders')}
            onTest={() => handleTestNotification('info', 'Learning Reminder', 'Ready to continue your React learning path? 📚')}
          />
          
          <NotificationToggle
            title="Streak Reminders"
            description="Reminders to maintain your learning streak and celebrate milestones"
            icon={FireIcon}
            enabled={notifications.streakReminders}
            onChange={handleToggle('streakReminders')}
            disabled={!preferences?.enabled}
            onTest={() => handleTestNotification('streak', 'Streak Milestone!', '🔥 7 day learning streak! Keep the momentum going!')}
          />
        </div>
      </SettingsSection>

      {/* Social Notifications */}
      <SettingsSection
        title="Social & Community Notifications"
        description="Notifications from social features and community interactions"
        icon={UserGroupIcon}
      >
        <div className="space-y-4">
          <NotificationToggle
            title="Social Activity"
            description="Notifications from study groups, comments, likes, and community interactions"
            icon={UserGroupIcon}
            enabled={notifications.social}
            onChange={handleToggle('social')}
            disabled={!preferences?.enabled}
            frequency={notifications.frequency?.social}
            onFrequencyChange={handleFrequencyChange('social')}
            onTest={() => handleTestNotification('collaboration', 'New Study Group Activity', 'Alex shared a solution in your JavaScript study group 👥')}
          />
          
          <NotificationToggle
            title="Challenge Invites"
            description="Get notified when someone challenges you to coding challenges or competitions"
            icon={TrophyIcon}
            enabled={notifications.challengeInvites}
            onChange={handleToggle('challengeInvites')}
            disabled={!preferences?.enabled}
            onTest={() => handleTestNotification('collaboration', 'Challenge Invitation', 'Sarah challenged you to a JavaScript speed coding challenge! ⚡')}
          />
          
          <NotificationToggle
            title="Study Group Activity"
            description="Updates from your study groups, new members, and group discussions"
            icon={ChatBubbleLeftRightIcon}
            enabled={notifications.studyGroupActivity}
            onChange={handleToggle('studyGroupActivity')}
            disabled={!preferences?.enabled}
            onTest={() => handleTestNotification('collaboration', 'Study Group Update', 'New discussion started in React Beginners group 💬')}
          />
          
          <NotificationToggle
            title="Mentor Messages"
            description="Messages and feedback from mentors and instructors"
            icon={UserGroupIcon}
            enabled={notifications.mentorMessages}
            onChange={handleToggle('mentorMessages')}
            disabled={!preferences?.enabled}
            onTest={() => handleTestNotification('info', 'Mentor Message', 'Your mentor left feedback on your latest project 👨‍🏫')}
          />
        </div>
      </SettingsSection>

      {/* Delivery Methods */}
      <SettingsSection
        title="Delivery Methods"
        description="Choose how you want to receive notifications"
        icon={EnvelopeIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DeliveryMethodCard
            title="In-App Notifications"
            description="Show notifications as popups and toasts within the application"
            icon={BellIcon}
            enabled={notifications.deliveryMethods?.inApp !== false}
            onChange={handleDeliveryMethodChange('inApp')}
            status="available"
          />
          
          <DeliveryMethodCard
            title="Email Notifications"
            description="Receive notifications via email for important updates"
            icon={EnvelopeIcon}
            enabled={notifications.emailNotifications}
            onChange={handleToggle('emailNotifications')}
            status="available"
          />
          
          <DeliveryMethodCard
            title="Push Notifications"
            description="Browser push notifications even when the app is closed"
            icon={DevicePhoneMobileIcon}
            enabled={notifications.pushNotifications}
            onChange={handleToggle('pushNotifications')}
            status={
              typeof Notification !== 'undefined' 
                ? Notification.permission === 'granted' 
                  ? 'available' 
                  : Notification.permission === 'denied'
                  ? 'unavailable'
                  : 'permission-required'
                : 'unavailable'
            }
            onRequestPermission={handleRequestPushPermission}
          />
          
          <DeliveryMethodCard
            title="SMS Notifications"
            description="Receive critical notifications via text message"
            icon={DevicePhoneMobileIcon}
            enabled={notifications.smsNotifications}
            onChange={handleToggle('smsNotifications')}
            status="permission-required"
          />
        </div>
      </SettingsSection>

      {/* Quiet Hours */}
      <SettingsSection
        title="Quiet Hours"
        description="Control when you receive notifications to avoid interruptions"
        icon={EyeSlashIcon}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Quiet Hours</h4>
              <p className="text-sm text-gray-500">Silence notifications during specified hours</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.quietHours?.enabled || false}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <AnimatePresence>
            {notifications.quietHours?.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={notifications.quietHours?.startTime || '22:00'}
                      onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={notifications.quietHours?.endTime || '08:00'}
                      onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 1, label: 'Mon' },
                      { value: 2, label: 'Tue' },
                      { value: 3, label: 'Wed' },
                      { value: 4, label: 'Thu' },
                      { value: 5, label: 'Fri' },
                      { value: 6, label: 'Sat' },
                      { value: 0, label: 'Sun' }
                    ].map((day) => (
                      <label key={day.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={notifications.quietHours?.days?.includes(day.value) !== false}
                          onChange={(e) => {
                            const currentDays = notifications.quietHours?.days || [0, 1, 2, 3, 4, 5, 6]
                            const newDays = e.target.checked
                              ? [...currentDays, day.value]
                              : currentDays.filter(d => d !== day.value)
                            handleQuietHoursChange('days', newDays)
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Quiet Hours Active</p>
                      <p>
                        Notifications will be silenced from {notifications.quietHours?.startTime || '22:00'} to {notifications.quietHours?.endTime || '08:00'} 
                        on selected days. Critical notifications may still be delivered.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SettingsSection>

      {/* Sound & Visual Settings */}
      <SettingsSection
        title="Sound & Visual Settings"
        description="Customize notification sounds and visual effects"
        icon={SpeakerWaveIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Sound Alerts</div>
                <div className="text-sm text-gray-600">Play sounds for notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Object.values(preferences?.types || {}).some(type => type.sound)}
                  onChange={(e) => {
                    const enabled = e.target.checked
                    const updatedTypes = { ...preferences?.types }
                    Object.keys(updatedTypes).forEach(key => {
                      updatedTypes[key as NotificationType].sound = enabled
                    })
                    updatePreferences({ types: updatedTypes })
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Visual Animations</div>
                <div className="text-sm text-gray-600">Show animated notification effects</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system?.enableAnimations !== false}
                  onChange={(e) => {
                    // This would update system settings
                    console.log('Update animations:', e.target.checked)
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Sound
              </label>
              <Select
                value="default"
                onChange={() => {}}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'chime', label: 'Chime' },
                  { value: 'bell', label: 'Bell' },
                  { value: 'pop', label: 'Pop' },
                  { value: 'none', label: 'Silent' },
                ]}
              />
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Play test sound
                  console.log('Playing test sound')
                }}
                className="w-full"
              >
                <SpeakerWaveIcon className="w-4 h-4 mr-2" />
                Test Sound
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Test Notification Feedback */}
      <AnimatePresence>
        {testNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4" />
              <span>Test {testNotification.type} notification sent!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
