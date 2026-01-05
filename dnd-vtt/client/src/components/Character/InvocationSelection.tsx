import { useState } from 'react';
import type { Character } from '../../types';
import { Button } from '../ui/Button';
import {
  getAvailableInvocations,
  getInvocationsKnownAtLevel,
} from '../../data/dndData';

interface InvocationSelectionProps {
  character: Character;
  newLevel: number;
  currentInvocations: string[]; // IDs of already known invocations
  onSelect: (invocationIds: string[]) => void;
}

export function InvocationSelection({
  character,
  newLevel,
  currentInvocations,
  onSelect,
}: InvocationSelectionProps) {
  const previousKnown = getInvocationsKnownAtLevel(character.level);
  const newKnown = getInvocationsKnownAtLevel(newLevel);
  const invocationsToLearn = newKnown - previousKnown;

  const [selectedInvocations, setSelectedInvocations] = useState<string[]>([]);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  // Get invocations available at this level, filter out already known
  const availableInvocations = getAvailableInvocations(newLevel).filter(
    inv => !currentInvocations.includes(inv.id)
  );

  const handleOptionToggle = (invocationId: string) => {
    setSelectedInvocations(prev => {
      if (prev.includes(invocationId)) {
        return prev.filter(id => id !== invocationId);
      } else if (prev.length < invocationsToLearn) {
        return [...prev, invocationId];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedInvocations.length === invocationsToLearn) {
      onSelect(selectedInvocations);
    }
  };

  const allInvocations = getAvailableInvocations(newLevel);
  const getInvocationById = (id: string) => allInvocations.find(inv => inv.id === id);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Eldritch Invocations</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose {invocationsToLearn} new invocation{invocationsToLearn > 1 ? 's' : ''} from your
          patron
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Invocations to learn:</span>
          <span className="text-gold font-bold">
            {selectedInvocations.length} / {invocationsToLearn}
          </span>
        </div>
        <p className="text-parchment/60 text-xs mt-2">
          Invocations grant you eldritch abilities from your otherworldly patron
        </p>
      </div>

      {/* Current Invocations (if any) */}
      {currentInvocations.length > 0 && (
        <div className="p-3 bg-purple-900/20 rounded border border-purple-500/30 mb-4">
          <div className="text-purple-300 text-sm font-semibold mb-1">Current Invocations:</div>
          <div className="flex flex-wrap gap-1">
            {currentInvocations.map(id => {
              const invocation = getInvocationById(id);
              return invocation ? (
                <span
                  key={id}
                  className="bg-purple-900/30 text-purple-200 px-2 py-0.5 rounded text-xs"
                >
                  {invocation.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Invocation Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {availableInvocations.map(invocation => {
          const isSelected = selectedInvocations.includes(invocation.id);
          const isDisabled = !isSelected && selectedInvocations.length >= invocationsToLearn;
          const hasPrereq = !!invocation.prerequisite;

          return (
            <div
              key={invocation.id}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gold/20 border-gold'
                  : isDisabled
                  ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                  : 'bg-leather/30 border-leather hover:border-gold/50'
              }`}
              onClick={() => !isDisabled && handleOptionToggle(invocation.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                      {invocation.name}
                    </span>
                    {invocation.levelRequired && invocation.levelRequired > 1 && (
                      <span className="text-xs bg-orange-900/50 text-orange-300 px-1.5 py-0.5 rounded">
                        Lvl {invocation.levelRequired}+
                      </span>
                    )}
                  </div>
                  {hasPrereq && (
                    <div className="text-parchment/50 text-xs mt-1">
                      Requires: {invocation.prerequisite}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedOption(expandedOption === invocation.id ? null : invocation.id);
                  }}
                  className="text-parchment/50 text-xs hover:text-gold ml-2"
                >
                  {expandedOption === invocation.id ? '▼' : 'ⓘ'}
                </button>
              </div>
              {expandedOption === invocation.id && (
                <p className="text-parchment/70 text-sm mt-2">{invocation.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-gold/10 rounded border border-gold/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedInvocations.length === invocationsToLearn
              ? `Learning: ${selectedInvocations
                  .map(id => getInvocationById(id)?.name)
                  .join(', ')}`
              : `Select ${invocationsToLearn - selectedInvocations.length} more invocation${
                  invocationsToLearn - selectedInvocations.length > 1 ? 's' : ''
                }`}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedInvocations.length !== invocationsToLearn}
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
