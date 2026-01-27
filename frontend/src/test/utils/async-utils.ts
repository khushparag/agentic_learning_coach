import { waitFor, screen } from '@testing-library/react';

/**
 * Utilities for testing async operations
 */
export const asyncUtils = {
  /**
   * Wait for loading to finish
   */
  waitForLoadingToFinish: async (timeout: number = 5000) => {
    try {
      await waitFor(
        () => {
          const loadingElements = [
            ...screen.queryAllByText(/loading/i),
            ...screen.queryAllByRole('progressbar'),
            ...screen.queryAllByTestId(/loading|spinner/i),
          ];
          
          if (loadingElements.length > 0) {
            throw new Error('Still loading');
          }
        },
        { timeout }
      );
    } catch {
      // Loading elements might not exist, which is fine
    }
  },

  /**
   * Wait for element to appear with custom timeout
   */
  waitForElement: async (
    finder: () => HTMLElement | null,
    timeout: number = 3000
  ): Promise<HTMLElement> => {
    return waitFor(
      () => {
        const element = finder();
        if (!element) {
          throw new Error('Element not found');
        }
        return element;
      },
      { timeout }
    );
  },

  /**
   * Wait for element to disappear
   */
  waitForElementToDisappear: async (
    finder: () => HTMLElement | null,
    timeout: number = 3000
  ): Promise<void> => {
    return waitFor(
      () => {
        const element = finder();
        if (element) {
          throw new Error('Element still exists');
        }
      },
      { timeout }
    );
  },

  /**
   * Wait for API call to complete (useful with MSW)
   */
  waitForApiCall: async (
    apiCallPromise: Promise<any>,
    timeout: number = 5000
  ) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timeout')), timeout);
    });

    return Promise.race([apiCallPromise, timeoutPromise]);
  },

  /**
   * Wait for multiple async operations
   */
  waitForAll: async (operations: Promise<any>[], timeout: number = 10000) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operations timeout')), timeout);
    });

    return Promise.race([Promise.all(operations), timeoutPromise]);
  },

  /**
   * Retry an operation until it succeeds or times out
   */
  retry: async <T>(
    operation: () => Promise<T> | T,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  /**
   * Wait for condition to be true
   */
  waitForCondition: async (
    condition: () => boolean,
    timeout: number = 3000,
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Condition not met within timeout');
  },

  /**
   * Debounce utility for testing debounced operations
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          resolve(func(...args));
        }, delay);
      });
    };
  },

  /**
   * Throttle utility for testing throttled operations
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    };
  },
};

/**
 * Utilities for testing React Query operations
 */
export const queryUtils = {
  /**
   * Wait for query to finish loading
   */
  waitForQuery: async (queryKey: string[], timeout: number = 5000) => {
    await waitFor(
      () => {
        // Check if there are any loading indicators
        const loadingElements = screen.queryAllByTestId(`${queryKey.join('-')}-loading`);
        if (loadingElements.length > 0) {
          throw new Error('Query still loading');
        }
      },
      { timeout }
    );
  },

  /**
   * Wait for mutation to complete
   */
  waitForMutation: async (mutationKey: string, timeout: number = 5000) => {
    await waitFor(
      () => {
        const loadingElements = screen.queryAllByTestId(`${mutationKey}-loading`);
        if (loadingElements.length > 0) {
          throw new Error('Mutation still loading');
        }
      },
      { timeout }
    );
  },

  /**
   * Wait for error state to appear
   */
  waitForError: async (timeout: number = 3000) => {
    return waitFor(
      () => {
        const errorElements = [
          ...screen.queryAllByRole('alert'),
          ...screen.queryAllByText(/error/i),
          ...screen.queryAllByTestId(/error/i),
        ];
        
        if (errorElements.length === 0) {
          throw new Error('No error elements found');
        }
        
        return errorElements[0];
      },
      { timeout }
    );
  },
};

/**
 * Utilities for testing WebSocket operations
 */
export const websocketUtils = {
  /**
   * Wait for WebSocket connection
   */
  waitForConnection: async (timeout: number = 3000) => {
    await asyncUtils.waitForCondition(
      () => {
        const connectionStatus = screen.queryByTestId('websocket-status');
        return connectionStatus?.textContent === 'connected';
      },
      timeout
    );
  },

  /**
   * Wait for WebSocket message
   */
  waitForMessage: async (messageType: string, timeout: number = 5000) => {
    return asyncUtils.waitForElement(
      () => screen.queryByTestId(`websocket-message-${messageType}`),
      timeout
    );
  },

  /**
   * Simulate WebSocket message
   */
  simulateMessage: (messageType: string, data: any) => {
    // Dispatch custom event to simulate WebSocket message
    window.dispatchEvent(
      new CustomEvent('websocket-message', {
        detail: { type: messageType, data }
      })
    );
  },
};
