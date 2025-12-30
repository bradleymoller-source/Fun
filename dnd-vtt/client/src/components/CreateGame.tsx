import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { Input } from './ui/Input';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function CreateGame() {
  const [isCreating, setIsCreating] = useState(false);
  const { createSession, reclaimSession } = useSocket();
  const { setView, setError, error } = useSessionStore();

  // For reclaiming existing sessions
  const [showReclaim, setShowReclaim] = useState(false);
  const [reclaimCode, setReclaimCode] = useState('');
  const [reclaimKey, setReclaimKey] = useState('');

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      await createSession();
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsCreating(false);
    }
  };

  const handleReclaim = async () => {
    if (!reclaimCode || !reclaimKey) {
      setError('Please enter both room code and DM key');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await reclaimSession(reclaimCode, reclaimKey);
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full">
        <h2 className="font-medieval text-3xl text-gold mb-6 text-center">
          Dungeon Master
        </h2>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!showReclaim ? (
          <>
            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create New Session'}
            </Button>

            <div className="text-center text-parchment/50 my-4">or</div>

            <Button
              variant="secondary"
              className="w-full mb-4"
              onClick={() => setShowReclaim(true)}
            >
              Reclaim Existing Session
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <Input
                label="Room Code"
                placeholder="ABC123"
                value={reclaimCode}
                onChange={(e) => setReclaimCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Input
                label="DM Key"
                placeholder="Your secret DM key"
                value={reclaimKey}
                onChange={(e) => setReclaimKey(e.target.value.toUpperCase())}
              />
            </div>

            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleReclaim}
              disabled={isCreating}
            >
              {isCreating ? 'Reclaiming...' : 'Reclaim Session'}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowReclaim(false)}
            >
              Back
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => {
            setError(null);
            setView('landing');
          }}
        >
          Back to Home
        </Button>
      </Panel>
    </div>
  );
}
