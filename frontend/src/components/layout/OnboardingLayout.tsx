import { ReactNode } from 'react'

interface OnboardingLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function OnboardingLayout({ children, title, subtitle }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {title && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
