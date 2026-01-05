import { useState } from 'react';
import type { Character } from '../../types';
import { Button } from '../ui/Button';
import {
  CLASS_SUBCLASSES,
  CLASS_NAMES,
  type SubclassInfo,
} from '../../data/dndData';

interface SubclassSelectionProps {
  character: Character;
  onSelect: (subclassName: string, choices?: Record<string, string[]>) => void;
}

export function SubclassSelection({ character, onSelect }: SubclassSelectionProps) {
  const subclasses = CLASS_SUBCLASSES[character.characterClass] || [];
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassInfo | null>(null);
  const [subclassChoices, setSubclassChoices] = useState<Record<string, string[]>>({});
  const [expandedSubclass, setExpandedSubclass] = useState<string | null>(null);

  const handleSubclassSelect = (subclass: SubclassInfo) => {
    setSelectedSubclass(subclass);
    // Reset choices when selecting a new subclass
    setSubclassChoices({});
  };

  const handleChoiceSelect = (choiceId: string, optionId: string, maxSelections: number) => {
    setSubclassChoices(prev => {
      const currentSelections = prev[choiceId] || [];

      if (currentSelections.includes(optionId)) {
        // Remove if already selected
        return {
          ...prev,
          [choiceId]: currentSelections.filter(id => id !== optionId),
        };
      } else if (currentSelections.length < maxSelections) {
        // Add if under limit
        return {
          ...prev,
          [choiceId]: [...currentSelections, optionId],
        };
      }
      return prev;
    });
  };

  const areChoicesComplete = (): boolean => {
    if (!selectedSubclass?.choices) return true;

    return selectedSubclass.choices.every(choice => {
      const selections = subclassChoices[choice.id] || [];
      return selections.length === choice.count;
    });
  };

  const handleConfirm = () => {
    if (selectedSubclass && areChoicesComplete()) {
      onSelect(selectedSubclass.name, subclassChoices);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Choose Your Subclass</h3>
        <p className="text-parchment/70 text-sm mt-1">
          At level 3, you specialize in a {CLASS_NAMES[character.characterClass]} tradition
        </p>
      </div>

      {/* Subclass Cards */}
      <div className="grid gap-3">
        {subclasses.map(subclass => (
          <div
            key={subclass.name}
            className={`p-4 rounded border transition-all cursor-pointer ${
              selectedSubclass?.name === subclass.name
                ? 'bg-gold/20 border-gold'
                : 'bg-dark-wood border-leather hover:border-gold/50'
            }`}
            onClick={() => handleSubclassSelect(subclass)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-gold font-semibold">{subclass.name}</h4>
                <p className="text-parchment/70 text-sm mt-1">{subclass.description}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSubclass(expandedSubclass === subclass.name ? null : subclass.name);
                }}
                className="text-gold/70 hover:text-gold text-sm ml-2"
              >
                {expandedSubclass === subclass.name ? '▼' : '▶'} Features
              </button>
            </div>

            {/* Expanded Features */}
            {expandedSubclass === subclass.name && (
              <div className="mt-3 pt-3 border-t border-leather">
                <div className="text-parchment/70 text-sm space-y-2">
                  {subclass.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gold">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subclass Choices (if applicable) */}
      {selectedSubclass?.choices && selectedSubclass.choices.length > 0 && (
        <div className="mt-4 p-4 bg-dark-wood rounded border border-leather">
          <h4 className="text-gold font-semibold mb-3">
            {selectedSubclass.name} Choices
          </h4>

          {selectedSubclass.choices.map(choice => (
            <div key={choice.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-parchment font-medium">{choice.name}</span>
                <span className="text-parchment/50 text-xs">
                  Select {choice.count} of {choice.options.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {choice.options.map(option => {
                  const isSelected = (subclassChoices[choice.id] || []).includes(option.id);
                  const isDisabled = !isSelected &&
                    (subclassChoices[choice.id] || []).length >= choice.count;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleChoiceSelect(choice.id, option.id, choice.count)}
                      disabled={isDisabled}
                      className={`p-2 text-left rounded border text-sm transition-colors ${
                        isSelected
                          ? 'bg-gold/30 border-gold text-gold'
                          : isDisabled
                          ? 'bg-dark-wood/50 border-leather/30 text-parchment/30 cursor-not-allowed'
                          : 'bg-leather/30 border-leather text-parchment hover:border-gold/50'
                      }`}
                    >
                      <div className="font-medium">{option.name}</div>
                      {option.description && (
                        <div className="text-xs text-parchment/60 mt-1">
                          {option.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Subclass Summary */}
      {selectedSubclass && (
        <div className="p-3 bg-gold/10 rounded border border-gold/30">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gold font-semibold">{selectedSubclass.name}</span>
              {subclassChoices && Object.keys(subclassChoices).length > 0 && (
                <div className="text-parchment/70 text-xs mt-1">
                  {Object.entries(subclassChoices).map(([choiceId, selections]) => {
                    const choice = selectedSubclass.choices?.find(c => c.id === choiceId);
                    if (!choice) return null;
                    const selectedNames = selections.map(
                      sel => choice.options.find(o => o.id === sel)?.name
                    ).filter(Boolean);
                    return (
                      <div key={choiceId}>
                        {choice.name}: {selectedNames.join(', ')}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!areChoicesComplete()}
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
