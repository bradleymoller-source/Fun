import { useState } from 'react';
import type { Character } from '../../types';
import { Button } from '../ui/Button';
import {
  METAMAGIC_OPTIONS,
  getMetamagicKnownAtLevel,
} from '../../data/dndData';

interface MetamagicSelectionProps {
  character: Character;
  newLevel: number;
  currentMetamagic: string[]; // IDs of already known metamagic
  onSelect: (metamagicIds: string[]) => void;
}

export function MetamagicSelection({
  character,
  newLevel,
  currentMetamagic,
  onSelect,
}: MetamagicSelectionProps) {
  const previousKnown = getMetamagicKnownAtLevel(character.level);
  const newKnown = getMetamagicKnownAtLevel(newLevel);
  const metamagicToLearn = newKnown - previousKnown;

  const [selectedMetamagic, setSelectedMetamagic] = useState<string[]>([]);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  // Filter out already known metamagic
  const availableOptions = METAMAGIC_OPTIONS.filter(
    option => !currentMetamagic.includes(option.id)
  );

  const handleOptionToggle = (optionId: string) => {
    setSelectedMetamagic(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else if (prev.length < metamagicToLearn) {
        return [...prev, optionId];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedMetamagic.length === metamagicToLearn) {
      onSelect(selectedMetamagic);
    }
  };

  const getOptionById = (id: string) => METAMAGIC_OPTIONS.find(o => o.id === id);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Learn Metamagic</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose {metamagicToLearn} new Metamagic option{metamagicToLearn > 1 ? 's' : ''} to enhance
          your spells
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Metamagic to learn:</span>
          <span className="text-gold font-bold">
            {selectedMetamagic.length} / {metamagicToLearn}
          </span>
        </div>
        <p className="text-parchment/60 text-xs mt-2">
          Metamagic lets you twist spells using Sorcery Points
        </p>
      </div>

      {/* Current Metamagic (if any) */}
      {currentMetamagic.length > 0 && (
        <div className="p-3 bg-purple-900/20 rounded border border-purple-500/30 mb-4">
          <div className="text-purple-300 text-sm font-semibold mb-1">Current Metamagic:</div>
          <div className="flex flex-wrap gap-1">
            {currentMetamagic.map(id => {
              const option = getOptionById(id);
              return option ? (
                <span
                  key={id}
                  className="bg-purple-900/30 text-purple-200 px-2 py-0.5 rounded text-xs"
                >
                  {option.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Metamagic Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {availableOptions.map(option => {
          const isSelected = selectedMetamagic.includes(option.id);
          const isDisabled = !isSelected && selectedMetamagic.length >= metamagicToLearn;

          return (
            <div
              key={option.id}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gold/20 border-gold'
                  : isDisabled
                  ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                  : 'bg-leather/30 border-leather hover:border-gold/50'
              }`}
              onClick={() => !isDisabled && handleOptionToggle(option.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                    {option.name}
                  </span>
                  <span className="text-xs bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">
                    {option.cost} SP
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedOption(expandedOption === option.id ? null : option.id);
                  }}
                  className="text-parchment/50 text-xs hover:text-gold"
                >
                  {expandedOption === option.id ? '▼' : 'ⓘ'}
                </button>
              </div>
              {expandedOption === option.id && (
                <p className="text-parchment/70 text-sm mt-2">{option.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-gold/10 rounded border border-gold/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedMetamagic.length === metamagicToLearn
              ? `Learning: ${selectedMetamagic.map(id => getOptionById(id)?.name).join(', ')}`
              : `Select ${metamagicToLearn - selectedMetamagic.length} more option${
                  metamagicToLearn - selectedMetamagic.length > 1 ? 's' : ''
                }`}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedMetamagic.length !== metamagicToLearn}
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
