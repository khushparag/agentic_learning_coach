/**
 * useTaskNavigation Hook
 * 
 * Centralized task navigation logic with validation and error handling.
 * This hook ensures safe navigation by validating tasks and content before navigating.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningPathService } from '../services/learningPathService';
import { learningContentService } from '../services/learningContentService';

interface UseTaskNavigationOptions {
  onError?: (error: Error) => void;
  onLoadingChange?: (loading: boolean) => void;
}

interface UseTaskNavigationReturn {
  navigateToTask: (taskId: string, taskType?: string) => Promise<void>;
  isNavigating: boolean;
  navigationError: string | null;
  clearError: () => void;
}

interface TaskDestination {
  type: 'exercise' | 'content' | 'quiz';
  path: string;
}

/**
 * Determines the destination path for a task based on its type.
 * Priority order: explicit taskType > task.type > task.metadata.type > default
 */
function determineTaskDestination(task: any, taskType?: string): TaskDestination {
  // Priority 1: Explicit task type parameter
  if (taskType) {
    return getDestinationForType(taskType, task.id);
  }
  
  // Priority 2: Task type property
  if (task.type) {
    return getDestinationForType(task.type, task.id);
  }
  
  // Priority 3: Task metadata type
  if (task.metadata?.type) {
    return getDestinationForType(task.metadata.type, task.id);
  }
  
  // Default: Reading/content task
  return { type: 'content', path: `/content/${task.id}` };
}

/**
 * Maps task type string to destination configuration
 * 
 * NOTE: All task types now route to /exercises/:taskId because the Exercises component
 * handles all task types (coding, reading, video, quiz, project) internally.
 * This simplifies routing and avoids 404 errors.
 */
function getDestinationForType(type: string, taskId: string): TaskDestination {
  const normalizedType = type.toLowerCase();
  
  // Determine the logical type for internal tracking
  let logicalType: 'exercise' | 'content' | 'quiz' = 'content';
  
  switch (normalizedType) {
    case 'coding':
    case 'exercise':
    case 'code':
      logicalType = 'exercise';
      break;
    
    case 'quiz':
    case 'assessment':
    case 'test':
      logicalType = 'quiz';
      break;
    
    case 'reading':
    case 'content':
    case 'lesson':
    case 'material':
    case 'video':
    case 'project':
    default:
      logicalType = 'content';
      break;
  }
  
  // All types route to /exercises/:taskId - the Exercises component handles the rest
  return { 
    type: logicalType, 
    path: `/exercises/${taskId}` 
  };
}

/**
 * Hook for safe task navigation with validation and error handling
 */
export function useTaskNavigation(options?: UseTaskNavigationOptions): UseTaskNavigationReturn {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const navigateToTask = useCallback(async (taskId: string, taskType?: string) => {
    setIsNavigating(true);
    setNavigationError(null);
    options?.onLoadingChange?.(true);

    try {
      // Step 1: Validate task exists
      let task;
      try {
        task = await learningPathService.getTaskDetails(taskId);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          throw new Error('Task not found. It may have been removed or you may not have access to it.');
        }
        throw new Error('Failed to load task details. Please check your connection and try again.');
      }
      
      // Step 2: Determine destination based on task type
      const destination = determineTaskDestination(task, taskType);
      
      // Step 3: Pre-load content if needed (for content/reading tasks)
      // Note: Content pre-loading is now handled by the Exercises component itself
      // This ensures content is loaded at the right time with proper error handling
      
      // Step 4: Navigate with state
      navigate(destination.path, { 
        state: { 
          task,
          fromLearningPath: true,
          timestamp: Date.now(),
        },
        replace: false, // Keep history for back navigation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      setNavigationError(errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsNavigating(false);
      options?.onLoadingChange?.(false);
    }
  }, [navigate, options]);

  const clearError = useCallback(() => {
    setNavigationError(null);
  }, []);

  return {
    navigateToTask,
    isNavigating,
    navigationError,
    clearError,
  };
}

export default useTaskNavigation;
