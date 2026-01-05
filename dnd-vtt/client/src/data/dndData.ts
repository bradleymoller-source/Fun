// D&D 5e 2024 Data Constants

import type { Species, CharacterClass, SkillName, AbilityScores, ProficiencyLevel } from '../types';

// Class hit dice
export const CLASS_HIT_DICE: Record<CharacterClass, number> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};

// Class primary abilities
export const CLASS_PRIMARY_ABILITY: Record<CharacterClass, keyof AbilityScores> = {
  barbarian: 'strength',
  bard: 'charisma',
  cleric: 'wisdom',
  druid: 'wisdom',
  fighter: 'strength',
  monk: 'dexterity',
  paladin: 'strength',
  ranger: 'dexterity',
  rogue: 'dexterity',
  sorcerer: 'charisma',
  warlock: 'charisma',
  wizard: 'intelligence',
};

// Class-specific standard arrays (optimized for each class's primary/secondary abilities)
export const CLASS_STANDARD_ARRAYS: Record<CharacterClass, AbilityScores> = {
  barbarian: { strength: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, intelligence: 8 },
  bard: { charisma: 15, dexterity: 14, constitution: 13, wisdom: 12, intelligence: 10, strength: 8 },
  cleric: { wisdom: 15, constitution: 14, strength: 13, charisma: 12, dexterity: 10, intelligence: 8 },
  druid: { wisdom: 15, constitution: 14, dexterity: 13, intelligence: 12, charisma: 10, strength: 8 },
  fighter: { strength: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, intelligence: 8 },
  monk: { dexterity: 15, wisdom: 14, constitution: 13, strength: 12, charisma: 10, intelligence: 8 },
  paladin: { strength: 15, charisma: 14, constitution: 13, wisdom: 12, dexterity: 10, intelligence: 8 },
  ranger: { dexterity: 15, wisdom: 14, constitution: 13, intelligence: 12, strength: 10, charisma: 8 },
  rogue: { dexterity: 15, constitution: 14, intelligence: 13, wisdom: 12, charisma: 10, strength: 8 },
  sorcerer: { charisma: 15, constitution: 14, dexterity: 13, wisdom: 12, intelligence: 10, strength: 8 },
  warlock: { charisma: 15, constitution: 14, dexterity: 13, wisdom: 12, intelligence: 10, strength: 8 },
  wizard: { intelligence: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, strength: 8 },
};

// ============ ALL SUBCLASSES (2024 PHB) ============

// Subclass choice option
export interface SubclassChoiceOption {
  id: string;
  name: string;
  description: string;
}

// Subclass choice (e.g., maneuvers, land type, etc.)
export interface SubclassChoice {
  id: string;
  name: string;            // e.g., "Maneuvers", "Land Type", "Damage Type"
  description: string;     // Explanation of what they're choosing
  count: number;           // How many to choose (1 for land type, 3 for maneuvers)
  options: SubclassChoiceOption[];
}

export interface SubclassInfo {
  name: string;
  description: string;
  features: string[];
  levelAvailable: number; // Level when subclass can be chosen
  choices?: SubclassChoice[];  // Optional choices for this subclass
  bonusSpells?: string[];      // Bonus spells granted by subclass
}

// All 48 subclasses from the 2024 PHB (4 per class)
export const CLASS_SUBCLASSES: Record<CharacterClass, SubclassInfo[]> = {
  barbarian: [
    {
      name: 'Path of the Berserker',
      description: 'For some barbarians, rage is a means to an end—that end being violence.',
      features: ['Frenzy: Bonus action melee attack while raging'],
      levelAvailable: 3,
    },
    {
      name: 'Path of the Wild Heart',
      description: 'Many barbarians have a spiritual connection to a powerful animal spirit.',
      features: ['Animal Speaker: Cast Speak with Animals and Beast Sense as rituals', 'Rage of the Wilds: Gain special ability while raging based on chosen animal'],
      levelAvailable: 3,
      choices: [{
        id: 'animal-spirit',
        name: 'Animal Spirit',
        description: 'Choose an animal spirit that grants you a special ability while raging.',
        count: 1,
        options: [
          { id: 'bear', name: 'Bear', description: 'While raging, you have resistance to all damage except Psychic.' },
          { id: 'eagle', name: 'Eagle', description: 'While raging, enemies have disadvantage on opportunity attacks against you, and you can Dash as a bonus action.' },
          { id: 'wolf', name: 'Wolf', description: 'While raging, your allies have advantage on attack rolls against enemies within 5 feet of you.' },
        ],
      }],
    },
    {
      name: 'Path of the World Tree',
      description: 'Barbarians who follow this path draw power from the World Tree.',
      features: ['Vitality of the Tree: Temp HP when entering rage equal to Barbarian level'],
      levelAvailable: 3,
    },
    {
      name: 'Path of the Zealot',
      description: 'Some deities inspire their followers to pitch themselves into a ferocious battle fury.',
      features: ['Divine Fury: Extra 1d6+half level damage on first hit each turn while raging', 'Warrior of the Gods: Spells to revive you require no material components'],
      levelAvailable: 3,
      choices: [{
        id: 'divine-fury-type',
        name: 'Divine Fury Damage Type',
        description: 'Choose the damage type for your Divine Fury feature.',
        count: 1,
        options: [
          { id: 'radiant', name: 'Radiant', description: 'Your divine fury deals radiant damage, channeling holy light against your foes.' },
          { id: 'necrotic', name: 'Necrotic', description: 'Your divine fury deals necrotic damage, channeling dark divine power against your foes.' },
        ],
      }],
    },
  ],
  bard: [
    {
      name: 'College of Dance',
      description: 'Bards of the College of Dance are masters of movement and performance.',
      features: ['Dazzling Footwork: Unarmored Defense (10+DEX+CHA), extra speed while not wearing armor/shield'],
      levelAvailable: 3,
    },
    {
      name: 'College of Glamour',
      description: 'Bards who belong to this college have learned to use their magic to delight and captivate.',
      features: ['Mantle of Inspiration: Bonus action to give temp HP and reaction movement to allies'],
      levelAvailable: 3,
    },
    {
      name: 'College of Lore',
      description: 'Bards of the College of Lore know something about most things.',
      features: ['Cutting Words: Reaction to subtract Bardic Inspiration from enemy roll'],
      levelAvailable: 3,
    },
    {
      name: 'College of Valor',
      description: 'Bards of the College of Valor are daring skalds whose tales keep alive the memory of great heroes.',
      features: ['Combat Inspiration: Bardic Inspiration adds to damage roll or AC'],
      levelAvailable: 3,
    },
  ],
  cleric: [
    {
      name: 'Life Domain',
      description: 'Gods of life promote vitality and health through healing the sick and wounded.',
      features: ['Disciple of Life: Healing spells restore additional HP equal to 2 + spell level', 'Domain Spells: Always have Bless and Cure Wounds prepared'],
      levelAvailable: 3,
      bonusSpells: ['Bless', 'Cure Wounds'],
    },
    {
      name: 'Light Domain',
      description: 'Gods of light promote ideals of rebirth, truth, vigilance, and beauty.',
      features: ['Warding Flare: Reaction to impose disadvantage on an attacker', 'Domain Spells: Always have Burning Hands and Faerie Fire prepared'],
      levelAvailable: 3,
      bonusSpells: ['Burning Hands', 'Faerie Fire'],
    },
    {
      name: 'Trickery Domain',
      description: 'Gods of trickery are mischief-makers and instigators who embody chaos.',
      features: ['Blessing of the Trickster: Give advantage on Stealth to another creature', 'Domain Spells: Always have Charm Person and Disguise Self prepared'],
      levelAvailable: 3,
      bonusSpells: ['Charm Person', 'Disguise Self'],
    },
    {
      name: 'War Domain',
      description: 'War gods watch over warriors and reward them for great deeds of valor.',
      features: ['War Priest: Bonus action weapon attack, uses = WIS mod per long rest', 'Domain Spells: Always have Divine Favor and Shield of Faith prepared'],
      levelAvailable: 3,
      bonusSpells: ['Divine Favor', 'Shield of Faith'],
    },
  ],
  druid: [
    {
      name: 'Circle of the Land',
      description: 'Druids of this circle are mystics and sages who safeguard ancient knowledge and rites.',
      features: ['Natural Recovery: Recover spell slots during short rest', 'Circle Spells: Learn bonus spells based on chosen land'],
      levelAvailable: 3,
      choices: [{
        id: 'land-type',
        name: 'Land Type',
        description: 'Choose the type of land that you have a mystical connection to. You always have the associated spells prepared.',
        count: 1,
        options: [
          { id: 'arid', name: 'Arid Land', description: 'Blur, Burning Hands, Fire Bolt. At higher levels: Fireball, Fire Shield, Wall of Stone.' },
          { id: 'polar', name: 'Polar Land', description: 'Fog Cloud, Hold Person, Ray of Frost. At higher levels: Sleet Storm, Ice Storm, Cone of Cold.' },
          { id: 'temperate', name: 'Temperate Land', description: 'Misty Step, Shocking Grasp, Sleep. At higher levels: Lightning Bolt, Freedom of Movement, Tree Stride.' },
          { id: 'tropical', name: 'Tropical Land', description: 'Acid Splash, Entangle, Web. At higher levels: Gaseous Form, Polymorph, Insect Plague.' },
        ],
      }],
    },
    {
      name: 'Circle of the Moon',
      description: 'Druids of this circle are fierce guardians of the wilds.',
      features: ['Combat Wild Shape: Bonus action Wild Shape, can use Wild Shape to heal'],
      levelAvailable: 3,
    },
    {
      name: 'Circle of the Sea',
      description: 'Druids of this circle are tied to the power of the seas and storms.',
      features: ['Wrath of the Sea: Use Wild Shape to summon water elemental power'],
      levelAvailable: 3,
    },
    {
      name: 'Circle of the Stars',
      description: 'Druids of this circle track the stars and cosmic events.',
      features: ['Star Map: Use Wild Shape to enter a starry form with different benefits'],
      levelAvailable: 3,
    },
  ],
  fighter: [
    {
      name: 'Battle Master',
      description: 'Battle Masters are supreme martial tacticians on the battlefield.',
      features: ['Combat Superiority: Learn 3 maneuvers, gain 4 superiority dice (d8)'],
      levelAvailable: 3,
      choices: [{
        id: 'maneuvers',
        name: 'Maneuvers',
        description: 'Choose 3 maneuvers from the list below. You can use a maneuver by expending one superiority die.',
        count: 3,
        options: [
          { id: 'ambush', name: 'Ambush', description: 'Add superiority die to Stealth check or initiative roll.' },
          { id: 'bait-and-switch', name: 'Bait and Switch', description: 'Switch places with willing ally within 5 ft. One of you gains AC bonus equal to superiority die until start of your next turn.' },
          { id: 'commanders-strike', name: "Commander's Strike", description: 'Forgo one attack to direct an ally to strike. Ally uses reaction to make weapon attack, adding superiority die to damage.' },
          { id: 'commanding-presence', name: 'Commanding Presence', description: 'Add superiority die to Intimidation, Performance, or Persuasion check.' },
          { id: 'disarming-attack', name: 'Disarming Attack', description: 'Add superiority die to damage. Target must succeed STR save or drop held object.' },
          { id: 'distracting-strike', name: 'Distracting Strike', description: 'Add superiority die to damage. Next attack against target by ally has advantage until start of your next turn.' },
          { id: 'evasive-footwork', name: 'Evasive Footwork', description: 'When you move, add superiority die to AC until you stop moving.' },
          { id: 'feinting-attack', name: 'Feinting Attack', description: 'Bonus action to feint. Gain advantage on next attack and add superiority die to damage.' },
          { id: 'goading-attack', name: 'Goading Attack', description: 'Add superiority die to damage. Target must succeed WIS save or have disadvantage on attacks against others.' },
          { id: 'lunging-attack', name: 'Lunging Attack', description: 'Increase reach by 5 ft for one attack, add superiority die to damage.' },
          { id: 'maneuvering-attack', name: 'Maneuvering Attack', description: 'Add superiority die to damage. Ally can use reaction to move half speed without provoking opportunity attacks.' },
          { id: 'menacing-attack', name: 'Menacing Attack', description: 'Add superiority die to damage. Target must succeed WIS save or be frightened until end of your next turn.' },
          { id: 'parry', name: 'Parry', description: 'When hit by melee attack, use reaction to reduce damage by superiority die + DEX mod.' },
          { id: 'precision-attack', name: 'Precision Attack', description: 'Add superiority die to attack roll (can be used after roll, before result is known).' },
          { id: 'pushing-attack', name: 'Pushing Attack', description: 'Add superiority die to damage. Target must succeed STR save or be pushed up to 15 ft.' },
          { id: 'rally', name: 'Rally', description: 'Bonus action to bolster ally. They gain temp HP equal to superiority die + CHA mod.' },
          { id: 'riposte', name: 'Riposte', description: 'When creature misses you with melee attack, use reaction to make melee attack, adding superiority die to damage.' },
          { id: 'sweeping-attack', name: 'Sweeping Attack', description: 'When you hit, you can deal superiority die damage to another creature within 5 ft of original target.' },
          { id: 'tactical-assessment', name: 'Tactical Assessment', description: 'Add superiority die to History, Insight, or Investigation check.' },
          { id: 'trip-attack', name: 'Trip Attack', description: 'Add superiority die to damage. Target must succeed STR save or be knocked prone.' },
        ],
      }],
    },
    {
      name: 'Champion',
      description: 'The Champion focuses on the development of raw physical power.',
      features: ['Improved Critical: Weapon attacks score a critical hit on 19-20'],
      levelAvailable: 3,
    },
    {
      name: 'Eldritch Knight',
      description: 'Eldritch Knights combine martial mastery with arcane power.',
      features: ['Spellcasting: Learn wizard spells (abjuration and evocation), INT-based'],
      levelAvailable: 3,
    },
    {
      name: 'Psi Warrior',
      description: 'Psi Warriors harness psionic power to enhance combat abilities.',
      features: ['Psionic Power: Gain psionic energy dice for telekinetic abilities'],
      levelAvailable: 3,
    },
  ],
  monk: [
    {
      name: 'Warrior of Mercy',
      description: 'These monks learn techniques to manipulate life force.',
      features: ['Hand of Harm: Spend Focus Point to deal necrotic damage and inflict poisoned'],
      levelAvailable: 3,
    },
    {
      name: 'Warrior of Shadow',
      description: 'Monks who follow this tradition weave shadows and darkness.',
      features: ['Shadow Arts: Spend Focus Points to cast Darkness, Darkvision, Pass without Trace, or Silence'],
      levelAvailable: 3,
    },
    {
      name: 'Warrior of the Elements',
      description: 'These monks channel elemental forces through their martial arts.',
      features: ['Elemental Attunement: Learn to manipulate elemental energy, learn Elementalism cantrip'],
      levelAvailable: 3,
    },
    {
      name: 'Warrior of the Open Hand',
      description: 'The Way of the Open Hand is the ultimate path of martial arts mastery.',
      features: ['Open Hand Technique: Impose effects on Flurry of Blows hits (push, prone, no reactions)'],
      levelAvailable: 3,
    },
  ],
  paladin: [
    {
      name: 'Oath of Devotion',
      description: 'The Oath of Devotion binds a paladin to the loftiest ideals of justice and virtue.',
      features: ['Sacred Weapon: Channel Divinity to add CHA to attacks for 10 minutes', 'Oath Spells: Always have Protection from Evil and Sanctuary prepared'],
      levelAvailable: 3,
      bonusSpells: ['Protection from Evil and Good', 'Sanctuary'],
    },
    {
      name: 'Oath of Glory',
      description: 'Paladins who take this oath believe they are destined for glory through heroic deeds.',
      features: ['Peerless Athlete: Channel Divinity for advantage on Athletics and Acrobatics, extra carrying', 'Oath Spells: Always have Guiding Bolt and Heroism prepared'],
      levelAvailable: 3,
      bonusSpells: ['Guiding Bolt', 'Heroism'],
    },
    {
      name: 'Oath of the Ancients',
      description: 'The Oath of the Ancients is as old as the fey and the forces of nature.',
      features: ['Nature\'s Wrath: Channel Divinity to restrain creature with spectral vines', 'Oath Spells: Always have Ensnaring Strike and Speak with Animals prepared'],
      levelAvailable: 3,
      bonusSpells: ['Ensnaring Strike', 'Speak with Animals'],
    },
    {
      name: 'Oath of Vengeance',
      description: 'The Oath of Vengeance is a solemn commitment to punish those who have committed grievous sins.',
      features: ['Vow of Enmity: Channel Divinity for advantage on attacks against one creature', 'Oath Spells: Always have Bane and Hunter\'s Mark prepared'],
      levelAvailable: 3,
      bonusSpells: ['Bane', "Hunter's Mark"],
    },
  ],
  ranger: [
    {
      name: 'Beast Master',
      description: 'Rangers who emulate this archetype form a bond with a beast companion.',
      features: ['Primal Companion: Gain a beast companion that obeys your commands'],
      levelAvailable: 3,
      choices: [{
        id: 'beast-type',
        name: 'Primal Companion',
        description: 'Choose the form of your beast companion.',
        count: 1,
        options: [
          { id: 'beast-of-land', name: 'Beast of the Land', description: 'A nimble beast with high movement speed and the ability to charge enemies.' },
          { id: 'beast-of-sea', name: 'Beast of the Sea', description: 'An aquatic beast with swim speed and the ability to knock enemies prone.' },
          { id: 'beast-of-sky', name: 'Beast of the Sky', description: 'A flying beast that can assist allies and flyby attack enemies.' },
        ],
      }],
    },
    {
      name: 'Fey Wanderer',
      description: 'A feywild bargain or brush with its wonders has transformed you.',
      features: ['Dreadful Strikes: Add WIS mod psychic damage once per turn to weapon attacks', 'Subclass Spells: Charm Person always prepared'],
      levelAvailable: 3,
      bonusSpells: ['Charm Person'],
    },
    {
      name: 'Gloom Stalker',
      description: 'Gloom Stalkers are at home in the darkest places.',
      features: ['Dread Ambusher: Extra attack on first turn, +WIS to initiative', 'Subclass Spells: Disguise Self always prepared'],
      levelAvailable: 3,
      bonusSpells: ['Disguise Self'],
    },
    {
      name: 'Hunter',
      description: 'Hunters accept their place as a bulwark between civilization and the terrors of the wilderness.',
      features: ['Hunter\'s Prey: Special abilities against your chosen prey type'],
      levelAvailable: 3,
      choices: [{
        id: 'hunters-prey',
        name: "Hunter's Prey",
        description: 'Choose a specialty that defines how you hunt your prey.',
        count: 1,
        options: [
          { id: 'colossus-slayer', name: 'Colossus Slayer', description: 'Once per turn, deal extra 1d8 damage to a creature below its HP maximum.' },
          { id: 'horde-breaker', name: 'Horde Breaker', description: 'Once per turn, make a second attack against a different creature within 5 ft of the first.' },
          { id: 'giant-killer', name: 'Giant Killer', description: 'Reaction attack when a Large or larger creature within 5 ft hits or misses you.' },
        ],
      }],
    },
  ],
  rogue: [
    {
      name: 'Arcane Trickster',
      description: 'Rogues who combine agile maneuvers with magical abilities.',
      features: ['Spellcasting: Learn wizard spells (enchantment and illusion), INT-based'],
      levelAvailable: 3,
    },
    {
      name: 'Assassin',
      description: 'Rogues who focus on the art of death itself.',
      features: ['Assassinate: Advantage on creatures that haven\'t acted, auto-crit on surprised creatures'],
      levelAvailable: 3,
    },
    {
      name: 'Soulknife',
      description: 'Rogues who harness psionic power to manifest blades of psychic energy.',
      features: ['Psionic Power: Manifest psychic blades, gain psi-bolstered abilities'],
      levelAvailable: 3,
    },
    {
      name: 'Thief',
      description: 'Rogues who are excellent at infiltration and larceny.',
      features: ['Fast Hands: Use Cunning Action for Sleight of Hand, Disarm Trap, Use Object, Use Thieves\' Tools'],
      levelAvailable: 3,
    },
  ],
  sorcerer: [
    {
      name: 'Aberrant Sorcery',
      description: 'An alien influence has left its mark on you, granting you strange powers.',
      features: ['Telepathic Speech: Speak telepathically with creatures within 30 ft × CHA mod ft'],
      levelAvailable: 3,
    },
    {
      name: 'Clockwork Sorcery',
      description: 'The cosmic force of order has suffused you with magic.',
      features: ['Restore Balance: Reaction to cancel advantage or disadvantage within 60 ft'],
      levelAvailable: 3,
    },
    {
      name: 'Draconic Sorcery',
      description: 'Your innate magic comes from draconic ancestry.',
      features: ['Draconic Resilience: HP max +1 per level, AC 13+DEX when not wearing armor'],
      levelAvailable: 3,
    },
    {
      name: 'Wild Magic',
      description: 'Your spellcasting can unleash surges of untamed magic.',
      features: ['Wild Magic Surge: DM can have you roll on Wild Magic Surge table'],
      levelAvailable: 3,
    },
  ],
  warlock: [
    {
      name: 'Archfey Patron',
      description: 'Your patron is a lord or lady of the fey.',
      features: ['Fey Presence: Charm or frighten creatures in 10-ft cube as action', 'Patron Spells: Always have Faerie Fire and Sleep prepared'],
      levelAvailable: 3,
      bonusSpells: ['Faerie Fire', 'Sleep'],
    },
    {
      name: 'Celestial Patron',
      description: 'Your patron is a being of the Upper Planes.',
      features: ['Healing Light: Pool of d6s equal to 1 + warlock level, bonus action heal', 'Patron Spells: Always have Cure Wounds and Guiding Bolt prepared'],
      levelAvailable: 3,
      bonusSpells: ['Cure Wounds', 'Guiding Bolt'],
    },
    {
      name: 'Fiend Patron',
      description: 'You have made a pact with a fiend from the lower planes.',
      features: ['Dark One\'s Blessing: Gain temp HP = CHA mod + warlock level on killing hostile', 'Patron Spells: Always have Burning Hands and Command prepared'],
      levelAvailable: 3,
      bonusSpells: ['Burning Hands', 'Command'],
    },
    {
      name: 'Great Old One Patron',
      description: 'Your patron is a mysterious entity from the Far Realm.',
      features: ['Awakened Mind: Telepathic communication within 30 ft', 'Patron Spells: Always have Dissonant Whispers and Tasha\'s Hideous Laughter prepared'],
      levelAvailable: 3,
      bonusSpells: ['Dissonant Whispers', "Tasha's Hideous Laughter"],
    },
  ],
  wizard: [
    {
      name: 'School of Abjuration',
      description: 'Abjuration emphasizes magic that blocks, banishes, or protects.',
      features: ['Arcane Ward: When you cast abjuration spell, create ward with HP = wizard level × 2 + INT mod'],
      levelAvailable: 3,
    },
    {
      name: 'School of Divination',
      description: 'Divination reveals secrets hidden within the multiverse.',
      features: ['Portent: Roll 2d20 after long rest, can replace any roll with portent die'],
      levelAvailable: 3,
    },
    {
      name: 'School of Evocation',
      description: 'Evocation focuses on spells that create powerful elemental effects.',
      features: ['Sculpt Spells: Create safe zones for allies in evocation spells'],
      levelAvailable: 3,
    },
    {
      name: 'School of Illusion',
      description: 'Illusion focuses on magic that dazzles the senses, befuddles the mind.',
      features: ['Improved Minor Illusion: Learn Minor Illusion if you don\'t know it, can create sound and image'],
      levelAvailable: 3,
    },
  ],
};

// Helper to get subclasses available at a given level
export function getAvailableSubclasses(characterClass: CharacterClass, level: number): SubclassInfo[] {
  return CLASS_SUBCLASSES[characterClass].filter(s => s.levelAvailable <= level);
}

// Check if class gets subclass at level 1
export function hasLevel1Subclass(characterClass: CharacterClass): boolean {
  return CLASS_SUBCLASSES[characterClass].some(s => s.levelAvailable === 1);
}

// Class saving throw proficiencies
export const CLASS_SAVING_THROWS: Record<CharacterClass, (keyof AbilityScores)[]> = {
  barbarian: ['strength', 'constitution'],
  bard: ['dexterity', 'charisma'],
  cleric: ['wisdom', 'charisma'],
  druid: ['intelligence', 'wisdom'],
  fighter: ['strength', 'constitution'],
  monk: ['strength', 'dexterity'],
  paladin: ['wisdom', 'charisma'],
  ranger: ['strength', 'dexterity'],
  rogue: ['dexterity', 'intelligence'],
  sorcerer: ['constitution', 'charisma'],
  warlock: ['wisdom', 'charisma'],
  wizard: ['intelligence', 'wisdom'],
};

// ============ FIGHTING STYLES (2024 PHB) ============

export interface FightingStyleOption {
  id: string;
  name: string;
  description: string;
}

export const FIGHTING_STYLES: FightingStyleOption[] = [
  { id: 'archery', name: 'Archery', description: '+2 bonus to attack rolls with ranged weapons.' },
  { id: 'blind-fighting', name: 'Blind Fighting', description: 'You have Blindsight with a range of 10 feet.' },
  { id: 'defense', name: 'Defense', description: '+1 bonus to AC while wearing armor.' },
  { id: 'dueling', name: 'Dueling', description: '+2 bonus to damage rolls when wielding a melee weapon in one hand and no other weapons.' },
  { id: 'great-weapon', name: 'Great Weapon Fighting', description: 'Reroll 1s and 2s on damage dice with two-handed or versatile melee weapons (must use new roll).' },
  { id: 'interception', name: 'Interception', description: 'When creature you can see hits another creature within 5 ft, use reaction to reduce damage by 1d10 + proficiency bonus (requires shield or weapon).' },
  { id: 'protection', name: 'Protection', description: 'When creature you can see attacks another creature within 5 ft, use reaction to impose disadvantage on the attack (requires shield).' },
  { id: 'thrown-weapon', name: 'Thrown Weapon Fighting', description: '+2 bonus to damage with thrown weapons. Draw a thrown weapon as part of the attack.' },
  { id: 'two-weapon', name: 'Two-Weapon Fighting', description: 'Add ability modifier to the damage of your off-hand attack.' },
  { id: 'unarmed', name: 'Unarmed Fighting', description: 'Unarmed strikes deal 1d6 + STR bludgeoning (or 1d8 if both hands free). At start of turn, deal 1d4 bludgeoning to grappled creature.' },
];

// Classes that get Fighting Style and at what level
export const FIGHTING_STYLE_CLASSES: Partial<Record<CharacterClass, { level: number; options: string[] }>> = {
  fighter: {
    level: 1,
    options: ['archery', 'blind-fighting', 'defense', 'dueling', 'great-weapon', 'interception', 'protection', 'thrown-weapon', 'two-weapon', 'unarmed']
  },
  paladin: {
    level: 2,
    options: ['blind-fighting', 'defense', 'dueling', 'great-weapon', 'interception', 'protection']
  },
  ranger: {
    level: 2,
    options: ['archery', 'blind-fighting', 'defense', 'dueling', 'thrown-weapon', 'two-weapon']
  },
};

// ============ DIVINE ORDER (Cleric Level 1) ============

export interface DivineOrderOption {
  id: string;
  name: string;
  description: string;
  benefits: string[];
}

export const DIVINE_ORDER_OPTIONS: DivineOrderOption[] = [
  {
    id: 'protector',
    name: 'Protector',
    description: 'Trained for battle, you gain proficiency with martial weapons and heavy armor.',
    benefits: ['Martial weapon proficiency', 'Heavy armor proficiency']
  },
  {
    id: 'thaumaturge',
    name: 'Thaumaturge',
    description: 'You know one extra cantrip from the Cleric spell list, and gain a bonus to Religion checks.',
    benefits: ['One extra Cleric cantrip', '+WIS modifier to Religion checks']
  }
];

// ============ PRIMAL ORDER (Druid Level 1) ============

export interface PrimalOrderOption {
  id: string;
  name: string;
  description: string;
  benefits: string[];
}

export const PRIMAL_ORDER_OPTIONS: PrimalOrderOption[] = [
  {
    id: 'magician',
    name: 'Magician',
    description: 'You know one extra cantrip from the Druid spell list.',
    benefits: ['One extra Druid cantrip']
  },
  {
    id: 'warden',
    name: 'Warden',
    description: 'Trained for battle, you gain proficiency with martial weapons and +1 AC when wearing medium armor.',
    benefits: ['Martial weapon proficiency', '+1 AC in medium armor (no shield required)']
  }
];

// ============ ELDRITCH INVOCATIONS (2024 PHB) ============

export interface EldritchInvocation {
  id: string;
  name: string;
  description: string;
  prerequisite?: string;  // e.g., "Pact of the Blade", "5th level", "Eldritch Blast cantrip"
  levelRequired?: number;
}

export const ELDRITCH_INVOCATIONS: EldritchInvocation[] = [
  // Level 1 invocations (no prerequisites or just Eldritch Blast)
  { id: 'agonizing-blast', name: 'Agonizing Blast', description: 'Add CHA modifier to Eldritch Blast damage.', prerequisite: 'Eldritch Blast cantrip' },
  { id: 'armor-of-shadows', name: 'Armor of Shadows', description: 'Cast Mage Armor on yourself at will without expending a spell slot.' },
  { id: 'beast-speech', name: 'Beast Speech', description: 'Cast Speak with Animals at will without expending a spell slot.' },
  { id: 'beguiling-influence', name: 'Beguiling Influence', description: 'Gain proficiency in Deception and Persuasion skills.' },
  { id: 'devils-sight', name: "Devil's Sight", description: 'See normally in darkness (magical and nonmagical) to 120 feet.' },
  { id: 'eldritch-mind', name: 'Eldritch Mind', description: 'Advantage on Constitution saving throws to maintain concentration.' },
  { id: 'eldritch-spear', name: 'Eldritch Spear', description: 'Eldritch Blast has 300-foot range.', prerequisite: 'Eldritch Blast cantrip' },
  { id: 'eyes-of-the-rune-keeper', name: 'Eyes of the Rune Keeper', description: 'Read all writing.' },
  { id: 'fiendish-vigor', name: 'Fiendish Vigor', description: 'Cast False Life on yourself at will as a 1st-level spell without expending a spell slot.' },
  { id: 'gaze-of-two-minds', name: 'Gaze of Two Minds', description: 'Use action to touch willing humanoid and perceive through their senses.' },
  { id: 'grasp-of-hadar', name: 'Grasp of Hadar', description: 'Once per turn when Eldritch Blast hits, pull creature 10 feet toward you.', prerequisite: 'Eldritch Blast cantrip' },
  { id: 'investment-of-the-chain-master', name: 'Investment of the Chain Master', description: 'Familiar gains flying or swimming speed of 40 ft, attacks use your spell attack, and its attacks are magical.', prerequisite: 'Pact of the Chain' },
  { id: 'lance-of-lethargy', name: 'Lance of Lethargy', description: 'Once per turn when Eldritch Blast hits, reduce creature speed by 10 feet until end of your next turn.', prerequisite: 'Eldritch Blast cantrip' },
  { id: 'lessons-of-the-first-ones', name: 'Lessons of the First Ones', description: 'Learn one cantrip from any spell list. It counts as a warlock cantrip for you.' },
  { id: 'mask-of-many-faces', name: 'Mask of Many Faces', description: 'Cast Disguise Self at will without expending a spell slot.' },
  { id: 'misty-visions', name: 'Misty Visions', description: 'Cast Silent Image at will without expending a spell slot.' },
  { id: 'otherworldly-leap', name: 'Otherworldly Leap', description: 'Cast Jump on yourself at will without expending a spell slot.' },
  { id: 'pact-of-the-blade', name: 'Pact of the Blade', description: 'Create a pact weapon. You can transform any magic weapon into your pact weapon.' },
  { id: 'pact-of-the-chain', name: 'Pact of the Chain', description: 'Learn Find Familiar and cast it as a ritual. Your familiar can be an imp, pseudodragon, quasit, or sprite.' },
  { id: 'pact-of-the-tome', name: 'Pact of the Tome', description: 'Your patron gives you a Book of Shadows with three cantrips from any spell list.' },
  { id: 'repelling-blast', name: 'Repelling Blast', description: 'When Eldritch Blast hits, push creature 10 feet away.', prerequisite: 'Eldritch Blast cantrip' },
  { id: 'thief-of-five-fates', name: 'Thief of Five Fates', description: 'Cast Bane once using a warlock spell slot. Regain ability after long rest.' },

  // Higher level invocations
  { id: 'eldritch-smite', name: 'Eldritch Smite', description: 'Once per turn when you hit with pact weapon, expend spell slot to deal extra 1d8 force damage per slot level + 1d8, and knock Large or smaller creature prone.', prerequisite: 'Pact of the Blade', levelRequired: 5 },
  { id: 'maddening-hex', name: 'Maddening Hex', description: 'Bonus action to cause psychic damage equal to CHA modifier to cursed target and creatures within 5 feet.', levelRequired: 5 },
  { id: 'thirsting-blade', name: 'Thirsting Blade', description: 'Attack twice with your pact weapon when you take the Attack action.', prerequisite: 'Pact of the Blade', levelRequired: 5 },
  { id: 'one-with-shadows', name: 'One with Shadows', description: 'When in dim light or darkness, use action to become invisible until you move or take action.', levelRequired: 5 },
  { id: 'whispers-of-the-grave', name: 'Whispers of the Grave', description: 'Cast Speak with Dead at will without expending a spell slot.', levelRequired: 9 },
  { id: 'ascendant-step', name: 'Ascendant Step', description: 'Cast Levitate on yourself at will without expending a spell slot.', levelRequired: 9 },
  { id: 'lifedrinker', name: 'Lifedrinker', description: 'When you hit with pact weapon, deal extra necrotic damage equal to CHA modifier.', prerequisite: 'Pact of the Blade', levelRequired: 12 },
  { id: 'witch-sight', name: 'Witch Sight', description: 'See the true form of creatures (shapechangers, illusions, transmutations) within 30 feet.', levelRequired: 15 },
  { id: 'master-of-myriad-forms', name: 'Master of Myriad Forms', description: 'Cast Alter Self at will without expending a spell slot.', levelRequired: 15 },
];

// Get invocations available at a given level
export function getAvailableInvocations(level: number): EldritchInvocation[] {
  return ELDRITCH_INVOCATIONS.filter(inv => !inv.levelRequired || inv.levelRequired <= level);
}

// Number of invocations known by warlock level
export const WARLOCK_INVOCATIONS_KNOWN: Record<number, number> = {
  1: 1, 2: 3, 3: 3, 4: 3, 5: 5, 6: 5, 7: 6, 8: 6, 9: 7, 10: 7,
  11: 7, 12: 8, 13: 8, 14: 8, 15: 9, 16: 9, 17: 9, 18: 10, 19: 10, 20: 10,
};

// ============ EXPERTISE ============

// Classes that get Expertise and at what level
export const EXPERTISE_CLASSES: Partial<Record<CharacterClass, { level: number; count: number }>> = {
  bard: { level: 2, count: 2 },   // 2 at level 2, 2 more at level 10
  ranger: { level: 1, count: 1 }, // 1 at level 1 (Deft Explorer), 2 more at level 9
  rogue: { level: 1, count: 2 },  // 2 at level 1, 2 more at level 6
};

// ============ METAMAGIC OPTIONS (2024 PHB) ============

export interface MetamagicOption {
  id: string;
  name: string;
  description: string;
  cost: number | string; // Sorcery points cost (can be "1+" for variable costs)
}

export const METAMAGIC_OPTIONS: MetamagicOption[] = [
  {
    id: 'careful-spell',
    name: 'Careful Spell',
    description: 'When you cast a spell that forces other creatures to make a saving throw, you can protect some of those creatures. Spend 1 sorcery point and choose up to your CHA modifier creatures. Chosen creatures automatically succeed on their saving throws.',
    cost: 1,
  },
  {
    id: 'distant-spell',
    name: 'Distant Spell',
    description: 'When you cast a spell that has a range of 5 feet or greater, you can spend 1 sorcery point to double the range. When you cast a spell with a range of touch, you can spend 1 sorcery point to make the range 30 feet.',
    cost: 1,
  },
  {
    id: 'empowered-spell',
    name: 'Empowered Spell',
    description: 'When you roll damage for a spell, you can spend 1 sorcery point to reroll up to your CHA modifier damage dice. You must use the new rolls. You can use this even if you\'ve already used another Metamagic option.',
    cost: 1,
  },
  {
    id: 'extended-spell',
    name: 'Extended Spell',
    description: 'When you cast a spell that has a duration of 1 minute or longer, you can spend 1 sorcery point to double its duration, to a maximum of 24 hours.',
    cost: 1,
  },
  {
    id: 'heightened-spell',
    name: 'Heightened Spell',
    description: 'When you cast a spell that forces a creature to make a saving throw, you can spend 3 sorcery points to give one target disadvantage on its first saving throw against the spell.',
    cost: 3,
  },
  {
    id: 'quickened-spell',
    name: 'Quickened Spell',
    description: 'When you cast a spell that has a casting time of 1 action, you can spend 2 sorcery points to change the casting time to 1 bonus action for this casting.',
    cost: 2,
  },
  {
    id: 'seeking-spell',
    name: 'Seeking Spell',
    description: 'If you make an attack roll for a spell and miss, you can spend 2 sorcery points to reroll the d20. You must use the new roll. You can use this even if you\'ve already used another Metamagic option.',
    cost: 2,
  },
  {
    id: 'subtle-spell',
    name: 'Subtle Spell',
    description: 'When you cast a spell, you can spend 1 sorcery point to cast it without any somatic or verbal components.',
    cost: 1,
  },
  {
    id: 'transmuted-spell',
    name: 'Transmuted Spell',
    description: 'When you cast a spell that deals acid, cold, fire, lightning, poison, or thunder damage, you can spend 1 sorcery point to change that damage type to one of the other listed types.',
    cost: 1,
  },
  {
    id: 'twinned-spell',
    name: 'Twinned Spell',
    description: 'When you cast a spell that targets only one creature and doesn\'t have a range of self, you can spend sorcery points equal to the spell\'s level (1 for cantrips) to target a second creature with the same spell.',
    cost: '1+',
  },
];

// Get available metamagic options (all are available from level 2)
export function getAvailableMetamagic(): MetamagicOption[] {
  return METAMAGIC_OPTIONS;
}

// Skill to ability mapping
export const SKILL_ABILITIES: Record<SkillName, keyof AbilityScores> = {
  athletics: 'strength',
  acrobatics: 'dexterity',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',
  animalHandling: 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma',
};

// Skill display names
export const SKILL_NAMES: Record<SkillName, string> = {
  athletics: 'Athletics',
  acrobatics: 'Acrobatics',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  arcana: 'Arcana',
  history: 'History',
  investigation: 'Investigation',
  nature: 'Nature',
  religion: 'Religion',
  animalHandling: 'Animal Handling',
  insight: 'Insight',
  medicine: 'Medicine',
  perception: 'Perception',
  survival: 'Survival',
  deception: 'Deception',
  intimidation: 'Intimidation',
  performance: 'Performance',
  persuasion: 'Persuasion',
};

// All skills list
export const ALL_SKILLS: SkillName[] = [
  'athletics',
  'acrobatics',
  'sleightOfHand',
  'stealth',
  'arcana',
  'history',
  'investigation',
  'nature',
  'religion',
  'animalHandling',
  'insight',
  'medicine',
  'perception',
  'survival',
  'deception',
  'intimidation',
  'performance',
  'persuasion',
];

// Skill descriptions for character creation help
export const SKILL_DESCRIPTIONS: Record<SkillName, string> = {
  athletics: 'Climbing, jumping, swimming, and feats of physical strength',
  acrobatics: 'Balance, tumbling, aerial maneuvers, and staying on your feet',
  sleightOfHand: 'Pickpocketing, concealing objects, and manual trickery',
  stealth: 'Hiding, moving silently, and avoiding detection',
  arcana: 'Knowledge of spells, magic items, planes, and magical creatures',
  history: 'Recalling lore about historical events, people, and civilizations',
  investigation: 'Searching for clues, making deductions, and detailed examination',
  nature: 'Knowledge of terrain, plants, animals, and natural cycles',
  religion: 'Lore about deities, rites, prayers, and religious hierarchies',
  animalHandling: 'Calming, controlling, and understanding animal behavior',
  insight: 'Reading body language, detecting lies, and understanding intentions',
  medicine: 'Stabilizing the dying, diagnosing illness, and first aid',
  perception: 'Noticing threats, spotting hidden objects, and sensory awareness',
  survival: 'Tracking, hunting, navigating wilderness, and predicting weather',
  deception: 'Lying convincingly, disguising intent, and misleading others',
  intimidation: 'Threatening, coercing, and using fear to influence others',
  performance: 'Entertaining through music, dance, acting, or storytelling',
  persuasion: 'Influencing through tact, social graces, and good nature',
};

// Species display names
export const SPECIES_NAMES: Record<Species, string> = {
  aasimar: 'Aasimar',
  dragonborn: 'Dragonborn',
  dwarf: 'Dwarf',
  elf: 'Elf',
  gnome: 'Gnome',
  goliath: 'Goliath',
  halfling: 'Halfling',
  human: 'Human',
  orc: 'Orc',
  tiefling: 'Tiefling',
};

// Class display names
export const CLASS_NAMES: Record<CharacterClass, string> = {
  barbarian: 'Barbarian',
  bard: 'Bard',
  cleric: 'Cleric',
  druid: 'Druid',
  fighter: 'Fighter',
  monk: 'Monk',
  paladin: 'Paladin',
  ranger: 'Ranger',
  rogue: 'Rogue',
  sorcerer: 'Sorcerer',
  warlock: 'Warlock',
  wizard: 'Wizard',
};

// Ability score names
export const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

// Ability score abbreviations
export const ABILITY_ABBREVIATIONS: Record<keyof AbilityScores, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

// Proficiency bonus by level
export function getProficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

// Calculate ability modifier
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format modifier for display (+2, -1, etc.)
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// Calculate skill modifier
export function getSkillModifier(
  abilityScore: number,
  proficiency: ProficiencyLevel,
  proficiencyBonus: number
): number {
  const abilityMod = getAbilityModifier(abilityScore);
  switch (proficiency) {
    case 'expertise':
      return abilityMod + proficiencyBonus * 2;
    case 'proficient':
      return abilityMod + proficiencyBonus;
    default:
      return abilityMod;
  }
}

// Standard array for ability scores
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Point buy costs
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

// ============ 2024 BACKGROUNDS ============

// Origin Feat types
export type OriginFeatName = 'Alert' | 'Crafter' | 'Healer' | 'Lucky' | 'Magic Initiate (Cleric)' | 'Magic Initiate (Druid)' | 'Magic Initiate (Wizard)' | 'Musician' | 'Savage Attacker' | 'Skilled' | 'Tavern Brawler' | 'Tough';

// Origin Feat definitions
export interface OriginFeat {
  name: OriginFeatName;
  description: string;
  benefits: string[];
  // Optional choice fields for feats that grant selections
  cantripsFrom?: CharacterClass; // Which class's cantrip list to choose from
  cantripCount?: number;         // How many cantrips to choose
  spellsFrom?: CharacterClass;   // Which class's spell list to choose from
  spellCount?: number;           // How many spells to choose
  spellLevel?: number;           // What level spells (default 1)
  proficiencyChoices?: {
    type: 'artisan' | 'musical' | 'skill' | 'any';
    count: number;
  };
}

export const ORIGIN_FEATS: Record<OriginFeatName, OriginFeat> = {
  'Alert': {
    name: 'Alert',
    description: 'Always on the lookout for danger, you gain benefits that keep you alert.',
    benefits: [
      'Add your Proficiency Bonus to Initiative rolls',
      'You can swap Initiative with a willing ally (neither can be Incapacitated)',
    ],
  },
  'Crafter': {
    name: 'Crafter',
    description: 'You are adept at crafting items and bargaining for goods.',
    benefits: [
      'Gain proficiency with 3 Artisan\'s Tools of your choice',
      '20% discount when buying nonmagical items',
      'Fast Crafting: craft one item from the Fast Crafting table after a Long Rest',
    ],
    proficiencyChoices: { type: 'artisan', count: 3 },
  },
  'Healer': {
    name: 'Healer',
    description: 'You have the training and intuition to administer first aid and other care.',
    benefits: [
      'Battle Medic: Use Healer\'s Kit to let target spend one Hit Die + your Proficiency Bonus',
      'Reroll any 1s on healing dice from this feat or spells',
    ],
  },
  'Lucky': {
    name: 'Lucky',
    description: 'You have inexplicable luck that can kick in at just the right moment.',
    benefits: [
      'Luck Points equal to your Proficiency Bonus, regained on Long Rest',
      'Spend 1 point to give yourself Advantage on a D20 Test',
      'Spend 1 point to impose Disadvantage on an attack against you',
    ],
  },
  'Magic Initiate (Cleric)': {
    name: 'Magic Initiate (Cleric)',
    description: 'You have learned the basics of divine magic.',
    benefits: [
      'Learn 2 Cleric cantrips of your choice',
      'Learn 1 first-level Cleric spell (cast once per Long Rest free, or with spell slots)',
      'Choose INT, WIS, or CHA as your spellcasting ability',
    ],
    cantripsFrom: 'cleric',
    cantripCount: 2,
    spellsFrom: 'cleric',
    spellCount: 1,
    spellLevel: 1,
  },
  'Magic Initiate (Druid)': {
    name: 'Magic Initiate (Druid)',
    description: 'You have learned the basics of primal magic.',
    benefits: [
      'Learn 2 Druid cantrips of your choice',
      'Learn 1 first-level Druid spell (cast once per Long Rest free, or with spell slots)',
      'Choose INT, WIS, or CHA as your spellcasting ability',
    ],
    cantripsFrom: 'druid',
    cantripCount: 2,
    spellsFrom: 'druid',
    spellCount: 1,
    spellLevel: 1,
  },
  'Magic Initiate (Wizard)': {
    name: 'Magic Initiate (Wizard)',
    description: 'You have learned the basics of arcane magic.',
    benefits: [
      'Learn 2 Wizard cantrips of your choice',
      'Learn 1 first-level Wizard spell (cast once per Long Rest free, or with spell slots)',
      'Choose INT, WIS, or CHA as your spellcasting ability',
    ],
    cantripsFrom: 'wizard',
    cantripCount: 2,
    spellsFrom: 'wizard',
    spellCount: 1,
    spellLevel: 1,
  },
  'Musician': {
    name: 'Musician',
    description: 'You are a practiced musician with the ability to inspire allies.',
    benefits: [
      'Gain proficiency with 3 Musical Instruments of your choice',
      'After a Short or Long Rest, give Heroic Inspiration to allies equal to your Proficiency Bonus',
    ],
    proficiencyChoices: { type: 'musical', count: 3 },
  },
  'Savage Attacker': {
    name: 'Savage Attacker',
    description: 'You have trained to deal particularly damaging strikes.',
    benefits: [
      'Once per turn when you hit with a weapon or Unarmed Strike, roll damage twice and use either roll',
    ],
  },
  'Skilled': {
    name: 'Skilled',
    description: 'You have exceptionally broad learning.',
    benefits: [
      'Gain proficiency in any combination of 3 skills or tools of your choice',
    ],
    proficiencyChoices: { type: 'any', count: 3 },
  },
  'Tavern Brawler': {
    name: 'Tavern Brawler',
    description: 'You are accustomed to rough-and-tumble fighting.',
    benefits: [
      'Unarmed Strikes deal 1d4 + Strength modifier damage',
      'Reroll 1s on Unarmed Strike damage',
      'Proficiency with Improvised Weapons',
      'Once per turn on Unarmed Strike hit, push target 5 feet away',
    ],
  },
  'Tough': {
    name: 'Tough',
    description: 'You are more resilient than others.',
    benefits: [
      'HP maximum increases by 2 for each level you have',
      'Gain additional 2 HP each time you level up',
    ],
  },
};

// General Feats (can be taken at ASI levels instead of ability score increase)
export interface GeneralFeat {
  name: string;
  description: string;
  benefits: string[];
  prerequisites?: {
    level?: number;
    abilityScore?: { ability: keyof AbilityScores; minimum: number };
    proficiency?: string;
    spellcasting?: boolean;
    armorProficiency?: 'light' | 'medium' | 'heavy';
  };
  abilityBonus?: { ability: keyof AbilityScores | 'choice'; bonus: number };
}

export const GENERAL_FEATS: GeneralFeat[] = [
  {
    name: 'Actor',
    description: 'Skilled at mimicry and dramatics.',
    benefits: [
      'Increase Charisma by 1 (max 20)',
      'Advantage on Deception and Performance to disguise yourself',
      'Mimic speech or sounds of creatures you\'ve heard for 1+ minute',
    ],
    abilityBonus: { ability: 'charisma', bonus: 1 },
  },
  {
    name: 'Athlete',
    description: 'You have undergone extensive physical training.',
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Standing from prone uses only 5 feet of movement',
      'Climbing doesn\'t cost extra movement',
      'Running long/high jump needs only 5 feet movement',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Charger',
    description: 'You can charge headlong into battle.',
    benefits: [
      'If you move 10+ feet straight toward a target and hit with a melee attack, deal +1d8 damage',
      'After Dash action, make one melee attack or shove as bonus action',
    ],
  },
  {
    name: 'Crossbow Expert',
    description: 'Thanks to extensive practice, you are an expert with crossbows.',
    benefits: [
      'Ignore loading property of crossbows you\'re proficient with',
      'No disadvantage on ranged attacks within 5 feet of hostile creature',
      'When you attack with a one-handed weapon, use bonus action for hand crossbow attack',
    ],
  },
  {
    name: 'Crusher',
    description: 'You are practiced in bludgeoning attacks.',
    benefits: [
      'Increase Strength or Constitution by 1 (max 20)',
      'Once per turn, push target 5 feet when dealing bludgeoning damage',
      'Critical hits with bludgeoning grant advantage on attacks against target until end of your next turn',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Defensive Duelist',
    description: 'You are skilled at protecting yourself in melee.',
    prerequisites: { abilityScore: { ability: 'dexterity', minimum: 13 } },
    benefits: [
      'When wielding a finesse weapon and hit by melee attack, use reaction to add proficiency bonus to AC',
    ],
  },
  {
    name: 'Dual Wielder',
    description: 'You master fighting with two weapons.',
    benefits: [
      '+1 AC while wielding a melee weapon in each hand',
      'Use two-weapon fighting with non-light melee weapons',
      'Draw or stow two weapons when you would normally draw/stow one',
    ],
  },
  {
    name: 'Durable',
    description: 'Hardy and resilient.',
    benefits: [
      'Increase Constitution by 1 (max 20)',
      'When you roll a Hit Die to regain HP, minimum HP equals twice your CON modifier (minimum 2)',
    ],
    abilityBonus: { ability: 'constitution', bonus: 1 },
  },
  {
    name: 'Elemental Adept',
    description: 'You have mastered a damage type.',
    prerequisites: { spellcasting: true },
    benefits: [
      'Choose acid, cold, fire, lightning, or thunder',
      'Spells ignore resistance to that damage type',
      'Treat 1s on damage dice as 2s for that damage type',
    ],
  },
  {
    name: 'Fey Touched',
    description: 'Your exposure to the Feywild has changed you.',
    benefits: [
      'Increase Intelligence, Wisdom, or Charisma by 1 (max 20)',
      'Learn Misty Step and one 1st-level divination or enchantment spell',
      'Cast each once per long rest free, or with spell slots',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Fighting Initiate',
    description: 'Your martial training includes techniques of various fighting styles.',
    prerequisites: { proficiency: 'martial weapons' },
    benefits: [
      'Learn one Fighting Style from the Fighter class',
      'Can replace this Fighting Style when you gain an ASI',
    ],
  },
  {
    name: 'Grappler',
    description: 'You developed skills to grapple and pin opponents.',
    prerequisites: { abilityScore: { ability: 'strength', minimum: 13 } },
    benefits: [
      'Advantage on attacks against creatures you are grappling',
      'Can use action to pin a grappled creature (both restrained)',
    ],
  },
  {
    name: 'Great Weapon Master',
    description: 'You\'ve learned to maximize heavy weapons.',
    benefits: [
      'On your turn, before attacking with a heavy weapon, take -5 to hit for +10 damage',
      'When you score a critical hit or reduce a creature to 0 HP, make one melee attack as bonus action',
    ],
  },
  {
    name: 'Heavily Armored',
    description: 'You have trained to master heavy armor.',
    prerequisites: { armorProficiency: 'medium' },
    benefits: [
      'Increase Strength by 1 (max 20)',
      'Gain proficiency with heavy armor',
    ],
    abilityBonus: { ability: 'strength', bonus: 1 },
  },
  {
    name: 'Heavy Armor Master',
    description: 'You can shrug off strikes that would devastate others.',
    prerequisites: { armorProficiency: 'heavy' },
    benefits: [
      'Increase Strength by 1 (max 20)',
      'While wearing heavy armor, reduce bludgeoning/piercing/slashing damage by 3',
    ],
    abilityBonus: { ability: 'strength', bonus: 1 },
  },
  {
    name: 'Inspiring Leader',
    description: 'You can spend 10 minutes inspiring companions.',
    prerequisites: { abilityScore: { ability: 'charisma', minimum: 13 } },
    benefits: [
      'Grant up to 6 creatures temp HP equal to your level + CHA modifier',
      'Creatures must be able to see/hear you and understand you',
      'Each creature can only benefit once per short or long rest',
    ],
  },
  {
    name: 'Keen Mind',
    description: 'You have a mind that can track time, direction, and detail.',
    benefits: [
      'Increase Intelligence by 1 (max 20)',
      'Always know which way is north',
      'Always know hours until next sunrise/sunset',
      'Accurately recall anything seen/heard within past month',
    ],
    abilityBonus: { ability: 'intelligence', bonus: 1 },
  },
  {
    name: 'Lightly Armored',
    description: 'You have trained to master light armor.',
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Gain proficiency with light armor',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Mage Slayer',
    description: 'You have practiced techniques for fighting spellcasters.',
    benefits: [
      'When creature within 5 feet casts spell, use reaction to make melee attack',
      'When you damage a concentrating creature, they have disadvantage on the save',
      'Advantage on saves against spells cast by creatures within 5 feet',
    ],
  },
  {
    name: 'Medium Armor Master',
    description: 'You have practiced moving in medium armor.',
    prerequisites: { armorProficiency: 'medium' },
    benefits: [
      'Medium armor doesn\'t impose disadvantage on Stealth',
      'Add 3 (instead of 2) from Dex modifier to AC in medium armor',
    ],
  },
  {
    name: 'Moderately Armored',
    description: 'You have trained to master medium armor and shields.',
    prerequisites: { armorProficiency: 'light' },
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Gain proficiency with medium armor and shields',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Mounted Combatant',
    description: 'You are a dangerous foe while mounted.',
    benefits: [
      'Advantage on melee attacks against unmounted creatures smaller than mount',
      'Force attacks targeting mount to target you instead',
      'If mount is subjected to Dex save for half damage, it takes none on success and half on fail',
    ],
  },
  {
    name: 'Observant',
    description: 'Quick to notice details of your environment.',
    benefits: [
      'Increase Intelligence or Wisdom by 1 (max 20)',
      '+5 to passive Perception and Investigation',
      'Can read lips if you can see creature\'s mouth and understand language',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Piercer',
    description: 'You are practiced in piercing attacks.',
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Once per turn, reroll one piercing damage die',
      'Critical hits with piercing add one extra damage die',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Polearm Master',
    description: 'You keep enemies at bay with reach weapons.',
    benefits: [
      'When you Attack with glaive/halberd/quarterstaff/spear, bonus action attack with opposite end (1d4 bludgeoning)',
      'Creatures provoke opportunity attack when entering your reach',
    ],
  },
  {
    name: 'Resilient',
    description: 'Choose an ability score. You gain proficiency in saves using that ability.',
    benefits: [
      'Increase chosen ability by 1 (max 20)',
      'Gain proficiency in saving throws using that ability',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Ritual Caster',
    description: 'You have learned rituals from a spellcasting class.',
    prerequisites: { abilityScore: { ability: 'intelligence', minimum: 13 } },
    benefits: [
      'Choose Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard',
      'Acquire ritual book with two 1st-level ritual spells from that class',
      'Can cast those spells as rituals (add 10 minutes to casting time)',
      'Can add more ritual spells you find to the book',
    ],
  },
  {
    name: 'Sentinel',
    description: 'You have mastered techniques to defend your position.',
    benefits: [
      'Creatures you hit with opportunity attacks have speed reduced to 0',
      'Creatures don\'t escape your opportunity attacks by Disengaging',
      'When creature within 5 feet attacks someone other than you, use reaction to make melee attack',
    ],
  },
  {
    name: 'Shadow Touched',
    description: 'Your exposure to the Shadowfell has changed you.',
    benefits: [
      'Increase Intelligence, Wisdom, or Charisma by 1 (max 20)',
      'Learn Invisibility and one 1st-level illusion or necromancy spell',
      'Cast each once per long rest free, or with spell slots',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Sharpshooter',
    description: 'You have mastered ranged weapons.',
    benefits: [
      'Attacking at long range doesn\'t impose disadvantage',
      'Ranged attacks ignore half and three-quarters cover',
      'Before attacking with ranged weapon, take -5 to hit for +10 damage',
    ],
  },
  {
    name: 'Shield Master',
    description: 'You use shields for offense and defense.',
    benefits: [
      'If you Attack, use bonus action to shove with shield',
      'Add shield\'s AC bonus to Dex saves against spells/effects that target only you',
      'If Dex save for half damage, use reaction to take no damage on success',
    ],
  },
  {
    name: 'Skill Expert',
    description: 'You have honed your proficiency with particular skills.',
    benefits: [
      'Increase one ability score by 1 (max 20)',
      'Gain proficiency in one skill of your choice',
      'Choose one skill you\'re proficient in; gain expertise (double proficiency)',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Skulker',
    description: 'You are expert at slinking through shadows.',
    prerequisites: { abilityScore: { ability: 'dexterity', minimum: 13 } },
    benefits: [
      'Can try to hide when lightly obscured',
      'Missing with ranged attack doesn\'t reveal your position',
      'Dim light doesn\'t impose disadvantage on Perception checks',
    ],
  },
  {
    name: 'Slasher',
    description: 'You are practiced in slashing attacks.',
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Once per turn, reduce target\'s speed by 10 feet until start of your next turn',
      'Critical hits with slashing cause target to have disadvantage on attacks until start of your next turn',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Speedy',
    description: 'You are exceptionally quick.',
    benefits: [
      'Speed increases by 10 feet',
      'Difficult terrain doesn\'t cost extra movement when you Dash',
      'Opportunity attacks have disadvantage against you',
    ],
  },
  {
    name: 'Spell Sniper',
    description: 'You have learned techniques to enhance ranged spell attacks.',
    prerequisites: { spellcasting: true },
    benefits: [
      'Attack roll spell range is doubled',
      'Ranged spell attacks ignore half and three-quarters cover',
      'Learn one cantrip that requires an attack roll (Cleric, Druid, Sorcerer, Warlock, or Wizard list)',
    ],
  },
  {
    name: 'Telekinetic',
    description: 'You can move things with your mind.',
    benefits: [
      'Increase Intelligence, Wisdom, or Charisma by 1 (max 20)',
      'Learn Mage Hand; it\'s invisible and can be cast without components',
      'Bonus action to shove creature within 30 feet (STR save or move 5 feet)',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'Telepathic',
    description: 'You can communicate telepathically.',
    benefits: [
      'Increase Intelligence, Wisdom, or Charisma by 1 (max 20)',
      'Speak telepathically to creatures within 60 feet',
      'Cast Detect Thoughts once per long rest without components',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
  {
    name: 'War Caster',
    description: 'You have practiced casting spells in combat.',
    prerequisites: { spellcasting: true },
    benefits: [
      'Advantage on CON saves to maintain concentration',
      'Perform somatic components with hands full of weapons/shield',
      'Cast a spell as opportunity attack instead of melee attack',
    ],
  },
  {
    name: 'Weapon Master',
    description: 'You have practiced extensively with weapons.',
    benefits: [
      'Increase Strength or Dexterity by 1 (max 20)',
      'Gain proficiency with 4 weapons of your choice',
    ],
    abilityBonus: { ability: 'choice', bonus: 1 },
  },
];

// Tool proficiency types
export type ToolProficiency =
  | 'Alchemist\'s Supplies' | 'Brewer\'s Supplies' | 'Calligrapher\'s Supplies' | 'Carpenter\'s Tools'
  | 'Cartographer\'s Tools' | 'Cobbler\'s Tools' | 'Cook\'s Utensils' | 'Glassblower\'s Tools'
  | 'Jeweler\'s Tools' | 'Leatherworker\'s Tools' | 'Mason\'s Tools' | 'Painter\'s Supplies'
  | 'Potter\'s Tools' | 'Smith\'s Tools' | 'Tinker\'s Tools' | 'Weaver\'s Tools' | 'Woodcarver\'s Tools'
  | 'Disguise Kit' | 'Forgery Kit' | 'Gaming Set' | 'Herbalism Kit' | 'Musical Instrument'
  | 'Navigator\'s Tools' | 'Thieves\' Tools' | 'Poisoner\'s Kit';

// Artisan's Tools list for Crafter feat
export const ARTISAN_TOOLS: string[] = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools",
  "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools",
  "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
];

// Musical Instruments list for Musician feat
export const MUSICAL_INSTRUMENTS: string[] = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Horn", "Lute", "Lyre", "Pan Flute",
  "Shawm", "Viol",
];

// 2024 Background definition
export interface Background2024 {
  name: string;
  description: string;
  abilityScores: (keyof AbilityScores)[]; // The 3 ability scores to choose from
  skillProficiencies: SkillName[];
  toolProficiency: ToolProficiency;
  originFeat: OriginFeatName;
  equipment: string[];
  gold: number;
}

// All 16 2024 PHB Backgrounds
export const BACKGROUNDS_2024: Record<string, Background2024> = {
  'Acolyte': {
    name: 'Acolyte',
    description: 'You devoted yourself to service in a temple, either nestled in a town or secluded in a sacred grove.',
    abilityScores: ['intelligence', 'wisdom', 'charisma'],
    skillProficiencies: ['insight', 'religion'],
    toolProficiency: 'Calligrapher\'s Supplies',
    originFeat: 'Magic Initiate (Cleric)',
    equipment: ['Book (prayers)', 'Calligrapher\'s Supplies', 'Holy Symbol', 'Parchment (10)', 'Robe'],
    gold: 8,
  },
  'Artisan': {
    name: 'Artisan',
    description: 'You began mopping floors and running errands in an artisan\'s workshop for a few coppers per day.',
    abilityScores: ['strength', 'dexterity', 'intelligence'],
    skillProficiencies: ['investigation', 'persuasion'],
    toolProficiency: 'Carpenter\'s Tools',
    originFeat: 'Crafter',
    equipment: ['Artisan\'s Tools (one of your choice)', 'Traveler\'s Clothes', 'Pouch (2)'],
    gold: 32,
  },
  'Charlatan': {
    name: 'Charlatan',
    description: 'Once you were old enough to order an ale, you soon had a favorite stool in every tavern.',
    abilityScores: ['dexterity', 'constitution', 'charisma'],
    skillProficiencies: ['deception', 'sleightOfHand'],
    toolProficiency: 'Forgery Kit',
    originFeat: 'Skilled',
    equipment: ['Costume', 'Fine Clothes', 'Forgery Kit'],
    gold: 15,
  },
  'Criminal': {
    name: 'Criminal',
    description: 'You eked out a living in dark alleyways, cutting purses or burgling shops.',
    abilityScores: ['dexterity', 'constitution', 'intelligence'],
    skillProficiencies: ['sleightOfHand', 'stealth'],
    toolProficiency: 'Thieves\' Tools',
    originFeat: 'Alert',
    equipment: ['Crowbar', 'Dagger (2)', 'Pouch', 'Thieves\' Tools', 'Traveler\'s Clothes'],
    gold: 16,
  },
  'Entertainer': {
    name: 'Entertainer',
    description: 'You spent much of your youth following minstrels and acrobats, learning to perform.',
    abilityScores: ['strength', 'dexterity', 'charisma'],
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiency: 'Musical Instrument',
    originFeat: 'Musician',
    equipment: ['Costume (2)', 'Mirror', 'Musical Instrument (one of your choice)', 'Perfume', 'Traveler\'s Clothes'],
    gold: 11,
  },
  'Farmer': {
    name: 'Farmer',
    description: 'You grew up working the land, planting and harvesting crops.',
    abilityScores: ['strength', 'constitution', 'wisdom'],
    skillProficiencies: ['animalHandling', 'nature'],
    toolProficiency: 'Carpenter\'s Tools',
    originFeat: 'Tough',
    equipment: ['Healer\'s Kit', 'Iron Pot', 'Shovel', 'Sickle', 'Traveler\'s Clothes'],
    gold: 30,
  },
  'Guard': {
    name: 'Guard',
    description: 'You served as an enforcer of law, either for the local authorities or a private security force.',
    abilityScores: ['strength', 'intelligence', 'wisdom'],
    skillProficiencies: ['athletics', 'perception'],
    toolProficiency: 'Gaming Set',
    originFeat: 'Alert',
    equipment: ['Gaming Set (one of your choice)', 'Hooded Lantern', 'Manacles', 'Quiver', 'Shortbow', 'Arrows (20)', 'Spear', 'Traveler\'s Clothes'],
    gold: 12,
  },
  'Guide': {
    name: 'Guide',
    description: 'You came of age outdoors, far from settled lands, learning the ways of wild places.',
    abilityScores: ['dexterity', 'constitution', 'wisdom'],
    skillProficiencies: ['stealth', 'survival'],
    toolProficiency: 'Cartographer\'s Tools',
    originFeat: 'Magic Initiate (Druid)',
    equipment: ['Bedroll', 'Cartographer\'s Tools', 'Quarterstaff', 'Tent', 'Traveler\'s Clothes'],
    gold: 3,
  },
  'Hermit': {
    name: 'Hermit',
    description: 'You spent a formative part of your life in seclusion, apart from the rest of the world.',
    abilityScores: ['intelligence', 'wisdom', 'charisma'],
    skillProficiencies: ['medicine', 'religion'],
    toolProficiency: 'Herbalism Kit',
    originFeat: 'Healer',
    equipment: ['Bedroll', 'Book (philosophy)', 'Herbalism Kit', 'Lamp', 'Oil (3 flasks)', 'Traveler\'s Clothes'],
    gold: 16,
  },
  'Merchant': {
    name: 'Merchant',
    description: 'You were apprenticed to a merchant, learning the art of buying and selling.',
    abilityScores: ['constitution', 'intelligence', 'charisma'],
    skillProficiencies: ['animalHandling', 'persuasion'],
    toolProficiency: 'Navigator\'s Tools',
    originFeat: 'Lucky',
    equipment: ['Navigator\'s Tools', 'Traveler\'s Clothes'],
    gold: 22,
  },
  'Noble': {
    name: 'Noble',
    description: 'You were raised in a castle, surrounded by wealth, power, and privilege.',
    abilityScores: ['strength', 'intelligence', 'charisma'],
    skillProficiencies: ['history', 'persuasion'],
    toolProficiency: 'Gaming Set',
    originFeat: 'Skilled',
    equipment: ['Fine Clothes', 'Gaming Set (one of your choice)', 'Perfume', 'Signet Ring'],
    gold: 29,
  },
  'Sage': {
    name: 'Sage',
    description: 'You spent your formative years traveling between manors and keeps, studying under various masters.',
    abilityScores: ['constitution', 'intelligence', 'wisdom'],
    skillProficiencies: ['arcana', 'history'],
    toolProficiency: 'Calligrapher\'s Supplies',
    originFeat: 'Magic Initiate (Wizard)',
    equipment: ['Book (history)', 'Calligrapher\'s Supplies', 'Parchment (8)', 'Quarterstaff', 'Robe'],
    gold: 8,
  },
  'Sailor': {
    name: 'Sailor',
    description: 'You lived as a seafarer, working on ships from a young age.',
    abilityScores: ['strength', 'dexterity', 'wisdom'],
    skillProficiencies: ['acrobatics', 'perception'],
    toolProficiency: 'Navigator\'s Tools',
    originFeat: 'Tavern Brawler',
    equipment: ['Dagger', 'Navigator\'s Tools', 'Rope (50 ft)', 'Traveler\'s Clothes'],
    gold: 20,
  },
  'Scribe': {
    name: 'Scribe',
    description: 'You spent formative years in a scriptorium or monastery, copying texts.',
    abilityScores: ['dexterity', 'intelligence', 'wisdom'],
    skillProficiencies: ['investigation', 'perception'],
    toolProficiency: 'Calligrapher\'s Supplies',
    originFeat: 'Skilled',
    equipment: ['Calligrapher\'s Supplies', 'Fine Clothes', 'Lamp', 'Oil (3 flasks)', 'Parchment (12)', 'Ink', 'Ink Pen'],
    gold: 23,
  },
  'Soldier': {
    name: 'Soldier',
    description: 'You spent your early years in a military structure, training for combat.',
    abilityScores: ['strength', 'dexterity', 'constitution'],
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiency: 'Gaming Set',
    originFeat: 'Savage Attacker',
    equipment: ['Arrow (20)', 'Gaming Set (one of your choice)', 'Healer\'s Kit', 'Quiver', 'Shortbow', 'Spear', 'Traveler\'s Clothes'],
    gold: 14,
  },
  'Wayfarer': {
    name: 'Wayfarer',
    description: 'You grew up on the road, traveling from town to town, never settling in one place.',
    abilityScores: ['dexterity', 'wisdom', 'charisma'],
    skillProficiencies: ['insight', 'stealth'],
    toolProficiency: 'Thieves\' Tools',
    originFeat: 'Lucky',
    equipment: ['Bedroll', 'Dagger (2)', 'Healer\'s Kit', 'Thieves\' Tools', 'Traveler\'s Clothes', 'Waterskin'],
    gold: 16,
  },
};

// Background names list (for dropdowns)
export const BACKGROUNDS = Object.keys(BACKGROUNDS_2024);

// Alignment options
export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
];

// Default skill proficiencies (all none)
export function getDefaultSkillProficiencies(): Record<SkillName, ProficiencyLevel> {
  return {
    athletics: 'none',
    acrobatics: 'none',
    sleightOfHand: 'none',
    stealth: 'none',
    arcana: 'none',
    history: 'none',
    investigation: 'none',
    nature: 'none',
    religion: 'none',
    animalHandling: 'none',
    insight: 'none',
    medicine: 'none',
    perception: 'none',
    survival: 'none',
    deception: 'none',
    intimidation: 'none',
    performance: 'none',
    persuasion: 'none',
  };
}

// Species base speed
export const SPECIES_SPEED: Record<Species, number> = {
  aasimar: 30,
  dragonborn: 30,
  dwarf: 25,
  elf: 30,
  gnome: 30,
  goliath: 35,
  halfling: 30,
  human: 30,
  orc: 30,
  tiefling: 30,
};

// ============ LANGUAGES (2024) ============

// Standard Languages (accessible to all)
export const STANDARD_LANGUAGES = [
  'Common',
  'Common Sign Language',
  'Draconic',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
];

// Rare Languages (require special background or DM permission)
export const RARE_LANGUAGES = [
  'Abyssal',
  'Celestial',
  'Deep Speech',
  'Druidic',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Thieves\' Cant',
  'Undercommon',
];

export const ALL_LANGUAGES = [...STANDARD_LANGUAGES, ...RARE_LANGUAGES];

// Legacy exports for compatibility
export const COMMON_LANGUAGES = STANDARD_LANGUAGES;
export const EXOTIC_LANGUAGES = RARE_LANGUAGES;

// Suggested languages by species
export const SPECIES_SUGGESTED_LANGUAGES: Record<Species, string[]> = {
  aasimar: ['Celestial'],
  dragonborn: ['Draconic'],
  dwarf: ['Dwarvish'],
  elf: ['Elvish'],
  gnome: ['Gnomish'],
  goliath: ['Giant'],
  halfling: ['Halfling'],
  human: [], // Humans can pick any
  orc: ['Orc'],
  tiefling: ['Infernal'],
};

// ============ SPECIES TRAITS (2024) ============

export type DamageType = 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant' | 'slashing' | 'thunder';
export type Condition = 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious' | 'exhaustion';

// Species ancestry/heritage choices
export interface SpeciesChoiceOption {
  id: string;
  name: string;
  description: string;
  damageType?: DamageType;  // For Dragonborn breath weapon/resistance
  breathShape?: '15-ft cone' | '30-ft line';  // For Dragonborn
}

export interface SpeciesChoice {
  id: string;
  name: string;
  description: string;
  options: SpeciesChoiceOption[];
}

// Dragonborn Draconic Ancestry options
export const DRAGONBORN_ANCESTRY: SpeciesChoice = {
  id: 'draconic-ancestry',
  name: 'Draconic Ancestry',
  description: 'Choose your dragon ancestor. This determines your breath weapon damage type, save type, and resistance.',
  options: [
    { id: 'black', name: 'Black Dragon', description: 'Acid damage, 30-ft line, Dexterity save', damageType: 'acid', breathShape: '30-ft line' },
    { id: 'blue', name: 'Blue Dragon', description: 'Lightning damage, 30-ft line, Dexterity save', damageType: 'lightning', breathShape: '30-ft line' },
    { id: 'brass', name: 'Brass Dragon', description: 'Fire damage, 30-ft line, Dexterity save', damageType: 'fire', breathShape: '30-ft line' },
    { id: 'bronze', name: 'Bronze Dragon', description: 'Lightning damage, 30-ft line, Dexterity save', damageType: 'lightning', breathShape: '30-ft line' },
    { id: 'copper', name: 'Copper Dragon', description: 'Acid damage, 30-ft line, Dexterity save', damageType: 'acid', breathShape: '30-ft line' },
    { id: 'gold', name: 'Gold Dragon', description: 'Fire damage, 15-ft cone, Dexterity save', damageType: 'fire', breathShape: '15-ft cone' },
    { id: 'green', name: 'Green Dragon', description: 'Poison damage, 15-ft cone, Constitution save', damageType: 'poison', breathShape: '15-ft cone' },
    { id: 'red', name: 'Red Dragon', description: 'Fire damage, 15-ft cone, Dexterity save', damageType: 'fire', breathShape: '15-ft cone' },
    { id: 'silver', name: 'Silver Dragon', description: 'Cold damage, 15-ft cone, Constitution save', damageType: 'cold', breathShape: '15-ft cone' },
    { id: 'white', name: 'White Dragon', description: 'Cold damage, 15-ft cone, Constitution save', damageType: 'cold', breathShape: '15-ft cone' },
  ],
};

// Goliath Giant Ancestry options (2024 PHB)
export const GOLIATH_ANCESTRY: SpeciesChoice = {
  id: 'giant-ancestry',
  name: 'Giant Ancestry',
  description: 'Choose your giant ancestor. This grants you a special ability usable Proficiency Bonus times per Long Rest.',
  options: [
    { id: 'cloud', name: 'Cloud Giant', description: 'Bonus action to become Invisible until start of next turn or until you attack/cast spell' },
    { id: 'fire', name: 'Fire Giant', description: 'When you hit with an attack, deal extra 1d10 fire damage' },
    { id: 'frost', name: 'Frost Giant', description: 'When you take damage, use reaction to reduce it by 1d12 + Constitution modifier' },
    { id: 'hill', name: 'Hill Giant', description: 'Bonus action to knock target prone when you hit with attack (Strength save DC 8 + STR + Prof)' },
    { id: 'stone', name: 'Stone Giant', description: 'When you take damage, use reaction to gain +1d10 temp HP until start of next turn' },
    { id: 'storm', name: 'Storm Giant', description: 'Reaction when hit: deal 1d8 lightning damage to attacker within 60 feet' },
  ],
};

// Aasimar Celestial Revelation (2024 PHB)
export const AASIMAR_REVELATION: SpeciesChoice = {
  id: 'celestial-revelation',
  name: 'Celestial Revelation',
  description: 'Choose your celestial revelation form. At 3rd level, you can transform for 1 minute as a bonus action.',
  options: [
    { id: 'heavenly-wings', name: 'Heavenly Wings', description: 'Sprout spectral wings, fly speed equal to walking speed. Deal extra radiant damage equal to proficiency bonus once per turn.' },
    { id: 'inner-radiance', name: 'Inner Radiance', description: 'Shed bright light in 10 ft radius. At end of each of your turns, deal radiant damage equal to proficiency bonus to one creature within 10 ft.' },
    { id: 'necrotic-shroud', name: 'Necrotic Shroud', description: 'Eyes become pools of darkness. Creatures within 10 ft must succeed on CHA save or be frightened. Deal extra necrotic damage equal to proficiency bonus once per turn.' },
  ],
};

// Elf Lineage (2024 PHB)
export const ELF_LINEAGE: SpeciesChoice = {
  id: 'elf-lineage',
  name: 'Elven Lineage',
  description: 'Choose your elven lineage. This determines additional traits and abilities.',
  options: [
    { id: 'high-elf', name: 'High Elf', description: 'You know one cantrip of your choice from the Wizard spell list. Intelligence is your spellcasting ability for it.' },
    { id: 'wood-elf', name: 'Wood Elf', description: 'Your walking speed increases to 35 feet. You can attempt to hide when lightly obscured by natural phenomena.' },
    { id: 'drow', name: 'Dark Elf (Drow)', description: 'Superior Darkvision (120 ft). You know the Dancing Lights cantrip. At 3rd level, Faerie Fire. At 5th level, Darkness.' },
  ],
};

// Gnome Lineage (2024 PHB)
export const GNOME_LINEAGE: SpeciesChoice = {
  id: 'gnome-lineage',
  name: 'Gnomish Lineage',
  description: 'Choose your gnomish lineage. This determines additional traits and abilities.',
  options: [
    { id: 'forest-gnome', name: 'Forest Gnome', description: 'You know the Minor Illusion cantrip. You can speak with Small beasts.' },
    { id: 'rock-gnome', name: 'Rock Gnome', description: 'You have proficiency with Tinker\'s Tools. You can create Tiny clockwork devices.' },
  ],
};

// Tiefling Fiendish Legacy (2024 PHB)
export const TIEFLING_LEGACY: SpeciesChoice = {
  id: 'fiendish-legacy',
  name: 'Fiendish Legacy',
  description: 'Choose your fiendish legacy. This determines your damage resistance and innate spells.',
  options: [
    { id: 'abyssal', name: 'Abyssal', description: 'Poison resistance. Know Poison Spray cantrip. At 3rd level: Ray of Sickness. At 5th level: Hold Person.' },
    { id: 'chthonic', name: 'Chthonic', description: 'Necrotic resistance. Know Chill Touch cantrip. At 3rd level: False Life. At 5th level: Ray of Enfeeblement.' },
    { id: 'infernal', name: 'Infernal', description: 'Fire resistance. Know Thaumaturgy cantrip. At 3rd level: Hellish Rebuke. At 5th level: Darkness.' },
  ],
};

// Halfling Subspecies (2024 PHB)
export const HALFLING_TYPE: SpeciesChoice = {
  id: 'halfling-type',
  name: 'Halfling Type',
  description: 'Choose your halfling type. This determines additional traits.',
  options: [
    { id: 'lightfoot', name: 'Lightfoot', description: 'You can hide behind a creature at least one size larger than you.' },
    { id: 'stout', name: 'Stout', description: 'Resistance to poison damage and advantage on saves against poison.' },
  ],
};

// High Elf cantrip options (wizard cantrips available to High Elves)
export const HIGH_ELF_CANTRIPS: string[] = [
  'Acid Splash', 'Blade Ward', 'Booming Blade', 'Chill Touch', 'Control Flames',
  'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite',
  'Green-Flame Blade', 'Gust', 'Infestation', 'Light', 'Lightning Lure',
  'Mage Hand', 'Mending', 'Message', 'Mind Sliver', 'Minor Illusion',
  'Mold Earth', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
  'Shape Water', 'Shocking Grasp', 'Sword Burst', 'Thunderclap', 'Toll the Dead', 'True Strike'
];

// Map species to their choices
export const SPECIES_CHOICES: Partial<Record<Species, SpeciesChoice>> = {
  dragonborn: DRAGONBORN_ANCESTRY,
  goliath: GOLIATH_ANCESTRY,
  aasimar: AASIMAR_REVELATION,
  elf: ELF_LINEAGE,
  gnome: GNOME_LINEAGE,
  tiefling: TIEFLING_LEGACY,
  halfling: HALFLING_TYPE,
};

export interface SpeciesTraits {
  darkvision: number; // 0 if none, otherwise distance in feet
  resistances: DamageType[];
  conditionAdvantages: Condition[]; // Advantage on saves against these conditions
  immunities: (DamageType | Condition)[];
  speed: number;
  size: 'Small' | 'Medium';
  features: {
    name: string;
    description: string;
    level?: number; // Level when gained, 1 if not specified
  }[];
  cantrips?: string[]; // Innate cantrips
  spellsAtLevel?: { level: number; spell: string }[]; // Spells gained at certain levels
  skillProficiencies?: SkillName[];
  bonusHP?: number; // Per level (e.g., Dwarf Toughness)
}

export const SPECIES_TRAITS: Record<Species, SpeciesTraits> = {
  aasimar: {
    darkvision: 60,
    resistances: ['necrotic', 'radiant'],
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Medium',
    features: [
      { name: 'Celestial Resistance', description: 'Resistance to necrotic and radiant damage' },
      { name: 'Healing Hands', description: 'Touch to heal HP equal to Proficiency Bonus, once per Long Rest' },
      { name: 'Light Bearer', description: 'You know the Light cantrip' },
      { name: 'Celestial Revelation', description: 'Transform for 1 minute, gaining benefits based on form (Heavenly Wings, Inner Radiance, or Necrotic Shroud)', level: 3 },
    ],
    cantrips: ['Light'],
  },
  dragonborn: {
    darkvision: 60,
    resistances: [], // Depends on ancestry, handled separately
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Medium',
    features: [
      { name: 'Draconic Ancestry', description: 'Choose a dragon type for breath weapon and resistance' },
      { name: 'Breath Weapon', description: '15-ft cone or 30-ft line, 1d10 damage (scales with level), Dex save for half' },
      { name: 'Damage Resistance', description: 'Resistance to damage type of your ancestry' },
      { name: 'Draconic Flight', description: 'Bonus action to sprout spectral wings, fly speed equals walking speed, lasts 10 minutes', level: 5 },
    ],
  },
  dwarf: {
    darkvision: 120,
    resistances: ['poison'],
    conditionAdvantages: ['poisoned'],
    immunities: [],
    speed: 30, // 2024 rules: 30ft, not reduced by heavy armor
    size: 'Medium',
    features: [
      { name: 'Dwarven Resilience', description: 'Resistance to poison damage and advantage on saves vs poisoned' },
      { name: 'Dwarven Toughness', description: 'HP max increases by 1, and by 1 each level' },
      { name: 'Stonecunning', description: 'Tremorsense 60 ft for 10 minutes as bonus action while touching stone' },
    ],
    bonusHP: 1,
  },
  elf: {
    darkvision: 60, // Drow get 120
    resistances: [],
    conditionAdvantages: ['charmed'],
    immunities: [],
    speed: 30, // Wood elf gets 35
    size: 'Medium',
    features: [
      { name: 'Fey Ancestry', description: 'Advantage on saves vs charmed, magic can\'t put you to sleep' },
      { name: 'Keen Senses', description: 'Proficiency in Perception' },
      { name: 'Trance', description: '4 hours of trance equals 8 hours of sleep' },
      { name: 'Elven Lineage', description: 'Choose High Elf, Wood Elf, or Drow for additional traits' },
    ],
    skillProficiencies: ['perception'],
  },
  gnome: {
    darkvision: 60,
    resistances: [],
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Small',
    features: [
      { name: 'Gnomish Cunning', description: 'Advantage on INT, WIS, CHA saving throws' },
      { name: 'Gnomish Lineage', description: 'Choose Forest Gnome or Rock Gnome for additional traits' },
    ],
  },
  goliath: {
    darkvision: 0,
    resistances: [],
    conditionAdvantages: [],
    immunities: [],
    speed: 35,
    size: 'Medium',
    features: [
      { name: 'Giant Ancestry', description: 'Choose Cloud, Fire, Frost, Hill, Stone, or Storm giant ancestry for a special ability' },
      { name: 'Large Form', description: 'Become Large for 10 minutes, advantage on STR checks, +10 speed', level: 5 },
      { name: 'Powerful Build', description: 'Count as one size larger for carrying capacity' },
    ],
  },
  halfling: {
    darkvision: 0,
    resistances: [],
    conditionAdvantages: ['frightened'],
    immunities: [],
    speed: 30,
    size: 'Small',
    features: [
      { name: 'Brave', description: 'Advantage on saves against frightened' },
      { name: 'Halfling Nimbleness', description: 'Move through space of creatures one size larger' },
      { name: 'Lucky', description: 'Reroll 1s on d20 Tests' },
      { name: 'Naturally Stealthy', description: 'Hide behind creatures at least Medium size' },
    ],
  },
  human: {
    darkvision: 0,
    resistances: [],
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Medium',
    features: [
      { name: 'Resourceful', description: 'Gain Heroic Inspiration after each Long Rest' },
      { name: 'Skillful', description: 'Gain proficiency in one skill of your choice' },
      { name: 'Versatile', description: 'Gain an Origin feat of your choice' },
    ],
  },
  orc: {
    darkvision: 120,
    resistances: [],
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Medium',
    features: [
      { name: 'Adrenaline Rush', description: 'Bonus action Dash and gain temp HP equal to Proficiency Bonus, uses = Prof Bonus per Long Rest' },
      { name: 'Relentless Endurance', description: 'Drop to 1 HP instead of 0 once per Long Rest' },
    ],
  },
  tiefling: {
    darkvision: 60,
    resistances: [], // Depends on legacy
    conditionAdvantages: [],
    immunities: [],
    speed: 30,
    size: 'Medium',
    features: [
      { name: 'Otherworldly Presence', description: 'You know the Thaumaturgy cantrip' },
      { name: 'Fiendish Legacy', description: 'Choose Abyssal (poison), Chthonic (necrotic), or Infernal (fire) for resistance and spells' },
    ],
    cantrips: ['Thaumaturgy'],
  },
};

// Species descriptions and subspecies
export const SPECIES_INFO: Record<Species, { description: string; traits: string[]; subspecies?: { name: string; description: string }[] }> = {
  aasimar: {
    description: 'Aasimar bear within their souls the light of the heavens, descended from humans touched by celestial power.',
    traits: ['Celestial Resistance (radiant/necrotic)', 'Darkvision 60ft', 'Healing Hands', 'Light Bearer cantrip'],
    subspecies: [
      { name: 'Protector', description: 'Radiant Soul - sprout spectral wings and deal extra radiant damage' },
      { name: 'Scourge', description: 'Radiant Consumption - light damages nearby enemies' },
      { name: 'Fallen', description: 'Necrotic Shroud - frighten nearby enemies' },
    ],
  },
  dragonborn: {
    description: 'Dragonborn look very much like dragons standing erect in humanoid form, with scales and a draconic head.',
    traits: ['Breath Weapon', 'Damage Resistance (based on ancestry)', 'Darkvision 60ft'],
    subspecies: [
      { name: 'Black (Acid)', description: 'Acid breath weapon, acid resistance' },
      { name: 'Blue (Lightning)', description: 'Lightning breath weapon, lightning resistance' },
      { name: 'Brass (Fire)', description: 'Fire breath weapon (line), fire resistance' },
      { name: 'Bronze (Lightning)', description: 'Lightning breath weapon (line), lightning resistance' },
      { name: 'Copper (Acid)', description: 'Acid breath weapon (line), acid resistance' },
      { name: 'Gold (Fire)', description: 'Fire breath weapon, fire resistance' },
      { name: 'Green (Poison)', description: 'Poison breath weapon, poison resistance' },
      { name: 'Red (Fire)', description: 'Fire breath weapon, fire resistance' },
      { name: 'Silver (Cold)', description: 'Cold breath weapon, cold resistance' },
      { name: 'White (Cold)', description: 'Cold breath weapon (cone), cold resistance' },
    ],
  },
  dwarf: {
    description: 'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.',
    traits: ['Darkvision 120ft', 'Dwarven Resilience (poison resistance)', 'Stonecunning', 'Speed 25ft (not reduced by armor)'],
  },
  elf: {
    description: 'Elves are a magical people of otherworldly grace, living in places of ethereal beauty.',
    traits: ['Darkvision 60ft', 'Fey Ancestry', 'Keen Senses (Perception proficiency)', 'Trance (4hr rest)'],
    subspecies: [
      { name: 'High Elf', description: 'Extra cantrip from wizard list, extra language' },
      { name: 'Wood Elf', description: '35ft speed, Mask of the Wild (hide in natural phenomena)' },
      { name: 'Dark Elf (Drow)', description: 'Superior Darkvision 120ft, Drow magic (dancing lights, faerie fire, darkness)' },
    ],
  },
  gnome: {
    description: 'Gnomes are among the smallest of the common species, with pointed ears and an irrepressible sense of curiosity.',
    traits: ['Darkvision 60ft', 'Gnomish Cunning (advantage on INT/WIS/CHA saves vs magic)', 'Small size'],
    subspecies: [
      { name: 'Forest Gnome', description: 'Minor Illusion cantrip, Speak with Small Beasts' },
      { name: 'Rock Gnome', description: 'Artificer\'s Lore, Tinker (create clockwork devices)' },
    ],
  },
  goliath: {
    description: 'Goliaths are massive humanoids who live at high altitudes and value competition and self-sufficiency.',
    traits: ['Powerful Build', 'Stone\'s Endurance (reduce damage)', 'Mountain Born (cold resistance, high altitude adapted)', '35ft speed'],
  },
  halfling: {
    description: 'Halflings are small, practical folk who live peaceful lives in comfortable homes.',
    traits: ['Lucky (reroll 1s on d20)', 'Brave (advantage vs frightened)', 'Halfling Nimbleness (move through larger creatures)', 'Small size'],
    subspecies: [
      { name: 'Lightfoot', description: 'Naturally Stealthy (hide behind medium+ creatures)' },
      { name: 'Stout', description: 'Stout Resilience (poison resistance, advantage vs poison)' },
    ],
  },
  human: {
    description: 'Humans are the most adaptable and ambitious of the common species, capable of learning many skills.',
    traits: ['Resourceful (Heroic Inspiration on long rest)', 'Skillful (proficiency in one skill)', 'Versatile (Origin feat at 1st level)'],
  },
  orc: {
    description: 'Orcs are large, powerful humanoids known for their physical might and fierce determination.',
    traits: ['Adrenaline Rush (bonus action Dash)', 'Darkvision 120ft', 'Relentless Endurance (drop to 1 HP instead of 0)'],
  },
  tiefling: {
    description: 'Tieflings are derived from human bloodlines touched by the Lower Planes, bearing an infernal legacy.',
    traits: ['Darkvision 60ft', 'Fiendish Legacy (spells based on legacy)', 'Fire Resistance'],
    subspecies: [
      { name: 'Abyssal', description: 'Poison Spray cantrip, Ray of Sickness, Hold Person' },
      { name: 'Chthonic', description: 'Chill Touch cantrip, False Life, Ray of Enfeeblement' },
      { name: 'Infernal', description: 'Thaumaturgy cantrip, Hellish Rebuke, Darkness' },
    ],
  },
};

// Class descriptions and skill choices
export const CLASS_INFO: Record<CharacterClass, { description: string; hitDie: number; primaryAbility: string; savingThrows: string; skillChoices: SkillName[]; numSkillChoices: number; isSpellcaster: boolean; spellcastingAbility?: keyof AbilityScores }> = {
  barbarian: {
    description: 'A fierce warrior who can enter a battle rage, gaining incredible strength and durability.',
    hitDie: 12, primaryAbility: 'Strength', savingThrows: 'Strength & Constitution',
    skillChoices: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    numSkillChoices: 2, isSpellcaster: false,
  },
  bard: {
    description: 'An inspiring magician whose power echoes the music of creation, weaving magic through words and music.',
    hitDie: 8, primaryAbility: 'Charisma', savingThrows: 'Dexterity & Charisma',
    skillChoices: ['athletics', 'acrobatics', 'sleightOfHand', 'stealth', 'arcana', 'history', 'investigation', 'nature', 'religion', 'animalHandling', 'insight', 'medicine', 'perception', 'survival', 'deception', 'intimidation', 'performance', 'persuasion'],
    numSkillChoices: 3, isSpellcaster: true, spellcastingAbility: 'charisma',
  },
  cleric: {
    description: 'A priestly champion who wields divine magic in service of a higher power.',
    hitDie: 8, primaryAbility: 'Wisdom', savingThrows: 'Wisdom & Charisma',
    skillChoices: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'wisdom',
  },
  druid: {
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
    hitDie: 8, primaryAbility: 'Wisdom', savingThrows: 'Intelligence & Wisdom',
    skillChoices: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'wisdom',
  },
  fighter: {
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
    hitDie: 10, primaryAbility: 'Strength or Dexterity', savingThrows: 'Strength & Constitution',
    skillChoices: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    numSkillChoices: 2, isSpellcaster: false,
  },
  monk: {
    description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.',
    hitDie: 8, primaryAbility: 'Dexterity & Wisdom', savingThrows: 'Strength & Dexterity',
    skillChoices: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    numSkillChoices: 2, isSpellcaster: false,
  },
  paladin: {
    description: 'A holy warrior bound to a sacred oath, wielding divine magic to smite enemies and protect allies.',
    hitDie: 10, primaryAbility: 'Strength & Charisma', savingThrows: 'Wisdom & Charisma',
    skillChoices: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'charisma',
  },
  ranger: {
    description: 'A warrior who combats threats on the edges of civilization using martial prowess and nature magic.',
    hitDie: 10, primaryAbility: 'Dexterity & Wisdom', savingThrows: 'Strength & Dexterity',
    skillChoices: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    numSkillChoices: 3, isSpellcaster: true, spellcastingAbility: 'wisdom',
  },
  rogue: {
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
    hitDie: 8, primaryAbility: 'Dexterity', savingThrows: 'Dexterity & Intelligence',
    skillChoices: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
    numSkillChoices: 4, isSpellcaster: false,
  },
  sorcerer: {
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline.',
    hitDie: 6, primaryAbility: 'Charisma', savingThrows: 'Constitution & Charisma',
    skillChoices: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'charisma',
  },
  warlock: {
    description: 'A wielder of magic derived from a bargain with an extraplanar entity.',
    hitDie: 8, primaryAbility: 'Charisma', savingThrows: 'Wisdom & Charisma',
    skillChoices: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'charisma',
  },
  wizard: {
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
    hitDie: 6, primaryAbility: 'Intelligence', savingThrows: 'Intelligence & Wisdom',
    skillChoices: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    numSkillChoices: 2, isSpellcaster: true, spellcastingAbility: 'intelligence',
  },
};

// Legacy background info (kept for compatibility, use BACKGROUNDS_2024 for new features)
export const BACKGROUND_INFO: Record<string, { description: string; skillProficiencies: SkillName[] }> = Object.fromEntries(
  Object.entries(BACKGROUNDS_2024).map(([key, bg]) => [key, { description: bg.description, skillProficiencies: bg.skillProficiencies }])
);

// ============ CLASS ROLE DETAILS (for character creation help) ============
export type ClassRole = 'Tank' | 'Damage' | 'Healer' | 'Support' | 'Controller' | 'Utility';
export type Complexity = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ClassRoleInfo {
  roles: ClassRole[];
  playstyle: string;
  keyStats: string;
  complexity: Complexity;
  goodFor: string;
  color: string; // Tailwind color class
}

export const CLASS_ROLE_INFO: Record<CharacterClass, ClassRoleInfo> = {
  barbarian: {
    roles: ['Tank', 'Damage'],
    playstyle: 'Charge into battle, absorb damage with Rage, and crush enemies with mighty attacks.',
    keyStats: 'STR > CON > DEX',
    complexity: 'Beginner',
    goodFor: 'Players who want to hit hard and shrug off damage without complex mechanics.',
    color: 'red',
  },
  bard: {
    roles: ['Support', 'Healer', 'Utility'],
    playstyle: 'Inspire allies with Bardic Inspiration, cast versatile spells, and excel at social encounters.',
    keyStats: 'CHA > DEX > CON',
    complexity: 'Intermediate',
    goodFor: 'Players who enjoy supporting the party and being the face in roleplay.',
    color: 'pink',
  },
  cleric: {
    roles: ['Healer', 'Support', 'Tank'],
    playstyle: 'Channel divine power to heal, buff allies, and smite undead. Subclass defines your combat role.',
    keyStats: 'WIS > CON > STR/DEX',
    complexity: 'Intermediate',
    goodFor: 'Players who want healing power plus solid combat and spellcasting options.',
    color: 'yellow',
  },
  druid: {
    roles: ['Controller', 'Healer', 'Utility'],
    playstyle: 'Shape-shift into beasts, control the battlefield with nature magic, and adapt to any situation.',
    keyStats: 'WIS > CON > DEX',
    complexity: 'Advanced',
    goodFor: 'Players who enjoy versatility and want different options each encounter.',
    color: 'green',
  },
  fighter: {
    roles: ['Tank', 'Damage'],
    playstyle: 'Master of weapons and armor. Extra attacks, Action Surge, and reliable damage every round.',
    keyStats: 'STR or DEX > CON',
    complexity: 'Beginner',
    goodFor: 'New players or anyone who wants consistent martial combat without spell management.',
    color: 'orange',
  },
  monk: {
    roles: ['Damage', 'Controller'],
    playstyle: 'Swift martial artist using Focus Points for Flurry of Blows, mobility, and stunning enemies.',
    keyStats: 'DEX > WIS > CON',
    complexity: 'Intermediate',
    goodFor: 'Players who want high mobility and multiple attacks without weapons or armor.',
    color: 'cyan',
  },
  paladin: {
    roles: ['Tank', 'Damage', 'Support'],
    playstyle: 'Holy warrior combining heavy armor, Divine Smite damage, healing, and aura buffs.',
    keyStats: 'STR > CHA > CON',
    complexity: 'Intermediate',
    goodFor: 'Players who want to be a heroic frontliner with both combat and support abilities.',
    color: 'amber',
  },
  ranger: {
    roles: ['Damage', 'Utility'],
    playstyle: 'Skilled hunter mixing weapon attacks with nature magic. Excels at range or dual-wielding.',
    keyStats: 'DEX > WIS > CON',
    complexity: 'Intermediate',
    goodFor: 'Players who want a nature-themed fighter with utility spells and exploration skills.',
    color: 'emerald',
  },
  rogue: {
    roles: ['Damage', 'Utility'],
    playstyle: 'Striker dealing massive Sneak Attack damage. Expert at skills, stealth, and avoiding danger.',
    keyStats: 'DEX > CON/INT/CHA',
    complexity: 'Beginner',
    goodFor: 'Players who enjoy stealth, skills, and positioning for big damage moments.',
    color: 'slate',
  },
  sorcerer: {
    roles: ['Damage', 'Controller'],
    playstyle: 'Raw magical power with Metamagic to twist spells. Fewer spells known but more flexibility.',
    keyStats: 'CHA > CON > DEX',
    complexity: 'Advanced',
    goodFor: 'Players who want devastating magic with unique ways to modify their spells.',
    color: 'purple',
  },
  warlock: {
    roles: ['Damage', 'Utility'],
    playstyle: 'Pact magic with slots that recharge on short rest. Eldritch Blast + Invocations for customization.',
    keyStats: 'CHA > CON > DEX',
    complexity: 'Intermediate',
    goodFor: 'Players who want consistent damage with customizable magical abilities.',
    color: 'violet',
  },
  wizard: {
    roles: ['Controller', 'Damage', 'Utility'],
    playstyle: 'Ultimate spell versatility with the largest spell list. Prepare different spells each day.',
    keyStats: 'INT > CON > DEX',
    complexity: 'Advanced',
    goodFor: 'Players who want maximum spell options and enjoy studying their spellbook.',
    color: 'blue',
  },
};

// ============ SPECIES ROLE DETAILS ============
export interface SpeciesRoleInfo {
  traits: string;
  bestFor: string[];
  flavor: string;
  color: string;
}

export const SPECIES_ROLE_INFO: Record<Species, SpeciesRoleInfo> = {
  human: {
    traits: 'Bonus Origin Feat, versatile in any role',
    bestFor: ['Any class'],
    flavor: 'Ambitious and adaptable, humans excel through determination.',
    color: 'amber',
  },
  elf: {
    traits: 'Darkvision, Fey Ancestry (charm resist), Trance',
    bestFor: ['Ranger', 'Wizard', 'Rogue', 'Fighter (DEX)'],
    flavor: 'Graceful and long-lived, with a deep connection to magic.',
    color: 'emerald',
  },
  dwarf: {
    traits: 'Darkvision, Poison Resistance, Stonecunning',
    bestFor: ['Fighter', 'Cleric', 'Paladin', 'Barbarian'],
    flavor: 'Sturdy and resilient, masters of stone and steel.',
    color: 'orange',
  },
  halfling: {
    traits: 'Lucky (reroll 1s), Brave, Halfling Nimbleness',
    bestFor: ['Rogue', 'Bard', 'Ranger', 'Monk'],
    flavor: 'Small but courageous, with uncanny luck.',
    color: 'lime',
  },
  gnome: {
    traits: 'Darkvision, Gnome Cunning (INT/WIS/CHA save advantage)',
    bestFor: ['Wizard', 'Artificer', 'Bard', 'Warlock'],
    flavor: 'Curious inventors with natural magic resistance.',
    color: 'pink',
  },
  tiefling: {
    traits: 'Darkvision, Fire Resistance, Infernal Legacy spells',
    bestFor: ['Warlock', 'Sorcerer', 'Paladin', 'Bard'],
    flavor: 'Touched by the infernal, with innate magic.',
    color: 'rose',
  },
  dragonborn: {
    traits: 'Breath Weapon, Damage Resistance (by ancestry)',
    bestFor: ['Paladin', 'Fighter', 'Sorcerer', 'Barbarian'],
    flavor: 'Proud dragon-blooded warriors with elemental power.',
    color: 'cyan',
  },
  aasimar: {
    traits: 'Darkvision, Healing Hands, Celestial Revelation',
    bestFor: ['Paladin', 'Cleric', 'Warlock', 'Sorcerer'],
    flavor: 'Celestial-touched with radiant power and healing.',
    color: 'yellow',
  },
  goliath: {
    traits: "Stone's Endurance, Powerful Build, Mountain Born",
    bestFor: ['Barbarian', 'Fighter', 'Paladin'],
    flavor: 'Giant-kin built for endurance and strength.',
    color: 'stone',
  },
  orc: {
    traits: 'Darkvision, Adrenaline Rush, Relentless Endurance',
    bestFor: ['Barbarian', 'Fighter', 'Ranger'],
    flavor: 'Fierce warriors with unstoppable determination.',
    color: 'green',
  },
};

// ============ SUBSPECIES ROLE DETAILS (for character creation help) ============
export interface SubspeciesRoleInfo {
  summary: string;
  goodFor: string[];
  playstyle: string;
  color: string;
}

export const SUBSPECIES_ROLE_INFO: Record<string, SubspeciesRoleInfo> = {
  // Aasimar
  'Protector': {
    summary: 'Fly and deal bonus radiant damage',
    goodFor: ['Paladin', 'Cleric', 'Celestial Warlock'],
    playstyle: 'Guardian angel who swoops in to protect allies with divine fury.',
    color: 'yellow',
  },
  'Scourge': {
    summary: 'Radiant aura damages all nearby enemies',
    goodFor: ['Barbarian', 'Paladin', 'Melee fighters'],
    playstyle: 'Burning beacon of light that punishes enemies for standing close.',
    color: 'orange',
  },
  'Fallen': {
    summary: 'Frighten enemies with necrotic presence',
    goodFor: ['Warlock', 'Paladin (Oathbreaker)', 'Intimidation builds'],
    playstyle: 'Dark angel who terrifies foes with a glimpse of damnation.',
    color: 'stone',
  },
  // Elf
  'High Elf': {
    summary: 'Free wizard cantrip + extra language',
    goodFor: ['Wizard', 'Any caster', 'Utility-focused'],
    playstyle: 'Scholarly and magical, with arcane knowledge beyond your class.',
    color: 'blue',
  },
  'Wood Elf': {
    summary: '35ft speed + hide in nature',
    goodFor: ['Ranger', 'Rogue', 'Druid', 'Monk'],
    playstyle: 'Swift and stealthy, one with the forest and its secrets.',
    color: 'emerald',
  },
  'Dark Elf (Drow)': {
    summary: 'Superior darkvision + innate spells',
    goodFor: ['Rogue', 'Warlock', 'Sorcerer', 'Bard'],
    playstyle: 'Mysterious and magical, wielding powers from the Underdark.',
    color: 'purple',
  },
  // Gnome
  'Forest Gnome': {
    summary: 'Minor Illusion cantrip + speak with small beasts',
    goodFor: ['Wizard', 'Druid', 'Bard', 'Illusionist builds'],
    playstyle: 'Whimsical trickster with a connection to woodland creatures.',
    color: 'green',
  },
  'Rock Gnome': {
    summary: 'Tinker ability to create clockwork devices',
    goodFor: ['Artificer', 'Wizard', 'Creative problem-solvers'],
    playstyle: 'Ingenious inventor who creates helpful gadgets.',
    color: 'amber',
  },
  // Halfling
  'Lightfoot': {
    summary: 'Hide behind any medium+ creature',
    goodFor: ['Rogue', 'Ranger', 'Any stealthy build'],
    playstyle: 'Master of staying unseen, using allies as mobile cover.',
    color: 'sky',
  },
  'Stout': {
    summary: 'Poison resistance + advantage vs poison',
    goodFor: ['Fighter', 'Any frontline', 'Dungeon delvers'],
    playstyle: 'Hardy and resilient, shrugging off toxins with ease.',
    color: 'orange',
  },
  // Tiefling
  'Abyssal': {
    summary: 'Poison Spray, Ray of Sickness, Hold Person',
    goodFor: ['Warlock', 'Sorcerer', 'Control casters'],
    playstyle: 'Demonic heritage bringing debilitating curses.',
    color: 'green',
  },
  'Chthonic': {
    summary: 'Chill Touch, False Life, Ray of Enfeeblement',
    goodFor: ['Necromancer', 'Warlock', 'Death-themed builds'],
    playstyle: 'Deathly powers from the realms of the dead.',
    color: 'stone',
  },
  'Infernal': {
    summary: 'Thaumaturgy, Hellish Rebuke, Darkness',
    goodFor: ['Warlock', 'Sorcerer', 'Paladin', 'Intimidation builds'],
    playstyle: 'Classic hellfire and brimstone with flashy devil magic.',
    color: 'red',
  },
};

// ============ BACKGROUND ROLE DETAILS (for character creation help) ============
export interface BackgroundRoleInfo {
  theme: string;
  goodFor: string[];
  flavor: string;
  color: string;
}

export const BACKGROUND_ROLE_INFO: Record<string, BackgroundRoleInfo> = {
  'Acolyte': {
    theme: 'Religious devotee with divine connections',
    goodFor: ['Cleric', 'Paladin', 'Warlock', 'Wizard'],
    flavor: 'Temple service granted you insight into divine mysteries.',
    color: 'yellow',
  },
  'Artisan': {
    theme: 'Skilled craftsperson and tradesperson',
    goodFor: ['Fighter', 'Rogue', 'Artificer', 'Any'],
    flavor: 'Years of apprenticeship honed your practical skills.',
    color: 'orange',
  },
  'Charlatan': {
    theme: 'Con artist and smooth talker',
    goodFor: ['Rogue', 'Bard', 'Warlock', 'Sorcerer'],
    flavor: 'You learned to survive through wit and deception.',
    color: 'purple',
  },
  'Criminal': {
    theme: 'Thief, burglar, or underworld operative',
    goodFor: ['Rogue', 'Ranger', 'Monk', 'Fighter'],
    flavor: 'The shadows taught you skills others fear to learn.',
    color: 'stone',
  },
  'Entertainer': {
    theme: 'Performer and crowd pleaser',
    goodFor: ['Bard', 'Rogue', 'Monk', 'Fighter'],
    flavor: 'The stage was your first battlefield, applause your reward.',
    color: 'pink',
  },
  'Farmer': {
    theme: 'Hardy agricultural worker',
    goodFor: ['Barbarian', 'Fighter', 'Druid', 'Ranger'],
    flavor: 'Hard labor built both your body and your character.',
    color: 'lime',
  },
  'Guard': {
    theme: 'Law enforcer or security professional',
    goodFor: ['Fighter', 'Paladin', 'Ranger', 'Monk'],
    flavor: 'Protecting others became your purpose and pride.',
    color: 'blue',
  },
  'Guide': {
    theme: 'Wilderness expert and pathfinder',
    goodFor: ['Ranger', 'Druid', 'Barbarian', 'Rogue'],
    flavor: 'The wild places whispered secrets only you could hear.',
    color: 'emerald',
  },
  'Hermit': {
    theme: 'Reclusive seeker of knowledge',
    goodFor: ['Cleric', 'Druid', 'Wizard', 'Monk'],
    flavor: 'Solitude granted clarity others cannot comprehend.',
    color: 'cyan',
  },
  'Merchant': {
    theme: 'Trader and businessperson',
    goodFor: ['Rogue', 'Bard', 'Wizard', 'Any'],
    flavor: 'Every deal taught you to read people and situations.',
    color: 'amber',
  },
  'Noble': {
    theme: 'Aristocrat with privilege and responsibility',
    goodFor: ['Paladin', 'Bard', 'Fighter', 'Warlock'],
    flavor: 'Born to lead, you carry the weight of your lineage.',
    color: 'rose',
  },
  'Sage': {
    theme: 'Scholar and academic researcher',
    goodFor: ['Wizard', 'Cleric', 'Bard', 'Warlock'],
    flavor: 'Knowledge is your treasure, books your closest companions.',
    color: 'indigo',
  },
  'Sailor': {
    theme: 'Seafarer and maritime worker',
    goodFor: ['Fighter', 'Rogue', 'Ranger', 'Barbarian'],
    flavor: 'The sea tested you and found you worthy.',
    color: 'sky',
  },
  'Scribe': {
    theme: 'Clerk, copyist, or record keeper',
    goodFor: ['Wizard', 'Bard', 'Cleric', 'Rogue'],
    flavor: 'Every word matters; you learned to capture them perfectly.',
    color: 'slate',
  },
  'Soldier': {
    theme: 'Military veteran with combat experience',
    goodFor: ['Fighter', 'Paladin', 'Barbarian', 'Ranger'],
    flavor: 'War forged you in fire; you emerged battle-ready.',
    color: 'red',
  },
  'Wayfarer': {
    theme: 'Wanderer and traveler',
    goodFor: ['Ranger', 'Rogue', 'Monk', 'Bard'],
    flavor: 'The road is your home; every horizon calls to you.',
    color: 'teal',
  },
};

// ============ FEAT ROLE DETAILS (for character creation help) ============
export interface FeatRoleInfo {
  summary: string;
  goodFor: string[];
  power: 'Utility' | 'Combat' | 'Versatile';
  color: string;
}

export const FEAT_ROLE_INFO: Record<string, FeatRoleInfo> = {
  'Alert': {
    summary: 'Go first in combat, help allies react faster',
    goodFor: ['Rogue', 'Any spellcaster', 'Assassin builds'],
    power: 'Combat',
    color: 'yellow',
  },
  'Crafter': {
    summary: 'Create items and get shop discounts',
    goodFor: ['Artisan backgrounds', 'Item-focused campaigns'],
    power: 'Utility',
    color: 'orange',
  },
  'Healer': {
    summary: 'Use Healer\'s Kit to heal allies in combat',
    goodFor: ['Non-casters wanting healing', 'Support builds'],
    power: 'Versatile',
    color: 'green',
  },
  'Lucky': {
    summary: 'Reroll bad results or force enemy rerolls',
    goodFor: ['Everyone', 'Especially high-risk builds'],
    power: 'Versatile',
    color: 'gold',
  },
  'Magic Initiate (Cleric)': {
    summary: 'Learn divine cantrips and one 1st-level spell',
    goodFor: ['Want Guidance cantrip', 'Healing Word access'],
    power: 'Versatile',
    color: 'yellow',
  },
  'Magic Initiate (Druid)': {
    summary: 'Learn primal cantrips and one 1st-level spell',
    goodFor: ['Want Shillelagh', 'Nature-themed characters'],
    power: 'Versatile',
    color: 'emerald',
  },
  'Magic Initiate (Wizard)': {
    summary: 'Learn arcane cantrips and one 1st-level spell',
    goodFor: ['Want utility cantrips', 'Find Familiar access'],
    power: 'Versatile',
    color: 'blue',
  },
  'Musician': {
    summary: 'Inspire allies with Heroic Inspiration after rests',
    goodFor: ['Party support', 'Bard-lite playstyle'],
    power: 'Utility',
    color: 'pink',
  },
  'Savage Attacker': {
    summary: 'Reroll weapon damage once per turn',
    goodFor: ['Martial classes', 'High-damage builds'],
    power: 'Combat',
    color: 'red',
  },
  'Skilled': {
    summary: 'Gain 3 additional skill or tool proficiencies',
    goodFor: ['Skill monkeys', 'Versatile characters'],
    power: 'Utility',
    color: 'purple',
  },
  'Tavern Brawler': {
    summary: 'Enhanced unarmed strikes and improvised weapons',
    goodFor: ['Monk', 'Grappler builds', 'Unarmed fighters'],
    power: 'Combat',
    color: 'amber',
  },
  'Tough': {
    summary: '+2 HP per level (retroactive)',
    goodFor: ['Frontline fighters', 'Low CON builds', 'Everyone'],
    power: 'Combat',
    color: 'stone',
  },
};

// ============ CLASS FEATURES (Level 1) ============

export interface ClassFeature {
  name: string;
  description: string;
  level: number;
}

export const CLASS_FEATURES: Record<CharacterClass, ClassFeature[]> = {
  barbarian: [
    { name: 'Rage', description: 'Enter a rage as a bonus action: resistance to bludgeoning/piercing/slashing damage, +2 damage on STR attacks, advantage on STR checks/saves. Lasts 10 minutes or until you end it.', level: 1 },
    { name: 'Unarmored Defense', description: 'AC = 10 + DEX mod + CON mod when not wearing armor', level: 1 },
    { name: 'Weapon Mastery', description: 'Choose 2 weapon masteries from your proficient weapons', level: 1 },
    { name: 'Danger Sense', description: 'Advantage on DEX saves against effects you can see (traps, spells). Not blinded/deafened/incapacitated.', level: 2 },
    { name: 'Reckless Attack', description: 'When you attack on your turn, gain advantage on STR attacks but attacks against you have advantage.', level: 2 },
    { name: 'Primal Knowledge', description: 'Gain proficiency in one skill from: Animal Handling, Athletics, Intimidation, Nature, Perception, Survival.', level: 3 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Extra Attack', description: 'Attack twice when you take the Attack action.', level: 5 },
    { name: 'Fast Movement', description: 'Speed increases by 10 ft while not wearing heavy armor.', level: 5 },
    { name: 'Feral Instinct', description: 'Advantage on initiative. Act normally on first turn if surprised (if you rage).', level: 7 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Brutal Strike', description: 'When you Reckless Attack, you can forgo advantage on one attack to deal extra 1d10 damage and potentially knock prone or push.', level: 9 },
    { name: 'Relentless Rage', description: 'If you drop to 0 HP while raging, make DC 10 CON save to drop to 1 HP instead. DC increases by 5 each time.', level: 11 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Persistent Rage', description: 'Rage ends early only if you fall unconscious or choose to end it.', level: 15 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Indomitable Might', description: 'If your STR check total is less than your STR score, use that score instead.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Primal Champion', description: 'STR and CON increase by 4. Maximum for those scores is now 24.', level: 20 },
  ],
  bard: [
    { name: 'Bardic Inspiration', description: 'Bonus action to give ally a d6 to add to one ability check, attack, or save. Uses = CHA mod per long rest.', level: 1 },
    { name: 'Spellcasting', description: 'Cast bard spells using CHA. Know 4 cantrips and 2 spells at level 1.', level: 1 },
    { name: 'Expertise', description: 'Double proficiency for 2 skill proficiencies or one skill and thieves\' tools.', level: 2 },
    { name: 'Jack of All Trades', description: 'Add half proficiency (round down) to any ability check not using proficiency.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Font of Inspiration', description: 'Bardic Inspiration now refreshes on short or long rest.', level: 5 },
    { name: 'Countercharm', description: 'Action to give yourself and allies within 30 ft advantage on saves vs frightened/charmed.', level: 7 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Expertise', description: 'Choose 2 more skills for Expertise.', level: 9 },
    { name: 'Magical Secrets', description: 'Learn 2 spells from any class. They count as bard spells.', level: 10 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Magical Secrets', description: 'Learn 2 more spells from any class.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Magical Secrets', description: 'Learn 2 more spells from any class.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Superior Inspiration', description: 'Regain 1 Bardic Inspiration when you roll initiative and have none.', level: 20 },
  ],
  cleric: [
    { name: 'Divine Order', description: 'Choose Protector (martial weapon + heavy armor proficiency) or Thaumaturge (extra cantrip)', level: 1 },
    { name: 'Spellcasting', description: 'Cast cleric spells using WIS. Know 3 cantrips, prepare WIS mod + level spells.', level: 1 },
    { name: 'Channel Divinity', description: 'Use Channel Divinity 1/rest. Turn Undead: undead within 30 ft flee for 1 min if fail WIS save.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Sear Undead', description: 'When you Turn Undead, deal radiant damage equal to cleric level to affected undead.', level: 5 },
    { name: 'Channel Divinity (2/rest)', description: 'You can now use Channel Divinity twice per rest.', level: 6 },
    { name: 'Blessed Strikes', description: 'Divine Strike: +1d8 radiant on weapon hits once/turn. Or Potent Spellcasting: add WIS to cantrip damage.', level: 7 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Divine Intervention', description: 'Action to call on deity. Roll d% ≤ cleric level = deity intervenes. On success, can\'t use again for 7 days.', level: 10 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Improved Blessed Strikes', description: 'Divine Strike increases to 2d8, or cantrip damage bonus doubles.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Channel Divinity (3/rest)', description: 'You can now use Channel Divinity three times per rest.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Greater Divine Intervention', description: 'Divine Intervention always succeeds.', level: 20 },
  ],
  druid: [
    { name: 'Druidic', description: 'You know Druidic, the secret language of druids.', level: 1 },
    { name: 'Primal Order', description: 'Choose Magician (extra cantrip) or Warden (martial weapon proficiency, +1 AC in medium armor)', level: 1 },
    { name: 'Spellcasting', description: 'Cast druid spells using WIS. Know 2 cantrips, prepare WIS mod + level spells.', level: 1 },
    { name: 'Wild Shape', description: 'Transform into beasts 2/rest. CR limit and hours = level/3 (round down). Gain temp HP = level × 4.', level: 2 },
    { name: 'Wild Companion', description: 'Expend a Wild Shape to cast Find Familiar without material components.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Wild Resurgence', description: 'When you have no Wild Shape uses, regain one by expending a spell slot (bonus action).', level: 5 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Improved Wild Shape', description: 'Wild Shape can now assume forms with a swim or fly speed.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Beast Spells', description: 'Can cast spells in Wild Shape form (no material components).', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Archdruid', description: 'Wild Shape uses are unlimited. Ignore verbal/somatic components. Ignore material components under 1000 gp.', level: 20 },
  ],
  fighter: [
    { name: 'Fighting Style', description: 'Choose a fighting style: Archery (+2 ranged), Defense (+1 AC), Dueling (+2 one-handed), etc.', level: 1 },
    { name: 'Second Wind', description: 'Bonus action to regain 1d10 + fighter level HP. Uses = 2 per short/long rest.', level: 1 },
    { name: 'Weapon Mastery', description: 'Choose 3 weapon masteries from your proficient weapons', level: 1 },
    { name: 'Action Surge', description: 'Take one additional action on your turn. 1/rest.', level: 2 },
    { name: 'Tactical Mind', description: 'Add 1d10 to a failed ability check. If still fails, use isn\'t expended. Uses = 2/rest.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Extra Attack', description: 'Attack twice when you take the Attack action.', level: 5 },
    { name: 'Tactical Shift', description: 'When you use Second Wind, move up to half speed without provoking opportunity attacks.', level: 5 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 6 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Indomitable', description: 'Reroll a failed saving throw. 1/long rest.', level: 9 },
    { name: 'Master of Armaments', description: 'Change one weapon mastery property to another whenever you finish a long rest.', level: 9 },
    { name: 'Extra Attack (2)', description: 'Attack three times when you take the Attack action.', level: 11 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Indomitable (2/rest)', description: 'Indomitable can now be used twice per long rest.', level: 13 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Action Surge (2/rest)', description: 'Action Surge can now be used twice per rest.', level: 17 },
    { name: 'Indomitable (3/rest)', description: 'Indomitable can now be used three times per long rest.', level: 17 },
    { name: 'Studied Attacks', description: 'If you miss an attack, you have advantage on your next attack against that target before end of next turn.', level: 13 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Extra Attack (3)', description: 'Attack four times when you take the Attack action.', level: 20 },
  ],
  monk: [
    { name: 'Martial Arts', description: 'Use DEX instead of STR for unarmed strikes and monk weapons. Unarmed deals 1d6 (scales with level). Bonus action unarmed strike after Attack action.', level: 1 },
    { name: 'Unarmored Defense', description: 'AC = 10 + DEX mod + WIS mod when not wearing armor or shield', level: 1 },
    { name: 'Focus', description: 'Gain Focus Points = monk level. Spend to fuel special techniques. Regain all on short/long rest.', level: 2 },
    { name: 'Unarmored Movement', description: 'Speed increases by 10 ft when not wearing armor. Increases at higher levels.', level: 2 },
    { name: 'Uncanny Metabolism', description: 'When you roll initiative, regain all Focus Points if you have none.', level: 2 },
    { name: 'Deflect Attacks', description: 'Reaction to reduce ranged attack damage by 1d10 + DEX + monk level. Can catch and throw back.', level: 3 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Slow Fall', description: 'Reduce falling damage by 5 × monk level.', level: 4 },
    { name: 'Extra Attack', description: 'Attack twice when you take the Attack action.', level: 5 },
    { name: 'Stunning Strike', description: 'Spend 1 Focus when you hit. Target must CON save or be stunned until end of your next turn.', level: 5 },
    { name: 'Empowered Strikes', description: 'Unarmed strikes count as magical for overcoming resistance/immunity.', level: 6 },
    { name: 'Evasion', description: 'DEX saves for half damage: take no damage on success, half on fail.', level: 7 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Acrobatic Movement', description: 'Can run along walls and across water without falling if you end turn on solid ground.', level: 9 },
    { name: 'Heightened Focus', description: 'When you spend Focus Points, you can spend 1 additional to gain advantage on any save until start of next turn.', level: 10 },
    { name: 'Self-Restoration', description: 'End one condition on yourself (charmed, frightened, or poisoned) at end of each turn.', level: 10 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Deflect Energy', description: 'Deflect Attacks now works on any damage type, not just physical.', level: 13 },
    { name: 'Disciplined Survivor', description: 'Proficiency in all saving throws. Spend 1 Focus to reroll a failed save.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Perfect Focus', description: 'When you roll initiative, regain up to 4 Focus Points if you have fewer than 4.', level: 15 },
    { name: 'Superior Defense', description: 'When you take damage from a creature within 5 ft, spend 1 Focus to halve that damage.', level: 18 },
    { name: 'Body and Mind', description: 'DEX and WIS increase by 4. Maximum for those scores is now 24.', level: 20 },
  ],
  paladin: [
    { name: 'Lay on Hands', description: 'Pool of HP = paladin level × 5. Touch to heal or cure disease/poison.', level: 1 },
    { name: 'Spellcasting', description: 'Cast paladin spells using CHA. Prepare CHA mod + half level spells.', level: 1 },
    { name: 'Weapon Mastery', description: 'Choose 2 weapon masteries from your proficient weapons', level: 1 },
    { name: 'Divine Smite', description: 'Expend spell slot to deal +2d8 radiant on hit (+1d8 per slot above 1st, +1d8 vs undead/fiend). Max 5d8.', level: 2 },
    { name: 'Fighting Style', description: 'Choose a fighting style: Defense (+1 AC), Dueling (+2 one-handed), Great Weapon Fighting, etc.', level: 2 },
    { name: 'Channel Divinity', description: 'Channel Divinity 1/rest. Divine Sense: know location of celestials/fiends/undead within 60 ft.', level: 3 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Faithful Steed', description: 'Can always cast Find Steed without a spell slot.', level: 5 },
    { name: 'Extra Attack', description: 'Attack twice when you take the Attack action.', level: 5 },
    { name: 'Aura of Protection', description: 'You and allies within 10 ft add your CHA mod to saving throws.', level: 6 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Abjure Foes', description: 'Channel Divinity to frighten creatures. CHA mod creatures within 60 ft make WIS save or frightened.', level: 9 },
    { name: 'Aura of Courage', description: 'You and allies within 10 ft can\'t be frightened.', level: 10 },
    { name: 'Radiant Strikes', description: 'Your weapon attacks deal extra 1d8 radiant damage.', level: 11 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Restoring Touch', description: 'Can end any spell on a creature you touch by spending 5 HP from Lay on Hands pool.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Aura Expansion', description: 'All your auras now extend to 30 feet.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Paladin Capstone', description: 'Gain your subclass capstone ability.', level: 20 },
  ],
  ranger: [
    { name: 'Deft Explorer', description: 'Gain expertise in one skill, learn 2 languages, and gain climbing/swimming speed.', level: 1 },
    { name: 'Favored Enemy', description: 'Know Hunter\'s Mark always prepared, cast free once per long rest.', level: 1 },
    { name: 'Spellcasting', description: 'Cast ranger spells using WIS. Know 2 spells at level 1.', level: 1 },
    { name: 'Weapon Mastery', description: 'Choose 2 weapon masteries from your proficient weapons', level: 1 },
    { name: 'Fighting Style', description: 'Choose a fighting style: Archery (+2 ranged), Defense (+1 AC), Dueling, Two-Weapon Fighting.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Extra Attack', description: 'Attack twice when you take the Attack action.', level: 5 },
    { name: 'Roving', description: 'Speed increases by 10 ft. Gain climbing and swimming speed equal to your walking speed.', level: 6 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Expertise', description: 'Choose 2 skill proficiencies to gain Expertise.', level: 9 },
    { name: 'Tireless', description: 'As an action, reduce exhaustion by 1. Self-heal 1d8 + WIS mod temporary HP. Uses = proficiency/long rest.', level: 10 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Nature\'s Veil', description: 'Bonus action to become invisible until start of next turn. Uses = proficiency/long rest.', level: 14 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Feral Senses', description: 'Gain blindsight 30 ft. Within that range, detect invisible creatures.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Foe Slayer', description: 'Once per turn, add WIS mod to attack or damage roll against a creature marked by Hunter\'s Mark.', level: 20 },
  ],
  rogue: [
    { name: 'Expertise', description: 'Double proficiency bonus for 2 skill proficiencies.', level: 1 },
    { name: 'Sneak Attack', description: 'Once per turn, deal extra 1d6 damage when you have advantage or ally adjacent to target.', level: 1 },
    { name: 'Thieves\' Cant', description: 'You know Thieves\' Cant, a secret mix of dialect and coded messages.', level: 1 },
    { name: 'Weapon Mastery', description: 'Choose 2 weapon masteries from your proficient weapons', level: 1 },
    { name: 'Cunning Action', description: 'Bonus action to Dash, Disengage, or Hide.', level: 2 },
    { name: 'Steady Aim', description: 'Bonus action: don\'t move this turn, gain advantage on next attack.', level: 3 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Cunning Strike', description: 'When you Sneak Attack, forgo some dice to: Disarm, Poison, Trip, or Withdraw.', level: 5 },
    { name: 'Uncanny Dodge', description: 'Reaction to halve attack damage from an attacker you can see.', level: 5 },
    { name: 'Expertise', description: 'Choose 2 more skills for Expertise.', level: 6 },
    { name: 'Evasion', description: 'DEX saves for half damage: take no damage on success, half on fail.', level: 7 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 10 },
    { name: 'Reliable Talent', description: 'Any skill check with proficiency: treat d20 roll of 9 or lower as 10.', level: 11 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Devious Strikes', description: 'Cunning Strike options improve: Daze, Knock Out, Obscure added.', level: 14 },
    { name: 'Subtle Strikes', description: 'If you miss with Sneak Attack, you can use reaction to make another attack.', level: 13 },
    { name: 'Slippery Mind', description: 'Gain proficiency in WIS saving throws.', level: 15 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Elusive', description: 'No attack has advantage against you while you aren\'t incapacitated.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Stroke of Luck', description: 'Turn a miss into a hit, or failed ability check into success. 1/short or long rest.', level: 20 },
  ],
  sorcerer: [
    { name: 'Innate Sorcery', description: 'Bonus action to enter magical state for 1 minute: +1 to spell attack/DC, advantage on CON saves for spells.', level: 1 },
    { name: 'Spellcasting', description: 'Cast sorcerer spells using CHA. Know 4 cantrips and 2 spells at level 1.', level: 1 },
    { name: 'Font of Magic', description: 'Gain Sorcery Points = sorcerer level. Convert between spell slots and points.', level: 2 },
    { name: 'Metamagic', description: 'Learn 2 Metamagic options to enhance spells: Careful, Distant, Empowered, Extended, Heightened, etc.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Sorcerous Restoration', description: 'When you finish a short rest, regain Sorcery Points = half sorcerer level (round down).', level: 5 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Arcane Apotheosis', description: 'While Innate Sorcery is active, you can use 1 Metamagic option without spending Sorcery Points once per turn.', level: 20 },
  ],
  warlock: [
    { name: 'Eldritch Invocations', description: 'Learn 1 invocation at level 1. Customize your warlock with special abilities.', level: 1 },
    { name: 'Pact Magic', description: 'Cast warlock spells using CHA. Have 1 spell slot (regains on short rest). Know 2 cantrips and 2 spells.', level: 1 },
    { name: 'Magical Cunning', description: 'Perform a 1-minute ritual to regain half your expended Pact Magic slots (round up). 1/long rest.', level: 2 },
    { name: 'Pact Boon', description: 'Choose: Pact of the Blade (create weapon), Pact of the Chain (familiar), Pact of the Tome (extra cantrips).', level: 3 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Contact Patron', description: 'Cast Contact Other Plane to contact your patron. Always succeeds without risk.', level: 9 },
    { name: 'Mystic Arcanum (6th)', description: 'Choose 1 6th-level spell to cast once per long rest without a slot.', level: 11 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Mystic Arcanum (7th)', description: 'Choose 1 7th-level spell to cast once per long rest without a slot.', level: 13 },
    { name: 'Mystic Arcanum (8th)', description: 'Choose 1 8th-level spell to cast once per long rest without a slot.', level: 15 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Mystic Arcanum (9th)', description: 'Choose 1 9th-level spell to cast once per long rest without a slot.', level: 17 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Eldritch Master', description: 'Spend 1 minute entreating patron to regain all Pact Magic slots. 1/long rest.', level: 20 },
  ],
  wizard: [
    { name: 'Arcane Recovery', description: 'Once per day during short rest, recover spell slots with combined level ≤ half wizard level (round up).', level: 1 },
    { name: 'Spellcasting', description: 'Cast wizard spells using INT. Know 3 cantrips. Spellbook has 6 spells, prepare INT mod + level.', level: 1 },
    { name: 'Scholar', description: 'Gain expertise in Arcana, History, Investigation, Nature, or Religion. Learn 2 languages.', level: 2 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 4 },
    { name: 'Memorize Spell', description: 'Spend 1 minute to replace one prepared spell with another from your spellbook.', level: 5 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 8 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 12 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 16 },
    { name: 'Spell Mastery', description: 'Choose a 1st and 2nd-level spell from spellbook. Cast them at lowest level without a slot.', level: 18 },
    { name: 'Ability Score Improvement', description: 'Increase one ability by 2, or two abilities by 1 each. Max 20.', level: 19 },
    { name: 'Signature Spells', description: 'Choose two 3rd-level spells. They\'re always prepared and you can cast each once without a slot.', level: 20 },
  ],
};

// Get features a character gains at a specific level
export function getFeaturesAtLevel(characterClass: CharacterClass, level: number): ClassFeature[] {
  return CLASS_FEATURES[characterClass].filter(f => f.level === level);
}

// Get all features up to and including a level
export function getAllFeaturesUpToLevel(characterClass: CharacterClass, level: number): ClassFeature[] {
  return CLASS_FEATURES[characterClass].filter(f => f.level <= level);
}

// Check if a level grants an Ability Score Improvement
export function isASILevel(characterClass: CharacterClass, level: number): boolean {
  // Fighters get extra ASIs at 6 and 14
  if (characterClass === 'fighter') {
    return [4, 6, 8, 12, 14, 16, 19].includes(level);
  }
  // Rogues get extra ASI at 10
  if (characterClass === 'rogue') {
    return [4, 8, 10, 12, 16, 19].includes(level);
  }
  // Standard ASI levels for all other classes
  return [4, 8, 12, 16, 19].includes(level);
}

// ============ LEVEL-UP HELPER FUNCTIONS ============

// Check if a class is a spellcaster
export function isSpellcaster(characterClass: CharacterClass): boolean {
  const casters: CharacterClass[] = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
  return casters.includes(characterClass);
}

// Check if class gains cantrips at a specific level
export function gainsCantripsAtLevel(characterClass: CharacterClass, level: number): boolean {
  const progression = CANTRIPS_KNOWN_BY_LEVEL[characterClass];
  if (!progression) return false;

  const current = progression[level] || 0;
  const previous = progression[level - 1] || 0;
  return current > previous;
}

// Get number of new cantrips gained at a level
export function getNewCantripsAtLevel(characterClass: CharacterClass, level: number): number {
  const progression = CANTRIPS_KNOWN_BY_LEVEL[characterClass];
  if (!progression) return 0;

  const current = progression[level] || 0;
  const previous = progression[level - 1] || 0;
  return Math.max(0, current - previous);
}

// Check if class gains new spells known at a specific level
export function gainsSpellsAtLevel(characterClass: CharacterClass, level: number): boolean {
  const progression = SPELLS_KNOWN_BY_LEVEL[characterClass];
  if (!progression) {
    // Prepared casters always "gain" access to new spell levels
    const preparedCasters: CharacterClass[] = ['cleric', 'druid', 'paladin', 'wizard'];
    return preparedCasters.includes(characterClass) && isSpellcaster(characterClass);
  }

  const current = progression[level] || 0;
  const previous = progression[level - 1] || 0;
  return current > previous;
}

// Get number of new spells to learn at a level (for known casters)
export function getNewSpellsAtLevel(characterClass: CharacterClass, level: number): number {
  const progression = SPELLS_KNOWN_BY_LEVEL[characterClass];
  if (!progression) return 0;

  const current = progression[level] || 0;
  const previous = progression[level - 1] || 0;
  return Math.max(0, current - previous);
}

// Get the spellcasting type for a class
export function getSpellcasterType(characterClass: CharacterClass): 'full' | 'half' | 'pact' | 'none' {
  const fullCasters: CharacterClass[] = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
  const halfCasters: CharacterClass[] = ['paladin', 'ranger'];

  if (fullCasters.includes(characterClass)) return 'full';
  if (halfCasters.includes(characterClass)) return 'half';
  if (characterClass === 'warlock') return 'pact';
  return 'none';
}

// Get the spell preparation type for a class
export function getSpellPreparationType(characterClass: CharacterClass): 'known' | 'prepared' | 'spellbook' | 'none' {
  const knownCasters: CharacterClass[] = ['bard', 'ranger', 'sorcerer', 'warlock'];
  const preparedCasters: CharacterClass[] = ['cleric', 'druid', 'paladin'];

  if (knownCasters.includes(characterClass)) return 'known';
  if (preparedCasters.includes(characterClass)) return 'prepared';
  if (characterClass === 'wizard') return 'spellbook';
  return 'none';
}

// Check if class gains expertise at a level
export function gainsExpertiseAtLevel(characterClass: CharacterClass, level: number): boolean {
  if (characterClass === 'rogue') return level === 1 || level === 6;
  if (characterClass === 'bard') return level === 2 || level === 9;
  if (characterClass === 'ranger') return level === 9;
  return false;
}

// Check if warlock gains invocations at a level
export function gainsInvocationsAtLevel(level: number): boolean {
  // Warlocks gain invocations at 2, 5, 7, 9, 12, 15, 18
  return [2, 5, 7, 9, 12, 15, 18].includes(level);
}

// Get number of invocations a warlock knows at a level
export function getInvocationsKnownAtLevel(level: number): number {
  if (level < 2) return 0;
  if (level < 5) return 2;
  if (level < 7) return 3;
  if (level < 9) return 4;
  if (level < 12) return 5;
  if (level < 15) return 6;
  if (level < 18) return 7;
  return 8;
}

// Check if sorcerer gains metamagic at a level
export function gainsMetamagicAtLevel(level: number): boolean {
  return level === 2 || level === 10 || level === 17;
}

// Get number of metamagic options a sorcerer knows at a level
export function getMetamagicKnownAtLevel(level: number): number {
  if (level < 2) return 0;
  if (level < 10) return 2;
  if (level < 17) return 3;
  return 4;
}

// Get the maximum spell level a character can cast
export function getMaxSpellLevel(characterClass: CharacterClass, level: number): number {
  const casterType = getSpellcasterType(characterClass);

  if (casterType === 'none') return 0;

  if (casterType === 'full') {
    // Full casters: spell level = ceil(level / 2), max 9
    return Math.min(9, Math.ceil(level / 2));
  }

  if (casterType === 'half') {
    // Half casters: gain spellcasting at level 2, spell level progression is slower
    if (level < 2) return 0;
    return Math.min(5, Math.ceil((level - 1) / 4) + 1);
  }

  if (casterType === 'pact') {
    // Warlocks: pact magic progression
    if (level < 1) return 0;
    if (level < 3) return 1;
    if (level < 5) return 2;
    if (level < 7) return 3;
    if (level < 9) return 4;
    return 5;
  }

  return 0;
}

// Get all available spells for a class at a given character level
export function getAvailableSpellsForClass(
  characterClass: CharacterClass,
  characterLevel: number
): { name: string; description: string; level: number }[] {
  const maxSpellLevel = getMaxSpellLevel(characterClass, characterLevel);
  const spells: { name: string; description: string; level: number }[] = [];

  // Add level 1 spells
  const level1Spells = CLASS_SPELLS_LEVEL_1[characterClass] || [];
  level1Spells.forEach(s => spells.push({ ...s, level: 1 }));

  // Add level 2 spells if accessible
  if (maxSpellLevel >= 2) {
    const level2Spells = CLASS_SPELLS_LEVEL_2[characterClass] || [];
    level2Spells.forEach(s => spells.push({ ...s, level: 2 }));
  }

  // Add level 3 spells if accessible
  if (maxSpellLevel >= 3) {
    const level3Spells = CLASS_SPELLS_LEVEL_3[characterClass] || [];
    level3Spells.forEach(s => spells.push({ ...s, level: 3 }));
  }

  return spells;
}

// Get eligible general feats for a character
export function getEligibleFeats(
  character: {
    characterClass: CharacterClass;
    level: number;
    abilityScores: AbilityScores;
    armorProficiencies?: string[];
    features?: { name: string }[];
  }
): typeof GENERAL_FEATS {
  return GENERAL_FEATS.filter(feat => {
    if (!feat.prerequisites) return true;

    const prereqs = feat.prerequisites;

    // Check level prerequisite
    if (prereqs.level && character.level < prereqs.level) return false;

    // Check ability score prerequisite
    if (prereqs.abilityScore) {
      const score = character.abilityScores[prereqs.abilityScore.ability];
      if (score < prereqs.abilityScore.minimum) return false;
    }

    // Check spellcasting prerequisite
    if (prereqs.spellcasting && !isSpellcaster(character.characterClass)) return false;

    // Check armor proficiency prerequisite
    if (prereqs.armorProficiency) {
      const armorProfs = character.armorProficiencies || [];
      if (!armorProfs.includes(prereqs.armorProficiency)) return false;
    }

    return true;
  });
}

// Check if a subclass grants a feature at a specific level
export function hasSubclassFeatureAtLevel(
  characterClass: CharacterClass,
  subclassName: string | undefined,
  level: number
): boolean {
  if (!subclassName) return false;

  // Subclass feature levels vary by class
  const subclassFeatureLevels: Record<CharacterClass, number[]> = {
    barbarian: [3, 6, 10, 14],
    bard: [3, 6, 14],
    cleric: [3, 6, 8, 17],
    druid: [3, 6, 10, 14],
    fighter: [3, 7, 10, 15, 18],
    monk: [3, 6, 11, 17],
    paladin: [3, 7, 15, 20],
    ranger: [3, 7, 11, 15],
    rogue: [3, 9, 13, 17],
    sorcerer: [3, 6, 14, 18],
    warlock: [3, 6, 10, 14],
    wizard: [3, 6, 10, 14],
  };

  return subclassFeatureLevels[characterClass]?.includes(level) || false;
}

// ============ CLASS PROFICIENCIES ============

export type ArmorType = 'light' | 'medium' | 'heavy' | 'shields';
export type WeaponType = 'simple' | 'martial' | 'specific';

export interface ClassProficiencies {
  armor: ArmorType[];
  weapons: { type: WeaponType; specific?: string[] }[];
  tools: string[];
  savingThrows: (keyof AbilityScores)[];
}

export const CLASS_PROFICIENCIES: Record<CharacterClass, ClassProficiencies> = {
  barbarian: {
    armor: ['light', 'medium', 'shields'],
    weapons: [{ type: 'simple' }, { type: 'martial' }],
    tools: [],
    savingThrows: ['strength', 'constitution'],
  },
  bard: {
    armor: ['light'],
    weapons: [{ type: 'simple' }, { type: 'specific', specific: ['Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'] }],
    tools: ['Three musical instruments of your choice'],
    savingThrows: ['dexterity', 'charisma'],
  },
  cleric: {
    armor: ['light', 'medium', 'shields'],
    weapons: [{ type: 'simple' }],
    tools: [],
    savingThrows: ['wisdom', 'charisma'],
  },
  druid: {
    armor: ['light', 'medium', 'shields'],
    weapons: [{ type: 'specific', specific: ['Club', 'Dagger', 'Dart', 'Javelin', 'Mace', 'Quarterstaff', 'Scimitar', 'Sickle', 'Sling', 'Spear'] }],
    tools: ['Herbalism Kit'],
    savingThrows: ['intelligence', 'wisdom'],
  },
  fighter: {
    armor: ['light', 'medium', 'heavy', 'shields'],
    weapons: [{ type: 'simple' }, { type: 'martial' }],
    tools: [],
    savingThrows: ['strength', 'constitution'],
  },
  monk: {
    armor: [],
    weapons: [{ type: 'simple' }, { type: 'specific', specific: ['Shortsword'] }],
    tools: ['One artisan\'s tool or musical instrument'],
    savingThrows: ['strength', 'dexterity'],
  },
  paladin: {
    armor: ['light', 'medium', 'heavy', 'shields'],
    weapons: [{ type: 'simple' }, { type: 'martial' }],
    tools: [],
    savingThrows: ['wisdom', 'charisma'],
  },
  ranger: {
    armor: ['light', 'medium', 'shields'],
    weapons: [{ type: 'simple' }, { type: 'martial' }],
    tools: [],
    savingThrows: ['strength', 'dexterity'],
  },
  rogue: {
    armor: ['light'],
    weapons: [{ type: 'simple' }, { type: 'specific', specific: ['Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'] }],
    tools: ['Thieves\' Tools'],
    savingThrows: ['dexterity', 'intelligence'],
  },
  sorcerer: {
    armor: [],
    weapons: [{ type: 'specific', specific: ['Dagger', 'Quarterstaff', 'Sling'] }],
    tools: [],
    savingThrows: ['constitution', 'charisma'],
  },
  warlock: {
    armor: ['light'],
    weapons: [{ type: 'simple' }],
    tools: [],
    savingThrows: ['wisdom', 'charisma'],
  },
  wizard: {
    armor: [],
    weapons: [{ type: 'specific', specific: ['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow'] }],
    tools: [],
    savingThrows: ['intelligence', 'wisdom'],
  },
};

// Helper to format armor proficiencies as string
export function formatArmorProficiencies(armor: ArmorType[]): string {
  if (armor.length === 0) return 'None';
  return armor.map(a => a === 'shields' ? 'Shields' : `${a.charAt(0).toUpperCase() + a.slice(1)} armor`).join(', ');
}

// Helper to format weapon proficiencies as string
export function formatWeaponProficiencies(weapons: { type: WeaponType; specific?: string[] }[]): string {
  const parts: string[] = [];
  for (const w of weapons) {
    if (w.type === 'simple') parts.push('Simple weapons');
    else if (w.type === 'martial') parts.push('Martial weapons');
    else if (w.specific) parts.push(w.specific.join(', '));
  }
  return parts.join(', ') || 'None';
}

// Personality traits for randomization
export const PERSONALITY_TRAITS = [
  "I idolize a particular hero and constantly refer to their deeds.",
  "I can find common ground between the fiercest enemies.",
  "I see omens in every event and action.",
  "Nothing can shake my optimistic attitude.",
  "I quote sacred texts and proverbs in almost every situation.",
  "I am tolerant of other faiths and respect others' ways.",
  "I've enjoyed fine food, drink, and society among my temple's elite.",
  "I've spent so long in the temple that I have little practical experience.",
  "I fall in and out of love easily, and am always pursuing someone.",
  "I have a joke for every occasion, especially inappropriate ones.",
  "Flattery is my preferred trick for getting what I want.",
  "I'm a born gambler who can't resist taking a risk.",
  "I lie about almost everything, even when there's no reason to.",
  "Sarcasm and insults are my weapons of choice.",
  "I keep multiple holy symbols on me and invoke whatever deity suits the situation.",
  "I pocket anything I see that might have some value.",
];

export const IDEALS = [
  "Tradition. The ancient traditions must be preserved and upheld. (Lawful)",
  "Charity. I always try to help those in need. (Good)",
  "Change. We must help bring about changes the gods are working in the world. (Chaotic)",
  "Power. I hope to one day rise to the top of my faith's hierarchy. (Lawful)",
  "Faith. I trust that my deity will guide my actions. (Lawful)",
  "Aspiration. I seek to prove myself worthy of my god's favor. (Any)",
  "Independence. I am a free spirit—no one tells me what to do. (Chaotic)",
  "Fairness. I never target people who can't afford to lose. (Lawful)",
  "Freedom. Chains are meant to be broken, as are those who would forge them. (Chaotic)",
  "Greed. I will do whatever it takes to become wealthy. (Evil)",
  "People. I'm loyal to my friends, not ideals. (Neutral)",
  "Redemption. There's a spark of good in everyone. (Good)",
];

export const BONDS = [
  "I would die to recover an ancient relic of my faith.",
  "I will someday get revenge on the corrupt temple that branded me a heretic.",
  "I owe my life to the priest who took me in when my parents died.",
  "Everything I do is for the common people.",
  "I will do anything to protect the temple where I served.",
  "I seek to preserve a sacred text that my enemies seek to destroy.",
  "I fleeced the wrong person and must work to ensure they never cross paths with me.",
  "I owe everything to my mentor—a horrible person who's probably rotting in jail.",
  "Somewhere out there, I have a child who doesn't know me.",
  "I come from a noble family, and I'll reclaim my lands.",
  "My tools are symbols of my past life, and I carry them to remember it.",
  "I protect those who cannot protect themselves.",
];

export const FLAWS = [
  "I judge others harshly, and myself even more severely.",
  "I put too much trust in those who wield power within my temple's hierarchy.",
  "My piety sometimes leads me to blindly trust those that profess faith in my god.",
  "I am inflexible in my thinking.",
  "I am suspicious of strangers and expect the worst of them.",
  "Once I pick a goal, I become obsessed with it.",
  "I can't resist a pretty face.",
  "I'm always in debt. I spend my ill-gotten gains on decadent luxuries.",
  "I'm convinced that no one could ever fool me the way I fool others.",
  "I hate to admit it and will hate myself for it, but I'll run to preserve my own hide.",
  "I turn tail and run when things look bad.",
  "An innocent person is in prison for a crime I committed. I'm okay with that.",
];

// Roll 4d6 drop lowest for ability score
export function rollAbilityScore(): number {
  const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2]; // Drop lowest
}

// Roll all 6 ability scores
export function rollAllAbilityScores(): number[] {
  return [1, 2, 3, 4, 5, 6].map(() => rollAbilityScore());
}

// ============ DETAILED SPELL DATA ============

export type SpellSchool = 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';

export interface SpellDetails {
  name: string;
  level: number; // 0 for cantrip
  school: SpellSchool;
  castingTime: string;
  range: string;
  components: string; // "V, S, M (a bit of fleece)"
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  description: string;
  higherLevels?: string;
  damage?: string; // dice notation like "1d10" or "2d6"
  damageType?: DamageType;
  healing?: string; // dice notation
  savingThrow?: keyof AbilityScores;
  attackType?: 'melee' | 'ranged';
  areaOfEffect?: string;
}

// Comprehensive spell details lookup
export const SPELL_DETAILS: Record<string, SpellDetails> = {
  // ===== CANTRIPS =====
  'Acid Splash': {
    name: 'Acid Splash',
    level: 0,
    school: 'conjuration',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You hurl a bubble of acid. Choose one creature you can see within range, or choose two creatures within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.',
    higherLevels: 'Damage increases by 1d6 at 5th level (2d6), 11th level (3d6), and 17th level (4d6).',
    damage: '1d6',
    damageType: 'acid',
    savingThrow: 'dexterity',
  },
  'Blade Ward': {
    name: 'Blade Ward',
    level: 0,
    school: 'abjuration',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: '1 round',
    description: 'You extend your hand and trace a sigil of warding in the air. Until the end of your next turn, you have resistance against bludgeoning, piercing, and slashing damage dealt by weapon attacks.',
  },
  'Booming Blade': {
    name: 'Booming Blade',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Self (5-foot radius)',
    components: 'S, M (a melee weapon worth at least 1 sp)',
    duration: '1 round',
    description: 'You brandish the weapon used in the spell\'s casting and make a melee attack with it. On a hit, the target takes normal weapon damage and becomes sheathed in booming energy. If the target willingly moves 5+ feet before your next turn, it takes 1d8 thunder damage.',
    higherLevels: 'At 5th level, the melee attack deals an extra 1d8 thunder damage, and the moving damage increases to 2d8. Both increase again at 11th and 17th level.',
    damage: '1d8',
    damageType: 'thunder',
    attackType: 'melee',
  },
  'Chill Touch': {
    name: 'Chill Touch',
    level: 0,
    school: 'necromancy',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: '1 round',
    description: 'You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack. On a hit, the target takes 1d8 necrotic damage and can\'t regain hit points until the start of your next turn. If targeting undead, it also has disadvantage on attacks against you.',
    higherLevels: 'Damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
    damage: '1d8',
    damageType: 'necrotic',
    attackType: 'ranged',
  },
  'Dancing Lights': {
    name: 'Dancing Lights',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S, M (a bit of phosphorus or wychwood, or a glowworm)',
    duration: '1 minute',
    concentration: true,
    description: 'You create up to four torch-sized lights within range. Each light sheds dim light in a 10-foot radius. You can combine the lights into one glowing humanoid form of Medium size. As a bonus action, you can move the lights up to 60 feet.',
  },
  'Druidcraft': {
    name: 'Druidcraft',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Whispering to the spirits of nature, you create one of several minor effects: predict weather, make a flower bloom, create a sensory effect like leaves rustling, or instantly light or snuff out a small flame.',
  },
  'Eldritch Blast': {
    name: 'Eldritch Blast',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack. On a hit, the target takes 1d10 force damage.',
    higherLevels: 'You create additional beams at 5th level (2 beams), 11th level (3 beams), and 17th level (4 beams). You can direct beams at the same or different targets.',
    damage: '1d10',
    damageType: 'force',
    attackType: 'ranged',
  },
  'Fire Bolt': {
    name: 'Fire Bolt',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn\'t being worn or carried.',
    higherLevels: 'Damage increases by 1d10 at 5th level (2d10), 11th level (3d10), and 17th level (4d10).',
    damage: '1d10',
    damageType: 'fire',
    attackType: 'ranged',
  },
  'Friends': {
    name: 'Friends',
    level: 0,
    school: 'enchantment',
    castingTime: '1 action',
    range: 'Self',
    components: 'S, M (a small amount of makeup)',
    duration: '1 minute',
    concentration: true,
    description: 'For the duration, you have advantage on all Charisma checks directed at one creature of your choice that isn\'t hostile. When the spell ends, the creature realizes you used magic and becomes hostile.',
  },
  'Green-Flame Blade': {
    name: 'Green-Flame Blade',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Self (5-foot radius)',
    components: 'S, M (a melee weapon worth at least 1 sp)',
    duration: 'Instantaneous',
    description: 'You brandish the weapon and make a melee attack with it. On a hit, the target suffers the weapon attack\'s normal effects, and green fire leaps to a different creature within 5 feet, dealing fire damage equal to your spellcasting modifier.',
    higherLevels: 'At 5th level, the melee attack deals extra 1d8 fire damage, and the secondary damage becomes 1d8 + modifier. Both increase at 11th and 17th level.',
    damage: '1d8',
    damageType: 'fire',
    attackType: 'melee',
  },
  'Guidance': {
    name: 'Guidance',
    level: 0,
    school: 'divination',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: '1 minute',
    concentration: true,
    description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends.',
  },
  'Light': {
    name: 'Light',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, M (a firefly or phosphorescent moss)',
    duration: '1 hour',
    description: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. Completely covering the object blocks the light.',
  },
  'Mage Hand': {
    name: 'Mage Hand',
    level: 0,
    school: 'conjuration',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S',
    duration: '1 minute',
    description: 'A spectral, floating hand appears at a point you choose within range. The hand can manipulate an object, open an unlocked door or container, stow or retrieve an item, or pour out a vial. You can move the hand up to 30 feet each time you use it. The hand can\'t attack, activate magic items, or carry more than 10 pounds.',
  },
  'Mending': {
    name: 'Mending',
    level: 0,
    school: 'transmutation',
    castingTime: '1 minute',
    range: 'Touch',
    components: 'V, S, M (two lodestones)',
    duration: 'Instantaneous',
    description: 'This spell repairs a single break or tear in an object you touch, such as a broken chain link, two halves of a broken key, a torn cloak, or a leaking wineskin. The break must be no larger than 1 foot in any dimension. This spell can physically repair a magic item, but can\'t restore magic to such an object.',
  },
  'Message': {
    name: 'Message',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S, M (a short piece of copper wire)',
    duration: '1 round',
    description: 'You point your finger toward a creature within range and whisper a message. The target (and only the target) hears the message and can reply in a whisper that only you can hear. You can cast this spell through solid objects if you are familiar with the target.',
  },
  'Minor Illusion': {
    name: 'Minor Illusion',
    level: 0,
    school: 'illusion',
    castingTime: '1 action',
    range: '30 feet',
    components: 'S, M (a bit of fleece)',
    duration: '1 minute',
    description: 'You create a sound or an image of an object within range that lasts for the duration. If you create a sound, its volume can range from a whisper to a scream. If you create an image, it must fit within a 5-foot cube. The image can\'t create sound, light, smell, or any other sensory effect.',
  },
  'Poison Spray': {
    name: 'Poison Spray',
    level: 0,
    school: 'conjuration',
    castingTime: '1 action',
    range: '10 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You extend your hand toward a creature you can see within range and project a puff of noxious gas. The creature must succeed on a Constitution saving throw or take 1d12 poison damage.',
    higherLevels: 'Damage increases by 1d12 at 5th level (2d12), 11th level (3d12), and 17th level (4d12).',
    damage: '1d12',
    damageType: 'poison',
    savingThrow: 'constitution',
  },
  'Prestidigitation': {
    name: 'Prestidigitation',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '10 feet',
    components: 'V, S',
    duration: 'Up to 1 hour',
    description: 'A minor magical trick. You create a harmless sensory effect, light or snuff out a small flame, clean or soil an object, chill/warm/flavor nonliving material, make a small mark or symbol appear, or create a small trinket or illusory image that fits in your hand.',
  },
  'Produce Flame': {
    name: 'Produce Flame',
    level: 0,
    school: 'conjuration',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: '10 minutes',
    description: 'A flickering flame appears in your hand, shedding bright light in a 10-foot radius. The flame harms neither you nor your equipment. You can hurl the flame at a creature within 30 feet, making a ranged spell attack. On a hit, the target takes 1d8 fire damage and the spell ends.',
    higherLevels: 'Damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
    damage: '1d8',
    damageType: 'fire',
    attackType: 'ranged',
  },
  'Ray of Frost': {
    name: 'Ray of Frost',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack. On a hit, it takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn.',
    higherLevels: 'Damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
    damage: '1d8',
    damageType: 'cold',
    attackType: 'ranged',
  },
  'Resistance': {
    name: 'Resistance',
    level: 0,
    school: 'abjuration',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (a miniature cloak)',
    duration: '1 minute',
    concentration: true,
    description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one saving throw of its choice. It can roll the die before or after making the saving throw. The spell then ends.',
  },
  'Sacred Flame': {
    name: 'Sacred Flame',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.',
    higherLevels: 'Damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
    damage: '1d8',
    damageType: 'radiant',
    savingThrow: 'dexterity',
  },
  'Shillelagh': {
    name: 'Shillelagh',
    level: 0,
    school: 'transmutation',
    castingTime: '1 bonus action',
    range: 'Touch',
    components: 'V, S, M (mistletoe, a shamrock leaf, and a club or quarterstaff)',
    duration: '1 minute',
    description: 'The wood of a club or quarterstaff you are holding is imbued with nature\'s power. For the duration, you can use your spellcasting ability instead of Strength for attack and damage rolls, and the weapon\'s damage die becomes a d8. The weapon also becomes magical.',
  },
  'Shocking Grasp': {
    name: 'Shocking Grasp',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Lightning springs from your hand to deliver a shock. Make a melee spell attack. You have advantage if the target is wearing armor made of metal. On a hit, the target takes 1d8 lightning damage and can\'t take reactions until the start of its next turn.',
    higherLevels: 'Damage increases by 1d8 at 5th level (2d8), 11th level (3d8), and 17th level (4d8).',
    damage: '1d8',
    damageType: 'lightning',
    attackType: 'melee',
  },
  'Spare the Dying': {
    name: 'Spare the Dying',
    level: 0,
    school: 'necromancy',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You touch a living creature that has 0 hit points. The creature becomes stable. This spell has no effect on undead or constructs.',
  },
  'Thaumaturgy': {
    name: 'Thaumaturgy',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V',
    duration: 'Up to 1 minute',
    description: 'You manifest a minor wonder, a sign of supernatural power. You create one of several effects: your voice booms up to three times as loud, cause flames to flicker/brighten/dim/change color, cause harmless tremors, create a sound, cause a door or window to open or slam shut, or alter the appearance of your eyes.',
  },
  'Thorn Whip': {
    name: 'Thorn Whip',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M (the stem of a plant with thorns)',
    duration: 'Instantaneous',
    description: 'You create a long, vine-like whip covered in thorns that lashes out at a creature in range. Make a melee spell attack. On a hit, the creature takes 1d6 piercing damage, and if it is Large or smaller, you pull the creature up to 10 feet closer to you.',
    higherLevels: 'Damage increases by 1d6 at 5th level (2d6), 11th level (3d6), and 17th level (4d6).',
    damage: '1d6',
    damageType: 'piercing',
    attackType: 'melee',
  },
  'Thunderclap': {
    name: 'Thunderclap',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Self (5-foot radius)',
    components: 'S',
    duration: 'Instantaneous',
    description: 'You create a burst of thunderous sound that can be heard up to 100 feet away. Each creature within range, other than you, must succeed on a Constitution saving throw or take 1d6 thunder damage.',
    higherLevels: 'Damage increases by 1d6 at 5th level (2d6), 11th level (3d6), and 17th level (4d6).',
    damage: '1d6',
    damageType: 'thunder',
    savingThrow: 'constitution',
    areaOfEffect: '5-foot radius',
  },
  'Toll the Dead': {
    name: 'Toll the Dead',
    level: 0,
    school: 'necromancy',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You point at one creature you can see within range, and the sound of a dolorous bell fills the air around it for a moment. The target must succeed on a Wisdom saving throw or take 1d8 necrotic damage. If the target is missing any of its hit points, it instead takes 1d12 necrotic damage.',
    higherLevels: 'Damage increases by one die at 5th level (2d8/2d12), 11th level (3d8/3d12), and 17th level (4d8/4d12).',
    damage: '1d8/1d12',
    damageType: 'necrotic',
    savingThrow: 'wisdom',
  },
  'True Strike': {
    name: 'True Strike',
    level: 0,
    school: 'divination',
    castingTime: '1 action',
    range: 'Self',
    components: 'S',
    duration: '1 round',
    concentration: true,
    description: 'You extend your hand and point a finger at a target in range. Your magic grants you a brief insight into the target\'s defenses. On your next turn, you gain advantage on your first attack roll against the target, provided that this spell hasn\'t ended.',
  },
  'Vicious Mockery': {
    name: 'Vicious Mockery',
    level: 0,
    school: 'enchantment',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V',
    duration: 'Instantaneous',
    description: 'You unleash a string of insults laced with subtle enchantments at a creature you can see within range. If the target can hear you (though it need not understand you), it must succeed on a Wisdom saving throw or take 1d4 psychic damage and have disadvantage on the next attack roll it makes before the end of its next turn.',
    higherLevels: 'Damage increases by 1d4 at 5th level (2d4), 11th level (3d4), and 17th level (4d4).',
    damage: '1d4',
    damageType: 'psychic',
    savingThrow: 'wisdom',
  },
  'Word of Radiance': {
    name: 'Word of Radiance',
    level: 0,
    school: 'evocation',
    castingTime: '1 action',
    range: '5 feet',
    components: 'V, M (a holy symbol)',
    duration: 'Instantaneous',
    description: 'You utter a divine word, and burning radiance erupts from you. Each creature of your choice that you can see within range must succeed on a Constitution saving throw or take 1d6 radiant damage.',
    higherLevels: 'Damage increases by 1d6 at 5th level (2d6), 11th level (3d6), and 17th level (4d6).',
    damage: '1d6',
    damageType: 'radiant',
    savingThrow: 'constitution',
    areaOfEffect: '5-foot radius',
  },

  // ===== 1ST LEVEL SPELLS =====
  'Animal Friendship': {
    name: 'Animal Friendship',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M (a morsel of food)',
    duration: '24 hours',
    description: 'This spell lets you convince a beast that you mean it no harm. Choose a beast that you can see within range. It must see and hear you. If the beast\'s Intelligence is 4 or higher, the spell fails. Otherwise, the beast must succeed on a Wisdom saving throw or be charmed by you for the spell\'s duration.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional beast for each slot level above 1st.',
    savingThrow: 'wisdom',
  },
  'Armor of Agathys': {
    name: 'Armor of Agathys',
    level: 1,
    school: 'abjuration',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S, M (a cup of water)',
    duration: '1 hour',
    description: 'A protective magical force surrounds you, manifesting as a spectral frost that covers you and your gear. You gain 5 temporary hit points for the duration. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, both the temporary hit points and the cold damage increase by 5 for each slot level above 1st.',
    damage: '5',
    damageType: 'cold',
  },
  'Bless': {
    name: 'Bless',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M (a sprinkling of holy water)',
    duration: '1 minute',
    concentration: true,
    description: 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
  },
  'Burning Hands': {
    name: 'Burning Hands',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Self (15-foot cone)',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
    damage: '3d6',
    damageType: 'fire',
    savingThrow: 'dexterity',
    areaOfEffect: '15-foot cone',
  },
  'Charm Person': {
    name: 'Charm Person',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S',
    duration: '1 hour',
    description: 'You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and does so with advantage if you or your companions are fighting it. If it fails, it is charmed by you until the spell ends or until you or your companions do anything harmful to it. The charmed creature regards you as a friendly acquaintance. When the spell ends, the creature knows it was charmed by you.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
    savingThrow: 'wisdom',
  },
  'Chromatic Orb': {
    name: 'Chromatic Orb',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '90 feet',
    components: 'V, S, M (a diamond worth at least 50 gp)',
    duration: 'Instantaneous',
    description: 'You hurl a 4-inch-diameter sphere of energy at a creature that you can see within range. You choose acid, cold, fire, lightning, poison, or thunder for the type of orb you create, and then make a ranged spell attack. On a hit, the creature takes 3d8 damage of the type you chose.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.',
    damage: '3d8',
    attackType: 'ranged',
  },
  'Command': {
    name: 'Command',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V',
    duration: 'Instantaneous',
    description: 'You speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom saving throw or follow the command on its next turn. The spell has no effect if the target is undead, if it doesn\'t understand your language, or if your command is directly harmful to it. Common commands: Approach, Drop, Flee, Grovel, Halt.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional creature for each slot level above 1st.',
    savingThrow: 'wisdom',
  },
  'Cure Wounds': {
    name: 'Cure Wounds',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.',
    healing: '1d8',
  },
  'Detect Magic': {
    name: 'Detect Magic',
    level: 1,
    school: 'divination',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: '10 minutes',
    concentration: true,
    ritual: true,
    description: 'For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any.',
  },
  'Disguise Self': {
    name: 'Disguise Self',
    level: 1,
    school: 'illusion',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: '1 hour',
    description: 'You make yourself—including your clothing, armor, weapons, and other belongings on your person—look different until the spell ends or until you use your action to dismiss it. You can seem 1 foot shorter or taller and can appear thin, fat, or in between. You can\'t change your body type, so you must adopt a form that has the same basic arrangement of limbs.',
  },
  'Dissonant Whispers': {
    name: 'Dissonant Whispers',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V',
    duration: 'Instantaneous',
    description: 'You whisper a discordant melody that only one creature of your choice within range can hear, wracking it with terrible pain. The target must make a Wisdom saving throw. On a failed save, it takes 3d6 psychic damage and must immediately use its reaction, if available, to move as far as its speed allows away from you. On a successful save, the target takes half as much damage and doesn\'t have to move away.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
    damage: '3d6',
    damageType: 'psychic',
    savingThrow: 'wisdom',
  },
  'Entangle': {
    name: 'Entangle',
    level: 1,
    school: 'conjuration',
    castingTime: '1 action',
    range: '90 feet',
    components: 'V, S',
    duration: '1 minute',
    concentration: true,
    description: 'Grasping weeds and vines sprout from the ground in a 20-foot square starting from a point within range. For the duration, these plants turn the ground in the area into difficult terrain. A creature in the area when you cast the spell must succeed on a Strength saving throw or be restrained by the entangling plants until the spell ends.',
    savingThrow: 'strength',
    areaOfEffect: '20-foot square',
  },
  'Faerie Fire': {
    name: 'Faerie Fire',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V',
    duration: '1 minute',
    concentration: true,
    description: 'Each object in a 20-foot cube within range is outlined in blue, green, or violet light (your choice). Any creature in the area when the spell is cast is also outlined in light if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed dim light in a 10-foot radius. Any attack roll against an affected creature or object has advantage if the attacker can see it, and the affected creature or object can\'t benefit from being invisible.',
    savingThrow: 'dexterity',
    areaOfEffect: '20-foot cube',
  },
  'Find Familiar': {
    name: 'Find Familiar',
    level: 1,
    school: 'conjuration',
    castingTime: '1 hour',
    range: '10 feet',
    components: 'V, S, M (10 gp worth of charcoal, incense, and herbs consumed)',
    duration: 'Instantaneous',
    ritual: true,
    description: 'You gain the service of a familiar, a spirit that takes an animal form you choose: bat, cat, crab, frog, hawk, lizard, octopus, owl, poisonous snake, fish, rat, raven, sea horse, spider, or weasel. The familiar can deliver touch spells, scout ahead, and communicate telepathically within 100 feet.',
  },
  'Fog Cloud': {
    name: 'Fog Cloud',
    level: 1,
    school: 'conjuration',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: '1 hour',
    concentration: true,
    description: 'You create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners, and its area is heavily obscured. It lasts for the duration or until a wind of moderate or greater speed (at least 10 miles per hour) disperses it.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the radius of the fog increases by 20 feet for each slot level above 1st.',
    areaOfEffect: '20-foot-radius sphere',
  },
  'Goodberry': {
    name: 'Goodberry',
    level: 1,
    school: 'transmutation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (a sprig of mistletoe)',
    duration: 'Instantaneous',
    description: 'Up to ten berries appear in your hand and are infused with magic for the duration. A creature can use its action to eat one berry. Eating a berry restores 1 hit point, and the berry provides enough nourishment to sustain a creature for one day. The berries lose their potency if they have not been consumed within 24 hours.',
    healing: '1',
  },
  'Grease': {
    name: 'Grease',
    level: 1,
    school: 'conjuration',
    castingTime: '1 action',
    range: '60 feet',
    components: 'V, S, M (a bit of pork rind or butter)',
    duration: '1 minute',
    description: 'Slick grease covers the ground in a 10-foot square centered on a point within range and turns it into difficult terrain for the duration. When the grease appears, each creature standing in its area must succeed on a Dexterity saving throw or fall prone. A creature that enters the area or ends its turn there must also succeed on a Dexterity saving throw or fall prone.',
    savingThrow: 'dexterity',
    areaOfEffect: '10-foot square',
  },
  'Guiding Bolt': {
    name: 'Guiding Bolt',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: '1 round',
    description: 'A flash of light streaks toward a creature of your choice within range. Make a ranged spell attack against the target. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage, thanks to the mystical dim light glittering on the target until then.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.',
    damage: '4d6',
    damageType: 'radiant',
    attackType: 'ranged',
  },
  'Healing Word': {
    name: 'Healing Word',
    level: 1,
    school: 'evocation',
    castingTime: '1 bonus action',
    range: '60 feet',
    components: 'V',
    duration: 'Instantaneous',
    description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.',
    healing: '1d4',
  },
  'Hellish Rebuke': {
    name: 'Hellish Rebuke',
    level: 1,
    school: 'evocation',
    castingTime: '1 reaction',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You point your finger, and the creature that damaged you is momentarily surrounded by hellish flames. The creature must make a Dexterity saving throw. It takes 2d10 fire damage on a failed save, or half as much damage on a successful one.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d10 for each slot level above 1st.',
    damage: '2d10',
    damageType: 'fire',
    savingThrow: 'dexterity',
  },
  'Heroism': {
    name: 'Heroism',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: '1 minute',
    concentration: true,
    description: 'A willing creature you touch is imbued with bravery. Until the spell ends, the creature is immune to being frightened and gains temporary hit points equal to your spellcasting ability modifier at the start of each of its turns. When the spell ends, the target loses any remaining temporary hit points from this spell.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
  },
  'Hex': {
    name: 'Hex',
    level: 1,
    school: 'enchantment',
    castingTime: '1 bonus action',
    range: '90 feet',
    components: 'V, S, M (the petrified eye of a newt)',
    duration: '1 hour',
    concentration: true,
    description: 'You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 necrotic damage to the target whenever you hit it with an attack. Also, choose one ability when you cast the spell. The target has disadvantage on ability checks made with the chosen ability.',
    higherLevels: 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain concentration for up to 8 hours. At 5th level or higher, 24 hours.',
    damage: '1d6',
    damageType: 'necrotic',
  },
  'Hunter\'s Mark': {
    name: 'Hunter\'s Mark',
    level: 1,
    school: 'divination',
    castingTime: '1 bonus action',
    range: '90 feet',
    components: 'V',
    duration: '1 hour',
    concentration: true,
    description: 'You choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack, and you have advantage on any Wisdom (Perception) or Wisdom (Survival) check you make to find it.',
    higherLevels: 'When you cast this spell using a spell slot of 3rd or 4th level, you can maintain concentration for up to 8 hours. At 5th level or higher, 24 hours.',
    damage: '1d6',
  },
  'Identify': {
    name: 'Identify',
    level: 1,
    school: 'divination',
    castingTime: '1 minute',
    range: 'Touch',
    components: 'V, S, M (a pearl worth at least 100 gp and an owl feather)',
    duration: 'Instantaneous',
    ritual: true,
    description: 'You choose one object that you must touch throughout the casting of the spell. If it is a magic item or some other magic-imbued object, you learn its properties and how to use them, whether it requires attunement to use, and how many charges it has, if any. You learn whether any spells are affecting the item.',
  },
  'Inflict Wounds': {
    name: 'Inflict Wounds',
    level: 1,
    school: 'necromancy',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Make a melee spell attack against a creature you can reach. On a hit, the target takes 3d10 necrotic damage.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d10 for each slot level above 1st.',
    damage: '3d10',
    damageType: 'necrotic',
    attackType: 'melee',
  },
  'Jump': {
    name: 'Jump',
    level: 1,
    school: 'transmutation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (a grasshopper\'s hind leg)',
    duration: '1 minute',
    description: 'You touch a creature. The creature\'s jump distance is tripled until the spell ends.',
  },
  'Longstrider': {
    name: 'Longstrider',
    level: 1,
    school: 'transmutation',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (a pinch of dirt)',
    duration: '1 hour',
    description: 'You touch a creature. The target\'s speed increases by 10 feet until the spell ends.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.',
  },
  'Mage Armor': {
    name: 'Mage Armor',
    level: 1,
    school: 'abjuration',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (a piece of cured leather)',
    duration: '8 hours',
    description: 'You touch a willing creature who isn\'t wearing armor, and a protective magical force surrounds it until the spell ends. The target\'s base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss the spell as an action.',
  },
  'Magic Missile': {
    name: 'Magic Missile',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.',
    damage: '1d4+1',
    damageType: 'force',
  },
  'Protection from Evil and Good': {
    name: 'Protection from Evil and Good',
    level: 1,
    school: 'abjuration',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V, S, M (holy water or powdered silver and iron)',
    duration: '10 minutes',
    concentration: true,
    description: 'Until the spell ends, one willing creature you touch is protected against certain types of creatures: aberrations, celestials, elementals, fey, fiends, and undead. The protection grants several benefits: these creatures have disadvantage on attack rolls against the target, the target can\'t be charmed, frightened, or possessed by them.',
  },
  'Sanctuary': {
    name: 'Sanctuary',
    level: 1,
    school: 'abjuration',
    castingTime: '1 bonus action',
    range: '30 feet',
    components: 'V, S, M (a small silver mirror)',
    duration: '1 minute',
    description: 'You ward a creature within range against attack. Until the spell ends, any creature who targets the warded creature with an attack or a harmful spell must first make a Wisdom saving throw. On a failed save, the creature must choose a new target or lose the attack or spell. This spell doesn\'t protect the warded creature from area effects.',
    savingThrow: 'wisdom',
  },
  'Shield': {
    name: 'Shield',
    level: 1,
    school: 'abjuration',
    castingTime: '1 reaction',
    range: 'Self',
    components: 'V, S',
    duration: '1 round',
    description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.',
  },
  'Shield of Faith': {
    name: 'Shield of Faith',
    level: 1,
    school: 'abjuration',
    castingTime: '1 bonus action',
    range: '60 feet',
    components: 'V, S, M (a small parchment with holy text)',
    duration: '10 minutes',
    concentration: true,
    description: 'A shimmering field appears and surrounds a creature of your choice within range, granting it a +2 bonus to AC for the duration.',
  },
  'Sleep': {
    name: 'Sleep',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '90 feet',
    components: 'V, S, M (a pinch of fine sand, rose petals, or a cricket)',
    duration: '1 minute',
    description: 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect. Creatures within 20 feet of a point you choose within range are affected in ascending order of their current hit points (ignoring unconscious creatures).',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, roll an additional 2d8 for each slot level above 1st.',
    areaOfEffect: '20-foot radius',
  },
  'Speak with Animals': {
    name: 'Speak with Animals',
    level: 1,
    school: 'divination',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: '10 minutes',
    ritual: true,
    description: 'You gain the ability to comprehend and verbally communicate with beasts for the duration. The knowledge and awareness of many beasts is limited by their intelligence, but at minimum, beasts can give you information about nearby locations and monsters, including whatever they can perceive or have perceived within the past day.',
  },
  'Tasha\'s Hideous Laughter': {
    name: 'Tasha\'s Hideous Laughter',
    level: 1,
    school: 'enchantment',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M (tiny tarts and a feather)',
    duration: '1 minute',
    concentration: true,
    description: 'A creature of your choice that you can see within range perceives everything as hilariously funny and falls into fits of laughter if this spell affects it. The target must succeed on a Wisdom saving throw or fall prone, becoming incapacitated and unable to stand up for the duration. A creature with an Intelligence score of 4 or less isn\'t affected.',
    savingThrow: 'wisdom',
  },
  'Thunderwave': {
    name: 'Thunderwave',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: 'Self (15-foot cube)',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn\'t pushed.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.',
    damage: '2d8',
    damageType: 'thunder',
    savingThrow: 'constitution',
    areaOfEffect: '15-foot cube',
  },
  'Witch Bolt': {
    name: 'Witch Bolt',
    level: 1,
    school: 'evocation',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M (a twig from a tree struck by lightning)',
    duration: '1 minute',
    concentration: true,
    description: 'A beam of crackling, blue energy lances out toward a creature within range, forming a sustained arc of lightning between you and the target. Make a ranged spell attack. On a hit, the target takes 1d12 lightning damage. On each of your turns for the duration, you can use your action to deal 1d12 lightning damage to the target automatically.',
    higherLevels: 'When you cast this spell using a spell slot of 2nd level or higher, the initial damage increases by 1d12 for each slot level above 1st.',
    damage: '1d12',
    damageType: 'lightning',
    attackType: 'ranged',
  },
  'Wrathful Smite': {
    name: 'Wrathful Smite',
    level: 1,
    school: 'evocation',
    castingTime: '1 bonus action',
    range: 'Self',
    components: 'V',
    duration: '1 minute',
    concentration: true,
    description: 'The next time you hit with a melee weapon attack during this spell\'s duration, your attack deals an extra 1d6 psychic damage. Additionally, if the target is a creature, it must make a Wisdom saving throw or be frightened of you until the spell ends. As an action, the creature can make a Wisdom check against your spell save DC to steel its resolve and end this spell.',
    damage: '1d6',
    damageType: 'psychic',
    savingThrow: 'wisdom',
  },
};

// Helper function to get spell details by name
export function getSpellDetails(spellName: string): SpellDetails | undefined {
  return SPELL_DETAILS[spellName];
}

// Cantrips by class
export const CLASS_CANTRIPS: Partial<Record<CharacterClass, { name: string; description: string }[]>> = {
  bard: [
    { name: 'Blade Ward', description: 'Resistance to bludgeoning, piercing, and slashing damage' },
    { name: 'Dancing Lights', description: 'Create up to four torch-sized lights' },
    { name: 'Friends', description: 'Advantage on Charisma checks against one creature' },
    { name: 'Light', description: 'Object sheds bright light in 20-foot radius' },
    { name: 'Mage Hand', description: 'Spectral hand manipulates objects at range' },
    { name: 'Mending', description: 'Repair a single break or tear in an object' },
    { name: 'Message', description: 'Whispered message to creature within 120 feet' },
    { name: 'Minor Illusion', description: 'Create a sound or image of an object' },
    { name: 'Prestidigitation', description: 'Minor magical tricks' },
    { name: 'Thunderclap', description: 'Burst of thunderous sound damages creatures nearby' },
    { name: 'True Strike', description: 'Gain advantage on your next attack roll' },
    { name: 'Vicious Mockery', description: 'Psychic damage and disadvantage on next attack' },
  ],
  cleric: [
    { name: 'Guidance', description: 'Add d4 to one ability check' },
    { name: 'Light', description: 'Object sheds bright light in 20-foot radius' },
    { name: 'Mending', description: 'Repair a single break or tear in an object' },
    { name: 'Resistance', description: 'Add d4 to one saving throw' },
    { name: 'Sacred Flame', description: 'Radiant damage, Dex save for no damage' },
    { name: 'Spare the Dying', description: 'Stabilize a creature at 0 HP' },
    { name: 'Thaumaturgy', description: 'Minor divine magical effects' },
    { name: 'Toll the Dead', description: 'Necrotic damage, Wis save' },
    { name: 'Word of Radiance', description: 'Radiant damage to creatures within 5 feet' },
  ],
  druid: [
    { name: 'Druidcraft', description: 'Minor nature-themed magical effects' },
    { name: 'Guidance', description: 'Add d4 to one ability check' },
    { name: 'Mending', description: 'Repair a single break or tear in an object' },
    { name: 'Poison Spray', description: 'Poison damage, Con save' },
    { name: 'Produce Flame', description: 'Flame in hand for light or attack' },
    { name: 'Resistance', description: 'Add d4 to one saving throw' },
    { name: 'Shillelagh', description: 'Club/quarterstaff uses spellcasting ability' },
    { name: 'Thorn Whip', description: 'Pull creature 10 feet toward you' },
    { name: 'Thunderclap', description: 'Burst of thunderous sound damages creatures nearby' },
  ],
  sorcerer: [
    { name: 'Acid Splash', description: 'Acid damage to one or two creatures' },
    { name: 'Blade Ward', description: 'Resistance to weapon damage' },
    { name: 'Chill Touch', description: 'Necrotic damage, target can\'t regain HP' },
    { name: 'Dancing Lights', description: 'Create up to four torch-sized lights' },
    { name: 'Fire Bolt', description: 'Ranged fire attack, 1d10 damage' },
    { name: 'Friends', description: 'Advantage on Charisma checks' },
    { name: 'Light', description: 'Object sheds bright light' },
    { name: 'Mage Hand', description: 'Spectral hand manipulates objects' },
    { name: 'Message', description: 'Whispered message at range' },
    { name: 'Minor Illusion', description: 'Create a sound or image' },
    { name: 'Poison Spray', description: 'Poison damage, Con save' },
    { name: 'Prestidigitation', description: 'Minor magical tricks' },
    { name: 'Ray of Frost', description: 'Cold damage and reduce speed' },
    { name: 'Shocking Grasp', description: 'Lightning damage, no reactions' },
    { name: 'True Strike', description: 'Advantage on next attack' },
  ],
  warlock: [
    { name: 'Blade Ward', description: 'Resistance to weapon damage' },
    { name: 'Chill Touch', description: 'Necrotic damage, no HP regen' },
    { name: 'Eldritch Blast', description: 'Force damage beam, 1d10' },
    { name: 'Friends', description: 'Advantage on Charisma checks' },
    { name: 'Mage Hand', description: 'Spectral hand' },
    { name: 'Minor Illusion', description: 'Sound or image' },
    { name: 'Poison Spray', description: 'Poison damage' },
    { name: 'Prestidigitation', description: 'Minor tricks' },
    { name: 'True Strike', description: 'Advantage on attack' },
  ],
  wizard: [
    { name: 'Acid Splash', description: 'Acid damage' },
    { name: 'Blade Ward', description: 'Resistance to weapon damage' },
    { name: 'Chill Touch', description: 'Necrotic damage' },
    { name: 'Dancing Lights', description: 'Create lights' },
    { name: 'Fire Bolt', description: '1d10 fire damage' },
    { name: 'Friends', description: 'Charisma advantage' },
    { name: 'Light', description: 'Bright light' },
    { name: 'Mage Hand', description: 'Spectral hand' },
    { name: 'Mending', description: 'Repair objects' },
    { name: 'Message', description: 'Whispered message' },
    { name: 'Minor Illusion', description: 'Sound or image' },
    { name: 'Poison Spray', description: 'Poison damage' },
    { name: 'Prestidigitation', description: 'Minor tricks' },
    { name: 'Ray of Frost', description: 'Cold damage' },
    { name: 'Shocking Grasp', description: 'Lightning damage' },
    { name: 'True Strike', description: 'Attack advantage' },
  ],
};

// Number of cantrips known at level 1
export const CANTRIPS_KNOWN: Partial<Record<CharacterClass, number>> = {
  bard: 2,
  cleric: 3,
  druid: 2,
  sorcerer: 4,
  warlock: 2,
  wizard: 3,
};

// Level 1 spells by class
export const CLASS_SPELLS_LEVEL_1: Partial<Record<CharacterClass, { name: string; description: string }[]>> = {
  bard: [
    { name: 'Charm Person', description: 'Charm a humanoid' },
    { name: 'Cure Wounds', description: 'Heal 1d8 + mod HP' },
    { name: 'Detect Magic', description: 'Sense magic within 30 feet' },
    { name: 'Disguise Self', description: 'Change your appearance' },
    { name: 'Faerie Fire', description: 'Outline creatures, grant advantage' },
    { name: 'Healing Word', description: 'Bonus action heal 1d4 + mod' },
    { name: 'Heroism', description: 'Temp HP each turn, immune to frightened' },
    { name: 'Sleep', description: 'Put creatures to sleep' },
    { name: 'Speak with Animals', description: 'Communicate with beasts' },
    { name: 'Thunderwave', description: '2d8 thunder, push creatures' },
  ],
  cleric: [
    { name: 'Bless', description: 'Add d4 to attacks and saves' },
    { name: 'Command', description: 'One-word command' },
    { name: 'Cure Wounds', description: 'Heal 1d8 + mod' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Guiding Bolt', description: '4d6 radiant, advantage on next attack' },
    { name: 'Healing Word', description: 'Bonus action heal' },
    { name: 'Inflict Wounds', description: '3d10 necrotic damage' },
    { name: 'Protection from Evil', description: 'Ward against creature types' },
    { name: 'Sanctuary', description: 'Creatures must save to attack target' },
    { name: 'Shield of Faith', description: '+2 AC for 10 minutes' },
  ],
  druid: [
    { name: 'Animal Friendship', description: 'Charm a beast' },
    { name: 'Cure Wounds', description: 'Heal 1d8 + mod' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Entangle', description: 'Restrain creatures in area' },
    { name: 'Faerie Fire', description: 'Outline creatures' },
    { name: 'Fog Cloud', description: 'Create obscuring fog' },
    { name: 'Goodberry', description: 'Create 10 healing berries' },
    { name: 'Healing Word', description: 'Bonus action heal' },
    { name: 'Speak with Animals', description: 'Talk to beasts' },
    { name: 'Thunderwave', description: '2d8 thunder damage' },
  ],
  paladin: [
    { name: 'Bless', description: 'Add d4 to attacks/saves' },
    { name: 'Command', description: 'One-word command' },
    { name: 'Cure Wounds', description: 'Heal 1d8 + mod' },
    { name: 'Detect Evil and Good', description: 'Sense creature types' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Divine Favor', description: '+1d4 radiant to attacks' },
    { name: 'Protection from Evil', description: 'Ward against creatures' },
    { name: 'Shield of Faith', description: '+2 AC' },
    { name: 'Thunderous Smite', description: '2d6 thunder, push' },
    { name: 'Wrathful Smite', description: '1d6 psychic, frighten' },
  ],
  ranger: [
    { name: 'Alarm', description: 'Ward an area' },
    { name: 'Animal Friendship', description: 'Charm a beast' },
    { name: 'Cure Wounds', description: 'Heal 1d8 + mod' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Ensnaring Strike', description: 'Restrain on hit' },
    { name: 'Fog Cloud', description: 'Obscuring fog' },
    { name: 'Goodberry', description: 'Healing berries' },
    { name: 'Hail of Thorns', description: 'AoE on arrow hit' },
    { name: 'Hunter\'s Mark', description: '+1d6 damage to target' },
    { name: 'Speak with Animals', description: 'Talk to beasts' },
  ],
  sorcerer: [
    { name: 'Burning Hands', description: '3d6 fire cone' },
    { name: 'Charm Person', description: 'Charm humanoid' },
    { name: 'Chromatic Orb', description: '3d8 chosen element' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Disguise Self', description: 'Change appearance' },
    { name: 'Mage Armor', description: 'AC 13 + Dex' },
    { name: 'Magic Missile', description: '3 auto-hit darts, 1d4+1 each' },
    { name: 'Shield', description: '+5 AC reaction' },
    { name: 'Sleep', description: 'Put creatures to sleep' },
    { name: 'Thunderwave', description: '2d8 thunder push' },
  ],
  warlock: [
    { name: 'Armor of Agathys', description: 'Temp HP and cold damage' },
    { name: 'Arms of Hadar', description: '2d6 necrotic AoE' },
    { name: 'Charm Person', description: 'Charm humanoid' },
    { name: 'Comprehend Languages', description: 'Understand languages' },
    { name: 'Expeditious Retreat', description: 'Bonus action Dash' },
    { name: 'Hellish Rebuke', description: '2d10 fire reaction' },
    { name: 'Hex', description: '+1d6 damage, disadvantage on checks' },
    { name: 'Protection from Evil', description: 'Ward against creatures' },
    { name: 'Unseen Servant', description: 'Invisible helper' },
    { name: 'Witch Bolt', description: '1d12 lightning sustained' },
  ],
  wizard: [
    { name: 'Burning Hands', description: '3d6 fire cone' },
    { name: 'Charm Person', description: 'Charm humanoid' },
    { name: 'Detect Magic', description: 'Sense magic' },
    { name: 'Disguise Self', description: 'Change appearance' },
    { name: 'Find Familiar', description: 'Summon familiar' },
    { name: 'Mage Armor', description: 'AC 13 + Dex' },
    { name: 'Magic Missile', description: '3 auto-hit darts' },
    { name: 'Shield', description: '+5 AC reaction' },
    { name: 'Sleep', description: 'Put creatures to sleep' },
    { name: 'Thunderwave', description: '2d8 thunder push' },
  ],
};

// Spells known/prepared at level 1
export const SPELLS_AT_LEVEL_1: Partial<Record<CharacterClass, number>> = {
  bard: 4,
  cleric: 0, // Prepared caster: Wis mod + level
  druid: 0, // Prepared caster: Wis mod + level
  paladin: 0, // Prepared caster: Cha mod + half level
  ranger: 2,
  sorcerer: 2,
  warlock: 2,
  wizard: 6, // In spellbook, prepare Int mod + level
};

// Cantrips known by level (2024 PHB progression)
export const CANTRIPS_KNOWN_BY_LEVEL: Partial<Record<CharacterClass, Record<number, number>>> = {
  bard: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  cleric: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5 },
  druid: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  sorcerer: { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6 },
  warlock: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4 },
  wizard: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5 },
};

// Spells known by level for "known" casters (Bard, Sorcerer, Ranger, Warlock)
export const SPELLS_KNOWN_BY_LEVEL: Partial<Record<CharacterClass, Record<number, number>>> = {
  bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15 },
  ranger: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7 },
  sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12 },
  warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11 },
};

// XP thresholds for character level advancement
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
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

// Level 2 spells by class (abbreviated: name + 1-line description)
export const CLASS_SPELLS_LEVEL_2: Partial<Record<CharacterClass, { name: string; description: string }[]>> = {
  bard: [
    { name: 'Calm Emotions', description: 'Suppress strong emotions in a 20-foot radius' },
    { name: 'Enhance Ability', description: 'Grant advantage on one ability\'s checks' },
    { name: 'Enthrall', description: 'Captivate creatures that can see and hear you' },
    { name: 'Heat Metal', description: 'Heat metal object, causing 2d8 fire damage' },
    { name: 'Hold Person', description: 'Paralyze a humanoid creature' },
    { name: 'Invisibility', description: 'Target becomes invisible for 1 hour' },
    { name: 'Knock', description: 'Open a locked door, chest, or shackle' },
    { name: 'Lesser Restoration', description: 'End a condition or disease' },
    { name: 'Shatter', description: '3d8 thunder damage in 10-foot radius' },
    { name: 'Suggestion', description: 'Suggest a course of action' },
  ],
  cleric: [
    { name: 'Aid', description: 'Increase max HP for up to 3 creatures by 5' },
    { name: 'Augury', description: 'Receive an omen about a course of action' },
    { name: 'Blindness/Deafness', description: 'Blind or deafen a creature' },
    { name: 'Calm Emotions', description: 'Suppress strong emotions' },
    { name: 'Enhance Ability', description: 'Grant advantage on ability checks' },
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Lesser Restoration', description: 'End one condition or disease' },
    { name: 'Prayer of Healing', description: 'Heal up to 6 creatures 2d8+mod' },
    { name: 'Silence', description: 'Create 20-foot radius of silence' },
    { name: 'Spiritual Weapon', description: 'Create floating weapon, 1d8+mod force' },
  ],
  druid: [
    { name: 'Barkskin', description: 'Target\'s AC can\'t be less than 16' },
    { name: 'Beast Sense', description: 'See through a beast\'s senses' },
    { name: 'Enhance Ability', description: 'Grant advantage on ability checks' },
    { name: 'Flame Blade', description: 'Create 3d6 fire damage blade' },
    { name: 'Gust of Wind', description: 'Create 60-foot line of strong wind' },
    { name: 'Heat Metal', description: 'Heat metal, cause 2d8 fire damage' },
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Lesser Restoration', description: 'End one condition' },
    { name: 'Moonbeam', description: '2d10 radiant in 5-foot cylinder' },
    { name: 'Spike Growth', description: 'Create 20-foot radius of difficult terrain' },
  ],
  paladin: [
    { name: 'Aid', description: 'Increase max HP for 3 creatures' },
    { name: 'Branding Smite', description: 'Next hit deals 2d6 radiant, reveals invisible' },
    { name: 'Find Steed', description: 'Summon a spirit as a mount' },
    { name: 'Lesser Restoration', description: 'End a condition or disease' },
    { name: 'Locate Object', description: 'Sense direction to an object' },
    { name: 'Magic Weapon', description: 'Weapon becomes +1 magic weapon' },
    { name: 'Protection from Poison', description: 'Neutralize poison, advantage vs poison' },
    { name: 'Warding Bond', description: 'Share damage with protected creature' },
    { name: 'Zone of Truth', description: 'Creatures can\'t lie in 15-foot radius' },
    { name: 'Prayer of Healing', description: 'Heal up to 6 creatures' },
  ],
  ranger: [
    { name: 'Barkskin', description: 'AC can\'t be less than 16' },
    { name: 'Beast Sense', description: 'See through a beast\'s senses' },
    { name: 'Cordon of Arrows', description: 'Arrows attack creatures entering area' },
    { name: 'Find Traps', description: 'Sense presence of traps' },
    { name: 'Lesser Restoration', description: 'End one condition' },
    { name: 'Locate Animals or Plants', description: 'Sense direction to creature or plant' },
    { name: 'Pass Without Trace', description: '+10 to Stealth for group' },
    { name: 'Protection from Poison', description: 'Neutralize poison' },
    { name: 'Silence', description: 'Create 20-foot silence radius' },
    { name: 'Spike Growth', description: 'Create damaging difficult terrain' },
  ],
  sorcerer: [
    { name: 'Alter Self', description: 'Transform your body' },
    { name: 'Blindness/Deafness', description: 'Blind or deafen a creature' },
    { name: 'Blur', description: 'Attacks against you have disadvantage' },
    { name: 'Darkness', description: 'Create magical darkness in 15-foot radius' },
    { name: 'Enhance Ability', description: 'Grant advantage on ability checks' },
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Invisibility', description: 'Target becomes invisible' },
    { name: 'Knock', description: 'Open a lock' },
    { name: 'Mirror Image', description: 'Create 3 illusory duplicates' },
    { name: 'Misty Step', description: 'Bonus action teleport 30 feet' },
  ],
  warlock: [
    { name: 'Cloud of Daggers', description: '4d4 slashing in 5-foot cube' },
    { name: 'Crown of Madness', description: 'Charm and control humanoid' },
    { name: 'Darkness', description: 'Create magical darkness' },
    { name: 'Enthrall', description: 'Captivate creatures' },
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Invisibility', description: 'Target becomes invisible' },
    { name: 'Mirror Image', description: 'Create illusory duplicates' },
    { name: 'Misty Step', description: 'Teleport 30 feet' },
    { name: 'Ray of Enfeeblement', description: 'Halve target\'s weapon damage' },
    { name: 'Shatter', description: '3d8 thunder damage' },
  ],
  wizard: [
    { name: 'Alter Self', description: 'Transform your body' },
    { name: 'Arcane Lock', description: 'Magically lock a door or container' },
    { name: 'Blindness/Deafness', description: 'Blind or deafen a creature' },
    { name: 'Blur', description: 'Attacks have disadvantage against you' },
    { name: 'Darkness', description: 'Create magical darkness' },
    { name: 'Hold Person', description: 'Paralyze a humanoid' },
    { name: 'Invisibility', description: 'Target becomes invisible' },
    { name: 'Knock', description: 'Open a lock' },
    { name: 'Levitate', description: 'Float a creature or object' },
    { name: 'Misty Step', description: 'Teleport 30 feet' },
  ],
};

// Level 3 spells by class (abbreviated: name + 1-line description)
export const CLASS_SPELLS_LEVEL_3: Partial<Record<CharacterClass, { name: string; description: string }[]>> = {
  bard: [
    { name: 'Bestow Curse', description: 'Curse a creature with various effects' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Fear', description: 'Frighten creatures in a 30-foot cone' },
    { name: 'Hypnotic Pattern', description: 'Charm creatures in 30-foot cube' },
    { name: 'Major Image', description: 'Create a detailed illusion' },
    { name: 'Plant Growth', description: 'Enhance or overgrow plants' },
    { name: 'Sending', description: 'Send a 25-word message anywhere' },
    { name: 'Speak with Dead', description: 'Ask a corpse up to 5 questions' },
    { name: 'Stinking Cloud', description: 'Nauseating 20-foot radius cloud' },
    { name: 'Tongues', description: 'Understand and speak any language' },
  ],
  cleric: [
    { name: 'Animate Dead', description: 'Create undead servants' },
    { name: 'Beacon of Hope', description: 'Grant advantage on WIS saves, max healing' },
    { name: 'Bestow Curse', description: 'Curse a creature' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Glyph of Warding', description: 'Create a magical trap' },
    { name: 'Mass Healing Word', description: 'Heal up to 6 creatures' },
    { name: 'Protection from Energy', description: 'Grant resistance to one damage type' },
    { name: 'Remove Curse', description: 'End curses on a creature' },
    { name: 'Revivify', description: 'Restore life to creature dead less than 1 minute' },
    { name: 'Spirit Guardians', description: '3d8 damage to creatures near you' },
  ],
  druid: [
    { name: 'Call Lightning', description: '3d10 lightning from storm cloud' },
    { name: 'Conjure Animals', description: 'Summon fey spirits as beasts' },
    { name: 'Daylight', description: 'Create 60-foot bright light sphere' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Plant Growth', description: 'Enhance or overgrow plants' },
    { name: 'Protection from Energy', description: 'Grant resistance to damage type' },
    { name: 'Sleet Storm', description: 'Create slippery, obscured area' },
    { name: 'Speak with Plants', description: 'Communicate with plants' },
    { name: 'Water Breathing', description: 'Up to 10 creatures can breathe underwater' },
    { name: 'Wind Wall', description: 'Create wall of strong wind' },
  ],
  paladin: [
    { name: 'Aura of Vitality', description: 'Heal 2d6 as bonus action for 1 minute' },
    { name: 'Blinding Smite', description: 'Next hit deals 3d8 radiant, may blind' },
    { name: 'Create Food and Water', description: 'Create food and water for 15 people' },
    { name: 'Crusader\'s Mantle', description: 'Allies deal +1d4 radiant on hits' },
    { name: 'Daylight', description: 'Create bright light sphere' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Elemental Weapon', description: 'Weapon becomes +1, deals extra damage' },
    { name: 'Magic Circle', description: 'Create cylinder warding creature types' },
    { name: 'Remove Curse', description: 'End curses' },
    { name: 'Revivify', description: 'Restore life to recently dead' },
  ],
  ranger: [
    { name: 'Conjure Animals', description: 'Summon fey spirits as beasts' },
    { name: 'Conjure Barrage', description: 'Throw weapon in 60-foot cone, 3d8' },
    { name: 'Daylight', description: 'Create 60-foot bright light' },
    { name: 'Lightning Arrow', description: 'Next ranged hit deals 4d8 lightning' },
    { name: 'Nondetection', description: 'Hide target from divination' },
    { name: 'Plant Growth', description: 'Enhance plants' },
    { name: 'Protection from Energy', description: 'Grant damage resistance' },
    { name: 'Speak with Plants', description: 'Communicate with plants' },
    { name: 'Water Breathing', description: 'Creatures breathe underwater' },
    { name: 'Wind Wall', description: 'Create wind barrier' },
  ],
  sorcerer: [
    { name: 'Blink', description: 'Randomly vanish to Ethereal Plane' },
    { name: 'Counterspell', description: 'Interrupt a spell being cast' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Fear', description: 'Frighten creatures in cone' },
    { name: 'Fireball', description: '8d6 fire in 20-foot radius' },
    { name: 'Fly', description: 'Grant 60-foot flying speed' },
    { name: 'Haste', description: 'Double speed, +2 AC, extra action' },
    { name: 'Hypnotic Pattern', description: 'Charm creatures in cube' },
    { name: 'Lightning Bolt', description: '8d6 lightning in 100-foot line' },
    { name: 'Slow', description: 'Halve speed, -2 AC, limit actions' },
  ],
  warlock: [
    { name: 'Counterspell', description: 'Interrupt a spell' },
    { name: 'Dispel Magic', description: 'End spells on target' },
    { name: 'Fear', description: 'Frighten creatures in cone' },
    { name: 'Fly', description: 'Grant flying speed' },
    { name: 'Gaseous Form', description: 'Become misty cloud' },
    { name: 'Hunger of Hadar', description: 'Create void sphere, cold and acid damage' },
    { name: 'Hypnotic Pattern', description: 'Charm creatures' },
    { name: 'Magic Circle', description: 'Ward against creature types' },
    { name: 'Remove Curse', description: 'End curses' },
    { name: 'Vampiric Touch', description: '3d6 necrotic, heal half damage dealt' },
  ],
  wizard: [
    { name: 'Blink', description: 'Randomly vanish to Ethereal Plane' },
    { name: 'Counterspell', description: 'Interrupt a spell being cast' },
    { name: 'Dispel Magic', description: 'End spells on a target' },
    { name: 'Fear', description: 'Frighten creatures in cone' },
    { name: 'Fireball', description: '8d6 fire damage in 20-foot radius' },
    { name: 'Fly', description: 'Grant 60-foot flying speed' },
    { name: 'Haste', description: 'Double speed, +2 AC, extra action' },
    { name: 'Hypnotic Pattern', description: 'Charm creatures in 30-foot cube' },
    { name: 'Lightning Bolt', description: '8d6 lightning in 100-foot line' },
    { name: 'Slow', description: 'Halve speed, limit actions' },
  ],
};

// ============ STARTING EQUIPMENT ============

// Shop item definition
export interface ShopItem {
  name: string;
  cost: number; // in gold pieces
  weight?: number;
  description?: string;
  category: 'weapon' | 'armor' | 'gear' | 'potion' | 'food' | 'tool';
  damage?: string; // for weapons
  properties?: string[];
  armorClass?: number; // for armor
  armorType?: 'light' | 'medium' | 'heavy' | 'shields'; // for armor proficiency filtering
  weaponType?: 'simple' | 'martial'; // for weapon proficiency filtering
}

// Weapon Mastery Properties (D&D 2024)
export type WeaponMasteryType = 'Cleave' | 'Graze' | 'Nick' | 'Push' | 'Sap' | 'Slow' | 'Topple' | 'Vex';

export const WEAPON_MASTERY_DESCRIPTIONS: Record<WeaponMasteryType, string> = {
  Cleave: 'If you hit a creature, you can make an attack against a second creature within 5 ft of the first.',
  Graze: 'If your attack misses, you still deal damage equal to your STR or DEX modifier.',
  Nick: 'When you make the extra attack of Two-Weapon Fighting, you can make it as part of the Attack action.',
  Push: 'If you hit a creature, you can push it 10 feet straight away from you.',
  Sap: 'If you hit a creature, it has disadvantage on its next attack roll before the start of your next turn.',
  Slow: 'If you hit a creature, its speed is reduced by 10 feet until the start of your next turn.',
  Topple: 'If you hit a creature, it must succeed on a CON save or be knocked prone.',
  Vex: 'If you hit a creature, you have advantage on your next attack roll against that creature before the end of your next turn.',
};

// Weapon mastery by weapon name
export const WEAPON_MASTERIES: Record<string, WeaponMasteryType> = {
  // Simple Melee
  'Club': 'Slow',
  'Dagger': 'Nick',
  'Greatclub': 'Push',
  'Handaxe': 'Vex',
  'Javelin': 'Slow',
  'Light Hammer': 'Nick',
  'Mace': 'Sap',
  'Quarterstaff': 'Topple',
  'Sickle': 'Nick',
  'Spear': 'Sap',
  // Simple Ranged
  'Light Crossbow': 'Slow',
  'Shortbow': 'Vex',
  'Sling': 'Slow',
  // Martial Melee
  'Battleaxe': 'Topple',
  'Flail': 'Sap',
  'Glaive': 'Graze',
  'Greataxe': 'Cleave',
  'Greatsword': 'Graze',
  'Halberd': 'Cleave',
  'Lance': 'Topple',
  'Longsword': 'Sap',
  'Maul': 'Topple',
  'Morningstar': 'Sap',
  'Pike': 'Push',
  'Rapier': 'Vex',
  'Scimitar': 'Nick',
  'Shortsword': 'Vex',
  'Trident': 'Topple',
  'Warhammer': 'Push',
  'War Pick': 'Sap',
  'Whip': 'Slow',
  // Martial Ranged
  'Blowgun': 'Vex',
  'Hand Crossbow': 'Vex',
  'Heavy Crossbow': 'Push',
  'Longbow': 'Slow',
  'Musket': 'Slow',
  'Pistol': 'Vex',
};

// Classes that get Weapon Mastery and how many
export const WEAPON_MASTERY_CLASSES: Record<CharacterClass, number> = {
  barbarian: 2,
  bard: 0,
  cleric: 0,
  druid: 0,
  fighter: 3,
  monk: 2,
  paladin: 2,
  ranger: 2,
  rogue: 0,
  sorcerer: 0,
  warlock: 0,
  wizard: 0,
};

// Get weapons a character is proficient with based on class proficiencies
export function getProficientWeapons(weaponProficiencies: { type: WeaponType; specific?: string[] }[]): string[] {
  const proficientWeapons: string[] = [];

  // Check which types of weapons the class is proficient with
  const hasSimple = weaponProficiencies.some(p => p.type === 'simple');
  const hasMartial = weaponProficiencies.some(p => p.type === 'martial');
  const specificWeapons = weaponProficiencies
    .filter(p => p.type === 'specific' && p.specific)
    .flatMap(p => p.specific || []);

  for (const weapon of Object.keys(WEAPON_MASTERIES)) {
    const shopWeapon = SHOP_WEAPONS.find(w => w.name === weapon);
    if (!shopWeapon) continue;

    // Check if proficient with this specific weapon or its category
    if (specificWeapons.includes(weapon)) {
      proficientWeapons.push(weapon);
    } else if (shopWeapon.weaponType === 'simple' && hasSimple) {
      proficientWeapons.push(weapon);
    } else if (shopWeapon.weaponType === 'martial' && hasMartial) {
      proficientWeapons.push(weapon);
    }
  }

  return proficientWeapons;
}

// Weapons available for purchase
export const SHOP_WEAPONS: ShopItem[] = [
  // Simple Melee Weapons
  { name: 'Club', cost: 0.1, weight: 2, category: 'weapon', damage: '1d4 bludgeoning', properties: ['light'], weaponType: 'simple' },
  { name: 'Dagger', cost: 2, weight: 1, category: 'weapon', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'], weaponType: 'simple' },
  { name: 'Greatclub', cost: 0.2, weight: 10, category: 'weapon', damage: '1d8 bludgeoning', properties: ['two-handed'], weaponType: 'simple' },
  { name: 'Handaxe', cost: 5, weight: 2, category: 'weapon', damage: '1d6 slashing', properties: ['light', 'thrown (20/60)'], weaponType: 'simple' },
  { name: 'Javelin', cost: 0.5, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['thrown (30/120)'], weaponType: 'simple' },
  { name: 'Light Hammer', cost: 2, weight: 2, category: 'weapon', damage: '1d4 bludgeoning', properties: ['light', 'thrown (20/60)'], weaponType: 'simple' },
  { name: 'Mace', cost: 5, weight: 4, category: 'weapon', damage: '1d6 bludgeoning', weaponType: 'simple' },
  { name: 'Quarterstaff', cost: 0.2, weight: 4, category: 'weapon', damage: '1d6 bludgeoning', properties: ['versatile (1d8)'], weaponType: 'simple' },
  { name: 'Sickle', cost: 1, weight: 2, category: 'weapon', damage: '1d4 slashing', properties: ['light'], weaponType: 'simple' },
  { name: 'Spear', cost: 1, weight: 3, category: 'weapon', damage: '1d6 piercing', properties: ['thrown (20/60)', 'versatile (1d8)'], weaponType: 'simple' },
  // Simple Ranged Weapons
  { name: 'Light Crossbow', cost: 25, weight: 5, category: 'weapon', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'], weaponType: 'simple' },
  { name: 'Shortbow', cost: 25, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['ammunition (80/320)', 'two-handed'], weaponType: 'simple' },
  { name: 'Sling', cost: 0.1, weight: 0, category: 'weapon', damage: '1d4 bludgeoning', properties: ['ammunition (30/120)'], weaponType: 'simple' },
  // Martial Melee Weapons
  { name: 'Battleaxe', cost: 10, weight: 4, category: 'weapon', damage: '1d8 slashing', properties: ['versatile (1d10)'], weaponType: 'martial' },
  { name: 'Flail', cost: 10, weight: 2, category: 'weapon', damage: '1d8 bludgeoning', weaponType: 'martial' },
  { name: 'Glaive', cost: 20, weight: 6, category: 'weapon', damage: '1d10 slashing', properties: ['heavy', 'reach', 'two-handed'], weaponType: 'martial' },
  { name: 'Greataxe', cost: 30, weight: 7, category: 'weapon', damage: '1d12 slashing', properties: ['heavy', 'two-handed'], weaponType: 'martial' },
  { name: 'Greatsword', cost: 50, weight: 6, category: 'weapon', damage: '2d6 slashing', properties: ['heavy', 'two-handed'], weaponType: 'martial' },
  { name: 'Halberd', cost: 20, weight: 6, category: 'weapon', damage: '1d10 slashing', properties: ['heavy', 'reach', 'two-handed'], weaponType: 'martial' },
  { name: 'Longsword', cost: 15, weight: 3, category: 'weapon', damage: '1d8 slashing', properties: ['versatile (1d10)'], weaponType: 'martial' },
  { name: 'Maul', cost: 10, weight: 10, category: 'weapon', damage: '2d6 bludgeoning', properties: ['heavy', 'two-handed'], weaponType: 'martial' },
  { name: 'Morningstar', cost: 15, weight: 4, category: 'weapon', damage: '1d8 piercing', weaponType: 'martial' },
  { name: 'Rapier', cost: 25, weight: 2, category: 'weapon', damage: '1d8 piercing', properties: ['finesse'], weaponType: 'martial' },
  { name: 'Scimitar', cost: 25, weight: 3, category: 'weapon', damage: '1d6 slashing', properties: ['finesse', 'light'], weaponType: 'martial' },
  { name: 'Shortsword', cost: 10, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['finesse', 'light'], weaponType: 'martial' },
  { name: 'Warhammer', cost: 15, weight: 2, category: 'weapon', damage: '1d8 bludgeoning', properties: ['versatile (1d10)'], weaponType: 'martial' },
  { name: 'War Pick', cost: 5, weight: 2, category: 'weapon', damage: '1d8 piercing', weaponType: 'martial' },
  // Martial Ranged Weapons
  { name: 'Hand Crossbow', cost: 75, weight: 3, category: 'weapon', damage: '1d6 piercing', properties: ['ammunition (30/120)', 'light', 'loading'], weaponType: 'martial' },
  { name: 'Heavy Crossbow', cost: 50, weight: 18, category: 'weapon', damage: '1d10 piercing', properties: ['ammunition (100/400)', 'heavy', 'loading', 'two-handed'], weaponType: 'martial' },
  { name: 'Longbow', cost: 50, weight: 2, category: 'weapon', damage: '1d8 piercing', properties: ['ammunition (150/600)', 'heavy', 'two-handed'], weaponType: 'martial' },
];

// Armor available for purchase
export const SHOP_ARMOR: ShopItem[] = [
  // Light Armor
  { name: 'Padded Armor', cost: 5, weight: 8, category: 'armor', armorClass: 11, description: 'AC 11 + Dex', armorType: 'light' },
  { name: 'Leather Armor', cost: 10, weight: 10, category: 'armor', armorClass: 11, description: 'AC 11 + Dex', armorType: 'light' },
  { name: 'Studded Leather', cost: 45, weight: 13, category: 'armor', armorClass: 12, description: 'AC 12 + Dex', armorType: 'light' },
  // Medium Armor
  { name: 'Hide Armor', cost: 10, weight: 12, category: 'armor', armorClass: 12, description: 'AC 12 + Dex (max 2)', armorType: 'medium' },
  { name: 'Chain Shirt', cost: 50, weight: 20, category: 'armor', armorClass: 13, description: 'AC 13 + Dex (max 2)', armorType: 'medium' },
  { name: 'Scale Mail', cost: 50, weight: 45, category: 'armor', armorClass: 14, description: 'AC 14 + Dex (max 2)', armorType: 'medium' },
  { name: 'Breastplate', cost: 400, weight: 20, category: 'armor', armorClass: 14, description: 'AC 14 + Dex (max 2)', armorType: 'medium' },
  // Heavy Armor
  { name: 'Ring Mail', cost: 30, weight: 40, category: 'armor', armorClass: 14, description: 'AC 14', armorType: 'heavy' },
  { name: 'Chain Mail', cost: 75, weight: 55, category: 'armor', armorClass: 16, description: 'AC 16, Str 13 required', armorType: 'heavy' },
  // Shield
  { name: 'Shield', cost: 10, weight: 6, category: 'armor', armorClass: 2, description: '+2 AC', armorType: 'shields' },
];

// Adventuring gear
export const SHOP_GEAR: ShopItem[] = [
  { name: 'Backpack', cost: 2, weight: 5, category: 'gear', description: 'Holds 30 lbs' },
  { name: 'Bedroll', cost: 1, weight: 7, category: 'gear' },
  { name: 'Blanket', cost: 0.5, weight: 3, category: 'gear' },
  { name: 'Candle (10)', cost: 0.1, weight: 0, category: 'gear' },
  { name: 'Chalk (10 pieces)', cost: 0.1, weight: 0, category: 'gear' },
  { name: 'Climber\'s Kit', cost: 25, weight: 12, category: 'gear', description: 'Advantage on climbing' },
  { name: 'Crowbar', cost: 2, weight: 5, category: 'gear', description: 'Advantage on Str checks to pry' },
  { name: 'Grappling Hook', cost: 2, weight: 4, category: 'gear' },
  { name: 'Healer\'s Kit', cost: 5, weight: 3, category: 'gear', description: '10 uses, stabilize dying' },
  { name: 'Hempen Rope (50 ft)', cost: 1, weight: 10, category: 'gear' },
  { name: 'Silk Rope (50 ft)', cost: 10, weight: 5, category: 'gear' },
  { name: 'Lantern (Hooded)', cost: 5, weight: 2, category: 'gear', description: '30 ft bright, 30 ft dim' },
  { name: 'Lantern (Bullseye)', cost: 10, weight: 2, category: 'gear', description: '60 ft cone bright, 60 ft dim' },
  { name: 'Lock', cost: 10, weight: 1, category: 'gear', description: 'DC 15 to pick' },
  { name: 'Manacles', cost: 2, weight: 6, category: 'gear', description: 'DC 20 to escape' },
  { name: 'Mirror (Steel)', cost: 5, weight: 0.5, category: 'gear' },
  { name: 'Oil Flask (10)', cost: 1, weight: 10, category: 'gear', description: '5 ft fire, 1d5 damage' },
  { name: 'Piton (10)', cost: 0.5, weight: 2.5, category: 'gear' },
  { name: 'Quiver', cost: 1, weight: 1, category: 'gear', description: 'Holds 20 arrows' },
  { name: 'Arrows (20)', cost: 1, weight: 1, category: 'gear' },
  { name: 'Crossbow Bolts (20)', cost: 1, weight: 1.5, category: 'gear' },
  { name: 'Sling Bullets (20)', cost: 0.04, weight: 1.5, category: 'gear' },
  { name: 'Tinderbox', cost: 0.5, weight: 1, category: 'gear', description: 'Light fires' },
  { name: 'Torch (10)', cost: 0.1, weight: 10, category: 'gear', description: '20 ft bright, 20 ft dim' },
  { name: 'Waterskin', cost: 0.2, weight: 5, category: 'gear', description: 'Holds 4 pints' },
  { name: 'Component Pouch', cost: 25, weight: 2, category: 'gear', description: 'For spellcasting' },
  { name: 'Arcane Focus (Wand)', cost: 10, weight: 1, category: 'gear', description: 'For spellcasting' },
  { name: 'Holy Symbol', cost: 5, weight: 1, category: 'gear', description: 'For divine casting' },
  { name: 'Druidic Focus (Sprig)', cost: 1, weight: 0, category: 'gear', description: 'For druid casting' },
];

// Potions and consumables
export const SHOP_POTIONS: ShopItem[] = [
  { name: 'Potion of Healing', cost: 50, weight: 0.5, category: 'potion', description: 'Heal 2d4+2 HP' },
  { name: 'Antitoxin', cost: 50, weight: 0, category: 'potion', description: 'Advantage vs poison for 1 hour' },
  { name: 'Alchemist\'s Fire', cost: 50, weight: 1, category: 'potion', description: '1d4 fire damage/round' },
  { name: 'Acid Vial', cost: 25, weight: 1, category: 'potion', description: '2d6 acid damage' },
  { name: 'Holy Water', cost: 25, weight: 1, category: 'potion', description: '2d6 radiant to undead/fiends' },
];

// Food and provisions
export const SHOP_FOOD: ShopItem[] = [
  { name: 'Rations (10 days)', cost: 5, weight: 20, category: 'food', description: 'Dry provisions' },
  { name: 'Rations (5 days)', cost: 2.5, weight: 10, category: 'food', description: 'Dry provisions' },
  { name: 'Ale (Gallon)', cost: 0.2, weight: 8, category: 'food' },
  { name: 'Wine (Common)', cost: 0.2, weight: 6, category: 'food' },
  { name: 'Bread Loaf', cost: 0.02, weight: 0.5, category: 'food' },
  { name: 'Cheese Wheel', cost: 0.1, weight: 2, category: 'food' },
  { name: 'Meat (Chunk)', cost: 0.3, weight: 2, category: 'food' },
];

// Tools
export const SHOP_TOOLS: ShopItem[] = [
  { name: 'Thieves\' Tools', cost: 25, weight: 1, category: 'tool', description: 'Pick locks and disarm traps' },
  { name: 'Smith\'s Tools', cost: 20, weight: 8, category: 'tool' },
  { name: 'Herbalism Kit', cost: 5, weight: 3, category: 'tool', description: 'Create potions' },
  { name: 'Alchemist\'s Supplies', cost: 50, weight: 8, category: 'tool' },
  { name: 'Disguise Kit', cost: 25, weight: 3, category: 'tool' },
  { name: 'Forgery Kit', cost: 15, weight: 5, category: 'tool' },
  { name: 'Musical Instrument (Lute)', cost: 35, weight: 2, category: 'tool' },
  { name: 'Musical Instrument (Flute)', cost: 2, weight: 1, category: 'tool' },
  { name: 'Playing Card Set', cost: 0.5, weight: 0, category: 'tool' },
  { name: 'Dice Set', cost: 0.1, weight: 0, category: 'tool' },
];

// All shop items combined
export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...SHOP_WEAPONS,
  ...SHOP_ARMOR,
  ...SHOP_GEAR,
  ...SHOP_POTIONS,
  ...SHOP_FOOD,
  ...SHOP_TOOLS,
];

// Starting equipment packs by class
export interface StartingPack {
  weapons: { name: string; damage: string; properties?: string[] }[];
  armor?: { name: string; armorClass: number; description?: string };
  shield?: boolean;
  equipment: { name: string; quantity: number }[];
  gold: number;
}

export const CLASS_STARTING_PACKS: Record<CharacterClass, StartingPack> = {
  barbarian: {
    weapons: [
      { name: 'Greataxe', damage: '1d12 slashing', properties: ['heavy', 'two-handed'] },
      { name: 'Handaxe', damage: '1d6 slashing', properties: ['light', 'thrown (20/60)'] },
      { name: 'Handaxe', damage: '1d6 slashing', properties: ['light', 'thrown (20/60)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
    ],
    equipment: [
      { name: 'Explorer\'s Pack', quantity: 1 },
    ],
    gold: 10,
  },
  bard: {
    weapons: [
      { name: 'Rapier', damage: '1d8 piercing', properties: ['finesse'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
    ],
    armor: { name: 'Leather Armor', armorClass: 11, description: 'AC 11 + Dex' },
    equipment: [
      { name: 'Diplomat\'s Pack', quantity: 1 },
      { name: 'Lute', quantity: 1 },
    ],
    gold: 10,
  },
  cleric: {
    weapons: [
      { name: 'Mace', damage: '1d6 bludgeoning' },
      { name: 'Light Crossbow', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'] },
    ],
    armor: { name: 'Scale Mail', armorClass: 14, description: 'AC 14 + Dex (max 2)' },
    shield: true,
    equipment: [
      { name: 'Priest\'s Pack', quantity: 1 },
      { name: 'Holy Symbol', quantity: 1 },
      { name: 'Crossbow Bolts (20)', quantity: 1 },
    ],
    gold: 10,
  },
  druid: {
    weapons: [
      { name: 'Scimitar', damage: '1d6 slashing', properties: ['finesse', 'light'] },
    ],
    armor: { name: 'Leather Armor', armorClass: 11, description: 'AC 11 + Dex' },
    shield: true,
    equipment: [
      { name: 'Explorer\'s Pack', quantity: 1 },
      { name: 'Druidic Focus', quantity: 1 },
    ],
    gold: 10,
  },
  fighter: {
    weapons: [
      { name: 'Longsword', damage: '1d8 slashing', properties: ['versatile (1d10)'] },
      { name: 'Light Crossbow', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'] },
    ],
    armor: { name: 'Chain Mail', armorClass: 16, description: 'AC 16' },
    shield: true,
    equipment: [
      { name: 'Dungeoneer\'s Pack', quantity: 1 },
      { name: 'Crossbow Bolts (20)', quantity: 1 },
    ],
    gold: 10,
  },
  monk: {
    weapons: [
      { name: 'Shortsword', damage: '1d6 piercing', properties: ['finesse', 'light'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
      { name: 'Dart', damage: '1d4 piercing', properties: ['finesse', 'thrown (20/60)'] },
    ],
    equipment: [
      { name: 'Explorer\'s Pack', quantity: 1 },
    ],
    gold: 10,
  },
  paladin: {
    weapons: [
      { name: 'Longsword', damage: '1d8 slashing', properties: ['versatile (1d10)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
      { name: 'Javelin', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
    ],
    armor: { name: 'Chain Mail', armorClass: 16, description: 'AC 16' },
    shield: true,
    equipment: [
      { name: 'Priest\'s Pack', quantity: 1 },
      { name: 'Holy Symbol', quantity: 1 },
    ],
    gold: 10,
  },
  ranger: {
    weapons: [
      { name: 'Shortsword', damage: '1d6 piercing', properties: ['finesse', 'light'] },
      { name: 'Shortsword', damage: '1d6 piercing', properties: ['finesse', 'light'] },
      { name: 'Longbow', damage: '1d8 piercing', properties: ['ammunition (150/600)', 'heavy', 'two-handed'] },
    ],
    armor: { name: 'Scale Mail', armorClass: 14, description: 'AC 14 + Dex (max 2)' },
    equipment: [
      { name: 'Explorer\'s Pack', quantity: 1 },
      { name: 'Quiver', quantity: 1 },
      { name: 'Arrows (20)', quantity: 1 },
    ],
    gold: 10,
  },
  rogue: {
    weapons: [
      { name: 'Rapier', damage: '1d8 piercing', properties: ['finesse'] },
      { name: 'Shortbow', damage: '1d6 piercing', properties: ['ammunition (80/320)', 'two-handed'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
    ],
    armor: { name: 'Leather Armor', armorClass: 11, description: 'AC 11 + Dex' },
    equipment: [
      { name: 'Burglar\'s Pack', quantity: 1 },
      { name: 'Thieves\' Tools', quantity: 1 },
      { name: 'Quiver', quantity: 1 },
      { name: 'Arrows (20)', quantity: 1 },
    ],
    gold: 10,
  },
  sorcerer: {
    weapons: [
      { name: 'Light Crossbow', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
    ],
    equipment: [
      { name: 'Dungeoneer\'s Pack', quantity: 1 },
      { name: 'Component Pouch', quantity: 1 },
      { name: 'Crossbow Bolts (20)', quantity: 1 },
    ],
    gold: 10,
  },
  warlock: {
    weapons: [
      { name: 'Light Crossbow', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
    ],
    armor: { name: 'Leather Armor', armorClass: 11, description: 'AC 11 + Dex' },
    equipment: [
      { name: 'Scholar\'s Pack', quantity: 1 },
      { name: 'Arcane Focus', quantity: 1 },
      { name: 'Crossbow Bolts (20)', quantity: 1 },
    ],
    gold: 10,
  },
  wizard: {
    weapons: [
      { name: 'Quarterstaff', damage: '1d6 bludgeoning', properties: ['versatile (1d8)'] },
      { name: 'Dagger', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
    ],
    equipment: [
      { name: 'Scholar\'s Pack', quantity: 1 },
      { name: 'Spellbook', quantity: 1 },
      { name: 'Arcane Focus', quantity: 1 },
    ],
    gold: 10,
  },
};

// Spell slots by character level for full casters (Bard, Cleric, Druid, Sorcerer, Wizard)
// Each array index = spell level - 1 (so index 0 = 1st level slots, index 8 = 9th level slots)
export const SPELL_SLOTS_BY_LEVEL: Record<number, number[]> = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Half-caster spell slots (Paladin, Ranger) - slots are at half rate
export const HALF_CASTER_SPELL_SLOTS: Record<number, number[]> = {
  1:  [0, 0, 0, 0, 0],
  2:  [2, 0, 0, 0, 0],
  3:  [3, 0, 0, 0, 0],
  4:  [3, 0, 0, 0, 0],
  5:  [4, 2, 0, 0, 0],
  6:  [4, 2, 0, 0, 0],
  7:  [4, 3, 0, 0, 0],
  8:  [4, 3, 0, 0, 0],
  9:  [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0],
  11: [4, 3, 3, 0, 0],
  12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0],
  14: [4, 3, 3, 1, 0],
  15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
};

// Warlock pact magic slots (different progression)
export const WARLOCK_SPELL_SLOTS: Record<number, { slots: number; level: number }> = {
  1:  { slots: 1, level: 1 },
  2:  { slots: 2, level: 1 },
  3:  { slots: 2, level: 2 },
  4:  { slots: 2, level: 2 },
  5:  { slots: 2, level: 3 },
  6:  { slots: 2, level: 3 },
  7:  { slots: 2, level: 4 },
  8:  { slots: 2, level: 4 },
  9:  { slots: 2, level: 5 },
  10: { slots: 2, level: 5 },
  11: { slots: 3, level: 5 },
  12: { slots: 3, level: 5 },
  13: { slots: 3, level: 5 },
  14: { slots: 3, level: 5 },
  15: { slots: 3, level: 5 },
  16: { slots: 3, level: 5 },
  17: { slots: 4, level: 5 },
  18: { slots: 4, level: 5 },
  19: { slots: 4, level: 5 },
  20: { slots: 4, level: 5 },
};

// ============ CLASS RESOURCES (Ki, Rage, etc.) ============

export type RestType = 'short' | 'long';

export interface ClassResourceDefinition {
  id: string;
  name: string;
  description: string;
  restoreOn: RestType;
  maxAtLevel: (level: number, abilityMod?: number) => number;  // Function to calculate max uses
  minLevel?: number;  // Level when this resource becomes available (default 1)
  usesAbilityMod?: keyof AbilityScores;  // If max uses is based on an ability modifier
}

// Class resources by class
export const CLASS_RESOURCES: Record<CharacterClass, ClassResourceDefinition[]> = {
  barbarian: [
    {
      id: 'rage',
      name: 'Rage',
      description: 'Bonus action: Enter rage for 1 min. Gain advantage on STR checks/saves, +2 rage damage (melee STR attacks), resistance to bludgeoning/piercing/slashing. Ends if knocked unconscious, turn ends without attacking or taking damage, or you end it (no action).',
      restoreOn: 'long',
      maxAtLevel: (level) => {
        if (level >= 20) return 6;  // Unlimited at 20, but we track as 6
        if (level >= 17) return 6;
        if (level >= 12) return 5;
        if (level >= 6) return 4;
        if (level >= 3) return 3;
        return 2;
      },
    },
  ],
  bard: [
    {
      id: 'bardic-inspiration',
      name: 'Bardic Inspiration',
      description: 'Bonus action: Give one creature within 60 ft an Inspiration die (d6, scales at levels 5/10/15). Within 10 min, they can add it to one ability check, attack roll, or saving throw. At level 5+, restores on short rest.',
      restoreOn: 'long',  // Short rest at level 5+
      maxAtLevel: (_level, chaMod = 0) => Math.max(1, chaMod),
      usesAbilityMod: 'charisma',
    },
  ],
  cleric: [
    {
      id: 'channel-divinity',
      name: 'Channel Divinity',
      description: 'Action: Use Turn Undead (undead within 30 ft must make WIS save or be turned for 1 min) or your Divine Domain channel option. Turned creatures must spend turns moving away and can\'t take reactions.',
      restoreOn: 'short',
      minLevel: 2,
      maxAtLevel: (level) => {
        if (level >= 18) return 3;
        if (level >= 6) return 2;
        return 1;
      },
    },
  ],
  druid: [
    {
      id: 'wild-shape',
      name: 'Wild Shape',
      description: 'Bonus action: Transform into a beast you\'ve seen (CR limit based on level). Lasts for hours = half druid level. Gain beast\'s HP as temp HP. Can\'t cast spells but concentration persists. Revert if temp HP drops to 0.',
      restoreOn: 'short',
      minLevel: 2,
      maxAtLevel: () => 2,
    },
  ],
  fighter: [
    {
      id: 'second-wind',
      name: 'Second Wind',
      description: 'Bonus action: Regain 1d10 + fighter level HP. Can only use once per short or long rest.',
      restoreOn: 'short',
      maxAtLevel: () => 1,
    },
    {
      id: 'action-surge',
      name: 'Action Surge',
      description: 'On your turn: Take one additional action. Can only use once per turn. At level 17+, you can use it twice per rest but only once per turn.',
      restoreOn: 'short',
      minLevel: 2,
      maxAtLevel: (level) => level >= 17 ? 2 : 1,
    },
    {
      id: 'indomitable',
      name: 'Indomitable',
      description: 'When you fail a saving throw: Reroll it with no penalty. You must use the new roll even if it\'s lower.',
      restoreOn: 'long',
      minLevel: 9,
      maxAtLevel: (level) => {
        if (level >= 17) return 3;
        if (level >= 13) return 2;
        return 1;
      },
    },
  ],
  monk: [
    {
      id: 'ki-points',
      name: 'Ki Points',
      description: 'Resource for martial arts techniques: Flurry of Blows (1 ki, 2 unarmed strikes as bonus action), Patient Defense (1 ki, Dodge as bonus action), Step of the Wind (1 ki, Disengage/Dash as bonus action, double jump). More options unlock at higher levels.',
      restoreOn: 'short',
      minLevel: 2,
      maxAtLevel: (level) => level,  // Ki points = monk level
    },
  ],
  paladin: [
    {
      id: 'lay-on-hands',
      name: 'Lay on Hands',
      description: 'Action: Touch a creature and draw from your healing pool (paladin level × 5 HP). Restore any number of HP from the pool, or spend 5 HP to cure one disease or neutralize one poison.',
      restoreOn: 'long',
      maxAtLevel: (level) => level * 5,  // 5 HP per level
    },
    {
      id: 'channel-divinity',
      name: 'Channel Divinity',
      description: 'Use your Sacred Oath channel option. Effects vary by oath (e.g., Oath of Devotion: Sacred Weapon adds CHA to attacks for 1 min, or Turn the Unholy).',
      restoreOn: 'short',
      minLevel: 3,
      maxAtLevel: () => 1,
    },
    {
      id: 'divine-sense',
      name: 'Divine Sense',
      description: 'Action: Until end of next turn, sense celestials, fiends, and undead within 60 ft not behind total cover. Also detect consecrated/desecrated places or objects.',
      restoreOn: 'long',
      maxAtLevel: (_level, chaMod = 0) => 1 + Math.max(0, chaMod),
      usesAbilityMod: 'charisma',
    },
  ],
  ranger: [
    {
      id: 'favored-foe',
      name: 'Favored Foe',
      description: 'When you hit a creature with an attack: Mark it as your favored enemy (no action, requires concentration). First hit each turn deals extra 1d4 damage (scales at levels 6/14). Lasts 1 min.',
      restoreOn: 'long',
      maxAtLevel: (level) => Math.ceil(level / 4) + 1,  // Proficiency bonus
    },
  ],
  rogue: [
    {
      id: 'stroke-of-luck',
      name: 'Stroke of Luck',
      description: 'When you miss with an attack: Turn the miss into a hit. OR when you fail an ability check: Treat the d20 roll as a 20.',
      restoreOn: 'short',
      minLevel: 20,
      maxAtLevel: () => 1,
    },
  ],
  sorcerer: [
    {
      id: 'sorcery-points',
      name: 'Sorcery Points',
      description: 'Fuel Metamagic options (Careful, Distant, Empowered, Extended, Heightened, Quickened, Subtle, Twinned). Can also convert to spell slots (bonus action): 2 pts = 1st level, 3 pts = 2nd, 5 pts = 3rd, 6 pts = 4th, 7 pts = 5th. Max slot level = 5th.',
      restoreOn: 'long',
      minLevel: 2,
      maxAtLevel: (level) => level,  // Sorcery points = sorcerer level
    },
  ],
  warlock: [
    // Warlock uses Pact Magic slots which are already tracked as spell slots
  ],
  wizard: [
    {
      id: 'arcane-recovery',
      name: 'Arcane Recovery',
      description: 'Once per day during a short rest: Recover spell slots with combined level ≤ half wizard level (rounded up). No slot can be 6th level or higher.',
      restoreOn: 'long',  // Can use once per long rest, during a short rest
      maxAtLevel: () => 1,
    },
  ],
};

// Species/Race resources
export interface SpeciesResourceDefinition extends ClassResourceDefinition {
  species: Species[];  // Which species have this resource
}

export const SPECIES_RESOURCES: SpeciesResourceDefinition[] = [
  {
    id: 'breath-weapon',
    name: 'Breath Weapon',
    species: ['dragonborn'],
    description: 'Action: Exhale destructive energy in a 15 ft cone or 30 ft line (based on ancestry). Each creature must DEX save (DC = 8 + CON mod + Prof). Deals 1d10 damage (scales at levels 5/11/17), half on save. Damage type based on draconic ancestry.',
    restoreOn: 'long',
    maxAtLevel: (level) => Math.ceil(level / 4) + 1,  // Proficiency bonus
  },
  {
    id: 'stones-endurance',
    name: "Stone's Endurance",
    species: ['goliath'],
    description: 'Reaction when you take damage: Roll 1d12 + CON mod and reduce the damage by that amount. Scales with proficiency bonus uses per long rest.',
    restoreOn: 'short',
    maxAtLevel: (level) => Math.ceil(level / 4) + 1,  // Proficiency bonus
  },
  {
    id: 'relentless-endurance',
    name: 'Relentless Endurance',
    species: ['orc'],
    description: 'When reduced to 0 HP but not killed outright: Drop to 1 HP instead. Cannot use again until you finish a long rest.',
    restoreOn: 'long',
    maxAtLevel: () => 1,
  },
  {
    id: 'adrenaline-rush',
    name: 'Adrenaline Rush',
    species: ['orc'],
    description: 'Bonus action: Take the Dash action and gain temporary HP equal to your Proficiency Bonus. Uses equal to Proficiency Bonus per long rest.',
    restoreOn: 'long',
    maxAtLevel: (level) => Math.ceil(level / 4) + 1,  // Proficiency bonus
  },
  {
    id: 'celestial-revelation',
    name: 'Celestial Revelation',
    species: ['aasimar'],
    description: 'Bonus action: Transform for 1 minute, gaining effects based on your form. Necrotic Shroud: creatures within 10 ft must CHA save or be frightened. Radiant Consumption: deal radiant damage to nearby creatures. Radiant Soul: gain flying speed 30 ft.',
    restoreOn: 'long',
    maxAtLevel: () => 1,
  },
  {
    id: 'healing-hands',
    name: 'Healing Hands',
    species: ['aasimar'],
    description: 'Action: Touch a creature to restore HP equal to your Proficiency Bonus. Once per long rest.',
    restoreOn: 'long',
    maxAtLevel: () => 1,
  },
  {
    id: 'giant-ancestry',
    name: 'Giant Ancestry',
    species: ['goliath'],
    description: 'Use your chosen giant ancestry ability (Cloud: invisible, Fire: fire damage aura, Frost: cold resistance boost, Hill: knock prone, Stone: damage resistance, Storm: lightning damage). Uses equal to Proficiency Bonus per long rest.',
    restoreOn: 'long',
    maxAtLevel: (level) => Math.ceil(level / 4) + 1,  // Proficiency bonus
  },
];

// Feat resources
export interface FeatResourceDefinition extends ClassResourceDefinition {
  featName: string;
}

export const FEAT_RESOURCES: FeatResourceDefinition[] = [
  {
    id: 'lucky-points',
    name: 'Luck Points',
    featName: 'Lucky',
    description: 'After rolling a d20 for attack, ability check, or save: Spend 1 point to roll another d20 and choose which to use. OR when attacked: Spend 1 point to roll a d20, attacker must use that roll instead.',
    restoreOn: 'long',
    maxAtLevel: (level) => getProficiencyBonus(level), // Uses proficiency bonus per 2024 rules
  },
  {
    id: 'healer-uses',
    name: 'Battle Medic',
    featName: 'Healer',
    description: 'Use Healer\'s Kit to let target spend one Hit Die + your Proficiency Bonus as a Utilize action. Usable once per creature per Short/Long Rest.',
    restoreOn: 'short',
    maxAtLevel: (level) => getProficiencyBonus(level), // Can use on up to Prof Bonus creatures
  },
];

// Helper to get all resources for a character
export function getCharacterResources(
  characterClass: CharacterClass,
  species: Species,
  level: number,
  abilityScores: AbilityScores,
  feats?: string[]
): Record<string, { max: number; restoreOn: RestType; name: string; description: string }> {
  const resources: Record<string, { max: number; restoreOn: RestType; name: string; description: string }> = {};

  // Add class resources
  const classResources = CLASS_RESOURCES[characterClass] || [];
  for (const resource of classResources) {
    if (resource.minLevel && level < resource.minLevel) continue;

    const abilityMod = resource.usesAbilityMod
      ? getAbilityModifier(abilityScores[resource.usesAbilityMod])
      : undefined;

    resources[resource.id] = {
      max: resource.maxAtLevel(level, abilityMod),
      restoreOn: resource.restoreOn,
      name: resource.name,
      description: resource.description,
    };
  }

  // Add species resources
  for (const resource of SPECIES_RESOURCES) {
    if (resource.species.includes(species)) {
      resources[resource.id] = {
        max: resource.maxAtLevel(level),
        restoreOn: resource.restoreOn,
        name: resource.name,
        description: resource.description,
      };
    }
  }

  // Add feat resources
  if (feats) {
    for (const resource of FEAT_RESOURCES) {
      if (feats.includes(resource.featName)) {
        resources[resource.id] = {
          max: resource.maxAtLevel(level),
          restoreOn: resource.restoreOn,
          name: resource.name,
          description: resource.description,
        };
      }
    }
  }

  return resources;
}
