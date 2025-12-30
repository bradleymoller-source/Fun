import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function DMView() {
  const { roomCode, dmKey, players } = useSessionStore();
  const { kickPlayer } = useSocket();
  const [copied, setCopied] = useState<'code' | 'key' | null>(null);

  const copyToClipboard = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <Panel className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Dungeon Master View
              </h1>
              <p className="text-parchment/70 text-sm mt-1">
                Share the room code with your players
              </p>
            </div>

            <div className="flex gap-4">
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

        {/* Players List */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Connected Players ({players.length})
          </h2>

          {players.length === 0 ? (
            <div className="text-parchment/50 text-center py-8">
              <p className="text-lg">No players have joined yet</p>
              <p className="text-sm mt-2">
                Share the room code <span className="text-gold font-bold">{roomCode}</span> with your players
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center bg-dark-wood px-4 py-3 rounded-lg border border-leather"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                      }`}
                      title={player.isConnected ? 'Connected' : 'Reconnecting...'}
                    />
                    <span className="text-parchment font-medieval text-lg">
                      {player.name}
                    </span>
                    {!player.isConnected && (
                      <span className="text-yellow-500 text-sm">(reconnecting...)</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => kickPlayer(player.id)}
                  >
                    Kick
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Placeholder for future features */}
        <Panel className="mt-6 text-center py-12">
          <p className="text-parchment/50 font-medieval text-xl">
            Map & Token Controls Coming in Phase 2
          </p>
        </Panel>
      </div>
    </div>
  );
}
