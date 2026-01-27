/**
 * TaskBreadcrumbs Component
 * 
 * Displays navigation hierarchy for learning content.
 * Provides context and easy navigation back to learning path.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

interface TaskBreadcrumbsProps {
  moduleName?: string;
  taskName: string;
  onNavigateBack?: () => void;
  className?: string;
}

export const TaskBreadcrumbs: React.FC<TaskBreadcrumbsProps> = ({
  moduleName,
  taskName,
  onNavigateBack,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBackToLearningPath = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      navigate('/learning-path', { replace: false });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {/* Home / Learning Path */}
        <li>
          <button
            onClick={handleBackToLearningPath}
            onKeyDown={(e) => handleKeyDown(e, handleBackToLearningPath)}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Back to Learning Path"
          >
            <HomeIcon className="w-4 h-4 mr-1" aria-hidden="true" />
            <span>Learning Path</span>
          </button>
        </li>

        {/* Module (if provided) */}
        {moduleName && (
          <>
            <li aria-hidden="true">
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-600 px-2 py-1">
                {moduleName}
              </span>
            </li>
          </>
        )}

        {/* Current Task */}
        <li aria-hidden="true">
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
        </li>
        <li>
          <span 
            className="text-gray-900 font-medium px-2 py-1"
            aria-current="page"
          >
            {taskName}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default TaskBreadcrumbs;
