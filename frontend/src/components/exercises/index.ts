// Core exercise components
export { CodeEditor } from './CodeEditor'
export { ExerciseInstructions } from './ExerciseInstructions'
export { SubmissionPanel } from './SubmissionPanel'
export { ResizablePanels } from './ResizablePanels'
export { ExerciseInterface } from './ExerciseInterface'

// Monaco Editor configuration and utilities
export { 
  configureMonaco, 
  LANGUAGE_CONFIGS, 
  CUSTOM_THEMES,
  createDefaultFile, 
  getLanguageFromFilename 
} from './MonacoEditorConfig'

// Code linting and formatting
export { 
  CodeLintingService, 
  codeLintingService, 
  LINTING_RULES, 
  FORMATTING_CONFIGS 
} from './CodeLinting'

// Types (re-export from types file)
export type {
  Exercise,
  ExerciseInstructions as ExerciseInstructionsType,
  ExerciseFile,
  CodeExample,
  TestCase,
  Submission,
  Evaluation,
  TestResult,
  Feedback,
  FeedbackSection,
  CodeIssue,
  ExerciseProgress,
  ExerciseFilter,
  ExerciseSearchResult,
  CodeExecutionResult,
  HintRequest,
  Hint,
  EditorTheme,
  EditorSettings,
  FileTab,
  ExerciseType,
  ProgrammingLanguage,
  SubmissionStatus
} from '../../types/exercises'