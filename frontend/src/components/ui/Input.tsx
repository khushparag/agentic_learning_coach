import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode; // Alias for leftIcon
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      icon,
      fullWidth = false,
      className = '',
      id,
      name,
      required,
      ...props
    },
    ref
  ) => {
    const fieldName = name || id || 'input';
    const inputId = id || `input-${fieldName}-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helperText ? `${inputId}-help` : undefined;
    
    // Build describedBy string
    const describedByIds = [errorId, helpId].filter(Boolean).join(' ');
    
    // Use icon as leftIcon if leftIcon not provided
    const effectiveLeftIcon = leftIcon || icon;
    
    const inputClasses = [
      'block w-full px-3 py-2 text-sm border rounded-lg bg-white placeholder-gray-400 transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      'disabled:bg-gray-50 disabled:text-gray-500',
      error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
      effectiveLeftIcon ? 'pl-10' : '',
      rightIcon || error ? 'pr-10' : '',
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {effectiveLeftIcon && (
            <div 
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <span className="text-gray-400 w-4 h-4">{effectiveLeftIcon}</span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            name={name}
            className={inputClasses}
            aria-invalid={!!error}
            aria-required={required}
            aria-describedby={describedByIds || undefined}
            {...props}
          />
          
          {rightIcon && !error && (
            <div 
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <span className="text-gray-400 w-4 h-4">{rightIcon}</span>
            </div>
          )}
          
          {error && (
            <div 
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={errorId}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={helpId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
