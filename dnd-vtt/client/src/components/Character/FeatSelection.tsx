import { useState } from 'react';
import type { Character, AbilityScores } from '../../types';
import { Button } from '../ui/Button';
import {
  getEligibleFeats,
  ABILITY_NAMES,
  type GeneralFeat,
} from '../../data/dndData';

interface FeatSelectionProps {
  character: Character;
  onSelect: (feat: GeneralFeat, abilityChoice?: keyof AbilityScores, featChoices?: Record<string, string[]>) => void;
  onCancel: () => void; // Go back to ASI
}

export function FeatSelection({ character, onSelect, onCancel }: FeatSelectionProps) {
  const eligibleFeats = getEligibleFeats(character);
  const [selectedFeat, setSelectedFeat] = useState<GeneralFeat | null>(null);
  const [expandedFeat, setExpandedFeat] = useState<string | null>(null);
  const [abilityChoice, setAbilityChoice] = useState<keyof AbilityScores | null>(null);
  const [featChoices, setFeatChoices] = useState<Record<string, string[]>>({});

  // Check if feat requires ability choice
  const requiresAbilityChoice = selectedFeat?.abilityBonus?.ability === 'choice';

  // Check if feat has other choices (like Elemental Adept damage type)
  const hasFeatChoices = selectedFeat?.choices && selectedFeat.choices.length > 0;

  // Check if all feat choices are made
  const allFeatChoicesMade = !hasFeatChoices || selectedFeat?.choices?.every(choice => {
    const selected = featChoices[choice.id] || [];
    return selected.length >= choice.count;
  });

  const handleConfirm = () => {
    if (selectedFeat) {
      const hasValidAbilityChoice = !requiresAbilityChoice || abilityChoice;
      const hasValidFeatChoices = allFeatChoicesMade;

      if (hasValidAbilityChoice && hasValidFeatChoices) {
        onSelect(selectedFeat, abilityChoice || undefined, hasFeatChoices ? featChoices : undefined);
      }
    }
  };

  const canConfirm = selectedFeat && (!requiresAbilityChoice || abilityChoice) && allFeatChoicesMade;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-medieval text-xl text-gold">Choose a Feat</h3>
          <p className="text-parchment/70 text-sm mt-1">
            Take a feat instead of an Ability Score Improvement
          </p>
        </div>
        <Button onClick={onCancel} variant="secondary" size="sm">
          ← Back to ASI
        </Button>
      </div>

      {/* Feat List */}
      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
        {eligibleFeats.map(feat => {
          const isSelected = selectedFeat?.name === feat.name;
          const hasPrereqs = feat.prerequisites && Object.keys(feat.prerequisites).length > 0;

          return (
            <div
              key={feat.name}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gold/20 border-gold'
                  : 'bg-dark-wood border-leather hover:border-gold/50'
              }`}
              onClick={() => {
                setSelectedFeat(feat);
                setAbilityChoice(null);
                setFeatChoices({});
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment font-medium'}>
                      {feat.name}
                    </span>
                    {feat.abilityBonus && (
                      <span className="text-xs bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">
                        +1 {feat.abilityBonus.ability === 'choice' ? 'ability' : ABILITY_NAMES[feat.abilityBonus.ability]}
                      </span>
                    )}
                  </div>
                  <p className="text-parchment/60 text-xs mt-1">{feat.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedFeat(expandedFeat === feat.name ? null : feat.name);
                  }}
                  className="text-parchment/50 text-xs hover:text-gold ml-2"
                >
                  {expandedFeat === feat.name ? '▼' : '▶'}
                </button>
              </div>

              {/* Expanded details */}
              {expandedFeat === feat.name && (
                <div className="mt-3 pt-3 border-t border-leather/50">
                  {hasPrereqs && (
                    <div className="text-xs text-parchment/50 mb-2">
                      Prerequisites: {formatPrerequisites(feat.prerequisites!)}
                    </div>
                  )}
                  <ul className="text-parchment/70 text-sm space-y-1">
                    {feat.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-gold">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ability Choice (if required) */}
      {selectedFeat && requiresAbilityChoice && (
        <div className="p-3 bg-dark-wood rounded border border-leather">
          <div className="text-parchment text-sm mb-2">
            Choose an ability score to increase by 1:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(character.abilityScores) as (keyof AbilityScores)[]).map(ability => {
              const score = character.abilityScores[ability];
              const atMax = score >= 20;

              return (
                <button
                  key={ability}
                  onClick={() => !atMax && setAbilityChoice(ability)}
                  disabled={atMax}
                  className={`p-2 rounded border transition-colors ${
                    abilityChoice === ability
                      ? 'bg-gold text-dark-wood border-gold font-bold'
                      : atMax
                      ? 'bg-dark-wood/50 text-parchment/30 border-leather/30 cursor-not-allowed'
                      : 'bg-leather/50 text-parchment border-leather hover:border-gold'
                  }`}
                >
                  <div className="text-xs">{ABILITY_NAMES[ability].slice(0, 3).toUpperCase()}</div>
                  <div className="font-bold">{score}</div>
                  {abilityChoice === ability && <div className="text-xs">→ {score + 1}</div>}
                  {atMax && <div className="text-xs">(max)</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feat Choices (e.g., Elemental Adept damage type) */}
      {selectedFeat && hasFeatChoices && selectedFeat.choices?.map(choice => {
        const selectedOptions = featChoices[choice.id] || [];
        return (
          <div key={choice.id} className="p-3 bg-dark-wood rounded border border-leather">
            <div className="text-parchment text-sm mb-2">
              {choice.name}: <span className="text-gold">{choice.description}</span>
            </div>
            <div className="grid gap-2">
              {choice.options.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const canSelect = selectedOptions.length < choice.count || isSelected;

                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (isSelected) {
                        setFeatChoices({
                          ...featChoices,
                          [choice.id]: selectedOptions.filter(id => id !== option.id)
                        });
                      } else if (canSelect) {
                        setFeatChoices({
                          ...featChoices,
                          [choice.id]: [...selectedOptions, option.id]
                        });
                      }
                    }}
                    disabled={!canSelect && !isSelected}
                    className={`p-2 rounded border text-left transition-colors ${
                      isSelected
                        ? 'bg-gold/20 border-gold'
                        : canSelect
                        ? 'bg-leather/30 border-leather hover:border-gold/50'
                        : 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={isSelected ? 'text-gold font-semibold' : 'text-parchment'}>
                        {option.name}
                      </span>
                      {isSelected && <span className="text-gold text-xs">✓</span>}
                    </div>
                    <p className="text-parchment/60 text-xs mt-1">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Feat Summary */}
      {selectedFeat && (
        <div className="p-3 bg-gold/10 rounded border border-gold/30">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gold font-semibold">{selectedFeat.name}</span>
              {selectedFeat.abilityBonus && (
                <span className="text-parchment/70 text-sm ml-2">
                  (+1 {abilityChoice ? ABILITY_NAMES[abilityChoice] :
                    selectedFeat.abilityBonus.ability === 'choice' ? '?' :
                    ABILITY_NAMES[selectedFeat.abilityBonus.ability as keyof AbilityScores]})
                </span>
              )}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              variant="primary"
              size="sm"
            >
              Take Feat
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {eligibleFeats.length === 0 && (
        <div className="p-4 bg-dark-wood rounded border border-leather text-center">
          <p className="text-parchment/70">
            No feats available. You may not meet the prerequisites for any feats.
          </p>
          <Button onClick={onCancel} variant="secondary" size="sm" className="mt-3">
            Take ASI Instead
          </Button>
        </div>
      )}
    </div>
  );
}

function formatPrerequisites(prereqs: NonNullable<GeneralFeat['prerequisites']>): string {
  const parts: string[] = [];

  if (prereqs.level) {
    parts.push(`Level ${prereqs.level}+`);
  }
  if (prereqs.abilityScore) {
    parts.push(`${ABILITY_NAMES[prereqs.abilityScore.ability]} ${prereqs.abilityScore.minimum}+`);
  }
  if (prereqs.spellcasting) {
    parts.push('Spellcasting ability');
  }
  if (prereqs.armorProficiency) {
    parts.push(`${prereqs.armorProficiency} armor proficiency`);
  }
  if (prereqs.proficiency) {
    parts.push(`${prereqs.proficiency} proficiency`);
  }

  return parts.join(', ');
}
