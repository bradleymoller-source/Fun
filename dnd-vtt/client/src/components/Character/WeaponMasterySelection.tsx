import { useState } from 'react';
import type { Character } from '../../types';
import { WEAPON_MASTERIES, WEAPON_MASTERY_DESCRIPTIONS, getWeaponMasteryCount, getProficientWeapons } from '../../data/dndData';

interface WeaponMasterySelectionProps {
  character: Character;
  onSelect: (weaponMasteries: string[]) => void;
}

export function WeaponMasterySelection({ character, onSelect }: WeaponMasterySelectionProps) {
  const [selectedMasteries, setSelectedMasteries] = useState<string[]>([]);

  const masteryCount = getWeaponMasteryCount(character.characterClass);
  const proficientWeapons = getProficientWeapons(character.characterClass);

  // Get weapons with their mastery types
  const availableWeapons = proficientWeapons
    .filter(weapon => WEAPON_MASTERIES[weapon])
    .map(weapon => ({
      name: weapon,
      mastery: WEAPON_MASTERIES[weapon],
    }));

  const toggleMastery = (weaponName: string) => {
    if (selectedMasteries.includes(weaponName)) {
      setSelectedMasteries(selectedMasteries.filter(w => w !== weaponName));
    } else if (selectedMasteries.length < masteryCount) {
      setSelectedMasteries([...selectedMasteries, weaponName]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedMasteries);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medieval text-lg text-gold">Choose Weapon Masteries</h3>
        <p className="text-parchment/70 text-sm">
          Choose {masteryCount} weapon{masteryCount > 1 ? 's' : ''} to master. Each weapon has a unique mastery property.
          {' '}Selected: {selectedMasteries.length}/{masteryCount}
        </p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {availableWeapons.map(({ name, mastery }) => {
          const isSelected = selectedMasteries.includes(name);
          const masteryDesc = WEAPON_MASTERY_DESCRIPTIONS[mastery] || mastery;
          return (
            <button
              key={name}
              onClick={() => toggleMastery(name)}
              disabled={!isSelected && selectedMasteries.length >= masteryCount}
              className={`w-full p-3 rounded border text-left transition-colors ${
                isSelected
                  ? 'border-orange-500 bg-orange-900/30 text-orange-300'
                  : selectedMasteries.length >= masteryCount
                  ? 'border-leather/50 bg-dark-wood/50 text-parchment/30 cursor-not-allowed'
                  : 'border-leather bg-dark-wood hover:border-gold/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{name}</span>
                <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded">
                  {mastery}
                </span>
              </div>
              <p className="text-sm text-parchment/70 mt-1">{masteryDesc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedMasteries.length !== masteryCount}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          selectedMasteries.length === masteryCount
            ? 'bg-gold text-dark-wood hover:bg-amber-400'
            : 'bg-leather/50 text-parchment/50 cursor-not-allowed'
        }`}
      >
        Confirm Weapon Masteries
      </button>
    </div>
  );
}
