import api from './api'
import type {
  Exercise,
  ExerciseFilter,
  ExerciseSearchResult,
  Submission,
  Evaluation,
  CodeExecutionResult,
  HintRequest,
  Hint,
  ExerciseProgress
} from '../types/exercises'

export class ExerciseService {
  // Exercise browsing and search
  static async searchExercises(filter: ExerciseFilter = {}, page = 1, perPage = 20): Promise<ExerciseSearchResult> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...Object.fromEntries(
        Object.entries(filter).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value)
        ])
      )
    })

    const response = await api.get<ExerciseSearchResult>(`/exercises/search?${params}`)
    return response.data
  }

  static async getExercise(id: string): Promise<Exercise> {
    const response = await api.get<Exercise>(`/exercises/${id}`)
    return response.data
  }

  static async getExercisesByTopic(topicId: string): Promise<Exercise[]> {
    const response = await api.get<Exercise[]>(`/exercises/by-topic/${topicId}`)
    return response.data
  }

  static async getRecommendedExercises(limit = 5): Promise<Exercise[]> {
    const response = await api.get<Exercise[]>(`/exercises/recommended?limit=${limit}`)
    return response.data
  }

  // Exercise progress and bookmarks
  static async getExerciseProgress(exerciseId: string): Promise<ExerciseProgress> {
    const response = await api.get<ExerciseProgress>(`/exercises/${exerciseId}/progress`)
    return response.data
  }

  static async getAllProgress(): Promise<Record<string, ExerciseProgress>> {
    const response = await api.get<Record<string, ExerciseProgress>>('/exercises/progress')
    return response.data
  }

  static async bookmarkExercise(exerciseId: string): Promise<void> {
    await api.post(`/exercises/${exerciseId}/bookmark`)
  }

  static async unbookmarkExercise(exerciseId: string): Promise<void> {
    await api.delete(`/exercises/${exerciseId}/bookmark`)
  }

  static async getBookmarkedExercises(): Promise<Exercise[]> {
    const response = await api.get<Exercise[]>('/exercises/bookmarked')
    return response.data
  }

  // Code submission and evaluation
  static async submitCode(exerciseId: string, code: string, language: string, files?: Record<string, string>): Promise<Submission> {
    const response = await api.post<Submission>(`/exercises/${exerciseId}/submit`, {
      code,
      language,
      files
    })
    return response.data
  }

  static async getSubmission(submissionId: string): Promise<Submission> {
    const response = await api.get<Submission>(`/submissions/${submissionId}`)
    return response.data
  }

  static async getSubmissionEvaluation(submissionId: string): Promise<Evaluation> {
    const response = await api.get<Evaluation>(`/submissions/${submissionId}/evaluation`)
    return response.data
  }

  static async getExerciseSubmissions(exerciseId: string): Promise<Submission[]> {
    const response = await api.get<Submission[]>(`/exercises/${exerciseId}/submissions`)
    return response.data
  }

  static async getAllSubmissions(page = 1, perPage = 20): Promise<{
    submissions: Submission[]
    total: number
    page: number
    per_page: number
  }> {
    const response = await api.get<{
      submissions: Submission[]
      total: number
      page: number
      per_page: number
    }>(`/submissions?page=${page}&per_page=${perPage}`)
    return response.data
  }

  // Code execution (for testing without submission)
  static async executeCode(code: string, language: string, testCases?: unknown[]): Promise<CodeExecutionResult> {
    const response = await api.post<CodeExecutionResult>('/code/execute', {
      code,
      language,
      test_cases: testCases
    })
    return response.data
  }

  // Hints and help
  static async getHint(request: HintRequest): Promise<Hint> {
    const response = await api.post<Hint>('/exercises/hint', request)
    return response.data
  }

  static async getExerciseHints(exerciseId: string): Promise<Hint[]> {
    const response = await api.get<Hint[]>(`/exercises/${exerciseId}/hints`)
    return response.data
  }

  // Real-time submission status
  static async pollSubmissionStatus(submissionId: string): Promise<Submission> {
    const response = await api.get<Submission>(`/submissions/${submissionId}/status`)
    return response.data
  }

  // Exercise statistics
  static async getExerciseStats(exerciseId: string): Promise<{
    total_attempts: number
    success_rate: number
    average_score: number
    average_time_minutes: number
  }> {
    const response = await api.get<{
      total_attempts: number
      success_rate: number
      average_score: number
      average_time_minutes: number
    }>(`/exercises/${exerciseId}/stats`)
    return response.data
  }
}
