import { create } from 'zustand';
import type { Player, SessionState, MapState, Token, FogArea } from '../types';

const initialMapState: MapState = {
  imageUrl: null,
  gridSize: 50,
  gridOffsetX: 0,
  gridOffsetY: 0,
  showGrid: true,
  tokens: [],
  fogOfWar: [],
};

interface SessionStore extends SessionState {
  // Session Actions
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

  // Map Actions
  setMapImage: (imageUrl: string | null) => void;
  setGridSize: (size: number) => void;
  setGridOffset: (x: number, y: number) => void;
  toggleGrid: () => void;
  setMapState: (map: MapState) => void;

  // Token Actions
  addToken: (token: Token) => void;
  updateToken: (tokenId: string, updates: Partial<Token>) => void;
  removeToken: (tokenId: string) => void;
  moveToken: (tokenId: string, x: number, y: number) => void;
  setTokens: (tokens: Token[]) => void;

  // Fog of War Actions
  addFogArea: (area: FogArea) => void;
  removeFogArea: (areaId: string) => void;
  toggleFogArea: (areaId: string) => void;
  setFogOfWar: (areas: FogArea[]) => void;
}

const initialState: SessionState = {
  isConnected: false,
  roomCode: null,
  dmKey: null,
  isDm: false,
  playerName: null,
  players: [],
  map: initialMapState,
  view: 'landing',
  error: null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  // Session Actions
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

  // Map Actions
  setMapImage: (imageUrl) =>
    set((state) => ({
      map: { ...state.map, imageUrl },
    })),

  setGridSize: (gridSize) =>
    set((state) => ({
      map: { ...state.map, gridSize },
    })),

  setGridOffset: (gridOffsetX, gridOffsetY) =>
    set((state) => ({
      map: { ...state.map, gridOffsetX, gridOffsetY },
    })),

  toggleGrid: () =>
    set((state) => ({
      map: { ...state.map, showGrid: !state.map.showGrid },
    })),

  setMapState: (map) => set({ map }),

  // Token Actions
  addToken: (token) =>
    set((state) => ({
      map: { ...state.map, tokens: [...state.map.tokens, token] },
    })),

  updateToken: (tokenId, updates) =>
    set((state) => ({
      map: {
        ...state.map,
        tokens: state.map.tokens.map((t) =>
          t.id === tokenId ? { ...t, ...updates } : t
        ),
      },
    })),

  removeToken: (tokenId) =>
    set((state) => ({
      map: {
        ...state.map,
        tokens: state.map.tokens.filter((t) => t.id !== tokenId),
      },
    })),

  moveToken: (tokenId, x, y) =>
    set((state) => ({
      map: {
        ...state.map,
        tokens: state.map.tokens.map((t) =>
          t.id === tokenId ? { ...t, x, y } : t
        ),
      },
    })),

  setTokens: (tokens) =>
    set((state) => ({
      map: { ...state.map, tokens },
    })),

  // Fog of War Actions
  addFogArea: (area) =>
    set((state) => ({
      map: { ...state.map, fogOfWar: [...state.map.fogOfWar, area] },
    })),

  removeFogArea: (areaId) =>
    set((state) => ({
      map: {
        ...state.map,
        fogOfWar: state.map.fogOfWar.filter((a) => a.id !== areaId),
      },
    })),

  toggleFogArea: (areaId) =>
    set((state) => ({
      map: {
        ...state.map,
        fogOfWar: state.map.fogOfWar.map((a) =>
          a.id === areaId ? { ...a, isRevealed: !a.isRevealed } : a
        ),
      },
    })),

  setFogOfWar: (fogOfWar) =>
    set((state) => ({
      map: { ...state.map, fogOfWar },
    })),
}));
