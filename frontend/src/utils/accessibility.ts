/**
 * Accessibility utilities for WCAG 2.1 compliance
 */

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  private static trapStack: HTMLElement[] = [];

  /**
   * Save current focus and set new focus
   */
  static saveFocus(newFocus?: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== document.body) {
      this.focusStack.push(currentFocus);
    }
    
    if (newFocus) {
      // Use setTimeout to ensure the element is rendered
      setTimeout(() => {
        newFocus.focus();
      }, 0);
    }
  }

  /**
   * Restore previously saved focus
   */
  static restoreFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && document.contains(previousFocus)) {
      setTimeout(() => {
        previousFocus.focus();
      }, 0);
    }
  }

  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    this.trapStack.push(container);
    
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.trapStack.pop();
    };
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    return elements.filter(element => {
      return (
        element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        !element.hasAttribute('hidden') &&
        window.getComputedStyle(element).visibility !== 'hidden'
      );
    });
  }

  /**
   * Move focus to next/previous focusable element
   */
  static moveFocus(direction: 'next' | 'previous', container?: HTMLElement): void {
    const root = container || document.body;
    const focusableElements = this.getFocusableElements(root);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= focusableElements.length) nextIndex = 0;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = focusableElements.length - 1;
    }
    
    focusableElements[nextIndex]?.focus();
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  /**
   * Create unique ID for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up ARIA relationships between elements
   */
  static linkElements(
    trigger: HTMLElement,
    target: HTMLElement,
    relationship: 'describedby' | 'labelledby' | 'controls' | 'owns'
  ): void {
    if (!target.id) {
      target.id = this.generateId();
    }
    
    const existingIds = trigger.getAttribute(`aria-${relationship}`)?.split(' ') || [];
    if (!existingIds.includes(target.id)) {
      existingIds.push(target.id);
      trigger.setAttribute(`aria-${relationship}`, existingIds.join(' '));
    }
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a grid or list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    container: HTMLElement,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      wrap?: boolean;
      itemSelector?: string;
    } = {}
  ): void {
    const {
      orientation = 'both',
      wrap = true,
      itemSelector = '[role="gridcell"], [role="option"], [role="menuitem"], button, a'
    } = options;

    const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ? 
            (currentIndex - 1 + items.length) % items.length :
            Math.max(0, currentIndex - 1);
        }
        break;
        
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ?
            (currentIndex + 1) % items.length :
            Math.min(items.length - 1, currentIndex + 1);
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ?
            (currentIndex - 1 + items.length) % items.length :
            Math.max(0, currentIndex - 1);
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = wrap ?
            (currentIndex + 1) % items.length :
            Math.min(items.length - 1, currentIndex + 1);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
        
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex]?.focus();
    }
  }

  /**
   * Handle escape key to close overlays
   */
  static handleEscape(event: KeyboardEvent, onEscape: () => void): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
    }
  }
}

// Color contrast utilities
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color combination meets WCAG standards
   */
  static meetsWCAG(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Motion preferences
export class MotionPreferences {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get safe animation duration based on user preferences
   */
  static getSafeAnimationDuration(normalDuration: number): number {
    return this.prefersReducedMotion() ? 0 : normalDuration;
  }

  /**
   * Apply motion-safe class conditionally
   */
  static getMotionSafeClass(className: string): string {
    return this.prefersReducedMotion() ? '' : className;
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  /**
   * Check for common accessibility issues
   */
  static runBasicChecks(container: HTMLElement = document.body): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for images without alt text
    const images = container.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      issues.push({
        type: 'missing-alt',
        element: img as HTMLElement,
        message: 'Image missing alt attribute',
        severity: 'error'
      });
    });
    
    // Check for buttons without accessible names
    const buttons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent?.trim()) {
        issues.push({
          type: 'missing-label',
          element: button as HTMLElement,
          message: 'Button missing accessible name',
          severity: 'error'
        });
      }
    });
    
    // Check for form inputs without labels
    const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (!id || !container.querySelector(`label[for="${id}"]`)) {
        issues.push({
          type: 'missing-label',
          element: input as HTMLElement,
          message: 'Form input missing label',
          severity: 'error'
        });
      }
    });
    
    return issues;
  }
}

export interface AccessibilityIssue {
  type: string;
  element: HTMLElement;
  message: string;
  severity: 'error' | 'warning' | 'info';
}