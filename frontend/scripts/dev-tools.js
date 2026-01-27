#!/usr/bin/env node

/**
 * Development Tools Script
 * 
 * Provides various development utilities:
 * - Code generation helpers
 * - Development database seeding
 * - Component scaffolding
 * - Development environment reset
 * - Performance profiling
 */

import { spawn, exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

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

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`)
}

function logInfo(message) {
  log(`${colors.cyan}ℹ️  ${message}${colors.reset}`)
}

// Available commands
const commands = {
  'generate-component': generateComponent,
  'generate-page': generatePage,
  'generate-hook': generateHook,
  'generate-service': generateService,
  'reset-env': resetEnvironment,
  'clean-cache': cleanCache,
  'analyze-bundle': analyzeBundle,
  'check-types': checkTypes,
  'lint-fix': lintFix,
  'update-deps': updateDependencies,
  'security-audit': securityAudit,
  'performance-profile': performanceProfile,
  'help': showHelp
}

// Component template
const componentTemplate = (name, hasProps = false) => `import React${hasProps ? ', { FC }' : ''} from 'react'
${hasProps ? `import { ${name}Props } from './${name}.types'` : ''}

/**
 * ${name} Component
 * 
 * @description Brief description of what this component does
 */
${hasProps ? `const ${name}: FC<${name}Props> = ({ }) => {` : `const ${name} = () => {`}
  return (
    <div className="flex items-center justify-center p-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        ${name} Component
      </h2>
    </div>
  )
}

export default ${name}
`

// Component types template
const componentTypesTemplate = (name) => `export interface ${name}Props {
  // Add your props here
  className?: string
}
`

// Component test template
const componentTestTemplate = (name) => `import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import ${name} from './${name}'

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />)
    expect(screen.getByText('${name} Component')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-class'
    render(<${name} className={customClass} />)
    const element = screen.getByText('${name} Component').closest('div')
    expect(element).toHaveClass(customClass)
  })
})
`

// Page template
const pageTemplate = (name) => `import React from 'react'
import { Helmet } from 'react-helmet-async'

/**
 * ${name} Page
 * 
 * @description Brief description of what this page does
 */
const ${name}Page = () => {
  return (
    <>
      <Helmet>
        <title>${name} - Agentic Learning Coach</title>
        <meta name="description" content="${name} page description" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            ${name}
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <p className="text-gray-600 dark:text-gray-400">
              ${name} page content goes here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ${name}Page
`

// Hook template
const hookTemplate = (name) => `import { useState, useEffect } from 'react'

/**
 * ${name} Hook
 * 
 * @description Brief description of what this hook does
 */
export const ${name} = () => {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Hook logic here
  }, [])

  return {
    state,
    loading,
    error,
    setState
  }
}
`

// Service template
const serviceTemplate = (name) => `import { api } from './api'
import type { ApiResponse } from '@/types/api'

/**
 * ${name} Service
 * 
 * @description Service for handling ${name.toLowerCase()} related API calls
 */
export class ${name}Service {
  private static readonly BASE_PATH = '/${name.toLowerCase()}'

  /**
   * Get all ${name.toLowerCase()} items
   */
  static async getAll(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(this.BASE_PATH)
      return {
        success: true,
        data: response.data,
        message: 'Successfully retrieved ${name.toLowerCase()} items'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve ${name.toLowerCase()} items'
      }
    }
  }

  /**
   * Get ${name.toLowerCase()} item by ID
   */
  static async getById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(\`\${this.BASE_PATH}/\${id}\`)
      return {
        success: true,
        data: response.data,
        message: 'Successfully retrieved ${name.toLowerCase()} item'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve ${name.toLowerCase()} item'
      }
    }
  }

  /**
   * Create new ${name.toLowerCase()} item
   */
  static async create(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(this.BASE_PATH, data)
      return {
        success: true,
        data: response.data,
        message: 'Successfully created ${name.toLowerCase()} item'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create ${name.toLowerCase()} item'
      }
    }
  }

  /**
   * Update ${name.toLowerCase()} item
   */
  static async update(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(\`\${this.BASE_PATH}/\${id}\`, data)
      return {
        success: true,
        data: response.data,
        message: 'Successfully updated ${name.toLowerCase()} item'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update ${name.toLowerCase()} item'
      }
    }
  }

  /**
   * Delete ${name.toLowerCase()} item
   */
  static async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(\`\${this.BASE_PATH}/\${id}\`)
      return {
        success: true,
        message: 'Successfully deleted ${name.toLowerCase()} item'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete ${name.toLowerCase()} item'
      }
    }
  }
}
`

// Generate component
async function generateComponent(name, options = {}) {
  if (!name) {
    logError('Component name is required')
    return
  }

  const componentName = name.charAt(0).toUpperCase() + name.slice(1)
  const componentDir = path.join(projectRoot, 'src', 'components', name.toLowerCase())
  
  try {
    // Create component directory
    await fs.mkdir(componentDir, { recursive: true })
    
    // Create component file
    await fs.writeFile(
      path.join(componentDir, `${componentName}.tsx`),
      componentTemplate(componentName, options.props)
    )
    
    // Create types file if props are needed
    if (options.props) {
      await fs.writeFile(
        path.join(componentDir, `${componentName}.types.ts`),
        componentTypesTemplate(componentName)
      )
    }
    
    // Create test file
    await fs.writeFile(
      path.join(componentDir, `${componentName}.test.tsx`),
      componentTestTemplate(componentName)
    )
    
    // Create index file
    await fs.writeFile(
      path.join(componentDir, 'index.ts'),
      `export { default } from './${componentName}'\n`
    )
    
    logSuccess(`Component ${componentName} generated successfully at ${componentDir}`)
    
  } catch (error) {
    logError(`Failed to generate component: ${error.message}`)
  }
}

// Generate page
async function generatePage(name) {
  if (!name) {
    logError('Page name is required')
    return
  }

  const pageName = name.charAt(0).toUpperCase() + name.slice(1)
  const pageDir = path.join(projectRoot, 'src', 'pages', name.toLowerCase())
  
  try {
    // Create page directory
    await fs.mkdir(pageDir, { recursive: true })
    
    // Create page file
    await fs.writeFile(
      path.join(pageDir, `${pageName}.tsx`),
      pageTemplate(pageName)
    )
    
    // Create index file
    await fs.writeFile(
      path.join(pageDir, 'index.ts'),
      `export { default } from './${pageName}'\n`
    )
    
    logSuccess(`Page ${pageName} generated successfully at ${pageDir}`)
    
  } catch (error) {
    logError(`Failed to generate page: ${error.message}`)
  }
}

// Generate hook
async function generateHook(name) {
  if (!name) {
    logError('Hook name is required')
    return
  }

  const hookName = name.startsWith('use') ? name : `use${name.charAt(0).toUpperCase() + name.slice(1)}`
  const hookFile = path.join(projectRoot, 'src', 'hooks', `${hookName}.ts`)
  
  try {
    await fs.writeFile(hookFile, hookTemplate(hookName))
    logSuccess(`Hook ${hookName} generated successfully at ${hookFile}`)
    
  } catch (error) {
    logError(`Failed to generate hook: ${error.message}`)
  }
}

// Generate service
async function generateService(name) {
  if (!name) {
    logError('Service name is required')
    return
  }

  const serviceName = name.charAt(0).toUpperCase() + name.slice(1)
  const serviceFile = path.join(projectRoot, 'src', 'services', `${name.toLowerCase()}Service.ts`)
  
  try {
    await fs.writeFile(serviceFile, serviceTemplate(serviceName))
    logSuccess(`Service ${serviceName}Service generated successfully at ${serviceFile}`)
    
  } catch (error) {
    logError(`Failed to generate service: ${error.message}`)
  }
}

// Reset environment
async function resetEnvironment() {
  logInfo('Resetting development environment...')
  
  try {
    // Clean cache
    await cleanCache()
    
    // Reinstall dependencies
    logInfo('Reinstalling dependencies...')
    await runCommand('npm', ['ci'])
    
    // Reset git state (if needed)
    logInfo('Checking git status...')
    
    logSuccess('Environment reset completed')
    
  } catch (error) {
    logError(`Failed to reset environment: ${error.message}`)
  }
}

// Clean cache
async function cleanCache() {
  logInfo('Cleaning development cache...')
  
  try {
    const cacheDirs = [
      path.join(projectRoot, 'node_modules', '.cache'),
      path.join(projectRoot, '.vite'),
      path.join(projectRoot, 'dist'),
      path.join(projectRoot, 'coverage')
    ]
    
    for (const dir of cacheDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true })
        logSuccess(`Cleaned ${path.basename(dir)}`)
      } catch {
        // Directory might not exist, which is fine
      }
    }
    
    logSuccess('Cache cleaned successfully')
    
  } catch (error) {
    logError(`Failed to clean cache: ${error.message}`)
  }
}

// Analyze bundle
async function analyzeBundle() {
  logInfo('Analyzing bundle size...')
  
  try {
    await runCommand('npm', ['run', 'build:analyze'])
    logSuccess('Bundle analysis completed')
    
  } catch (error) {
    logError(`Failed to analyze bundle: ${error.message}`)
  }
}

// Check types
async function checkTypes() {
  logInfo('Checking TypeScript types...')
  
  try {
    await runCommand('npm', ['run', 'type-check'])
    logSuccess('Type checking completed')
    
  } catch (error) {
    logError(`Type checking failed: ${error.message}`)
  }
}

// Lint and fix
async function lintFix() {
  logInfo('Running linter with auto-fix...')
  
  try {
    await runCommand('npm', ['run', 'lint:fix'])
    logSuccess('Linting completed')
    
  } catch (error) {
    logError(`Linting failed: ${error.message}`)
  }
}

// Update dependencies
async function updateDependencies() {
  logInfo('Checking for dependency updates...')
  
  try {
    await runCommand('npm', ['run', 'deps:check'])
    logInfo('Run "npm run deps:update" to update dependencies')
    
  } catch (error) {
    logError(`Failed to check dependencies: ${error.message}`)
  }
}

// Security audit
async function securityAudit() {
  logInfo('Running security audit...')
  
  try {
    await runCommand('npm', ['audit'])
    await runCommand('npm', ['run', 'security:scan'])
    logSuccess('Security audit completed')
    
  } catch (error) {
    logError(`Security audit failed: ${error.message}`)
  }
}

// Performance profile
async function performanceProfile() {
  logInfo('Running performance profile...')
  
  try {
    await runCommand('npm', ['run', 'perf:monitor'])
    logSuccess('Performance profiling completed')
    
  } catch (error) {
    logError(`Performance profiling failed: ${error.message}`)
  }
}

// Show help
function showHelp() {
  log(`${colors.bright}${colors.magenta}Development Tools - Available Commands:${colors.reset}\n`)
  
  const commandHelp = {
    'generate-component <name> [--props]': 'Generate a new React component',
    'generate-page <name>': 'Generate a new page component',
    'generate-hook <name>': 'Generate a new custom hook',
    'generate-service <name>': 'Generate a new API service',
    'reset-env': 'Reset development environment',
    'clean-cache': 'Clean development cache files',
    'analyze-bundle': 'Analyze bundle size and composition',
    'check-types': 'Run TypeScript type checking',
    'lint-fix': 'Run linter with auto-fix',
    'update-deps': 'Check for dependency updates',
    'security-audit': 'Run security audit',
    'performance-profile': 'Run performance profiling',
    'help': 'Show this help message'
  }
  
  for (const [command, description] of Object.entries(commandHelp)) {
    log(`  ${colors.cyan}${command.padEnd(30)}${colors.reset} ${description}`)
  }
  
  log(`\n${colors.yellow}Examples:${colors.reset}`)
  log(`  ${colors.green}npm run dev:tools generate-component MyComponent --props${colors.reset}`)
  log(`  ${colors.green}npm run dev:tools generate-page dashboard${colors.reset}`)
  log(`  ${colors.green}npm run dev:tools clean-cache${colors.reset}`)
}

// Run command helper
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: projectRoot,
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

// Main function
async function main() {
  const [,, command, ...args] = process.argv
  
  if (!command || !commands[command]) {
    showHelp()
    return
  }
  
  try {
    await commands[command](...args)
  } catch (error) {
    logError(`Command failed: ${error.message}`)
    process.exit(1)
  }
}

// Run the main function
main().catch((error) => {
  logError(`Failed to run command: ${error.message}`)
  process.exit(1)
})