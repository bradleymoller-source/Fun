import { useState } from 'react';
import type { Character, CharacterClass, AbilityScores, SkillName, Condition } from '../../types';
import {
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  SKILL_NAMES,
  SKILL_ABILITIES,
  CLASS_NAMES,
  SPECIES_NAMES,
  CLASS_HIT_DICE,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSkillModifier,
  SPELL_SLOTS_BY_LEVEL,
} from '../../data/dndData';

type SheetTab = 'stats' | 'skills' | 'combat' | 'equipment' | 'spells' | 'bio';

// All D&D conditions
const ALL_CONDITIONS: Condition[] = [
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious', 'exhausted', 'concentrating'
];

interface CharacterSheetProps {
  character: Character;
  onUpdate?: (updates: Partial<Character>) => void;
  onRoll?: (notation: string, label: string) => void;
  isEditable?: boolean;
}

export function CharacterSheet({ character, onUpdate, onRoll, isEditable = true }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>('stats');
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const profBonus = getProficiencyBonus(character.level);
  const hitDie = CLASS_HIT_DICE[character.characterClass];
  const conditions = character.conditions || [];
  const exhaustionLevel = character.exhaustionLevel || 0;

  // Get spell slots for this character's class and level
  const getSpellSlots = (): number[] => {
    if (character.spellcasting?.spellSlots) {
      return character.spellcasting.spellSlots;
    }
    // Use simple spell slot calculation based on level for spellcasting classes
    const fullCasters: CharacterClass[] = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
    if (fullCasters.includes(character.characterClass)) {
      return SPELL_SLOTS_BY_LEVEL[character.level] || [];
    }
    return [];
  };

  const spellSlots = getSpellSlots();
  const spellSlotsUsed = character.spellSlotsUsed || character.spellcasting?.spellSlotsUsed || new Array(9).fill(0);

  const handleHpChange = (delta: number) => {
    if (!onUpdate) return;
    const newHp = Math.max(0, Math.min(character.maxHitPoints, character.currentHitPoints + delta));
    onUpdate({ currentHitPoints: newHp });
  };

  const handleTempHpChange = (value: number) => {
    if (!onUpdate) return;
    onUpdate({ temporaryHitPoints: Math.max(0, value) });
  };

  const handleDeathSaveChange = (type: 'successes' | 'failures', delta: number) => {
    if (!onUpdate) return;
    const current = character.deathSaves[type];
    const newValue = Math.max(0, Math.min(3, current + delta));
    onUpdate({
      deathSaves: {
        ...character.deathSaves,
        [type]: newValue,
      },
    });
  };

  const handleToggleInspiration = () => {
    if (!onUpdate) return;
    onUpdate({ inspiration: !character.inspiration });
  };

  const handleToggleCondition = (condition: Condition) => {
    if (!onUpdate) return;
    const currentConditions = character.conditions || [];
    if (currentConditions.includes(condition)) {
      onUpdate({ conditions: currentConditions.filter(c => c !== condition) });
    } else {
      onUpdate({ conditions: [...currentConditions, condition] });
    }
  };

  const handleExhaustionChange = (delta: number) => {
    if (!onUpdate) return;
    const newLevel = Math.max(0, Math.min(6, exhaustionLevel + delta));
    onUpdate({ exhaustionLevel: newLevel });
  };

  const handleSpellSlotToggle = (level: number) => {
    if (!onUpdate) return;
    const newSlotsUsed = [...spellSlotsUsed];
    const maxSlots = spellSlots[level] || 0;
    const currentUsed = newSlotsUsed[level] || 0;

    // Toggle: if all used, reset to 0; otherwise use one more
    if (currentUsed >= maxSlots) {
      newSlotsUsed[level] = 0;
    } else {
      newSlotsUsed[level] = currentUsed + 1;
    }

    onUpdate({ spellSlotsUsed: newSlotsUsed });
  };

  const handleRollAbility = (ability: keyof AbilityScores) => {
    if (!onRoll) return;
    const modifier = getAbilityModifier(character.abilityScores[ability]);
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = modifier + exhaustionPenalty;
    onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, `${ABILITY_NAMES[ability]} Check`);
  };

  const handleRollSave = (ability: keyof AbilityScores) => {
    if (!onRoll) return;
    const modifier = getAbilityModifier(character.abilityScores[ability]);
    const isProficient = character.savingThrowProficiencies.includes(ability);
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = modifier + (isProficient ? profBonus : 0) + exhaustionPenalty;
    onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, `${ABILITY_NAMES[ability]} Save`);
  };

  const handleRollSkill = (skill: SkillName) => {
    if (!onRoll) return;
    const profLevel = character.skillProficiencies[skill];
    const modifier = getSkillModifier(
      character.abilityScores[SKILL_ABILITIES[skill]],
      profLevel,
      profBonus
    );
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = modifier + exhaustionPenalty;
    onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, `${SKILL_NAMES[skill]}`);
  };

  const handleRollInitiative = () => {
    if (!onRoll) return;
    const dexMod = getAbilityModifier(character.abilityScores.dexterity);
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = dexMod + exhaustionPenalty;
    onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, 'Initiative');
  };

  const handleRollAttack = (weaponName: string, attackBonus: number) => {
    if (!onRoll) return;
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = attackBonus + exhaustionPenalty;
    onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, `${weaponName} Attack`);
  };

  const handleRollDamage = (weaponName: string, damage: string) => {
    if (!onRoll) return;
    onRoll(damage, `${weaponName} Damage`);
  };

  const handleShortRest = () => {
    if (!onUpdate) return;
    // Restore feature uses that restore on short rest
    const newFeatureUses = { ...character.featureUses };
    Object.keys(newFeatureUses || {}).forEach(key => {
      if (newFeatureUses[key]?.restoreOn === 'short') {
        newFeatureUses[key] = { ...newFeatureUses[key], used: 0 };
      }
    });
    onUpdate({ featureUses: newFeatureUses });
  };

  const handleLongRest = () => {
    if (!onUpdate) return;
    // Restore HP, hit dice, spell slots, and all feature uses
    const halfHitDice = Math.max(1, Math.floor(character.level / 2));
    const restoredHitDice = Math.min(character.level, character.hitDiceRemaining + halfHitDice);

    const newFeatureUses = { ...character.featureUses };
    Object.keys(newFeatureUses || {}).forEach(key => {
      newFeatureUses[key] = { ...newFeatureUses[key], used: 0 };
    });

    onUpdate({
      currentHitPoints: character.maxHitPoints,
      hitDiceRemaining: restoredHitDice,
      spellSlotsUsed: new Array(9).fill(0),
      featureUses: newFeatureUses,
      exhaustionLevel: Math.max(0, exhaustionLevel - 1), // Reduce exhaustion by 1
    });
  };

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'combat', label: 'Combat' },
    { id: 'equipment', label: 'Gear' },
    { id: 'spells', label: 'Spells' },
    { id: 'bio', label: 'Bio' },
  ];

  const renderHeader = () => (
    <div className="text-center border-b border-leather pb-4 mb-4">
      <div className="flex justify-center items-center gap-2 mb-1">
        {/* Inspiration */}
        {isEditable && (
          <button
            onClick={handleToggleInspiration}
            className={`w-6 h-6 rounded-full border-2 transition-colors ${
              character.inspiration
                ? 'bg-gold border-gold text-dark-wood'
                : 'border-parchment/50 text-parchment/50 hover:border-gold'
            }`}
            title={character.inspiration ? 'Has Inspiration' : 'No Inspiration'}
          >
            ★
          </button>
        )}
        <h2 className="font-medieval text-2xl text-gold">{character.name}</h2>
      </div>
      <p className="text-parchment">
        Level {character.level} {SPECIES_NAMES[character.species]} {CLASS_NAMES[character.characterClass]}
      </p>
      {character.subclass && (
        <p className="text-gold/70 text-sm">{character.subclass}</p>
      )}
      <p className="text-parchment/70 text-sm">
        {character.background} • {character.alignment || 'Unaligned'}
      </p>
    </div>
  );

  const renderConditions = () => (
    <div className="mb-4">
      {/* Active Conditions */}
      <div className="flex flex-wrap gap-1 mb-2">
        {conditions.map(condition => (
          <button
            key={condition}
            onClick={() => isEditable && handleToggleCondition(condition)}
            className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-300 border border-red-500 hover:bg-red-900/70"
            title={`Remove ${condition}`}
          >
            {condition} ✕
          </button>
        ))}
        {exhaustionLevel > 0 && (
          <span className="px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300 border border-purple-500">
            Exhaustion {exhaustionLevel} (−{exhaustionLevel * 2} to d20s)
          </span>
        )}
        {character.concentratingOn && (
          <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300 border border-blue-500">
            Concentrating: {character.concentratingOn}
          </span>
        )}
      </div>

      {/* Add Condition Button */}
      {isEditable && (
        <div className="relative">
          <button
            onClick={() => setShowConditionPicker(!showConditionPicker)}
            className="text-xs text-parchment/50 hover:text-gold"
          >
            + Add Condition
          </button>
          {showConditionPicker && (
            <div className="absolute z-10 mt-1 bg-dark-wood border border-leather rounded p-2 shadow-lg max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1">
                {ALL_CONDITIONS.filter(c => !conditions.includes(c)).map(condition => (
                  <button
                    key={condition}
                    onClick={() => {
                      handleToggleCondition(condition);
                      setShowConditionPicker(false);
                    }}
                    className="text-xs text-parchment hover:text-gold hover:bg-leather px-2 py-1 rounded text-left capitalize"
                  >
                    {condition}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-leather">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-parchment/70">Exhaustion:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExhaustionChange(-1)}
                      disabled={exhaustionLevel <= 0}
                      className="w-5 h-5 text-xs bg-leather rounded disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="text-xs text-gold w-4 text-center">{exhaustionLevel}</span>
                    <button
                      onClick={() => handleExhaustionChange(1)}
                      disabled={exhaustionLevel >= 6}
                      className="w-5 h-5 text-xs bg-leather rounded disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderQuickStats = () => (
    <div className="grid grid-cols-4 gap-2 mb-4">
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">{character.armorClass}</div>
        <div className="text-parchment/70 text-xs">AC</div>
      </div>
      <button
        onClick={handleRollInitiative}
        disabled={!onRoll}
        className="bg-dark-wood p-2 rounded border border-leather text-center hover:border-gold transition-colors disabled:hover:border-leather"
      >
        <div className="text-gold font-bold text-xl">
          {formatModifier(character.initiative)}
        </div>
        <div className="text-parchment/70 text-xs">Initiative</div>
      </button>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">{character.speed} ft</div>
        <div className="text-parchment/70 text-xs">Speed</div>
      </div>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">+{profBonus}</div>
        <div className="text-parchment/70 text-xs">Prof</div>
      </div>
    </div>
  );

  const renderHitPoints = () => (
    <div className="bg-dark-wood p-3 rounded border border-leather mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-parchment text-sm">Hit Points</span>
        <span className="text-parchment/70 text-xs">
          {character.hitDiceRemaining}d{hitDie} remaining
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {isEditable && (
          <button
            onClick={() => handleHpChange(-1)}
            className="w-8 h-8 bg-red-600 rounded text-white font-bold hover:bg-red-500"
          >
            -
          </button>
        )}
        <div className="flex-1 text-center">
          <span className="text-gold font-bold text-2xl">{character.currentHitPoints}</span>
          <span className="text-parchment/70"> / {character.maxHitPoints}</span>
        </div>
        {isEditable && (
          <button
            onClick={() => handleHpChange(1)}
            className="w-8 h-8 bg-green-600 rounded text-white font-bold hover:bg-green-500"
          >
            +
          </button>
        )}
      </div>

      {/* Temp HP */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-blue-400 text-xs">Temp HP:</span>
        {isEditable ? (
          <input
            type="number"
            value={character.temporaryHitPoints}
            onChange={(e) => handleTempHpChange(parseInt(e.target.value) || 0)}
            className="w-12 bg-blue-900/30 text-blue-400 text-center rounded px-1 py-0.5 text-sm border border-blue-500/50"
            min="0"
          />
        ) : (
          <span className="text-blue-400">{character.temporaryHitPoints}</span>
        )}
      </div>

      {/* HP Bar */}
      <div className="h-2 bg-leather rounded overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(character.currentHitPoints / character.maxHitPoints) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderDeathSaves = () => (
    <div className="bg-red-900/30 p-3 rounded border border-red-500 mb-4">
      <div className="text-red-300 font-semibold mb-2 text-center">Death Saving Throws</div>
      <div className="flex justify-around">
        <div className="text-center">
          <div className="text-green-400 text-xs mb-1">Successes</div>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <button
                key={i}
                onClick={() => isEditable && handleDeathSaveChange('successes', i <= character.deathSaves.successes ? -1 : 1)}
                disabled={!isEditable}
                className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  i <= character.deathSaves.successes
                    ? 'bg-green-500 border-green-400'
                    : 'border-green-500/50 hover:border-green-400'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-red-400 text-xs mb-1">Failures</div>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <button
                key={i}
                onClick={() => isEditable && handleDeathSaveChange('failures', i <= character.deathSaves.failures ? -1 : 1)}
                disabled={!isEditable}
                className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  i <= character.deathSaves.failures
                    ? 'bg-red-500 border-red-400'
                    : 'border-red-500/50 hover:border-red-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      {character.deathSaves.successes >= 3 && (
        <div className="text-green-400 text-center mt-2 text-sm">Stabilized!</div>
      )}
      {character.deathSaves.failures >= 3 && (
        <div className="text-red-400 text-center mt-2 text-sm">Dead</div>
      )}
    </div>
  );

  const renderRestButtons = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={handleShortRest}
        disabled={!isEditable}
        className="flex-1 py-1 text-xs bg-amber-900/50 text-amber-300 rounded border border-amber-500/50 hover:bg-amber-900/70 disabled:opacity-50"
      >
        Short Rest
      </button>
      <button
        onClick={handleLongRest}
        disabled={!isEditable}
        className="flex-1 py-1 text-xs bg-blue-900/50 text-blue-300 rounded border border-blue-500/50 hover:bg-blue-900/70 disabled:opacity-50"
      >
        Long Rest
      </button>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-4">
      {renderConditions()}
      {renderQuickStats()}
      {renderHitPoints()}
      {character.currentHitPoints === 0 && renderDeathSaves()}
      {renderRestButtons()}

      {/* Ability Scores */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ABILITY_ABBREVIATIONS) as (keyof AbilityScores)[]).map(ability => {
          const score = character.abilityScores[ability];
          const modifier = getAbilityModifier(score);
          const isProficient = character.savingThrowProficiencies.includes(ability);
          const saveMod = modifier + (isProficient ? profBonus : 0);

          return (
            <div key={ability} className="bg-dark-wood p-3 rounded border border-leather text-center">
              <div className="text-parchment/70 text-xs mb-1">{ABILITY_NAMES[ability]}</div>
              <button
                onClick={() => handleRollAbility(ability)}
                disabled={!onRoll}
                className="text-gold font-bold text-2xl hover:text-yellow-300 disabled:hover:text-gold"
                title={`Roll ${ABILITY_NAMES[ability]} check`}
              >
                {score}
              </button>
              <div className="text-parchment font-bold">{formatModifier(modifier)}</div>
              <div className="mt-2 pt-2 border-t border-leather">
                <button
                  onClick={() => handleRollSave(ability)}
                  disabled={!onRoll}
                  className={`text-xs hover:underline ${isProficient ? 'text-gold' : 'text-parchment/50'}`}
                  title={`Roll ${ABILITY_NAMES[ability]} save`}
                >
                  Save: {formatModifier(saveMod)} {isProficient && '●'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSkillsTab = () => {
    const skillsByAbility: Record<keyof AbilityScores, SkillName[]> = {
      strength: ['athletics'],
      dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
      constitution: [],
      intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
      wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
      charisma: ['deception', 'intimidation', 'performance', 'persuasion'],
    };

    return (
      <div className="space-y-4">
        <div className="bg-dark-wood p-2 rounded border border-leather text-center">
          <span className="text-parchment/70 text-sm">Passive Perception: </span>
          <span className="text-gold font-bold">
            {10 + getSkillModifier(
              character.abilityScores.wisdom,
              character.skillProficiencies.perception,
              profBonus
            )}
          </span>
        </div>

        {(Object.keys(skillsByAbility) as (keyof AbilityScores)[]).map(ability => {
          const skills = skillsByAbility[ability];
          if (skills.length === 0) return null;

          return (
            <div key={ability}>
              <h4 className="text-gold text-sm font-semibold mb-2">
                {ABILITY_NAMES[ability]}
              </h4>
              <div className="space-y-1">
                {skills.map(skill => {
                  const profLevel = character.skillProficiencies[skill];
                  const modifier = getSkillModifier(
                    character.abilityScores[SKILL_ABILITIES[skill]],
                    profLevel,
                    profBonus
                  );

                  return (
                    <button
                      key={skill}
                      onClick={() => handleRollSkill(skill)}
                      disabled={!onRoll}
                      className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                        profLevel !== 'none'
                          ? 'bg-gold/10 border border-gold/30 hover:bg-gold/20'
                          : 'bg-dark-wood border border-leather hover:border-gold/50'
                      } disabled:hover:bg-dark-wood disabled:hover:border-leather`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={profLevel !== 'none' ? 'text-gold' : 'text-parchment/50'}>
                          {profLevel === 'expertise' ? '◆' : profLevel === 'proficient' ? '●' : '○'}
                        </span>
                        <span className={profLevel !== 'none' ? 'text-gold' : 'text-parchment'}>
                          {SKILL_NAMES[skill]}
                        </span>
                      </div>
                      <span className={`font-bold ${profLevel !== 'none' ? 'text-gold' : 'text-parchment/70'}`}>
                        {formatModifier(modifier)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCombatTab = () => (
    <div className="space-y-4">
      {renderConditions()}
      {renderQuickStats()}
      {renderHitPoints()}

      {/* Weapons */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Weapons</h4>
        {character.weapons.length === 0 ? (
          <p className="text-parchment/50 text-sm">No weapons equipped</p>
        ) : (
          <div className="space-y-2">
            {character.weapons.map(weapon => (
              <div key={weapon.id} className="bg-dark-wood p-2 rounded border border-leather">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-parchment font-semibold">{weapon.name}</div>
                  <button
                    onClick={() => handleRollAttack(weapon.name, weapon.attackBonus)}
                    disabled={!onRoll}
                    className="text-gold font-bold hover:text-yellow-300 disabled:hover:text-gold"
                    title="Roll attack"
                  >
                    {formatModifier(weapon.attackBonus)} to hit
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-parchment/70 text-xs">
                    {weapon.properties?.join(', ')}
                  </div>
                  <button
                    onClick={() => handleRollDamage(weapon.name, weapon.damage)}
                    disabled={!onRoll}
                    className="text-red-400 text-sm hover:text-red-300 disabled:hover:text-red-400"
                    title="Roll damage"
                  >
                    {weapon.damage}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proficiencies */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Proficiencies</h4>
        <div className="bg-dark-wood p-3 rounded border border-leather space-y-2 text-sm">
          {character.armorProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Armor: </span>
              <span className="text-parchment">{character.armorProficiencies.join(', ')}</span>
            </div>
          )}
          {character.weaponProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Weapons: </span>
              <span className="text-parchment">{character.weaponProficiencies.join(', ')}</span>
            </div>
          )}
          {character.toolProficiencies.length > 0 && (
            <div>
              <span className="text-parchment/70">Tools: </span>
              <span className="text-parchment">{character.toolProficiencies.join(', ')}</span>
            </div>
          )}
          <div>
            <span className="text-parchment/70">Languages: </span>
            <span className="text-parchment">{character.languages.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="space-y-4">
      {/* Currency */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Currency</h4>
        <div className="grid grid-cols-5 gap-1 text-center">
          {(['copper', 'silver', 'electrum', 'gold', 'platinum'] as const).map(coin => (
            <div key={coin} className="bg-dark-wood p-2 rounded border border-leather">
              <div className="text-gold font-bold">{character.currency[coin]}</div>
              <div className="text-parchment/70 text-xs uppercase">{coin.slice(0, 2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Equipment</h4>
        {character.equipment.length === 0 ? (
          <p className="text-parchment/50 text-sm text-center py-4">
            No equipment yet
          </p>
        ) : (
          <div className="space-y-1">
            {character.equipment.map(item => (
              <div key={item.id} className="bg-dark-wood p-2 rounded border border-leather flex justify-between">
                <span className="text-parchment">{item.name}</span>
                {item.quantity > 1 && (
                  <span className="text-parchment/70">×{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSpellSlots = () => {
    const hasSlots = spellSlots.some(s => s > 0);
    if (!hasSlots) return null;

    return (
      <div className="mb-4">
        <h4 className="text-gold font-semibold mb-2">Spell Slots</h4>
        <div className="flex flex-wrap gap-2">
          {spellSlots.map((slots, idx) => {
            if (slots === 0) return null;
            const level = idx + 1;
            const used = spellSlotsUsed[idx] || 0;
            const remaining = slots - used;

            return (
              <div key={idx} className="bg-dark-wood p-2 rounded border border-leather text-center">
                <div className="text-parchment/70 text-xs mb-1">Level {level}</div>
                <div className="flex gap-0.5 justify-center">
                  {Array.from({ length: slots }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => isEditable && handleSpellSlotToggle(idx)}
                      disabled={!isEditable}
                      className={`w-4 h-4 rounded-full border transition-colors ${
                        i < remaining
                          ? 'bg-purple-500 border-purple-400'
                          : 'border-purple-500/50 hover:border-purple-400'
                      }`}
                      title={`${remaining}/${slots} slots remaining`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpellsTab = () => {
    // Check for simple cantrips/spells or full spellcasting
    const hasCantrips = character.cantrips && character.cantrips.length > 0;
    const hasSpells = character.spells && character.spells.length > 0;
    const hasSpellcasting = character.spellcasting;
    const hasSlots = spellSlots.some(s => s > 0);

    if (!hasCantrips && !hasSpells && !hasSpellcasting && !hasSlots) {
      return (
        <div className="text-center py-8">
          <p className="text-parchment/50">This character does not have spellcasting abilities.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Spellcasting Stats */}
        {hasSpellcasting && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-dark-wood p-2 rounded border border-leather">
              <div className="text-gold font-bold">{ABILITY_ABBREVIATIONS[character.spellcasting!.ability]}</div>
              <div className="text-parchment/70 text-xs">Ability</div>
            </div>
            <div className="bg-dark-wood p-2 rounded border border-leather">
              <div className="text-gold font-bold">{character.spellcasting!.spellSaveDC}</div>
              <div className="text-parchment/70 text-xs">Save DC</div>
            </div>
            <div className="bg-dark-wood p-2 rounded border border-leather">
              <div className="text-gold font-bold">{formatModifier(character.spellcasting!.spellAttackBonus)}</div>
              <div className="text-parchment/70 text-xs">Attack</div>
            </div>
          </div>
        )}

        {/* Spell Slots */}
        {renderSpellSlots()}

        {/* Cantrips (Simple list) */}
        {hasCantrips && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Cantrips</h4>
            <div className="flex flex-wrap gap-1">
              {character.cantrips!.map(cantrip => (
                <span key={cantrip} className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm border border-purple-500/50">
                  {cantrip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spells (Simple list) */}
        {hasSpells && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Spells Known</h4>
            <div className="flex flex-wrap gap-1">
              {character.spells!.map(spell => (
                <span key={spell} className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm border border-blue-500/50">
                  {spell}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Spell List (if spellcasting object exists) */}
        {hasSpellcasting && character.spellcasting!.spells.length > 0 && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Spell List</h4>
            <div className="space-y-1">
              {character.spellcasting!.spells
                .sort((a, b) => a.level - b.level)
                .map(spell => (
                  <div key={spell.id} className="bg-dark-wood p-2 rounded border border-leather">
                    <div className="flex justify-between items-center">
                      <span className="text-parchment">{spell.name}</span>
                      <span className="text-parchment/70 text-xs">
                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBioTab = () => (
    <div className="space-y-4">
      {/* Features */}
      <div>
        <h4 className="text-gold font-semibold mb-2">Features & Traits</h4>
        {character.features.length === 0 ? (
          <p className="text-parchment/50 text-sm">No features or traits</p>
        ) : (
          <div className="space-y-2">
            {character.features.map(feature => (
              <div key={feature.id} className="bg-dark-wood rounded border border-leather overflow-hidden">
                <button
                  onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                  className="w-full p-3 flex justify-between items-start text-left hover:bg-leather/30"
                >
                  <div>
                    <span className="text-gold font-semibold">{feature.name}</span>
                    <span className="text-parchment/50 text-xs ml-2">{feature.source}</span>
                  </div>
                  <span className="text-parchment/50">{expandedFeature === feature.id ? '▼' : '▶'}</span>
                </button>
                {expandedFeature === feature.id && (
                  <div className="px-3 pb-3 border-t border-leather">
                    <p className="text-parchment text-sm mt-2">{feature.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personality */}
      {character.personalityTraits && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Personality Traits</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
            {character.personalityTraits}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {character.ideals && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Ideals</h4>
            <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
              {character.ideals}
            </p>
          </div>
        )}
        {character.bonds && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Bonds</h4>
            <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
              {character.bonds}
            </p>
          </div>
        )}
      </div>

      {character.flaws && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Flaws</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather">
            {character.flaws}
          </p>
        </div>
      )}

      {character.backstory && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Backstory</h4>
          <p className="text-parchment text-sm bg-dark-wood p-3 rounded border border-leather whitespace-pre-wrap">
            {character.backstory}
          </p>
        </div>
      )}
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'stats': return renderStatsTab();
      case 'skills': return renderSkillsTab();
      case 'combat': return renderCombatTab();
      case 'equipment': return renderEquipmentTab();
      case 'spells': return renderSpellsTab();
      case 'bio': return renderBioTab();
    }
  };

  return (
    <div className="space-y-4">
      {renderHeader()}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-dark-wood p-1 rounded border border-leather">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[60px] px-2 py-1.5 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-gold text-dark-wood font-semibold'
                : 'text-parchment hover:bg-leather'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {renderCurrentTab()}
      </div>
    </div>
  );
}
