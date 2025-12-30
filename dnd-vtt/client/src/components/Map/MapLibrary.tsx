import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MapLibraryProps {
  onShowToPlayers: (mapId: string) => void;
  onHideFromPlayers: () => void;
}

export function MapLibrary({ onShowToPlayers, onHideFromPlayers }: MapLibraryProps) {
  const { map, savedMaps, activeMapId, saveCurrentMap, loadSavedMap, deleteSavedMap } = useSessionStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [mapName, setMapName] = useState('');

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
                  onClick={() => onShowToPlayers(savedMap.id)}
                  className={`text-xs px-2 py-1 rounded ${
                    activeMapId === savedMap.id
                      ? 'bg-green-600 text-white'
                      : 'bg-leather text-parchment hover:bg-green-600 hover:text-white'
                  }`}
                  title="Show this map to players"
                >
                  {activeMapId === savedMap.id ? 'Showing' : 'Show'}
                </button>
                <button
                  onClick={() => deleteSavedMap(savedMap.id)}
                  className="text-xs bg-red-800 px-2 py-1 rounded text-white hover:bg-red-600"
                  title="Delete this map"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
