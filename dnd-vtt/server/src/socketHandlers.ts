import { Server, Socket } from 'socket.io';
import {
  createSession,
  getSession,
  validateDmKey,
  setDmSocket,
  addPlayer,
  removePlayer,
  markPlayerDisconnected,
  getPlayers,
  sessionExists,
  getMapState,
  updateMapState,
  addToken as addTokenToSession,
  updateToken as updateTokenInSession,
  removeToken as removeTokenFromSession,
  moveToken as moveTokenInSession,
  getInitiative,
  setInitiative,
  addInitiativeEntry,
  removeInitiativeEntry,
  nextTurn,
  startCombat,
  endCombat,
  saveCharacter,
  getCharacter,
  getAllCharacters,
} from './sessionManager';
import { JoinSessionRequest, ReclaimSessionRequest, Token, MapState, DiceRoll, ChatMessage, InitiativeEntry } from './types';

// Track which session each socket belongs to
const socketSessions = new Map<string, { roomCode: string; isDm: boolean }>();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // DM creates a new game session
    socket.on('create-session', (callback: (response: any) => void) => {
      const { roomCode, dmKey } = createSession();
      setDmSocket(roomCode, socket.id);

      // Join the socket to a room for this session
      socket.join(roomCode);

      // Track this socket
      socketSessions.set(socket.id, { roomCode, isDm: true });

      console.log(`Session created: ${roomCode} by ${socket.id}`);

      callback({ success: true, roomCode, dmKey });
    });

    // DM reclaims an existing session
    socket.on('reclaim-session', (data: ReclaimSessionRequest, callback: (response: any) => void) => {
      const { roomCode, dmKey } = data;

      if (!sessionExists(roomCode)) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      if (!validateDmKey(roomCode, dmKey)) {
        callback({ success: false, error: 'Invalid DM key' });
        return;
      }

      setDmSocket(roomCode, socket.id);
      socket.join(roomCode);
      socketSessions.set(socket.id, { roomCode, isDm: true });

      // Send current player list and map state
      const players = getPlayers(roomCode);
      const map = getMapState(roomCode);

      console.log(`Session reclaimed: ${roomCode} by ${socket.id}`);

      callback({ success: true, roomCode, players, map });
    });

    // Player joins a session
    socket.on('join-session', (data: JoinSessionRequest, callback: (response: any) => void) => {
      const { roomCode, playerName } = data;
      const upperRoomCode = roomCode.toUpperCase();

      if (!sessionExists(upperRoomCode)) {
        callback({ success: false, error: 'Session not found. Check the room code.' });
        return;
      }

      const result = addPlayer(upperRoomCode, socket.id, playerName);

      if (!result) {
        callback({ success: false, error: 'Failed to join session. Name may already be in use.' });
        return;
      }

      const { player, isReconnect } = result;

      socket.join(upperRoomCode);
      socketSessions.set(socket.id, { roomCode: upperRoomCode, isDm: false });

      let tokens = null;

      // Only create a token if this is a new player, not a reconnect
      if (!isReconnect) {
        // Auto-generate a token for the new player
        const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
        const colorIndex = getPlayers(upperRoomCode).length % playerColors.length;
        const playerToken: Token = {
          id: `token-player-${socket.id}`,
          name: playerName,
          x: 0,
          y: 0,
          size: 'medium',
          color: playerColors[colorIndex],
          isHidden: false,
          ownerId: socket.id,
        };

        // Add the token to the session
        tokens = addTokenToSession(upperRoomCode, playerToken);
      }

      // Get map state for the player (filter hidden tokens)
      const map = getMapState(upperRoomCode);
      const playerMap = map ? {
        ...map,
        tokens: map.tokens.filter(t => !t.isHidden),
      } : null;

      // Notify everyone EXCEPT the joining player about the new/reconnecting player
      // (the joining player gets their info via callback)
      socket.to(upperRoomCode).emit('player-joined', {
        player: {
          id: player.id,
          name: player.name,
          isConnected: player.isConnected,
        },
        players: getPlayers(upperRoomCode).map(p => ({
          id: p.id,
          name: p.name,
          isConnected: p.isConnected,
        })),
      });

      // Broadcast token update to others (not to joining player)
      if (tokens) {
        const visibleTokens = tokens.filter(t => !t.isHidden);
        socket.to(upperRoomCode).emit('tokens-updated', { tokens: visibleTokens });
      }

      console.log(`Player ${playerName} ${isReconnect ? 'reconnected to' : 'joined'} ${upperRoomCode}${isReconnect ? '' : ' with auto-generated token'}`);

      callback({ success: true, roomCode: upperRoomCode, map: playerMap });
    });

    // DM kicks a player
    socket.on('kick-player', (data: { playerId: string }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can kick players' });
        return;
      }

      const { roomCode } = sessionInfo;
      const { playerId } = data;

      removePlayer(roomCode, playerId);

      // Notify the kicked player
      io.to(playerId).emit('kicked', { message: 'You have been removed from the session by the DM.' });

      // Make the kicked player leave the room
      const kickedSocket = io.sockets.sockets.get(playerId);
      if (kickedSocket) {
        kickedSocket.leave(roomCode);
        socketSessions.delete(playerId);
      }

      // Notify everyone else
      io.to(roomCode).emit('player-left', {
        playerId,
        players: getPlayers(roomCode).map(p => ({
          id: p.id,
          name: p.name,
          isConnected: p.isConnected,
        })),
      });

      console.log(`Player ${playerId} kicked from ${roomCode}`);

      callback({ success: true });
    });

    // ============ MAP EVENTS ============

    // DM updates map settings (image, grid, etc.)
    socket.on('update-map', (data: { mapState: Partial<MapState> }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update the map' });
        return;
      }

      const { roomCode } = sessionInfo;
      const updatedMap = updateMapState(roomCode, data.mapState);

      if (!updatedMap) {
        callback({ success: false, error: 'Failed to update map' });
        return;
      }

      // Broadcast to all players (filter hidden tokens for non-DMs)
      const playerMap = {
        ...updatedMap,
        tokens: updatedMap.tokens.filter(t => !t.isHidden),
      };
      socket.to(roomCode).emit('map-updated', { map: playerMap });

      callback({ success: true, map: updatedMap });
    });

    // DM adds a token
    socket.on('add-token', (data: { token: Token }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can add tokens' });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = addTokenToSession(roomCode, data.token);

      if (!tokens) {
        callback({ success: false, error: 'Failed to add token' });
        return;
      }

      // Broadcast to players (filter hidden tokens)
      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    // Move a token (DM or player if they own it)
    socket.on('move-token', (data: { tokenId: string; x: number; y: number }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode, isDm } = sessionInfo;
      const map = getMapState(roomCode);

      if (!map) {
        callback({ success: false, error: 'No map found' });
        return;
      }

      // Check if user can move this token
      const token = map.tokens.find(t => t.id === data.tokenId);
      if (!token) {
        callback({ success: false, error: 'Token not found' });
        return;
      }

      // DM can move any token, players can only move tokens they own
      if (!isDm && token.ownerId !== socket.id) {
        callback({ success: false, error: 'You can only move your own token' });
        return;
      }

      const tokens = moveTokenInSession(roomCode, data.tokenId, data.x, data.y);

      if (!tokens) {
        callback({ success: false, error: 'Failed to move token' });
        return;
      }

      // Broadcast to all (filter hidden for non-DMs)
      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    // DM updates a token
    socket.on('update-token', (data: { tokenId: string; updates: Partial<Token> }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update tokens' });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = updateTokenInSession(roomCode, data.tokenId, data.updates);

      if (!tokens) {
        callback({ success: false, error: 'Failed to update token' });
        return;
      }

      // Broadcast to players (filter hidden tokens)
      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    // DM removes a token
    socket.on('remove-token', (data: { tokenId: string }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can remove tokens' });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = removeTokenFromSession(roomCode, data.tokenId);

      if (!tokens) {
        callback({ success: false, error: 'Failed to remove token' });
        return;
      }

      // Broadcast to players
      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    // Show map to players (DM action) - broadcasts a specific map to all players
    socket.on('show-map-to-players', (data: { mapId: string; mapState: { imageUrl: string; gridSize: number; gridOffsetX: number; gridOffsetY: number; tokens?: Token[] } }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can show maps to players' });
        return;
      }

      const { roomCode } = sessionInfo;

      // Filter hidden tokens for players
      const visibleTokens = (data.mapState.tokens || []).filter(t => !t.isHidden);

      // Broadcast the map to all players
      socket.to(roomCode).emit('map-shown', {
        mapId: data.mapId,
        map: {
          imageUrl: data.mapState.imageUrl,
          gridSize: data.mapState.gridSize,
          gridOffsetX: data.mapState.gridOffsetX,
          gridOffsetY: data.mapState.gridOffsetY,
          showGrid: true,
          tokens: visibleTokens,
          fogOfWar: [],
        },
      });

      console.log(`DM showing map ${data.mapId} to players in ${roomCode} with ${visibleTokens.length} tokens`);

      callback({ success: true });
    });

    // Hide map from players (DM action)
    socket.on('hide-map-from-players', (_data: Record<string, never>, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can hide maps from players' });
        return;
      }

      const { roomCode } = sessionInfo;

      // Broadcast hide command to all players
      socket.to(roomCode).emit('map-hidden', {});

      console.log(`DM hiding map from players in ${roomCode}`);

      callback({ success: true });
    });

    // Get current map state
    socket.on('get-map', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode, isDm } = sessionInfo;
      const map = getMapState(roomCode);

      if (!map) {
        callback({ success: false, error: 'No map found' });
        return;
      }

      // Filter hidden tokens for players
      const responseMap = isDm ? map : {
        ...map,
        tokens: map.tokens.filter(t => !t.isHidden),
      };

      callback({ success: true, map: responseMap });
    });

    // ============ END MAP EVENTS ============

    // ============ PHASE 3: DICE, CHAT, INITIATIVE ============

    // Roll dice (any player or DM)
    socket.on('roll-dice', (data: { roll: DiceRoll }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode, isDm } = sessionInfo;

      // Private rolls only go to DM
      if (data.roll.isPrivate) {
        // Find DM socket and send only to them
        const session = getSession(roomCode);
        if (session?.dmSocketId) {
          io.to(session.dmSocketId).emit('dice-rolled', { roll: data.roll });
        }
      } else {
        // Broadcast to all in room
        io.to(roomCode).emit('dice-rolled', { roll: data.roll });
      }

      console.log(`Dice rolled in ${roomCode}: ${data.roll.notation} = ${data.roll.total}`);

      callback({ success: true });
    });

    // Send chat message (any player or DM)
    socket.on('send-chat', (data: { message: ChatMessage }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;

      // Broadcast to all in room
      io.to(roomCode).emit('chat-received', { message: data.message });

      console.log(`Chat in ${roomCode}: ${data.message.senderName}: ${data.message.content}`);

      callback({ success: true });
    });

    // Add initiative entry (DM only)
    socket.on('add-initiative', (data: { entry: InitiativeEntry }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can manage initiative' });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = addInitiativeEntry(roomCode, data.entry);

      if (!initiative) {
        callback({ success: false, error: 'Failed to add initiative entry' });
        return;
      }

      // Broadcast to all
      io.to(roomCode).emit('initiative-updated', { initiative });

      callback({ success: true, initiative });
    });

    // Remove initiative entry (DM only)
    socket.on('remove-initiative', (data: { entryId: string }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can manage initiative' });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = removeInitiativeEntry(roomCode, data.entryId);

      if (!initiative) {
        callback({ success: false, error: 'Failed to remove initiative entry' });
        return;
      }

      // Broadcast to all
      io.to(roomCode).emit('initiative-updated', { initiative });

      callback({ success: true, initiative });
    });

    // Next turn in initiative (DM only)
    socket.on('next-turn', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can advance turns' });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = nextTurn(roomCode);

      if (!initiative) {
        callback({ success: false, error: 'Failed to advance turn' });
        return;
      }

      // Broadcast to all
      io.to(roomCode).emit('initiative-updated', { initiative });

      const activeEntry = initiative.find(e => e.isActive);
      console.log(`Next turn in ${roomCode}: ${activeEntry?.name || 'None'}`);

      callback({ success: true, initiative });
    });

    // Start combat (DM only)
    socket.on('start-combat', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can start combat' });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = startCombat(roomCode);

      if (!initiative) {
        callback({ success: false, error: 'Failed to start combat' });
        return;
      }

      // Broadcast to all
      io.to(roomCode).emit('combat-started', { initiative });

      console.log(`Combat started in ${roomCode}`);

      callback({ success: true, initiative });
    });

    // End combat (DM only)
    socket.on('end-combat', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can end combat' });
        return;
      }

      const { roomCode } = sessionInfo;
      endCombat(roomCode);

      // Broadcast to all
      io.to(roomCode).emit('combat-ended', {});

      console.log(`Combat ended in ${roomCode}`);

      callback({ success: true });
    });

    // Get initiative state
    socket.on('get-initiative', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const session = getSession(roomCode);

      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      callback({
        success: true,
        initiative: getInitiative(roomCode),
        isInCombat: session.isInCombat,
      });
    });

    // ============ END PHASE 3 ============

    // ============ PHASE 4: CHARACTER PERSISTENCE ============

    // Save character (player saves their character)
    socket.on('save-character', (data: { character: any }, callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const result = saveCharacter(roomCode, socket.id, data.character);

      if (!result) {
        callback({ success: false, error: 'Failed to save character' });
        return;
      }

      // Notify DM about the character update
      const session = getSession(roomCode);
      if (session?.dmSocketId) {
        io.to(session.dmSocketId).emit('character-updated', {
          playerId: socket.id,
          character: data.character,
        });
      }

      console.log(`Character saved: ${data.character.name} by ${socket.id}`);

      callback({ success: true });
    });

    // Get own character (player loads their character)
    socket.on('get-character', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const character = getCharacter(roomCode, socket.id);

      callback({ success: true, character });
    });

    // Get all characters (DM only)
    socket.on('get-all-characters', (callback: (response: any) => void) => {
      const sessionInfo = socketSessions.get(socket.id);

      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can view all characters' });
        return;
      }

      const { roomCode } = sessionInfo;
      const characters = getAllCharacters(roomCode);

      callback({ success: true, characters });
    });

    // ============ END PHASE 4 ============

    // Handle disconnection
    socket.on('disconnect', () => {
      const sessionInfo = socketSessions.get(socket.id);

      if (sessionInfo) {
        const { roomCode, isDm } = sessionInfo;

        if (isDm) {
          // DM disconnected - session persists, they can reclaim with dmKey
          const session = getSession(roomCode);
          if (session) {
            session.dmSocketId = null;
          }
          console.log(`DM disconnected from ${roomCode}`);
        } else {
          // Player disconnected
          markPlayerDisconnected(roomCode, socket.id);

          io.to(roomCode).emit('player-disconnected', {
            playerId: socket.id,
            players: getPlayers(roomCode).map(p => ({
              id: p.id,
              name: p.name,
              isConnected: p.isConnected,
            })),
          });

          console.log(`Player ${socket.id} disconnected from ${roomCode}`);
        }

        socketSessions.delete(socket.id);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });

    // Get current players (for reconnection sync)
    socket.on('get-players', (data: { roomCode: string }, callback: (response: any) => void) => {
      const players = getPlayers(data.roomCode);
      callback({
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          isConnected: p.isConnected,
        })),
      });
    });
  });
}
