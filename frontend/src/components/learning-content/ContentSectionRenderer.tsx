/**
 * ContentSectionRenderer Component
 * 
 * Renders different types of content sections (text, concept-card, code-example, etc.)
 */

import React from 'react';
import type { ContentSection } from '../../types/learning-content';
import { isTextBlock, isConceptCard, isCodeExample, isKnowledgeCheck, isMermaidDiagram } from '../../types/learning-content';
import { ConceptCardComponent } from './ConceptCard';
import { InteractiveCodeExample } from './InteractiveCodeExample';
import { KnowledgeCheckComponent } from './KnowledgeCheck';
import { TextContent } from './TextContent';
import { DiagramViewer } from './DiagramViewer';

interface ContentSectionRendererProps {
  section: ContentSection;
  isCompleted: boolean;
  onComplete: () => void;
}

export const ContentSectionRenderer: React.FC<ContentSectionRendererProps> = ({
  section,
  isCompleted,
  onComplete,
}) => {
  const renderContent = () => {
    const { content, type } = section;

    // Handle text content
    if (type === 'text' || isTextBlock(content)) {
      const textContent = isTextBlock(content) ? content : { content: String(content), format: 'markdown' as const };
      return (
        <TextContent
          content={textContent}
          onRead={onComplete}
        />
      );
    }

    // Handle concept card
    if (type === 'concept-card' || isConceptCard(content)) {
      return (
        <ConceptCardComponent
          card={content as any}
          onComplete={onComplete}
        />
      );
    }

    // Handle code example
    if (type === 'code-example' || isCodeExample(content)) {
      return (
        <InteractiveCodeExample
          example={content as any}
          onComplete={onComplete}
        />
      );
    }

    // Handle knowledge check
    if (type === 'knowledge-check' || isKnowledgeCheck(content)) {
      return (
        <KnowledgeCheckComponent
          check={content as any}
          onComplete={onComplete}
        />
      );
    }

    // Handle diagram
    if (type === 'diagram' || isMermaidDiagram(content)) {
      return (
        <DiagramViewer
          diagram={content as any}
        />
      );
    }

    // Fallback for unknown content types
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Content type not supported: {type}</p>
      </div>
    );
  };

  return (
    <div className={`content-section ${isCompleted ? 'completed' : ''}`}>
      {renderContent()}
      
      {/* Completion indicator */}
      {isCompleted && (
        <div className="flex items-center gap-2 mt-4 text-green-600 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Section completed
        </div>
      )}
    </div>
  );
};

export default ContentSectionRenderer;
