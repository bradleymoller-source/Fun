# D&D Virtual Tabletop - Phase 1 Build Plan

## Overview

This build plan covers **Phase 1: Core Session Management** - getting the room code system, player joining, and real-time connections working.

### Technology Choices

| Technology | Purpose |
|------------|---------|
| React + TypeScript | Frontend framework |
| Vite | Fast development server & build tool |
| Tailwind CSS | Styling (utility-first CSS) |
| Zustand | Simple state management |
| Node.js + Express | Backend server |
| Socket.io | Real-time WebSocket connections |
| SQLite | Database (simple file-based) |
| Railway | Free hosting platform |

---

## Phase 1 Features

- [x] Landing page with "Create Game" and "Join Game" buttons
- [x] Room code generation (6-character, easy to read aloud)
- [x] Player join flow (enter code → enter name → join)
- [x] Real-time player list updates
- [x] DM secret key for session persistence
- [x] Handle disconnections gracefully
- [x] DM can kick players
- [x] Room codes expire after 24 hours of inactivity

---

## Build Steps

### Step 1: Project Setup

#### 1.1 Create Project Structure

```bash
# Create main project folder
mkdir dnd-vtt && cd dnd-vtt

# Initialize client (React + TypeScript + Vite)
npm create vite@latest client -- --template react-ts

# Initialize server
mkdir server && cd server
npm init -y
```

#### 1.2 Install Client Dependencies

```bash
cd client
npm install socket.io-client zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 1.3 Install Server Dependencies

```bash
cd server
npm install express socket.io cors better-sqlite3 uuid
npm install -D typescript @types/node @types/express @types/better-sqlite3 ts-node nodemon
npx tsc --init
```

#### 1.4 Configure TypeScript (server/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.5 Configure Tailwind (client/tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // D&D themed colors
        parchment: '#f4e4bc',
        leather: '#8b4513',
        gold: '#d4af37',
        amber: '#ffbf00',
        'deep-red': '#8b0000',
        'dark-wood': '#3d2314',
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
```

#### 1.6 Add Tailwind to CSS (client/src/index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

body {
  @apply bg-dark-wood min-h-screen;
}
```

---

### Step 2: Server Implementation

#### 2.1 File Structure

```
server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── database.ts           # SQLite setup
│   ├── roomCode.ts           # Room code generation
│   ├── sessionManager.ts     # Session state management
│   ├── socketHandlers.ts     # Socket.io event handlers
│   └── types.ts              # TypeScript interfaces
├── data/                     # SQLite database file location
├── package.json
└── tsconfig.json
```

#### 2.2 Types (server/src/types.ts)

```typescript
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
```

#### 2.3 Room Code Generator (server/src/roomCode.ts)

```typescript
// Characters that are easy to read aloud (no 0/O, 1/I/L confusion)
const CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a 6-character room code that's easy to read aloud
 * Avoids confusing characters like 0/O, 1/I/L
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Generates a secret DM key (longer, for security)
 */
export function generateDmKey(): string {
  let key = '';
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    key += CHARACTERS[randomIndex];
  }
  return key;
}
```

#### 2.4 Database Setup (server/src/database.ts)

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create/connect to database
const db = new Database(path.join(dataDir, 'sessions.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    room_code TEXT PRIMARY KEY,
    dm_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_activity TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    session_room_code TEXT NOT NULL,
    name TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    FOREIGN KEY (session_room_code) REFERENCES sessions(room_code)
  );
`);

export default db;

/**
 * Clean up sessions inactive for more than 24 hours
 */
export function cleanupExpiredSessions(): void {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Delete players from expired sessions
  db.prepare(`
    DELETE FROM players
    WHERE session_room_code IN (
      SELECT room_code FROM sessions WHERE last_activity < ?
    )
  `).run(twentyFourHoursAgo);

  // Delete expired sessions
  db.prepare('DELETE FROM sessions WHERE last_activity < ?').run(twentyFourHoursAgo);
}
```

#### 2.5 Session Manager (server/src/sessionManager.ts)

```typescript
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
```

#### 2.6 Socket Handlers (server/src/socketHandlers.ts)

```typescript
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
```

#### 2.7 Main Server Entry (server/src/index.ts)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socketHandlers';
import { loadSessionsFromDb, cleanupExpiredSessions } from './sessionManager';

const app = express();
const httpServer = createServer(app);

// Configure CORS for development
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load existing sessions from database
loadSessionsFromDb();

// Set up socket handlers
setupSocketHandlers(io);

// Cleanup expired sessions every hour
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 2.8 Server Scripts (package.json)

Add these scripts to `server/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

### Step 3: Client Implementation

#### 3.1 File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Panel.tsx
│   │   ├── Landing.tsx
│   │   ├── CreateGame.tsx
│   │   ├── JoinGame.tsx
│   │   ├── DMView.tsx
│   │   └── PlayerView.tsx
│   ├── hooks/
│   │   └── useSocket.ts
│   ├── stores/
│   │   └── sessionStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
└── package.json
```

#### 3.2 Types (client/src/types/index.ts)

```typescript
export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
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

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  error: string | null;
}
```

#### 3.3 Zustand Store (client/src/stores/sessionStore.ts)

```typescript
import { create } from 'zustand';
import { Player, SessionState } from '../types';

interface SessionStore extends SessionState {
  // Actions
  setConnected: (connected: boolean) => void;
  setSession: (roomCode: string, dmKey: string | null, isDm: boolean) => void;
  setPlayerName: (name: string) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  setView: (view: SessionState['view']) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SessionState = {
  isConnected: false,
  roomCode: null,
  dmKey: null,
  isDm: false,
  playerName: null,
  players: [],
  view: 'landing',
  error: null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setConnected: (isConnected) => set({ isConnected }),

  setSession: (roomCode, dmKey, isDm) => set({ roomCode, dmKey, isDm }),

  setPlayerName: (playerName) => set({ playerName }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayerConnection: (playerId, isConnected) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isConnected } : p
      ),
    })),

  setView: (view) => set({ view }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
```

#### 3.4 Socket Hook (client/src/hooks/useSocket.ts)

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';

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
      store.reset();
      store.setError(data.message);
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
          store.setView('dm');
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
          store.setView('player');
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

  return {
    socket: socketRef.current,
    isConnected: store.isConnected,
    createSession,
    reclaimSession,
    joinSession,
    kickPlayer,
  };
}
```

#### 3.5 UI Components

**Button (client/src/components/ui/Button.tsx)**

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medieval font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gold text-dark-wood hover:bg-amber shadow-lg hover:shadow-xl',
    secondary: 'bg-leather text-parchment hover:bg-opacity-80 border-2 border-gold',
    danger: 'bg-deep-red text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Input (client/src/components/ui/Input.tsx)**

```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-medieval text-gold text-lg">{label}</label>
      )}
      <input
        className={`
          bg-parchment text-dark-wood font-medieval text-xl
          px-4 py-3 rounded-lg border-2 border-leather
          focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/50
          placeholder:text-leather/50
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
```

**Panel (client/src/components/ui/Panel.tsx)**

```tsx
import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`
        bg-gradient-to-b from-leather to-dark-wood
        border-4 border-gold rounded-xl
        shadow-2xl p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

#### 3.6 Page Components

**Landing (client/src/components/Landing.tsx)**

```tsx
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';

export function Landing() {
  const { setView, isConnected, error } = useSessionStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full text-center">
        <h1 className="font-medieval text-4xl text-gold mb-2">
          D&D Virtual Tabletop
        </h1>
        <p className="text-parchment/70 mb-8">
          Gather your party and venture forth
        </p>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            size="lg"
            onClick={() => setView('create')}
            disabled={!isConnected}
          >
            Create Game
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setView('join')}
            disabled={!isConnected}
          >
            Join Game
          </Button>
        </div>

        {!isConnected && (
          <p className="text-amber mt-4 animate-pulse">
            Connecting to server...
          </p>
        )}
      </Panel>
    </div>
  );
}
```

**CreateGame (client/src/components/CreateGame.tsx)**

```tsx
import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { Input } from './ui/Input';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function CreateGame() {
  const [isCreating, setIsCreating] = useState(false);
  const { createSession, reclaimSession } = useSocket();
  const { setView, setError, error } = useSessionStore();

  // For reclaiming existing sessions
  const [showReclaim, setShowReclaim] = useState(false);
  const [reclaimCode, setReclaimCode] = useState('');
  const [reclaimKey, setReclaimKey] = useState('');

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      await createSession();
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsCreating(false);
    }
  };

  const handleReclaim = async () => {
    if (!reclaimCode || !reclaimKey) {
      setError('Please enter both room code and DM key');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await reclaimSession(reclaimCode, reclaimKey);
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full">
        <h2 className="font-medieval text-3xl text-gold mb-6 text-center">
          Dungeon Master
        </h2>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!showReclaim ? (
          <>
            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create New Session'}
            </Button>

            <div className="text-center text-parchment/50 my-4">or</div>

            <Button
              variant="secondary"
              className="w-full mb-4"
              onClick={() => setShowReclaim(true)}
            >
              Reclaim Existing Session
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <Input
                label="Room Code"
                placeholder="ABC123"
                value={reclaimCode}
                onChange={(e) => setReclaimCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Input
                label="DM Key"
                placeholder="Your secret DM key"
                value={reclaimKey}
                onChange={(e) => setReclaimKey(e.target.value.toUpperCase())}
              />
            </div>

            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleReclaim}
              disabled={isCreating}
            >
              {isCreating ? 'Reclaiming...' : 'Reclaim Session'}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowReclaim(false)}
            >
              Back
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => {
            setError(null);
            setView('landing');
          }}
        >
          ← Back to Home
        </Button>
      </Panel>
    </div>
  );
}
```

**JoinGame (client/src/components/JoinGame.tsx)**

```tsx
import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { Input } from './ui/Input';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function JoinGame() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { joinSession } = useSocket();
  const { setView, setError, error } = useSessionStore();

  const handleJoin = async () => {
    if (!roomCode || !playerName) {
      setError('Please enter both room code and your name');
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      await joinSession(roomCode, playerName);
    } catch (err) {
      // Error is already set in store by useSocket
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Panel className="max-w-md w-full">
        <h2 className="font-medieval text-3xl text-gold mb-6 text-center">
          Join Adventure
        </h2>

        {error && (
          <div className="bg-deep-red/20 border border-deep-red text-red-300 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <Input
            label="Room Code"
            placeholder="Enter 6-character code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <Input
            label="Your Name"
            placeholder="What shall we call you?"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={30}
          />
        </div>

        <Button
          size="lg"
          className="w-full mb-4"
          onClick={handleJoin}
          disabled={isJoining || !roomCode || !playerName}
        >
          {isJoining ? 'Joining...' : 'Enter the Realm'}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setError(null);
            setView('landing');
          }}
        >
          ← Back to Home
        </Button>
      </Panel>
    </div>
  );
}
```

**DMView (client/src/components/DMView.tsx)**

```tsx
import { useState } from 'react';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../stores/sessionStore';

export function DMView() {
  const { roomCode, dmKey, players } = useSessionStore();
  const { kickPlayer } = useSocket();
  const [copied, setCopied] = useState<'code' | 'key' | null>(null);

  const copyToClipboard = (text: string, type: 'code' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <Panel className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Dungeon Master View
              </h1>
              <p className="text-parchment/70 text-sm mt-1">
                Share the room code with your players
              </p>
            </div>

            <div className="flex gap-4">
              {/* Room Code */}
              <div
                className="bg-dark-wood px-4 py-2 rounded-lg border-2 border-gold cursor-pointer hover:bg-leather/50 transition-colors"
                onClick={() => roomCode && copyToClipboard(roomCode, 'code')}
                title="Click to copy"
              >
                <div className="text-parchment/50 text-xs">ROOM CODE</div>
                <div className="font-medieval text-2xl text-gold tracking-widest">
                  {roomCode}
                </div>
                {copied === 'code' && (
                  <div className="text-green-400 text-xs">Copied!</div>
                )}
              </div>
            </div>
          </div>

          {/* DM Key (save this!) */}
          <div className="mt-4 p-3 bg-deep-red/20 border border-deep-red rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-red-300 text-sm font-semibold">
                  🔑 Your DM Key (save this!)
                </div>
                <div className="text-parchment font-mono text-sm">
                  {dmKey}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dmKey && copyToClipboard(dmKey, 'key')}
              >
                {copied === 'key' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-parchment/50 text-xs mt-2">
              Use this key to reclaim your session if you get disconnected
            </p>
          </div>
        </Panel>

        {/* Players List */}
        <Panel>
          <h2 className="font-medieval text-xl text-gold mb-4">
            Connected Players ({players.length})
          </h2>

          {players.length === 0 ? (
            <div className="text-parchment/50 text-center py-8">
              <p className="text-lg">No players have joined yet</p>
              <p className="text-sm mt-2">
                Share the room code <span className="text-gold font-bold">{roomCode}</span> with your players
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center bg-dark-wood px-4 py-3 rounded-lg border border-leather"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                      }`}
                      title={player.isConnected ? 'Connected' : 'Reconnecting...'}
                    />
                    <span className="text-parchment font-medieval text-lg">
                      {player.name}
                    </span>
                    {!player.isConnected && (
                      <span className="text-yellow-500 text-sm">(reconnecting...)</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => kickPlayer(player.id)}
                  >
                    Kick
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Placeholder for future features */}
        <Panel className="mt-6 text-center py-12">
          <p className="text-parchment/50 font-medieval text-xl">
            🗺️ Map & Token Controls Coming in Phase 2
          </p>
        </Panel>
      </div>
    </div>
  );
}
```

**PlayerView (client/src/components/PlayerView.tsx)**

```tsx
import { Panel } from './ui/Panel';
import { useSessionStore } from '../stores/sessionStore';

export function PlayerView() {
  const { roomCode, playerName, players, isConnected } = useSessionStore();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Panel className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-medieval text-2xl text-gold">
                Welcome, {playerName}!
              </h1>
              <p className="text-parchment/70">
                Room: <span className="text-gold font-bold">{roomCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="text-parchment text-sm">
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </Panel>

        {/* Party Members */}
        <Panel className="mb-6">
          <h2 className="font-medieval text-xl text-gold mb-4">
            Your Party ({players.length})
          </h2>

          {players.length === 0 ? (
            <p className="text-parchment/50">No other adventurers yet...</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`
                    px-4 py-2 rounded-lg border-2
                    ${player.isConnected
                      ? 'bg-dark-wood border-gold text-parchment'
                      : 'bg-dark-wood/50 border-leather text-parchment/50'
                    }
                  `}
                >
                  <span className="font-medieval">{player.name}</span>
                  {!player.isConnected && (
                    <span className="text-yellow-500 text-xs ml-2">(away)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Placeholder for future features */}
        <Panel className="text-center py-12">
          <p className="text-parchment/50 font-medieval text-xl">
            🎲 Character Sheet & Map Coming Soon
          </p>
          <p className="text-parchment/30 mt-2">
            Waiting for your DM to begin the adventure...
          </p>
        </Panel>
      </div>
    </div>
  );
}
```

#### 3.7 Main App (client/src/App.tsx)

```tsx
import { useSessionStore } from './stores/sessionStore';
import { useSocket } from './hooks/useSocket';
import { Landing } from './components/Landing';
import { CreateGame } from './components/CreateGame';
import { JoinGame } from './components/JoinGame';
import { DMView } from './components/DMView';
import { PlayerView } from './components/PlayerView';

function App() {
  // Initialize socket connection
  useSocket();

  const { view } = useSessionStore();

  // Render based on current view
  switch (view) {
    case 'create':
      return <CreateGame />;
    case 'join':
      return <JoinGame />;
    case 'dm':
      return <DMView />;
    case 'player':
      return <PlayerView />;
    default:
      return <Landing />;
  }
}

export default App;
```

#### 3.8 Environment Variables

Create `client/.env` for development:

```env
VITE_SERVER_URL=http://localhost:3001
```

---

### Step 4: Running the Project

#### 4.1 Development

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

#### 4.2 Testing Multi-User

1. Open `http://localhost:5173` in one browser - Create Game as DM
2. Open `http://localhost:5173` in another browser/incognito - Join with room code
3. Watch players appear in real-time!

---

### Step 5: Deployment to Railway

#### 5.1 Prepare for Production

**Server (server/package.json)** - Add build script:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

**Client** - Build command is already set by Vite.

#### 5.2 Railway Setup

1. Create account at [railway.app](https://railway.app) (free tier available)
2. Create new project
3. Deploy server:
   - Connect GitHub repo or upload code
   - Set root directory to `/server`
   - Railway auto-detects Node.js
   - Add environment variable: `CLIENT_URL=https://your-frontend-url.railway.app`
4. Deploy client:
   - Add another service
   - Set root directory to `/client`
   - Add environment variable: `VITE_SERVER_URL=https://your-backend-url.railway.app`

#### 5.3 Alternative: Single Railway Service

You can also serve the client from the Express server:

```typescript
// In server/src/index.ts, add after other middleware:
import path from 'path';

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
```

---

## Summary Checklist

### Phase 1 Complete When:

- [ ] Landing page shows Create/Join buttons
- [ ] DM can create a session and sees room code + DM key
- [ ] Players can join with room code and display name
- [ ] DM sees real-time list of connected players
- [ ] DM can kick players
- [ ] Players see who else is in the session
- [ ] Disconnections show "reconnecting" state
- [ ] DM can reclaim session with DM key
- [ ] Deployed and accessible online

---

## Next Phase Preview

**Phase 2: Interactive Map System** will add:
- Map canvas with Konva.js
- Image upload for maps
- Grid overlay
- Token placement and movement
- Real-time position sync
- Fog of war (basic)

Ready to proceed when Phase 1 is complete!
