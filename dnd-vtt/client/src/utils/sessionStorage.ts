// Session storage utilities for persistence across page reloads

const STORAGE_KEY = 'dnd-vtt-session';

export interface StoredSession {
  roomCode: string;
  isDm: boolean;
  dmKey?: string;
  playerName?: string;
  savedAt: string;
}

/**
 * Save session info to localStorage
 */
export function saveSession(session: Omit<StoredSession, 'savedAt'>): void {
  try {
    const data: StoredSession = {
      ...session,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Session saved to storage:', session.roomCode);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Load session info from localStorage
 */
export function loadSession(): StoredSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const session: StoredSession = JSON.parse(data);

    // Check if session is too old (24 hours)
    const savedAt = new Date(session.savedAt);
    const hoursSinceLastSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSave > 24) {
      console.log('Stored session expired, clearing...');
      clearSession();
      return null;
    }

    console.log('Loaded session from storage:', session.roomCode);
    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Session cleared from storage');
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Check if we have a stored session
 */
export function hasStoredSession(): boolean {
  return loadSession() !== null;
}
