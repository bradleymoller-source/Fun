import { useState } from 'react';
import { Button } from '../ui/Button';
import { PACT_BOONS, type PactBoon } from '../../data/dndData';

interface PactBoonSelectionProps {
  onSelect: (pactBoonId: string) => void;
}

export function PactBoonSelection({ onSelect }: PactBoonSelectionProps) {
  const [selectedBoon, setSelectedBoon] = useState<string | null>(null);
  const [expandedBoon, setExpandedBoon] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedBoon) {
      onSelect(selectedBoon);
    }
  };

  const getSelectedBoon = (): PactBoon | undefined => {
    return PACT_BOONS.find(b => b.id === selectedBoon);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Pact Boon</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Your patron bestows a gift upon you. Choose your Pact Boon.
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <p className="text-parchment/80 text-sm">
          At 3rd level, your otherworldly patron grants you a magical gift. This choice is permanent
          and defines how you interact with your patron's power.
        </p>
      </div>

      {/* Pact Boon Options */}
      <div className="space-y-3">
        {PACT_BOONS.map(boon => {
          const isSelected = selectedBoon === boon.id;
          const isExpanded = expandedBoon === boon.id;

          return (
            <div
              key={boon.id}
              className={`p-4 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-purple-900/30 border-purple-500'
                  : 'bg-leather/30 border-leather hover:border-purple-500/50'
              }`}
              onClick={() => setSelectedBoon(boon.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isSelected ? 'text-purple-300' : 'text-parchment'}`}>
                      {boon.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs bg-purple-600/50 text-purple-200 px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-parchment/70 text-sm mt-1">{boon.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedBoon(isExpanded ? null : boon.id);
                  }}
                  className="text-parchment/50 text-xs hover:text-gold ml-2"
                >
                  {isExpanded ? '▼' : 'ⓘ'}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-leather/50">
                  <div className="text-parchment/60 text-xs font-semibold mb-2">Features:</div>
                  <ul className="space-y-1">
                    {boon.features.map((feature, idx) => (
                      <li key={idx} className="text-parchment/70 text-sm flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="p-3 bg-purple-900/20 rounded border border-purple-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedBoon
              ? `Chosen: ${getSelectedBoon()?.name}`
              : 'Select a Pact Boon to continue'}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBoon}
            variant="primary"
            size="sm"
          >
            Confirm Pact
          </Button>
        </div>
      </div>
    </div>
  );
}
