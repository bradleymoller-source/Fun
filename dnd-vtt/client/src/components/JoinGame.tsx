import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { Input } from './ui/Input';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function JoinGame() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { joinSession } = useSocket();
  const { setView, setError, error } = useSessionStore();

  const handleJoin = async () => {
    if (!roomCode || !playerName) {
      setError('Please enter both room code and your name');
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      await joinSession(roomCode, playerName);
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full">
        <h2 className="font-medieval text-3xl text-gold mb-6 text-center">
          Join Adventure
        </h2>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <Input
            label="Room Code"
            placeholder="Enter 8-character code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <Input
            label="Your Name"
            placeholder="What shall we call you?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={30}
          />
        </div>

        <Button
          size="lg"
          className="w-full mb-4"
          onClick={handleJoin}
          disabled={isJoining || !roomCode || !playerName}
        >
          {isJoining ? 'Joining...' : 'Enter the Realm'}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
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
