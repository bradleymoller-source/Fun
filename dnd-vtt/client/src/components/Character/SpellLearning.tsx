import { useState } from 'react';
import type { Character } from '../../types';
import { Button } from '../ui/Button';
import {
  CLASS_NAMES,
  getAvailableSpellsForClass,
  getSpellPreparationType,
  getNewSpellsAtLevel,
  getMaxSpellLevel,
} from '../../data/dndData';

interface SpellLearningProps {
  character: Character;
  newLevel: number;
  currentSpells: string[];
  onSelect: (newSpells: string[]) => void;
}

export function SpellLearning({ character, newLevel, currentSpells, onSelect }: SpellLearningProps) {
  const preparationType = getSpellPreparationType(character.characterClass);
  const spellsToLearn = getNewSpellsAtLevel(character.characterClass, newLevel);
  const maxSpellLevel = getMaxSpellLevel(character.characterClass, newLevel);

  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  // Get available spells filtered by what the character can cast
  const availableSpells = getAvailableSpellsForClass(character.characterClass, newLevel)
    .filter(spell => !currentSpells.includes(spell.name)); // Exclude already known spells

  // Group spells by level
  const spellsByLevel = availableSpells.reduce((acc, spell) => {
    if (!acc[spell.level]) acc[spell.level] = [];
    acc[spell.level].push(spell);
    return acc;
  }, {} as Record<number, typeof availableSpells>);

  const handleSpellToggle = (spellName: string) => {
    setSelectedSpells(prev => {
      if (prev.includes(spellName)) {
        return prev.filter(s => s !== spellName);
      } else if (prev.length < spellsToLearn) {
        return [...prev, spellName];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedSpells.length === spellsToLearn) {
      onSelect(selectedSpells);
    }
  };

  // For prepared casters, show info about spell preparation
  if (preparationType === 'prepared') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-medieval text-xl text-gold">Spell Preparation</h3>
          <p className="text-parchment/70 text-sm mt-1">
            As a {CLASS_NAMES[character.characterClass]}, you prepare spells from your full spell list
          </p>
        </div>

        <div className="p-4 bg-dark-wood rounded border border-leather">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-cyan-400 text-xl">✦</span>
            <span className="text-gold font-semibold">Level {newLevel} Spellcasting</span>
          </div>

          <ul className="text-parchment/70 text-sm space-y-2">
            <li>• You can cast spells up to level {maxSpellLevel}</li>
            <li>• Prepare spells each day after a long rest</li>
            <li>• Number of prepared spells = {character.characterClass === 'paladin' ? 'CHA' : 'WIS'} modifier + {character.characterClass === 'paladin' ? 'half your' : 'your'} level</li>
            {maxSpellLevel >= 2 && (
              <li>• <span className="text-gold">New:</span> You now have access to level {maxSpellLevel} spells</li>
            )}
          </ul>
        </div>

        <div className="p-3 bg-gold/10 rounded border border-gold/30 text-center">
          <p className="text-parchment text-sm">
            Prepare your spells from the character sheet after completing this level-up
          </p>
          <Button onClick={() => onSelect([])} variant="primary" size="sm" className="mt-2">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // For wizard spellbook
  if (preparationType === 'spellbook') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-medieval text-xl text-gold">Spellbook</h3>
          <p className="text-parchment/70 text-sm mt-1">
            Add 2 wizard spells to your spellbook for free
          </p>
        </div>

        <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
          <div className="flex justify-between items-center">
            <span className="text-parchment">Spells to add:</span>
            <span className="text-gold font-bold">
              {selectedSpells.length} / 2
            </span>
          </div>
        </div>

        {/* Spell Selection */}
        <div className="max-h-[300px] overflow-y-auto space-y-4">
          {Object.entries(spellsByLevel)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, spells]) => (
              <div key={level}>
                <div className="text-gold/70 text-xs uppercase tracking-wide mb-2">
                  Level {level} Spells
                </div>
                <div className="grid gap-2">
                  {spells.map(spell => {
                    const isSelected = selectedSpells.includes(spell.name);
                    const isDisabled = !isSelected && selectedSpells.length >= 2;

                    return (
                      <div
                        key={spell.name}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-gold/20 border-gold'
                            : isDisabled
                            ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                            : 'bg-leather/30 border-leather hover:border-gold/50'
                        }`}
                        onClick={() => !isDisabled && handleSpellToggle(spell.name)}
                      >
                        <div className="flex justify-between items-center">
                          <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                            {spell.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSpell(expandedSpell === spell.name ? null : spell.name);
                            }}
                            className="text-parchment/50 text-xs hover:text-gold"
                          >
                            {expandedSpell === spell.name ? '▼' : 'ⓘ'}
                          </button>
                        </div>
                        {expandedSpell === spell.name && (
                          <p className="text-parchment/70 text-xs mt-1">{spell.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Confirm */}
        <div className="p-3 bg-gold/10 rounded border border-gold/30">
          <div className="flex justify-between items-center">
            <div className="text-parchment text-sm">
              {selectedSpells.length === 2
                ? `Adding: ${selectedSpells.join(', ')}`
                : `Select ${2 - selectedSpells.length} more spell${2 - selectedSpells.length > 1 ? 's' : ''}`}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={selectedSpells.length !== 2}
              variant="primary"
              size="sm"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For known casters (Bard, Sorcerer, Ranger, Warlock)
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Learn New Spells</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose {spellsToLearn} new spell{spellsToLearn > 1 ? 's' : ''} for your {CLASS_NAMES[character.characterClass]}
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Spells to learn:</span>
          <span className="text-gold font-bold">
            {selectedSpells.length} / {spellsToLearn}
          </span>
        </div>
        {maxSpellLevel >= 2 && (
          <div className="text-parchment/70 text-xs mt-2">
            You can now cast spells up to level {maxSpellLevel}
          </div>
        )}
      </div>

      {/* Spell Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-4">
        {Object.entries(spellsByLevel)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([level, spells]) => (
            <div key={level}>
              <div className="text-gold/70 text-xs uppercase tracking-wide mb-2">
                Level {level} Spells
              </div>
              <div className="grid gap-2">
                {spells.map(spell => {
                  const isSelected = selectedSpells.includes(spell.name);
                  const isDisabled = !isSelected && selectedSpells.length >= spellsToLearn;

                  return (
                    <div
                      key={spell.name}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-gold/20 border-gold'
                          : isDisabled
                          ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                          : 'bg-leather/30 border-leather hover:border-gold/50'
                      }`}
                      onClick={() => !isDisabled && handleSpellToggle(spell.name)}
                    >
                      <div className="flex justify-between items-center">
                        <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                          {spell.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSpell(expandedSpell === spell.name ? null : spell.name);
                          }}
                          className="text-parchment/50 text-xs hover:text-gold"
                        >
                          {expandedSpell === spell.name ? '▼' : 'ⓘ'}
                        </button>
                      </div>
                      {expandedSpell === spell.name && (
                        <p className="text-parchment/70 text-xs mt-1">{spell.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* No spells to learn case */}
      {spellsToLearn === 0 && (
        <div className="p-4 bg-dark-wood rounded border border-leather text-center">
          <p className="text-parchment/70">
            You don't learn new spells at this level, but you gain access to higher level slots.
          </p>
          <Button onClick={() => onSelect([])} variant="primary" size="sm" className="mt-3">
            Continue
          </Button>
        </div>
      )}

      {/* Confirm */}
      {spellsToLearn > 0 && (
        <div className="p-3 bg-gold/10 rounded border border-gold/30">
          <div className="flex justify-between items-center">
            <div className="text-parchment text-sm">
              {selectedSpells.length === spellsToLearn
                ? `Learning: ${selectedSpells.join(', ')}`
                : `Select ${spellsToLearn - selectedSpells.length} more spell${spellsToLearn - selectedSpells.length > 1 ? 's' : ''}`}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={selectedSpells.length !== spellsToLearn}
              variant="primary"
              size="sm"
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
