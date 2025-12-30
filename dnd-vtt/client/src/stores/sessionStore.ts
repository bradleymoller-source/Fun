import { create } from 'zustand';
import type { Player, SessionState, MapState, Token, FogArea, SavedMap } from '../types';

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

  // Map Library Actions
  saveCurrentMap: (name: string) => void;
  loadSavedMap: (mapId: string) => void;
  deleteSavedMap: (mapId: string) => void;
  setSavedMaps: (maps: SavedMap[]) => void;
  setActiveMapId: (mapId: string | null) => void;
}

const initialState: SessionState = {
  isConnected: false,
  roomCode: null,
  dmKey: null,
  isDm: false,
  playerName: null,
  players: [],
  map: initialMapState,
  savedMaps: [],
  activeMapId: null,
  view: 'landing',
  error: null,
};

export const useSessionStore = create<SessionStore>((set, get) => ({
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

  // Map Library Actions
  saveCurrentMap: (name) => {
    const state = get();
    if (!state.map.imageUrl) return; // Can't save without an image

    const newMap: SavedMap = {
      id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      imageUrl: state.map.imageUrl,
      gridSize: state.map.gridSize,
      gridOffsetX: state.map.gridOffsetX,
      gridOffsetY: state.map.gridOffsetY,
      savedAt: new Date().toISOString(),
    };

    set({
      savedMaps: [...state.savedMaps, newMap],
    });
  },

  loadSavedMap: (mapId) => {
    const state = get();
    const savedMap = state.savedMaps.find((m) => m.id === mapId);
    if (!savedMap) return;

    set({
      map: {
        ...state.map,
        imageUrl: savedMap.imageUrl,
        gridSize: savedMap.gridSize,
        gridOffsetX: savedMap.gridOffsetX,
        gridOffsetY: savedMap.gridOffsetY,
      },
    });
  },

  deleteSavedMap: (mapId) =>
    set((state) => ({
      savedMaps: state.savedMaps.filter((m) => m.id !== mapId),
      // If deleted map was active, clear it
      activeMapId: state.activeMapId === mapId ? null : state.activeMapId,
    })),

  setSavedMaps: (savedMaps) => set({ savedMaps }),

  setActiveMapId: (activeMapId) => set({ activeMapId }),
}));
