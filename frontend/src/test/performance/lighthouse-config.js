module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/exercises',
        'http://localhost:3000/learning-path',
        'http://localhost:3000/collaboration',
        'http://localhost:3000/settings'
      ],
      
      // Lighthouse settings
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        
        // Performance budget
        budgets: [
          {
            resourceSizes: [
              { resourceType: 'document', budget: 18 },
              { resourceType: 'total', budget: 500 },
              { resourceType: 'script', budget: 150 },
              { resourceType: 'stylesheet', budget: 50 },
              { resourceType: 'image', budget: 200 },
              { resourceType: 'font', budget: 100 }
            ],
            resourceCounts: [
              { resourceType: 'document', budget: 1 },
              { resourceType: 'total', budget: 50 },
              { resourceType: 'script', budget: 10 },
              { resourceType: 'stylesheet', budget: 5 },
              { resourceType: 'third-party', budget: 5 }
            ],
            timings: [
              { metric: 'first-contentful-paint', budget: 2000 },
              { metric: 'largest-contentful-paint', budget: 4000 },
              { metric: 'cumulative-layout-shift', budget: 0.1 },
              { metric: 'total-blocking-time', budget: 300 },
              { metric: 'speed-index', budget: 3000 }
            ]
          }
        ]
      },
      
      // Number of runs for more reliable results
      numberOfRuns: 3,
      
      // Start server automatically
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:3000',
      startServerReadyTimeout: 30000
    },
    
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Accessibility audits
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-description': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'uses-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // Performance optimizations
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'preload-lcp-image': 'warn',
        'uses-rel-preconnect': 'warn'
      }
    },
    
    upload: {
      // Upload results to Lighthouse CI server (if configured)
      target: 'temporary-public-storage'
    }
  },
  
  // Custom audit configurations
  extends: 'lighthouse:default',
  
  settings: {
    // Emulate mobile device for mobile-first testing
    emulatedFormFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    
    // Skip certain audits that may not be relevant
    skipAudits: [
      'canonical', // May not be applicable for SPA
      'robots-txt' // May not be applicable during development
    ],
    
    // Only run specific categories
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    
    // Additional Chrome flags for CI environments
    chromeFlags: [
      '--no-sandbox',
      '--headless',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps'
    ]
  }
};