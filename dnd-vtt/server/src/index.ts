import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socketHandlers';
import { loadSessionsFromDb, cleanupExpiredSessions } from './sessionManager';
import { generateCampaign, generateDungeonMapEndpoint, generateEncounter, generateBattleMap, generateActBattleMaps, generateSceneImage } from './campaignGenerator';
import { logger } from './utils/logger';

// Version for debugging deployments
const SERVER_VERSION = '2.0.1-debug-show-map';
logger.info(`Starting server version ${SERVER_VERSION}`);

const app = express();
const httpServer = createServer(app);

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Configure CORS based on environment
const corsOrigin = NODE_ENV === 'production' && ALLOWED_ORIGINS.length > 0
  ? ALLOWED_ORIGINS
  : '*'; // Allow all in development

logger.info('CORS configuration', { environment: NODE_ENV, origins: corsOrigin });

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: NODE_ENV === 'production',
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB to handle large base64 images
});

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: NODE_ENV === 'production',
}));
app.use(express.json({ limit: '10mb' })); // Limit request body size

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') { // Don't log health checks
      logger.info('HTTP request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API config check endpoint
app.get('/api/config/check', (_req, res) => {
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
app.post('/api/campaign/scene', generateSceneImage);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler to ensure JSON responses
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Load existing sessions from database
loadSessionsFromDb();

// Set up socket handlers
setupSocketHandlers(io);

// Cleanup expired sessions every hour
setInterval(() => {
  logger.info('Running session cleanup');
  cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server on all interfaces (0.0.0.0) for network access
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  logger.info(`Server started`, { host: HOST, port: PORT, environment: NODE_ENV });
});
