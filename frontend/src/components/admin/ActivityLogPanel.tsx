/**
 * Activity Log Panel - System activity and audit log viewer
 */

import { useState } from 'react'
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useAdminActivities } from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function ActivityLogPanel(): JSX.Element {
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  const { data: activitiesData, isLoading } = useAdminActivities({
    limit,
    offset,
    user_id: userFilter || undefined,
    action: actionFilter || undefined,
    start_date: dateRange.start || undefined,
    end_date: dateRange.end || undefined,
  })

  const activities = activitiesData?.activities || []
  const total = activitiesData?.total || 0

  const actionTypes = [
    'user.created',
    'user.updated',
    'user.deleted',
    'user.login',
    'user.logout',
    'config.updated',
    'system.restart',
    'backup.created',
    'alert.created',
    'alert.resolved',
  ]

  const getActionColor = (action: string) => {
    if (action.includes('created') || action.includes('login')) {
      return 'bg-green-100 text-green-800'
    }
    if (action.includes('deleted') || action.includes('logout')) {
      return 'bg-red-100 text-red-800'
    }
    if (action.includes('updated') || action.includes('resolved')) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('user')) {
      return <UserIcon className="h-4 w-4" />
    }
    if (action.includes('config') || action.includes('system')) {
      return <DocumentTextIcon className="h-4 w-4" />
    }
    return <ClockIcon className="h-4 w-4" />
  }

  const formatDetails = (details: Record<string, unknown>) => {
    return Object.entries(details)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-gray-600">System activity and audit trail</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} activities
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <Input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filter by user ID..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <Select
              value={actionFilter}
              onChange={(value) => setActionFilter(String(value))}
              options={[
                { value: '', label: 'All Actions' },
                ...actionTypes.map((action) => ({ value: action, label: action }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="datetime-local"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="datetime-local"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <Select
              value={limit.toString()}
              onChange={(value) => {
                setLimit(parseInt(String(value)))
                setOffset(0)
              }}
              className="w-20"
              options={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ]}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setUserFilter('')
              setActionFilter('')
              setDateRange({ start: '', end: '' })
              setOffset(0)
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Activity List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities</h3>
            <p className="text-gray-600">
              No activities match your current filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <span className="text-sm text-gray-500">
                          {activity.resource}
                        </span>
                      </div>
                      <time className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </time>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.user_email || 'System'}
                        </span>
                        {' '}performed{' '}
                        <span className="font-medium">{activity.action}</span>
                        {activity.resource && (
                          <>
                            {' '}on{' '}
                            <span className="font-medium">{activity.resource}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {Object.keys(activity.details).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Details:</h4>
                        <div className="text-xs text-gray-600 font-mono">
                          {formatDetails(activity.details)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                      {activity.ip_address && (
                        <span>IP: {activity.ip_address}</span>
                      )}
                      {activity.user_agent && (
                        <span className="truncate max-w-xs" title={activity.user_agent}>
                          UA: {activity.user_agent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
