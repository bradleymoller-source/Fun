// Represents a player in a session
export interface Player {
  id: string;           // Socket ID
  name: string;         // Display name
  isConnected: boolean; // Connection status
  joinedAt: Date;
}

// Token sizes
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Represents a token on the map
export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: TokenSize;
  color: string;
  imageUrl?: string;
  isHidden: boolean;
  ownerId?: string;
}

// Fog of war area
export interface FogArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRevealed: boolean;
}

// Map state
export interface MapState {
  imageUrl: string | null;
  gridSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  showGrid: boolean;
  tokens: Token[];
  fogOfWar: FogArea[];
}

// Phase 3: Dice Roll
export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: string;
  isPrivate: boolean;
}

// Phase 3: Chat Message
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'roll' | 'system';
}

// Common D&D conditions
export type Condition =
  | 'poisoned' | 'stunned' | 'prone' | 'frightened' | 'charmed'
  | 'paralyzed' | 'restrained' | 'blinded' | 'deafened' | 'invisible'
  | 'incapacitated' | 'exhausted' | 'concentrating';

// Phase 3: Initiative Entry
export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNpc: boolean;
  isActive: boolean;
  tokenId?: string;
  playerId?: string;
  // Combat stats
  maxHp?: number;
  currentHp?: number;
  conditions?: Condition[];
  // Turn manipulation
  isHolding?: boolean;
  originalInitiative?: number;
}

// Simplified character data for server storage
export interface CharacterData {
  id: string;
  playerId: string;
  name: string;
  data: string; // JSON stringified character data
  updatedAt: string;
}

// Store item available for purchase
export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  quantity: number;
  effect?: string;
}

// Loot item in the DM's loot pool
export interface LootItem {
  id: string;
  name: string;
  description?: string;
  value?: string;
  quantity: number;
  source?: string;
  // Item categorization
  itemType?: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gear' | 'treasure' | 'wondrous';
  // Weapon fields
  damage?: string;        // e.g. "1d8+1 slashing"
  attackBonus?: number;   // e.g. 5 for +5
  properties?: string[];  // e.g. ["versatile", "finesse"]
  // Armor fields
  armorClass?: number;
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  // Effect for potions/scrolls/magic items
  effect?: string;
  rarity?: string;
}

// Item distributed to a player
export interface PlayerInventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  playerId: string;
  playerName: string;
  // Item categorization
  itemType?: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gear' | 'treasure' | 'wondrous';
  // Weapon fields
  damage?: string;
  attackBonus?: number;
  properties?: string[];
  // Armor fields
  armorClass?: number;
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  // Effect for potions/scrolls/magic items
  effect?: string;
  rarity?: string;
  value?: string;
}

// Represents a game session
export interface Session {
  roomCode: string;     // 6-character code players use to join
  dmKey: string;        // Secret key for DM to reclaim session
  dmSocketId: string | null;  // Current DM socket connection
  players: Map<string, Player>;
  map: MapState;        // Current map state
  initiative: InitiativeEntry[];  // Combat initiative order
  isInCombat: boolean;  // Whether combat is active
  characters: Map<string, CharacterData>;  // Player characters (keyed by playerId)
  storeItems: StoreItem[];  // Items in the store (visible to players)
  lootItems: LootItem[];    // Loot pool (DM only)
  playerInventories: PlayerInventoryItem[];  // Items distributed to players
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
