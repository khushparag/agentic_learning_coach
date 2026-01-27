import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { SettingsService } from '../../services/settingsService'
import type { APIKeyValidationResult, LLMConfiguration } from '../../types/settings'

interface ValidationState {
  isValidating: boolean
  lastValidated: string | null
  validationResults: Record<string, APIKeyValidationResult>
  errors: Record<string, string>
}

export function useAPIKeyValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    lastValidated: null,
    validationResults: {},
    errors: {},
  })

  // Validate API key mutation
  const validateMutation = useMutation({
    mutationFn: ({ provider, apiKey }: { provider: 'openai' | 'anthropic'; apiKey: string }) =>
      SettingsService.validateApiKey(provider, apiKey),
    onSuccess: (result, { provider }) => {
      setValidationState(prev => ({
        ...prev,
        validationResults: {
          ...prev.validationResults,
          [provider]: result,
        },
        errors: {
          ...prev.errors,
          [provider]: result.valid ? '' : result.error || 'Validation failed',
        },
        lastValidated: new Date().toISOString(),
      }))
    },
    onError: (error, { provider }) => {
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [provider]: error instanceof Error ? error.message : 'Validation failed',
        },
      }))
    },
  })

  // Test LLM configuration mutation
  const testConfigMutation = useMutation({
    mutationFn: (config: LLMConfiguration) => SettingsService.testLLMConfiguration(config),
    onError: (error) => {
      console.error('LLM configuration test failed:', error)
    },
  })

  // Validate API key
  const validateApiKey = useCallback(
    async (provider: 'openai' | 'anthropic', apiKey: string): Promise<APIKeyValidationResult> => {
      if (!apiKey.trim()) {
        const result: APIKeyValidationResult = {
          valid: false,
          provider,
          error: 'API key is required',
        }
        
        setValidationState(prev => ({
          ...prev,
          validationResults: { ...prev.validationResults, [provider]: result },
          errors: { ...prev.errors, [provider]: result.error! },
        }))
        
        return result
      }

      setValidationState(prev => ({ ...prev, isValidating: true }))
      
      try {
        const result = await validateMutation.mutateAsync({ provider, apiKey })
        return result
      } finally {
        setValidationState(prev => ({ ...prev, isValidating: false }))
      }
    },
    [validateMutation]
  )

  // Test complete LLM configuration
  const testConfiguration = useCallback(
    async (config: LLMConfiguration) => {
      return testConfigMutation.mutateAsync(config)
    },
    [testConfigMutation]
  )

  // Get validation status for a provider
  const getValidationStatus = useCallback(
    (provider: 'openai' | 'anthropic') => {
      const result = validationState.validationResults[provider]
      const error = validationState.errors[provider]
      
      return {
        isValid: result?.valid || false,
        isValidating: validateMutation.isPending,
        error,
        result,
        hasBeenValidated: !!result,
      }
    },
    [validationState, validateMutation.isPending]
  )

  // Clear validation results
  const clearValidation = useCallback((provider?: 'openai' | 'anthropic') => {
    setValidationState(prev => {
      if (provider) {
        const { [provider]: _, ...restResults } = prev.validationResults
        const { [provider]: __, ...restErrors } = prev.errors
        return {
          ...prev,
          validationResults: restResults,
          errors: restErrors,
        }
      } else {
        return {
          ...prev,
          validationResults: {},
          errors: {},
          lastValidated: null,
        }
      }
    })
  }, [])

  // Validate API key format (basic client-side validation)
  const validateKeyFormat = useCallback((provider: 'openai' | 'anthropic', apiKey: string) => {
    if (!apiKey) return { valid: false, error: 'API key is required' }
    
    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API keys must start with "sk-"' }
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'OpenAI API key appears to be too short' }
        }
        break
        
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' }
        }
        if (apiKey.length < 30) {
          return { valid: false, error: 'Anthropic API key appears to be too short' }
        }
        break
    }
    
    return { valid: true }
  }, [])

  // Auto-validate when API key changes (debounced)
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, NodeJS.Timeout>>({})
  
  const scheduleValidation = useCallback(
    (provider: 'openai' | 'anthropic', apiKey: string, delay = 2000) => {
      // Clear existing timeout
      if (validationTimeouts[provider]) {
        clearTimeout(validationTimeouts[provider])
      }
      
      // Schedule new validation
      const timeout = setTimeout(() => {
        if (apiKey.trim()) {
          validateApiKey(provider, apiKey)
        }
      }, delay)
      
      setValidationTimeouts(prev => ({ ...prev, [provider]: timeout }))
    },
    [validateApiKey, validationTimeouts]
  )

  return {
    // State
    isValidating: validationState.isValidating || validateMutation.isPending,
    isTesting: testConfigMutation.isPending,
    lastValidated: validationState.lastValidated,
    
    // Actions
    validateApiKey,
    testConfiguration,
    clearValidation,
    validateKeyFormat,
    scheduleValidation,
    
    // Getters
    getValidationStatus,
    
    // Results
    validationResults: validationState.validationResults,
    errors: validationState.errors,
  }
}