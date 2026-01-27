/**
 * ProgressMarker Component
 * 
 * Shows visual progress through lesson sections with navigation.
 */

import React from 'react';
import type { ContentSectionUIState } from '../../types/learning-content';

interface ProgressMarkerProps {
  sections: ContentSectionUIState[];
  currentSectionId?: string;
  onNavigate: (sectionId: string) => void;
}

export const ProgressMarker: React.FC<ProgressMarkerProps> = ({
  sections,
  currentSectionId,
  onNavigate,
}) => {
  const getSectionIcon = (type: string): string => {
    switch (type) {
      case 'text':
        return '📖';
      case 'concept-card':
        return '💡';
      case 'code-example':
        return '💻';
      case 'knowledge-check':
        return '❓';
      case 'diagram':
        return '📊';
      default:
        return '📄';
    }
  };

  const getSectionLabel = (type: string): string => {
    switch (type) {
      case 'text':
        return 'Reading';
      case 'concept-card':
        return 'Concept';
      case 'code-example':
        return 'Code';
      case 'knowledge-check':
        return 'Quiz';
      case 'diagram':
        return 'Diagram';
      default:
        return 'Section';
    }
  };

  return (
    <div className="progress-marker">
      {/* Horizontal progress bar with markers */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
        
        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-300"
          style={{
            width: `${(sections.filter(s => s.isCompleted).length / sections.length) * 100}%`,
          }}
        />

        {/* Section markers */}
        <div className="relative flex justify-between">
          {sections.map((section, index) => {
            const isActive = section.id === currentSectionId;
            const isCompleted = section.isCompleted;
            
            return (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={`
                  flex flex-col items-center group
                  ${isActive ? 'z-10' : ''}
                `}
                title={`${getSectionLabel(section.type)} ${index + 1}`}
              >
                {/* Marker circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    transition-all duration-200
                    ${isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : 'bg-white border-2 border-gray-300 text-gray-400 hover:border-blue-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{getSectionIcon(section.type)}</span>
                  )}
                </div>
                
                {/* Label (shown on hover or when active) */}
                <span
                  className={`
                    mt-2 text-xs whitespace-nowrap
                    ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}
                    ${!isActive ? 'opacity-0 group-hover:opacity-100' : ''}
                    transition-opacity duration-200
                  `}
                >
                  {getSectionLabel(section.type)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section list (collapsible on mobile) */}
      <details className="mt-4 md:hidden">
        <summary className="text-sm text-gray-600 cursor-pointer">
          View all sections
        </summary>
        <ul className="mt-2 space-y-1">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => onNavigate(section.id)}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  ${section.id === currentSectionId
                    ? 'bg-blue-100 text-blue-700'
                    : section.isCompleted
                      ? 'text-green-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-2">{getSectionIcon(section.type)}</span>
                {getSectionLabel(section.type)} {index + 1}
                {section.isCompleted && <span className="ml-2">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};

export default ProgressMarker;
