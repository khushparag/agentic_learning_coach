import React from 'react'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import SettingsTabs from './SettingsTabs'
import { useSettings } from './useSettings'
import { Button } from '../ui/Button'
import { Toast } from '../ui/Toast'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const {
    hasUnsavedChanges,
    isSaving,
    saveSettings,
    discardChanges,
    error,
  } = useSettings()

  const handleSave = async () => {
    try {
      await saveSettings()
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Manage your learning preferences and system configuration
            </p>
          </div>
        </div>

        {/* Save/Discard Actions */}
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-amber-600 font-medium">
              You have unsaved changes
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={discardChanges}
              disabled={isSaving}
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Toast
          id="settings-error"
          type="error"
          title="Error"
          message={error instanceof Error ? error.message : 'Failed to load settings'}
          isVisible={true}
          onClose={() => {}}
        />
      )}

      {/* Settings Navigation */}
      <SettingsTabs />

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {children}
      </div>

      {/* Auto-save Indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm text-amber-800">
              Auto-save in progress...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
