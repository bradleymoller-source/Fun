import { useSessionStore } from './stores/sessionStore';
import { useSocket } from './hooks/useSocket';
import { Landing } from './components/Landing';
import { CreateGame } from './components/CreateGame';
import { JoinGame } from './components/JoinGame';
import { DMView } from './components/DMView';
import { PlayerView } from './components/PlayerView';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  // Initialize socket connection
  useSocket();

  const { view } = useSessionStore();

  // Render based on current view
  switch (view) {
    case 'create':
      return <CreateGame />;
    case 'join':
      return <JoinGame />;
    case 'dm':
      return <DMView />;
    case 'player':
      return <PlayerView />;
    default:
      return <Landing />;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
