// Encounter Builder Data
// Based on 5e DMG encounter building rules

// XP Thresholds by character level
export const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

// XP by CR
export const CR_XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
};

// Encounter multipliers based on number of monsters
export const ENCOUNTER_MULTIPLIERS: { min: number; max: number; multiplier: number }[] = [
  { min: 1, max: 1, multiplier: 1 },
  { min: 2, max: 2, multiplier: 1.5 },
  { min: 3, max: 6, multiplier: 2 },
  { min: 7, max: 10, multiplier: 2.5 },
  { min: 11, max: 14, multiplier: 3 },
  { min: 15, max: Infinity, multiplier: 4 },
];

export type DifficultyLevel = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface EncounterMonster {
  id: string;
  name: string;
  cr: string;
  xp: number;
  count: number;
}

export interface EncounterCalculation {
  totalXP: number;
  adjustedXP: number;
  multiplier: number;
  difficulty: DifficultyLevel;
  difficultyThresholds: { easy: number; medium: number; hard: number; deadly: number };
}

// Get multiplier based on number of monsters
export function getEncounterMultiplier(monsterCount: number): number {
  for (const bracket of ENCOUNTER_MULTIPLIERS) {
    if (monsterCount >= bracket.min && monsterCount <= bracket.max) {
      return bracket.multiplier;
    }
  }
  return 4; // Default to highest if somehow above range
}

// Calculate party XP thresholds
export function getPartyThresholds(partyLevels: number[]): { easy: number; medium: number; hard: number; deadly: number } {
  let easy = 0, medium = 0, hard = 0, deadly = 0;

  for (const level of partyLevels) {
    const clampedLevel = Math.max(1, Math.min(20, level));
    const thresholds = XP_THRESHOLDS[clampedLevel];
    easy += thresholds.easy;
    medium += thresholds.medium;
    hard += thresholds.hard;
    deadly += thresholds.deadly;
  }

  return { easy, medium, hard, deadly };
}

// Determine difficulty based on adjusted XP
export function getDifficulty(adjustedXP: number, thresholds: { easy: number; medium: number; hard: number; deadly: number }): DifficultyLevel {
  if (adjustedXP >= thresholds.deadly) return 'deadly';
  if (adjustedXP >= thresholds.hard) return 'hard';
  if (adjustedXP >= thresholds.medium) return 'medium';
  if (adjustedXP >= thresholds.easy) return 'easy';
  return 'trivial';
}

// Calculate full encounter details
export function calculateEncounter(monsters: EncounterMonster[], partyLevels: number[]): EncounterCalculation {
  const totalMonsterCount = monsters.reduce((sum, m) => sum + m.count, 0);
  const totalXP = monsters.reduce((sum, m) => sum + (m.xp * m.count), 0);
  const multiplier = getEncounterMultiplier(totalMonsterCount);
  const adjustedXP = Math.floor(totalXP * multiplier);
  const difficultyThresholds = getPartyThresholds(partyLevels);
  const difficulty = getDifficulty(adjustedXP, difficultyThresholds);

  return {
    totalXP,
    adjustedXP,
    multiplier,
    difficulty,
    difficultyThresholds,
  };
}

// Parse CR string to number for comparison
export function parseCR(cr: string): number {
  if (cr.includes('/')) {
    const [num, denom] = cr.split('/').map(Number);
    return num / denom;
  }
  return parseFloat(cr);
}

// Get appropriate CR range for a party
export function getSuggestedCRRange(partySize: number, averageLevel: number): { min: string; max: string } {
  // Rough guidelines based on party strength
  const partyStrength = partySize * averageLevel;

  if (partyStrength <= 4) return { min: '0', max: '1/2' };
  if (partyStrength <= 8) return { min: '1/4', max: '1' };
  if (partyStrength <= 16) return { min: '1/2', max: '3' };
  if (partyStrength <= 24) return { min: '1', max: '5' };
  if (partyStrength <= 40) return { min: '2', max: '8' };
  if (partyStrength <= 60) return { min: '4', max: '12' };
  if (partyStrength <= 80) return { min: '6', max: '17' };
  return { min: '8', max: '20' };
}

// Environment types for themed encounters
export const ENVIRONMENT_TYPES = [
  'any',
  'arctic',
  'coastal',
  'desert',
  'forest',
  'grassland',
  'hill',
  'mountain',
  'swamp',
  'underdark',
  'underwater',
  'urban',
] as const;

export type EnvironmentType = typeof ENVIRONMENT_TYPES[number];

// Monster types that commonly appear in environments
export const ENVIRONMENT_MONSTER_TYPES: Record<EnvironmentType, string[]> = {
  any: ['humanoid', 'beast', 'monstrosity'],
  arctic: ['beast', 'elemental', 'giant', 'monstrosity'],
  coastal: ['beast', 'elemental', 'monstrosity', 'dragon'],
  desert: ['beast', 'elemental', 'monstrosity', 'undead'],
  forest: ['beast', 'fey', 'plant', 'humanoid', 'monstrosity'],
  grassland: ['beast', 'humanoid', 'monstrosity'],
  hill: ['beast', 'giant', 'humanoid', 'dragon'],
  mountain: ['dragon', 'elemental', 'giant', 'monstrosity'],
  swamp: ['beast', 'plant', 'undead', 'monstrosity'],
  underdark: ['aberration', 'monstrosity', 'ooze', 'undead'],
  underwater: ['beast', 'elemental', 'monstrosity', 'aberration'],
  urban: ['humanoid', 'construct', 'undead', 'fiend'],
};

// Difficulty color mapping
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  trivial: 'text-gray-400',
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  deadly: 'text-red-500',
};

export const DIFFICULTY_BG_COLORS: Record<DifficultyLevel, string> = {
  trivial: 'bg-gray-500/20 border-gray-500',
  easy: 'bg-green-500/20 border-green-500',
  medium: 'bg-yellow-500/20 border-yellow-500',
  hard: 'bg-orange-500/20 border-orange-500',
  deadly: 'bg-red-500/20 border-red-500',
};
