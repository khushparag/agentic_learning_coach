#!/usr/bin/env node

/**
 * Visual regression testing script
 * Runs Percy snapshots for Storybook stories and Cypress tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  storybookPort: 6006,
  cypressPort: 3000,
  percyToken: process.env.PERCY_TOKEN,
  buildId: process.env.PERCY_BUILD_ID || `build-${Date.now()}`,
};

// Utility functions
const log = (message) => console.log(`[Visual Tests] ${message}`);
const error = (message) => console.error(`[Visual Tests Error] ${message}`);

const runCommand = (command, options = {}) => {
  try {
    log(`Running: ${command}`);
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (err) {
    error(`Command failed: ${command}`);
    throw err;
  }
};

const waitForServer = async (url, timeout = 30000) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log(`Server ready at ${url}`);
        return true;
      }
    } catch (err) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Server at ${url} not ready after ${timeout}ms`);
};

// Main functions
const buildStorybook = () => {
  log('Building Storybook for visual testing...');
  runCommand('npm run build-storybook');
};

const startStorybookServer = () => {
  log('Starting Storybook server...');
  const child = require('child_process').spawn('npx', ['http-server', 'storybook-static', '-p', config.storybookPort.toString()], {
    stdio: 'pipe',
    detached: true
  });
  
  return child;
};

const runStorybookVisualTests = async () => {
  log('Running Storybook visual tests...');
  
  // Build Storybook
  buildStorybook();
  
  // Start server
  const server = startStorybookServer();
  
  try {
    // Wait for server to be ready
    await waitForServer(`http://localhost:${config.storybookPort}`);
    
    // Run Percy snapshots
    runCommand(`npx percy storybook http://localhost:${config.storybookPort}`);
    
  } finally {
    // Clean up server
    if (server) {
      process.kill(-server.pid);
    }
  }
};

const runCypressVisualTests = async () => {
  log('Running Cypress visual tests...');
  
  // Start development server
  const devServer = require('child_process').spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    detached: true
  });
  
  try {
    // Wait for dev server to be ready
    await waitForServer(`http://localhost:${config.cypressPort}`);
    
    // Run Cypress with Percy
    runCommand('npm run test:visual');
    
  } finally {
    // Clean up dev server
    if (devServer) {
      process.kill(-devServer.pid);
    }
  }
};

const generateVisualTestReport = () => {
  log('Generating visual test report...');
  
  const reportData = {
    buildId: config.buildId,
    timestamp: new Date().toISOString(),
    storybookUrl: `http://localhost:${config.storybookPort}`,
    cypressUrl: `http://localhost:${config.cypressPort}`,
    percyProject: process.env.PERCY_PROJECT || 'agentic-learning-coach',
  };
  
  const reportPath = path.join(__dirname, '../visual-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`Visual test report saved to ${reportPath}`);
};

// CLI interface
const main = async () => {
  const command = process.argv[2];
  
  if (!config.percyToken) {
    error('PERCY_TOKEN environment variable is required');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'storybook':
        await runStorybookVisualTests();
        break;
        
      case 'cypress':
        await runCypressVisualTests();
        break;
        
      case 'all':
        await runStorybookVisualTests();
        await runCypressVisualTests();
        break;
        
      case 'report':
        generateVisualTestReport();
        break;
        
      default:
        log('Usage: node visual-tests.js [storybook|cypress|all|report]');
        log('');
        log('Commands:');
        log('  storybook  Run visual tests for Storybook stories');
        log('  cypress    Run visual tests for Cypress E2E tests');
        log('  all        Run all visual tests');
        log('  report     Generate visual test report');
        process.exit(1);
    }
    
    log('Visual tests completed successfully!');
    
  } catch (err) {
    error(`Visual tests failed: ${err.message}`);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runStorybookVisualTests,
  runCypressVisualTests,
  generateVisualTestReport,
};