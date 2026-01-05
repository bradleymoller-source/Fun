import { useState } from 'react';
import type { Character } from '../../types';
import { getAvailableMetamagic, getMetamagicKnownAtLevel } from '../../data/dndData';

interface MetamagicSelectionProps {
  character: Character;
  newLevel: number;
  currentMetamagic: string[];
  onSelect: (metamagic: string[]) => void;
}

export function MetamagicSelection({ character, newLevel, currentMetamagic, onSelect }: MetamagicSelectionProps) {
  const [selectedMetamagic, setSelectedMetamagic] = useState<string[]>([]);

  const metamagicToLearn = getMetamagicKnownAtLevel(newLevel) - getMetamagicKnownAtLevel(character.level);
  const availableMetamagic = getAvailableMetamagic(newLevel)
    .filter(m => !currentMetamagic.includes(m.id));

  const toggleMetamagic = (metamagicId: string) => {
    if (selectedMetamagic.includes(metamagicId)) {
      setSelectedMetamagic(selectedMetamagic.filter(m => m !== metamagicId));
    } else if (selectedMetamagic.length < metamagicToLearn) {
      setSelectedMetamagic([...selectedMetamagic, metamagicId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedMetamagic);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Learn Metamagic</h3>
        <p className="text-parchment/70 text-sm">
          Choose {metamagicToLearn} Metamagic option{metamagicToLearn > 1 ? 's' : ''} to enhance your spells.
          {' '}Selected: {selectedMetamagic.length}/{metamagicToLearn}
        </p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {availableMetamagic.map(metamagic => {
          const isSelected = selectedMetamagic.includes(metamagic.id);
          return (
            <button
              key={metamagic.id}
              onClick={() => toggleMetamagic(metamagic.id)}
              disabled={!isSelected && selectedMetamagic.length >= metamagicToLearn}
              className={`w-full p-3 rounded border text-left transition-colors ${
                isSelected
                  ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                  : selectedMetamagic.length >= metamagicToLearn
                  ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                  : 'border-leather bg-dark-wood hover:border-gold/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{metamagic.name}</span>
                <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                  {metamagic.cost} SP
                </span>
              </div>
              <p className="text-sm text-parchment/70 mt-1">{metamagic.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedMetamagic.length !== metamagicToLearn}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedMetamagic.length === metamagicToLearn
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Metamagic
      </button>
    </div>
  );
}
