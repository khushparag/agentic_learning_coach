import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useKeyboardNavigation } from '../../hooks/useAccessibility';
import { useAccessibilityAware } from '../../contexts/AccessibilityContext';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
}

export interface AccessibleNavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  'aria-label'?: string;
}

const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  orientation = 'vertical',
  className = '',
  'aria-label': ariaLabel = 'Main navigation'
}) => {
  const location = useLocation();
  const { containerRef } = useKeyboardNavigation({
    orientation,
    wrap: true,
    itemSelector: 'a[role="menuitem"]:not([aria-disabled="true"])'
  });
  
  const { getFocusClass, announce } = useAccessibilityAware();

  const handleNavigation = (item: NavigationItem) => {
    if (!item.disabled) {
      announce(`Navigating to ${item.label}`, 'polite');
    }
  };

  const isCurrentPage = (href: string): boolean => {
    return location.pathname === href;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isCurrent = isCurrentPage(item.href);
    const focusClass = getFocusClass();
    
    const baseClasses = `
      nav-accessible block w-full text-left px-3 py-2 rounded-md text-sm font-medium
      transition-colors duration-150 ease-in-out
      ${focusClass}
      ${item.disabled 
        ? 'text-gray-400 cursor-not-allowed' 
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }
      ${isCurrent 
        ? 'bg-primary-100 text-primary-900 border-l-4 border-primary-500' 
        : ''
      }
      ${level > 0 ? `ml-${level * 4}` : ''}
    `;

    return (
      <li key={item.id} role="none">
        <NavLink
          to={item.href}
          className={({ isActive }) => `
            ${baseClasses}
            ${isActive ? 'bg-primary-100 text-primary-900' : ''}
          `}
          role="menuitem"
          aria-current={isCurrent ? 'page' : undefined}
          aria-disabled={item.disabled}
          tabIndex={item.disabled ? -1 : 0}
          onClick={() => handleNavigation(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {item.icon && (
                <span 
                  className="mr-3 flex-shrink-0 w-5 h-5"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </div>
            
            {item.badge && (
              <span 
                className="
                  ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs 
                  font-medium bg-primary-100 text-primary-800
                "
                aria-label={`${item.badge} notifications`}
              >
                {item.badge}
              </span>
            )}
          </div>
        </NavLink>
        
        {/* Render children if they exist */}
        {item.children && item.children.length > 0 && (
          <ul role="menu" aria-label={`${item.label} submenu`} className="mt-1">
            {item.children.map(child => renderNavigationItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav 
      ref={containerRef}
      className={`nav-accessible ${className}`}
      aria-label={ariaLabel}
      role="navigation"
    >
      <ul 
        role="menubar" 
        className={`
          space-y-1
          ${orientation === 'horizontal' ? 'flex space-y-0 space-x-1' : ''}
        `}
        aria-orientation={orientation}
      >
        {items.map(item => renderNavigationItem(item))}
      </ul>
      
      {/* Screen reader instructions */}
      <div className="sr-only">
        <p>Use arrow keys to navigate between menu items</p>
        <p>Press Enter or Space to activate a menu item</p>
        {orientation === 'vertical' && (
          <p>Use Up and Down arrow keys to move between items</p>
        )}
        {orientation === 'horizontal' && (
          <p>Use Left and Right arrow keys to move between items</p>
        )}
      </div>
    </nav>
  );
};

export default AccessibleNavigation;
