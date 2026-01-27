import api from './api'
import { LearningPath, LearningModule, LearningTask, ProgressStats, LearningPathVisualization, LearningResource, TaskSubmission } from '../types/learning-path'
import { CurriculumResponse, ModuleResponse, TaskResponse } from '../types/apiTypes'

// Technology-specific module templates for generating dynamic learning paths
interface TaskTemplate {
  title: string
  description: string
  type: LearningTask['type']
  requirements: string[]
  resources: { title: string; url: string; type: string }[]
}

interface ModuleTemplate {
  title: string
  description: string
  objectives: string[]
  tasks: TaskTemplate[]
}

const TECH_MODULE_TEMPLATES: Record<string, ModuleTemplate> = {
  javascript: {
    title: 'JavaScript Fundamentals',
    description: 'Master the core concepts of JavaScript programming',
    objectives: ['Understand variables and data types', 'Master functions and scope', 'Work with arrays and objects', 'Handle asynchronous operations'],
    tasks: [
      { 
        title: 'Variables and Data Types', 
        description: 'Learn about let, const, var and primitive data types', 
        type: 'reading',
        requirements: [
          'Understand the difference between let, const, and var',
          'Learn about primitive types: string, number, boolean, null, undefined, symbol',
          'Understand type coercion and how JavaScript handles type conversion',
          'Practice declaring and initializing variables',
          'Learn about variable hoisting and temporal dead zone'
        ],
        resources: [
          { title: 'MDN: JavaScript Data Types', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures', type: 'documentation' },
          { title: 'JavaScript.info: Variables', url: 'https://javascript.info/variables', type: 'tutorial' }
        ]
      },
      { 
        title: 'Functions and Scope', 
        description: 'Master function declarations, expressions, and closures', 
        type: 'exercise',
        requirements: [
          'Write a function declaration and a function expression',
          'Understand the difference between function scope and block scope',
          'Create a closure that maintains private state',
          'Use arrow functions and understand their lexical this binding',
          'Implement a higher-order function that takes a callback'
        ],
        resources: [
          { title: 'MDN: Functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions', type: 'documentation' },
          { title: 'JavaScript.info: Closures', url: 'https://javascript.info/closure', type: 'tutorial' }
        ]
      },
      { 
        title: 'Arrays and Objects', 
        description: 'Work with complex data structures', 
        type: 'exercise',
        requirements: [
          'Use array methods: map, filter, reduce, find, forEach',
          'Understand object creation and property access',
          'Practice destructuring arrays and objects',
          'Use the spread operator for copying and merging',
          'Implement a function that transforms an array of objects'
        ],
        resources: [
          { title: 'MDN: Array Methods', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array', type: 'documentation' },
          { title: 'JavaScript.info: Objects', url: 'https://javascript.info/object', type: 'tutorial' }
        ]
      },
      { 
        title: 'Async/Await and Promises', 
        description: 'Handle asynchronous operations effectively', 
        type: 'project',
        requirements: [
          'Create and resolve a Promise',
          'Chain multiple promises using .then()',
          'Convert callback-based code to async/await',
          'Handle errors with try/catch in async functions',
          'Use Promise.all() to run multiple async operations in parallel',
          'Build a small app that fetches data from an API'
        ],
        resources: [
          { title: 'MDN: Promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', type: 'documentation' },
          { title: 'JavaScript.info: Async/Await', url: 'https://javascript.info/async-await', type: 'tutorial' }
        ]
      }
    ]
  },
  typescript: {
    title: 'TypeScript Essentials',
    description: 'Add type safety to your JavaScript projects',
    objectives: ['Understand TypeScript basics', 'Use interfaces and types', 'Work with generics', 'Configure TypeScript projects'],
    tasks: [
      { 
        title: 'TypeScript Basics', 
        description: 'Learn type annotations and basic types', 
        type: 'reading',
        requirements: [
          'Understand why TypeScript adds value to JavaScript projects',
          'Learn basic type annotations: string, number, boolean, array',
          'Understand type inference and when to use explicit types',
          'Learn about the any, unknown, and never types',
          'Set up a TypeScript project with tsconfig.json'
        ],
        resources: [
          { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'documentation' },
          { title: 'TypeScript for JS Programmers', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html', type: 'tutorial' }
        ]
      },
      { 
        title: 'Interfaces and Types', 
        description: 'Define custom types and interfaces', 
        type: 'exercise',
        requirements: [
          'Create an interface to describe an object shape',
          'Understand the difference between interface and type alias',
          'Use optional and readonly properties',
          'Extend interfaces and create intersection types',
          'Implement a function with typed parameters and return type'
        ],
        resources: [
          { title: 'TypeScript: Interfaces', url: 'https://www.typescriptlang.org/docs/handbook/interfaces.html', type: 'documentation' },
          { title: 'TypeScript: Type Aliases', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases', type: 'documentation' }
        ]
      },
      { 
        title: 'Generics', 
        description: 'Create reusable type-safe components', 
        type: 'exercise',
        requirements: [
          'Understand why generics are useful for reusable code',
          'Create a generic function that works with multiple types',
          'Use generic constraints to limit type parameters',
          'Build a generic interface for a data container',
          'Apply generics to React components (if applicable)'
        ],
        resources: [
          { title: 'TypeScript: Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'documentation' },
          { title: 'TypeScript Deep Dive: Generics', url: 'https://basarat.gitbook.io/typescript/type-system/generics', type: 'tutorial' }
        ]
      }
    ]
  },
  react: {
    title: 'React Development',
    description: 'Build interactive UIs with React components and hooks',
    objectives: ['Create functional components', 'Use React hooks effectively', 'Manage component state', 'Handle side effects'],
    tasks: [
      { 
        title: 'Components and JSX', 
        description: 'Learn to create React components using JSX syntax', 
        type: 'reading',
        requirements: [
          'Understand what JSX is and how it compiles to JavaScript',
          'Create functional components with props',
          'Learn about component composition and children',
          'Understand the virtual DOM and reconciliation',
          'Use conditional rendering and lists in JSX'
        ],
        resources: [
          { title: 'React: Your First Component', url: 'https://react.dev/learn/your-first-component', type: 'documentation' },
          { title: 'React: Writing Markup with JSX', url: 'https://react.dev/learn/writing-markup-with-jsx', type: 'tutorial' }
        ]
      },
      { 
        title: 'useState Hook', 
        description: 'Manage component state with the useState hook', 
        type: 'exercise',
        requirements: [
          'Initialize state with useState',
          'Update state based on previous state',
          'Handle form inputs with controlled components',
          'Manage multiple state variables',
          'Build a counter or todo list component'
        ],
        resources: [
          { title: 'React: useState', url: 'https://react.dev/reference/react/useState', type: 'documentation' },
          { title: 'React: State as a Snapshot', url: 'https://react.dev/learn/state-as-a-snapshot', type: 'tutorial' }
        ]
      },
      { 
        title: 'useEffect Hook', 
        description: 'Handle side effects in functional components', 
        type: 'exercise',
        requirements: [
          'Understand when useEffect runs (mount, update, unmount)',
          'Fetch data from an API using useEffect',
          'Clean up side effects with the cleanup function',
          'Use the dependency array correctly',
          'Avoid common useEffect pitfalls'
        ],
        resources: [
          { title: 'React: useEffect', url: 'https://react.dev/reference/react/useEffect', type: 'documentation' },
          { title: 'React: Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', type: 'tutorial' }
        ]
      },
      { 
        title: 'Build a React App', 
        description: 'Create a complete React application', 
        type: 'project',
        requirements: [
          'Set up a new React project with Vite or Create React App',
          'Create multiple components with proper structure',
          'Implement state management across components',
          'Add routing with React Router (optional)',
          'Style your app with CSS or a styling library',
          'Deploy your app to a hosting service'
        ],
        resources: [
          { title: 'React: Thinking in React', url: 'https://react.dev/learn/thinking-in-react', type: 'documentation' },
          { title: 'Vite: Getting Started', url: 'https://vitejs.dev/guide/', type: 'tutorial' }
        ]
      }
    ]
  },
  vue: {
    title: 'Vue.js Development',
    description: 'Build reactive applications with Vue.js',
    objectives: ['Understand Vue components', 'Use Vue reactivity system', 'Work with Vue Router', 'Manage state with Pinia'],
    tasks: [
      { 
        title: 'Vue Basics', 
        description: 'Learn Vue component structure and templates', 
        type: 'reading',
        requirements: [
          'Understand the Vue component structure (template, script, style)',
          'Learn Vue template syntax and directives (v-if, v-for, v-bind)',
          'Handle events with v-on and event modifiers',
          'Use computed properties and watchers',
          'Understand the Vue component lifecycle'
        ],
        resources: [
          { title: 'Vue.js Guide', url: 'https://vuejs.org/guide/introduction.html', type: 'documentation' },
          { title: 'Vue.js Tutorial', url: 'https://vuejs.org/tutorial/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Reactivity and Composition API', 
        description: 'Master Vue 3 Composition API', 
        type: 'exercise',
        requirements: [
          'Use ref() and reactive() for reactive state',
          'Create composable functions for reusable logic',
          'Understand the difference between Options API and Composition API',
          'Use provide/inject for dependency injection',
          'Build a component using the Composition API'
        ],
        resources: [
          { title: 'Vue: Composition API', url: 'https://vuejs.org/guide/extras/composition-api-faq.html', type: 'documentation' },
          { title: 'Vue: Reactivity Fundamentals', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html', type: 'tutorial' }
        ]
      },
      { 
        title: 'Vue Router', 
        description: 'Implement client-side routing', 
        type: 'exercise',
        requirements: [
          'Set up Vue Router in your application',
          'Create routes and nested routes',
          'Use route parameters and query strings',
          'Implement navigation guards',
          'Handle 404 pages and redirects'
        ],
        resources: [
          { title: 'Vue Router Guide', url: 'https://router.vuejs.org/guide/', type: 'documentation' },
          { title: 'Vue Router: Dynamic Routing', url: 'https://router.vuejs.org/guide/essentials/dynamic-matching.html', type: 'tutorial' }
        ]
      }
    ]
  },
  angular: {
    title: 'Angular Framework',
    description: 'Build enterprise applications with Angular',
    objectives: ['Understand Angular architecture', 'Create components and services', 'Use dependency injection', 'Handle routing and forms'],
    tasks: [
      { 
        title: 'Angular Fundamentals', 
        description: 'Learn Angular components and modules', 
        type: 'reading',
        requirements: [
          'Understand Angular architecture (modules, components, services)',
          'Learn Angular template syntax and data binding',
          'Use structural directives (*ngIf, *ngFor)',
          'Understand component lifecycle hooks',
          'Set up an Angular project with Angular CLI'
        ],
        resources: [
          { title: 'Angular: Getting Started', url: 'https://angular.io/start', type: 'documentation' },
          { title: 'Angular: Tour of Heroes Tutorial', url: 'https://angular.io/tutorial', type: 'tutorial' }
        ]
      },
      { 
        title: 'Services and DI', 
        description: 'Create services and use dependency injection', 
        type: 'exercise',
        requirements: [
          'Create an Angular service with @Injectable',
          'Understand hierarchical dependency injection',
          'Use services to share data between components',
          'Implement HTTP calls with HttpClient',
          'Handle observables with RxJS operators'
        ],
        resources: [
          { title: 'Angular: Dependency Injection', url: 'https://angular.io/guide/dependency-injection', type: 'documentation' },
          { title: 'Angular: Services', url: 'https://angular.io/guide/architecture-services', type: 'tutorial' }
        ]
      },
      { 
        title: 'Angular Forms', 
        description: 'Build reactive and template-driven forms', 
        type: 'exercise',
        requirements: [
          'Create template-driven forms with ngModel',
          'Build reactive forms with FormBuilder',
          'Implement form validation (built-in and custom)',
          'Handle form submission and errors',
          'Create dynamic forms with FormArray'
        ],
        resources: [
          { title: 'Angular: Reactive Forms', url: 'https://angular.io/guide/reactive-forms', type: 'documentation' },
          { title: 'Angular: Form Validation', url: 'https://angular.io/guide/form-validation', type: 'tutorial' }
        ]
      }
    ]
  },
  nodejs: {
    title: 'Node.js Backend Development',
    description: 'Build server-side applications with Node.js',
    objectives: ['Set up a Node.js server', 'Create REST APIs', 'Handle middleware', 'Work with databases'],
    tasks: [
      { 
        title: 'Node.js Basics', 
        description: 'Introduction to Node.js runtime and npm', 
        type: 'reading',
        requirements: [
          'Understand the Node.js event loop and non-blocking I/O',
          'Learn about npm and package.json',
          'Work with the file system (fs module)',
          'Use environment variables with dotenv',
          'Understand CommonJS vs ES modules'
        ],
        resources: [
          { title: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/', type: 'documentation' },
          { title: 'Node.js: Getting Started', url: 'https://nodejs.dev/learn', type: 'tutorial' }
        ]
      },
      { 
        title: 'Express.js Setup', 
        description: 'Create a basic Express server', 
        type: 'exercise',
        requirements: [
          'Set up an Express.js application',
          'Create routes for different HTTP methods',
          'Use middleware for logging and parsing',
          'Handle errors with error middleware',
          'Serve static files and templates'
        ],
        resources: [
          { title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'documentation' },
          { title: 'Express.js: Hello World', url: 'https://expressjs.com/en/starter/hello-world.html', type: 'tutorial' }
        ]
      },
      { 
        title: 'REST API Development', 
        description: 'Build RESTful endpoints', 
        type: 'project',
        requirements: [
          'Design a RESTful API with proper endpoints',
          'Implement CRUD operations',
          'Add input validation with a library like Joi or Zod',
          'Connect to a database (MongoDB or PostgreSQL)',
          'Add authentication with JWT',
          'Document your API with Swagger or similar'
        ],
        resources: [
          { title: 'REST API Best Practices', url: 'https://restfulapi.net/', type: 'documentation' },
          { title: 'Building REST APIs with Express', url: 'https://expressjs.com/en/guide/routing.html', type: 'tutorial' }
        ]
      }
    ]
  },
  python: {
    title: 'Python Programming',
    description: 'Master Python for backend and data applications',
    objectives: ['Understand Python syntax', 'Work with data structures', 'Use Python libraries', 'Build web applications'],
    tasks: [
      { 
        title: 'Python Fundamentals', 
        description: 'Learn Python syntax and data types', 
        type: 'reading',
        requirements: [
          'Understand Python syntax and indentation',
          'Learn about Python data types (str, int, float, bool, None)',
          'Work with variables and basic operators',
          'Use control flow (if/elif/else, for, while)',
          'Define and call functions with parameters'
        ],
        resources: [
          { title: 'Python Documentation', url: 'https://docs.python.org/3/tutorial/', type: 'documentation' },
          { title: 'Real Python: Basics', url: 'https://realpython.com/python-basics/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Data Structures', 
        description: 'Work with lists, dictionaries, and sets', 
        type: 'exercise',
        requirements: [
          'Use lists and list comprehensions',
          'Work with dictionaries and dictionary methods',
          'Understand sets and their operations',
          'Use tuples for immutable sequences',
          'Implement a function that processes complex data structures'
        ],
        resources: [
          { title: 'Python: Data Structures', url: 'https://docs.python.org/3/tutorial/datastructures.html', type: 'documentation' },
          { title: 'Real Python: Lists and Tuples', url: 'https://realpython.com/python-lists-tuples/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Python Web Development', 
        description: 'Build APIs with FastAPI or Flask', 
        type: 'project',
        requirements: [
          'Set up a FastAPI or Flask project',
          'Create API endpoints with proper HTTP methods',
          'Handle request validation with Pydantic',
          'Connect to a database with SQLAlchemy',
          'Add authentication and authorization',
          'Write tests for your API endpoints'
        ],
        resources: [
          { title: 'FastAPI Documentation', url: 'https://fastapi.tiangolo.com/', type: 'documentation' },
          { title: 'Flask Tutorial', url: 'https://flask.palletsprojects.com/en/2.0.x/tutorial/', type: 'tutorial' }
        ]
      }
    ]
  },
  java: {
    title: 'Java Development',
    description: 'Build enterprise applications with Java',
    objectives: ['Understand Java OOP', 'Work with collections', 'Use Spring Boot', 'Handle databases'],
    tasks: [
      { 
        title: 'Java Basics', 
        description: 'Learn Java syntax and OOP concepts', 
        type: 'reading',
        requirements: [
          'Understand Java syntax and data types',
          'Learn about classes, objects, and constructors',
          'Master inheritance, polymorphism, and encapsulation',
          'Use interfaces and abstract classes',
          'Handle exceptions with try-catch-finally'
        ],
        resources: [
          { title: 'Java Documentation', url: 'https://docs.oracle.com/javase/tutorial/', type: 'documentation' },
          { title: 'Java Tutorial', url: 'https://www.baeldung.com/java-tutorial', type: 'tutorial' }
        ]
      },
      { 
        title: 'Collections Framework', 
        description: 'Work with Java collections', 
        type: 'exercise',
        requirements: [
          'Use ArrayList, LinkedList, and their differences',
          'Work with HashMap, TreeMap, and HashSet',
          'Understand the Collections utility class',
          'Use streams and lambda expressions',
          'Implement sorting with Comparable and Comparator'
        ],
        resources: [
          { title: 'Java Collections', url: 'https://docs.oracle.com/javase/tutorial/collections/', type: 'documentation' },
          { title: 'Baeldung: Java Collections', url: 'https://www.baeldung.com/java-collections', type: 'tutorial' }
        ]
      },
      { 
        title: 'Spring Boot', 
        description: 'Build REST APIs with Spring Boot', 
        type: 'project',
        requirements: [
          'Set up a Spring Boot project with Spring Initializr',
          'Create REST controllers with @RestController',
          'Use dependency injection with @Autowired',
          'Connect to a database with Spring Data JPA',
          'Add validation with Bean Validation',
          'Write tests with Spring Boot Test'
        ],
        resources: [
          { title: 'Spring Boot Guide', url: 'https://spring.io/guides/gs/spring-boot/', type: 'documentation' },
          { title: 'Spring Boot Tutorial', url: 'https://www.baeldung.com/spring-boot', type: 'tutorial' }
        ]
      }
    ]
  },
  go: {
    title: 'Go Programming',
    description: 'Build fast and efficient applications with Go',
    objectives: ['Understand Go syntax', 'Work with goroutines', 'Build web services', 'Handle concurrency'],
    tasks: [
      { 
        title: 'Go Fundamentals', 
        description: 'Learn Go syntax and types', 
        type: 'reading',
        requirements: [
          'Understand Go syntax and package structure',
          'Learn about Go data types and variables',
          'Work with functions and multiple return values',
          'Use structs and methods',
          'Understand pointers and when to use them'
        ],
        resources: [
          { title: 'Go Tour', url: 'https://go.dev/tour/', type: 'documentation' },
          { title: 'Go by Example', url: 'https://gobyexample.com/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Concurrency', 
        description: 'Work with goroutines and channels', 
        type: 'exercise',
        requirements: [
          'Create and run goroutines',
          'Use channels for communication between goroutines',
          'Implement select for handling multiple channels',
          'Use sync package for synchronization',
          'Build a concurrent program that processes data in parallel'
        ],
        resources: [
          { title: 'Go: Concurrency', url: 'https://go.dev/tour/concurrency/1', type: 'documentation' },
          { title: 'Go Concurrency Patterns', url: 'https://go.dev/blog/pipelines', type: 'tutorial' }
        ]
      },
      { 
        title: 'Go Web Services', 
        description: 'Build HTTP servers with Go', 
        type: 'project',
        requirements: [
          'Create an HTTP server with net/http',
          'Handle routes and middleware',
          'Parse JSON requests and responses',
          'Connect to a database',
          'Add error handling and logging',
          'Write tests for your handlers'
        ],
        resources: [
          { title: 'Go: Writing Web Applications', url: 'https://go.dev/doc/articles/wiki/', type: 'documentation' },
          { title: 'Go Web Examples', url: 'https://gowebexamples.com/', type: 'tutorial' }
        ]
      }
    ]
  },
  rust: {
    title: 'Rust Programming',
    description: 'Build safe and performant systems with Rust',
    objectives: ['Understand ownership', 'Work with lifetimes', 'Use Rust patterns', 'Build CLI tools'],
    tasks: [
      { 
        title: 'Rust Basics', 
        description: 'Learn Rust syntax and ownership', 
        type: 'reading',
        requirements: [
          'Understand Rust syntax and data types',
          'Learn about variables, mutability, and shadowing',
          'Master the ownership system and borrowing rules',
          'Work with structs and enums',
          'Use pattern matching with match'
        ],
        resources: [
          { title: 'The Rust Book', url: 'https://doc.rust-lang.org/book/', type: 'documentation' },
          { title: 'Rust by Example', url: 'https://doc.rust-lang.org/rust-by-example/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Ownership and Borrowing', 
        description: 'Master Rust memory management', 
        type: 'exercise',
        requirements: [
          'Understand move semantics and Copy trait',
          'Use references and borrowing correctly',
          'Work with lifetimes in function signatures',
          'Handle the borrow checker errors',
          'Implement a data structure with proper ownership'
        ],
        resources: [
          { title: 'Rust: Ownership', url: 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html', type: 'documentation' },
          { title: 'Rust: Lifetimes', url: 'https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html', type: 'tutorial' }
        ]
      },
      { 
        title: 'Rust CLI Tool', 
        description: 'Build a command-line application', 
        type: 'project',
        requirements: [
          'Set up a Rust project with Cargo',
          'Parse command-line arguments with clap',
          'Handle errors with Result and the ? operator',
          'Read and write files',
          'Add tests and documentation',
          'Publish your crate (optional)'
        ],
        resources: [
          { title: 'Rust CLI Book', url: 'https://rust-cli.github.io/book/', type: 'documentation' },
          { title: 'Clap Documentation', url: 'https://docs.rs/clap/', type: 'tutorial' }
        ]
      }
    ]
  },
  docker: {
    title: 'Docker Containerization',
    description: 'Containerize applications with Docker',
    objectives: ['Understand containers', 'Write Dockerfiles', 'Use Docker Compose', 'Manage images'],
    tasks: [
      { 
        title: 'Docker Basics', 
        description: 'Learn container concepts and Docker CLI', 
        type: 'reading',
        requirements: [
          'Understand the difference between containers and virtual machines',
          'Learn Docker architecture (daemon, client, registry)',
          'Master basic Docker CLI commands (run, ps, images, pull, push)',
          'Understand Docker images and layers',
          'Learn about container lifecycle management'
        ],
        resources: [
          { title: 'Docker Documentation', url: 'https://docs.docker.com/get-started/', type: 'documentation' },
          { title: 'Docker Tutorial', url: 'https://docker-curriculum.com/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Dockerfiles', 
        description: 'Write efficient Dockerfiles', 
        type: 'exercise',
        requirements: [
          'Write a Dockerfile from scratch',
          'Use multi-stage builds for smaller images',
          'Understand and use common Dockerfile instructions (FROM, RUN, COPY, CMD, ENTRYPOINT)',
          'Implement best practices for layer caching',
          'Build and tag Docker images'
        ],
        resources: [
          { title: 'Dockerfile Reference', url: 'https://docs.docker.com/engine/reference/builder/', type: 'documentation' },
          { title: 'Dockerfile Best Practices', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Docker Compose', 
        description: 'Orchestrate multi-container apps', 
        type: 'project',
        requirements: [
          'Write a docker-compose.yml file',
          'Define multiple services and their dependencies',
          'Configure networks and volumes',
          'Use environment variables and .env files',
          'Implement health checks',
          'Deploy a multi-container application locally'
        ],
        resources: [
          { title: 'Docker Compose Documentation', url: 'https://docs.docker.com/compose/', type: 'documentation' },
          { title: 'Docker Compose Tutorial', url: 'https://docs.docker.com/compose/gettingstarted/', type: 'tutorial' }
        ]
      }
    ]
  },
  kubernetes: {
    title: 'Kubernetes Orchestration',
    description: 'Deploy and manage containerized applications',
    objectives: ['Understand K8s architecture', 'Deploy applications', 'Manage services', 'Handle scaling'],
    tasks: [
      { 
        title: 'Kubernetes Concepts', 
        description: 'Learn pods, services, and deployments', 
        type: 'reading',
        requirements: [
          'Understand Kubernetes architecture (control plane, nodes, etcd)',
          'Learn about Pods and their lifecycle',
          'Understand Deployments and ReplicaSets',
          'Learn about Services and networking',
          'Understand ConfigMaps and Secrets'
        ],
        resources: [
          { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/concepts/', type: 'documentation' },
          { title: 'Kubernetes Basics Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Deploy to K8s', 
        description: 'Deploy your first application', 
        type: 'exercise',
        requirements: [
          'Set up a local Kubernetes cluster (minikube or kind)',
          'Write a Deployment manifest',
          'Create a Service to expose your application',
          'Use kubectl to manage resources',
          'View logs and debug pods'
        ],
        resources: [
          { title: 'kubectl Cheat Sheet', url: 'https://kubernetes.io/docs/reference/kubectl/cheatsheet/', type: 'reference' },
          { title: 'Deploy an App', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/', type: 'tutorial' }
        ]
      },
      { 
        title: 'K8s Services', 
        description: 'Configure services and ingress', 
        type: 'project',
        requirements: [
          'Create different Service types (ClusterIP, NodePort, LoadBalancer)',
          'Set up an Ingress controller',
          'Configure Ingress rules for routing',
          'Implement TLS/SSL termination',
          'Set up horizontal pod autoscaling',
          'Monitor your deployment with kubectl'
        ],
        resources: [
          { title: 'Services Documentation', url: 'https://kubernetes.io/docs/concepts/services-networking/service/', type: 'documentation' },
          { title: 'Ingress Documentation', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/', type: 'documentation' }
        ]
      }
    ]
  },
  aws: {
    title: 'AWS Cloud Services',
    description: 'Build and deploy on Amazon Web Services',
    objectives: ['Understand AWS services', 'Use EC2 and S3', 'Deploy applications', 'Manage infrastructure'],
    tasks: [
      { 
        title: 'AWS Fundamentals', 
        description: 'Learn core AWS services', 
        type: 'reading',
        requirements: [
          'Understand AWS global infrastructure (regions, availability zones)',
          'Learn about IAM (users, roles, policies)',
          'Understand the AWS shared responsibility model',
          'Learn about AWS pricing and free tier',
          'Set up an AWS account and configure CLI'
        ],
        resources: [
          { title: 'AWS Documentation', url: 'https://docs.aws.amazon.com/', type: 'documentation' },
          { title: 'AWS Getting Started', url: 'https://aws.amazon.com/getting-started/', type: 'tutorial' }
        ]
      },
      { 
        title: 'EC2 and S3', 
        description: 'Work with compute and storage', 
        type: 'exercise',
        requirements: [
          'Launch an EC2 instance',
          'Configure security groups and key pairs',
          'Connect to your instance via SSH',
          'Create and configure an S3 bucket',
          'Upload and manage objects in S3',
          'Set up bucket policies and access controls'
        ],
        resources: [
          { title: 'EC2 Documentation', url: 'https://docs.aws.amazon.com/ec2/', type: 'documentation' },
          { title: 'S3 Documentation', url: 'https://docs.aws.amazon.com/s3/', type: 'documentation' }
        ]
      },
      { 
        title: 'Deploy to AWS', 
        description: 'Deploy a full application', 
        type: 'project',
        requirements: [
          'Deploy a web application to EC2 or Elastic Beanstalk',
          'Set up a database with RDS',
          'Configure a load balancer',
          'Set up CloudWatch monitoring and alarms',
          'Implement auto-scaling',
          'Use Route 53 for DNS management'
        ],
        resources: [
          { title: 'Elastic Beanstalk', url: 'https://docs.aws.amazon.com/elasticbeanstalk/', type: 'documentation' },
          { title: 'AWS Well-Architected', url: 'https://aws.amazon.com/architecture/well-architected/', type: 'reference' }
        ]
      }
    ]
  },
  postgresql: {
    title: 'PostgreSQL Database',
    description: 'Master relational database design and SQL',
    objectives: ['Design schemas', 'Write SQL queries', 'Optimize performance', 'Handle transactions'],
    tasks: [
      { 
        title: 'SQL Basics', 
        description: 'Learn SQL syntax and queries', 
        type: 'reading',
        requirements: [
          'Understand relational database concepts',
          'Learn SQL data types in PostgreSQL',
          'Master SELECT, INSERT, UPDATE, DELETE statements',
          'Use WHERE, ORDER BY, GROUP BY, HAVING clauses',
          'Understand JOINs (INNER, LEFT, RIGHT, FULL)'
        ],
        resources: [
          { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', type: 'documentation' },
          { title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Schema Design', 
        description: 'Design normalized database schemas', 
        type: 'exercise',
        requirements: [
          'Design a normalized database schema (1NF, 2NF, 3NF)',
          'Create tables with appropriate data types',
          'Define primary keys and foreign keys',
          'Implement constraints (NOT NULL, UNIQUE, CHECK)',
          'Create indexes for performance'
        ],
        resources: [
          { title: 'Database Normalization', url: 'https://www.postgresql.org/docs/current/ddl.html', type: 'documentation' },
          { title: 'PostgreSQL Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html', type: 'documentation' }
        ]
      },
      { 
        title: 'Advanced Queries', 
        description: 'Write complex SQL queries', 
        type: 'exercise',
        requirements: [
          'Write subqueries and CTEs (Common Table Expressions)',
          'Use window functions (ROW_NUMBER, RANK, LAG, LEAD)',
          'Implement aggregate functions with grouping',
          'Write stored procedures and functions',
          'Use transactions and understand ACID properties'
        ],
        resources: [
          { title: 'PostgreSQL Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', type: 'documentation' },
          { title: 'PostgreSQL Functions', url: 'https://www.postgresql.org/docs/current/plpgsql.html', type: 'documentation' }
        ]
      }
    ]
  },
  mongodb: {
    title: 'MongoDB NoSQL',
    description: 'Work with document databases',
    objectives: ['Understand NoSQL concepts', 'Design documents', 'Query MongoDB', 'Use aggregation'],
    tasks: [
      { 
        title: 'MongoDB Basics', 
        description: 'Learn document database concepts', 
        type: 'reading',
        requirements: [
          'Understand NoSQL vs SQL databases',
          'Learn MongoDB document structure (BSON)',
          'Understand collections and databases',
          'Learn about MongoDB data types',
          'Set up MongoDB locally or use Atlas'
        ],
        resources: [
          { title: 'MongoDB Documentation', url: 'https://www.mongodb.com/docs/', type: 'documentation' },
          { title: 'MongoDB University', url: 'https://university.mongodb.com/', type: 'tutorial' }
        ]
      },
      { 
        title: 'CRUD Operations', 
        description: 'Perform basic database operations', 
        type: 'exercise',
        requirements: [
          'Insert documents (insertOne, insertMany)',
          'Query documents with find and filters',
          'Update documents (updateOne, updateMany, replaceOne)',
          'Delete documents (deleteOne, deleteMany)',
          'Use query operators ($eq, $gt, $in, $and, $or)'
        ],
        resources: [
          { title: 'MongoDB CRUD', url: 'https://www.mongodb.com/docs/manual/crud/', type: 'documentation' },
          { title: 'Query Operators', url: 'https://www.mongodb.com/docs/manual/reference/operator/query/', type: 'reference' }
        ]
      },
      { 
        title: 'Aggregation Pipeline', 
        description: 'Build complex data queries', 
        type: 'exercise',
        requirements: [
          'Understand the aggregation pipeline concept',
          'Use $match, $group, $sort, $project stages',
          'Implement $lookup for joining collections',
          'Use $unwind for array processing',
          'Build complex aggregation pipelines'
        ],
        resources: [
          { title: 'Aggregation Pipeline', url: 'https://www.mongodb.com/docs/manual/aggregation/', type: 'documentation' },
          { title: 'Aggregation Operators', url: 'https://www.mongodb.com/docs/manual/reference/operator/aggregation/', type: 'reference' }
        ]
      }
    ]
  },
  redis: {
    title: 'Redis In-Memory Store',
    description: 'Use Redis for caching and data storage',
    objectives: ['Understand Redis data types', 'Implement caching', 'Use pub/sub', 'Handle sessions'],
    tasks: [
      { 
        title: 'Redis Fundamentals', 
        description: 'Learn Redis data structures', 
        type: 'reading',
        requirements: [
          'Understand Redis as an in-memory data store',
          'Learn Redis data types (strings, lists, sets, hashes, sorted sets)',
          'Master basic Redis commands (GET, SET, DEL, EXPIRE)',
          'Understand Redis persistence options (RDB, AOF)',
          'Set up Redis locally or use a cloud service'
        ],
        resources: [
          { title: 'Redis Documentation', url: 'https://redis.io/docs/', type: 'documentation' },
          { title: 'Redis Tutorial', url: 'https://redis.io/docs/getting-started/', type: 'tutorial' }
        ]
      },
      { 
        title: 'Caching Strategies', 
        description: 'Implement effective caching', 
        type: 'exercise',
        requirements: [
          'Implement cache-aside pattern',
          'Set up TTL (Time To Live) for cache entries',
          'Handle cache invalidation strategies',
          'Implement session storage with Redis',
          'Use Redis pub/sub for real-time messaging'
        ],
        resources: [
          { title: 'Redis Caching', url: 'https://redis.io/docs/manual/client-side-caching/', type: 'documentation' },
          { title: 'Redis Pub/Sub', url: 'https://redis.io/docs/manual/pubsub/', type: 'documentation' }
        ]
      }
    ]
  }
}

// Helper function to map resource type strings to LearningResource type
function mapResourceType(type: string): LearningResource['type'] {
  switch (type.toLowerCase()) {
    case 'documentation':
    case 'docs':
      return 'documentation'
    case 'tutorial':
      return 'tutorial'
    case 'video':
      return 'video'
    case 'article':
      return 'article'
    case 'example':
      return 'example'
    case 'reference':
      return 'reference'
    default:
      return 'documentation'
  }
}

// Generate default requirements based on task type and technology
function generateDefaultRequirements(title: string, description: string, type: string, tech: string): string[] {
  const baseRequirements: string[] = []
  
  switch (type) {
    case 'reading':
      baseRequirements.push(
        `Read and understand the core concepts of ${title}`,
        `Take notes on key terminology and definitions`,
        `Identify how ${title} relates to ${tech} development`,
        `Review any code examples provided in the documentation`,
        `Be prepared to explain the concepts in your own words`
      )
      break
    case 'exercise':
      baseRequirements.push(
        `Complete the coding exercise for ${title}`,
        `Ensure your code follows ${tech} best practices`,
        `Test your solution with different inputs`,
        `Handle edge cases and error conditions`,
        `Refactor your code for readability and maintainability`
      )
      break
    case 'project':
      baseRequirements.push(
        `Plan your project structure before coding`,
        `Implement the core functionality described in ${title}`,
        `Write clean, well-documented code`,
        `Test your project thoroughly`,
        `Consider scalability and performance`,
        `Document your project with a README file`
      )
      break
    case 'quiz':
      baseRequirements.push(
        `Review the material covered in ${title}`,
        `Answer all questions to the best of your ability`,
        `Take note of any questions you found challenging`,
        `Review incorrect answers to understand the concepts better`
      )
      break
    case 'video':
      baseRequirements.push(
        `Watch the video on ${title} completely`,
        `Take notes on key concepts and demonstrations`,
        `Pause and practice along with any coding examples`,
        `Review sections you found confusing`
      )
      break
    default:
      baseRequirements.push(
        `Complete the ${type} on ${title}`,
        `Understand the key concepts presented`,
        `Apply what you learned to ${tech} development`
      )
  }
  
  return baseRequirements
}

// Generate default resources based on technology
function generateDefaultResources(title: string, tech: string, taskIndex: number, moduleIndex: number): LearningResource[] {
  const now = new Date().toISOString()
  const techLower = tech.toLowerCase()
  
  // Common documentation URLs for popular technologies
  const docUrls: Record<string, string> = {
    javascript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    typescript: 'https://www.typescriptlang.org/docs/',
    react: 'https://react.dev/learn',
    vue: 'https://vuejs.org/guide/',
    angular: 'https://angular.io/docs',
    nodejs: 'https://nodejs.org/en/docs/',
    python: 'https://docs.python.org/3/',
    java: 'https://docs.oracle.com/javase/tutorial/',
    go: 'https://go.dev/doc/',
    rust: 'https://doc.rust-lang.org/book/',
    docker: 'https://docs.docker.com/',
    kubernetes: 'https://kubernetes.io/docs/',
    aws: 'https://docs.aws.amazon.com/',
    postgresql: 'https://www.postgresql.org/docs/',
    mongodb: 'https://www.mongodb.com/docs/',
    redis: 'https://redis.io/docs/'
  }
  
  const baseUrl = docUrls[techLower] || `https://www.google.com/search?q=${encodeURIComponent(tech + ' ' + title + ' tutorial')}`
  
  return [
    {
      id: `resource-${moduleIndex + 1}-${taskIndex + 1}-1`,
      title: `${tech} Official Documentation`,
      description: `Official documentation for ${title}`,
      type: 'documentation',
      url: baseUrl,
      difficulty: 'intermediate',
      estimatedTimeMinutes: 20,
      tags: [techLower, 'documentation'],
      verified: true,
      createdAt: now
    },
    {
      id: `resource-${moduleIndex + 1}-${taskIndex + 1}-2`,
      title: `${title} Tutorial`,
      description: `Step-by-step tutorial for ${title}`,
      type: 'tutorial',
      url: `https://www.google.com/search?q=${encodeURIComponent(tech + ' ' + title + ' tutorial')}`,
      difficulty: 'beginner',
      estimatedTimeMinutes: 30,
      tags: [techLower, 'tutorial'],
      verified: false,
      createdAt: now
    }
  ]
}

// Generate a learning path based on user's selected tech stack and goals
function generateDynamicLearningPath(techStack: string[], goals: string[], userId: string): LearningPath {
  const now = new Date().toISOString()
  const modules: LearningModule[] = []
  
  // Create modules based on selected tech stack
  techStack.forEach((tech, index) => {
    const techKey = tech.toLowerCase().replace(/[^a-z0-9]/g, '')
    const template = TECH_MODULE_TEMPLATES[techKey]
    
    if (template) {
      const moduleId = `module-${index + 1}`
      const tasks: LearningTask[] = template.tasks.map((task, taskIndex) => {
        // Use requirements from template if available, otherwise generate meaningful defaults
        const taskRequirements = task.requirements && task.requirements.length > 0 
          ? task.requirements 
          : generateDefaultRequirements(task.title, task.description, task.type, tech)
        
        // Use resources from template if available, otherwise generate defaults
        const taskResources = task.resources && task.resources.length > 0
          ? task.resources.map((r, rIndex) => ({
              id: `resource-${index + 1}-${taskIndex + 1}-${rIndex + 1}`,
              title: r.title,
              description: `${r.type} resource for ${task.title}`,
              type: mapResourceType(r.type),
              url: r.url,
              difficulty: taskIndex === 0 ? 'beginner' as const : taskIndex < template.tasks.length - 1 ? 'intermediate' as const : 'advanced' as const,
              estimatedTimeMinutes: 15,
              tags: [tech.toLowerCase(), task.type],
              verified: true,
              createdAt: now
            }))
          : generateDefaultResources(task.title, tech, taskIndex, index)
        
        return {
          id: `task-${index + 1}-${taskIndex + 1}`,
          moduleId,
          title: task.title,
          description: task.description,
          type: task.type,
          status: 'not_started' as const,
          difficulty: taskIndex === 0 ? 'easy' as const : taskIndex < template.tasks.length - 1 ? 'medium' as const : 'hard' as const,
          estimatedTimeMinutes: task.type === 'reading' ? 30 : task.type === 'exercise' ? 45 : 90,
          points: task.type === 'reading' ? 50 : task.type === 'exercise' ? 75 : 150,
          order: taskIndex + 1,
          requirements: taskRequirements,
          resources: taskResources,
          createdAt: now,
          updatedAt: now
        }
      })

      modules.push({
        id: moduleId,
        title: template.title,
        description: template.description,
        status: index === 0 ? 'current' : index === 1 ? 'upcoming' : 'locked',
        progress: 0,
        estimatedTimeMinutes: tasks.reduce((sum, t) => sum + t.estimatedTimeMinutes, 0),
        difficultyLevel: Math.min(10, index + 2),
        prerequisites: index > 0 ? [`module-${index}`] : [],
        learningObjectives: template.objectives,
        tasks,
        resources: [],
        order: index + 1,
        createdAt: now,
        updatedAt: now
      })
    } else {
      // Generic module for unknown tech
      const moduleId = `module-${index + 1}`
      modules.push({
        id: moduleId,
        title: `${tech} Fundamentals`,
        description: `Learn the core concepts of ${tech}`,
        status: index === 0 ? 'current' : index === 1 ? 'upcoming' : 'locked',
        progress: 0,
        estimatedTimeMinutes: 180,
        difficultyLevel: Math.min(10, index + 2),
        prerequisites: index > 0 ? [`module-${index}`] : [],
        learningObjectives: [`Understand ${tech} basics`, `Build projects with ${tech}`, `Apply best practices`],
        tasks: [
          {
            id: `task-${index + 1}-1`,
            moduleId,
            title: `Introduction to ${tech}`,
            description: `Learn the fundamentals of ${tech}`,
            type: 'reading',
            status: 'not_started',
            difficulty: 'easy',
            estimatedTimeMinutes: 30,
            points: 50,
            order: 1,
            requirements: generateDefaultRequirements(`Introduction to ${tech}`, `Learn the fundamentals of ${tech}`, 'reading', tech),
            resources: generateDefaultResources(`Introduction to ${tech}`, tech, 0, index),
            createdAt: now,
            updatedAt: now
          },
          {
            id: `task-${index + 1}-2`,
            moduleId,
            title: `${tech} Practice`,
            description: `Apply your ${tech} knowledge`,
            type: 'exercise',
            status: 'not_started',
            difficulty: 'medium',
            estimatedTimeMinutes: 45,
            points: 75,
            order: 2,
            requirements: generateDefaultRequirements(`${tech} Practice`, `Apply your ${tech} knowledge`, 'exercise', tech),
            resources: generateDefaultResources(`${tech} Practice`, tech, 1, index),
            createdAt: now,
            updatedAt: now
          }
        ],
        resources: [],
        order: index + 1,
        createdAt: now,
        updatedAt: now
      })
    }
  })

  // If no tech stack selected, create modules based on goals
  if (modules.length === 0 && goals.length > 0) {
    goals.forEach((goal, index) => {
      const moduleId = `module-${index + 1}`
      modules.push({
        id: moduleId,
        title: goal,
        description: `Learn and master ${goal}`,
        status: index === 0 ? 'current' : index === 1 ? 'upcoming' : 'locked',
        progress: 0,
        estimatedTimeMinutes: 180,
        difficultyLevel: Math.min(10, index + 2),
        prerequisites: index > 0 ? [`module-${index}`] : [],
        learningObjectives: [`Understand ${goal}`, `Apply ${goal} concepts`, `Build projects`],
        tasks: [
          {
            id: `task-${index + 1}-1`,
            moduleId,
            title: `Getting Started with ${goal}`,
            description: `Introduction to ${goal}`,
            type: 'reading',
            status: 'not_started',
            difficulty: 'easy',
            estimatedTimeMinutes: 30,
            points: 50,
            order: 1,
            requirements: generateDefaultRequirements(`Getting Started with ${goal}`, `Introduction to ${goal}`, 'reading', goal),
            resources: generateDefaultResources(`Getting Started with ${goal}`, goal, 0, index),
            createdAt: now,
            updatedAt: now
          }
        ],
        resources: [],
        order: index + 1,
        createdAt: now,
        updatedAt: now
      })
    })
  }

  const totalEstimatedMinutes = modules.reduce((sum, m) => sum + m.estimatedTimeMinutes, 0)
  const title = techStack.length > 0 
    ? `${techStack.slice(0, 2).join(' & ')}${techStack.length > 2 ? ' and more' : ''} Learning Path`
    : goals.length > 0 
      ? `${goals[0]} Learning Path`
      : 'Your Learning Path'

  return {
    id: `curriculum-${Date.now()}`,
    userId,
    title,
    description: `Personalized learning path based on your selected technologies and goals`,
    status: 'active',
    totalModules: modules.length,
    completedModules: 0,
    estimatedHours: Math.ceil(totalEstimatedMinutes / 60),
    modules,
    createdAt: now,
    updatedAt: now
  }
}

// Get learning path from localStorage (created during onboarding)
function getLearningPathFromLocalStorage(): LearningPath | null {
  try {
    const curriculumStr = localStorage.getItem('current_curriculum')
    const techStackStr = localStorage.getItem('user_tech_stack')
    const goalsStr = localStorage.getItem('user_goals')
    
    // If we have a stored curriculum, transform it to LearningPath format
    if (curriculumStr) {
      const curriculum = JSON.parse(curriculumStr)
      const techStack = techStackStr ? JSON.parse(techStackStr) : []
      const goals = goalsStr ? JSON.parse(goalsStr) : []
      
      // Check if the stored curriculum has modules with proper structure
      if (curriculum.modules && curriculum.modules.length > 0) {
        // Transform stored curriculum to LearningPath format
        return transformStoredCurriculumToLearningPath(curriculum, techStack, goals)
      }
      
      // If curriculum doesn't have proper modules, generate from tech stack
      if (techStack.length > 0 || goals.length > 0) {
        return generateDynamicLearningPath(techStack, goals, curriculum.user_id || 'user')
      }
    }
    
    // If we have tech stack but no curriculum, generate a new learning path
    if (techStackStr || goalsStr) {
      const techStack = techStackStr ? JSON.parse(techStackStr) : []
      const goals = goalsStr ? JSON.parse(goalsStr) : []
      if (techStack.length > 0 || goals.length > 0) {
        return generateDynamicLearningPath(techStack, goals, 'user')
      }
    }
    
    return null
  } catch (error) {
    console.warn('Failed to parse localStorage data:', error)
    return null
  }
}

// Transform stored curriculum from onboarding to LearningPath format
function transformStoredCurriculumToLearningPath(curriculum: any, techStack: string[], goals: string[]): LearningPath {
  const now = new Date().toISOString()
  
  // Helper to find matching template for a module based on title or tech stack
  const findTemplateForModule = (moduleTitle: string, moduleIndex: number): { template: typeof TECH_MODULE_TEMPLATES[string] | null, tech: string } => {
    const titleLower = moduleTitle.toLowerCase()
    
    // First, try to match by module title
    for (const [techKey, template] of Object.entries(TECH_MODULE_TEMPLATES)) {
      if (titleLower.includes(techKey) || template.title.toLowerCase().includes(titleLower.split(' ')[0])) {
        return { template, tech: techKey }
      }
    }
    
    // Then, try to match by tech stack order
    if (techStack.length > moduleIndex) {
      const tech = techStack[moduleIndex].toLowerCase().replace(/[^a-z0-9]/g, '')
      const template = TECH_MODULE_TEMPLATES[tech]
      if (template) {
        return { template, tech }
      }
    }
    
    // Try any tech from the stack
    for (const tech of techStack) {
      const techKey = tech.toLowerCase().replace(/[^a-z0-9]/g, '')
      const template = TECH_MODULE_TEMPLATES[techKey]
      if (template) {
        return { template, tech: techKey }
      }
    }
    
    return { template: null, tech: techStack[0] || 'programming' }
  }
  
  // Helper to find matching task template
  const findTaskTemplate = (taskTitle: string, template: typeof TECH_MODULE_TEMPLATES[string] | null): typeof TECH_MODULE_TEMPLATES[string]['tasks'][0] | null => {
    if (!template) return null
    
    const titleLower = taskTitle.toLowerCase()
    for (const taskTemplate of template.tasks) {
      if (titleLower.includes(taskTemplate.title.toLowerCase().split(' ')[0]) ||
          taskTemplate.title.toLowerCase().includes(titleLower.split(' ')[0])) {
        return taskTemplate
      }
    }
    return null
  }
  
  // If curriculum has modules, use them
  const modules: LearningModule[] = (curriculum.modules || []).map((module: any, index: number) => {
    const moduleId = module.id || `module-${index + 1}`
    const { template: moduleTemplate, tech } = findTemplateForModule(module.title || '', index)
    
    const tasks: LearningTask[] = (module.tasks || []).map((task: any, taskIndex: number) => {
      const taskType = mapTaskType(task.type || 'lesson')
      const taskTitle = task.title || `Task ${taskIndex + 1}`
      const taskDescription = task.description || ''
      
      // Try to find matching task template
      const taskTemplate = findTaskTemplate(taskTitle, moduleTemplate)
      
      // Get requirements: from task template, or generate defaults
      let requirements: string[] = []
      if (taskTemplate && taskTemplate.requirements && taskTemplate.requirements.length > 0) {
        requirements = taskTemplate.requirements
      } else if (task.requirements && task.requirements.length > 0) {
        requirements = task.requirements
      } else {
        requirements = generateDefaultRequirements(taskTitle, taskDescription, taskType, tech)
      }
      
      // Get resources: from task template, or generate defaults
      let resources: LearningResource[] = []
      if (taskTemplate && taskTemplate.resources && taskTemplate.resources.length > 0) {
        resources = taskTemplate.resources.map((res, resIndex) => ({
          id: `resource-${index + 1}-${taskIndex + 1}-${resIndex + 1}`,
          title: res.title,
          description: `Resource for ${taskTitle}`,
          type: mapResourceType(res.type),
          url: res.url,
          difficulty: 'intermediate' as const,
          estimatedTimeMinutes: 20,
          tags: [tech, res.type],
          verified: true,
          createdAt: now
        }))
      } else if (task.resources && task.resources.length > 0) {
        resources = task.resources
      } else {
        resources = generateDefaultResources(taskTitle, tech, taskIndex, index)
      }
      
      return {
        id: task.id || `task-${index}-${taskIndex}`,
        moduleId,
        title: taskTitle,
        description: taskDescription,
        type: taskType,
        status: task.status === 'completed' ? 'completed' : 'not_started' as const,
        difficulty: 'medium' as const,
        estimatedTimeMinutes: task.estimated_minutes || 30,
        points: 50,
        order: taskIndex + 1,
        requirements,
        resources,
        createdAt: now,
        updatedAt: now
      }
    })

    // Get module resources from template or generate defaults
    let moduleResources: LearningResource[] = []
    if (moduleTemplate) {
      moduleResources = generateDefaultResources(module.title || moduleTemplate.title, tech, 0, index)
    }

    return {
      id: moduleId,
      title: module.title || `Module ${index + 1}`,
      description: module.description || (moduleTemplate ? moduleTemplate.description : ''),
      status: index === 0 ? 'current' : index === 1 ? 'upcoming' : 'locked' as const,
      progress: module.progress || 0,
      estimatedTimeMinutes: module.estimated_hours ? module.estimated_hours * 60 : 180,
      difficultyLevel: Math.min(10, index + 2),
      prerequisites: index > 0 ? [`module-${index}`] : [],
      learningObjectives: module.learning_objectives || (moduleTemplate ? moduleTemplate.objectives : []),
      tasks,
      resources: moduleResources,
      order: index + 1,
      createdAt: curriculum.created_at || now,
      updatedAt: curriculum.updated_at || now
    }
  })

  // If no modules from curriculum, generate from tech stack
  if (modules.length === 0 && (techStack.length > 0 || goals.length > 0)) {
    return generateDynamicLearningPath(techStack, goals, curriculum.user_id || 'user')
  }

  return {
    id: curriculum.id || `curriculum-${Date.now()}`,
    userId: curriculum.user_id || 'user',
    title: curriculum.title || 'Your Learning Path',
    description: curriculum.goal_description || curriculum.description || 'Personalized learning path',
    status: curriculum.status || 'active',
    totalModules: modules.length,
    completedModules: curriculum.modules_completed || 0,
    estimatedHours: curriculum.estimated_hours || Math.ceil(modules.reduce((sum, m) => sum + m.estimatedTimeMinutes, 0) / 60),
    modules,
    createdAt: curriculum.created_at || now,
    updatedAt: curriculum.updated_at || now
  }
}

// Helper to map task types
function mapTaskType(type: string): LearningTask['type'] {
  switch (type.toLowerCase()) {
    case 'lesson':
    case 'read':
    case 'reading':
      return 'reading'
    case 'exercise':
    case 'coding':
    case 'code':
      return 'exercise'
    case 'project':
      return 'project'
    case 'quiz':
      return 'quiz'
    case 'video':
    case 'watch':
      return 'video'
    default:
      return 'reading'
  }
}

// Default empty learning path for users who haven't completed onboarding
function getEmptyLearningPath(userId: string): LearningPath {
  const now = new Date().toISOString()
  return {
    id: 'empty-curriculum',
    userId,
    title: 'Start Your Learning Journey',
    description: 'Complete the onboarding to get your personalized learning path',
    status: 'draft',
    totalModules: 0,
    completedModules: 0,
    estimatedHours: 0,
    modules: [],
    createdAt: now,
    updatedAt: now
  }
}

// Generate progress stats based on actual learning path progress
function generateProgressStats(learningPath: LearningPath): ProgressStats {
  const totalTasks = learningPath.modules.reduce((sum, m) => sum + m.tasks.length, 0)
  const completedTasks = learningPath.modules.reduce(
    (sum, m) => sum + m.tasks.filter(t => t.status === 'completed').length, 
    0
  )
  const totalPoints = totalTasks * 50 // Estimate 50 points per task
  const earnedPoints = completedTasks * 50
  
  return {
    totalTasks,
    completedTasks,
    totalPoints,
    earnedPoints,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: completedTasks > 0 ? 85 : 0,
    timeSpentMinutes: 0,
    lastActivityAt: new Date().toISOString()
  }
}

export class LearningPathService {
  // Get user's learning path with enhanced API integration
  async getLearningPath(userId?: string): Promise<LearningPath> {
    try {
      const response = await api.get<CurriculumResponse>('/api/v1/curriculum', {
        params: userId ? { user_id: userId } : {}
      })
      
      // Transform API response to LearningPath format
      return this.transformCurriculumToLearningPath(response.data)
    } catch (error) {
      console.warn('Failed to fetch learning path from API, checking localStorage:', error)
      
      // First, try to get learning path from localStorage (created during onboarding)
      const localLearningPath = getLearningPathFromLocalStorage()
      if (localLearningPath) {
        console.log('Using learning path from localStorage')
        return localLearningPath
      }
      
      // If no localStorage data, return empty learning path for new users
      console.log('No learning path found, returning empty path')
      return getEmptyLearningPath(userId || 'user')
    }
  }

  // Transform curriculum API response to learning path format
  private transformCurriculumToLearningPath(curriculum: CurriculumResponse): LearningPath {
    const modules: LearningModule[] = curriculum.modules.map((module, index) => ({
      id: module.id,
      title: module.title,
      description: module.summary,
      status: this.determineModuleStatus(module, curriculum.current_module_index, index),
      progress: module.progress_percentage,
      estimatedTimeMinutes: module.estimated_minutes,
      difficultyLevel: Math.min(10, Math.max(1, Math.floor(index / 2) + 1)), // Estimate difficulty
      prerequisites: index > 0 ? [curriculum.modules[index - 1].id] : [],
      learningObjectives: module.learning_objectives,
      tasks: module.tasks.map(task => this.transformTaskResponse(task)),
      resources: [], // Will be populated from separate API call
      order: module.order_index,
      createdAt: curriculum.created_at,
      updatedAt: curriculum.updated_at || curriculum.created_at
    }))

    return {
      id: curriculum.id,
      userId: curriculum.user_id,
      title: curriculum.title,
      description: curriculum.goal_description,
      status: curriculum.status,
      totalModules: curriculum.total_modules,
      completedModules: curriculum.modules_completed,
      estimatedHours: curriculum.estimated_hours || 0,
      modules,
      createdAt: curriculum.created_at,
      updatedAt: curriculum.updated_at || curriculum.created_at
    }
  }

  // Determine module status based on current progress
  private determineModuleStatus(
    module: ModuleResponse, 
    currentModuleIndex: number, 
    moduleIndex: number
  ): LearningModule['status'] {
    if (module.progress_percentage === 100) {
      return 'completed'
    } else if (moduleIndex === currentModuleIndex) {
      return 'current'
    } else if (moduleIndex < currentModuleIndex) {
      return 'completed' // Should be completed if we're past it
    } else if (moduleIndex === currentModuleIndex + 1) {
      return 'upcoming'
    } else {
      return 'locked'
    }
  }

  // Transform task API response to learning task format
  private transformTaskResponse(task: TaskResponse): LearningTask {
    return {
      id: task.id,
      moduleId: task.module_id,
      title: task.description.split('.')[0] || task.description, // Use first sentence as title
      description: task.description,
      type: this.mapTaskType(task.task_type),
      status: task.is_completed ? 'completed' : 'not_started',
      difficulty: 'medium', // Default difficulty
      estimatedTimeMinutes: task.estimated_minutes,
      points: Math.max(10, Math.floor(task.estimated_minutes / 5) * 10), // Estimate points
      order: task.day_offset,
      requirements: [task.completion_criteria],
      resources: task.resources.map(url => ({
        id: `resource-${Math.random().toString(36).substring(2, 11)}`,
        title: this.extractTitleFromUrl(url),
        description: 'Learning resource',
        type: this.inferResourceType(url),
        url,
        difficulty: 'intermediate' as const,
        estimatedTimeMinutes: 15,
        tags: [],
        verified: true,
        createdAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Map API task type to learning task type
  private mapTaskType(apiType: string): LearningTask['type'] {
    switch (apiType.toUpperCase()) {
      case 'CODE':
        return 'exercise'
      case 'READ':
        return 'reading'
      case 'WATCH':
        return 'video'
      case 'QUIZ':
        return 'quiz'
      default:
        return 'reading'
    }
  }

  // Infer resource type from URL
  private inferResourceType(url: string): any {
    if (url.includes('youtube.com') || url.includes('vimeo.com')) {
      return 'video'
    } else if (url.includes('github.com')) {
      return 'example'
    } else if (url.includes('docs.') || url.includes('documentation')) {
      return 'documentation'
    } else {
      return 'article'
    }
  }

  // Extract title from URL
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const segments = pathname.split('/').filter(Boolean)
      return segments[segments.length - 1]?.replace(/[-_]/g, ' ') || 'Resource'
    } catch {
      return 'Learning Resource'
    }
  }

  // Get all modules for a learning path with enhanced data
  async getModules(curriculumId: string): Promise<LearningModule[]> {
    try {
      const response = await api.get<CurriculumResponse>(`/api/v1/curriculum/${curriculumId}`)
      return this.transformCurriculumToLearningPath(response.data).modules
    } catch (error) {
      console.warn('Failed to fetch modules from API, checking localStorage:', error)
      const localLearningPath = getLearningPathFromLocalStorage()
      return localLearningPath?.modules || []
    }
  }

  // Get tasks for a specific module with detailed information
  async getModuleTasks(moduleId: string): Promise<LearningTask[]> {
    try {
      const response = await api.get<TaskResponse[]>(`/api/v1/tasks/module/${moduleId}`)
      return response.data.map(task => this.transformTaskResponse(task))
    } catch (error) {
      console.warn('Failed to fetch module tasks from API, checking localStorage:', error)
      const localLearningPath = getLearningPathFromLocalStorage()
      const module = localLearningPath?.modules.find(m => m.id === moduleId)
      return module?.tasks || []
    }
  }

  // Get user's progress statistics with real-time data
  async getProgressStats(userId?: string): Promise<ProgressStats> {
    try {
      interface ProgressStatsResponse {
        current_streak?: number
        longest_streak?: number
        average_score?: number
        time_spent_minutes?: number
        last_activity_at?: string
      }

      const [progressResponse, curriculumResponse] = await Promise.all([
        api.get<ProgressStatsResponse>('/api/v1/progress/stats', {
          params: userId ? { user_id: userId } : {}
        }),
        api.get<CurriculumResponse>('/api/v1/curriculum', {
          params: userId ? { user_id: userId } : {}
        })
      ])

      const curriculum = curriculumResponse.data
      const progressData = progressResponse.data
      const totalTasks = curriculum.modules.reduce((sum, module) => sum + module.total_tasks, 0)
      const completedTasks = curriculum.modules.reduce((sum, module) => sum + module.tasks_completed, 0)
      const totalPoints = totalTasks * 50 // Estimate 50 points per task
      const earnedPoints = completedTasks * 50

      return {
        totalTasks,
        completedTasks,
        totalPoints,
        earnedPoints,
        currentStreak: progressData.current_streak || 0,
        longestStreak: progressData.longest_streak || 0,
        averageScore: progressData.average_score || 0,
        timeSpentMinutes: progressData.time_spent_minutes || 0,
        lastActivityAt: progressData.last_activity_at || new Date().toISOString()
      }
    } catch (error) {
      console.warn('Failed to fetch progress stats from API, using localStorage data:', error)
      // Generate stats based on localStorage learning path
      const localLearningPath = getLearningPathFromLocalStorage()
      if (localLearningPath) {
        return generateProgressStats(localLearningPath)
      }
      // Return zeros for new users
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPoints: 0,
        earnedPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageScore: 0,
        timeSpentMinutes: 0,
        lastActivityAt: new Date().toISOString()
      }
    }
  }

  // Get learning path visualization data with dependency mapping
  async getLearningPathVisualization(_curriculumId?: string): Promise<LearningPathVisualization> {
    try {
      const curriculum = await this.getLearningPath()
      
      return {
        modules: curriculum.modules,
        dependencies: curriculum.modules.map(module => ({
          moduleId: module.id,
          dependsOn: module.prerequisites,
          unlocks: curriculum.modules
            .filter(m => m.prerequisites.includes(module.id))
            .map(m => m.id)
        })),
        currentModule: curriculum.modules.find(m => m.status === 'current')?.id,
        completionRate: curriculum.totalModules > 0 
          ? (curriculum.completedModules / curriculum.totalModules) * 100 
          : 0,
        estimatedCompletion: this.calculateEstimatedCompletion(curriculum)
      }
    } catch (error) {
      console.warn('Failed to fetch visualization data:', error)
      const localLearningPath = getLearningPathFromLocalStorage()
      if (localLearningPath) {
        return {
          modules: localLearningPath.modules,
          dependencies: localLearningPath.modules.map(module => ({
            moduleId: module.id,
            dependsOn: module.prerequisites,
            unlocks: localLearningPath.modules
              .filter(m => m.prerequisites.includes(module.id))
              .map(m => m.id)
          })),
          currentModule: localLearningPath.modules.find(m => m.status === 'current')?.id,
          completionRate: localLearningPath.totalModules > 0 
            ? (localLearningPath.completedModules / localLearningPath.totalModules) * 100 
            : 0,
          estimatedCompletion: this.calculateEstimatedCompletion(localLearningPath)
        }
      }
      // Return empty visualization for new users
      return {
        modules: [],
        dependencies: [],
        currentModule: undefined,
        completionRate: 0,
        estimatedCompletion: new Date().toISOString()
      }
    }
  }

  // Calculate estimated completion date
  private calculateEstimatedCompletion(curriculum: LearningPath): string {
    const remainingModules = curriculum.modules.filter(m => m.status !== 'completed')
    const totalRemainingMinutes = remainingModules.reduce((sum, module) => {
      const moduleRemaining = module.estimatedTimeMinutes * (1 - module.progress / 100)
      return sum + moduleRemaining
    }, 0)
    
    const hoursPerWeek = 10 // Default assumption
    const weeksRemaining = Math.ceil(totalRemainingMinutes / 60 / hoursPerWeek)
    
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7))
    
    return completionDate.toISOString()
  }

  // Update module progress with real-time sync
  async updateModuleProgress(moduleId: string, progress: number): Promise<void> {
    await api.patch(`/api/v1/progress/module/${moduleId}`, { progress })
  }

  // Mark task as completed with progress tracking
  async completeTask(taskId: string): Promise<void> {
    try {
      await api.post(`/api/v1/tasks/${taskId}/complete`)
    } catch (error) {
      console.warn('Failed to complete task via API (demo mode):', error)
      // In demo mode, just log the action
    }
  }

  // Submit task solution with enhanced feedback
  async submitTask(taskId: string, submission: { code?: string; answers?: Record<string, any> }): Promise<void> {
    try {
      await api.post(`/api/v1/submissions`, {
        task_id: taskId,
        ...submission
      })
    } catch (error) {
      console.warn('Failed to submit task via API (demo mode):', error)
      // In demo mode, just log the action
    }
  }

  // Get task submission history with detailed results
  async getTaskSubmissions(taskId: string): Promise<TaskSubmission[]> {
    try {
      const response = await api.get<TaskSubmission[]>(`/api/v1/submissions/task/${taskId}`)
      return response.data || []
    } catch (error) {
      console.warn('Failed to fetch task submissions (demo mode):', error)
      return []
    }
  }

  // Start a task with progress tracking
  async startTask(taskId: string): Promise<void> {
    try {
      await api.post(`/api/v1/tasks/${taskId}/start`)
    } catch (error) {
      console.warn('Failed to start task via API (demo mode):', error)
      // In demo mode, just log the action
    }
  }

  // Get next recommended task with AI-powered suggestions
  async getNextTask(userId?: string): Promise<LearningTask | null> {
    try {
      const response = await api.get<TaskResponse | null>('/api/v1/tasks/next', {
        params: userId ? { user_id: userId } : {}
      })
      return response.data ? this.transformTaskResponse(response.data) : null
    } catch (error) {
      console.warn('Failed to fetch next task, checking localStorage:', error)
      // Return the first incomplete task from localStorage learning path
      const localLearningPath = getLearningPathFromLocalStorage()
      if (localLearningPath) {
        for (const module of localLearningPath.modules) {
          const incompleteTask = module.tasks.find(t => t.status !== 'completed')
          if (incompleteTask) return incompleteTask
        }
      }
      return null
    }
  }

  // Get task details with resources and requirements
  async getTaskDetails(taskId: string): Promise<LearningTask> {
    try {
      const response = await api.get<TaskResponse>(`/api/v1/tasks/${taskId}`)
      return this.transformTaskResponse(response.data)
    } catch (error) {
      console.warn('Failed to fetch task details, checking localStorage:', error)
      // Find task in localStorage learning path
      const localLearningPath = getLearningPathFromLocalStorage()
      if (localLearningPath) {
        for (const module of localLearningPath.modules) {
          const task = module.tasks.find(t => t.id === taskId)
          if (task) return task
        }
      }
      throw new Error('Task not found')
    }
  }

  // Get module resources with verification status
  async getModuleResources(moduleId: string): Promise<LearningResource[]> {
    try {
      const response = await api.get<LearningResource[]>(`/api/v1/curriculum/modules/${moduleId}/resources`)
      return response.data || []
    } catch (error) {
      console.warn('Failed to fetch module resources (demo mode):', error)
      return []
    }
  }

  // Real-time progress sync
  async syncProgress(userId?: string): Promise<void> {
    try {
      await api.post('/api/v1/progress/sync', {
        user_id: userId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.warn('Failed to sync progress (demo mode):', error)
      // In demo mode, just log the action
    }
  }

  // Get curriculum analytics for insights
  async getCurriculumAnalytics(curriculumId: string): Promise<Record<string, unknown>> {
    try {
      const response = await api.get<Record<string, unknown>>(`/api/v1/analytics/curriculum/${curriculumId}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch curriculum analytics (demo mode):', error)
      return {
        totalTimeSpent: 180,
        averageSessionLength: 45,
        completionRate: 25,
        strongAreas: ['JavaScript', 'React Basics'],
        areasForImprovement: ['Node.js', 'Databases']
      }
    }
  }
}

export const learningPathService = new LearningPathService()