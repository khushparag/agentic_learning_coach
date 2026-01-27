import type { Preview } from '@storybook/react';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { handlers } from '../src/test/mocks/handlers';

// Import global styles
import '../src/index.css';

// Initialize MSW
initialize({
  onUnhandledRequest: 'warn',
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    
    // MSW handlers
    msw: {
      handlers: handlers,
    },
    
    // Accessibility addon configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-trap',
            enabled: true,
          },
        ],
      },
    },
    
    // Viewport addon configuration
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '720px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    
    // Docs configuration
    docs: {
      toc: true,
    },
    
    // Background addon configuration
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
  },
  
  decorators: [
    mswDecorator,
    
    // Theme decorator
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return (
        <div className={`theme-${theme}`} style={{ minHeight: '100vh', padding: '1rem' }}>
          <Story />
        </div>
      );
    },
    
    // Router decorator for components that use routing
    (Story, context) => {
      const { parameters } = context;
      
      if (parameters.router) {
        const { BrowserRouter } = require('react-router-dom');
        return (
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        );
      }
      
      return <Story />;
    },
    
    // Query client decorator for components that use React Query
    (Story, context) => {
      const { parameters } = context;
      
      if (parameters.reactQuery) {
        const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        });
        
        return (
          <QueryClientProvider client={queryClient}>
            <Story />
          </QueryClientProvider>
        );
      }
      
      return <Story />;
    },
  ],
  
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;