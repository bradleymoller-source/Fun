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
