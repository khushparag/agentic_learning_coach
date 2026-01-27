describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearTestData();
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');
    
    // Fill login form
    cy.getByTestId('email-input').type('test@example.com');
    cy.getByTestId('password-input').type('password123');
    cy.getByTestId('login-button').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.getByTestId('user-menu').should('be.visible');
    
    // Take visual snapshot
    cy.percySnapshot('Dashboard - After Login');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/login');
    
    // Mock failed login response
    cy.mockApi('POST', '/api/auth/login', 
      { error: 'Invalid credentials' }, 
      401
    );
    
    cy.getByTestId('email-input').type('invalid@example.com');
    cy.getByTestId('password-input').type('wrongpassword');
    cy.getByTestId('login-button').click();
    
    // Should show error message
    cy.checkToast('Invalid credentials', 'error');
    cy.url().should('include', '/login');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login();
    
    // Logout
    cy.logout();
    
    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should be accessible', () => {
    cy.visit('/login');
    cy.checkA11y();
  });

  it('should work on mobile devices', () => {
    cy.checkResponsive(['mobile']);
    cy.visit('/login');
    
    cy.getByTestId('email-input').should('be.visible');
    cy.getByTestId('password-input').should('be.visible');
    cy.getByTestId('login-button').should('be.visible');
  });
});