/**
 * DiagramViewer Component
 * 
 * Renders Mermaid diagrams with accessibility support.
 * Falls back to showing the code if mermaid is not available.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { MermaidDiagram } from '../../types/learning-content';

interface DiagramViewerProps {
  diagram: MermaidDiagram;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ diagram }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [mermaidAvailable, setMermaidAvailable] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import mermaid
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        });

        // Generate unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, diagram.code);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Failed to render Mermaid diagram:', err);
        // Check if it's a module not found error
        if (err instanceof Error && err.message.includes('mermaid')) {
          setMermaidAvailable(false);
          setError('Mermaid library not available. Showing diagram code instead.');
        } else {
          setError('Failed to render diagram. The diagram syntax may be invalid.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [diagram.code]);

  const getDiagramTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      flowchart: 'Flowchart',
      sequence: 'Sequence Diagram',
      class: 'Class Diagram',
      state: 'State Diagram',
      er: 'Entity Relationship Diagram',
    };
    return labels[type] || 'Diagram';
  };

  return (
    <div className="diagram-viewer bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-medium text-gray-700">
            {getDiagramTypeLabel(diagram.type)}
          </span>
        </div>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      {/* Diagram */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && !mermaidAvailable && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 mb-2">{error}</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{diagram.code}</code>
            </pre>
          </div>
        )}

        {error && mermaidAvailable && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <pre className="mt-2 text-sm text-red-600 overflow-x-auto">
              {diagram.code}
            </pre>
          </div>
        )}

        {!isLoading && !error && (
          <div
            ref={containerRef}
            className="diagram-container flex justify-center overflow-x-auto"
            role="img"
            aria-label={diagram.altText}
          />
        )}

        {/* Caption */}
        {diagram.caption && (
          <p className="mt-3 text-sm text-gray-600 text-center italic">
            {diagram.caption}
          </p>
        )}

        {/* Mermaid code (collapsible) */}
        {showCode && !error && (
          <div className="mt-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{diagram.code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Accessibility text */}
      <div className="sr-only">
        {diagram.altText}
      </div>
    </div>
  );
};

export default DiagramViewer;
