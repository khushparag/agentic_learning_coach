import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface DashboardGridProps {
  children: ReactNode
  className?: string
}

export default function DashboardGrid({ children, className = '' }: DashboardGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface DashboardWidgetProps {
  children: ReactNode
  className?: string
  colSpan?: number
  title?: string
  action?: ReactNode
  loading?: boolean
  error?: string | null
}

export function DashboardWidget({ 
  children, 
  className = '', 
  colSpan = 4,
  title,
  action,
  loading = false,
  error = null
}: DashboardWidgetProps) {
  const getColSpanClass = (span: number) => {
    const spanMap = {
      1: 'md:col-span-1 lg:col-span-1',
      2: 'md:col-span-1 lg:col-span-2',
      3: 'md:col-span-2 lg:col-span-3',
      4: 'md:col-span-2 lg:col-span-4',
      5: 'md:col-span-2 lg:col-span-5',
      6: 'md:col-span-2 lg:col-span-6',
      7: 'md:col-span-2 lg:col-span-7',
      8: 'md:col-span-2 lg:col-span-8',
      9: 'md:col-span-2 lg:col-span-9',
      10: 'md:col-span-2 lg:col-span-10',
      11: 'md:col-span-2 lg:col-span-11',
      12: 'md:col-span-2 lg:col-span-12'
    }
    return spanMap[span as keyof typeof spanMap] || 'md:col-span-2 lg:col-span-4'
  }

  const colSpanClass = getColSpanClass(colSpan)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${colSpanClass} ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      
      <div className={`${title ? 'p-6' : 'p-6'} relative`}>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && children}
      </div>
    </motion.div>
  )
}
