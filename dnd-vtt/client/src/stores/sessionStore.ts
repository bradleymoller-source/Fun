import { create } from 'zustand';
import { Player, SessionState } from '../types';

interface SessionStore extends SessionState {
  // Actions
  setConnected: (connected: boolean) => void;
  setSession: (roomCode: string, dmKey: string | null, isDm: boolean) => void;
  setPlayerName: (name: string) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  setView: (view: SessionState['view']) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SessionState = {
  isConnected: false,
  roomCode: null,
  dmKey: null,
  isDm: false,
  playerName: null,
  players: [],
  view: 'landing',
  error: null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),

  setSession: (roomCode, dmKey, isDm) => set({ roomCode, dmKey, isDm }),

  setPlayerName: (playerName) => set({ playerName }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayerConnection: (playerId, isConnected) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isConnected } : p
      ),
    })),

  setView: (view) => set({ view }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
