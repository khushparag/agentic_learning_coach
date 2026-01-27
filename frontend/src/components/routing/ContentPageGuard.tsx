/**
 * ContentPageGuard Component
 * 
 * Route guard that validates content exists before rendering the page.
 * Prevents broken page states by checking task availability and redirecting on failure.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { learningPathService } from '../../services/learningPathService';

interface ContentPageGuardProps {
  taskId: string;
  children: React.ReactNode;
}

export const ContentPageGuard: React.FC<ContentPageGuardProps> = ({ taskId, children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateContent = async () => {
      try {
        // Check if we have task data from navigation state
        const taskFromState = location.state?.task;
        
        if (taskFromState && taskFromState.id === taskId) {
          // We have valid task data from navigation, no need to fetch
          setIsValidating(false);
          return;
        }
        
        // Try to load task details from API
        try {
          await learningPathService.getTaskDetails(taskId);
          setIsValidating(false);
        } catch (apiError: any) {
          if (apiError?.response?.status === 404) {
            setError('Content not found');
          } else if (apiError?.response?.status === 403) {
            setError('Access denied');
          } else {
            setError('Content unavailable');
          }
          
          // Redirect back to learning path after 2 seconds
          setTimeout(() => {
            navigate('/learning-path', { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error('Content validation failed:', err);
        setError('Validation error');
        
        // Redirect back to learning path after 2 seconds
        setTimeout(() => {
          navigate('/learning-path', { replace: true });
        }, 2000);
      }
    };

    validateContent();
  }, [taskId, location.state, navigate]);

  // Loading state
  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            role="status"
            aria-label="Loading"
          />
          <p className="text-gray-600 font-medium">Validating content...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error}
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecting back to learning path...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full animate-pulse"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Content is valid, render children
  return <>{children}</>;
};

export default ContentPageGuard;
