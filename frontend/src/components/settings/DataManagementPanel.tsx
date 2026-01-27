import React, { useState } from 'react'
import {
  DocumentArrowDownIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import SettingsSection from './SettingsSection'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { SettingsService } from '../../services/settingsService'
import type { DataExportRequest, AccountDeletionRequest } from '../../types/settings'

const EXPORT_OPTIONS = [
  {
    key: 'includeProgress',
    label: 'Learning Progress',
    description: 'Your completed exercises, scores, and progress tracking data',
  },
  {
    key: 'includeSubmissions',
    label: 'Code Submissions',
    description: 'All your code submissions and exercise solutions',
  },
  {
    key: 'includeAchievements',
    label: 'Achievements & Badges',
    description: 'Your unlocked achievements, badges, and gamification data',
  },
  {
    key: 'includeSocialData',
    label: 'Social Data',
    description: 'Study group memberships, shared solutions, and social interactions',
  },
]

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON', description: 'Machine-readable format, good for importing elsewhere' },
  { value: 'csv', label: 'CSV', description: 'Spreadsheet format, good for analysis' },
]

export default function DataManagementPanel() {
  const [exportOptions, setExportOptions] = useState<DataExportRequest>({
    includeProgress: true,
    includeSubmissions: true,
    includeAchievements: true,
    includeSocialData: false,
    format: 'json',
  })
  
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    downloadUrl?: string
    error?: string
  } | null>(null)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteRequest, setDeleteRequest] = useState<AccountDeletionRequest>({
    confirmationText: '',
    reason: '',
    feedback: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExportOptionChange = (key: keyof DataExportRequest) => (checked: boolean) => {
    setExportOptions(prev => ({ ...prev, [key]: checked }))
  }

  const handleExportData = async () => {
    setIsExporting(true)
    setExportResult(null)
    
    try {
      const result = await SettingsService.exportData(exportOptions)
      setExportResult({ success: true, downloadUrl: result.downloadUrl })
      
      // Automatically download the file
      if (result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `learning-data-export.${exportOptions.format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteRequest.confirmationText !== 'DELETE MY ACCOUNT') {
      return
    }
    
    setIsDeleting(true)
    
    try {
      await SettingsService.deleteAccount(deleteRequest)
      // Redirect to goodbye page or logout
      window.location.href = '/goodbye'
    } catch (error) {
      console.error('Account deletion failed:', error)
      alert('Account deletion failed. Please try again or contact support.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <SettingsSection
        title="Export Your Data"
        description="Download a copy of all your learning data"
        icon={DocumentArrowDownIcon}
      >
        <div className="space-y-6">
          {/* Export Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">What to include</h4>
            <div className="space-y-3">
              {EXPORT_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions[option.key as keyof DataExportRequest] as boolean}
                    onChange={(e) => handleExportOptionChange(option.key as keyof DataExportRequest)(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export format</h4>
            <div className="space-y-2">
              {EXPORT_FORMATS.map((format) => (
                <label key={format.value} className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={exportOptions.format === format.value}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">
                Your data will be prepared and downloaded as a file. This may take a few moments.
              </p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              loading={isExporting}
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          {/* Export Result */}
          {exportResult && (
            <div className={`p-4 rounded-lg border ${
              exportResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {exportResult.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <div className={`font-medium ${
                    exportResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {exportResult.success ? 'Export Successful' : 'Export Failed'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    exportResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {exportResult.success
                      ? 'Your data has been exported and downloaded.'
                      : exportResult.error || 'An error occurred during export.'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Data Import */}
      <SettingsSection
        title="Import Settings"
        description="Import settings from a backup file"
        icon={CloudArrowUpIcon}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drop a settings backup file here, or click to browse
            </p>
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="settings-import"
            />
            <label
              htmlFor="settings-import"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Choose File
            </label>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Importing settings will overwrite your current configuration. 
                Make sure to export your current settings first if you want to keep them.
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Storage Usage */}
      <SettingsSection
        title="Storage Usage"
        description="See how much storage your data is using"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2.4 MB</div>
                <div className="text-sm text-gray-600">Code Submissions</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">856 KB</div>
                <div className="text-sm text-gray-600">Progress Data</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">124 KB</div>
                <div className="text-sm text-gray-600">Settings & Preferences</div>
              </div>
            </Card>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Total Usage</span>
              <span className="text-sm text-gray-600">3.38 MB of 100 MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '3.38%' }}></div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Account Deletion */}
      <SettingsSection
        title="Delete Account"
        description="Permanently delete your account and all associated data"
        icon={TrashIcon}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800">Danger Zone</div>
              <div className="text-sm text-red-700 mt-1">
                Once you delete your account, there is no going back. This action cannot be undone.
                All your learning progress, code submissions, and achievements will be permanently deleted.
              </div>
              <Button
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteModal(true)}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>This action cannot be undone.</strong> All your data will be permanently deleted:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Learning progress and achievements</li>
                  <li>Code submissions and solutions</li>
                  <li>Study group memberships</li>
                  <li>Account settings and preferences</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE MY ACCOUNT" to confirm
            </label>
            <Input
              value={deleteRequest.confirmationText}
              onChange={(e) => setDeleteRequest(prev => ({ ...prev, confirmationText: e.target.value }))}
              placeholder="DELETE MY ACCOUNT"
              className="font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for leaving (optional)
            </label>
            <select
              value={deleteRequest.reason}
              onChange={(e) => setDeleteRequest(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason</option>
              <option value="not_useful">Not useful for my needs</option>
              <option value="too_difficult">Too difficult</option>
              <option value="too_easy">Too easy</option>
              <option value="technical_issues">Technical issues</option>
              <option value="privacy_concerns">Privacy concerns</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional feedback (optional)
            </label>
            <Textarea
              value={deleteRequest.feedback}
              onChange={(e) => setDeleteRequest(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Help us improve by sharing your feedback..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteRequest.confirmationText !== 'DELETE MY ACCOUNT' || isDeleting}
              loading={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
