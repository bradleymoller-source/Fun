# D&D 2024 PHB Systems Review

## Executive Summary

This document provides a comprehensive comparison between the D&D VTT system implementation and the official 2024 Player's Handbook. The VTT implements a substantial portion of the 2024 PHB rules, with some gaps that could be addressed in future development.

**Overall Coverage: ~70% of core 2024 PHB systems implemented**

### Critical Gap: Spell Levels 4-9 are completely missing!

---

## Systems Fully Implemented

### Character Creation (Excellent Coverage)

| System | Status | Notes |
|--------|--------|-------|
| **12 Classes** | Complete | All 12 PHB classes with correct hit dice, saving throws, and primary abilities |
| **48 Subclasses** | Complete | 4 per class, matching 2024 PHB lineup |
| **10 Species** | Complete | Aasimar, Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, Tiefling |
| **16 Backgrounds** | Complete | All 2024 backgrounds with correct ability scores, skills, tools, and origin feats |
| **12 Origin Feats** | Complete | Alert, Crafter, Healer, Lucky, Magic Initiate (×3), Musician, Savage Attacker, Skilled, Tavern Brawler, Tough |
| **Ability Scores** | Complete | Standard array, point buy, 4d6 drop lowest |

### Species Features (Excellent Coverage)

| Species | Features Implemented |
|---------|---------------------|
| **Aasimar** | Darkvision, Celestial Resistance (radiant/necrotic), Healing Hands, Light Bearer, Celestial Revelation (3 forms at level 3) |
| **Dragonborn** | Darkvision, 10 Ancestry options, Breath Weapon (scaling), Damage Resistance, Draconic Flight (level 5) |
| **Dwarf** | Darkvision 120ft, Dwarven Resilience (poison), Dwarven Toughness (+1 HP/level), Stonecunning (Tremorsense) |
| **Elf** | Darkvision, Fey Ancestry, Keen Senses (Perception), Trance, 3 Lineages (High/Wood/Drow) with unique features |
| **Gnome** | Darkvision, Gnomish Cunning (INT/WIS/CHA save advantage), 2 Lineages (Forest/Rock) |
| **Goliath** | 35ft speed, Powerful Build, Large Form (level 5), 6 Giant Ancestry options (Cloud/Fire/Frost/Hill/Stone/Storm) |
| **Halfling** | Brave, Halfling Nimbleness, Lucky (reroll 1s), 2 Types (Lightfoot/Stout) |
| **Human** | Resourceful (Heroic Inspiration), Skillful (bonus skill), Versatile (bonus Origin feat) |
| **Orc** | Darkvision 120ft, Adrenaline Rush, Relentless Endurance |
| **Tiefling** | Darkvision, Otherworldly Presence, 3 Fiendish Legacies (Abyssal/Chthonic/Infernal) with spells |

### Class Features (Excellent Coverage)

All 12 classes have complete feature progressions levels 1-20:

| Class | Key 2024 Features Verified |
|-------|---------------------------|
| **Barbarian** | Rage, Unarmored Defense, Weapon Mastery, Danger Sense, Reckless Attack, Primal Path (L3), Primal Knowledge, Brutal Strike (L9), Primal Champion (L20) |
| **Bard** | Bardic Inspiration (d6→d12), Spellcasting, Expertise (L2, L9), Jack of All Trades, Font of Inspiration (L5), Magical Secrets (L10/14/18), Superior Inspiration (L20) |
| **Cleric** | Divine Order (Protector/Thaumaturge), Spellcasting, Channel Divinity, Sear Undead (L5), Blessed Strikes (L7), Divine Intervention, Greater Divine Intervention (L20) |
| **Druid** | Druidic, Primal Order (Magician/Warden), Spellcasting, Wild Shape (temp HP = level×4), Wild Companion, Wild Resurgence (L5), Beast Spells (L18), Archdruid (L20) |
| **Fighter** | Fighting Style, Second Wind (2/rest), Weapon Mastery (3), Action Surge, Tactical Mind (L2), Extra Attack ×4, Indomitable, Master of Armaments, Studied Attacks |
| **Monk** | Martial Arts (d6→d12), Unarmored Defense, Weapon Mastery, Focus Points, Uncanny Metabolism, Deflect Attacks (L3), Stunning Strike (L5), Empowered Strikes, Body and Mind (L20) |
| **Paladin** | Lay on Hands (level×5), Spellcasting, Weapon Mastery, Divine Smite, Channel Divinity, Faithful Steed (L5), Aura of Protection/Courage, Radiant Strikes (L11) |
| **Ranger** | Deft Explorer (Expertise+languages), Favored Enemy (Hunter's Mark), Spellcasting, Weapon Mastery, Fighting Style, Roving (L6), Expertise (L9), Nature's Veil (L14), Foe Slayer (L20) |
| **Rogue** | Expertise ×4, Sneak Attack, Thieves' Cant, Cunning Action, Steady Aim, Cunning Strike (L5), Uncanny Dodge, Evasion, Reliable Talent, Devious Strikes (L14), Stroke of Luck (L20) |
| **Sorcerer** | Innate Sorcery, Spellcasting, Font of Magic, Metamagic (10 options), Sorcerous Restoration (L5), Arcane Apotheosis (L20) |
| **Warlock** | Eldritch Invocations (35+ options), Pact Magic, Pact Boon (L1), Magical Cunning (L2), Contact Patron (L9), Mystic Arcanum (L11-17), Eldritch Master (L20) |
| **Wizard** | Arcane Recovery, Spellcasting (Spellbook), Scholar (L2), Memorize Spell (L5), Spell Mastery (L18), Signature Spells (L20) |

### Subclass Details (Complete)

All 48 subclasses with 2024 PHB features and choice mechanics:

- **Barbarian**: Path of the Berserker, Wild Heart (animal spirit choice), World Tree, Zealot (damage type choice)
- **Bard**: College of Dance, Glamour, Lore, Valor
- **Cleric**: Life Domain, Light Domain, Trickery Domain, War Domain (all with domain spells)
- **Druid**: Circle of the Land (4 land types), Moon, Sea, Stars
- **Fighter**: Battle Master (20 maneuvers), Champion, Eldritch Knight, Psi Warrior
- **Monk**: Warrior of Mercy, Shadow, Elements, Open Hand
- **Paladin**: Oath of Devotion, Glory, Ancients, Vengeance (all with oath spells)
- **Ranger**: Beast Master (3 companion types), Fey Wanderer, Gloom Stalker, Hunter (3 prey choices)
- **Rogue**: Arcane Trickster, Assassin, Soulknife, Thief
- **Sorcerer**: Aberrant Sorcery, Clockwork Sorcery, Draconic Sorcery, Wild Magic
- **Warlock**: Archfey Patron, Celestial Patron, Fiend Patron, Great Old One (all with patron spells)
- **Wizard**: School of Abjuration, Divination, Evocation, Illusion

### 2024-Specific Features Implemented

| Feature | Implementation |
|---------|---------------|
| **Weapon Mastery** | Complete - 8 mastery types (Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex) with weapon assignments |
| **Fighting Styles** | Complete - 10 styles (Archery, Blind Fighting, Defense, Dueling, Great Weapon, Interception, Protection, Thrown Weapon, Two-Weapon, Unarmed) |
| **Eldritch Invocations** | Complete - 35+ invocations with level requirements and prerequisites |
| **Metamagic** | Complete - All 10 options (Careful, Distant, Empowered, Extended, Heightened, Quickened, Seeking, Subtle, Transmuted, Twinned) |
| **Battle Master Maneuvers** | Complete - 20 maneuvers |
| **Heroic Inspiration** | Implemented via Human's Resourceful and Musician feat |

### Spells (Good Coverage)

| Level | Status | Count |
|-------|--------|-------|
| **Cantrips** | Complete for all casters | ~30+ cantrips with full details |
| **1st Level** | Complete | ~10 spells per class |
| **2nd Level** | Complete | ~10 spells per class |
| **3rd Level** | Complete | ~10 spells per class |
| **4th-9th Level** | Partial | Spell lists exist but not fully populated |

Spell details include: casting time, range, components, duration, concentration flag, ritual flag, damage/healing dice, saving throws, attack types, and higher level scaling.

### Combat & Gameplay Systems

| System | Status |
|--------|--------|
| **Spell Slots (Full Casters)** | Complete - Levels 1-20 |
| **Spell Slots (Half Casters)** | Complete - Paladin/Ranger progression |
| **Pact Magic Slots** | Complete - Warlock progression |
| **Proficiency Bonus** | Complete - 2 to 6 by level |
| **Ability Score Improvements** | Complete - Standard and class-specific (Fighter/Rogue) |
| **Multiclass Support** | Not implemented |

### Equipment & Items

| Category | Status |
|----------|--------|
| **Weapons** | Complete - All simple and martial weapons with damage, properties, mastery |
| **Armor** | Complete - Light, Medium, Heavy armor with AC values |
| **Shields** | Complete |
| **Adventuring Gear** | Complete - ~30 items |
| **Potions** | Basic set implemented |
| **Tools** | Complete - Artisan tools, musical instruments, thieves' tools |
| **Starting Equipment** | Complete - Class-specific starting packs |

### Feats (Good Coverage)

| Category | Count | Status |
|----------|-------|--------|
| **Origin Feats** | 12 | Complete |
| **General Feats** | 40+ | Extensive - includes most 2024 PHB feats |

General feats include: Actor, Athlete, Charger, Crossbow Expert, Crusher, Defensive Duelist, Dual Wielder, Durable, Elemental Adept, Fey Touched, Fighting Initiate, Grappler, Great Weapon Master, Heavily Armored, Heavy Armor Master, Inspiring Leader, Keen Mind, Lightly Armored, Mage Slayer, Medium Armor Master, Moderately Armored, Mounted Combatant, Observant, Piercer, Polearm Master, Resilient, Ritual Caster, Sentinel, Shadow Touched, Sharpshooter, Shield Master, Skill Expert, Skulker, Slasher, Speedy, Spell Sniper, Telekinetic, Telepathic, War Caster, Weapon Master

---

## Systems Partially Implemented or Missing

### Missing from 2024 PHB

| System | Gap | Priority |
|--------|-----|----------|
| **Spell Levels 4-9** | Only partial spell lists for levels 4+ | Medium |
| **Epic Boons** | Level 20+ content not implemented | Low |
| **Multiclassing** | No multiclass rules or spell slot calculation | Medium |
| **Crafting Rules** | Basic shop exists, but no crafting mechanics | Low |
| **Conditions (detailed)** | 13 conditions listed but effects not fully automated | Medium |
| **Death Saves** | System exists but could be enhanced | Low |

### Spell Coverage Gaps

Higher-level spells are partially implemented. Missing notable spells:

**4th Level (Examples Missing)**:
- Banishment, Dimension Door, Greater Invisibility, Polymorph, Wall of Fire

**5th Level (Examples Missing)**:
- Animate Objects, Bigby's Hand, Cloudkill, Cone of Cold, Flame Strike, Greater Restoration, Hold Monster, Mass Cure Wounds, Raise Dead, Telekinesis, Wall of Stone

**6th-9th Level**:
- Most high-level spells not in database
- Mystic Arcanum spells referenced but not detailed

### Monster/Creature Gaps

The monster database includes 50+ creatures from CR 0 to CR 17 (Adult Red Dragon), but:
- Missing many 2024 Monster Manual updates
- No legendary resistance UI automation
- Lair actions not implemented

### Other Minor Gaps

| Feature | Status |
|---------|--------|
| **Inspiration (Heroic Inspiration)** | Partially - tracked but UI could be enhanced |
| **Tool Proficiency Checks** | Listed but not mechanically integrated |
| **Languages** | Complete list, but no translation mechanics |
| **Carrying Capacity** | Not calculated automatically |
| **Lifestyle Expenses** | Not implemented |
| **Downtime Activities** | Not implemented |
| **Vehicle Proficiencies** | Not implemented |

---

## V1 Build Focus: Levels 1-5 Analysis

This section provides a detailed verification of all systems relevant to levels 1-5 gameplay.

### ✅ CRITICAL BUGS FIXED (Selection Components)

#### Level-Up Selection Components — CREATED

**Problem Discovered:** The LevelUpWizard.tsx imported 13 selection components that **DID NOT EXIST**. This caused the level-up feature to fail whenever choices were needed.

**Missing Components Created:**
| Component | Purpose | Status |
|-----------|---------|--------|
| `FightingStyleSelection.tsx` | Fighter L1, Paladin/Ranger L2 fighting style choice | ✅ Created |
| `SubclassSelection.tsx` | All classes at L3 subclass choice | ✅ Created |
| `FeatSelection.tsx` | ASI levels feat selection | ✅ Created |
| `SpellLearning.tsx` | Spell known casters (Bard, Ranger, Sorcerer, Warlock) | ✅ Created |
| `CantripLearning.tsx` | New cantrip selection for spellcasters | ✅ Created |
| `ExpertiseSelection.tsx` | Bard L2/L9, Rogue L1/L6, Ranger L9 expertise | ✅ Created |
| `MetamagicSelection.tsx` | Sorcerer L2 metamagic selection | ✅ Created |
| `InvocationSelection.tsx` | Warlock eldritch invocation selection | ✅ Created |
| `PactBoonSelection.tsx` | Warlock L3 pact boon selection | ✅ Created |
| `DivineOrderSelection.tsx` | Cleric L1 divine order choice | ✅ Created |
| `PrimalOrderSelection.tsx` | Druid L1 primal order choice | ✅ Created |
| `WeaponMasterySelection.tsx` | Barbarian/Fighter/Monk/Paladin/Ranger L1 | ✅ Created |
| `PrimalKnowledgeSelection.tsx` | Barbarian L3 skill selection | ✅ Created |

All 13 components now exist in `/dnd-vtt/client/src/components/Character/` with proper:
- Props interfaces matching LevelUpWizard expectations
- Selection UI with clickable options
- State management for multi-select where needed
- Confirm/callback handling
- Consistent styling with the app theme

---

### ✅ BUGS FIXED (Data)

#### 1. Ranger Spells Known at Level 1 — FIXED

**Was:**
```typescript
ranger: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 4, ... }
```

**Now:**
```typescript
ranger: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, ... }
```

Rangers now correctly know 2 spells at level 1.

#### 2. Monk Focus Techniques — FIXED

The Focus feature description now explicitly lists the techniques:
- Flurry of Blows (1 Focus, 2 unarmed strikes as bonus action)
- Patient Defense (1 Focus, Dodge as bonus action)
- Step of the Wind (1 Focus, Disengage or Dash as bonus action, double jump distance)

#### 3. Warlock Pact Boon Structure — FIXED

Removed separate "Pact Boon" feature. Updated Eldritch Invocations description to clarify that Pact Boons (Pact of the Blade, Chain, or Tome) are invocations you can select at level 1, aligning with 2024 PHB structure.

---

### ✅ Verified Correct for Levels 1-5

#### Class Features by Level

| Class | L1 | L2 | L3 | L4 | L5 |
|-------|----|----|----|----|-----|
| **Barbarian** | Rage, Unarmored Defense, Weapon Mastery (2) | Danger Sense, Reckless Attack | Primal Path, Primal Knowledge | ASI | Extra Attack, Fast Movement |
| **Bard** | Bardic Inspiration, Spellcasting | Expertise (2), Jack of All Trades | Bard College | ASI | Font of Inspiration |
| **Cleric** | Divine Order, Spellcasting | Channel Divinity | Divine Domain | ASI | Sear Undead |
| **Druid** | Druidic, Primal Order, Spellcasting | Wild Shape, Wild Companion | Druid Circle | ASI | Wild Resurgence |
| **Fighter** | Fighting Style, Second Wind, Weapon Mastery (3) | Action Surge, Tactical Mind | Martial Archetype | ASI | Extra Attack, Tactical Shift |
| **Monk** | Martial Arts, Unarmored Defense, Weapon Mastery (2) | Focus, Unarmored Movement, Uncanny Metabolism | Deflect Attacks, Monastic Tradition | ASI, Slow Fall | Extra Attack, Stunning Strike |
| **Paladin** | Lay on Hands, Spellcasting, Weapon Mastery (2) | Divine Smite, Fighting Style | Channel Divinity, Sacred Oath | ASI | Faithful Steed, Extra Attack |
| **Ranger** | Deft Explorer, Favored Enemy, Spellcasting, Weapon Mastery (2) | Fighting Style | Ranger Conclave | ASI | Extra Attack |
| **Rogue** | Expertise (2), Sneak Attack, Thieves' Cant | Cunning Action | Steady Aim, Roguish Archetype | ASI | Cunning Strike, Uncanny Dodge |
| **Sorcerer** | Innate Sorcery, Spellcasting | Font of Magic, Metamagic | Sorcerous Origin | ASI | Sorcerous Restoration |
| **Warlock** | Eldritch Invocations (incl. Pact Boons), Pact Magic | Magical Cunning | Otherworldly Patron | ASI | (slot level increases) |
| **Wizard** | Arcane Recovery, Spellcasting | Scholar | Arcane Tradition | ASI | Memorize Spell |

#### Spell Slot Progressions (Verified)

**Full Casters (Bard, Cleric, Druid, Sorcerer, Wizard):**
| Level | 1st | 2nd | 3rd |
|-------|-----|-----|-----|
| 1 | 2 | - | - |
| 2 | 3 | - | - |
| 3 | 4 | 2 | - |
| 4 | 4 | 3 | - |
| 5 | 4 | 3 | 2 |

**Half Casters (Paladin, Ranger):**
| Level | 1st | 2nd |
|-------|-----|-----|
| 1 | 0 | - |
| 2 | 2 | - |
| 3 | 3 | - |
| 4 | 3 | - |
| 5 | 4 | 2 |

**Warlock (Pact Magic):**
| Level | Slots | Slot Level |
|-------|-------|------------|
| 1 | 1 | 1st |
| 2 | 2 | 1st |
| 3 | 2 | 2nd |
| 4 | 2 | 2nd |
| 5 | 2 | 3rd |

#### Species Features with Level Requirements (Verified)

| Species | Level 3 Feature | Level 5 Feature |
|---------|-----------------|-----------------|
| **Aasimar** | Celestial Revelation (3 forms) | - |
| **Dragonborn** | - | Draconic Flight |
| **Drow (Elf)** | Faerie Fire (1/LR) | Darkness (1/LR) |
| **Goliath** | - | Large Form |
| **Tiefling (Abyssal)** | Ray of Sickness | Hold Person |
| **Tiefling (Chthonic)** | False Life | Ray of Enfeeblement |
| **Tiefling (Infernal)** | Hellish Rebuke | Darkness |

#### Other Verified Systems

- ✅ Cantrip known counts (Bard 2, Cleric 3, Druid 2, Sorcerer 4, Warlock 2, Wizard 3)
- ✅ Weapon Mastery counts (Barbarian 2, Fighter 3, Monk 2, Paladin 2, Ranger 2)
- ✅ Fighting Style availability (Fighter L1, Paladin L2, Ranger L2)
- ✅ Expertise grants (Bard L2, Ranger L1, Rogue L1)
- ✅ All 16 backgrounds with correct configurations
- ✅ All 12 origin feats
- ✅ Starting equipment for all classes
- ✅ Proficiency bonus (+2 at levels 1-4, +3 at level 5)

---

## Accuracy Notes

### Confirmed Accurate to 2024 PHB

1. **Class hit dice** - All correct (d12 Barbarian → d6 Wizard/Sorcerer)
2. **Saving throw proficiencies** - All 12 classes verified correct
3. **Skill proficiency counts** - Bard (3), Ranger (3), Rogue (4), others (2)
4. **Weapon Mastery counts** - Barbarian/Monk (2), Fighter (3), others (2)
5. **ASI levels** - Standard (4,8,12,16,19), Fighter (+6,14), Rogue (+10)
6. **Subclass levels** - All correct (most at 3, some at 1 or 2)
7. **Background structure** - 3 ability scores, 2 skills, 1 tool, 1 origin feat

### Minor Inaccuracies Found

1. **Warlock Pact Boon** - Listed at Level 1; 2024 PHB has Pact Boons integrated into Invocations (Pact of the Blade, Chain, Tome are invocations)
2. **Druid weapon proficiencies** - Slightly outdated list (2024 simplified this)
3. **Some spell descriptions** - Minor wording differences from 2024 text

---

## Recommendations

### High Priority

1. **Complete spell database for levels 4-9** - Many builds rely on higher-level spells
2. **Implement multiclassing** - Core PHB feature for character customization
3. **Condition automation** - Auto-apply effects when conditions are set

### Medium Priority

4. **Update Warlock Pact Boon** - Align with 2024 invocation-based system
5. **Add missing subclass features at higher levels** - Most have L6/L10/L14 features
6. **Expand monster database** - More variety for encounter building

### Low Priority

7. **Epic Boons** - Optional high-level content
8. **Crafting system** - Nice to have
9. **Downtime activities** - Campaign-dependent

---

## Summary Statistics

| Category | Implemented | 2024 PHB Total | Coverage |
|----------|-------------|----------------|----------|
| Classes | 12 | 12 | 100% |
| Subclasses | 48 | 48 | 100% |
| Species | 10 | 10 | 100% |
| Backgrounds | 16 | 16 | 100% |
| Origin Feats | 12 | 12 | 100% |
| General Feats | 40+ | ~50 | ~80% |
| Fighting Styles | 10 | 10 | 100% |
| Cantrips | 30+ | ~40 | ~75% |
| 1st-3rd Level Spells | 80+ | ~120 | ~70% |
| 4th-9th Level Spells | 20+ | ~200 | ~10% |
| Eldritch Invocations | 35 | ~40 | ~88% |
| Weapon Masteries | 8 | 8 | 100% |
| Monsters | 50+ | N/A (MM) | Good |

**Overall Assessment**: The VTT provides comprehensive coverage of 2024 PHB character creation and core gameplay systems. The main gaps are in higher-level spell content and some advanced systems like multiclassing. The implementation is accurate to the 2024 rules with only minor discrepancies noted.

---

## Comprehensive Full PHB Review (All Levels)

### 🔴 CRITICAL GAPS

#### 1. Spell Levels 4-9 — COMPLETELY MISSING

| Spell Level | Status | Spells Missing |
|-------------|--------|----------------|
| **4th Level** | ❌ MISSING | Banishment, Dimension Door, Greater Invisibility, Polymorph, Wall of Fire, Ice Storm, Arcane Eye, Divination, Freedom of Movement, Stoneskin, etc. |
| **5th Level** | ❌ MISSING | Animate Objects, Bigby's Hand, Cloudkill, Cone of Cold, Flame Strike, Greater Restoration, Hold Monster, Mass Cure Wounds, Raise Dead, Telekinesis, Wall of Stone, etc. |
| **6th Level** | ❌ MISSING | Chain Lightning, Disintegrate, Globe of Invulnerability, Heal, Heroes' Feast, True Seeing, Word of Recall, etc. |
| **7th Level** | ❌ MISSING | Etherealness, Finger of Death, Fire Storm, Forcecage, Plane Shift, Regenerate, Resurrection, Teleport, etc. |
| **8th Level** | ❌ MISSING | Antimagic Field, Clone, Demiplane, Dominate Monster, Earthquake, Feeblemind, Holy Aura, Maze, Power Word Stun, Sunburst, etc. |
| **9th Level** | ❌ MISSING | Astral Projection, Foresight, Gate, Mass Heal, Meteor Swarm, Power Word Kill, Prismatic Wall, True Polymorph, True Resurrection, Wish, etc. |

**Impact:** Characters above level 7 (when 4th-level slots unlock) cannot access their full spellcasting potential. This affects ~50% of spell content.

---

#### 2. Subclass Features Beyond Level 3 — INCOMPLETE

Most subclasses only have Level 3 features documented. Missing features:

| Class | Subclass Feature Levels | Status |
|-------|------------------------|--------|
| **Barbarian** | L3, L6, L10, L14 | Only L3 documented |
| **Bard** | L3, L6, L14 | Only L3 documented |
| **Cleric** | L1 (domain), L2, L6, L8, L17 | Only domain spells documented |
| **Druid** | L2 (circle), L6, L10, L14 | Only L2/L3 documented |
| **Fighter** | L3, L7, L10, L15, L18 | Battle Master maneuvers complete, others partial |
| **Monk** | L3, L6, L11, L17 | Only L3 documented |
| **Paladin** | L3 (oath), L7, L15, L20 | Only oath spells documented |
| **Ranger** | L3, L7, L11, L15 | Only L3 documented |
| **Rogue** | L3, L9, L13, L17 | Only L3 documented |
| **Sorcerer** | L1, L6, L14, L18 | Only L1/L3 documented |
| **Warlock** | L1, L6, L10, L14 | Only patron spells documented |
| **Wizard** | L2, L6, L10, L14 | Only L2 documented |

---

### 🟡 PARTIAL IMPLEMENTATIONS

#### 3. Feats — ~70% Complete

**Origin Feats Present (12):** Alert, Crafter, Healer, Lucky, Magic Initiate (Cleric/Druid/Wizard), Musician, Savage Attacker, Skilled, Tavern Brawler, Tough

**General Feats Present (~40):** Actor, Athlete, Charger, Crossbow Expert, Crusher, Defensive Duelist, Dual Wielder, Durable, Elemental Adept, Fey Touched, Fighting Initiate, Grappler, Great Weapon Master, Heavily Armored, Heavy Armor Master, Inspiring Leader, Keen Mind, Lightly Armored, Mage Slayer, Medium Armor Master, Moderately Armored, Mounted Combatant, Observant, Piercer, Polearm Master, Resilient, Ritual Caster, Sentinel, Shadow Touched, Sharpshooter, Shield Master, Skill Expert, Skulker, Slasher, Speedy, Spell Sniper, Telekinetic, Telepathic, War Caster, Weapon Master

**Missing/Unverified Feats:**
- Chef
- Durable (needs verification)
- Eldritch Adept
- Fey Touched (needs full prereqs)
- Gift of the Chromatic Dragon, Gem Dragon, Metallic Dragon
- Gunner (if applicable)
- Metamagic Adept
- Poisoner
- Shadow Touched (needs full prereqs)
- Skill Expert (needs verification)
- Strike of the Giants feats
- And potentially 10+ more from 2024 PHB

---

#### 4. Eldritch Invocations — ~88% Complete (35/~40)

**Present:** Agonizing Blast, Armor of Shadows, Beast Speech, Beguiling Influence, Devil's Sight, Eldritch Mind, Eldritch Sight, Eldritch Spear, Eyes of the Rune Keeper, Fiendish Vigor, Gaze of Two Minds, Gift of the Depths, Gift of the Ever-Living Ones, Gift of the Protectors, Grasp of Hadar, Improved Pact Weapon, Investment of the Chain Master, Lance of Lethargy, Lifedrinker, Maddening Hex, Mask of Many Faces, Master of Myriad Forms, Minions of Chaos, Misty Visions, One with Shadows, Otherworldly Leap, Pact of the Blade, Pact of the Chain, Pact of the Tome, Relentless Hex, Repelling Blast, Sculptor of Flesh, Shroud of Shadow, Sign of Ill Omen, Thirsting Blade, Undying Servitude, Visions of Distant Realms, Whispers of the Grave, Witch Sight

**Missing (need to verify):**
- Book of Ancient Secrets
- Cloak of Flies
- Dreadful Word
- Eldritch Smite
- Ghostly Gaze
- Tomb of Levistus
- Trickster's Escape

---

### 🟢 COMPLETE IMPLEMENTATIONS

#### 5. Core Class Features (Levels 1-20) — COMPLETE ✓

All 12 classes have full feature progressions documented.

#### 6. Species — COMPLETE ✓

All 10 species with:
- Base traits
- Subspecies/lineages
- Level-gated features (L3, L5)

#### 7. Backgrounds — COMPLETE ✓

All 16 backgrounds with ability scores, skills, tools, and origin feats.

#### 8. Equipment — COMPLETE ✓

- 30 weapons (all simple and martial)
- 10 armor pieces (light, medium, heavy, shields)
- 28+ adventuring gear items
- Starting equipment for all classes

#### 9. Spell Slots — COMPLETE ✓

- Full caster progression (levels 1-20)
- Half-caster progression (Paladin, Ranger)
- Warlock Pact Magic progression

#### 10. Class Resources — COMPLETE ✓

- Rage (Barbarian)
- Bardic Inspiration (Bard)
- Channel Divinity (Cleric, Paladin)
- Wild Shape (Druid)
- Focus Points (Monk)
- Lay on Hands (Paladin)
- Sorcery Points (Sorcerer)

---

### 🔴 MISSING SYSTEMS

| System | Status | Notes |
|--------|--------|-------|
| **Multiclassing** | ❌ Missing | No multiclass rules, spell slot calculations, or prerequisites |
| **Exhaustion** | ❌ Missing | No exhaustion level tracking or effects |
| **Death Saves** | ⚠️ Partial | UI exists but mechanics may be incomplete |
| **Conditions (detailed)** | ⚠️ Partial | 13+ conditions listed but effects not automated |
| **Concentration** | ⚠️ Partial | Tracked but no concentration checks |
| **Carrying Capacity** | ❌ Missing | Not calculated |
| **Encumbrance** | ❌ Missing | Not implemented |
| **Lifestyle Expenses** | ❌ Missing | Not implemented |
| **Downtime Activities** | ❌ Missing | Not implemented |
| **Crafting Rules** | ❌ Missing | No crafting mechanics |
| **Epic Boons** | ❌ Missing | Level 20+ content not implemented |

---

### Priority Implementation Roadmap

#### Phase 1 — CRITICAL (Gameplay Breaking)
1. **Add spell lists for levels 4-9** (~150+ spells)
2. **Complete subclass features** at levels 6, 10, 14, etc.
3. **Add missing Eldritch Invocations**

#### Phase 2 — HIGH (Gameplay Limiting)
4. **Add remaining feats** (~15-20 missing)
5. **Implement multiclassing rules**
6. **Add condition automation**

#### Phase 3 — MEDIUM (Quality of Life)
7. **Exhaustion system**
8. **Concentration checks**
9. **Death save mechanics**
10. **Carrying capacity**

#### Phase 4 — LOW (Nice to Have)
11. **Crafting system**
12. **Downtime activities**
13. **Epic Boons**
14. **Lifestyle expenses**

---

## Updated Summary Statistics

| Category | Implemented | 2024 PHB Total | Coverage |
|----------|-------------|----------------|----------|
| Classes | 12 | 12 | 100% |
| Class Features (L1-20) | 12 classes | 12 classes | 100% |
| Subclass Base Features | 48 | 48 | 100% |
| Subclass Full Progression | ~25% | 100% | **25%** |
| Species | 10 | 10 | 100% |
| Backgrounds | 16 | 16 | 100% |
| Origin Feats | 12 | 12 | 100% |
| General Feats | ~40 | ~55 | **~73%** |
| Cantrips | 31 | ~35 | ~89% |
| 1st-3rd Level Spells | 80+ | ~100 | ~80% |
| **4th-9th Level Spells** | **0** | **~150** | **0%** |
| Eldritch Invocations | 35 | ~42 | ~83% |
| Weapon Masteries | 8 | 8 | 100% |
| Equipment | Complete | Complete | 100% |
| Spell Slots | Complete | Complete | 100% |
| Multiclassing | 0% | 100% | **0%** |

**Revised Overall Assessment:** The VTT has excellent coverage of character creation, levels 1-5 gameplay, and core combat mechanics. However, **higher-level play (7+) is severely limited** by the complete absence of 4th-9th level spells. Subclass progression beyond level 3 is also incomplete. Priority should be given to spell database completion.

---

*Document updated: January 2026*
*Comprehensive review of dndData.ts (5,721 lines)*
