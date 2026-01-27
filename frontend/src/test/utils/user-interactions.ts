import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Enhanced user event utilities for common interactions
 */
export const userInteractions = {
  /**
   * Setup user event with default configuration
   */
  setup: (options?: Parameters<typeof userEvent.setup>[0]) => {
    return userEvent.setup({
      delay: null, // Disable delays in tests for speed
      ...options,
    });
  },

  /**
   * Fill out a form with multiple fields
   */
  fillForm: async (fields: Record<string, string>) => {
    const user = userEvent.setup({ delay: null });
    
    for (const [fieldName, value] of Object.entries(fields)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      await user.clear(field);
      await user.type(field, value);
    }
  },

  /**
   * Submit a form by clicking the submit button
   */
  submitForm: async (submitButtonText: string | RegExp = /submit/i) => {
    const user = userEvent.setup({ delay: null });
    const submitButton = screen.getByRole('button', { name: submitButtonText });
    await user.click(submitButton);
  },

  /**
   * Navigate using keyboard
   */
  keyboard: {
    tab: async () => {
      const user = userEvent.setup({ delay: null });
      await user.tab();
    },
    
    shiftTab: async () => {
      const user = userEvent.setup({ delay: null });
      await user.tab({ shift: true });
    },
    
    enter: async () => {
      const user = userEvent.setup({ delay: null });
      await user.keyboard('{Enter}');
    },
    
    escape: async () => {
      const user = userEvent.setup({ delay: null });
      await user.keyboard('{Escape}');
    },
    
    arrowDown: async () => {
      const user = userEvent.setup({ delay: null });
      await user.keyboard('{ArrowDown}');
    },
    
    arrowUp: async () => {
      const user = userEvent.setup({ delay: null });
      await user.keyboard('{ArrowUp}');
    },
  },

  /**
   * Select from dropdown/combobox
   */
  selectOption: async (selectElement: HTMLElement, optionText: string) => {
    const user = userEvent.setup({ delay: null });
    await user.click(selectElement);
    const option = await screen.findByText(optionText);
    await user.click(option);
  },

  /**
   * Upload a file
   */
  uploadFile: async (fileInput: HTMLElement, file: File) => {
    const user = userEvent.setup({ delay: null });
    await user.upload(fileInput, file);
  },

  /**
   * Drag and drop
   */
  dragAndDrop: async (source: HTMLElement, target: HTMLElement) => {
    const user = userEvent.setup({ delay: null });
    
    // Start drag
    await user.pointer([
      { keys: '[MouseLeft>]', target: source },
      { coords: { x: 0, y: 0 } },
    ]);
    
    // Drop
    await user.pointer([
      { target: target },
      { keys: '[/MouseLeft]' },
    ]);
  },

  /**
   * Wait for element to appear and then interact with it
   */
  waitAndClick: async (elementMatcher: Parameters<typeof screen.findByRole>[0], options?: Parameters<typeof screen.findByRole>[1]) => {
    const user = userEvent.setup({ delay: null });
    const element = await screen.findByRole(elementMatcher, options);
    await user.click(element);
    return element;
  },

  /**
   * Type with realistic delays (useful for testing debounced inputs)
   */
  typeWithDelay: async (element: HTMLElement, text: string, delay: number = 100) => {
    const user = userEvent.setup({ delay });
    await user.type(element, text);
  },

  /**
   * Clear and type new value
   */
  clearAndType: async (element: HTMLElement, text: string) => {
    const user = userEvent.setup({ delay: null });
    await user.clear(element);
    await user.type(element, text);
  },

  /**
   * Hover over element
   */
  hover: async (element: HTMLElement) => {
    const user = userEvent.setup({ delay: null });
    await user.hover(element);
  },

  /**
   * Unhover element
   */
  unhover: async (element: HTMLElement) => {
    const user = userEvent.setup({ delay: null });
    await user.unhover(element);
  },

  /**
   * Right click (context menu)
   */
  rightClick: async (element: HTMLElement) => {
    const user = userEvent.setup({ delay: null });
    await user.pointer({ keys: '[MouseRight]', target: element });
  },

  /**
   * Double click
   */
  doubleClick: async (element: HTMLElement) => {
    const user = userEvent.setup({ delay: null });
    await user.dblClick(element);
  },
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  /**
   * Test login flow
   */
  login: async (email: string = 'test@example.com', password: string = 'password') => {
    await userInteractions.fillForm({
      email,
      password,
    });
    await userInteractions.submitForm(/log in/i);
  },

  /**
   * Test form validation by submitting empty form
   */
  triggerValidation: async (submitButtonText?: string | RegExp) => {
    await userInteractions.submitForm(submitButtonText);
  },

  /**
   * Test modal interactions
   */
  modal: {
    open: async (triggerText: string | RegExp) => {
      const user = userEvent.setup({ delay: null });
      const trigger = screen.getByRole('button', { name: triggerText });
      await user.click(trigger);
      
      // Wait for modal to appear
      return await screen.findByRole('dialog');
    },
    
    close: async () => {
      const user = userEvent.setup({ delay: null });
      
      // Try to find close button first
      const closeButton = screen.queryByRole('button', { name: /close/i });
      if (closeButton) {
        await user.click(closeButton);
        return;
      }
      
      // Fallback to escape key
      await userInteractions.keyboard.escape();
    },
  },

  /**
   * Test code editor interactions
   */
  codeEditor: {
    typeCode: async (code: string) => {
      // Monaco editor typically uses a textarea or div with contenteditable
      const editor = screen.getByRole('textbox') || screen.getByTestId('code-editor');
      await userInteractions.clearAndType(editor, code);
    },
    
    submitCode: async () => {
      await userInteractions.waitAndClick('button', { name: /submit|run/i });
    },
  },

  /**
   * Test navigation
   */
  navigation: {
    goToPage: async (linkText: string | RegExp) => {
      const user = userEvent.setup({ delay: null });
      const link = screen.getByRole('link', { name: linkText });
      await user.click(link);
    },
    
    goBack: async () => {
      // Simulate browser back button
      window.history.back();
    },
  },
};
