import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for Node.js environment (Jest tests)
export const server = setupServer(...handlers);

// Enable API mocking before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'error' // Fail tests on unhandled requests
  });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Export server for use in individual tests
export { server as mockServer };

// Utility functions for test setup
export const enableNetworkMocking = () => {
  server.listen();
};

export const disableNetworkMocking = () => {
  server.close();
};

export const resetNetworkMocks = () => {
  server.resetHandlers();
};

// Helper to add custom handlers for specific tests
export const addMockHandlers = (...newHandlers: Parameters<typeof server.use>) => {
  server.use(...newHandlers);
};

// Helper to simulate network errors
export const simulateNetworkError = (url: string) => {
  server.use(
    http.get(url, () => {
      return HttpResponse.error();
    })
  );
};

// Helper to simulate slow responses
export const simulateSlowResponse = (url: string, delay: number = 2000) => {
  server.use(
    http.get(url, async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({ data: 'slow response' });
    })
  );
};

// Helper to simulate rate limiting
export const simulateRateLimit = (url: string) => {
  server.use(
    http.get(url, () => {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    })
  );
};

// Helper to simulate authentication errors
export const simulateAuthError = (url: string) => {
  server.use(
    http.get(url, () => {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    })
  );
};

// Helper to simulate validation errors
export const simulateValidationError = (url: string, errors: Record<string, string>) => {
  server.use(
    http.post(url, () => {
      return HttpResponse.json(
        { 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    })
  );
};

// Helper to count requests to specific endpoints
export const createRequestCounter = () => {
  const counts = new Map<string, number>();
  
  return {
    count: (url: string) => counts.get(url) || 0,
    increment: (url: string) => counts.set(url, (counts.get(url) || 0) + 1),
    reset: () => counts.clear(),
    getAll: () => Object.fromEntries(counts)
  };
};

// Helper to capture request data
export const createRequestCapture = () => {
  const requests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    timestamp: number;
  }> = [];
  
  return {
    capture: (request: Request) => {
      requests.push({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body,
        timestamp: Date.now()
      });
    },
    getRequests: () => requests,
    getLastRequest: () => requests[requests.length - 1],
    clear: () => requests.splice(0, requests.length),
    count: () => requests.length
  };
};

// Helper for WebSocket mocking
export const createWebSocketMock = () => {
  const events = new Map<string, Function[]>();
  
  const mockWebSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn((event: string, handler: Function) => {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event)!.push(handler);
    }),
    removeEventListener: jest.fn((event: string, handler: Function) => {
      const handlers = events.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }),
    dispatchEvent: jest.fn((event: Event) => {
      const handlers = events.get(event.type);
      if (handlers) {
        handlers.forEach(handler => handler(event));
      }
    }),
    
    // Helper methods for testing
    simulateMessage: (data: any) => {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      mockWebSocket.dispatchEvent(messageEvent);
    },
    
    simulateOpen: () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      const openEvent = new Event('open');
      mockWebSocket.dispatchEvent(openEvent);
    },
    
    simulateClose: () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', { code: 1000 });
      mockWebSocket.dispatchEvent(closeEvent);
    },
    
    simulateError: () => {
      const errorEvent = new Event('error');
      mockWebSocket.dispatchEvent(errorEvent);
    }
  };
  
  return mockWebSocket;
};

// Helper for localStorage mocking
export const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  
  return {
    getItem: jest.fn((key: string) => store.get(key) || null),
    setItem: jest.fn((key: string, value: string) => store.set(key, value)),
    removeItem: jest.fn((key: string) => store.delete(key)),
    clear: jest.fn(() => store.clear()),
    key: jest.fn((index: number) => Array.from(store.keys())[index] || null),
    get length() { return store.size; },
    
    // Helper methods for testing
    getStore: () => Object.fromEntries(store),
    setStore: (data: Record<string, string>) => {
      store.clear();
      Object.entries(data).forEach(([key, value]) => store.set(key, value));
    }
  };
};

// Helper for IndexedDB mocking
export const createIndexedDBMock = () => {
  const databases = new Map<string, Map<string, any>>();
  
  return {
    open: jest.fn((name: string) => {
      if (!databases.has(name)) {
        databases.set(name, new Map());
      }
      
      return Promise.resolve({
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            get: jest.fn((key: string) => 
              Promise.resolve(databases.get(name)?.get(key))
            ),
            put: jest.fn((value: any, key: string) => {
              databases.get(name)?.set(key, value);
              return Promise.resolve();
            }),
            delete: jest.fn((key: string) => {
              databases.get(name)?.delete(key);
              return Promise.resolve();
            }),
            clear: jest.fn(() => {
              databases.get(name)?.clear();
              return Promise.resolve();
            })
          }))
        }))
      });
    }),
    
    // Helper methods for testing
    getDatabase: (name: string) => databases.get(name),
    clearDatabase: (name: string) => databases.get(name)?.clear(),
    clearAllDatabases: () => databases.clear()
  };
};

// Helper for Notification API mocking
export const createNotificationMock = () => {
  const notifications: Array<{
    title: string;
    options?: NotificationOptions;
    timestamp: number;
  }> = [];
  
  const mockNotification = jest.fn((title: string, options?: NotificationOptions) => {
    notifications.push({
      title,
      options,
      timestamp: Date.now()
    });
    
    return {
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  });
  
  // Mock static methods
  mockNotification.requestPermission = jest.fn(() => 
    Promise.resolve('granted' as NotificationPermission)
  );
  
  mockNotification.permission = 'granted' as NotificationPermission;
  
  // Helper methods for testing
  mockNotification.getNotifications = () => notifications;
  mockNotification.clearNotifications = () => notifications.splice(0, notifications.length);
  mockNotification.getLastNotification = () => notifications[notifications.length - 1];
  
  return mockNotification;
};

// Helper for geolocation mocking
export const createGeolocationMock = () => {
  return {
    getCurrentPosition: jest.fn((success, error) => {
      const position = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };
      
      setTimeout(() => success(position), 100);
    }),
    
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
    
    // Helper methods for testing
    simulateError: jest.fn((error) => {
      // Can be used to simulate geolocation errors
    })
  };
};

// Export all helpers
export const mockHelpers = {
  createRequestCounter,
  createRequestCapture,
  createWebSocketMock,
  createLocalStorageMock,
  createIndexedDBMock,
  createNotificationMock,
  createGeolocationMock,
  simulateNetworkError,
  simulateSlowResponse,
  simulateRateLimit,
  simulateAuthError,
  simulateValidationError
};
