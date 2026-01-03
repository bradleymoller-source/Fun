import { useState } from 'react';
import type { Character, AbilityScores, Feature } from '../../types';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import {
  CLASS_HIT_DICE,
  CLASS_NAMES,
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getFeaturesAtLevel,
  isASILevel,
  SPELL_SLOTS_BY_LEVEL,
  HALF_CASTER_SPELL_SLOTS,
  WARLOCK_SPELL_SLOTS,
} from '../../data/dndData';

interface LevelUpWizardProps {
  character: Character;
  onComplete: (updatedCharacter: Character) => void;
  onCancel: () => void;
}

type LevelUpStep = 'overview' | 'hp' | 'asi' | 'features' | 'spells' | 'review';

export function LevelUpWizard({ character, onComplete, onCancel }: LevelUpWizardProps) {
  const newLevel = character.level + 1;
  const hitDie = CLASS_HIT_DICE[character.characterClass];
  const conMod = getAbilityModifier(character.abilityScores.constitution);

  // HP options
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average');
  const [rolledHp, setRolledHp] = useState<number | null>(null);

  // ASI options
  const hasASI = isASILevel(character.characterClass, newLevel);
  const [asiMethod, setAsiMethod] = useState<'+2' | '+1/+1'>( '+2');
  const [asiAbility1, setAsiAbility1] = useState<keyof AbilityScores | null>(null);
  const [asiAbility2, setAsiAbility2] = useState<keyof AbilityScores | null>(null);

  // Step tracking
  const [step, setStep] = useState<LevelUpStep>('overview');

  // Get new features at this level
  const newFeatures = getFeaturesAtLevel(character.characterClass, newLevel)
    .filter(f => f.name !== 'Ability Score Improvement'); // ASI is handled separately

  // Calculate HP gain
  const getHpGain = (): number => {
    let baseGain: number;
    if (hpMethod === 'average') {
      // Average is (die size / 2) + 1 (rounded up)
      baseGain = Math.ceil(hitDie / 2) + 1 + conMod;
    } else if (rolledHp !== null) {
      baseGain = Math.max(1, rolledHp + conMod);
    } else {
      return 0;
    }

    // Tough feat: +2 HP per level
    const hasTough = character.features.some(f => f.name === 'Tough');
    if (hasTough) {
      baseGain += 2;
    }

    // Dwarven Toughness (Hill Dwarf): +1 HP per level
    const hasDwarvenToughness = character.species === 'dwarf' &&
      character.features.some(f => f.name === 'Dwarven Toughness');
    if (hasDwarvenToughness) {
      baseGain += 1;
    }

    return baseGain;
  };

  const rollHp = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledHp(roll);
  };

  // Check if spellcasting class
  const isFullCaster = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(character.characterClass);
  const isHalfCaster = ['paladin', 'ranger'].includes(character.characterClass);
  const isWarlock = character.characterClass === 'warlock';
  const isSpellcaster = isFullCaster || isHalfCaster || isWarlock;

  // Get spell slots for comparison
  const getCurrentSpellSlots = () => {
    if (isFullCaster) return SPELL_SLOTS_BY_LEVEL[character.level] || [];
    if (isHalfCaster) return HALF_CASTER_SPELL_SLOTS[character.level] || [];
    return [];
  };

  const getNewSpellSlots = () => {
    if (isFullCaster) return SPELL_SLOTS_BY_LEVEL[newLevel] || [];
    if (isHalfCaster) return HALF_CASTER_SPELL_SLOTS[newLevel] || [];
    return [];
  };

  const getWarlockSlots = () => {
    if (!isWarlock) return null;
    return {
      current: WARLOCK_SPELL_SLOTS[character.level],
      new: WARLOCK_SPELL_SLOTS[newLevel],
    };
  };

  // Determine which steps to show
  const getSteps = (): LevelUpStep[] => {
    const steps: LevelUpStep[] = ['overview', 'hp'];
    if (hasASI) steps.push('asi');
    if (newFeatures.length > 0) steps.push('features');
    if (isSpellcaster) steps.push('spells');
    steps.push('review');
    return steps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'hp':
        return hpMethod === 'average' || rolledHp !== null;
      case 'asi':
        if (asiMethod === '+2') {
          return asiAbility1 !== null;
        } else {
          return asiAbility1 !== null && asiAbility2 !== null && asiAbility1 !== asiAbility2;
        }
      default:
        return true;
    }
  };

  const applyLevelUp = () => {
    const hpGain = getHpGain();

    // Calculate new ability scores if ASI was taken
    const newAbilityScores = { ...character.abilityScores };
    if (hasASI) {
      if (asiMethod === '+2' && asiAbility1) {
        newAbilityScores[asiAbility1] = Math.min(20, newAbilityScores[asiAbility1] + 2);
      } else if (asiMethod === '+1/+1' && asiAbility1 && asiAbility2) {
        newAbilityScores[asiAbility1] = Math.min(20, newAbilityScores[asiAbility1] + 1);
        newAbilityScores[asiAbility2] = Math.min(20, newAbilityScores[asiAbility2] + 1);
      }
    }

    // Add new features
    const updatedFeatures: Feature[] = [...character.features];
    newFeatures.forEach((feature, idx) => {
      updatedFeatures.push({
        id: `level${newLevel}-${idx}`,
        name: feature.name,
        source: `${CLASS_NAMES[character.characterClass]} Level ${newLevel}`,
        description: feature.description,
      });
    });

    // Recalculate derived stats
    const newConMod = getAbilityModifier(newAbilityScores.constitution);
    const conModDiff = newConMod - conMod;
    const retroactiveHpGain = conModDiff * newLevel; // Retroactive HP from CON increase

    const newDexMod = getAbilityModifier(newAbilityScores.dexterity);

    const updatedCharacter: Character = {
      ...character,
      level: newLevel,
      abilityScores: newAbilityScores,
      maxHitPoints: character.maxHitPoints + hpGain + retroactiveHpGain,
      currentHitPoints: character.currentHitPoints + hpGain + retroactiveHpGain,
      hitDiceTotal: newLevel,
      hitDiceRemaining: character.hitDiceRemaining + 1,
      initiative: newDexMod,
      features: updatedFeatures,
      experiencePoints: character.experiencePoints, // Keep same XP
      updatedAt: new Date().toISOString(),
    };

    onComplete(updatedCharacter);
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-medieval text-2xl text-gold mb-2">Level Up!</h3>
        <p className="text-parchment text-lg">
          {character.name} is advancing to <span className="text-gold font-bold">Level {newLevel}</span>
        </p>
      </div>

      <div className="bg-dark-wood p-4 rounded border border-leather">
        <h4 className="text-gold font-semibold mb-2">What's Coming:</h4>
        <ul className="space-y-2 text-parchment">
          <li className="flex items-center gap-2">
            <span className="text-green-400">+</span>
            Hit Points (d{hitDie} + {conMod >= 0 ? '+' : ''}{conMod} CON)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">+</span>
            1 Hit Die (now {newLevel}d{hitDie})
          </li>
          {hasASI && (
            <li className="flex items-center gap-2">
              <span className="text-gold">★</span>
              Ability Score Improvement (+2 to one or +1 to two)
            </li>
          )}
          {newFeatures.map(f => (
            <li key={f.name} className="flex items-center gap-2">
              <span className="text-blue-400">◆</span>
              {f.name}
            </li>
          ))}
          {getProficiencyBonus(newLevel) > getProficiencyBonus(character.level) && (
            <li className="flex items-center gap-2">
              <span className="text-purple-400">↑</span>
              Proficiency Bonus increases to +{getProficiencyBonus(newLevel)}
            </li>
          )}
          {isSpellcaster && (
            <li className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span>
              Spell slot progression
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderHpStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">Hit Point Increase</h3>

      <p className="text-parchment/70 text-sm">
        Choose how to determine your HP increase. Your hit die is d{hitDie} and your
        Constitution modifier is {formatModifier(conMod)}.
      </p>

      <div className="flex gap-2 mb-4">
        <Button
          variant={hpMethod === 'average' ? 'primary' : 'secondary'}
          onClick={() => {
            setHpMethod('average');
            setRolledHp(null);
          }}
        >
          Average ({Math.ceil(hitDie / 2) + 1})
        </Button>
        <Button
          variant={hpMethod === 'roll' ? 'primary' : 'secondary'}
          onClick={() => setHpMethod('roll')}
        >
          Roll
        </Button>
      </div>

      {hpMethod === 'average' ? (
        <div className="bg-dark-wood p-4 rounded border border-gold/50 text-center">
          <div className="text-parchment/70 text-sm mb-1">HP Gained</div>
          <div className="text-gold text-4xl font-bold">+{getHpGain()}</div>
          <div className="text-parchment/50 text-xs mt-1">
            ({Math.ceil(hitDie / 2) + 1} average + {conMod} CON)
          </div>
        </div>
      ) : (
        <div className="bg-dark-wood p-4 rounded border border-leather">
          <div className="flex items-center justify-center gap-4">
            <Button onClick={rollHp} variant="primary">
              Roll d{hitDie}
            </Button>
            {rolledHp !== null && (
              <div className="text-center">
                <div className="text-parchment/70 text-xs">Rolled</div>
                <div className="text-gold text-3xl font-bold">{rolledHp}</div>
              </div>
            )}
          </div>
          {rolledHp !== null && (
            <div className="text-center mt-4">
              <div className="text-parchment/70 text-sm">Total HP Gained</div>
              <div className="text-gold text-4xl font-bold">+{getHpGain()}</div>
              <div className="text-parchment/50 text-xs">
                ({rolledHp} roll + {conMod} CON = {Math.max(1, rolledHp + conMod)})
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-parchment/70 text-sm">
        New Max HP: {character.maxHitPoints} → <span className="text-gold font-bold">{character.maxHitPoints + getHpGain()}</span>
      </div>
    </div>
  );

  const renderAsiStep = () => {
    const abilities = Object.keys(character.abilityScores) as (keyof AbilityScores)[];

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Ability Score Improvement</h3>

        <p className="text-parchment/70 text-sm">
          Choose to increase one ability by 2, or two abilities by 1 each. Maximum score is 20.
        </p>

        <div className="flex gap-2 mb-4">
          <Button
            variant={asiMethod === '+2' ? 'primary' : 'secondary'}
            onClick={() => {
              setAsiMethod('+2');
              setAsiAbility2(null);
            }}
          >
            +2 to One
          </Button>
          <Button
            variant={asiMethod === '+1/+1' ? 'primary' : 'secondary'}
            onClick={() => setAsiMethod('+1/+1')}
          >
            +1 to Two
          </Button>
        </div>

        {asiMethod === '+2' ? (
          <div>
            <label className="text-parchment text-sm mb-2 block">Choose ability for +2:</label>
            <div className="grid grid-cols-3 gap-2">
              {abilities.map(ability => {
                const currentScore = character.abilityScores[ability];
                const atMax = currentScore >= 20;
                const wouldExceed = currentScore >= 19;

                return (
                  <button
                    key={ability}
                    onClick={() => !atMax && setAsiAbility1(ability)}
                    disabled={atMax}
                    className={`p-3 rounded border transition-colors ${
                      asiAbility1 === ability
                        ? 'bg-gold text-dark-wood border-gold font-bold'
                        : atMax
                        ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                        : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                    }`}
                  >
                    <div className="text-sm">{ABILITY_ABBREVIATIONS[ability]}</div>
                    <div className="text-lg font-bold">{currentScore}</div>
                    {asiAbility1 === ability && (
                      <div className="text-xs text-green-600">
                        → {Math.min(20, currentScore + 2)}
                        {wouldExceed && ' (capped)'}
                      </div>
                    )}
                    {atMax && <div className="text-xs">(max)</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-parchment text-sm mb-2 block">First +1:</label>
              <div className="grid grid-cols-3 gap-2">
                {abilities.map(ability => {
                  const currentScore = character.abilityScores[ability];
                  const atMax = currentScore >= 20;

                  return (
                    <button
                      key={ability}
                      onClick={() => {
                        if (!atMax) {
                          setAsiAbility1(ability);
                          if (asiAbility2 === ability) setAsiAbility2(null);
                        }
                      }}
                      disabled={atMax}
                      className={`p-2 rounded border transition-colors ${
                        asiAbility1 === ability
                          ? 'bg-gold text-dark-wood border-gold font-bold'
                          : atMax
                          ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                          : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                      }`}
                    >
                      <div className="text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                      <div className="font-bold">{currentScore}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-parchment text-sm mb-2 block">Second +1:</label>
              <div className="grid grid-cols-3 gap-2">
                {abilities.map(ability => {
                  const currentScore = character.abilityScores[ability];
                  const atMax = currentScore >= 20;
                  const isSameAsFirst = ability === asiAbility1;

                  return (
                    <button
                      key={ability}
                      onClick={() => !atMax && !isSameAsFirst && setAsiAbility2(ability)}
                      disabled={atMax || isSameAsFirst}
                      className={`p-2 rounded border transition-colors ${
                        asiAbility2 === ability
                          ? 'bg-gold text-dark-wood border-gold font-bold'
                          : atMax || isSameAsFirst
                          ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                          : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                      }`}
                    >
                      <div className="text-xs">{ABILITY_ABBREVIATIONS[ability]}</div>
                      <div className="font-bold">{currentScore}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {(asiAbility1 || asiAbility2) && (
          <div className="bg-dark-wood p-3 rounded border border-gold/50">
            <div className="text-gold text-sm mb-2">Changes:</div>
            <div className="flex flex-wrap gap-2">
              {asiAbility1 && (
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                  {ABILITY_NAMES[asiAbility1]}: {character.abilityScores[asiAbility1]} → {Math.min(20, character.abilityScores[asiAbility1] + (asiMethod === '+2' ? 2 : 1))}
                </span>
              )}
              {asiMethod === '+1/+1' && asiAbility2 && (
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                  {ABILITY_NAMES[asiAbility2]}: {character.abilityScores[asiAbility2]} → {Math.min(20, character.abilityScores[asiAbility2] + 1)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeaturesStep = () => (
    <div className="space-y-4">
      <h3 className="font-medieval text-lg text-gold">New Class Features</h3>

      <p className="text-parchment/70 text-sm">
        At level {newLevel}, you gain the following {CLASS_NAMES[character.characterClass]} features:
      </p>

      <div className="space-y-3">
        {newFeatures.map(feature => (
          <div key={feature.name} className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-gold font-semibold mb-1">{feature.name}</h4>
            <p className="text-parchment text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpellsStep = () => {
    const currentSlots = getCurrentSpellSlots();
    const newSlots = getNewSpellSlots();
    const warlockSlots = getWarlockSlots();

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Spellcasting Progression</h3>

        {isWarlock && warlockSlots ? (
          <div className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-parchment font-semibold mb-2">Pact Magic Slots</h4>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-parchment/70 text-xs">Current</div>
                <div className="text-gold text-xl font-bold">
                  {warlockSlots.current.slots} × Level {warlockSlots.current.level}
                </div>
              </div>
              <span className="text-gold text-2xl">→</span>
              <div className="text-center">
                <div className="text-parchment/70 text-xs">New</div>
                <div className="text-green-400 text-xl font-bold">
                  {warlockSlots.new.slots} × Level {warlockSlots.new.level}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-dark-wood p-4 rounded border border-leather">
            <h4 className="text-parchment font-semibold mb-2">Spell Slots</h4>
            <div className="grid grid-cols-9 gap-1 text-center text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                const current = currentSlots[level - 1] || 0;
                const next = newSlots[level - 1] || 0;
                const changed = next !== current;

                return (
                  <div key={level} className={`p-2 rounded ${changed ? 'bg-gold/20' : 'bg-leather/30'}`}>
                    <div className="text-parchment/70">{level}st</div>
                    <div className={changed ? 'text-green-400 font-bold' : 'text-parchment'}>
                      {current} → {next}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-parchment/70 text-sm">
          Remember to update your prepared/known spells as appropriate for your level.
        </p>
      </div>
    );
  };

  const renderReview = () => {
    const hpGain = getHpGain();

    return (
      <div className="space-y-4">
        <h3 className="font-medieval text-lg text-gold">Review Changes</h3>

        <div className="bg-dark-wood p-4 rounded border border-gold/50 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-parchment">Level</span>
            <span className="text-gold font-bold">{character.level} → {newLevel}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-parchment">Max HP</span>
            <span className="text-gold font-bold">{character.maxHitPoints} → {character.maxHitPoints + hpGain}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-parchment">Hit Dice</span>
            <span className="text-gold font-bold">{character.level}d{hitDie} → {newLevel}d{hitDie}</span>
          </div>

          {getProficiencyBonus(newLevel) > getProficiencyBonus(character.level) && (
            <div className="flex justify-between items-center">
              <span className="text-parchment">Proficiency Bonus</span>
              <span className="text-gold font-bold">+{getProficiencyBonus(character.level)} → +{getProficiencyBonus(newLevel)}</span>
            </div>
          )}

          {hasASI && asiAbility1 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">Ability Score Improvement:</div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                  {ABILITY_NAMES[asiAbility1]}: +{asiMethod === '+2' ? 2 : 1}
                </span>
                {asiMethod === '+1/+1' && asiAbility2 && (
                  <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm">
                    {ABILITY_NAMES[asiAbility2]}: +1
                  </span>
                )}
              </div>
            </div>
          )}

          {newFeatures.length > 0 && (
            <div className="border-t border-leather pt-2 mt-2">
              <div className="text-parchment text-sm mb-1">New Features:</div>
              <div className="flex flex-wrap gap-1">
                {newFeatures.map(f => (
                  <span key={f.name} className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded text-xs">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button onClick={applyLevelUp} variant="primary" size="lg">
            Confirm Level Up
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'overview': return renderOverview();
      case 'hp': return renderHpStep();
      case 'asi': return renderAsiStep();
      case 'features': return renderFeaturesStep();
      case 'spells': return renderSpellsStep();
      case 'review': return renderReview();
      default: return null;
    }
  };

  return (
    <Panel className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medieval text-xl text-gold">
          {CLASS_NAMES[character.characterClass]} Level {newLevel}
        </h2>
        <button onClick={onCancel} className="text-parchment/50 hover:text-parchment">✕</button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-1 mb-6">
        {steps.map((s, idx) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              idx < currentStepIndex
                ? 'bg-gold'
                : idx === currentStepIndex
                ? 'bg-gold ring-2 ring-gold/50'
                : 'bg-leather'
            }`}
          />
        ))}
      </div>

      {renderCurrentStep()}

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-leather">
        <Button
          variant="secondary"
          onClick={currentStepIndex === 0 ? onCancel : prevStep}
        >
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step !== 'review' && (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Next
          </Button>
        )}
      </div>
    </Panel>
  );
}
