#!/usr/bin/env node

/**
 * Enhanced Development Server Script
 * 
 * This script provides an enhanced development experience with:
 * - Automatic dependency checking
 * - Environment validation
 * - Mock API server management
 * - Development tools integration
 * - Hot reload optimization
 */

import { spawn, exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Configuration
const config = {
  devPort: process.env.VITE_DEV_PORT || 3000,
  mockApiPort: process.env.VITE_MOCK_API_PORT || 3001,
  apiUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
  enableMockApi: process.env.VITE_USE_MOCK_API === 'true',
  autoInstall: process.env.AUTO_INSTALL_DEPS !== 'false',
  verbose: process.env.VERBOSE === 'true'
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}`)
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`)
}

function logInfo(message) {
  log(`${colors.cyan}ℹ️  ${message}${colors.reset}`)
}

// Check if a command exists
function commandExists(command) {
  return new Promise((resolve) => {
    exec(`which ${command}`, (error) => {
      resolve(!error)
    })
  })
}

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      resolve(!stdout.trim())
    })
  })
}

// Kill process on port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9`, (error) => {
      resolve(!error)
    })
  })
}

// Check dependencies
async function checkDependencies() {
  logSection('Checking Dependencies')
  
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8')
    )
    
    // Check if node_modules exists
    try {
      await fs.access(path.join(projectRoot, 'node_modules'))
      logSuccess('node_modules directory exists')
    } catch {
      logWarning('node_modules directory not found')
      
      if (config.autoInstall) {
        logInfo('Installing dependencies...')
        await runCommand('npm', ['install'], { cwd: projectRoot })
        logSuccess('Dependencies installed')
      } else {
        logError('Please run "npm install" to install dependencies')
        process.exit(1)
      }
    }
    
    // Check for required tools
    const requiredTools = ['node', 'npm']
    for (const tool of requiredTools) {
      if (await commandExists(tool)) {
        logSuccess(`${tool} is available`)
      } else {
        logError(`${tool} is not installed or not in PATH`)
        process.exit(1)
      }
    }
    
  } catch (error) {
    logError(`Failed to check dependencies: ${error.message}`)
    process.exit(1)
  }
}

// Validate environment
async function validateEnvironment() {
  logSection('Validating Environment')
  
  try {
    // Check if .env files exist
    const envFiles = ['.env', '.env.development', '.env.local']
    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(projectRoot, envFile))
        logSuccess(`${envFile} exists`)
      } catch {
        if (envFile === '.env') {
          logWarning(`${envFile} not found - using defaults`)
        }
      }
    }
    
    // Validate required environment variables
    const requiredEnvVars = ['VITE_API_BASE_URL']
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        logSuccess(`${envVar} is set`)
      } else {
        logWarning(`${envVar} is not set - using default`)
      }
    }
    
  } catch (error) {
    logError(`Failed to validate environment: ${error.message}`)
    process.exit(1)
  }
}

// Check backend connectivity
async function checkBackendConnectivity() {
  logSection('Checking Backend Connectivity')
  
  try {
    const response = await fetch(`${config.apiUrl}/health`)
    if (response.ok) {
      logSuccess(`Backend is available at ${config.apiUrl}`)
    } else {
      logWarning(`Backend responded with status ${response.status}`)
    }
  } catch (error) {
    logWarning(`Backend not available at ${config.apiUrl}`)
    logInfo('This is normal if the backend is not running yet')
  }
}

// Setup mock API server
async function setupMockApi() {
  if (!config.enableMockApi) {
    return
  }
  
  logSection('Setting up Mock API Server')
  
  try {
    // Check if mock API port is available
    if (!(await isPortAvailable(config.mockApiPort))) {
      logWarning(`Port ${config.mockApiPort} is in use, attempting to free it...`)
      await killProcessOnPort(config.mockApiPort)
    }
    
    // Start mock API server
    const mockApiScript = path.join(projectRoot, 'scripts', 'mock-api-server.js')
    try {
      await fs.access(mockApiScript)
      logInfo(`Starting mock API server on port ${config.mockApiPort}...`)
      
      const mockApiProcess = spawn('node', [mockApiScript], {
        stdio: config.verbose ? 'inherit' : 'pipe',
        env: { ...process.env, PORT: config.mockApiPort }
      })
      
      // Give the mock API server time to start
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      logSuccess(`Mock API server started on port ${config.mockApiPort}`)
      
      // Store process reference for cleanup
      process.mockApiProcess = mockApiProcess
      
    } catch {
      logWarning('Mock API server script not found - skipping')
    }
    
  } catch (error) {
    logError(`Failed to setup mock API: ${error.message}`)
  }
}

// Run command with promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    child.on('error', reject)
  })
}

// Start development server
async function startDevServer() {
  logSection('Starting Development Server')
  
  try {
    // Check if dev port is available
    if (!(await isPortAvailable(config.devPort))) {
      logWarning(`Port ${config.devPort} is in use, attempting to free it...`)
      await killProcessOnPort(config.devPort)
      
      // Wait a moment for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    logInfo(`Starting Vite development server on port ${config.devPort}...`)
    
    // Start Vite dev server
    const viteArgs = [
      'run', 'dev',
      '--host', '0.0.0.0',
      '--port', config.devPort.toString()
    ]
    
    if (config.verbose) {
      viteArgs.push('--debug')
    }
    
    const devProcess = spawn('npm', viteArgs, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_DEV_PORT: config.devPort,
        VITE_USE_MOCK_API: config.enableMockApi.toString()
      }
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      logInfo('Shutting down development server...')
      devProcess.kill('SIGINT')
      if (process.mockApiProcess) {
        process.mockApiProcess.kill('SIGINT')
      }
      process.exit(0)
    })
    
    process.on('SIGTERM', () => {
      devProcess.kill('SIGTERM')
      if (process.mockApiProcess) {
        process.mockApiProcess.kill('SIGTERM')
      }
      process.exit(0)
    })
    
    logSuccess('Development server started successfully!')
    logInfo(`Frontend: http://localhost:${config.devPort}`)
    logInfo(`Backend API: ${config.apiUrl}`)
    if (config.enableMockApi) {
      logInfo(`Mock API: http://localhost:${config.mockApiPort}`)
    }
    
  } catch (error) {
    logError(`Failed to start development server: ${error.message}`)
    process.exit(1)
  }
}

// Main function
async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🚀 Agentic Learning Coach - Development Server${colors.reset}`)
    log(`${colors.cyan}Starting enhanced development environment...${colors.reset}\n`)
    
    await checkDependencies()
    await validateEnvironment()
    await checkBackendConnectivity()
    await setupMockApi()
    await startDevServer()
    
  } catch (error) {
    logError(`Development server failed to start: ${error.message}`)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at ${promise}: ${reason}`)
  process.exit(1)
})

// Run the main function
main().catch((error) => {
  logError(`Failed to start: ${error.message}`)
  process.exit(1)
})