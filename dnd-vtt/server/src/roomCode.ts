import crypto from 'crypto';

// Characters that are easy to read aloud (no 0/O, 1/I/L confusion)
const CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a cryptographically secure random index
 */
function secureRandomIndex(max: number): number {
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  return randomValue % max;
}

/**
 * Generates an 8-character room code that's easy to read aloud
 * Uses cryptographically secure random generation
 * 8 characters = ~1.8 trillion combinations with our character set
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CHARACTERS[secureRandomIndex(CHARACTERS.length)];
  }
  return code;
}

/**
 * Generates a secret DM key (longer, for security)
 * Uses cryptographically secure random generation
 */
export function generateDmKey(): string {
  let key = '';
  for (let i = 0; i < 24; i++) {
    key += CHARACTERS[secureRandomIndex(CHARACTERS.length)];
  }
  return key;
}

/**
 * Hashes a password for secure storage
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}
