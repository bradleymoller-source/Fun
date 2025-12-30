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

// Background options
export const BACKGROUNDS = [
  'Acolyte',
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',
];

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

// Languages commonly known
export const COMMON_LANGUAGES = [
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
];

export const EXOTIC_LANGUAGES = [
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primordial',
  'Sylvan',
  'Undercommon',
];

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

// Background info with skill proficiencies
export const BACKGROUND_INFO: Record<string, { description: string; skillProficiencies: SkillName[] }> = {
  'Acolyte': { description: 'You have spent your life in service to a temple.', skillProficiencies: ['insight', 'religion'] },
  'Charlatan': { description: 'You have always had a way with people.', skillProficiencies: ['deception', 'sleightOfHand'] },
  'Criminal': { description: 'You are an experienced criminal with contacts.', skillProficiencies: ['deception', 'stealth'] },
  'Entertainer': { description: 'You thrive in front of an audience.', skillProficiencies: ['acrobatics', 'performance'] },
  'Folk Hero': { description: 'You come from a humble background.', skillProficiencies: ['animalHandling', 'survival'] },
  'Guild Artisan': { description: 'You are a member of an artisan guild.', skillProficiencies: ['insight', 'persuasion'] },
  'Hermit': { description: 'You lived in seclusion for a time.', skillProficiencies: ['medicine', 'religion'] },
  'Noble': { description: 'You understand wealth and privilege.', skillProficiencies: ['history', 'persuasion'] },
  'Outlander': { description: 'You grew up in the wilds.', skillProficiencies: ['athletics', 'survival'] },
  'Sage': { description: 'You spent years learning lore.', skillProficiencies: ['arcana', 'history'] },
  'Sailor': { description: 'You sailed on a ship for years.', skillProficiencies: ['athletics', 'perception'] },
  'Soldier': { description: 'You are a trained soldier.', skillProficiencies: ['athletics', 'intimidation'] },
  'Urchin': { description: 'You grew up on the streets.', skillProficiencies: ['sleightOfHand', 'stealth'] },
};

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
