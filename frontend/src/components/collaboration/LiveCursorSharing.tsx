/**
 * Live Cursor Sharing Component
 * Displays real-time cursors and selections from other users in Monaco Editor
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { editor } from 'monaco-editor'
import type { CursorPosition, CollaborationUser } from '../../types/collaboration'
import { collaborationService } from '../../services/collaborationService'

interface LiveCursorSharingProps {
  editor: editor.IStandaloneCodeEditor | null
  currentUser: CollaborationUser
  enabled?: boolean
}

interface RemoteCursor {
  userId: string
  username: string
  color: string
  decoration: string[]
  widget: editor.IContentWidget | null
  lastUpdate: Date
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export const LiveCursorSharing: React.FC<LiveCursorSharingProps> = ({
  editor,
  currentUser,
  enabled = true
}) => {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map())
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>()

  // Generate consistent color for user
  const getUserColor = useCallback((userId: string): string => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
  }, [])

  // Create cursor widget
  const createCursorWidget = useCallback((cursor: CursorPosition): editor.IContentWidget => {
    const domNode = document.createElement('div')
    domNode.className = 'live-cursor'
    domNode.style.cssText = `
      position: absolute;
      width: 2px;
      height: 20px;
      background-color: ${cursor.color};
      pointer-events: none;
      z-index: 1000;
      animation: cursor-blink 1s infinite;
    `

    // Add username label
    const label = document.createElement('div')
    label.className = 'live-cursor-label'
    label.textContent = cursor.username
    label.style.cssText = `
      position: absolute;
      top: -25px;
      left: 0;
      background-color: ${cursor.color};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0.9;
    `
    domNode.appendChild(label)

    return {
      getId: () => `cursor-${cursor.userId}`,
      getDomNode: () => domNode,
      getPosition: () => ({
        position: cursor.position,
        preference: [(window as any).monaco.editor.ContentWidgetPositionPreference.EXACT]
      })
    }
  }, [])

  // Create selection decoration
  const createSelectionDecoration = useCallback((cursor: CursorPosition): editor.IModelDeltaDecoration => {
    if (!cursor.selection) {
      return {
        range: new (window as any).monaco.Range(
          cursor.position.lineNumber,
          cursor.position.column,
          cursor.position.lineNumber,
          cursor.position.column
        ),
        options: {
          className: `live-cursor-line-${cursor.userId}`,
          stickiness: (window as any).monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      }
    }

    return {
      range: new (window as any).monaco.Range(
        cursor.selection.startLineNumber,
        cursor.selection.startColumn,
        cursor.selection.endLineNumber,
        cursor.selection.endColumn
      ),
      options: {
        className: `live-selection-${cursor.userId}`,
        stickiness: (window as any).monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }
  }, [])

  // Update cursor position
  const updateCursor = useCallback((cursorData: CursorPosition) => {
    if (!editor || !enabled || cursorData.userId === currentUser.id) return

    const color = getUserColor(cursorData.userId)
    const cursorWithColor = { ...cursorData, color }

    setRemoteCursors(prev => {
      const newCursors = new Map(prev)
      const existingCursor = newCursors.get(cursorData.userId)

      // Remove old decorations and widget
      if (existingCursor) {
        if (existingCursor.decoration.length > 0) {
          editor.deltaDecorations(existingCursor.decoration, [])
        }
        if (existingCursor.widget) {
          editor.removeContentWidget(existingCursor.widget)
        }
      }

      // Create new decoration and widget
      const decoration = editor.deltaDecorations([], [createSelectionDecoration(cursorWithColor)])
      const widget = createCursorWidget(cursorWithColor)
      editor.addContentWidget(widget)

      const newCursor: RemoteCursor = {
        userId: cursorData.userId,
        username: cursorData.username,
        color,
        decoration,
        widget,
        lastUpdate: new Date()
      }

      newCursors.set(cursorData.userId, newCursor)
      cursorsRef.current = newCursors
      return newCursors
    })
  }, [editor, enabled, currentUser.id, getUserColor, createSelectionDecoration, createCursorWidget])

  // Remove cursor
  const removeCursor = useCallback((userId: string) => {
    if (!editor) return

    setRemoteCursors(prev => {
      const newCursors = new Map(prev)
      const cursor = newCursors.get(userId)

      if (cursor) {
        // Remove decorations and widget
        if (cursor.decoration.length > 0) {
          editor.deltaDecorations(cursor.decoration, [])
        }
        if (cursor.widget) {
          editor.removeContentWidget(cursor.widget)
        }
        newCursors.delete(userId)
      }

      cursorsRef.current = newCursors
      return newCursors
    })
  }, [editor])

  // Send cursor updates
  const sendCursorUpdate = useCallback(() => {
    if (!editor || !enabled) return

    const position = editor.getPosition()
    const selection = editor.getSelection()

    if (position) {
      const cursorData: CursorPosition = {
        userId: currentUser.id,
        username: currentUser.username,
        color: getUserColor(currentUser.id),
        position: {
          lineNumber: position.lineNumber,
          column: position.column
        },
        timestamp: new Date()
      }

      if (selection && !selection.isEmpty()) {
        cursorData.selection = {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        }
      }

      collaborationService.updateCursor(cursorData.position, cursorData.selection)
    }
  }, [editor, enabled, currentUser, getUserColor])

  // Cleanup old cursors
  const cleanupOldCursors = useCallback(() => {
    const now = new Date()
    const timeout = 30000 // 30 seconds

    cursorsRef.current.forEach((cursor, userId) => {
      if (now.getTime() - cursor.lastUpdate.getTime() > timeout) {
        removeCursor(userId)
      }
    })
  }, [removeCursor])

  // Setup editor event listeners
  useEffect(() => {
    if (!editor || !enabled) return

    const disposables: { dispose: () => void }[] = []

    // Listen for cursor position changes
    disposables.push(
      editor.onDidChangeCursorPosition(() => {
        sendCursorUpdate()
      })
    )

    // Listen for selection changes
    disposables.push(
      editor.onDidChangeCursorSelection(() => {
        sendCursorUpdate()
      })
    )

    return () => {
      disposables.forEach(d => d.dispose())
    }
  }, [editor, enabled, sendCursorUpdate])

  // Setup collaboration service listeners
  useEffect(() => {
    if (!enabled) return

    const unsubscribeCursorUpdate = collaborationService.on('cursor_update', updateCursor)
    const unsubscribeUserLeft = collaborationService.on('user_left', (data: { userId: string }) => {
      removeCursor(data.userId)
    })

    return () => {
      unsubscribeCursorUpdate()
      unsubscribeUserLeft()
    }
  }, [enabled, updateCursor, removeCursor])

  // Setup cleanup interval
  useEffect(() => {
    if (!enabled) return

    cleanupTimeoutRef.current = setInterval(cleanupOldCursors, 10000) // Every 10 seconds

    return () => {
      if (cleanupTimeoutRef.current) {
        clearInterval(cleanupTimeoutRef.current)
      }
    }
  }, [enabled, cleanupOldCursors])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        // Remove all cursors
        cursorsRef.current.forEach((cursor) => {
          if (cursor.decoration.length > 0) {
            editor.deltaDecorations(cursor.decoration, [])
          }
          if (cursor.widget) {
            editor.removeContentWidget(cursor.widget)
          }
        })
      }
      cursorsRef.current.clear()
    }
  }, [editor])

  // Add CSS styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }

      .live-cursor {
        border-left: 2px solid;
        margin-left: -1px;
      }

      .live-cursor-label {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transform: translateY(-100%);
      }

      ${USER_COLORS.map((color, index) => `
        .live-cursor-line-user-${index} {
          background-color: ${color}20;
          border-left: 2px solid ${color};
        }

        .live-selection-user-${index} {
          background-color: ${color}20;
        }
      `).join('\n')}
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null // This component doesn't render anything visible
}

export default LiveCursorSharing