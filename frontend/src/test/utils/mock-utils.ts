import { QueryClient } from '@tanstack/react-query';

/**
 * Mock utilities for testing
 */
export const mockUtils = {
  /**
   * Create a mock function with TypeScript support
   */
  createMockFn: <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
    return jest.fn() as jest.MockedFunction<T>;
  },

  /**
   * Mock localStorage
   */
  localStorage: {
    setup: () => {
      const mockStorage: Record<string, string> = {};
      
      return {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        }),
        get storage() {
          return { ...mockStorage };
        }
      };
    }
  },

  /**
   * Mock WebSocket
   */
  webSocket: {
    create: () => {
      const mockWebSocket = {
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN,
        url: 'ws://localhost:8000/ws',
        
        // Simulate events
        simulateOpen: () => {
          const openEvent = new Event('open');
          mockWebSocket.addEventListener.mock.calls
            .filter(([event]) => event === 'open')
            .forEach(([, handler]) => handler(openEvent));
        },
        
        simulateMessage: (data: any) => {
          const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
          mockWebSocket.addEventListener.mock.calls
            .filter(([event]) => event === 'message')
            .forEach(([, handler]) => handler(messageEvent));
        },
        
        simulateClose: () => {
          const closeEvent = new CloseEvent('close');
          mockWebSocket.addEventListener.mock.calls
            .filter(([event]) => event === 'close')
            .forEach(([, handler]) => handler(closeEvent));
        },
        
        simulateError: () => {
          const errorEvent = new Event('error');
          mockWebSocket.addEventListener.mock.calls
            .filter(([event]) => event === 'error')
            .forEach(([, handler]) => handler(errorEvent));
        }
      };
      
      return mockWebSocket;
    }
  },

  /**
   * Mock IntersectionObserver
   */
  intersectionObserver: {
    setup: () => {
      const mockIntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        
        // Simulate intersection
        simulateIntersection: (entries: Partial<IntersectionObserverEntry>[]) => {
          callback(entries.map(entry => ({
            isIntersecting: false,
            intersectionRatio: 0,
            target: document.createElement('div'),
            boundingClientRect: new DOMRect(),
            intersectionRect: new DOMRect(),
            rootBounds: new DOMRect(),
            time: Date.now(),
            ...entry
          })));
        }
      }));
      
      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: mockIntersectionObserver
      });
      
      return mockIntersectionObserver;
    }
  },

  /**
   * Mock ResizeObserver
   */
  resizeObserver: {
    setup: () => {
      const mockResizeObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        
        // Simulate resize
        simulateResize: (entries: Partial<ResizeObserverEntry>[]) => {
          callback(entries.map(entry => ({
            target: document.createElement('div'),
            contentRect: new DOMRect(0, 0, 100, 100),
            borderBoxSize: [{ blockSize: 100, inlineSize: 100 }],
            contentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
            devicePixelContentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
            ...entry
          })));
        }
      }));
      
      Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        configurable: true,
        value: mockResizeObserver
      });
      
      return mockResizeObserver;
    }
  },

  /**
   * Mock fetch API
   */
  fetch: {
    setup: () => {
      const mockFetch = jest.fn();
      
      global.fetch = mockFetch;
      
      return {
        mockResolvedValue: (data: any, options: { status?: number; headers?: Record<string, string> } = {}) => {
          mockFetch.mockResolvedValue({
            ok: (options.status || 200) < 400,
            status: options.status || 200,
            headers: new Headers(options.headers),
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(JSON.stringify(data)),
            blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
          });
        },
        
        mockRejectedValue: (error: Error) => {
          mockFetch.mockRejectedValue(error);
        },
        
        mockImplementation: (implementation: jest.MockImplementation) => {
          mockFetch.mockImplementation(implementation);
        },
        
        getMock: () => mockFetch
      };
    }
  },

  /**
   * Mock timers
   */
  timers: {
    setup: () => {
      jest.useFakeTimers();
      
      return {
        advanceBy: (ms: number) => jest.advanceTimersByTime(ms),
        advanceToNext: () => jest.advanceTimersToNextTimer(),
        runAll: () => jest.runAllTimers(),
        runOnlyPending: () => jest.runOnlyPendingTimers(),
        cleanup: () => jest.useRealTimers()
      };
    }
  },

  /**
   * Mock React Query client for testing
   */
  queryClient: {
    create: (options: {
      defaultOptions?: any;
      logger?: any;
    } = {}) => {
      return new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
            staleTime: 0,
            ...options.defaultOptions?.queries
          },
          mutations: {
            retry: false,
            ...options.defaultOptions?.mutations
          }
        },
        logger: options.logger || {
          log: () => {},
          warn: () => {},
          error: () => {}
        }
      });
    }
  },

  /**
   * Mock Monaco Editor
   */
  monacoEditor: {
    setup: () => {
      const mockEditor = {
        getValue: jest.fn(() => ''),
        setValue: jest.fn(),
        getModel: jest.fn(() => ({
          getValue: jest.fn(() => ''),
          setValue: jest.fn()
        })),
        onDidChangeModelContent: jest.fn(),
        dispose: jest.fn(),
        focus: jest.fn(),
        layout: jest.fn()
      };
      
      const mockMonaco = {
        editor: {
          create: jest.fn(() => mockEditor),
          defineTheme: jest.fn(),
          setTheme: jest.fn()
        },
        languages: {
          typescript: {
            typescriptDefaults: {
              setCompilerOptions: jest.fn(),
              addExtraLib: jest.fn()
            }
          }
        }
      };
      
      // Mock the Monaco Editor React component
      jest.mock('@monaco-editor/react', () => ({
        __esModule: true,
        default: ({ onChange, value, ...props }: any) => {
          // Create a simple textarea element for testing
          const textarea = document.createElement('textarea');
          textarea.setAttribute('data-testid', 'monaco-editor');
          textarea.value = value || '';
          textarea.addEventListener('change', (e) => {
            onChange?.((e.target as HTMLTextAreaElement).value);
          });
          return textarea;
        }
      }));
      
      return { mockEditor, mockMonaco };
    }
  },

  /**
   * Mock file operations
   */
  file: {
    createMockFile: (name: string, content: string, type: string = 'text/plain') => {
      return new File([content], name, { type });
    },
    
    createMockFileList: (files: File[]) => {
      const fileList = {
        length: files.length,
        item: (index: number) => files[index] || null,
        [Symbol.iterator]: function* () {
          for (const file of files) {
            yield file;
          }
        }
      };
      
      // Add files as indexed properties
      files.forEach((file, index) => {
        (fileList as any)[index] = file;
      });
      
      return fileList as FileList;
    }
  },

  /**
   * Mock geolocation API
   */
  geolocation: {
    setup: () => {
      const mockGeolocation = {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn()
      };
      
      Object.defineProperty(navigator, 'geolocation', {
        writable: true,
        configurable: true,
        value: mockGeolocation
      });
      
      return mockGeolocation;
    }
  },

  /**
   * Mock clipboard API
   */
  clipboard: {
    setup: () => {
      const mockClipboard = {
        writeText: jest.fn(() => Promise.resolve()),
        readText: jest.fn(() => Promise.resolve('')),
        write: jest.fn(() => Promise.resolve()),
        read: jest.fn(() => Promise.resolve([]))
      };
      
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        configurable: true,
        value: mockClipboard
      });
      
      return mockClipboard;
    }
  }
};

/**
 * Test environment setup utilities
 */
export const testEnvironment = {
  /**
   * Setup complete test environment
   */
  setup: () => {
    const mocks = {
      localStorage: mockUtils.localStorage.setup(),
      intersectionObserver: mockUtils.intersectionObserver.setup(),
      resizeObserver: mockUtils.resizeObserver.setup(),
      fetch: mockUtils.fetch.setup(),
      geolocation: mockUtils.geolocation.setup(),
      clipboard: mockUtils.clipboard.setup()
    };
    
    return mocks;
  },

  /**
   * Cleanup test environment
   */
  cleanup: () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  }
};