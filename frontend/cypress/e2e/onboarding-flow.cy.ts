describe('Onboarding Flow', () => {
  beforeEach(() => {
    // Reset database state
    cy.task('db:reset');
    
    // Mock API responses
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          username: 'newuser'
        },
        token: 'mock-jwt-token'
      }
    }).as('register');

    cy.intercept('POST', '/api/onboarding/skill-assessment', {
      statusCode: 200,
      body: {
        skillLevel: 'intermediate',
        recommendations: ['React', 'TypeScript']
      }
    }).as('skillAssessment');

    cy.intercept('POST', '/api/onboarding/learning-path', {
      statusCode: 201,
      body: {
        id: 'path-123',
        title: 'Full-Stack JavaScript Developer',
        modules: [
          {
            id: 'module-1',
            title: 'JavaScript Fundamentals',
            estimatedHours: 20
          },
          {
            id: 'module-2',
            title: 'React Development',
            estimatedHours: 30
          }
        ]
      }
    }).as('createLearningPath');

    cy.visit('/onboarding');
  });

  describe('Complete Onboarding Journey', () => {
    it('successfully completes full onboarding flow', () => {
      // Step 1: Welcome Screen
      cy.get('[data-testid="onboarding-welcome"]').should('be.visible');
      cy.get('h1').should('contain', 'Welcome to Learning Coach');
      cy.get('[data-testid="start-onboarding"]').click();

      // Step 2: Account Creation
      cy.get('[data-testid="account-creation"]').should('be.visible');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="username"]').type('newuser');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@register');

      // Step 3: Skill Assessment
      cy.get('[data-testid="skill-assessment"]').should('be.visible');
      cy.get('h2').should('contain', 'Skill Assessment');

      // Answer JavaScript questions
      cy.get('[data-testid="question-1"]').within(() => {
        cy.get('input[value="intermediate"]').check();
      });

      cy.get('[data-testid="question-2"]').within(() => {
        cy.get('input[value="yes"]').check();
      });

      cy.get('[data-testid="question-3"]').within(() => {
        cy.get('input[value="some"]').check();
      });

      cy.get('[data-testid="submit-assessment"]').click();
      cy.wait('@skillAssessment');

      // Step 4: Goal Setting
      cy.get('[data-testid="goal-setting"]').should('be.visible');
      cy.get('h2').should('contain', 'Learning Goals');

      // Select learning goals
      cy.get('[data-testid="goal-react"]').click();
      cy.get('[data-testid="goal-typescript"]').click();
      cy.get('[data-testid="goal-nodejs"]').click();

      // Set time commitment
      cy.get('select[name="hoursPerWeek"]').select('10-15 hours');
      cy.get('input[name="preferredTimes"]').check(['evening', 'weekend']);

      cy.get('[data-testid="save-goals"]').click();

      // Step 5: Tech Stack Selection
      cy.get('[data-testid="tech-stack-selection"]').should('be.visible');
      cy.get('h2').should('contain', 'Choose Your Path');

      // Select full-stack path
      cy.get('[data-testid="path-fullstack"]').click();
      cy.get('[data-testid="confirm-path"]').click();

      cy.wait('@createLearningPath');

      // Step 6: Onboarding Complete
      cy.get('[data-testid="onboarding-complete"]').should('be.visible');
      cy.get('h2').should('contain', 'You\'re All Set!');
      cy.get('[data-testid="view-dashboard"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });

    it('handles validation errors during account creation', () => {
      cy.get('[data-testid="start-onboarding"]').click();

      // Try to create account with invalid data
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('weak');
      cy.get('[data-testid="create-account"]').click();

      // Should show validation errors
      cy.get('[data-testid="email-error"]').should('contain', 'Invalid email format');
      cy.get('[data-testid="password-error"]').should('contain', 'Password must be at least 8 characters');

      // Fix errors and proceed
      cy.get('input[name="email"]').clear().type('valid@example.com');
      cy.get('input[name="password"]').clear().type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@register');
      cy.get('[data-testid="skill-assessment"]').should('be.visible');
    });

    it('allows skipping skill assessment', () => {
      cy.get('[data-testid="start-onboarding"]').click();

      // Complete account creation
      cy.get('input[name="email"]').type('skipuser@example.com');
      cy.get('input[name="username"]').type('skipuser');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@register');

      // Skip skill assessment
      cy.get('[data-testid="skip-assessment"]').click();

      // Should proceed to goal setting with default skill level
      cy.get('[data-testid="goal-setting"]').should('be.visible');
    });

    it('supports going back to previous steps', () => {
      cy.get('[data-testid="start-onboarding"]').click();

      // Complete account creation
      cy.get('input[name="email"]').type('backuser@example.com');
      cy.get('input[name="username"]').type('backuser');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@register');

      // Go to skill assessment
      cy.get('[data-testid="skill-assessment"]').should('be.visible');

      // Go back to account creation
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="account-creation"]').should('be.visible');

      // Go forward again
      cy.get('[data-testid="create-account"]').click();
      cy.get('[data-testid="skill-assessment"]').should('be.visible');
    });
  });

  describe('Skill Assessment', () => {
    beforeEach(() => {
      // Skip to skill assessment
      cy.get('[data-testid="start-onboarding"]').click();
      cy.get('input[name="email"]').type('testuser@example.com');
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();
      cy.wait('@register');
    });

    it('adapts questions based on previous answers', () => {
      // Answer first question as beginner
      cy.get('[data-testid="question-1"]').within(() => {
        cy.get('input[value="beginner"]').check();
      });

      cy.get('[data-testid="next-question"]').click();

      // Should show beginner-level questions
      cy.get('[data-testid="question-2"]').should('contain', 'basic');
    });

    it('provides immediate feedback on answers', () => {
      cy.get('[data-testid="question-1"]').within(() => {
        cy.get('input[value="advanced"]').check();
      });

      // Should show explanation
      cy.get('[data-testid="answer-explanation"]').should('be.visible');
      cy.get('[data-testid="answer-explanation"]').should('contain', 'Great choice');
    });

    it('shows progress through assessment', () => {
      // Check initial progress
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'aria-valuenow', '0');

      // Answer first question
      cy.get('[data-testid="question-1"]').within(() => {
        cy.get('input[value="intermediate"]').check();
      });
      cy.get('[data-testid="next-question"]').click();

      // Progress should update
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'aria-valuenow', '25');
    });
  });

  describe('Learning Path Creation', () => {
    beforeEach(() => {
      // Skip to tech stack selection
      cy.get('[data-testid="start-onboarding"]').click();
      cy.completeAccountCreation();
      cy.completeSkillAssessment();
      cy.completeGoalSetting();
    });

    it('shows personalized path recommendations', () => {
      cy.get('[data-testid="tech-stack-selection"]').should('be.visible');

      // Should show recommended paths based on assessment
      cy.get('[data-testid="recommended-paths"]').should('be.visible');
      cy.get('[data-testid="path-fullstack"]').should('have.class', 'recommended');
    });

    it('allows customizing learning path', () => {
      cy.get('[data-testid="path-fullstack"]').click();
      cy.get('[data-testid="customize-path"]').click();

      // Should open customization modal
      cy.get('[data-testid="path-customization"]').should('be.visible');

      // Add additional modules
      cy.get('[data-testid="add-module"]').click();
      cy.get('select[name="moduleType"]').select('Testing');
      cy.get('[data-testid="confirm-module"]').click();

      // Remove a module
      cy.get('[data-testid="module-react"]').within(() => {
        cy.get('[data-testid="remove-module"]').click();
      });

      cy.get('[data-testid="save-customization"]').click();
      cy.get('[data-testid="confirm-path"]').click();

      cy.wait('@createLearningPath');
    });

    it('estimates completion time accurately', () => {
      cy.get('[data-testid="path-fullstack"]').click();

      // Should show time estimate
      cy.get('[data-testid="time-estimate"]').should('contain', 'weeks');
      cy.get('[data-testid="hours-estimate"]').should('contain', 'hours');

      // Time should update when customizing
      cy.get('[data-testid="customize-path"]').click();
      cy.get('[data-testid="add-module"]').click();
      cy.get('select[name="moduleType"]').select('Advanced JavaScript');
      cy.get('[data-testid="confirm-module"]').click();

      // Estimate should increase
      cy.get('[data-testid="time-estimate"]').should('not.contain', 'weeks');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation throughout onboarding', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'start-onboarding');

      cy.focused().type('{enter}');
      cy.get('[data-testid="account-creation"]').should('be.visible');

      // Tab through form fields
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'email');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'username');
    });

    it('provides proper ARIA labels and descriptions', () => {
      cy.get('[data-testid="start-onboarding"]').should('have.attr', 'aria-label');
      
      cy.get('[data-testid="start-onboarding"]').click();
      
      cy.get('input[name="email"]').should('have.attr', 'aria-describedby');
      cy.get('input[name="password"]').should('have.attr', 'aria-describedby');
    });

    it('announces progress updates to screen readers', () => {
      cy.get('[data-testid="start-onboarding"]').click();
      
      // Should have live region for announcements
      cy.get('[aria-live="polite"]').should('exist');
      
      cy.completeAccountCreation();
      
      // Should announce step completion
      cy.get('[aria-live="polite"]').should('contain', 'Account created successfully');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: { error: 'Email already exists' }
      }).as('registerError');

      cy.get('[data-testid="start-onboarding"]').click();
      
      cy.get('input[name="email"]').type('existing@example.com');
      cy.get('input[name="username"]').type('existinguser');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@registerError');

      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Email already exists');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('handles network connectivity issues', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/register', { forceNetworkError: true }).as('networkError');

      cy.get('[data-testid="start-onboarding"]').click();
      cy.completeAccountCreationForm();
      cy.get('[data-testid="create-account"]').click();

      cy.wait('@networkError');

      // Should show network error message
      cy.get('[data-testid="error-message"]').should('contain', 'Network error');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Should allow retry
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: { user: { id: 'user-123' }, token: 'token' }
      }).as('registerRetry');

      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@registerRetry');

      cy.get('[data-testid="skill-assessment"]').should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('saves progress when user navigates away', () => {
      cy.get('[data-testid="start-onboarding"]').click();
      cy.completeAccountCreation();

      // Start skill assessment
      cy.get('[data-testid="question-1"]').within(() => {
        cy.get('input[value="intermediate"]').check();
      });

      // Navigate away
      cy.visit('/');

      // Return to onboarding
      cy.visit('/onboarding');

      // Should resume from where left off
      cy.get('[data-testid="skill-assessment"]').should('be.visible');
      cy.get('[data-testid="question-1"] input[value="intermediate"]').should('be.checked');
    });

    it('allows resuming onboarding after browser refresh', () => {
      cy.get('[data-testid="start-onboarding"]').click();
      cy.completeAccountCreation();
      cy.completeSkillAssessment();

      // Refresh browser
      cy.reload();

      // Should resume from goal setting
      cy.get('[data-testid="goal-setting"]').should('be.visible');
    });
  });
});

// Custom commands for reusable actions
Cypress.Commands.add('completeAccountCreation', () => {
  cy.get('input[name="email"]').type('testuser@example.com');
  cy.get('input[name="username"]').type('testuser');
  cy.get('input[name="password"]').type('SecurePassword123!');
  cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
  cy.get('[data-testid="create-account"]').click();
  cy.wait('@register');
});

Cypress.Commands.add('completeAccountCreationForm', () => {
  cy.get('input[name="email"]').type('testuser@example.com');
  cy.get('input[name="username"]').type('testuser');
  cy.get('input[name="password"]').type('SecurePassword123!');
  cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
});

Cypress.Commands.add('completeSkillAssessment', () => {
  cy.get('[data-testid="question-1"]').within(() => {
    cy.get('input[value="intermediate"]').check();
  });
  cy.get('[data-testid="question-2"]').within(() => {
    cy.get('input[value="yes"]').check();
  });
  cy.get('[data-testid="question-3"]').within(() => {
    cy.get('input[value="some"]').check();
  });
  cy.get('[data-testid="submit-assessment"]').click();
  cy.wait('@skillAssessment');
});

Cypress.Commands.add('completeGoalSetting', () => {
  cy.get('[data-testid="goal-react"]').click();
  cy.get('[data-testid="goal-typescript"]').click();
  cy.get('select[name="hoursPerWeek"]').select('10-15 hours');
  cy.get('[data-testid="save-goals"]').click();
});