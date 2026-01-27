/**
 * System Configuration Panel - Admin interface for system settings and configuration
 */

import React, { useState } from 'react'
import {
  CogIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  useSystemConfiguration,
  useUpdateSystemConfiguration,
  useExportConfiguration,
  useImportConfiguration,
  useValidateConfiguration,
} from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import type { SystemConfiguration } from '../../types/admin'

export function SystemConfigurationPanel(): JSX.Element {
  const [activeSection, setActiveSection] = useState<string>('services')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [validationResults, setValidationResults] = useState<any>(null)

  const { data: config, isLoading } = useSystemConfiguration()
  const updateConfigMutation = useUpdateSystemConfiguration()
  const exportConfigMutation = useExportConfiguration()
  const importConfigMutation = useImportConfiguration()
  const validateConfigMutation = useValidateConfiguration()

  const [localConfig, setLocalConfig] = useState<Partial<SystemConfiguration>>({})

  React.useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  const sections = [
    { id: 'services', name: 'Services', icon: CogIcon },
    { id: 'features', name: 'Features', icon: CheckCircleIcon },
    { id: 'limits', name: 'System Limits', icon: ExclamationTriangleIcon },
    { id: 'security', name: 'Security', icon: CheckCircleIcon },
    { id: 'monitoring', name: 'Monitoring', icon: ArrowPathIcon },
  ]

  const handleConfigChange = (section: string, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof SystemConfiguration],
        [key]: value,
      },
    }))
  }

  const handleSaveConfig = async () => {
    try {
      // Validate configuration first
      const validation = await validateConfigMutation.mutateAsync(localConfig)
      setValidationResults(validation)

      if (validation.valid) {
        await updateConfigMutation.mutateAsync(localConfig)
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }

  const handleExportConfig = async () => {
    try {
      const exportData = await exportConfigMutation.mutateAsync()
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export configuration:', error)
    }
  }

  const handleImportConfig = async () => {
    if (!importFile) return

    try {
      await importConfigMutation.mutateAsync({
        file: importFile,
        validate_checksum: true,
        backup_current: true,
        apply_immediately: false,
      })
      setShowImportModal(false)
      setImportFile(null)
    } catch (error) {
      console.error('Failed to import configuration:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderServicesSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Service URLs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Base URL
          </label>
          <Input
            type="url"
            value={localConfig.services?.api_base_url || ''}
            onChange={(e) => handleConfigChange('services', 'api_base_url', e.target.value)}
            placeholder="http://localhost:8000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Runner Service URL
          </label>
          <Input
            type="url"
            value={localConfig.services?.runner_service_url || ''}
            onChange={(e) => handleConfigChange('services', 'runner_service_url', e.target.value)}
            placeholder="http://localhost:8001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qdrant URL
          </label>
          <Input
            type="url"
            value={localConfig.services?.qdrant_url || ''}
            onChange={(e) => handleConfigChange('services', 'qdrant_url', e.target.value)}
            placeholder="http://localhost:6333"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Redis URL
          </label>
          <Input
            type="url"
            value={localConfig.services?.redis_url || ''}
            onChange={(e) => handleConfigChange('services', 'redis_url', e.target.value)}
            placeholder="redis://localhost:6379"
          />
        </div>
      </div>
    </div>
  )

  const renderFeaturesSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
      <div className="space-y-3">
        {Object.entries(localConfig.features || {}).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <p className="text-xs text-gray-500">
                {getFeatureDescription(key)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => handleConfigChange('features', key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderLimitsSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">System Limits</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Users
          </label>
          <Input
            type="number"
            value={localConfig.limits?.max_users || 0}
            onChange={(e) => handleConfigChange('limits', 'max_users', parseInt(e.target.value))}
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Concurrent Sessions
          </label>
          <Input
            type="number"
            value={localConfig.limits?.max_concurrent_sessions || 0}
            onChange={(e) => handleConfigChange('limits', 'max_concurrent_sessions', parseInt(e.target.value))}
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code Execution Timeout (seconds)
          </label>
          <Input
            type="number"
            value={localConfig.limits?.max_code_execution_time || 0}
            onChange={(e) => handleConfigChange('limits', 'max_code_execution_time', parseInt(e.target.value))}
            min="1"
            max="300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max File Upload Size (bytes)
          </label>
          <Input
            type="number"
            value={localConfig.limits?.max_file_upload_size || 0}
            onChange={(e) => handleConfigChange('limits', 'max_file_upload_size', parseInt(e.target.value))}
            min="1024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Limit (requests/minute)
          </label>
          <Input
            type="number"
            value={localConfig.limits?.rate_limit_requests_per_minute || 0}
            onChange={(e) => handleConfigChange('limits', 'rate_limit_requests_per_minute', parseInt(e.target.value))}
            min="1"
          />
        </div>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Timeout (minutes)
          </label>
          <Input
            type="number"
            value={localConfig.security?.session_timeout_minutes || 0}
            onChange={(e) => handleConfigChange('security', 'session_timeout_minutes', parseInt(e.target.value))}
            min="5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Min Length
          </label>
          <Input
            type="number"
            value={localConfig.security?.password_min_length || 0}
            onChange={(e) => handleConfigChange('security', 'password_min_length', parseInt(e.target.value))}
            min="6"
            max="128"
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Require Two-Factor Authentication
              </label>
              <p className="text-xs text-gray-500">
                Force all users to enable 2FA
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.security?.require_2fa || false}
                onChange={(e) => handleConfigChange('security', 'require_2fa', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CORS Origins (one per line)
          </label>
          <textarea
            value={localConfig.security?.cors_origins?.join('\n') || ''}
            onChange={(e) => handleConfigChange('security', 'cors_origins', e.target.value.split('\n').filter(Boolean))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="http://localhost:3000&#10;https://yourdomain.com"
          />
        </div>
      </div>
    </div>
  )

  const renderMonitoringSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Monitoring & Logging</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Log Level
          </label>
          <select
            value={localConfig.monitoring?.log_level || 'info'}
            onChange={(e) => handleConfigChange('monitoring', 'log_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Log Retention (days)
          </label>
          <Input
            type="number"
            value={localConfig.monitoring?.retention_days || 0}
            onChange={(e) => handleConfigChange('monitoring', 'retention_days', parseInt(e.target.value))}
            min="1"
            max="365"
          />
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Metrics Collection
              </label>
              <p className="text-xs text-gray-500">
                Collect system performance metrics
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.monitoring?.enable_metrics || false}
                onChange={(e) => handleConfigChange('monitoring', 'enable_metrics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Distributed Tracing
              </label>
              <p className="text-xs text-gray-500">
                Track requests across services
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.monitoring?.enable_tracing || false}
                onChange={(e) => handleConfigChange('monitoring', 'enable_tracing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'services':
        return renderServicesSection()
      case 'features':
        return renderFeaturesSection()
      case 'limits':
        return renderLimitsSection()
      case 'security':
        return renderSecuritySection()
      case 'monitoring':
        return renderMonitoringSection()
      default:
        return renderServicesSection()
    }
  }

  const getFeatureDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      social_learning: 'Enable peer challenges and study groups',
      gamification: 'Enable XP, badges, and achievements',
      real_time_collaboration: 'Enable live collaboration features',
      advanced_analytics: 'Enable AI-powered insights and analytics',
      experimental_features: 'Enable beta and experimental features',
    }
    return descriptions[key] || 'Feature toggle'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Manage system settings and feature flags</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExportConfig}
            disabled={exportConfigMutation.isPending}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Import Config
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.name}
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {renderSectionContent()}

            {/* Validation Results */}
            {validationResults && (
              <div className="mt-6 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">
                  {validationResults.valid ? (
                    <span className="text-green-700">✓ Configuration Valid</span>
                  ) : (
                    <span className="text-red-700">✗ Configuration Invalid</span>
                  )}
                </h4>
                {validationResults.errors?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-red-700">Errors:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {validationResults.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResults.warnings?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                    <ul className="text-sm text-yellow-600 list-disc list-inside">
                      {validationResults.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending || validateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          setImportFile(null)
        }}
        title="Import Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Import Configuration
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This will validate and import the configuration file. The current
                    configuration will be backed up automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false)
                setImportFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfig}
              disabled={!importFile || importConfigMutation.isPending}
            >
              {importConfigMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}