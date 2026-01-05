import { useState } from 'react';
import type { Character } from '../../types';
import { getAvailableInvocations, getInvocationsKnownAtLevel } from '../../data/dndData';

interface InvocationSelectionProps {
  character: Character;
  newLevel: number;
  currentInvocations: string[];
  onSelect: (invocations: string[]) => void;
}

export function InvocationSelection({ character, newLevel, currentInvocations, onSelect }: InvocationSelectionProps) {
  const [selectedInvocations, setSelectedInvocations] = useState<string[]>([]);

  const invocationsToLearn = getInvocationsKnownAtLevel(newLevel) - getInvocationsKnownAtLevel(character.level);
  const availableInvocations = getAvailableInvocations(newLevel)
    .filter(inv => !currentInvocations.includes(inv.id));

  // Filter out invocations with unmet prerequisites
  const eligibleInvocations = availableInvocations.filter(inv => {
    if (!inv.prerequisite) return true;

    // Check Pact Boon prerequisites
    if (inv.prerequisite.includes('Pact of the')) {
      const requiredPact = inv.prerequisite.replace('Pact of the ', '').toLowerCase();
      return character.pactBoon?.toLowerCase().includes(requiredPact);
    }

    // Check Eldritch Blast prerequisite
    if (inv.prerequisite === 'Eldritch Blast cantrip') {
      return character.cantripsKnown?.includes('Eldritch Blast');
    }

    return true;
  });

  const toggleInvocation = (invocationId: string) => {
    if (selectedInvocations.includes(invocationId)) {
      setSelectedInvocations(selectedInvocations.filter(i => i !== invocationId));
    } else if (selectedInvocations.length < invocationsToLearn) {
      setSelectedInvocations([...selectedInvocations, invocationId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedInvocations);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Learn Eldritch Invocations</h3>
        <p className="text-parchment/70 text-sm">
          Choose {invocationsToLearn} Eldritch Invocation{invocationsToLearn > 1 ? 's' : ''}.
          {' '}Selected: {selectedInvocations.length}/{invocationsToLearn}
        </p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {eligibleInvocations.map(invocation => {
          const isSelected = selectedInvocations.includes(invocation.id);
          return (
            <button
              key={invocation.id}
              onClick={() => toggleInvocation(invocation.id)}
              disabled={!isSelected && selectedInvocations.length >= invocationsToLearn}
              className={`w-full p-3 rounded border text-left transition-colors ${
                isSelected
                  ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                  : selectedInvocations.length >= invocationsToLearn
                  ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                  : 'border-leather bg-dark-wood hover:border-gold/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold">{invocation.name}</span>
                {invocation.prerequisite && (
                  <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded ml-2">
                    {invocation.prerequisite}
                  </span>
                )}
              </div>
              <p className="text-sm text-parchment/70 mt-1">{invocation.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedInvocations.length !== invocationsToLearn}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedInvocations.length === invocationsToLearn
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Invocations
      </button>
    </div>
  );
}
