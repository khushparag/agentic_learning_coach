#!/usr/bin/env node

/**
 * Deployment Script
 * Handles safe deployment with rollback capabilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = this.loadConfig();
    this.deploymentId = `deploy-${Date.now()}`;
    
    this.log(`Initializing deployment to ${environment}`, 'info');
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), 'deploy.config.json');
    
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Default configuration
    return {
      staging: {
        url: 'https://staging.agentic-learning-coach.com',
        healthEndpoint: '/health',
        smokeTests: [
          '/login',
          '/dashboard',
          '/exercises'
        ],
        rollbackOnFailure: true,
        maxRollbackAttempts: 3
      },
      production: {
        url: 'https://agentic-learning-coach.com',
        healthEndpoint: '/health',
        smokeTests: [
          '/login',
          '/dashboard',
          '/exercises',
          '/api/health'
        ],
        rollbackOnFailure: true,
        maxRollbackAttempts: 3,
        requiresApproval: true
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      deploy: '🚀'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || error.stderr || error.message 
      };
    }
  }

  async preDeploymentChecks() {
    this.log('Running pre-deployment checks...', 'info');
    
    const checks = [
      {
        name: 'Quality Gates',
        command: 'node scripts/quality-gates.js',
        critical: true
      },
      {
        name: 'Build Application',
        command: 'npm run build',
        critical: true
      },
      {
        name: 'Security Scan',
        command: 'npm audit --audit-level high',
        critical: false
      }
    ];

    for (const check of checks) {
      const result = await this.runCommand(check.command, check.name);
      
      if (!result.success) {
        if (check.critical) {
          throw new Error(`Critical pre-deployment check failed: ${check.name}`);
        } else {
          this.log(`Non-critical check failed: ${check.name}`, 'warning');
        }
      } else {
        this.log(`✅ ${check.name} passed`, 'success');
      }
    }
  }

  async backupCurrentDeployment() {
    this.log('Creating deployment backup...', 'info');
    
    const envConfig = this.config[this.environment];
    if (!envConfig) {
      throw new Error(`No configuration found for environment: ${this.environment}`);
    }

    // In a real deployment, this would backup the current deployment
    // For now, we'll simulate by saving deployment metadata
    const backupData = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      previousVersion: process.env.CURRENT_VERSION || 'unknown',
      newVersion: process.env.NEW_VERSION || 'latest'
    };

    const backupPath = path.join(process.cwd(), `deployment-backup-${this.deploymentId}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    this.log(`Backup created: ${backupPath}`, 'success');
    return backupPath;
  }

  async deployApplication() {
    this.log(`Deploying to ${this.environment}...`, 'deploy');
    
    // Simulate deployment process
    // In a real scenario, this would:
    // 1. Upload build artifacts
    // 2. Update container images
    // 3. Apply Kubernetes manifests
    // 4. Wait for rollout completion
    
    const deployCommands = [
      'echo "Uploading build artifacts..."',
      'echo "Updating container registry..."',
      'echo "Applying deployment manifests..."',
      'echo "Waiting for rollout completion..."'
    ];

    for (const command of deployCommands) {
      const result = await this.runCommand(command, 'Deployment step');
      if (!result.success) {
        throw new Error(`Deployment step failed: ${command}`);
      }
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.log('Application deployed successfully', 'success');
  }

  async runHealthChecks() {
    this.log('Running health checks...', 'info');
    
    const envConfig = this.config[this.environment];
    const healthUrl = `${envConfig.url}${envConfig.healthEndpoint}`;
    
    // Wait for application to be ready
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.runCommand(
          `curl -f -s ${healthUrl}`,
          `Health check attempt ${attempts + 1}`
        );
        
        if (result.success) {
          this.log('Health check passed', 'success');
          return true;
        }
      } catch (error) {
        // Continue trying
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Health checks failed after maximum attempts');
  }

  async runSmokeTests() {
    this.log('Running smoke tests...', 'info');
    
    const envConfig = this.config[this.environment];
    const baseUrl = envConfig.url;
    
    for (const endpoint of envConfig.smokeTests) {
      const url = `${baseUrl}${endpoint}`;
      
      const result = await this.runCommand(
        `curl -f -s -o /dev/null -w "%{http_code}" ${url}`,
        `Smoke test: ${endpoint}`
      );
      
      if (!result.success || !result.output.startsWith('2')) {
        throw new Error(`Smoke test failed for ${endpoint}: HTTP ${result.output}`);
      }
      
      this.log(`✅ Smoke test passed: ${endpoint}`, 'success');
    }
  }

  async runPostDeploymentTests() {
    this.log('Running post-deployment tests...', 'info');
    
    // Run critical E2E tests
    const testResult = await this.runCommand(
      'npm run test:e2e:critical',
      'Critical E2E tests'
    );
    
    if (!testResult.success) {
      throw new Error('Critical E2E tests failed');
    }
    
    this.log('Post-deployment tests passed', 'success');
  }

  async rollback(backupPath) {
    this.log('Initiating rollback...', 'warning');
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Simulate rollback process
    const rollbackCommands = [
      `echo "Rolling back to version: ${backupData.previousVersion}"`,
      'echo "Restoring previous deployment..."',
      'echo "Updating container images..."',
      'echo "Waiting for rollback completion..."'
    ];
    
    for (const command of rollbackCommands) {
      const result = await this.runCommand(command, 'Rollback step');
      if (!result.success) {
        throw new Error(`Rollback step failed: ${command}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify rollback
    await this.runHealthChecks();
    
    this.log('Rollback completed successfully', 'success');
  }

  async notifyDeployment(success, error = null) {
    const notification = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      success,
      timestamp: new Date().toISOString(),
      error: error?.message
    };

    // In a real deployment, this would send notifications to:
    // - Slack/Teams channels
    // - Email lists
    // - Monitoring systems
    // - Issue tracking systems
    
    this.log(`Deployment notification: ${JSON.stringify(notification)}`, 'info');
  }

  async deploy() {
    let backupPath = null;
    
    try {
      // Pre-deployment phase
      await this.preDeploymentChecks();
      backupPath = await this.backupCurrentDeployment();
      
      // Deployment phase
      await this.deployApplication();
      
      // Verification phase
      await this.runHealthChecks();
      await this.runSmokeTests();
      await this.runPostDeploymentTests();
      
      // Success
      this.log(`🎉 Deployment to ${this.environment} completed successfully!`, 'success');
      await this.notifyDeployment(true);
      
      return { success: true, deploymentId: this.deploymentId };
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      
      // Rollback if configured
      const envConfig = this.config[this.environment];
      if (envConfig.rollbackOnFailure && backupPath) {
        try {
          await this.rollback(backupPath);
          this.log('Rollback completed due to deployment failure', 'warning');
        } catch (rollbackError) {
          this.log(`Rollback failed: ${rollbackError.message}`, 'error');
          error.rollbackError = rollbackError.message;
        }
      }
      
      await this.notifyDeployment(false, error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const deployment = new DeploymentManager(environment);
  
  deployment.deploy()
    .then(result => {
      console.log(`Deployment completed: ${result.deploymentId}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentManager;