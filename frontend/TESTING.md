# Testing Guide

This document provides comprehensive guidance on testing in the Agentic Learning Coach frontend application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Testing Utilities](#testing-utilities)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing strategy follows the testing pyramid with emphasis on:

1. **Unit Tests (80%)** - Fast, isolated tests for individual components and functions
2. **Integration Tests (15%)** - Tests for component interactions and API integration
3. **E2E Tests (5%)** - Full user journey tests

### Quality Gates

- **Unit Test Coverage**: 90%+ for critical components, 80%+ overall
- **Integration Test Coverage**: Key user flows and API interactions
- **E2E Test Coverage**: Critical user journeys and business flows
- **Accessibility**: All components must pass axe-core tests
- **Performance**: Lighthouse scores > 80 for all categories

## Test Types

### 1. Unit Tests (Jest + React Testing Library)

**Location**: `src/**/__tests__/` or `src/**/*.test.tsx`

**Purpose**: Test individual components, hooks, and utility functions in isolation.

```typescript
// Example: Component test
import { render, screen } from '@/test/utils';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### 2. Integration Tests (Jest + MSW)

**Location**: `src/**/*.integration.test.tsx`

**Purpose**: Test component interactions with APIs and complex user flows.

```typescript
// Example: API integration test
import { render, screen, waitFor } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { Dashboard } from '../Dashboard';

describe('Dashboard Integration', () => {
  it('loads and displays user data', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });
  });
});
```

### 3. Component Tests (Storybook)

**Location**: `src/**/*.stories.tsx`

**Purpose**: Document and test component variations in isolation.

```typescript
// Example: Storybook story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};
```

### 4. E2E Tests (Cypress)

**Location**: `cypress/e2e/**/*.cy.ts`

**Purpose**: Test complete user journeys and critical business flows.

```typescript
// Example: E2E test
describe('Learning Flow', () => {
  it('completes exercise successfully', () => {
    cy.login();
    cy.navigateTo('exercises');
    cy.getByTestId('exercise-1').click();
    cy.fillMonacoEditor('const greeting = "Hello!";');
    cy.submitCode();
    cy.checkToast('Correct! Well done.', 'success');
  });
});
```

### 5. Visual Regression Tests (Percy)

**Location**: Integrated with Storybook and Cypress

**Purpose**: Catch visual regressions and ensure consistent UI.

```typescript
// In Cypress test
cy.percySnapshot('Dashboard - After Login');

// In Storybook story
export const AllVariants: Story = {
  // Story configuration
  parameters: {
    percy: { skip: false }
  }
};
```

## Running Tests

### Local Development

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (interactive)
npm run test:e2e:open

# Run E2E tests (headless)
npm run test:e2e

# Run Storybook
npm run storybook

# Run Storybook tests
npm run storybook:test

# Run visual regression tests
npm run test:visual

# Run all tests
npm run test:all
```

### CI/CD

Tests run automatically on:
- Pull requests
- Pushes to main/develop branches
- Scheduled runs (nightly)

## Writing Tests

### Test Structure

Follow the AAA pattern:
- **Arrange**: Set up test data and environment
- **Act**: Execute the code under test
- **Assert**: Verify the results

```typescript
describe('Component', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // Arrange
      const props = { value: 'test' };
      
      // Act
      render(<Component {...props} />);
      
      // Assert
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
```

### Test Naming

- **Describe blocks**: Use component/function name and context
- **Test cases**: Use "should" statements describing expected behavior

```typescript
describe('Button Component', () => {
  describe('when disabled', () => {
    it('should not call onClick handler', () => {
      // Test implementation
    });
  });
});
```

### Component Testing

```typescript
import { render, screen, userEvent } from '@/test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(<MyComponent onSubmit={onSubmit} />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onSubmit).toHaveBeenCalledWith(expectedData);
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### API Testing with MSW

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('API Integration', () => {
  it('handles API error', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );
    
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });
  });
});
```

## Testing Utilities

### Custom Render Function

```typescript
import { render } from '@/test/utils';

// Renders with all providers (Auth, Query, Router, etc.)
render(<Component />);

// Render with specific user
renderWithBeginnerUser(<Component />);

// Render without authentication
renderUnauthenticated(<Component />);
```

### User Interactions

```typescript
import { userInteractions } from '@/test/utils';

// Fill form
await userInteractions.fillForm({
  email: 'test@example.com',
  password: 'password'
});

// Submit form
await userInteractions.submitForm();

// Keyboard navigation
await userInteractions.keyboard.tab();
await userInteractions.keyboard.enter();
```

### Accessibility Testing

```typescript
import { a11yUtils } from '@/test/utils';

// Run axe tests
await a11yUtils.runAxeTest(container);

// Test keyboard navigation
await a11yUtils.keyboard.testTabOrder(['button1', 'button2']);

// Check ARIA attributes
expect(a11yUtils.checkAriaAttributes.hasLabel(element)).toBe(true);
```

### Async Testing

```typescript
import { asyncUtils } from '@/test/utils';

// Wait for loading to finish
await asyncUtils.waitForLoadingToFinish();

// Wait for specific element
const element = await asyncUtils.waitForElement(
  () => screen.queryByText('Success')
);

// Retry operation
const result = await asyncUtils.retry(
  () => fetchData(),
  3, // max attempts
  1000 // delay between attempts
);
```

## Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad: Testing implementation details
   expect(component.state.isLoading).toBe(true);
   
   // ✅ Good: Testing user-visible behavior
   expect(screen.getByText('Loading...')).toBeInTheDocument();
   ```

2. **Use Semantic Queries**
   ```typescript
   // ❌ Bad: Fragile selectors
   screen.getByTestId('submit-btn');
   
   // ✅ Good: Semantic queries
   screen.getByRole('button', { name: /submit/i });
   ```

3. **Test Accessibility**
   ```typescript
   // Always include accessibility tests
   it('is accessible', async () => {
     const { container } = render(<Component />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

4. **Mock External Dependencies**
   ```typescript
   // Mock API calls, timers, external libraries
   jest.mock('@/services/api');
   jest.useFakeTimers();
   ```

### Component Testing

1. **Test All Props and States**
2. **Test User Interactions**
3. **Test Error Boundaries**
4. **Test Loading States**
5. **Test Accessibility**

### E2E Testing

1. **Focus on Critical User Journeys**
2. **Use Page Object Model**
3. **Keep Tests Independent**
4. **Use Stable Selectors**
5. **Test Across Browsers/Devices**

### Performance Testing

1. **Test Bundle Size**
2. **Test Render Performance**
3. **Test Memory Leaks**
4. **Test Lighthouse Scores**

## CI/CD Integration

### GitHub Actions

Our CI pipeline runs:
1. **Unit Tests** - On every PR and push
2. **E2E Tests** - On every PR and push
3. **Visual Tests** - On PRs only
4. **Performance Tests** - On main branch
5. **Accessibility Tests** - On every PR

### Quality Gates

Tests must pass before merging:
- ✅ All unit tests pass
- ✅ Coverage thresholds met
- ✅ E2E tests pass
- ✅ No accessibility violations
- ✅ Performance budgets met

### Reporting

- **Coverage Reports**: Uploaded to Codecov
- **Test Results**: Available in GitHub Actions
- **Visual Diffs**: Available in Percy
- **Performance**: Available in Lighthouse CI

## Troubleshooting

### Common Issues

1. **Tests Timing Out**
   ```typescript
   // Increase timeout for slow operations
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   }, { timeout: 10000 });
   ```

2. **Act Warnings**
   ```typescript
   // Wrap state updates in act()
   await act(async () => {
     fireEvent.click(button);
   });
   ```

3. **Memory Leaks**
   ```typescript
   // Clean up subscriptions and timers
   afterEach(() => {
     jest.clearAllTimers();
     cleanup();
   });
   ```

4. **Flaky Tests**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

### Debugging

1. **Use screen.debug()**
   ```typescript
   render(<Component />);
   screen.debug(); // Prints current DOM
   ```

2. **Use logRoles()**
   ```typescript
   import { logRoles } from '@testing-library/dom';
   logRoles(container); // Shows available roles
   ```

3. **Use Cypress Debug**
   ```typescript
   cy.debug(); // Pauses test execution
   cy.pause(); // Interactive debugging
   ```

### Getting Help

- Check the [Testing Library docs](https://testing-library.com/)
- Check the [Cypress docs](https://docs.cypress.io/)
- Check the [Jest docs](https://jestjs.io/)
- Ask in the team Slack channel
- Create an issue in the repository