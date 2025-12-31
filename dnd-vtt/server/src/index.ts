import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socketHandlers';
import { loadSessionsFromDb, cleanupExpiredSessions } from './sessionManager';
import { generateCampaign, generateDungeonMapEndpoint, generateEncounter, generateBattleMap, generateActBattleMaps } from './campaignGenerator';

const app = express();
const httpServer = createServer(app);

// Configure CORS for development (allow all origins for local network access)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware - allow all origins for local network access
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API config check endpoint
app.get('/api/config/check', (req, res) => {
  res.json({
    geminiConfigured: !!process.env.GOOGLE_API_KEY,
    keyLength: process.env.GOOGLE_API_KEY?.length || 0,
  });
});

// Campaign generation endpoints
app.post('/api/campaign/generate', generateCampaign);
app.post('/api/campaign/dungeon', generateDungeonMapEndpoint);
app.post('/api/campaign/encounter', generateEncounter);
app.post('/api/campaign/battlemap', generateBattleMap);
app.post('/api/campaign/battlemaps', generateActBattleMaps);

// Global error handler to ensure JSON responses
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Load existing sessions from database
loadSessionsFromDb();

// Set up socket handlers
setupSocketHandlers(io);

// Cleanup expired sessions every hour
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Start server on all interfaces (0.0.0.0) for network access
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
