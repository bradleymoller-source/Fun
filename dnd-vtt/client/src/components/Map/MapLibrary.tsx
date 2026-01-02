import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DMNotes } from '../DMNotes';

interface MapLibraryProps {
  onShowToPlayers: (mapId: string) => Promise<void> | void;
  onHideFromPlayers: () => void;
}

export function MapLibrary({ onShowToPlayers, onHideFromPlayers }: MapLibraryProps) {
  const { map, savedMaps, activeMapId, saveCurrentMap, loadSavedMap, deleteSavedMap, updateMapNotes } = useSessionStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [mapName, setMapName] = useState('');
  const [notesMapId, setNotesMapId] = useState<string | null>(null);
  const [showingMapId, setShowingMapId] = useState<string | null>(null);

  const handleDelete = async (mapId: string, mapName: string) => {
    if (confirm(`Delete "${mapName}" from your library?`)) {
      // If this map is currently being shown to players, hide it first
      if (activeMapId === mapId) {
        onHideFromPlayers();
      }
      deleteSavedMap(mapId);
    }
  };

  const handleShow = async (mapId: string) => {
    setShowingMapId(mapId);
    try {
      await onShowToPlayers(mapId);
    } catch (error) {
      // Error is already shown via alert in DMView
    } finally {
      setShowingMapId(null);
    }
  };

  const handleSave = () => {
    if (!mapName.trim()) return;
    saveCurrentMap(mapName.trim());
    setMapName('');
    setShowSaveDialog(false);
  };

  const canSave = map.imageUrl !== null;

  return (
    <div className="bg-dark-wood p-4 rounded-lg border border-leather">
      <h3 className="font-medieval text-gold text-lg mb-3">Map Library</h3>

      {/* Save Current Map */}
      {!showSaveDialog ? (
        <Button
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          disabled={!canSave}
          className="w-full mb-3"
        >
          Save Current Map
        </Button>
      ) : (
        <div className="mb-3 p-2 bg-leather/30 rounded">
          <Input
            placeholder="Map name"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="text-sm py-1 mb-2"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!mapName.trim()}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Player View Controls */}
      <div className="mb-3 p-2 bg-leather/30 rounded">
        <div className="text-parchment text-sm mb-2">
          Players see: {activeMapId ? savedMaps.find(m => m.id === activeMapId)?.name || 'Unknown' : 'Nothing (blank)'}
        </div>
        {activeMapId && (
          <Button
            size="sm"
            variant="danger"
            onClick={onHideFromPlayers}
            className="w-full"
          >
            Hide Map from Players
          </Button>
        )}
      </div>

      {/* Saved Maps List */}
      {savedMaps.length === 0 ? (
        <p className="text-parchment/50 text-sm text-center py-2">
          No saved maps yet. Upload and save a map to build your library.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {savedMaps.map((savedMap) => (
            <div
              key={savedMap.id}
              className={`p-2 rounded border ${
                activeMapId === savedMap.id
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-leather bg-leather/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-parchment text-sm font-medium truncate">
                  {savedMap.name}
                </span>
                {activeMapId === savedMap.id && (
                  <span className="text-green-400 text-xs">LIVE</span>
                )}
              </div>

              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => loadSavedMap(savedMap.id)}
                  className="text-xs bg-leather px-2 py-1 rounded text-parchment hover:bg-gold hover:text-dark-wood"
                  title="Load this map for editing"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleShow(savedMap.id)}
                  disabled={showingMapId === savedMap.id}
                  className={`text-xs px-2 py-1 rounded ${
                    activeMapId === savedMap.id
                      ? 'bg-green-600 text-white'
                      : showingMapId === savedMap.id
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-leather text-parchment hover:bg-green-600 hover:text-white'
                  }`}
                  title="Show this map to players"
                >
                  {showingMapId === savedMap.id ? 'Sending...' : activeMapId === savedMap.id ? 'Showing' : 'Show'}
                </button>
                <button
                  onClick={() => setNotesMapId(notesMapId === savedMap.id ? null : savedMap.id)}
                  className={`text-xs px-2 py-1 rounded ${
                    savedMap.notes
                      ? 'bg-yellow-700 text-white'
                      : 'bg-leather text-parchment hover:bg-yellow-700 hover:text-white'
                  }`}
                  title={savedMap.notes ? 'View/edit notes' : 'Add notes'}
                >
                  {savedMap.notes ? 'Notes' : '+Notes'}
                </button>
                <button
                  onClick={() => handleDelete(savedMap.id, savedMap.name)}
                  className="text-xs bg-red-800 px-2 py-1 rounded text-white hover:bg-red-600"
                  title="Delete this map"
                >
                  Delete
                </button>
              </div>

              {/* DM Notes Panel */}
              {notesMapId === savedMap.id && (
                <div className="mt-2 pt-2 border-t border-leather/50">
                  <DMNotes
                    notes={savedMap.notes || ''}
                    onSave={(notes) => updateMapNotes(savedMap.id, notes)}
                    mapName={savedMap.name}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
