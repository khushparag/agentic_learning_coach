# Observability & Logging

## Structured Logging Standards

### MUST Use Structured Logging
```typescript
interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: {
    userId?: string; // Hashed for privacy
    sessionId?: string;
    agentType?: AgentType;
    correlationId?: string;
    operation?: string;
  };
  metadata?: Record<string, unknown>;
  duration?: number; // milliseconds
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### Agent Operation Logging
```typescript
class AgentLogger {
  async logAgentOperation(
    agentType: AgentType,
    operation: string,
    context: LearningContext,
    result: AgentResult,
    duration: number
  ): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: result.success ? 'info' : 'error',
      message: `Agent operation completed: ${agentType}.${operation}`,
      context: {
        userId: this.hashUserId(context.userId),
        sessionId: context.sessionId,
        agentType,
        correlationId: context.correlationId,
        operation
      },
      metadata: {
        success: result.success,
        skillLevel: context.skillLevel,
        currentTopic: context.currentObjective
      },
      duration,
      error: result.error ? {
        name: result.error.name,
        message: result.error.message,
        code: result.error.code
      } : undefined
    };
    
    await this.logger.log(logEntry);
  }
}
```

### NEVER Log Sensitive Data
```typescript
// ✅ Good: Safe logging
logger.info('Code submission evaluated', {
  userId: hashUserId(userId),
  exerciseId: exerciseId,
  language: submission.language,
  codeLength: submission.code.length,
  passed: result.passed,
  executionTime: result.executionTime
});

// ❌ Bad: Exposes sensitive data
logger.info('Code submission', {
  userId: userId, // Raw user ID
  userEmail: user.email, // PII
  code: submission.code, // User's code
  ipAddress: req.ip // Personal data
});
```

## Performance Monitoring

### MUST Track Key Metrics
```typescript
interface LearningMetrics {
  // Agent Performance
  agentResponseTime: number;
  agentSuccessRate: number;
  agentErrorRate: number;
  
  // Learning Effectiveness
  exerciseCompletionRate: number;
  averageAttemptsPerExercise: number;
  learnerProgressVelocity: number;
  
  // System Performance
  codeExecutionTime: number;
  databaseQueryTime: number;
  vectorSearchTime: number;
  
  // User Experience
  sessionDuration: number;
  feedbackQuality: number;
  learnerSatisfaction: number;
}
```

### Performance Tracking Implementation
```typescript
class PerformanceTracker {
  private metrics = new Map<string, number[]>();
  
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operationName, duration);
      
      logger.info('Operation completed', {
        operation: operationName,
        duration,
        success: true,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Operation failed', {
        operation: operationName,
        duration,
        success: false,
        error: {
          name: error.name,
          message: error.message
        },
        ...context
      });
      
      throw error;
    }
  }
  
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getMetricSummary(name: string): MetricSummary {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }
}
```

## Health Checks & Monitoring

### System Health Endpoints
```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    vectorStore: ServiceHealth;
    codeRunner: ServiceHealth;
    agents: Record<AgentType, ServiceHealth>;
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}
```

### Health Check Implementation
```typescript
class HealthChecker {
  async checkSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkVectorStore(),
      this.checkCodeRunner(),
      this.checkAgents()
    ]);
    
    const [database, vectorStore, codeRunner, agents] = checks.map(
      result => result.status === 'fulfilled' ? result.value : { 
        status: 'down', 
        error: result.reason?.message,
        lastCheck: new Date().toISOString()
      }
    );
    
    const overallStatus = this.determineOverallStatus([
      database.status,
      vectorStore.status,
      codeRunner.status,
      ...Object.values(agents).map(a => a.status)
    ]);
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: { database, vectorStore, codeRunner, agents },
      metrics: await this.getSystemMetrics()
    };
  }
  
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await db.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}
```

## Error Tracking & Alerting

### Error Classification
```typescript
enum ErrorSeverity {
  LOW = 'low',           // Minor issues, self-recovering
  MEDIUM = 'medium',     // Affects single user/session
  HIGH = 'high',         // Affects multiple users
  CRITICAL = 'critical'  // System-wide impact
}

interface ErrorEvent {
  id: string;
  severity: ErrorSeverity;
  category: 'agent_failure' | 'code_execution' | 'database_error' | 'security_incident';
  message: string;
  context: {
    userId?: string;
    agentType?: AgentType;
    operation?: string;
    correlationId?: string;
  };
  stackTrace?: string;
  timestamp: Date;
  resolved: boolean;
}
```

### Alert Conditions
```typescript
class AlertManager {
  private readonly ALERT_THRESHOLDS = {
    error_rate: 0.05,        // 5% error rate
    response_time_p95: 5000, // 5 seconds
    agent_failure_rate: 0.02, // 2% agent failures
    code_execution_timeout: 0.1 // 10% timeout rate
  };
  
  async checkAlertConditions(): Promise<void> {
    const metrics = await this.getRecentMetrics();
    
    // Check error rate
    if (metrics.errorRate > this.ALERT_THRESHOLDS.error_rate) {
      await this.sendAlert({
        severity: ErrorSeverity.HIGH,
        message: `High error rate detected: ${(metrics.errorRate * 100).toFixed(1)}%`,
        category: 'system_performance'
      });
    }
    
    // Check response times
    if (metrics.responseTimeP95 > this.ALERT_THRESHOLDS.response_time_p95) {
      await this.sendAlert({
        severity: ErrorSeverity.MEDIUM,
        message: `Slow response times: P95 = ${metrics.responseTimeP95}ms`,
        category: 'system_performance'
      });
    }
    
    // Check agent health
    for (const [agentType, health] of Object.entries(metrics.agentHealth)) {
      if (health.failureRate > this.ALERT_THRESHOLDS.agent_failure_rate) {
        await this.sendAlert({
          severity: ErrorSeverity.HIGH,
          message: `Agent ${agentType} failure rate: ${(health.failureRate * 100).toFixed(1)}%`,
          category: 'agent_failure'
        });
      }
    }
  }
}
```

## Learning Analytics

### Educational Metrics
```typescript
interface LearningAnalytics {
  learnerProgress: {
    completionRate: number;
    averageScore: number;
    timeToCompletion: number;
    strugglingTopics: string[];
  };
  
  exerciseEffectiveness: {
    passRate: number;
    averageAttempts: number;
    hintsRequested: number;
    timeSpent: number;
  };
  
  curriculumOptimization: {
    topicSequenceEffectiveness: number;
    difficultyProgression: number;
    dropoffPoints: string[];
  };
  
  agentPerformance: {
    feedbackQuality: number;
    responseAccuracy: number;
    adaptationEffectiveness: number;
  };
}
```

### Privacy-Safe Analytics
```typescript
class LearningAnalytics {
  async generateInsights(timeRange: DateRange): Promise<LearningInsights> {
    // Aggregate data without exposing individual learners
    const aggregatedData = await this.getAggregatedMetrics(timeRange);
    
    return {
      totalLearners: aggregatedData.uniqueLearners,
      averageProgress: aggregatedData.avgCompletionRate,
      topStrugglingTopics: aggregatedData.difficultTopics,
      mostEffectiveExercises: aggregatedData.highPerformingExercises,
      
      // No individual user data exposed
      trends: {
        weeklyGrowth: aggregatedData.weeklyGrowthRate,
        retentionRate: aggregatedData.retentionRate,
        satisfactionScore: aggregatedData.avgSatisfaction
      }
    };
  }
  
  private async getAggregatedMetrics(timeRange: DateRange): Promise<AggregatedMetrics> {
    // Use SQL aggregation to avoid loading individual records
    return await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) as unique_learners,
        AVG(completion_rate) as avg_completion_rate,
        -- More aggregations...
      FROM learning_analytics 
      WHERE created_at BETWEEN $1 AND $2
    `, [timeRange.start, timeRange.end]);
  }
}