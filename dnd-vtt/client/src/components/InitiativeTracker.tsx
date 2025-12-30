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
  onUpdateEntry,
  onNextTurn,
  onStartCombat,
  onEndCombat,
}: InitiativeTrackerProps) {
  const { initiative, isInCombat } = useSessionStore();
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState('');
  const [newMaxHp, setNewMaxHp] = useState('');
  const [isNpc, setIsNpc] = useState(true);
  const [hpDelta, setHpDelta] = useState<Record<string, string>>({});

  const handleAddEntry = () => {
    if (!newName.trim() || !newInit.trim()) return;

    const initValue = parseInt(newInit, 10);
    if (isNaN(initValue)) return;

    const maxHpValue = newMaxHp ? parseInt(newMaxHp, 10) : undefined;

    const entry: InitiativeEntry = {
      id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName.trim(),
      initiative: initValue,
      isNpc,
      isActive: false,
      maxHp: isNaN(maxHpValue as number) ? undefined : maxHpValue,
      currentHp: isNaN(maxHpValue as number) ? undefined : maxHpValue,
    };

    onAddEntry(entry);
    setNewName('');
    setNewInit('');
    setNewMaxHp('');
  };

  // Auto-roll initiative for NPCs (d20)
  const handleAutoRoll = () => {
    if (!newName.trim()) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const maxHpValue = newMaxHp ? parseInt(newMaxHp, 10) : undefined;

    const entry: InitiativeEntry = {
      id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName.trim(),
      initiative: roll,
      isNpc: true,
      isActive: false,
      maxHp: isNaN(maxHpValue as number) ? undefined : maxHpValue,
      currentHp: isNaN(maxHpValue as number) ? undefined : maxHpValue,
    };

    onAddEntry(entry);
    setNewName('');
    setNewInit('');
    setNewMaxHp('');
  };

  // Handle HP change (damage or heal)
  const handleHpChange = (entryId: string, isDamage: boolean) => {
    const delta = parseInt(hpDelta[entryId] || '0', 10);
    if (isNaN(delta) || delta <= 0) return;

    const entry = initiative.find(e => e.id === entryId);
    if (!entry || entry.currentHp === undefined) return;

    const newHp = isDamage
      ? Math.max(0, entry.currentHp - delta)
      : Math.min(entry.maxHp || entry.currentHp + delta, entry.currentHp + delta);

    onUpdateEntry(entryId, { currentHp: newHp });
    setHpDelta(prev => ({ ...prev, [entryId]: '' }));
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
            <Input
              placeholder="HP"
              value={newMaxHp}
              onChange={(e) => setNewMaxHp(e.target.value)}
              type="number"
              className="w-16 text-sm py-1"
              title="Max HP (optional)"
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
            <div className="flex gap-2">
              {isNpc && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAutoRoll}
                  disabled={!newName.trim()}
                  title="Auto-roll d20 for initiative"
                >
                  🎲 Roll
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleAddEntry}
                disabled={!newName.trim() || !newInit.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Initiative Order */}
      {initiative.length === 0 ? (
        <p className="text-parchment/50 text-sm text-center py-4">
          {isDm ? 'Add combatants to begin' : 'Waiting for combat to start...'}
        </p>
      ) : (
        <div className="space-y-2">
          {initiative.map((entry, index) => {
            const hpPercent = entry.maxHp && entry.currentHp !== undefined
              ? Math.max(0, Math.min(1, entry.currentHp / entry.maxHp))
              : null;

            return (
              <div
                key={entry.id}
                className={`p-2 rounded transition-all ${
                  entry.isActive
                    ? 'bg-gold/20 border-2 border-gold'
                    : 'bg-dark-wood border border-leather'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Position Number */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      entry.isActive ? 'bg-gold text-dark-wood' : 'bg-leather text-parchment'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Name and Type */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medieval truncate ${entry.isActive ? 'text-gold' : 'text-parchment'}`}>
                      {entry.name}
                    </div>
                    <div className="text-parchment/50 text-xs">
                      {entry.isNpc ? 'NPC' : 'Player'}
                    </div>
                  </div>

                  {/* Initiative Score */}
                  <div className={`font-bold text-lg flex-shrink-0 ${entry.isActive ? 'text-gold' : 'text-parchment/70'}`}>
                    {entry.initiative}
                  </div>

                  {/* Remove Button (DM only) */}
                  {isDm && (
                    <button
                      onClick={() => onRemoveEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 px-1 flex-shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* HP Bar and Controls (if HP is set) */}
                {hpPercent !== null && (
                  <div className="mt-2">
                    {/* HP Bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-3 bg-gray-700 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            hpPercent > 0.5 ? 'bg-green-500' : hpPercent > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${hpPercent * 100}%` }}
                        />
                      </div>
                      <span className="text-parchment text-xs w-16 text-right">
                        {entry.currentHp}/{entry.maxHp}
                      </span>
                    </div>

                    {/* Damage/Heal Controls (DM only) */}
                    {isDm && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="±"
                          value={hpDelta[entry.id] || ''}
                          onChange={(e) => setHpDelta(prev => ({ ...prev, [entry.id]: e.target.value }))}
                          className="w-12 px-1 py-0.5 text-xs bg-parchment text-dark-wood rounded text-center"
                          min="1"
                        />
                        <button
                          onClick={() => handleHpChange(entry.id, true)}
                          className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-500"
                          title="Deal damage"
                        >
                          Dmg
                        </button>
                        <button
                          onClick={() => handleHpChange(entry.id, false)}
                          className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-500"
                          title="Heal"
                        >
                          Heal
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
