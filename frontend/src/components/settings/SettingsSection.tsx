import React from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}

export default function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className = '',
}: SettingsSectionProps) {
  return (
    <div className={`border-b border-gray-200 last:border-b-0 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center space-x-3 mb-4">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}