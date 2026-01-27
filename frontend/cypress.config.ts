/**
 * Cypress Configuration
 * 
 * Note: This file requires Cypress to be installed.
 * Run: npm install --save-dev cypress @cypress/code-coverage @percy/cypress
 */

// @ts-ignore - Cypress types available when installed
import { defineConfig } from 'cypress';

// @ts-ignore - Cypress types available when installed
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    // Test files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:8000/api',
      coverage: true
    },
    
    // @ts-ignore - Types available when Cypress is installed
    setupNodeEvents(on, config) {
      // Code coverage
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@cypress/code-coverage/task')(on, config);
      
      // Percy visual testing
      on('task', {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        percySnapshot: require('@percy/cypress/task'),
      });
      
      // Custom tasks
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        
        clearDatabase() {
          // Task to clear test database
          return null;
        },
        
        seedDatabase(_data: unknown) {
          // Task to seed test database
          return null;
        }
      });
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
  },
  
  // Global configuration
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  
  // Folders
  downloadsFolder: 'cypress/downloads',
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
});
