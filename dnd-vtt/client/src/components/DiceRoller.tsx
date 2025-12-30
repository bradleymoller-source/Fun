import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import type { DiceRoll } from '../types';

// Parse dice notation like "2d6+3", "d20", "4d8-2"
function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100 || sides < 1 || sides > 1000) return null;

  return { count, sides, modifier };
}

// Roll dice based on parsed notation
function rollDice(count: number, sides: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return rolls;
}

interface DiceRollerProps {
  onRoll: (roll: DiceRoll) => void;
  playerId: string;
  playerName: string;
  isDm: boolean;
}

export function DiceRoller({ onRoll, playerId, playerName, isDm }: DiceRollerProps) {
  const [notation, setNotation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const { diceHistory } = useSessionStore();

  const handleRoll = () => {
    const parsed = parseDiceNotation(notation.trim());
    if (!parsed) return;

    const rolls = rollDice(parsed.count, parsed.sides);
    const total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName,
      notation: notation.trim(),
      rolls,
      modifier: parsed.modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: isDm && isPrivate,
    };

    onRoll(roll);
    setNotation('');
  };

  const quickRoll = (dice: string) => {
    const parsed = parseDiceNotation(dice);
    if (!parsed) return;

    const rolls = rollDice(parsed.count, parsed.sides);
    const total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName,
      notation: dice,
      rolls,
      modifier: parsed.modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: isDm && isPrivate,
    };

    onRoll(roll);
  };

  return (
    <div className="space-y-3">
      {/* Quick Dice Buttons */}
      <div className="flex flex-wrap gap-2">
        {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((dice) => (
          <button
            key={dice}
            onClick={() => quickRoll(dice)}
            className="px-3 py-2 bg-leather text-parchment rounded hover:bg-gold hover:text-dark-wood font-medieval text-sm transition-colors"
          >
            {dice.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Custom Roll Input */}
      <div className="flex gap-2">
        <Input
          placeholder="2d6+3"
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          className="flex-1 text-sm py-2"
        />
        <Button size="sm" onClick={handleRoll} disabled={!parseDiceNotation(notation.trim())}>
          Roll
        </Button>
      </div>

      {/* DM Private Roll Option */}
      {isDm && (
        <label className="flex items-center gap-2 text-parchment text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4"
          />
          Private roll (DM only)
        </label>
      )}

      {/* Recent Rolls */}
      {diceHistory.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
          <h4 className="text-parchment/70 text-xs uppercase tracking-wide">Recent Rolls</h4>
          {diceHistory.slice(0, 10).map((roll) => (
            <div
              key={roll.id}
              className={`p-2 rounded text-sm ${
                roll.isPrivate ? 'bg-purple-900/30 border border-purple-500' : 'bg-dark-wood'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-parchment/70">{roll.playerName}</span>
                <span className="text-gold font-bold text-lg">{roll.total}</span>
              </div>
              <div className="text-parchment/50 text-xs">
                {roll.notation}: [{roll.rolls.join(', ')}]
                {roll.modifier !== 0 && ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
                {roll.isPrivate && <span className="text-purple-400 ml-2">(private)</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
