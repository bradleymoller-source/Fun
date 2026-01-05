import { useState } from 'react';
import type { Character } from '../../types';
import { Button } from '../ui/Button';
import {
  WEAPON_MASTERIES,
  WEAPON_MASTERY_DESCRIPTIONS,
  getWeaponMasteryCount,
  CLASS_NAMES,
  type WeaponMasteryType,
} from '../../data/dndData';

interface WeaponMasterySelectionProps {
  character: Character;
  onSelect: (weaponMasteries: string[]) => void;
}

export function WeaponMasterySelection({ character, onSelect }: WeaponMasterySelectionProps) {
  const masteryCount = getWeaponMasteryCount(character.characterClass);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [expandedMastery, setExpandedMastery] = useState<WeaponMasteryType | null>(null);

  // Get weapons the character is proficient with
  const proficientWeapons = getWeaponsForClass(character.characterClass);

  const handleWeaponToggle = (weaponName: string) => {
    setSelectedWeapons(prev => {
      if (prev.includes(weaponName)) {
        return prev.filter(w => w !== weaponName);
      } else if (prev.length < masteryCount) {
        return [...prev, weaponName];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedWeapons.length === masteryCount) {
      onSelect(selectedWeapons);
    }
  };

  // Group weapons by mastery type for display
  const weaponsByMastery: Record<WeaponMasteryType, string[]> = {} as Record<WeaponMasteryType, string[]>;
  for (const weapon of proficientWeapons) {
    const mastery = WEAPON_MASTERIES[weapon];
    if (mastery) {
      if (!weaponsByMastery[mastery]) {
        weaponsByMastery[mastery] = [];
      }
      weaponsByMastery[mastery].push(weapon);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-medieval text-xl text-gold">Weapon Mastery</h3>
        <p className="text-parchment/70 text-sm mt-1">
          Choose {masteryCount} weapon{masteryCount > 1 ? 's' : ''} to master
        </p>
      </div>

      <div className="p-4 bg-dark-wood rounded border border-leather mb-4">
        <div className="flex justify-between items-center">
          <span className="text-parchment">Weapons to master:</span>
          <span className="text-gold font-bold">
            {selectedWeapons.length} / {masteryCount}
          </span>
        </div>
        <p className="text-parchment/60 text-xs mt-2">
          As a {CLASS_NAMES[character.characterClass]}, you can master special combat techniques with
          your chosen weapons.
        </p>
      </div>

      {/* Mastery Type Legend */}
      <div className="p-3 bg-leather/20 rounded border border-leather/50 mb-4">
        <div className="text-parchment/80 text-xs font-semibold mb-2">Mastery Types (click to expand):</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(weaponsByMastery).map(mastery => (
            <button
              key={mastery}
              onClick={() => setExpandedMastery(expandedMastery === mastery as WeaponMasteryType ? null : mastery as WeaponMasteryType)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                expandedMastery === mastery
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-900/30 text-orange-300 hover:bg-orange-900/50'
              }`}
            >
              {mastery}
            </button>
          ))}
        </div>
        {expandedMastery && (
          <p className="text-parchment/70 text-xs mt-2 p-2 bg-dark-wood/50 rounded">
            <strong>{expandedMastery}:</strong> {WEAPON_MASTERY_DESCRIPTIONS[expandedMastery]}
          </p>
        )}
      </div>

      {/* Weapon Selection */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {proficientWeapons.map(weapon => {
          const mastery = WEAPON_MASTERIES[weapon];
          const isSelected = selectedWeapons.includes(weapon);
          const isDisabled = !isSelected && selectedWeapons.length >= masteryCount;

          return (
            <div
              key={weapon}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-orange-900/30 border-orange-500'
                  : isDisabled
                  ? 'bg-dark-wood/50 border-leather/30 opacity-50 cursor-not-allowed'
                  : 'bg-leather/30 border-leather hover:border-orange-500/50'
              }`}
              onClick={() => !isDisabled && handleWeaponToggle(weapon)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={isSelected ? 'text-orange-300 font-semibold' : 'text-parchment'}>
                    {weapon}
                  </span>
                  <span className="text-xs bg-orange-900/50 text-orange-300 px-1.5 py-0.5 rounded">
                    {mastery}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-xs bg-orange-600/50 text-orange-200 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Selection Summary */}
      {selectedWeapons.length > 0 && (
        <div className="p-3 bg-orange-900/20 rounded border border-orange-500/30 mt-4">
          <div className="text-orange-300 text-sm font-semibold mb-1">Selected Masteries:</div>
          <div className="flex flex-wrap gap-2">
            {selectedWeapons.map(weapon => (
              <span key={weapon} className="bg-orange-900/40 text-orange-200 px-2 py-1 rounded text-sm">
                {weapon} ({WEAPON_MASTERIES[weapon]})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirm */}
      <div className="p-3 bg-orange-900/20 rounded border border-orange-500/30">
        <div className="flex justify-between items-center">
          <div className="text-parchment text-sm">
            {selectedWeapons.length === masteryCount
              ? 'Ready to confirm your weapon masteries'
              : `Select ${masteryCount - selectedWeapons.length} more weapon${
                  masteryCount - selectedWeapons.length > 1 ? 's' : ''
                }`}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={selectedWeapons.length !== masteryCount}
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

// Helper to get weapons a class is proficient with
function getWeaponsForClass(characterClass: string): string[] {
  // Classes that get martial weapons
  const martialClasses = ['barbarian', 'fighter', 'paladin', 'ranger'];
  // All classes get simple weapons
  const simpleWeapons = [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer',
    'Mace', 'Quarterstaff', 'Sickle', 'Spear', 'Light Crossbow', 'Shortbow', 'Sling'
  ];
  const martialWeapons = [
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd',
    'Lance', 'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier', 'Scimitar',
    'Shortsword', 'Trident', 'Warhammer', 'War Pick', 'Whip',
    'Blowgun', 'Hand Crossbow', 'Heavy Crossbow', 'Longbow'
  ];

  // Monk gets simple weapons + shortsword
  if (characterClass === 'monk') {
    return [...simpleWeapons, 'Shortsword'];
  }

  if (martialClasses.includes(characterClass)) {
    return [...simpleWeapons, ...martialWeapons];
  }

  return simpleWeapons;
}
