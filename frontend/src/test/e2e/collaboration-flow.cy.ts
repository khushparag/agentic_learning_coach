describe('Collaboration Flow', () => {
  beforeEach(() => {
    // Login as authenticated user
    cy.login('testuser@example.com', 'password');
    
    // Mock collaboration data
    cy.intercept('GET', '/api/collaboration/study-groups', {
      statusCode: 200,
      body: [
        {
          id: 'group-1',
          name: 'React Study Group',
          description: 'Learning React together',
          members: 5,
          isPublic: true,
          currentTopic: 'Hooks',
          createdAt: new Date().toISOString()
        },
        {
          id: 'group-2',
          name: 'JavaScript Fundamentals',
          description: 'Mastering JS basics',
          members: 8,
          isPublic: true,
          currentTopic: 'Async/Await',
          createdAt: new Date().toISOString()
        }
      ]
    }).as('getStudyGroups');

    cy.intercept('POST', '/api/collaboration/study-groups/*/join', {
      statusCode: 200,
      body: { success: true, message: 'Successfully joined study group' }
    }).as('joinStudyGroup');

    cy.intercept('GET', '/api/collaboration/chat/*/messages', {
      statusCode: 200,
      body: [
        {
          id: 'msg-1',
          userId: 'user-1',
          username: 'Alice',
          message: 'Hello everyone!',
          timestamp: new Date().toISOString(),
          type: 'text'
        },
        {
          id: 'msg-2',
          userId: 'user-2',
          username: 'Bob',
          message: 'Hey Alice! How are you doing with the React hooks?',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          type: 'text'
        }
      ]
    }).as('getChatMessages');

    cy.intercept('POST', '/api/collaboration/chat/messages', {
      statusCode: 201,
      body: {
        id: 'msg-new',
        userId: 'current-user',
        username: 'TestUser',
        message: 'Hello from Cypress!',
        timestamp: new Date().toISOString(),
        type: 'text'
      }
    }).as('sendChatMessage');

    cy.visit('/collaboration');
  });

  describe('Study Group Discovery', () => {
    it('displays available study groups', () => {
      cy.wait('@getStudyGroups');

      cy.get('[data-testid="study-groups-list"]').should('be.visible');
      cy.get('[data-testid="study-group-item"]').should('have.length', 2);
      
      // Check first study group
      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.contains('React Study Group').should('be.visible');
        cy.contains('5 members').should('be.visible');
        cy.contains('Hooks').should('be.visible');
      });
    });

    it('allows filtering study groups', () => {
      cy.wait('@getStudyGroups');

      // Filter by topic
      cy.get('[data-testid="topic-filter"]').select('React');
      
      cy.get('[data-testid="study-group-item"]').should('have.length', 1);
      cy.contains('React Study Group').should('be.visible');
      cy.contains('JavaScript Fundamentals').should('not.exist');
    });

    it('allows searching study groups', () => {
      cy.wait('@getStudyGroups');

      cy.get('[data-testid="search-input"]').type('JavaScript');
      
      cy.get('[data-testid="study-group-item"]').should('have.length', 1);
      cy.contains('JavaScript Fundamentals').should('be.visible');
    });

    it('shows study group details in modal', () => {
      cy.wait('@getStudyGroups');

      cy.get('[data-testid="study-group-item"]').first().click();
      
      cy.get('[data-testid="study-group-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'React Study Group');
      cy.get('[data-testid="group-description"]').should('contain', 'Learning React together');
      cy.get('[data-testid="member-count"]').should('contain', '5 members');
    });
  });

  describe('Joining Study Groups', () => {
    it('successfully joins a study group', () => {
      cy.wait('@getStudyGroups');

      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="join-group-btn"]').click();
      });

      cy.wait('@joinStudyGroup');

      // Should show success message
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="success-toast"]').should('contain', 'Successfully joined');

      // Button should change to "Joined"
      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="joined-indicator"]').should('be.visible');
      });
    });

    it('handles join group errors', () => {
      cy.intercept('POST', '/api/collaboration/study-groups/*/join', {
        statusCode: 409,
        body: { error: 'Study group is full' }
      }).as('joinGroupError');

      cy.wait('@getStudyGroups');

      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="join-group-btn"]').click();
      });

      cy.wait('@joinGroupError');

      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Study group is full');
    });

    it('requires confirmation for private groups', () => {
      // Mock private group
      cy.intercept('GET', '/api/collaboration/study-groups', {
        statusCode: 200,
        body: [
          {
            id: 'private-group',
            name: 'Advanced React Patterns',
            description: 'Invitation only group',
            members: 3,
            isPublic: false,
            currentTopic: 'Advanced Patterns'
          }
        ]
      }).as('getPrivateGroups');

      cy.visit('/collaboration');
      cy.wait('@getPrivateGroups');

      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="request-invite-btn"]').click();
      });

      cy.get('[data-testid="invite-request-modal"]').should('be.visible');
      cy.get('[data-testid="request-message"]').type('I would like to join this group to learn advanced React patterns.');
      cy.get('[data-testid="send-request-btn"]').click();

      cy.get('[data-testid="success-toast"]').should('contain', 'Invite request sent');
    });
  });

  describe('Real-time Chat', () => {
    beforeEach(() => {
      // Join a study group first
      cy.wait('@getStudyGroups');
      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="join-group-btn"]').click();
      });
      cy.wait('@joinStudyGroup');

      // Open chat
      cy.get('[data-testid="open-chat-btn"]').click();
    });

    it('displays chat messages', () => {
      cy.wait('@getChatMessages');

      cy.get('[data-testid="chat-container"]').should('be.visible');
      cy.get('[data-testid="chat-message"]').should('have.length', 2);
      
      cy.get('[data-testid="chat-message"]').first().within(() => {
        cy.contains('Alice').should('be.visible');
        cy.contains('Hello everyone!').should('be.visible');
      });
    });

    it('sends chat messages', () => {
      cy.wait('@getChatMessages');

      cy.get('[data-testid="message-input"]').type('Hello from Cypress test!');
      cy.get('[data-testid="send-message-btn"]').click();

      cy.wait('@sendChatMessage');

      // Should show the new message
      cy.get('[data-testid="chat-message"]').should('contain', 'Hello from Cypress test!');
      
      // Input should be cleared
      cy.get('[data-testid="message-input"]').should('have.value', '');
    });

    it('sends messages with Enter key', () => {
      cy.wait('@getChatMessages');

      cy.get('[data-testid="message-input"]').type('Testing Enter key{enter}');

      cy.wait('@sendChatMessage');
      cy.get('[data-testid="chat-message"]').should('contain', 'Testing Enter key');
    });

    it('prevents sending empty messages', () => {
      cy.wait('@getChatMessages');

      cy.get('[data-testid="send-message-btn"]').should('be.disabled');
      
      cy.get('[data-testid="message-input"]').type('   '); // Only spaces
      cy.get('[data-testid="send-message-btn"]').should('be.disabled');
      
      cy.get('[data-testid="message-input"]').clear().type('Valid message');
      cy.get('[data-testid="send-message-btn"]').should('not.be.disabled');
    });

    it('shows typing indicators', () => {
      cy.wait('@getChatMessages');

      // Mock WebSocket typing event
      cy.window().then((win) => {
        win.postMessage({
          type: 'user_typing',
          data: { userId: 'user-2', username: 'Bob', isTyping: true }
        }, '*');
      });

      cy.get('[data-testid="typing-indicator"]').should('be.visible');
      cy.get('[data-testid="typing-indicator"]').should('contain', 'Bob is typing...');
    });

    it('supports code sharing', () => {
      cy.wait('@getChatMessages');

      cy.get('[data-testid="share-code-btn"]').click();
      
      cy.get('[data-testid="code-share-modal"]').should('be.visible');
      cy.get('[data-testid="code-editor"]').type('const greeting = "Hello World!";');
      cy.get('[data-testid="language-select"]').select('JavaScript');
      cy.get('[data-testid="share-code-confirm"]').click();

      cy.wait('@sendChatMessage');
      
      // Should show code block in chat
      cy.get('[data-testid="chat-message"]').last().within(() => {
        cy.get('[data-testid="code-block"]').should('be.visible');
        cy.get('[data-testid="code-block"]').should('contain', 'const greeting');
      });
    });
  });

  describe('Code Review Collaboration', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/collaboration/code-reviews/pending', {
        statusCode: 200,
        body: [
          {
            id: 'review-1',
            submissionId: 'submission-1',
            requesterName: 'Alice',
            exerciseTitle: 'Array Methods Practice',
            requestedAt: new Date().toISOString(),
            status: 'pending'
          }
        ]
      }).as('getPendingReviews');

      cy.intercept('GET', '/api/submissions/submission-1', {
        statusCode: 200,
        body: {
          id: 'submission-1',
          code: 'function processArray(arr) {\n  return arr.filter(x => x > 0).map(x => x * 2);\n}',
          language: 'javascript',
          exerciseTitle: 'Array Methods Practice'
        }
      }).as('getSubmission');

      cy.intercept('POST', '/api/collaboration/code-reviews/review-1/submit', {
        statusCode: 200,
        body: { success: true }
      }).as('submitReview');

      cy.visit('/collaboration/code-reviews');
    });

    it('displays pending code reviews', () => {
      cy.wait('@getPendingReviews');

      cy.get('[data-testid="pending-reviews"]').should('be.visible');
      cy.get('[data-testid="review-item"]').should('have.length', 1);
      
      cy.get('[data-testid="review-item"]').first().within(() => {
        cy.contains('Alice').should('be.visible');
        cy.contains('Array Methods Practice').should('be.visible');
        cy.get('[data-testid="review-btn"]').should('be.visible');
      });
    });

    it('allows reviewing code submissions', () => {
      cy.wait('@getPendingReviews');

      cy.get('[data-testid="review-item"]').first().within(() => {
        cy.get('[data-testid="review-btn"]').click();
      });

      cy.wait('@getSubmission');

      // Should open code review interface
      cy.get('[data-testid="code-review-modal"]').should('be.visible');
      cy.get('[data-testid="code-display"]').should('contain', 'function processArray');
      
      // Add line comment
      cy.get('[data-testid="code-line-1"]').click();
      cy.get('[data-testid="add-comment-btn"]').click();
      cy.get('[data-testid="comment-input"]').type('Consider adding input validation here.');
      cy.get('[data-testid="save-comment-btn"]').click();

      // Add overall feedback
      cy.get('[data-testid="overall-feedback"]').type('Good solution! The logic is correct and the code is clean. Just consider adding some input validation.');
      cy.get('[data-testid="rating-4"]').click(); // 4-star rating

      cy.get('[data-testid="submit-review-btn"]').click();
      cy.wait('@submitReview');

      cy.get('[data-testid="success-toast"]').should('contain', 'Review submitted successfully');
    });

    it('supports collaborative code editing', () => {
      cy.intercept('POST', '/api/collaboration/live-coding/create', {
        statusCode: 201,
        body: {
          sessionId: 'session-123',
          roomUrl: '/collaboration/live-coding/session-123'
        }
      }).as('createLiveCodingSession');

      cy.get('[data-testid="start-live-coding"]').click();
      
      cy.get('[data-testid="live-coding-modal"]').should('be.visible');
      cy.get('[data-testid="session-title"]').type('React Hooks Practice');
      cy.get('[data-testid="invite-users"]').select(['Alice', 'Bob']);
      cy.get('[data-testid="create-session-btn"]').click();

      cy.wait('@createLiveCodingSession');

      // Should redirect to live coding session
      cy.url().should('include', '/collaboration/live-coding/session-123');
      cy.get('[data-testid="collaborative-editor"]').should('be.visible');
    });
  });

  describe('Progress Sharing', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/collaboration/progress-feed', {
        statusCode: 200,
        body: [
          {
            id: 'progress-1',
            userId: 'user-1',
            username: 'Alice',
            type: 'achievement',
            title: 'Completed JavaScript Fundamentals',
            description: 'Just finished all exercises in the JavaScript module!',
            timestamp: new Date().toISOString(),
            likes: 5,
            comments: 2
          },
          {
            id: 'progress-2',
            userId: 'user-2',
            username: 'Bob',
            type: 'milestone',
            title: 'Reached Level 5',
            description: 'Leveled up after completing 50 exercises',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            likes: 3,
            comments: 1
          }
        ]
      }).as('getProgressFeed');

      cy.intercept('POST', '/api/collaboration/progress-sharing', {
        statusCode: 201,
        body: {
          id: 'progress-new',
          success: true
        }
      }).as('shareProgress');

      cy.visit('/collaboration/progress');
    });

    it('displays progress feed', () => {
      cy.wait('@getProgressFeed');

      cy.get('[data-testid="progress-feed"]').should('be.visible');
      cy.get('[data-testid="progress-item"]').should('have.length', 2);
      
      cy.get('[data-testid="progress-item"]').first().within(() => {
        cy.contains('Alice').should('be.visible');
        cy.contains('Completed JavaScript Fundamentals').should('be.visible');
        cy.contains('5 likes').should('be.visible');
      });
    });

    it('allows sharing progress updates', () => {
      cy.wait('@getProgressFeed');

      cy.get('[data-testid="share-progress-btn"]').click();
      
      cy.get('[data-testid="share-progress-modal"]').should('be.visible');
      cy.get('[data-testid="progress-type"]').select('Achievement');
      cy.get('[data-testid="progress-title"]').type('Completed React Hooks Module');
      cy.get('[data-testid="progress-description"]').type('Just finished learning about useState and useEffect!');
      cy.get('[data-testid="visibility"]').select('Study Group');
      
      cy.get('[data-testid="share-btn"]').click();
      cy.wait('@shareProgress');

      cy.get('[data-testid="success-toast"]').should('contain', 'Progress shared successfully');
    });

    it('supports liking and commenting on progress', () => {
      cy.intercept('POST', '/api/collaboration/progress-sharing/progress-1/like', {
        statusCode: 200,
        body: { likes: 6 }
      }).as('likeProgress');

      cy.intercept('POST', '/api/collaboration/progress-sharing/progress-1/comment', {
        statusCode: 201,
        body: {
          id: 'comment-new',
          content: 'Congratulations!',
          author: 'TestUser'
        }
      }).as('addComment');

      cy.wait('@getProgressFeed');

      // Like a progress update
      cy.get('[data-testid="progress-item"]').first().within(() => {
        cy.get('[data-testid="like-btn"]').click();
      });

      cy.wait('@likeProgress');
      cy.get('[data-testid="progress-item"]').first().should('contain', '6 likes');

      // Add a comment
      cy.get('[data-testid="progress-item"]').first().within(() => {
        cy.get('[data-testid="comment-btn"]').click();
      });

      cy.get('[data-testid="comment-modal"]').should('be.visible');
      cy.get('[data-testid="comment-input"]').type('Congratulations on completing the module!');
      cy.get('[data-testid="post-comment-btn"]').click();

      cy.wait('@addComment');
      cy.get('[data-testid="success-toast"]').should('contain', 'Comment added');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      cy.wait('@getStudyGroups');

      // Tab through study group items
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'study-group-item');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'join-group-btn');

      // Enter should activate join button
      cy.focused().type('{enter}');
      cy.wait('@joinStudyGroup');
    });

    it('provides proper ARIA labels', () => {
      cy.wait('@getStudyGroups');

      cy.get('[data-testid="study-groups-list"]').should('have.attr', 'role', 'list');
      cy.get('[data-testid="study-group-item"]').should('have.attr', 'role', 'listitem');
      cy.get('[data-testid="join-group-btn"]').should('have.attr', 'aria-label');
    });

    it('announces real-time updates to screen readers', () => {
      cy.wait('@getStudyGroups');

      // Join group and open chat
      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="join-group-btn"]').click();
      });
      cy.wait('@joinStudyGroup');
      cy.get('[data-testid="open-chat-btn"]').click();
      cy.wait('@getChatMessages');

      // Should have live region for new messages
      cy.get('[aria-live="polite"]').should('exist');

      // Mock new message
      cy.window().then((win) => {
        win.postMessage({
          type: 'chat_message',
          data: {
            id: 'msg-new',
            username: 'Charlie',
            message: 'New message for screen reader test'
          }
        }, '*');
      });

      cy.get('[aria-live="polite"]').should('contain', 'New message from Charlie');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      cy.intercept('GET', '/api/collaboration/study-groups', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/collaboration');
      cy.wait('@networkError');

      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Unable to load study groups');
      cy.get('[data-testid="retry-btn"]').should('be.visible');
    });

    it('handles chat connection failures', () => {
      cy.wait('@getStudyGroups');

      // Join group
      cy.get('[data-testid="study-group-item"]').first().within(() => {
        cy.get('[data-testid="join-group-btn"]').click();
      });
      cy.wait('@joinStudyGroup');

      // Mock WebSocket connection failure
      cy.window().then((win) => {
        win.postMessage({ type: 'websocket_error' }, '*');
      });

      cy.get('[data-testid="connection-status"]').should('contain', 'Disconnected');
      cy.get('[data-testid="reconnect-btn"]').should('be.visible');
    });

    it('provides offline functionality', () => {
      // Simulate offline mode
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        win.dispatchEvent(new Event('offline'));
      });

      cy.visit('/collaboration');

      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      cy.get('[data-testid="offline-message"]').should('contain', 'You are currently offline');
      
      // Should show cached data if available
      cy.get('[data-testid="cached-data-notice"]').should('be.visible');
    });
  });
});