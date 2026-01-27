/**
 * Critical User Flows E2E Tests
 * Tests the most important user journeys for production monitoring
 */

describe('Critical User Flows', () => {
  beforeEach(() => {
    // Start with a clean state
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Mock API responses
    cy.intercept('GET', '/api/health', { fixture: 'health.json' }).as('healthCheck');
    cy.intercept('POST', '/api/auth/login', { fixture: 'auth/login-success.json' }).as('login');
    cy.intercept('GET', '/api/profile', { fixture: 'profile/user-profile.json' }).as('getProfile');
    cy.intercept('GET', '/api/exercises', { fixture: 'exercises/exercise-list.json' }).as('getExercises');
  });

  describe('Authentication Flow', () => {
    it('should complete login flow successfully', () => {
      cy.visit('/login');
      
      // Check page loads
      cy.get('[data-testid=login-form]').should('be.visible');
      cy.get('[data-testid=email-input]').should('be.visible');
      cy.get('[data-testid=password-input]').should('be.visible');
      
      // Fill login form
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      
      // Submit form
      cy.get('[data-testid=login-button]').click();
      
      // Wait for login request
      cy.wait('@login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid=dashboard]').should('be.visible');
    });

    it('should handle login errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginError');
      
      cy.visit('/login');
      
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('wrongpassword');
      cy.get('[data-testid=login-button]').click();
      
      cy.wait('@loginError');
      
      // Should show error message
      cy.get('[data-testid=error-message]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
      
      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should logout successfully', () => {
      // Login first
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard');
      
      // Logout
      cy.get('[data-testid=user-menu]').click();
      cy.get('[data-testid=logout-button]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid=login-form]').should('be.visible');
    });
  });

  describe('Dashboard Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
    });

    it('should load dashboard with all components', () => {
      cy.visit('/dashboard');
      
      // Wait for profile data
      cy.wait('@getProfile');
      
      // Check main dashboard components
      cy.get('[data-testid=dashboard]').should('be.visible');
      cy.get('[data-testid=stats-cards]').should('be.visible');
      cy.get('[data-testid=progress-chart]').should('be.visible');
      cy.get('[data-testid=recent-exercises]').should('be.visible');
      cy.get('[data-testid=quick-actions]').should('be.visible');
      
      // Check stats cards have data
      cy.get('[data-testid=stats-cards]').within(() => {
        cy.get('[data-testid=completed-exercises]').should('contain.text', 'Completed');
        cy.get('[data-testid=current-streak]').should('contain.text', 'Streak');
        cy.get('[data-testid=average-score]').should('contain.text', 'Score');
      });
    });

    it('should navigate to exercises from dashboard', () => {
      cy.visit('/dashboard');
      
      // Click on exercises quick action
      cy.get('[data-testid=exercises-quick-action]').click();
      
      // Should navigate to exercises page
      cy.url().should('include', '/exercises');
      cy.wait('@getExercises');
      cy.get('[data-testid=exercises-list]').should('be.visible');
    });
  });

  describe('Exercise Flow', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
      cy.intercept('GET', '/api/exercises/123', { fixture: 'exercises/exercise-detail.json' }).as('getExercise');
      cy.intercept('POST', '/api/exercises/123/submit', { fixture: 'exercises/submission-success.json' }).as('submitExercise');
    });

    it('should complete exercise submission flow', () => {
      cy.visit('/exercises/123');
      
      // Wait for exercise to load
      cy.wait('@getExercise');
      
      // Check exercise components
      cy.get('[data-testid=exercise-title]').should('be.visible');
      cy.get('[data-testid=exercise-description]').should('be.visible');
      cy.get('[data-testid=code-editor]').should('be.visible');
      cy.get('[data-testid=submit-button]').should('be.visible');
      
      // Write code solution
      cy.get('[data-testid=code-editor]').within(() => {
        cy.get('.monaco-editor').should('be.visible');
        // Type code (Monaco editor interaction)
        cy.get('textarea').type('function solution() { return "Hello World"; }', { force: true });
      });
      
      // Submit solution
      cy.get('[data-testid=submit-button]').click();
      
      // Wait for submission
      cy.wait('@submitExercise');
      
      // Check feedback
      cy.get('[data-testid=feedback-panel]').should('be.visible');
      cy.get('[data-testid=submission-status]').should('contain.text', 'Passed');
    });

    it('should handle exercise submission errors', () => {
      cy.intercept('POST', '/api/exercises/123/submit', {
        statusCode: 400,
        body: { error: 'Code execution failed' }
      }).as('submitError');
      
      cy.visit('/exercises/123');
      cy.wait('@getExercise');
      
      // Submit empty solution
      cy.get('[data-testid=submit-button]').click();
      
      cy.wait('@submitError');
      
      // Should show error
      cy.get('[data-testid=error-message]')
        .should('be.visible')
        .and('contain', 'Code execution failed');
    });
  });

  describe('Performance Critical Paths', () => {
    it('should load pages within performance budget', () => {
      // Test page load performance
      const pages = ['/login', '/dashboard', '/exercises'];
      
      pages.forEach(page => {
        cy.visit(page);
        
        // Measure page load time
        cy.window().then((win) => {
          const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
          expect(loadTime).to.be.lessThan(3000); // 3 second budget
        });
      });
    });

    it('should handle network failures gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/dashboard');
      
      // Should show offline message or error state
      cy.get('[data-testid=error-boundary]', { timeout: 10000 })
        .should('be.visible');
    });
  });

  describe('Accessibility Critical Paths', () => {
    it('should be navigable with keyboard only', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'login-button');
      
      // Should be able to submit with Enter
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      cy.focused().type('{enter}');
      
      cy.wait('@login');
      cy.url().should('include', '/dashboard');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/dashboard');
      cy.wait('@getProfile');
      
      // Check main landmarks
      cy.get('[role="main"]').should('exist');
      cy.get('[role="navigation"]').should('exist');
      
      // Check form labels
      cy.visit('/login');
      cy.get('[data-testid=email-input]').should('have.attr', 'aria-label');
      cy.get('[data-testid=password-input]').should('have.attr', 'aria-label');
    });
  });

  describe('Mobile Critical Paths', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should work on mobile viewport', () => {
      cy.visit('/login');
      
      // Check mobile layout
      cy.get('[data-testid=login-form]').should('be.visible');
      cy.get('[data-testid=mobile-menu-button]').should('be.visible');
      
      // Login on mobile
      cy.get('[data-testid=email-input]').type('test@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      cy.get('[data-testid=login-button]').click();
      
      cy.wait('@login');
      cy.url().should('include', '/dashboard');
      
      // Check mobile dashboard
      cy.get('[data-testid=dashboard]').should('be.visible');
      cy.get('[data-testid=mobile-stats]').should('be.visible');
    });
  });
});