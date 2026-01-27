/**
 * Additional test setup that runs after the main setup
 * Use this file for test-specific configurations
 */

import { testEnvironment } from './utils/mock-utils';

// Setup test environment
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Setup common mocks
  testEnvironment.setup();
});

afterEach(() => {
  // Cleanup after each test
  testEnvironment.cleanup();
});

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveNoA11yViolations(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeAccessible(received: HTMLElement) {
    // Custom accessibility matcher
    const pass = received.getAttribute('role') !== null || 
                 received.tagName.toLowerCase() === 'button' ||
                 received.tagName.toLowerCase() === 'a';
    
    return {
      message: () => `expected element to be accessible`,
      pass,
    };
  },
  
  async toHaveNoA11yViolations(received: HTMLElement) {
    const { axe } = await import('jest-axe');
    const results = await axe(received);
    
    return {
      message: () => `expected no accessibility violations but found ${results.violations.length}`,
      pass: results.violations.length === 0,
    };
  },
});

// Console error filtering for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Filter out known React warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: validateDOMNesting') ||
       args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    // Filter out known warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
