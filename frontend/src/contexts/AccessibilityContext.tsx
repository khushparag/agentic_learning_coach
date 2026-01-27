import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ScreenReaderUtils } from '../utils/accessibility';

export interface AccessibilitySettings {
  highContrast: boolean;
  darkHighContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigationEnabled: boolean;
  skipLinksEnabled: boolean;
  announcePageChanges: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  focusIndicatorStyle: 'default' | 'enhanced' | 'high-contrast';
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  isHighContrastMode: boolean;
  isReducedMotionMode: boolean;
  currentTheme: string;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  darkHighContrast: false,
  largeText: false,
  reducedMotion: false,
  enhancedFocus: false,
  screenReaderOptimized: false,
  keyboardNavigationEnabled: true,
  skipLinksEnabled: true,
  announcePageChanges: true,
  fontSize: 'normal',
  focusIndicatorStyle: 'default'
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    
    // Detect system preferences
    const systemPreferences: Partial<AccessibilitySettings> = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches
    };
    
    return { ...defaultSettings, ...systemPreferences };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply theme classes to document
  useEffect(() => {
    const { documentElement } = document;
    
    // Remove all theme classes
    documentElement.classList.remove(
      'theme-high-contrast',
      'theme-dark-high-contrast',
      'theme-large-text',
      'theme-reduced-motion',
      'enhanced-focus'
    );
    
    // Apply current theme classes
    if (settings.highContrast) {
      documentElement.classList.add('theme-high-contrast');
    }
    
    if (settings.darkHighContrast) {
      documentElement.classList.add('theme-dark-high-contrast');
    }
    
    if (settings.largeText) {
      documentElement.classList.add('theme-large-text');
    }
    
    if (settings.reducedMotion) {
      documentElement.classList.add('theme-reduced-motion');
    }
    
    if (settings.enhancedFocus) {
      documentElement.classList.add('enhanced-focus');
    }
    
    // Set font size CSS custom property
    const fontSizeMap = {
      normal: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem'
    };
    documentElement.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Announce setting changes to screen readers
    const settingNames: Record<keyof AccessibilitySettings, string> = {
      highContrast: 'High contrast mode',
      darkHighContrast: 'Dark high contrast mode',
      largeText: 'Large text mode',
      reducedMotion: 'Reduced motion mode',
      enhancedFocus: 'Enhanced focus indicators',
      screenReaderOptimized: 'Screen reader optimization',
      keyboardNavigationEnabled: 'Keyboard navigation',
      skipLinksEnabled: 'Skip links',
      announcePageChanges: 'Page change announcements',
      fontSize: 'Font size',
      focusIndicatorStyle: 'Focus indicator style'
    };
    
    const settingName = settingNames[key];
    const status = value ? 'enabled' : 'disabled';
    ScreenReaderUtils.announce(`${settingName} ${status}`, 'polite');
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    ScreenReaderUtils.announce('Accessibility settings reset to defaults', 'polite');
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (settings.announcePageChanges) {
      ScreenReaderUtils.announce(message, priority);
    }
  }, [settings.announcePageChanges]);

  const isHighContrastMode = settings.highContrast || settings.darkHighContrast;
  const isReducedMotionMode = settings.reducedMotion;
  
  const currentTheme = (() => {
    if (settings.darkHighContrast) return 'dark-high-contrast';
    if (settings.highContrast) return 'high-contrast';
    return 'default';
  })();

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announce,
    isHighContrastMode,
    isReducedMotionMode,
    currentTheme
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for components that need to be accessibility-aware
export function useAccessibilityAware() {
  const { settings, isHighContrastMode, isReducedMotionMode, announce } = useAccessibility();
  
  const getAnimationDuration = useCallback((normalDuration: number) => {
    return isReducedMotionMode ? 0 : normalDuration;
  }, [isReducedMotionMode]);
  
  const getMotionSafeClass = useCallback((className: string) => {
    return isReducedMotionMode ? '' : className;
  }, [isReducedMotionMode]);
  
  const getFocusClass = useCallback(() => {
    switch (settings.focusIndicatorStyle) {
      case 'enhanced':
        return 'focus:ring-4 focus:ring-primary-500/50';
      case 'high-contrast':
        return isHighContrastMode 
          ? 'focus:outline-4 focus:outline-black focus:outline-offset-2'
          : 'focus:outline-4 focus:outline-primary-600 focus:outline-offset-2';
      default:
        return 'focus:ring-2 focus:ring-primary-500';
    }
  }, [settings.focusIndicatorStyle, isHighContrastMode]);
  
  const getContrastClass = useCallback((lightClass: string, darkClass: string, highContrastClass?: string) => {
    if (isHighContrastMode && highContrastClass) {
      return highContrastClass;
    }
    return settings.darkHighContrast ? darkClass : lightClass;
  }, [isHighContrastMode, settings.darkHighContrast]);
  
  return {
    settings,
    isHighContrastMode,
    isReducedMotionMode,
    announce,
    getAnimationDuration,
    getMotionSafeClass,
    getFocusClass,
    getContrastClass
  };
}