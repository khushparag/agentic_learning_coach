# Settings Components

A comprehensive settings management system for the Agentic Learning Coach platform. This module provides secure configuration management, user preferences, and system administration capabilities.

## Overview

The settings system is built with security, usability, and extensibility in mind. It follows the project's clean architecture principles and provides a modular approach to configuration management.

## Architecture

```
Settings System
├── SettingsLayout (Main container with navigation)
├── SettingsTabs (Navigation between setting categories)
├── LLMConfigurationPanel (AI provider configuration)
├── LearningPreferencesPanel (Learning customization)
├── NotificationSettingsPanel (Notification management)
├── PrivacySettingsPanel (Privacy and security controls)
├── SystemSettingsPanel (System preferences)
├── DataManagementPanel (Data export and account management)
├── APIKeyInput (Secure API key input with validation)
├── SettingsSection (Reusable section component)
├── useSettings (Settings state management hook)
└── useAPIKeyValidation (API key validation hook)
```

## Key Features

### 🔐 Secure LLM Configuration
- **API Key Management**: Secure input, validation, and storage of OpenAI and Anthropic API keys
- **Provider Selection**: Support for multiple LLM providers with model selection
- **Real-time Validation**: Automatic API key format and connectivity validation
- **Configuration Testing**: Test LLM configuration with sample requests
- **Usage Monitoring**: Track API usage and limits

### 🎯 Learning Preferences
- **Learning Style Selection**: Visual, hands-on, reading, and auditory learning styles
- **Difficulty Customization**: Beginner to expert difficulty levels with adaptive pacing
- **Exercise Type Preferences**: Choose preferred types of coding exercises
- **Language Selection**: Multi-language programming language preferences
- **Schedule Management**: Time zone, reminder settings, and study schedules

### 🔔 Notification Management
- **Granular Controls**: Individual toggles for different notification types
- **Delivery Methods**: Email and push notification preferences
- **Quiet Hours**: Configurable notification scheduling
- **Preview System**: See how notifications will appear
- **Permission Management**: Browser notification permission handling

### 🛡️ Privacy & Security
- **Profile Visibility**: Public, friends-only, or private profile settings
- **Data Sharing Controls**: Granular control over what data is shared
- **Security Features**: Two-factor authentication, session management
- **GDPR Compliance**: Data access, rectification, erasure, and portability rights
- **Transparency**: Clear information about data collection and usage

### ⚙️ System Configuration
- **Theme Selection**: Light, dark, and system theme options
- **Appearance Customization**: Font sizes, editor themes, and UI preferences
- **Behavior Settings**: Auto-save, animations, and sound preferences
- **Performance Optimization**: Settings for different device capabilities
- **Keyboard Shortcuts**: Customizable shortcuts and help

### 📊 Data Management
- **Data Export**: Comprehensive data export with format options (JSON, CSV)
- **Selective Export**: Choose what data to include in exports
- **Import/Backup**: Settings backup and restore functionality
- **Storage Usage**: Monitor data usage and storage limits
- **Account Deletion**: Secure account deletion with confirmation

## Security Features

### API Key Protection
```typescript
// API keys are encrypted and never logged
const validateApiKey = async (provider: 'openai' | 'anthropic', apiKey: string) => {
  // Client-side format validation
  const formatValidation = validateKeyFormat(provider, apiKey)
  if (!formatValidation.valid) return formatValidation
  
  // Server-side validation with encryption
  return await SettingsService.validateApiKey(provider, apiKey)
}
```

### Data Privacy
- All sensitive data is encrypted in transit and at rest
- API keys are stored with separate encryption keys
- No PII is logged or exposed in error messages
- GDPR-compliant data handling and user rights

### Input Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Sanitization of all user inputs
- Rate limiting on API validation requests

## Usage Examples

### Basic Settings Integration
```typescript
import { useSettings } from '../components/settings/useSettings'

function MyComponent() {
  const { settings, updateLLMConfig, saveSettings } = useSettings()
  
  const handleApiKeyChange = (apiKey: string) => {
    updateLLMConfig({ apiKey })
  }
  
  return (
    <div>
      <APIKeyInput
        provider="openai"
        value={settings.llmConfiguration.apiKey}
        onChange={handleApiKeyChange}
        label="OpenAI API Key"
        placeholder="sk-..."
      />
    </div>
  )
}
```

### API Key Validation
```typescript
import { useAPIKeyValidation } from '../components/settings/useAPIKeyValidation'

function APIKeyForm() {
  const { validateApiKey, getValidationStatus } = useAPIKeyValidation()
  
  const handleValidate = async () => {
    const result = await validateApiKey('openai', apiKey)
    if (result.valid) {
      console.log('API key is valid!')
    }
  }
  
  const status = getValidationStatus('openai')
  return <div>Status: {status.isValid ? 'Valid' : 'Invalid'}</div>
}
```

### Settings Service
```typescript
import { SettingsService } from '../services/settingsService'

// Get current settings
const settings = await SettingsService.getSettings()

// Update specific settings
await SettingsService.updateSettings({
  llmConfiguration: { apiKey: 'new-key' }
})

// Export user data
const exportResult = await SettingsService.exportData({
  includeProgress: true,
  includeSubmissions: true,
  format: 'json'
})
```

## Component API

### SettingsLayout
Main container component that provides navigation and save/discard functionality.

**Props:**
- `children: React.ReactNode` - Settings panel content

### APIKeyInput
Secure API key input component with validation and visibility toggle.

**Props:**
- `provider: 'openai' | 'anthropic'` - LLM provider
- `value: string` - Current API key value
- `onChange: (value: string) => void` - Change handler
- `label: string` - Input label
- `placeholder: string` - Input placeholder
- `description?: string` - Help text
- `required?: boolean` - Whether the field is required
- `autoValidate?: boolean` - Enable automatic validation

### SettingsSection
Reusable section component for organizing settings.

**Props:**
- `title: string` - Section title
- `description?: string` - Section description
- `icon?: React.ComponentType` - Optional icon
- `children: React.ReactNode` - Section content

## Hooks

### useSettings()
Main settings management hook with local state and auto-save.

**Returns:**
- `settings: UserSettings` - Current settings (local + server)
- `hasUnsavedChanges: boolean` - Whether there are unsaved changes
- `isSaving: boolean` - Whether save is in progress
- `saveSettings: () => Promise<void>` - Save changes to server
- `discardChanges: () => void` - Discard local changes
- `updateLLMConfig: (config: Partial<LLMConfiguration>) => void` - Update LLM config
- `updateLearningPrefs: (prefs: Partial<LearningPreferences>) => void` - Update learning preferences
- And more specific updaters...

### useAPIKeyValidation()
API key validation and testing hook.

**Returns:**
- `validateApiKey: (provider, apiKey) => Promise<APIKeyValidationResult>` - Validate API key
- `testConfiguration: (config) => Promise<TestResult>` - Test LLM configuration
- `getValidationStatus: (provider) => ValidationStatus` - Get validation status
- `isValidating: boolean` - Whether validation is in progress
- `clearValidation: (provider?) => void` - Clear validation results

## Routing

The settings system uses nested routing for different panels:

```
/settings -> Redirects to /settings/llm
/settings/llm -> LLM Configuration
/settings/learning -> Learning Preferences
/settings/notifications -> Notification Settings
/settings/privacy -> Privacy & Security
/settings/system -> System Settings
/settings/data -> Data Management
```

## State Management

Settings use a hybrid approach:
- **Local State**: Immediate UI updates and unsaved changes
- **Server State**: Persistent settings via React Query
- **Auto-save**: Configurable auto-save with user control
- **Optimistic Updates**: Immediate UI feedback with rollback on error

## Error Handling

The settings system implements comprehensive error handling:
- **Validation Errors**: Real-time client-side validation
- **Network Errors**: Graceful handling of API failures
- **Recovery**: Automatic retry and fallback mechanisms
- **User Feedback**: Clear error messages and recovery suggestions

## Accessibility

All settings components are built with accessibility in mind:
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus order and indicators
- **Color Contrast**: WCAG AA compliant color schemes
- **Responsive Design**: Mobile-friendly layouts

## Testing

The settings system includes comprehensive testing:
- **Unit Tests**: Individual component and hook testing
- **Integration Tests**: Settings flow and API integration
- **E2E Tests**: Complete user workflows
- **Security Tests**: API key handling and validation
- **Accessibility Tests**: Screen reader and keyboard navigation

## Performance

Optimizations for smooth user experience:
- **Lazy Loading**: Components loaded on demand
- **Debounced Validation**: Reduced API calls during typing
- **Caching**: Settings cached with React Query
- **Optimistic Updates**: Immediate UI feedback
- **Bundle Splitting**: Separate chunks for settings

## Future Enhancements

Planned improvements:
- **Team Settings**: Organization-level configuration
- **Advanced Themes**: Custom theme creation
- **Plugin System**: Third-party integrations
- **Backup Scheduling**: Automated settings backups
- **Audit Logging**: Settings change history
- **Mobile App**: Native mobile settings interface

## Contributing

When adding new settings:
1. Add types to `types/settings.ts`
2. Update the service in `settingsService.ts`
3. Create or update the appropriate panel component
4. Add validation logic if needed
5. Update tests and documentation
6. Follow the existing patterns for consistency

## Security Considerations

- Never log API keys or sensitive data
- Validate all inputs on both client and server
- Use HTTPS for all API communications
- Implement proper rate limiting
- Follow OWASP security guidelines
- Regular security audits and updates