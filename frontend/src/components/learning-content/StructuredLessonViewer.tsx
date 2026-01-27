/**
 * StructuredLessonViewer Component
 * 
 * Main component for displaying structured learning content with
 * objectives, sections, and key takeaways.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  StructuredLesson,
  ContentSection,
  LessonProgress,
  ContentSectionUIState,
} from '../../types/learning-content';
import { ContentSectionRenderer } from './ContentSectionRenderer';
import { ProgressMarker } from './ProgressMarker';
import { LessonHeader } from './LessonHeader';

interface StructuredLessonViewerProps {
  lesson: StructuredLesson;
  progress?: LessonProgress;
  onProgressUpdate?: (progress: Partial<LessonProgress>) => void;
  onComplete?: () => void;
  onSectionComplete?: (sectionId: string) => void;
  autoSaveInterval?: number; // milliseconds
}

export const StructuredLessonViewer: React.FC<StructuredLessonViewerProps> = ({
  lesson,
  progress,
  onProgressUpdate,
  onComplete,
  onSectionComplete,
  autoSaveInterval = 30000, // 30 seconds
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(progress?.completedSections || [])
  );
  const [timeSpent, setTimeSpent] = useState(progress?.timeSpentSeconds || 0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize from progress
  useEffect(() => {
    if (progress?.currentSectionId) {
      const index = lesson.sections.findIndex(s => s.id === progress.currentSectionId);
      if (index >= 0) {
        setCurrentSectionIndex(index);
        setShowResumePrompt(true);
      }
    }
    if (progress?.completedSections) {
      setCompletedSections(new Set(progress.completedSections));
    }
  }, [progress, lesson.sections]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-save progress
  // CRITICAL: This effect ONLY saves progress state, it must NEVER trigger navigation
  // Scroll position updates should only affect local state
  useEffect(() => {
    if (!onProgressUpdate) return;

    const interval = setInterval(() => {
      const currentSection = lesson.sections[currentSectionIndex];
      // Update progress WITHOUT triggering any navigation
      // This is purely a state update operation
      onProgressUpdate({
        currentSectionId: currentSection?.id,
        completedSections: Array.from(completedSections),
        timeSpentSeconds: timeSpent,
        scrollPosition: containerRef.current?.scrollTop || 0,
      });
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [currentSectionIndex, completedSections, timeSpent, lesson.sections, onProgressUpdate, autoSaveInterval]);

  const handleSectionComplete = useCallback((sectionId: string) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionId);
      return newSet;
    });
    onSectionComplete?.(sectionId);

    // Check if all required sections are complete
    const requiredSections = lesson.sections.filter(s => s.completionRequired);
    const allComplete = requiredSections.every(s => 
      completedSections.has(s.id) || s.id === sectionId
    );
    
    if (allComplete) {
      onComplete?.();
    }
  }, [lesson.sections, completedSections, onSectionComplete, onComplete]);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    const index = lesson.sections.findIndex(s => s.id === sectionId);
    if (index >= 0) {
      setCurrentSectionIndex(index);
      setShowResumePrompt(false);
    }
  }, [lesson.sections]);

  const handleNextSection = useCallback(() => {
    if (currentSectionIndex < lesson.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    }
  }, [currentSectionIndex, lesson.sections.length]);

  const handlePreviousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  }, [currentSectionIndex]);

  const completionPercentage = Math.round(
    (completedSections.size / lesson.sections.length) * 100
  );

  const sectionStates: ContentSectionUIState[] = lesson.sections.map((section, index) => ({
    ...section,
    isCompleted: completedSections.has(section.id),
    isActive: index === currentSectionIndex,
    isVisible: true,
  }));

  return (
    <div ref={containerRef} className="structured-lesson-viewer">
      {/* Resume prompt */}
      {showResumePrompt && (
        <div className="resume-prompt bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            Welcome back! Would you like to continue where you left off?
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowResumePrompt(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue
            </button>
            <button
              onClick={() => {
                setCurrentSectionIndex(0);
                setShowResumePrompt(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Start from beginning
            </button>
          </div>
        </div>
      )}

      {/* Lesson header */}
      <LessonHeader
        title={lesson.title}
        metadata={lesson.metadata}
        objectives={lesson.objectives}
        completionPercentage={completionPercentage}
      />

      {/* Progress marker */}
      <ProgressMarker
        sections={sectionStates}
        currentSectionId={lesson.sections[currentSectionIndex]?.id}
        onNavigate={handleNavigateToSection}
      />

      {/* Current section content */}
      <div className="lesson-content mt-6">
        {lesson.sections[currentSectionIndex] && (
          <ContentSectionRenderer
            section={lesson.sections[currentSectionIndex]}
            isCompleted={completedSections.has(lesson.sections[currentSectionIndex].id)}
            onComplete={() => handleSectionComplete(lesson.sections[currentSectionIndex].id)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="lesson-navigation flex justify-between items-center mt-8 pt-4 border-t">
        <button
          onClick={handlePreviousSection}
          disabled={currentSectionIndex === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <span className="text-sm text-gray-500">
          Section {currentSectionIndex + 1} of {lesson.sections.length}
        </span>
        
        <button
          onClick={handleNextSection}
          disabled={currentSectionIndex === lesson.sections.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Key takeaways (shown at the end) */}
      {currentSectionIndex === lesson.sections.length - 1 && (
        <div className="key-takeaways mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            🎯 Key Takeaways
          </h3>
          <ul className="space-y-2">
            {lesson.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-2 text-green-700">
                <span className="text-green-500">✓</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Time spent indicator */}
      <div className="time-spent text-sm text-gray-400 mt-4 text-right">
        Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
      </div>
    </div>
  );
};

export default StructuredLessonViewer;
