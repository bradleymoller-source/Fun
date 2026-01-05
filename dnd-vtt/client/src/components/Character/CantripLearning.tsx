import { useState } from 'react';
import type { Character } from '../../types';
import { getNewCantripsAtLevel, CLASS_CANTRIPS, CLASS_NAMES } from '../../data/dndData';

interface CantripLearningProps {
  character: Character;
  newLevel: number;
  currentCantrips: string[];
  onSelect: (cantrips: string[]) => void;
}

export function CantripLearning({ character, newLevel, currentCantrips, onSelect }: CantripLearningProps) {
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);

  const cantripsToLearn = getNewCantripsAtLevel(character.characterClass, newLevel);
  const availableCantrips = (CLASS_CANTRIPS[character.characterClass] || [])
    .filter(c => !currentCantrips.includes(c.name));

  const toggleCantrip = (cantripName: string) => {
    if (selectedCantrips.includes(cantripName)) {
      setSelectedCantrips(selectedCantrips.filter(c => c !== cantripName));
    } else if (selectedCantrips.length < cantripsToLearn) {
      setSelectedCantrips([...selectedCantrips, cantripName]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedCantrips);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Learn New Cantrips</h3>
        <p className="text-parchment/70 text-sm">
          Choose {cantripsToLearn} new cantrip{cantripsToLearn > 1 ? 's' : ''} for your {CLASS_NAMES[character.characterClass]}.
          {' '}Selected: {selectedCantrips.length}/{cantripsToLearn}
        </p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {availableCantrips.map(cantrip => {
          const isSelected = selectedCantrips.includes(cantrip.name);
          return (
            <button
              key={cantrip.name}
              onClick={() => toggleCantrip(cantrip.name)}
              disabled={!isSelected && selectedCantrips.length >= cantripsToLearn}
              className={`w-full p-3 rounded border text-left transition-colors ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                  : selectedCantrips.length >= cantripsToLearn
                  ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                  : 'border-leather bg-dark-wood hover:border-gold/50'
              }`}
            >
              <div className="font-semibold">{cantrip.name}</div>
              <p className="text-sm text-parchment/70">{cantrip.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedCantrips.length !== cantripsToLearn}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedCantrips.length === cantripsToLearn
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Cantrip Selection
      </button>
    </div>
  );
}
