import { faker } from '@faker-js/faker';

/**
 * Test data generators for creating realistic test scenarios
 */

// Generate realistic code snippets for different languages
export const codeGenerators = {
  javascript: {
    function: (name: string = 'testFunction') => `
function ${name}(${faker.helpers.arrayElements(['param1', 'param2', 'data', 'input'], { min: 1, max: 3 }).join(', ')}) {
  ${faker.helpers.arrayElement([
    'return param1 + param2;',
    'console.log("Hello World");',
    'const result = data.map(item => item * 2);',
    'if (input) { return input.toUpperCase(); }'
  ])}
}`,
    
    class: (name: string = 'TestClass') => `
class ${name} {
  constructor(${faker.helpers.arrayElements(['name', 'id', 'config'], { min: 1, max: 2 }).join(', ')}) {
    this.name = name;
    this.id = id || Math.random();
  }
  
  ${faker.helpers.arrayElement(['getName', 'getId', 'process', 'validate'])}() {
    return this.${faker.helpers.arrayElement(['name', 'id'])};
  }
}`,
    
    async: () => `
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}`,
    
    arrow: () => `
const ${faker.helpers.arrayElement(['processData', 'calculateSum', 'filterItems', 'mapValues'])} = (${faker.helpers.arrayElements(['arr', 'data', 'items'], { min: 1, max: 2 }).join(', ')}) => {
  return ${faker.helpers.arrayElement([
    'arr.filter(item => item > 0)',
    'data.reduce((sum, val) => sum + val, 0)',
    'items.map(item => ({ ...item, processed: true }))'
  ])};
};`
  },
  
  typescript: {
    interface: (name: string = 'TestInterface') => `
interface ${name} {
  id: string;
  name: string;
  ${faker.helpers.arrayElement(['email', 'age', 'status', 'createdAt'])}: ${faker.helpers.arrayElement(['string', 'number', 'boolean', 'Date'])};
  ${faker.helpers.arrayElement(['getData', 'process', 'validate'])}(): ${faker.helpers.arrayElement(['string', 'number', 'boolean', 'Promise<void>'])};
}`,
    
    generic: () => `
function ${faker.helpers.arrayElement(['processArray', 'filterData', 'mapItems'])}<T>(
  items: T[],
  predicate: (item: T) => boolean
): T[] {
  return items.filter(predicate);
}`,
    
    enum: (name: string = 'TestEnum') => `
enum ${name} {
  ${faker.helpers.arrayElements(['PENDING', 'ACTIVE', 'COMPLETED', 'FAILED'], { min: 2, max: 4 }).map((value, index) => 
    `${value} = ${faker.helpers.arrayElement([`"${value.toLowerCase()}"`, index.toString()])}`
  ).join(',\n  ')}
}`
  },
  
  python: {
    function: (name: string = 'test_function') => `
def ${name}(${faker.helpers.arrayElements(['data', 'items', 'value'], { min: 1, max: 2 }).join(', ')}):
    """${faker.lorem.sentence()}"""
    ${faker.helpers.arrayElement([
      'return sum(data)',
      'return [item * 2 for item in items]',
      'return value.upper() if isinstance(value, str) else str(value)'
    ])}`,
    
    class: (name: string = 'TestClass') => `
class ${name}:
    def __init__(self, ${faker.helpers.arrayElements(['name', 'id', 'config'], { min: 1, max: 2 }).join(', ')}):
        self.name = name
        self.id = id or ${faker.number.int({ min: 1, max: 1000 })}
    
    def ${faker.helpers.arrayElement(['get_name', 'get_id', 'process', 'validate'])}(self):
        return self.${faker.helpers.arrayElement(['name', 'id'])}`
  }
};

// Generate realistic test cases for exercises
export const testCaseGenerators = {
  array: {
    simple: () => ({
      input: JSON.stringify(faker.helpers.arrayElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { min: 3, max: 7 })),
      expected: JSON.stringify([2, 4, 6, 8]),
      description: 'Should filter even numbers and return them'
    }),
    
    strings: () => ({
      input: JSON.stringify(faker.helpers.arrayElements(['apple', 'banana', 'cherry', 'date', 'elderberry'], { min: 3, max: 5 })),
      expected: JSON.stringify(['APPLE', 'BANANA', 'CHERRY']),
      description: 'Should convert strings to uppercase'
    }),
    
    objects: () => ({
      input: JSON.stringify([
        { id: 1, name: faker.person.firstName(), active: true },
        { id: 2, name: faker.person.firstName(), active: false },
        { id: 3, name: faker.person.firstName(), active: true }
      ]),
      expected: JSON.stringify([{ id: 1, active: true }, { id: 3, active: true }]),
      description: 'Should filter active objects'
    })
  },
  
  string: {
    manipulation: () => ({
      input: `"${faker.lorem.words(3)}"`,
      expected: `"${faker.lorem.words(3).toUpperCase()}"`,
      description: 'Should convert string to uppercase'
    }),
    
    validation: () => ({
      input: `"${faker.internet.email()}"`,
      expected: 'true',
      description: 'Should validate email format'
    })
  },
  
  math: {
    calculation: () => {
      const a = faker.number.int({ min: 1, max: 100 });
      const b = faker.number.int({ min: 1, max: 100 });
      return {
        input: `${a}, ${b}`,
        expected: (a + b).toString(),
        description: `Should add ${a} and ${b} to get ${a + b}`
      };
    },
    
    fibonacci: () => {
      const n = faker.number.int({ min: 5, max: 10 });
      const fib = (num: number): number => num <= 1 ? num : fib(num - 1) + fib(num - 2);
      return {
        input: n.toString(),
        expected: fib(n).toString(),
        description: `Should calculate fibonacci number for ${n}`
      };
    }
  }
};

// Generate realistic error scenarios
export const errorScenarios = {
  network: {
    timeout: () => ({
      type: 'NetworkError',
      message: 'Request timeout after 30 seconds',
      code: 'TIMEOUT',
      retryable: true
    }),
    
    serverError: () => ({
      type: 'ServerError',
      message: faker.helpers.arrayElement([
        'Internal server error',
        'Service temporarily unavailable',
        'Database connection failed'
      ]),
      code: faker.helpers.arrayElement(['INTERNAL_ERROR', 'SERVICE_UNAVAILABLE', 'DB_ERROR']),
      status: faker.helpers.arrayElement([500, 502, 503])
    }),
    
    notFound: () => ({
      type: 'NotFoundError',
      message: `Resource not found: ${faker.system.fileName()}`,
      code: 'NOT_FOUND',
      status: 404
    })
  },
  
  validation: {
    required: (field: string) => ({
      type: 'ValidationError',
      message: `${field} is required`,
      code: 'REQUIRED_FIELD',
      field
    }),
    
    format: (field: string, format: string) => ({
      type: 'ValidationError',
      message: `${field} must be a valid ${format}`,
      code: 'INVALID_FORMAT',
      field,
      expectedFormat: format
    }),
    
    length: (field: string, min: number, max: number) => ({
      type: 'ValidationError',
      message: `${field} must be between ${min} and ${max} characters`,
      code: 'INVALID_LENGTH',
      field,
      constraints: { min, max }
    })
  },
  
  runtime: {
    typeError: () => ({
      type: 'TypeError',
      message: faker.helpers.arrayElement([
        'Cannot read property of undefined',
        'Cannot call method on null',
        'Expected string but got number'
      ]),
      line: faker.number.int({ min: 1, max: 50 }),
      column: faker.number.int({ min: 1, max: 80 })
    }),
    
    referenceError: () => ({
      type: 'ReferenceError',
      message: `${faker.helpers.arrayElement(['variable', 'function', 'object'])} is not defined`,
      line: faker.number.int({ min: 1, max: 50 })
    })
  }
};

// Generate realistic user interaction patterns
export const userBehaviorPatterns = {
  beginner: {
    typingSpeed: () => faker.number.int({ min: 20, max: 40 }), // WPM
    errorRate: () => faker.number.float({ min: 0.15, max: 0.25 }), // 15-25% error rate
    hintsUsed: () => faker.number.int({ min: 2, max: 4 }), // Uses most hints
    timeSpent: () => faker.number.int({ min: 300, max: 900 }), // 5-15 minutes per exercise
    
    commonMistakes: [
      'Missing semicolons',
      'Incorrect variable names',
      'Wrong function syntax',
      'Forgetting return statements'
    ]
  },
  
  intermediate: {
    typingSpeed: () => faker.number.int({ min: 40, max: 60 }),
    errorRate: () => faker.number.float({ min: 0.08, max: 0.15 }),
    hintsUsed: () => faker.number.int({ min: 0, max: 2 }),
    timeSpent: () => faker.number.int({ min: 180, max: 600 }),
    
    commonMistakes: [
      'Logic errors in algorithms',
      'Inefficient solutions',
      'Edge case handling'
    ]
  },
  
  advanced: {
    typingSpeed: () => faker.number.int({ min: 60, max: 100 }),
    errorRate: () => faker.number.float({ min: 0.02, max: 0.08 }),
    hintsUsed: () => faker.number.int({ min: 0, max: 1 }),
    timeSpent: () => faker.number.int({ min: 120, max: 300 }),
    
    commonMistakes: [
      'Optimization oversights',
      'Complex edge cases',
      'Performance considerations'
    ]
  }
};

// Generate realistic progress data
export const progressPatterns = {
  steady: (days: number) => {
    const baseProgress = 10;
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      exercisesCompleted: baseProgress + faker.number.int({ min: -2, max: 3 }),
      timeSpent: faker.number.int({ min: 30, max: 120 }), // minutes
      score: faker.number.int({ min: 75, max: 95 })
    }));
  },
  
  struggling: (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      exercisesCompleted: faker.number.int({ min: 2, max: 6 }),
      timeSpent: faker.number.int({ min: 60, max: 180 }),
      score: faker.number.int({ min: 40, max: 70 })
    }));
  },
  
  accelerating: (days: number) => {
    return Array.from({ length: days }, (_, i) => {
      const progress = Math.min(5 + i * 2, 20);
      return {
        day: i + 1,
        exercisesCompleted: progress + faker.number.int({ min: -1, max: 2 }),
        timeSpent: faker.number.int({ min: 20, max: 90 }),
        score: faker.number.int({ min: 80, max: 98 })
      };
    });
  }
};

// Generate realistic collaboration data
export const collaborationPatterns = {
  studyGroup: {
    active: () => ({
      messageFrequency: faker.number.int({ min: 20, max: 50 }), // messages per day
      participationRate: faker.number.float({ min: 0.7, max: 0.95 }),
      helpRequestsPerWeek: faker.number.int({ min: 3, max: 8 }),
      codeReviewsPerWeek: faker.number.int({ min: 2, max: 6 })
    }),
    
    casual: () => ({
      messageFrequency: faker.number.int({ min: 5, max: 15 }),
      participationRate: faker.number.float({ min: 0.3, max: 0.6 }),
      helpRequestsPerWeek: faker.number.int({ min: 1, max: 3 }),
      codeReviewsPerWeek: faker.number.int({ min: 0, max: 2 })
    })
  },
  
  peerReview: {
    constructive: () => ({
      averageReviewLength: faker.number.int({ min: 100, max: 300 }), // characters
      issuesFound: faker.number.int({ min: 2, max: 5 }),
      suggestionsProvided: faker.number.int({ min: 1, max: 3 }),
      tone: 'constructive',
      helpfulness: faker.number.float({ min: 0.8, max: 1.0 })
    }),
    
    brief: () => ({
      averageReviewLength: faker.number.int({ min: 20, max: 80 }),
      issuesFound: faker.number.int({ min: 0, max: 2 }),
      suggestionsProvided: faker.number.int({ min: 0, max: 1 }),
      tone: 'brief',
      helpfulness: faker.number.float({ min: 0.4, max: 0.7 })
    })
  }
};

// Generate realistic performance metrics
export const performancePatterns = {
  renderTimes: {
    fast: () => faker.number.int({ min: 10, max: 50 }), // milliseconds
    average: () => faker.number.int({ min: 50, max: 150 }),
    slow: () => faker.number.int({ min: 150, max: 500 })
  },
  
  memoryUsage: {
    light: () => faker.number.int({ min: 10, max: 50 }), // MB
    moderate: () => faker.number.int({ min: 50, max: 150 }),
    heavy: () => faker.number.int({ min: 150, max: 500 })
  },
  
  networkLatency: {
    local: () => faker.number.int({ min: 1, max: 10 }), // milliseconds
    fast: () => faker.number.int({ min: 10, max: 50 }),
    slow: () => faker.number.int({ min: 200, max: 1000 }),
    timeout: () => faker.number.int({ min: 5000, max: 30000 })
  }
};

// Utility functions for generating test scenarios
export const scenarioGenerators = {
  // Generate a complete learning session
  learningSession: (userLevel: 'beginner' | 'intermediate' | 'advanced') => {
    const pattern = userBehaviorPatterns[userLevel];
    const exerciseCount = faker.number.int({ min: 3, max: 8 });
    
    return {
      userId: faker.string.uuid(),
      startTime: faker.date.recent(),
      exercises: Array.from({ length: exerciseCount }, () => ({
        id: faker.string.uuid(),
        timeSpent: pattern.timeSpent(),
        hintsUsed: pattern.hintsUsed(),
        attempts: faker.number.int({ min: 1, max: 5 }),
        finalScore: faker.number.int({ min: 60, max: 100 }),
        completed: faker.datatype.boolean(0.8) // 80% completion rate
      })),
      totalTimeSpent: faker.number.int({ min: 600, max: 3600 }), // 10-60 minutes
      overallScore: faker.number.int({ min: 70, max: 95 })
    };
  },
  
  // Generate API response scenarios
  apiResponse: (type: 'success' | 'error' | 'slow' | 'timeout') => {
    const baseResponse = {
      timestamp: new Date().toISOString(),
      requestId: faker.string.uuid()
    };
    
    switch (type) {
      case 'success':
        return {
          ...baseResponse,
          status: 200,
          data: { success: true },
          responseTime: performancePatterns.networkLatency.fast()
        };
      
      case 'error':
        return {
          ...baseResponse,
          status: faker.helpers.arrayElement([400, 401, 403, 404, 500]),
          error: errorScenarios.network.serverError(),
          responseTime: performancePatterns.networkLatency.fast()
        };
      
      case 'slow':
        return {
          ...baseResponse,
          status: 200,
          data: { success: true },
          responseTime: performancePatterns.networkLatency.slow()
        };
      
      case 'timeout':
        return {
          ...baseResponse,
          status: 408,
          error: errorScenarios.network.timeout(),
          responseTime: performancePatterns.networkLatency.timeout()
        };
    }
  },
  
  // Generate accessibility test scenarios
  accessibilityScenario: (impairment: 'visual' | 'motor' | 'cognitive' | 'none') => {
    const baseScenario = {
      userId: faker.string.uuid(),
      sessionDuration: faker.number.int({ min: 300, max: 1800 })
    };
    
    switch (impairment) {
      case 'visual':
        return {
          ...baseScenario,
          assistiveTechnology: 'screen-reader',
          navigationMethod: 'keyboard',
          preferredFontSize: 'large',
          highContrast: true,
          interactionTime: faker.number.int({ min: 5, max: 15 }) // seconds per action
        };
      
      case 'motor':
        return {
          ...baseScenario,
          assistiveTechnology: 'switch-control',
          navigationMethod: 'keyboard',
          clickAccuracy: faker.number.float({ min: 0.6, max: 0.8 }),
          interactionTime: faker.number.int({ min: 8, max: 20 })
        };
      
      case 'cognitive':
        return {
          ...baseScenario,
          preferredComplexity: 'simple',
          needsExtraTime: true,
          prefersStepByStep: true,
          interactionTime: faker.number.int({ min: 10, max: 30 })
        };
      
      case 'none':
        return {
          ...baseScenario,
          navigationMethod: 'mouse',
          interactionTime: faker.number.int({ min: 1, max: 3 })
        };
    }
  }
};

// Export all generators
export const testDataGenerators = {
  code: codeGenerators,
  testCases: testCaseGenerators,
  errors: errorScenarios,
  userBehavior: userBehaviorPatterns,
  progress: progressPatterns,
  collaboration: collaborationPatterns,
  performance: performancePatterns,
  scenarios: scenarioGenerators
};
