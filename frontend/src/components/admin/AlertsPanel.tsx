/**
 * Alerts Panel - System alerts and notifications management
 */

import { useState } from 'react'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import {
  useSystemAlerts,
  useResolveAlert,
  useCreateAlert,
} from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import type { SystemAlert } from '../../types/admin'
import { ALERT_TYPES, SEVERITY_LEVELS } from '../../types/admin'

export function AlertsPanel(): JSX.Element {
  const [severityFilter, setSeverityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null)
  const [resolution, setResolution] = useState('')

  // New alert form state
  const [newAlert, setNewAlert] = useState<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'performance' | 'security' | 'error' | 'maintenance'
    title: string
    message: string
  }>({
    severity: 'medium',
    type: 'maintenance',
    title: '',
    message: '',
  })

  const { data: alertsData, isLoading } = useSystemAlerts({
    severity: severityFilter || undefined,
    type: typeFilter || undefined,
    resolved: resolvedFilter ? resolvedFilter === 'true' : undefined,
    limit: 50,
  })

  const resolveAlertMutation = useResolveAlert()
  const createAlertMutation = useCreateAlert()

  const alerts = alertsData?.alerts || []

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  const getTypeColor = (type: string) => {
    const colors = {
      performance: 'bg-yellow-100 text-yellow-800',
      security: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
      maintenance: 'bg-blue-100 text-blue-800',
    }
    return colors[type as keyof typeof colors] || colors.maintenance
  }

  const handleResolveAlert = async () => {
    if (!selectedAlert) return

    try {
      await resolveAlertMutation.mutateAsync({
        alertId: selectedAlert.id,
        resolution: resolution || undefined,
      })
      setShowResolveModal(false)
      setSelectedAlert(null)
      setResolution('')
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const handleCreateAlert = async () => {
    try {
      await createAlertMutation.mutateAsync(newAlert)
      setShowCreateModal(false)
      setNewAlert({
        severity: 'medium',
        type: 'maintenance',
        title: '',
        message: '',
      })
    } catch (error) {
      console.error('Failed to create alert:', error)
    }
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved)
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.severity === 'critical')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {criticalAlerts.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Open Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {unresolvedAlerts.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.filter(alert => 
                  alert.resolved && 
                  alert.resolved_at && 
                  new Date(alert.resolved_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FunnelIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alerts.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              {SEVERITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {ALERT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="false">Open</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Alert</span>
          </Button>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts</h3>
            <p className="text-gray-600">
              {severityFilter || typeFilter || resolvedFilter
                ? 'No alerts match your current filters.'
                : 'All systems are running smoothly.'}
            </p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(alert.type)}`}>
                      {alert.type}
                    </span>
                    {alert.resolved && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        RESOLVED
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {alert.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-3">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      Created: {new Date(alert.timestamp).toLocaleString()}
                    </span>
                    {alert.resolved && alert.resolved_at && (
                      <span>
                        Resolved: {new Date(alert.resolved_at).toLocaleString()}
                      </span>
                    )}
                    {alert.resolved_by && (
                      <span>
                        By: {alert.resolved_by}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!alert.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alert)
                        setShowResolveModal(true)
                      }}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewAlert({
            severity: 'medium',
            type: 'maintenance',
            title: '',
            message: '',
          })
        }}
        title="Create System Alert"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={newAlert.severity}
                onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SEVERITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as 'performance' | 'security' | 'error' | 'maintenance' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALERT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              type="text"
              value={newAlert.title}
              onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Alert title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={newAlert.message}
              onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Detailed alert message..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setNewAlert({
                  severity: 'medium',
                  type: 'maintenance',
                  title: '',
                  message: '',
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlert}
              disabled={!newAlert.title || !newAlert.message || createAlertMutation.isPending}
            >
              {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Alert Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setSelectedAlert(null)
          setResolution('')
        }}
        title="Resolve Alert"
      >
        <div className="space-y-4">
          {selectedAlert && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedAlert.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedAlert.message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Notes (optional)
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe how this alert was resolved..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveModal(false)
                setSelectedAlert(null)
                setResolution('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveAlert}
              disabled={resolveAlertMutation.isPending}
            >
              {resolveAlertMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
