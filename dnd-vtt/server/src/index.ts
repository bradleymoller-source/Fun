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
