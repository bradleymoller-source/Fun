import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';

export function PlayerView() {
  const { roomCode, playerName, players, isConnected } = useSessionStore();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Panel className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Welcome, {playerName}!
              </h1>
              <p className="text-parchment/70">
                Room: <span className="text-gold font-bold">{roomCode}</span>
              </p>
            </div>
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
        </Panel>

        {/* Party Members */}
        <Panel className="mb-6">
          <h2 className="font-medieval text-xl text-gold mb-4">
            Your Party ({players.length})
          </h2>

          {players.length === 0 ? (
            <p className="text-parchment/50">No other adventurers yet...</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`
                    px-4 py-2 rounded-lg border-2
                    ${player.isConnected
                      ? 'bg-dark-wood border-gold text-parchment'
                      : 'bg-dark-wood/50 border-leather text-parchment/50'
                    }
                  `}
                >
                  <span className="font-medieval">{player.name}</span>
                  {!player.isConnected && (
                    <span className="text-yellow-500 text-xs ml-2">(away)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Placeholder for future features */}
        <Panel className="text-center py-12">
          <p className="text-parchment/50 font-medieval text-xl">
            Character Sheet & Map Coming Soon
          </p>
          <p className="text-parchment/30 mt-2">
            Waiting for your DM to begin the adventure...
          </p>
        </Panel>
      </div>
    </div>
  );
}
