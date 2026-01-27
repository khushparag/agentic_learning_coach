import React, { useState, useEffect } from 'react'
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAPIKeyValidation } from './useAPIKeyValidation'

interface APIKeyInputProps {
  provider: 'openai' | 'anthropic'
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  description?: string
  required?: boolean
  autoValidate?: boolean
}

export default function APIKeyInput({
  provider,
  value,
  onChange,
  label,
  placeholder,
  description,
  required = false,
  autoValidate = true,
}: APIKeyInputProps) {
  const [showKey, setShowKey] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  
  const {
    validateApiKey,
    validateKeyFormat,
    scheduleValidation,
    getValidationStatus,
    clearValidation,
  } = useAPIKeyValidation()

  const validationStatus = getValidationStatus(provider)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle input change
  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    onChange(newValue)
    
    // Clear previous validation when key changes
    if (newValue !== value) {
      clearValidation(provider)
    }
    
    // Schedule auto-validation if enabled
    if (autoValidate && newValue.trim()) {
      scheduleValidation(provider, newValue, 1500)
    }
  }

  // Manual validation
  const handleValidate = async () => {
    if (!localValue.trim()) return
    await validateApiKey(provider, localValue)
  }

  // Format validation (client-side)
  const formatValidation = validateKeyFormat(provider, localValue)
  const hasFormatError = localValue && !formatValidation.valid

  // Determine validation state
  const getValidationIcon = () => {
    if (validationStatus.isValidating) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
      )
    }
    
    if (hasFormatError) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
    }
    
    if (validationStatus.hasBeenValidated) {
      return validationStatus.isValid ? (
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
      ) : (
        <XCircleIcon className="w-4 h-4 text-red-500" />
      )
    }
    
    return null
  }

  const getValidationMessage = () => {
    if (hasFormatError) {
      return formatValidation.error
    }
    
    if (validationStatus.error) {
      return validationStatus.error
    }
    
    if (validationStatus.isValid) {
      return 'API key is valid'
    }
    
    return null
  }

  const getValidationColor = () => {
    if (hasFormatError) return 'amber'
    if (validationStatus.error) return 'red'
    if (validationStatus.isValid) return 'green'
    return 'gray'
  }

  const validationColor = getValidationColor()
  const validationMessage = getValidationMessage()
  const validationIcon = getValidationIcon()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-20 ${
            validationColor === 'red' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
            validationColor === 'green' ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
            validationColor === 'amber' ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500' :
            ''
          }`}
        />
        
        {/* Show/Hide Toggle */}
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {validationIcon && (
            <div className="flex items-center">
              {validationIcon}
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showKey ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <p className={`text-sm ${
          validationColor === 'red' ? 'text-red-600' :
          validationColor === 'green' ? 'text-green-600' :
          validationColor === 'amber' ? 'text-amber-600' :
          'text-gray-600'
        }`}>
          {validationMessage}
        </p>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {/* Manual Validation Button */}
      {localValue && !validationStatus.isValidating && !validationStatus.hasBeenValidated && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
          className="mt-2"
        >
          Validate API Key
        </Button>
      )}

      {/* Usage Information */}
      {validationStatus.isValid && validationStatus.result?.usage && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-700">
            Usage: {validationStatus.result.usage.used} / {validationStatus.result.usage.limit} requests
          </p>
        </div>
      )}
    </div>
  )
}