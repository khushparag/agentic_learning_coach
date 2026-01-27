/**
 * Backup Management Panel - System backup and restore functionality
 */

import { useState } from 'react'
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import {
  useBackupConfiguration,
  useBackupHistory,
  useCreateBackup,
  useDeleteBackup,
} from '../../hooks/api/useAdmin'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { SystemBackup } from '../../types/admin'

export function BackupManagementPanel(): JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<SystemBackup | null>(null)
  const [backupOptions, setBackupOptions] = useState({
    include_user_data: true,
    include_system_logs: false,
    compression_enabled: true,
  })

  const { data: backupConfig, isLoading: configLoading } = useBackupConfiguration()
  const { data: backupHistory, isLoading: historyLoading } = useBackupHistory()
  const createBackupMutation = useCreateBackup()
  const deleteBackupMutation = useDeleteBackup()

  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync(backupOptions)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return

    try {
      await deleteBackupMutation.mutateAsync(selectedBackup.id)
      setShowDeleteModal(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('Failed to delete backup:', error)
    }
  }

  const handleDownloadBackup = async (backup: SystemBackup) => {
    if (!backup.download_url) return

    try {
      // Create a temporary link to download the backup
      const link = document.createElement('a')
      link.href = backup.download_url
      link.download = `backup-${backup.id}-${new Date(backup.timestamp).toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download backup:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'creating':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'creating':
        return <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  if (configLoading || historyLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Backup Management</h2>
          <p className="text-gray-600">Create, manage, and restore system backups</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>Create Backup</span>
        </Button>
      </div>

      {/* Backup Configuration */}
      {backupConfig && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CogIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Backup Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Auto Backup</p>
                <p className="text-xs text-gray-500">
                  {backupConfig.auto_backup_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                backupConfig.auto_backup_enabled ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Frequency</p>
                <p className="text-xs text-gray-500 capitalize">
                  {backupConfig.backup_frequency}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Retention</p>
                <p className="text-xs text-gray-500">
                  {backupConfig.backup_retention_days} days
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Compression</p>
                <p className="text-xs text-gray-500">
                  {backupConfig.compression_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                backupConfig.compression_enabled ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        </Card>
      )}

      {/* Backup History */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Backup History</h3>
        </div>

        {!backupHistory || backupHistory.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Backups</h3>
            <p className="text-gray-600 mb-4">
              No backups have been created yet. Create your first backup to get started.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create First Backup
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backupHistory.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Backup {backup.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {backup.type}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(backup.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(backup.size_bytes)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {backup.includes.configuration && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Config
                          </span>
                        )}
                        {backup.includes.user_data && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Users
                          </span>
                        )}
                        {backup.includes.system_logs && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Logs
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(backup.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        {new Date(backup.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {backup.status === 'completed' && backup.download_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <DocumentArrowUpIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Backup Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create System Backup"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex">
              <DocumentArrowDownIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Create System Backup
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This will create a backup of your system configuration and selected data.
                    The backup will be compressed and available for download.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Backup Contents</h4>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupOptions.include_user_data}
                  onChange={(e) => setBackupOptions(prev => ({
                    ...prev,
                    include_user_data: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  User Data (profiles, progress, submissions)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupOptions.include_system_logs}
                  onChange={(e) => setBackupOptions(prev => ({
                    ...prev,
                    include_system_logs: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  System Logs (activity logs, error logs)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupOptions.compression_enabled}
                  onChange={(e) => setBackupOptions(prev => ({
                    ...prev,
                    compression_enabled: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable Compression (recommended)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
            >
              {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Backup Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedBackup(null)
        }}
        title="Delete Backup"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Warning: This action cannot be undone</h4>
              <p className="text-sm text-red-700">
                This will permanently delete the backup file and all its contents.
              </p>
            </div>
          </div>

          {selectedBackup && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Backup ID:</strong> {selectedBackup.id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Created:</strong> {new Date(selectedBackup.timestamp).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Size:</strong> {formatFileSize(selectedBackup.size_bytes)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {selectedBackup.type}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedBackup(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteBackup}
              disabled={deleteBackupMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteBackupMutation.isPending ? 'Deleting...' : 'Delete Backup'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}