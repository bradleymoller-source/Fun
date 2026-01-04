/**
 * Delta Updates Utility
 *
 * This module provides utilities for computing and applying deltas to state objects.
 * Instead of sending full state over the wire, we only send changes.
 */

export interface Delta {
  type: 'update' | 'add' | 'remove';
  path: string;
  value?: unknown;
  previousValue?: unknown;
  timestamp: number;
  sequence: number;
}

export interface DeltaPacket {
  deltas: Delta[];
  baseSequence: number;
  newSequence: number;
  checksum?: string;
}

// Global sequence counter for ordering
let sequenceCounter = 0;

/**
 * Get the next sequence number
 */
export function getNextSequence(): number {
  return ++sequenceCounter;
}

/**
 * Reset sequence counter (for testing or reconnection)
 */
export function resetSequence(value: number = 0): void {
  sequenceCounter = value;
}

/**
 * Create a delta between two states
 * Returns only the changed fields
 */
export function createDelta<T extends Record<string, unknown>>(
  previous: T | null | undefined,
  current: T,
  path: string = ''
): Delta[] {
  const deltas: Delta[] = [];

  if (previous === null || previous === undefined) {
    // Entire object is new
    deltas.push({
      type: 'add',
      path: path || '$',
      value: current,
      timestamp: Date.now(),
      sequence: getNextSequence(),
    });
    return deltas;
  }

  // Compare each key
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const key of allKeys) {
    const prevVal = previous[key];
    const currVal = current[key];
    const keyPath = path ? `${path}.${key}` : key;

    if (currVal === undefined && prevVal !== undefined) {
      // Key was removed
      deltas.push({
        type: 'remove',
        path: keyPath,
        previousValue: prevVal,
        timestamp: Date.now(),
        sequence: getNextSequence(),
      });
    } else if (prevVal === undefined && currVal !== undefined) {
      // Key was added
      deltas.push({
        type: 'add',
        path: keyPath,
        value: currVal,
        timestamp: Date.now(),
        sequence: getNextSequence(),
      });
    } else if (!deepEqual(prevVal, currVal)) {
      // Value changed
      if (isPlainObject(prevVal) && isPlainObject(currVal)) {
        // Recurse into objects for granular deltas
        deltas.push(...createDelta(
          prevVal as Record<string, unknown>,
          currVal as Record<string, unknown>,
          keyPath
        ));
      } else {
        deltas.push({
          type: 'update',
          path: keyPath,
          value: currVal,
          previousValue: prevVal,
          timestamp: Date.now(),
          sequence: getNextSequence(),
        });
      }
    }
  }

  return deltas;
}

/**
 * Apply deltas to a state object
 * Returns a new state with deltas applied
 */
export function applyDeltas<T extends Record<string, unknown>>(state: T, deltas: Delta[]): T {
  // Sort deltas by sequence to ensure correct order
  const sortedDeltas = [...deltas].sort((a, b) => a.sequence - b.sequence);

  let result = deepClone(state);

  for (const delta of sortedDeltas) {
    result = applyDelta(result, delta);
  }

  return result;
}

/**
 * Apply a single delta to a state object
 */
function applyDelta<T extends Record<string, unknown>>(state: T, delta: Delta): T {
  const { type, path, value } = delta;

  // Handle root replacement
  if (path === '$') {
    return value as T;
  }

  const parts = path.split('.');
  const result = deepClone(state);

  // Navigate to the parent of the target key
  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];

  switch (type) {
    case 'add':
    case 'update':
      current[lastKey] = deepClone(value);
      break;
    case 'remove':
      delete current[lastKey];
      break;
  }

  return result;
}

/**
 * Create a delta packet for transmission
 */
export function createDeltaPacket<T extends Record<string, unknown>>(
  previous: T | null | undefined,
  current: T,
  baseSequence: number
): DeltaPacket {
  const deltas = createDelta(previous, current);

  return {
    deltas,
    baseSequence,
    newSequence: sequenceCounter,
    checksum: computeChecksum(current),
  };
}

/**
 * Compute a simple checksum for state verification
 */
function computeChecksum(obj: unknown): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => deepEqual(objA[key], objB[key]));
  }

  return false;
}

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as T;
  }

  const result: Record<string, unknown> = {};
  const source = obj as Record<string, unknown>;
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = deepClone(source[key]);
    }
  }
  return result as T;
}

/**
 * Check if a value is a plain object (not array, null, etc.)
 */
function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

// Token-specific delta helpers
export interface TokenDelta {
  id: string;
  changes: Partial<{
    x: number;
    y: number;
    name: string;
    color: string;
    isHidden: boolean;
    conditions: string[];
    currentHp: number;
    maxHp: number;
  }>;
}

/**
 * Create optimized token position delta
 * For high-frequency token moves, send minimal data
 */
export function createTokenMoveDelta(tokenId: string, x: number, y: number): TokenDelta {
  return {
    id: tokenId,
    changes: { x, y },
  };
}

/**
 * Batch multiple token updates into a single packet
 */
export function batchTokenDeltas(deltas: TokenDelta[]): { tokens: TokenDelta[]; timestamp: number } {
  return {
    tokens: deltas,
    timestamp: Date.now(),
  };
}

// Map state delta helpers
export interface MapStateDelta {
  imageUrl?: string | null;
  gridSize?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  showGrid?: boolean;
  tokenDeltas?: TokenDelta[];
  fogDeltas?: {
    added?: string[];
    removed?: string[];
    toggled?: string[];
  };
}

/**
 * Create a minimal map state delta
 * Only includes fields that changed
 */
export function createMapDelta(
  previous: MapStateDelta | null,
  current: MapStateDelta
): MapStateDelta | null {
  if (!previous) return current;

  const delta: MapStateDelta = {};
  let hasChanges = false;

  if (previous.imageUrl !== current.imageUrl) {
    delta.imageUrl = current.imageUrl;
    hasChanges = true;
  }

  if (previous.gridSize !== current.gridSize) {
    delta.gridSize = current.gridSize;
    hasChanges = true;
  }

  if (previous.gridOffsetX !== current.gridOffsetX) {
    delta.gridOffsetX = current.gridOffsetX;
    hasChanges = true;
  }

  if (previous.gridOffsetY !== current.gridOffsetY) {
    delta.gridOffsetY = current.gridOffsetY;
    hasChanges = true;
  }

  if (previous.showGrid !== current.showGrid) {
    delta.showGrid = current.showGrid;
    hasChanges = true;
  }

  return hasChanges ? delta : null;
}
