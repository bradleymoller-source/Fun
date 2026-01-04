import { useState } from 'react';
import { Button } from '../ui/Button';
import type { Character, CharacterClass } from '../../types';

// Hit dice by class
const HIT_DICE: Record<CharacterClass, number> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};

interface RestButtonsProps {
  character: Character;
  onUpdateCharacter: (updates: Partial<Character>) => void;
}

export function RestButtons({ character, onUpdateCharacter }: RestButtonsProps) {
  const [showShortRest, setShowShortRest] = useState(false);
  const [showLongRest, setShowLongRest] = useState(false);
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [healingRolled, setHealingRolled] = useState<number | null>(null);

  const hitDie = HIT_DICE[character.characterClass];
  const conMod = Math.floor((character.abilityScores.constitution - 10) / 2);

  // Calculate available hit dice
  const hitDiceAvailable = character.hitDiceRemaining;
  const maxHitDice = character.hitDiceTotal;

  // Roll hit dice for healing
  const rollHitDice = () => {
    if (hitDiceToSpend <= 0 || hitDiceToSpend > hitDiceAvailable) return;

    let totalHealing = 0;
    for (let i = 0; i < hitDiceToSpend; i++) {
      const roll = Math.floor(Math.random() * hitDie) + 1;
      totalHealing += roll + conMod;
    }

    // Ensure minimum of 0 healing (in case of negative CON mod)
    totalHealing = Math.max(0, totalHealing);
    setHealingRolled(totalHealing);
  };

  // Apply short rest healing
  const applyShortRest = () => {
    if (healingRolled === null) return;

    const newHp = Math.min(character.maxHitPoints, character.currentHitPoints + healingRolled);
    const newHitDice = hitDiceAvailable - hitDiceToSpend;

    // Build feature uses reset (only short rest features)
    const newFeatureUses = { ...character.featureUses };
    if (newFeatureUses) {
      Object.keys(newFeatureUses).forEach(key => {
        if (newFeatureUses[key]?.restoreOn === 'short') {
          newFeatureUses[key] = { ...newFeatureUses[key], used: 0 };
        }
      });
    }

    // Warlock spell slots recover on short rest
    const isWarlock = character.characterClass === 'warlock';
    const newSpellSlotsUsed = isWarlock ? new Array(9).fill(0) : character.spellSlotsUsed;

    onUpdateCharacter({
      currentHitPoints: newHp,
      hitDiceRemaining: newHitDice,
      featureUses: newFeatureUses,
      spellSlotsUsed: newSpellSlotsUsed,
    });

    // Reset modal state
    setShowShortRest(false);
    setHitDiceToSpend(0);
    setHealingRolled(null);
  };

  // Apply long rest
  const applyLongRest = () => {
    // Recover all HP
    const newHp = character.maxHitPoints;

    // Recover half of total hit dice (minimum 1)
    const hitDiceToRecover = Math.max(1, Math.floor(maxHitDice / 2));
    const newHitDice = Math.min(maxHitDice, hitDiceAvailable + hitDiceToRecover);

    // Recover all spell slots
    const newSpellSlotsUsed = new Array(9).fill(0);

    // Reset all feature uses
    const newFeatureUses = { ...character.featureUses };
    if (newFeatureUses) {
      Object.keys(newFeatureUses).forEach(key => {
        newFeatureUses[key] = { ...newFeatureUses[key], used: 0 };
      });
    }

    // Reset death saves
    const newDeathSaves = { successes: 0, failures: 0 };

    // Reduce exhaustion by 1 (if any)
    const newExhaustion = Math.max(0, (character.exhaustionLevel || 0) - 1);

    onUpdateCharacter({
      currentHitPoints: newHp,
      hitDiceRemaining: newHitDice,
      spellSlotsUsed: newSpellSlotsUsed,
      featureUses: newFeatureUses,
      deathSaves: newDeathSaves,
      exhaustionLevel: newExhaustion,
      conditions: character.conditions?.filter(c => c !== 'concentrating'),
      concentratingOn: null,
    });

    setShowLongRest(false);
  };

  return (
    <div className="space-y-3">
      {/* Rest Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowShortRest(true)}
          className="flex-1"
        >
          Short Rest
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowLongRest(true)}
          className="flex-1"
        >
          Long Rest
        </Button>
      </div>

      {/* Hit Dice Display */}
      <div className="bg-dark-wood p-2 rounded border border-leather">
        <div className="flex items-center justify-between">
          <span className="text-parchment/70 text-sm">Hit Dice</span>
          <span className="text-parchment font-bold">
            {hitDiceAvailable}/{maxHitDice} d{hitDie}
          </span>
        </div>
      </div>

      {/* Short Rest Modal */}
      {showShortRest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-wood p-6 rounded-lg border-2 border-leather max-w-md w-full mx-4">
            <h3 className="text-gold font-bold text-lg mb-4">Short Rest</h3>

            <div className="space-y-4">
              {/* Current HP */}
              <div className="flex justify-between text-parchment">
                <span>Current HP:</span>
                <span className="font-bold">{character.currentHitPoints}/{character.maxHitPoints}</span>
              </div>

              {/* Hit Dice Selection */}
              <div className="bg-leather/20 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-parchment">Spend Hit Dice:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHitDiceToSpend(Math.max(0, hitDiceToSpend - 1))}
                      className="w-6 h-6 bg-red-600 rounded text-white font-bold"
                      disabled={hitDiceToSpend <= 0}
                    >
                      −
                    </button>
                    <span className="text-parchment font-bold w-8 text-center">
                      {hitDiceToSpend}
                    </span>
                    <button
                      onClick={() => setHitDiceToSpend(Math.min(hitDiceAvailable, hitDiceToSpend + 1))}
                      className="w-6 h-6 bg-green-600 rounded text-white font-bold"
                      disabled={hitDiceToSpend >= hitDiceAvailable}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-parchment/60 text-xs text-center">
                  Available: {hitDiceAvailable}d{hitDie} | Each heals: 1d{hitDie}+{conMod}
                </div>

                {hitDiceToSpend > 0 && !healingRolled && (
                  <Button
                    size="sm"
                    onClick={rollHitDice}
                    className="w-full mt-2"
                  >
                    Roll {hitDiceToSpend}d{hitDie}+{hitDiceToSpend * conMod}
                  </Button>
                )}

                {healingRolled !== null && (
                  <div className="mt-3 text-center">
                    <div className="text-green-400 font-bold text-2xl">
                      +{healingRolled} HP
                    </div>
                    <div className="text-parchment/60 text-xs">
                      New HP: {Math.min(character.maxHitPoints, character.currentHitPoints + healingRolled)}
                    </div>
                  </div>
                )}
              </div>

              {/* What Recovers */}
              <div className="text-parchment/60 text-xs">
                <strong className="text-parchment">Recovers:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>HP from spent hit dice</li>
                  <li>Short rest features (Second Wind, etc.)</li>
                  {character.characterClass === 'warlock' && (
                    <li className="text-purple-400">Warlock spell slots</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowShortRest(false);
                  setHitDiceToSpend(0);
                  setHealingRolled(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={applyShortRest}
                disabled={healingRolled === null && hitDiceToSpend > 0}
                className="flex-1"
              >
                Complete Rest
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Long Rest Modal */}
      {showLongRest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-wood p-6 rounded-lg border-2 border-leather max-w-md w-full mx-4">
            <h3 className="text-gold font-bold text-lg mb-4">Long Rest</h3>

            <div className="space-y-4">
              {/* What Recovers */}
              <div className="bg-leather/20 p-3 rounded text-parchment">
                <strong className="text-gold">Will Recover:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All HP ({character.currentHitPoints} → {character.maxHitPoints})</li>
                  <li>
                    Hit Dice: +{Math.max(1, Math.floor(maxHitDice / 2))} (to {Math.min(maxHitDice, hitDiceAvailable + Math.max(1, Math.floor(maxHitDice / 2)))}/{maxHitDice})
                  </li>
                  <li>All spell slots</li>
                  <li>All feature uses</li>
                  <li>Death saves reset</li>
                  {(character.exhaustionLevel || 0) > 0 && (
                    <li className="text-yellow-400">
                      Exhaustion: {character.exhaustionLevel} → {(character.exhaustionLevel || 0) - 1}
                    </li>
                  )}
                  {character.concentratingOn && (
                    <li className="text-blue-400">Concentration ends</li>
                  )}
                </ul>
              </div>

              <div className="text-parchment/60 text-xs">
                A long rest requires at least 8 hours, with no more than 2 hours of light activity.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowLongRest(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={applyLongRest}
                className="flex-1"
              >
                Complete Long Rest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
