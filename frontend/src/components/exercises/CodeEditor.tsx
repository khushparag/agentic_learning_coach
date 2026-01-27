import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Editor, Monaco } from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { 
  CogIcon, 
  DocumentDuplicateIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { 
  ProgrammingLanguage, 
  FileTab, 
  EditorSettings,
  EditorTheme 
} from '../../types/exercises'
import { 
  configureMonaco, 
  LANGUAGE_CONFIGS, 
  getLanguageFromFilename 
} from './MonacoEditorConfig'
import { codeLintingService } from './CodeLinting'

interface CodeEditorProps {
  files: FileTab[]
  activeFile: string
  onFileChange: (filename: string, content: string) => void
  onActiveFileChange: (filename: string) => void
  onFileAdd?: (filename: string) => void
  onFileRemove?: (filename: string) => void
  language: ProgrammingLanguage
  settings: EditorSettings
  onSettingsChange: (settings: EditorSettings) => void
  readOnly?: boolean
  className?: string
}

const EDITOR_THEMES: EditorTheme[] = [
  { name: 'vs', label: 'Light', type: 'light' },
  { name: 'vs-dark', label: 'Dark', type: 'dark' },
  { name: 'learning-light', label: 'Learning Light', type: 'light' },
  { name: 'learning-dark', label: 'Learning Dark', type: 'dark' },
  { name: 'hc-black', label: 'High Contrast', type: 'dark' }
]

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFile,
  onFileChange,
  onActiveFileChange,
  onFileAdd,
  onFileRemove,
  language,
  settings,
  onSettingsChange,
  readOnly = false,
  className = ''
}) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const activeFileData = files.find(f => f.name === activeFile)
  const currentLanguage = activeFileData ? getLanguageFromFilename(activeFileData.name) : language

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // Configure Monaco with our custom settings
    configureMonaco(monaco)
    codeLintingService.setMonaco(monaco)
    setIsEditorReady(true)

    // Configure editor options
    editor.updateOptions({
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always'
    })

    // Add auto-save listener
    window.addEventListener('monaco-auto-save', handleAutoSave)

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (settings.autoSave && activeFileData) {
        handleAutoSave()
      }
    })

    // Add code formatting shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      const model = editor.getModel()
      if (model) {
        const formatted = codeLintingService.formatCode(model.getValue(), currentLanguage)
        model.setValue(formatted)
      }
    })

    // Add comment toggle shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run()
    })

    // Add linting on content change
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (model) {
        const code = model.getValue()
        const issues = codeLintingService.lintCode(code, currentLanguage)
        // Set markers using Monaco's built-in method
        if (monacoRef.current) {
          const markers = issues.map(issue => ({
            startLineNumber: issue.line,
            startColumn: issue.column + 1,
            endLineNumber: issue.line,
            endColumn: issue.column + 10,
            message: issue.message,
            severity: monacoRef.current!.MarkerSeverity[
              issue.severity === 'error' ? 'Error' : 
              issue.severity === 'warning' ? 'Warning' : 'Info'
            ]
          }))
          monacoRef.current.editor.setModelMarkers(model, 'linter', markers)
        }
      }
    })

    return () => {
      window.removeEventListener('monaco-auto-save', handleAutoSave)
    }
  }, [settings, activeFile, activeFileData, currentLanguage])

  const handleAutoSave = useCallback(() => {
    if (activeFileData && editorRef.current) {
      const content = editorRef.current.getValue()
      onFileChange(activeFile, content)
      console.log('Auto-saved file:', activeFile)
    }
  }, [activeFile, activeFileData, onFileChange])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined && activeFile) {
      onFileChange(activeFile, value)
    }
  }, [activeFile, onFileChange])

  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      editorRef.current.updateOptions({
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap ? 'on' : 'off',
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers ? 'on' : 'off'
      })
    }
  }, [settings, isEditorReady])

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const formatted = codeLintingService.formatCode(model.getValue(), currentLanguage)
        model.setValue(formatted)
      }
    }
  }, [currentLanguage])

  const insertSnippet = useCallback((snippet: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection()
      editorRef.current.executeEdits('insert-snippet', [{
        range: selection,
        text: snippet
      }])
      editorRef.current.focus()
    }
  }, [])

  // Expose insertSnippet for external use
  useEffect(() => {
    if (window && typeof window === 'object') {
      (window as any).insertSnippet = insertSnippet
    }
  }, [insertSnippet])

  const handleAddFile = useCallback(() => {
    if (newFileName.trim() && onFileAdd) {
      const filename = newFileName.trim()
      onFileAdd(filename)
      setNewFileName('')
      setShowFileDialog(false)
    }
  }, [newFileName, onFileAdd])

  const handleRemoveFile = useCallback((filename: string) => {
    if (onFileRemove && files.length > 1) {
      onFileRemove(filename)
    }
  }, [onFileRemove, files.length])

  const duplicateFile = useCallback((filename: string) => {
    if (onFileAdd) {
      const originalFile = files.find(f => f.name === filename)
      if (originalFile) {
        const baseName = filename.split('.')[0]
        const extension = filename.split('.').pop()
        const newName = `${baseName}_copy.${extension}`
        onFileAdd(newName)
        // Copy content after file is created
        setTimeout(() => {
          onFileChange(newName, originalFile.content)
        }, 100)
      }
    }
  }, [files, onFileAdd, onFileChange])

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* File Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex overflow-x-auto flex-1">
          {files.map((file) => (
            <div key={file.name} className="flex items-center group">
              <button
                onClick={() => onActiveFileChange(file.name)}
                className={`
                  flex items-center px-4 py-2 text-sm font-medium border-r border-gray-200 dark:border-gray-700
                  transition-colors duration-200 whitespace-nowrap
                  ${activeFile === file.name
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${file.readonly ? 'italic' : ''}
                `}
              >
                <span>{file.name}</span>
                {file.modified && !file.readonly && (
                  <span className="ml-1 w-2 h-2 bg-orange-400 rounded-full"></span>
                )}
                {file.readonly && (
                  <span className="ml-2 text-xs text-gray-400">readonly</span>
                )}
              </button>
              
              {/* File Actions */}
              {!file.readonly && files.length > 1 && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => duplicateFile(file.name)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Duplicate file"
                  >
                    <DocumentDuplicateIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveFile(file.name)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Remove file"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Add File Button */}
        {onFileAdd && (
          <button
            onClick={() => setShowFileDialog(true)}
            className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-l border-gray-200 dark:border-gray-700"
            title="Add new file"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentLanguage.toUpperCase()}
          </span>
          {activeFileData && (
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {activeFileData.name}
            </span>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Lines: {activeFileData?.content.split('\n').length || 0}</span>
            <span>•</span>
            <span>Chars: {activeFileData?.content.length || 0}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={formatCode}
            disabled={readOnly}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Format
          </button>
          
          {/* Quick Theme Toggle */}
          <select
            value={settings.theme}
            onChange={(e) => onSettingsChange({ ...settings, theme: e.target.value })}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            {EDITOR_THEMES.map(theme => (
              <option key={theme.name} value={theme.name}>
                {theme.label}
              </option>
            ))}
          </select>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Editor settings"
          >
            <CogIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="10"
                max="24"
                value={settings.fontSize}
                onChange={(e) => onSettingsChange({ ...settings, fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{settings.fontSize}px</span>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tab Size
              </label>
              <select
                value={settings.tabSize}
                onChange={(e) => onSettingsChange({ ...settings, tabSize: parseInt(e.target.value) })}
                className="w-full text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => onSettingsChange({ ...settings, wordWrap: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Word Wrap</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.minimap}
                  onChange={(e) => onSettingsChange({ ...settings, minimap: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Minimap</span>
              </label>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.lineNumbers}
                  onChange={(e) => onSettingsChange({ ...settings, lineNumbers: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Line Numbers</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => onSettingsChange({ ...settings, autoSave: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Auto Save</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIGS[currentLanguage]?.monacoLanguage || currentLanguage}
          theme={settings.theme}
          value={activeFileData?.content || ''}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: readOnly || activeFileData?.readonly,
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap ? 'on' : 'off',
            minimap: { enabled: settings.minimap },
            lineNumbers: settings.lineNumbers ? 'on' : 'off',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover' as const,
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on' as const
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
        />
      </div>

      {/* Add File Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New File
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={`main.${LANGUAGE_CONFIGS[language]?.fileExtension || 'js'}`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFile()
                  if (e.key === 'Escape') setShowFileDialog(false)
                }}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFileDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add File
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
