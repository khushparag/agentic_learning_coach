/**
 * LessonHeader Component
 * 
 * Displays lesson title, metadata, and learning objectives.
 */

import React from 'react';
import type { LessonMetadata } from '../../types/learning-content';

interface LessonHeaderProps {
  title: string;
  metadata: LessonMetadata;
  objectives: string[];
  completionPercentage: number;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  title,
  metadata,
  objectives,
  completionPercentage,
}) => {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="lesson-header mb-8">
      {/* Title and metadata */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {metadata.estimatedMinutes} min
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[metadata.difficulty]}`}>
              {metadata.difficulty}
            </span>
            {metadata.technology && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                {metadata.technology}
              </span>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Learning objectives */}
      <div className="objectives bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          What You'll Learn
        </h2>
        <ul className="space-y-2">
          {objectives.map((objective, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
              <span className="text-blue-400 mt-0.5">•</span>
              {objective}
            </li>
          ))}
        </ul>
      </div>

      {/* Prerequisites (if any) */}
      {metadata.prerequisites.length > 0 && (
        <div className="prerequisites mt-4 text-sm text-gray-600">
          <span className="font-medium">Prerequisites: </span>
          {metadata.prerequisites.join(', ')}
        </div>
      )}
    </div>
  );
};

export default LessonHeader;
