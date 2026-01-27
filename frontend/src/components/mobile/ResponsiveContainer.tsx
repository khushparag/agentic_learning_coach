import React from 'react'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  as?: keyof JSX.IntrinsicElements
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
  as: Component = 'div'
}: ResponsiveContainerProps) {
  const { getContainerClasses, screenSize } = useResponsiveLayout()

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16'
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  return (
    <Component
      className={`
        ${getContainerClasses()}
        ${maxWidth !== 'full' ? maxWidthClasses[maxWidth] : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </Component>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  minItemWidth?: string
}

export function ResponsiveGrid({
  children,
  className = '',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  minItemWidth
}: ResponsiveGridProps) {
  const { getGridClasses } = useResponsiveLayout()

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12'
  }

  const gridClasses = minItemWidth
    ? `grid grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))] ${gapClasses[gap]}`
    : `grid grid-cols-${columns.mobile} ${columns.tablet ? `md:grid-cols-${columns.tablet}` : ''} ${columns.desktop ? `lg:grid-cols-${columns.desktop}` : ''} ${gapClasses[gap]}`

  return (
    <div className={`${gridClasses} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: 'vertical' | 'horizontal' | 'responsive'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export function ResponsiveStack({
  children,
  className = '',
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start'
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const directionClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
    responsive: 'flex flex-col md:flex-row'
  }

  return (
    <div
      className={`
        ${directionClasses[direction]}
        ${spacingClasses[spacing]}
        ${alignClasses[align]}
        ${justifyClasses[justify]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  as?: keyof JSX.IntrinsicElements
}

export function ResponsiveCard({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  interactive = false,
  as: Component = 'div'
}: ResponsiveCardProps) {
  const { screenSize } = useResponsiveLayout()

  const paddingClasses = {
    sm: screenSize.isMobile ? 'p-3' : 'p-4',
    md: screenSize.isMobile ? 'p-4' : 'p-6',
    lg: screenSize.isMobile ? 'p-5' : 'p-8',
    xl: screenSize.isMobile ? 'p-6' : 'p-10'
  }

  const shadowClasses = {
    none: '',
    sm: screenSize.isMobile ? 'shadow-mobile' : 'shadow-sm',
    md: screenSize.isMobile ? 'shadow-mobile-lg' : 'shadow-md',
    lg: 'shadow-lg'
  }

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  }

  const interactiveClasses = interactive
    ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : ''

  return (
    <Component
      className={`
        bg-white border border-gray-200
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${roundedClasses[rounded]}
        ${interactiveClasses}
        ${className}
      `}
    >
      {children}
    </Component>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  as?: 'button' | 'a'
  href?: string
}

export function ResponsiveButton({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  as: Component = 'button',
  href
}: ResponsiveButtonProps) {
  const { screenSize } = useResponsiveLayout()

  const baseClasses = 'btn btn-accessible touch-manipulation focus-visible'

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-error',
    ghost: 'btn-ghost'
  }

  const sizeClasses = {
    sm: screenSize.isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm',
    md: screenSize.isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm',
    lg: screenSize.isMobile ? 'px-6 py-4 text-lg' : 'px-6 py-3 text-base',
    xl: screenSize.isMobile ? 'px-8 py-5 text-xl' : 'px-8 py-4 text-lg'
  }

  const widthClasses = fullWidth || screenSize.isMobile ? 'w-full' : ''

  const props = {
    className: `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${widthClasses}
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `,
    disabled: disabled || loading,
    onClick: disabled || loading ? undefined : onClick,
    ...(Component === 'button' ? { type } : {}),
    ...(Component === 'a' ? { href } : {})
  }

  return (
    <Component {...props}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Component>
  )
}

interface ResponsiveModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function ResponsiveModal({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  className = ''
}: ResponsiveModalProps) {
  const { screenSize } = useResponsiveLayout()

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = screenSize.isMobile
    ? 'w-full h-full max-w-none max-h-none rounded-none'
    : {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full max-h-full'
      }[size]

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden
          ${typeof sizeClasses === 'string' ? sizeClasses : ''}
          ${screenSize.isMobile ? 'mx-0 my-0' : 'mx-4 my-8'}
          ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors touch-target"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Export all components
export {
  ResponsiveContainer as Container,
  ResponsiveGrid as Grid,
  ResponsiveStack as Stack,
  ResponsiveCard as Card,
  ResponsiveButton as Button,
  ResponsiveModal as Modal
}
