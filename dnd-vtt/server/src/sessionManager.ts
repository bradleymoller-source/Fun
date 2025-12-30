import { Session, Player, CreateSessionResponse } from './types';
import { generateRoomCode, generateDmKey } from './roomCode';
import db, { cleanupExpiredSessions } from './database';

// In-memory store for active sessions (for real-time state)
const activeSessions = new Map<string, Session>();

/**
 * Creates a new game session
 * Returns the room code and DM key
 */
export function createSession(): CreateSessionResponse {
  // Generate unique room code (retry if collision)
  let roomCode: string;
  do {
    roomCode = generateRoomCode();
  } while (activeSessions.has(roomCode));

  const dmKey = generateDmKey();
  const now = new Date();

  // Create session in memory
  const session: Session = {
    roomCode,
    dmKey,
    dmSocketId: null,
    players: new Map(),
    createdAt: now,
    lastActivity: now,
  };
  activeSessions.set(roomCode, session);

  // Persist to database
  db.prepare(`
    INSERT INTO sessions (room_code, dm_key, created_at, last_activity)
    VALUES (?, ?, ?, ?)
  `).run(roomCode, dmKey, now.toISOString(), now.toISOString());

  return { roomCode, dmKey };
}

/**
 * Gets a session by room code
 */
export function getSession(roomCode: string): Session | undefined {
  return activeSessions.get(roomCode.toUpperCase());
}

/**
 * Validates DM key for a session
 */
export function validateDmKey(roomCode: string, dmKey: string): boolean {
  const session = getSession(roomCode);
  return session?.dmKey === dmKey;
}

/**
 * Sets the DM socket ID for a session
 */
export function setDmSocket(roomCode: string, socketId: string): void {
  const session = getSession(roomCode);
  if (session) {
    session.dmSocketId = socketId;
    updateActivity(roomCode);
  }
}

/**
 * Adds a player to a session
 */
export function addPlayer(roomCode: string, socketId: string, name: string): Player | null {
  const session = getSession(roomCode);
  if (!session) return null;

  const player: Player = {
    id: socketId,
    name,
    isConnected: true,
    joinedAt: new Date(),
  };

  session.players.set(socketId, player);
  updateActivity(roomCode);

  // Persist player
  db.prepare(`
    INSERT OR REPLACE INTO players (id, session_room_code, name, joined_at)
    VALUES (?, ?, ?, ?)
  `).run(socketId, roomCode, name, player.joinedAt.toISOString());

  return player;
}

/**
 * Removes a player from a session
 */
export function removePlayer(roomCode: string, socketId: string): void {
  const session = getSession(roomCode);
  if (session) {
    session.players.delete(socketId);
    db.prepare('DELETE FROM players WHERE id = ?').run(socketId);
    updateActivity(roomCode);
  }
}

/**
 * Marks a player as disconnected (but keeps them in session for reconnection)
 */
export function markPlayerDisconnected(roomCode: string, socketId: string): void {
  const session = getSession(roomCode);
  if (session) {
    const player = session.players.get(socketId);
    if (player) {
      player.isConnected = false;
    }
  }
}

/**
 * Gets all players in a session as an array
 */
export function getPlayers(roomCode: string): Player[] {
  const session = getSession(roomCode);
  return session ? Array.from(session.players.values()) : [];
}

/**
 * Updates last activity timestamp
 */
function updateActivity(roomCode: string): void {
  const session = getSession(roomCode);
  if (session) {
    session.lastActivity = new Date();
    db.prepare('UPDATE sessions SET last_activity = ? WHERE room_code = ?')
      .run(session.lastActivity.toISOString(), roomCode);
  }
}

/**
 * Checks if a room code exists
 */
export function sessionExists(roomCode: string): boolean {
  return activeSessions.has(roomCode.toUpperCase());
}

/**
 * Loads sessions from database on server start
 */
export function loadSessionsFromDb(): void {
  cleanupExpiredSessions();

  const sessions = db.prepare('SELECT * FROM sessions').all() as any[];

  for (const row of sessions) {
    const session: Session = {
      roomCode: row.room_code,
      dmKey: row.dm_key,
      dmSocketId: null,
      players: new Map(),
      createdAt: new Date(row.created_at),
      lastActivity: new Date(row.last_activity),
    };
    activeSessions.set(row.room_code, session);
  }

  console.log(`Loaded ${sessions.length} sessions from database`);
}

// Re-export for use in index.ts
export { cleanupExpiredSessions };
