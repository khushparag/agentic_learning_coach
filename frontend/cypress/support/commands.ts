/// <reference types="cypress" />

// Custom commands for Cypress tests

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to tab through elements
       * @example cy.get('input').tab()
       */
      tab(): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to check accessibility
       * @example cy.checkA11y()
       */
      checkA11y(context?: string, options?: any): Chainable<void>;
      
      /**
       * Custom command to wait for API response
       * @example cy.waitForApi('@getProfile')
       */
      waitForApi(alias: string): Chainable<void>;
      
      /**
       * Custom command to mock user authentication
       * @example cy.mockAuth()
       */
      mockAuth(): Chainable<void>;
      
      /**
       * Custom command to check performance metrics
       * @example cy.checkPerformance()
       */
      checkPerformance(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type(password);
    cy.get('[data-testid=login-button]').click();
    
    // Wait for successful login
    cy.url().should('include', '/dashboard');
    cy.window().its('localStorage.token').should('exist');
  });
});

// Tab navigation command
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).trigger('keydown', { key: 'Tab' });
  return cy.focused();
});

// Accessibility checking command
Cypress.Commands.add('checkA11y', (context?: string, options?: any) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    if (violations.length > 0) {
      cy.task('log', `${violations.length} accessibility violation(s) detected`);
      violations.forEach((violation) => {
        cy.task('log', `${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          cy.task('log', `  - ${node.target}`);
        });
      });
    }
  });
});

// API waiting command
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Mock authentication command
Cypress.Commands.add('mockAuth', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'mock-jwt-token');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }));
  });
});

// Performance checking command
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
      const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
      
      cy.task('log', `Performance Metrics:`);
      cy.task('log', `  Load Time: ${loadTime}ms`);
      cy.task('log', `  DOM Content Loaded: ${domContentLoaded}ms`);
      cy.task('log', `  First Paint: ${firstPaint}ms`);
      cy.task('log', `  First Contentful Paint: ${firstContentfulPaint}ms`);
      
      // Assert performance thresholds
      expect(loadTime, 'Page load time').to.be.lessThan(3000);
      expect(domContentLoaded, 'DOM content loaded time').to.be.lessThan(2000);
      expect(firstContentfulPaint, 'First contentful paint').to.be.lessThan(1500);
    }
  });
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore specific errors that don't affect test functionality
  const ignoredErrors = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError'
  ];
  
  return !ignoredErrors.some(ignoredError => err.message.includes(ignoredError));
});

// Custom task for logging
Cypress.Commands.add('task', (task: string, arg?: any) => {
  return cy.task(task, arg, { log: false });
});

export {};