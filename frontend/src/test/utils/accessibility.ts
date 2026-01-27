import { screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility testing utilities
 */
export const a11yUtils = {
  /**
   * Run axe accessibility tests on a container
   */
  runAxeTest: async (container: HTMLElement) => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    return results;
  },

  /**
   * Check if element has proper ARIA attributes
   */
  checkAriaAttributes: {
    hasLabel: (element: HTMLElement) => {
      return element.hasAttribute('aria-label') || 
             element.hasAttribute('aria-labelledby') ||
             element.closest('label') !== null;
    },

    hasDescription: (element: HTMLElement) => {
      return element.hasAttribute('aria-describedby');
    },

    hasRole: (element: HTMLElement, expectedRole: string) => {
      return element.getAttribute('role') === expectedRole ||
             element.tagName.toLowerCase() === expectedRole;
    },

    isExpanded: (element: HTMLElement) => {
      return element.getAttribute('aria-expanded') === 'true';
    },

    isPressed: (element: HTMLElement) => {
      return element.getAttribute('aria-pressed') === 'true';
    },

    isSelected: (element: HTMLElement) => {
      return element.getAttribute('aria-selected') === 'true';
    },

    isDisabled: (element: HTMLElement) => {
      return element.hasAttribute('disabled') ||
             element.getAttribute('aria-disabled') === 'true';
    },
  },

  /**
   * Test keyboard navigation
   */
  keyboard: {
    /**
     * Test tab order through focusable elements
     */
    testTabOrder: async (expectedOrder: string[]) => {
      const user = userEvent.setup({ delay: null });
      
      for (const expectedElement of expectedOrder) {
        await user.tab();
        const focused = document.activeElement;
        
        // Check if the focused element matches expected
        expect(focused).toHaveAccessibleName(expectedElement);
      }
    },

    /**
     * Test that element can be activated with Enter key
     */
    testEnterActivation: async (element: HTMLElement) => {
      const user = userEvent.setup({ delay: null });
      
      element.focus();
      await user.keyboard('{Enter}');
      
      // Element should have been activated (implementation specific)
      return element;
    },

    /**
     * Test that element can be activated with Space key
     */
    testSpaceActivation: async (element: HTMLElement) => {
      const user = userEvent.setup({ delay: null });
      
      element.focus();
      await user.keyboard(' ');
      
      return element;
    },

    /**
     * Test arrow key navigation in lists/menus
     */
    testArrowNavigation: async (container: HTMLElement, direction: 'up' | 'down' | 'left' | 'right') => {
      const user = userEvent.setup({ delay: null });
      const key = `{Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}}`;
      
      await user.keyboard(key);
      
      return document.activeElement;
    },
  },

  /**
   * Screen reader testing utilities
   */
  screenReader: {
    /**
     * Check if element has accessible name
     */
    hasAccessibleName: (element: HTMLElement, expectedName?: string) => {
      const accessibleName = element.getAttribute('aria-label') ||
                           element.textContent ||
                           element.getAttribute('title');
      
      if (expectedName) {
        expect(accessibleName).toBe(expectedName);
      }
      
      return !!accessibleName;
    },

    /**
     * Check if element has accessible description
     */
    hasAccessibleDescription: (element: HTMLElement) => {
      const describedBy = element.getAttribute('aria-describedby');
      if (!describedBy) return false;
      
      const descriptionElement = document.getElementById(describedBy);
      return !!descriptionElement?.textContent;
    },

    /**
     * Check live region announcements
     */
    checkLiveRegion: (text: string, politeness: 'polite' | 'assertive' = 'polite') => {
      const liveRegion = screen.queryByRole('status') || 
                        screen.queryByRole('alert') ||
                        screen.queryByLabelText(/live region/i);
      
      if (liveRegion) {
        expect(liveRegion).toHaveTextContent(text);
        expect(liveRegion).toHaveAttribute('aria-live', politeness);
      }
      
      return liveRegion;
    },
  },

  /**
   * Color contrast and visual accessibility
   */
  visual: {
    /**
     * Check if element has sufficient color contrast (requires manual verification)
     */
    checkColorContrast: (element: HTMLElement) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Return colors for manual verification
      return { color, backgroundColor };
    },

    /**
     * Check if text is readable at different zoom levels
     */
    checkZoomReadability: (element: HTMLElement, zoomLevel: number = 200) => {
      const originalTransform = element.style.transform;
      element.style.transform = `scale(${zoomLevel / 100})`;
      
      // Check if text is still readable (implementation specific)
      const isReadable = element.offsetWidth > 0 && element.offsetHeight > 0;
      
      // Restore original transform
      element.style.transform = originalTransform;
      
      return isReadable;
    },
  },

  /**
   * Form accessibility testing
   */
  forms: {
    /**
     * Check if form fields have proper labels
     */
    checkFormLabels: (form: HTMLElement) => {
      const inputs = within(form).getAllByRole('textbox');
      const selects = within(form).queryAllByRole('combobox');
      const checkboxes = within(form).queryAllByRole('checkbox');
      const radios = within(form).queryAllByRole('radio');
      
      const allFields = [...inputs, ...selects, ...checkboxes, ...radios];
      
      allFields.forEach(field => {
        expect(a11yUtils.checkAriaAttributes.hasLabel(field)).toBe(true);
      });
      
      return allFields;
    },

    /**
     * Check if form has proper error handling
     */
    checkErrorHandling: async (form: HTMLElement) => {
      // Submit form to trigger validation
      const submitButton = within(form).getByRole('button', { name: /submit/i });
      submitButton.click();
      
      // Check for error messages
      const errorMessages = within(form).queryAllByRole('alert');
      
      errorMessages.forEach(error => {
        expect(error).toBeVisible();
        expect(error).toHaveAttribute('aria-live');
      });
      
      return errorMessages;
    },
  },

  /**
   * Modal/Dialog accessibility testing
   */
  modals: {
    /**
     * Check modal accessibility requirements
     */
    checkModalA11y: (modal: HTMLElement) => {
      // Should have dialog role
      expect(modal).toHaveAttribute('role', 'dialog');
      
      // Should have accessible name
      expect(a11yUtils.screenReader.hasAccessibleName(modal)).toBe(true);
      
      // Should trap focus
      const focusableElements = within(modal).getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // First focusable element should be focused
      expect(document.activeElement).toBe(focusableElements[0]);
      
      return modal;
    },

    /**
     * Test focus trap in modal
     */
    testFocusTrap: async (modal: HTMLElement) => {
      const user = userEvent.setup({ delay: null });
      const focusableElements = within(modal).getAllByRole('button');
      
      // Tab through all elements
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab();
      }
      
      // Should wrap back to first element
      await user.tab();
      expect(document.activeElement).toBe(focusableElements[0]);
    },
  },

  /**
   * Test high contrast mode compatibility
   */
  highContrast: {
    /**
     * Simulate high contrast mode
     */
    simulateHighContrast: () => {
      document.body.classList.add('high-contrast');
      
      // Add high contrast media query simulation
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    },

    /**
     * Remove high contrast simulation
     */
    removeHighContrast: () => {
      document.body.classList.remove('high-contrast');
    },
  },

  /**
   * Test reduced motion preferences
   */
  reducedMotion: {
    /**
     * Simulate reduced motion preference
     */
    simulateReducedMotion: () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    },
  },
};

/**
 * Accessibility test suites for common components
 */
export const a11yTestSuites = {
  /**
   * Complete accessibility test for a component
   */
  runFullA11yTest: async (container: HTMLElement) => {
    // Run axe tests
    await a11yUtils.runAxeTest(container);
    
    // Check basic ARIA attributes
    const interactiveElements = container.querySelectorAll('button, input, select, textarea, a[href]');
    interactiveElements.forEach(element => {
      expect(a11yUtils.checkAriaAttributes.hasLabel(element as HTMLElement)).toBe(true);
    });
    
    return true;
  },

  /**
   * Test component with different accessibility settings
   */
  testWithAccessibilitySettings: async (
    renderComponent: () => HTMLElement,
    tests: () => Promise<void>
  ) => {
    // Test with default settings
    let container = renderComponent();
    await tests();
    
    // Test with high contrast
    a11yUtils.highContrast.simulateHighContrast();
    container = renderComponent();
    await tests();
    a11yUtils.highContrast.removeHighContrast();
    
    // Test with reduced motion
    a11yUtils.reducedMotion.simulateReducedMotion();
    container = renderComponent();
    await tests();
  },
};
