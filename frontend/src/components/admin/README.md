# Admin Components

A comprehensive system administration interface for the Agentic Learning Coach platform. This module provides real-time monitoring, user management, system configuration, and backup functionality for administrators.

## Overview

The admin interface is designed following the clean architecture principles and provides a secure, role-based administration system. It integrates with the backend health check APIs and provides real-time monitoring capabilities.

## Components

### AdminDashboard
**Main administration interface with tabbed navigation**

```typescript
import { AdminDashboard } from '@/components/admin'

function AdminPage() {
  return <AdminDashboard />
}
```

**Features:**
- Tabbed navigation between admin sections
- Real-time system status indicator
- Overview dashboard with key metrics
- Quick action buttons for common tasks

**Tabs:**
- Overview: System summary and quick stats
- System Health: Real-time monitoring
- User Management: User accounts and roles
- Configuration: System settings
- Alerts: System alerts and notifications
- Activity Log: Audit trail and activity monitoring
- Backup & Restore: Data backup management

### SystemHealthMonitor
**Real-time system health monitoring dashboard**

```typescript
import { SystemHealthMonitor } from '@/components/admin'

function HealthPage() {
  return <SystemHealthMonitor />
}
```

**Features:**
- Overall system status with color-coded indicators
- Individual service health monitoring (Database, Redis, Runner Service, Qdrant)
- Performance metrics (CPU, Memory, Disk usage)
- Service diagnostics with detailed logs
- Auto-refresh every 30 seconds
- Response time tracking

**Health Status Indicators:**
- 🟢 **Healthy**: Service operating normally
- 🟡 **Degraded**: Service experiencing issues but functional
- 🔴 **Unhealthy**: Service down or critical errors

### UserManagementPanel
**User account and role management interface**

```typescript
import { UserManagementPanel } from '@/components/admin'

function UsersPage() {
  return <UserManagementPanel />
}
```

**Features:**
- User statistics dashboard (total, active, new users)
- Advanced user search and filtering
- Role management with permission system
- User status toggle (active/inactive)
- Account deletion with audit trail
- Progress tracking visualization
- Bulk operations support

**User Roles:**
- **Admin**: Full system access
- **Moderator**: User management and monitoring
- **Premium**: Enhanced features access
- **User**: Standard user permissions

### SystemConfigurationPanel
**System settings and configuration management**

```typescript
import { SystemConfigurationPanel } from '@/components/admin'

function ConfigPage() {
  return <SystemConfigurationPanel />
}
```

**Features:**
- Service URL configuration
- Feature flag management
- System limits and quotas
- Security settings (2FA, CORS, session timeout)
- Monitoring and logging configuration
- Configuration validation
- Export/Import functionality
- Real-time validation feedback

**Configuration Sections:**
- **Services**: API endpoints and service URLs
- **Features**: Feature flags and toggles
- **Limits**: System quotas and rate limits
- **Security**: Authentication and security settings
- **Monitoring**: Logging and metrics configuration

### AlertsPanel
**System alerts and notification management**

```typescript
import { AlertsPanel } from '@/components/admin'

function AlertsPage() {
  return <AlertsPanel />
}
```

**Features:**
- Alert dashboard with severity indicators
- Alert filtering by type, severity, and status
- Manual alert creation
- Alert resolution with notes
- Alert history and audit trail
- Real-time alert notifications

**Alert Types:**
- **Performance**: System performance issues
- **Security**: Security-related alerts
- **Error**: Application errors and failures
- **Maintenance**: Scheduled maintenance notifications

**Severity Levels:**
- **Critical**: Immediate attention required
- **High**: Important issues requiring prompt action
- **Medium**: Standard issues for review
- **Low**: Informational alerts

### ActivityLogPanel
**System activity and audit log viewer**

```typescript
import { ActivityLogPanel } from '@/components/admin'

function ActivityPage() {
  return <ActivityLogPanel />
}
```

**Features:**
- Comprehensive activity logging
- Advanced filtering (user, action, date range)
- Pagination for large datasets
- Detailed activity information
- IP address and user agent tracking
- Export functionality for compliance

**Tracked Activities:**
- User account operations (create, update, delete)
- Authentication events (login, logout)
- Configuration changes
- System operations (restart, maintenance)
- Alert management actions

### BackupManagementPanel
**System backup and restore functionality**

```typescript
import { BackupManagementPanel } from '@/components/admin'

function BackupPage() {
  return <BackupManagementPanel />
}
```

**Features:**
- Backup configuration management
- Manual backup creation
- Backup history and status tracking
- Backup download functionality
- Backup deletion with confirmation
- Automated backup scheduling
- Compression and encryption options

**Backup Contents:**
- System configuration
- User data and profiles
- Learning progress and submissions
- System logs and audit trails

## API Integration

### Health Check Integration
The admin components integrate with the backend health check APIs:

```typescript
// Health endpoints used
GET /health              // Basic health check
GET /health/detailed     // Comprehensive health status
GET /health/ready        // Readiness check
GET /health/live         // Liveness check
```

### Admin API Endpoints
All admin operations use the `/api/admin` endpoint prefix:

```typescript
// System monitoring
GET /api/admin/dashboard     // Combined dashboard data
GET /api/admin/metrics       // System performance metrics
GET /api/admin/diagnostics/:service  // Service diagnostics

// User management
GET /api/admin/users         // User management overview
GET /api/admin/users/search  // User search with filters
PATCH /api/admin/users/:id/role     // Update user role
PATCH /api/admin/users/:id/status   // Update user status
DELETE /api/admin/users/:id  // Delete user account

// Configuration
GET /api/admin/configuration         // Get system config
PATCH /api/admin/configuration       // Update system config
GET /api/admin/configuration/export  // Export configuration
POST /api/admin/configuration/import // Import configuration

// Alerts and activities
GET /api/admin/alerts        // System alerts
POST /api/admin/alerts       // Create alert
PATCH /api/admin/alerts/:id/resolve  // Resolve alert
GET /api/admin/activities    // Activity log

// Backup management
GET /api/admin/backup/configuration  // Backup settings
GET /api/admin/backup/history       // Backup history
POST /api/admin/backup/create       // Create backup
DELETE /api/admin/backup/:id        // Delete backup
```

## Security & Permissions

### Role-Based Access Control
Admin components implement strict role-based access control:

```typescript
// Permission checking example
const hasPermission = (user: User, permission: string) => {
  return user.role.permissions.some(p => p.id === permission)
}

// Usage in components
if (!hasPermission(user, 'system.read')) {
  return <AccessDenied />
}
```

### Required Permissions
- **system.read**: View system status and configuration
- **system.update**: Modify system configuration
- **users.read**: View user accounts
- **users.update**: Modify user accounts and roles
- **users.delete**: Delete user accounts

### Audit Trail
All admin actions are automatically logged:

```typescript
interface AdminActivity {
  id: string
  timestamp: string
  user_id: string
  user_email: string
  action: string
  resource: string
  details: Record<string, unknown>
  ip_address: string
  user_agent: string
}
```

## Real-Time Features

### WebSocket Integration
Admin components support real-time updates via WebSocket:

```typescript
// Real-time health monitoring
const { data: health } = useSystemHealth(30000) // 30-second refresh

// Real-time alerts
const { data: alerts } = useSystemAlerts({}, 60000) // 1-minute refresh

// Real-time metrics
const { data: metrics } = useSystemMetrics(10000) // 10-second refresh
```

### Auto-Refresh Intervals
- **System Health**: 30 seconds
- **System Metrics**: 10 seconds
- **Alerts**: 1 minute
- **Activity Log**: Manual refresh
- **User Management**: Manual refresh

## Error Handling

### Graceful Degradation
Admin components implement comprehensive error handling:

```typescript
// Service unavailable fallback
if (error?.status === 503) {
  return (
    <ErrorState
      title="Service Temporarily Unavailable"
      message="The admin service is currently unavailable. Please try again later."
      action={<Button onClick={refetch}>Retry</Button>}
    />
  )
}
```

### Error Recovery
- Automatic retry for transient failures
- Fallback UI for service unavailability
- Clear error messages with recovery actions
- Offline mode detection and handling

## Performance Optimization

### Efficient Data Loading
- React Query for caching and background updates
- Pagination for large datasets
- Lazy loading for heavy components
- Debounced search and filtering

### Memory Management
- Proper cleanup of intervals and subscriptions
- Efficient re-rendering with React.memo
- Optimized bundle splitting
- Resource cleanup on unmount

## Development Guidelines

### Component Structure
```
admin/
├── AdminDashboard.tsx          # Main dashboard with tabs
├── SystemHealthMonitor.tsx     # Health monitoring
├── UserManagementPanel.tsx     # User management
├── SystemConfigurationPanel.tsx # System configuration
├── AlertsPanel.tsx             # Alerts management
├── ActivityLogPanel.tsx        # Activity logging
├── BackupManagementPanel.tsx   # Backup management
├── index.ts                    # Component exports
└── README.md                   # This documentation
```

### Coding Standards
- Follow TypeScript strict mode
- Use proper error boundaries
- Implement loading states
- Add proper accessibility attributes
- Include comprehensive prop types

### Testing Requirements
- Unit tests for all components
- Integration tests for API interactions
- E2E tests for critical admin workflows
- Performance testing for large datasets
- Security testing for permission checks

## Usage Examples

### Basic Admin Dashboard
```typescript
import { AdminDashboard } from '@/components/admin'

function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  )
}
```

### Custom Health Monitor
```typescript
import { SystemHealthMonitor } from '@/components/admin'

function CustomHealthPage() {
  return (
    <div className="space-y-6">
      <h1>System Status</h1>
      <SystemHealthMonitor />
    </div>
  )
}
```

### Embedded User Management
```typescript
import { UserManagementPanel } from '@/components/admin'

function UserAdminSection() {
  return (
    <Card>
      <CardHeader>
        <h2>User Administration</h2>
      </CardHeader>
      <CardContent>
        <UserManagementPanel />
      </CardContent>
    </Card>
  )
}
```

## Deployment Considerations

### Environment Variables
```bash
# Admin-specific configuration
VITE_ADMIN_ENABLED=true
VITE_ADMIN_REFRESH_INTERVAL=30000
VITE_ADMIN_MAX_LOG_ENTRIES=1000
VITE_ADMIN_BACKUP_RETENTION_DAYS=30
```

### Production Settings
- Enable audit logging
- Configure backup retention
- Set appropriate refresh intervals
- Enable security monitoring
- Configure alert thresholds

### Monitoring Integration
- Health check endpoints
- Metrics collection
- Log aggregation
- Alert routing
- Performance monitoring

This admin interface provides comprehensive system administration capabilities while maintaining security, performance, and usability standards. It follows the established patterns in the codebase and integrates seamlessly with the existing backend services.