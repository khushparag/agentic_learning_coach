/**
 * Performance monitoring component for development and debugging
 */

import React from 'react'
import { performanceMonitor, PerformanceReport } from '../../utils/performance'
import { memoryManager } from '../../utils/memoryManagement'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface PerformanceMonitorProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showMemory?: boolean
  showWebVitals?: boolean
  showCustomMetrics?: boolean
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = import.meta.env.DEV,
  position = 'bottom-right',
  showMemory = true,
  showWebVitals = true,
  showCustomMetrics = true
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [report, setReport] = React.useState<PerformanceReport | null>(null)
  const [memoryReport, setMemoryReport] = React.useState<any>(null)

  // Update reports periodically
  React.useEffect(() => {
    if (!enabled || !isVisible) return

    const updateReports = () => {
      setReport(performanceMonitor.getPerformanceReport())
      if (showMemory) {
        setMemoryReport(memoryManager.getMemoryReport())
      }
    }

    updateReports()
    const interval = setInterval(updateReports, 2000)

    return () => clearInterval(interval)
  }, [enabled, isVisible, showMemory])

  if (!enabled) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded shadow-lg"
        >
          📊 Perf
        </Button>
      ) : (
        <Card className="w-80 max-h-96 overflow-y-auto bg-white shadow-xl border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Performance Monitor</h3>
              <Button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 text-xs px-1 py-0"
              >
                ✕
              </Button>
            </div>

            {/* Memory Usage */}
            {showMemory && memoryReport && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Memory Usage</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span className="font-mono">
                      {formatBytes(memoryReport.currentUsage.usedJSHeapSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-mono">
                      {formatBytes(memoryReport.currentUsage.totalJSHeapSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limit:</span>
                    <span className="font-mono">
                      {formatBytes(memoryReport.currentUsage.jsHeapSizeLimit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className={`font-mono ${
                      memoryReport.currentUsage.percentage > 0.8 ? 'text-red-600' :
                      memoryReport.currentUsage.percentage > 0.6 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {(memoryReport.currentUsage.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Components:</span>
                    <span className="font-mono">{memoryReport.componentCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Web Vitals */}
            {showWebVitals && report?.webVitals && report.webVitals.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Web Vitals</h4>
                <div className="space-y-1 text-xs">
                  {report.webVitals.slice(-5).map((vital, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{vital.name}:</span>
                      <span className={`font-mono ${
                        vital.rating === 'good' ? 'text-green-600' :
                        vital.rating === 'needs-improvement' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {vital.name === 'CLS' ? vital.value.toFixed(3) : `${vital.value.toFixed(0)}ms`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Metrics */}
            {showCustomMetrics && report?.customMetrics && report.customMetrics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Metrics</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {report.customMetrics.slice(-10).map((metric, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="truncate mr-2">{metric.name}:</span>
                      <span className="font-mono">
                        {metric.name.includes('time') || metric.name.includes('duration') 
                          ? formatDuration(metric.value)
                          : metric.value.toFixed(1)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource Timing */}
            {report?.resourceTiming && report.resourceTiming.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Slow Resources</h4>
                <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                  {report.resourceTiming
                    .filter(resource => (resource.responseEnd - resource.startTime) > 1000)
                    .slice(-5)
                    .map((resource, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="truncate mr-2">
                          {resource.name.split('/').pop()?.substring(0, 20)}...
                        </span>
                        <span className="font-mono text-red-600">
                          {formatDuration(resource.responseEnd - resource.startTime)}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => {
                  setReport(performanceMonitor.getPerformanceReport())
                  if (showMemory) {
                    setMemoryReport(memoryManager.getMemoryReport())
                  }
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Refresh
              </Button>
              <Button
                onClick={() => {
                  console.log('Performance Report:', report)
                  console.log('Memory Report:', memoryReport)
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Log
              </Button>
              {(window as any).gc && (
                <Button
                  onClick={() => {
                    (window as any).gc()
                    setTimeout(() => {
                      setMemoryReport(memoryManager.getMemoryReport())
                    }, 100)
                  }}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200"
                >
                  GC
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * Performance metrics display component
 */
export const PerformanceMetrics: React.FC<{
  metrics: Array<{ name: string; value: number; unit?: string }>
  title?: string
}> = ({ metrics, title = 'Performance Metrics' }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metric.value.toFixed(1)}
              {metric.unit && <span className="text-sm text-gray-500">{metric.unit}</span>}
            </div>
            <div className="text-sm text-gray-600">{metric.name}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Web Vitals display component
 */
export const WebVitalsDisplay: React.FC<{
  vitals: Array<{ name: string; value: number; rating: string }>
}> = ({ vitals }) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Web Vitals</h3>
      <div className="space-y-3">
        {vitals.map((vital, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{vital.name}</div>
              <div className="text-sm text-gray-500">
                {vital.name === 'CLS' ? 'Cumulative Layout Shift' :
                 vital.name === 'FID' ? 'First Input Delay' :
                 vital.name === 'LCP' ? 'Largest Contentful Paint' :
                 vital.name === 'FCP' ? 'First Contentful Paint' :
                 vital.name === 'TTFB' ? 'Time to First Byte' :
                 vital.name}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(vital.rating)}`}>
              {vital.name === 'CLS' ? vital.value.toFixed(3) : `${vital.value.toFixed(0)}ms`}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default PerformanceMonitor
