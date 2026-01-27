import api from './api'
import type {
  UserSettings,
  SettingsUpdateRequest,
  SettingsResponse,
  APIKeyValidationResult,
  DataExportRequest,
  DataExportResponse,
  AccountDeletionRequest,
  LLMConfiguration,
} from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'

// Local storage key for persisting settings
const SETTINGS_STORAGE_KEY = 'learning_coach_settings'

// Helper to get settings from local storage
const getStoredSettings = (): UserSettings | null => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to parse stored settings:', error)
  }
  return null
}

// Helper to save settings to local storage
const saveStoredSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save settings to local storage:', error)
  }
}

export class SettingsService {
  private static readonly BASE_PATH = '/api/settings'

  /**
   * Get current user settings
   */
  static async getSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<SettingsResponse>(`${this.BASE_PATH}`)
      const settings = response.data.settings
      // Save to local storage for offline access
      saveStoredSettings(settings)
      return settings
    } catch (error) {
      console.warn('Failed to fetch settings from API, using local/default settings:', error)
      // Try to get from local storage first, then fall back to defaults
      const storedSettings = getStoredSettings()
      return storedSettings || { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() }
    }
  }

  /**
   * Update user settings (partial update)
   */
  static async updateSettings(updates: SettingsUpdateRequest): Promise<UserSettings> {
    try {
      const response = await api.patch<SettingsResponse>(`${this.BASE_PATH}`, updates)
      const settings = response.data.settings
      saveStoredSettings(settings)
      return settings
    } catch (error) {
      console.warn('Failed to update settings via API, updating locally:', error)
      // Update locally when API is unavailable
      const currentSettings = getStoredSettings() || { ...DEFAULT_SETTINGS }
      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...updates.llmConfiguration && { llmConfiguration: { ...currentSettings.llmConfiguration, ...updates.llmConfiguration } },
        ...updates.learningPreferences && { learningPreferences: { ...currentSettings.learningPreferences, ...updates.learningPreferences } },
        ...updates.notifications && { notifications: { ...currentSettings.notifications, ...updates.notifications } },
        ...updates.privacy && { privacy: { ...currentSettings.privacy, ...updates.privacy } },
        ...updates.system && { system: { ...currentSettings.system, ...updates.system } },
        updatedAt: new Date().toISOString(),
      }
      saveStoredSettings(updatedSettings)
      return updatedSettings
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<UserSettings> {
    try {
      const response = await api.post<SettingsResponse>(`${this.BASE_PATH}/reset`)
      const settings = response.data.settings
      saveStoredSettings(settings)
      return settings
    } catch (error) {
      console.warn('Failed to reset settings via API, resetting locally:', error)
      const defaultSettings = { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() }
      saveStoredSettings(defaultSettings)
      return defaultSettings
    }
  }

  /**
   * Validate API key for LLM provider
   */
  static async validateApiKey(
    provider: 'openai' | 'anthropic',
    apiKey: string
  ): Promise<APIKeyValidationResult> {
    try {
      const response = await api.post<APIKeyValidationResult>(
        `${this.BASE_PATH}/validate-api-key`,
        { provider, apiKey }
      )
      return response.data
    } catch (error) {
      console.warn('Failed to validate API key via API:', error)
      // Return a mock validation result when API is unavailable
      return {
        valid: apiKey.length > 10, // Basic validation
        provider,
        error: apiKey.length <= 10 ? 'API key appears to be too short' : undefined,
        models: provider === 'openai' 
          ? ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
          : ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      }
    }
  }

  /**
   * Test LLM configuration
   */
  static async testLLMConfiguration(config: LLMConfiguration): Promise<{
    success: boolean
    response?: string
    error?: string
    latency?: number
  }> {
    try {
      const response = await api.post<{
        success: boolean
        response?: string
        error?: string
        latency?: number
      }>(`${this.BASE_PATH}/test-llm`, config)
      return response.data
    } catch (error) {
      console.warn('Failed to test LLM configuration via API:', error)
      // Return a mock test result when API is unavailable
      return {
        success: false,
        error: 'API unavailable - configuration saved locally but cannot be tested',
        latency: 0,
      }
    }
  }

  /**
   * Get available LLM models for a provider
   */
  static async getAvailableModels(provider: 'openai' | 'anthropic'): Promise<string[]> {
    try {
      const response = await api.get<{ models: string[] }>(
        `${this.BASE_PATH}/models/${provider}`
      )
      return response.data.models
    } catch (error) {
      console.warn('Failed to fetch models via API, using defaults:', error)
      // Return default models when API is unavailable
      return provider === 'openai'
        ? ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
        : ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    }
  }

  /**
   * Export user data
   */
  static async exportData(request: DataExportRequest): Promise<DataExportResponse> {
    try {
      const response = await api.post<DataExportResponse>(`${this.BASE_PATH}/export`, request)
      return response.data
    } catch (error) {
      console.warn('Failed to export data via API:', error)
      // Return a mock response when API is unavailable
      return {
        success: false,
        downloadUrl: '',
        expiresAt: new Date().toISOString(),
        fileSize: 0,
        format: request.format,
      }
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(request: AccountDeletionRequest): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`${this.BASE_PATH}/account`, { data: request })
      return response.data
    } catch (error) {
      console.warn('Failed to delete account via API:', error)
      return { success: false }
    }
  }

  /**
   * Get system information for debugging
   */
  static async getSystemInfo(): Promise<{
    version: string
    environment: string
    features: Record<string, boolean>
    limits: Record<string, number>
  }> {
    try {
      const response = await api.get<{
        version: string
        environment: string
        features: Record<string, boolean>
        limits: Record<string, number>
      }>(`${this.BASE_PATH}/system-info`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch system info via API, using defaults:', error)
      // Return mock system info when API is unavailable
      return {
        version: '1.0.0',
        environment: 'development',
        features: {
          gamification: true,
          collaboration: true,
          analytics: true,
          aiAssistant: true,
        },
        limits: {
          maxExercisesPerDay: 50,
          maxCodeLength: 50000,
          maxFileSize: 10485760,
        },
      }
    }
  }

  /**
   * Update LLM configuration specifically
   */
  static async updateLLMConfiguration(config: Partial<LLMConfiguration>): Promise<UserSettings> {
    return this.updateSettings({ llmConfiguration: config })
  }

  /**
   * Get usage statistics for API keys
   */
  static async getApiKeyUsage(): Promise<{
    openai?: {
      used: number
      limit: number
      resetDate: string
    }
    anthropic?: {
      used: number
      limit: number
      resetDate: string
    }
  }> {
    try {
      const response = await api.get<{
        openai?: {
          used: number
          limit: number
          resetDate: string
        }
        anthropic?: {
          used: number
          limit: number
          resetDate: string
        }
      }>(`${this.BASE_PATH}/api-key-usage`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch API key usage via API:', error)
      // Return mock usage data when API is unavailable
      return {
        openai: {
          used: 0,
          limit: 10000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        anthropic: {
          used: 0,
          limit: 10000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }
    }
  }

  /**
   * Clear stored API keys (for security)
   */
  static async clearApiKeys(): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`${this.BASE_PATH}/api-keys`)
      return response.data
    } catch (error) {
      console.warn('Failed to clear API keys via API, clearing locally:', error)
      // Clear API keys from local storage
      const currentSettings = getStoredSettings()
      if (currentSettings) {
        currentSettings.llmConfiguration.apiKey = ''
        saveStoredSettings(currentSettings)
      }
      return { success: true }
    }
  }

  /**
   * Import settings from file
   */
  static async importSettings(settingsData: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await api.post<SettingsResponse>(`${this.BASE_PATH}/import`, settingsData)
      const settings = response.data.settings
      saveStoredSettings(settings)
      return settings
    } catch (error) {
      console.warn('Failed to import settings via API, importing locally:', error)
      // Import settings locally when API is unavailable
      const currentSettings = getStoredSettings() || { ...DEFAULT_SETTINGS }
      const importedSettings: UserSettings = {
        ...currentSettings,
        ...settingsData,
        updatedAt: new Date().toISOString(),
      } as UserSettings
      saveStoredSettings(importedSettings)
      return importedSettings
    }
  }

  /**
   * Get settings backup
   */
  static async backupSettings(): Promise<{
    backup: UserSettings
    timestamp: string
    checksum: string
  }> {
    try {
      const response = await api.get<{
        backup: UserSettings
        timestamp: string
        checksum: string
      }>(`${this.BASE_PATH}/backup`)
      return response.data
    } catch (error) {
      console.warn('Failed to get backup via API, using local settings:', error)
      // Return local settings as backup when API is unavailable
      const settings = getStoredSettings() || { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() }
      return {
        backup: settings,
        timestamp: new Date().toISOString(),
        checksum: btoa(JSON.stringify(settings)).slice(0, 32),
      }
    }
  }

  /**
   * Restore settings from backup
   */
  static async restoreSettings(backup: {
    backup: UserSettings
    checksum: string
  }): Promise<UserSettings> {
    try {
      const response = await api.post<SettingsResponse>(`${this.BASE_PATH}/restore`, backup)
      const settings = response.data.settings
      saveStoredSettings(settings)
      return settings
    } catch (error) {
      console.warn('Failed to restore settings via API, restoring locally:', error)
      // Restore settings locally when API is unavailable
      saveStoredSettings(backup.backup)
      return backup.backup
    }
  }
}
