export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
}

// Token sizes in grid squares
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface Token {
  id: string;
  name: string;
  x: number;  // Grid position X
  y: number;  // Grid position Y
  size: TokenSize;
  color: string;  // Border color for identification
  imageUrl?: string;  // Optional token image
  isHidden: boolean;  // Only visible to DM
  ownerId?: string;  // Player who controls this token (socket ID)
}

export interface MapState {
  imageUrl: string | null;  // Background map image
  gridSize: number;  // Pixels per grid square
  gridOffsetX: number;  // Grid alignment offset
  gridOffsetY: number;
  showGrid: boolean;
  tokens: Token[];
  fogOfWar: FogArea[];  // Areas hidden from players
}

export interface FogArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRevealed: boolean;  // If true, this area is visible to players
}

// Saved map for the map library
export interface SavedMap {
  id: string;
  name: string;
  imageUrl: string;
  gridSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  savedAt: string;  // ISO date string
}

// Phase 3: Dice Rolling
export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  notation: string;  // e.g., "2d6+3", "d20", "4d8-2"
  rolls: number[];   // Individual dice results
  modifier: number;  // +/- modifier
  total: number;     // Sum of rolls + modifier
  timestamp: string; // ISO date string
  isPrivate: boolean; // DM-only roll
}

// Phase 3: Chat Messages
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'roll' | 'system';  // Different message types
}

// Phase 3: Initiative Tracker
export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNpc: boolean;  // true = NPC/monster (DM controlled)
  isActive: boolean;  // Currently has their turn
  tokenId?: string;  // Link to token on map
  playerId?: string;  // Link to player (if not NPC)
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

  // Map state (currently active map)
  map: MapState;

  // Map library (DM's saved maps)
  savedMaps: SavedMap[];

  // Active map ID (which saved map is currently shown to players, null = none)
  activeMapId: string | null;

  // Phase 3: Dice & Chat
  diceHistory: DiceRoll[];
  chatMessages: ChatMessage[];

  // Phase 3: Initiative
  initiative: InitiativeEntry[];
  isInCombat: boolean;

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  error: string | null;
}
