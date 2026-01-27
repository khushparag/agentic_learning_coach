import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

export interface ShortcutGroup {
  [key: string]: KeyboardShortcut;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutGroup, enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in form elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    const shortcutKey = createShortcutKey(event);
    const shortcut = Object.values(shortcutsRef.current).find(s => 
      !s.disabled && createShortcutKey({
        key: s.key,
        ctrlKey: s.ctrlKey || false,
        altKey: s.altKey || false,
        shiftKey: s.shiftKey || false,
        metaKey: s.metaKey || false
      }) === shortcutKey
    );

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      if (shortcut.stopPropagation !== false) {
        event.stopPropagation();
      }
      shortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current
  };
}

/**
 * Create a unique key for a keyboard shortcut
 */
function createShortcutKey(event: {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): string {
  const modifiers: string[] = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');
  
  return [...modifiers, event.key.toLowerCase()].join('+');
}

/**
 * Hook for global application shortcuts
 */
export function useGlobalShortcuts() {
  const shortcuts: ShortcutGroup = {
    // Navigation shortcuts
    dashboard: {
      key: 'd',
      altKey: true,
      action: () => window.location.href = '/dashboard',
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    learningPath: {
      key: 'l',
      altKey: true,
      action: () => window.location.href = '/learning-path',
      description: 'Go to Learning Path',
      category: 'Navigation'
    },
    exercises: {
      key: 'e',
      altKey: true,
      action: () => window.location.href = '/exercises',
      description: 'Go to Exercises',
      category: 'Navigation'
    },
    settings: {
      key: ',',
      ctrlKey: true,
      action: () => window.location.href = '/settings',
      description: 'Open Settings',
      category: 'Navigation'
    },

    // Search and help
    search: {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus Search',
      category: 'Search'
    },
    help: {
      key: '?',
      shiftKey: true,
      action: () => {
        // Open help modal or navigate to help page
        const helpButton = document.querySelector('[data-help-button]') as HTMLButtonElement;
        if (helpButton) {
          helpButton.click();
        }
      },
      description: 'Show Help',
      category: 'Help'
    },

    // Accessibility shortcuts
    skipToMain: {
      key: 'm',
      altKey: true,
      action: () => {
        const main = document.querySelector('main') || document.getElementById('main-content');
        if (main) {
          (main as HTMLElement).focus();
          main.scrollIntoView({ behavior: 'smooth' });
        }
      },
      description: 'Skip to Main Content',
      category: 'Accessibility'
    },
    skipToNav: {
      key: 'n',
      altKey: true,
      action: () => {
        const nav = document.querySelector('nav') || document.getElementById('navigation');
        if (nav) {
          (nav as HTMLElement).focus();
          nav.scrollIntoView({ behavior: 'smooth' });
        }
      },
      description: 'Skip to Navigation',
      category: 'Accessibility'
    }
  };

  useKeyboardShortcuts(shortcuts);

  return { shortcuts };
}

/**
 * Hook for code editor shortcuts
 */
export function useCodeEditorShortcuts(editor: any) {
  const shortcuts: ShortcutGroup = {
    runCode: {
      key: 'Enter',
      ctrlKey: true,
      action: () => {
        const runButton = document.querySelector('[data-run-code]') as HTMLButtonElement;
        if (runButton) {
          runButton.click();
        }
      },
      description: 'Run Code',
      category: 'Code Editor'
    },
    submitCode: {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        const submitButton = document.querySelector('[data-submit-code]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.click();
        }
      },
      description: 'Submit Code',
      category: 'Code Editor'
    },
    formatCode: {
      key: 'f',
      ctrlKey: true,
      altKey: true,
      action: () => {
        if (editor && editor.getAction) {
          const formatAction = editor.getAction('editor.action.formatDocument');
          if (formatAction) {
            formatAction.run();
          }
        }
      },
      description: 'Format Code',
      category: 'Code Editor'
    },
    toggleHints: {
      key: 'h',
      ctrlKey: true,
      action: () => {
        const hintsButton = document.querySelector('[data-toggle-hints]') as HTMLButtonElement;
        if (hintsButton) {
          hintsButton.click();
        }
      },
      description: 'Toggle Hints',
      category: 'Code Editor'
    }
  };

  useKeyboardShortcuts(shortcuts, !!editor);

  return { shortcuts };
}

/**
 * Hook for modal shortcuts
 */
export function useModalShortcuts(onClose: () => void, enabled: boolean = true) {
  const shortcuts: ShortcutGroup = {
    closeModal: {
      key: 'Escape',
      action: onClose,
      description: 'Close Modal',
      category: 'Modal'
    }
  };

  useKeyboardShortcuts(shortcuts, enabled);

  return { shortcuts };
}

/**
 * Hook for form shortcuts
 */
export function useFormShortcuts(onSubmit?: () => void, onReset?: () => void) {
  const shortcuts: ShortcutGroup = {
    ...(onSubmit && {
      submitForm: {
        key: 'Enter',
        ctrlKey: true,
        action: onSubmit,
        description: 'Submit Form',
        category: 'Form'
      }
    }),
    ...(onReset && {
      resetForm: {
        key: 'r',
        ctrlKey: true,
        altKey: true,
        action: onReset,
        description: 'Reset Form',
        category: 'Form'
      }
    })
  };

  useKeyboardShortcuts(shortcuts);

  return { shortcuts };
}

/**
 * Hook for displaying keyboard shortcuts help
 */
export function useShortcutsHelp() {
  const getAllShortcuts = useCallback(() => {
    // This would collect all registered shortcuts from a global registry
    // For now, return the global shortcuts as an example
    const { shortcuts } = useGlobalShortcuts();
    return shortcuts;
  }, []);

  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const modifiers: string[] = [];
    if (shortcut.ctrlKey) modifiers.push('Ctrl');
    if (shortcut.altKey) modifiers.push('Alt');
    if (shortcut.shiftKey) modifiers.push('Shift');
    if (shortcut.metaKey) modifiers.push('Cmd');
    
    const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
    return [...modifiers, key].join(' + ');
  }, []);

  const groupShortcutsByCategory = useCallback((shortcuts: ShortcutGroup) => {
    const grouped: Record<string, KeyboardShortcut[]> = {};
    
    Object.values(shortcuts).forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shortcut);
    });
    
    return grouped;
  }, []);

  return {
    getAllShortcuts,
    formatShortcut,
    groupShortcutsByCategory
  };
}
