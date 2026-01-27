describe('Learning Flow', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.seedTestData({
      user: {
        email: 'learner@example.com',
        skillLevel: 'beginner',
        goals: ['JavaScript', 'React']
      },
      exercises: [
        {
          id: 'js-variables',
          title: 'JavaScript Variables',
          difficulty: 1,
          starterCode: '// Declare a variable named greeting\n',
          solution: 'const greeting = "Hello, World!";'
        }
      ]
    });
    
    cy.login('learner@example.com', 'password123');
  });

  it('should complete the full learning journey', () => {
    // Start from dashboard
    cy.navigateTo('dashboard');
    cy.percySnapshot('Dashboard - Learning Overview');
    
    // Navigate to exercises
    cy.getByTestId('start-learning-button').click();
    cy.url().should('include', '/exercises');
    
    // Select first exercise
    cy.getByTestId('exercise-js-variables').click();
    cy.waitForLoading();
    
    // Should show exercise interface
    cy.getByTestId('exercise-title').should('contain', 'JavaScript Variables');
    cy.getByTestId('exercise-instructions').should('be.visible');
    cy.percySnapshot('Exercise - Initial State');
    
    // Write code solution
    cy.fillMonacoEditor('const greeting = "Hello, World!";');
    
    // Submit solution
    cy.submitCode();
    
    // Should show success feedback
    cy.getByTestId('feedback-panel').should('be.visible');
    cy.getByTestId('feedback-status').should('contain', 'Correct!');
    cy.percySnapshot('Exercise - Success Feedback');
    
    // Progress should update
    cy.getByTestId('progress-bar').should('be.visible');
    cy.getByTestId('xp-gained').should('contain', '+50 XP');
    
    // Should offer next exercise
    cy.getByTestId('next-exercise-button').should('be.visible');
  });

  it('should handle incorrect solutions gracefully', () => {
    cy.navigateTo('exercises');
    cy.getByTestId('exercise-js-variables').click();
    
    // Submit incorrect solution
    cy.fillMonacoEditor('let greeting = "Wrong!";');
    cy.submitCode();
    
    // Should show helpful feedback
    cy.getByTestId('feedback-panel').should('be.visible');
    cy.getByTestId('feedback-status').should('contain', 'Not quite right');
    cy.getByTestId('feedback-hints').should('be.visible');
    
    // Should allow retry
    cy.getByTestId('try-again-button').should('be.visible');
  });

  it('should provide hints when requested', () => {
    cy.navigateTo('exercises');
    cy.getByTestId('exercise-js-variables').click();
    
    // Request hint
    cy.getByTestId('hint-button').click();
    
    // Should show hint modal
    cy.getByTestId('hint-modal').should('be.visible');
    cy.getByTestId('hint-content').should('contain', 'Use const for variables');
    
    // Close hint
    cy.getByTestId('close-hint-button').click();
    cy.getByTestId('hint-modal').should('not.exist');
  });

  it('should track progress accurately', () => {
    // Complete an exercise
    cy.navigateTo('exercises');
    cy.getByTestId('exercise-js-variables').click();
    cy.fillMonacoEditor('const greeting = "Hello, World!";');
    cy.submitCode();
    
    // Check progress in dashboard
    cy.navigateTo('dashboard');
    cy.getByTestId('completed-exercises').should('contain', '1');
    cy.getByTestId('total-xp').should('contain', '50');
    cy.getByTestId('current-streak').should('contain', '1');
  });

  it('should be keyboard accessible', () => {
    cy.navigateTo('exercises');
    
    // Test keyboard navigation
    cy.testKeyboardNavigation('body', [
      '[data-testid="exercise-js-variables"]',
      '[data-testid="filter-difficulty"]',
      '[data-testid="search-exercises"]'
    ]);
    
    // Test exercise interface keyboard navigation
    cy.getByTestId('exercise-js-variables').click();
    cy.get('.monaco-editor').focus();
    cy.get('.monaco-editor').type('{ctrl+a}const greeting = "Hello!";');
    cy.get('.monaco-editor').tab();
    cy.focused().should('have.attr', 'data-testid', 'submit-code-button');
  });

  it('should work across different screen sizes', () => {
    cy.checkResponsive(['mobile', 'tablet', 'desktop']);
    
    cy.navigateTo('exercises');
    cy.getByTestId('exercise-list').should('be.visible');
    
    // On mobile, should have responsive layout
    cy.viewport(375, 667);
    cy.getByTestId('mobile-menu-button').should('be.visible');
  });
});