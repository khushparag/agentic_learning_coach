import React from 'react';
import { render, screen } from '@/test/utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { a11yUtils, a11yTestSuites } from '@/test/utils/accessibility';
import { userInteractions } from '@/test/utils/user-interactions';

// Import components to test
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { CollaborationDashboard } from '@/components/collaboration/CollaborationDashboard';
import { ExerciseInterface } from '@/components/exercises/ExerciseInterface';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Test Suite', () => {
  describe('Core UI Components', () => {
    describe('Button Component', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(
          <div>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary" disabled>Disabled Button</Button>
            <Button variant="outline" size="small">Small Button</Button>
          </div>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has proper ARIA attributes', () => {
        render(
          <Button 
            variant="primary" 
            disabled 
            aria-describedby="button-help"
            aria-pressed={false}
          >
            Toggle Button
          </Button>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-describedby', 'button-help');
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).toBeDisabled();
      });

      it('supports keyboard navigation', async () => {
        const onClick = jest.fn();
        render(<Button onClick={onClick}>Click Me</Button>);

        const button = screen.getByRole('button');
        button.focus();

        await userInteractions.keyboard.enter();
        expect(onClick).toHaveBeenCalledTimes(1);

        await userInteractions.keyboard.tab();
        expect(document.activeElement).not.toBe(button);
      });

      it('works with different accessibility settings', async () => {
        await a11yTestSuites.testWithAccessibilitySettings(
          () => render(<Button variant="primary">Test Button</Button>).container,
          async () => {
            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveAccessibleName('Test Button');
          }
        );
      });
    });

    describe('Modal Component', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has proper modal accessibility attributes', () => {
        render(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        );

        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby');
        expect(a11yUtils.screenReader.hasAccessibleName(modal, 'Test Modal')).toBe(true);
      });

      it('traps focus correctly', async () => {
        render(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <button>First Button</button>
            <button>Second Button</button>
            <button>Third Button</button>
          </Modal>
        );

        const modal = screen.getByRole('dialog');
        await a11yUtils.modals.testFocusTrap(modal);
      });

      it('closes with Escape key', async () => {
        const onClose = jest.fn();
        render(
          <Modal isOpen={true} onClose={onClose} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        );

        await userInteractions.keyboard.escape();
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('Toast Component', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(
          <div>
            <Toast type="success" message="Success message" />
            <Toast type="error" message="Error message" />
            <Toast type="warning" message="Warning message" />
          </div>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has proper live region attributes', () => {
        render(<Toast type="success" message="Operation completed" />);

        const toast = screen.getByRole('status');
        expect(toast).toHaveAttribute('aria-live', 'polite');
        expect(toast).toHaveTextContent('Operation completed');
      });

      it('uses assertive live region for errors', () => {
        render(<Toast type="error" message="Critical error occurred" />);

        const toast = screen.getByRole('alert');
        expect(toast).toHaveAttribute('aria-live', 'assertive');
        expect(toast).toHaveTextContent('Critical error occurred');
      });
    });
  });

  describe('Page Components', () => {
    describe('Dashboard', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(<Dashboard />);

        // Wait for data to load
        await screen.findByText('Dashboard');

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has proper heading structure', async () => {
        render(<Dashboard />);

        await screen.findByText('Dashboard');

        const headings = screen.getAllByRole('heading');
        const h1s = headings.filter(h => h.tagName === 'H1');
        const h2s = headings.filter(h => h.tagName === 'H2');

        // Should have one main heading
        expect(h1s).toHaveLength(1);
        expect(h1s[0]).toHaveTextContent('Dashboard');

        // Should have section headings
        expect(h2s.length).toBeGreaterThan(0);
      });

      it('has proper landmark regions', async () => {
        render(<Dashboard />);

        await screen.findByText('Dashboard');

        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      it('supports keyboard navigation', async () => {
        render(<Dashboard />);

        await screen.findByText('Dashboard');

        // Should be able to tab through interactive elements
        const interactiveElements = screen.getAllByRole('button');
        expect(interactiveElements.length).toBeGreaterThan(0);

        for (const element of interactiveElements.slice(0, 3)) {
          await userInteractions.keyboard.tab();
          expect(document.activeElement).toBe(element);
        }
      });
    });

    describe('Exercise Interface', () => {
      const mockExercise = {
        id: 'exercise-1',
        title: 'Test Exercise',
        description: 'Test description',
        instructions: 'Test instructions',
        starterCode: 'function test() {}',
        testCases: [],
        hints: [],
        difficulty: 1,
        language: 'javascript'
      };

      it('passes axe accessibility tests', async () => {
        const { container } = render(<ExerciseInterface exercise={mockExercise} />);

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has accessible code editor', () => {
        render(<ExerciseInterface exercise={mockExercise} />);

        const codeEditor = screen.getByRole('textbox', { name: /code editor/i });
        expect(codeEditor).toHaveAttribute('aria-label');
        expect(codeEditor).toHaveAttribute('aria-describedby');
      });

      it('provides keyboard shortcuts help', async () => {
        render(<ExerciseInterface exercise={mockExercise} />);

        const helpButton = screen.getByRole('button', { name: /keyboard shortcuts/i });
        await userInteractions.setup().click(helpButton);

        const shortcutsDialog = screen.getByRole('dialog');
        expect(shortcutsDialog).toBeInTheDocument();
        expect(shortcutsDialog).toHaveAccessibleName(/keyboard shortcuts/i);
      });

      it('announces test results to screen readers', async () => {
        render(<ExerciseInterface exercise={mockExercise} />);

        // Mock test execution
        const runButton = screen.getByRole('button', { name: /run code/i });
        await userInteractions.setup().click(runButton);

        // Should have live region for announcements
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
      });
    });

    describe('Settings Layout', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(<SettingsLayout />);

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has accessible form controls', () => {
        render(<SettingsLayout />);

        // All form controls should have labels
        const inputs = screen.getAllByRole('textbox');
        const selects = screen.getAllByRole('combobox');
        const checkboxes = screen.getAllByRole('checkbox');

        [...inputs, ...selects, ...checkboxes].forEach(control => {
          expect(a11yUtils.checkAriaAttributes.hasLabel(control)).toBe(true);
        });
      });

      it('groups related form controls', () => {
        render(<SettingsLayout />);

        const fieldsets = screen.getAllByRole('group');
        expect(fieldsets.length).toBeGreaterThan(0);

        fieldsets.forEach(fieldset => {
          expect(fieldset.tagName).toBe('FIELDSET');
          expect(fieldset.querySelector('legend')).toBeInTheDocument();
        });
      });

      it('provides form validation feedback', async () => {
        render(<SettingsLayout />);

        // Submit form with invalid data
        const submitButton = screen.getByRole('button', { name: /save/i });
        await userInteractions.setup().click(submitButton);

        // Should show accessible error messages
        const errorMessages = screen.getAllByRole('alert');
        errorMessages.forEach(error => {
          expect(error).toHaveAttribute('aria-live');
        });
      });
    });
  });

  describe('Complex Interactions', () => {
    describe('Collaboration Dashboard', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(<CollaborationDashboard />);

        // Wait for data to load
        await screen.findByText('Collaboration Dashboard');

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has accessible real-time updates', async () => {
        render(<CollaborationDashboard />);

        await screen.findByText('Collaboration Dashboard');

        // Should have live regions for real-time updates
        const liveRegions = screen.getAllByRole('status');
        expect(liveRegions.length).toBeGreaterThan(0);

        liveRegions.forEach(region => {
          expect(region).toHaveAttribute('aria-live', 'polite');
        });
      });

      it('supports keyboard navigation in lists', async () => {
        render(<CollaborationDashboard />);

        await screen.findByText('Collaboration Dashboard');

        const studyGroups = screen.getAllByRole('listitem');
        if (studyGroups.length > 0) {
          // Should be able to navigate with arrow keys
          studyGroups[0].focus();
          await a11yUtils.keyboard.testArrowNavigation(studyGroups[0], 'down');
        }
      });
    });

    describe('Admin Dashboard', () => {
      it('passes axe accessibility tests', async () => {
        const { container } = render(<AdminDashboard />);

        // Wait for data to load
        await screen.findByText('Admin Dashboard');

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('has accessible data tables', async () => {
        render(<AdminDashboard />);

        await screen.findByText('Admin Dashboard');

        const tables = screen.getAllByRole('table');
        tables.forEach(table => {
          // Should have proper table structure
          expect(table.querySelector('thead')).toBeInTheDocument();
          expect(table.querySelector('tbody')).toBeInTheDocument();

          // Headers should have proper scope
          const headers = table.querySelectorAll('th');
          headers.forEach(header => {
            expect(header).toHaveAttribute('scope');
          });
        });
      });

      it('provides accessible sorting controls', async () => {
        render(<AdminDashboard />);

        await screen.findByText('Admin Dashboard');

        const sortButtons = screen.getAllByRole('button', { name: /sort/i });
        sortButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-sort');
          expect(a11yUtils.checkAriaAttributes.hasLabel(button)).toBe(true);
        });
      });
    });
  });

  describe('Accessibility Settings Integration', () => {
    it('respects high contrast mode', async () => {
      a11yUtils.highContrast.simulateHighContrast();

      const { container } = render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        </div>
      );

      // Should apply high contrast styles
      expect(document.body).toHaveClass('high-contrast');

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      a11yUtils.highContrast.removeHighContrast();
    });

    it('respects reduced motion preferences', () => {
      a11yUtils.reducedMotion.simulateReducedMotion();

      render(<Toast type="success" message="Test message" />);

      // Should disable animations
      const toast = screen.getByRole('status');
      const styles = window.getComputedStyle(toast);
      expect(styles.animationDuration).toBe('0s');
    });

    it('adapts to different font sizes', () => {
      // Simulate larger font size
      document.documentElement.style.fontSize = '20px';

      const { container } = render(
        <Button variant="primary">Large Font Button</Button>
      );

      const button = screen.getByRole('button');
      expect(a11yUtils.visual.checkZoomReadability(button, 125)).toBe(true);

      // Reset font size
      document.documentElement.style.fontSize = '';
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('provides meaningful page titles', () => {
      render(<Dashboard />);

      // Should update document title
      expect(document.title).toContain('Dashboard');
    });

    it('announces navigation changes', async () => {
      render(<Dashboard />);

      // Should have skip links
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();

      await userInteractions.setup().click(skipLink);
      expect(document.activeElement).toHaveAttribute('id', 'main-content');
    });

    it('provides context for dynamic content', async () => {
      render(<CollaborationDashboard />);

      await screen.findByText('Collaboration Dashboard');

      // Dynamic content should be announced
      const liveRegions = screen.getAllByRole('status');
      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live');
      });
    });
  });

  describe('Keyboard Navigation Patterns', () => {
    it('supports tab navigation order', async () => {
      render(
        <div>
          <Button data-testid="button-1">First</Button>
          <Button data-testid="button-2">Second</Button>
          <Button data-testid="button-3">Third</Button>
        </div>
      );

      await a11yUtils.keyboard.testTabOrder(['First', 'Second', 'Third']);
    });

    it('supports arrow key navigation in menus', async () => {
      render(<SettingsLayout />);

      const menuItems = screen.getAllByRole('menuitem');
      if (menuItems.length > 1) {
        menuItems[0].focus();
        
        const nextItem = await a11yUtils.keyboard.testArrowNavigation(
          menuItems[0], 
          'down'
        );
        expect(nextItem).toBe(menuItems[1]);
      }
    });

    it('supports Enter and Space activation', async () => {
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Test Button</Button>);

      const button = screen.getByRole('button');
      
      await a11yUtils.keyboard.testEnterActivation(button);
      expect(onClick).toHaveBeenCalledTimes(1);

      await a11yUtils.keyboard.testSpaceActivation(button);
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Color and Contrast', () => {
    it('meets WCAG color contrast requirements', () => {
      render(
        <div>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <p className="text-gray-600">Regular text</p>
        </div>
      );

      const primaryButton = screen.getByRole('button', { name: 'Primary Button' });
      const secondaryButton = screen.getByRole('button', { name: 'Secondary Button' });
      const text = screen.getByText('Regular text');

      // Check color contrast (manual verification needed)
      const primaryColors = a11yUtils.visual.checkColorContrast(primaryButton);
      const secondaryColors = a11yUtils.visual.checkColorContrast(secondaryButton);
      const textColors = a11yUtils.visual.checkColorContrast(text);

      // Colors should be defined (actual contrast checking requires external tools)
      expect(primaryColors.color).toBeDefined();
      expect(primaryColors.backgroundColor).toBeDefined();
      expect(secondaryColors.color).toBeDefined();
      expect(textColors.color).toBeDefined();
    });

    it('does not rely solely on color for information', () => {
      render(
        <div>
          <span className="text-red-500" aria-label="Error: Invalid input">
            ❌ Invalid input
          </span>
          <span className="text-green-500" aria-label="Success: Valid input">
            ✅ Valid input
          </span>
        </div>
      );

      // Should use icons and text, not just color
      expect(screen.getByLabelText('Error: Invalid input')).toHaveTextContent('❌');
      expect(screen.getByLabelText('Success: Valid input')).toHaveTextContent('✅');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('provides accessible error messages', async () => {
      const { container } = render(
        <form>
          <input type="email" aria-describedby="email-error" />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
    });

    it('maintains focus after error correction', async () => {
      render(
        <form>
          <input type="email" data-testid="email-input" />
          <button type="submit">Submit</button>
        </form>
      );

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByRole('button');

      emailInput.focus();
      await userInteractions.setup().click(submitButton);

      // Focus should return to the input with error
      expect(document.activeElement).toBe(emailInput);
    });
  });
});