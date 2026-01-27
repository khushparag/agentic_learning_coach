import React, { useState } from 'react'
import {
  ComputerDesktopIcon,
  PaintBrushIcon,
  SpeakerWaveIcon,
  EyeIcon,
  CogIcon,
  BoltIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import SettingsSection from './SettingsSection'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSettings } from './useSettings'
import { 
  SUPPORTED_LANGUAGES,
  CODE_EDITOR_THEMES,
  FONT_FAMILIES,
  ACCENT_COLORS,
} from '../../types/settings'

const THEME_OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean, bright interface perfect for daytime use',
    icon: '☀️',
    preview: 'bg-white border-gray-200',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes, great for low-light environments',
    icon: '🌙',
    preview: 'bg-gray-900 border-gray-700',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Automatically match your device settings',
    icon: '🖥️',
    preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400',
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum contrast for better accessibility',
    icon: '⚫',
    preview: 'bg-black border-white',
  },
]

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  unit?: string
  showValue?: boolean
}

function Slider({ value, onChange, min, max, step = 1, label, unit, showValue = true }: SliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">{label}</span>
          {showValue && <span className="text-gray-500">{value}{unit}</span>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"></div>
    </label>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  colors: Array<{ id: string; name: string; value: string }>
}

function ColorPicker({ value, onChange, colors }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((color) => (
        <button
          key={color.id}
          onClick={() => onChange(color.value)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            value === color.value
              ? 'border-gray-400 scale-110 shadow-lg'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  )
}

export default function EnhancedSystemSettingsPanel() {
  const { settings, updateSystem } = useSettings()
  const system = settings.system
  const [previewTheme, setPreviewTheme] = useState<string | null>(null)

  const handleSystemUpdate = (updates: Partial<typeof system>) => {
    updateSystem(updates)
  }

  const resetToDefaults = () => {
    updateSystem({
      theme: 'system',
      accentColor: '#3b82f6',
      language: 'en-US',
      codeEditorTheme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      autoSave: true,
      autoSaveInterval: 30,
      enableAnimations: true,
      enableSounds: true,
      preloadContent: true,
      reducedMotion: false,
      highContrast: false,
      screenReaderMode: false,
      keyboardShortcuts: true,
      debugMode: false,
      showPerformanceMetrics: false,
      enableExperimentalFeatures: false,
    })
  }

  return (
    <div className="space-y-6">
      {/* Theme & Appearance */}
      <SettingsSection
        title="Theme & Appearance"
        description="Customize the visual appearance of the interface"
        icon={PaintBrushIcon}
      >
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Interface Theme</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {THEME_OPTIONS.map((theme) => (
                <Card
                  key={theme.value}
                  className={`cursor-pointer transition-all ${
                    (previewTheme || system.theme) === theme.value
                      ? 'ring-2 ring-blue-500 border-blue-200'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => {
                    handleSystemUpdate({ theme: theme.value as any })
                    setPreviewTheme(null)
                  }}
                  onMouseEnter={() => setPreviewTheme(theme.value)}
                  onMouseLeave={() => setPreviewTheme(null)}
                >
                  <div className="p-4">
                    <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview}`} />
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{theme.icon}</span>
                      <h5 className="font-medium text-gray-900">{theme.label}</h5>
                      {system.theme === theme.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{theme.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Accent Color</h4>
            <div className="flex items-center space-x-4">
              <ColorPicker
                value={system.accentColor || '#3b82f6'}
                onChange={(color) => handleSystemUpdate({ accentColor: color })}
                colors={ACCENT_COLORS}
              />
              <div className="text-sm text-gray-600">
                Current: {ACCENT_COLORS.find(c => c.value === system.accentColor)?.name || 'Custom'}
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interface Language
              </label>
              <Select
                value={system.language || 'en-US'}
                onChange={(language) => handleSystemUpdate({ language: String(language) })}
                options={SUPPORTED_LANGUAGES.map(lang => ({
                  value: lang.code,
                  label: lang.name,
                }))}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Code Editor Settings */}
      <SettingsSection
        title="Code Editor"
        description="Customize the code editor appearance and behavior"
        icon={CodeBracketIcon}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Editor Theme
              </label>
              <Select
                value={system.codeEditorTheme || 'vs-dark'}
                onChange={(theme) => handleSystemUpdate({ codeEditorTheme: String(theme) })}
                options={CODE_EDITOR_THEMES.map(theme => ({
                  value: theme.id,
                  label: theme.name,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <Select
                value={system.fontFamily || 'JetBrains Mono, Consolas, monospace'}
                onChange={(fontFamily) => handleSystemUpdate({ fontFamily: String(fontFamily) })}
                options={FONT_FAMILIES.map(font => ({
                  value: font.value,
                  label: font.name,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Slider
                value={system.fontSize || 14}
                onChange={(fontSize) => handleSystemUpdate({ fontSize })}
                min={10}
                max={24}
                label="Font Size"
                unit="px"
              />
            </div>

            <div>
              <Slider
                value={system.lineHeight || 1.5}
                onChange={(lineHeight) => handleSystemUpdate({ lineHeight })}
                min={1.0}
                max={2.0}
                step={0.1}
                label="Line Height"
                unit="x"
              />
            </div>

            <div>
              <Slider
                value={system.tabSize || 2}
                onChange={(tabSize) => handleSystemUpdate({ tabSize })}
                min={2}
                max={8}
                label="Tab Size"
                unit=" spaces"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Word Wrap</div>
              <div className="text-sm text-gray-600">Wrap long lines in the code editor</div>
            </div>
            <ToggleSwitch
              enabled={system.wordWrap !== false}
              onChange={(enabled) => handleSystemUpdate({ wordWrap: enabled })}
            />
          </div>

          {/* Code Editor Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-900 text-green-400 font-mono text-sm">
            <div className="mb-2 text-gray-500">// Code Editor Preview</div>
            <div style={{ fontSize: `${system.fontSize || 14}px`, lineHeight: system.lineHeight || 1.5 }}>
              <div className="text-blue-400">function</div>
              <div className="ml-4">
                <span className="text-yellow-400">calculateSum</span>
                <span className="text-white">(</span>
                <span className="text-orange-400">a</span>
                <span className="text-white">, </span>
                <span className="text-orange-400">b</span>
                <span className="text-white">{') {'}</span>
              </div>
              <div className="ml-8">
                <span className="text-purple-400">return</span>
                <span className="text-white"> a + b;</span>
              </div>
              <div className="ml-4 text-white">{'}'}</div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Performance Settings */}
      <SettingsSection
        title="Performance & Behavior"
        description="Configure performance and behavioral settings"
        icon={BoltIcon}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Auto Save</div>
                  <div className="text-sm text-gray-600">Automatically save your work</div>
                </div>
                <ToggleSwitch
                  enabled={system.autoSave !== false}
                  onChange={(enabled) => handleSystemUpdate({ autoSave: enabled })}
                />
              </div>

              {system.autoSave !== false && (
                <div className="ml-6">
                  <Slider
                    value={system.autoSaveInterval || 30}
                    onChange={(interval) => handleSystemUpdate({ autoSaveInterval: interval })}
                    min={5}
                    max={300}
                    step={5}
                    label="Auto Save Interval"
                    unit=" seconds"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Preload Content</div>
                  <div className="text-sm text-gray-600">Load content in advance for faster navigation</div>
                </div>
                <ToggleSwitch
                  enabled={system.preloadContent !== false}
                  onChange={(enabled) => handleSystemUpdate({ preloadContent: enabled })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Animations</div>
                  <div className="text-sm text-gray-600">Enable smooth transitions and animations</div>
                </div>
                <ToggleSwitch
                  enabled={system.enableAnimations !== false}
                  onChange={(enabled) => handleSystemUpdate({ enableAnimations: enabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Sound Effects</div>
                  <div className="text-sm text-gray-600">Play sounds for notifications and interactions</div>
                </div>
                <ToggleSwitch
                  enabled={system.enableSounds !== false}
                  onChange={(enabled) => handleSystemUpdate({ enableSounds: enabled })}
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Accessibility Settings */}
      <SettingsSection
        title="Accessibility"
        description="Configure accessibility features for better usability"
        icon={EyeIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Reduced Motion</div>
                <div className="text-sm text-gray-600">Minimize animations and transitions</div>
              </div>
              <ToggleSwitch
                enabled={system.reducedMotion || false}
                onChange={(enabled) => handleSystemUpdate({ reducedMotion: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">High Contrast</div>
                <div className="text-sm text-gray-600">Increase contrast for better visibility</div>
              </div>
              <ToggleSwitch
                enabled={system.highContrast || false}
                onChange={(enabled) => handleSystemUpdate({ highContrast: enabled })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Screen Reader Mode</div>
                <div className="text-sm text-gray-600">Optimize interface for screen readers</div>
              </div>
              <ToggleSwitch
                enabled={system.screenReaderMode || false}
                onChange={(enabled) => handleSystemUpdate({ screenReaderMode: enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Keyboard Shortcuts</div>
                <div className="text-sm text-gray-600">Enable keyboard navigation shortcuts</div>
              </div>
              <ToggleSwitch
                enabled={system.keyboardShortcuts !== false}
                onChange={(enabled) => handleSystemUpdate({ keyboardShortcuts: enabled })}
              />
            </div>
          </div>
        </div>

        {system.keyboardShortcuts !== false && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div><kbd className="px-2 py-1 bg-blue-200 rounded">Ctrl+S</kbd> Save</div>
              <div><kbd className="px-2 py-1 bg-blue-200 rounded">Ctrl+/</kbd> Toggle Comments</div>
              <div><kbd className="px-2 py-1 bg-blue-200 rounded">Ctrl+Enter</kbd> Submit Code</div>
              <div><kbd className="px-2 py-1 bg-blue-200 rounded">Esc</kbd> Close Modal</div>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Developer Settings */}
      <SettingsSection
        title="Developer & Advanced"
        description="Advanced settings for developers and power users"
        icon={CogIcon}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ShieldCheckIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Advanced Settings</p>
                <p>These settings are intended for developers and advanced users. Changing them may affect system performance or stability.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Debug Mode</div>
                  <div className="text-sm text-gray-600">Show debug information and logs</div>
                </div>
                <ToggleSwitch
                  enabled={system.debugMode || false}
                  onChange={(enabled) => handleSystemUpdate({ debugMode: enabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Performance Metrics</div>
                  <div className="text-sm text-gray-600">Display performance monitoring data</div>
                </div>
                <ToggleSwitch
                  enabled={system.showPerformanceMetrics || false}
                  onChange={(enabled) => handleSystemUpdate({ showPerformanceMetrics: enabled })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Experimental Features</div>
                  <div className="text-sm text-gray-600">Enable beta features and experiments</div>
                </div>
                <ToggleSwitch
                  enabled={system.enableExperimentalFeatures || false}
                  onChange={(enabled) => handleSystemUpdate({ enableExperimentalFeatures: enabled })}
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* System Information */}
      <SettingsSection
        title="System Information"
        description="Information about your system and application"
        icon={ComputerDesktopIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="font-medium text-gray-900 mb-2">Application</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Version: 1.0.0</div>
              <div>Build: 2024.01.15</div>
              <div>Environment: Production</div>
            </div>
          </Card>

          <Card className="p-4">
            <h5 className="font-medium text-gray-900 mb-2">Browser</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
              <div>Language: {navigator.language}</div>
              <div>Platform: {navigator.platform}</div>
            </div>
          </Card>
        </div>
      </SettingsSection>

      {/* Reset Settings */}
      <SettingsSection
        title="Reset Settings"
        description="Reset all system settings to their default values"
      >
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h5 className="font-medium text-red-900 mb-1">Reset All Settings</h5>
              <p className="text-sm text-red-800 mb-4">
                This will reset all system settings to their default values. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={resetToDefaults}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </Card>
      </SettingsSection>
    </div>
  )
}
