export interface Exercise {
  id: string
  title: string
  description: string
  type: ExerciseType
  difficulty_level: number
  language: ProgrammingLanguage
  topic_id: string
  topic_title?: string
  instructions: ExerciseInstructions
  test_cases?: TestCase[]
  solution_template?: string
  hints: string[]
  time_limit_minutes?: number
  estimated_minutes?: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ExerciseInstructions {
  overview: string
  requirements: string[]
  examples?: CodeExample[]
  starter_code?: Record<string, string> // filename -> code
  files?: ExerciseFile[]
}

export interface ExerciseFile {
  name: string
  content: string
  readonly?: boolean
  language?: ProgrammingLanguage
}

export interface CodeExample {
  title: string
  code: string
  explanation: string
}

export interface TestCase {
  id: string
  name: string
  input: unknown
  expected_output: unknown
  hidden?: boolean
  weight?: number
}

export interface Submission {
  id: string
  user_id: string
  exercise_id: string
  code: string
  files?: Record<string, string> // filename -> code
  language: ProgrammingLanguage
  status: SubmissionStatus
  score?: number
  execution_time_ms?: number
  memory_used_mb?: number
  submitted_at: string
  evaluated_at?: string
}

export interface Evaluation {
  id: string
  submission_id: string
  passed: boolean
  test_results: TestResult[]
  feedback: Feedback
  suggestions: string[]
  created_at: string
}

export interface TestResult {
  test_case_id: string
  name: string
  passed: boolean
  actual_output?: unknown
  expected_output?: unknown
  error_message?: string
  execution_time_ms?: number
}

export interface Feedback {
  overall_score: number
  correctness: FeedbackSection
  code_quality: FeedbackSection
  performance: FeedbackSection
  best_practices: FeedbackSection
}

export interface FeedbackSection {
  score: number
  comments: string[]
  suggestions: string[]
  issues?: CodeIssue[]
}

export interface CodeIssue {
  line: number
  column?: number
  severity: 'error' | 'warning' | 'info'
  message: string
  rule?: string
  fix_suggestion?: string
}

export interface ExerciseProgress {
  exercise_id: string
  attempts: number
  best_score?: number
  completed: boolean
  time_spent_minutes: number
  last_attempt_at?: string
  bookmarked: boolean
}

export interface ExerciseFilter {
  difficulty_levels?: number[]
  languages?: ProgrammingLanguage[]
  topics?: string[]
  types?: ExerciseType[]
  tags?: string[]
  completed?: boolean
  bookmarked?: boolean
  search?: string
}

export interface ExerciseSearchResult {
  exercises: Exercise[]
  total: number
  page: number
  per_page: number
  has_next: boolean
  has_prev: boolean
}

export type ExerciseType = 'coding' | 'quiz' | 'project' | 'review'

export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'cpp'

export type SubmissionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout'

export interface CodeExecutionResult {
  success: boolean
  output: string
  errors: string[]
  execution_time_ms: number
  memory_used_mb: number
  test_results?: TestResult[]
}

export interface HintRequest {
  exercise_id: string
  current_code: string
  hint_level: number // 1-3, increasing specificity
}

export interface Hint {
  level: number
  title: string
  content: string
  code_snippet?: string
}

// Monaco Editor related types
export interface EditorTheme {
  name: string
  label: string
  type: 'light' | 'dark'
}

export interface EditorSettings {
  theme: string
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  autoSave: boolean
}

export interface FileTab {
  name: string
  language: ProgrammingLanguage
  content: string
  modified: boolean
  readonly?: boolean
}
