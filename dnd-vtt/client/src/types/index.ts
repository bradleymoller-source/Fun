export interface Player {
  id: string;
  name: string;
  isConnected: boolean;
}

// Token sizes in grid squares
export type TokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Common D&D conditions
export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled'
  | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
  | 'prone' | 'restrained' | 'stunned' | 'unconscious'
  | 'exhausted' | 'concentrating';

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
  // Combat stats (optional)
  maxHp?: number;
  currentHp?: number;
  conditions?: Condition[];
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

// Store and Loot System
export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price: string;  // e.g., "50gp", "10sp"
  quantity: number;  // -1 for unlimited
  effect?: string;  // What it does, e.g., "Restores 2d4+2 HP"
}

export interface LootItem {
  id: string;
  name: string;
  description?: string;
  value?: string;  // e.g., "50gp"
  quantity: number;
  source?: string;  // Where it came from, e.g., "Room 3 treasure chest"
  // Item categorization
  itemType?: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gear' | 'treasure' | 'wondrous' | 'clue';
  // Weapon fields
  damage?: string;        // e.g. "1d8+1 slashing"
  attackBonus?: number;   // e.g. 5 for +5
  properties?: string[];  // e.g. ["versatile", "finesse"]
  baseWeaponType?: string; // e.g. "longsword", "dagger" - for looking up base damage dice
  // Armor fields
  armorClass?: number;
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  // Effect for potions/scrolls/magic items
  effect?: string;
  rarity?: string;
}

export interface PlayerInventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  playerId: string;
  playerName: string;
  // Item categorization
  itemType?: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gear' | 'treasure' | 'wondrous' | 'clue';
  // Weapon fields
  damage?: string;
  attackBonus?: number;
  properties?: string[];
  baseWeaponType?: string; // e.g. "longsword", "dagger" - for looking up base damage dice
  // Armor fields
  armorClass?: number;
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  // Effect for potions/scrolls/magic items
  effect?: string;
  rarity?: string;
  value?: string;
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
  notes?: string;   // Private DM notes for this map
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

// Monster attack for initiative tracker
export interface MonsterAttack {
  name: string;
  type: 'melee' | 'ranged' | 'melee spell' | 'ranged spell';
  bonus: number;
  reach?: string;
  range?: string;
  damage: string;
  damageType: string;
  notes?: string;
}

// Monster spell for initiative tracker
export interface MonsterSpell {
  name: string;
  level: number;
  damage?: string;
  effect?: string;
  save?: string;
  attack?: string;
  range?: string;
  slots?: number;
  concentration?: boolean;
}

// Monster trait for initiative tracker
export interface MonsterTrait {
  name: string;
  description: string;
}

// Full monster stats for initiative tracker
export interface MonsterStats {
  cr?: string;
  ac?: number;
  acType?: string;
  speed?: string;
  size?: string;
  type?: string;
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  attacks?: MonsterAttack[];
  spells?: MonsterSpell[];
  traits?: MonsterTrait[];
  resistances?: string[];
  immunities?: string[];
  savingThrows?: string[];
  skills?: string[];
  senses?: string;
  languages?: string;
  legendaryActions?: { name: string; cost: number; description: string }[];
  legendaryActionCount?: number;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNpc: boolean;  // true = NPC/monster (DM controlled)
  isActive: boolean;  // Currently has their turn
  tokenId?: string;  // Link to token on map
  playerId?: string;  // Link to player (if not NPC)
  // Combat stats
  maxHp?: number;
  currentHp?: number;
  conditions?: Condition[];
  // Monster stats (from campaign generator)
  monsterStats?: MonsterStats;
  // Turn manipulation
  isHolding?: boolean;  // Currently holding action
  originalInitiative?: number;  // Original init before hold/delay
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

// D&D 5e equipment slots for wondrous items
export type EquipmentSlot = 'head' | 'eyes' | 'neck' | 'shoulders' | 'chest' | 'arms' | 'hands' | 'ring' | 'waist' | 'feet';

// Equipment item
export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
  equipped?: boolean;
  category?: 'weapon' | 'armor' | 'shield' | 'gear' | 'potion' | 'food' | 'tool' | 'wondrous';
  armorClass?: number;  // Base AC for armor, or AC bonus for shields
  armorType?: 'light' | 'medium' | 'heavy' | 'shield';
  maxDexBonus?: number;  // Max Dex bonus for medium armor (usually 2)
  strengthRequired?: number;  // Minimum strength for heavy armor
  stealthDisadvantage?: boolean;  // Does this armor impose stealth disadvantage?
  // Wondrous item fields
  equipmentSlot?: EquipmentSlot;  // Where to equip (cloak=shoulders, ring=ring, etc.)
  acBonus?: number;  // +AC bonus (e.g., Cloak of Protection gives +1)
  savingThrowBonus?: number;  // +saving throw bonus (e.g., Cloak of Protection gives +1)
  requiresAttunement?: boolean;  // Needs attunement to use
  effect?: string;  // Magic item effect description
  rarity?: string;  // common, uncommon, rare, very rare, legendary
}

// Weapon with attack info
export interface Weapon {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;  // e.g., "1d8+3 slashing"
  bonusDamage?: string;  // e.g., "1d6 necrotic" for magic weapons with extra damage
  effect?: string;  // Magic item effect description (e.g., "deals extra 1d6 necrotic in dim light")
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

// Feature use tracking (for rage, channel divinity, etc.)
export interface FeatureUse {
  used: number;
  max: number;
  restoreOn: 'short' | 'long' | 'dawn';
}

// Spellcaster types
export type SpellcasterType = 'full' | 'half' | 'pact' | 'none';
export type SpellPreparationType = 'known' | 'prepared' | 'spellbook';

// Record of what happened at each level-up
export interface LevelUpRecord {
  level: number;
  timestamp: string;
  changes: {
    hpGained: number;
    hpMethod: 'average' | 'roll';
    featuresGained: string[];
    spellsLearned?: string[];
    cantripsLearned?: string[];
    asiChoice?: {
      method: '+2' | '+1/+1';
      abilities: (keyof AbilityScores)[];
    };
    featTaken?: string;
    subclassChosen?: string;
    otherChoices?: Record<string, string | string[]>;
  };
}

// Complete character sheet
export interface Character {
  id: string;
  playerId: string;  // Socket ID of owner

  // Basic Info
  name: string;
  species: Species;
  subspecies?: string;  // e.g., "High Elf", "Hill Dwarf"
  speciesChoice?: string;  // e.g., "gold" for Gold Dragon ancestry, "frost" for Frost Giant
  highElfCantrip?: string;  // Wizard cantrip chosen by High Elves
  characterClass: CharacterClass;
  subclass?: string;
  subclassChoices?: Record<string, string[]>;  // Map of choice ID to selected option IDs (e.g., { "maneuvers": ["riposte", "parry", "precision-attack"] })
  level: number;
  background: string;
  alignment?: string;
  experiencePoints: number;

  // Class Feature Choices
  fightingStyle?: string;  // Selected fighting style ID (fighter, paladin, ranger)
  divineOrder?: string;    // Divine Order choice (cleric): 'protector' or 'thaumaturge'
  primalOrder?: string;    // Primal Order choice (druid): 'magician' or 'warden'
  eldritchInvocations?: string[];  // Selected invocation IDs (warlock)
  expertiseSkills?: SkillName[];  // Skills with expertise (rogue, bard, ranger)
  weaponMasteries?: string[];  // Weapons with mastery selected (fighter, barbarian, monk, paladin, ranger)

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

  // Session State (combat tracking)
  conditions?: Condition[];
  inspiration?: boolean;
  exhaustionLevel?: number;  // 0-6, 2024 rules: -2 to d20 rolls per level
  concentratingOn?: string | null;

  // Resource Tracking
  spellSlotsUsed?: number[];  // Index = spell level - 1
  featureUses?: Record<string, FeatureUse>;

  // Equipment
  weapons: Weapon[];
  equipment: EquipmentItem[];
  currency: Currency;

  // Features & Traits
  features: Feature[];

  // Simple spell lists (for character creator)
  cantrips?: string[];
  spells?: string[];

  // Spellcasting - Enhanced for level-up tracking
  cantripsKnown?: string[];       // All cantrips the character knows
  spellsKnown?: string[];         // For "known" casters (Bard, Sorcerer, Ranger, Warlock)
  spellsPrepared?: string[];      // For "prepared" casters (Cleric, Druid, Paladin)
  spellbook?: string[];           // Wizard's spellbook (all spells they've learned)
  maxPreparedSpells?: number;     // Calculated: ability mod + level (for prepared casters)

  // Level-up history
  levelHistory?: LevelUpRecord[]; // Track all level-up choices made

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
  portrait?: string;  // URL or base64 data URI for character portrait

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Character creation state (partial character during creation)
export interface CharacterCreationState {
  step: 'basics' | 'abilities' | 'proficiencies' | 'equipment' | 'personality' | 'review';
  character: Partial<Character>;
}

// ============ MONSTER/NPC STAT BLOCKS ============

// Monster size category
export type MonsterSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

// Monster type/category
export type MonsterType =
  | 'aberration'
  | 'beast'
  | 'celestial'
  | 'construct'
  | 'dragon'
  | 'elemental'
  | 'fey'
  | 'fiend'
  | 'giant'
  | 'humanoid'
  | 'monstrosity'
  | 'ooze'
  | 'plant'
  | 'undead';

// Monster attack/action
export interface MonsterAction {
  id: string;
  name: string;
  description: string;
  attackBonus?: number;  // For attack rolls
  damage?: string;       // e.g., "2d6+4 slashing"
  reach?: string;        // e.g., "5 ft." or "60 ft."
  isRanged?: boolean;
}

// Special ability or trait
export interface MonsterTrait {
  id: string;
  name: string;
  description: string;
}

// Legendary action (for legendary creatures)
export interface LegendaryAction {
  id: string;
  name: string;
  description: string;
  cost: number;  // How many legendary actions it costs
}

// Complete monster stat block
export interface Monster {
  id: string;
  name: string;

  // Basic Info
  size: MonsterSize;
  type: MonsterType;
  alignment: string;
  challengeRating: string;  // e.g., "1/4", "1", "5", "17"
  xp: number;

  // Combat Stats
  armorClass: number;
  armorType?: string;  // e.g., "natural armor", "plate"
  hitPoints: number;
  hitDice: string;     // e.g., "6d8+12"
  speed: string;       // e.g., "30 ft., fly 60 ft."

  // Ability Scores
  abilities: AbilityScores;

  // Saving Throws (only list proficient ones)
  savingThrows?: Partial<Record<keyof AbilityScores, number>>;

  // Skills (only list proficient ones)
  skills?: Record<string, number>;

  // Defenses
  damageVulnerabilities?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: Condition[];

  // Senses
  senses: string;  // e.g., "darkvision 60 ft., passive Perception 12"
  languages: string;  // e.g., "Common, Draconic"

  // Abilities & Actions
  traits: MonsterTrait[];
  actions: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: LegendaryAction[];
  legendaryActionCount?: number;  // How many per round
  lairActions?: string[];
  regionalEffects?: string[];

  // Spellcasting (optional)
  spellcasting?: {
    ability: keyof AbilityScores;
    spellSaveDC: number;
    spellAttackBonus: number;
    atWill?: string[];
    perDay?: Record<string, string[]>;  // e.g., {"3": ["fireball", "lightning bolt"]}
    spellSlots?: Record<number, string[]>;  // Spell level -> spells
  };

  // Metadata
  source?: string;  // e.g., "Monster Manual", "Custom"
  notes?: string;   // DM notes
}

// Preset monsters for quick access
export interface MonsterPreset {
  id: string;
  monster: Monster;
  category: 'common' | 'boss' | 'minion' | 'custom';
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

  // Monsters (DM only)
  monsters: Monster[];  // DM's monster library
  activeMonster: Monster | null;  // Currently viewed monster stat block

  // Store and Loot system
  storeItems: StoreItem[];  // Items for sale (visible to players)
  lootItems: LootItem[];  // DM's loot pool (DM only)
  playerInventories: PlayerInventoryItem[];  // Items distributed to players

  // UI state
  view: 'landing' | 'create' | 'join' | 'dm' | 'player';
  playerTab: 'map' | 'character';  // Player view tab
  error: string | null;
}
