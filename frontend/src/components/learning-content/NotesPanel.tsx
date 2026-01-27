/**
 * NotesPanel Component
 * 
 * Displays and manages user notes and highlights for a lesson.
 */

import React, { useState, useCallback } from 'react';
import type { UserNote, HighlightColor } from '../../types/learning-content';
import { learningContentService } from '../../services/learningContentService';

interface NotesPanelProps {
  lessonId: string;
  notes: UserNote[];
  onNotesChange?: (notes: UserNote[]) => void;
  onExport?: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  lessonId,
  notes,
  onNotesChange,
  onExport,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [filter, setFilter] = useState<'all' | 'notes' | 'highlights'>('all');

  const highlights = notes.filter(n => n.noteType === 'highlight');
  const userNotes = notes.filter(n => n.noteType === 'note');

  const filteredNotes = filter === 'all' 
    ? notes 
    : filter === 'notes' 
      ? userNotes 
      : highlights;

  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim()) return;

    try {
      const newNote = await learningContentService.createNote({
        lessonId,
        noteType: 'note',
        content: newNoteContent.trim(),
      });
      
      onNotesChange?.([...notes, newNote]);
      setNewNoteContent('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [lessonId, newNoteContent, notes, onNotesChange]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await learningContentService.deleteNote(noteId);
      onNotesChange?.(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [notes, onNotesChange]);

  const handleExport = useCallback(async () => {
    try {
      const result = await learningContentService.exportNotes(lessonId);
      
      // Create download
      const blob = new Blob([result.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onExport?.();
    } catch (error) {
      console.error('Failed to export notes:', error);
    }
  }, [lessonId, onExport]);

  const getHighlightColorClass = (color?: HighlightColor): string => {
    const colors: Record<HighlightColor, string> = {
      yellow: 'bg-yellow-200',
      green: 'bg-green-200',
      blue: 'bg-blue-200',
      pink: 'bg-pink-200',
    };
    return color ? colors[color] : 'bg-yellow-200';
  };

  return (
    <div className="notes-panel bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-medium text-gray-700">Notes & Highlights</span>
          <span className="text-sm text-gray-500">
            ({highlights.length} highlights, {userNotes.length} notes)
          </span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'notes', 'highlights'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3 py-1 text-sm rounded-full transition-colors
                  ${filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Notes list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No {filter === 'all' ? 'notes or highlights' : filter} yet.
                {filter !== 'highlights' && ' Add your first note below!'}
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`
                    p-3 rounded-lg relative group
                    ${note.noteType === 'highlight'
                      ? getHighlightColorClass(note.color)
                      : 'bg-gray-50 border border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 uppercase">
                        {note.noteType}
                      </span>
                      <p className="text-sm text-gray-800 mt-1">{note.content}</p>
                      {note.sectionId && (
                        <span className="text-xs text-gray-400 mt-1 block">
                          Section: {note.sectionId}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add note form */}
          {isAddingNote ? (
            <div className="mt-4 space-y-2">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Note
                </button>
                <button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent('');
                  }}
                  className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNote(true)}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add a note
            </button>
          )}

          {/* Export button */}
          {notes.length > 0 && (
            <button
              onClick={handleExport}
              className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
            >
              <span>📥</span>
              Export to Markdown
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
