import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../../services/settingsService'
import type { UserSettings, SettingsUpdateRequest } from '../../types/settings'
import { DEFAULT_SETTINGS } from '../../types/settings'

export function useSettings() {
  const queryClient = useQueryClient()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null)

  // Fetch settings
  const {
    data: settings = DEFAULT_SETTINGS,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: SettingsService.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })

  // Update local settings when server settings change
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings)
    }
  }, [settings, localSettings])

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (updates: SettingsUpdateRequest) => SettingsService.updateSettings(updates),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['settings'], updatedSettings)
      setLocalSettings(updatedSettings)
      setHasUnsavedChanges(false)
    },
    onError: (error) => {
      console.error('Failed to update settings:', error)
    },
  })

  // Reset settings mutation
  const resetMutation = useMutation({
    mutationFn: SettingsService.resetSettings,
    onSuccess: (resetSettings) => {
      queryClient.setQueryData(['settings'], resetSettings)
      setLocalSettings(resetSettings)
      setHasUnsavedChanges(false)
    },
  })

  // Update local settings and mark as changed
  const updateLocalSettings = useCallback((updates: Partial<UserSettings>) => {
    setLocalSettings(prev => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      setHasUnsavedChanges(true)
      return updated
    })
  }, [])

  // Save changes to server
  const saveSettings = useCallback(async () => {
    if (!localSettings || !hasUnsavedChanges) return

    const changes: SettingsUpdateRequest = {}
    
    // Compare with server settings to determine what changed
    if (JSON.stringify(localSettings.llmConfiguration) !== JSON.stringify(settings.llmConfiguration)) {
      changes.llmConfiguration = localSettings.llmConfiguration
    }
    if (JSON.stringify(localSettings.learningPreferences) !== JSON.stringify(settings.learningPreferences)) {
      changes.learningPreferences = localSettings.learningPreferences
    }
    if (JSON.stringify(localSettings.notifications) !== JSON.stringify(settings.notifications)) {
      changes.notifications = localSettings.notifications
    }
    if (JSON.stringify(localSettings.privacy) !== JSON.stringify(settings.privacy)) {
      changes.privacy = localSettings.privacy
    }
    if (JSON.stringify(localSettings.system) !== JSON.stringify(settings.system)) {
      changes.system = localSettings.system
    }

    if (Object.keys(changes).length > 0) {
      await updateMutation.mutateAsync(changes)
    }
  }, [localSettings, hasUnsavedChanges, settings, updateMutation])

  // Discard local changes
  const discardChanges = useCallback(() => {
    setLocalSettings(settings)
    setHasUnsavedChanges(false)
  }, [settings])

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    await resetMutation.mutateAsync()
  }, [resetMutation])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const autoSaveTimer = setTimeout(() => {
      if (localSettings?.system.autoSave) {
        saveSettings()
      }
    }, (localSettings?.system.autoSaveInterval || 30) * 1000)

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, localSettings?.system.autoSave, localSettings?.system.autoSaveInterval, saveSettings])

  // Warn about unsaved changes on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    // Settings data
    settings: localSettings || settings,
    serverSettings: settings,
    isLoading,
    error,
    
    // State
    hasUnsavedChanges,
    isSaving: updateMutation.isPending,
    isResetting: resetMutation.isPending,
    
    // Actions
    updateLocalSettings,
    saveSettings,
    discardChanges,
    resetToDefaults,
    refetch,
    
    // Specific updaters for convenience
    updateLLMConfig: (config: Partial<UserSettings['llmConfiguration']>) =>
      updateLocalSettings({ llmConfiguration: { ...localSettings?.llmConfiguration || DEFAULT_SETTINGS.llmConfiguration, ...config } }),
    
    updateLearningPrefs: (prefs: Partial<UserSettings['learningPreferences']>) =>
      updateLocalSettings({ learningPreferences: { ...localSettings?.learningPreferences || DEFAULT_SETTINGS.learningPreferences, ...prefs } }),
    
    updateNotifications: (notifications: Partial<UserSettings['notifications']>) =>
      updateLocalSettings({ notifications: { ...localSettings?.notifications || DEFAULT_SETTINGS.notifications, ...notifications } }),
    
    updatePrivacy: (privacy: Partial<UserSettings['privacy']>) =>
      updateLocalSettings({ privacy: { ...localSettings?.privacy || DEFAULT_SETTINGS.privacy, ...privacy } }),
    
    updateSystem: (system: Partial<UserSettings['system']>) =>
      updateLocalSettings({ system: { ...localSettings?.system || DEFAULT_SETTINGS.system, ...system } }),
  }
}
