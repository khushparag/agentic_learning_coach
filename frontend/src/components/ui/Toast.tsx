import React, { useEffect } from 'react';
import { useToastNotifications } from '../../hooks/useNotifications';
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
  const { showToast } = useToastNotifications();

  useEffect(() => {
    if (isVisible) {
      // Convert simple toast to advanced notification
      showToast({
        type: type as NotificationType,
        title,
        message: message || '',
        duration,
        priority: 'normal',
        persistent: false,
        closable: true,
      });
    }
  }, [isVisible, type, title, message, duration, id, onClose, showToast]);

  // This component doesn't render anything directly - 
  // the notification system handles the rendering
  return null;
};

export { Toast };
export default Toast;
