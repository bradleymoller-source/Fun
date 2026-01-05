import { useState } from 'react';
import type { Character } from '../../types';
import {
  getNewSpellsAtLevel,
  getSpellPreparationType,
  CLASS_SPELLS_LEVEL_1,
  CLASS_SPELLS_LEVEL_2,
  CLASS_SPELLS_LEVEL_3,
  CLASS_NAMES,
  getMaxSpellLevel,
} from '../../data/dndData';

interface SpellLearningProps {
  character: Character;
  newLevel: number;
  currentSpells: string[];
  onSelect: (spells: string[]) => void;
}

export function SpellLearning({ character, newLevel, currentSpells, onSelect }: SpellLearningProps) {
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);

  const preparationType = getSpellPreparationType(character.characterClass);
  const spellsToLearn = preparationType === 'spellbook' ? 2 : getNewSpellsAtLevel(character.characterClass, newLevel);
  const maxSpellLevel = getMaxSpellLevel(character.characterClass, newLevel);

  // Get available spells for this class up to the max spell level
  const getAvailableSpells = () => {
    const spells: { name: string; description: string; level: number }[] = [];

    if (maxSpellLevel >= 1) {
      const level1 = CLASS_SPELLS_LEVEL_1[character.characterClass] || [];
      level1.forEach(s => spells.push({ ...s, level: 1 }));
    }
    if (maxSpellLevel >= 2) {
      const level2 = CLASS_SPELLS_LEVEL_2[character.characterClass] || [];
      level2.forEach(s => spells.push({ ...s, level: 2 }));
    }
    if (maxSpellLevel >= 3) {
      const level3 = CLASS_SPELLS_LEVEL_3[character.characterClass] || [];
      level3.forEach(s => spells.push({ ...s, level: 3 }));
    }

    // Filter out spells already known
    return spells.filter(s => !currentSpells.includes(s.name));
  };

  const availableSpells = getAvailableSpells();

  const toggleSpell = (spellName: string) => {
    if (selectedSpells.includes(spellName)) {
      setSelectedSpells(selectedSpells.filter(s => s !== spellName));
    } else if (selectedSpells.length < spellsToLearn) {
      setSelectedSpells([...selectedSpells, spellName]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedSpells);
  };

  // Prepared casters don't need to select spells during level-up
  if (preparationType === 'prepared') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medieval text-lg text-gold">Spellcasting</h3>
          <p className="text-parchment/70 text-sm">
            As a {CLASS_NAMES[character.characterClass]}, you prepare spells daily from your full spell list.
            You don't need to choose specific spells to learn.
          </p>
        </div>
        <button
          onClick={() => onSelect([])}
          className="px-4 py-2 rounded bg-gold text-dark-wood font-semibold hover:bg-amber-400 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  // Group spells by level
  const spellsByLevel: Record<number, typeof availableSpells> = {};
  availableSpells.forEach(spell => {
    if (!spellsByLevel[spell.level]) {
      spellsByLevel[spell.level] = [];
    }
    spellsByLevel[spell.level].push(spell);
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">
          {preparationType === 'spellbook' ? 'Add Spells to Spellbook' : 'Learn New Spells'}
        </h3>
        <p className="text-parchment/70 text-sm">
          {preparationType === 'spellbook'
            ? `Add ${spellsToLearn} new spells to your spellbook.`
            : `Choose ${spellsToLearn} new spell${spellsToLearn > 1 ? 's' : ''} to learn.`
          }
          {' '}Selected: {selectedSpells.length}/{spellsToLearn}
        </p>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {Object.entries(spellsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, spells]) => (
          <div key={level}>
            <h4 className="text-gold text-sm font-semibold mb-2 sticky top-0 bg-dark-wood py-1">
              Level {level} Spells
            </h4>
            <div className="space-y-1">
              {spells.map(spell => {
                const isSelected = selectedSpells.includes(spell.name);
                return (
                  <button
                    key={spell.name}
                    onClick={() => toggleSpell(spell.name)}
                    disabled={!isSelected && selectedSpells.length >= spellsToLearn}
                    className={`w-full p-3 rounded border text-left transition-colors ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                        : selectedSpells.length >= spellsToLearn
                        ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                        : 'border-leather bg-dark-wood hover:border-gold/50'
                    }`}
                  >
                    <div className="font-semibold">{spell.name}</div>
                    <p className="text-sm text-parchment/70">{spell.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedSpells.length !== spellsToLearn}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedSpells.length === spellsToLearn
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Spell Selection
      </button>
    </div>
  );
}
