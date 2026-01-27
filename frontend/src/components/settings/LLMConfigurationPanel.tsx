import React, { useState } from 'react'
import {
  KeyIcon,
  CpuChipIcon,
  PlayIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import SettingsSection from './SettingsSection'
import APIKeyInput from './APIKeyInput'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import { useSettings } from './useSettings'
import { useAPIKeyValidation } from './useAPIKeyValidation'
import { LLM_PROVIDERS } from '../../types/settings'
import type { LLMConfiguration } from '../../types/settings'

export default function LLMConfigurationPanel() {
  const { settings, updateLLMConfig } = useSettings()
  const { testConfiguration, isTesting } = useAPIKeyValidation()
  const [testResult, setTestResult] = useState<{
    success: boolean
    response?: string
    error?: string
    latency?: number
  } | null>(null)

  const llmConfig = settings.llmConfiguration
  const currentProvider = LLM_PROVIDERS.find(p => p.id === llmConfig.provider)

  const handleProviderChange = (providerId: string) => {
    const provider = LLM_PROVIDERS.find(p => p.id === providerId)
    if (provider) {
      updateLLMConfig({
        provider: provider.id,
        model: provider.defaultModel,
        apiKey: '', // Clear API key when switching providers
      })
    }
  }

  const handleTestConfiguration = async () => {
    try {
      const result = await testConfiguration(llmConfig)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      })
    }
  }

  const isConfigurationComplete = llmConfig.apiKey && llmConfig.provider && llmConfig.model

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <SettingsSection
        title="AI Provider"
        description="Choose your preferred AI provider for exercise generation and feedback"
        icon={CpuChipIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LLM_PROVIDERS.map((provider) => (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all ${
                llmConfig.provider === provider.id
                  ? 'ring-2 ring-blue-500 border-blue-200'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => handleProviderChange(provider.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{provider.name}</h4>
                  {llmConfig.provider === provider.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                <div className="text-xs text-gray-500">
                  Models: {provider.models.join(', ')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SettingsSection>

      {/* API Configuration */}
      <SettingsSection
        title="API Configuration"
        description="Configure your API credentials and model settings"
        icon={KeyIcon}
      >
        <div className="space-y-4">
          {/* API Key Input */}
          <APIKeyInput
            provider={llmConfig.provider}
            value={llmConfig.apiKey}
            onChange={(apiKey) => updateLLMConfig({ apiKey })}
            label={`${currentProvider?.name} API Key`}
            placeholder={llmConfig.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            description={`Enter your ${currentProvider?.name} API key for AI-powered features`}
            required
            autoValidate
          />

          {/* Model Selection */}
          {currentProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <Select
                value={llmConfig.model}
                onChange={(model) => updateLLMConfig({ model: String(model) })}
                options={currentProvider.models.map(model => ({
                  value: model,
                  label: model,
                }))}
                placeholder="Select a model"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose the AI model for content generation
              </p>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={llmConfig.temperature || 0.7}
                onChange={(e) => updateLLMConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0)</span>
                <span className="font-medium">{llmConfig.temperature || 0.7}</span>
                <span>Creative (2)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={llmConfig.maxTokens || 2000}
                onChange={(e) => updateLLMConfig({ maxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum response length
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Test Configuration */}
      <SettingsSection
        title="Test Configuration"
        description="Verify your AI configuration is working correctly"
        icon={PlayIcon}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Test your current configuration with a sample request
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will make a small API call to verify connectivity and settings
              </p>
            </div>
            <Button
              onClick={handleTestConfiguration}
              disabled={!isConfigurationComplete || isTesting}
              loading={isTesting}
              variant="outline"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Test Configuration
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  testResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {testResult.success ? (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Configuration Test Passed' : 'Configuration Test Failed'}
                  </h4>
                  {testResult.latency && (
                    <p className="text-sm text-green-700 mt-1">
                      Response time: {testResult.latency}ms
                    </p>
                  )}
                  {testResult.response && (
                    <p className="text-sm text-green-700 mt-1">
                      Sample response: "{testResult.response}"
                    </p>
                  )}
                  {testResult.error && (
                    <p className="text-sm text-red-700 mt-1">
                      Error: {testResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Configuration Tips */}
      <SettingsSection
        title="Configuration Tips"
        icon={InformationCircleIcon}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>API Key Security:</strong> Your API keys are encrypted and stored securely. 
              They are never logged or shared with third parties.
            </div>
            <div>
              <strong>Model Selection:</strong> GPT-4 provides the highest quality but costs more. 
              GPT-3.5-turbo is faster and more cost-effective for most use cases.
            </div>
            <div>
              <strong>Temperature Setting:</strong> Lower values (0.1-0.3) for consistent, focused responses. 
              Higher values (0.7-1.0) for more creative and varied outputs.
            </div>
            <div>
              <strong>Token Limits:</strong> Higher token limits allow for longer responses but increase costs. 
              2000 tokens is usually sufficient for most exercises and feedback.
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}