import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface Note {
  id: string;
  title: string;
  content: string;
  category: 'session' | 'npc' | 'location' | 'quest' | 'general';
  createdAt: string;
  updatedAt: string;
}

interface NotesPanelProps {
  roomCode: string;
}

const CATEGORY_COLORS: Record<Note['category'], string> = {
  session: 'bg-blue-600',
  npc: 'bg-purple-600',
  location: 'bg-green-600',
  quest: 'bg-yellow-600',
  general: 'bg-gray-600',
};

const CATEGORY_LABELS: Record<Note['category'], string> = {
  session: 'Session',
  npc: 'NPC',
  location: 'Location',
  quest: 'Quest',
  general: 'General',
};

export function NotesPanel({ roomCode }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Note['category']>('general');
  const [filterCategory, setFilterCategory] = useState<Note['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`dm-notes-${roomCode}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch {
        // Invalid JSON, start fresh
      }
    }
  }, [roomCode]);

  // Save notes to localStorage
  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(`dm-notes-${roomCode}`, JSON.stringify(newNotes));
  };

  // Create a new note
  const handleCreateNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditCategory('general');
    setIsEditing(true);
  };

  // Edit an existing note
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(true);
  };

  // Save the current note
  const handleSaveNote = () => {
    if (!editTitle.trim()) return;

    const now = new Date().toISOString();

    if (selectedNote) {
      // Update existing note
      const updatedNotes = notes.map(n =>
        n.id === selectedNote.id
          ? { ...n, title: editTitle, content: editContent, category: editCategory, updatedAt: now }
          : n
      );
      saveNotes(updatedNotes);
    } else {
      // Create new note
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: editTitle,
        content: editContent,
        category: editCategory,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([newNote, ...notes]);
    }

    setIsEditing(false);
    setSelectedNote(null);
  };

  // Delete a note
  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note?')) {
      saveNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedNote(null);
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (filterCategory !== 'all' && note.category !== filterCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return note.title.toLowerCase().includes(query) ||
             note.content.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gold font-bold">DM Notes</h3>
        <Button size="sm" onClick={handleCreateNote}>
          + New Note
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-parchment text-dark-wood rounded"
        />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2 py-0.5 text-xs rounded ${
              filterCategory === 'all' ? 'bg-gold text-dark-wood' : 'bg-leather/50 text-parchment'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as Note['category'][]).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 text-xs rounded ${
                filterCategory === cat ? `${CATEGORY_COLORS[cat]} text-white` : 'bg-leather/50 text-parchment'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Note Editor */}
      {isEditing && (
        <div className="bg-dark-wood p-3 rounded border border-leather mb-3">
          <input
            type="text"
            placeholder="Note title..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 mb-2 bg-parchment text-dark-wood rounded"
          />

          <div className="flex gap-2 mb-2">
            {(Object.keys(CATEGORY_LABELS) as Note['category'][]).map(cat => (
              <button
                key={cat}
                onClick={() => setEditCategory(cat)}
                className={`px-2 py-1 text-xs rounded ${
                  editCategory === cat ? `${CATEGORY_COLORS[cat]} text-white` : 'bg-leather/50 text-parchment'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Write your notes here..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 min-h-[150px] bg-parchment text-dark-wood rounded resize-y"
          />

          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNote} disabled={!editTitle.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredNotes.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-4">
            {searchQuery || filterCategory !== 'all' ? 'No matching notes' : 'No notes yet'}
          </p>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                selectedNote?.id === note.id && !isEditing
                  ? 'bg-gold/20 border-gold'
                  : 'bg-dark-wood border-leather hover:border-gold/50'
              }`}
              onClick={() => !isEditing && setSelectedNote(selectedNote?.id === note.id ? null : note)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${CATEGORY_COLORS[note.category]} text-white`}>
                      {CATEGORY_LABELS[note.category]}
                    </span>
                    <span className="text-parchment font-bold truncate">{note.title}</span>
                  </div>

                  {selectedNote?.id === note.id && !isEditing && (
                    <div className="mt-2">
                      <p className="text-parchment/80 text-sm whitespace-pre-wrap">
                        {note.content || <em className="text-parchment/50">No content</em>}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="secondary" onClick={() => handleEditNote(note)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteNote(note.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-parchment/40 text-xs whitespace-nowrap">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
