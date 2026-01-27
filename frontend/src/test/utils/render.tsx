import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { mockUserProfile } from '../factories';
import type { UserProfile } from '@/types/apiTypes';

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Router options
  initialEntries?: string[];
  
  // Auth options
  user?: UserProfile | null;
  isAuthenticated?: boolean;
  
  // Query client options
  queryClient?: QueryClient;
  
  // WebSocket options
  mockWebSocket?: boolean;
  
  // Accessibility options
  accessibilitySettings?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };
}

// Create a custom render function
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialEntries = ['/'],
    user = mockUserProfile(),
    isAuthenticated = true,
    queryClient = createTestQueryClient(),
    mockWebSocket = true,
    accessibilitySettings = {},
    ...renderOptions
  } = options;

  // Create wrapper component
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider 
            initialUser={isAuthenticated ? user : null}
            initialIsAuthenticated={isAuthenticated}
          >
            <AccessibilityProvider initialSettings={accessibilitySettings}>
              <WebSocketProvider mockMode={mockWebSocket}>
                {children}
              </WebSocketProvider>
            </AccessibilityProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Create a test query client with disabled retries and caching
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

// Render with specific user types
export function renderWithBeginnerUser(ui: ReactElement, options: CustomRenderOptions = {}) {
  return customRender(ui, {
    ...options,
    user: mockUserProfile({
      skillLevel: 'beginner',
      learningGoals: ['JavaScript'],
    }),
  });
}

export function renderWithAdvancedUser(ui: ReactElement, options: CustomRenderOptions = {}) {
  return customRender(ui, {
    ...options,
    user: mockUserProfile({
      skillLevel: 'advanced',
      learningGoals: ['React', 'TypeScript'],
    }),
  });
}

// Render without authentication
export function renderUnauthenticated(ui: ReactElement, options: CustomRenderOptions = {}) {
  return customRender(ui, {
    ...options,
    user: null,
    isAuthenticated: false,
  });
}

// Render with accessibility settings
export function renderWithAccessibility(
  ui: ReactElement, 
  accessibilitySettings: CustomRenderOptions['accessibilitySettings'] = {},
  options: CustomRenderOptions = {}
) {
  return customRender(ui, {
    ...options,
    accessibilitySettings,
  });
}

// Render with custom query client (useful for testing loading states)
export function renderWithQueryClient(
  ui: ReactElement,
  queryClient: QueryClient,
  options: CustomRenderOptions = {}
) {
  return customRender(ui, {
    ...options,
    queryClient,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the default render with our custom render
export { customRender as render };
