# Accessibility Components

This directory contains comprehensive accessibility features that ensure WCAG 2.1 AA compliance throughout the Agentic Learning Coach application.

## Overview

The accessibility system provides:

- **WCAG 2.1 AA Compliance**: All components meet or exceed accessibility standards
- **Keyboard Navigation**: Full keyboard support with logical tab order and shortcuts
- **Screen Reader Support**: Proper ARIA labels, live regions, and semantic HTML
- **High Contrast Themes**: Multiple theme options for visual accessibility
- **Motion Preferences**: Respects user's reduced motion preferences
- **Focus Management**: Advanced focus trapping and restoration
- **Accessibility Testing**: Built-in tools for testing and validation

## Components

### Core Components

#### AccessibilityProvider
Context provider that manages global accessibility settings and preferences.

```tsx
import { AccessibilityProvider } from './components/accessibility';

function App() {
  return (
    <AccessibilityProvider>
      {/* Your app content */}
    </AccessibilityProvider>
  );
}
```

#### SkipLinks
Navigation shortcuts for keyboard and screen reader users.

```tsx
import { SkipLinks } from './components/accessibility';

const skipLinks = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
  { id: 'search', label: 'Skip to search' }
];

<SkipLinks links={skipLinks} />
```

#### AccessibilitySettings
Comprehensive settings panel for accessibility preferences.

```tsx
import { AccessibilitySettings } from './components/accessibility';

<AccessibilitySettings />
```

#### KeyboardShortcutsHelp
Interactive help modal showing all available keyboard shortcuts.

```tsx
import { KeyboardShortcutsHelp } from './components/accessibility';

<KeyboardShortcutsHelp 
  isOpen={showHelp} 
  onClose={() => setShowHelp(false)} 
/>
```

### Navigation Components

#### AccessibleNavigation
Fully accessible navigation component with keyboard support.

```tsx
import { AccessibleNavigation } from './components/accessibility';

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />
  },
  {
    id: 'learning',
    label: 'Learning Path',
    href: '/learning-path',
    icon: <BookIcon />
  }
];

<AccessibleNavigation 
  items={navItems}
  orientation="vertical"
  aria-label="Main navigation"
/>
```

### Data Components

#### AccessibleTable
Data table with full keyboard navigation and screen reader support.

```tsx
import { AccessibleTable } from './components/accessibility';

const columns = [
  { key: 'name', header: 'Name', accessor: 'name', sortable: true },
  { key: 'progress', header: 'Progress', accessor: 'progress' },
  { key: 'status', header: 'Status', accessor: 'status' }
];

<AccessibleTable
  data={tableData}
  columns={columns}
  caption="Learning progress table"
  sortBy="name"
  sortDirection="asc"
  onSort={handleSort}
  selectable
  selectedRows={selectedRows}
  onSelectionChange={setSelectedRows}
/>
```

### Testing Components

#### AccessibilityTester
Built-in accessibility testing and validation tool.

```tsx
import { AccessibilityTester } from './components/accessibility';

<AccessibilityTester
  targetElement={containerRef.current}
  autoRun={true}
  showDetails={true}
/>
```

## Hooks

### useAccessibility
Access global accessibility settings and controls.

```tsx
import { useAccessibility } from './components/accessibility';

function MyComponent() {
  const { 
    settings, 
    updateSetting, 
    announce, 
    isHighContrastMode 
  } = useAccessibility();

  const handleToggleHighContrast = () => {
    updateSetting('highContrast', !settings.highContrast);
  };

  return (
    <button onClick={handleToggleHighContrast}>
      Toggle High Contrast
    </button>
  );
}
```

### useAccessibilityAware
Hook for components that need to adapt to accessibility settings.

```tsx
import { useAccessibilityAware } from './components/accessibility';

function AnimatedComponent() {
  const { 
    getAnimationDuration, 
    getFocusClass, 
    isReducedMotionMode 
  } = useAccessibilityAware();

  const animationDuration = getAnimationDuration(300); // 0 if reduced motion
  const focusClass = getFocusClass(); // Appropriate focus styling

  return (
    <motion.div
      className={focusClass}
      animate={{ opacity: 1 }}
      transition={{ duration: animationDuration / 1000 }}
    >
      Content
    </motion.div>
  );
}
```

### useFocusManagement
Advanced focus management for modals and complex components.

```tsx
import { useFocusManagement } from './components/accessibility';

function Modal({ isOpen, onClose }) {
  const { containerRef } = useFocusManagement({
    trapFocus: isOpen,
    restoreFocus: true,
    autoFocus: true
  });

  return (
    <div ref={containerRef}>
      {/* Modal content */}
    </div>
  );
}
```

### useKeyboardNavigation
Keyboard navigation for lists, grids, and menus.

```tsx
import { useKeyboardNavigation } from './components/accessibility';

function GridComponent() {
  const { containerRef } = useKeyboardNavigation({
    orientation: 'both',
    wrap: true,
    itemSelector: '[role="gridcell"]',
    onEscape: handleEscape
  });

  return (
    <div ref={containerRef} role="grid">
      {/* Grid items */}
    </div>
  );
}
```

### useKeyboardShortcuts
Global and local keyboard shortcuts.

```tsx
import { useKeyboardShortcuts } from './components/accessibility';

function CodeEditor() {
  const shortcuts = {
    runCode: {
      key: 'Enter',
      ctrlKey: true,
      action: () => runCode(),
      description: 'Run Code',
      category: 'Code Editor'
    },
    formatCode: {
      key: 'f',
      ctrlKey: true,
      altKey: true,
      action: () => formatCode(),
      description: 'Format Code',
      category: 'Code Editor'
    }
  };

  useKeyboardShortcuts(shortcuts);

  return <div>/* Editor content */</div>;
}
```

### useScreenReader
Screen reader announcements and ARIA management.

```tsx
import { useScreenReader } from './components/accessibility';

function StatusComponent() {
  const { announce, generateId, linkElements } = useScreenReader();

  const handleStatusChange = (status) => {
    announce(`Status changed to ${status}`, 'polite');
  };

  return <div>/* Component content */</div>;
}
```

## Accessibility Themes

### High Contrast Themes
Multiple high contrast options for users with visual impairments.

```tsx
// Themes are automatically applied based on user settings
// Available themes:
// - theme-high-contrast: Light high contrast
// - theme-dark-high-contrast: Dark high contrast
// - theme-large-text: Increased text size
// - theme-reduced-motion: Disabled animations
// - enhanced-focus: Enhanced focus indicators
```

### CSS Classes
Pre-built accessible CSS classes for common patterns.

```css
/* Screen reader only content */
.sr-only

/* Skip links */
.skip-link

/* Accessible buttons */
.btn-accessible

/* Accessible forms */
.form-input, .form-label, .form-error, .form-help

/* Accessible navigation */
.nav-accessible

/* Accessible tables */
.table-accessible

/* Accessible cards */
.card-accessible

/* Accessible modals */
.modal-accessible, .modal-content-accessible
```

## Keyboard Shortcuts

### Global Shortcuts
Available throughout the application:

- `Alt + D`: Go to Dashboard
- `Alt + L`: Go to Learning Path  
- `Alt + E`: Go to Exercises
- `Ctrl + ,`: Open Settings
- `Ctrl + K`: Focus Search
- `Shift + ?`: Show Help
- `Alt + M`: Skip to Main Content
- `Alt + N`: Skip to Navigation

### Code Editor Shortcuts
Available in code editor contexts:

- `Ctrl + Enter`: Run Code
- `Ctrl + Shift + S`: Submit Code
- `Ctrl + Alt + F`: Format Code
- `Ctrl + H`: Toggle Hints

### Modal Shortcuts
Available in modal dialogs:

- `Escape`: Close Modal

## Testing and Validation

### Automated Testing
The accessibility tester runs automated checks for:

- Missing alt text on images
- Missing labels on form inputs
- Missing accessible names on buttons
- Color contrast issues
- Focus management problems
- ARIA attribute validation

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Skip links work correctly
- [ ] Keyboard shortcuts function as expected

#### Screen Reader Testing
- [ ] All content is announced correctly
- [ ] ARIA labels and descriptions are appropriate
- [ ] Live regions announce changes
- [ ] Form validation messages are announced
- [ ] Navigation structure is clear

#### Visual Accessibility
- [ ] High contrast themes work correctly
- [ ] Text is readable at 200% zoom
- [ ] Color is not the only way to convey information
- [ ] Focus indicators meet contrast requirements
- [ ] All text meets WCAG contrast ratios

#### Motion and Animation
- [ ] Animations respect reduced motion preferences
- [ ] No content flashes more than 3 times per second
- [ ] Auto-playing content can be paused
- [ ] Parallax and motion effects are optional

## Browser Support

### Screen Readers
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)
- Orca (Linux)

### Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Implementation Guidelines

### Component Development
1. Always include proper ARIA attributes
2. Ensure keyboard navigation works
3. Test with screen readers
4. Validate color contrast
5. Support reduced motion preferences

### Testing Process
1. Run automated accessibility tests
2. Test keyboard navigation manually
3. Test with screen reader
4. Validate with accessibility tools
5. Test high contrast themes

### Performance Considerations
- Accessibility features add minimal overhead
- Focus management is optimized for performance
- Theme switching is instant
- Keyboard shortcuts use efficient event handling

## Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 AA Checklist](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzers](https://www.tpgi.com/color-contrast-checker/)

This accessibility system ensures that the Agentic Learning Coach is usable by everyone, regardless of their abilities or the assistive technologies they use.