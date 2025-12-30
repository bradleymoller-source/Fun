export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
}

export interface SessionState {
  // Connection state
  isConnected: boolean;

  // Session info
  roomCode: string | null;
  dmKey: string | null;  // Only set for DM
  isDm: boolean;

  // Player info
  playerName: string | null;
  players: Player[];

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  error: string | null;
}
