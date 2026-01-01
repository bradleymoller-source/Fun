import type { Character, CharacterClass } from '../../types';

// Spell slots by class and level (standard D&D 5e 2024)
// Format: spellSlots[classLevel - 1][spellLevel - 1] = number of slots
const FULL_CASTER_SLOTS = [
  [2],                          // Level 1
  [3],                          // Level 2
  [4, 2],                       // Level 3
  [4, 3],                       // Level 4
  [4, 3, 2],                    // Level 5
  [4, 3, 3],                    // Level 6
  [4, 3, 3, 1],                 // Level 7
  [4, 3, 3, 2],                 // Level 8
  [4, 3, 3, 3, 1],              // Level 9
  [4, 3, 3, 3, 2],              // Level 10
  [4, 3, 3, 3, 2, 1],           // Level 11
  [4, 3, 3, 3, 2, 1],           // Level 12
  [4, 3, 3, 3, 2, 1, 1],        // Level 13
  [4, 3, 3, 3, 2, 1, 1],        // Level 14
  [4, 3, 3, 3, 2, 1, 1, 1],     // Level 15
  [4, 3, 3, 3, 2, 1, 1, 1],     // Level 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1],  // Level 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1],  // Level 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1],  // Level 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1],  // Level 20
];

const HALF_CASTER_SLOTS = [
  [],                           // Level 1
  [2],                          // Level 2
  [3],                          // Level 3
  [3],                          // Level 4
  [4, 2],                       // Level 5
  [4, 2],                       // Level 6
  [4, 3],                       // Level 7
  [4, 3],                       // Level 8
  [4, 3, 2],                    // Level 9
  [4, 3, 2],                    // Level 10
  [4, 3, 3],                    // Level 11
  [4, 3, 3],                    // Level 12
  [4, 3, 3, 1],                 // Level 13
  [4, 3, 3, 1],                 // Level 14
  [4, 3, 3, 2],                 // Level 15
  [4, 3, 3, 2],                 // Level 16
  [4, 3, 3, 3, 1],              // Level 17
  [4, 3, 3, 3, 1],              // Level 18
  [4, 3, 3, 3, 2],              // Level 19
  [4, 3, 3, 3, 2],              // Level 20
];

// Warlock pact magic slots
const WARLOCK_SLOTS: Record<number, { slots: number; level: number }> = {
  1: { slots: 1, level: 1 },
  2: { slots: 2, level: 1 },
  3: { slots: 2, level: 2 },
  4: { slots: 2, level: 2 },
  5: { slots: 2, level: 3 },
  6: { slots: 2, level: 3 },
  7: { slots: 2, level: 4 },
  8: { slots: 2, level: 4 },
  9: { slots: 2, level: 5 },
  10: { slots: 2, level: 5 },
  11: { slots: 3, level: 5 },
  12: { slots: 3, level: 5 },
  13: { slots: 3, level: 5 },
  14: { slots: 3, level: 5 },
  15: { slots: 3, level: 5 },
  16: { slots: 3, level: 5 },
  17: { slots: 4, level: 5 },
  18: { slots: 4, level: 5 },
  19: { slots: 4, level: 5 },
  20: { slots: 4, level: 5 },
};

// Classes and their caster type
const CASTER_TYPE: Record<CharacterClass, 'full' | 'half' | 'warlock' | 'none'> = {
  barbarian: 'none',
  bard: 'full',
  cleric: 'full',
  druid: 'full',
  fighter: 'none', // Eldritch Knight is 1/3 but we'll skip for simplicity
  monk: 'none',
  paladin: 'half',
  ranger: 'half',
  rogue: 'none', // Arcane Trickster is 1/3 but we'll skip for simplicity
  sorcerer: 'full',
  warlock: 'warlock',
  wizard: 'full',
};

interface SpellSlotTrackerProps {
  character: Character;
  onUpdateSlots: (spellSlotsUsed: number[]) => void;
}

export function SpellSlotTracker({ character, onUpdateSlots }: SpellSlotTrackerProps) {
  const casterType = CASTER_TYPE[character.characterClass];

  // Non-casters don't need spell slots
  if (casterType === 'none') {
    return null;
  }

  // Get max slots for the character
  const getMaxSlots = (): number[] => {
    if (casterType === 'warlock') {
      const pactInfo = WARLOCK_SLOTS[character.level];
      const slots = new Array(9).fill(0);
      slots[pactInfo.level - 1] = pactInfo.slots;
      return slots;
    } else if (casterType === 'full') {
      return FULL_CASTER_SLOTS[character.level - 1] || [];
    } else if (casterType === 'half') {
      return HALF_CASTER_SLOTS[character.level - 1] || [];
    }
    return [];
  };

  const maxSlots = getMaxSlots();
  const usedSlots = character.spellSlotsUsed || new Array(9).fill(0);

  // Use a slot
  const handleUseSlot = (slotLevel: number) => {
    const newUsed = [...usedSlots];
    const max = maxSlots[slotLevel] || 0;
    if (newUsed[slotLevel] < max) {
      newUsed[slotLevel] = (newUsed[slotLevel] || 0) + 1;
      onUpdateSlots(newUsed);
    }
  };

  // Recover a slot
  const handleRecoverSlot = (slotLevel: number) => {
    const newUsed = [...usedSlots];
    if ((newUsed[slotLevel] || 0) > 0) {
      newUsed[slotLevel] = newUsed[slotLevel] - 1;
      onUpdateSlots(newUsed);
    }
  };

  // Recover all slots (for long rest)
  const handleRecoverAll = () => {
    onUpdateSlots(new Array(9).fill(0));
  };

  // Get the effective slots to display (skip empty spell levels)
  const slotsToDisplay = maxSlots.map((max, index) => ({
    level: index + 1,
    max,
    used: usedSlots[index] || 0,
  })).filter(slot => slot.max > 0);

  if (slotsToDisplay.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-wood p-3 rounded border border-leather">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-gold font-bold text-sm">
          {casterType === 'warlock' ? 'Pact Magic' : 'Spell Slots'}
        </h4>
        <button
          onClick={handleRecoverAll}
          className="text-xs text-parchment/60 hover:text-parchment px-2 py-0.5 bg-leather/30 rounded"
          title="Recover all slots"
        >
          Recover All
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slotsToDisplay.map(({ level, max, used }) => {
          const available = max - used;

          return (
            <div key={level} className="text-center">
              <div className="text-parchment/60 text-xs mb-1">
                {casterType === 'warlock' ? 'Pact' : `${level}${getOrdinalSuffix(level)}`}
              </div>

              {/* Slot circles */}
              <div className="flex justify-center gap-1 mb-1">
                {Array.from({ length: max }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => i < available ? handleUseSlot(level - 1) : handleRecoverSlot(level - 1)}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      i < available
                        ? 'bg-purple-500 border-purple-400 hover:bg-purple-400'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    title={i < available ? 'Use slot' : 'Recover slot'}
                  />
                ))}
              </div>

              {/* Available count */}
              <div className="text-xs text-parchment/80">
                {available}/{max}
              </div>
            </div>
          );
        })}
      </div>

      {casterType === 'warlock' && (
        <div className="mt-2 text-center text-parchment/50 text-xs">
          Slots recover on Short Rest
        </div>
      )}
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
