import { Monaco } from '@monaco-editor/react'
import type { ProgrammingLanguage } from '../../types/exercises'

// Code quality rules for different languages
export interface LintingRule {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
  pattern: RegExp
  fix?: string
}

export const LINTING_RULES: Record<ProgrammingLanguage, LintingRule[]> = {
  javascript: [
    {
      id: 'no-var',
      severity: 'error',
      message: 'Use let or const instead of var',
      pattern: /\bvar\s+/g,
      fix: 'Replace with let or const'
    },
    {
      id: 'no-console',
      severity: 'warning',
      message: 'Avoid console.log in production code',
      pattern: /console\.log\(/g
    },
    {
      id: 'prefer-const',
      severity: 'warning',
      message: 'Use const for variables that are never reassigned',
      pattern: /let\s+(\w+)\s*=\s*[^;]+;(?![^}]*\1\s*=)/g,
      fix: 'Change let to const'
    },
    {
      id: 'semicolon',
      severity: 'warning',
      message: 'Missing semicolon',
      pattern: /[^;{}]\s*\n/g,
      fix: 'Add semicolon'
    },
    {
      id: 'unused-variable',
      severity: 'warning',
      message: 'Variable is declared but never used',
      pattern: /(?:let|const|var)\s+(\w+)(?![^}]*\1(?!\s*[=:]))/g
    }
  ],
  typescript: [
    {
      id: 'no-any',
      severity: 'warning',
      message: 'Avoid using any type',
      pattern: /:\s*any\b/g,
      fix: 'Use specific type instead'
    },
    {
      id: 'explicit-return-type',
      severity: 'info',
      message: 'Consider adding explicit return type',
      pattern: /function\s+\w+\([^)]*\)\s*{/g,
      fix: 'Add return type annotation'
    },
    {
      id: 'interface-naming',
      severity: 'info',
      message: 'Interface names should start with I or be descriptive',
      pattern: /interface\s+[a-z]/g,
      fix: 'Use PascalCase for interface names'
    }
  ],
  python: [
    {
      id: 'line-length',
      severity: 'warning',
      message: 'Line too long (>88 characters)',
      pattern: /.{89,}/g,
      fix: 'Break line into multiple lines'
    },
    {
      id: 'missing-docstring',
      severity: 'info',
      message: 'Function should have a docstring',
      pattern: /def\s+\w+\([^)]*\):\s*\n(?!\s*""")/g,
      fix: 'Add docstring'
    },
    {
      id: 'unused-import',
      severity: 'warning',
      message: 'Imported module is not used',
      pattern: /^import\s+(\w+)(?![^]*\1)/gm
    },
    {
      id: 'snake-case',
      severity: 'warning',
      message: 'Use snake_case for variable names',
      pattern: /\b[a-z]+[A-Z][a-zA-Z]*\b/g,
      fix: 'Convert to snake_case'
    }
  ],
  java: [
    {
      id: 'class-naming',
      severity: 'error',
      message: 'Class names should be PascalCase',
      pattern: /class\s+[a-z]/g,
      fix: 'Use PascalCase for class names'
    },
    {
      id: 'method-naming',
      severity: 'warning',
      message: 'Method names should be camelCase',
      pattern: /public\s+\w+\s+[A-Z]/g,
      fix: 'Use camelCase for method names'
    },
    {
      id: 'missing-access-modifier',
      severity: 'warning',
      message: 'Consider adding access modifier',
      pattern: /^\s*(?!public|private|protected)\w+\s+\w+\s*\(/gm,
      fix: 'Add public, private, or protected'
    }
  ],
  go: [
    {
      id: 'exported-naming',
      severity: 'warning',
      message: 'Exported functions should start with uppercase',
      pattern: /func\s+[a-z]\w*\(/g,
      fix: 'Capitalize first letter for exported functions'
    },
    {
      id: 'error-handling',
      severity: 'warning',
      message: 'Error should be handled',
      pattern: /,\s*err\s*:?=.*\n(?!\s*if\s+err)/g,
      fix: 'Add error handling'
    }
  ],
  rust: [
    {
      id: 'snake-case',
      severity: 'warning',
      message: 'Use snake_case for function names',
      pattern: /fn\s+[a-z]*[A-Z]/g,
      fix: 'Convert to snake_case'
    },
    {
      id: 'unused-variable',
      severity: 'warning',
      message: 'Variable is not used',
      pattern: /let\s+(\w+)(?![^}]*\1)/g,
      fix: 'Prefix with underscore or remove'
    }
  ],
  cpp: [
    {
      id: 'include-guards',
      severity: 'warning',
      message: 'Header files should have include guards',
      pattern: /\.h$/,
      fix: 'Add #ifndef/#define/#endif guards'
    },
    {
      id: 'namespace-std',
      severity: 'warning',
      message: 'Avoid using namespace std in headers',
      pattern: /using\s+namespace\s+std/g,
      fix: 'Use std:: prefix instead'
    }
  ]
}

// Code formatting configurations
export const FORMATTING_CONFIGS: Record<ProgrammingLanguage, {
  indentSize: number
  insertSpaces: boolean
  trimTrailingWhitespace: boolean
  insertFinalNewline: boolean
}> = {
  javascript: {
    indentSize: 2,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  typescript: {
    indentSize: 2,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  python: {
    indentSize: 4,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  java: {
    indentSize: 4,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  go: {
    indentSize: 4,
    insertSpaces: false, // Go uses tabs
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  rust: {
    indentSize: 4,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  },
  cpp: {
    indentSize: 2,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true
  }
}

// Linting service class
export class CodeLintingService {
  private monaco: Monaco | null = null

  constructor(monaco?: Monaco) {
    this.monaco = monaco || null
  }

  setMonaco(monaco: Monaco): void {
    this.monaco = monaco
  }

  // Lint code and return issues
  lintCode(code: string, language: ProgrammingLanguage): Array<{
    line: number
    column: number
    severity: 'error' | 'warning' | 'info'
    message: string
    ruleId: string
    fix?: string
  }> {
    const rules = LINTING_RULES[language] || []
    const issues: Array<{
      line: number
      column: number
      severity: 'error' | 'warning' | 'info'
      message: string
      ruleId: string
      fix?: string
    }> = []

    const lines = code.split('\n')

    rules.forEach(rule => {
      lines.forEach((line, lineIndex) => {
        const matches = line.matchAll(rule.pattern)
        for (const match of matches) {
          issues.push({
            line: lineIndex + 1,
            column: match.index || 0,
            severity: rule.severity,
            message: rule.message,
            ruleId: rule.id,
            fix: rule.fix
          })
        }
      })
    })

    return issues
  }

  // Format code according to language conventions
  formatCode(code: string, language: ProgrammingLanguage): string {
    const config = FORMATTING_CONFIGS[language]
    if (!config) return code

    let formatted = code

    // Basic formatting rules
    if (config.trimTrailingWhitespace) {
      formatted = formatted.replace(/[ \t]+$/gm, '')
    }

    if (config.insertFinalNewline && !formatted.endsWith('\n')) {
      formatted += '\n'
    }

    // Language-specific formatting
    switch (language) {
      case 'javascript':
      case 'typescript':
        formatted = this.formatJavaScript(formatted, config)
        break
      case 'python':
        formatted = this.formatPython(formatted, config)
        break
      case 'java':
        formatted = this.formatJava(formatted, config)
        break
      case 'go':
        formatted = this.formatGo(formatted, config)
        break
      case 'rust':
        formatted = this.formatRust(formatted, config)
        break
      case 'cpp':
        formatted = this.formatCpp(formatted, config)
        break
    }

    return formatted
  }

  private formatJavaScript(code: string, config: any): string {
    // Basic JavaScript formatting
    let formatted = code

    // Fix indentation
    const lines = formatted.split('\n')
    let indentLevel = 0
    const indentStr = config.insertSpaces ? ' '.repeat(config.indentSize) : '\t'

    const formattedLines = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''

      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1)
      }

      const indented = indentStr.repeat(indentLevel) + trimmed

      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++
      }

      return indented
    })

    return formattedLines.join('\n')
  }

  private formatPython(code: string, config: any): string {
    // Basic Python formatting (PEP 8 style)
    let formatted = code

    // Fix indentation
    const lines = formatted.split('\n')
    let indentLevel = 0
    const indentStr = ' '.repeat(config.indentSize)

    const formattedLines = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''

      // Handle Python indentation
      if (trimmed.startsWith('except') || trimmed.startsWith('elif') || 
          trimmed.startsWith('else') || trimmed.startsWith('finally')) {
        return indentStr.repeat(Math.max(0, indentLevel - 1)) + trimmed
      }

      const indented = indentStr.repeat(indentLevel) + trimmed

      // Increase indent after colons
      if (trimmed.endsWith(':')) {
        indentLevel++
      }

      return indented
    })

    return formattedLines.join('\n')
  }

  private formatJava(code: string, config: any): string {
    // Basic Java formatting
    return this.formatJavaScript(code, config) // Similar to JavaScript
  }

  private formatGo(code: string, config: any): string {
    // Basic Go formatting (gofmt style)
    let formatted = code

    // Go uses tabs for indentation
    const lines = formatted.split('\n')
    let indentLevel = 0

    const formattedLines = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''

      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1)
      }

      const indented = '\t'.repeat(indentLevel) + trimmed

      if (trimmed.endsWith('{')) {
        indentLevel++
      }

      return indented
    })

    return formattedLines.join('\n')
  }

  private formatRust(code: string, config: any): string {
    // Basic Rust formatting (rustfmt style)
    return this.formatJavaScript(code, config) // Similar to JavaScript
  }

  private formatCpp(code: string, config: any): string {
    // Basic C++ formatting
    return this.formatJavaScript(code, config) // Similar to JavaScript
  }

  // Set up Monaco markers for linting issues
  setMonacoMarkers(model: any, issues: Array<{
    line: number
    column: number
    severity: 'error' | 'warning' | 'info'
    message: string
    ruleId: string
  }>): void {
    if (!this.monaco) return

    const markers = issues.map(issue => ({
      startLineNumber: issue.line,
      startColumn: issue.column + 1,
      endLineNumber: issue.line,
      endColumn: issue.column + 10, // Approximate end column
      message: issue.message,
      severity: this.monaco!.MarkerSeverity[
        issue.severity === 'error' ? 'Error' : 
        issue.severity === 'warning' ? 'Warning' : 'Info'
      ],
      source: 'linter',
      code: issue.ruleId
    }))

    this.monaco.editor.setModelMarkers(model, 'linter', markers)
  }

  // Clear all markers
  clearMarkers(model: any): void {
    if (!this.monaco) return
    this.monaco.editor.setModelMarkers(model, 'linter', [])
  }
}

// Export singleton instance
export const codeLintingService = new CodeLintingService()