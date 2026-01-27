import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  PlayIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { ResizablePanels } from './ResizablePanels'
import { CodeEditor } from './CodeEditor'
import { ExerciseInstructions } from './ExerciseInstructions'
import { SubmissionPanel } from './SubmissionPanel'
import type { 
  Exercise, 
  FileTab, 
  EditorSettings, 
  Submission, 
  Evaluation, 
  CodeExecutionResult,
  Hint,
  ProgrammingLanguage 
} from '../../types/exercises'
import { createDefaultFile, LANGUAGE_CONFIGS } from './MonacoEditorConfig'

interface ExerciseInterfaceProps {
  exercise: Exercise
  onSubmit: (files: Record<string, string>) => Promise<Evaluation>
  onTest: (files: Record<string, string>) => Promise<CodeExecutionResult>
  onRequestHint: (level: number) => Promise<Hint>
  className?: string
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'learning-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  autoSave: true
}

export const ExerciseInterface: React.FC<ExerciseInterfaceProps> = ({
  exercise,
  onSubmit,
  onTest,
  onRequestHint,
  className = ''
}) => {
  // State management
  const [files, setFiles] = useState<FileTab[]>([])
  const [activeFile, setActiveFile] = useState<string>('')
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS)
  const [submission, setSubmission] = useState<Submission | undefined>()
  const [evaluation, setEvaluation] = useState<Evaluation | undefined>()
  const [testResult, setTestResult] = useState<CodeExecutionResult | undefined>()
  const [hints, setHints] = useState<Hint[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(35)

  // Initialize files from exercise
  useEffect(() => {
    const initializeFiles = () => {
      const exerciseFiles: FileTab[] = []

      // Add starter files from exercise instructions
      if (exercise.instructions.starter_code) {
        Object.entries(exercise.instructions.starter_code).forEach(([filename, content]) => {
          exerciseFiles.push({
            name: filename,
            language: exercise.language,
            content,
            modified: false,
            readonly: false
          })
        })
      }

      // Add exercise files if specified
      if (exercise.instructions.files) {
        exercise.instructions.files.forEach(file => {
          exerciseFiles.push({
            name: file.name,
            language: file.language || exercise.language,
            content: file.content,
            modified: false,
            readonly: file.readonly || false
          })
        })
      }

      // If no files, create a default file
      if (exerciseFiles.length === 0) {
        const defaultFile = createDefaultFile(exercise.language)
        exerciseFiles.push({
          name: defaultFile.name,
          language: defaultFile.language,
          content: defaultFile.content,
          modified: false,
          readonly: false
        })
      }

      setFiles(exerciseFiles)
      setActiveFile(exerciseFiles[0].name)
    }

    initializeFiles()
  }, [exercise])

  // File management handlers
  const handleFileChange = useCallback((filename: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.name === filename 
        ? { ...file, content, modified: true }
        : file
    ))
  }, [])

  const handleActiveFileChange = useCallback((filename: string) => {
    setActiveFile(filename)
  }, [])

  const handleFileAdd = useCallback((filename: string) => {
    const language = filename.includes('.') 
      ? filename.split('.').pop() as ProgrammingLanguage
      : exercise.language

    const newFile: FileTab = {
      name: filename,
      language: language || exercise.language,
      content: LANGUAGE_CONFIGS[language || exercise.language]?.defaultCode || '',
      modified: false,
      readonly: false
    }

    setFiles(prev => [...prev, newFile])
    setActiveFile(filename)
  }, [exercise.language])

  const handleFileRemove = useCallback((filename: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.name !== filename)
      if (activeFile === filename && newFiles.length > 0) {
        setActiveFile(newFiles[0].name)
      }
      return newFiles
    })
  }, [activeFile])

  // Submission handlers
  const handleTest = useCallback(async () => {
    setIsTesting(true)
    setTestResult(undefined)
    
    try {
      const fileContents = files.reduce((acc, file) => {
        acc[file.name] = file.content
        return acc
      }, {} as Record<string, string>)

      const result = await onTest(fileContents)
      setTestResult(result)
    } catch (error) {
      console.error('Test execution failed:', error)
      setTestResult({
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        execution_time_ms: 0,
        memory_used_mb: 0
      })
    } finally {
      setIsTesting(false)
    }
  }, [files, onTest])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setEvaluation(undefined)
    
    try {
      const fileContents = files.reduce((acc, file) => {
        acc[file.name] = file.content
        return acc
      }, {} as Record<string, string>)

      const result = await onSubmit(fileContents)
      setEvaluation(result)
      
      // Create submission record
      setSubmission({
        id: `sub_${Date.now()}`,
        user_id: 'current_user',
        exercise_id: exercise.id,
        code: files.find(f => f.name === activeFile)?.content || '',
        files: fileContents,
        language: exercise.language,
        status: result.passed ? 'completed' : 'failed',
        score: result.feedback.overall_score,
        submitted_at: new Date().toISOString(),
        evaluated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [files, activeFile, exercise, onSubmit])

  const handleRequestHint = useCallback(async (level: number) => {
    try {
      const hint = await onRequestHint(level)
      setHints(prev => [...prev, hint])
    } catch (error) {
      console.error('Failed to get hint:', error)
    }
  }, [onRequestHint])

  // Check if submission is possible
  const canSubmit = files.some(f => f.content.trim().length > 0) && !isSubmitting && !isTesting

  return (
    <div className={`h-screen flex flex-col bg-gray-100 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {exercise.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {exercise.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Indicators */}
            {evaluation && (
              <div className="flex items-center space-x-2">
                {evaluation.passed ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                )}
                <span className={`text-sm font-medium ${
                  evaluation.passed ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  Score: {evaluation.feedback.overall_score}/100
                </span>
              </div>
            )}
            
            {/* Action Buttons */}
            <button
              onClick={handleTest}
              disabled={isTesting || isSubmitting}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlayIcon className="w-4 h-4 mr-2" />
              )}
              Test Code
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              Submit Solution
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <ResizablePanels
          initialLeftWidth={leftPanelWidth}
          minLeftWidth={25}
          maxLeftWidth={50}
          leftPanel={
            <ExerciseInstructions
              exercise={exercise}
              hints={hints}
              onRequestHint={handleRequestHint}
              className="h-full"
            />
          }
          rightPanel={
            <ResizablePanels
              initialLeftWidth={60}
              minLeftWidth={40}
              maxLeftWidth={80}
              leftPanel={
                <CodeEditor
                  files={files}
                  activeFile={activeFile}
                  onFileChange={handleFileChange}
                  onActiveFileChange={handleActiveFileChange}
                  onFileAdd={handleFileAdd}
                  onFileRemove={handleFileRemove}
                  language={exercise.language}
                  settings={editorSettings}
                  onSettingsChange={setEditorSettings}
                  className="h-full"
                />
              }
              rightPanel={
                <SubmissionPanel
                  onSubmit={handleSubmit}
                  onTest={handleTest}
                  submission={submission}
                  evaluation={evaluation}
                  testResult={testResult}
                  isSubmitting={isSubmitting}
                  isTesting={isTesting}
                  canSubmit={canSubmit}
                  className="h-full"
                />
              }
            />
          }
        />
      </div>
    </div>
  )
}

export default ExerciseInterface