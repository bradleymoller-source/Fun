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
  reorderInitiative,
  nextTurn,
  startCombat,
  endCombat,
  saveCharacter,
  getCharacter,
  getAllCharacters,
  deleteCharacter,
  updateCharacterById,
  transferCharacterByPlayerName,
  getStoreItems,
  setStoreItems,
  addStoreItem,
  removeStoreItem,
  getLootItems,
  addLootItem,
  removeLootItem,
  distributeItemToPlayer,
  getPlayerInventories,
} from './sessionManager';
import { Token, MapState, DiceRoll, ChatMessage, InitiativeEntry } from './types';
import { logger, createSocketLogger } from './utils/logger';
import { validateData } from './middleware/validate';
import { socketRateLimitMiddleware } from './middleware/rateLimiter';
import {
  JoinSessionDataSchema,
  ReclaimSessionDataSchema,
  KickPlayerDataSchema,
  GetPlayersDataSchema,
  UpdateMapDataSchema,
  AddTokenDataSchema,
  MoveTokenDataSchema,
  UpdateTokenDataSchema,
  RemoveTokenDataSchema,
  ShowMapToPlayersDataSchema,
  AddInitiativeDataSchema,
  RemoveInitiativeDataSchema,
  ReorderInitiativeDataSchema,
  RollDiceDataSchema,
  SendChatDataSchema,
  SaveCharacterDataSchema,
  DmUpdateCharacterDataSchema,
  UpdateStoreDataSchema,
  AddStoreItemDataSchema,
  RemoveStoreItemDataSchema,
  AddLootItemDataSchema,
  RemoveLootItemDataSchema,
  DistributeItemDataSchema,
} from './schemas';

// Track which session each socket belongs to
const socketSessions = new Map<string, { roomCode: string; isDm: boolean }>();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const socketLog = createSocketLogger(socket.id);
    socketLog.info('Client connected');

    // Helper to check rate limits
    const checkLimit = async (eventName: string): Promise<boolean> => {
      return socketRateLimitMiddleware(socket.id, eventName);
    };

    // DM creates a new game session
    socket.on('create-session', async (callback: (response: any) => void) => {
      if (!await checkLimit('create-session')) {
        callback({ success: false, error: 'Rate limit exceeded. Please wait before creating another session.' });
        return;
      }

      const { roomCode, dmKey } = createSession();
      setDmSocket(roomCode, socket.id);

      socket.join(roomCode);
      socketSessions.set(socket.id, { roomCode, isDm: true });

      logger.info('Session created', { roomCode, socketId: socket.id });

      callback({ success: true, roomCode, dmKey });
    });

    // DM reclaims an existing session
    socket.on('reclaim-session', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('reclaim-session')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const validation = validateData(ReclaimSessionDataSchema, data, 'reclaim-session');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode, dmKey } = validation.data;

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

      const players = getPlayers(roomCode);
      const map = getMapState(roomCode);
      const initiativeState = getInitiative(roomCode);

      logger.info('Session reclaimed', { roomCode, socketId: socket.id });

      callback({
        success: true,
        roomCode,
        players,
        map,
        initiative: initiativeState?.initiative || [],
        isInCombat: initiativeState?.isInCombat || false,
      });
    });

    // Player joins a session
    socket.on('join-session', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('join-session')) {
        callback({ success: false, error: 'Too many join attempts. Please wait.' });
        return;
      }

      const validation = validateData(JoinSessionDataSchema, data, 'join-session');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode, playerName } = validation.data;
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

      if (!isReconnect) {
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

        tokens = addTokenToSession(upperRoomCode, playerToken);
      }

      const map = getMapState(upperRoomCode);
      const playerMap = map ? {
        ...map,
        tokens: map.tokens.filter(t => !t.isHidden),
      } : null;

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

      if (tokens) {
        const visibleTokens = tokens.filter(t => !t.isHidden);
        socket.to(upperRoomCode).emit('tokens-updated', { tokens: visibleTokens });
      }

      logger.info('Player joined', { roomCode: upperRoomCode, playerName, isReconnect });

      // Try to recover character for reconnecting players
      let character = getCharacter(upperRoomCode, socket.id);
      if (!character && isReconnect) {
        // Try to transfer character from old socket id
        character = transferCharacterByPlayerName(upperRoomCode, playerName, socket.id);
      }

      const initiativeState = getInitiative(upperRoomCode);

      // Get player's inventory and store items
      const playerInventories = getPlayerInventories(upperRoomCode).filter(i => i.playerId === socket.id);
      const storeItems = getStoreItems(upperRoomCode);

      callback({
        success: true,
        roomCode: upperRoomCode,
        map: playerMap,
        initiative: initiativeState?.initiative || [],
        isInCombat: initiativeState?.isInCombat || false,
        character, // Include character if found
        playerInventories,
        storeItems,
      });
    });

    // DM kicks a player
    socket.on('kick-player', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('kick-player')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can kick players' });
        return;
      }

      const validation = validateData(KickPlayerDataSchema, data, 'kick-player');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const { playerId } = validation.data;

      removePlayer(roomCode, playerId);

      io.to(playerId).emit('kicked', { message: 'You have been removed from the session by the DM.' });

      const kickedSocket = io.sockets.sockets.get(playerId);
      if (kickedSocket) {
        kickedSocket.leave(roomCode);
        socketSessions.delete(playerId);
      }

      io.to(roomCode).emit('player-left', {
        playerId,
        players: getPlayers(roomCode).map(p => ({
          id: p.id,
          name: p.name,
          isConnected: p.isConnected,
        })),
      });

      logger.info('Player kicked', { roomCode, playerId });

      callback({ success: true });
    });

    // ============ MAP EVENTS ============

    socket.on('update-map', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('update-map')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update the map' });
        return;
      }

      const validation = validateData(UpdateMapDataSchema, data, 'update-map');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const updatedMap = updateMapState(roomCode, validation.data.mapState);

      if (!updatedMap) {
        callback({ success: false, error: 'Failed to update map' });
        return;
      }

      const playerMap = {
        ...updatedMap,
        tokens: updatedMap.tokens.filter(t => !t.isHidden),
      };
      socket.to(roomCode).emit('map-updated', { map: playerMap });

      callback({ success: true, map: updatedMap });
    });

    socket.on('add-token', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('add-token')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can add tokens' });
        return;
      }

      const validation = validateData(AddTokenDataSchema, data, 'add-token');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = addTokenToSession(roomCode, validation.data.token);

      if (!tokens) {
        callback({ success: false, error: 'Failed to add token' });
        return;
      }

      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    socket.on('move-token', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('move-token')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const validation = validateData(MoveTokenDataSchema, data, 'move-token');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode, isDm } = sessionInfo;
      const map = getMapState(roomCode);

      if (!map) {
        callback({ success: false, error: 'No map found' });
        return;
      }

      const token = map.tokens.find(t => t.id === validation.data.tokenId);
      if (!token) {
        callback({ success: false, error: 'Token not found' });
        return;
      }

      if (!isDm && token.ownerId !== socket.id) {
        callback({ success: false, error: 'You can only move your own token' });
        return;
      }

      const tokens = moveTokenInSession(roomCode, validation.data.tokenId, validation.data.x, validation.data.y);

      if (!tokens) {
        callback({ success: false, error: 'Failed to move token' });
        return;
      }

      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    socket.on('update-token', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('update-token')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update tokens' });
        return;
      }

      const validation = validateData(UpdateTokenDataSchema, data, 'update-token');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = updateTokenInSession(roomCode, validation.data.tokenId, validation.data.updates);

      if (!tokens) {
        callback({ success: false, error: 'Failed to update token' });
        return;
      }

      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    socket.on('remove-token', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('remove-token')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can remove tokens' });
        return;
      }

      const validation = validateData(RemoveTokenDataSchema, data, 'remove-token');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const tokens = removeTokenFromSession(roomCode, validation.data.tokenId);

      if (!tokens) {
        callback({ success: false, error: 'Failed to remove token' });
        return;
      }

      const visibleTokens = tokens.filter(t => !t.isHidden);
      socket.to(roomCode).emit('tokens-updated', { tokens: visibleTokens });

      callback({ success: true, tokens });
    });

    socket.on('show-map-to-players', async (data: unknown, callback: (response: any) => void) => {
      logger.info('=== SHOW MAP TO PLAYERS START ===');
      logger.info('Event received', {
        socketId: socket.id,
        hasCallback: typeof callback === 'function',
        dataType: typeof data,
        dataKeys: data && typeof data === 'object' ? Object.keys(data as object) : 'not-object'
      });

      // Ensure callback exists - critical check
      if (typeof callback !== 'function') {
        logger.error('CRITICAL: No callback function provided');
        return;
      }

      try {
        logger.info('Checking rate limit...');
        if (!await checkLimit('show-map-to-players')) {
          logger.info('Rate limited - calling callback');
          callback({ success: false, error: 'Rate limit exceeded.' });
          return;
        }
        logger.info('Rate limit passed');

        const sessionInfo = socketSessions.get(socket.id);
        logger.info('Session lookup', {
          found: !!sessionInfo,
          isDm: sessionInfo?.isDm,
          roomCode: sessionInfo?.roomCode,
          socketId: socket.id
        });

        if (!sessionInfo || !sessionInfo.isDm) {
          logger.info('Not DM - calling callback with error');
          callback({ success: false, error: 'Only the DM can show maps to players. Try refreshing the page to reconnect.' });
          return;
        }
        logger.info('DM check passed');

        logger.info('Validating data...');
        const validation = validateData(ShowMapToPlayersDataSchema, data, 'show-map-to-players');
        if (!validation.success) {
          logger.info('Validation failed - calling callback', { error: validation.error });
          callback({ success: false, error: validation.error });
          return;
        }
        logger.info('Validation passed');

        const { roomCode } = sessionInfo;
        const { mapId, mapState } = validation.data;

        const currentMap = getMapState(roomCode);
        const livePlayerTokens = (currentMap?.tokens || []).filter(t => t.ownerId);
        const savedMapTokens = (mapState.tokens || []).filter(t => !t.isHidden);

        const mergedTokens = [
          ...savedMapTokens,
          ...livePlayerTokens.filter(pt => !pt.isHidden),
        ];

        const updatedMap = updateMapState(roomCode, {
          imageUrl: mapState.imageUrl,
          gridSize: mapState.gridSize,
          gridOffsetX: mapState.gridOffsetX,
          gridOffsetY: mapState.gridOffsetY,
          showGrid: true,
          tokens: mergedTokens,
        });

        socket.to(roomCode).emit('map-shown', {
          mapId,
          map: {
            imageUrl: mapState.imageUrl,
            gridSize: mapState.gridSize,
            gridOffsetX: mapState.gridOffsetX,
            gridOffsetY: mapState.gridOffsetY,
            showGrid: true,
            tokens: mergedTokens.filter(t => !t.isHidden),
            fogOfWar: [],
          },
        });

        logger.info('Map shown to players', { roomCode, mapId, tokenCount: mergedTokens.length });

        logger.info('Calling success callback...');
        callback({ success: true, map: updatedMap });
        logger.info('=== SHOW MAP TO PLAYERS COMPLETE ===');
      } catch (error) {
        logger.error('EXCEPTION in show-map-to-players', { error: String(error), stack: (error as Error)?.stack });
        callback({ success: false, error: 'Server error while showing map. Please try again.' });
      }
    });

    socket.on('hide-map-from-players', async (_data: Record<string, never>, callback: (response: any) => void) => {
      if (!await checkLimit('hide-map-from-players')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can hide maps from players' });
        return;
      }

      const { roomCode } = sessionInfo;
      socket.to(roomCode).emit('map-hidden', {});

      logger.info('Map hidden from players', { roomCode });

      callback({ success: true });
    });

    socket.on('get-map', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-map')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

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

      const responseMap = isDm ? map : {
        ...map,
        tokens: map.tokens.filter(t => !t.isHidden),
      };

      callback({ success: true, map: responseMap });
    });

    // ============ DICE, CHAT, INITIATIVE ============

    socket.on('roll-dice', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('roll-dice')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const validation = validateData(RollDiceDataSchema, data, 'roll-dice');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const { roll } = validation.data;

      if (roll.isPrivate) {
        const session = getSession(roomCode);
        if (session?.dmSocketId) {
          io.to(session.dmSocketId).emit('dice-rolled', { roll });
        }
      } else {
        io.to(roomCode).emit('dice-rolled', { roll });
      }

      logger.debug('Dice rolled', { roomCode, notation: roll.notation, total: roll.total });

      callback({ success: true });
    });

    socket.on('send-chat', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('send-chat')) {
        callback({ success: false, error: 'Slow down! Too many messages.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const validation = validateData(SendChatDataSchema, data, 'send-chat');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      io.to(roomCode).emit('chat-received', { message: validation.data.message });

      logger.debug('Chat message', { roomCode, sender: validation.data.message.senderName });

      callback({ success: true });
    });

    socket.on('add-initiative', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('add-initiative')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can manage initiative' });
        return;
      }

      const validation = validateData(AddInitiativeDataSchema, data, 'add-initiative');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = addInitiativeEntry(roomCode, validation.data.entry);

      if (!initiative) {
        callback({ success: false, error: 'Failed to add initiative entry' });
        return;
      }

      io.to(roomCode).emit('initiative-updated', { initiative });

      callback({ success: true, initiative });
    });

    socket.on('player-roll-initiative', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('player-roll-initiative')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const validation = validateData(AddInitiativeDataSchema, data, 'player-roll-initiative');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const entry = {
        ...validation.data.entry,
        playerId: socket.id,
        isNpc: false,
      };

      const { roomCode } = sessionInfo;
      const initiative = addInitiativeEntry(roomCode, entry);

      if (!initiative) {
        callback({ success: false, error: 'Failed to add initiative entry' });
        return;
      }

      io.to(roomCode).emit('initiative-updated', { initiative });

      callback({ success: true, initiative });
    });

    socket.on('remove-initiative', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('remove-initiative')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can manage initiative' });
        return;
      }

      const validation = validateData(RemoveInitiativeDataSchema, data, 'remove-initiative');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = removeInitiativeEntry(roomCode, validation.data.entryId);

      if (!initiative) {
        callback({ success: false, error: 'Failed to remove initiative entry' });
        return;
      }

      io.to(roomCode).emit('initiative-updated', { initiative });

      callback({ success: true, initiative });
    });

    socket.on('reorder-initiative', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('reorder-initiative')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can reorder initiative' });
        return;
      }

      const validation = validateData(ReorderInitiativeDataSchema, data, 'reorder-initiative');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const initiative = reorderInitiative(roomCode, validation.data.fromIndex, validation.data.toIndex);

      if (!initiative) {
        callback({ success: false, error: 'Failed to reorder initiative' });
        return;
      }

      io.to(roomCode).emit('initiative-updated', { initiative });

      logger.debug('Initiative reordered', { roomCode, from: validation.data.fromIndex, to: validation.data.toIndex });

      callback({ success: true, initiative });
    });

    socket.on('next-turn', async (callback: (response: any) => void) => {
      if (!await checkLimit('next-turn')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

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

      io.to(roomCode).emit('initiative-updated', { initiative });

      const activeEntry = initiative.find(e => e.isActive);
      logger.debug('Next turn', { roomCode, active: activeEntry?.name });

      callback({ success: true, initiative });
    });

    socket.on('start-combat', async (callback: (response: any) => void) => {
      if (!await checkLimit('start-combat')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can start combat' });
        return;
      }

      const { roomCode } = sessionInfo;
      const result = startCombat(roomCode);

      if (!result) {
        callback({ success: false, error: 'Failed to start combat' });
        return;
      }

      io.to(roomCode).emit('combat-started', { initiative: result.initiative });

      logger.info('Combat started', { roomCode });

      callback({ success: true, initiative: result.initiative });
    });

    socket.on('end-combat', async (callback: (response: any) => void) => {
      if (!await checkLimit('end-combat')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can end combat' });
        return;
      }

      const { roomCode } = sessionInfo;
      endCombat(roomCode);

      io.to(roomCode).emit('combat-ended', {});

      logger.info('Combat ended', { roomCode });

      callback({ success: true });
    });

    socket.on('get-initiative', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-initiative')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

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

    // ============ CHARACTER PERSISTENCE ============

    socket.on('save-character', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('save-character')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      // Use a more permissive validation for characters since they can have many fields
      if (!data || typeof data !== 'object' || !('character' in data)) {
        callback({ success: false, error: 'Invalid character data' });
        return;
      }

      const { roomCode } = sessionInfo;
      const result = saveCharacter(roomCode, socket.id, (data as any).character);

      if (!result) {
        callback({ success: false, error: 'Failed to save character' });
        return;
      }

      const session = getSession(roomCode);
      if (session?.dmSocketId) {
        io.to(session.dmSocketId).emit('character-updated', {
          playerId: socket.id,
          character: (data as any).character,
        });
      }

      logger.info('Character saved', { roomCode, characterName: (data as any).character?.name });

      callback({ success: true });
    });

    socket.on('get-character', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-character')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const character = getCharacter(roomCode, socket.id);

      callback({ success: true, character });
    });

    socket.on('get-all-characters', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-all-characters')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can view all characters' });
        return;
      }

      const { roomCode } = sessionInfo;
      const characters = getAllCharacters(roomCode);

      callback({ success: true, characters });
    });

    socket.on('delete-character', async (callback: (response: any) => void) => {
      if (!await checkLimit('delete-character')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const deleted = deleteCharacter(roomCode, socket.id);

      if (!deleted) {
        callback({ success: false, error: 'Failed to delete character or character not found' });
        return;
      }

      const session = getSession(roomCode);
      if (session?.dmSocketId) {
        io.to(session.dmSocketId).emit('character-deleted', {
          playerId: socket.id,
        });
      }

      logger.info('Character deleted', { roomCode, playerId: socket.id });

      callback({ success: true });
    });

    socket.on('dm-update-character', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('dm-update-character')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update player characters' });
        return;
      }

      const validation = validateData(DmUpdateCharacterDataSchema, data, 'dm-update-character');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const result = updateCharacterById(roomCode, validation.data.characterId, validation.data.updates);

      if (!result) {
        callback({ success: false, error: 'Character not found' });
        return;
      }

      io.to(result.playerId).emit('character-updated-by-dm', {
        character: result.character,
      });

      logger.info('DM updated character', { roomCode, characterId: validation.data.characterId });

      callback({ success: true, character: result.character });
    });

    // ============ STORE & LOOT ============

    // Get store items (available to all players)
    socket.on('get-store', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-store')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode } = sessionInfo;
      const storeItems = getStoreItems(roomCode);

      callback({ success: true, storeItems });
    });

    // Update store items (DM only)
    socket.on('update-store', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('update-store')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can update the store' });
        return;
      }

      const validation = validateData(UpdateStoreDataSchema, data, 'update-store');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const storeItems = setStoreItems(roomCode, validation.data.items);

      if (!storeItems) {
        callback({ success: false, error: 'Failed to update store' });
        return;
      }

      // Broadcast to all players
      io.to(roomCode).emit('store-updated', { storeItems });

      logger.info('Store updated', { roomCode, itemCount: storeItems.length });

      callback({ success: true, storeItems });
    });

    // Add store item (DM only)
    socket.on('add-store-item', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('add-store-item')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can add store items' });
        return;
      }

      const validation = validateData(AddStoreItemDataSchema, data, 'add-store-item');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const storeItems = addStoreItem(roomCode, validation.data.item);

      if (!storeItems) {
        callback({ success: false, error: 'Failed to add store item' });
        return;
      }

      // Broadcast to all players
      io.to(roomCode).emit('store-updated', { storeItems });

      logger.info('Store item added', { roomCode, itemName: validation.data.item.name });

      callback({ success: true, storeItems });
    });

    // Remove store item (DM only)
    socket.on('remove-store-item', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('remove-store-item')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can remove store items' });
        return;
      }

      const validation = validateData(RemoveStoreItemDataSchema, data, 'remove-store-item');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const storeItems = removeStoreItem(roomCode, validation.data.itemId);

      if (!storeItems) {
        callback({ success: false, error: 'Failed to remove store item' });
        return;
      }

      // Broadcast to all players
      io.to(roomCode).emit('store-updated', { storeItems });

      callback({ success: true, storeItems });
    });

    // Add loot item (DM only)
    socket.on('add-loot-item', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('add-loot-item')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can add loot items' });
        return;
      }

      const validation = validateData(AddLootItemDataSchema, data, 'add-loot-item');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const lootItems = addLootItem(roomCode, validation.data.item);

      if (!lootItems) {
        callback({ success: false, error: 'Failed to add loot item' });
        return;
      }

      logger.info('Loot item added', { roomCode, itemName: validation.data.item.name });

      callback({ success: true, lootItems });
    });

    // Remove loot item (DM only)
    socket.on('remove-loot-item', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('remove-loot-item')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can remove loot items' });
        return;
      }

      const validation = validateData(RemoveLootItemDataSchema, data, 'remove-loot-item');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const lootItems = removeLootItem(roomCode, validation.data.itemId);

      if (!lootItems) {
        callback({ success: false, error: 'Failed to remove loot item' });
        return;
      }

      callback({ success: true, lootItems });
    });

    // Distribute loot item to player (DM only)
    socket.on('distribute-item', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('distribute-item')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo || !sessionInfo.isDm) {
        callback({ success: false, error: 'Only the DM can distribute items' });
        return;
      }

      const validation = validateData(DistributeItemDataSchema, data, 'distribute-item');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const { roomCode } = sessionInfo;
      const result = distributeItemToPlayer(
        roomCode,
        validation.data.lootItemId,
        validation.data.playerId,
        validation.data.playerName,
        validation.data.quantity
      );

      if (!result) {
        callback({ success: false, error: 'Failed to distribute item' });
        return;
      }

      // Notify the player that they received an item
      io.to(validation.data.playerId).emit('item-received', {
        playerInventories: result.playerInventories.filter(i => i.playerId === validation.data.playerId),
      });

      logger.info('Item distributed', { roomCode, playerId: validation.data.playerId, playerName: validation.data.playerName });

      callback({ success: true, lootItems: result.lootItems, playerInventories: result.playerInventories });
    });

    // Get player's inventory items
    socket.on('get-inventory', async (callback: (response: any) => void) => {
      if (!await checkLimit('get-inventory')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const sessionInfo = socketSessions.get(socket.id);
      if (!sessionInfo) {
        callback({ success: false, error: 'Not in a session' });
        return;
      }

      const { roomCode, isDm } = sessionInfo;
      const allInventories = getPlayerInventories(roomCode);

      // Players only see their own inventory, DMs see all
      const inventories = isDm
        ? allInventories
        : allInventories.filter(i => i.playerId === socket.id);

      callback({ success: true, inventories });
    });

    // ============ DISCONNECTION ============

    socket.on('disconnect', () => {
      const sessionInfo = socketSessions.get(socket.id);

      if (sessionInfo) {
        const { roomCode, isDm } = sessionInfo;

        if (isDm) {
          const session = getSession(roomCode);
          if (session) {
            session.dmSocketId = null;
          }
          logger.info('DM disconnected', { roomCode });
        } else {
          markPlayerDisconnected(roomCode, socket.id);

          io.to(roomCode).emit('player-disconnected', {
            playerId: socket.id,
            players: getPlayers(roomCode).map(p => ({
              id: p.id,
              name: p.name,
              isConnected: p.isConnected,
            })),
          });

          logger.info('Player disconnected', { roomCode, playerId: socket.id });
        }

        socketSessions.delete(socket.id);
      }

      socketLog.info('Client disconnected');
    });

    socket.on('get-players', async (data: unknown, callback: (response: any) => void) => {
      if (!await checkLimit('get-players')) {
        callback({ success: false, error: 'Rate limit exceeded.' });
        return;
      }

      const validation = validateData(GetPlayersDataSchema, data, 'get-players');
      if (!validation.success) {
        callback({ success: false, error: validation.error });
        return;
      }

      const players = getPlayers(validation.data.roomCode);
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
