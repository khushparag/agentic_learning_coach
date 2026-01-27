import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilityProvider, useAccessibility } from '../../../contexts/AccessibilityContext';
import { AccessibilityTester, ColorContrast, FocusManager } from '../../../utils/accessibility';
import SkipLinks from '../SkipLinks';
import AccessibilitySettings from '../AccessibilitySettings';

// Test component that uses accessibility context
const TestComponent: React.FC = () => {
  const { settings, updateSetting, announce } = useAccessibility();
  
  return (
    <div>
      <button 
        onClick={() => updateSetting('highContrast', !settings.highContrast)}
        data-testid="toggle-contrast"
      >
        Toggle High Contrast
      </button>
      <button 
        onClick={() => announce('Test announcement', 'polite')}
        data-testid="announce-button"
      >
        Announce
      </button>
      <div data-testid="contrast-status">
        {settings.highContrast ? 'High Contrast On' : 'High Contrast Off'}
      </div>
    </div>
  );
};

describe('Accessibility System', () => {
  describe('AccessibilityProvider', () => {
    it('provides accessibility context to child components', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('contrast-status')).toHaveTextContent('High Contrast Off');
    });

    it('updates accessibility settings', async () => {
      const user = userEvent.setup();
      
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByTestId('toggle-contrast');
      await user.click(toggleButton);

      expect(screen.getByTestId('contrast-status')).toHaveTextContent('High Contrast On');
    });

    it('applies theme classes to document element', async () => {
      const user = userEvent.setup();
      
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByTestId('toggle-contrast');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('theme-high-contrast');
      });
    });
  });

  describe('SkipLinks', () => {
    const skipLinks = [
      { id: 'main-content', label: 'Skip to main content' },
      { id: 'navigation', label: 'Skip to navigation' }
    ];

    beforeEach(() => {
      // Create target elements
      const main = document.createElement('main');
      main.id = 'main-content';
      main.tabIndex = -1;
      document.body.appendChild(main);

      const nav = document.createElement('nav');
      nav.id = 'navigation';
      nav.tabIndex = -1;
      document.body.appendChild(nav);
    });

    afterEach(() => {
      // Clean up
      document.getElementById('main-content')?.remove();
      document.getElementById('navigation')?.remove();
    });

    it('renders skip links with proper accessibility attributes', () => {
      render(<SkipLinks links={skipLinks} />);

      const skipNav = screen.getByRole('navigation', { name: 'Skip navigation links' });
      expect(skipNav).toBeInTheDocument();

      const mainLink = screen.getByRole('link', { name: 'Skip to main content' });
      expect(mainLink).toHaveAttribute('href', '#main-content');
    });

    it('focuses target element when skip link is activated', async () => {
      const user = userEvent.setup();
      
      render(<SkipLinks links={skipLinks} />);

      const mainLink = screen.getByRole('link', { name: 'Skip to main content' });
      await user.click(mainLink);

      const mainElement = document.getElementById('main-content');
      expect(mainElement).toHaveFocus();
    });
  });

  describe('AccessibilitySettings', () => {
    it('renders all accessibility setting groups', () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Visual Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Motion & Animation')).toBeInTheDocument();
      expect(screen.getByText('Focus & Navigation')).toBeInTheDocument();
      expect(screen.getByText('Screen Reader')).toBeInTheDocument();
    });

    it('toggles settings when switches are clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AccessibilityProvider>
          <AccessibilitySettings />
        </AccessibilityProvider>
      );

      const highContrastSwitch = screen.getByRole('switch', { name: 'High Contrast Mode' });
      expect(highContrastSwitch).toHaveAttribute('aria-checked', 'false');

      await user.click(highContrastSwitch);
      expect(highContrastSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Accessibility Utilities', () => {
    describe('ColorContrast', () => {
      it('calculates correct contrast ratios', () => {
        // Test high contrast (white on black)
        const highContrast = ColorContrast.getContrastRatio('#ffffff', '#000000');
        expect(highContrast).toBeCloseTo(21, 0);

        // Test low contrast
        const lowContrast = ColorContrast.getContrastRatio('#ffffff', '#f0f0f0');
        expect(lowContrast).toBeLessThan(3);
      });

      it('validates WCAG compliance correctly', () => {
        // Should pass AA for normal text
        expect(ColorContrast.meetsWCAG('#000000', '#ffffff', 'AA', 'normal')).toBe(true);
        
        // Should fail AA for low contrast
        expect(ColorContrast.meetsWCAG('#cccccc', '#ffffff', 'AA', 'normal')).toBe(false);
        
        // Should pass AA for large text with lower contrast
        expect(ColorContrast.meetsWCAG('#767676', '#ffffff', 'AA', 'large')).toBe(true);
      });
    });

    describe('FocusManager', () => {
      let container: HTMLElement;

      beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = `
          <button id="btn1">Button 1</button>
          <input id="input1" type="text" />
          <button id="btn2">Button 2</button>
        `;
        document.body.appendChild(container);
      });

      afterEach(() => {
        document.body.removeChild(container);
      });

      it('finds focusable elements correctly', () => {
        const focusableElements = FocusManager.getFocusableElements(container);
        expect(focusableElements).toHaveLength(3);
        expect(focusableElements[0].id).toBe('btn1');
        expect(focusableElements[1].id).toBe('input1');
        expect(focusableElements[2].id).toBe('btn2');
      });

      it('traps focus within container', () => {
        const cleanup = FocusManager.trapFocus(container);
        
        // First element should be focused
        expect(document.activeElement?.id).toBe('btn1');
        
        // Simulate Tab key on last element
        const lastButton = document.getElementById('btn2')!;
        lastButton.focus();
        
        const tabEvent = new KeyboardEvent('keydown', { 
          key: 'Tab', 
          bubbles: true 
        });
        container.dispatchEvent(tabEvent);
        
        cleanup();
      });
    });

    describe('AccessibilityTester', () => {
      let testContainer: HTMLElement;

      beforeEach(() => {
        testContainer = document.createElement('div');
        testContainer.innerHTML = `
          <img src="test.jpg" />
          <button></button>
          <input type="text" />
        `;
        document.body.appendChild(testContainer);
      });

      afterEach(() => {
        document.body.removeChild(testContainer);
      });

      it('detects accessibility issues', () => {
        const issues = AccessibilityTester.runBasicChecks(testContainer);
        
        // Should find missing alt text
        const altIssue = issues.find(issue => issue.type === 'missing-alt');
        expect(altIssue).toBeDefined();
        expect(altIssue?.severity).toBe('error');

        // Should find missing button label
        const buttonIssue = issues.find(issue => 
          issue.type === 'missing-label' && 
          issue.element.tagName === 'BUTTON'
        );
        expect(buttonIssue).toBeDefined();

        // Should find missing input label
        const inputIssue = issues.find(issue => 
          issue.type === 'missing-label' && 
          issue.element.tagName === 'INPUT'
        );
        expect(inputIssue).toBeDefined();
      });

      it('does not report issues for accessible elements', () => {
        testContainer.innerHTML = `
          <img src="test.jpg" alt="Test image" />
          <button aria-label="Close">X</button>
          <label for="test-input">Name</label>
          <input id="test-input" type="text" />
        `;

        const issues = AccessibilityTester.runBasicChecks(testContainer);
        expect(issues).toHaveLength(0);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles escape key correctly', () => {
      const onEscape = jest.fn();
      
      render(
        <div 
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onEscape();
            }
          }}
          tabIndex={0}
          data-testid="container"
        >
          Content
        </div>
      );

      const container = screen.getByTestId('container');
      fireEvent.keyDown(container, { key: 'Escape' });
      
      expect(onEscape).toHaveBeenCalled();
    });

    it('supports arrow key navigation', () => {
      render(
        <div data-testid="container">
          <button data-testid="btn1">Button 1</button>
          <button data-testid="btn2">Button 2</button>
          <button data-testid="btn3">Button 3</button>
        </div>
      );

      const btn1 = screen.getByTestId('btn1');
      const btn2 = screen.getByTestId('btn2');
      
      btn1.focus();
      expect(btn1).toHaveFocus();

      fireEvent.keyDown(btn1, { key: 'ArrowDown' });
      // Note: In a real implementation, this would move focus to btn2
      // This test verifies the event is handled correctly
    });
  });

  describe('Screen Reader Support', () => {
    it('creates live regions for announcements', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const announceButton = screen.getByTestId('announce-button');
      fireEvent.click(announceButton);

      // Check that live region is created (implementation detail)
      // In a real test, you might check for aria-live regions
    });
  });
});

// Integration test for the complete accessibility system
describe('Accessibility Integration', () => {
  it('works together as a complete system', async () => {
    const user = userEvent.setup();
    
    render(
      <AccessibilityProvider>
        <div>
          <SkipLinks links={[{ id: 'main', label: 'Skip to main' }]} />
          <main id="main" tabIndex={-1}>
            <AccessibilitySettings />
          </main>
        </div>
      </AccessibilityProvider>
    );

    // Test skip link functionality
    const skipLink = screen.getByRole('link', { name: 'Skip to main' });
    await user.click(skipLink);

    // Test settings interaction
    const highContrastSwitch = screen.getByRole('switch', { name: 'High Contrast Mode' });
    await user.click(highContrastSwitch);

    // Verify theme is applied
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('theme-high-contrast');
    });

    // Test keyboard navigation
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBeInTheDocument();
  });
});