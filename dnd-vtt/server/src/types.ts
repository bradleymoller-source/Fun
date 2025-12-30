// Represents a player in a session
export interface Player {
  id: string;           // Socket ID
  name: string;         // Display name
  isConnected: boolean; // Connection status
  joinedAt: Date;
}

// Token sizes
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Represents a token on the map
export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: TokenSize;
  color: string;
  imageUrl?: string;
  isHidden: boolean;
  ownerId?: string;
}

// Fog of war area
export interface FogArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRevealed: boolean;
}

// Map state
export interface MapState {
  imageUrl: string | null;
  gridSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  showGrid: boolean;
  tokens: Token[];
  fogOfWar: FogArea[];
}

// Represents a game session
export interface Session {
  roomCode: string;     // 6-character code players use to join
  dmKey: string;        // Secret key for DM to reclaim session
  dmSocketId: string | null;  // Current DM socket connection
  players: Map<string, Player>;
  map: MapState;        // Current map state
  createdAt: Date;
  lastActivity: Date;
}

// Data sent when creating a session
export interface CreateSessionResponse {
  roomCode: string;
  dmKey: string;
}

// Data sent when joining a session
export interface JoinSessionRequest {
  roomCode: string;
  playerName: string;
}

// Data sent when DM reclaims a session
export interface ReclaimSessionRequest {
  roomCode: string;
  dmKey: string;
}
