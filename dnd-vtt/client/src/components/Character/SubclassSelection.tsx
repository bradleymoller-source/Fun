import { useState } from 'react';
import type { Character } from '../../types';
import { CLASS_SUBCLASSES, CLASS_NAMES } from '../../data/dndData';

interface SubclassSelectionProps {
  character: Character;
  onSelect: (subclass: string, choices?: Record<string, string[]>) => void;
}

export function SubclassSelection({ character, onSelect }: SubclassSelectionProps) {
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [subclassChoices, setSubclassChoices] = useState<Record<string, string[]>>({});

  const subclasses = CLASS_SUBCLASSES[character.characterClass] || [];
  const selectedSubclassInfo = subclasses.find(s => s.name === selectedSubclass);

  const handleSubclassClick = (subclassName: string) => {
    const subclassInfo = subclasses.find(s => s.name === subclassName);
    if (subclassInfo?.choices && subclassInfo.choices.length > 0) {
      setSelectedSubclass(subclassName);
      setSubclassChoices({});
    } else {
      onSelect(subclassName);
    }
  };

  const handleChoiceSelect = (choiceId: string, optionId: string) => {
    const newChoices = { ...subclassChoices };
    if (!newChoices[choiceId]) {
      newChoices[choiceId] = [];
    }

    const choice = selectedSubclassInfo?.choices?.find(c => c.id === choiceId);
    const maxCount = choice?.count || 1;

    if (newChoices[choiceId].includes(optionId)) {
      newChoices[choiceId] = newChoices[choiceId].filter(id => id !== optionId);
    } else if (newChoices[choiceId].length < maxCount) {
      newChoices[choiceId] = [...newChoices[choiceId], optionId];
    }

    setSubclassChoices(newChoices);
  };

  const canConfirm = () => {
    if (!selectedSubclass || !selectedSubclassInfo?.choices) return false;
    return selectedSubclassInfo.choices.every(choice => {
      const selected = subclassChoices[choice.id] || [];
      return selected.length === choice.count;
    });
  };

  const handleConfirm = () => {
    if (selectedSubclass) {
      onSelect(selectedSubclass, subclassChoices);
    }
  };

  // If a subclass with choices is selected, show the choice UI
  if (selectedSubclass && selectedSubclassInfo?.choices) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medieval text-lg text-gold">{selectedSubclass}</h3>
          <p className="text-parchment/70 text-sm">{selectedSubclassInfo.description}</p>
        </div>

        {selectedSubclassInfo.choices.map(choice => (
          <div key={choice.id} className="space-y-2">
            <div>
              <h4 className="text-gold font-semibold">{choice.name}</h4>
              <p className="text-parchment/70 text-sm">
                {choice.description} (Select {choice.count})
              </p>
            </div>
            <div className="space-y-2">
              {choice.options.map(option => {
                const isSelected = subclassChoices[choice.id]?.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleChoiceSelect(choice.id, option.id)}
                    className={`w-full p-3 rounded border text-left transition-colors ${
                      isSelected
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-leather bg-dark-wood hover:border-gold/50'
                    }`}
                  >
                    <div className="font-semibold">{option.name}</div>
                    <p className="text-sm text-parchment/70">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSubclass(null)}
            className="px-4 py-2 rounded border border-leather text-parchment hover:border-gold transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              canConfirm()
                ? 'bg-gold text-dark-wood hover:bg-amber-400'
                : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // Show subclass list
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Your {CLASS_NAMES[character.characterClass]} Subclass</h3>
        <p className="text-parchment/70 text-sm">
          At 3rd level, you choose a specialization that shapes your abilities.
        </p>
      </div>

      <div className="space-y-2">
        {subclasses.map(subclass => (
          <button
            key={subclass.name}
            onClick={() => handleSubclassClick(subclass.name)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-gold hover:bg-leather/30 transition-colors text-left"
          >
            <div className="text-gold font-semibold">{subclass.name}</div>
            <p className="text-parchment/80 text-sm mt-1">{subclass.description}</p>
            <div className="mt-2 space-y-1">
              {subclass.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="text-xs text-parchment/60 flex items-start gap-1">
                  <span className="text-blue-400">◆</span>
                  {feature}
                </div>
              ))}
            </div>
            {subclass.choices && subclass.choices.length > 0 && (
              <div className="mt-2 text-xs text-purple-300">
                ★ Includes additional choices
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
