#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Configures the development environment for the Learning Coach frontend
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class DevSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join(this.projectRoot, '.env.development');
    this.packageJson = path.join(this.projectRoot, 'package.json');
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
  }

  async runCommand(command, description, options = {}) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: this.projectRoot,
        ...options
      });
      this.log(`✅ ${description} completed`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  checkPrerequisites() {
    this.log('🔍 Checking prerequisites...', 'info');
    
    const requirements = [
      { command: 'node --version', name: 'Node.js', minVersion: '18.0.0' },
      { command: 'npm --version', name: 'npm', minVersion: '8.0.0' },
      { command: 'git --version', name: 'Git' },
    ];

    let allMet = true;
    
    requirements.forEach(req => {
      try {
        const output = execSync(req.command, { encoding: 'utf8' });
        const version = output.trim().split(' ').pop();
        
        if (req.minVersion) {
          const current = version.replace(/[^\d.]/g, '');
          const required = req.minVersion;
          
          if (this.compareVersions(current, required) < 0) {
            this.log(`❌ ${req.name} version ${current} is below required ${required}`, 'error');
            allMet = false;
          } else {
            this.log(`✅ ${req.name} ${version}`, 'success');
          }
        } else {
          this.log(`✅ ${req.name} ${version}`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${req.name} not found`, 'error');
        allMet = false;
      }
    });

    if (!allMet) {
      this.log('Please install missing prerequisites before continuing', 'error');
      process.exit(1);
    }
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  setupEnvironmentFile() {
    this.log('📝 Setting up environment configuration...', 'info');
    
    const defaultEnv = `# =============================================================================
# Learning Coach Frontend - Development Environment Configuration
# =============================================================================
# This file contains environment variables for local development.
# Copy this file to .env.local and customize as needed.
#
# IMPORTANT: Never commit sensitive values like API keys to version control!
# =============================================================================

# -----------------------------------------------------------------------------
# API Configuration
# -----------------------------------------------------------------------------
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------
VITE_APP_ENV=development
VITE_APP_NAME=Agentic Learning Coach
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true

# -----------------------------------------------------------------------------
# Feature Flags
# -----------------------------------------------------------------------------
VITE_FEATURE_SOCIAL_LEARNING=true
VITE_FEATURE_GAMIFICATION=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_REAL_TIME_UPDATES=true
VITE_FEATURE_CODE_SHARING=true
VITE_FEATURE_PEER_CHALLENGES=true
VITE_FEATURE_WEBSOCKET_RECONNECT=true
VITE_FEATURE_LIVE_COLLABORATION=true
VITE_FEATURE_REAL_TIME_LEADERBOARD=true

# -----------------------------------------------------------------------------
# Development Configuration
# -----------------------------------------------------------------------------
VITE_USE_MOCK_DATA=false
VITE_ENABLE_QUERY_DEVTOOLS=true
VITE_ENABLE_REDUX_DEVTOOLS=true
VITE_HOT_RELOAD=true
VITE_OPEN_BROWSER=true

# -----------------------------------------------------------------------------
# Performance Configuration
# -----------------------------------------------------------------------------
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760
VITE_IMAGE_QUALITY=80
VITE_BUNDLE_ANALYZER=false

# -----------------------------------------------------------------------------
# UI Configuration
# -----------------------------------------------------------------------------
VITE_DEFAULT_THEME=system
VITE_ENABLE_ANIMATIONS=true
VITE_DEFAULT_LOCALE=en-US
VITE_SHOW_GRID_OVERLAY=false

# -----------------------------------------------------------------------------
# Code Editor Configuration
# -----------------------------------------------------------------------------
VITE_DEFAULT_LANGUAGE=javascript
VITE_EDITOR_MINIMAP=false
VITE_EDITOR_THEME=vs-dark
VITE_EDITOR_FONT_SIZE=14
VITE_EDITOR_TAB_SIZE=2

# -----------------------------------------------------------------------------
# Learning Configuration
# -----------------------------------------------------------------------------
VITE_DEFAULT_SESSION_LENGTH=60
VITE_MAX_HINTS_PER_EXERCISE=3
VITE_AUTOSAVE_INTERVAL=30000
VITE_SHOW_SOLUTION_AFTER_ATTEMPTS=3

# -----------------------------------------------------------------------------
# Gamification Configuration
# -----------------------------------------------------------------------------
VITE_ENABLE_XP_ANIMATIONS=true
VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS=true
VITE_STREAK_REMINDER_TIME=20:00
VITE_XP_MULTIPLIER=1.0

# -----------------------------------------------------------------------------
# Social Features Configuration
# -----------------------------------------------------------------------------
VITE_MAX_SOLUTIONS_PER_DAY=10
VITE_MAX_CHALLENGES_PER_DAY=5
VITE_MAX_STUDY_GROUP_MEMBERS=20
VITE_ENABLE_CHAT=true

# -----------------------------------------------------------------------------
# Testing Configuration
# -----------------------------------------------------------------------------
VITE_TEST_TIMEOUT=10000
VITE_E2E_BASE_URL=http://localhost:3000
VITE_MOCK_API_DELAY=100

# -----------------------------------------------------------------------------
# Security Configuration
# -----------------------------------------------------------------------------
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
VITE_ENABLE_HTTPS=false

# -----------------------------------------------------------------------------
# Monitoring Configuration
# -----------------------------------------------------------------------------
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_LOG_LEVEL=debug
`;

    if (!fs.existsSync(this.envFile)) {
      fs.writeFileSync(this.envFile, defaultEnv);
      this.log('✅ Created .env.development file', 'success');
    } else {
      this.log('⚠️  .env.development already exists, skipping', 'warning');
    }

    // Create .env.local template
    const localEnvFile = path.join(this.projectRoot, '.env.local.template');
    if (!fs.existsSync(localEnvFile)) {
      const localTemplate = `# =============================================================================
# Local Environment Overrides
# =============================================================================
# Copy this file to .env.local and customize for your local development setup.
# This file should NOT be committed to version control.
# =============================================================================

# Override API URL if running backend on different port
# VITE_API_BASE_URL=http://localhost:8001

# Enable/disable features for testing
# VITE_FEATURE_SOCIAL_LEARNING=false
# VITE_USE_MOCK_DATA=true

# Personal preferences
# VITE_DEFAULT_THEME=dark
# VITE_EDITOR_THEME=vs-light

# Development tools
# VITE_BUNDLE_ANALYZER=true
# VITE_SHOW_GRID_OVERLAY=true
`;
      fs.writeFileSync(localEnvFile, localTemplate);
      this.log('✅ Created .env.local.template file', 'success');
    }
  }

  async installDependencies() {
    this.log('📦 Installing dependencies...', 'info');
    
    // Check if node_modules exists and is up to date
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    const packageLockPath = path.join(this.projectRoot, 'package-lock.json');
    
    let needsInstall = !fs.existsSync(nodeModulesPath);
    
    if (!needsInstall && fs.existsSync(packageLockPath)) {
      const packageLockStat = fs.statSync(packageLockPath);
      const nodeModulesStat = fs.statSync(nodeModulesPath);
      
      // If package-lock.json is newer than node_modules, reinstall
      needsInstall = packageLockStat.mtime > nodeModulesStat.mtime;
    }
    
    if (needsInstall) {
      const result = await this.runCommand('npm ci', 'Installing dependencies');
      if (!result.success) {
        this.log('Falling back to npm install...', 'warning');
        await this.runCommand('npm install', 'Installing dependencies (fallback)');
      }
    } else {
      this.log('✅ Dependencies are up to date', 'success');
    }
  }

  setupGitHooks() {
    this.log('🪝 Setting up Git hooks...', 'info');
    
    const huskyPath = path.join(this.projectRoot, '.husky');
    if (!fs.existsSync(huskyPath)) {
      this.runCommand('npx husky install', 'Installing Husky');
      
      // Pre-commit hook
      const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and type checking
npm run lint
npm run type-check

# Run tests
npm run test:unit

# Check for security vulnerabilities
npm audit --audit-level moderate
`;
      
      fs.mkdirSync(huskyPath, { recursive: true });
      fs.writeFileSync(path.join(huskyPath, 'pre-commit'), preCommitHook);
      fs.chmodSync(path.join(huskyPath, 'pre-commit'), '755');
      
      this.log('✅ Git hooks configured', 'success');
    } else {
      this.log('⚠️  Git hooks already configured', 'warning');
    }
  }

  setupVSCodeConfiguration() {
    this.log('⚙️  Setting up VS Code configuration...', 'info');
    
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }
    
    // Settings
    const settings = {
      "typescript.preferences.importModuleSpecifier": "relative",
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "files.associations": {
        "*.css": "tailwindcss"
      },
      "emmet.includeLanguages": {
        "javascript": "javascriptreact",
        "typescript": "typescriptreact"
      },
      "tailwindCSS.includeLanguages": {
        "typescript": "javascript",
        "typescriptreact": "javascript"
      }
    };
    
    const settingsPath = path.join(vscodeDir, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      this.log('✅ VS Code settings configured', 'success');
    }
    
    // Extensions
    const extensions = {
      "recommendations": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "ms-vscode.vscode-json",
        "usernamehw.errorlens",
        "gruntfuggly.todo-tree"
      ]
    };
    
    const extensionsPath = path.join(vscodeDir, 'extensions.json');
    if (!fs.existsSync(extensionsPath)) {
      fs.writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
      this.log('✅ VS Code extensions configured', 'success');
    }
  }

  async checkBackendConnection() {
    this.log('🔗 Checking backend connection...', 'info');
    
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        this.log('✅ Backend is running and accessible', 'success');
      } else {
        this.log('⚠️  Backend is running but returned error status', 'warning');
      }
    } catch (error) {
      this.log('⚠️  Backend is not running. Start it with: docker-compose up -d', 'warning');
      this.log('   Or run: cd .. && python -m uvicorn src.adapters.api.main:app --reload', 'info');
    }
  }

  async startDevServer() {
    this.log('🚀 Starting development server...', 'info');
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: this.projectRoot
    });
    
    devProcess.on('close', (code) => {
      if (code !== 0) {
        this.log(`Development server exited with code ${code}`, 'error');
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('Shutting down development server...', 'info');
      devProcess.kill('SIGINT');
      process.exit(0);
    });
  }

  async run() {
    this.log('🎯 Setting up Learning Coach Frontend development environment...', 'info');
    
    try {
      this.checkPrerequisites();
      this.setupEnvironmentFile();
      await this.installDependencies();
      this.setupGitHooks();
      this.setupVSCodeConfiguration();
      await this.checkBackendConnection();
      
      this.log('\n🎉 Development environment setup complete!', 'success');
      this.log('\nNext steps:', 'info');
      this.log('  1. Copy .env.local.template to .env.local and customize', 'info');
      this.log('  2. Start the backend: docker-compose up -d', 'info');
      this.log('  3. Start the frontend: npm run dev', 'info');
      this.log('  4. Open http://localhost:3000 in your browser', 'info');
      
      // Ask if user wants to start dev server
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nWould you like to start the development server now? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          this.startDevServer();
        } else {
          this.log('Run "npm run dev" when you\'re ready to start developing!', 'info');
        }
      });
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const setup = new DevSetup();
  setup.run();
}

module.exports = DevSetup;