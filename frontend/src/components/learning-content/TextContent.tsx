/**
 * TextContent Component
 * 
 * Renders markdown or HTML text content with reading tracking.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { TextBlock } from '../../types/learning-content';

interface TextContentProps {
  content: TextBlock;
  onRead?: () => void;
}

export const TextContent: React.FC<TextContentProps> = ({
  content,
  onRead,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasBeenRead, setHasBeenRead] = useState(false);

  // Track when user has scrolled through content
  useEffect(() => {
    if (hasBeenRead || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            setHasBeenRead(true);
            onRead?.();
          }
        });
      },
      { threshold: 0.8 }
    );

    // Observe the last element in the content
    const lastChild = contentRef.current.lastElementChild;
    if (lastChild) {
      observer.observe(lastChild);
    }

    return () => observer.disconnect();
  }, [hasBeenRead, onRead]);

  // Simple markdown to HTML conversion
  const renderMarkdown = (markdown: string): string => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-2">$&</ul>')
      // Numbered lists
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4">$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="my-3">')
      // Line breaks
      .replace(/\n/g, '<br />');

    return `<p class="my-3">${html}</p>`;
  };

  return (
    <div
      ref={contentRef}
      className="text-content prose prose-slate max-w-none"
    >
      {content.format === 'markdown' ? (
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content.content) }}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content.content }} />
      )}
    </div>
  );
};

export default TextContent;
