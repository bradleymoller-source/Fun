import { useState, useRef } from 'react';
import type { Character, CharacterClass, AbilityScores, SkillName, Condition } from '../../types';
import { LevelUpWizard } from './LevelUpWizard';
import {
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  SKILL_NAMES,
  SKILL_ABILITIES,
  CLASS_NAMES,
  SPECIES_NAMES,
  CLASS_HIT_DICE,
  CLASS_SUBCLASSES,
  CLASS_FEATURES,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSkillModifier,
  SPELL_SLOTS_BY_LEVEL,
  HALF_CASTER_SPELL_SLOTS,
  WARLOCK_SPELL_SLOTS,
  getSpellDetails,
  getCharacterResources,
  WEAPON_MASTERIES,
  WEAPON_MASTERY_DESCRIPTIONS,
  FIGHTING_STYLES,
} from '../../data/dndData';
import { Tooltip, RULE_TOOLTIPS } from '../ui/Tooltip';
import { Button } from '../ui/Button';

type SheetTab = 'stats' | 'skills' | 'combat' | 'equipment' | 'spells' | 'features' | 'bio';

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
  onRollInitiative?: (roll: number) => void;
  onImport?: (character: Character) => void;
  onDelete?: () => void;
  isEditable?: boolean;
  showExportImport?: boolean;
}

export function CharacterSheet({ character, onUpdate, onRoll, onRollInitiative, onImport, onDelete, isEditable = true, showExportImport = true }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>('stats');
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [usedItems, setUsedItems] = useState<Set<string>>(new Set());
  const [showLevelUpWizard, setShowLevelUpWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profBonus = getProficiencyBonus(character.level);
  const hitDie = CLASS_HIT_DICE[character.characterClass];
  const conditions = character.conditions || [];
  const exhaustionLevel = character.exhaustionLevel || 0;

  // Get spell slots for this character's class and level
  const getSpellSlots = (): number[] => {
    if (character.spellcasting?.spellSlots) {
      return character.spellcasting.spellSlots;
    }
    // Full casters
    const fullCasters: CharacterClass[] = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
    if (fullCasters.includes(character.characterClass)) {
      return SPELL_SLOTS_BY_LEVEL[character.level] || [];
    }
    // Half casters (paladin, ranger)
    const halfCasters: CharacterClass[] = ['paladin', 'ranger'];
    if (halfCasters.includes(character.characterClass)) {
      return HALF_CASTER_SPELL_SLOTS[character.level] || [];
    }
    // Warlock uses pact magic (different slot system)
    if (character.characterClass === 'warlock') {
      const warlockSlots = WARLOCK_SPELL_SLOTS[character.level];
      if (warlockSlots) {
        // Convert warlock pact magic to array format (slots at one level)
        const slots = new Array(9).fill(0);
        slots[warlockSlots.level - 1] = warlockSlots.slots;
        return slots;
      }
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

  // Handle class resource toggle (ki, rage, etc.)
  const handleResourceToggle = (resourceId: string, max: number) => {
    if (!onUpdate) return;
    const currentFeatureUses = character.featureUses || {};
    const currentUse = currentFeatureUses[resourceId] || { used: 0, max, restoreOn: 'long' as const };

    // Toggle: if all used, reset to 0; otherwise use one more
    const newUsed = currentUse.used >= max ? 0 : currentUse.used + 1;

    onUpdate({
      featureUses: {
        ...currentFeatureUses,
        [resourceId]: { ...currentUse, used: newUsed, max },
      },
    });
  };

  // Mark an item as used (grayed out, can then be deleted)
  const handleUseItem = (itemId: string) => {
    setUsedItems(prev => new Set([...prev, itemId]));
  };

  // Delete a used item from equipment
  const handleDeleteItem = (itemId: string) => {
    if (!onUpdate) return;
    const item = character.equipment.find(e => e.id === itemId);
    if (!item) return;

    // If quantity > 1, just decrease quantity
    if (item.quantity > 1) {
      const updatedEquipment = character.equipment.map(e =>
        e.id === itemId ? { ...e, quantity: e.quantity - 1 } : e
      );
      onUpdate({ equipment: updatedEquipment });
      // Keep item in used set if there are still items left
    } else {
      // Remove item entirely
      const updatedEquipment = character.equipment.filter(e => e.id !== itemId);
      onUpdate({ equipment: updatedEquipment });
      // Remove from used set
      setUsedItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
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
    const dexMod = getAbilityModifier(character.abilityScores.dexterity);
    const exhaustionPenalty = exhaustionLevel * -2;
    const totalMod = dexMod + exhaustionPenalty;

    // Roll the d20
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const totalRoll = d20Roll + totalMod;

    console.log('CharacterSheet handleRollInitiative: d20=' + d20Roll + ' mod=' + totalMod + ' total=' + totalRoll);

    // If we have an initiative callback, add to tracker
    if (onRollInitiative) {
      console.log('CharacterSheet: Calling onRollInitiative with', totalRoll);
      onRollInitiative(totalRoll);
    } else {
      console.log('CharacterSheet: No onRollInitiative callback provided');
    }

    // Also do a visual dice roll if available
    if (onRoll) {
      onRoll(`1d20${totalMod >= 0 ? '+' : ''}${totalMod}`, 'Initiative');
    }
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

  // Export character to JSON file
  const handleExport = () => {
    const exportData = {
      ...character,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_character.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import character from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);

        // Validate required fields
        if (!imported.name || !imported.species || !imported.characterClass) {
          setImportError('Invalid character file: missing required fields');
          return;
        }

        // Generate new ID and update metadata
        const newCharacter: Character = {
          ...imported,
          id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          playerId: character.playerId, // Keep current player ID
          updatedAt: new Date().toISOString(),
        };

        setImportError(null);
        onImport?.(newCharacter);
      } catch {
        setImportError('Failed to parse character file');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'combat', label: 'Combat' },
    { id: 'equipment', label: 'Gear' },
    { id: 'spells', label: 'Spells' },
    { id: 'features', label: 'Feats' },
    { id: 'bio', label: 'Bio' },
  ];

  const renderHeader = () => (
    <div className="border-b border-leather pb-4 mb-4">
      <div className="flex items-start gap-4">
        {/* Portrait */}
        {character.portrait && (
          <div className="w-16 h-16 rounded-lg border-2 border-gold/50 overflow-hidden flex-shrink-0">
            <img
              src={character.portrait}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-1">
            {/* Inspiration */}
            {isEditable && (
              <Tooltip content={RULE_TOOLTIPS.proficiencyBonus.replace('proficiency bonus', 'Inspiration point')}>
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
              </Tooltip>
            )}
            <h2 className="font-medieval text-2xl text-gold">{character.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-parchment">
              Level {character.level} {SPECIES_NAMES[character.species]} {CLASS_NAMES[character.characterClass]}
            </p>
            {isEditable && onUpdate && (
              <button
                onClick={() => setShowLevelUpWizard(true)}
                className="text-xs px-2 py-0.5 bg-gold/20 hover:bg-gold/40 text-gold rounded border border-gold/50 transition-colors"
                title="Level Up"
              >
                Level Up ↑
              </button>
            )}
          </div>
          {character.subclass && (
            <>
              <p className="text-gold/70 text-sm">{character.subclass}</p>
              {/* Display subclass choices */}
              {character.subclassChoices && Object.keys(character.subclassChoices).length > 0 && (
                <div className="text-xs text-parchment/60 mt-1">
                  {CLASS_SUBCLASSES[character.characterClass]?.find(sc => sc.name === character.subclass)?.choices?.map(choice => {
                    const selected = character.subclassChoices?.[choice.id] || [];
                    if (selected.length === 0) return null;
                    return (
                      <span key={choice.id} className="inline-block mr-2">
                        <span className="text-gold/60">{choice.name}: </span>
                        {selected.map(optionId =>
                          choice.options.find(o => o.id === optionId)?.name
                        ).filter(Boolean).join(', ')}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}
          <p className="text-parchment/70 text-sm">
            {character.background} • {character.alignment || 'Unaligned'}
          </p>
        </div>
      </div>

      {/* Export/Import/Delete Buttons */}
      {showExportImport && (
        <div className="flex justify-center gap-2 mt-3">
          <Button size="sm" variant="secondary" onClick={handleExport}>
            Export
          </Button>
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Import
              </Button>
            </>
          )}
          {onDelete && (
            <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          )}
        </div>
      )}
      {importError && (
        <p className="text-red-400 text-xs text-center mt-2">{importError}</p>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-dark-wood border-4 border-red-500 rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-red-400 font-medieval text-xl mb-3">Delete Character?</h3>
            <p className="text-parchment mb-4">
              Are you sure you want to delete <span className="text-gold font-semibold">{character.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.();
                }}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
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
          <span className="px-2 py-0.5 rounded text-xs bg-amber-900/50 text-amber-300 border border-amber-500">
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
      <Tooltip content={RULE_TOOLTIPS.armorClass}>
        <div className="bg-dark-wood p-2 rounded border border-leather text-center cursor-help">
          <div className="text-gold font-bold text-xl">{character.armorClass}</div>
          <div className="text-parchment/70 text-xs">AC</div>
        </div>
      </Tooltip>
      <Tooltip content={RULE_TOOLTIPS.initiative}>
        <button
          onClick={handleRollInitiative}
          disabled={!onRoll && !onRollInitiative}
          className="bg-dark-wood p-2 rounded border border-leather text-center hover:border-gold transition-colors disabled:hover:border-leather w-full"
        >
          <div className="text-gold font-bold text-xl">
            {formatModifier(character.initiative)}
          </div>
          <div className="text-parchment/70 text-xs">Initiative</div>
        </button>
      </Tooltip>
      <div className="bg-dark-wood p-2 rounded border border-leather text-center">
        <div className="text-gold font-bold text-xl">{character.speed} ft</div>
        <div className="text-parchment/70 text-xs">Speed</div>
      </div>
      <Tooltip content={RULE_TOOLTIPS.proficiencyBonus}>
        <div className="bg-dark-wood p-2 rounded border border-leather text-center cursor-help">
          <div className="text-gold font-bold text-xl">+{profBonus}</div>
          <div className="text-parchment/70 text-xs">Prof</div>
        </div>
      </Tooltip>
    </div>
  );

  const renderHitPoints = () => (
    <div className="bg-dark-wood p-3 rounded border border-leather mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-parchment text-sm">Hit Points</span>
        <Tooltip content={RULE_TOOLTIPS.hitDice}>
          <span className="text-parchment/70 text-xs cursor-help">
            {character.hitDiceRemaining}d{hitDie} remaining
          </span>
        </Tooltip>
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
        <Tooltip content={RULE_TOOLTIPS.temporaryHitPoints}>
          <span className="text-blue-400 text-xs cursor-help">Temp HP:</span>
        </Tooltip>
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
      <Tooltip content={RULE_TOOLTIPS.deathSaves}>
        <div className="text-red-300 font-semibold mb-2 text-center cursor-help">Death Saving Throws</div>
      </Tooltip>
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
      <Tooltip content={RULE_TOOLTIPS.shortRest}>
        <button
          onClick={handleShortRest}
          disabled={!isEditable}
          className="flex-1 py-1 text-xs bg-amber-900/50 text-amber-300 rounded border border-amber-500/50 hover:bg-amber-900/70 disabled:opacity-50"
        >
          Short Rest
        </button>
      </Tooltip>
      <Tooltip content={RULE_TOOLTIPS.longRest}>
        <button
          onClick={handleLongRest}
          disabled={!isEditable}
          className="flex-1 py-1 text-xs bg-blue-900/50 text-blue-300 rounded border border-blue-500/50 hover:bg-blue-900/70 disabled:opacity-50"
        >
          Long Rest
        </button>
      </Tooltip>
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
          const tooltipKey = ability as keyof typeof RULE_TOOLTIPS;

          return (
            <Tooltip key={ability} content={RULE_TOOLTIPS[tooltipKey]} position="bottom">
              <div className="bg-dark-wood p-3 rounded border border-leather text-center cursor-help">
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
            </Tooltip>
          );
        })}
      </div>

      {/* Class Resources (Ki, Rage, etc.) */}
      {renderClassResources()}
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
        <Tooltip content={RULE_TOOLTIPS.passivePerception}>
          <div className="bg-dark-wood p-2 rounded border border-leather text-center cursor-help">
            <span className="text-parchment/70 text-sm">Passive Perception: </span>
            <span className="text-gold font-bold">
              {10 + getSkillModifier(
                character.abilityScores.wisdom,
                character.skillProficiencies.perception,
                profBonus
              )}
            </span>
          </div>
        </Tooltip>

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
      {(() => {
        // Check for combat feats
        const hasSavageAttacker = character.features?.some(f => f.name === 'Savage Attacker');
        const hasTavernBrawler = character.features?.some(f => f.name === 'Tavern Brawler');
        const isUnarmed = (name: string) => name.toLowerCase().includes('unarmed');

        return (
          <div>
            <h4 className="text-gold font-semibold mb-2">Weapons</h4>
            {/* Combat feat reminders */}
            {(hasSavageAttacker || hasTavernBrawler) && (
              <div className="mb-2 p-2 bg-amber-900/20 border border-amber-600/30 rounded text-xs">
                {hasSavageAttacker && (
                  <p className="text-amber-300">
                    <span className="font-semibold">Savage Attacker:</span> Once per turn, roll weapon/unarmed damage twice and use either result
                  </p>
                )}
                {hasTavernBrawler && (
                  <p className="text-orange-300 mt-1">
                    <span className="font-semibold">Tavern Brawler:</span> Reroll 1s on unarmed damage • Push target 5 ft on unarmed hit (1/turn)
                  </p>
                )}
              </div>
            )}
            {character.weapons.length === 0 ? (
              <p className="text-parchment/50 text-sm">No weapons equipped</p>
            ) : (
              <div className="space-y-2">
                {character.weapons.map(weapon => {
                  const weaponIsUnarmed = isUnarmed(weapon.name);
                  return (
                    <div
                      key={weapon.id}
                      className={`p-2 rounded border ${
                        weaponIsUnarmed && hasTavernBrawler
                          ? 'bg-orange-900/30 border-orange-600/40'
                          : 'bg-dark-wood border-leather'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-parchment font-semibold">
                          {weapon.name}
                          {weaponIsUnarmed && hasTavernBrawler && (
                            <span className="text-orange-400 text-xs ml-2">(Tavern Brawler)</span>
                          )}
                        </div>
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
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleRollDamage(weapon.name, weapon.damage)}
                            disabled={!onRoll}
                            className="text-red-400 text-sm hover:text-red-300 disabled:hover:text-red-400"
                            title={hasSavageAttacker ? "Roll damage (Savage Attacker: roll twice!)" : "Roll damage"}
                          >
                            {weapon.damage}
                            {hasSavageAttacker && <span className="text-amber-400 ml-1">*</span>}
                          </button>
                          {weapon.bonusDamage && (
                            <button
                              onClick={() => handleRollDamage(`${weapon.name} (bonus)`, weapon.bonusDamage!)}
                              disabled={!onRoll}
                              className="text-purple-400 text-sm hover:text-purple-300 disabled:hover:text-purple-400"
                              title="Roll bonus damage"
                            >
                              +{weapon.bonusDamage}
                            </button>
                          )}
                        </div>
                      </div>
                      {weapon.effect && (
                        <p className="text-green-400/80 text-xs mt-1 italic">{weapon.effect}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Weapon Masteries */}
      {character.weaponMasteries && character.weaponMasteries.length > 0 && (
        <div>
          <h4 className="text-gold font-semibold mb-2">Weapon Masteries</h4>
          <div className="space-y-2">
            {character.weaponMasteries.map(weapon => {
              const masteryType = WEAPON_MASTERIES[weapon];
              const description = masteryType ? WEAPON_MASTERY_DESCRIPTIONS[masteryType] : '';
              return (
                <div key={weapon} className="bg-orange-900/20 border border-orange-500/30 p-2 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-orange-300 font-semibold">{weapon}</span>
                    <span className="text-gold text-sm font-bold">{masteryType}</span>
                  </div>
                  <p className="text-parchment/80 text-xs">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Combat Actions - Key abilities for combat */}
      {(() => {
        // Get combat-relevant features from class
        const classFeats = CLASS_FEATURES[character.characterClass]?.filter(f => f.level <= character.level) || [];

        // Define combat action categories
        const bonusActions: { name: string; description: string; source: string }[] = [];
        const reactions: { name: string; description: string; source: string }[] = [];
        const passives: { name: string; description: string; source: string }[] = [];

        // Check class features for combat abilities
        classFeats.forEach(feat => {
          const lowerName = feat.name.toLowerCase();
          const lowerDesc = feat.description.toLowerCase();

          // Bonus actions (explicit or by description)
          if (lowerDesc.includes('bonus action') || lowerName === 'martial arts' || lowerName === 'cunning action') {
            bonusActions.push({ name: feat.name, description: feat.description, source: CLASS_NAMES[character.characterClass] });
          }
          // Reactions (explicit or by description)
          else if (lowerDesc.includes('reaction') || lowerName.includes('deflect') || lowerName === 'uncanny dodge') {
            reactions.push({ name: feat.name, description: feat.description, source: CLASS_NAMES[character.characterClass] });
          }
          // On-hit choices (spend resource or slot for extra effect)
          else if (lowerName === 'divine smite' || lowerName === 'stunning strike' ||
                   lowerName === 'reckless attack' || lowerName === 'cunning strike' ||
                   lowerName === 'blessed strikes' || lowerName === 'radiant strikes') {
            passives.push({ name: feat.name, description: feat.description, source: CLASS_NAMES[character.characterClass] });
          }
          // Passive combat features (AC, damage, attacks)
          else if (lowerName === 'unarmored defense' || lowerName === 'sneak attack' ||
                   lowerName === 'extra attack' || lowerName.startsWith('extra attack') ||
                   lowerName === 'evasion' || lowerName === 'danger sense' ||
                   lowerName === 'aura of protection' || lowerName === 'empowered strikes' ||
                   lowerName.includes('fighting style')) {
            passives.push({ name: feat.name, description: feat.description, source: CLASS_NAMES[character.characterClass] });
          }
        });

        // Add fighting style if selected (categorize by type)
        if (character.fightingStyle) {
          const style = FIGHTING_STYLES.find(s => s.id === character.fightingStyle);
          if (style) {
            const styleName = `Fighting Style: ${style.name}`;
            // Reaction-based fighting styles
            if (character.fightingStyle === 'interception' || character.fightingStyle === 'protection') {
              reactions.push({ name: styleName, description: style.description, source: CLASS_NAMES[character.characterClass] });
            } else {
              passives.push({ name: styleName, description: style.description, source: CLASS_NAMES[character.characterClass] });
            }
          }
        }

        const hasCombatActions = bonusActions.length > 0 || reactions.length > 0 || passives.length > 0;
        if (!hasCombatActions) return null;

        return (
          <div>
            <h4 className="text-gold font-semibold mb-2">Combat Actions</h4>
            <div className="space-y-2">
              {/* Bonus Actions */}
              {bonusActions.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 p-2 rounded">
                  <div className="text-green-400 text-xs font-semibold mb-1">⚡ Bonus Actions</div>
                  {bonusActions.map((action, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      <span className="text-green-300 font-medium text-sm">{action.name}</span>
                      <p className="text-parchment/70 text-xs">{action.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reactions */}
              {reactions.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 p-2 rounded">
                  <div className="text-yellow-400 text-xs font-semibold mb-1">🛡️ Reactions</div>
                  {reactions.map((action, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      <span className="text-yellow-300 font-medium text-sm">{action.name}</span>
                      <p className="text-parchment/70 text-xs">{action.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Passive Combat Features */}
              {passives.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded">
                  <div className="text-blue-400 text-xs font-semibold mb-1">⚔️ Passive</div>
                  {passives.map((action, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      <span className="text-blue-300 font-medium text-sm">{action.name}</span>
                      <p className="text-parchment/70 text-xs">{action.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* Class Resources (Lay on Hands, Ki, Rage, etc.) - shown in Combat tab for easy access */}
      {renderClassResources()}
    </div>
  );

  // Calculate AC based on equipment (used for syncing character.armorClass)
  const calculateACFromEquipment = (equipment: typeof character.equipment) => {
    const dexMod = getAbilityModifier(character.abilityScores.dexterity);
    const conMod = getAbilityModifier(character.abilityScores.constitution);
    const wisMod = getAbilityModifier(character.abilityScores.wisdom);
    const equippedArmor = equipment.find(e => e.category === 'armor' && e.equipped);
    const equippedShield = equipment.find(e => e.category === 'shield' && e.equipped);
    // Get equipped wondrous items with AC bonus
    const equippedWondrousWithAC = equipment.filter(e =>
      e.equipped && e.acBonus !== undefined && e.acBonus > 0
    );

    let baseAC = 10 + dexMod; // Default Unarmored

    // Check for class-based Unarmored Defense (only when not wearing armor)
    if (!equippedArmor) {
      if (character.characterClass === 'barbarian') {
        // Barbarian Unarmored Defense: 10 + DEX + CON (can use shield)
        baseAC = 10 + dexMod + conMod;
      } else if (character.characterClass === 'monk' && !equippedShield) {
        // Monk Unarmored Defense: 10 + DEX + WIS (cannot use shield)
        baseAC = 10 + dexMod + wisMod;
      }
    }

    // Check for Medium Armor Master feat (increases max DEX from 2 to 3)
    const hasMediumArmorMaster = character.features?.some(f => f.name === 'Medium Armor Master');

    if (equippedArmor) {
      const armorAC = equippedArmor.armorClass || 10;
      if (equippedArmor.armorType === 'light') {
        baseAC = armorAC + dexMod;
      } else if (equippedArmor.armorType === 'medium') {
        // Medium Armor Master increases max DEX from 2 to 3
        const maxDex = hasMediumArmorMaster ? 3 : (equippedArmor.maxDexBonus ?? 2);
        baseAC = armorAC + Math.min(dexMod, maxDex);
        // Druid Primal Order: Warden adds +1 AC in medium armor
        if (character.characterClass === 'druid' && character.primalOrder === 'warden') {
          baseAC += 1;
        }
      } else if (equippedArmor.armorType === 'heavy') {
        baseAC = armorAC;
      }
    }

    if (equippedShield) {
      baseAC += equippedShield.armorClass || 2;
    }

    // Add AC bonus from equipped wondrous items
    equippedWondrousWithAC.forEach(item => {
      baseAC += item.acBonus!;
    });

    // Fighting Style: Defense (+1 AC when wearing armor)
    if (character.fightingStyle === 'defense' && equippedArmor) {
      baseAC += 1;
    }

    return baseAC;
  };

  // Handle equipping/unequipping items
  const handleToggleEquipped = (itemId: string) => {
    if (!onUpdate) return;
    const updatedEquipment = character.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: !item.equipped };
      }
      // Unequip other armor if equipping new armor
      if (item.category === 'armor' && character.equipment.find(e => e.id === itemId)?.category === 'armor') {
        return { ...item, equipped: false };
      }
      return item;
    });

    // Calculate the new AC based on updated equipment
    const newAC = calculateACFromEquipment(updatedEquipment);

    onUpdate({ equipment: updatedEquipment, armorClass: newAC });
  };

  // Calculate AC based on equipped armor
  const calculateAC = () => {
    const dexMod = getAbilityModifier(character.abilityScores.dexterity);
    const conMod = getAbilityModifier(character.abilityScores.constitution);
    const wisMod = getAbilityModifier(character.abilityScores.wisdom);
    const equippedArmor = character.equipment.find(e => e.category === 'armor' && e.equipped);
    const equippedShield = character.equipment.find(e => e.category === 'shield' && e.equipped);
    // Get equipped wondrous items with AC bonus
    const equippedWondrousWithAC = character.equipment.filter(e =>
      e.equipped && e.acBonus !== undefined && e.acBonus > 0
    );

    let baseAC = 10 + dexMod; // Default Unarmored
    let acDetails = 'Unarmored: 10 + DEX';

    // Check for class-based Unarmored Defense (only when not wearing armor)
    if (!equippedArmor) {
      if (character.characterClass === 'barbarian') {
        // Barbarian Unarmored Defense: 10 + DEX + CON (can use shield)
        baseAC = 10 + dexMod + conMod;
        acDetails = 'Unarmored Defense: 10 + DEX + CON';
      } else if (character.characterClass === 'monk' && !equippedShield) {
        // Monk Unarmored Defense: 10 + DEX + WIS (cannot use shield)
        baseAC = 10 + dexMod + wisMod;
        acDetails = 'Unarmored Defense: 10 + DEX + WIS';
      }
    }

    // Check for Medium Armor Master feat (increases max DEX from 2 to 3)
    const hasMediumArmorMaster = character.features?.some(f => f.name === 'Medium Armor Master');

    if (equippedArmor) {
      const armorAC = equippedArmor.armorClass || 10;
      if (equippedArmor.armorType === 'light') {
        baseAC = armorAC + dexMod;
        acDetails = `${equippedArmor.name}: ${armorAC} + DEX`;
      } else if (equippedArmor.armorType === 'medium') {
        // Medium Armor Master increases max DEX from 2 to 3
        const maxDex = hasMediumArmorMaster ? 3 : (equippedArmor.maxDexBonus ?? 2);
        baseAC = armorAC + Math.min(dexMod, maxDex);
        acDetails = `${equippedArmor.name}: ${armorAC} + DEX (max ${maxDex})`;
        if (hasMediumArmorMaster && dexMod > 2) {
          acDetails += ' [Medium Armor Master]';
        }
        // Druid Primal Order: Warden adds +1 AC in medium armor
        if (character.characterClass === 'druid' && character.primalOrder === 'warden') {
          baseAC += 1;
          acDetails += ' + Warden (+1)';
        }
      } else if (equippedArmor.armorType === 'heavy') {
        baseAC = armorAC;
        acDetails = `${equippedArmor.name}: ${armorAC}`;
      }
    }

    if (equippedShield) {
      baseAC += equippedShield.armorClass || 2;
      acDetails += ' + Shield (+2)';
    }

    // Add AC bonus from equipped wondrous items (Cloak of Protection, Ring of Protection, etc.)
    equippedWondrousWithAC.forEach(item => {
      baseAC += item.acBonus!;
      acDetails += ` + ${item.name} (+${item.acBonus})`;
    });

    // Fighting Style: Defense (+1 AC when wearing armor)
    if (character.fightingStyle === 'defense' && equippedArmor) {
      baseAC += 1;
      acDetails += ' + Defense (+1)';
    }

    return { ac: baseAC, details: acDetails };
  };

  const renderEquipmentTab = () => {
    const armorItems = character.equipment.filter(e => e.category === 'armor' || e.category === 'shield');
    // Wondrous items that can be equipped (have acBonus, savingThrowBonus, or equipmentSlot)
    const wondrousItems = character.equipment.filter(e =>
      e.category === 'wondrous' || e.acBonus !== undefined || e.savingThrowBonus !== undefined || e.equipmentSlot !== undefined
    );
    const otherItems = character.equipment.filter(e =>
      e.category !== 'armor' && e.category !== 'shield' &&
      e.category !== 'wondrous' && e.acBonus === undefined && e.savingThrowBonus === undefined && e.equipmentSlot === undefined
    );
    const acInfo = calculateAC();

    return (
      <div className="space-y-4">
        {/* Currency */}
        <div>
          <h4 className="text-gold font-semibold mb-2">Currency</h4>
          <div className="grid grid-cols-5 gap-1 text-center">
            {(['platinum', 'gold', 'electrum', 'silver', 'copper'] as const).map(coin => (
              <div key={coin} className="bg-dark-wood p-2 rounded border border-leather">
                {isEditable && onUpdate ? (
                  <input
                    type="number"
                    value={character.currency[coin]}
                    onChange={(e) => onUpdate({
                      currency: { ...character.currency, [coin]: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full bg-transparent text-gold font-bold text-center border-none outline-none focus:bg-leather/30 rounded"
                    min="0"
                  />
                ) : (
                  <div className="text-gold font-bold">{character.currency[coin]}</div>
                )}
                <div className="text-parchment/70 text-xs uppercase">{coin.slice(0, 2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Armor & Defense */}
        <div>
          <h4 className="text-gold font-semibold mb-2">Armor & Defense</h4>
          <Tooltip content={acInfo.details}>
            <div className="bg-dark-wood p-3 rounded border border-leather mb-2 text-center cursor-help">
              <span className="text-parchment/70 text-sm">Calculated AC: </span>
              <span className="text-gold font-bold text-xl">{acInfo.ac}</span>
              <span className="text-parchment/50 text-xs block">(Hover for details)</span>
            </div>
          </Tooltip>

          {armorItems.length === 0 ? (
            <p className="text-parchment/50 text-sm text-center py-2">No armor in inventory</p>
          ) : (
            <div className="space-y-1">
              {armorItems.map(item => (
                <div key={item.id} className="bg-dark-wood p-2 rounded border border-leather">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEditable && (
                        <button
                          onClick={() => handleToggleEquipped(item.id)}
                          className={`w-5 h-5 rounded border transition-colors ${
                            item.equipped
                              ? 'bg-gold border-gold text-dark-wood'
                              : 'border-parchment/50 hover:border-gold'
                          }`}
                          title={item.equipped ? 'Unequip' : 'Equip'}
                        >
                          {item.equipped && '✓'}
                        </button>
                      )}
                      <Tooltip content={item.description || `AC: ${item.armorClass || '?'}`}>
                        <span className={`cursor-help ${item.equipped ? 'text-gold' : 'text-parchment'}`}>
                          {item.name}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="text-right">
                      <span className="text-parchment/70 text-xs">
                        {item.category === 'shield' ? '+2 AC' : `AC ${item.armorClass}`}
                      </span>
                      {item.equipped && (
                        <span className="ml-2 text-green-400 text-xs">Equipped</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wondrous Items (equippable magic items with AC bonus, saving throw bonus, etc.) */}
        {wondrousItems.length > 0 && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Wondrous Items</h4>
            <div className="space-y-1">
              {wondrousItems.map(item => {
                const bonusText = [];
                if (item.acBonus) bonusText.push(`+${item.acBonus} AC`);
                if (item.savingThrowBonus) bonusText.push(`+${item.savingThrowBonus} Saves`);
                if (item.equipmentSlot) bonusText.push(item.equipmentSlot);

                return (
                  <div key={item.id} className="bg-dark-wood p-2 rounded border border-purple-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isEditable && (
                          <button
                            onClick={() => handleToggleEquipped(item.id)}
                            className={`w-5 h-5 rounded border transition-colors ${
                              item.equipped
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'border-parchment/50 hover:border-purple-400'
                            }`}
                            title={item.equipped ? 'Unequip' : 'Equip'}
                          >
                            {item.equipped && '✓'}
                          </button>
                        )}
                        <Tooltip content={item.description || item.effect || item.name}>
                          <span className={`cursor-help ${item.equipped ? 'text-purple-300' : 'text-parchment'}`}>
                            {item.name}
                          </span>
                        </Tooltip>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-400 text-xs">
                          {bonusText.join(', ') || 'Magic'}
                        </span>
                        {item.equipped && (
                          <span className="ml-2 text-green-400 text-xs">Equipped</span>
                        )}
                      </div>
                    </div>
                    {item.effect && (
                      <p className="text-purple-400/70 text-xs mt-1">{item.effect}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Equipment */}
        <div>
          <h4 className="text-gold font-semibold mb-2">Equipment</h4>
          {otherItems.length === 0 ? (
            <p className="text-parchment/50 text-sm text-center py-4">
              No other equipment
            </p>
          ) : (
            <div className="space-y-1">
              {otherItems.map(item => {
                const isUsed = item.category === 'gear' && usedItems?.has(item.id);
                return (
                <div key={item.id} className={`bg-dark-wood p-2 rounded border ${isUsed ? 'border-gray-600 opacity-50' : 'border-leather'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className={`font-medium ${isUsed ? 'text-gray-500 line-through' : 'text-parchment'}`}>{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="text-parchment/70 text-sm ml-2">×{item.quantity}</span>
                      )}
                    </div>
                    {isEditable && onUpdate && (
                      <div className="flex gap-1 ml-2">
                        {!isUsed ? (
                          <button
                            onClick={() => handleUseItem(item.id)}
                            className="text-xs px-2 py-0.5 rounded bg-amber-700/50 hover:bg-amber-600/50 text-amber-300 transition-colors"
                            title="Mark as used (can then be deleted)"
                          >
                            Use
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-xs px-2 py-0.5 rounded bg-red-700/50 hover:bg-red-600/50 text-red-300 transition-colors"
                            title="Delete item permanently"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {item.description && item.description !== item.name && (
                    <p className={`text-xs mt-1 ${isUsed ? 'text-gray-500' : 'text-parchment/60'}`}>{item.description}</p>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSpellSlots = () => {
    const hasSlots = spellSlots.some(s => s > 0);
    if (!hasSlots) return null;

    return (
      <div className="mb-4">
        <Tooltip content={RULE_TOOLTIPS.spellSlots}>
          <h4 className="text-gold font-semibold mb-2 cursor-help inline-block">Spell Slots</h4>
        </Tooltip>
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
                          ? 'bg-blue-500 border-blue-400'
                          : 'border-blue-500/50 hover:border-blue-400'
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

  // Render class resources (Ki, Rage, Bardic Inspiration, etc.)
  const renderClassResources = () => {
    // Extract feat names from features (feats have specific sources like "Origin Feat", "Human Versatile", etc.)
    const featNames = character.features
      .filter(f => f.source === 'Origin Feat' || f.source === 'Human Versatile' || f.source.includes('Feat'))
      .map(f => f.name);

    // Get available resources for this character
    const resources = getCharacterResources(
      character.characterClass,
      character.species,
      character.level,
      character.abilityScores,
      featNames
    );

    const resourceEntries = Object.entries(resources);
    if (resourceEntries.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-gold font-semibold mb-2">Class Resources</h4>
        <div className="space-y-2">
          {resourceEntries.map(([id, resource]) => {
            const featureUse = character.featureUses?.[id] || { used: 0, max: resource.max };
            const used = featureUse.used || 0;
            const max = resource.max;
            const remaining = max - used;

            // For large pools like Ki or Sorcery Points, show as number
            const isLargePool = max > 6;

            const isExpanded = expandedResource === id;

            return (
              <div key={id} className="bg-dark-wood p-2 rounded border border-leather">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setExpandedResource(isExpanded ? null : id)}
                    className="text-parchment text-sm hover:text-gold transition-colors flex items-center gap-1"
                  >
                    <span className="text-parchment/50 text-xs">{isExpanded ? '▼' : '▶'}</span>
                    {resource.name}
                  </button>
                  <span className="text-parchment/50 text-xs">
                    {resource.restoreOn === 'short' ? '⚡ Short Rest' : '🌙 Long Rest'}
                  </span>
                </div>
                {isExpanded && (
                  <p className="text-parchment/70 text-xs mb-2 bg-leather/20 p-2 rounded">
                    {resource.description}
                  </p>
                )}
                {isLargePool ? (
                  // Large pool: show as number with +/- buttons
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => isEditable && handleResourceToggle(id, max)}
                      disabled={!isEditable || used <= 0}
                      className="w-6 h-6 rounded bg-red-600 text-white font-bold text-sm hover:bg-red-500 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="text-gold font-bold text-lg min-w-[60px] text-center">
                      {remaining} / {max}
                    </span>
                    <button
                      onClick={() => {
                        if (!onUpdate || !isEditable) return;
                        const currentFeatureUses = character.featureUses || {};
                        const currentUse = currentFeatureUses[id] || { used: 0, max, restoreOn: resource.restoreOn };
                        if (currentUse.used > 0) {
                          onUpdate({
                            featureUses: {
                              ...currentFeatureUses,
                              [id]: { ...currentUse, used: currentUse.used - 1, max },
                            },
                          });
                        }
                      }}
                      disabled={!isEditable || used >= max}
                      className="w-6 h-6 rounded bg-green-600 text-white font-bold text-sm hover:bg-green-500 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  // Small pool: show as clickable circles
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: max }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => isEditable && handleResourceToggle(id, max)}
                        disabled={!isEditable}
                        className={`w-5 h-5 rounded-full border-2 transition-colors ${
                          i < remaining
                            ? 'bg-amber-500 border-amber-400'
                            : 'border-amber-500/50 hover:border-amber-400'
                        }`}
                        title={`${remaining}/${max} remaining`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a single expandable spell card
  const renderSpellCard = (spellName: string, isCantrip: boolean) => {
    const details = getSpellDetails(spellName);
    const isExpanded = expandedSpell === spellName;
    const bgColor = isCantrip ? 'bg-purple-900/30' : 'bg-blue-900/30';
    const borderColor = isCantrip ? 'border-purple-500/50' : 'border-blue-500/50';
    const textColor = isCantrip ? 'text-purple-300' : 'text-blue-300';
    const hoverBorder = isCantrip ? 'hover:border-purple-400' : 'hover:border-blue-400';

    return (
      <div key={spellName} className={`${bgColor} rounded border ${borderColor} ${hoverBorder} transition-colors overflow-hidden`}>
        <button
          onClick={() => setExpandedSpell(isExpanded ? null : spellName)}
          className="w-full px-3 py-2 flex justify-between items-center text-left"
        >
          <span className={`${textColor} font-medium text-sm`}>{spellName}</span>
          <span className="text-parchment/50 text-xs">{isExpanded ? '▼' : '▶'}</span>
        </button>

        {isExpanded && details && (
          <div className="px-3 pb-3 border-t border-leather/50 space-y-2">
            {/* Spell metadata row */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="bg-dark-wood px-2 py-0.5 rounded text-parchment/80 capitalize">
                {details.school}
              </span>
              {details.concentration && (
                <span className="bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                  Concentration
                </span>
              )}
              {details.ritual && (
                <span className="bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                  Ritual
                </span>
              )}
            </div>

            {/* Spell properties grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-parchment/50">Casting Time: </span>
                <span className="text-parchment">{details.castingTime}</span>
              </div>
              <div>
                <span className="text-parchment/50">Range: </span>
                <span className="text-parchment">{details.range}</span>
              </div>
              <div>
                <span className="text-parchment/50">Duration: </span>
                <span className="text-parchment">{details.duration}</span>
              </div>
              <div>
                <span className="text-parchment/50">Components: </span>
                <span className="text-parchment">{details.components}</span>
              </div>
            </div>

            {/* Damage/Healing info */}
            {(details.damage || details.healing || details.savingThrow || details.attackType) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {details.damage && (
                  <span className="bg-red-900/40 text-red-300 px-2 py-0.5 rounded">
                    {details.damage} {details.damageType || 'damage'}
                  </span>
                )}
                {details.healing && (
                  <span className="bg-green-900/40 text-green-300 px-2 py-0.5 rounded">
                    {details.healing} healing
                  </span>
                )}
                {details.attackType && (
                  <span className="bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded">
                    {details.attackType === 'melee' ? 'Melee Spell Attack' : 'Ranged Spell Attack'}
                  </span>
                )}
                {details.savingThrow && (
                  <span className="bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">
                    {ABILITY_ABBREVIATIONS[details.savingThrow]} Save
                  </span>
                )}
                {details.areaOfEffect && (
                  <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded">
                    {details.areaOfEffect}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-parchment/80 text-xs leading-relaxed">{details.description}</p>

            {/* Eldritch Blast Invocation Effects */}
            {spellName === 'Eldritch Blast' && character.eldritchInvocations && character.eldritchInvocations.length > 0 && (
              <div className="bg-purple-900/40 border border-purple-500/50 rounded p-2 space-y-1">
                <span className="text-purple-300 text-xs font-semibold">Invocation Effects:</span>
                <div className="space-y-0.5">
                  {character.eldritchInvocations.includes('agonizing-blast') && (
                    <div className="text-parchment/80 text-xs">• <span className="text-gold">Agonizing Blast:</span> +CHA modifier to damage</div>
                  )}
                  {character.eldritchInvocations.includes('eldritch-spear') && (
                    <div className="text-parchment/80 text-xs">• <span className="text-gold">Eldritch Spear:</span> Range increased to 300 ft</div>
                  )}
                  {character.eldritchInvocations.includes('repelling-blast') && (
                    <div className="text-parchment/80 text-xs">• <span className="text-gold">Repelling Blast:</span> Push target 10 ft on hit</div>
                  )}
                  {character.eldritchInvocations.includes('grasp-of-hadar') && (
                    <div className="text-parchment/80 text-xs">• <span className="text-gold">Grasp of Hadar:</span> Pull target 10 ft (1/turn)</div>
                  )}
                  {character.eldritchInvocations.includes('lance-of-lethargy') && (
                    <div className="text-parchment/80 text-xs">• <span className="text-gold">Lance of Lethargy:</span> Reduce speed by 10 ft (1/turn)</div>
                  )}
                </div>
              </div>
            )}

            {/* Higher levels */}
            {details.higherLevels && (
              <div className="text-xs">
                <span className="text-gold font-semibold">At Higher Levels: </span>
                <span className="text-parchment/70">{details.higherLevels}</span>
              </div>
            )}
          </div>
        )}

        {/* Fallback if no details found */}
        {isExpanded && !details && (
          <div className="px-3 pb-3 border-t border-leather/50">
            <p className="text-parchment/50 text-xs mt-2 italic">Spell details not available.</p>
          </div>
        )}
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

        {/* Cantrips - Expandable cards */}
        {hasCantrips && (
          <div>
            <h4 className="text-purple-400 font-semibold mb-2">Cantrips</h4>
            <div className="space-y-1">
              {character.cantrips!.map(cantrip => renderSpellCard(cantrip, true))}
            </div>
          </div>
        )}

        {/* Spells Known - Expandable cards */}
        {hasSpells && (
          <div>
            <h4 className="text-blue-400 font-semibold mb-2">Spells Known</h4>
            <div className="space-y-1">
              {character.spells!.map(spell => renderSpellCard(spell, false))}
            </div>
          </div>
        )}

        {/* Invocation Abilities (at-will spells from Eldritch Invocations) */}
        {character.eldritchInvocations && character.eldritchInvocations.length > 0 && (() => {
          const invocationAbilities: { name: string; spell: string; description: string }[] = [];

          if (character.eldritchInvocations.includes('armor-of-shadows')) {
            invocationAbilities.push({ name: 'Armor of Shadows', spell: 'Mage Armor', description: 'Cast on yourself at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('beast-speech')) {
            invocationAbilities.push({ name: 'Beast Speech', spell: 'Speak with Animals', description: 'Cast at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('fiendish-vigor')) {
            invocationAbilities.push({ name: 'Fiendish Vigor', spell: 'False Life', description: 'Cast on yourself at will (1st level), no spell slot' });
          }
          if (character.eldritchInvocations.includes('mask-of-many-faces')) {
            invocationAbilities.push({ name: 'Mask of Many Faces', spell: 'Disguise Self', description: 'Cast at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('misty-visions')) {
            invocationAbilities.push({ name: 'Misty Visions', spell: 'Silent Image', description: 'Cast at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('otherworldly-leap')) {
            invocationAbilities.push({ name: 'Otherworldly Leap', spell: 'Jump', description: 'Cast on yourself at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('pact-of-the-chain')) {
            invocationAbilities.push({ name: 'Pact of the Chain', spell: 'Find Familiar', description: 'Cast as a ritual (imp, pseudodragon, quasit, or sprite)' });
          }
          if (character.eldritchInvocations.includes('thief-of-five-fates')) {
            invocationAbilities.push({ name: 'Thief of Five Fates', spell: 'Bane', description: 'Cast once using a warlock spell slot (recharges on long rest)' });
          }
          if (character.eldritchInvocations.includes('whispers-of-the-grave')) {
            invocationAbilities.push({ name: 'Whispers of the Grave', spell: 'Speak with Dead', description: 'Cast at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('ascendant-step')) {
            invocationAbilities.push({ name: 'Ascendant Step', spell: 'Levitate', description: 'Cast on yourself at will, no spell slot' });
          }
          if (character.eldritchInvocations.includes('master-of-myriad-forms')) {
            invocationAbilities.push({ name: 'Master of Myriad Forms', spell: 'Alter Self', description: 'Cast at will, no spell slot' });
          }

          if (invocationAbilities.length === 0) return null;

          return (
            <div>
              <h4 className="text-purple-400 font-semibold mb-2">Invocation Abilities</h4>
              <div className="space-y-1">
                {invocationAbilities.map(ability => (
                  <div key={ability.name} className="bg-dark-wood rounded border border-purple-500/30 p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-300 font-semibold text-sm">{ability.name}</span>
                      <span className="text-parchment/50 text-xs">→</span>
                      <span className="text-gold text-sm">{ability.spell}</span>
                    </div>
                    <p className="text-parchment/70 text-xs mt-1">{ability.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Full Spell List (if spellcasting object exists) */}
        {hasSpellcasting && character.spellcasting!.spells.length > 0 && (
          <div>
            <h4 className="text-gold font-semibold mb-2">Spell List</h4>
            <div className="space-y-1">
              {character.spellcasting!.spells
                .sort((a, b) => a.level - b.level)
                .map(spell => renderSpellCard(spell.name, spell.level === 0))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeaturesTab = () => {
    // Separate feats from other features
    const feats = character.features.filter(f =>
      f.source === 'Origin Feat' ||
      f.source === 'Human Versatile' ||
      f.source.includes('Feat') ||
      f.source === 'Bonus Feat'
    );
    const classFeatures = character.features.filter(f =>
      f.source.includes('Class') ||
      f.source === character.characterClass ||
      f.source === CLASS_NAMES[character.characterClass]
    );
    const speciesFeatures = character.features.filter(f =>
      f.source.includes('Species') ||
      f.source === character.species ||
      f.source === SPECIES_NAMES[character.species]
    );
    const otherFeatures = character.features.filter(f =>
      !feats.includes(f) && !classFeatures.includes(f) && !speciesFeatures.includes(f)
    );

    const renderFeatureList = (features: typeof character.features, emptyMessage: string) => {
      if (features.length === 0) {
        return <p className="text-parchment/50 text-sm">{emptyMessage}</p>;
      }
      return (
        <div className="space-y-2">
          {features.map(feature => (
            <div key={feature.id} className="bg-dark-wood rounded border border-leather overflow-hidden">
              <button
                onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                className="w-full p-2 flex justify-between items-start text-left hover:bg-leather/30"
              >
                <div>
                  <span className="text-gold font-semibold text-sm">{feature.name}</span>
                  <span className="text-parchment/50 text-xs ml-2">({feature.source})</span>
                </div>
                <span className="text-parchment/50 text-xs">{expandedFeature === feature.id ? '▼' : '▶'}</span>
              </button>
              {expandedFeature === feature.id && (
                <div className="px-2 pb-2 border-t border-leather">
                  <p className="text-parchment text-xs mt-2">{feature.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Feats */}
        <div>
          <h4 className="text-gold font-semibold mb-2 flex items-center gap-2">
            <span>⭐</span> Feats
          </h4>
          {renderFeatureList(feats, 'No feats acquired')}
        </div>

        {/* Class Features */}
        <div>
          <h4 className="text-gold font-semibold mb-2 flex items-center gap-2">
            <span>⚔️</span> Class Features
          </h4>
          {renderFeatureList(classFeatures, 'No class features')}
        </div>

        {/* Species Traits */}
        <div>
          <h4 className="text-gold font-semibold mb-2 flex items-center gap-2">
            <span>🧬</span> Species Traits
          </h4>
          {renderFeatureList(speciesFeatures, 'No species traits')}
        </div>

        {/* Other Features */}
        {otherFeatures.length > 0 && (
          <div>
            <h4 className="text-gold font-semibold mb-2 flex items-center gap-2">
              <span>📜</span> Other Features
            </h4>
            {renderFeatureList(otherFeatures, '')}
          </div>
        )}
      </div>
    );
  };

  const renderBioTab = () => (
    <div className="space-y-4">
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
      case 'features': return renderFeaturesTab();
      case 'bio': return renderBioTab();
    }
  };

  return (
    <>
      <div className="space-y-4">
        {renderHeader()}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-dark-wood p-1 rounded border border-leather">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-1 rounded text-xs transition-colors whitespace-nowrap ${
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
        <div className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-1">
          {renderCurrentTab()}
        </div>
      </div>

      {/* Level Up Wizard Modal */}
      {showLevelUpWizard && onUpdate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <LevelUpWizard
            character={character}
            onComplete={(updatedCharacter) => {
              onUpdate(updatedCharacter);
              setShowLevelUpWizard(false);
            }}
            onCancel={() => setShowLevelUpWizard(false)}
          />
        </div>
      )}
    </>
  );
}
