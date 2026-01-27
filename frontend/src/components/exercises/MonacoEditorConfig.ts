import { Monaco } from '@monaco-editor/react'
import type { ProgrammingLanguage } from '../../types/exercises'

// Language configurations for Monaco Editor
export const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, {
  monacoLanguage: string
  fileExtension: string
  defaultCode: string
  snippets: Array<{ label: string; insertText: string; documentation: string }>
}> = {
  javascript: {
    monacoLanguage: 'javascript',
    fileExtension: 'js',
    defaultCode: `// Write your JavaScript solution here
function solution() {
  // Your code here
  return null;
}

// Export your solution
module.exports = solution;`,
    snippets: [
      {
        label: 'function',
        insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
        documentation: 'Create a function'
      },
      {
        label: 'arrow',
        insertText: 'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n}',
        documentation: 'Create an arrow function'
      },
      {
        label: 'for',
        insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// body}\n}',
        documentation: 'For loop'
      },
      {
        label: 'forEach',
        insertText: '${1:array}.forEach((${2:item}, ${3:index}) => {\n\t${4:// body}\n});',
        documentation: 'Array forEach loop'
      }
    ]
  },
  typescript: {
    monacoLanguage: 'typescript',
    fileExtension: 'ts',
    defaultCode: `// Write your TypeScript solution here
interface Solution {
  // Define your interface here
}

function solution(): Solution {
  // Your code here
  return {} as Solution;
}

export default solution;`,
    snippets: [
      {
        label: 'interface',
        insertText: 'interface ${1:Name} {\n\t${2:property}: ${3:type};\n}',
        documentation: 'Create an interface'
      },
      {
        label: 'type',
        insertText: 'type ${1:Name} = ${2:type};',
        documentation: 'Create a type alias'
      },
      {
        label: 'class',
        insertText: 'class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t${3:// constructor body}\n\t}\n\n\t${4:// methods}\n}',
        documentation: 'Create a class'
      }
    ]
  },
  python: {
    monacoLanguage: 'python',
    fileExtension: 'py',
    defaultCode: `# Write your Python solution here
def solution():
    """
    Your solution here
    """
    pass

# Test your solution
if __name__ == "__main__":
    result = solution()
    print(result)`,
    snippets: [
      {
        label: 'def',
        insertText: 'def ${1:function_name}(${2:params}):\n\t"""${3:docstring}"""\n\t${4:pass}',
        documentation: 'Create a function'
      },
      {
        label: 'class',
        insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:params}):\n\t\t${3:pass}\n\n\tdef ${4:method_name}(self):\n\t\t${5:pass}',
        documentation: 'Create a class'
      },
      {
        label: 'for',
        insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
        documentation: 'For loop'
      },
      {
        label: 'if',
        insertText: 'if ${1:condition}:\n\t${2:pass}',
        documentation: 'If statement'
      }
    ]
  },
  java: {
    monacoLanguage: 'java',
    fileExtension: 'java',
    defaultCode: `// Write your Java solution here
public class Solution {
    public static void main(String[] args) {
        Solution solution = new Solution();
        // Test your solution here
    }
    
    public Object solve() {
        // Your code here
        return null;
    }
}`,
    snippets: [
      {
        label: 'class',
        insertText: 'public class ${1:ClassName} {\n\t${2:// class body}\n}',
        documentation: 'Create a public class'
      },
      {
        label: 'method',
        insertText: 'public ${1:returnType} ${2:methodName}(${3:params}) {\n\t${4:// method body}\n\treturn ${5:value};\n}',
        documentation: 'Create a public method'
      },
      {
        label: 'for',
        insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// body}\n}',
        documentation: 'For loop'
      }
    ]
  },
  go: {
    monacoLanguage: 'go',
    fileExtension: 'go',
    defaultCode: `package main

import "fmt"

// Write your Go solution here
func solution() interface{} {
    // Your code here
    return nil
}

func main() {
    result := solution()
    fmt.Println(result)
}`,
    snippets: [
      {
        label: 'func',
        insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t${4:// body}\n\treturn ${5:value}\n}',
        documentation: 'Create a function'
      },
      {
        label: 'struct',
        insertText: 'type ${1:Name} struct {\n\t${2:Field} ${3:Type}\n}',
        documentation: 'Create a struct'
      },
      {
        label: 'for',
        insertText: 'for ${1:i} := 0; ${1:i} < ${2:length}; ${1:i}++ {\n\t${3:// body}\n}',
        documentation: 'For loop'
      }
    ]
  },
  rust: {
    monacoLanguage: 'rust',
    fileExtension: 'rs',
    defaultCode: `// Write your Rust solution here
fn solution() -> Option<i32> {
    // Your code here
    None
}

fn main() {
    let result = solution();
    println!("{:?}", result);
}`,
    snippets: [
      {
        label: 'fn',
        insertText: 'fn ${1:name}(${2:params}) -> ${3:ReturnType} {\n\t${4:// body}\n}',
        documentation: 'Create a function'
      },
      {
        label: 'struct',
        insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}',
        documentation: 'Create a struct'
      },
      {
        label: 'impl',
        insertText: 'impl ${1:Name} {\n\tfn ${2:method}(&self) -> ${3:ReturnType} {\n\t\t${4:// body}\n\t}\n}',
        documentation: 'Implementation block'
      }
    ]
  },
  cpp: {
    monacoLanguage: 'cpp',
    fileExtension: 'cpp',
    defaultCode: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

// Write your C++ solution here
class Solution {
public:
    auto solve() {
        // Your code here
        return 0;
    }
};

int main() {
    Solution solution;
    auto result = solution.solve();
    cout << result << endl;
    return 0;
}`,
    snippets: [
      {
        label: 'class',
        insertText: 'class ${1:ClassName} {\npublic:\n\t${2:// public members}\nprivate:\n\t${3:// private members}\n};',
        documentation: 'Create a class'
      },
      {
        label: 'function',
        insertText: '${1:returnType} ${2:functionName}(${3:params}) {\n\t${4:// body}\n\treturn ${5:value};\n}',
        documentation: 'Create a function'
      },
      {
        label: 'for',
        insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:size}; ++${1:i}) {\n\t${3:// body}\n}',
        documentation: 'For loop'
      }
    ]
  }
}

// Custom themes for Monaco Editor
export const CUSTOM_THEMES = {
  'learning-light': {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
      { token: 'string', foreground: '032f62' },
      { token: 'number', foreground: '005cc5' },
      { token: 'function', foreground: '6f42c1' },
      { token: 'variable', foreground: '24292e' }
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292e',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#0366d625',
      'editorCursor.foreground': '#044289',
      'editorLineNumber.foreground': '#959da5',
      'editorLineNumber.activeForeground': '#24292e'
    }
  },
  'learning-dark': {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'f0f6fc' }
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#f0f6fc',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#79c0ff',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#f0f6fc'
    }
  }
}

// Monaco Editor configuration function
export const configureMonaco = (monaco: Monaco) => {
  // Register custom themes
  Object.entries(CUSTOM_THEMES).forEach(([name, theme]) => {
    monaco.editor.defineTheme(name, theme)
  })

  // Configure language features for each supported language
  Object.entries(LANGUAGE_CONFIGS).forEach(([lang, config]) => {
    // Register completion providers for snippets
    monaco.languages.registerCompletionItemProvider(config.monacoLanguage, {
      provideCompletionItems: (model, position) => {
        const suggestions = config.snippets.map((snippet, index) => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.documentation,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        }))

        return { suggestions }
      }
    })

    // Register hover providers for better documentation
    monaco.languages.registerHoverProvider(config.monacoLanguage, {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null

        // Provide basic hover information
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${word.word}**` },
            { value: `Language: ${lang.toUpperCase()}` }
          ]
        }
      }
    })
  })

  // Configure editor options globally
  monaco.editor.setModelLanguage(
    monaco.editor.createModel('', 'javascript'),
    'javascript'
  )

  // Add custom commands
  monaco.editor.addCommand({
    id: 'format-code',
    label: 'Format Code',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
    contextMenuGroupId: 'modification',
    run: (editor) => {
      editor.getAction('editor.action.formatDocument')?.run()
    }
  })

  monaco.editor.addCommand({
    id: 'save-code',
    label: 'Save Code',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    contextMenuGroupId: 'modification',
    run: (editor) => {
      // Trigger auto-save
      const model = editor.getModel()
      if (model) {
        // Emit a custom event for auto-save
        window.dispatchEvent(new CustomEvent('monaco-auto-save', {
          detail: { content: model.getValue() }
        }))
      }
    }
  })
}

// Linting configuration for different languages
export const LINTING_CONFIGS = {
  javascript: {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'info',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  typescript: {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'info',
      'prefer-const': 'warn',
      'no-var': 'error',
      'explicit-function-return-type': 'warn'
    }
  },
  python: {
    rules: {
      'unused-variable': 'warn',
      'line-too-long': 'warn',
      'missing-docstring': 'info'
    }
  }
}

// File management utilities
export const createDefaultFile = (language: ProgrammingLanguage, filename?: string): {
  name: string
  content: string
  language: ProgrammingLanguage
} => {
  const config = LANGUAGE_CONFIGS[language]
  return {
    name: filename || `main.${config.fileExtension}`,
    content: config.defaultCode,
    language
  }
}

export const getLanguageFromFilename = (filename: string): ProgrammingLanguage => {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  const extensionMap: Record<string, ProgrammingLanguage> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp'
  }
  
  return extensionMap[extension || ''] || 'javascript'
}
