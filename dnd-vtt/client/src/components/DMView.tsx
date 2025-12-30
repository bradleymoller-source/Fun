import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';
import { MapCanvas } from './Map/MapCanvas';
import { MapControls } from './Map/MapControls';
import type { Token } from '../types';

export function DMView() {
  const { roomCode, dmKey, players, map } = useSessionStore();
  const { kickPlayer, addToken, moveToken, updateMap } = useSocket();
  const [copied, setCopied] = useState<'code' | 'key' | null>(null);
  const [showPlayers, setShowPlayers] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync local map state changes to server
  const syncMapToServer = () => {
    updateMap({
      imageUrl: map.imageUrl,
      gridSize: map.gridSize,
      gridOffsetX: map.gridOffsetX,
      gridOffsetY: map.gridOffsetY,
      showGrid: map.showGrid,
      tokens: map.tokens,
      fogOfWar: map.fogOfWar,
    });
  };

  // Debounced sync when map changes
  useEffect(() => {
    const timer = setTimeout(syncMapToServer, 500);
    return () => clearTimeout(timer);
  }, [map.imageUrl, map.gridSize, map.showGrid, map.gridOffsetX, map.gridOffsetY, map.fogOfWar]);

  // Update map canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({
          width: rect.width,
          height: Math.max(400, window.innerHeight - 300),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const copyToClipboard = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddToken = async (token: Token) => {
    try {
      await addToken(token);
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  };

  const handleTokenMove = async (tokenId: string, x: number, y: number) => {
    try {
      await moveToken(tokenId, x, y);
    } catch (error) {
      console.error('Failed to move token:', error);
    }
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <Panel className="mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Dungeon Master View
              </h1>
              <p className="text-parchment/70 text-sm mt-1">
                Share the room code with your players
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* Toggle Players Panel */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPlayers(!showPlayers)}
              >
                {showPlayers ? 'Hide Players' : 'Show Players'}
              </Button>

              {/* Room Code */}
              <div
                className="bg-dark-wood px-4 py-2 rounded-lg border-2 border-gold cursor-pointer hover:bg-leather/50 transition-colors"
                onClick={() => roomCode && copyToClipboard(roomCode, 'code')}
                title="Click to copy"
              >
                <div className="text-parchment/50 text-xs">ROOM CODE</div>
                <div className="font-medieval text-2xl text-gold tracking-widest">
                  {roomCode}
                </div>
                {copied === 'code' && (
                  <div className="text-green-400 text-xs">Copied!</div>
                )}
              </div>
            </div>
          </div>

          {/* DM Key (save this!) */}
          <div className="mt-4 p-3 bg-deep-red/20 border border-deep-red rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-red-300 text-sm font-semibold">
                  Your DM Key (save this!)
                </div>
                <div className="text-parchment font-mono text-sm">
                  {dmKey}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dmKey && copyToClipboard(dmKey, 'key')}
              >
                {copied === 'key' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-parchment/50 text-xs mt-2">
              Use this key to reclaim your session if you get disconnected
            </p>
          </div>
        </Panel>

        {/* Main Content: Map + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map Canvas - Takes most of the space */}
          <div className="flex-1" ref={mapContainerRef}>
            <Panel className="p-2">
              <MapCanvas
                width={mapDimensions.width - 32}
                height={mapDimensions.height}
                isDm={true}
                onTokenMove={handleTokenMove}
              />
            </Panel>
          </div>

          {/* Sidebar - Controls */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Players Panel (Collapsible) */}
            {showPlayers && (
              <Panel>
                <h2 className="font-medieval text-xl text-gold mb-4">
                  Connected Players ({players.length})
                </h2>

                {players.length === 0 ? (
                  <div className="text-parchment/50 text-center py-4">
                    <p>No players yet</p>
                    <p className="text-sm mt-1">
                      Share code <span className="text-gold font-bold">{roomCode}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center bg-dark-wood px-3 py-2 rounded-lg border border-leather"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              player.isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                            }`}
                          />
                          <span className="text-parchment font-medieval text-sm">
                            {player.name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => kickPlayer(player.id)}
                          className="text-xs py-1 px-2"
                        >
                          Kick
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {/* Map Controls */}
            <Panel>
              <h2 className="font-medieval text-xl text-gold mb-4">
                Map Controls
              </h2>
              <MapControls onAddToken={handleAddToken} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
