import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface DMNotesProps {
  notes: string;
  onSave: (notes: string) => void;
  mapName?: string;
  className?: string;
}

export function DMNotes({ notes, onSave, mapName, className = '' }: DMNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditedNotes(notes);
    }
  }, [notes, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsSaving(true);
    onSave(editedNotes);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditedNotes(notes);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gold">
            DM Notes {mapName && <span className="text-parchment/70">({mapName})</span>}
          </h4>
          <span className="text-xs text-parchment/50">
            Ctrl+Enter to save, Esc to cancel
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={editedNotes}
          onChange={(e) => setEditedNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-32 p-2 rounded border border-leather bg-dark-wood text-parchment text-sm resize-none focus:outline-none focus:border-gold"
          placeholder="Add private notes about this map (encounter details, traps, secrets, etc.)..."
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-semibold text-gold">
          DM Notes {mapName && <span className="text-parchment/70">({mapName})</span>}
        </h4>
        <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
          {notes ? 'Edit' : 'Add Notes'}
        </Button>
      </div>
      {notes ? (
        <div className="p-2 rounded border border-leather bg-dark-wood/50 text-sm text-parchment whitespace-pre-wrap max-h-32 overflow-y-auto">
          {notes}
        </div>
      ) : (
        <p className="text-xs text-parchment/50 italic">
          No notes yet. Click "Add Notes" to add private DM notes for this map.
        </p>
      )}
    </div>
  );
}
