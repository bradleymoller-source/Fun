import type { Session, Player, CreateSessionResponse, MapState, Token, FogArea, InitiativeEntry, CharacterData } from './types';
import { generateRoomCode, generateDmKey } from './roomCode';
import db, { cleanupExpiredSessions } from './database';

// In-memory store for active sessions (for real-time state)
const activeSessions = new Map<string, Session>();

// Default map state for new sessions
const defaultMapState: MapState = {
  imageUrl: null,
  gridSize: 50,
  gridOffsetX: 0,
  gridOffsetY: 0,
  showGrid: true,
  tokens: [],
  fogOfWar: [],
};

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
    map: { ...defaultMapState },
    initiative: [],
    isInCombat: false,
    characters: new Map(),
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
 * Adds a player to a session or reconnects an existing one
 * Returns { player, isReconnect } to indicate if this is a new join or reconnection
 */
export function addPlayer(roomCode: string, socketId: string, name: string): { player: Player; isReconnect: boolean } | null {
  const session = getSession(roomCode);
  if (!session) return null;

  // Check if there's a disconnected player with the same name (reconnection case)
  let existingPlayer: Player | undefined;
  let existingSocketId: string | undefined;

  for (const [id, player] of session.players.entries()) {
    if (player.name === name && !player.isConnected) {
      existingPlayer = player;
      existingSocketId = id;
      break;
    }
  }

  if (existingPlayer && existingSocketId) {
    // Reconnecting player - update their socket ID
    session.players.delete(existingSocketId);
    existingPlayer.id = socketId;
    existingPlayer.isConnected = true;
    session.players.set(socketId, existingPlayer);

    // Update token ownerId if they had one
    const playerToken = session.map.tokens.find(t => t.ownerId === existingSocketId);
    if (playerToken) {
      playerToken.ownerId = socketId;
      playerToken.id = `token-player-${socketId}`;
    }

    updateActivity(roomCode);

    // Update in database
    db.prepare('DELETE FROM players WHERE id = ?').run(existingSocketId);
    db.prepare(`
      INSERT OR REPLACE INTO players (id, session_room_code, name, joined_at)
      VALUES (?, ?, ?, ?)
    `).run(socketId, roomCode, existingPlayer.name, existingPlayer.joinedAt.toISOString());

    return { player: existingPlayer, isReconnect: true };
  }

  // Check if there's ALREADY a connected player with this name
  for (const player of session.players.values()) {
    if (player.name === name && player.isConnected) {
      // Player with this name is already connected - reject
      return null;
    }
  }

  // New player
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

  return { player, isReconnect: false };
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
 * Gets the map state for a session
 */
export function getMapState(roomCode: string): MapState | null {
  const session = getSession(roomCode);
  return session ? session.map : null;
}

/**
 * Updates the entire map state
 */
export function updateMapState(roomCode: string, mapState: Partial<MapState>): MapState | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.map = { ...session.map, ...mapState };
  updateActivity(roomCode);
  return session.map;
}

/**
 * Adds a token to the map
 */
export function addToken(roomCode: string, token: Token): Token[] | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.map.tokens.push(token);
  updateActivity(roomCode);
  return session.map.tokens;
}

/**
 * Updates a token on the map
 */
export function updateToken(roomCode: string, tokenId: string, updates: Partial<Token>): Token[] | null {
  const session = getSession(roomCode);
  if (!session) return null;

  const tokenIndex = session.map.tokens.findIndex(t => t.id === tokenId);
  if (tokenIndex === -1) return null;

  session.map.tokens[tokenIndex] = { ...session.map.tokens[tokenIndex], ...updates };
  updateActivity(roomCode);
  return session.map.tokens;
}

/**
 * Removes a token from the map
 */
export function removeToken(roomCode: string, tokenId: string): Token[] | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.map.tokens = session.map.tokens.filter(t => t.id !== tokenId);
  updateActivity(roomCode);
  return session.map.tokens;
}

/**
 * Moves a token to a new position
 */
export function moveToken(roomCode: string, tokenId: string, x: number, y: number): Token[] | null {
  return updateToken(roomCode, tokenId, { x, y });
}

/**
 * Updates fog of war
 */
export function updateFogOfWar(roomCode: string, fogOfWar: FogArea[]): FogArea[] | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.map.fogOfWar = fogOfWar;
  updateActivity(roomCode);
  return session.map.fogOfWar;
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
      map: { ...defaultMapState },
      initiative: [],
      isInCombat: false,
      characters: new Map(),
      createdAt: new Date(row.created_at),
      lastActivity: new Date(row.last_activity),
    };
    activeSessions.set(row.room_code, session);
  }

  console.log(`Loaded ${sessions.length} sessions from database`);
}

// Phase 3: Initiative functions
export function getInitiative(roomCode: string): { initiative: InitiativeEntry[]; isInCombat: boolean } | null {
  const session = getSession(roomCode);
  if (!session) return null;
  return { initiative: session.initiative, isInCombat: session.isInCombat };
}

export function setInitiative(roomCode: string, initiative: InitiativeEntry[]): InitiativeEntry[] | null {
  const session = getSession(roomCode);
  if (!session) return null;
  session.initiative = initiative.sort((a, b) => b.initiative - a.initiative);
  updateActivity(roomCode);
  return session.initiative;
}

export function addInitiativeEntry(roomCode: string, entry: InitiativeEntry): InitiativeEntry[] | null {
  const session = getSession(roomCode);
  if (!session) return null;
  session.initiative.push(entry);
  session.initiative.sort((a, b) => b.initiative - a.initiative);
  updateActivity(roomCode);
  return session.initiative;
}

export function removeInitiativeEntry(roomCode: string, entryId: string): InitiativeEntry[] | null {
  const session = getSession(roomCode);
  if (!session) return null;
  session.initiative = session.initiative.filter(e => e.id !== entryId);
  updateActivity(roomCode);
  return session.initiative;
}

export function nextTurn(roomCode: string): InitiativeEntry[] | null {
  const session = getSession(roomCode);
  if (!session || session.initiative.length === 0) return null;

  const currentIndex = session.initiative.findIndex(e => e.isActive);

  // Find the next living creature (skip those with 0 HP)
  let nextIndex = currentIndex;
  let attempts = 0;
  const maxAttempts = session.initiative.length;

  do {
    nextIndex = (nextIndex + 1) % session.initiative.length;
    attempts++;
    const nextEntry = session.initiative[nextIndex];
    // Skip if creature has HP tracking and is at 0 HP
    const isDead = nextEntry.currentHp !== undefined && nextEntry.currentHp <= 0;
    if (!isDead) break;
  } while (attempts < maxAttempts);

  // If all creatures are dead, just move to the next one anyway
  if (attempts >= maxAttempts) {
    nextIndex = (currentIndex + 1) % session.initiative.length;
  }

  session.initiative = session.initiative.map((e, i) => ({
    ...e,
    isActive: i === nextIndex,
  }));

  updateActivity(roomCode);
  return session.initiative;
}

export function startCombat(roomCode: string): { initiative: InitiativeEntry[]; isInCombat: boolean } | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.isInCombat = true;

  // Find the first living creature to start combat
  let firstLivingIndex = 0;
  for (let i = 0; i < session.initiative.length; i++) {
    const entry = session.initiative[i];
    const isDead = entry.currentHp !== undefined && entry.currentHp <= 0;
    if (!isDead) {
      firstLivingIndex = i;
      break;
    }
  }

  session.initiative = session.initiative.map((e, i) => ({
    ...e,
    isActive: i === firstLivingIndex,
  }));

  updateActivity(roomCode);
  return { initiative: session.initiative, isInCombat: session.isInCombat };
}

export function endCombat(roomCode: string): { initiative: InitiativeEntry[]; isInCombat: boolean } | null {
  const session = getSession(roomCode);
  if (!session) return null;

  session.isInCombat = false;
  session.initiative = [];

  updateActivity(roomCode);
  return { initiative: session.initiative, isInCombat: session.isInCombat };
}

// Phase 4: Character management functions
export function saveCharacter(roomCode: string, playerId: string, characterData: any): CharacterData | null {
  const session = getSession(roomCode);
  if (!session) return null;

  const charData: CharacterData = {
    id: characterData.id || `char-${playerId}`,
    playerId,
    name: characterData.name || 'Unknown',
    data: JSON.stringify(characterData),
    updatedAt: new Date().toISOString(),
  };

  session.characters.set(playerId, charData);
  updateActivity(roomCode);

  console.log(`Character saved for player ${playerId} in ${roomCode}: ${charData.name}`);
  return charData;
}

export function getCharacter(roomCode: string, playerId: string): any | null {
  const session = getSession(roomCode);
  if (!session) return null;

  const charData = session.characters.get(playerId);
  if (!charData) return null;

  try {
    return JSON.parse(charData.data);
  } catch {
    return null;
  }
}

export function getAllCharacters(roomCode: string): any[] {
  const session = getSession(roomCode);
  if (!session) return [];

  const characters: any[] = [];
  for (const charData of session.characters.values()) {
    try {
      characters.push(JSON.parse(charData.data));
    } catch {
      // Skip invalid characters
    }
  }
  return characters;
}

export function deleteCharacter(roomCode: string, playerId: string): boolean {
  const session = getSession(roomCode);
  if (!session) return false;

  const deleted = session.characters.delete(playerId);
  if (deleted) {
    updateActivity(roomCode);
  }
  return deleted;
}

// Update a character by characterId (for DM use)
export function updateCharacterById(roomCode: string, characterId: string, updates: any): any | null {
  const session = getSession(roomCode);
  if (!session) return null;

  // Find the character by ID
  for (const [playerId, charData] of session.characters.entries()) {
    try {
      const character = JSON.parse(charData.data);
      if (character.id === characterId) {
        // Apply updates
        const updatedCharacter = { ...character, ...updates, updatedAt: new Date().toISOString() };

        // Save back
        const newCharData: CharacterData = {
          id: characterId,
          playerId,
          name: updatedCharacter.name || character.name,
          data: JSON.stringify(updatedCharacter),
          updatedAt: new Date().toISOString(),
        };

        session.characters.set(playerId, newCharData);
        updateActivity(roomCode);

        console.log(`Character ${characterId} updated by DM in ${roomCode}`);
        return { character: updatedCharacter, playerId };
      }
    } catch {
      // Skip invalid characters
    }
  }

  return null;
}

// Re-export for use in index.ts
export { cleanupExpiredSessions };
