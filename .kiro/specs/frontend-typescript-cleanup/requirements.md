# Requirements Document

## Introduction

This specification covers the systematic cleanup of TypeScript compilation errors in the frontend codebase. The frontend has accumulated ~235 TypeScript errors across ~66 files due to type mismatches, missing imports, incorrect exports, and API interface inconsistencies. This cleanup will restore type safety and enable successful compilation without rewriting the existing architecture.

## Glossary

- **Frontend**: The React/TypeScript web application in the `frontend/` directory
- **TypeScript_Compiler**: The `tsc` tool that validates TypeScript code for type correctness
- **Module_Export**: A file that exports components, types, or functions for use by other files
- **Type_Mismatch**: When a value's type doesn't match the expected type signature
- **UI_Component**: Reusable React component in `src/components/ui/`
- **Service_Layer**: API service files in `src/services/` that handle backend communication
- **Hook**: Custom React hook in `src/hooks/` that encapsulates reusable logic

## Requirements

### Requirement 1: Fix UI Component Exports

**User Story:** As a developer, I want all UI components to be properly exported, so that other components can import and use them without TypeScript errors.

#### Acceptance Criteria

1. WHEN a component imports from `../ui` or `@/components/ui`, THE UI_Component module SHALL export all referenced components (Button, Card, Input, Modal, Select, Textarea, Progress)
2. WHEN the Progress component is imported, THE UI_Component module SHALL provide a Progress component with proper TypeScript types
3. WHEN the Select component is imported, THE UI_Component module SHALL provide a Select component with proper TypeScript types
4. IF a UI component export is missing, THEN THE System SHALL add the export to the index.ts file

### Requirement 2: Fix Module Export Issues

**User Story:** As a developer, I want all component files to be proper ES modules, so that they can be imported without "not a module" errors.

#### Acceptance Criteria

1. WHEN a file is imported as a module, THE Module_Export SHALL have at least one export statement
2. WHEN SubmissionPanel.tsx is imported, THE Module_Export SHALL export the SubmissionPanel component
3. WHEN BadgeCollection.tsx is imported, THE Module_Export SHALL export the BadgeCollection component
4. IF a file has no exports, THEN THE System SHALL add appropriate export statements

### Requirement 3: Fix Duplicate Identifier Issues

**User Story:** As a developer, I want index.ts files to have unique exports, so that there are no duplicate identifier errors.

#### Acceptance Criteria

1. WHEN an index.ts file re-exports components, THE Module_Export SHALL not have duplicate identifiers
2. WHEN exercises/index.ts exports components, THE Module_Export SHALL export ExerciseInstructions only once
3. WHEN notifications/index.ts exports components, THE Module_Export SHALL export NotificationPreferences only once
4. IF duplicate exports exist, THEN THE System SHALL remove the duplicates

### Requirement 4: Fix Type Mismatches in Services

**User Story:** As a developer, I want service return types to match hook expectations, so that data flows correctly through the application.

#### Acceptance Criteria

1. WHEN a service function returns data, THE Service_Layer SHALL return types that match the consuming hook's expectations
2. WHEN dashboardService returns analytics data, THE Service_Layer SHALL include all expected properties (consistencyScore, etc.)
3. WHEN progressService returns data, THE Service_Layer SHALL match the useProgress hook's expected types
4. IF a type mismatch exists between service and hook, THEN THE System SHALL align the types

### Requirement 5: Fix Monaco Editor Type Issues

**User Story:** As a developer, I want Monaco editor integrations to use correct types, so that code editor components compile without errors.

#### Acceptance Criteria

1. WHEN using Monaco editor APIs, THE System SHALL use correct type imports from monaco-editor
2. WHEN accessing ContentWidgetPositionPreference, THE System SHALL import it from the correct namespace
3. WHEN using editor.IDisposable, THE System SHALL use the correct type path
4. IF Monaco types are incorrect, THEN THE System SHALL fix the import paths and type references

### Requirement 6: Fix Chart Library Imports

**User Story:** As a developer, I want chart components to import correctly from recharts, so that analytics visualizations compile without errors.

#### Acceptance Criteria

1. WHEN using AreaChart component, THE System SHALL import it from recharts
2. WHEN using Area component, THE System SHALL import it from recharts
3. WHEN using Bar component with dynamic fill, THE System SHALL use correct prop types
4. IF chart imports are missing, THEN THE System SHALL add the correct imports

### Requirement 7: Fix Icon Library Imports

**User Story:** As a developer, I want icon imports to reference existing icons, so that UI elements render correctly.

#### Acceptance Criteria

1. WHEN importing icons from lucide-react, THE System SHALL only import icons that exist in the library
2. WHEN importing icons from @heroicons/react, THE System SHALL only import icons that exist in the library
3. IF Screen or ScreenOff icons are used, THEN THE System SHALL replace with existing alternatives (Monitor, MonitorOff)
4. IF CrownIcon is used from heroicons, THEN THE System SHALL replace with an existing alternative

### Requirement 8: Fix Collaboration Service Interface

**User Story:** As a developer, I want the collaboration service to expose all methods used by components, so that real-time features work correctly.

#### Acceptance Criteria

1. WHEN components access collaboration service methods, THE Service_Layer SHALL expose all required methods
2. WHEN accessing wsService, THE Service_Layer SHALL either expose it publicly or provide wrapper methods
3. WHEN using inviteToSession method, THE Service_Layer SHALL provide this method in the interface
4. IF private members are accessed, THEN THE System SHALL refactor to use public interfaces

### Requirement 9: Fix Button Variant Types

**User Story:** As a developer, I want Button component variants to be type-safe, so that only valid variants are used.

#### Acceptance Criteria

1. WHEN a Button variant prop is set, THE UI_Component SHALL accept only defined variant values
2. WHEN "default" variant is used, THE System SHALL map it to an existing variant or add it to the type
3. WHEN "destructive" variant is used, THE System SHALL map it to an existing variant or add it to the type
4. IF an invalid variant is used, THEN THE System SHALL update the variant type or fix the usage

### Requirement 10: Fix Card Component Props

**User Story:** As a developer, I want Card components to accept event handlers, so that interactive cards work correctly.

#### Acceptance Criteria

1. WHEN a Card component needs mouse events, THE UI_Component SHALL accept onMouseEnter and onMouseLeave props
2. WHEN a Card component needs click events, THE UI_Component SHALL accept onClick prop
3. IF Card props are missing event handlers, THEN THE System SHALL extend the CardProps interface

### Requirement 11: Fix Input Component Props

**User Story:** As a developer, I want Input components to accept icon props, so that inputs can display icons.

#### Acceptance Criteria

1. WHEN an Input component needs an icon, THE UI_Component SHALL accept an icon prop
2. IF Input props don't include icon, THEN THE System SHALL either add the prop or refactor the usage

### Requirement 12: Fix Hook Return Types

**User Story:** As a developer, I want hooks to return consistent types, so that components can use hook data without type errors.

#### Acceptance Criteria

1. WHEN useWebSocket returns data, THE Hook SHALL include isConnected and lastMessage properties if used by consumers
2. WHEN useLeaderboard returns data, THE Hook SHALL match the expected interface
3. WHEN useCompetition returns data, THE Hook SHALL match the expected interface
4. IF hook return types don't match usage, THEN THE System SHALL align the types

### Requirement 13: Fix Storybook Configuration

**User Story:** As a developer, I want Storybook files to compile correctly, so that component documentation works.

#### Acceptance Criteria

1. WHEN Storybook files import from @storybook/react, THE System SHALL have the package installed or remove the stories
2. WHEN story files reference components, THE System SHALL use correct import syntax
3. IF @storybook/react is not installed, THEN THE System SHALL either install it or remove story files

### Requirement 14: Fix Generic Type Constraints

**User Story:** As a developer, I want generic components to have proper type constraints, so that they work with various data types.

#### Acceptance Criteria

1. WHEN AccessibleTable uses generic types, THE System SHALL properly constrain the generic parameter
2. WHEN rendering table cell values, THE System SHALL handle the generic type correctly
3. IF generic types cause errors, THEN THE System SHALL add appropriate type constraints or assertions

### Requirement 15: Fix Ref Type Issues

**User Story:** As a developer, I want ref types to match their target elements, so that DOM references work correctly.

#### Acceptance Criteria

1. WHEN a ref is typed as RefObject<HTMLElement>, THE System SHALL use the specific element type if needed
2. WHEN AccessibleTable uses a table ref, THE System SHALL type it as RefObject<HTMLTableElement>
3. IF ref types are too generic, THEN THE System SHALL use specific element types
