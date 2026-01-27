# Enhanced Settings Components

## Overview

The enhanced settings system provides comprehensive configuration options for learning preferences, notifications, privacy, and system settings. This implementation follows clean architecture principles and provides an intuitive user experience.

## Architecture

### Component Structure
```
settings/
├── EnhancedLearningPreferencesPanel.tsx    # Learning style & preferences
├── EnhancedNotificationSettingsPanel.tsx   # Notification management
├── EnhancedPrivacySettingsPanel.tsx        # Privacy & data controls
├── EnhancedSystemSettingsPanel.tsx         # Theme & system settings
├── SettingsSection.tsx                     # Reusable section wrapper
├── useSettings.ts                          # Settings state management
└── settingsService.ts                      # API integration
```

### Type Definitions
```typescript
// Core settings interfaces
interface LearningPreferences {
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'auditory'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  pacePreference: 'slow' | 'normal' | 'fast'
  contentComplexity: 'simple' | 'balanced' | 'comprehensive'
  practiceToTheoryRatio: number // 0-100
  // ... additional preferences
}

interface NotificationSettings {
  achievements: boolean
  reminders: boolean
  social: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    days: number[]
  }
  frequency: {
    achievements: 'immediate' | 'daily' | 'weekly'
    reminders: 'daily' | 'weekly' | 'custom'
    social: 'immediate' | 'hourly' | 'daily'
  }
  // ... additional settings
}
```

## Components

### EnhancedLearningPreferencesPanel

**Purpose**: Comprehensive learning style and preference configuration

**Key Features**:
- Interactive learning style selection with visual cards
- Difficulty and pace configuration with detailed descriptions
- Exercise type selection with multi-select capability
- Programming language preferences with icon grid
- Schedule management with time slot selection
- Accessibility options for inclusive learning

**Usage**:
```tsx
import EnhancedLearningPreferencesPanel from './EnhancedLearningPreferencesPanel'

function SettingsPage() {
  return <EnhancedLearningPreferencesPanel />
}
```

**Props**: None (uses settings context)

### EnhancedNotificationSettingsPanel

**Purpose**: Complete notification management and delivery configuration

**Key Features**:
- Master notification control with global enable/disable
- Categorized notifications (learning, social, system)
- Delivery method configuration (in-app, email, push, SMS)
- Quiet hours with customizable schedules
- Test notification functionality
- Sound and visual effect controls

**Usage**:
```tsx
import EnhancedNotificationSettingsPanel from './EnhancedNotificationSettingsPanel'

function NotificationSettings() {
  return <EnhancedNotificationSettingsPanel />
}
```

**Integration**:
- Requires `useNotifications` hook for notification system integration
- Integrates with browser push notification API
- Supports permission request handling

### EnhancedPrivacySettingsPanel

**Purpose**: Comprehensive privacy and data control management

**Key Features**:
- Profile visibility controls (public, friends, private)
- Granular content sharing preferences
- Social feature management
- Communication settings with moderation
- Data retention and deletion controls
- GDPR compliance features (export, deletion, correction)

**Usage**:
```tsx
import EnhancedPrivacySettingsPanel from './EnhancedPrivacySettingsPanel'

function PrivacySettings() {
  return <EnhancedPrivacySettingsPanel />
}
```

**Security Features**:
- Secure account deletion with typed confirmation
- Data export functionality
- Privacy-by-design principles
- Audit trail integration

### EnhancedSystemSettingsPanel

**Purpose**: Theme customization and system configuration

**Key Features**:
- Theme selection with real-time preview
- Accent color customization with color picker
- Code editor configuration (theme, font, spacing)
- Performance settings (auto-save, animations, sounds)
- Accessibility features (reduced motion, high contrast)
- Developer tools (debug mode, performance metrics)

**Usage**:
```tsx
import EnhancedSystemSettingsPanel from './EnhancedSystemSettingsPanel'

function SystemSettings() {
  return <EnhancedSystemSettingsPanel />
}
```

**Theme Integration**:
- CSS custom properties for dynamic theming
- System theme detection
- High contrast accessibility support

## Reusable Components

### ToggleSwitch
```tsx
interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  // Implementation with accessibility support
}
```

### Slider
```tsx
interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  unit?: string
}

function Slider(props: SliderProps) {
  // Range slider with visual feedback
}
```

### ColorPicker
```tsx
interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors: Array<{ id: string; name: string; value: string }>
}

function ColorPicker(props: ColorPickerProps) {
  // Grid-based color selection
}
```

## State Management

### useSettings Hook

**Purpose**: Centralized settings state management with optimistic updates

```tsx
const {
  settings,           // Current settings object
  hasUnsavedChanges, // Boolean flag for unsaved changes
  isSaving,          // Loading state for save operations
  updateLearningPrefs, // Update learning preferences
  updateNotifications, // Update notification settings
  updatePrivacy,     // Update privacy settings
  updateSystem,      // Update system settings
  saveSettings,      // Persist changes to server
  discardChanges,    // Revert to last saved state
  resetToDefaults    // Reset all settings to defaults
} = useSettings()
```

**Features**:
- Optimistic updates for immediate UI feedback
- Auto-save functionality with configurable intervals
- Conflict resolution for concurrent changes
- Rollback capability for failed operations

### Settings Service

**Purpose**: API integration layer for settings persistence

```tsx
class SettingsService {
  static async getSettings(): Promise<UserSettings>
  static async updateSettings(updates: SettingsUpdateRequest): Promise<UserSettings>
  static async resetSettings(): Promise<UserSettings>
  static async exportData(request: DataExportRequest): Promise<DataExportResponse>
  static async deleteAccount(request: AccountDeletionRequest): Promise<{ success: boolean }>
}
```

## Integration Guidelines

### Adding New Settings

1. **Update Type Definitions**:
```tsx
// Add to appropriate interface in types/settings.ts
interface LearningPreferences {
  // existing properties...
  newSetting: boolean
}
```

2. **Update Default Values**:
```tsx
// Update DEFAULT_SETTINGS in types/settings.ts
export const DEFAULT_SETTINGS: UserSettings = {
  learningPreferences: {
    // existing defaults...
    newSetting: false
  }
}
```

3. **Add UI Component**:
```tsx
// In appropriate enhanced panel component
<ToggleSwitch
  enabled={prefs.newSetting}
  onChange={(enabled) => updateLearningPrefs({ newSetting: enabled })}
/>
```

4. **Update Backend Schema**:
```sql
-- Add column to appropriate table
ALTER TABLE learning_profiles 
ADD COLUMN new_setting BOOLEAN DEFAULT FALSE;
```

### Custom Validation

```tsx
// Add validation in useSettings hook
const validateSettings = (settings: Partial<UserSettings>): ValidationResult => {
  const errors: string[] = []
  
  if (settings.learningPreferences?.weeklyGoalHours) {
    if (settings.learningPreferences.weeklyGoalHours < 1 || 
        settings.learningPreferences.weeklyGoalHours > 168) {
      errors.push('Weekly goal hours must be between 1 and 168')
    }
  }
  
  return { valid: errors.length === 0, errors }
}
```

### Theme Integration

```tsx
// CSS custom properties for theme support
:root {
  --accent-color: #3b82f6;
  --background-color: #ffffff;
  --text-color: #1f2937;
}

[data-theme="dark"] {
  --background-color: #1f2937;
  --text-color: #f9fafb;
}

// Component usage
const ThemeAwareComponent = () => (
  <div style={{ 
    backgroundColor: 'var(--background-color)',
    color: 'var(--text-color)'
  }}>
    Content
  </div>
)
```

## Accessibility

### WCAG 2.1 Compliance

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text
- **Focus Management**: Visible focus indicators and logical tab order
- **Reduced Motion**: Respects user's motion preferences

### Implementation Examples

```tsx
// Accessible toggle switch
<label className="sr-only">Enable notifications</label>
<input
  type="checkbox"
  checked={enabled}
  onChange={onChange}
  className="sr-only peer"
  aria-describedby="toggle-description"
/>
<div id="toggle-description" className="text-sm text-gray-600">
  Get notified about learning progress and achievements
</div>
```

## Performance Optimization

### Lazy Loading
```tsx
// Lazy load settings panels
const EnhancedLearningPreferencesPanel = lazy(() => 
  import('./EnhancedLearningPreferencesPanel')
)

// Usage with Suspense
<Suspense fallback={<SettingsLoadingSkeleton />}>
  <EnhancedLearningPreferencesPanel />
</Suspense>
```

### Memoization
```tsx
// Memoize expensive computations
const memoizedSettings = useMemo(() => {
  return processSettings(rawSettings)
}, [rawSettings])

// Memoize components with React.memo
export default React.memo(SettingsPanel, (prevProps, nextProps) => {
  return prevProps.settings === nextProps.settings
})
```

### Debounced Updates
```tsx
// Debounce API calls for frequent changes
const debouncedSave = useCallback(
  debounce((settings: UserSettings) => {
    SettingsService.updateSettings(settings)
  }, 1000),
  []
)
```

## Testing

### Unit Tests
```tsx
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import EnhancedLearningPreferencesPanel from './EnhancedLearningPreferencesPanel'

test('updates learning style when card is clicked', () => {
  render(<EnhancedLearningPreferencesPanel />)
  
  const visualCard = screen.getByText('Visual Learner')
  fireEvent.click(visualCard)
  
  expect(mockUpdateLearningPrefs).toHaveBeenCalledWith({
    learningStyle: 'visual'
  })
})
```

### Integration Tests
```tsx
// Settings persistence testing
test('saves settings to backend when save button is clicked', async () => {
  const mockSave = jest.spyOn(SettingsService, 'updateSettings')
  
  render(<SettingsPage />)
  
  // Make changes
  fireEvent.click(screen.getByText('Visual Learner'))
  fireEvent.click(screen.getByText('Save Changes'))
  
  await waitFor(() => {
    expect(mockSave).toHaveBeenCalledWith({
      learningPreferences: { learningStyle: 'visual' }
    })
  })
})
```

## Security Considerations

### Input Validation
```tsx
// Client-side validation
const validateInput = (value: string, type: 'email' | 'number' | 'text') => {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case 'number':
      return !isNaN(Number(value)) && Number(value) >= 0
    default:
      return value.length > 0 && value.length <= 255
  }
}
```

### XSS Prevention
```tsx
// Sanitize user input
import DOMPurify from 'dompurify'

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}
```

### CSRF Protection
```tsx
// Include CSRF token in API requests
const updateSettings = async (settings: UserSettings) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  
  return fetch('/api/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(settings)
  })
}
```

## Troubleshooting

### Common Issues

1. **Settings Not Persisting**:
   - Check network connectivity
   - Verify API endpoint availability
   - Check browser console for errors
   - Ensure proper authentication

2. **Theme Not Applying**:
   - Verify CSS custom properties are loaded
   - Check for conflicting CSS rules
   - Ensure theme value is valid
   - Clear browser cache

3. **Notifications Not Working**:
   - Check browser permission status
   - Verify notification service worker registration
   - Test with different notification types
   - Check quiet hours configuration

### Debug Mode

Enable debug mode in system settings to access additional troubleshooting information:

```tsx
// Debug information display
{system.debugMode && (
  <div className="debug-panel">
    <h4>Debug Information</h4>
    <pre>{JSON.stringify(settings, null, 2)}</pre>
    <button onClick={() => console.log('Settings state:', settings)}>
      Log Settings to Console
    </button>
  </div>
)}
```

## Migration Guide

### From Legacy Settings

1. **Backup Current Settings**:
```tsx
const backupSettings = async () => {
  const current = await SettingsService.getSettings()
  localStorage.setItem('settings-backup', JSON.stringify(current))
}
```

2. **Migrate Data Structure**:
```tsx
const migrateSettings = (legacy: LegacySettings): UserSettings => {
  return {
    learningPreferences: {
      learningStyle: legacy.style || 'hands-on',
      difficulty: legacy.level || 'intermediate',
      // ... map other fields
    },
    // ... migrate other sections
  }
}
```

3. **Validate Migration**:
```tsx
const validateMigration = (migrated: UserSettings): boolean => {
  // Validate all required fields are present
  // Check data types and ranges
  // Ensure no data loss
  return true
}
```

This enhanced settings system provides a comprehensive, user-friendly, and maintainable solution for managing all aspects of the learning platform configuration.