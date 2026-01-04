import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';

export function Landing() {
  const { setView, isConnected, error } = useSessionStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full text-center">
        <h1 className="font-medieval text-4xl text-gold mb-2">
          D&D Virtual Tabletop
        </h1>
        <p className="text-parchment/70 mb-8">
          Gather your party and venture forth
        </p>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            onClick={() => setView('create')}
            disabled={!isConnected}
          >
            Create Game
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setView('join')}
            disabled={!isConnected}
          >
            Join Game
          </Button>
        </div>

        {!isConnected && (
          <p className="text-amber mt-4 animate-pulse">
            Connecting to server...
          </p>
        )}
      </Panel>
    </div>
  );
}
