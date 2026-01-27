# Exercise Components

This directory contains all components related to coding exercises, including the Monaco Editor integration, code execution, and feedback systems.

## Components Overview

### Core Components

#### `ExerciseInterface`
The main component that orchestrates the entire exercise experience. It combines all other components into a cohesive interface.

**Features:**
- Resizable panels for instructions, code editor, and results
- File management for multi-file exercises
- Real-time code execution and testing
- Comprehensive feedback display
- Hint system integration

**Usage:**
```tsx
import { ExerciseInterface } from './components/exercises'

<ExerciseInterface
  exercise={exercise}
  onSubmit={handleSubmit}
  onTest={handleTest}
  onRequestHint={handleHintRequest}
/>
```

#### `CodeEditor`
Advanced Monaco Editor integration with syntax highlighting, linting, and formatting.

**Features:**
- Multi-language support (JavaScript, TypeScript, Python, Java, Go, Rust, C++)
- Custom themes (Learning Light/Dark)
- Real-time linting and error detection
- Code formatting and auto-completion
- File management (add, remove, duplicate files)
- Configurable editor settings
- Keyboard shortcuts and snippets

**Usage:**
```tsx
import { CodeEditor } from './components/exercises'

<CodeEditor
  files={files}
  activeFile={activeFile}
  onFileChange={handleFileChange}
  onActiveFileChange={setActiveFile}
  onFileAdd={handleFileAdd}
  onFileRemove={handleFileRemove}
  language="javascript"
  settings={editorSettings}
  onSettingsChange={setEditorSettings}
/>
```

#### `ExerciseInstructions`
Displays exercise instructions, examples, and hints in a tabbed interface.

**Features:**
- Tabbed interface (Instructions, Examples, Hints)
- Expandable hint system with different levels
- Code examples with syntax highlighting
- Responsive design with animations

#### `SubmissionPanel`
Handles code execution results, test feedback, and detailed evaluation display.

**Features:**
- Real-time execution status
- Test results with pass/fail indicators
- Detailed feedback with code quality metrics
- Performance metrics (execution time, memory usage)
- Error display and debugging information

#### `ResizablePanels`
Utility component for creating resizable panel layouts.

**Features:**
- Drag-to-resize functionality
- Configurable minimum/maximum widths
- Double-click to reset to center
- Smooth animations and visual feedback

### Configuration and Utilities

#### `MonacoEditorConfig`
Comprehensive Monaco Editor configuration including themes, language settings, and snippets.

**Features:**
- Custom themes optimized for learning
- Language-specific configurations and snippets
- Code completion providers
- Hover documentation
- Keyboard shortcuts and commands

#### `CodeLinting`
Advanced code linting and formatting service.

**Features:**
- Language-specific linting rules
- Real-time error detection
- Code formatting according to language conventions
- Integration with Monaco Editor markers
- Configurable severity levels

## Architecture

The exercise components follow clean architecture principles:

### Single Responsibility
- Each component has a focused responsibility
- Separation of concerns between UI, logic, and configuration
- Modular design for easy testing and maintenance

### Dependency Inversion
- Components depend on abstractions (interfaces) rather than concrete implementations
- Service classes for linting and configuration
- Pluggable architecture for different languages and features

### Interface Segregation
- Small, focused interfaces for different aspects
- Optional props for flexible component usage
- Clear separation between data and presentation

## Language Support

### Supported Languages
- **JavaScript**: ES6+ features, modern syntax
- **TypeScript**: Type annotations, interfaces, generics
- **Python**: PEP 8 style, docstrings, type hints
- **Java**: Object-oriented patterns, access modifiers
- **Go**: Idiomatic Go style, error handling
- **Rust**: Memory safety, ownership patterns
- **C++**: Modern C++ features, STL usage

### Language Features
- Syntax highlighting
- Auto-completion and IntelliSense
- Code snippets and templates
- Linting rules specific to each language
- Formatting according to language conventions

## Customization

### Editor Themes
- **Learning Light**: Optimized light theme for readability
- **Learning Dark**: Dark theme with good contrast
- **VS Code themes**: Standard VS Code light/dark themes
- **High Contrast**: Accessibility-focused theme

### Editor Settings
```typescript
interface EditorSettings {
  theme: string           // Editor theme
  fontSize: number        // Font size (10-24px)
  tabSize: number         // Tab size (2, 4, or 8 spaces)
  wordWrap: boolean       // Enable word wrapping
  minimap: boolean        // Show minimap
  lineNumbers: boolean    // Show line numbers
  autoSave: boolean       // Enable auto-save
}
```

### Linting Configuration
Each language has configurable linting rules:
- Error detection (syntax errors, type errors)
- Warning detection (code quality issues)
- Info suggestions (best practices)
- Custom rule severity levels

## Integration with Backend

### API Integration
The components integrate with the backend through well-defined interfaces:

```typescript
// Code execution
interface CodeExecutionResult {
  success: boolean
  output: string
  errors: string[]
  execution_time_ms: number
  memory_used_mb: number
  test_results?: TestResult[]
}

// Evaluation feedback
interface Evaluation {
  id: string
  submission_id: string
  passed: boolean
  test_results: TestResult[]
  feedback: Feedback
  suggestions: string[]
  created_at: string
}
```

### Real-time Features
- WebSocket integration for live updates
- Real-time collaboration (future enhancement)
- Live execution status updates
- Instant feedback delivery

## Performance Optimizations

### Code Splitting
- Lazy loading of Monaco Editor
- Dynamic language support loading
- Component-level code splitting

### Caching
- Editor configuration caching
- Language definition caching
- Theme and syntax highlighting caching

### Memory Management
- Proper cleanup of Monaco instances
- Event listener management
- Efficient re-rendering strategies

## Accessibility

### WCAG 2.1 Compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme support
- Focus management and indicators

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save/Auto-save
- `Ctrl/Cmd + Shift + F`: Format code
- `Ctrl/Cmd + /`: Toggle comments
- `F1`: Command palette
- `Ctrl/Cmd + Space`: Trigger suggestions

## Testing

### Unit Tests
- Component rendering tests
- User interaction tests
- Configuration and utility tests
- Linting service tests

### Integration Tests
- Monaco Editor integration
- File management workflows
- Code execution and feedback
- Multi-language support

### E2E Tests
- Complete exercise workflows
- Cross-browser compatibility
- Performance benchmarks
- Accessibility compliance

## Future Enhancements

### Planned Features
- Real-time collaboration
- Advanced debugging tools
- Git integration
- Plugin system for custom languages
- AI-powered code suggestions
- Advanced analytics and insights

### Extensibility
The architecture supports easy extension:
- New programming languages
- Custom linting rules
- Additional editor themes
- Enhanced feedback systems
- Integration with external tools

## Contributing

When adding new features or languages:

1. Follow the established patterns
2. Add comprehensive tests
3. Update type definitions
4. Document new functionality
5. Ensure accessibility compliance
6. Test across different browsers and devices

## Dependencies

### Core Dependencies
- `@monaco-editor/react`: Monaco Editor React wrapper
- `framer-motion`: Animations and transitions
- `@heroicons/react`: Icon library

### Development Dependencies
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- Storybook for component development

This comprehensive exercise system provides a professional-grade coding environment that enhances the learning experience while maintaining clean architecture and extensibility.