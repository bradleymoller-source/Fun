import { useState, useEffect, useRef } from 'react';
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';
import { MapCanvas } from './Map/MapCanvas';

type MapOrientation = 'landscape' | 'portrait';

const ORIENTATION_SIZES = {
  landscape: { width: 900, height: 600 },
  portrait: { width: 600, height: 800 },
};

export function PlayerView() {
  const { roomCode, playerName, players, isConnected } = useSessionStore();
  const [showParty, setShowParty] = useState(false);
  const [mapOrientation, setMapOrientation] = useState<MapOrientation>('landscape');
  const [mapDimensions, setMapDimensions] = useState(ORIENTATION_SIZES.landscape);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update dimensions when orientation changes
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const containerWidth = mapContainerRef.current.getBoundingClientRect().width - 32;
        const baseSize = ORIENTATION_SIZES[mapOrientation];

        // Scale down if container is smaller than base size
        const scale = Math.min(1, containerWidth / baseSize.width);

        setMapDimensions({
          width: Math.floor(baseSize.width * scale),
          height: Math.floor(baseSize.height * scale),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mapOrientation]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Panel className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Welcome, {playerName}!
              </h1>
              <p className="text-parchment/70">
                Room: <span className="text-gold font-bold">{roomCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Party Toggle */}
              <button
                onClick={() => setShowParty(!showParty)}
                className="text-parchment/70 hover:text-parchment text-sm flex items-center gap-2"
              >
                Party ({players.length})
                <span className={`transform transition-transform ${showParty ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                  }`}
                />
                <span className="text-parchment text-sm">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Party Members (Collapsible) */}
          {showParty && (
            <div className="mt-4 pt-4 border-t border-leather">
              <h2 className="font-medieval text-lg text-gold mb-2">
                Your Party
              </h2>
              {players.length === 0 ? (
                <p className="text-parchment/50 text-sm">No other adventurers yet...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`
                        px-3 py-1 rounded-lg border text-sm
                        ${player.isConnected
                          ? 'bg-dark-wood border-gold text-parchment'
                          : 'bg-dark-wood/50 border-leather text-parchment/50'
                        }
                      `}
                    >
                      <span className="font-medieval">{player.name}</span>
                      {!player.isConnected && (
                        <span className="text-yellow-500 text-xs ml-1">(away)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Map Display */}
        <div ref={mapContainerRef}>
          {/* Map Toolbar */}
          <div className="flex items-center justify-between mb-2 bg-dark-wood p-2 rounded-lg border border-leather">
            <div className="flex items-center gap-2">
              <span className="text-parchment text-sm">View:</span>
              <button
                onClick={() => setMapOrientation('landscape')}
                className={`px-3 py-1 rounded text-sm ${
                  mapOrientation === 'landscape'
                    ? 'bg-gold text-dark-wood'
                    : 'bg-leather text-parchment hover:bg-leather/70'
                }`}
              >
                Landscape
              </button>
              <button
                onClick={() => setMapOrientation('portrait')}
                className={`px-3 py-1 rounded text-sm ${
                  mapOrientation === 'portrait'
                    ? 'bg-gold text-dark-wood'
                    : 'bg-leather text-parchment hover:bg-leather/70'
                }`}
              >
                Portrait
              </button>
            </div>
          </div>

          <Panel className="p-2">
            <MapCanvas
              width={mapDimensions.width}
              height={mapDimensions.height}
              isDm={false}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
