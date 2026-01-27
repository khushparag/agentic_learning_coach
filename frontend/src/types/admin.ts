// =============================================================================
// Admin Types - TypeScript interfaces for system administration
// =============================================================================

export interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
  service: string
  timestamp: string
  version: string
  components: {
    database: ServiceHealth
    redis: ServiceHealth
    runner_service: ServiceHealth
    qdrant: ServiceHealth
  }
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  response_time_ms?: number
  timestamp: string
  error?: string
  database_type?: string
}

export interface SystemMetrics {
  uptime: number
  memory_usage: {
    used: number
    total: number
    percentage: number
  }
  cpu_usage: {
    percentage: number
    load_average: number[]
  }
  disk_usage: {
    used: number
    total: number
    percentage: number
  }
  active_connections: number
  request_rate: number
  error_rate: number
}

export interface UserManagement {
  total_users: number
  active_users: number
  new_users_today: number
  users: AdminUser[]
}

export interface AdminUser {
  id: string
  email: string
  username?: string
  created_at: string
  last_login?: string
  is_active: boolean
  role: UserRole
  profile: {
    skill_level: string
    goals: string[]
    total_exercises: number
    completion_rate: number
  }
}

export interface UserRole {
  id: string
  name: 'admin' | 'moderator' | 'user' | 'premium'
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
}

export interface SystemConfiguration {
  // Service Configuration
  services: {
    api_base_url: string
    runner_service_url: string
    qdrant_url: string
    redis_url: string
  }
  
  // Feature Flags
  features: {
    social_learning: boolean
    gamification: boolean
    real_time_collaboration: boolean
    advanced_analytics: boolean
    experimental_features: boolean
  }
  
  // System Limits
  limits: {
    max_users: number
    max_concurrent_sessions: number
    max_code_execution_time: number
    max_file_upload_size: number
    rate_limit_requests_per_minute: number
  }
  
  // Security Settings
  security: {
    session_timeout_minutes: number
    password_min_length: number
    require_2fa: boolean
    allowed_domains: string[]
    cors_origins: string[]
  }
  
  // Monitoring & Logging
  monitoring: {
    log_level: 'debug' | 'info' | 'warn' | 'error'
    enable_metrics: boolean
    enable_tracing: boolean
    retention_days: number
  }
}

export interface ConfigurationExport {
  timestamp: string
  version: string
  configuration: SystemConfiguration
  user_settings_template: Partial<import('./settings').UserSettings>
  checksum: string
}

export interface ConfigurationImport {
  file: File
  validate_checksum: boolean
  backup_current: boolean
  apply_immediately: boolean
}

export interface AdminDashboardData {
  system_health: SystemHealth
  system_metrics: SystemMetrics
  user_management: UserManagement
  recent_activities: AdminActivity[]
  alerts: SystemAlert[]
}

export interface AdminActivity {
  id: string
  timestamp: string
  user_id?: string
  user_email?: string
  action: string
  resource: string
  details: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

export interface SystemAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'performance' | 'security' | 'error' | 'maintenance'
  title: string
  message: string
  timestamp: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

export interface ServiceDiagnostics {
  service_name: string
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping'
  version: string
  uptime: number
  memory_usage: number
  cpu_usage: number
  last_restart: string
  configuration: Record<string, unknown>
  logs: LogEntry[]
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  context?: Record<string, unknown>
  correlation_id?: string
}

export interface BackupConfiguration {
  auto_backup_enabled: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_retention_days: number
  backup_location: string
  include_user_data: boolean
  include_system_logs: boolean
  compression_enabled: boolean
}

export interface SystemBackup {
  id: string
  timestamp: string
  size_bytes: number
  type: 'manual' | 'scheduled'
  status: 'creating' | 'completed' | 'failed'
  includes: {
    configuration: boolean
    user_data: boolean
    system_logs: boolean
  }
  download_url?: string
  expires_at?: string
}

// Default admin configuration
export const DEFAULT_ADMIN_CONFIG: SystemConfiguration = {
  services: {
    api_base_url: 'http://localhost:8000',
    runner_service_url: 'http://localhost:8001',
    qdrant_url: 'http://localhost:6333',
    redis_url: 'redis://localhost:6379',
  },
  features: {
    social_learning: true,
    gamification: true,
    real_time_collaboration: true,
    advanced_analytics: true,
    experimental_features: false,
  },
  limits: {
    max_users: 10000,
    max_concurrent_sessions: 1000,
    max_code_execution_time: 30,
    max_file_upload_size: 10485760, // 10MB
    rate_limit_requests_per_minute: 60,
  },
  security: {
    session_timeout_minutes: 480, // 8 hours
    password_min_length: 8,
    require_2fa: false,
    allowed_domains: [],
    cors_origins: ['http://localhost:3000'],
  },
  monitoring: {
    log_level: 'info',
    enable_metrics: true,
    enable_tracing: false,
    retention_days: 30,
  },
}

export const USER_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'admin',
    permissions: [
      { id: 'system.read', name: 'View System', description: 'View system status and configuration', resource: 'system', action: 'read' },
      { id: 'system.update', name: 'Manage System', description: 'Update system configuration', resource: 'system', action: 'update' },
      { id: 'users.read', name: 'View Users', description: 'View user accounts and profiles', resource: 'users', action: 'read' },
      { id: 'users.update', name: 'Manage Users', description: 'Update user accounts and roles', resource: 'users', action: 'update' },
      { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', resource: 'users', action: 'delete' },
    ],
  },
  {
    id: 'moderator',
    name: 'moderator',
    permissions: [
      { id: 'system.read', name: 'View System', description: 'View system status', resource: 'system', action: 'read' },
      { id: 'users.read', name: 'View Users', description: 'View user accounts', resource: 'users', action: 'read' },
      { id: 'users.update', name: 'Moderate Users', description: 'Update user status', resource: 'users', action: 'update' },
    ],
  },
  {
    id: 'premium',
    name: 'premium',
    permissions: [
      { id: 'features.advanced', name: 'Advanced Features', description: 'Access premium features', resource: 'features', action: 'read' },
    ],
  },
  {
    id: 'user',
    name: 'user',
    permissions: [
      { id: 'profile.read', name: 'View Profile', description: 'View own profile', resource: 'profile', action: 'read' },
      { id: 'profile.update', name: 'Update Profile', description: 'Update own profile', resource: 'profile', action: 'update' },
    ],
  },
]

export const ALERT_TYPES = [
  { value: 'performance', label: 'Performance', color: 'yellow' },
  { value: 'security', label: 'Security', color: 'red' },
  { value: 'error', label: 'Error', color: 'red' },
  { value: 'maintenance', label: 'Maintenance', color: 'blue' },
] as const

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
] as const
