/**
 * D&D 5e Encounter Scaling System
 *
 * Based on the Dungeon Master's Guide encounter building rules.
 * Provides functions for calculating encounter difficulty and recommending
 * appropriate monsters based on party level and size.
 *
 * Sources:
 * - DMG Chapter 3: Creating Adventures (Building Combat Encounters)
 * - D&D Beyond Basic Rules
 */

// ============================================================================
// XP THRESHOLDS BY CHARACTER LEVEL
// ============================================================================
// These are the XP thresholds for a single character at each level.
// For a party, sum the thresholds for all party members.

export const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1:  { easy: 25,    medium: 50,    hard: 75,    deadly: 100 },
  2:  { easy: 50,    medium: 100,   hard: 150,   deadly: 200 },
  3:  { easy: 75,    medium: 150,   hard: 225,   deadly: 400 },
  4:  { easy: 125,   medium: 250,   hard: 375,   deadly: 500 },
  5:  { easy: 250,   medium: 500,   hard: 750,   deadly: 1100 },
  6:  { easy: 300,   medium: 600,   hard: 900,   deadly: 1400 },
  7:  { easy: 350,   medium: 750,   hard: 1100,  deadly: 1700 },
  8:  { easy: 450,   medium: 900,   hard: 1400,  deadly: 2100 },
  9:  { easy: 550,   medium: 1100,  hard: 1600,  deadly: 2400 },
  10: { easy: 600,   medium: 1200,  hard: 1900,  deadly: 2800 },
  11: { easy: 800,   medium: 1600,  hard: 2400,  deadly: 3600 },
  12: { easy: 1000,  medium: 2000,  hard: 3000,  deadly: 4500 },
  13: { easy: 1100,  medium: 2200,  hard: 3400,  deadly: 5100 },
  14: { easy: 1250,  medium: 2500,  hard: 3800,  deadly: 5700 },
  15: { easy: 1400,  medium: 2800,  hard: 4300,  deadly: 6400 },
  16: { easy: 1600,  medium: 3200,  hard: 4800,  deadly: 7200 },
  17: { easy: 2000,  medium: 3900,  hard: 5900,  deadly: 8800 },
  18: { easy: 2100,  medium: 4200,  hard: 6300,  deadly: 9500 },
  19: { easy: 2400,  medium: 4900,  hard: 7300,  deadly: 10900 },
  20: { easy: 2800,  medium: 5700,  hard: 8500,  deadly: 12700 },
};

// ============================================================================
// XP BY CHALLENGE RATING
// ============================================================================
// Maps CR values to their XP worth

export const CR_TO_XP: Record<string, number> = {
  '0':    10,
  '1/8':  25,
  '1/4':  50,
  '1/2':  100,
  '1':    200,
  '2':    450,
  '3':    700,
  '4':    1100,
  '5':    1800,
  '6':    2300,
  '7':    2900,
  '8':    3900,
  '9':    5000,
  '10':   5900,
  '11':   7200,
  '12':   8400,
  '13':   10000,
  '14':   11500,
  '15':   13000,
  '16':   15000,
  '17':   18000,
  '18':   20000,
  '19':   22000,
  '20':   25000,
  '21':   33000,
  '22':   41000,
  '23':   50000,
  '24':   62000,
  '25':   75000,
  '26':   90000,
  '27':   105000,
  '28':   120000,
  '29':   135000,
  '30':   155000,
};

// Numeric CR for comparison/calculation
export const CR_TO_NUMERIC: Record<string, number> = {
  '0':    0,
  '1/8':  0.125,
  '1/4':  0.25,
  '1/2':  0.5,
  '1':    1,
  '2':    2,
  '3':    3,
  '4':    4,
  '5':    5,
  '6':    6,
  '7':    7,
  '8':    8,
  '9':    9,
  '10':   10,
  '11':   11,
  '12':   12,
  '13':   13,
  '14':   14,
  '15':   15,
  '16':   16,
  '17':   17,
  '18':   18,
  '19':   19,
  '20':   20,
  '21':   21,
  '22':   22,
  '23':   23,
  '24':   24,
  '25':   25,
  '26':   26,
  '27':   27,
  '28':   28,
  '29':   29,
  '30':   30,
};

// ============================================================================
// ENCOUNTER MULTIPLIERS
// ============================================================================
// Multipliers based on number of monsters (for standard party of 3-5)

export const ENCOUNTER_MULTIPLIERS: { maxMonsters: number; multiplier: number }[] = [
  { maxMonsters: 1,  multiplier: 1 },
  { maxMonsters: 2,  multiplier: 1.5 },
  { maxMonsters: 6,  multiplier: 2 },
  { maxMonsters: 10, multiplier: 2.5 },
  { maxMonsters: 14, multiplier: 3 },
  { maxMonsters: Infinity, multiplier: 4 },
];

// Party size adjustments to multiplier index
// < 3 players: use next higher multiplier
// 6+ players: use next lower multiplier
function getMultiplierAdjustment(partySize: number): number {
  if (partySize < 3) return 1;  // Shift up (harder)
  if (partySize >= 6) return -1; // Shift down (easier)
  return 0;
}

// ============================================================================
// MONSTER STAT RECOMMENDATIONS BY CR
// ============================================================================
// Based on DMG Monster Statistics by Challenge Rating

export interface MonsterStatBlock {
  cr: string;
  profBonus: number;
  ac: number;
  hpMin: number;
  hpMax: number;
  attackBonus: number;
  damagePerRound: number;
  saveDC: number;
}

export const MONSTER_STATS_BY_CR: Record<string, MonsterStatBlock> = {
  '0':    { cr: '0',    profBonus: 2, ac: 13, hpMin: 1,   hpMax: 6,   attackBonus: 3, damagePerRound: 1,   saveDC: 13 },
  '1/8':  { cr: '1/8',  profBonus: 2, ac: 13, hpMin: 7,   hpMax: 35,  attackBonus: 3, damagePerRound: 3,   saveDC: 13 },
  '1/4':  { cr: '1/4',  profBonus: 2, ac: 13, hpMin: 36,  hpMax: 49,  attackBonus: 3, damagePerRound: 5,   saveDC: 13 },
  '1/2':  { cr: '1/2',  profBonus: 2, ac: 13, hpMin: 50,  hpMax: 70,  attackBonus: 3, damagePerRound: 8,   saveDC: 13 },
  '1':    { cr: '1',    profBonus: 2, ac: 13, hpMin: 71,  hpMax: 85,  attackBonus: 3, damagePerRound: 14,  saveDC: 13 },
  '2':    { cr: '2',    profBonus: 2, ac: 13, hpMin: 86,  hpMax: 100, attackBonus: 3, damagePerRound: 21,  saveDC: 13 },
  '3':    { cr: '3',    profBonus: 2, ac: 13, hpMin: 101, hpMax: 115, attackBonus: 4, damagePerRound: 27,  saveDC: 13 },
  '4':    { cr: '4',    profBonus: 2, ac: 14, hpMin: 116, hpMax: 130, attackBonus: 5, damagePerRound: 33,  saveDC: 14 },
  '5':    { cr: '5',    profBonus: 3, ac: 15, hpMin: 131, hpMax: 145, attackBonus: 6, damagePerRound: 39,  saveDC: 15 },
  '6':    { cr: '6',    profBonus: 3, ac: 15, hpMin: 146, hpMax: 160, attackBonus: 6, damagePerRound: 45,  saveDC: 15 },
  '7':    { cr: '7',    profBonus: 3, ac: 15, hpMin: 161, hpMax: 175, attackBonus: 6, damagePerRound: 51,  saveDC: 15 },
  '8':    { cr: '8',    profBonus: 3, ac: 16, hpMin: 176, hpMax: 190, attackBonus: 7, damagePerRound: 57,  saveDC: 16 },
  '9':    { cr: '9',    profBonus: 4, ac: 16, hpMin: 191, hpMax: 205, attackBonus: 7, damagePerRound: 63,  saveDC: 16 },
  '10':   { cr: '10',   profBonus: 4, ac: 17, hpMin: 206, hpMax: 220, attackBonus: 7, damagePerRound: 69,  saveDC: 16 },
  '11':   { cr: '11',   profBonus: 4, ac: 17, hpMin: 221, hpMax: 235, attackBonus: 8, damagePerRound: 75,  saveDC: 17 },
  '12':   { cr: '12',   profBonus: 4, ac: 17, hpMin: 236, hpMax: 250, attackBonus: 8, damagePerRound: 81,  saveDC: 17 },
  '13':   { cr: '13',   profBonus: 5, ac: 18, hpMin: 251, hpMax: 265, attackBonus: 8, damagePerRound: 87,  saveDC: 18 },
  '14':   { cr: '14',   profBonus: 5, ac: 18, hpMin: 266, hpMax: 280, attackBonus: 8, damagePerRound: 93,  saveDC: 18 },
  '15':   { cr: '15',   profBonus: 5, ac: 18, hpMin: 281, hpMax: 295, attackBonus: 8, damagePerRound: 99,  saveDC: 18 },
  '16':   { cr: '16',   profBonus: 5, ac: 18, hpMin: 296, hpMax: 310, attackBonus: 9, damagePerRound: 105, saveDC: 18 },
  '17':   { cr: '17',   profBonus: 6, ac: 19, hpMin: 311, hpMax: 325, attackBonus: 10, damagePerRound: 111, saveDC: 19 },
  '18':   { cr: '18',   profBonus: 6, ac: 19, hpMin: 326, hpMax: 340, attackBonus: 10, damagePerRound: 117, saveDC: 19 },
  '19':   { cr: '19',   profBonus: 6, ac: 19, hpMin: 341, hpMax: 355, attackBonus: 10, damagePerRound: 123, saveDC: 19 },
  '20':   { cr: '20',   profBonus: 6, ac: 19, hpMin: 356, hpMax: 400, attackBonus: 10, damagePerRound: 132, saveDC: 19 },
};

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface PartyInfo {
  level: number;
  size: number;
}

export interface Monster {
  cr: string;
  count: number;
}

export interface EncounterAnalysis {
  totalXP: number;
  adjustedXP: number;
  multiplier: number;
  difficulty: Difficulty;
  thresholds: {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
  };
  budgetRemaining: {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
  };
}

/**
 * Get party XP thresholds for each difficulty level
 */
export function getPartyThresholds(party: PartyInfo): { easy: number; medium: number; hard: number; deadly: number } {
  const levelThresholds = XP_THRESHOLDS[Math.min(Math.max(party.level, 1), 20)];
  return {
    easy: levelThresholds.easy * party.size,
    medium: levelThresholds.medium * party.size,
    hard: levelThresholds.hard * party.size,
    deadly: levelThresholds.deadly * party.size,
  };
}

/**
 * Get the encounter multiplier based on number of monsters and party size
 */
export function getEncounterMultiplier(monsterCount: number, partySize: number): number {
  const adjustment = getMultiplierAdjustment(partySize);

  let baseIndex = ENCOUNTER_MULTIPLIERS.findIndex(m => monsterCount <= m.maxMonsters);
  if (baseIndex === -1) baseIndex = ENCOUNTER_MULTIPLIERS.length - 1;

  // Apply party size adjustment
  const adjustedIndex = Math.max(0, Math.min(ENCOUNTER_MULTIPLIERS.length - 1, baseIndex + adjustment));

  return ENCOUNTER_MULTIPLIERS[adjustedIndex].multiplier;
}

/**
 * Calculate the total XP of an encounter and its adjusted XP
 */
export function calculateEncounterXP(monsters: Monster[], partySize: number): { totalXP: number; adjustedXP: number; multiplier: number } {
  let totalXP = 0;
  let totalMonsters = 0;

  for (const monster of monsters) {
    const xp = CR_TO_XP[monster.cr] || 0;
    totalXP += xp * monster.count;
    totalMonsters += monster.count;
  }

  const multiplier = getEncounterMultiplier(totalMonsters, partySize);
  const adjustedXP = Math.floor(totalXP * multiplier);

  return { totalXP, adjustedXP, multiplier };
}

/**
 * Determine encounter difficulty based on adjusted XP and party thresholds
 */
export function getEncounterDifficulty(adjustedXP: number, thresholds: { easy: number; medium: number; hard: number; deadly: number }): Difficulty {
  if (adjustedXP >= thresholds.deadly) return 'deadly';
  if (adjustedXP >= thresholds.hard) return 'hard';
  if (adjustedXP >= thresholds.medium) return 'medium';
  if (adjustedXP >= thresholds.easy) return 'easy';
  return 'trivial';
}

/**
 * Full encounter analysis
 */
export function analyzeEncounter(party: PartyInfo, monsters: Monster[]): EncounterAnalysis {
  const thresholds = getPartyThresholds(party);
  const { totalXP, adjustedXP, multiplier } = calculateEncounterXP(monsters, party.size);
  const difficulty = getEncounterDifficulty(adjustedXP, thresholds);

  return {
    totalXP,
    adjustedXP,
    multiplier,
    difficulty,
    thresholds,
    budgetRemaining: {
      easy: thresholds.easy - adjustedXP,
      medium: thresholds.medium - adjustedXP,
      hard: thresholds.hard - adjustedXP,
      deadly: thresholds.deadly - adjustedXP,
    },
  };
}

// ============================================================================
// ENCOUNTER BUILDING HELPERS
// ============================================================================

/**
 * Get recommended CR range for a solo boss fight
 * Solo bosses should be deadly encounters with legendary actions
 */
export function getRecommendedBossCR(party: PartyInfo): { minCR: string; maxCR: string; idealCR: string; recommendedHP: number } {
  const thresholds = getPartyThresholds(party);
  const targetXP = thresholds.deadly * 1.5; // Bosses should exceed deadly threshold

  // Find the CR that matches this XP (accounting for solo monster = x1 multiplier)
  let idealCR = '1';
  let closestDiff = Infinity;

  for (const [cr, xp] of Object.entries(CR_TO_XP)) {
    const diff = Math.abs(xp - targetXP);
    if (diff < closestDiff) {
      closestDiff = diff;
      idealCR = cr;
    }
  }

  // Get the numeric CR for range calculation
  const numericCR = CR_TO_NUMERIC[idealCR] || 1;

  // Min CR is party level (medium challenge)
  // Max CR is party level + 4 (very deadly)
  const minNumeric = Math.max(1, party.level - 1);
  const maxNumeric = party.level + Math.ceil(party.level * 0.5);

  const minCR = numericToCRString(minNumeric);
  const maxCR = numericToCRString(Math.min(maxNumeric, 30));

  // Recommended HP for a boss (higher than standard to survive focus fire)
  const stats = MONSTER_STATS_BY_CR[idealCR] || MONSTER_STATS_BY_CR['1'];
  const recommendedHP = Math.floor((stats.hpMin + stats.hpMax) / 2 * 1.5); // 50% more HP than average

  return { minCR, maxCR, idealCR, recommendedHP };
}

/**
 * Get recommended monsters for a standard encounter
 */
export function getRecommendedEncounter(
  party: PartyInfo,
  targetDifficulty: 'easy' | 'medium' | 'hard' | 'deadly'
): { singleMonsterCR: string; mixedEncounter: Monster[]; xpBudget: number } {
  const thresholds = getPartyThresholds(party);
  const xpBudget = thresholds[targetDifficulty];

  // For a single monster, find the CR that matches
  let singleMonsterCR = '1';
  let closestDiff = Infinity;

  for (const [cr, xp] of Object.entries(CR_TO_XP)) {
    const diff = Math.abs(xp - xpBudget);
    if (diff < closestDiff && xp <= xpBudget * 1.2) { // Allow 20% over
      closestDiff = diff;
      singleMonsterCR = cr;
    }
  }

  // For a mixed encounter (1 leader + minions)
  // Leader should be about 60% of budget, minions 40%
  const leaderBudget = xpBudget * 0.6;
  const minionBudget = xpBudget * 0.4;

  let leaderCR = '1';
  closestDiff = Infinity;
  for (const [cr, xp] of Object.entries(CR_TO_XP)) {
    const diff = Math.abs(xp - leaderBudget);
    if (diff < closestDiff && xp <= leaderBudget * 1.2) {
      closestDiff = diff;
      leaderCR = cr;
    }
  }

  // Minions should be much weaker (CR 1/4 to CR 2 typically)
  const minionCR = getMinionCR(party.level);
  const minionXP = CR_TO_XP[minionCR] || 50;
  const minionCount = Math.max(2, Math.floor(minionBudget / minionXP));

  const mixedEncounter: Monster[] = [
    { cr: leaderCR, count: 1 },
    { cr: minionCR, count: minionCount },
  ];

  return { singleMonsterCR, mixedEncounter, xpBudget };
}

/**
 * Get appropriate minion CR based on party level
 */
function getMinionCR(partyLevel: number): string {
  if (partyLevel <= 2) return '1/8';
  if (partyLevel <= 4) return '1/4';
  if (partyLevel <= 6) return '1/2';
  if (partyLevel <= 10) return '1';
  if (partyLevel <= 14) return '2';
  return '3';
}

/**
 * Convert numeric CR to string CR
 */
function numericToCRString(numeric: number): string {
  if (numeric <= 0) return '0';
  if (numeric < 0.25) return '1/8';
  if (numeric < 0.5) return '1/4';
  if (numeric < 1) return '1/2';
  return String(Math.floor(numeric));
}

/**
 * Get recommended stats for a monster of given CR
 */
export function getMonsterStats(cr: string): MonsterStatBlock | null {
  return MONSTER_STATS_BY_CR[cr] || null;
}

/**
 * Get daily XP budget for a party
 * Based on 6-8 medium/hard encounters per day
 */
export function getDailyXPBudget(party: PartyInfo): { minimum: number; maximum: number; typical: number } {
  const thresholds = getPartyThresholds(party);
  return {
    minimum: thresholds.medium * 6, // 6 medium encounters
    maximum: thresholds.hard * 8,   // 8 hard encounters
    typical: thresholds.medium * 7, // 7 medium encounters (typical day)
  };
}

// ============================================================================
// PROMPT GENERATION HELPERS
// ============================================================================

/**
 * Generate encounter scaling guidelines for AI prompts
 */
export function generateEncounterGuidelines(partyLevel: number, partySize: number): string {
  const party = { level: partyLevel, size: partySize };
  const thresholds = getPartyThresholds(party);
  const boss = getRecommendedBossCR(party);
  const hardEncounter = getRecommendedEncounter(party, 'hard');
  const mediumEncounter = getRecommendedEncounter(party, 'medium');

  return `
=== ENCOUNTER SCALING FOR ${partySize} LEVEL ${partyLevel} CHARACTERS ===

XP THRESHOLDS (adjusted XP after multiplier):
- Easy: ${thresholds.easy} XP
- Medium: ${thresholds.medium} XP
- Hard: ${thresholds.hard} XP
- Deadly: ${thresholds.deadly} XP

BOSS ENCOUNTER (Act 3):
- Recommended CR: ${boss.idealCR} (range ${boss.minCR}-${boss.maxCR})
- Recommended HP: ${boss.recommendedHP}+ (bosses need extra HP to survive focus fire)
- MUST have: Legendary Actions, Legendary Resistance (3/day)
- Add 2-4 minions (CR ${getMinionCR(partyLevel)}) to help with action economy

STANDARD ENCOUNTERS (Act 2):
- Hard encounter: Single CR ${hardEncounter.singleMonsterCR} OR 1x CR ${hardEncounter.mixedEncounter[0]?.cr} + ${hardEncounter.mixedEncounter[1]?.count}x CR ${hardEncounter.mixedEncounter[1]?.cr}
- Medium encounter: Single CR ${mediumEncounter.singleMonsterCR}
- Include 3 encounters in Act 2: 1 easy/medium, 1 medium/hard, 1 hard

ENCOUNTER MULTIPLIERS (for XP calculation):
- 1 monster: x1
- 2 monsters: x1.5
- 3-6 monsters: x2
- 7-10 monsters: x2.5
- 11-14 monsters: x3
- 15+ monsters: x4

MONSTER STAT GUIDELINES BY CR:
${generateStatTable(partyLevel)}
`;
}

function generateStatTable(partyLevel: number): string {
  const relevantCRs = getRelevantCRs(partyLevel);
  let table = 'CR  | AC | HP Range   | Attack | Damage/Round | Save DC\n';
  table += '----|----|-----------:|-------:|-------------:|-------:\n';

  for (const cr of relevantCRs) {
    const stats = MONSTER_STATS_BY_CR[cr];
    if (stats) {
      table += `${cr.padEnd(3)} | ${stats.ac}  | ${stats.hpMin}-${stats.hpMax}`.padEnd(15) +
               ` | +${stats.attackBonus}`.padEnd(8) +
               ` | ${stats.damagePerRound}`.padEnd(14) +
               ` | ${stats.saveDC}\n`;
    }
  }

  return table;
}

function getRelevantCRs(partyLevel: number): string[] {
  const minCR = Math.max(0, partyLevel - 3);
  const maxCR = partyLevel + 4;

  const allCRs = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

  return allCRs.filter(cr => {
    const numeric = CR_TO_NUMERIC[cr];
    return numeric >= minCR && numeric <= maxCR;
  });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that an encounter is balanced for the party
 */
export function validateEncounter(
  party: PartyInfo,
  monsters: Monster[],
  targetDifficulty: Difficulty
): { valid: boolean; message: string; analysis: EncounterAnalysis } {
  const analysis = analyzeEncounter(party, monsters);

  if (analysis.difficulty === 'trivial' && targetDifficulty !== 'trivial') {
    return {
      valid: false,
      message: `Encounter is too easy. Adjusted XP (${analysis.adjustedXP}) is below easy threshold (${analysis.thresholds.easy}).`,
      analysis,
    };
  }

  const difficultyOrder: Difficulty[] = ['trivial', 'easy', 'medium', 'hard', 'deadly'];
  const actualIndex = difficultyOrder.indexOf(analysis.difficulty);
  const targetIndex = difficultyOrder.indexOf(targetDifficulty);

  if (actualIndex > targetIndex + 1) {
    return {
      valid: false,
      message: `Encounter is too hard. It's ${analysis.difficulty} but should be ${targetDifficulty}.`,
      analysis,
    };
  }

  return {
    valid: true,
    message: `Encounter is ${analysis.difficulty} (${analysis.adjustedXP} adjusted XP).`,
    analysis,
  };
}
