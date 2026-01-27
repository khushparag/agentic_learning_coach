// =============================================================================
// API Types - TypeScript interfaces for all API requests and responses
// =============================================================================

// Common types used across multiple domains
export interface BaseResponse {
  success: boolean
  message?: string
}

export interface ErrorResponse {
  detail: string
  error_code?: string
}

export interface PaginationParams {
  page?: number
  page_size?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// =============================================================================
// Goals Domain
// =============================================================================

export interface TimeConstraints {
  hours_per_week: number
  preferred_times: string[]
  available_days: string[]
  session_length_minutes: number
}

export interface SetGoalsRequest {
  goals: string[]
  time_constraints: TimeConstraints
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferences?: Record<string, unknown>
}

export interface SetGoalsResponse extends BaseResponse {
  user_id: string
  goals: string[]
  goal_categories: Record<string, string[]>
  time_constraints: TimeConstraints
  estimated_timeline: {
    total_estimated_hours: number
    hours_per_goal: number
    estimated_weeks: number
    estimated_days: number
  }
  next_steps: string[]
  created_at: string
}

export interface UpdateGoalsRequest {
  goals?: string[]
  time_constraints?: TimeConstraints
  preferences?: Record<string, unknown>
}

// =============================================================================
// Curriculum Domain
// =============================================================================

export interface CreateCurriculumRequest {
  goals: string[]
  title?: string
  description?: string
}

export interface TaskResponse {
  id: string
  module_id: string
  day_offset: number
  task_type: 'READ' | 'WATCH' | 'CODE' | 'QUIZ'
  description: string
  estimated_minutes: number
  completion_criteria: string
  resources: string[]
  hints: string[]
  is_completed: boolean
}

export interface ModuleResponse {
  id: string
  plan_id: string
  title: string
  summary: string
  order_index: number
  learning_objectives: string[]
  estimated_minutes: number
  tasks: TaskResponse[]
  tasks_completed: number
  total_tasks: number
  progress_percentage: number
}

export interface CurriculumResponse {
  id: string
  user_id: string
  title: string
  goal_description: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  total_days: number
  estimated_hours?: number
  modules: ModuleResponse[]
  modules_completed: number
  total_modules: number
  overall_progress: number
  current_module_index: number
  created_at: string
  updated_at?: string
}

export interface CurriculumStatusResponse {
  has_active_plan: boolean
  plan_id?: string
  status?: string
  progress_percentage: number
  current_module?: string
  current_task?: string
  days_remaining?: number
  next_milestone?: string
  recommendations: string[]
}

export interface CurriculumListResponse {
  curricula: CurriculumResponse[]
  total: number
  active_plan_id?: string
}

export interface ActivateCurriculumRequest {
  plan_id: string
}

// =============================================================================
// Tasks Domain
// =============================================================================

export interface TaskSummaryResponse {
  id: string
  module_id: string
  module_title: string
  task_type: string
  description: string
  estimated_minutes: number
  is_completed: boolean
  day_offset: number
}

export interface TaskDetailResponse extends TaskSummaryResponse {
  completion_criteria: string
  resources: string[]
  instructions?: unknown
  test_cases?: unknown
  solution_template?: string
  hints: string[]
  time_limit_minutes?: number
  best_score?: number
  attempts: number
  last_attempt_at?: string
}

export interface TodayTasksResponse {
  date: string
  day_offset: number
  tasks: TaskSummaryResponse[]
  total_tasks: number
  completed_tasks: number
  total_estimated_minutes: number
  progress_message: string
}

export interface TaskListResponse extends PaginatedResponse<TaskSummaryResponse> {
  filter_applied?: string
}

export interface TaskHintResponse {
  task_id: string
  hint_index: number
  hint: string
  total_hints: number
  has_more_hints: boolean
}

// =============================================================================
// Submissions Domain
// =============================================================================

export interface SubmitCodeRequest {
  task_id: string
  code: string
  language: string
  files?: Record<string, string>
}

export interface TestResultResponse {
  name: string
  passed: boolean
  expected_output?: unknown
  actual_output?: unknown
  execution_time_ms?: number
  error_message?: string
}

export interface FeedbackIssue {
  line?: number
  problem: string
  why: string
  how_to_fix: string
  severity: 'low' | 'medium' | 'high'
}

export interface FeedbackResponse {
  overall_assessment: string
  strengths: string[]
  issues: FeedbackIssue[]
  suggestions: string[]
  next_steps: string[]
}

export interface QualityAnalysisResponse {
  readability_score: number
  structure_score: number
  best_practices_score: number
  complexity_score: number
  overall_quality_score: number
  quality_rating: string
  issues_count: number
}

export interface EvaluationResponse {
  submission_id: string
  task_id: string
  passed: boolean
  score: number
  execution_status: string
  execution_time_ms: number
  test_results: TestResultResponse[]
  tests_passed: number
  tests_total: number
  feedback: FeedbackResponse
  quality_analysis: QualityAnalysisResponse
  output?: string
  errors?: string[]
  evaluated_at: string
}

export interface SubmissionResponse {
  id: string
  task_id: string
  user_id: string
  language: string
  status: string
  score?: number
  submitted_at: string
  evaluated_at?: string
}

export interface SubmissionListResponse extends PaginatedResponse<SubmissionResponse> {}

// =============================================================================
// Progress Domain
// =============================================================================

export interface TaskProgressResponse {
  task_id: string
  task_description: string
  task_type: string
  completed: boolean
  attempts: number
  best_score?: number
  time_spent_minutes: number
  last_attempt_at?: string
  completed_at?: string
}

export interface ModuleProgressResponse {
  module_id: string
  module_title: string
  order_index: number
  total_tasks: number
  completed_tasks: number
  progress_percentage: number
  average_score?: number
  total_time_spent_minutes: number
  status: 'not_started' | 'in_progress' | 'completed'
  tasks: TaskProgressResponse[]
}

export interface ProgressSummaryResponse {
  user_id: string
  has_active_plan: boolean
  plan_id?: string
  plan_title?: string
  overall_progress: number
  total_modules: number
  completed_modules: number
  total_tasks: number
  completed_tasks: number
  total_time_spent_minutes: number
  average_score?: number
  current_streak_days: number
  longest_streak_days: number
  last_activity_at?: string
}

export interface DetailedProgressResponse {
  summary: ProgressSummaryResponse
  modules: ModuleProgressResponse[]
  recent_submissions: Array<{
    task_id: string
    score?: number
    submitted_at?: string
  }>
  skill_breakdown: Record<string, number>
  learning_velocity: {
    tasks_per_day: number
    average_time_per_task: number
    trend: string
  }
  recommendations: string[]
  achievements: Array<{
    id: string
    title: string
    description: string
    earned_at: string
  }>
}

export interface ProgressStatsResponse {
  total_learning_hours: number
  tasks_completed_this_week: number
  tasks_completed_this_month: number
  average_daily_time_minutes: number
  most_productive_day?: string
  most_productive_time?: string
  completion_rate: number
  improvement_trend: string
}

export interface ProgressUpdateRequest {
  task_id: string
  completed: boolean
  time_spent_minutes?: number
}

// =============================================================================
// Analytics Domain
// =============================================================================

export interface LearningVelocity {
  tasks_per_day: number
  hours_per_week: number
  trend: 'increasing' | 'stable' | 'decreasing'
  velocity_score: number
}

export interface SkillProgression {
  skill: string
  initial_level: number
  current_level: number
  progression_rate: number
  predicted_mastery_date?: string
}

export interface StrugglePattern {
  topic: string
  failure_rate: number
  common_errors: string[]
  recommended_intervention: string
  confidence: number
}

export interface LearningInsights {
  user_id: string
  generated_at: string
  velocity: LearningVelocity
  skill_progressions: SkillProgression[]
  struggle_patterns: StrugglePattern[]
  predicted_completion_date?: string
  recommended_focus_areas: string[]
  engagement_score: number
  streak_health: 'healthy' | 'at_risk' | 'broken'
  optimal_study_times: string[]
}

export interface DifficultyPrediction {
  recommended_difficulty: number
  confidence: number
  reasoning: string
  alternative_difficulties: number[]
}

export interface RetentionAnalysis {
  topic: string
  last_practiced: string
  retention_score: number
  review_urgency: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommended_review_date: string
}

export interface ActivityHeatmapData {
  user_id: string
  start_date: string
  end_date: string
  total_activities: number
  data: Array<{
    date: string
    count: number
    level: number
  }>
}

export interface PeerComparison {
  user_id: string
  metric: string
  user_value: number
  peer_average: number
  peer_median: number
  percentile: number
  comparison_group_size: number
  insight: string
}

export interface PersonalizedRecommendations {
  user_id: string
  generated_at: string
  recommendations: Array<{
    type: 'schedule' | 'content' | 'pace'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    action: string
  }>
  next_milestone: {
    title: string
    progress: number
    estimated_completion: string
  }
}

// =============================================================================
// Social Domain
// =============================================================================

export interface CreateChallengeRequest {
  challenger_id: string
  challenged_id: string
  challenge_type: 'speed_coding' | 'code_golf' | 'best_practices' | 'streak_race'
  topic: string
  difficulty?: string
}

export interface PeerChallenge {
  id: string
  challenger_id: string
  challenged_id: string
  challenge_type: string
  exercise_id?: string
  topic: string
  difficulty: string
  status: 'pending' | 'active' | 'completed' | 'expired' | 'declined'
  created_at: string
  expires_at: string
  challenger_score?: number
  challenged_score?: number
  winner_id?: string
  xp_reward: number
}

export interface ShareSolutionRequest {
  user_id: string
  exercise_id: string
  code: string
  language: string
  description?: string
  tags?: string[]
}

export interface SharedSolution {
  id: string
  user_id: string
  exercise_id: string
  code: string
  language: string
  description?: string
  likes: number
  comments_count: number
  created_at: string
  is_featured: boolean
  tags: string[]
}

export interface Comment {
  id: string
  solution_id: string
  user_id: string
  content: string
  created_at: string
  likes: number
  is_helpful: boolean
}

export interface CreateStudyGroupRequest {
  name: string
  description: string
  topic: string
  creator_id: string
  max_members?: number
  is_public?: boolean
  weekly_goal?: number
}

export interface StudyGroup {
  id: string
  name: string
  description: string
  topic: string
  creator_id: string
  members: string[]
  max_members: number
  created_at: string
  is_public: boolean
  weekly_goal?: number
}

export interface StudyGroupProgress {
  group_id: string
  group_name: string
  weekly_goal?: number
  members: Array<{
    user_id: string
    exercises_this_week: number
    streak: number
    contribution_score: number
  }>
  group_average: number
}

export interface ActivityFeedItem {
  type: 'solution_shared' | 'challenge_won' | 'achievement_earned'
  user_id: string
  content: string
  timestamp: string
  data: Record<string, unknown>
}

// =============================================================================
// Gamification Domain
// =============================================================================

export interface Achievement {
  id: string
  name: string
  description: string
  badge: string
  category: 'streak' | 'skill' | 'social' | 'milestone' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xp_reward: number
  unlocked: boolean
  unlocked_at?: string
  progress: number
  requirement: string
}

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  last_activity?: string
  streak_status: 'active' | 'at_risk' | 'broken' | 'inactive'
  next_milestone?: {
    days: number
    name: string
    badge: string
    days_remaining: number
  }
  streak_multiplier: number
}

export interface XPEvent {
  event_type: string
  xp_earned: number
  multiplier: number
  source: string
  timestamp: string
}

export interface UserGamificationProfile {
  user_id: string
  total_xp: number
  level: number
  xp_to_next_level: number
  level_progress: number
  streak: StreakInfo
  achievements_unlocked: number
  total_achievements: number
  recent_xp_events: XPEvent[]
  badges: string[]
}

export interface AwardXPRequest {
  user_id: string
  xp_amount: number
  event_type: string
  source: string
}

export interface AwardXPResponse extends BaseResponse {
  xp_awarded: number
  total_xp: number
  level: number
  level_up: boolean
  new_achievements: Achievement[]
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  total_xp: number
  level: number
  streak: number
  badges_count: number
}

export interface BadgeShowcase {
  user_id: string
  total_badges: number
  badges_by_category: Record<string, Array<{
    badge: string
    name: string
    rarity: string
    unlocked_at: string
  }>>
  featured_badges: Array<{
    id: string
    badge: string
    unlocked_at: string
  }>
  rarity_counts: {
    common: number
    rare: number
    epic: number
    legendary: number
  }
}
