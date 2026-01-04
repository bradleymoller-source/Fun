# D&D VTT Leveling System Build Plan (Levels 1-12)

## Executive Summary

This document outlines the comprehensive plan to implement a full character leveling system from level 1 to 12 for the D&D 5e 2024 VTT application. The system will allow players to create level 1 characters and progressively level up through their character sheet.

---

## Current System Analysis

### What's Already Implemented

| Component | Status | Notes |
|-----------|--------|-------|
| Character Creation (L1) | ✅ Complete | All 12 classes, 10 species, backgrounds |
| Basic Level-Up Wizard | ✅ Partial | HP, ASI, basic features work |
| Class Features (L1-20) | ✅ Complete | All features defined in `CLASS_FEATURES` |
| Subclass Definitions | ✅ Partial | 48 subclasses defined, but only L3 features |
| Spell Slot Progression | ✅ Complete | Full/Half/Warlock progressions defined |
| Level 1 Spells | ✅ Complete | 10 spells per spellcasting class |
| Class Resources | ✅ Complete | Rage, Ki, Sorcery Points, etc. all defined |
| Species Resources | ✅ Complete | Breath Weapon, Stone's Endurance, etc. |
| Eldritch Invocations | ✅ Complete | All invocations with level requirements |
| Fighting Styles | ✅ Complete | All styles defined |
| Weapon Masteries | ✅ Complete | All masteries with class counts |

### What's Missing for Full Leveling

| Component | Priority | Complexity |
|-----------|----------|------------|
| Higher-level spells (2-6) | High | Medium |
| Subclass features (L6, L10, L14) | High | Medium |
| Spell learning on level-up | High | High |
| Subclass selection at L3 | High | Medium |
| Cantrip progression by level | Medium | Low |
| Spells known progression | Medium | Low |
| Feat selection at ASI levels | Medium | Medium |
| General Feats (non-origin) | Medium | Medium |
| Feature choices on level-up | Medium | Medium |
| Proficiency bonus application | Medium | Low |
| Character level history | Low | Medium |
| Multiclassing | Low | Very High |

---

## Phase 1: Data Layer Enhancements

### 1.1 Spell Data by Level (High Priority)

**Current State:** Only level 1 spells defined (`CLASS_SPELLS_LEVEL_1`)

**Required:** Spells for levels 2-6 (level 12 characters can cast up to 6th level)

```typescript
// Add to dndData.ts
export const CLASS_SPELLS_LEVEL_2: Partial<Record<CharacterClass, SpellInfo[]>> = {
  bard: [
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Invisibility', description: 'Target becomes invisible' },
    { name: 'Shatter', description: '3d8 thunder damage in area' },
    // ... 10 spells per class
  ],
  // ... all spellcasting classes
};

export const CLASS_SPELLS_LEVEL_3: Partial<Record<CharacterClass, SpellInfo[]>>;
export const CLASS_SPELLS_LEVEL_4: Partial<Record<CharacterClass, SpellInfo[]>>;
export const CLASS_SPELLS_LEVEL_5: Partial<Record<CharacterClass, SpellInfo[]>>;
export const CLASS_SPELLS_LEVEL_6: Partial<Record<CharacterClass, SpellInfo[]>>;
```

**Spells Needed Per Class:**

| Class | Spell Levels Needed | Est. Spells |
|-------|---------------------|-------------|
| Bard | 2-6 | 50 |
| Cleric | 2-6 | 50 |
| Druid | 2-6 | 50 |
| Paladin | 2-5 (half-caster) | 40 |
| Ranger | 2-5 (half-caster) | 40 |
| Sorcerer | 2-6 | 50 |
| Warlock | 2-5 (Pact Magic caps) | 40 |
| Wizard | 2-6 | 50 |
| **Total** | | **~370 spells** |

### 1.2 Cantrip Progression Data (Medium Priority)

**Current State:** Only level 1 cantrips known defined (`CANTRIPS_KNOWN`)

**Required:** Cantrips known at each level

```typescript
export const CANTRIPS_KNOWN_BY_LEVEL: Record<CharacterClass, Record<number, number>> = {
  bard: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  cleric: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5 },
  druid: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  sorcerer: { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6 },
  warlock: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  wizard: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5 },
  // Non-casters can be omitted or set to 0
};
```

### 1.3 Spells Known Progression Data (Medium Priority)

**Current State:** Only level 1 spells known defined (`SPELLS_AT_LEVEL_1`)

**Required:** Spells known at each level for "known" casters

```typescript
// For Bard, Sorcerer, Ranger, Warlock (known casters)
export const SPELLS_KNOWN_BY_LEVEL: Partial<Record<CharacterClass, Record<number, number>>> = {
  bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15 },
  ranger: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7 },
  sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12 },
  warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11 },
};
```

### 1.4 Subclass Features at Higher Levels (High Priority)

**Current State:** Only level 3 subclass features defined

**Required:** Features for each subclass at levels 6, 10, 14

```typescript
// Extend SubclassInfo to include higher level features
export interface SubclassFeature {
  level: number;
  name: string;
  description: string;
  choices?: SubclassChoice[];  // For features that require choices
}

export interface SubclassInfoExtended extends SubclassInfo {
  allFeatures: SubclassFeature[];  // Features at all levels
}

// Example for Battle Master
{
  name: 'Battle Master',
  description: '...',
  levelAvailable: 3,
  allFeatures: [
    { level: 3, name: 'Combat Superiority', description: 'Learn 3 maneuvers, gain 4d8 superiority dice' },
    { level: 3, name: 'Student of War', description: 'Proficiency with one artisan tool' },
    { level: 7, name: 'Know Your Enemy', description: 'Study creature to learn capabilities' },
    { level: 10, name: 'Improved Combat Superiority', description: 'Superiority dice become d10' },
    { level: 15, name: 'Relentless', description: 'Regain 1 superiority die when you roll initiative with none' },
    { level: 18, name: 'Improved Combat Superiority', description: 'Superiority dice become d12' },
  ],
  // ... existing choices
}
```

**Subclass Features Needed:**

| Class | Subclasses | Feature Levels | Est. Features |
|-------|------------|----------------|---------------|
| Barbarian | 4 | 3, 6, 10, 14 | 16 |
| Bard | 4 | 3, 6, 14 | 12 |
| Cleric | 4 | 3, 6, 8, 17 | 16 |
| Druid | 4 | 3, 6, 10, 14 | 16 |
| Fighter | 4 | 3, 7, 10, 15, 18 | 20 |
| Monk | 4 | 3, 6, 11, 17 | 16 |
| Paladin | 4 | 3, 7, 15, 20 | 16 |
| Ranger | 4 | 3, 7, 11, 15 | 16 |
| Rogue | 4 | 3, 9, 13, 17 | 16 |
| Sorcerer | 4 | 3, 6, 14, 18 | 16 |
| Warlock | 4 | 3, 6, 10, 14 | 16 |
| Wizard | 4 | 3, 6, 10, 14 | 16 |
| **Total** | 48 | | **~192 features** |

### 1.5 General Feats (Non-Origin) (Medium Priority)

**Current State:** Only Origin Feats defined (`ORIGIN_FEATS`)

**Required:** General Feats that can be taken at ASI levels

```typescript
export interface GeneralFeat {
  name: string;
  description: string;
  prerequisites?: {
    level?: number;
    abilityScore?: { ability: keyof AbilityScores; minimum: number };
    proficiency?: string;
    spellcasting?: boolean;
  };
  benefits: {
    abilityBonus?: { ability: keyof AbilityScores; bonus: number }[];
    features?: string[];
  };
}

export const GENERAL_FEATS: GeneralFeat[] = [
  {
    name: 'Actor',
    description: 'Skilled at mimicry and dramatics',
    benefits: {
      abilityBonus: [{ ability: 'charisma', bonus: 1 }],
      features: [
        'Advantage on Deception and Performance for disguises',
        'Mimic speech of person heard for 1+ minute',
      ],
    },
  },
  {
    name: 'Alert',
    description: 'Always on the lookout for danger',
    benefits: {
      features: [
        '+10 to initiative (Proficiency Bonus + DEX mod)',
        "Can't be surprised while conscious",
        'Hidden creatures gain no advantage on attacks against you',
      ],
    },
  },
  // ... Great Weapon Master, Sentinel, War Caster, Resilient, etc.
];
```

**General Feats to Add (2024 PHB):**

1. Actor
2. Alert (enhanced version)
3. Athlete
4. Charger
5. Crossbow Expert
6. Defensive Duelist
7. Dual Wielder
8. Durable
9. Elemental Adept
10. Fey Touched
11. Fighting Initiate
12. Grappler
13. Great Weapon Master
14. Heavily Armored
15. Heavy Armor Master
16. Inspiring Leader
17. Keen Mind
18. Lightly Armored
19. Mage Slayer
20. Medium Armor Master
21. Moderately Armored
22. Mounted Combatant
23. Observant
24. Piercer
25. Polearm Master
26. Resilient
27. Ritual Caster
28. Savage Attacker (enhanced)
29. Sentinel
30. Shadow Touched
31. Sharpshooter
32. Shield Master
33. Skill Expert
34. Skulker
35. Slasher
36. Speedy
37. Spell Sniper
38. Telekinetic
39. Telepathic
40. War Caster
41. Weapon Master

---

## Phase 2: Type System Updates

### 2.1 Character Type Enhancements

```typescript
// Extend Character interface in types/index.ts
export interface Character {
  // ... existing fields ...

  // Level Progression Tracking
  levelHistory?: LevelUpRecord[];  // Track choices made at each level

  // Spellcasting Enhancements
  cantripsKnown?: string[];        // All cantrips character knows
  spellsKnown?: string[];          // For known casters (Bard, Sorcerer, etc.)
  spellsPrepared?: string[];       // For prepared casters (Cleric, Druid, etc.)
  spellbook?: string[];            // Wizard's spellbook (all spells in book)
  maxPreparedSpells?: number;      // Calculated: ability mod + level

  // Subclass Tracking
  subclass?: string;               // Already exists
  subclassFeatures?: string[];     // Features granted by subclass
  subclassChoices?: Record<string, string[]>;  // Already exists

  // Level-based Choices
  metamagicOptions?: string[];     // Sorcerer metamagic (2 at L2, more later)
  pactBoon?: string;               // Warlock pact boon (L3)

  // Derived Stats (recalculated on level-up)
  proficiencyBonus?: number;       // Calculated from level
  passivePerception?: number;      // 10 + perception modifier
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
    otherChoices?: Record<string, string | string[]>;
  };
}
```

### 2.2 Spellcasting Type Refinements

```typescript
export type SpellcasterType = 'full' | 'half' | 'pact' | 'none';
export type SpellPreparationType = 'known' | 'prepared' | 'spellbook';

export interface SpellcastingInfo {
  type: SpellcasterType;
  preparationType: SpellPreparationType;
  ability: keyof AbilityScores;
  canLearnRituals: boolean;
  hasSpellbook: boolean;  // Wizard only
}

export const CLASS_SPELLCASTING: Record<CharacterClass, SpellcastingInfo | null> = {
  barbarian: null,
  fighter: null,  // Eldritch Knight subclass adds it
  monk: null,     // Some subclasses add it
  rogue: null,    // Arcane Trickster subclass adds it
  bard: { type: 'full', preparationType: 'known', ability: 'charisma', canLearnRituals: true, hasSpellbook: false },
  cleric: { type: 'full', preparationType: 'prepared', ability: 'wisdom', canLearnRituals: true, hasSpellbook: false },
  druid: { type: 'full', preparationType: 'prepared', ability: 'wisdom', canLearnRituals: true, hasSpellbook: false },
  paladin: { type: 'half', preparationType: 'prepared', ability: 'charisma', canLearnRituals: false, hasSpellbook: false },
  ranger: { type: 'half', preparationType: 'known', ability: 'wisdom', canLearnRituals: false, hasSpellbook: false },
  sorcerer: { type: 'full', preparationType: 'known', ability: 'charisma', canLearnRituals: false, hasSpellbook: false },
  warlock: { type: 'pact', preparationType: 'known', ability: 'charisma', canLearnRituals: false, hasSpellbook: false },
  wizard: { type: 'full', preparationType: 'spellbook', ability: 'intelligence', canLearnRituals: true, hasSpellbook: true },
};
```

---

## Phase 3: Level-Up Wizard Enhancements

### 3.1 New Level-Up Steps

**Current Steps:** `overview → hp → asi → features → spells → review`

**New Steps:**
```typescript
type LevelUpStep =
  | 'overview'        // What's coming at this level
  | 'hp'              // HP increase (average or roll)
  | 'subclass'        // Choose subclass (level 3 only)
  | 'subclassFeature' // Apply subclass features (L6, L10, L14)
  | 'asi'             // ASI or Feat selection
  | 'features'        // Class features with choices
  | 'cantrips'        // New cantrips (if eligible)
  | 'spells'          // New spells (learn/prepare)
  | 'invocations'     // Warlock invocations
  | 'expertise'       // Expertise selection (Bard L9, Rogue L6, Ranger L9)
  | 'metamagic'       // Sorcerer metamagic options
  | 'review';         // Confirm all changes
```

### 3.2 Conditional Step Logic

```typescript
function getStepsForLevel(character: Character, newLevel: number): LevelUpStep[] {
  const steps: LevelUpStep[] = ['overview', 'hp'];
  const charClass = character.characterClass;

  // Subclass selection at level 3
  if (newLevel === 3 && !character.subclass) {
    steps.push('subclass');
  }

  // Subclass features at specific levels
  if (hasSubclassFeatureAtLevel(charClass, character.subclass, newLevel)) {
    steps.push('subclassFeature');
  }

  // ASI levels (varies by class)
  if (isASILevel(charClass, newLevel)) {
    steps.push('asi');
  }

  // Class features with choices
  const featuresWithChoices = getFeaturesWithChoicesAtLevel(charClass, newLevel);
  if (featuresWithChoices.length > 0) {
    steps.push('features');
  }

  // Cantrip progression
  if (gainsCantripsAtLevel(charClass, newLevel)) {
    steps.push('cantrips');
  }

  // Spell learning/preparation
  if (isSpellcaster(charClass) && gainsSpellsAtLevel(charClass, newLevel)) {
    steps.push('spells');
  }

  // Warlock invocations
  if (charClass === 'warlock' && gainsInvocationsAtLevel(newLevel)) {
    steps.push('invocations');
  }

  // Expertise (Bard L9, Rogue L6, Ranger L9)
  if (gainsExpertiseAtLevel(charClass, newLevel)) {
    steps.push('expertise');
  }

  // Sorcerer metamagic
  if (charClass === 'sorcerer' && gainsMetamagicAtLevel(newLevel)) {
    steps.push('metamagic');
  }

  steps.push('review');
  return steps;
}
```

### 3.3 Subclass Selection Component

```typescript
// New component: SubclassSelection.tsx
interface SubclassSelectionProps {
  character: Character;
  onSelect: (subclassId: string, choices?: Record<string, string[]>) => void;
}

function SubclassSelection({ character, onSelect }: SubclassSelectionProps) {
  const subclasses = CLASS_SUBCLASSES[character.characterClass];
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [subclassChoices, setSubclassChoices] = useState<Record<string, string[]>>({});

  // Render subclass cards with features preview
  // Handle subclass-specific choices (maneuvers, animal spirit, land type, etc.)
}
```

### 3.4 Spell Learning Component

```typescript
// New component: SpellLearning.tsx
interface SpellLearningProps {
  character: Character;
  newLevel: number;
  spellsToLearn: number;
  availableSpells: SpellInfo[];
  currentSpells: string[];
  onSelect: (spells: string[]) => void;
}

function SpellLearning({
  character,
  newLevel,
  spellsToLearn,
  availableSpells,
  currentSpells,
  onSelect,
}: SpellLearningProps) {
  // Group spells by level
  // Show spell details on hover/click
  // Track current vs new selections
  // For prepared casters: show all available spells to prepare
  // For known casters: show only spells that can be learned at this level
  // For Wizard: show spells that can be added to spellbook
}
```

### 3.5 ASI/Feat Selection Component

```typescript
// Enhanced ASI step with feat option
function AsiOrFeatSelection({ character, onComplete }: Props) {
  const [choice, setChoice] = useState<'asi' | 'feat'>('asi');

  if (choice === 'asi') {
    // Existing ASI UI
    return <AsiSelection ... />;
  } else {
    // New feat selection UI
    return <FeatSelection
      availableFeats={getEligibleFeats(character)}
      onSelect={(feat) => onComplete({ type: 'feat', feat })}
    />;
  }
}
```

---

## Phase 4: Key Level Milestones

### 4.1 Level Milestone Summary (1-12)

| Level | All Classes | Spellcaster | Fighter/Rogue | Class-Specific |
|-------|-------------|-------------|---------------|----------------|
| 1 | Starting features | Cantrips + L1 spells | - | Divine Order, Primal Order, Fighting Style |
| 2 | +HP | L1 slots increase | Action Surge, Cunning Action | Ki, Sorcery Points, Wild Shape |
| 3 | **Subclass** | L2 spells | Subclass | Pact Boon, Deflect Attacks |
| 4 | **ASI** | Cantrip (some) | ASI | Extra cantrip (some) |
| 5 | +Proficiency | L3 spells | Extra Attack | Font of Inspiration, Stunning Strike |
| 6 | Subclass feature | - | Extra ASI (Fighter) | Expertise (Rogue), Roving |
| 7 | - | L4 spells | Subclass (Fighter) | Evasion, Countercharm |
| 8 | **ASI** | - | ASI | - |
| 9 | - | L5 spells | Indomitable | Expertise (Bard/Ranger) |
| 10 | Subclass feature | Cantrip (some) | Extra ASI (Rogue) | Divine Intervention, Magical Secrets |
| 11 | - | L6 spells | Extra Attack (2) | Relentless Rage, Reliable Talent |
| 12 | **ASI** | - | ASI | - |

### 4.2 Features Requiring Choices at Level-Up

| Class | Level | Choice Required |
|-------|-------|-----------------|
| Barbarian | 3 | Primal Knowledge (1 skill) |
| Bard | 2 | Expertise (2 skills) |
| Bard | 9 | Expertise (2 more skills) |
| Bard | 10 | Magical Secrets (2 spells from any class) |
| Cleric | 7 | Blessed Strikes option (Divine Strike or Potent Spellcasting) |
| Druid | 3 | Circle spells (if Circle of the Land - choose land type) |
| Fighter | 3 | Subclass features (Maneuvers for Battle Master) |
| Fighter | 7 | Subclass feature (some have choices) |
| Fighter | 9 | Master of Armaments (swap 1 weapon mastery) |
| Monk | 2 | Focus techniques available |
| Rogue | 6 | Expertise (2 more skills) |
| Ranger | 9 | Expertise (2 skills) |
| Sorcerer | 2 | Metamagic (2 options) |
| Sorcerer | 10 | Metamagic (1 more option) |
| Warlock | 2-12 | Invocations (scaling count) |
| Warlock | 3 | Pact Boon |

---

## Phase 5: Derived Stats Recalculation

### 5.1 Stats to Recalculate on Level-Up

```typescript
function recalculateDerivedStats(character: Character): Character {
  const level = character.level;
  const abilityMods = getAbilityModifiers(character.abilityScores);

  return {
    ...character,
    // Proficiency bonus
    proficiencyBonus: getProficiencyBonus(level),

    // Spell DC and Attack (if spellcaster)
    ...(isSpellcaster(character.characterClass) && {
      spellcasting: {
        ...character.spellcasting,
        spellSaveDC: 8 + getProficiencyBonus(level) + getSpellcastingMod(character),
        spellAttackBonus: getProficiencyBonus(level) + getSpellcastingMod(character),
      },
    }),

    // Initiative
    initiative: abilityMods.dexterity,

    // Passive Perception
    passivePerception: 10 + abilityMods.wisdom +
      (character.skillProficiencies.perception !== 'none' ? getProficiencyBonus(level) : 0) +
      (character.skillProficiencies.perception === 'expertise' ? getProficiencyBonus(level) : 0),

    // Speed (check for monk/barbarian bonuses)
    speed: calculateSpeed(character),

    // Update feature uses max values
    featureUses: updateFeatureUsesMax(character),
  };
}
```

### 5.2 Resource Maximum Updates

```typescript
function updateFeatureUsesMax(character: Character): Record<string, FeatureUse> {
  const featureUses = { ...character.featureUses };
  const resources = getCharacterResources(
    character.characterClass,
    character.species,
    character.level,
    character.abilityScores,
    character.features.map(f => f.name)
  );

  for (const [id, resource] of Object.entries(resources)) {
    if (featureUses[id]) {
      featureUses[id] = {
        ...featureUses[id],
        max: resource.max,
      };
    } else {
      featureUses[id] = {
        used: 0,
        max: resource.max,
        restoreOn: resource.restoreOn,
      };
    }
  }

  return featureUses;
}
```

---

## Phase 6: UI/UX Considerations

### 6.1 Character Sheet "Level Up" Button

```typescript
// In CharacterSheet.tsx
function CharacterSheet({ character }: Props) {
  const [showLevelUpWizard, setShowLevelUpWizard] = useState(false);

  // Show level up button if XP threshold met or DM grants level
  const canLevelUp = character.level < 20 && (
    character.experiencePoints >= XP_THRESHOLDS[character.level + 1] ||
    isDMLevelGrant // Session state
  );

  return (
    <div>
      {/* ... existing character sheet ... */}

      {canLevelUp && (
        <Button
          onClick={() => setShowLevelUpWizard(true)}
          variant="primary"
          className="level-up-button pulse"
        >
          Level Up to {character.level + 1}!
        </Button>
      )}

      {showLevelUpWizard && (
        <LevelUpWizard
          character={character}
          onComplete={handleLevelUpComplete}
          onCancel={() => setShowLevelUpWizard(false)}
        />
      )}
    </div>
  );
}
```

### 6.2 XP Thresholds

```typescript
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  // ... up to 20
};
```

### 6.3 Level-Up Wizard Modal Design

- **Full-screen overlay** for focus
- **Progress bar** showing current step and total steps
- **Previous/Next navigation** with step validation
- **Summary sidebar** showing accumulated choices
- **Cancel confirmation** to prevent accidental loss
- **Celebration animation** on completion

---

## Phase 7: Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. Add `CANTRIPS_KNOWN_BY_LEVEL` data
2. Add `SPELLS_KNOWN_BY_LEVEL` data
3. Add level 2 spells for all classes
4. Update `Character` type with new fields
5. Add helper functions for spell progression

### Sprint 2: Core Level-Up (Week 3-4)
1. Refactor `LevelUpWizard` with new step system
2. Implement conditional step logic
3. Add HP step (already done, minor tweaks)
4. Add basic features step (already done, add choice handling)
5. Add cantrip learning step

### Sprint 3: Spellcasting (Week 5-6)
1. Add level 3-4 spells for all classes
2. Implement spell learning step for known casters
3. Implement spell preparation for prepared casters
4. Add wizard spellbook management
5. Update spell slot tracking

### Sprint 4: Subclasses (Week 7-8)
1. Add subclass features for levels 6, 10, 14
2. Implement subclass selection step (level 3)
3. Implement subclass feature application
4. Handle subclass-specific choices
5. Add domain spells for clerics

### Sprint 5: Advanced Features (Week 9-10)
1. Add level 5-6 spells for all classes
2. Implement ASI/Feat selection
3. Add `GENERAL_FEATS` data
4. Implement expertise selection step
5. Implement metamagic selection (Sorcerer)
6. Implement invocation management (Warlock)

### Sprint 6: Polish & Testing (Week 11-12)
1. Add level history tracking
2. Derived stats recalculation
3. Resource maximum updates
4. Comprehensive testing for all 12 classes
5. Edge case handling
6. Performance optimization

---

## Phase 8: Testing Matrix

### 8.1 Class-Specific Test Cases

| Class | Key Test Cases |
|-------|----------------|
| Barbarian | Rage uses scaling, subclass at L3, Primal Knowledge choice |
| Bard | Cantrip progression, spell learning, Expertise at L2 and L9, Magical Secrets at L10 |
| Cleric | Spell preparation, Channel Divinity scaling, Divine Order, domain spells |
| Druid | Wild Shape scaling, Primal Order, Circle spells |
| Fighter | Extra ASIs at L6, Action Surge, subclass at L3 and L7 |
| Monk | Ki points scaling, Focus techniques, Martial Arts die scaling |
| Paladin | Lay on Hands pool, spell slots (half-caster), Divine Smite |
| Ranger | Spell learning (half-caster), Expertise at L9, Favored Foe |
| Rogue | Sneak Attack scaling, Expertise at L1 and L6, Extra ASI at L10 |
| Sorcerer | Sorcery points, Metamagic at L2 and L10, cantrip progression |
| Warlock | Pact Magic slots, invocations scaling, Pact Boon at L3 |
| Wizard | Spellbook management, Arcane Recovery, spell preparation |

### 8.2 Level Milestone Tests

- Level 1→2: Basic HP gain, new features
- Level 2→3: Subclass selection, spell level access
- Level 3→4: First ASI, cantrip gain (some classes)
- Level 4→5: Proficiency bonus increase, Extra Attack, 3rd-level spells
- Level 8→9: Expertise gains, 5th-level spells
- Level 11→12: Third ASI, 6th-level spells (full casters)

---

## Open Questions for Discussion

### Critical Decisions Needed

1. **Spell Data Source**:
   - Option A: Manually curate ~370 spells with full descriptions
   - Option B: Use abbreviated spell data (name + 1-line description)
   - Option C: External API integration (D&D Beyond, Open5e)
   - **Recommendation**: Option B for MVP, enhance later

2. **Subclass Feature Depth**:
   - How detailed should subclass feature descriptions be?
   - Should we track all mechanical effects or just display text?
   - **Recommendation**: Start with text display, add mechanics incrementally

3. **Multiclassing**:
   - Should we support multiclassing in this phase?
   - **Recommendation**: Exclude from v1, add in future phase

4. **Spell Preparation UI**:
   - Daily preparation interface for prepared casters?
   - **Recommendation**: Yes, on character sheet outside level-up

5. **Retroactive Changes**:
   - How to handle ASI that changes spellcasting modifier?
   - How to handle retroactive HP from CON increase?
   - **Recommendation**: Current system handles HP; add spell DC/attack recalc

---

## Appendix: Data Volume Estimates

| Data Type | Items | Est. Lines of Code |
|-----------|-------|-------------------|
| Level 2-6 Spells | ~370 | 3,700 |
| Subclass Features (L6-14) | ~192 | 1,920 |
| Cantrip Progression Tables | 6 classes × 20 levels | 120 |
| Spell Known Tables | 4 classes × 20 levels | 80 |
| General Feats | ~40 | 800 |
| Helper Functions | ~20 | 400 |
| Level-Up Components | ~8 | 2,000 |
| **Total Estimated** | | **~9,000 lines** |

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Clarify open questions** before implementation
3. **Prioritize** based on immediate needs (maybe only levels 1-5 first?)
4. **Create detailed tickets** for each sprint
5. **Begin Sprint 1** - Foundation data layer

---

*Document Version: 1.0*
*Created: January 2026*
*Last Updated: January 2026*
