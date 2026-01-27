/**
 * Notification Preferences Component
 * Comprehensive notification settings and configuration interface
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BellIcon,
  SpeakerWaveIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { 
  BellIcon as BellSolidIcon,
  SpeakerWaveIcon as SpeakerSolidIcon 
} from '@heroicons/react/24/solid'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationType, NotificationPreferences as NotificationPrefsType } from '../../types/notifications'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'

export interface NotificationPreferencesProps {
  onClose?: () => void
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const { preferences, updatePreferences, requestPushPermission } = useNotifications()
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [testNotification, setTestNotification] = useState<{ type: NotificationType; sent: boolean } | null>(null)

  const notificationTypes: Array<{
    type: NotificationType
    label: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      type: 'success',
      label: 'Success Notifications',
      description: 'Task completions, achievements unlocked',
      icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />
    },
    {
      type: 'error',
      label: 'Error Notifications',
      description: 'System errors, failed submissions',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
    },
    {
      type: 'warning',
      label: 'Warning Notifications',
      description: 'Important alerts, deadline reminders',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
    },
    {
      type: 'info',
      label: 'Info Notifications',
      description: 'General updates, tips and suggestions',
      icon: <InformationCircleIcon className="w-5 h-5 text-blue-500" />
    },
    {
      type: 'achievement',
      label: 'Achievement Notifications',
      description: 'Badges earned, milestones reached',
      icon: <CheckCircleIcon className="w-5 h-5 text-yellow-500" />
    },
    {
      type: 'progress',
      label: 'Progress Notifications',
      description: 'Learning progress updates',
      icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />
    },
    {
      type: 'streak',
      label: 'Streak Notifications',
      description: 'Daily streak updates and milestones',
      icon: <CheckCircleIcon className="w-5 h-5 text-orange-500" />
    },
    {
      type: 'collaboration',
      label: 'Collaboration Notifications',
      description: 'Study group updates, peer interactions',
      icon: <CheckCircleIcon className="w-5 h-5 text-purple-500" />
    },
    {
      type: 'system',
      label: 'System Notifications',
      description: 'Maintenance alerts, feature announcements',
      icon: <BellSolidIcon className="w-5 h-5 text-gray-500" />
    }
  ]

  const handleTypePreferenceChange = (
    type: NotificationType,
    setting: keyof NotificationPrefsType['types'][NotificationType],
    value: boolean
  ) => {
    updatePreferences({
      types: {
        ...preferences.types,
        [type]: {
          ...preferences.types[type],
          [setting]: value
        }
      }
    })
  }

  const handleDoNotDisturbChange = (field: string, value: any) => {
    updatePreferences({
      doNotDisturb: {
        ...preferences.doNotDisturb,
        [field]: value
      }
    })
  }

  const handleBatchingChange = (field: string, value: any) => {
    updatePreferences({
      batching: {
        ...preferences.batching,
        [field]: value
      }
    })
  }

  const handleRequestPushPermission = async () => {
    setIsRequestingPermission(true)
    try {
      const permission = await requestPushPermission()
      if (permission === 'granted') {
        updatePreferences({
          push: {
            ...preferences.push,
            enabled: true,
            permission
          }
        })
      }
    } catch (error) {
      console.error('Failed to request push permission:', error)
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleTestNotification = (type: NotificationType) => {
    // This would trigger a test notification
    setTestNotification({ type, sent: true })
    setTimeout(() => setTestNotification(null), 3000)
  }

  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-1">
            Customize how and when you receive notifications
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Global Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Global Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable Notifications</h3>
              <p className="text-sm text-gray-500">Turn all notifications on or off</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.enabled}
                onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive notifications even when the app is closed
              </p>
              {preferences.push.permission === 'denied' && (
                <p className="text-sm text-red-600 mt-1">
                  Push notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {preferences.push.permission === 'granted' ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push.enabled}
                    onChange={(e) => updatePreferences({
                      push: { ...preferences.push, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRequestPushPermission}
                  disabled={isRequestingPermission || preferences.push.permission === 'denied'}
                  loading={isRequestingPermission}
                >
                  Enable Push
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Types */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Types</h2>
        </div>

        <div className="space-y-6">
          {notificationTypes.map((notificationType) => (
            <div key={notificationType.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {notificationType.icon}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {notificationType.label}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {notificationType.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestNotification(notificationType.type)}
                  disabled={!preferences.types[notificationType.type].enabled}
                >
                  Test
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${notificationType.type}-enabled`}
                    checked={preferences.types[notificationType.type].enabled}
                    onChange={(e) => handleTypePreferenceChange(
                      notificationType.type,
                      'enabled',
                      e.target.checked
                    )}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${notificationType.type}-enabled`}
                    className="text-sm text-gray-700"
                  >
                    Enabled
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${notificationType.type}-toast`}
                    checked={preferences.types[notificationType.type].toast}
                    onChange={(e) => handleTypePreferenceChange(
                      notificationType.type,
                      'toast',
                      e.target.checked
                    )}
                    disabled={!preferences.types[notificationType.type].enabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${notificationType.type}-toast`}
                    className="text-sm text-gray-700"
                  >
                    Toast
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${notificationType.type}-push`}
                    checked={preferences.types[notificationType.type].push}
                    onChange={(e) => handleTypePreferenceChange(
                      notificationType.type,
                      'push',
                      e.target.checked
                    )}
                    disabled={!preferences.types[notificationType.type].enabled || !preferences.push.enabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${notificationType.type}-push`}
                    className="text-sm text-gray-700"
                  >
                    Push
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${notificationType.type}-sound`}
                    checked={preferences.types[notificationType.type].sound}
                    onChange={(e) => handleTypePreferenceChange(
                      notificationType.type,
                      'sound',
                      e.target.checked
                    )}
                    disabled={!preferences.types[notificationType.type].enabled}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${notificationType.type}-sound`}
                    className="text-sm text-gray-700"
                  >
                    Sound
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${notificationType.type}-vibration`}
                    checked={preferences.types[notificationType.type].vibration}
                    onChange={(e) => handleTypePreferenceChange(
                      notificationType.type,
                      'vibration',
                      e.target.checked
                    )}
                    disabled={!preferences.types[notificationType.type].enabled || !('vibrate' in navigator)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`${notificationType.type}-vibration`}
                    className="text-sm text-gray-700"
                  >
                    Vibration
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Do Not Disturb */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Do Not Disturb</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable Do Not Disturb</h3>
              <p className="text-sm text-gray-500">
                Silence notifications during specified hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.doNotDisturb.enabled}
                onChange={(e) => handleDoNotDisturbChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.doNotDisturb.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={preferences.doNotDisturb.startTime}
                    onChange={(e) => handleDoNotDisturbChange('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={preferences.doNotDisturb.endTime}
                    onChange={(e) => handleDoNotDisturbChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <label key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={preferences.doNotDisturb.days.includes(day.value)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...preferences.doNotDisturb.days, day.value]
                            : preferences.doNotDisturb.days.filter(d => d !== day.value)
                          handleDoNotDisturbChange('days', newDays)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Rate Limiting */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Rate Limiting</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable Batching</h3>
              <p className="text-sm text-gray-500">
                Group similar notifications to reduce spam
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.batching.enabled}
                onChange={(e) => handleBatchingChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.batching.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max per Minute
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.batching.maxPerMinute}
                    onChange={(e) => handleBatchingChange('maxPerMinute', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max per Hour
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={preferences.batching.maxPerHour}
                    onChange={(e) => handleBatchingChange('maxPerHour', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Group Similar</h3>
                  <p className="text-sm text-gray-500">
                    Combine notifications of the same type
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.batching.groupSimilar}
                    onChange={(e) => handleBatchingChange('groupSimilar', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Test Notification Feedback */}
      {testNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Test {testNotification.type} notification sent!
        </motion.div>
      )}
    </div>
  )
}

export default NotificationPreferences
