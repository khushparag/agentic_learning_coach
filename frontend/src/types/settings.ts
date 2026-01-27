// =============================================================================
// Settings Types - TypeScript interfaces for settings management
// =============================================================================

export interface LLMProvider {
  id: 'openai' | 'anthropic'
  name: string
  description: string
  models: string[]
  defaultModel: string
  requiresApiKey: boolean
}

export interface LLMConfiguration {
  provider: 'openai' | 'anthropic'
  model: string
  apiKey: string
  temperature?: number
  maxTokens?: number
  customEndpoint?: string
}

export interface APIKeyValidationResult {
  valid: boolean
  provider: 'openai' | 'anthropic'
  error?: string
  models?: string[]
  usage?: {
    used: number
    limit: number
  }
}

export interface LearningPreferences {
  // Learning Style & Approach
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'auditory'
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  pacePreference: 'slow' | 'normal' | 'fast'
  feedbackDetail: 'minimal' | 'standard' | 'detailed'
  
  // Content Preferences
  exerciseTypes: string[]
  preferredLanguages: string[]
  contentComplexity: 'simple' | 'balanced' | 'comprehensive'
  practiceToTheoryRatio: number // 0-100, higher means more practice
  
  // Learning Environment
  focusMode: boolean
  backgroundMusic: boolean
  darkModeForCoding: boolean
  codeEditorTheme: string
  fontSize: number
  
  // Schedule & Timing
  timeZone: string
  studyReminders: boolean
  reminderTime: string
  preferredStudyTimes: string[] // Array of time slots like ['09:00', '14:00', '20:00']
  weeklyGoalHours: number
  breakReminders: boolean
  breakInterval: number // minutes
  
  // Motivation & Gamification
  showProgress: boolean
  celebrateAchievements: boolean
  competitiveMode: boolean
  streakMotivation: boolean
  
  // Accessibility
  highContrast: boolean
  reducedMotion: boolean
  screenReaderOptimized: boolean
  keyboardNavigationOnly: boolean
}

export interface NotificationSettings {
  // Learning Notifications
  achievements: boolean
  reminders: boolean
  weeklyProgress: boolean
  streakReminders: boolean
  
  // Social Notifications
  social: boolean
  challengeInvites: boolean
  studyGroupActivity: boolean
  mentorMessages: boolean
  
  // System Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  
  // Notification Timing
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    days: number[] // 0-6, Sunday = 0
  }
  
  // Notification Frequency
  frequency: {
    achievements: 'immediate' | 'daily' | 'weekly'
    reminders: 'daily' | 'weekly' | 'custom'
    social: 'immediate' | 'hourly' | 'daily'
  }
  
  // Delivery Preferences
  deliveryMethods: {
    inApp: boolean
    email: boolean
    push: boolean
    sms: boolean
  }
}

export interface PrivacySettings {
  // Profile Visibility
  profileVisibility: 'public' | 'friends' | 'private'
  shareProgress: boolean
  shareAchievements: boolean
  shareCodeSolutions: boolean
  
  // Social Features
  allowChallenges: boolean
  allowStudyGroupInvites: boolean
  allowMentoring: boolean
  showOnlineStatus: boolean
  
  // Data Sharing
  dataCollection: boolean
  analyticsOptIn: boolean
  improvementSuggestions: boolean
  researchParticipation: boolean
  
  // Communication
  allowDirectMessages: boolean
  allowPublicComments: boolean
  moderateComments: boolean
  
  // Data Export & Control
  dataRetentionPeriod: number // days, 0 = indefinite
  autoDeleteInactiveData: boolean
}

export interface SystemSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system' | 'high-contrast'
  accentColor: string
  language: string
  
  // Editor Settings
  codeEditorTheme: string
  fontSize: number
  fontFamily: string
  lineHeight: number
  tabSize: number
  wordWrap: boolean
  
  // Performance
  autoSave: boolean
  autoSaveInterval: number
  enableAnimations: boolean
  enableSounds: boolean
  preloadContent: boolean
  
  // Accessibility
  reducedMotion: boolean
  highContrast: boolean
  screenReaderMode: boolean
  keyboardShortcuts: boolean
  
  // Development
  debugMode: boolean
  showPerformanceMetrics: boolean
  enableExperimentalFeatures: boolean
}

export interface UserSettings {
  llmConfiguration: LLMConfiguration
  learningPreferences: LearningPreferences
  notifications: NotificationSettings
  privacy: PrivacySettings
  system: SystemSettings
  updatedAt: string
}

export interface SettingsUpdateRequest {
  llmConfiguration?: Partial<LLMConfiguration>
  learningPreferences?: Partial<LearningPreferences>
  notifications?: Partial<NotificationSettings>
  privacy?: Partial<PrivacySettings>
  system?: Partial<SystemSettings>
}

export interface SettingsResponse {
  success: boolean
  settings: UserSettings
  message?: string
}

export interface DataExportRequest {
  includeProgress: boolean
  includeSubmissions: boolean
  includeAchievements: boolean
  includeSocialData: boolean
  format: 'json' | 'csv'
}

export interface DataExportResponse {
  success: boolean
  downloadUrl: string
  expiresAt: string
  fileSize: number
  format: string
}

export interface AccountDeletionRequest {
  confirmationText: string
  reason?: string
  feedback?: string
}

// Default settings values
export const DEFAULT_SETTINGS: UserSettings = {
  llmConfiguration: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000,
  },
  learningPreferences: {
    // Learning Style & Approach
    learningStyle: 'hands-on',
    difficulty: 'intermediate',
    pacePreference: 'normal',
    feedbackDetail: 'standard',
    
    // Content Preferences
    exerciseTypes: ['coding', 'quiz', 'project'],
    preferredLanguages: ['javascript', 'typescript', 'python'],
    contentComplexity: 'balanced',
    practiceToTheoryRatio: 70,
    
    // Learning Environment
    focusMode: false,
    backgroundMusic: false,
    darkModeForCoding: true,
    codeEditorTheme: 'vs-dark',
    fontSize: 14,
    
    // Schedule & Timing
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    studyReminders: true,
    reminderTime: '20:00',
    preferredStudyTimes: ['09:00', '20:00'],
    weeklyGoalHours: 10,
    breakReminders: true,
    breakInterval: 25,
    
    // Motivation & Gamification
    showProgress: true,
    celebrateAchievements: true,
    competitiveMode: false,
    streakMotivation: true,
    
    // Accessibility
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigationOnly: false,
  },
  notifications: {
    // Learning Notifications
    achievements: true,
    reminders: true,
    weeklyProgress: true,
    streakReminders: true,
    
    // Social Notifications
    social: false,
    challengeInvites: true,
    studyGroupActivity: true,
    mentorMessages: true,
    
    // System Notifications
    emailNotifications: false,
    pushNotifications: false,
    smsNotifications: false,
    
    // Notification Timing
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    
    // Notification Frequency
    frequency: {
      achievements: 'immediate',
      reminders: 'daily',
      social: 'hourly',
    },
    
    // Delivery Preferences
    deliveryMethods: {
      inApp: true,
      email: false,
      push: false,
      sms: false,
    },
  },
  privacy: {
    // Profile Visibility
    profileVisibility: 'friends',
    shareProgress: true,
    shareAchievements: true,
    shareCodeSolutions: false,
    
    // Social Features
    allowChallenges: true,
    allowStudyGroupInvites: true,
    allowMentoring: false,
    showOnlineStatus: true,
    
    // Data Sharing
    dataCollection: true,
    analyticsOptIn: true,
    improvementSuggestions: true,
    researchParticipation: false,
    
    // Communication
    allowDirectMessages: true,
    allowPublicComments: true,
    moderateComments: false,
    
    // Data Export & Control
    dataRetentionPeriod: 0,
    autoDeleteInactiveData: false,
  },
  system: {
    // Appearance
    theme: 'system',
    accentColor: '#3b82f6',
    language: 'en-US',
    
    // Editor Settings
    codeEditorTheme: 'vs-dark',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    lineHeight: 1.5,
    tabSize: 2,
    wordWrap: true,
    
    // Performance
    autoSave: true,
    autoSaveInterval: 30,
    enableAnimations: true,
    enableSounds: true,
    preloadContent: true,
    
    // Accessibility
    reducedMotion: false,
    highContrast: false,
    screenReaderMode: false,
    keyboardShortcuts: true,
    
    // Development
    debugMode: false,
    showPerformanceMetrics: false,
    enableExperimentalFeatures: false,
  },
  updatedAt: new Date().toISOString(),
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for exercise generation and feedback',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4',
    requiresApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for content generation',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    defaultModel: 'claude-3-sonnet',
    requiresApiKey: true,
  },
]

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文 (简体)' },
]

export const PROGRAMMING_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'go', name: 'Go', icon: '🐹' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'csharp', name: 'C#', icon: '🔷' },
]

export const CODE_EDITOR_THEMES = [
  { id: 'vs-dark', name: 'Dark (VS Code)' },
  { id: 'vs-light', name: 'Light (VS Code)' },
  { id: 'hc-black', name: 'High Contrast Dark' },
  { id: 'hc-light', name: 'High Contrast Light' },
  { id: 'monokai', name: 'Monokai' },
  { id: 'github', name: 'GitHub' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'solarized-dark', name: 'Solarized Dark' },
  { id: 'solarized-light', name: 'Solarized Light' },
]

export const FONT_FAMILIES = [
  { id: 'jetbrains-mono', name: 'JetBrains Mono', value: 'JetBrains Mono, Consolas, monospace' },
  { id: 'fira-code', name: 'Fira Code', value: 'Fira Code, Consolas, monospace' },
  { id: 'source-code-pro', name: 'Source Code Pro', value: 'Source Code Pro, Consolas, monospace' },
  { id: 'consolas', name: 'Consolas', value: 'Consolas, Monaco, monospace' },
  { id: 'monaco', name: 'Monaco', value: 'Monaco, Consolas, monospace' },
  { id: 'ubuntu-mono', name: 'Ubuntu Mono', value: 'Ubuntu Mono, Consolas, monospace' },
]

export const ACCENT_COLORS = [
  { id: 'blue', name: 'Blue', value: '#3b82f6' },
  { id: 'indigo', name: 'Indigo', value: '#6366f1' },
  { id: 'purple', name: 'Purple', value: '#8b5cf6' },
  { id: 'pink', name: 'Pink', value: '#ec4899' },
  { id: 'red', name: 'Red', value: '#ef4444' },
  { id: 'orange', name: 'Orange', value: '#f97316' },
  { id: 'amber', name: 'Amber', value: '#f59e0b' },
  { id: 'yellow', name: 'Yellow', value: '#eab308' },
  { id: 'lime', name: 'Lime', value: '#84cc16' },
  { id: 'green', name: 'Green', value: '#22c55e' },
  { id: 'emerald', name: 'Emerald', value: '#10b981' },
  { id: 'teal', name: 'Teal', value: '#14b8a6' },
  { id: 'cyan', name: 'Cyan', value: '#06b6d4' },
]

export const CONTENT_COMPLEXITY_OPTIONS = [
  {
    value: 'simple',
    label: 'Simple',
    description: 'Concise explanations, focus on core concepts',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Good mix of theory and examples',
  },
  {
    value: 'comprehensive',
    label: 'Comprehensive',
    description: 'Detailed explanations with multiple examples',
  },
]

export const NOTIFICATION_FREQUENCIES = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
]