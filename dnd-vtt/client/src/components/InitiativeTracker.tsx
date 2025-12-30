import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import type { InitiativeEntry } from '../types';

interface InitiativeTrackerProps {
  isDm: boolean;
  onAddEntry: (entry: InitiativeEntry) => void;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<InitiativeEntry>) => void;
  onNextTurn: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
}

export function InitiativeTracker({
  isDm,
  onAddEntry,
  onRemoveEntry,
  onNextTurn,
  onStartCombat,
  onEndCombat,
}: InitiativeTrackerProps) {
  const { initiative, isInCombat } = useSessionStore();
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState('');
  const [isNpc, setIsNpc] = useState(true);

  const handleAddEntry = () => {
    if (!newName.trim() || !newInit.trim()) return;

    const initValue = parseInt(newInit, 10);
    if (isNaN(initValue)) return;

    const entry: InitiativeEntry = {
      id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName.trim(),
      initiative: initValue,
      isNpc,
      isActive: false,
    };

    onAddEntry(entry);
    setNewName('');
    setNewInit('');
  };

  return (
    <div className="space-y-3">
      {/* Combat Controls (DM only) */}
      {isDm && (
        <div className="flex gap-2 flex-wrap">
          {!isInCombat ? (
            <Button
              size="sm"
              onClick={onStartCombat}
              disabled={initiative.length === 0}
              className="flex-1"
            >
              Start Combat
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={onNextTurn} className="flex-1">
                Next Turn
              </Button>
              <Button size="sm" variant="danger" onClick={onEndCombat}>
                End Combat
              </Button>
            </>
          )}
        </div>
      )}

      {/* Add Entry Form (DM only) */}
      {isDm && (
        <div className="bg-dark-wood p-3 rounded border border-leather space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-sm py-1"
            />
            <Input
              placeholder="Init"
              value={newInit}
              onChange={(e) => setNewInit(e.target.value)}
              type="number"
              className="w-16 text-sm py-1"
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-parchment text-sm">
              <input
                type="checkbox"
                checked={isNpc}
                onChange={(e) => setIsNpc(e.target.checked)}
                className="w-4 h-4"
              />
              NPC/Monster
            </label>
            <Button
              size="sm"
              onClick={handleAddEntry}
              disabled={!newName.trim() || !newInit.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Initiative Order */}
      {initiative.length === 0 ? (
        <p className="text-parchment/50 text-sm text-center py-4">
          {isDm ? 'Add combatants to begin' : 'Waiting for combat to start...'}
        </p>
      ) : (
        <div className="space-y-1">
          {initiative.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 p-2 rounded transition-all ${
                entry.isActive
                  ? 'bg-gold/20 border-2 border-gold'
                  : 'bg-dark-wood border border-leather'
              }`}
            >
              {/* Position Number */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  entry.isActive ? 'bg-gold text-dark-wood' : 'bg-leather text-parchment'
                }`}
              >
                {index + 1}
              </div>

              {/* Name and Type */}
              <div className="flex-1">
                <div className={`font-medieval ${entry.isActive ? 'text-gold' : 'text-parchment'}`}>
                  {entry.name}
                </div>
                <div className="text-parchment/50 text-xs">
                  {entry.isNpc ? 'NPC' : 'Player'}
                </div>
              </div>

              {/* Initiative Score */}
              <div className={`font-bold text-lg ${entry.isActive ? 'text-gold' : 'text-parchment/70'}`}>
                {entry.initiative}
              </div>

              {/* Remove Button (DM only) */}
              {isDm && (
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="text-red-400 hover:text-red-300 px-2"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current Turn Indicator */}
      {isInCombat && initiative.length > 0 && (
        <div className="text-center p-2 bg-gold/10 rounded border border-gold/30">
          <span className="text-parchment/70 text-sm">Current Turn: </span>
          <span className="text-gold font-medieval font-bold">
            {initiative.find((e) => e.isActive)?.name || 'None'}
          </span>
        </div>
      )}
    </div>
  );
}
