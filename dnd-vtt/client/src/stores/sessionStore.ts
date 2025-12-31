import { create } from 'zustand';
import type { Player, SessionState, MapState, Token, FogArea, SavedMap, DiceRoll, ChatMessage, InitiativeEntry, Character, Monster } from '../types';

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
  addMapToLibrary: (name: string, imageUrl: string) => void;
  loadSavedMap: (mapId: string) => void;
  deleteSavedMap: (mapId: string) => void;
  setSavedMaps: (maps: SavedMap[]) => void;
  setActiveMapId: (mapId: string | null) => void;
  updateMapNotes: (mapId: string, notes: string) => void;

  // Phase 3: Dice Actions
  addDiceRoll: (roll: DiceRoll) => void;
  clearDiceHistory: () => void;

  // Phase 3: Chat Actions
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;

  // Phase 3: Initiative Actions
  setInitiative: (entries: InitiativeEntry[]) => void;
  addInitiativeEntry: (entry: InitiativeEntry) => void;
  removeInitiativeEntry: (entryId: string) => void;
  updateInitiativeEntry: (entryId: string, updates: Partial<InitiativeEntry>) => void;
  setActiveInitiative: (entryId: string) => void;
  nextTurn: () => void;
  startCombat: () => void;
  endCombat: () => void;

  // Phase 4: Character Actions
  setCharacter: (character: Character | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  setAllCharacters: (characters: Character[]) => void;
  updateAllCharacters: (playerId: string, character: Character) => void;
  addCharacterToSession: (character: Character) => void;
  removeCharacterFromSession: (characterId: string) => void;
  setPlayerTab: (tab: 'map' | 'character') => void;

  // Monster Actions (DM only)
  addMonster: (monster: Monster) => void;
  updateMonster: (monsterId: string, updates: Partial<Monster>) => void;
  removeMonster: (monsterId: string) => void;
  setActiveMonster: (monster: Monster | null) => void;
  setMonsters: (monsters: Monster[]) => void;
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
  diceHistory: [],
  chatMessages: [],
  initiative: [],
  isInCombat: false,
  character: null,
  allCharacters: [],
  monsters: [],
  activeMonster: null,
  view: 'landing',
  playerTab: 'map',
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
    if (!state.map.imageUrl) return;

    const newMap: SavedMap = {
      id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      imageUrl: state.map.imageUrl,
      gridSize: state.map.gridSize,
      gridOffsetX: state.map.gridOffsetX,
      gridOffsetY: state.map.gridOffsetY,
      tokens: [...state.map.tokens], // Save current tokens with the map
      savedAt: new Date().toISOString(),
    };

    set({
      savedMaps: [...state.savedMaps, newMap],
    });
  },

  // Add a generated map directly to the library (for AI-generated battle maps)
  addMapToLibrary: (name, imageUrl) => {
    const state = get();

    const newMap: SavedMap = {
      id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      imageUrl,
      gridSize: 50, // Default grid size
      gridOffsetX: 0,
      gridOffsetY: 0,
      tokens: [], // No tokens initially
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
        tokens: savedMap.tokens || [], // Load saved tokens with the map
      },
    });
  },

  deleteSavedMap: (mapId) =>
    set((state) => ({
      savedMaps: state.savedMaps.filter((m) => m.id !== mapId),
      activeMapId: state.activeMapId === mapId ? null : state.activeMapId,
    })),

  setSavedMaps: (savedMaps) => set({ savedMaps }),

  setActiveMapId: (activeMapId) => set({ activeMapId }),

  updateMapNotes: (mapId, notes) =>
    set((state) => ({
      savedMaps: state.savedMaps.map((m) =>
        m.id === mapId ? { ...m, notes } : m
      ),
    })),

  // Phase 3: Dice Actions
  addDiceRoll: (roll) =>
    set((state) => ({
      diceHistory: [roll, ...state.diceHistory].slice(0, 50),
    })),

  clearDiceHistory: () => set({ diceHistory: [] }),

  // Phase 3: Chat Actions
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message].slice(-100),
    })),

  clearChatMessages: () => set({ chatMessages: [] }),

  // Phase 3: Initiative Actions
  setInitiative: (initiative) => set({ initiative }),

  addInitiativeEntry: (entry) =>
    set((state) => ({
      initiative: [...state.initiative, entry].sort((a, b) => b.initiative - a.initiative),
    })),

  removeInitiativeEntry: (entryId) =>
    set((state) => ({
      initiative: state.initiative.filter((e) => e.id !== entryId),
    })),

  updateInitiativeEntry: (entryId, updates) =>
    set((state) => ({
      initiative: state.initiative
        .map((e) => (e.id === entryId ? { ...e, ...updates } : e))
        .sort((a, b) => b.initiative - a.initiative),
    })),

  setActiveInitiative: (entryId) =>
    set((state) => ({
      initiative: state.initiative.map((e) => ({
        ...e,
        isActive: e.id === entryId,
      })),
    })),

  nextTurn: () =>
    set((state) => {
      if (state.initiative.length === 0) return state;

      const currentIndex = state.initiative.findIndex((e) => e.isActive);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % state.initiative.length;

      return {
        initiative: state.initiative.map((e, i) => ({
          ...e,
          isActive: i === nextIndex,
        })),
      };
    }),

  startCombat: () =>
    set((state) => ({
      isInCombat: true,
      initiative: state.initiative.map((e, i) => ({
        ...e,
        isActive: i === 0,
      })),
    })),

  endCombat: () =>
    set({
      isInCombat: false,
      initiative: [],
    }),

  // Phase 4: Character Actions
  setCharacter: (character) => set({ character }),

  updateCharacter: (updates) =>
    set((state) => ({
      character: state.character
        ? { ...state.character, ...updates, updatedAt: new Date().toISOString() }
        : null,
    })),

  setAllCharacters: (allCharacters) => set({ allCharacters }),

  updateAllCharacters: (playerId, character) =>
    set((state) => ({
      allCharacters: state.allCharacters.some((c) => c.playerId === playerId)
        ? state.allCharacters.map((c) => (c.playerId === playerId ? character : c))
        : [...state.allCharacters, character],
    })),

  addCharacterToSession: (character) =>
    set((state) => ({
      allCharacters: [...state.allCharacters.filter((c) => c.id !== character.id), character],
    })),

  removeCharacterFromSession: (characterId) =>
    set((state) => ({
      allCharacters: state.allCharacters.filter((c) => c.id !== characterId),
    })),

  setPlayerTab: (playerTab) => set({ playerTab }),

  // Monster Actions (DM only)
  addMonster: (monster) =>
    set((state) => ({
      monsters: [...state.monsters, monster],
    })),

  updateMonster: (monsterId, updates) =>
    set((state) => ({
      monsters: state.monsters.map((m) =>
        m.id === monsterId ? { ...m, ...updates } : m
      ),
      activeMonster:
        state.activeMonster?.id === monsterId
          ? { ...state.activeMonster, ...updates }
          : state.activeMonster,
    })),

  removeMonster: (monsterId) =>
    set((state) => ({
      monsters: state.monsters.filter((m) => m.id !== monsterId),
      activeMonster:
        state.activeMonster?.id === monsterId ? null : state.activeMonster,
    })),

  setActiveMonster: (activeMonster) => set({ activeMonster }),

  setMonsters: (monsters) => set({ monsters }),
}));
