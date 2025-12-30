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

  // Map state
  map: MapState;

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  error: string | null;
}
