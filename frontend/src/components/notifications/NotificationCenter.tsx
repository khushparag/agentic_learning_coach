/**
 * Notification Center Component
 * Comprehensive notification management interface with history and filtering
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  BellIcon as BellSolidIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  TrophyIcon,
  FireIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid'
import { useNotifications, useNotificationFilters } from '../../hooks/useNotifications'
import { BaseNotification, NotificationType, NotificationPriority } from '../../types/notifications'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'

export interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotifications,
    stats,
    markAsRead,
    dismiss,
    delete: deleteNotification,
    markAllAsRead,
    clearAll
  } = useNotifications()

  const {
    filteredNotifications,
    filters,
    setTypeFilter,
    setPriorityFilter,
    setShowRead,
    setShowDismissed,
    setSearch,
    clearFilters
  } = useNotificationFilters(notifications)

  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'error':
        return <XCircleIcon className={`${iconClass} text-red-500`} />
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />
      case 'info':
        return <InformationCircleIcon className={`${iconClass} text-blue-500`} />
      case 'achievement':
        return <TrophyIcon className={`${iconClass} text-yellow-500`} />
      case 'progress':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'streak':
        return <FireIcon className={`${iconClass} text-orange-500`} />
      case 'collaboration':
        return <UserGroupIcon className={`${iconClass} text-purple-500`} />
      case 'system':
        return <BellSolidIcon className={`${iconClass} text-gray-500`} />
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-500`} />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedNotifications(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const handleBulkAction = (action: 'read' | 'dismiss' | 'delete') => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case 'read':
          markAsRead(id)
          break
        case 'dismiss':
          dismiss(id)
          break
        case 'delete':
          deleteNotification(id)
          break
      }
    })
    setSelectedNotifications(new Set())
  }

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'progress', label: 'Progress' },
    { value: 'streak', label: 'Streak' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'system', label: 'System' }
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {stats.unread} unread of {stats.total} total
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
            >
              <FunnelIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="p-2"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-gray-50"
            >
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-48">
                    <Input
                      placeholder="Search notifications..."
                      value={filters.search}
                      onChange={(e) => setSearch(e.target.value)}
                      icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                    />
                  </div>
                  <Select
                    value={filters.types[0] || ''}
                    onChange={(value) => setTypeFilter(value ? [value as NotificationType] : [])}
                    options={typeOptions}
                    placeholder="Filter by type"
                  />
                  <Select
                    value={filters.priorities[0] || ''}
                    onChange={(value) => setPriorityFilter(value ? [value as NotificationPriority] : [])}
                    options={priorityOptions}
                    placeholder="Filter by priority"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.showRead}
                      onChange={(e) => setShowRead(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show read</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.showDismissed}
                      onChange={(e) => setShowDismissed(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show dismissed</span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {selectedNotifications.size > 0 
                  ? `${selectedNotifications.size} selected`
                  : 'Select all'
                }
              </span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            {selectedNotifications.size > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('dismiss')}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Dismiss
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadNotifications.length === 0}
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={notifications.length === 0}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BellIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedNotifications.has(notification.id)}
                  onSelect={() => handleSelectNotification(notification.id)}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDismiss={() => dismiss(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  getIcon={getNotificationIcon}
                  getPriorityColor={getPriorityColor}
                  formatTime={formatRelativeTime}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

interface NotificationItemProps {
  notification: BaseNotification
  isSelected: boolean
  onSelect: () => void
  onMarkRead: () => void
  onDismiss: () => void
  onDelete: () => void
  getIcon: (type: NotificationType) => React.ReactNode
  getPriorityColor: (priority: NotificationPriority) => string
  formatTime: (date: Date) => string
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isSelected,
  onSelect,
  onMarkRead,
  onDismiss,
  onDelete,
  getIcon,
  getPriorityColor,
  formatTime
}) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`
        relative p-4 hover:bg-gray-50 transition-colors cursor-pointer
        ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
        ${notification.dismissed ? 'opacity-60' : ''}
        ${isSelected ? 'bg-blue-100' : ''}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 break-words">
                {notification.message}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{formatTime(notification.timestamp)}</span>
                </span>
                {notification.metadata?.xp && (
                  <span className="flex items-center space-x-1">
                    <span>+{notification.metadata.xp} XP</span>
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(!showActions)
                }}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMarkRead()
                        setShowActions(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mark as read
                    </button>
                  )}
                  {!notification.dismissed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDismiss()
                        setShowActions(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowActions(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter