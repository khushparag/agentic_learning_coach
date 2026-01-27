import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ResizablePanelsProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  initialLeftWidth?: number // percentage (0-100)
  minLeftWidth?: number // percentage
  maxLeftWidth?: number // percentage
  className?: string
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  leftPanel,
  rightPanel,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className = ''
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number>(0)
  const dragStartWidth = useRef<number>(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = leftWidth
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX.current
    const deltaPercent = (deltaX / containerRect.width) * 100
    const newWidth = Math.max(
      minLeftWidth,
      Math.min(maxLeftWidth, dragStartWidth.current + deltaPercent)
    )
    
    setLeftWidth(newWidth)
  }, [isDragging, minLeftWidth, maxLeftWidth])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleDoubleClick = useCallback(() => {
    setLeftWidth(50) // Reset to center
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`flex h-full ${className}`}
    >
      {/* Left Panel */}
      <div 
        style={{ width: `${leftWidth}%` }}
        className="flex flex-col min-w-0"
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className={`
          relative w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize
          hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors duration-200
          ${isDragging ? 'bg-blue-500 dark:bg-blue-400' : ''}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Resize Handle */}
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200">
          </div>
        </div>
        
        {/* Drag Indicator */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg"
          >
            {Math.round(leftWidth)}%
          </motion.div>
        )}
      </div>

      {/* Right Panel */}
      <div 
        style={{ width: `${100 - leftWidth}%` }}
        className="flex flex-col min-w-0"
      >
        {rightPanel}
      </div>
    </div>
  )
}

export default ResizablePanels
