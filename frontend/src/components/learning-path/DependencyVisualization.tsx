import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, CheckCircleIcon, PlayCircleIcon, LockClosedIcon, ClockIcon } from '@heroicons/react/24/solid'
import { LearningModule } from '../../types/learning-path'

interface DependencyVisualizationProps {
  modules: LearningModule[]
  className?: string
}

interface ModuleNode {
  id: string
  title: string
  status: LearningModule['status']
  progress: number
  x: number
  y: number
  level: number
}

interface Connection {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

const DependencyVisualization: React.FC<DependencyVisualizationProps> = ({
  modules,
  className = ''
}) => {
  const { nodes, connections } = useMemo(() => {
    // Create a dependency graph based on module order and prerequisites
    const sortedModules = [...modules].sort((a, b) => a.order - b.order)
    
    // Calculate positions for modules in a flow layout
    const nodesMap = new Map<string, ModuleNode>()
    const connectionsArray: Connection[] = []
    
    // Layout parameters
    const nodeWidth = 200
    const nodeHeight = 80
    const horizontalSpacing = 280
    const verticalSpacing = 120
    const maxNodesPerRow = 3
    
    sortedModules.forEach((module, index) => {
      const row = Math.floor(index / maxNodesPerRow)
      const col = index % maxNodesPerRow
      
      // Center nodes in each row
      const nodesInRow = Math.min(maxNodesPerRow, sortedModules.length - row * maxNodesPerRow)
      const rowOffset = (maxNodesPerRow - nodesInRow) * horizontalSpacing / 2
      
      const x = col * horizontalSpacing + rowOffset + nodeWidth / 2
      const y = row * verticalSpacing + nodeHeight / 2
      
      const node: ModuleNode = {
        id: module.id,
        title: module.title,
        status: module.status,
        progress: module.progress,
        x,
        y,
        level: row
      }
      
      nodesMap.set(module.id, node)
      
      // Create connections based on prerequisites or sequential order
      if (module.prerequisites && module.prerequisites.length > 0) {
        module.prerequisites.forEach(prereqId => {
          const prereqNode = nodesMap.get(prereqId)
          if (prereqNode) {
            connectionsArray.push({
              from: prereqId,
              to: module.id,
              fromX: prereqNode.x,
              fromY: prereqNode.y,
              toX: x,
              toY: y
            })
          }
        })
      } else if (index > 0) {
        // If no explicit prerequisites, connect to previous module
        const prevModule = sortedModules[index - 1]
        const prevNode = nodesMap.get(prevModule.id)
        if (prevNode) {
          connectionsArray.push({
            from: prevModule.id,
            to: module.id,
            fromX: prevNode.x,
            fromY: prevNode.y,
            toX: x,
            toY: y
          })
        }
      }
    })
    
    return {
      nodes: Array.from(nodesMap.values()),
      connections: connectionsArray
    }
  }, [modules])

  const getStatusIcon = (status: LearningModule['status']) => {
    const iconClass = "w-4 h-4"
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'current':
        return <PlayCircleIcon className={`${iconClass} text-blue-500`} />
      case 'upcoming':
        return <ClockIcon className={`${iconClass} text-yellow-500`} />
      case 'locked':
        return <LockClosedIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getStatusColor = (status: LearningModule['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-green-100 text-green-800'
      case 'current':
        return 'border-blue-300 bg-blue-100 text-blue-800'
      case 'upcoming':
        return 'border-yellow-300 bg-yellow-100 text-yellow-800'
      case 'locked':
        return 'border-gray-300 bg-gray-100 text-gray-600'
    }
  }

  const getConnectionColor = (fromStatus: LearningModule['status'], toStatus: LearningModule['status']) => {
    if (fromStatus === 'completed' && toStatus === 'current') {
      return 'stroke-blue-400'
    } else if (fromStatus === 'completed') {
      return 'stroke-green-400'
    } else if (fromStatus === 'current') {
      return 'stroke-blue-400'
    }
    return 'stroke-gray-300'
  }

  // Calculate SVG dimensions
  const maxX = Math.max(...nodes.map(n => n.x)) + 100
  const maxY = Math.max(...nodes.map(n => n.y)) + 50
  const svgWidth = Math.max(maxX, 800)
  const svgHeight = Math.max(maxY, 400)

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Path Dependencies</h3>
        <p className="text-sm text-gray-600">
          This diagram shows how modules connect and build upon each other in your learning journey.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
        >
          {/* Render connections */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
                className="text-gray-400"
              />
            </marker>
          </defs>

          {connections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from)
            const toNode = nodes.find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null

            // Calculate connection path with some curve
            const midX = (connection.fromX + connection.toX) / 2
            const midY = (connection.fromY + connection.toY) / 2
            const controlY = midY - 20 // Slight curve upward

            return (
              <motion.path
                key={`${connection.from}-${connection.to}`}
                d={`M ${connection.fromX + 80} ${connection.fromY} Q ${midX} ${controlY} ${connection.toX - 80} ${connection.toY}`}
                fill="none"
                strokeWidth="2"
                className={getConnectionColor(fromNode.status, toNode.status)}
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            )
          })}

          {/* Render nodes */}
          {nodes.map((node, index) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Node background */}
              <rect
                x={node.x - 80}
                y={node.y - 30}
                width="160"
                height="60"
                rx="8"
                className={`${getStatusColor(node.status)} border-2`}
              />
              
              {/* Progress bar */}
              <rect
                x={node.x - 75}
                y={node.y + 20}
                width="150"
                height="4"
                rx="2"
                className="fill-white opacity-50"
              />
              <motion.rect
                x={node.x - 75}
                y={node.y + 20}
                width={150 * (node.progress / 100)}
                height="4"
                rx="2"
                className={`${
                  node.status === 'completed' ? 'fill-green-600' :
                  node.status === 'current' ? 'fill-blue-600' :
                  'fill-gray-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: 150 * (node.progress / 100) }}
                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
              />
              
              {/* Node text */}
              <text
                x={node.x}
                y={node.y - 5}
                textAnchor="middle"
                className="text-sm font-medium fill-current"
                style={{ fontSize: '12px' }}
              >
                {node.title.length > 20 ? `${node.title.substring(0, 20)}...` : node.title}
              </text>
              
              {/* Progress percentage */}
              <text
                x={node.x}
                y={node.y + 10}
                textAnchor="middle"
                className="text-xs fill-current opacity-75"
                style={{ fontSize: '10px' }}
              >
                {node.progress}%
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <PlayCircleIcon className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Current</span>
        </div>
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600">Upcoming</span>
        </div>
        <div className="flex items-center space-x-2">
          <LockClosedIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Locked</span>
        </div>
      </div>
    </div>
  )
}

export default DependencyVisualization