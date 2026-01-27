/**
 * System Health Monitor - Real-time system health monitoring dashboard
 */

import { useState } from 'react'
import {
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useSystemHealth, useSystemMetrics, useServiceDiagnostics } from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { ServiceHealth } from '../../types/admin'

export function SystemHealthMonitor(): JSX.Element {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth(30000)
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics(10000)
  const { data: diagnostics } = useServiceDiagnostics(selectedService || '', !!selectedService)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'unhealthy':
        return 'text-red-600 bg-red-100 border-red-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  if (healthLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">System Health Overview</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg border ${getStatusColor(health?.overall_status || 'unknown')}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(health?.overall_status || 'unknown')}
                <span className="font-medium">
                  {health?.overall_status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHealth()}
              className="flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(health.components).map(([serviceName, serviceHealth]: [string, ServiceHealth]) => (
              <div
                key={serviceName}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${getStatusColor(serviceHealth.status)}`}
                onClick={() => setSelectedService(serviceName)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">
                    {serviceName.replace('_', ' ')}
                  </h3>
                  {getStatusIcon(serviceHealth.status)}
                </div>
                <div className="text-sm space-y-1">
                  {serviceHealth.response_time_ms && (
                    <p>Response: {serviceHealth.response_time_ms}ms</p>
                  )}
                  {serviceHealth.database_type && (
                    <p>Type: {serviceHealth.database_type}</p>
                  )}
                  {serviceHealth.error && (
                    <p className="text-red-600 truncate" title={serviceHealth.error}>
                      Error: {serviceHealth.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CpuChipIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{metrics.cpu_usage?.percentage?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (metrics.cpu_usage?.percentage || 0) > 80 ? 'bg-red-500' :
                      (metrics.cpu_usage?.percentage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.cpu_usage?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{metrics.memory_usage?.percentage?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (metrics.memory_usage?.percentage || 0) > 80 ? 'bg-red-500' :
                      (metrics.memory_usage?.percentage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.memory_usage?.percentage || 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatBytes(metrics.memory_usage?.used || 0)} used</span>
                  <span>{formatBytes(metrics.memory_usage?.total || 0)} total</span>
                </div>
              </div>

              {metrics.disk_usage && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span>{metrics.disk_usage.percentage?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metrics.disk_usage.percentage > 80 ? 'bg-red-500' :
                        metrics.disk_usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${metrics.disk_usage.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatBytes(metrics.disk_usage.used)} used</span>
                    <span>{formatBytes(metrics.disk_usage.total)} total</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CircleStackIcon className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">System Statistics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">
                  {formatUptime(metrics.uptime || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium">{metrics.active_connections || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Request Rate</span>
                <span className="text-sm font-medium">
                  {metrics.request_rate?.toFixed(1) || 0} req/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className={`text-sm font-medium ${
                  (metrics.error_rate || 0) > 0.05 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {((metrics.error_rate || 0) * 100).toFixed(2)}%
                </span>
              </div>
              {metrics.cpu_usage?.load_average && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Load Average</span>
                  <span className="text-sm font-medium">
                    {metrics.cpu_usage.load_average.map(load => load.toFixed(2)).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Service Diagnostics */}
      {selectedService && diagnostics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedService.replace('_', ' ')} Diagnostics
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedService(null)}
            >
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Service Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${
                    diagnostics.status === 'running' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {diagnostics.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span>{diagnostics.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span>{formatUptime(diagnostics.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <span>{formatBytes(diagnostics.memory_usage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPU Usage</span>
                  <span>{diagnostics.cpu_usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Restart</span>
                  <span>{new Date(diagnostics.last_restart).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Logs</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {diagnostics.logs && diagnostics.logs.length > 0 ? (
                  <div className="space-y-1">
                    {diagnostics.logs.slice(0, 10).map((log, index) => (
                      <div key={index} className="text-xs">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`ml-2 font-medium ${
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warn' ? 'text-yellow-600' :
                          log.level === 'info' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent logs available</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
