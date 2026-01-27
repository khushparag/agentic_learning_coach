/**
 * Learning Content Components
 * 
 * Components for displaying enriched learning content including
 * structured lessons, concept cards, code examples, and knowledge checks.
 */

export { StructuredLessonViewer } from './StructuredLessonViewer';
export { LessonHeader } from './LessonHeader';
export { ProgressMarker } from './ProgressMarker';
export { ContentSectionRenderer } from './ContentSectionRenderer';
export { TextContent } from './TextContent';
export { ConceptCardComponent } from './ConceptCard';
export { InteractiveCodeExample } from './InteractiveCodeExample';
export { KnowledgeCheckComponent } from './KnowledgeCheck';
export { DiagramViewer } from './DiagramViewer';
export { NotesPanel } from './NotesPanel';

// Re-export types for convenience
export type {
  StructuredLesson,
  ContentSection,
  ConceptCard,
  CodeExample,
  KnowledgeCheck,
  MermaidDiagram,
  LessonProgress,
  UserNote,
} from '../../types/learning-content';
