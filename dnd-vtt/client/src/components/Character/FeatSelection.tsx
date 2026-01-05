import { useState } from 'react';
import type { Character, AbilityScores } from '../../types';
import { GENERAL_FEATS, getAvailableFeats, ABILITY_NAMES, type GeneralFeat } from '../../data/dndData';

interface FeatSelectionProps {
  character: Character;
  onSelect: (feat: GeneralFeat, abilityChoice?: keyof AbilityScores) => void;
  onCancel: () => void;
}

export function FeatSelection({ character, onSelect, onCancel }: FeatSelectionProps) {
  const [selectedFeat, setSelectedFeat] = useState<GeneralFeat | null>(null);
  const [abilityChoice, setAbilityChoice] = useState<keyof AbilityScores | null>(null);

  const availableFeats = getAvailableFeats(character);

  // Filter out feats the character already has
  const existingFeatNames = character.features
    .filter(f => f.source === 'Feat')
    .map(f => f.name);
  const selectableFeats = availableFeats.filter(f => !existingFeatNames.includes(f.name));

  const handleFeatClick = (feat: GeneralFeat) => {
    if (feat.abilityBonus?.ability === 'choice') {
      setSelectedFeat(feat);
      setAbilityChoice(null);
    } else {
      onSelect(feat);
    }
  };

  const handleConfirm = () => {
    if (selectedFeat && abilityChoice) {
      onSelect(selectedFeat, abilityChoice);
    }
  };

  // If a feat with ability choice is selected, show the ability selection
  if (selectedFeat && selectedFeat.abilityBonus?.ability === 'choice') {
    const abilities = Object.keys(character.abilityScores) as (keyof AbilityScores)[];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medieval text-lg text-gold">{selectedFeat.name}</h3>
          <p className="text-parchment/70 text-sm">{selectedFeat.description}</p>
        </div>

        <div className="bg-dark-wood p-3 rounded border border-leather">
          <div className="text-parchment text-sm mb-2">Benefits:</div>
          <ul className="space-y-1">
            {selectedFeat.benefits.map((benefit, idx) => (
              <li key={idx} className="text-parchment/80 text-sm flex items-start gap-2">
                <span className="text-green-400">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-2">Choose Ability Score (+1)</h4>
          <div className="grid grid-cols-3 gap-2">
            {abilities.map(ability => {
              const currentScore = character.abilityScores[ability];
              const atMax = currentScore >= 20;

              return (
                <button
                  key={ability}
                  onClick={() => !atMax && setAbilityChoice(ability)}
                  disabled={atMax}
                  className={`p-3 rounded border transition-colors ${
                    abilityChoice === ability
                      ? 'bg-gold text-dark-wood border-gold font-bold'
                      : atMax
                      ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                      : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                  }`}
                >
                  <div className="text-sm">{ABILITY_NAMES[ability].slice(0, 3).toUpperCase()}</div>
                  <div className="text-lg font-bold">{currentScore}</div>
                  {abilityChoice === ability && (
                    <div className="text-xs text-green-600">→ {currentScore + 1}</div>
                  )}
                  {atMax && <div className="text-xs">(max)</div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFeat(null)}
            className="px-4 py-2 rounded border border-leather text-parchment hover:border-gold transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!abilityChoice}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              abilityChoice
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

  // Show feat list
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medieval text-lg text-gold">Choose a Feat</h3>
          <p className="text-parchment/70 text-sm">
            Select a feat to gain new abilities
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded border border-leather text-parchment hover:border-gold transition-colors text-sm"
        >
          ← Back to ASI
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {selectableFeats.map(feat => (
          <button
            key={feat.name}
            onClick={() => handleFeatClick(feat)}
            className="w-full p-4 rounded border border-leather bg-dark-wood hover:border-gold hover:bg-leather/30 transition-colors text-left"
          >
            <div className="flex justify-between items-start">
              <div className="text-gold font-semibold">{feat.name}</div>
              {feat.abilityBonus && (
                <span className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded">
                  +1 {feat.abilityBonus.ability === 'choice' ? 'Choice' : ABILITY_NAMES[feat.abilityBonus.ability].slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-parchment/80 text-sm mt-1">{feat.description}</p>
            <ul className="mt-2 space-y-1">
              {feat.benefits.slice(0, 2).map((benefit, idx) => (
                <li key={idx} className="text-xs text-parchment/60 flex items-start gap-1">
                  <span className="text-green-400">•</span>
                  {benefit}
                </li>
              ))}
              {feat.benefits.length > 2 && (
                <li className="text-xs text-parchment/40">+{feat.benefits.length - 2} more...</li>
              )}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
