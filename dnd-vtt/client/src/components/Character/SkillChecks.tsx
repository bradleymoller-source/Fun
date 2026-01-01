import { useState } from 'react';
import { Button } from '../ui/Button';
import type { Character, SkillName, AbilityScores } from '../../types';

// Map skills to their associated ability
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

// Display names for skills
const SKILL_NAMES: Record<SkillName, string> = {
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

// Group skills by ability
const SKILLS_BY_ABILITY: Record<keyof AbilityScores, SkillName[]> = {
  strength: ['athletics'],
  dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
  constitution: [],
  intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
  wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
  charisma: ['deception', 'intimidation', 'performance', 'persuasion'],
};

const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

interface SkillChecksProps {
  character: Character;
  onRoll: (skillName: string, modifier: number, advantageState: 'normal' | 'advantage' | 'disadvantage') => void;
}

export function SkillChecks({ character, onRoll }: SkillChecksProps) {
  const [advantageState, setAdvantageState] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [lastRoll, setLastRoll] = useState<{ skill: string; rolls: number[]; modifier: number; total: number } | null>(null);

  // Calculate ability modifier
  const getAbilityMod = (ability: keyof AbilityScores): number => {
    return Math.floor((character.abilityScores[ability] - 10) / 2);
  };

  // Calculate proficiency bonus based on level
  const getProficiencyBonus = (): number => {
    return Math.ceil(1 + character.level / 4);
  };

  // Calculate skill modifier
  const getSkillModifier = (skill: SkillName): number => {
    const ability = SKILL_ABILITIES[skill];
    const abilityMod = getAbilityMod(ability);
    const profLevel = character.skillProficiencies[skill];
    const profBonus = getProficiencyBonus();

    if (profLevel === 'expertise') {
      return abilityMod + (profBonus * 2);
    } else if (profLevel === 'proficient') {
      return abilityMod + profBonus;
    }
    return abilityMod;
  };

  // Roll skill check
  const handleSkillRoll = (skill: SkillName) => {
    const modifier = getSkillModifier(skill);
    const skillName = SKILL_NAMES[skill];

    // Roll dice
    let roll1 = Math.floor(Math.random() * 20) + 1;
    let roll2 = advantageState !== 'normal' ? Math.floor(Math.random() * 20) + 1 : roll1;

    let finalRoll: number;
    const rolls = advantageState !== 'normal' ? [roll1, roll2] : [roll1];

    if (advantageState === 'advantage') {
      finalRoll = Math.max(roll1, roll2);
    } else if (advantageState === 'disadvantage') {
      finalRoll = Math.min(roll1, roll2);
    } else {
      finalRoll = roll1;
    }

    const total = finalRoll + modifier;

    setLastRoll({
      skill: skillName,
      rolls,
      modifier,
      total,
    });

    onRoll(skillName, modifier, advantageState);
  };

  // Roll ability check (for CON or raw ability checks)
  const handleAbilityRoll = (ability: keyof AbilityScores) => {
    const modifier = getAbilityMod(ability);
    const abilityName = ABILITY_NAMES[ability];

    let roll1 = Math.floor(Math.random() * 20) + 1;
    let roll2 = advantageState !== 'normal' ? Math.floor(Math.random() * 20) + 1 : roll1;

    let finalRoll: number;
    const rolls = advantageState !== 'normal' ? [roll1, roll2] : [roll1];

    if (advantageState === 'advantage') {
      finalRoll = Math.max(roll1, roll2);
    } else if (advantageState === 'disadvantage') {
      finalRoll = Math.min(roll1, roll2);
    } else {
      finalRoll = roll1;
    }

    const total = finalRoll + modifier;

    setLastRoll({
      skill: `${abilityName} Check`,
      rolls,
      modifier,
      total,
    });

    onRoll(`${abilityName} Check`, modifier, advantageState);
  };

  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-4">
      {/* Advantage/Disadvantage Toggle */}
      <div className="flex gap-2 items-center justify-center bg-dark-wood p-2 rounded">
        <span className="text-parchment/70 text-sm">Roll:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setAdvantageState('disadvantage')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              advantageState === 'disadvantage'
                ? 'bg-red-600 text-white'
                : 'bg-leather/50 text-parchment/70 hover:bg-leather'
            }`}
          >
            Disadv
          </button>
          <button
            onClick={() => setAdvantageState('normal')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              advantageState === 'normal'
                ? 'bg-blue-600 text-white'
                : 'bg-leather/50 text-parchment/70 hover:bg-leather'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setAdvantageState('advantage')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              advantageState === 'advantage'
                ? 'bg-green-600 text-white'
                : 'bg-leather/50 text-parchment/70 hover:bg-leather'
            }`}
          >
            Adv
          </button>
        </div>
      </div>

      {/* Last Roll Result */}
      {lastRoll && (
        <div className="bg-gold/20 border border-gold/30 rounded p-3 text-center">
          <div className="text-gold font-bold text-lg">{lastRoll.skill}</div>
          <div className="flex items-center justify-center gap-2 text-parchment">
            <span className="text-2xl font-bold">{lastRoll.total}</span>
            <span className="text-parchment/60 text-sm">
              ({lastRoll.rolls.join(', ')} {formatModifier(lastRoll.modifier)})
            </span>
          </div>
          {lastRoll.rolls.includes(20) && <span className="text-green-400 text-sm">Natural 20!</span>}
          {lastRoll.rolls.includes(1) && <span className="text-red-400 text-sm">Natural 1!</span>}
        </div>
      )}

      {/* Skills Grid by Ability */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(SKILLS_BY_ABILITY) as [keyof AbilityScores, SkillName[]][]).map(([ability, skills]) => (
          <div key={ability} className="bg-dark-wood p-2 rounded border border-leather">
            {/* Ability Header with Check Button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold text-sm">{ABILITY_NAMES[ability]}</span>
                <span className="text-parchment/60 text-xs">
                  ({character.abilityScores[ability]})
                </span>
              </div>
              <button
                onClick={() => handleAbilityRoll(ability)}
                className="px-2 py-0.5 text-xs bg-leather/50 rounded hover:bg-leather text-parchment"
                title={`Roll ${ABILITY_NAMES[ability]} check`}
              >
                {formatModifier(getAbilityMod(ability))}
              </button>
            </div>

            {/* Skills */}
            {skills.length > 0 ? (
              <div className="space-y-1">
                {skills.map((skill) => {
                  const modifier = getSkillModifier(skill);
                  const profLevel = character.skillProficiencies[skill];

                  return (
                    <button
                      key={skill}
                      onClick={() => handleSkillRoll(skill)}
                      className="w-full flex items-center justify-between px-2 py-1 text-xs rounded hover:bg-leather/30 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        {profLevel === 'expertise' && <span className="text-gold">★</span>}
                        {profLevel === 'proficient' && <span className="text-blue-400">●</span>}
                        <span className={`${profLevel !== 'none' ? 'text-parchment' : 'text-parchment/60'}`}>
                          {SKILL_NAMES[skill]}
                        </span>
                      </span>
                      <span className={`font-bold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatModifier(modifier)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-parchment/40 text-xs text-center py-2">
                No associated skills
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Saving Throws */}
      <div className="bg-dark-wood p-3 rounded border border-leather">
        <h4 className="text-gold font-bold text-sm mb-2">Saving Throws</h4>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ABILITY_NAMES) as (keyof AbilityScores)[]).map((ability) => {
            const isProficient = character.savingThrowProficiencies.includes(ability);
            const modifier = getAbilityMod(ability) + (isProficient ? getProficiencyBonus() : 0);

            return (
              <button
                key={ability}
                onClick={() => {
                  // Roll saving throw
                  let roll1 = Math.floor(Math.random() * 20) + 1;
                  let roll2 = advantageState !== 'normal' ? Math.floor(Math.random() * 20) + 1 : roll1;

                  let finalRoll: number;
                  const rolls = advantageState !== 'normal' ? [roll1, roll2] : [roll1];

                  if (advantageState === 'advantage') {
                    finalRoll = Math.max(roll1, roll2);
                  } else if (advantageState === 'disadvantage') {
                    finalRoll = Math.min(roll1, roll2);
                  } else {
                    finalRoll = roll1;
                  }

                  setLastRoll({
                    skill: `${ABILITY_NAMES[ability]} Save`,
                    rolls,
                    modifier,
                    total: finalRoll + modifier,
                  });

                  onRoll(`${ABILITY_NAMES[ability]} Save`, modifier, advantageState);
                }}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-leather/30 ${
                  isProficient ? 'bg-leather/20' : ''
                }`}
              >
                <span className="flex items-center gap-1">
                  {isProficient && <span className="text-blue-400">●</span>}
                  <span className="text-parchment">{ABILITY_NAMES[ability]}</span>
                </span>
                <span className={`font-bold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatModifier(modifier)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
