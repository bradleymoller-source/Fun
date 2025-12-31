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
  rogue: { level: 1, count: 2 },  // 2 at level 1, 2 more at level 6
};

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
  },
  'Magic Initiate (Druid)': {
    name: 'Magic Initiate (Druid)',
    description: 'You have learned the basics of primal magic.',
    benefits: [
      'Learn 2 Druid cantrips of your choice',
      'Learn 1 first-level Druid spell (cast once per Long Rest free, or with spell slots)',
      'Choose INT, WIS, or CHA as your spellcasting ability',
    ],
  },
  'Magic Initiate (Wizard)': {
    name: 'Magic Initiate (Wizard)',
    description: 'You have learned the basics of arcane magic.',
    benefits: [
      'Learn 2 Wizard cantrips of your choice',
      'Learn 1 first-level Wizard spell (cast once per Long Rest free, or with spell slots)',
      'Choose INT, WIS, or CHA as your spellcasting ability',
    ],
  },
  'Musician': {
    name: 'Musician',
    description: 'You are a practiced musician with the ability to inspire allies.',
    benefits: [
      'Gain proficiency with 3 Musical Instruments of your choice',
      'After a Short or Long Rest, give Heroic Inspiration to allies equal to your Proficiency Bonus',
    ],
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

// Tool proficiency types
export type ToolProficiency =
  | 'Alchemist\'s Supplies' | 'Brewer\'s Supplies' | 'Calligrapher\'s Supplies' | 'Carpenter\'s Tools'
  | 'Cartographer\'s Tools' | 'Cobbler\'s Tools' | 'Cook\'s Utensils' | 'Glassblower\'s Tools'
  | 'Jeweler\'s Tools' | 'Leatherworker\'s Tools' | 'Mason\'s Tools' | 'Painter\'s Supplies'
  | 'Potter\'s Tools' | 'Smith\'s Tools' | 'Tinker\'s Tools' | 'Weaver\'s Tools' | 'Woodcarver\'s Tools'
  | 'Disguise Kit' | 'Forgery Kit' | 'Gaming Set' | 'Herbalism Kit' | 'Musical Instrument'
  | 'Navigator\'s Tools' | 'Thieves\' Tools' | 'Poisoner\'s Kit';

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

// Map species to their choices
export const SPECIES_CHOICES: Partial<Record<Species, SpeciesChoice>> = {
  dragonborn: DRAGONBORN_ANCESTRY,
  goliath: GOLIATH_ANCESTRY,
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
    { name: 'Martial Arts', description: 'Unarmed strikes deal 1d6 damage. DEX for monk weapons. Bonus action unarmed strike after Attack.', level: 1 },
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
}

// Weapons available for purchase
export const SHOP_WEAPONS: ShopItem[] = [
  // Simple Melee Weapons
  { name: 'Club', cost: 0.1, weight: 2, category: 'weapon', damage: '1d4 bludgeoning', properties: ['light'] },
  { name: 'Dagger', cost: 2, weight: 1, category: 'weapon', damage: '1d4 piercing', properties: ['finesse', 'light', 'thrown (20/60)'] },
  { name: 'Greatclub', cost: 0.2, weight: 10, category: 'weapon', damage: '1d8 bludgeoning', properties: ['two-handed'] },
  { name: 'Handaxe', cost: 5, weight: 2, category: 'weapon', damage: '1d6 slashing', properties: ['light', 'thrown (20/60)'] },
  { name: 'Javelin', cost: 0.5, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['thrown (30/120)'] },
  { name: 'Light Hammer', cost: 2, weight: 2, category: 'weapon', damage: '1d4 bludgeoning', properties: ['light', 'thrown (20/60)'] },
  { name: 'Mace', cost: 5, weight: 4, category: 'weapon', damage: '1d6 bludgeoning' },
  { name: 'Quarterstaff', cost: 0.2, weight: 4, category: 'weapon', damage: '1d6 bludgeoning', properties: ['versatile (1d8)'] },
  { name: 'Sickle', cost: 1, weight: 2, category: 'weapon', damage: '1d4 slashing', properties: ['light'] },
  { name: 'Spear', cost: 1, weight: 3, category: 'weapon', damage: '1d6 piercing', properties: ['thrown (20/60)', 'versatile (1d8)'] },
  // Simple Ranged Weapons
  { name: 'Light Crossbow', cost: 25, weight: 5, category: 'weapon', damage: '1d8 piercing', properties: ['ammunition (80/320)', 'loading', 'two-handed'] },
  { name: 'Shortbow', cost: 25, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['ammunition (80/320)', 'two-handed'] },
  { name: 'Sling', cost: 0.1, weight: 0, category: 'weapon', damage: '1d4 bludgeoning', properties: ['ammunition (30/120)'] },
  // Martial Melee Weapons
  { name: 'Battleaxe', cost: 10, weight: 4, category: 'weapon', damage: '1d8 slashing', properties: ['versatile (1d10)'] },
  { name: 'Flail', cost: 10, weight: 2, category: 'weapon', damage: '1d8 bludgeoning' },
  { name: 'Glaive', cost: 20, weight: 6, category: 'weapon', damage: '1d10 slashing', properties: ['heavy', 'reach', 'two-handed'] },
  { name: 'Greataxe', cost: 30, weight: 7, category: 'weapon', damage: '1d12 slashing', properties: ['heavy', 'two-handed'] },
  { name: 'Greatsword', cost: 50, weight: 6, category: 'weapon', damage: '2d6 slashing', properties: ['heavy', 'two-handed'] },
  { name: 'Halberd', cost: 20, weight: 6, category: 'weapon', damage: '1d10 slashing', properties: ['heavy', 'reach', 'two-handed'] },
  { name: 'Longsword', cost: 15, weight: 3, category: 'weapon', damage: '1d8 slashing', properties: ['versatile (1d10)'] },
  { name: 'Maul', cost: 10, weight: 10, category: 'weapon', damage: '2d6 bludgeoning', properties: ['heavy', 'two-handed'] },
  { name: 'Morningstar', cost: 15, weight: 4, category: 'weapon', damage: '1d8 piercing' },
  { name: 'Rapier', cost: 25, weight: 2, category: 'weapon', damage: '1d8 piercing', properties: ['finesse'] },
  { name: 'Scimitar', cost: 25, weight: 3, category: 'weapon', damage: '1d6 slashing', properties: ['finesse', 'light'] },
  { name: 'Shortsword', cost: 10, weight: 2, category: 'weapon', damage: '1d6 piercing', properties: ['finesse', 'light'] },
  { name: 'Warhammer', cost: 15, weight: 2, category: 'weapon', damage: '1d8 bludgeoning', properties: ['versatile (1d10)'] },
  { name: 'War Pick', cost: 5, weight: 2, category: 'weapon', damage: '1d8 piercing' },
  // Martial Ranged Weapons
  { name: 'Hand Crossbow', cost: 75, weight: 3, category: 'weapon', damage: '1d6 piercing', properties: ['ammunition (30/120)', 'light', 'loading'] },
  { name: 'Heavy Crossbow', cost: 50, weight: 18, category: 'weapon', damage: '1d10 piercing', properties: ['ammunition (100/400)', 'heavy', 'loading', 'two-handed'] },
  { name: 'Longbow', cost: 50, weight: 2, category: 'weapon', damage: '1d8 piercing', properties: ['ammunition (150/600)', 'heavy', 'two-handed'] },
];

// Armor available for purchase
export const SHOP_ARMOR: ShopItem[] = [
  // Light Armor
  { name: 'Padded Armor', cost: 5, weight: 8, category: 'armor', armorClass: 11, description: 'AC 11 + Dex' },
  { name: 'Leather Armor', cost: 10, weight: 10, category: 'armor', armorClass: 11, description: 'AC 11 + Dex' },
  { name: 'Studded Leather', cost: 45, weight: 13, category: 'armor', armorClass: 12, description: 'AC 12 + Dex' },
  // Medium Armor
  { name: 'Hide Armor', cost: 10, weight: 12, category: 'armor', armorClass: 12, description: 'AC 12 + Dex (max 2)' },
  { name: 'Chain Shirt', cost: 50, weight: 20, category: 'armor', armorClass: 13, description: 'AC 13 + Dex (max 2)' },
  { name: 'Scale Mail', cost: 50, weight: 45, category: 'armor', armorClass: 14, description: 'AC 14 + Dex (max 2)' },
  { name: 'Breastplate', cost: 400, weight: 20, category: 'armor', armorClass: 14, description: 'AC 14 + Dex (max 2)' },
  // Heavy Armor
  { name: 'Ring Mail', cost: 30, weight: 40, category: 'armor', armorClass: 14, description: 'AC 14' },
  { name: 'Chain Mail', cost: 75, weight: 55, category: 'armor', armorClass: 16, description: 'AC 16, Str 13 required' },
  // Shield
  { name: 'Shield', cost: 10, weight: 6, category: 'armor', armorClass: 2, description: '+2 AC' },
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
