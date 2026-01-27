/**
 * TypeScript interfaces for enriched learning content.
 * 
 * These types mirror the Python domain entities and add UI-specific properties
 * for managing component state.
 */

// Enums
export type ContentSectionType = 'text' | 'concept-card' | 'code-example' | 'knowledge-check' | 'diagram';
export type KnowledgeCheckType = 'multiple-choice' | 'fill-blank' | 'code-completion' | 'true-false';
export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'state' | 'er';
export type ResourceCategory = 'essential' | 'recommended' | 'deep-dive';
export type ResourceType = 'documentation' | 'tutorial' | 'video' | 'article' | 'reference';
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type NoteType = 'highlight' | 'note';
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

// Metadata
export interface LessonMetadata {
  estimatedMinutes: number;
  difficulty: SkillLevel;
  prerequisites: string[];
  technology: string;
  lastUpdated: string;
}

// Text content
export interface TextBlock {
  content: string;
  format: 'markdown' | 'html';
}

// Concept Card components
export interface Mistake {
  description: string;
  example: string;
  correction: string;
}

export interface UseCase {
  scenario: string;
  example: string;
  benefit: string;
}

export interface Analogy {
  title: string;
  description: string;
  mapping: Record<string, string>; // concept term -> analogy term
}

export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

export interface MermaidDiagram {
  type: DiagramType;
  code: string;
  caption: string;
  altText: string; // Accessibility
}

export interface ConceptCard {
  id: string;
  conceptName: string;
  primaryExplanation: string;
  analogy: Analogy;
  diagram?: MermaidDiagram;
  alternativeExplanations: string[];
  commonMistakes: Mistake[];
  whenToUse: UseCase[];
  codeSnippet?: CodeSnippet;
}

// Code Example
export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: ProgrammingLanguage;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hints: string[];
  isEditable: boolean;
  expectedOutput?: string;
}

// Knowledge Check
export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface KnowledgeCheck {
  id: string;
  question: string;
  type: KnowledgeCheckType;
  options: Option[];
  correctAnswer: string | string[];
  explanation: string;
  hint: string;
  relatedConceptId?: string;
  difficulty: number; // 1-5
}

// Content Section
export interface ContentSection {
  id: string;
  type: ContentSectionType;
  order: number;
  content: TextBlock | ConceptCard | CodeExample | KnowledgeCheck | MermaidDiagram;
  completionRequired: boolean;
}

// Resource
export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  category: ResourceCategory;
  estimatedMinutes: number;
  verified: boolean;
  lastVerified: string;
}

// Structured Lesson
export interface StructuredLesson {
  id: string;
  title: string;
  topic: string;
  metadata: LessonMetadata;
  objectives: string[];
  sections: ContentSection[];
  keyTakeaways: string[];
  relatedResources: Resource[];
  version: string;
}

// Progress tracking
export interface KnowledgeCheckResult {
  checkId: string;
  isCorrect: boolean;
  attempts: number;
  lastAnswer: string;
  completedAt?: string;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  currentSectionId?: string;
  completedSections: string[];
  knowledgeCheckResults: Record<string, KnowledgeCheckResult>;
  scrollPosition: number;
  timeSpentSeconds: number;
  completed: boolean;
  completedAt?: string;
  lastAccessedAt: string;
}

// User notes and highlights
export interface UserNote {
  id: string;
  userId: string;
  lessonId: string;
  sectionId?: string;
  noteType: NoteType;
  content: string;
  selectionStart?: number;
  selectionEnd?: number;
  color?: HighlightColor;
  createdAt: string;
  updatedAt: string;
}

// UI State interfaces
export interface ConceptCardUIState extends ConceptCard {
  isExpanded: boolean;
  showAlternativeExplanation: boolean;
  currentAlternativeIndex: number;
}

export interface CodeExampleUIState extends CodeExample {
  currentCode: string;
  isRunning: boolean;
  output?: string;
  error?: string;
  showHints: boolean;
  currentHintIndex: number;
  hasBeenModified: boolean;
}

export interface KnowledgeCheckUIState extends KnowledgeCheck {
  selectedAnswer?: string;
  isSubmitted: boolean;
  isCorrect?: boolean;
  attempts: number;
  showHint: boolean;
  showExplanation: boolean;
}

export interface ContentSectionUIState extends ContentSection {
  isCompleted: boolean;
  isActive: boolean;
  isVisible: boolean;
}

export interface LessonUIState {
  lesson: StructuredLesson;
  sections: ContentSectionUIState[];
  progress: LessonProgress;
  notes: UserNote[];
  isLoading: boolean;
  error?: string;
  showResumePrompt: boolean;
  autoSaveEnabled: boolean;
}

// API Request/Response types
export interface GenerateLessonRequest {
  topic: string;
  taskTitle: string;
  skillLevel: SkillLevel;
  technology?: string;
  requirements?: string[];
}

export interface GenerateLessonResponse {
  lesson: StructuredLesson;
  generated: boolean;
}

export interface SaveProgressRequest {
  lessonId: string;
  currentSectionId?: string;
  completedSections: string[];
  scrollPosition: number;
  timeSpentSeconds: number;
}

export interface SubmitKnowledgeCheckRequest {
  lessonId: string;
  checkId: string;
  answer: string;
  timeTakenSeconds?: number;
}

export interface SubmitKnowledgeCheckResponse {
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  attemptNumber: number;
  shouldReExplain: boolean;
}

export interface ExplainDifferentlyRequest {
  conceptId: string;
  previousExplanations: string[];
}

export interface ExplainDifferentlyResponse {
  explanation: string;
  analogy?: Analogy;
}

export interface CreateNoteRequest {
  lessonId: string;
  sectionId?: string;
  noteType: NoteType;
  content: string;
  selectionStart?: number;
  selectionEnd?: number;
  color?: HighlightColor;
}

export interface ExportNotesResponse {
  markdown: string;
  filename: string;
}

// Code execution types
export interface CodeExecutionRequest {
  code: string;
  language: ProgrammingLanguage;
  testCases?: TestCase[];
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  testResults?: TestCaseResult[];
  executionTimeMs: number;
}

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  description: string;
}

// Helper type guards
export function isTextBlock(content: unknown): content is TextBlock {
  return typeof content === 'object' && content !== null && 'content' in content && 'format' in content;
}

export function isConceptCard(content: unknown): content is ConceptCard {
  return typeof content === 'object' && content !== null && 'conceptName' in content && 'primaryExplanation' in content;
}

export function isCodeExample(content: unknown): content is CodeExample {
  return typeof content === 'object' && content !== null && 'starterCode' in content && 'language' in content;
}

export function isKnowledgeCheck(content: unknown): content is KnowledgeCheck {
  return typeof content === 'object' && content !== null && 'question' in content && 'type' in content;
}

export function isMermaidDiagram(content: unknown): content is MermaidDiagram {
  return typeof content === 'object' && content !== null && 'code' in content && 'type' in content && 'altText' in content;
}
