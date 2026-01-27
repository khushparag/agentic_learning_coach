/**
 * useLessonProgress Hook
 * 
 * Manages lesson progress with auto-save functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LessonProgress, StructuredLesson, UserNote } from '../types/learning-content';
import { learningContentService } from '../services/learningContentService';

interface UseLessonProgressOptions {
  lessonId: string;
  lesson?: StructuredLesson;
  autoSaveInterval?: number; // milliseconds
  onProgressSaved?: () => void;
  onError?: (error: Error) => void;
}

interface UseLessonProgressReturn {
  progress: LessonProgress;
  notes: UserNote[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  completionPercentage: number;
  markSectionComplete: (sectionId: string) => void;
  setCurrentSection: (sectionId: string) => void;
  updateScrollPosition: (position: number) => void;
  addNote: (note: Omit<UserNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  saveProgress: () => Promise<void>;
  resetProgress: () => void;
}

export function useLessonProgress({
  lessonId,
  lesson,
  autoSaveInterval = 30000,
  onProgressSaved,
  onError,
}: UseLessonProgressOptions): UseLessonProgressReturn {
  const [progress, setProgress] = useState<LessonProgress>({
    userId: '',
    lessonId,
    completedSections: [],
    knowledgeCheckResults: {},
    scrollPosition: 0,
    timeSpentSeconds: 0,
    completed: false,
    lastAccessedAt: new Date().toISOString(),
  });
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const lastSaveRef = useRef<number>(Date.now());
  const hasChangesRef = useRef<boolean>(false);

  // Calculate completion percentage
  const totalSections = lesson?.sections.length || 1;
  const completionPercentage = Math.round(
    (progress.completedSections.length / totalSections) * 100
  );

  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const [savedProgress, savedNotes] = await Promise.all([
          learningContentService.getProgress(lessonId),
          learningContentService.getNotes(lessonId),
        ]);
        setProgress(savedProgress);
        setNotes(savedNotes);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error('Failed to load progress:', err);
        setError('Failed to load your progress');
        onError?.(err instanceof Error ? err : new Error('Failed to load progress'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [lessonId, onError]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => ({
        ...prev,
        timeSpentSeconds: prev.timeSpentSeconds + 1,
      }));
      hasChangesRef.current = true;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save progress
  // CRITICAL: This effect ONLY saves progress, it must NEVER trigger navigation
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasChangesRef.current && Date.now() - lastSaveRef.current >= autoSaveInterval) {
        // Save progress without any navigation side effects
        await saveProgressInternal();
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSaveInterval]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        // Fire and forget save on unmount
        learningContentService.saveProgress({
          lessonId,
          currentSectionId: progress.currentSectionId,
          completedSections: progress.completedSections,
          scrollPosition: progress.scrollPosition,
          timeSpentSeconds: progress.timeSpentSeconds,
        }).catch(console.error);
      }
    };
  }, [lessonId, progress]);

  const saveProgressInternal = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // CRITICAL FIX: Save progress WITHOUT triggering any navigation
      // This function should ONLY update state and call the API
      // It must NEVER call navigate() or trigger any route changes
      await learningContentService.saveProgress({
        lessonId,
        currentSectionId: progress.currentSectionId,
        completedSections: progress.completedSections,
        scrollPosition: progress.scrollPosition,
        timeSpentSeconds: progress.timeSpentSeconds,
      });
      lastSaveRef.current = Date.now();
      hasChangesRef.current = false;
      
      // Callback only - no navigation allowed here
      onProgressSaved?.();
    } catch (err) {
      console.error('Failed to save progress:', err);
      // Don't throw - just log and continue
      // This prevents errors from disrupting the user experience
      setError('Failed to save progress');
      onError?.(err instanceof Error ? err : new Error('Failed to save progress'));
    } finally {
      setIsSaving(false);
    }
  };

  const markSectionComplete = useCallback((sectionId: string) => {
    setProgress(prev => {
      if (prev.completedSections.includes(sectionId)) {
        return prev;
      }
      
      const newCompletedSections = [...prev.completedSections, sectionId];
      const allComplete = lesson 
        ? lesson.sections.filter(s => s.completionRequired).every(s => newCompletedSections.includes(s.id))
        : false;

      hasChangesRef.current = true;
      
      return {
        ...prev,
        completedSections: newCompletedSections,
        completed: allComplete,
        completedAt: allComplete ? new Date().toISOString() : undefined,
      };
    });
  }, [lesson]);

  const setCurrentSection = useCallback((sectionId: string) => {
    setProgress(prev => ({
      ...prev,
      currentSectionId: sectionId,
    }));
    hasChangesRef.current = true;
  }, []);

  const updateScrollPosition = useCallback((position: number) => {
    setProgress(prev => ({
      ...prev,
      scrollPosition: position,
    }));
    hasChangesRef.current = true;
  }, []);

  const addNote = useCallback(async (noteData: Omit<UserNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newNote = await learningContentService.createNote({
        lessonId: noteData.lessonId,
        sectionId: noteData.sectionId,
        noteType: noteData.noteType,
        content: noteData.content,
        selectionStart: noteData.selectionStart,
        selectionEnd: noteData.selectionEnd,
        color: noteData.color,
      });
      setNotes(prev => [...prev, newNote]);
    } catch (err) {
      console.error('Failed to add note:', err);
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      await learningContentService.deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  }, []);

  const saveProgress = useCallback(async () => {
    await saveProgressInternal();
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      userId: '',
      lessonId,
      completedSections: [],
      knowledgeCheckResults: {},
      scrollPosition: 0,
      timeSpentSeconds: 0,
      completed: false,
      lastAccessedAt: new Date().toISOString(),
    });
    hasChangesRef.current = true;
  }, [lessonId]);

  return {
    progress,
    notes,
    isLoading,
    isSaving,
    error,
    completionPercentage,
    markSectionComplete,
    setCurrentSection,
    updateScrollPosition,
    addNote,
    deleteNote,
    saveProgress,
    resetProgress,
  };
}

export default useLessonProgress;
