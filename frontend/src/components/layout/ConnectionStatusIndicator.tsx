import React from 'react'
import { 
  SignalIcon, 
  SignalSlashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'

interface ConnectionStatusIndicatorProps {
  showDetails?: boolean
  className?: string
}

export function ConnectionStatusIndicator({ 
  showDetails = false, 
  className = '' 
}: ConnectionStatusIndicatorProps) {
  const { isConnected, isChecking, error, refresh, lastChecked } = useConnectionStatus()

  const getStatusColor = () => {
    if (isChecking) return 'text-yellow-500'
    if (isConnected) return 'text-green-500'
    return 'text-red-500'
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    if (isConnected) return 'Connected'
    return 'Offline'
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <ArrowPathIcon className="w-4 h-4 animate-spin" />
    }
    if (isConnected) {
      return <SignalIcon className="w-4 h-4" />
    }
    return <SignalSlashIcon className="w-4 h-4" />
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={refresh}
        disabled={isChecking}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${getStatusColor()} hover:bg-gray-100 disabled:cursor-not-allowed`}
        title={`Backend status: ${getStatusText()}${error ? ` - ${error}` : ''}`}
      >
        {getStatusIcon()}
        {showDetails && <span>{getStatusText()}</span>}
      </button>

      {/* Warning banner when disconnected */}
      {!isConnected && !isChecking && showDetails && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>Using mock data</span>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar footer
export function ConnectionStatusBadge() {
  const { isConnected, isChecking, refresh } = useConnectionStatus()

  const getBadgeStyle = () => {
    if (isChecking) return 'bg-yellow-100 text-yellow-700'
    if (isConnected) return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  const getLabel = () => {
    if (isChecking) return 'Checking'
    if (isConnected) return 'API Connected'
    return 'Mock Mode'
  }

  return (
    <button
      onClick={refresh}
      disabled={isChecking}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle()} hover:opacity-80 transition-opacity`}
      title="Click to refresh connection status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        isChecking ? 'bg-yellow-500 animate-pulse' : 
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      {getLabel()}
    </button>
  )
}

export default ConnectionStatusIndicator
