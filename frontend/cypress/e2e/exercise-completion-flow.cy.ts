describe('Exercise Completion Flow', () => {
  beforeEach(() => {
    // Login as authenticated user
    cy.login('testuser@example.com', 'password');
    
    // Mock exercise data
    cy.intercept('GET', '/api/exercises/current', {
      statusCode: 200,
      body: {
        id: 'exercise-123',
        title: 'Array Methods Practice',
        description: 'Practice using JavaScript array methods',
        instructions: 'Create a function that filters and maps an array of numbers',
        starterCode: 'function processNumbers(numbers) {\n  // Your code here\n}',
        testCases: [
          {
            input: '[1, 2, 3, 4, 5]',
            expected: '[2, 4, 6, 8, 10]',
            description: 'Should double even numbers'
          }
        ],
        hints: [
          'Use the filter method to get even numbers',
          'Use the map method to double the values'
        ],
        difficulty: 3,
        timeLimit: 1800, // 30 minutes
        language: 'javascript'
      }
    }).as('getCurrentExercise');

    cy.intercept('POST', '/api/submissions', {
      statusCode: 201,
      body: {
        id: 'submission-123',
        status: 'pending'
      }
    }).as('submitCode');

    cy.intercept('GET', '/api/submissions/*/result', {
      statusCode: 200,
      body: {
        passed: true,
        score: 95,
        executionTime: 150,
        memoryUsed: 25,
        testResults: [
          {
            name: 'Test 1: Basic functionality',
            passed: true,
            message: 'Passed',
            executionTime: 50
          },
          {
            name: 'Test 2: Edge cases',
            passed: true,
            message: 'Passed',
            executionTime: 45
          }
        ],
        feedback: 'Excellent work! Your solution is correct and efficient.'
      }
    }).as('getResult');

    cy.visit('/exercises/current');
  });

  describe('Exercise Interface', () => {
    it('displays exercise information correctly', () => {
      cy.wait('@getCurrentExercise');

      // Check exercise details
      cy.get('[data-testid="exercise-title"]').should('contain', 'Array Methods Practice');
      cy.get('[data-testid="exercise-description"]').should('contain', 'Practice using JavaScript array methods');
      cy.get('[data-testid="exercise-difficulty"]').should('contain', '3');
      cy.get('[data-testid="time-limit"]').should('contain', '30 minutes');

      // Check instructions panel
      cy.get('[data-testid="instructions-panel"]').should('be.visible');
      cy.get('[data-testid="instructions-content"]').should('contain', 'Create a function');

      // Check code editor
      cy.get('[data-testid="code-editor"]').should('be.visible');
      cy.get('[data-testid="code-editor"]').should('contain', 'function processNumbers');

      // Check test cases panel
      cy.get('[data-testid="test-cases-panel"]').should('be.visible');
      cy.get('[data-testid="test-case-1"]').should('contain', '[1, 2, 3, 4, 5]');
    });

    it('shows timer countdown', () => {
      cy.wait('@getCurrentExercise');

      cy.get('[data-testid="timer"]').should('be.visible');
      cy.get('[data-testid="timer"]').should('contain', '30:00');

      // Timer should count down
      cy.wait(1000);
      cy.get('[data-testid="timer"]').should('contain', '29:59');
    });

    it('allows resizing panels', () => {
      cy.wait('@getCurrentExercise');

      // Get initial panel sizes
      cy.get('[data-testid="instructions-panel"]').then($panel => {
        const initialWidth = $panel.width();

        // Drag resize handle
        cy.get('[data-testid="resize-handle-instructions"]')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove', { clientX: 100 })
          .trigger('mouseup');

        // Panel should have resized
        cy.get('[data-testid="instructions-panel"]').should($newPanel => {
          expect($newPanel.width()).not.to.equal(initialWidth);
        });
      });
    });
  });

  describe('Code Editing', () => {
    it('allows editing code in Monaco editor', () => {
      cy.wait('@getCurrentExercise');

      // Clear existing code and type new solution
      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      
      const solution = `function processNumbers(numbers) {
  return numbers
    .filter(num => num % 2 === 0)
    .map(num => num * 2);
}`;

      cy.get('[data-testid="code-editor"]').type(solution);

      // Code should be updated
      cy.get('[data-testid="code-editor"]').should('contain', 'filter');
      cy.get('[data-testid="code-editor"]').should('contain', 'map');
    });

    it('provides syntax highlighting and autocomplete', () => {
      cy.wait('@getCurrentExercise');

      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}numbers.');

      // Should show autocomplete suggestions
      cy.get('.monaco-editor .suggest-widget').should('be.visible');
      cy.get('.monaco-editor .suggest-widget').should('contain', 'filter');
      cy.get('.monaco-editor .suggest-widget').should('contain', 'map');
    });

    it('shows syntax errors', () => {
      cy.wait('@getCurrentExercise');

      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}function invalid( {');

      // Should show error indicators
      cy.get('.monaco-editor .squiggly-error').should('be.visible');
      cy.get('[data-testid="syntax-errors"]').should('be.visible');
      cy.get('[data-testid="syntax-errors"]').should('contain', 'Syntax error');
    });

    it('supports keyboard shortcuts', () => {
      cy.wait('@getCurrentExercise');

      cy.get('[data-testid="code-editor"]').click();
      
      // Test format document shortcut
      cy.get('[data-testid="code-editor"]').type('{shift+alt+f}');
      
      // Test comment toggle
      cy.get('[data-testid="code-editor"]').type('{ctrl+/}');
      cy.get('[data-testid="code-editor"]').should('contain', '//');
    });
  });

  describe('Code Execution and Testing', () => {
    beforeEach(() => {
      cy.wait('@getCurrentExercise');
      
      // Enter a working solution
      const solution = `function processNumbers(numbers) {
  return numbers
    .filter(num => num % 2 === 0)
    .map(num => num * 2);
}`;

      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      cy.get('[data-testid="code-editor"]').type(solution);
    });

    it('runs code and shows test results', () => {
      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');

      // Should show loading state
      cy.get('[data-testid="execution-status"]').should('contain', 'Running tests...');
      cy.get('[data-testid="run-code"]').should('be.disabled');

      cy.wait('@getResult');

      // Should show results
      cy.get('[data-testid="test-results"]').should('be.visible');
      cy.get('[data-testid="test-result-1"]').should('contain', 'Passed');
      cy.get('[data-testid="test-result-2"]').should('contain', 'Passed');
      cy.get('[data-testid="overall-score"]').should('contain', '95');
    });

    it('shows detailed feedback', () => {
      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');

      cy.get('[data-testid="feedback-panel"]').should('be.visible');
      cy.get('[data-testid="feedback-content"]').should('contain', 'Excellent work');
      cy.get('[data-testid="execution-time"]').should('contain', '150ms');
      cy.get('[data-testid="memory-usage"]').should('contain', '25MB');
    });

    it('handles test failures gracefully', () => {
      // Mock failed test result
      cy.intercept('GET', '/api/submissions/*/result', {
        statusCode: 200,
        body: {
          passed: false,
          score: 45,
          testResults: [
            {
              name: 'Test 1: Basic functionality',
              passed: false,
              message: 'Expected [2, 4] but got [1, 2]',
              executionTime: 50
            }
          ],
          feedback: 'Your solution has some issues. Check the filtering logic.'
        }
      }).as('getFailedResult');

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getFailedResult');

      // Should show failure state
      cy.get('[data-testid="test-result-1"]').should('contain', 'Failed');
      cy.get('[data-testid="test-result-1"]').should('contain', 'Expected [2, 4] but got [1, 2]');
      cy.get('[data-testid="overall-score"]').should('contain', '45');
      cy.get('[data-testid="feedback-content"]').should('contain', 'some issues');
    });

    it('shows runtime errors', () => {
      // Mock runtime error
      cy.intercept('GET', '/api/submissions/*/result', {
        statusCode: 200,
        body: {
          passed: false,
          score: 0,
          error: {
            type: 'RuntimeError',
            message: 'TypeError: numbers.filter is not a function',
            line: 2
          },
          feedback: 'Your code encountered a runtime error.'
        }
      }).as('getRuntimeError');

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getRuntimeError');

      // Should show error details
      cy.get('[data-testid="runtime-error"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'TypeError');
      cy.get('[data-testid="error-line"]').should('contain', 'Line 2');
    });
  });

  describe('Hints and Help', () => {
    beforeEach(() => {
      cy.wait('@getCurrentExercise');
    });

    it('shows hints when requested', () => {
      cy.get('[data-testid="hints-button"]').click();

      cy.get('[data-testid="hints-panel"]').should('be.visible');
      cy.get('[data-testid="hint-1"]').should('be.visible');
      cy.get('[data-testid="hint-1"]').should('contain', 'Use the filter method');

      // Should be able to reveal hints progressively
      cy.get('[data-testid="show-next-hint"]').click();
      cy.get('[data-testid="hint-2"]').should('be.visible');
      cy.get('[data-testid="hint-2"]').should('contain', 'Use the map method');
    });

    it('tracks hint usage', () => {
      cy.get('[data-testid="hints-button"]').click();
      cy.get('[data-testid="show-next-hint"]').click();

      // Should show hint usage indicator
      cy.get('[data-testid="hints-used"]').should('contain', '1 of 2 hints used');
    });

    it('provides contextual help', () => {
      cy.get('[data-testid="help-button"]').click();

      cy.get('[data-testid="help-modal"]').should('be.visible');
      cy.get('[data-testid="help-content"]').should('contain', 'Array Methods');
      cy.get('[data-testid="help-examples"]').should('be.visible');
    });

    it('shows documentation links', () => {
      cy.get('[data-testid="help-button"]').click();

      cy.get('[data-testid="documentation-links"]').should('be.visible');
      cy.get('[data-testid="mdn-link"]').should('have.attr', 'href').and('include', 'mozilla.org');
    });
  });

  describe('Exercise Completion', () => {
    beforeEach(() => {
      cy.wait('@getCurrentExercise');
      
      const solution = `function processNumbers(numbers) {
  return numbers
    .filter(num => num % 2 === 0)
    .map(num => num * 2);
}`;

      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      cy.get('[data-testid="code-editor"]').type(solution);
    });

    it('completes exercise successfully', () => {
      cy.intercept('POST', '/api/exercises/*/complete', {
        statusCode: 200,
        body: {
          completed: true,
          xpEarned: 150,
          newLevel: false,
          nextExercise: {
            id: 'exercise-124',
            title: 'Object Manipulation'
          }
        }
      }).as('completeExercise');

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');

      // Should show completion option
      cy.get('[data-testid="complete-exercise"]').should('be.visible');
      cy.get('[data-testid="complete-exercise"]').click();

      cy.wait('@completeExercise');

      // Should show completion celebration
      cy.get('[data-testid="completion-modal"]').should('be.visible');
      cy.get('[data-testid="xp-earned"]').should('contain', '150 XP');
      cy.get('[data-testid="next-exercise"]').should('contain', 'Object Manipulation');
    });

    it('handles level up celebration', () => {
      cy.intercept('POST', '/api/exercises/*/complete', {
        statusCode: 200,
        body: {
          completed: true,
          xpEarned: 200,
          newLevel: true,
          currentLevel: 3,
          levelUpRewards: {
            badge: 'JavaScript Novice',
            unlockedFeatures: ['Code Reviews']
          }
        }
      }).as('completeWithLevelUp');

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');
      cy.get('[data-testid="complete-exercise"]').click();

      cy.wait('@completeWithLevelUp');

      // Should show level up animation
      cy.get('[data-testid="level-up-modal"]').should('be.visible');
      cy.get('[data-testid="new-level"]').should('contain', 'Level 3');
      cy.get('[data-testid="new-badge"]').should('contain', 'JavaScript Novice');
      cy.get('[data-testid="unlocked-features"]').should('contain', 'Code Reviews');
    });

    it('allows proceeding to next exercise', () => {
      cy.intercept('POST', '/api/exercises/*/complete', {
        statusCode: 200,
        body: {
          completed: true,
          xpEarned: 150,
          nextExercise: {
            id: 'exercise-124',
            title: 'Object Manipulation'
          }
        }
      }).as('completeExercise');

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');
      cy.get('[data-testid="complete-exercise"]').click();
      cy.wait('@completeExercise');

      cy.get('[data-testid="next-exercise-button"]').click();

      // Should navigate to next exercise
      cy.url().should('include', '/exercises/exercise-124');
    });

    it('allows reviewing solution', () => {
      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');

      cy.get('[data-testid="view-solution"]').click();

      cy.get('[data-testid="solution-modal"]').should('be.visible');
      cy.get('[data-testid="solution-code"]').should('be.visible');
      cy.get('[data-testid="solution-explanation"]').should('be.visible');
    });
  });

  describe('Time Management', () => {
    it('warns when time is running low', () => {
      cy.wait('@getCurrentExercise');

      // Mock timer with 5 minutes remaining
      cy.window().then(win => {
        win.postMessage({ type: 'SET_TIMER', timeRemaining: 300 }, '*');
      });

      cy.get('[data-testid="time-warning"]').should('be.visible');
      cy.get('[data-testid="time-warning"]').should('contain', '5 minutes remaining');
    });

    it('handles time expiration', () => {
      cy.wait('@getCurrentExercise');

      // Mock timer expiration
      cy.window().then(win => {
        win.postMessage({ type: 'TIMER_EXPIRED' }, '*');
      });

      cy.get('[data-testid="time-expired-modal"]').should('be.visible');
      cy.get('[data-testid="extend-time"]').should('be.visible');
      cy.get('[data-testid="submit-anyway"]').should('be.visible');
    });

    it('allows extending time', () => {
      cy.intercept('POST', '/api/exercises/*/extend-time', {
        statusCode: 200,
        body: { newTimeLimit: 3600 }
      }).as('extendTime');

      cy.wait('@getCurrentExercise');

      cy.window().then(win => {
        win.postMessage({ type: 'TIMER_EXPIRED' }, '*');
      });

      cy.get('[data-testid="extend-time"]').click();
      cy.wait('@extendTime');

      // Timer should reset
      cy.get('[data-testid="timer"]').should('contain', '60:00');
      cy.get('[data-testid="time-expired-modal"]').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      cy.wait('@getCurrentExercise');

      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'run-code');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'hints-button');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'help-button');
    });

    it('provides screen reader announcements', () => {
      cy.wait('@getCurrentExercise');

      const solution = `function processNumbers(numbers) {
  return numbers.filter(num => num % 2 === 0).map(num => num * 2);
}`;

      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      cy.get('[data-testid="code-editor"]').type(solution);

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitCode');
      cy.wait('@getResult');

      // Should announce test results
      cy.get('[aria-live="polite"]').should('contain', 'All tests passed');
    });

    it('has proper ARIA labels', () => {
      cy.wait('@getCurrentExercise');

      cy.get('[data-testid="code-editor"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="run-code"]').should('have.attr', 'aria-describedby');
      cy.get('[data-testid="timer"]').should('have.attr', 'aria-live');
    });
  });

  describe('Error Recovery', () => {
    it('handles submission failures', () => {
      cy.intercept('POST', '/api/submissions', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('submitError');

      cy.wait('@getCurrentExercise');

      const solution = 'function processNumbers(numbers) { return []; }';
      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      cy.get('[data-testid="code-editor"]').type(solution);

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@submitError');

      // Should show error message
      cy.get('[data-testid="submission-error"]').should('be.visible');
      cy.get('[data-testid="retry-submission"]').should('be.visible');

      // Should allow retry
      cy.intercept('POST', '/api/submissions', {
        statusCode: 201,
        body: { id: 'submission-123', status: 'pending' }
      }).as('submitRetry');

      cy.get('[data-testid="retry-submission"]').click();
      cy.wait('@submitRetry');

      cy.get('[data-testid="execution-status"]').should('contain', 'Running tests');
    });

    it('recovers from network disconnection', () => {
      cy.wait('@getCurrentExercise');

      // Simulate network disconnection
      cy.intercept('POST', '/api/submissions', { forceNetworkError: true }).as('networkError');

      const solution = 'function processNumbers(numbers) { return []; }';
      cy.get('[data-testid="code-editor"]').click();
      cy.get('[data-testid="code-editor"]').type('{ctrl+a}');
      cy.get('[data-testid="code-editor"]').type(solution);

      cy.get('[data-testid="run-code"]').click();
      cy.wait('@networkError');

      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      cy.get('[data-testid="offline-message"]').should('contain', 'Connection lost');

      // Should queue submission for retry
      cy.get('[data-testid="queued-submission"]').should('be.visible');
    });
  });
});