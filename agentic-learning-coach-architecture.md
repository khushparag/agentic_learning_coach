# Agentic Learning Coach - System Architecture

This document provides a comprehensive architectural overview of the Agentic Learning Coach system using Mermaid diagrams.

## High-Level System Architecture

```mermaid
---
title: Agentic Learning Coach - System Architecture Overview
---
graph TB
    subgraph "Client Layer"
        CLI[CLI Interface]
        WEB[Web Frontend<br/>React/TypeScript]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Gateway Layer"
        FASTAPI[FastAPI REST API<br/>Python]
        AUTH[Authentication<br/>& Authorization]
        RATE[Rate Limiting<br/>& Validation]
    end
    
    subgraph "Orchestration Layer"
        ORCH[Orchestrator Agent<br/>Central Coordinator]
        ROUTER[Intent Router<br/>Message Classification]
        CIRCUIT[Circuit Breaker<br/>Fault Tolerance]
    end
    
    subgraph "Agent Layer - Specialized AI Agents"
        PROF[ProfileAgent<br/>User Modeling]
        CURR[CurriculumPlannerAgent<br/>Learning Path Design]
        RES[ResourcesAgent<br/>Content Discovery]
        EX[ExerciseGeneratorAgent<br/>Practice Creation]
        REV[ReviewerAgent<br/>Code Evaluation]
        PROG[ProgressTracker<br/>Analytics & Adaptation]
    end
    
    subgraph "External Services"
        subgraph "MCP Tools"
            DOCS[Documentation MCP<br/>Resource Discovery]
            CODE_ANALYSIS[Code Analysis MCP<br/>Static Analysis]
        end
        
        RUNNER[Runner API Service<br/>Secure Code Execution]
        LLM[LLM Services<br/>OpenAI/Anthropic]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Transactional Data)]
        QDRANT[(Qdrant Vector DB<br/>Semantic Search)]
        REDIS[(Redis Cache<br/>Session & Performance)]
    end
    
    subgraph "Infrastructure"
        DOCKER[Docker Containers<br/>Code Sandboxing]
        MONITOR[Monitoring<br/>Prometheus/Grafana]
        LOGS[Centralized Logging<br/>Structured Logs]
    end
    
    %% Client connections
    CLI --> FASTAPI
    WEB --> FASTAPI
    API_CLIENT --> FASTAPI
    
    %% API Gateway processing
    FASTAPI --> AUTH
    AUTH --> RATE
    RATE --> ORCH
    
    %% Orchestration flow
    ORCH --> ROUTER
    ROUTER --> CIRCUIT
    CIRCUIT --> PROF
    CIRCUIT --> CURR
    CIRCUIT --> RES
    CIRCUIT --> EX
    CIRCUIT --> REV
    CIRCUIT --> PROG
    
    %% Agent to external services
    RES --> DOCS
    REV --> CODE_ANALYSIS
    REV --> RUNNER
    EX --> LLM
    CURR --> LLM
    
    %% Data access patterns
    PROF --> PG
    CURR --> PG
    PROG --> PG
    REV --> PG
    RES --> QDRANT
    
    %% Caching layer
    FASTAPI --> REDIS
    RES --> REDIS
    
    %% Infrastructure connections
    RUNNER --> DOCKER
    FASTAPI --> MONITOR
    ORCH --> LOGS
    
    %% Styling
    classDef clientLayer fill:#e1f5fe
    classDef apiLayer fill:#f3e5f5
    classDef orchestrationLayer fill:#fff3e0
    classDef agentLayer fill:#e8f5e8
    classDef externalLayer fill:#fce4ec
    classDef dataLayer fill:#f1f8e9
    classDef infraLayer fill:#f5f5f5
    
    class CLI,WEB,API_CLIENT clientLayer
    class FASTAPI,AUTH,RATE apiLayer
    class ORCH,ROUTER,CIRCUIT orchestrationLayer
    class PROF,CURR,RES,EX,REV,PROG agentLayer
    class DOCS,CODE_ANALYSIS,RUNNER,LLM externalLayer
    class PG,QDRANT,REDIS dataLayer
    class DOCKER,MONITOR,LOGS infraLayer
```

## Agent Communication Flow

```mermaid
---
title: Multi-Agent Communication Pattern
---
sequenceDiagram
    participant User
    participant API as FastAPI
    participant Orch as Orchestrator
    participant Router as Intent Router
    participant Prof as ProfileAgent
    participant Curr as CurriculumPlanner
    participant Ex as ExerciseGenerator
    participant DB as PostgreSQL
    
    User->>API: "I want to learn React"
    API->>Orch: Process learning request
    Orch->>Router: Classify intent
    Router-->>Orch: Intent: assess_skill_level
    
    Orch->>Prof: Assess user skill level
    Prof->>DB: Query existing profile
    DB-->>Prof: User profile data
    Prof-->>Orch: Assessment questions
    Orch-->>API: Return questions
    API-->>User: Present skill assessment
    
    User->>API: Submit assessment responses
    API->>Orch: Process responses
    Orch->>Prof: Update skill level
    Prof->>DB: Save updated profile
    Prof-->>Orch: Profile updated
    
    Orch->>Curr: Create learning path
    Curr->>DB: Query curriculum templates
    DB-->>Curr: Template data
    Curr->>DB: Save personalized plan
    Curr-->>Orch: Learning plan created
    
    Orch->>Ex: Generate first exercise
    Ex-->>Orch: Exercise ready
    Orch-->>API: Complete onboarding result
    API-->>User: Show learning dashboard
```

## Data Architecture & Relationships

```mermaid
---
title: Database Schema & Relationships
---
erDiagram
    USERS ||--|| LEARNING_PROFILES : has
    USERS ||--o{ LEARNING_PLANS : creates
    LEARNING_PLANS ||--o{ MODULES : contains
    MODULES ||--o{ TASKS : includes
    TASKS ||--o{ SUBMISSIONS : receives
    SUBMISSIONS ||--|| EVALUATION_RESULTS : generates
    USERS ||--o{ PROGRESS_TRACKING : tracks
    TASKS ||--o{ PROGRESS_TRACKING : monitors
    
    USERS {
        uuid id PK
        string email UK
        string username
        string password_hash
        boolean email_verified
        timestamp created_at
        timestamp updated_at
    }
    
    LEARNING_PROFILES {
        uuid id PK
        uuid user_id FK
        enum skill_level
        jsonb learning_goals
        jsonb time_constraints
        jsonb preferences
        boolean assessment_completed
        timestamp created_at
        timestamp updated_at
    }
    
    LEARNING_PLANS {
        uuid id PK
        uuid user_id FK
        string title
        text description
        enum status
        integer total_topics
        integer completed_topics
        integer estimated_hours
        timestamp created_at
        timestamp updated_at
    }
    
    MODULES {
        uuid id PK
        uuid plan_id FK
        string title
        text description
        integer order_index
        integer difficulty_level
        jsonb prerequisites
        jsonb learning_objectives
        integer estimated_minutes
        timestamp created_at
    }
    
    TASKS {
        uuid id PK
        uuid module_id FK
        string title
        text description
        enum type
        integer difficulty_level
        jsonb instructions
        jsonb test_cases
        text solution_template
        jsonb hints
        integer time_limit_minutes
        timestamp created_at
    }
    
    SUBMISSIONS {
        uuid id PK
        uuid user_id FK
        uuid task_id FK
        text code
        jsonb answers
        enum status
        decimal score
        integer execution_time_ms
        integer memory_used_mb
        timestamp submitted_at
        timestamp evaluated_at
    }
    
    EVALUATION_RESULTS {
        uuid id PK
        uuid submission_id FK
        string agent_type
        boolean passed
        jsonb test_results
        jsonb feedback
        jsonb suggestions
        timestamp created_at
    }
    
    PROGRESS_TRACKING {
        uuid id PK
        uuid user_id FK
        uuid task_id FK
        integer attempts
        integer consecutive_failures
        decimal best_score
        integer time_spent_minutes
        boolean completed
        timestamp completed_at
        timestamp last_attempt_at
        timestamp created_at
    }
```

## Agent Specialization & Responsibilities

```mermaid
---
title: Agent Roles & Capabilities
---
mindmap
  root((Orchestrator Agent))
    ProfileAgent
      Skill Assessment
        Diagnostic Questions
        Level Evaluation
        Progress Analysis
      Goal Management
        Learning Objectives
        Time Constraints
        Preferences
      Profile Persistence
        User Data Storage
        Profile Updates
        History Tracking
    
    CurriculumPlannerAgent
      Path Design
        Module Sequencing
        Difficulty Progression
        Prerequisite Management
      Adaptation Logic
        Performance-based Adjustments
        Difficulty Scaling
        Content Modification
      Template Management
        Curriculum Patterns
        Best Practices
        Industry Standards
    
    ResourcesAgent
      Content Discovery
        Documentation Search
        Tutorial Curation
        Example Collection
      Quality Assessment
        Source Verification
        Relevance Scoring
        Freshness Validation
      Caching Strategy
        Performance Optimization
        Resource Management
        Update Scheduling
    
    ExerciseGeneratorAgent
      Practice Creation
        Coding Challenges
        Interactive Exercises
        Project Templates
      Difficulty Calibration
        Skill-appropriate Tasks
        Progressive Complexity
        Adaptive Challenges
      Test Case Generation
        Validation Logic
        Edge Case Coverage
        Performance Benchmarks
    
    ReviewerAgent
      Code Evaluation
        Syntax Validation
        Logic Assessment
        Best Practice Review
      Feedback Generation
        Specific Suggestions
        Learning Guidance
        Improvement Recommendations
      Security Analysis
        Vulnerability Detection
        Safe Code Practices
        Risk Assessment
    
    ProgressTracker
      Performance Monitoring
        Completion Tracking
        Time Analysis
        Success Patterns
      Adaptation Triggers
        Struggle Detection
        Excellence Recognition
        Intervention Points
      Analytics Generation
        Learning Insights
        Progress Reports
        Trend Analysis
```

## Security & Isolation Architecture

```mermaid
---
title: Security & Code Execution Architecture
---
graph TB
    subgraph "User Input Layer"
        USER[User Code Submission]
        VALIDATE[Input Validation<br/>Malicious Pattern Detection]
        SANITIZE[Code Sanitization<br/>Security Filtering]
    end
    
    subgraph "Execution Environment"
        QUEUE[Execution Queue<br/>Rate Limited]
        RUNNER[Runner API Service<br/>Orchestration Layer]
        
        subgraph "Docker Isolation"
            CONTAINER1[Python Container<br/>Resource Limited]
            CONTAINER2[JavaScript Container<br/>Network Disabled]
            CONTAINER3[Java Container<br/>Read-only FS]
        end
        
        MONITOR[Resource Monitor<br/>CPU/Memory/Time]
        CLEANUP[Container Cleanup<br/>Automatic Removal]
    end
    
    subgraph "Result Processing"
        COLLECT[Output Collection<br/>Stdout/Stderr Capture]
        ANALYZE[Result Analysis<br/>Test Execution]
        FEEDBACK[Feedback Generation<br/>Error Interpretation]
    end
    
    subgraph "Data Security"
        ENCRYPT[Data Encryption<br/>At Rest & Transit]
        AUDIT[Audit Logging<br/>Security Events]
        BACKUP[Secure Backups<br/>Point-in-time Recovery]
    end
    
    USER --> VALIDATE
    VALIDATE --> SANITIZE
    SANITIZE --> QUEUE
    QUEUE --> RUNNER
    
    RUNNER --> CONTAINER1
    RUNNER --> CONTAINER2
    RUNNER --> CONTAINER3
    
    CONTAINER1 --> MONITOR
    CONTAINER2 --> MONITOR
    CONTAINER3 --> MONITOR
    
    MONITOR --> CLEANUP
    CLEANUP --> COLLECT
    COLLECT --> ANALYZE
    ANALYZE --> FEEDBACK
    
    FEEDBACK --> ENCRYPT
    ENCRYPT --> AUDIT
    AUDIT --> BACKUP
    
    %% Security boundaries
    classDef securityBoundary fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef isolationLayer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef dataProtection fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    
    class VALIDATE,SANITIZE securityBoundary
    class CONTAINER1,CONTAINER2,CONTAINER3,MONITOR isolationLayer
    class ENCRYPT,AUDIT,BACKUP dataProtection
```

## Deployment Architecture

```mermaid
---
title: Production Deployment Architecture
---
graph TB
    subgraph "Load Balancer Layer"
        LB[Load Balancer<br/>NGINX/HAProxy]
        SSL[SSL Termination<br/>TLS 1.3]
    end
    
    subgraph "Application Layer"
        API1[FastAPI Instance 1<br/>Auto-scaling]
        API2[FastAPI Instance 2<br/>Auto-scaling]
        API3[FastAPI Instance N<br/>Auto-scaling]
    end
    
    subgraph "Agent Services"
        AGENT_POOL[Agent Service Pool<br/>Kubernetes Pods]
        ORCH_SVC[Orchestrator Service]
        AGENT_SVC[Specialized Agents]
    end
    
    subgraph "External Services"
        RUNNER_CLUSTER[Runner API Cluster<br/>Isolated Execution]
        MCP_SERVICES[MCP Tool Services<br/>Documentation & Analysis]
    end
    
    subgraph "Data Tier"
        PG_PRIMARY[(PostgreSQL Primary<br/>Write Operations)]
        PG_REPLICA[(PostgreSQL Replica<br/>Read Operations)]
        QDRANT_CLUSTER[(Qdrant Cluster<br/>Vector Search)]
        REDIS_CLUSTER[(Redis Cluster<br/>Caching & Sessions)]
    end
    
    subgraph "Infrastructure Services"
        PROMETHEUS[Prometheus<br/>Metrics Collection]
        GRAFANA[Grafana<br/>Monitoring Dashboard]
        ELASTICSEARCH[Elasticsearch<br/>Log Aggregation]
        KIBANA[Kibana<br/>Log Analysis]
    end
    
    subgraph "Security & Backup"
        VAULT[HashiCorp Vault<br/>Secret Management]
        BACKUP_SVC[Backup Service<br/>Automated Backups]
        SECURITY_SCAN[Security Scanner<br/>Vulnerability Assessment]
    end
    
    %% Traffic flow
    LB --> SSL
    SSL --> API1
    SSL --> API2
    SSL --> API3
    
    API1 --> ORCH_SVC
    API2 --> ORCH_SVC
    API3 --> ORCH_SVC
    
    ORCH_SVC --> AGENT_POOL
    AGENT_POOL --> AGENT_SVC
    
    AGENT_SVC --> RUNNER_CLUSTER
    AGENT_SVC --> MCP_SERVICES
    
    %% Data connections
    API1 --> PG_PRIMARY
    API2 --> PG_REPLICA
    API3 --> PG_REPLICA
    
    AGENT_SVC --> QDRANT_CLUSTER
    API1 --> REDIS_CLUSTER
    API2 --> REDIS_CLUSTER
    API3 --> REDIS_CLUSTER
    
    %% Infrastructure monitoring
    API1 --> PROMETHEUS
    AGENT_SVC --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    
    API1 --> ELASTICSEARCH
    AGENT_SVC --> ELASTICSEARCH
    ELASTICSEARCH --> KIBANA
    
    %% Security & backup
    API1 --> VAULT
    AGENT_SVC --> VAULT
    PG_PRIMARY --> BACKUP_SVC
    BACKUP_SVC --> SECURITY_SCAN
    
    %% Styling for deployment tiers
    classDef loadBalancer fill:#e8eaf6
    classDef application fill:#e3f2fd
    classDef services fill:#e0f2f1
    classDef data fill:#fff3e0
    classDef infrastructure fill:#fce4ec
    classDef security fill:#ffebee
    
    class LB,SSL loadBalancer
    class API1,API2,API3 application
    class AGENT_POOL,ORCH_SVC,AGENT_SVC,RUNNER_CLUSTER,MCP_SERVICES services
    class PG_PRIMARY,PG_REPLICA,QDRANT_CLUSTER,REDIS_CLUSTER data
    class PROMETHEUS,GRAFANA,ELASTICSEARCH,KIBANA infrastructure
    class VAULT,BACKUP_SVC,SECURITY_SCAN security
```

## Key Architectural Principles

### 1. **Clean Architecture Boundaries**
- Clear separation between agents, data access, and external services
- Dependency inversion with repository patterns
- Interface-based communication between components

### 2. **Multi-Agent Orchestration**
- Hub-and-spoke pattern with centralized coordination
- Specialized agents with single responsibilities
- Circuit breaker pattern for fault tolerance

### 3. **Security-First Design**
- Sandboxed code execution in isolated containers
- Input validation and sanitization at all entry points
- Comprehensive audit logging and monitoring

### 4. **Scalable Data Architecture**
- PostgreSQL for transactional data with ACID guarantees
- Qdrant for semantic search and resource discovery
- Redis for caching and session management

### 5. **Observability & Monitoring**
- Structured logging with correlation IDs
- Comprehensive metrics collection
- Real-time monitoring and alerting

This architecture provides a robust, scalable, and secure foundation for the Agentic Learning Coach system, enabling personalized learning experiences while maintaining high performance and reliability.