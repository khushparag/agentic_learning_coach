// Import commands
import './commands';

// Import Percy for visual testing
import '@percy/cypress';

// Import code coverage
import '@cypress/code-coverage/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are expected in development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  return true;
});

// Add custom commands type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       */
      login(email?: string, password?: string): Chainable<void>;
      
      /**
       * Logout current user
       */
      logout(): Chainable<void>;
      
      /**
       * Get element by test id
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Wait for loading to finish
       */
      waitForLoading(): Chainable<void>;
      
      /**
       * Fill Monaco editor with code
       */
      fillMonacoEditor(code: string): Chainable<void>;
      
      /**
       * Submit code exercise
       */
      submitCode(): Chainable<void>;
      
      /**
       * Navigate to page
       */
      navigateTo(page: string): Chainable<void>;
      
      /**
       * Check accessibility
       */
      checkA11y(context?: string | Node, options?: any): Chainable<void>;
      
      /**
       * Take Percy snapshot
       */
      percySnapshot(name?: string, options?: any): Chainable<void>;
      
      /**
       * Seed test data
       */
      seedTestData(data: any): Chainable<void>;
      
      /**
       * Clear test data
       */
      clearTestData(): Chainable<void>;
    }
  }
}