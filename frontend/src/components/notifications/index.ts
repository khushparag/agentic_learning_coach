/**
 * Notification Components Export
 */

export { default as NotificationSystem } from './NotificationSystem'
export { default as NotificationCenter } from './NotificationCenter'
export { default as NotificationPreferences } from './NotificationPreferences'
export { default as Toast } from './Toast'
export { default as ToastContainer } from './ToastContainer'

// Re-export types
export type {
  BaseNotification,
  ToastNotification,
  NotificationPreferences as NotificationPreferencesType,
  NotificationType,
  NotificationPriority,
  PushNotification
} from '../../types/notifications'

// Re-export hooks
export {
  useNotifications,
  useToastNotifications,
  useNotificationSounds,
  useNotificationFilters
} from '../../hooks/useNotifications'

// Re-export utilities
export {
  notificationManager,
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
  createInfoNotification,
  createAchievementNotification
} from '../../utils/notifications'

// Re-export services
export { pushNotificationService } from '../../services/pushNotificationService'
