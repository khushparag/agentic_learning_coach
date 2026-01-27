import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      className = '',
      showLabel = false,
      size = 'md',
      variant = 'default',
      label,
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const variantClasses = {
      default: 'bg-blue-600',
      primary: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-500',
      error: 'bg-red-600',
    };

    const containerClasses = [
      'w-full bg-gray-200 rounded-full overflow-hidden',
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const barClasses = [
      'h-full rounded-full transition-all duration-300 ease-out',
      variantClasses[variant],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className="w-full">
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1">
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {showLabel && (
              <span className="text-sm text-gray-500">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          className={containerClasses}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${Math.round(percentage)}%`}
        >
          <div
            className={barClasses}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
export default Progress;
