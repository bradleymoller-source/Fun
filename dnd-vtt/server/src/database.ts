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
