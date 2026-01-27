import { useEffect, useRef, useCallback, useState } from 'react';
import {
  FocusManager,
  ScreenReaderUtils,
  KeyboardNavigation,
  MotionPreferences
} from '../utils/accessibility';

/**
 * Hook for managing focus within a component
 */
export function useFocusManagement(options: {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
} = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const { trapFocus = false, restoreFocus = false, autoFocus = false } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    if (autoFocus) {
      FocusManager.saveFocus(containerRef.current);
    }

    if (trapFocus) {
      cleanup = FocusManager.trapFocus(containerRef.current);
    }

    return () => {
      if (cleanup) cleanup();
      if (restoreFocus) {
        FocusManager.restoreFocus();
      }
    };
  }, [trapFocus, restoreFocus, autoFocus]);

  const moveFocus = useCallback((direction: 'next' | 'previous') => {
    if (containerRef.current) {
      FocusManager.moveFocus(direction, containerRef.current);
    }
  }, []);

  return {
    containerRef,
    moveFocus,
    saveFocus: FocusManager.saveFocus,
    restoreFocus: FocusManager.restoreFocus
  };
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(options: {
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  itemSelector?: string;
  onEscape?: () => void;
} = {}) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    // Handle escape key
    if (options.onEscape && event.key === 'Escape') {
      KeyboardNavigation.handleEscape(event, options.onEscape);
      return;
    }

    // Handle arrow navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      KeyboardNavigation.handleArrowNavigation(event, containerRef.current, options);
    }
  }, [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { containerRef };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ScreenReaderUtils.announce(message, priority);
  }, []);

  const generateId = useCallback((prefix?: string) => {
    return ScreenReaderUtils.generateId(prefix);
  }, []);

  const linkElements = useCallback((
    trigger: HTMLElement,
    target: HTMLElement,
    relationship: 'describedby' | 'labelledby' | 'controls' | 'owns'
  ) => {
    ScreenReaderUtils.linkElements(trigger, target, relationship);
  }, []);

  return {
    announce,
    generateId,
    linkElements
  };
}

/**
 * Hook for managing ARIA attributes
 */
export function useAriaAttributes(initialAttributes: Record<string, string> = {}) {
  const [attributes, setAttributes] = useState(initialAttributes);

  const updateAttribute = useCallback((key: string, value: string | null) => {
    setAttributes(prev => {
      if (value === null) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const toggleAttribute = useCallback((key: string, value1: string, value2: string) => {
    setAttributes(prev => ({
      ...prev,
      [key]: prev[key] === value1 ? value2 : value1
    }));
  }, []);

  return {
    attributes,
    updateAttribute,
    toggleAttribute,
    setAttributes
  };
}

/**
 * Hook for motion preferences
 */
export function useMotionPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    MotionPreferences.prefersReducedMotion()
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getSafeAnimationDuration = useCallback((normalDuration: number) => {
    return MotionPreferences.getSafeAnimationDuration(normalDuration);
  }, []);

  const getMotionSafeClass = useCallback((className: string) => {
    return MotionPreferences.getMotionSafeClass(className);
  }, []);

  return {
    prefersReducedMotion,
    getSafeAnimationDuration,
    getMotionSafeClass
  };
}

/**
 * Hook for managing live regions
 */
export function useLiveRegion(initialMessage: string = '') {
  const [message, setMessage] = useState(initialMessage);
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((newMessage: string, newPriority: 'polite' | 'assertive' = 'polite') => {
    setMessage(newMessage);
    setPriority(newPriority);
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  return {
    liveRegionRef,
    message,
    priority,
    announce,
    clear,
    liveRegionProps: {
      ref: liveRegionRef,
      'aria-live': priority,
      'aria-atomic': true,
      className: 'sr-only'
    }
  };
}

/**
 * Hook for skip links
 */
export function useSkipLinks(links: Array<{ id: string; label: string }>) {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const skipLinkProps = useCallback((targetId: string, label: string) => ({
    href: `#${targetId}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      skipToContent(targetId);
    },
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg',
    children: label
  }), [skipToContent]);

  return {
    skipToContent,
    skipLinkProps,
    links
  };
}

/**
 * Hook for managing disclosure state (collapsible content)
 */
export function useDisclosure(initialOpen: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const triggerId = ScreenReaderUtils.generateId('disclosure-trigger');
  const contentId = ScreenReaderUtils.generateId('disclosure-content');

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const triggerProps = {
    id: triggerId,
    'aria-expanded': isOpen,
    'aria-controls': contentId,
    onClick: toggle
  };

  const contentProps = {
    id: contentId,
    'aria-labelledby': triggerId,
    hidden: !isOpen
  };

  return {
    isOpen,
    toggle,
    open,
    close,
    triggerProps,
    contentProps,
    triggerId,
    contentId
  };
}

/**
 * Hook for managing roving tabindex
 */
export function useRovingTabindex(items: HTMLElement[], activeIndex: number = 0) {
  useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  }, [items, activeIndex]);

  const setActiveIndex = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < items.length) {
      items.forEach((item, index) => {
        if (item) {
          item.tabIndex = index === newIndex ? 0 : -1;
        }
      });
      items[newIndex]?.focus();
    }
  }, [items]);

  return { setActiveIndex };
}

/**
 * Hook for form accessibility
 */
export function useFormAccessibility() {
  const generateFieldId = useCallback((name: string) => {
    return ScreenReaderUtils.generateId(`field-${name}`);
  }, []);

  const generateErrorId = useCallback((name: string) => {
    return ScreenReaderUtils.generateId(`error-${name}`);
  }, []);

  const generateHelpId = useCallback((name: string) => {
    return ScreenReaderUtils.generateId(`help-${name}`);
  }, []);

  const getFieldProps = useCallback((name: string, hasError: boolean = false, hasHelp: boolean = false) => {
    const fieldId = generateFieldId(name);
    const errorId = hasError ? generateErrorId(name) : undefined;
    const helpId = hasHelp ? generateHelpId(name) : undefined;

    const describedBy = [errorId, helpId].filter(Boolean).join(' ');

    return {
      id: fieldId,
      'aria-invalid': hasError,
      'aria-describedby': describedBy || undefined
    };
  }, [generateFieldId, generateErrorId, generateHelpId]);

  return {
    generateFieldId,
    generateErrorId,
    generateHelpId,
    getFieldProps
  };
}
