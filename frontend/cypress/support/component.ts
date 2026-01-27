// Component testing support file

import './commands';
import { mount } from 'cypress/react18';

// Import global styles
import '../../src/index.css';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Example: cy.mount(<MyComponent />)