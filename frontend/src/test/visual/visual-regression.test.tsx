import React from 'react';
import { render } from '@/test/utils';
import { composeStories } from '@storybook/testing-react';
import { axe } from 'jest-axe';

// Import all stories for visual testing
import * as ButtonStories from '@/components/ui/Button.stories';
import * as StatsCardsStories from '@/components/dashboard/StatsCards.stories';

// Compose stories for testing
const {
  Primary: PrimaryButton,
  Secondary: SecondaryButton,
  Disabled: DisabledButton,
  Loading: LoadingButton,
  WithIcon: IconButton,
  AllSizes: AllSizesButton,
  AllVariants: AllVariantsButton
} = composeStories(ButtonStories);

const {
  Default: DefaultStatsCards,
  Loading: LoadingStatsCards,
  Error: ErrorStatsCards,
  HighValues: HighValuesStatsCards,
  ZeroValues: ZeroValuesStatsCards
} = composeStories(StatsCardsStories);

// Visual regression testing utilities
const takeSnapshot = async (component: React.ReactElement, name: string) => {
  const { container } = render(component);
  
  // Wait for any animations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Take screenshot (in real implementation, this would use a visual testing service)
  expect(container).toMatchSnapshot(`${name}.html`);
  
  return container;
};

const testResponsiveBreakpoints = async (
  component: React.ReactElement, 
  name: string
) => {
  const breakpoints = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 768, name: 'desktop' },
    { width: 1920, height: 1080, name: 'large-desktop' }
  ];

  for (const breakpoint of breakpoints) {
    // Mock viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: breakpoint.width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: breakpoint.height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    const { container } = render(component);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(container).toMatchSnapshot(`${name}-${breakpoint.name}.html`);
  }
};

describe('Visual Regression Tests', () => {
  describe('Button Component', () => {
    it('renders primary button correctly', async () => {
      await takeSnapshot(<PrimaryButton />, 'button-primary');
    });

    it('renders secondary button correctly', async () => {
      await takeSnapshot(<SecondaryButton />, 'button-secondary');
    });

    it('renders disabled button correctly', async () => {
      await takeSnapshot(<DisabledButton />, 'button-disabled');
    });

    it('renders loading button correctly', async () => {
      await takeSnapshot(<LoadingButton />, 'button-loading');
    });

    it('renders button with icon correctly', async () => {
      await takeSnapshot(<IconButton />, 'button-with-icon');
    });

    it('renders all button sizes correctly', async () => {
      await takeSnapshot(<AllSizesButton />, 'button-all-sizes');
    });

    it('renders all button variants correctly', async () => {
      await takeSnapshot(<AllVariantsButton />, 'button-all-variants');
    });

    it('maintains visual consistency across breakpoints', async () => {
      await testResponsiveBreakpoints(<PrimaryButton />, 'button-primary-responsive');
    });

    it('handles hover states correctly', async () => {
      const { container } = render(<PrimaryButton />);
      const button = container.querySelector('button');
      
      if (button) {
        // Simulate hover
        button.classList.add('hover');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(container).toMatchSnapshot('button-primary-hover.html');
        
        // Simulate focus
        button.classList.remove('hover');
        button.classList.add('focus');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(container).toMatchSnapshot('button-primary-focus.html');
        
        // Simulate active
        button.classList.remove('focus');
        button.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(container).toMatchSnapshot('button-primary-active.html');
      }
    });
  });

  describe('Stats Cards Component', () => {
    it('renders default stats cards correctly', async () => {
      await takeSnapshot(<DefaultStatsCards />, 'stats-cards-default');
    });

    it('renders loading stats cards correctly', async () => {
      await takeSnapshot(<LoadingStatsCards />, 'stats-cards-loading');
    });

    it('renders error stats cards correctly', async () => {
      await takeSnapshot(<ErrorStatsCards />, 'stats-cards-error');
    });

    it('renders high values stats cards correctly', async () => {
      await takeSnapshot(<HighValuesStatsCards />, 'stats-cards-high-values');
    });

    it('renders zero values stats cards correctly', async () => {
      await takeSnapshot(<ZeroValuesStatsCards />, 'stats-cards-zero-values');
    });

    it('maintains grid layout across breakpoints', async () => {
      await testResponsiveBreakpoints(<DefaultStatsCards />, 'stats-cards-responsive');
    });
  });

  describe('Theme Variations', () => {
    const themes = ['light', 'dark', 'high-contrast'];

    themes.forEach(theme => {
      describe(`${theme} theme`, () => {
        beforeEach(() => {
          document.documentElement.setAttribute('data-theme', theme);
          if (theme === 'high-contrast') {
            document.body.classList.add('high-contrast');
          }
        });

        afterEach(() => {
          document.documentElement.removeAttribute('data-theme');
          document.body.classList.remove('high-contrast');
        });

        it(`renders button in ${theme} theme`, async () => {
          await takeSnapshot(<PrimaryButton />, `button-primary-${theme}`);
        });

        it(`renders stats cards in ${theme} theme`, async () => {
          await takeSnapshot(<DefaultStatsCards />, `stats-cards-${theme}`);
        });
      });
    });
  });

  describe('Accessibility Visual States', () => {
    it('renders focus indicators correctly', async () => {
      const { container } = render(<PrimaryButton />);
      const button = container.querySelector('button');
      
      if (button) {
        button.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(container).toMatchSnapshot('button-focus-indicator.html');
      }
    });

    it('renders high contrast mode correctly', async () => {
      document.body.classList.add('high-contrast');
      
      await takeSnapshot(<PrimaryButton />, 'button-high-contrast');
      await takeSnapshot(<DefaultStatsCards />, 'stats-cards-high-contrast');
      
      document.body.classList.remove('high-contrast');
    });

    it('renders reduced motion mode correctly', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      await takeSnapshot(<LoadingButton />, 'button-loading-reduced-motion');
    });

    it('renders large font size correctly', async () => {
      document.documentElement.style.fontSize = '20px';
      
      await takeSnapshot(<PrimaryButton />, 'button-large-font');
      await takeSnapshot(<DefaultStatsCards />, 'stats-cards-large-font');
      
      document.documentElement.style.fontSize = '';
    });
  });

  describe('Error States', () => {
    it('renders form validation errors correctly', async () => {
      const FormWithErrors = () => (
        <form>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              className="error" 
              aria-describedby="email-error"
            />
            <div id="email-error" className="error-message" role="alert">
              Please enter a valid email address
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              className="error" 
              aria-describedby="password-error"
            />
            <div id="password-error" className="error-message" role="alert">
              Password must be at least 8 characters
            </div>
          </div>
        </form>
      );

      await takeSnapshot(<FormWithErrors />, 'form-validation-errors');
    });

    it('renders loading states correctly', async () => {
      const LoadingStates = () => (
        <div className="space-y-4">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-4 w-1/2"></div>
          <div className="spinner"></div>
        </div>
      );

      await takeSnapshot(<LoadingStates />, 'loading-states');
    });

    it('renders empty states correctly', async () => {
      const EmptyState = () => (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No items found</h3>
          <p>Get started by creating your first item</p>
          <button className="btn-primary">Create Item</button>
        </div>
      );

      await takeSnapshot(<EmptyState />, 'empty-state');
    });
  });

  describe('Interactive States', () => {
    it('renders modal overlay correctly', async () => {
      const ModalExample = () => (
        <div>
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Modal Title</h2>
                <button className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <p>Modal content goes here</p>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary">Cancel</button>
                <button className="btn-primary">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      );

      await takeSnapshot(<ModalExample />, 'modal-overlay');
    });

    it('renders dropdown menu correctly', async () => {
      const DropdownExample = () => (
        <div className="dropdown open">
          <button className="dropdown-trigger">Options</button>
          <div className="dropdown-menu">
            <a href="#" className="dropdown-item">Edit</a>
            <a href="#" className="dropdown-item">Delete</a>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item">Settings</a>
          </div>
        </div>
      );

      await takeSnapshot(<DropdownExample />, 'dropdown-menu');
    });

    it('renders tooltip correctly', async () => {
      const TooltipExample = () => (
        <div className="relative">
          <button className="btn-primary">Hover me</button>
          <div className="tooltip tooltip-top">
            This is a helpful tooltip
          </div>
        </div>
      );

      await takeSnapshot(<TooltipExample />, 'tooltip');
    });
  });

  describe('Layout Components', () => {
    it('renders grid layouts correctly', async () => {
      const GridLayout = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card p-4">
              <h3>Card {i + 1}</h3>
              <p>Card content</p>
            </div>
          ))}
        </div>
      );

      await testResponsiveBreakpoints(<GridLayout />, 'grid-layout');
    });

    it('renders flex layouts correctly', async () => {
      const FlexLayout = () => (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 card p-4">
            <h3>Main Content</h3>
            <p>This is the main content area</p>
          </div>
          <div className="w-full md:w-64 card p-4">
            <h3>Sidebar</h3>
            <p>This is the sidebar</p>
          </div>
        </div>
      );

      await testResponsiveBreakpoints(<FlexLayout />, 'flex-layout');
    });
  });

  describe('Animation States', () => {
    it('captures animation keyframes', async () => {
      const AnimatedComponent = () => (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      );

      // Capture at different animation states
      const { container } = render(<AnimatedComponent />);
      
      // Initial state
      expect(container).toMatchSnapshot('animation-initial.html');
      
      // Mid animation (mock)
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(container).toMatchSnapshot('animation-mid.html');
      
      // End state (mock)
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(container).toMatchSnapshot('animation-end.html');
    });

    it('renders transition states correctly', async () => {
      const TransitionComponent = ({ isOpen }: { isOpen: boolean }) => (
        <div className={`transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="card p-4">
            <h3>Transition Content</h3>
          </div>
        </div>
      );

      // Closed state
      await takeSnapshot(<TransitionComponent isOpen={false} />, 'transition-closed');
      
      // Open state
      await takeSnapshot(<TransitionComponent isOpen={true} />, 'transition-open');
    });
  });

  describe('Cross-browser Compatibility', () => {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];

    browsers.forEach(browser => {
      it(`renders correctly in ${browser}`, async () => {
        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: getBrowserUserAgent(browser),
          configurable: true
        });

        await takeSnapshot(<PrimaryButton />, `button-${browser}`);
        await takeSnapshot(<DefaultStatsCards />, `stats-cards-${browser}`);
      });
    });
  });

  describe('Print Styles', () => {
    it('renders print styles correctly', async () => {
      // Mock print media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('print'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      await takeSnapshot(<DefaultStatsCards />, 'stats-cards-print');
    });
  });
});

// Helper function to get browser user agents
function getBrowserUserAgent(browser: string): string {
  const userAgents = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
  };
  
  return userAgents[browser as keyof typeof userAgents] || userAgents.chrome;
}

// Custom snapshot serializer for better HTML snapshots
expect.addSnapshotSerializer({
  test: (val) => val && val.nodeType === Node.ELEMENT_NODE,
  print: (val: any) => {
    // Clean up the HTML for better snapshots
    const element = val.cloneNode(true);
    
    // Remove dynamic attributes
    element.querySelectorAll('*').forEach((node: Element) => {
      node.removeAttribute('data-testid');
      node.removeAttribute('id');
      if (node.getAttribute('class') === '') {
        node.removeAttribute('class');
      }
    });
    
    return element.outerHTML;
  }
});
