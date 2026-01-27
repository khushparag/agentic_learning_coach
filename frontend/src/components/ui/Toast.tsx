import React, { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationType } from '../../types/notifications';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
  onClose: (id: string) => void;
}

/**
 * Simplified Toast component for backward compatibility
 * This wraps the advanced notifications system with a simpler interface
 */
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  isVisible,
  onClose,
}) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isVisible) {
      // Convert simple toast to advanced notification
      addNotification({
        type: type as NotificationType,
        title,
        message: message || '',
        duration,
        closable: true,
        onClose: () => onClose(id),
      });
    }
  }, [isVisible, type, title, message, duration, id, onClose, addNotification]);

  // This component doesn't render anything directly - 
  // the notification system handles the rendering
  return null;
};

export { Toast };
export default Toast;