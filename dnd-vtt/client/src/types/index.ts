export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
}

// Token sizes in grid squares
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface Token {
  id: string;
  name: string;
  x: number;  // Grid position X
  y: number;  // Grid position Y
  size: TokenSize;
  color: string;  // Border color for identification
  imageUrl?: string;  // Optional token image
  isHidden: boolean;  // Only visible to DM
  ownerId?: string;  // Player who controls this token (socket ID)
}

export interface MapState {
  imageUrl: string | null;  // Background map image
  gridSize: number;  // Pixels per grid square
  gridOffsetX: number;  // Grid alignment offset
  gridOffsetY: number;
  showGrid: boolean;
  tokens: Token[];
  fogOfWar: FogArea[];  // Areas hidden from players
}

export interface FogArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRevealed: boolean;  // If true, this area is visible to players
}

// Saved map for the map library
export interface SavedMap {
  id: string;
  name: string;
  imageUrl: string;
  gridSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  tokens: Token[];  // Tokens associated with this map
  savedAt: string;  // ISO date string
}

// Phase 3: Dice Rolling
export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  notation: string;  // e.g., "2d6+3", "d20", "4d8-2"
  rolls: number[];   // Individual dice results
  modifier: number;  // +/- modifier
  total: number;     // Sum of rolls + modifier
  timestamp: string; // ISO date string
  isPrivate: boolean; // DM-only roll
}

// Phase 3: Chat Messages
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'roll' | 'system';  // Different message types
}

// Phase 3: Initiative Tracker
export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNpc: boolean;  // true = NPC/monster (DM controlled)
  isActive: boolean;  // Currently has their turn
  tokenId?: string;  // Link to token on map
  playerId?: string;  // Link to player (if not NPC)
}

// ============ PHASE 4: CHARACTER SHEET ============

// D&D 5e 2024 Species
export type Species =
  | 'aasimar'
  | 'dragonborn'
  | 'dwarf'
  | 'elf'
  | 'gnome'
  | 'goliath'
  | 'halfling'
  | 'human'
  | 'orc'
  | 'tiefling';

// D&D 5e Classes with hit dice
export type CharacterClass =
  | 'barbarian'   // d12
  | 'bard'        // d8
  | 'cleric'      // d8
  | 'druid'       // d8
  | 'fighter'     // d10
  | 'monk'        // d8
  | 'paladin'     // d10
  | 'ranger'      // d10
  | 'rogue'       // d8
  | 'sorcerer'    // d6
  | 'warlock'     // d8
  | 'wizard';     // d6

// Ability scores
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Skill names mapped to their ability
export type SkillName =
  // Strength
  | 'athletics'
  // Dexterity
  | 'acrobatics'
  | 'sleightOfHand'
  | 'stealth'
  // Intelligence
  | 'arcana'
  | 'history'
  | 'investigation'
  | 'nature'
  | 'religion'
  // Wisdom
  | 'animalHandling'
  | 'insight'
  | 'medicine'
  | 'perception'
  | 'survival'
  // Charisma
  | 'deception'
  | 'intimidation'
  | 'performance'
  | 'persuasion';

// Skill proficiency type
export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

// Equipment item
export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  equipped?: boolean;
}

// Weapon with attack info
export interface Weapon {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;  // e.g., "1d8+3 slashing"
  properties?: string[];  // e.g., ["versatile", "finesse"]
  equipped: boolean;
}

// Currency
export interface Currency {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

// Spell
export interface Spell {
  id: string;
  name: string;
  level: number;  // 0 for cantrips
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
}

// Character feature or trait
export interface Feature {
  id: string;
  name: string;
  source: string;  // e.g., "Species", "Class", "Background"
  description: string;
}

// Complete character sheet
export interface Character {
  id: string;
  playerId: string;  // Socket ID of owner

  // Basic Info
  name: string;
  species: Species;
  subspecies?: string;  // e.g., "High Elf", "Hill Dwarf"
  characterClass: CharacterClass;
  subclass?: string;
  level: number;
  background: string;
  alignment?: string;
  experiencePoints: number;

  // Ability Scores
  abilityScores: AbilityScores;

  // Proficiencies
  savingThrowProficiencies: (keyof AbilityScores)[];
  skillProficiencies: Record<SkillName, ProficiencyLevel>;
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];

  // Combat Stats
  armorClass: number;
  initiative: number;
  speed: number;
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  hitDiceTotal: number;
  hitDiceRemaining: number;
  deathSaves: {
    successes: number;
    failures: number;
  };

  // Equipment
  weapons: Weapon[];
  equipment: EquipmentItem[];
  currency: Currency;

  // Features & Traits
  features: Feature[];

  // Simple spell lists (for character creator)
  cantrips?: string[];
  spells?: string[];

  // Spellcasting (optional)
  spellcasting?: {
    ability: keyof AbilityScores;
    spellSaveDC: number;
    spellAttackBonus: number;
    spells: Spell[];
    spellSlots: number[];  // Index = spell level - 1
    spellSlotsUsed: number[];
  };

  // Personality
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;

  // Appearance
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  appearance?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Character creation state (partial character during creation)
export interface CharacterCreationState {
  step: 'basics' | 'abilities' | 'proficiencies' | 'equipment' | 'personality' | 'review';
  character: Partial<Character>;
}

export interface SessionState {
  // Connection state
  isConnected: boolean;

  // Session info
  roomCode: string | null;
  dmKey: string | null;  // Only set for DM
  isDm: boolean;

  // Player info
  playerName: string | null;
  players: Player[];

  // Map state (currently active map)
  map: MapState;

  // Map library (DM's saved maps)
  savedMaps: SavedMap[];

  // Active map ID (which saved map is currently shown to players, null = none)
  activeMapId: string | null;

  // Phase 3: Dice & Chat
  diceHistory: DiceRoll[];
  chatMessages: ChatMessage[];

  // Phase 3: Initiative
  initiative: InitiativeEntry[];
  isInCombat: boolean;

  // Phase 4: Character
  character: Character | null;
  allCharacters: Character[];  // All characters in session (for DM view)

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  playerTab: 'map' | 'character';  // Player view tab
  error: string | null;
}
