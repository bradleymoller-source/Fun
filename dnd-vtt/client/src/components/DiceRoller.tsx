import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import type { DiceRoll, Character, AbilityScores, SkillName } from '../types';

// Calculate ability modifier from score
function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Calculate proficiency bonus from level
function getProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

// Skill to ability mapping
const SKILL_ABILITIES: Record<SkillName, keyof AbilityScores> = {
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

// Format skill name for display
function formatSkillName(skill: string): string {
  return skill.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// Parse dice notation like "2d6+3", "d20", "4d8-2"
function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100 || sides < 1 || sides > 1000) return null;

  return { count, sides, modifier };
}

// Roll dice based on parsed notation
function rollDice(count: number, sides: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return rolls;
}

interface DiceRollerProps {
  onRoll: (roll: DiceRoll) => void;
  playerId: string;
  playerName: string;
  isDm: boolean;
  character?: Character | null;
}

type CharacterRollType = 'ability' | 'save' | 'skill' | 'attack';

type RollMode = 'normal' | 'advantage' | 'disadvantage';

export function DiceRoller({ onRoll, playerId, playerName, isDm, character }: DiceRollerProps) {
  const [notation, setNotation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rollMode, setRollMode] = useState<RollMode>('normal');
  const [showCharacterRolls, setShowCharacterRolls] = useState(false);
  const { diceHistory } = useSessionStore();

  // Calculate character roll modifiers
  const getCharacterModifier = (rollType: CharacterRollType, key: string): number => {
    if (!character) return 0;

    const profBonus = getProficiencyBonus(character.level);

    switch (rollType) {
      case 'ability': {
        const ability = key as keyof AbilityScores;
        return getAbilityModifier(character.abilityScores[ability]);
      }
      case 'save': {
        const ability = key as keyof AbilityScores;
        const modifier = getAbilityModifier(character.abilityScores[ability]);
        const isProficient = character.savingThrowProficiencies.includes(ability);
        return modifier + (isProficient ? profBonus : 0);
      }
      case 'skill': {
        const skill = key as SkillName;
        const ability = SKILL_ABILITIES[skill];
        const modifier = getAbilityModifier(character.abilityScores[ability]);
        const profLevel = character.skillProficiencies[skill];
        if (profLevel === 'expertise') return modifier + profBonus * 2;
        if (profLevel === 'proficient') return modifier + profBonus;
        return modifier;
      }
      case 'attack': {
        // For attack, key is the weapon id
        const weapon = character.weapons.find(w => w.id === key);
        return weapon?.attackBonus || 0;
      }
      default:
        return 0;
    }
  };

  // Roll with character modifier
  const rollWithModifier = (label: string, modifier: number) => {
    // Handle advantage/disadvantage
    let rolls: number[];
    let chosenRoll: number;

    if (rollMode !== 'normal') {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      chosenRoll = rollMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      rolls = [roll1, roll2];
    } else {
      chosenRoll = Math.floor(Math.random() * 20) + 1;
      rolls = [chosenRoll];
    }

    const total = chosenRoll + modifier;
    const modifierSign = modifier >= 0 ? '+' : '';
    const advLabel = rollMode !== 'normal' ? ` (${rollMode === 'advantage' ? 'ADV' : 'DIS'})` : '';

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName,
      notation: `${label}: d20${modifierSign}${modifier}${advLabel}`,
      rolls,
      modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: isDm && isPrivate,
    };

    onRoll(roll);
  };

  const handleRoll = () => {
    const parsed = parseDiceNotation(notation.trim());
    if (!parsed) return;

    const rolls = rollDice(parsed.count, parsed.sides);
    const total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName,
      notation: notation.trim(),
      rolls,
      modifier: parsed.modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: isDm && isPrivate,
    };

    onRoll(roll);
    setNotation('');
  };

  const quickRoll = (dice: string) => {
    const parsed = parseDiceNotation(dice);
    if (!parsed) return;

    // Handle advantage/disadvantage for d20 rolls
    const isD20 = parsed.count === 1 && parsed.sides === 20;
    let rolls: number[];
    let total: number;
    let displayNotation = dice;

    if (isD20 && rollMode !== 'normal') {
      // Roll 2d20 and take higher/lower
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const chosenRoll = rollMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      rolls = [roll1, roll2];
      total = chosenRoll + parsed.modifier;
      displayNotation = `${dice} (${rollMode === 'advantage' ? 'ADV' : 'DIS'})`;
    } else {
      rolls = rollDice(parsed.count, parsed.sides);
      total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;
    }

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName,
      notation: displayNotation,
      rolls,
      modifier: parsed.modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: isDm && isPrivate,
    };

    onRoll(roll);
  };

  return (
    <div className="space-y-3">
      {/* Quick Dice Buttons */}
      <div className="flex flex-wrap gap-2">
        {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((dice) => (
          <button
            key={dice}
            onClick={() => quickRoll(dice)}
            className="px-3 py-2 bg-leather text-parchment rounded hover:bg-gold hover:text-dark-wood font-medieval text-sm transition-colors"
          >
            {dice.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Advantage/Disadvantage Toggle */}
      <div className="flex gap-1 bg-dark-wood p-1 rounded">
        <button
          onClick={() => setRollMode('disadvantage')}
          className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
            rollMode === 'disadvantage'
              ? 'bg-red-600 text-white'
              : 'text-parchment/70 hover:text-parchment'
          }`}
          title="Disadvantage: Roll 2d20, take lower"
        >
          DIS
        </button>
        <button
          onClick={() => setRollMode('normal')}
          className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
            rollMode === 'normal'
              ? 'bg-gold text-dark-wood'
              : 'text-parchment/70 hover:text-parchment'
          }`}
          title="Normal: Roll normally"
        >
          NORMAL
        </button>
        <button
          onClick={() => setRollMode('advantage')}
          className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${
            rollMode === 'advantage'
              ? 'bg-green-600 text-white'
              : 'text-parchment/70 hover:text-parchment'
          }`}
          title="Advantage: Roll 2d20, take higher"
        >
          ADV
        </button>
      </div>

      {/* Character Rolls (if character exists) */}
      {character && (
        <div className="border border-leather rounded">
          <button
            onClick={() => setShowCharacterRolls(!showCharacterRolls)}
            className="w-full p-2 text-left text-parchment font-medieval flex justify-between items-center hover:bg-leather/30"
          >
            <span>Character Rolls</span>
            <span className={`transform transition-transform ${showCharacterRolls ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showCharacterRolls && (
            <div className="p-2 space-y-3 bg-dark-wood/50">
              {/* Ability Checks */}
              <div>
                <h5 className="text-parchment/70 text-xs uppercase mb-1">Ability Checks</h5>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(character.abilityScores) as Array<keyof AbilityScores>).map((ability) => {
                    const mod = getCharacterModifier('ability', ability);
                    return (
                      <button
                        key={ability}
                        onClick={() => rollWithModifier(ability.substring(0, 3).toUpperCase(), mod)}
                        className="px-2 py-1 text-xs bg-leather rounded hover:bg-gold hover:text-dark-wood"
                        title={`${ability} check: ${mod >= 0 ? '+' : ''}${mod}`}
                      >
                        {ability.substring(0, 3).toUpperCase()} ({mod >= 0 ? '+' : ''}{mod})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saving Throws */}
              <div>
                <h5 className="text-parchment/70 text-xs uppercase mb-1">Saving Throws</h5>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(character.abilityScores) as Array<keyof AbilityScores>).map((ability) => {
                    const mod = getCharacterModifier('save', ability);
                    const isProficient = character.savingThrowProficiencies.includes(ability);
                    return (
                      <button
                        key={ability}
                        onClick={() => rollWithModifier(`${ability.substring(0, 3).toUpperCase()} Save`, mod)}
                        className={`px-2 py-1 text-xs rounded hover:bg-gold hover:text-dark-wood ${
                          isProficient ? 'bg-gold/30 text-gold' : 'bg-leather'
                        }`}
                        title={`${ability} save: ${mod >= 0 ? '+' : ''}${mod}${isProficient ? ' (proficient)' : ''}`}
                      >
                        {ability.substring(0, 3).toUpperCase()} ({mod >= 0 ? '+' : ''}{mod})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h5 className="text-parchment/70 text-xs uppercase mb-1">Skills</h5>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {(Object.keys(SKILL_ABILITIES) as SkillName[]).map((skill) => {
                    const mod = getCharacterModifier('skill', skill);
                    const profLevel = character.skillProficiencies[skill];
                    return (
                      <button
                        key={skill}
                        onClick={() => rollWithModifier(formatSkillName(skill), mod)}
                        className={`px-2 py-1 text-xs rounded text-left hover:bg-gold hover:text-dark-wood ${
                          profLevel === 'expertise' ? 'bg-purple-600/30 text-purple-300' :
                          profLevel === 'proficient' ? 'bg-gold/30 text-gold' : 'bg-leather'
                        }`}
                        title={`${formatSkillName(skill)}: ${mod >= 0 ? '+' : ''}${mod}`}
                      >
                        {formatSkillName(skill)} ({mod >= 0 ? '+' : ''}{mod})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attack Rolls */}
              {character.weapons.length > 0 && (() => {
                // Check for combat feats
                const hasSavageAttacker = character.features?.some(f => f.name === 'Savage Attacker');
                const hasTavernBrawler = character.features?.some(f => f.name === 'Tavern Brawler');
                const isUnarmed = (name: string) => name.toLowerCase().includes('unarmed');

                return (
                  <div>
                    <h5 className="text-parchment/70 text-xs uppercase mb-1">Attack Rolls</h5>
                    {/* Feat combat reminders */}
                    {hasSavageAttacker && (
                      <p className="text-amber-400/80 text-xs mb-1 italic">
                        Savage Attacker: Once/turn, roll damage twice, use either
                      </p>
                    )}
                    <div className="space-y-1">
                      {character.weapons.filter(w => w.equipped).map((weapon) => {
                        // Build tooltip with feat notes
                        let tooltip = `${weapon.name}: +${weapon.attackBonus} to hit, ${weapon.damage}`;
                        if (isUnarmed(weapon.name) && hasTavernBrawler) {
                          tooltip += '\n\nTavern Brawler:\n• Reroll 1s on damage\n• Push target 5 ft on hit (1/turn)';
                        }
                        if (hasSavageAttacker) {
                          tooltip += '\n\nSavage Attacker: Roll damage twice (1/turn)';
                        }

                        return (
                          <button
                            key={weapon.id}
                            onClick={() => rollWithModifier(`${weapon.name} Attack`, weapon.attackBonus)}
                            className={`w-full px-2 py-1 text-xs rounded text-left hover:bg-red-700 hover:text-white ${
                              isUnarmed(weapon.name) && hasTavernBrawler
                                ? 'bg-orange-900/40 text-orange-300 border border-orange-600/30'
                                : 'bg-red-900/30 text-red-300'
                            }`}
                            title={tooltip}
                          >
                            {weapon.name} (+{weapon.attackBonus}) - {weapon.damage}
                            {isUnarmed(weapon.name) && hasTavernBrawler && (
                              <span className="text-orange-400 ml-1">*</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Custom Roll Input */}
      <div className="flex gap-2">
        <Input
          placeholder="2d6+3"
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          className="flex-1 text-sm py-2"
        />
        <Button size="sm" onClick={handleRoll} disabled={!parseDiceNotation(notation.trim())}>
          Roll
        </Button>
      </div>

      {/* DM Private Roll Option */}
      {isDm && (
        <label className="flex items-center gap-2 text-parchment text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4"
          />
          Private roll (DM only)
        </label>
      )}

      {/* Recent Rolls */}
      {diceHistory.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
          <h4 className="text-parchment/70 text-xs uppercase tracking-wide">Recent Rolls</h4>
          {diceHistory.slice(0, 10).map((roll) => (
            <div
              key={roll.id}
              className={`p-2 rounded text-sm ${
                roll.isPrivate ? 'bg-purple-900/30 border border-purple-500' : 'bg-dark-wood'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-parchment/70">{roll.playerName}</span>
                <span className="text-gold font-bold text-lg">{roll.total}</span>
              </div>
              <div className="text-parchment/50 text-xs">
                {roll.notation}: [{roll.rolls.join(', ')}]
                {roll.modifier !== 0 && ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
                {roll.isPrivate && <span className="text-purple-400 ml-2">(private)</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
