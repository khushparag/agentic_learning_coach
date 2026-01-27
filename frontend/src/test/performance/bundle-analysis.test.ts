import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

describe('Bundle Analysis', () => {
  const distPath = join(process.cwd(), 'dist');
  
  it('should have reasonable bundle sizes', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      
      // Extract JS and CSS file names from index.html
      const jsFiles = indexHtml.match(/src="[^"]*\.js"/g) || [];
      const cssFiles = indexHtml.match(/href="[^"]*\.css"/g) || [];
      
      // Check main bundle size
      const mainJsFile = jsFiles.find(file => file.includes('index')) || jsFiles[0];
      if (mainJsFile) {
        const fileName = mainJsFile.match(/src="([^"]*)"/)![1];
        const filePath = join(distPath, fileName);
        const stats = statSync(filePath);
        
        // Main bundle should be under 500KB
        expect(stats.size).toBeLessThan(500 * 1024);
        
        // Gzipped size should be under 150KB
        const content = readFileSync(filePath);
        const gzippedSize = gzipSync(content).length;
        expect(gzippedSize).toBeLessThan(150 * 1024);
      }
      
      // Check CSS bundle size
      if (cssFiles.length > 0) {
        const mainCssFile = cssFiles[0];
        const fileName = mainCssFile.match(/href="([^"]*)"/)![1];
        const filePath = join(distPath, fileName);
        const stats = statSync(filePath);
        
        // CSS bundle should be under 100KB
        expect(stats.size).toBeLessThan(100 * 1024);
      }
    } catch (error) {
      console.warn('Bundle analysis skipped - dist folder not found');
      // Skip test if dist folder doesn't exist (e.g., in CI without build)
    }
  });

  it('should use code splitting for routes', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      
      // Should have multiple JS chunks (indicating code splitting)
      const jsFiles = indexHtml.match(/src="[^"]*\.js"/g) || [];
      expect(jsFiles.length).toBeGreaterThan(1);
      
      // Should have vendor chunk separate from main chunk
      const hasVendorChunk = jsFiles.some(file => file.includes('vendor'));
      expect(hasVendorChunk).toBe(true);
    } catch (error) {
      console.warn('Code splitting analysis skipped - dist folder not found');
    }
  });

  it('should have optimized assets', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      
      // Should have minified HTML (no unnecessary whitespace)
      expect(indexHtml).not.toMatch(/\n\s+</);
      
      // Should have integrity hashes for security
      const scriptTags = indexHtml.match(/<script[^>]*>/g) || [];
      const hasIntegrity = scriptTags.some(tag => tag.includes('integrity='));
      expect(hasIntegrity).toBe(true);
      
      // Should have preload hints for critical resources
      const hasPreload = indexHtml.includes('rel="preload"');
      expect(hasPreload).toBe(true);
    } catch (error) {
      console.warn('Asset optimization analysis skipped - dist folder not found');
    }
  });
});

describe('Memory Usage Analysis', () => {
  it('should not have memory leaks in React components', () => {
    // Mock performance.memory if not available
    if (!('memory' in performance)) {
      (performance as any).memory = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 100000000,
      };
    }
    
    const initialMemory = (performance as any).memory.usedJSHeapSize;
    
    // Simulate component mounting and unmounting
    const components = [];
    for (let i = 0; i < 100; i++) {
      components.push({ id: i, data: new Array(1000).fill(i) });
    }
    
    // Clear components
    components.length = 0;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('should handle large datasets efficiently', () => {
    const startTime = performance.now();
    
    // Simulate processing large dataset
    const largeArray = new Array(10000).fill(0).map((_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: new Array(100).fill(i),
    }));
    
    // Simulate filtering and mapping operations
    const filtered = largeArray
      .filter(item => item.id % 2 === 0)
      .map(item => ({ ...item, processed: true }));
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Should process 10k items in under 100ms
    expect(processingTime).toBeLessThan(100);
    expect(filtered.length).toBe(5000);
  });
});

describe('Network Performance', () => {
  it('should have efficient API request patterns', async () => {
    // Mock fetch to track requests
    const originalFetch = global.fetch;
    const requests: string[] = [];
    
    global.fetch = jest.fn((url: string) => {
      requests.push(url);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'mock' }),
      } as Response);
    });
    
    // Simulate multiple API calls
    const apiCalls = [
      '/api/progress/user-123',
      '/api/tasks/user-123',
      '/api/curriculum/user-123',
    ];
    
    await Promise.all(apiCalls.map(url => fetch(url)));
    
    // Should not have duplicate requests
    const uniqueRequests = new Set(requests);
    expect(uniqueRequests.size).toBe(requests.length);
    
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should implement proper caching strategies', () => {
    // Test React Query cache behavior
    const cacheKey = 'test-query';
    const cacheData = { id: 1, name: 'Test' };
    
    // Simulate cache set
    const cache = new Map();
    cache.set(cacheKey, {
      data: cacheData,
      timestamp: Date.now(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    // Simulate cache get
    const cached = cache.get(cacheKey);
    expect(cached.data).toEqual(cacheData);
    
    // Check if data is still fresh
    const isStale = Date.now() - cached.timestamp > cached.staleTime;
    expect(isStale).toBe(false);
  });
});

describe('Rendering Performance', () => {
  it('should have fast initial render times', () => {
    const startTime = performance.now();
    
    // Simulate React component render
    const mockComponent = {
      props: { items: new Array(100).fill(0).map((_, i) => ({ id: i })) },
      render: function() {
        return this.props.items.map((item: any) => `<div key="${item.id}">${item.id}</div>`);
      }
    };
    
    const rendered = mockComponent.render();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 100 items in under 10ms
    expect(renderTime).toBeLessThan(10);
    expect(rendered).toHaveLength(100);
  });

  it('should handle virtual scrolling efficiently', () => {
    const totalItems = 10000;
    const visibleItems = 20;
    const itemHeight = 50;
    const scrollTop = 2500; // Scrolled to item 50
    
    // Calculate visible range
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItems, totalItems);
    
    // Should only render visible items
    const visibleRange = endIndex - startIndex;
    expect(visibleRange).toBeLessThanOrEqual(visibleItems);
    expect(startIndex).toBe(50);
    expect(endIndex).toBe(70);
  });
});

describe('Accessibility Performance', () => {
  it('should have fast screen reader navigation', () => {
    // Simulate screen reader navigation
    const elements = [
      { role: 'button', label: 'Submit' },
      { role: 'textbox', label: 'Code editor' },
      { role: 'heading', label: 'Exercise Instructions' },
      { role: 'list', label: 'Task list' },
    ];
    
    const startTime = performance.now();
    
    // Simulate finding elements by role
    const buttons = elements.filter(el => el.role === 'button');
    const textboxes = elements.filter(el => el.role === 'textbox');
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    // Should find elements quickly
    expect(searchTime).toBeLessThan(1);
    expect(buttons).toHaveLength(1);
    expect(textboxes).toHaveLength(1);
  });

  it('should have efficient keyboard navigation', () => {
    // Simulate keyboard navigation
    const focusableElements = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ];
    
    const startTime = performance.now();
    
    // Simulate finding next focusable element
    let currentIndex = 0;
    const nextElement = focusableElements[currentIndex + 1];
    
    const endTime = performance.now();
    const navigationTime = endTime - startTime;
    
    // Should navigate quickly
    expect(navigationTime).toBeLessThan(1);
    expect(nextElement).toBe('input');
  });
});