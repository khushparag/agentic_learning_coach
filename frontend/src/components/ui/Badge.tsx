import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  icon,
  dot = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'badge';
  
  const variantClasses = {
    primary: 'badge-primary',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    gray: 'badge-gray',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'primary' ? 'bg-primary-600' :
          variant === 'secondary' ? 'bg-secondary-600' :
          variant === 'success' ? 'bg-success-600' :
          variant === 'warning' ? 'bg-warning-600' :
          variant === 'error' ? 'bg-error-600' :
          'bg-gray-600'
        }`} />
      )}
      
      {icon && (
        <span className={`${iconSizeClasses[size]} mr-1`}>
          {icon}
        </span>
      )}
      
      {children}
    </span>
  );
};

export { Badge };
export default Badge;