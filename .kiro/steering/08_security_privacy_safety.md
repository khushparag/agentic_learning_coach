# Security, Privacy & Safety

## Data Protection Requirements

### MUST Protect Learner Privacy
- **No PII in logs**: Never log email addresses, names, or personal identifiers
- **Anonymized analytics**: Use hashed user IDs for metrics and tracking
- **Secure code execution**: All user code runs in sandboxed environments
- **Data retention limits**: Automatically purge old submissions and conversation history

### Authentication & Authorization
```typescript
interface UserSession {
  userId: string; // UUID, never expose sequential IDs
  sessionId: string;
  permissions: Permission[];
  expiresAt: Date;
  createdAt: Date;
}

enum Permission {
  READ_PROFILE = 'read:profile',
  WRITE_PROFILE = 'write:profile',
  SUBMIT_CODE = 'submit:code',
  VIEW_PROGRESS = 'view:progress',
  ADMIN_ACCESS = 'admin:access'
}
```

### MUST Validate All User Input
```typescript
// ✅ Good: Comprehensive validation
const validateCodeSubmission = (submission: unknown): CodeSubmission => {
  const schema = z.object({
    code: z.string()
      .min(1, 'Code cannot be empty')
      .max(50000, 'Code too long')
      .refine(code => !containsMaliciousPatterns(code), 'Potentially unsafe code'),
    language: z.enum(['javascript', 'typescript', 'python', 'java', 'go']),
    exerciseId: z.string().uuid('Invalid exercise ID')
  });
  
  return schema.parse(submission);
};

// ❌ Bad: No validation
const processSubmission = (data: any) => {
  // Direct usage without validation
  executeCode(data.code, data.language);
};
```

## Code Execution Security

### MUST Use Sandboxed Execution
```typescript
interface CodeExecutionConfig {
  timeout: number; // Max 30 seconds
  memoryLimit: number; // Max 512MB
  networkAccess: boolean; // Default false
  fileSystemAccess: 'none' | 'read-only' | 'temp-only';
  allowedModules: string[]; // Whitelist of importable modules
}

const SECURE_EXECUTION_CONFIG: CodeExecutionConfig = {
  timeout: 10000, // 10 seconds
  memoryLimit: 256, // 256MB
  networkAccess: false,
  fileSystemAccess: 'temp-only',
  allowedModules: ['lodash', 'moment', 'uuid'] // Curated safe modules
};
```

### Malicious Code Detection
```typescript
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /require\s*\(\s*['"]child_process['"]\s*\)/i,
  /require\s*\(\s*['"]fs['"]\s*\)/i,
  /process\.exit/i,
  /while\s*\(\s*true\s*\)/i, // Infinite loops
  /__proto__/i,
  /constructor\.constructor/i
];

function containsMaliciousPatterns(code: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(code));
}

function sanitizeCode(code: string): string {
  // Remove potentially dangerous constructs
  return code
    .replace(/console\.log\s*\(\s*process\./g, 'console.log("BLOCKED: process access")')
    .replace(/require\s*\(\s*['"](?!lodash|moment|uuid)['"]/g, 'require("BLOCKED"');
}
```

## Agent Safety Protocols

### MUST Prevent Prompt Injection
```typescript
function sanitizeUserInput(input: string): string {
  // Remove potential prompt injection attempts
  const dangerous = [
    /ignore\s+previous\s+instructions/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /\[INST\]/i,
    /<\|.*?\|>/g
  ];
  
  let sanitized = input;
  dangerous.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });
  
  return sanitized.substring(0, 2000); // Limit length
}
```

### Content Safety Filters
```typescript
interface ContentSafetyResult {
  safe: boolean;
  categories: string[];
  confidence: number;
}

async function checkContentSafety(content: string): Promise<ContentSafetyResult> {
  // Check for inappropriate content in exercises/feedback
  const flaggedCategories = [];
  
  if (containsProfanity(content)) {
    flaggedCategories.push('profanity');
  }
  
  if (containsPersonalInfo(content)) {
    flaggedCategories.push('personal_info');
  }
  
  if (containsHateSpeech(content)) {
    flaggedCategories.push('hate_speech');
  }
  
  return {
    safe: flaggedCategories.length === 0,
    categories: flaggedCategories,
    confidence: 0.95
  };
}
```

## Data Handling Rules

### MUST Encrypt Sensitive Data
```typescript
interface EncryptedField {
  encrypted: string;
  algorithm: 'AES-256-GCM';
  keyId: string;
}

class SecureDataHandler {
  async encryptSensitiveData(data: string): Promise<EncryptedField> {
    const key = await this.getEncryptionKey();
    const encrypted = await encrypt(data, key, 'AES-256-GCM');
    
    return {
      encrypted: encrypted.ciphertext,
      algorithm: 'AES-256-GCM',
      keyId: key.id
    };
  }
  
  async decryptSensitiveData(field: EncryptedField): Promise<string> {
    const key = await this.getEncryptionKey(field.keyId);
    return await decrypt(field.encrypted, key, field.algorithm);
  }
}
```

### Audit Logging
```typescript
interface SecurityEvent {
  eventType: 'code_execution' | 'data_access' | 'auth_failure' | 'suspicious_activity';
  userId?: string;
  sessionId?: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class SecurityAuditor {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to secure audit trail (separate from application logs)
    await this.auditLogger.log({
      ...event,
      userId: event.userId ? this.hashUserId(event.userId) : undefined,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.alertSecurityTeam(event);
    }
  }
  
  private hashUserId(userId: string): string {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }
}
```

## Rate Limiting & Abuse Prevention

### MUST Implement Rate Limits
```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  code_submission: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 submissions per minute
    skipSuccessfulRequests: false
  },
  
  exercise_generation: {
    windowMs: 60 * 1000,
    maxRequests: 5, // 5 new exercises per minute
    skipSuccessfulRequests: true
  },
  
  resource_search: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 searches per minute
    skipSuccessfulRequests: true
  }
};
```

### Abuse Detection
```typescript
class AbuseDetector {
  async detectSuspiciousActivity(userId: string, action: string): Promise<boolean> {
    const recentActions = await this.getRecentActions(userId, action, 300000); // 5 minutes
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      recentActions.length > 100, // Too many actions
      this.hasRepeatedFailures(recentActions, 0.9), // 90% failure rate
      this.hasIdenticalSubmissions(recentActions, 0.8), // 80% identical code
      this.hasRapidFirePattern(recentActions) // Automated behavior
    ];
    
    return suspiciousPatterns.some(Boolean);
  }
  
  private hasRapidFirePattern(actions: Action[]): boolean {
    if (actions.length < 10) return false;
    
    const intervals = actions
      .slice(1)
      .map((action, i) => action.timestamp - actions[i].timestamp);
    
    // Check if most intervals are suspiciously consistent (bot-like)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const consistentIntervals = intervals.filter(
      interval => Math.abs(interval - avgInterval) < 100 // Within 100ms
    );
    
    return consistentIntervals.length / intervals.length > 0.8;
  }
}
```

## Privacy by Design

### Data Minimization
```typescript
// ✅ Good: Minimal data collection
interface LearnerProfile {
  skillLevel: SkillLevel;
  learningGoals: string[];
  timeConstraints: TimeConstraints;
  // No personal identifiers stored here
}

// ❌ Bad: Excessive data collection
interface BadProfile {
  name: string;
  email: string;
  age: number;
  location: string;
  employer: string;
  salary: number; // Not needed for learning!
}
```

### Right to be Forgotten
```typescript
class DataDeletionService {
  async deleteUserData(userId: string): Promise<void> {
    // Delete from all systems
    await Promise.all([
      this.deleteFromPostgres(userId),
      this.deleteFromQdrant(userId),
      this.deleteFromLogs(userId),
      this.deleteFromCache(userId)
    ]);
    
    // Audit the deletion
    await this.auditLogger.log({
      eventType: 'data_deletion',
      userId: this.hashUserId(userId),
      timestamp: new Date()
    });
  }
}