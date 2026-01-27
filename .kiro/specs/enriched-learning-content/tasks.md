# Implementation Plan: Enriched Learning Content

## Overview

This implementation transforms placeholder reading materials into rich, interactive learning experiences with structured lessons, executable code examples, concept cards, knowledge checks, and adaptive content. The implementation follows a backend-first approach, building the content generation engine before the frontend components.

## Tasks

- [x] 1. Database schema and migrations
  - [x] 1.1 Create database migration for lesson_content table
    - Add lesson_content table with JSONB content storage
    - Include indexes for topic_id and skill_level
    - _Requirements: 1.1, 8.5_
  - [x] 1.2 Create database migration for reading_progress table
    - Add reading_progress table with user progress tracking
    - Include unique constraint on user_id + lesson_id
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 1.3 Create database migration for user_content_notes table
    - Add user_content_notes table for highlights and notes
    - Include indexes for efficient retrieval
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 1.4 Create database migration for knowledge_check_attempts table
    - Add knowledge_check_attempts table for tracking answers
    - _Requirements: 4.6_
  - [ ]* 1.5 Write property test for progress persistence round-trip
    - **Property 14: Progress Persistence Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.6**

- [x] 2. Content data models and types
  - [x] 2.1 Create Python data models for structured lesson content
    - Define StructuredLesson, ContentSection, LessonMetadata
    - Define ConceptCard, CodeExample, KnowledgeCheck types
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  - [x] 2.2 Create TypeScript interfaces for frontend content types
    - Mirror Python models in TypeScript
    - Add UI-specific properties (isExpanded, isCompleted)
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  - [ ]* 2.3 Write property test for concept card completeness
    - **Property 7: Concept Card Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6**

- [x] 3. Content generator service - core
  - [x] 3.1 Create ContentGeneratorService class with LLM integration
    - Implement generate_lesson method
    - Add prompt templates for structured content generation
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 3.2 Implement concept card generation
    - Generate primary explanation, analogy, common mistakes, when to use
    - Support alternative explanation generation
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_
  - [x] 3.3 Implement knowledge check generation
    - Support multiple-choice, fill-blank, code-completion formats
    - Generate feedback for correct and incorrect answers
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 3.4 Write property test for knowledge check density
    - **Property 5: Knowledge Check Density**
    - **Validates: Requirements 4.1**
  - [ ]* 3.5 Write property test for lesson structure completeness
    - **Property 1: Lesson Structure Completeness**
    - **Validates: Requirements 1.1, 1.4, 1.5**

- [x] 4. Code example validation
  - [x] 4.1 Implement code example validator using code runner service
    - Validate starter code executes correctly
    - Validate test cases pass with solution code
    - _Requirements: 2.1, 9.1_
  - [x] 4.2 Implement helpful error message generation
    - Parse execution errors and provide suggestions
    - Map common error patterns to helpful guidance
    - _Requirements: 2.5_
  - [ ]* 4.3 Write property test for code example validity
    - **Property 3: Code Example Validity**
    - **Validates: Requirements 2.1, 2.5, 9.1**

- [ ] 5. Checkpoint - Core content generation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Adaptive content engine
  - [x] 6.1 Implement skill-level content adaptation
    - Adjust explanation depth based on beginner/intermediate/advanced
    - Add more analogies for beginners, more edge cases for advanced
    - _Requirements: 5.1, 5.2_
  - [x] 6.2 Implement performance-based adaptation
    - Track knowledge check performance
    - Increase depth after consecutive failures
    - Reduce redundancy after consecutive successes
    - _Requirements: 5.5, 5.6_
  - [ ]* 6.3 Write property test for adaptive content consistency
    - **Property 9: Adaptive Content Consistency**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 7. Diagram generation
  - [ ] 7.1 Implement Mermaid diagram generation for algorithms
    - Generate flowcharts for process explanations
    - Generate sequence diagrams for interactions
    - _Requirements: 6.1, 6.4_
  - [ ] 7.2 Implement data structure visualizations
    - Generate visual representations for arrays, trees, graphs
    - _Requirements: 6.2_
  - [ ] 7.3 Add accessibility text alternatives for all diagrams
    - Generate alt text descriptions for each diagram
    - _Requirements: 6.6_
  - [ ]* 7.4 Write property test for Mermaid diagram validity
    - **Property 18: Mermaid Diagram Validity**
    - **Validates: Requirements 6.4**
  - [ ]* 7.5 Write property test for diagram accessibility
    - **Property 11: Diagram Accessibility**
    - **Validates: Requirements 6.6**

- [ ] 8. Resource linking and verification
  - [ ] 8.1 Implement resource discovery from Qdrant
    - Search for relevant documentation and tutorials
    - Categorize as Essential/Recommended/Deep Dive
    - _Requirements: 7.1, 7.2_
  - [ ] 8.2 Implement resource URL verification
    - Verify URLs are accessible before including
    - Cache verification results
    - _Requirements: 7.3_
  - [ ] 8.3 Add resource metadata extraction
    - Extract type, estimated time, difficulty
    - _Requirements: 7.4_
  - [ ]* 8.4 Write property test for resource verification
    - **Property 13: Resource Verification**
    - **Validates: Requirements 7.3**
  - [ ]* 8.5 Write property test for resource metadata completeness
    - **Property 12: Resource Metadata Completeness**
    - **Validates: Requirements 7.2, 7.4**

- [x] 9. Backend API endpoints
  - [x] 9.1 Create GET /api/v1/content/lesson/{lesson_id} endpoint
    - Return structured lesson content adapted to user level
    - Include user's progress if authenticated
    - _Requirements: 1.1, 5.1, 5.2_
  - [x] 9.2 Create POST /api/v1/content/progress endpoint
    - Save reading position and completed sections
    - Track time spent
    - _Requirements: 8.1, 8.3, 8.5_
  - [x] 9.3 Create POST /api/v1/content/knowledge-check endpoint
    - Submit knowledge check answers
    - Return feedback and update performance tracking
    - _Requirements: 4.2, 4.3, 4.6_
  - [x] 9.4 Create POST /api/v1/content/explain-differently endpoint
    - Generate alternative explanation for a concept
    - _Requirements: 3.4_
  - [ ]* 9.5 Write property test for knowledge check feedback completeness
    - **Property 6: Knowledge Check Feedback Completeness**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 10. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend - Reading content component
  - [x] 11.1 Create StructuredLessonViewer component
    - Render lesson with objectives, sections, and takeaways
    - Show estimated time and difficulty
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 11.2 Create ContentSection component
    - Render different section types (text, concept-card, code, quiz)
    - Track section completion
    - _Requirements: 1.1, 1.6_
  - [x] 11.3 Create ProgressMarker component
    - Show visual progress through lesson
    - Enable navigation to sections
    - _Requirements: 1.6, 8.4_
  - [ ]* 11.4 Write property test for completion percentage accuracy
    - **Property 15: Completion Percentage Accuracy**
    - **Validates: Requirements 8.4**

- [x] 12. Frontend - Concept card component
  - [x] 12.1 Create ConceptCard component
    - Display primary explanation with expandable sections
    - Show analogy, common mistakes, when to use
    - _Requirements: 3.1, 3.2, 3.5, 3.6_
  - [x] 12.2 Add "Explain Differently" functionality
    - Button to request alternative explanation
    - Display new explanation without losing original
    - _Requirements: 3.4_
  - [ ]* 12.3 Write property test for alternative explanation uniqueness
    - **Property 8: Alternative Explanation Uniqueness**
    - **Validates: Requirements 3.4**

- [x] 13. Frontend - Interactive code example
  - [x] 13.1 Create InteractiveCodeExample component
    - Integrate Monaco editor for code editing
    - Support JavaScript, TypeScript, Python, Java
    - _Requirements: 2.1, 2.6_
  - [x] 13.2 Add code execution integration
    - Execute code via code runner service
    - Display output and test results
    - _Requirements: 2.2_
  - [x] 13.3 Add reset and hints functionality
    - Reset to original button
    - Progressive hint reveal
    - _Requirements: 2.4_
  - [ ]* 13.4 Write property test for code example coverage
    - **Property 4: Code Example Coverage**
    - **Validates: Requirements 2.3**

- [x] 14. Frontend - Knowledge check component
  - [x] 14.1 Create KnowledgeCheck component
    - Support multiple-choice, fill-blank, code-completion
    - Show immediate feedback on answer
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 14.2 Add retry and re-explanation flow
    - Track attempts
    - Offer re-explanation after 2 failures
    - _Requirements: 4.5_
  - [ ]* 14.3 Write property test for adaptive difficulty adjustment
    - **Property 10: Adaptive Difficulty Adjustment**
    - **Validates: Requirements 5.5, 5.6**

- [x] 15. Frontend - Notes and highlights
  - [x] 15.1 Create text selection and highlighting
    - Enable text selection for highlighting
    - Support multiple highlight colors
    - _Requirements: 10.1_
  - [x] 15.2 Create notes attachment functionality
    - Add notes to specific sections
    - Display notes inline
    - _Requirements: 10.2, 10.6_
  - [x] 15.3 Create NotesPanel component
    - Aggregate all notes and highlights
    - Enable export to markdown
    - _Requirements: 10.4, 10.5_
  - [ ]* 15.4 Write property test for notes persistence
    - **Property 16: Notes and Highlights Persistence**
    - **Validates: Requirements 10.3, 10.6**
  - [ ]* 15.5 Write property test for notes export completeness
    - **Property 17: Notes Export Completeness**
    - **Validates: Requirements 10.4, 10.5**

- [x] 16. Frontend - Progress and auto-save
  - [x] 16.1 Implement auto-save progress
    - Save position every 30 seconds
    - Save on section completion
    - _Requirements: 8.1_
  - [x] 16.2 Implement resume functionality
    - Detect returning user
    - Offer to resume from last position
    - _Requirements: 8.2_
  - [x] 16.3 Display completion tracking
    - Show overall percentage
    - Track completed sections and knowledge checks
    - _Requirements: 8.3, 8.4_

- [ ] 17. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Integration and polish
  - [x] 18.1 Wire up StructuredLessonViewer in Exercises page
    - Replace SimpleMarkdown renderer with StructuredLessonViewer component
    - Import and use learningContentService instead of contentService
    - Pass lesson data to StructuredLessonViewer with proper props
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 18.2 Update content generation to use enriched lesson API
    - Change Exercises.tsx to call learningContentService.generateLesson()
    - Map task data to GenerateLessonRequest format
    - Handle structured lesson response with sections, concept cards, code examples
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  - [x] 18.3 Connect progress tracking to reading flow
    - Wire up onProgressUpdate callback to save reading progress
    - Implement resume functionality using saved progress
    - Track section completions and knowledge check results
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 18.4 Add loading states and error handling
    - Show skeleton loaders during content generation
    - Graceful fallback for LLM failures with meaningful content
    - Display error messages when content generation fails
    - _Requirements: 9.4, 9.5_
  - [ ] 18.5 Add content issue reporting
    - Allow users to report inaccuracies
    - Display outdated content warnings
    - _Requirements: 9.4, 9.5_
  - [ ]* 18.6 Write property test for section length constraint
    - **Property 2: Section Length Constraint**
    - **Validates: Requirements 1.3**

- [ ] 19. Improve fallback content quality
  - [x] 19.1 Enhance fallback lesson generator ✓
    - Created TOPIC_TEMPLATES dictionary with 8 common programming topics (variables, functions, loops, arrays, objects, conditionals, async, classes)
    - Each template includes: objectives, detailed explanations, analogies with mappings, common mistakes with corrections, use cases with examples, and key takeaways
    - Added _get_topic_template() method for fuzzy topic matching (direct, partial, and keyword-based)
    - Enhanced _generate_fallback_concept_card() to use template-specific analogies, mistakes, and use cases
    - Enhanced _generate_fallback_code_example() with topic-specific code for variables, functions, loops, and arrays (both JS and Python)
    - Enhanced _generate_fallback_knowledge_check() with topic-specific questions for all 8 topics
    - _Requirements: 1.1, 2.3, 3.1_
  - [ ] 19.2 Add curated content library
    - Create pre-generated lessons for common programming topics
    - Store in database for instant retrieval when LLM unavailable
    - Include JavaScript, TypeScript, React, Python basics
    - _Requirements: 1.1, 9.1_
  - [ ] 19.3 Implement content caching strategy
    - Cache generated lessons in database
    - Serve cached content for repeated topic requests
    - Invalidate cache when content quality improves
    - _Requirements: 8.5_

- [ ] 20. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify end-to-end reading flow works correctly
  - Confirm structured lessons display with concept cards, code examples, and knowledge checks
  - Test that progress tracking saves and resumes correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses Python (pytest + hypothesis) for backend and TypeScript (Jest + fast-check) for frontend property-based testing

## Current Status

**Issue Identified**: The enriched content components (StructuredLessonViewer, ConceptCard, InteractiveCodeExample, KnowledgeCheck) exist but are NOT wired up to the reading flow. The Exercises page still uses the old `contentService` which generates basic placeholder content.

**Root Cause**: 
- `frontend/src/pages/exercises/Exercises.tsx` imports `contentService` (old) instead of `learningContentService` (new)
- The `SimpleMarkdown` component renders basic markdown instead of using `StructuredLessonViewer`
- The new enriched content API endpoints exist but aren't being called

**Solution**: Tasks 18.1-18.4 will properly integrate the enriched content system into the reading flow.
