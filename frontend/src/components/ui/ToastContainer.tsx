import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationType } from '../../types/notifications';

interface ToastContextType {
  addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; duration?: number }) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Simplified ToastProvider for backward compatibility
 * This wraps the advanced notifications system with a simpler interface
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { addNotification, dismissNotification } = useNotifications();

  const addToast = (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; duration?: number }) => {
    addNotification({
      type: toast.type as NotificationType,
      title: toast.title,
      message: toast.message || '',
      duration: toast.duration || 5000,
      closable: true,
    });
  };

  const removeToast = (id: string) => {
    dismissNotification(id);
  };

  const success = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const error = (title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  };

  const warning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const info = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* The actual toast rendering is handled by the notifications system */}
    </ToastContext.Provider>
  );
};

export default ToastProvider;