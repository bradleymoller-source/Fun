import { useState, useEffect, useRef } from 'react';
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';
import { MapCanvas } from './Map/MapCanvas';

export function PlayerView() {
  const { roomCode, playerName, players, isConnected } = useSessionStore();
  const [showParty, setShowParty] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update map canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({
          width: rect.width,
          height: Math.max(400, window.innerHeight - 200),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
          <Panel className="p-2">
            <MapCanvas
              width={mapDimensions.width - 32}
              height={mapDimensions.height}
              isDm={false}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
