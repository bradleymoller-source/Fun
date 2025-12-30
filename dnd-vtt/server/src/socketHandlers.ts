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
} from './sessionManager';
import { JoinSessionRequest, ReclaimSessionRequest } from './types';

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

      // Send current player list
      const players = getPlayers(roomCode);

      console.log(`Session reclaimed: ${roomCode} by ${socket.id}`);

      callback({ success: true, roomCode, players });
    });

    // Player joins a session
    socket.on('join-session', (data: JoinSessionRequest, callback: (response: any) => void) => {
      const { roomCode, playerName } = data;
      const upperRoomCode = roomCode.toUpperCase();

      if (!sessionExists(upperRoomCode)) {
        callback({ success: false, error: 'Session not found. Check the room code.' });
        return;
      }

      const player = addPlayer(upperRoomCode, socket.id, playerName);

      if (!player) {
        callback({ success: false, error: 'Failed to join session' });
        return;
      }

      socket.join(upperRoomCode);
      socketSessions.set(socket.id, { roomCode: upperRoomCode, isDm: false });

      // Notify everyone in the session (including DM)
      io.to(upperRoomCode).emit('player-joined', {
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

      console.log(`Player ${playerName} joined ${upperRoomCode}`);

      callback({ success: true, roomCode: upperRoomCode });
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
