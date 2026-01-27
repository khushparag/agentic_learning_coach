describe('Complete Learning Journey', () => {
  beforeEach(() => {
    // Set up test user and mock API responses
    cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' });
    cy.intercept('GET', '/api/progress/*', { fixture: 'progress.json' });
    cy.intercept('GET', '/api/curriculum/*', { fixture: 'curriculum.json' });
    cy.intercept('GET', '/api/tasks/*', { fixture: 'tasks.json' });
    cy.intercept('POST', '/api/submissions', { fixture: 'submission-success.json' });
    
    // Visit the application
    cy.visit('/');
    
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', 'mock-token');
    });
  });

  it('completes a full learning session from dashboard to exercise submission', () => {
    // 1. Start from dashboard
    cy.visit('/dashboard');
    cy.get('[data-testid="dashboard-grid"]').should('be.visible');
    
    // Verify dashboard components are loaded
    cy.get('[data-testid="stats-cards"]').should('be.visible');
    cy.get('[data-testid="today-tasks"]').should('be.visible');
    cy.get('[data-testid="progress-analytics"]').should('be.visible');
    
    // 2. Navigate to learning path
    cy.get('[data-testid="view-learning-path"]').click();
    cy.url().should('include', '/learning-path');
    
    // Verify learning path is displayed
    cy.get('[data-testid="learning-path-viewer"]').should('be.visible');
    cy.get('[data-testid^="module-card-"]').should('have.length.at.least', 1);
    
    // 3. Select a module and task
    cy.get('[data-testid^="module-card-"]').first().click();
    cy.get('[data-testid="task-details-modal"]').should('be.visible');
    
    // Select first incomplete task
    cy.get('[data-testid^="task-item-"]')
      .contains('pending')
      .first()
      .click();
    
    // 4. Navigate to exercise
    cy.get('[data-testid="start-task"]').click();
    cy.url().should('include', '/exercises');
    
    // Verify exercise interface is loaded
    cy.get('[data-testid="exercise-interface"]').should('be.visible');
    cy.get('[data-testid="code-editor"]').should('be.visible');
    cy.get('[data-testid="exercise-instructions"]').should('be.visible');
    
    // 5. Complete the exercise
    // Clear existing code and write solution
    cy.get('[data-testid="monaco-editor"]').clear();
    cy.get('[data-testid="monaco-editor"]').type(`
function solution(input) {
  return input.map(x => x * 2);
}
    `);
    
    // Submit the solution
    cy.get('[data-testid="submit-code"]').click();
    
    // 6. Verify submission feedback
    cy.get('[data-testid="submission-feedback"]', { timeout: 10000 })
      .should('be.visible');
    
    cy.get('[data-testid="test-results"]').should('contain', 'passed');
    cy.get('[data-testid="feedback-message"]').should('be.visible');
    
    // 7. Verify progress update
    cy.get('[data-testid="progress-update"]').should('contain', 'Task completed!');
    
    // 8. Navigate back to dashboard and verify updated stats
    cy.get('[data-testid="back-to-dashboard"]').click();
    cy.url().should('include', '/dashboard');
    
    // Verify stats are updated
    cy.get('[data-testid="completed-tasks-count"]')
      .should('contain', '1'); // Assuming this was the first task
    
    cy.get('[data-testid="xp-progress"]').should('be.visible');
    cy.get('[data-testid="streak-counter"]').should('be.visible');
  });

  it('handles exercise hints and help system', () => {
    // Navigate to an exercise
    cy.visit('/exercises/test-exercise');
    
    // Verify hint system
    cy.get('[data-testid="hint-button"]').should('be.visible');
    cy.get('[data-testid="hint-button"]').click();
    
    cy.get('[data-testid="hint-modal"]').should('be.visible');
    cy.get('[data-testid="hint-content"]').should('contain.text', 'hint');
    
    // Close hint and try help
    cy.get('[data-testid="close-hint"]').click();
    cy.get('[data-testid="help-button"]').click();
    
    cy.get('[data-testid="help-panel"]').should('be.visible');
    cy.get('[data-testid="documentation-links"]').should('be.visible');
  });

  it('supports real-time collaboration features', () => {
    // Navigate to a collaborative exercise
    cy.visit('/exercises/collaborative-exercise');
    
    // Verify collaboration features are available
    cy.get('[data-testid="collaboration-panel"]').should('be.visible');
    cy.get('[data-testid="participant-list"]').should('be.visible');
    
    // Test chat functionality
    cy.get('[data-testid="chat-input"]').type('Hello, team!');
    cy.get('[data-testid="send-message"]').click();
    
    cy.get('[data-testid="chat-messages"]')
      .should('contain', 'Hello, team!');
    
    // Test live cursor sharing
    cy.get('[data-testid="monaco-editor"]').click();
    cy.get('[data-testid="live-cursors"]').should('be.visible');
  });

  it('handles error scenarios gracefully', () => {
    // Mock API errors
    cy.intercept('POST', '/api/submissions', { statusCode: 500 });
    
    cy.visit('/exercises/test-exercise');
    
    // Try to submit code
    cy.get('[data-testid="monaco-editor"]').type('console.log("test");');
    cy.get('[data-testid="submit-code"]').click();
    
    // Verify error handling
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'submission failed');
    
    // Verify retry functionality
    cy.get('[data-testid="retry-submission"]').should('be.visible');
  });

  it('supports accessibility features', () => {
    cy.visit('/dashboard');
    
    // Test keyboard navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid');
    
    // Test high contrast mode
    cy.get('[data-testid="accessibility-settings"]').click();
    cy.get('[data-testid="high-contrast-toggle"]').click();
    
    cy.get('body').should('have.class', 'high-contrast');
    
    // Test screen reader support
    cy.get('[data-testid="main-content"]')
      .should('have.attr', 'role', 'main');
    
    cy.get('[data-testid="navigation"]')
      .should('have.attr', 'role', 'navigation');
  });

  it('works on mobile devices', () => {
    // Set mobile viewport
    cy.viewport('iphone-x');
    
    cy.visit('/dashboard');
    
    // Verify mobile navigation
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    
    cy.get('[data-testid="mobile-navigation"]').should('be.visible');
    
    // Test touch interactions
    cy.get('[data-testid^="module-card-"]').first().click();
    cy.get('[data-testid="task-details-modal"]').should('be.visible');
    
    // Test responsive code editor
    cy.visit('/exercises/test-exercise');
    cy.get('[data-testid="code-editor"]').should('be.visible');
    
    // Verify mobile-optimized controls
    cy.get('[data-testid="mobile-toolbar"]').should('be.visible');
  });

  it('persists progress across sessions', () => {
    // Complete a task
    cy.visit('/exercises/test-exercise');
    cy.get('[data-testid="monaco-editor"]').type('console.log("test");');
    cy.get('[data-testid="submit-code"]').click();
    
    cy.get('[data-testid="submission-feedback"]', { timeout: 10000 })
      .should('be.visible');
    
    // Simulate page refresh
    cy.reload();
    
    // Verify progress is maintained
    cy.visit('/dashboard');
    cy.get('[data-testid="completed-tasks-count"]')
      .should('not.contain', '0');
    
    // Verify task is marked as completed
    cy.visit('/learning-path');
    cy.get('[data-testid^="module-card-"]').first().click();
    cy.get('[data-testid^="task-item-"]')
      .first()
      .should('contain', 'completed');
  });
});