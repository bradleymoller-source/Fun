import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';
import { saveSession, loadSession, clearSession } from '../utils/sessionStorage';
import type { Token, MapState, DiceRoll, ChatMessage, InitiativeEntry, Character } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useSessionStore();

  // Initialize socket connection
  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      store.setConnected(true);

      // First check if we have state in memory
      const state = useSessionStore.getState();

      // If no state in memory, try to restore from localStorage
      if (!state.roomCode) {
        const storedSession = loadSession();
        if (storedSession) {
          console.log('Found stored session, attempting to restore...');
          if (storedSession.isDm && storedSession.dmKey) {
            // DM: Reclaim stored session
            socket.emit('reclaim-session', {
              roomCode: storedSession.roomCode,
              dmKey: storedSession.dmKey
            }, (response: any) => {
              if (response.success) {
                console.log('Restored DM session from storage:', storedSession.roomCode);
                useSessionStore.getState().setSession(response.roomCode, storedSession.dmKey!, true);
                useSessionStore.getState().setPlayers(response.players || []);
                if (response.map) {
                  useSessionStore.getState().setMapState(response.map);
                }
                if (response.initiative) {
                  useSessionStore.getState().setInitiative(response.initiative);
                }
                useSessionStore.getState().setView('dm');
              } else {
                console.log('Stored DM session expired or invalid, clearing...');
                clearSession();
              }
            });
          } else if (storedSession.playerName) {
            // Player: Rejoin stored session
            socket.emit('join-session', {
              roomCode: storedSession.roomCode,
              playerName: storedSession.playerName
            }, (response: any) => {
              if (response.success) {
                console.log('Restored player session from storage:', storedSession.roomCode);
                useSessionStore.getState().setSession(response.roomCode, null, false);
                useSessionStore.getState().setPlayerName(storedSession.playerName!);
                if (response.map) {
                  useSessionStore.getState().setMapState(response.map);
                }
                if (response.initiative) {
                  useSessionStore.getState().setInitiative(response.initiative);
                }
                useSessionStore.getState().setView('player');
              } else {
                console.log('Stored player session expired or invalid, clearing...');
                clearSession();
              }
            });
          }
          return;
        }
      }

      // Auto-rejoin room if we have session info in memory (handles view transitions and reconnections)
      if (state.roomCode) {
        if (state.isDm && state.dmKey) {
          // DM: Reclaim session to rejoin room
          socket.emit('reclaim-session', { roomCode: state.roomCode, dmKey: state.dmKey }, (response: any) => {
            if (response.success) {
              console.log('Auto-reclaimed session:', state.roomCode);
              if (response.players) {
                useSessionStore.getState().setPlayers(response.players);
              }
              if (response.initiative) {
                useSessionStore.getState().setInitiative(response.initiative);
              }
            }
          });
        } else if (state.playerName) {
          // Player: Rejoin session
          socket.emit('join-session', { roomCode: state.roomCode, playerName: state.playerName }, (response: any) => {
            if (response.success) {
              console.log('Auto-rejoined session:', state.roomCode);
              if (response.initiative) {
                useSessionStore.getState().setInitiative(response.initiative);
              }
            }
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      store.setConnected(false);
    });

    // Player joined event
    socket.on('player-joined', (data) => {
      store.setPlayers(data.players);
    });

    // Player left event
    socket.on('player-left', (data) => {
      store.setPlayers(data.players);
    });

    // Player disconnected (but still in session)
    socket.on('player-disconnected', (data) => {
      store.setPlayers(data.players);
    });

    // Kicked by DM
    socket.on('kicked', (data) => {
      clearSession(); // Clear stored session
      store.reset();
      store.setError(data.message);
    });

    // Map updated event
    socket.on('map-updated', (data) => {
      if (data.map) {
        store.setMapState(data.map);
      }
    });

    // Tokens updated event
    socket.on('tokens-updated', (data) => {
      if (data.tokens) {
        store.setTokens(data.tokens);
      }
    });

    // Map shown to players by DM
    socket.on('map-shown', (data) => {
      if (data.map) {
        store.setMapState(data.map);
        store.setActiveMapId(data.mapId);
      }
    });

    // Map hidden from players by DM
    socket.on('map-hidden', () => {
      store.setMapState({
        imageUrl: null,
        gridSize: 50,
        gridOffsetX: 0,
        gridOffsetY: 0,
        showGrid: true,
        tokens: [],
        fogOfWar: [],
      });
      store.setActiveMapId(null);
    });

    // ============ PHASE 3: DICE, CHAT, INITIATIVE ============

    // Dice rolled event
    socket.on('dice-rolled', (data) => {
      store.addDiceRoll(data.roll);
      // Also add as a chat message for visibility
      const rollMessage: ChatMessage = {
        id: `msg-${data.roll.id}`,
        senderId: data.roll.playerId,
        senderName: data.roll.playerName,
        content: `🎲 ${data.roll.notation}: [${data.roll.rolls.join(', ')}]${data.roll.modifier !== 0 ? ` ${data.roll.modifier > 0 ? '+' : ''}${data.roll.modifier}` : ''} = ${data.roll.total}${data.roll.isPrivate ? ' (private)' : ''}`,
        timestamp: data.roll.timestamp,
        type: 'roll',
      };
      store.addChatMessage(rollMessage);
    });

    // Chat message received
    socket.on('chat-received', (data) => {
      store.addChatMessage(data.message);
    });

    // Initiative updated
    socket.on('initiative-updated', (data) => {
      store.setInitiative(data.initiative);
    });

    // Combat started
    socket.on('combat-started', (data) => {
      store.setInitiative(data.initiative);
      store.startCombat();
    });

    // Combat ended
    socket.on('combat-ended', () => {
      store.endCombat();
    });

    // ============ PHASE 4: CHARACTER EVENTS ============

    // Character updated (DM receives when player saves)
    socket.on('character-updated', (data) => {
      store.updateAllCharacters(data.playerId, data.character);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Create a new session (DM action)
  const createSession = useCallback(() => {
    return new Promise<{ roomCode: string; dmKey: string }>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('create-session', (response: any) => {
        if (response.success) {
          store.setSession(response.roomCode, response.dmKey, true);
          store.setView('dm');
          // Save to localStorage for persistence
          saveSession({
            roomCode: response.roomCode,
            isDm: true,
            dmKey: response.dmKey,
          });
          resolve({ roomCode: response.roomCode, dmKey: response.dmKey });
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Reclaim an existing session (DM action)
  const reclaimSession = useCallback((roomCode: string, dmKey: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('reclaim-session', { roomCode, dmKey }, (response: any) => {
        if (response.success) {
          store.setSession(response.roomCode, dmKey, true);
          store.setPlayers(response.players);
          if (response.map) {
            store.setMapState(response.map);
          }
          store.setView('dm');
          // Save to localStorage for persistence
          saveSession({
            roomCode: response.roomCode,
            isDm: true,
            dmKey,
          });
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Join a session (Player action)
  const joinSession = useCallback((roomCode: string, playerName: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('join-session', { roomCode, playerName }, (response: any) => {
        if (response.success) {
          store.setSession(response.roomCode, null, false);
          store.setPlayerName(playerName);
          if (response.map) {
            store.setMapState(response.map);
          }
          store.setView('player');
          // Save to localStorage for persistence
          saveSession({
            roomCode: response.roomCode,
            isDm: false,
            playerName,
          });
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Kick a player (DM action)
  const kickPlayer = useCallback((playerId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('kick-player', { playerId }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Leave session (Player/DM action)
  const leaveSession = useCallback(() => {
    clearSession(); // Clear stored session
    store.reset();
  }, []);

  // ============ MAP FUNCTIONS ============

  // Update map state (DM action)
  const updateMap = useCallback((mapState: Partial<MapState>) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('update-map', { mapState }, (response: any) => {
        if (response.success) {
          store.setMapState(response.map);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Add token (DM action)
  const addToken = useCallback((token: Token) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('add-token', { token }, (response: any) => {
        if (response.success) {
          store.setTokens(response.tokens);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Move token
  const moveToken = useCallback((tokenId: string, x: number, y: number) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('move-token', { tokenId, x, y }, (response: any) => {
        if (response.success) {
          store.setTokens(response.tokens);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Update token (DM action)
  const updateToken = useCallback((tokenId: string, updates: Partial<Token>) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('update-token', { tokenId, updates }, (response: any) => {
        if (response.success) {
          store.setTokens(response.tokens);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Remove token (DM action)
  const removeToken = useCallback((tokenId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('remove-token', { tokenId }, (response: any) => {
        if (response.success) {
          store.setTokens(response.tokens);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Show a map to players (DM action)
  const showMapToPlayers = useCallback((mapId: string, mapState: { imageUrl: string; gridSize: number; gridOffsetX: number; gridOffsetY: number; tokens?: Token[] }) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('show-map-to-players', { mapId, mapState }, (response: any) => {
        if (response.success) {
          store.setActiveMapId(mapId);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Hide map from players (DM action)
  const hideMapFromPlayers = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('hide-map-from-players', {}, (response: any) => {
        if (response.success) {
          store.setActiveMapId(null);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // ============ PHASE 3: DICE, CHAT, INITIATIVE ============

  // Roll dice
  const rollDice = useCallback((roll: DiceRoll) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('roll-dice', { roll }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((message: ChatMessage) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('send-chat', { message }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Add initiative entry (DM only)
  const addInitiativeEntry = useCallback((entry: InitiativeEntry) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('add-initiative', { entry }, (response: any) => {
        if (response.success) {
          store.setInitiative(response.initiative);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Remove initiative entry (DM only)
  const removeInitiativeEntry = useCallback((entryId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('remove-initiative', { entryId }, (response: any) => {
        if (response.success) {
          store.setInitiative(response.initiative);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Advance to next turn (DM only)
  const nextTurn = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('next-turn', (response: any) => {
        if (response.success) {
          store.setInitiative(response.initiative);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Start combat (DM only)
  const startCombat = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('start-combat', (response: any) => {
        if (response.success) {
          store.setInitiative(response.initiative);
          store.startCombat();
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // End combat (DM only)
  const endCombat = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('end-combat', (response: any) => {
        if (response.success) {
          store.endCombat();
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // ============ PHASE 4: CHARACTER FUNCTIONS ============

  // Save character to server
  const saveCharacter = useCallback((character: Character) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('save-character', { character }, (response: any) => {
        if (response.success) {
          console.log('Character saved to server');
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Load character from server
  const loadCharacter = useCallback(() => {
    return new Promise<Character | null>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('get-character', (response: any) => {
        if (response.success) {
          if (response.character) {
            store.setCharacter(response.character);
          }
          resolve(response.character || null);
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Get all characters (DM only)
  const getAllCharacters = useCallback(() => {
    return new Promise<Character[]>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('get-all-characters', (response: any) => {
        if (response.success) {
          store.setAllCharacters(response.characters || []);
          resolve(response.characters || []);
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  // Update a player's character (DM only - for HP, conditions, etc.)
  const updatePlayerCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }

      socketRef.current.emit('dm-update-character', { characterId, updates }, (response: any) => {
        if (response.success) {
          // Update local state
          const state = useSessionStore.getState();
          const updatedCharacters = state.allCharacters.map(c =>
            c.id === characterId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          );
          store.setAllCharacters(updatedCharacters);
          resolve();
        } else {
          store.setError(response.error);
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    isConnected: store.isConnected,
    createSession,
    reclaimSession,
    joinSession,
    leaveSession,
    kickPlayer,
    // Map functions
    updateMap,
    addToken,
    moveToken,
    updateToken,
    removeToken,
    showMapToPlayers,
    hideMapFromPlayers,
    // Phase 3: Dice, Chat, Initiative
    rollDice,
    sendChatMessage,
    addInitiativeEntry,
    removeInitiativeEntry,
    nextTurn,
    startCombat,
    endCombat,
    // Phase 4: Character
    saveCharacter,
    loadCharacter,
    getAllCharacters,
    updatePlayerCharacter,
  };
}
