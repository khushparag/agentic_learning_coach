import React, { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  isVisible,
  onClose,
}) => {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: 'text-success-600',
      title: 'text-success-800',
      message: 'text-success-700',
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      icon: 'text-error-600',
      title: 'text-error-800',
      message: 'text-error-700',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: 'text-warning-600',
      title: 'text-warning-800',
      message: 'text-warning-700',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      icon: 'text-primary-600',
      title: 'text-primary-800',
      message: 'text-primary-700',
    },
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`max-w-sm w-full ${colorScheme.bg} ${colorScheme.border} border rounded-lg shadow-medium pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-5 w-5 ${colorScheme.icon}`} aria-hidden="true" />
            </div>
            
            <div className="ml-3 w-0 flex-1">
              <p className={`text-sm font-medium ${colorScheme.title}`}>
                {title}
              </p>
              {message && (
                <p className={`mt-1 text-sm ${colorScheme.message}`}>
                  {message}
                </p>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`inline-flex ${colorScheme.message} hover:${colorScheme.title} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md`}
                onClick={() => onClose(id)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export { Toast };
export default Toast;