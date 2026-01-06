import { useState } from 'react';
import type { Character, CharacterClass } from '../../types';
import { Button } from '../ui/Button';
import {
  CLASS_NAMES,
  CLASS_CANTRIPS,
  getNewCantripsAtLevel,
} from '../../data/dndData';

interface CantripLearningProps {
  character: Character;
  newLevel: number;
  currentCantrips: string[];
  onSelect: (newCantrips: string[]) => void;
  cantripsToLearnOverride?: number;  // For subclass spellcasters
  spellListClass?: CharacterClass;    // Which class's cantrip list to use (e.g., 'wizard' for EK/AT)
}

export function CantripLearning({
  character,
  newLevel,
  currentCantrips,
  onSelect,
  cantripsToLearnOverride,
  spellListClass,
}: CantripLearningProps) {
  const cantripsToLearn = cantripsToLearnOverride ?? getNewCantripsAtLevel(character.characterClass, newLevel);
  const [selectedCantrips, setSelectedCantrips] = useState<string[]>([]);
  const [expandedCantrip, setExpandedCantrip] = useState<string | null>(null);

  // Get available cantrips - use spellListClass if provided (for subclass spellcasters)
  const cantripClass = spellListClass || character.characterClass;
  const availableCantrips = (CLASS_CANTRIPS[cantripClass] || [])
    .filter(cantrip => !currentCantrips.includes(cantrip.name));

  const handleCantripToggle = (cantripName: string) => {
    setSelectedCantrips(prev => {
      if (prev.includes(cantripName)) {
        return prev.filter(c => c !== cantripName);
      } else if (prev.length < cantripsToLearn) {
        return [...prev, cantripName];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedCantrips.length === cantripsToLearn) {
      onSelect(selectedCantrips);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Learn New Cantrips</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose {cantripsToLearn} new cantrip{cantripsToLearn > 1 ? 's' : ''} for your{' '}
          {CLASS_NAMES[character.characterClass]}
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Cantrips to learn:</span>
          <span className="text-gold font-bold">
            {selectedCantrips.length} / {cantripsToLearn}
          </span>
        </div>
      </div>

      {/* Cantrip Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {availableCantrips.map(cantrip => {
          const isSelected = selectedCantrips.includes(cantrip.name);
          const isDisabled = !isSelected && selectedCantrips.length >= cantripsToLearn;

          return (
            <div
              key={cantrip.name}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gold/20 border-gold'
                  : isDisabled
                  ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                  : 'bg-leather/30 border-leather hover:border-gold/50'
              }`}
              onClick={() => !isDisabled && handleCantripToggle(cantrip.name)}
            >
              <div className="flex justify-between items-center">
                <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                  {cantrip.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCantrip(expandedCantrip === cantrip.name ? null : cantrip.name);
                  }}
                  className="text-parchment/50 text-xs hover:text-gold"
                >
                  {expandedCantrip === cantrip.name ? '▼' : 'ⓘ'}
                </button>
              </div>
              {expandedCantrip === cantrip.name && (
                <p className="text-parchment/70 text-sm mt-2">{cantrip.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-gold/10 rounded border border-gold/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedCantrips.length === cantripsToLearn
              ? `Learning: ${selectedCantrips.join(', ')}`
              : `Select ${cantripsToLearn - selectedCantrips.length} more cantrip${
                  cantripsToLearn - selectedCantrips.length > 1 ? 's' : ''
                }`}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedCantrips.length !== cantripsToLearn}
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
