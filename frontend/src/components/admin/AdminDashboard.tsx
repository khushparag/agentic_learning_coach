/**
 * Admin Dashboard - Main system administration interface
 */

import { useState } from 'react'
import {
  ChartBarIcon,
  CogIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { useAdminDashboard } from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { SystemHealthMonitor } from './SystemHealthMonitor'
import { UserManagementPanel } from './UserManagementPanel'
import { SystemConfigurationPanel } from './SystemConfigurationPanel'
import { AlertsPanel } from './AlertsPanel'
import { ActivityLogPanel } from './ActivityLogPanel'
import { BackupManagementPanel } from './BackupManagementPanel'

type AdminTab = 'overview' | 'health' | 'users' | 'config' | 'alerts' | 'activity' | 'backup'

// Utility function for status colors - defined at module level for reuse
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-100'
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100'
    case 'unhealthy':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function AdminDashboard(): JSX.Element {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const { data: dashboardData, isLoading, error, refetch } = useAdminDashboard()

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: ChartBarIcon },
    { id: 'health' as const, name: 'System Health', icon: ServerIcon },
    { id: 'users' as const, name: 'User Management', icon: UsersIcon },
    { id: 'config' as const, name: 'Configuration', icon: CogIcon },
    { id: 'alerts' as const, name: 'Alerts', icon: ExclamationTriangleIcon },
    { id: 'activity' as const, name: 'Activity Log', icon: ClockIcon },
    { id: 'backup' as const, name: 'Backup & Restore', icon: DocumentArrowDownIcon },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load Admin Dashboard
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to connect to the admin API. Please check your permissions and try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview data={dashboardData} />
      case 'health':
        return <SystemHealthMonitor />
      case 'users':
        return <UserManagementPanel />
      case 'config':
        return <SystemConfigurationPanel />
      case 'alerts':
        return <AlertsPanel />
      case 'activity':
        return <ActivityLogPanel />
      case 'backup':
        return <BackupManagementPanel />
      default:
        return <AdminOverview data={dashboardData} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and manage the Agentic Learning Coach system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {dashboardData?.system_health && (
                <div className="flex items-center space-x-2">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      dashboardData.system_health.overall_status
                    )}`}
                  >
                    {dashboardData.system_health.overall_status.toUpperCase()}
                  </div>
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

interface AdminOverviewProps {
  data?: any
}

function AdminOverview({ data }: AdminOverviewProps): JSX.Element {
  if (!data) {
    return <div>Loading overview...</div>
  }

  const { system_health, system_metrics, user_management, recent_activities, alerts } = data

  const stats = [
    {
      name: 'Total Users',
      value: user_management?.total_users || 0,
      change: `+${user_management?.new_users_today || 0} today`,
      changeType: 'positive',
    },
    {
      name: 'Active Users',
      value: user_management?.active_users || 0,
      change: `${Math.round(((user_management?.active_users || 0) / (user_management?.total_users || 1)) * 100)}% active`,
      changeType: 'neutral',
    },
    {
      name: 'System Uptime',
      value: system_metrics?.uptime ? `${Math.round(system_metrics.uptime / 3600)}h` : 'N/A',
      change: 'Last 24 hours',
      changeType: 'neutral',
    },
    {
      name: 'Open Alerts',
      value: alerts?.filter((alert: any) => !alert.resolved).length || 0,
      change: alerts?.filter((alert: any) => alert.severity === 'critical').length + ' critical',
      changeType: alerts?.filter((alert: any) => alert.severity === 'critical').length > 0 ? 'negative' : 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          {system_health?.components && (
            <div className="space-y-3">
              {Object.entries(system_health.components).map(([service, health]: [string, any]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {service.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                      {health.status}
                    </span>
                    {health.response_time_ms && (
                      <span className="text-xs text-gray-500">
                        {health.response_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          {recent_activities && recent_activities.length > 0 ? (
            <div className="space-y-3">
              {recent_activities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.user_email || 'System'} {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start">
            <ServerIcon className="h-4 w-4 mr-2" />
            View System Health
          </Button>
          <Button variant="outline" className="justify-start">
            <UsersIcon className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline" className="justify-start">
            <CogIcon className="h-4 w-4 mr-2" />
            System Configuration
          </Button>
          <Button variant="outline" className="justify-start">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </Card>
    </div>
  )
}