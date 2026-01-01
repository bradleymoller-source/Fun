import winston from 'winston';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// JSON format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
];

// Add file transports in production
if (NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';

  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: prodFormat,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'dnd-vtt' },
  transports,
});

/**
 * Creates a child logger with additional context
 */
export function createContextLogger(context: Record<string, string>) {
  return logger.child(context);
}

/**
 * Creates a session-specific logger
 */
export function createSessionLogger(roomCode: string) {
  return logger.child({ roomCode });
}

/**
 * Creates a socket-specific logger
 */
export function createSocketLogger(socketId: string, roomCode?: string) {
  return logger.child({ socketId, ...(roomCode && { roomCode }) });
}

// Log startup info
logger.info('Logger initialized', { level: LOG_LEVEL, env: NODE_ENV });
