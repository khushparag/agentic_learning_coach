/**
 * Learning Content Service - Handles enriched learning content
 * 
 * This service provides methods to fetch and manage structured lessons,
 * track reading progress, submit knowledge check answers, and manage notes.
 */

import api from './api';
import type {
  StructuredLesson,
  LessonProgress,
  UserNote,
  GenerateLessonRequest,
  GenerateLessonResponse,
  SaveProgressRequest,
  SubmitKnowledgeCheckRequest,
  SubmitKnowledgeCheckResponse,
  ExplainDifferentlyRequest,
  ExplainDifferentlyResponse,
  CreateNoteRequest,
  ExportNotesResponse,
  SkillLevel,
  NoteType,
  HighlightColor,
  TextBlock,
} from '../types/learning-content';

// Cache for lessons to avoid repeated API calls
const lessonCache = new Map<string, { lesson: StructuredLesson; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedLesson(key: string): StructuredLesson | null {
  const cached = lessonCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.lesson;
  }
  lessonCache.delete(key);
  return null;
}

function setCachedLesson(key: string, lesson: StructuredLesson): void {
  lessonCache.set(key, { lesson, timestamp: Date.now() });
}

/**
 * Generate a structured lesson for a topic
 */
export async function generateLesson(request: GenerateLessonRequest): Promise<GenerateLessonResponse> {
  const cacheKey = `${request.topic}-${request.taskTitle}-${request.skillLevel}`;
  
  // Check cache first
  const cached = getCachedLesson(cacheKey);
  if (cached) {
    return { lesson: cached, generated: false };
  }
  
  try {
    const response = await api.post<GenerateLessonResponse>('/api/v1/content/lesson/generate', {
      topic: request.topic,
      task_title: request.taskTitle,
      skill_level: request.skillLevel || 'intermediate',
      technology: request.technology,
      requirements: request.requirements || [],
    });
    
    // Cache the lesson
    setCachedLesson(cacheKey, response.data.lesson);
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate lesson:', error);
    
    // If it's a 404 or 500, provide a fallback response
    if (error?.response?.status === 404 || error?.response?.status === 500) {
      console.warn('Backend unavailable, using fallback lesson structure');
      
      // Create a basic fallback lesson structure
      const fallbackLesson: StructuredLesson = {
        id: `fallback-${Date.now()}`,
        title: request.taskTitle || request.topic,
        topic: request.topic,
        metadata: {
          estimatedMinutes: 30,
          difficulty: request.skillLevel || 'intermediate',
          prerequisites: [],
          technology: request.technology || 'general',
          lastUpdated: new Date().toISOString(),
        },
        objectives: request.requirements || ['Complete the learning task'],
        sections: [
          {
            id: 'intro',
            type: 'text' as any,
            order: 0,
            content: {
              content: `# ${request.taskTitle || request.topic}\n\n${request.topic}\n\nThis is a learning task. Please review the requirements and complete the activities.`,
              format: 'markdown' as const,
            } as TextBlock,
            completionRequired: false,
          },
        ],
        keyTakeaways: request.requirements || [],
        relatedResources: [],
        version: '1.0',
      };
      
      return { lesson: fallbackLesson, generated: false };
    }
    
    throw error;
  }
}

/**
 * Get a lesson by ID
 */
export async function getLesson(lessonId: string): Promise<StructuredLesson> {
  const cached = getCachedLesson(lessonId);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await api.get<GenerateLessonResponse>(`/api/v1/content/lesson/${lessonId}`);
    setCachedLesson(lessonId, response.data.lesson);
    return response.data.lesson;
  } catch (error) {
    console.error('Failed to get lesson:', error);
    throw error;
  }
}

/**
 * Save reading progress
 */
export async function saveProgress(request: SaveProgressRequest): Promise<{ success: boolean; completionPercentage: number }> {
  try {
    const response = await api.post<{ success: boolean; completion_percentage: number; message: string }>(
      '/api/v1/content/progress',
      {
        lesson_id: request.lessonId,
        current_section_id: request.currentSectionId,
        completed_sections: request.completedSections,
        scroll_position: request.scrollPosition,
        time_spent_seconds: request.timeSpentSeconds,
      }
    );
    
    return {
      success: response.data.success,
      completionPercentage: response.data.completion_percentage,
    };
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw error;
  }
}

/**
 * Get reading progress for a lesson
 */
export async function getProgress(lessonId: string): Promise<LessonProgress> {
  try {
    const response = await api.get<{
      lesson_id: string;
      current_section_id: string | null;
      completed_sections: string[];
      completion_percentage: number;
      time_spent_seconds: number;
      completed: boolean;
      last_accessed_at: string;
    }>(`/api/v1/content/progress/${lessonId}`);
    
    return {
      userId: '', // Will be filled by backend
      lessonId: response.data.lesson_id,
      currentSectionId: response.data.current_section_id || undefined,
      completedSections: response.data.completed_sections,
      knowledgeCheckResults: {},
      scrollPosition: 0,
      timeSpentSeconds: response.data.time_spent_seconds,
      completed: response.data.completed,
      lastAccessedAt: response.data.last_accessed_at,
    };
  } catch (error) {
    console.error('Failed to get progress:', error);
    // Return default progress
    return {
      userId: '',
      lessonId,
      completedSections: [],
      knowledgeCheckResults: {},
      scrollPosition: 0,
      timeSpentSeconds: 0,
      completed: false,
      lastAccessedAt: new Date().toISOString(),
    };
  }
}


/**
 * Submit a knowledge check answer
 */
export async function submitKnowledgeCheck(
  request: SubmitKnowledgeCheckRequest
): Promise<SubmitKnowledgeCheckResponse> {
  try {
    const response = await api.post<{
      is_correct: boolean;
      feedback: string;
      explanation: string;
      attempt_number: number;
      should_re_explain: boolean;
    }>('/api/v1/content/knowledge-check', {
      lesson_id: request.lessonId,
      check_id: request.checkId,
      answer: request.answer,
      time_taken_seconds: request.timeTakenSeconds,
    });
    
    return {
      isCorrect: response.data.is_correct,
      feedback: response.data.feedback,
      explanation: response.data.explanation,
      attemptNumber: response.data.attempt_number,
      shouldReExplain: response.data.should_re_explain,
    };
  } catch (error) {
    console.error('Failed to submit knowledge check:', error);
    throw error;
  }
}

/**
 * Get an alternative explanation for a concept
 */
export async function explainDifferently(
  request: ExplainDifferentlyRequest
): Promise<ExplainDifferentlyResponse> {
  try {
    const response = await api.post<{
      explanation: string;
      analogy: { title: string; description: string; mapping: Record<string, string> } | null;
    }>('/api/v1/content/explain-differently', {
      concept_id: request.conceptId,
      previous_explanations: request.previousExplanations,
    });
    
    return {
      explanation: response.data.explanation,
      analogy: response.data.analogy || undefined,
    };
  } catch (error) {
    console.error('Failed to get alternative explanation:', error);
    throw error;
  }
}

/**
 * Create a note or highlight
 */
export async function createNote(request: CreateNoteRequest): Promise<UserNote> {
  try {
    const response = await api.post<{
      id: string;
      lesson_id: string;
      section_id: string | null;
      note_type: NoteType;
      content: string;
      color: HighlightColor | null;
      created_at: string;
    }>('/api/v1/content/notes', {
      lesson_id: request.lessonId,
      section_id: request.sectionId,
      note_type: request.noteType,
      content: request.content,
      selection_start: request.selectionStart,
      selection_end: request.selectionEnd,
      color: request.color,
    });
    
    return {
      id: response.data.id,
      userId: '',
      lessonId: response.data.lesson_id,
      sectionId: response.data.section_id || undefined,
      noteType: response.data.note_type,
      content: response.data.content,
      color: response.data.color || undefined,
      createdAt: response.data.created_at,
      updatedAt: response.data.created_at,
    };
  } catch (error) {
    console.error('Failed to create note:', error);
    throw error;
  }
}

/**
 * Get all notes for a lesson
 */
export async function getNotes(lessonId: string): Promise<UserNote[]> {
  try {
    const response = await api.get<Array<{
      id: string;
      lesson_id: string;
      section_id: string | null;
      note_type: NoteType;
      content: string;
      color: HighlightColor | null;
      created_at: string;
    }>>(`/api/v1/content/notes/${lessonId}`);
    
    return response.data.map(note => ({
      id: note.id,
      userId: '',
      lessonId: note.lesson_id,
      sectionId: note.section_id || undefined,
      noteType: note.note_type,
      content: note.content,
      color: note.color || undefined,
      createdAt: note.created_at,
      updatedAt: note.created_at,
    }));
  } catch (error) {
    console.error('Failed to get notes:', error);
    return [];
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    await api.delete(`/api/v1/content/notes/${noteId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete note:', error);
    return false;
  }
}

/**
 * Export notes to markdown
 */
export async function exportNotes(lessonId: string): Promise<ExportNotesResponse> {
  try {
    const response = await api.get<{ markdown: string; filename: string }>(
      `/api/v1/content/notes/${lessonId}/export`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to export notes:', error);
    throw error;
  }
}

/**
 * Clear lesson cache
 */
export function clearLessonCache(): void {
  lessonCache.clear();
}

/**
 * Invalidate a specific lesson in cache
 */
export function invalidateLessonCache(lessonId: string): void {
  lessonCache.delete(lessonId);
}

// Export the service object
export const learningContentService = {
  generateLesson,
  getLesson,
  saveProgress,
  getProgress,
  submitKnowledgeCheck,
  explainDifferently,
  createNote,
  getNotes,
  deleteNote,
  exportNotes,
  clearLessonCache,
  invalidateLessonCache,
};

export default learningContentService;
