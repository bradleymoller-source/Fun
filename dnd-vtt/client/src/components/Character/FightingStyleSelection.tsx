import { useState } from 'react';
import type { CharacterClass } from '../../types';
import { Button } from '../ui/Button';
import { getAvailableFightingStyles, CLASS_NAMES, type FightingStyleOption } from '../../data/dndData';

interface FightingStyleSelectionProps {
  characterClass: CharacterClass;
  onSelect: (fightingStyleId: string) => void;
}

export function FightingStyleSelection({ characterClass, onSelect }: FightingStyleSelectionProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const availableStyles = getAvailableFightingStyles(characterClass);

  const handleConfirm = () => {
    if (selectedStyle) {
      onSelect(selectedStyle);
    }
  };

  const getSelectedStyle = (): FightingStyleOption | undefined => {
    return availableStyles.find(s => s.id === selectedStyle);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Fighting Style</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose a fighting style that defines your combat approach
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <p className="text-parchment/80 text-sm">
          As a {CLASS_NAMES[characterClass]}, you adopt a particular style of fighting as your
          specialty. This choice grants you specific combat benefits.
        </p>
      </div>

      {/* Fighting Style Options */}
      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
        {availableStyles.map(style => {
          const isSelected = selectedStyle === style.id;

          return (
            <div
              key={style.id}
              className={`p-4 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-red-900/30 border-red-500'
                  : 'bg-leather/30 border-leather hover:border-red-500/50'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${isSelected ? 'text-red-300' : 'text-parchment'}`}>
                  {style.name}
                </span>
                {isSelected && (
                  <span className="text-xs bg-red-600/50 text-red-200 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-parchment/70 text-sm">{style.description}</p>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedStyle
              ? `Chosen: ${getSelectedStyle()?.name}`
              : 'Select a Fighting Style to continue'}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStyle}
            variant="primary"
            size="sm"
          >
            Confirm Style
          </Button>
        </div>
      </div>
    </div>
  );
}
