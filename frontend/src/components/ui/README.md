# UI Component Library

This directory contains the base UI components for the Agentic Learning Coach frontend application. The components are built using React, TypeScript, Tailwind CSS, Headless UI, and Framer Motion.

## Design System

### Colors
The design system includes a comprehensive color palette:

- **Primary**: Blue shades for main actions and branding
- **Secondary**: Indigo shades for secondary elements
- **Success**: Green shades for positive feedback
- **Warning**: Amber shades for warnings
- **Error**: Red shades for errors and destructive actions
- **Gray**: Neutral grays for text and backgrounds
- **Learning-specific**: Colors for different skill levels
- **Gamification**: Colors for XP, streaks, and achievements

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl
- **Font Weights**: 300, 400, 500, 600, 700, 800

### Spacing & Layout
- **Spacing Scale**: Standard Tailwind spacing with additional 18, 88, 128 values
- **Border Radius**: sm, md, lg, xl, 2xl, 3xl
- **Shadows**: soft, medium, strong custom shadows

### Animations
- **Keyframes**: fadeIn, slideUp, slideDown, scaleIn, bounceSubtle
- **Transitions**: Smooth hover and focus states
- **Motion**: Framer Motion integration for interactive elements

## Components

### Base Components

#### Button
A versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from './components/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `icon`: React.ReactNode
- `iconPosition`: 'left' | 'right'
- `fullWidth`: boolean

#### Input
A form input component with labels, validation, and icons.

```tsx
import { Input } from './components/ui';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error="This field is required"
  leftIcon={<EnvelopeIcon />}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode
- `fullWidth`: boolean

#### Textarea
A multi-line text input component.

```tsx
import { Textarea } from './components/ui';

<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
  resize="vertical"
/>
```

#### Select
A dropdown select component using Headless UI.

```tsx
import { Select } from './components/ui';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

<Select
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Choose an option"
/>
```

#### Modal
A modal dialog component with animations and accessibility features.

```tsx
import { Modal } from './components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Modal description"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  Modal content goes here
</Modal>
```

#### Card
A flexible card component with headers, footers, and variants.

```tsx
import { Card } from './components/ui';

<Card
  variant="hover"
  header={<h3>Card Title</h3>}
  footer={<Button>Action</Button>}
>
  Card content
</Card>
```

#### Badge
A small status indicator component.

```tsx
import { Badge } from './components/ui';

<Badge variant="success" size="md" dot>
  Online
</Badge>
```

### Feedback Components

#### LoadingSpinner
A loading indicator with different sizes.

```tsx
import { LoadingSpinner } from './components/ui';

<LoadingSpinner size="md" />
```

#### ErrorMessage
An error message component with optional details.

```tsx
import { ErrorMessage } from './components/ui';

<ErrorMessage
  message="Something went wrong"
  details={["Error detail 1", "Error detail 2"]}
  onDismiss={() => {}}
/>
```

#### SuccessMessage
A success message component.

```tsx
import { SuccessMessage } from './components/ui';

<SuccessMessage
  message="Operation successful"
  details={["All files processed"]}
/>
```

### Toast System

#### Toast Provider
Wrap your app with the ToastProvider to enable toast notifications.

```tsx
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

#### useToast Hook
Use the toast hook to show notifications.

```tsx
import { useToast } from './components/ui';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Success!', 'Operation completed successfully.');
  };

  const handleError = () => {
    toast.error('Error!', 'Something went wrong.');
  };

  return (
    <div>
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
    </div>
  );
}
```

## CSS Classes

### Utility Classes
The design system includes custom utility classes:

```css
/* Button variants */
.btn-primary, .btn-secondary, .btn-success, .btn-warning, .btn-error, .btn-ghost

/* Input styles */
.input, .input-error

/* Card styles */
.card, .card-hover

/* Badge variants */
.badge-primary, .badge-success, .badge-warning, .badge-error, .badge-gray

/* Scrollbar styling */
.scrollbar-thin

/* Focus improvements */
.focus-visible
```

### Animation Classes
```css
.animate-in, .animate-out
.animate-fade-in, .animate-slide-up, .animate-slide-down, .animate-scale-in, .animate-bounce-subtle
```

## Accessibility

All components follow WCAG 2.1 guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: All color combinations meet AA standards
- **Motion Preferences**: Respects user's motion preferences

## Usage Examples

### Form Example
```tsx
import { Input, Select, Textarea, Button, Card } from './components/ui';

function ContactForm() {
  return (
    <Card header={<h2>Contact Us</h2>}>
      <form className="space-y-4">
        <Input
          label="Name"
          placeholder="Your name"
          required
        />
        
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          required
        />
        
        <Select
          label="Subject"
          options={subjectOptions}
          placeholder="Choose a subject"
        />
        
        <Textarea
          label="Message"
          placeholder="Your message..."
          rows={4}
          required
        />
        
        <Button type="submit" fullWidth>
          Send Message
        </Button>
      </form>
    </Card>
  );
}
```

### Dashboard Card Example
```tsx
import { Card, Badge, Button } from './components/ui';

function StatsCard({ title, value, change, trend }) {
  return (
    <Card variant="hover">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Badge variant={trend === 'up' ? 'success' : 'error'}>
          {change}
        </Badge>
      </div>
    </Card>
  );
}
```

## Development

### Adding New Components
1. Create the component file in the appropriate subdirectory
2. Follow the existing patterns for props and styling
3. Add TypeScript interfaces for all props
4. Include accessibility features
5. Add the component to the index.ts file
6. Update this README with usage examples

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Follow the established design system colors and spacing
- Use the custom CSS classes for common patterns
- Ensure responsive design with mobile-first approach
- Test with different screen sizes and accessibility tools

### Testing
- Write unit tests for all components
- Test keyboard navigation and screen reader compatibility
- Verify responsive behavior across devices
- Test with different color schemes and motion preferences

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Components are optimized for tree-shaking
- Lazy loading for heavy components
- Minimal bundle impact with efficient imports
- Optimized animations for 60fps performance