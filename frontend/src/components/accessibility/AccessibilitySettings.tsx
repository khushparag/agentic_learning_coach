import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  EyeIcon, 
  SpeakerWaveIcon, 
  CommandLineIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AccessibilitySettings: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  const settingGroups = [
    {
      title: 'Visual Accessibility',
      icon: <EyeIcon className="w-5 h-5" />,
      settings: [
        {
          key: 'highContrast' as const,
          label: 'High Contrast Mode',
          description: 'Increases contrast for better visibility',
          type: 'toggle' as const
        },
        {
          key: 'darkHighContrast' as const,
          label: 'Dark High Contrast Mode',
          description: 'Dark theme with high contrast',
          type: 'toggle' as const
        },
        {
          key: 'largeText' as const,
          label: 'Large Text',
          description: 'Increases text size throughout the application',
          type: 'toggle' as const
        },
        {
          key: 'fontSize' as const,
          label: 'Font Size',
          description: 'Adjust base font size',
          type: 'select' as const,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
            { value: 'extra-large', label: 'Extra Large' }
          ]
        }
      ]
    },
    {
      title: 'Motion & Animation',
      icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
      settings: [
        {
          key: 'reducedMotion' as const,
          label: 'Reduced Motion',
          description: 'Reduces or disables animations and transitions',
          type: 'toggle' as const
        }
      ]
    },
    {
      title: 'Focus & Navigation',
      icon: <CommandLineIcon className="w-5 h-5" />,
      settings: [
        {
          key: 'enhancedFocus' as const,
          label: 'Enhanced Focus Indicators',
          description: 'Makes focus indicators more visible',
          type: 'toggle' as const
        },
        {
          key: 'keyboardNavigationEnabled' as const,
          label: 'Keyboard Navigation',
          description: 'Enable keyboard shortcuts and navigation',
          type: 'toggle' as const
        },
        {
          key: 'skipLinksEnabled' as const,
          label: 'Skip Links',
          description: 'Show skip navigation links',
          type: 'toggle' as const
        },
        {
          key: 'focusIndicatorStyle' as const,
          label: 'Focus Indicator Style',
          description: 'Choose focus indicator appearance',
          type: 'select' as const,
          options: [
            { value: 'default', label: 'Default' },
            { value: 'enhanced', label: 'Enhanced' },
            { value: 'high-contrast', label: 'High Contrast' }
          ]
        }
      ]
    },
    {
      title: 'Screen Reader',
      icon: <SpeakerWaveIcon className="w-5 h-5" />,
      settings: [
        {
          key: 'screenReaderOptimized' as const,
          label: 'Screen Reader Optimization',
          description: 'Optimize interface for screen readers',
          type: 'toggle' as const
        },
        {
          key: 'announcePageChanges' as const,
          label: 'Announce Page Changes',
          description: 'Announce navigation and page changes',
          type: 'toggle' as const
        }
      ]
    }
  ];

  const handleToggle = (key: keyof typeof settings) => {
    updateSetting(key, !settings[key]);
  };

  const handleSelect = (key: keyof typeof settings, value: any) => {
    updateSetting(key, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Accessibility Settings
        </h2>
        <Button
          variant="secondary"
          onClick={resetSettings}
          icon={<ArrowPathIcon className="w-4 h-4" />}
          aria-label="Reset all accessibility settings to defaults"
        >
          Reset to Defaults
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingGroups.map((group) => (
          <Card key={group.title} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {group.icon}
              <h3 className="text-lg font-semibold text-gray-900">
                {group.title}
              </h3>
            </div>

            <div className="space-y-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label
                        htmlFor={`setting-${setting.key}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        {setting.label}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {setting.description}
                      </p>
                    </div>

                    <div className="ml-4">
                      {setting.type === 'toggle' && (
                        <button
                          id={`setting-${setting.key}`}
                          type="button"
                          role="switch"
                          aria-checked={settings[setting.key] as boolean}
                          onClick={() => handleToggle(setting.key)}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                            ${settings[setting.key] 
                              ? 'bg-primary-600' 
                              : 'bg-gray-200'
                            }
                          `}
                        >
                          <span className="sr-only">
                            {setting.label}
                          </span>
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${settings[setting.key] 
                                ? 'translate-x-6' 
                                : 'translate-x-1'
                              }
                            `}
                          />
                        </button>
                      )}

                      {setting.type === 'select' && setting.options && (
                        <select
                          id={`setting-${setting.key}`}
                          value={settings[setting.key] as string}
                          onChange={(e) => handleSelect(setting.key, e.target.value)}
                          className="
                            block w-full rounded-md border-gray-300 text-sm
                            focus:border-primary-500 focus:ring-primary-500
                          "
                        >
                          {setting.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="accessibility-announcements"
      />
    </div>
  );
};

export default AccessibilitySettings;