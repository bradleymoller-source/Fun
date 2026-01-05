// D&D 5e 2024 VTT Type Definitions

export type CharacterClass =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk'
  | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'warlock' | 'wizard';

export type Species =
  | 'aasimar' | 'dragonborn' | 'dwarf' | 'elf' | 'gnome'
  | 'goliath' | 'halfling' | 'human' | 'orc' | 'tiefling';

export type SkillName =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand'
  | 'stealth' | 'survival';

export type ProficiencyLevel = 'none' | 'proficient' | 'expertise';

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled'
  | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
  | 'prone' | 'restrained' | 'stunned' | 'unconscious' | 'exhausted' | 'concentrating';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Feature {
  id: string;
  name: string;
  source: string;
  description: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  equipped?: boolean;
  description?: string;
}

export interface Spellcasting {
  ability: keyof AbilityScores;
  spellSaveDC: number;
  spellAttackBonus: number;
  spellSlots: number[];
  spellSlotsUsed?: number[];
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface FeatureUse {
  used: number;
  max: number;
  restoreOn: 'short' | 'long' | 'dawn';
}

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
    pactBoonChosen?: string;
    fightingStyleChosen?: string;
    divineOrderChosen?: string;
    primalOrderChosen?: string;
    primalKnowledgeSkillChosen?: SkillName;
    weaponMasteriesChosen?: string[];
    otherChoices?: {
      expertise?: SkillName[];
      metamagic?: string[];
      invocations?: string[];
    };
  };
}

export interface Character {
  id: string;
  name: string;
  playerId?: string;

  // Basic info
  species: Species;
  characterClass: CharacterClass;
  subclass?: string;
  subclassChoices?: Record<string, string[]>;
  background: string;
  alignment?: string;
  level: number;
  experiencePoints: number;

  // Portrait
  portrait?: string;

  // Ability scores
  abilityScores: AbilityScores;

  // Health
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  hitDiceTotal: number;
  hitDiceRemaining: number;

  // Combat
  armorClass: number;
  initiative: number;
  speed: number;

  // Proficiencies
  savingThrowProficiencies: (keyof AbilityScores)[];
  skillProficiencies: Record<SkillName, ProficiencyLevel>;
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  toolProficiencies?: string[];
  languages?: string[];

  // Features & Equipment
  features: Feature[];
  featureUses?: Record<string, FeatureUse>;
  equipment: EquipmentItem[];

  // Spellcasting
  spellcasting?: Spellcasting;
  spellSlotsUsed?: number[];
  spellsKnown?: string[];
  spells?: string[];
  cantripsKnown?: string[];

  // Class-specific
  fightingStyle?: string;
  divineOrder?: string;
  primalOrder?: string;
  pactBoon?: string;
  weaponMasteries?: string[];
  primalKnowledgeSkill?: SkillName;
  metamagicKnown?: string[];
  eldritchInvocations?: string[];

  // Conditions & Status
  conditions?: Condition[];
  exhaustionLevel?: number;
  inspiration?: boolean;
  deathSaves: DeathSaves;
  concentratingOn?: string;

  // Biography
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  levelHistory?: LevelUpRecord[];
}

// Chat & Dice
export interface DiceRoll {
  id: string;
  notation: string;
  result: number;
  breakdown: string;
  timestamp: string;
  characterName?: string;
  label?: string;
}

export interface ChatMessage {
  id: string;
  type: 'chat' | 'roll' | 'system';
  content: string;
  sender: string;
  timestamp: string;
  roll?: DiceRoll;
}

// Initiative
export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  characterId?: string;
}
