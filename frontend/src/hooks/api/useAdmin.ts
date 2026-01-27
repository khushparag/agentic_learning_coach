/**
 * Admin API Hooks - React Query hooks for admin operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminService } from '../../services/adminService'
import type {
  SystemHealth,
  SystemMetrics,
  UserManagement,
  AdminUser,
  SystemConfiguration,
  AdminDashboardData,
  AdminActivity,
  SystemAlert,
  ServiceDiagnostics,
  BackupConfiguration,
  SystemBackup,
  UserRole,
} from '../../types/admin'

// ==========================================================================
// Query Keys
// ==========================================================================

export const adminKeys = {
  all: ['admin'] as const,
  health: () => [...adminKeys.all, 'health'] as const,
  metrics: () => [...adminKeys.all, 'metrics'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  userSearch: (params: Record<string, unknown>) => [...adminKeys.users(), 'search', params] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
  configuration: () => [...adminKeys.all, 'configuration'] as const,
  activities: (params?: Record<string, unknown>) => [...adminKeys.all, 'activities', params] as const,
  alerts: (params?: Record<string, unknown>) => [...adminKeys.all, 'alerts', params] as const,
  diagnostics: (service: string) => [...adminKeys.all, 'diagnostics', service] as const,
  backup: () => [...adminKeys.all, 'backup'] as const,
  backupHistory: () => [...adminKeys.backup(), 'history'] as const,
  logs: (params?: Record<string, unknown>) => [...adminKeys.all, 'logs', params] as const,
}

// ==========================================================================
// System Health & Monitoring Hooks
// ==========================================================================

export function useSystemHealth(refetchInterval = 30000) {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: AdminService.getSystemHealth,
    refetchInterval,
    staleTime: 15000, // Consider data stale after 15 seconds
  })
}

export function useSystemMetrics(refetchInterval = 10000) {
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: AdminService.getSystemMetrics,
    refetchInterval,
    staleTime: 5000,
  })
}

export function useAdminDashboard(refetchInterval = 30000) {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: AdminService.getDashboardData,
    refetchInterval,
    staleTime: 15000,
  })
}

export function useServiceDiagnostics(serviceName: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.diagnostics(serviceName),
    queryFn: () => AdminService.getServiceDiagnostics(serviceName),
    enabled,
    refetchInterval: 30000,
  })
}

// ==========================================================================
// User Management Hooks
// ==========================================================================

export function useUserManagement() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: AdminService.getUserManagement,
    staleTime: 60000, // 1 minute
  })
}

export function useAdminUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => AdminService.getUser(userId),
    enabled: enabled && !!userId,
  })
}

export function useUserSearch(params: {
  query?: string
  role?: string
  active?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: adminKeys.userSearch(params),
    queryFn: () => AdminService.searchUsers(params),
    enabled: Object.keys(params).length > 0,
  })
}

export function useUserRoles() {
  return useQuery({
    queryKey: adminKeys.roles(),
    queryFn: AdminService.getUserRoles,
    staleTime: 300000, // 5 minutes - roles don't change often
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      AdminService.updateUserRole(userId, roleId),
    onSuccess: (updatedUser) => {
      // Update the user in cache
      queryClient.setQueryData(adminKeys.user(updatedUser.id), updatedUser)
      // Invalidate user management to refresh counts
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      AdminService.updateUserStatus(userId, isActive),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(adminKeys.user(updatedUser.id), updatedUser)
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      AdminService.deleteUser(userId, reason),
    onSuccess: (_, { userId }) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: adminKeys.user(userId) })
      // Invalidate user management
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

// ==========================================================================
// System Configuration Hooks
// ==========================================================================

export function useSystemConfiguration() {
  return useQuery({
    queryKey: adminKeys.configuration(),
    queryFn: AdminService.getSystemConfiguration,
    staleTime: 300000, // 5 minutes
  })
}

export function useUpdateSystemConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: Partial<SystemConfiguration>) =>
      AdminService.updateSystemConfiguration(config),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(adminKeys.configuration(), updatedConfig)
    },
  })
}

export function useExportConfiguration() {
  return useMutation({
    mutationFn: AdminService.exportConfiguration,
  })
}

export function useImportConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AdminService.importConfiguration,
    onSuccess: () => {
      // Invalidate configuration to refetch
      queryClient.invalidateQueries({ queryKey: adminKeys.configuration() })
    },
  })
}

export function useValidateConfiguration() {
  return useMutation({
    mutationFn: AdminService.validateConfiguration,
  })
}

// ==========================================================================
// Activity & Alert Hooks
// ==========================================================================

export function useAdminActivities(params?: {
  limit?: number
  offset?: number
  user_id?: string
  action?: string
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: adminKeys.activities(params),
    queryFn: () => AdminService.getAdminActivities(params),
    staleTime: 30000,
  })
}

export function useSystemAlerts(params?: {
  severity?: string
  type?: string
  resolved?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: adminKeys.alerts(params),
    queryFn: () => AdminService.getSystemAlerts(params),
    refetchInterval: 60000, // Check for new alerts every minute
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, resolution }: { alertId: string; resolution?: string }) =>
      AdminService.resolveAlert(alertId, resolution),
    onSuccess: () => {
      // Invalidate alerts to refresh the list
      queryClient.invalidateQueries({ queryKey: adminKeys.alerts() })
    },
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AdminService.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.alerts() })
    },
  })
}

// ==========================================================================
// Backup & System Operations Hooks
// ==========================================================================

export function useBackupConfiguration() {
  return useQuery({
    queryKey: adminKeys.backup(),
    queryFn: AdminService.getBackupConfiguration,
    staleTime: 300000,
  })
}

export function useBackupHistory() {
  return useQuery({
    queryKey: adminKeys.backupHistory(),
    queryFn: AdminService.getBackupHistory,
    staleTime: 60000,
  })
}

export function useCreateBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AdminService.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.backupHistory() })
    },
  })
}

export function useDeleteBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: AdminService.deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.backupHistory() })
    },
  })
}

export function useRestartService() {
  return useMutation({
    mutationFn: AdminService.restartService,
  })
}

export function useClearCache() {
  return useMutation({
    mutationFn: AdminService.clearCache,
  })
}

export function useRunMaintenance() {
  return useMutation({
    mutationFn: AdminService.runMaintenance,
  })
}

export function useSystemLogs(params?: {
  level?: string
  service?: string
  limit?: number
  start_time?: string
  end_time?: string
}) {
  return useQuery({
    queryKey: adminKeys.logs(params),
    queryFn: () => AdminService.getSystemLogs(params),
    enabled: !!params,
    staleTime: 30000,
  })
}
