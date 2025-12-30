// Represents a player in a session
export interface Player {
  id: string;           // Socket ID
  name: string;         // Display name
  isConnected: boolean; // Connection status
  joinedAt: Date;
}

// Represents a game session
export interface Session {
  roomCode: string;     // 6-character code players use to join
  dmKey: string;        // Secret key for DM to reclaim session
  dmSocketId: string | null;  // Current DM socket connection
  players: Map<string, Player>;
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
