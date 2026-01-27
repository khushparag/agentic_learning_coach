/**
 * Admin Service - API client for system administration and monitoring
 */

import api from './api'
import type {
  SystemHealth,
  SystemMetrics,
  UserManagement,
  AdminUser,
  SystemConfiguration,
  ConfigurationExport,
  ConfigurationImport,
  AdminDashboardData,
  AdminActivity,
  SystemAlert,
  ServiceDiagnostics,
  BackupConfiguration,
  SystemBackup,
  UserRole,
} from '../types/admin'

export class AdminService {
  private static readonly BASE_PATH = '/api/admin'

  // ==========================================================================
  // System Health & Monitoring
  // ==========================================================================

  /**
   * Get overall system health status
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>('/health/detailed')
    return response.data
  }

  /**
   * Get basic health check
   */
  static async getBasicHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get<{ status: string; timestamp: string }>('/health')
    return response.data
  }

  /**
   * Get system performance metrics
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await api.get<SystemMetrics>(`${this.BASE_PATH}/metrics`)
    return response.data
  }

  /**
   * Get service-specific diagnostics
   */
  static async getServiceDiagnostics(serviceName: string): Promise<ServiceDiagnostics> {
    const response = await api.get<ServiceDiagnostics>(`${this.BASE_PATH}/diagnostics/${serviceName}`)
    return response.data
  }

  /**
   * Get admin dashboard data (combined health, metrics, users, activities)
   */
  static async getDashboardData(): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>(`${this.BASE_PATH}/dashboard`)
    return response.data
  }

  // ==========================================================================
  // User Management
  // ==========================================================================

  /**
   * Get user management overview
   */
  static async getUserManagement(): Promise<UserManagement> {
    const response = await api.get<UserManagement>(`${this.BASE_PATH}/users`)
    return response.data
  }

  /**
   * Get detailed user information
   */
  static async getUser(userId: string): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`${this.BASE_PATH}/users/${userId}`)
    return response.data
  }

  /**
   * Update user role and permissions
   */
  static async updateUserRole(userId: string, roleId: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`${this.BASE_PATH}/users/${userId}/role`, {
      role_id: roleId,
    })
    return response.data
  }

  /**
   * Activate or deactivate user account
   */
  static async updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`${this.BASE_PATH}/users/${userId}/status`, {
      is_active: isActive,
    })
    return response.data
  }

  /**
   * Delete user account (admin only)
   */
  static async deleteUser(userId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`${this.BASE_PATH}/users/${userId}`, {
      data: { reason },
    })
    return response.data
  }

  /**
   * Get available user roles
   */
  static async getUserRoles(): Promise<UserRole[]> {
    const response = await api.get<{ roles: UserRole[] }>(`${this.BASE_PATH}/roles`)
    return response.data.roles
  }

  /**
   * Search users with filters
   */
  static async searchUsers(params: {
    query?: string
    role?: string
    active?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    users: AdminUser[]
    total: number
    limit: number
    offset: number
  }> {
    const response = await api.get<{
      users: AdminUser[]
      total: number
      limit: number
      offset: number
    }>(`${this.BASE_PATH}/users/search`, { params })
    return response.data
  }

  // ==========================================================================
  // System Configuration
  // ==========================================================================

  /**
   * Get current system configuration
   */
  static async getSystemConfiguration(): Promise<SystemConfiguration> {
    const response = await api.get<SystemConfiguration>(`${this.BASE_PATH}/configuration`)
    return response.data
  }

  /**
   * Update system configuration
   */
  static async updateSystemConfiguration(
    config: Partial<SystemConfiguration>
  ): Promise<SystemConfiguration> {
    const response = await api.patch<SystemConfiguration>(`${this.BASE_PATH}/configuration`, config)
    return response.data
  }

  /**
   * Reset configuration to defaults
   */
  static async resetConfiguration(): Promise<SystemConfiguration> {
    const response = await api.post<SystemConfiguration>(`${this.BASE_PATH}/configuration/reset`)
    return response.data
  }

  /**
   * Export system configuration
   */
  static async exportConfiguration(): Promise<ConfigurationExport> {
    const response = await api.get<ConfigurationExport>(`${this.BASE_PATH}/configuration/export`)
    return response.data
  }

  /**
   * Import system configuration
   */
  static async importConfiguration(importData: ConfigurationImport): Promise<{
    success: boolean
    message: string
    configuration?: SystemConfiguration
  }> {
    const formData = new FormData()
    formData.append('file', importData.file)
    formData.append('validate_checksum', importData.validate_checksum.toString())
    formData.append('backup_current', importData.backup_current.toString())
    formData.append('apply_immediately', importData.apply_immediately.toString())

    const response = await api.post<{
      success: boolean
      message: string
      configuration?: SystemConfiguration
    }>(`${this.BASE_PATH}/configuration/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  /**
   * Validate configuration before applying
   */
  static async validateConfiguration(config: Partial<SystemConfiguration>): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const response = await api.post<{
      valid: boolean
      errors: string[]
      warnings: string[]
    }>(`${this.BASE_PATH}/configuration/validate`, config)
    return response.data
  }

  // ==========================================================================
  // Activity Monitoring & Alerts
  // ==========================================================================

  /**
   * Get recent admin activities
   */
  static async getAdminActivities(params?: {
    limit?: number
    offset?: number
    user_id?: string
    action?: string
    start_date?: string
    end_date?: string
  }): Promise<{
    activities: AdminActivity[]
    total: number
    limit: number
    offset: number
  }> {
    const response = await api.get<{
      activities: AdminActivity[]
      total: number
      limit: number
      offset: number
    }>(`${this.BASE_PATH}/activities`, { params })
    return response.data
  }

  /**
   * Get system alerts
   */
  static async getSystemAlerts(params?: {
    severity?: string
    type?: string
    resolved?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    alerts: SystemAlert[]
    total: number
    limit: number
    offset: number
  }> {
    const response = await api.get<{
      alerts: SystemAlert[]
      total: number
      limit: number
      offset: number
    }>(`${this.BASE_PATH}/alerts`, { params })
    return response.data
  }

  /**
   * Mark alert as resolved
   */
  static async resolveAlert(alertId: string, resolution?: string): Promise<SystemAlert> {
    const response = await api.patch<SystemAlert>(`${this.BASE_PATH}/alerts/${alertId}/resolve`, {
      resolution,
    })
    return response.data
  }

  /**
   * Create manual alert
   */
  static async createAlert(alert: {
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'performance' | 'security' | 'error' | 'maintenance'
    title: string
    message: string
  }): Promise<SystemAlert> {
    const response = await api.post<SystemAlert>(`${this.BASE_PATH}/alerts`, alert)
    return response.data
  }

  // ==========================================================================
  // Backup & Restore
  // ==========================================================================

  /**
   * Get backup configuration
   */
  static async getBackupConfiguration(): Promise<BackupConfiguration> {
    const response = await api.get<BackupConfiguration>(`${this.BASE_PATH}/backup/configuration`)
    return response.data
  }

  /**
   * Update backup configuration
   */
  static async updateBackupConfiguration(config: Partial<BackupConfiguration>): Promise<BackupConfiguration> {
    const response = await api.patch<BackupConfiguration>(`${this.BASE_PATH}/backup/configuration`, config)
    return response.data
  }

  /**
   * Create manual backup
   */
  static async createBackup(options: {
    include_user_data: boolean
    include_system_logs: boolean
    compression_enabled: boolean
  }): Promise<SystemBackup> {
    const response = await api.post<SystemBackup>(`${this.BASE_PATH}/backup/create`, options)
    return response.data
  }

  /**
   * Get backup history
   */
  static async getBackupHistory(): Promise<SystemBackup[]> {
    const response = await api.get<{ backups: SystemBackup[] }>(`${this.BASE_PATH}/backup/history`)
    return response.data.backups
  }

  /**
   * Download backup file
   */
  static async downloadBackup(backupId: string): Promise<Blob> {
    const response = await api.get<Blob>(`${this.BASE_PATH}/backup/${backupId}/download`, {
      responseType: 'blob',
    })
    return response.data
  }

  /**
   * Delete backup
   */
  static async deleteBackup(backupId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`${this.BASE_PATH}/backup/${backupId}`)
    return response.data
  }

  // ==========================================================================
  // System Operations
  // ==========================================================================

  /**
   * Restart service
   */
  static async restartService(serviceName: string): Promise<{
    success: boolean
    message: string
  }> {
    const response = await api.post<{
      success: boolean
      message: string
    }>(`${this.BASE_PATH}/services/${serviceName}/restart`)
    return response.data
  }

  /**
   * Clear system cache
   */
  static async clearCache(cacheType?: 'all' | 'api' | 'user' | 'static'): Promise<{
    success: boolean
    cleared_items: number
  }> {
    const response = await api.post<{
      success: boolean
      cleared_items: number
    }>(`${this.BASE_PATH}/cache/clear`, {
      cache_type: cacheType || 'all',
    })
    return response.data
  }

  /**
   * Run system maintenance
   */
  static async runMaintenance(tasks: string[]): Promise<{
    success: boolean
    results: Record<string, { success: boolean; message: string }>
  }> {
    const response = await api.post<{
      success: boolean
      results: Record<string, { success: boolean; message: string }>
    }>(`${this.BASE_PATH}/maintenance/run`, { tasks })
    return response.data
  }

  /**
   * Get system logs
   */
  static async getSystemLogs(params?: {
    level?: string
    service?: string
    limit?: number
    start_time?: string
    end_time?: string
  }): Promise<{
    logs: Array<{
      timestamp: string
      level: string
      service: string
      message: string
      context?: Record<string, unknown>
    }>
    total: number
  }> {
    const response = await api.get<{
      logs: Array<{
        timestamp: string
        level: string
        service: string
        message: string
        context?: Record<string, unknown>
      }>
      total: number
    }>(`${this.BASE_PATH}/logs`, { params })
    return response.data
  }
}
