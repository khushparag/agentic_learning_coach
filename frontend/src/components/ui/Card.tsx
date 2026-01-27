import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'strong';
  border?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      shadow = 'soft',
      border = true,
      rounded = 'xl',
      header,
      footer,
      className = '',
      onClick,
      ...rest
    },
    ref
  ) => {
    const baseClasses = 'bg-white';
    
    const variantClasses = {
      default: '',
      hover: 'transition-all duration-200 hover:shadow-md hover:border-gray-300',
      interactive: 'transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const shadowClasses = {
      none: '',
      soft: 'shadow-sm',
      medium: 'shadow-md',
      strong: 'shadow-lg',
    };

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
    };

    const classes = [
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      shadowClasses[shadow],
      roundedClasses[rounded],
      border ? 'border border-gray-200' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        onClick={onClick}
        {...rest}
      >
        {header && (
          <div className={`${padding !== 'none' ? 'mb-4' : ''} border-b border-gray-200 ${padding === 'none' ? 'p-4 pb-4' : 'pb-4'}`}>
            {header}
          </div>
        )}
        
        <div className={padding === 'none' && (header || footer) ? 'px-4' : ''}>
          {children}
        </div>
        
        {footer && (
          <div className={`${padding !== 'none' ? 'mt-4' : ''} border-t border-gray-200 ${padding === 'none' ? 'p-4 pt-4' : 'pt-4'}`}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export default Card;
