/**
 * Collaborative Code Review Interface
 * Provides real-time code review and commenting functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, Check, X, Eye, Star, Send, MoreHorizontal, Flag } from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import type { editor } from 'monaco-editor'
import type { 
  CodeComment, 
  CodeReview, 
  CollaborationUser,
  CollaborationSession 
} from '../../types/collaboration'
import { collaborationService } from '../../services/collaborationService'
import { formatDistanceToNow } from 'date-fns'

interface CodeReviewInterfaceProps {
  editor: editor.IStandaloneCodeEditor | null
  session: CollaborationSession | null
  currentUser: CollaborationUser
  submissionId?: string
  onReviewComplete?: (review: CodeReview) => void
}

interface CommentThread {
  lineNumber: number
  comments: CodeComment[]
  isActive: boolean
}

const COMMENT_TYPES = [
  { value: 'suggestion', label: 'Suggestion', icon: '💡', color: 'blue' },
  { value: 'question', label: 'Question', icon: '❓', color: 'yellow' },
  { value: 'issue', label: 'Issue', icon: '⚠️', color: 'red' },
  { value: 'praise', label: 'Praise', icon: '👏', color: 'green' }
] as const

export const CodeReviewInterface: React.FC<CodeReviewInterfaceProps> = ({
  editor,
  session,
  currentUser,
  submissionId,
  onReviewComplete
}) => {
  const [comments, setComments] = useState<CodeComment[]>([])
  const [commentThreads, setCommentThreads] = useState<Map<number, CommentThread>>(new Map())
  const [activeComment, setActiveComment] = useState<{
    lineNumber: number
    content: string
    type: CodeComment['type']
  } | null>(null)
  const [showReviewSummary, setShowReviewSummary] = useState(false)
  const [reviewSummary, setReviewSummary] = useState('')
  const [overallRating, setOverallRating] = useState(0)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const decorationsRef = useRef<string[]>([])
  const widgetsRef = useRef<Map<number, editor.IContentWidget>>(new Map())

  // Create comment widget
  const createCommentWidget = useCallback((lineNumber: number, thread: CommentThread): editor.IContentWidget => {
    const domNode = document.createElement('div')
    domNode.className = 'code-comment-widget'
    domNode.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-md">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <span class="text-sm font-medium">${thread.comments.length} comment${thread.comments.length !== 1 ? 's' : ''}</span>
          </div>
          <button class="text-gray-400 hover:text-gray-600 comment-toggle" data-line="${lineNumber}">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div class="text-xs text-gray-600">
          ${thread.comments[0]?.content.substring(0, 100)}${thread.comments[0]?.content.length > 100 ? '...' : ''}
        </div>
      </div>
    `

    // Add click handler
    const toggleButton = domNode.querySelector('.comment-toggle')
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        setCommentThreads(prev => {
          const newThreads = new Map(prev)
          const thread = newThreads.get(lineNumber)
          if (thread) {
            thread.isActive = !thread.isActive
            newThreads.set(lineNumber, thread)
          }
          return newThreads
        })
      })
    }

    return {
      getId: () => `comment-widget-${lineNumber}`,
      getDomNode: () => domNode,
      getPosition: () => ({
        position: { lineNumber, column: 1 },
        preference: [(window as any).monaco.editor.ContentWidgetPositionPreference.ABOVE]
      })
    }
  }, [])

  // Update comment decorations
  const updateCommentDecorations = useCallback(() => {
    if (!editor) return

    // Clear existing decorations and widgets
    if (decorationsRef.current.length > 0) {
      editor.deltaDecorations(decorationsRef.current, [])
    }
    widgetsRef.current.forEach(widget => {
      editor.removeContentWidget(widget)
    })
    widgetsRef.current.clear()

    // Create new decorations
    const newDecorations: editor.IModelDeltaDecoration[] = []
    
    commentThreads.forEach((thread, lineNumber) => {
      // Add line decoration
      newDecorations.push({
        range: new (window as any).monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'code-review-line-with-comments',
          glyphMarginClassName: 'code-review-glyph-margin',
          glyphMarginHoverMessage: {
            value: `${thread.comments.length} comment${thread.comments.length !== 1 ? 's' : ''}`
          }
        }
      })

      // Add comment widget
      const widget = createCommentWidget(lineNumber, thread)
      editor.addContentWidget(widget)
      widgetsRef.current.set(lineNumber, widget)
    })

    decorationsRef.current = editor.deltaDecorations([], newDecorations)
  }, [editor, commentThreads, createCommentWidget])

  // Handle line click for adding comments
  const handleLineClick = useCallback((lineNumber: number) => {
    setActiveComment({
      lineNumber,
      content: '',
      type: 'suggestion'
    })
  }, [])

  // Add comment
  const addComment = useCallback(async (content: string, type: CodeComment['type'], lineNumber: number) => {
    if (!session || !content.trim()) return

    try {
      const newComment = await collaborationService.addCodeComment({
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content: content.trim(),
        position: { lineNumber },
        resolved: false,
        type
      })

      setComments(prev => [...prev, newComment])
      setActiveComment(null)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }, [session, currentUser])

  // Reply to comment
  const replyToComment = useCallback(async (commentId: string, content: string) => {
    if (!content.trim()) return

    try {
      const response = await fetch(`/api/collaboration/comments/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          userId: currentUser.id,
          username: currentUser.username
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add reply')
      }

      const updatedComment = await response.json()
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c))
    } catch (error) {
      console.error('Failed to reply to comment:', error)
    }
  }, [currentUser])

  // Resolve comment
  const resolveComment = useCallback(async (commentId: string) => {
    try {
      await collaborationService.resolveComment(commentId)
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, resolved: true } : c
      ))
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }, [])

  // Submit review
  const submitReview = useCallback(async () => {
    if (!submissionId || !session) return

    setIsSubmittingReview(true)
    try {
      const review = await collaborationService.createCodeReview(
        submissionId,
        comments,
        reviewSummary
      )

      onReviewComplete?.(review)
      setShowReviewSummary(false)
      setReviewSummary('')
      setOverallRating(0)
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setIsSubmittingReview(false)
    }
  }, [submissionId, session, comments, reviewSummary, onReviewComplete])

  // Group comments by line
  useEffect(() => {
    const threads = new Map<number, CommentThread>()
    
    comments.forEach(comment => {
      const lineNumber = comment.position.lineNumber
      if (!threads.has(lineNumber)) {
        threads.set(lineNumber, {
          lineNumber,
          comments: [],
          isActive: false
        })
      }
      threads.get(lineNumber)!.comments.push(comment)
    })

    setCommentThreads(threads)
  }, [comments])

  // Update decorations when threads change
  useEffect(() => {
    updateCommentDecorations()
  }, [updateCommentDecorations])

  // Setup editor event listeners
  useEffect(() => {
    if (!editor) return

    const disposables: { dispose: () => void }[] = []

    // Listen for glyph margin clicks
    disposables.push(
      editor.onMouseDown((e) => {
        if (e.target.type === (window as any).monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const lineNumber = e.target.position?.lineNumber
          if (lineNumber) {
            handleLineClick(lineNumber)
          }
        }
      })
    )

    return () => {
      disposables.forEach(d => d.dispose())
    }
  }, [editor, handleLineClick])

  // Setup collaboration service listeners
  useEffect(() => {
    if (!session) return

    const unsubscribers = [
      collaborationService.on('comment_added', (comment: CodeComment) => {
        setComments(prev => [...prev, comment])
      }),
      collaborationService.on('comment_updated', (comment: CodeComment) => {
        setComments(prev => prev.map(c => c.id === comment.id ? comment : c))
      }),
      collaborationService.on('comment_resolved', (data: { commentId: string }) => {
        setComments(prev => prev.map(c => 
          c.id === data.commentId ? { ...c, resolved: true } : c
        ))
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [session])

  // Load existing comments
  useEffect(() => {
    if (!session || !submissionId) return

    const loadComments = async () => {
      try {
        const response = await fetch(`/api/collaboration/submissions/${submissionId}/comments`)
        if (response.ok) {
          const existingComments = await response.json()
          setComments(existingComments)
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }

    loadComments()
  }, [session, submissionId])

  // Add CSS styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .code-review-line-with-comments {
        background-color: rgba(59, 130, 246, 0.1);
        border-left: 3px solid #3b82f6;
      }

      .code-review-glyph-margin {
        background-color: #3b82f6;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50%;
        margin-left: 2px;
        margin-top: 2px;
      }

      .code-review-glyph-margin::after {
        content: '💬';
        font-size: 10px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .code-comment-widget {
        z-index: 1000;
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <>
      {/* Comment Threads Panel */}
      <div className="space-y-4">
        {Array.from(commentThreads.entries()).map(([lineNumber, thread]) => (
          <Card key={lineNumber} className={`p-4 ${thread.isActive ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Line {lineNumber}</span>
                <span className="text-xs text-gray-500">
                  {thread.comments.length} comment{thread.comments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentThreads(prev => {
                  const newThreads = new Map(prev)
                  const t = newThreads.get(lineNumber)
                  if (t) {
                    t.isActive = !t.isActive
                    newThreads.set(lineNumber, t)
                  }
                  return newThreads
                })}
              >
                {thread.isActive ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            {thread.isActive && (
              <div className="space-y-3">
                {thread.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        {comment.avatar && (
                          <img
                            src={comment.avatar}
                            alt={comment.username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-sm font-medium">{comment.username}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          COMMENT_TYPES.find(t => t.value === comment.type)?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          COMMENT_TYPES.find(t => t.value === comment.type)?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          COMMENT_TYPES.find(t => t.value === comment.type)?.color === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {COMMENT_TYPES.find(t => t.value === comment.type)?.icon} {COMMENT_TYPES.find(t => t.value === comment.type)?.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!comment.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveComment(comment.id)}
                            title="Resolve comment"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>

                    {comment.resolved && (
                      <div className="text-xs text-green-600 font-medium mb-2">
                        ✓ Resolved
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{reply.username}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="mt-2">
                      <ReplyInput
                        onSubmit={(content) => replyToComment(comment.id, content)}
                        placeholder="Reply to this comment..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Comment Modal */}
      {activeComment && (
        <Modal
          isOpen={true}
          onClose={() => setActiveComment(null)}
          title={`Add Comment - Line ${activeComment.lineNumber}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setActiveComment(prev => prev ? { ...prev, type: type.value } : null)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      activeComment.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <Textarea
                value={activeComment.content}
                onChange={(e) => setActiveComment(prev => 
                  prev ? { ...prev, content: e.target.value } : null
                )}
                placeholder="Enter your comment..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setActiveComment(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (activeComment) {
                    addComment(activeComment.content, activeComment.type, activeComment.lineNumber)
                  }
                }}
                disabled={!activeComment.content.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Summary Modal */}
      {showReviewSummary && (
        <Modal
          isOpen={true}
          onClose={() => setShowReviewSummary(false)}
          title="Complete Code Review"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className={`p-1 ${star <= overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Summary
              </label>
              <Textarea
                value={reviewSummary}
                onChange={(e) => setReviewSummary(e.target.value)}
                placeholder="Provide an overall summary of your review..."
                rows={4}
                className="w-full"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Review includes {comments.length} comment{comments.length !== 1 ? 's' : ''} across {commentThreads.size} line{commentThreads.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewSummary(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={isSubmittingReview || overallRating === 0}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Actions */}
      {submissionId && comments.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={() => setShowReviewSummary(true)}
            className="shadow-lg"
          >
            <Flag className="w-4 h-4 mr-2" />
            Complete Review ({comments.length})
          </Button>
        </div>
      )}
    </>
  )
}

// Reply Input Component
interface ReplyInputProps {
  onSubmit: (content: string) => void
  placeholder?: string
}

const ReplyInput: React.FC<ReplyInputProps> = ({ onSubmit, placeholder = "Add a reply..." }) => {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim())
      setContent('')
      setIsExpanded(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-2">
      {isExpanded ? (
        <>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="w-full text-sm"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false)
                setContent('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim()}
            >
              <Send className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          {placeholder}
        </Button>
      )}
    </div>
  )
}

export default CodeReviewInterface