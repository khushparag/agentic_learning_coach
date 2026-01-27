/**
 * Collaborative Code Editor
 * Enhanced Monaco Editor with real-time collaboration features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Users, Wifi, WifiOff, Settings, Share2, Lock, Unlock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LiveCursorSharing } from './LiveCursorSharing'
import { CodeReviewInterface } from './CodeReviewInterface'
import { RealTimeChat } from './RealTimeChat'
import { useCollaboration } from '../../hooks/useCollaboration'
import { collaborationService } from '../../services/collaborationService'
import type { CollaborationUser } from '../../types/collaboration'

interface CollaborativeCodeEditorProps {
  initialCode?: string
  language?: string
  theme?: string
  currentUser: CollaborationUser
  sessionId?: string
  submissionId?: string
  readOnly?: boolean
  onCodeChange?: (code: string) => void
  onSave?: (code: string) => void
  className?: string
}

interface CodeChange {
  content: string
  operation: 'insert' | 'delete' | 'replace'
  range?: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
  userId: string
  timestamp: Date
}

export const CollaborativeCodeEditor: React.FC<CollaborativeCodeEditorProps> = ({
  initialCode = '',
  language = 'typescript',
  theme = 'vs-dark',
  currentUser,
  sessionId,
  submissionId,
  readOnly = false,
  onCodeChange,
  onSave,
  className = ''
}) => {
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null)
  const [code, setCode] = useState(initialCode)
  const [isLocked, setIsLocked] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [_pendingChanges, _setPendingChanges] = useState<CodeChange[]>([])
  const [isApplyingRemoteChange, setIsApplyingRemoteChange] = useState(false)

  const lastChangeRef = useRef<string>('')
  const changeTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize collaboration
  const collaboration = useCollaboration(currentUser, {
    autoConnect: true,
    enableCursors: true,
    enableChat: true,
    enableProgressSharing: true
  })

  // Handle editor mount
  const handleEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    setEditor(editorInstance)

    // Configure editor for collaboration
    editorInstance.updateOptions({
      readOnly: readOnly || isLocked,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      selectOnLineNumbers: true,
      automaticLayout: true
    })

    // Setup change listener
    const disposable = editorInstance.onDidChangeModelContent((e) => {
      if (isApplyingRemoteChange) return

      const newCode = editorInstance.getValue()
      setCode(newCode)
      onCodeChange?.(newCode)

      // Debounce remote change broadcasting
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }

      changeTimeoutRef.current = setTimeout(() => {
        if (collaboration.currentSession && newCode !== lastChangeRef.current) {
          broadcastCodeChange(newCode, e.changes)
          lastChangeRef.current = newCode
        }
      }, 300)
    })

    return () => {
      disposable.dispose()
    }
  }, [readOnly, isLocked, isApplyingRemoteChange, onCodeChange, collaboration.currentSession])

  // Broadcast code changes to other participants
  const broadcastCodeChange = useCallback((newCode: string, changes: editor.IModelContentChange[]) => {
    if (!collaboration.currentSession) return

    changes.forEach(change => {
      const codeChange: CodeChange = {
        content: change.text,
        operation: change.text === '' ? 'delete' : change.rangeLength === 0 ? 'insert' : 'replace',
        range: {
          startLineNumber: change.range.startLineNumber,
          startColumn: change.range.startColumn,
          endLineNumber: change.range.endLineNumber,
          endColumn: change.range.endColumn
        },
        userId: currentUser.id,
        timestamp: new Date()
      }

      // Send via collaboration service
      collaboration.sendMessage(JSON.stringify(codeChange), 'code_change')
    })
  }, [collaboration, currentUser.id])

  // Apply remote code changes
  const applyRemoteChange = useCallback((change: CodeChange) => {
    if (!editor || change.userId === currentUser.id) return

    setIsApplyingRemoteChange(true)

    try {
      const model = editor.getModel()
      if (!model || !change.range) return

      const range = new (window as any).monaco.Range(
        change.range.startLineNumber,
        change.range.startColumn,
        change.range.endLineNumber,
        change.range.endColumn
      )

      // Apply the change
      const operation: editor.IIdentifiedSingleEditOperation = {
        range,
        text: change.content,
        forceMoveMarkers: true
      }

      editor.executeEdits('remote-change', [operation])
      
      // Update local state
      setCode(editor.getValue())
      onCodeChange?.(editor.getValue())
      lastChangeRef.current = editor.getValue()

    } catch (error) {
      console.error('Failed to apply remote change:', error)
    } finally {
      setIsApplyingRemoteChange(false)
    }
  }, [editor, currentUser.id, onCodeChange])

  // Handle save
  const handleSave = useCallback(() => {
    if (editor) {
      const currentCode = editor.getValue()
      onSave?.(currentCode)
      
      // Broadcast save event
      if (collaboration.currentSession) {
        collaboration.shareProgress('task_completed', {
          taskName: 'Code saved',
          xpGained: 10
        }, 'Saved code changes')
      }
    }
  }, [editor, onSave, collaboration])

  // Toggle editor lock
  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      const newLocked = !prev
      editor?.updateOptions({ readOnly: readOnly || newLocked })
      
      // Broadcast lock status
      if (collaboration.currentSession) {
        collaboration.sendMessage(JSON.stringify({
          type: 'editor_lock',
          locked: newLocked,
          userId: currentUser.id
        }), 'system')
      }
      
      return newLocked
    })
  }, [editor, readOnly, collaboration, currentUser.id])

  // Join collaboration session
  useEffect(() => {
    if (sessionId && !collaboration.currentSession) {
      collaboration.joinSession(sessionId).catch(console.error)
    }
  }, [sessionId, collaboration])

  // Listen for remote code changes via collaboration service events
  useEffect(() => {
    const handleMessage = (message: any) => {
      try {
        const data = typeof message.content === 'string' ? JSON.parse(message.content) : message
        if (data.operation && data.userId !== currentUser.id) {
          applyRemoteChange(data)
        } else if (data.type === 'editor_lock') {
          // Handle remote lock/unlock
          console.log(`Editor ${data.locked ? 'locked' : 'unlocked'} by ${data.userId}`)
        }
      } catch (error) {
        // Not a code change message, ignore
      }
    }

    // Subscribe to code_change events from collaboration service
    const unsubscribe = collaborationService.on('code_change', handleMessage)
    return () => {
      unsubscribe()
    }
  }, [currentUser.id, applyRemoteChange])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    // Save: Cmd/Ctrl + S
    editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyS, () => {
      handleSave()
    })
    
    // Toggle chat: Cmd/Ctrl + Shift + C
    editor.addCommand(
      (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyMod.Shift | (window as any).monaco.KeyCode.KeyC,
      () => setShowChat(prev => !prev)
    )
    
    // Toggle review: Cmd/Ctrl + Shift + R
    editor.addCommand(
      (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyMod.Shift | (window as any).monaco.KeyCode.KeyR,
      () => setShowReview(prev => !prev)
    )
  }, [editor, handleSave])

  // Update code when initialCode changes
  useEffect(() => {
    if (editor && initialCode !== code && !isApplyingRemoteChange) {
      setCode(initialCode)
      editor.setValue(initialCode)
      lastChangeRef.current = initialCode
    }
  }, [editor, initialCode, code, isApplyingRemoteChange])

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {collaboration.isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {collaboration.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {collaboration.participants.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {collaboration.participants.length} participant{collaboration.participants.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLock}
              title={isLocked ? 'Unlock editor' : 'Lock editor'}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={showChat ? 'bg-blue-100' : ''}
              title="Toggle chat"
            >
              💬
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReview(!showReview)}
              className={showReview ? 'bg-blue-100' : ''}
              title="Toggle code review"
            >
              📝
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Collaborative Code Session',
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
              }}
              title="Share session"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            theme={theme}
            value={code}
            onMount={handleEditorDidMount}
            options={{
              readOnly: readOnly || isLocked,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              selectOnLineNumbers: true,
              automaticLayout: true,
              fontSize: 14,
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              renderWhitespace: 'selection',
              rulers: [80, 120],
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />

          {/* Live Cursors */}
          {editor && collaboration.isConnected && (
            <LiveCursorSharing
              editor={editor}
              currentUser={currentUser}
              enabled={collaboration.settings.showCursors}
            />
          )}

          {/* Connection Status Overlay */}
          {!collaboration.isConnected && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
              <Card className="p-4 text-center">
                <WifiOff className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Connection lost</p>
                <Button
                  size="sm"
                  onClick={() => collaboration.connect()}
                  disabled={collaboration.isConnecting}
                >
                  {collaboration.isConnecting ? 'Reconnecting...' : 'Reconnect'}
                </Button>
              </Card>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Language: {language}</span>
            <span>Lines: {code.split('\n').length}</span>
            <span>Characters: {code.length}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {_pendingChanges.length > 0 && (
              <span className="text-orange-600">
                {_pendingChanges.length} pending change{_pendingChanges.length !== 1 ? 's' : ''}
              </span>
            )}
            
            <span>
              {collaboration.isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <div className="flex">
        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l bg-white">
            <RealTimeChat
              session={collaboration.currentSession}
              currentUser={currentUser}
              className="h-full"
            />
          </div>
        )}

        {/* Review Panel */}
        {showReview && (
          <div className="w-96 border-l bg-white overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Code Review</h3>
              <CodeReviewInterface
                editor={editor}
                session={collaboration.currentSession}
                currentUser={currentUser}
                submissionId={submissionId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollaborativeCodeEditor
