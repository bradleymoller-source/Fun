import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import type { InitiativeEntry, Condition } from '../types';

// Condition colors and icons for visual display
const CONDITION_INFO: Record<Condition, { icon: string; color: string; description: string }> = {
  blinded: { icon: '👁️', color: 'bg-gray-700', description: 'Auto-fail sight checks, disadvantage on attacks' },
  charmed: { icon: '💕', color: 'bg-pink-600', description: 'Cannot attack charmer, charmer has advantage on social checks' },
  deafened: { icon: '🔇', color: 'bg-blue-700', description: 'Cannot hear, auto-fail hearing checks' },
  frightened: { icon: '😨', color: 'bg-purple-700', description: 'Disadvantage while source is in sight' },
  grappled: { icon: '🤝', color: 'bg-orange-500', description: 'Speed 0, ends if grappler incapacitated' },
  incapacitated: { icon: '❌', color: 'bg-red-700', description: 'Cannot take actions or reactions' },
  invisible: { icon: '👻', color: 'bg-indigo-600', description: 'Cannot be seen, advantage on attacks, attacks have disadvantage' },
  paralyzed: { icon: '⚡', color: 'bg-yellow-500', description: 'Incapacitated, auto-fail STR/DEX saves, crits within 5ft' },
  petrified: { icon: '🗿', color: 'bg-stone-600', description: 'Turned to stone, incapacitated, resist all damage' },
  poisoned: { icon: '🤢', color: 'bg-green-700', description: 'Disadvantage on attacks and ability checks' },
  prone: { icon: '🔻', color: 'bg-gray-600', description: 'Disadvantage on attacks, advantage for adjacent melee' },
  restrained: { icon: '🔗', color: 'bg-orange-600', description: 'Speed 0, disadvantage on attacks and DEX saves' },
  stunned: { icon: '💫', color: 'bg-yellow-600', description: 'Incapacitated, auto-fail STR/DEX saves' },
  unconscious: { icon: '💤', color: 'bg-slate-700', description: 'Incapacitated, drop items, prone, auto-fail STR/DEX saves' },
  exhausted: { icon: '😫', color: 'bg-amber-700', description: 'Cumulative penalties' },
  concentrating: { icon: '🔮', color: 'bg-blue-500', description: 'Maintaining concentration on a spell' },
};

const ALL_CONDITIONS: Condition[] = [
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious', 'exhausted', 'concentrating',
];

interface InitiativeTrackerProps {
  isDm: boolean;
  onAddEntry: (entry: InitiativeEntry) => void;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<InitiativeEntry>) => void;
  onNextTurn: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
  onRemoveToken?: (tokenId: string) => void;  // Callback to remove token when creature dies
  // Player-specific props for rolling initiative
  playerId?: string;
  playerName?: string;
  playerMaxHp?: number;
}

export function InitiativeTracker({
  isDm,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry,
  onNextTurn,
  onStartCombat,
  onEndCombat,
  onRemoveToken,
  playerId,
  playerName,
  playerMaxHp,
}: InitiativeTrackerProps) {
  const { initiative, isInCombat } = useSessionStore();
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState('');
  const [newMaxHp, setNewMaxHp] = useState('');
  const [isNpc, setIsNpc] = useState(true);
  const [hpDelta, setHpDelta] = useState<Record<string, string>>({});
  const [showConditions, setShowConditions] = useState<string | null>(null); // Entry ID to show conditions for

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

  // Check if player is already in initiative
  const playerInInitiative = !isDm && playerId
    ? initiative.find(e => e.playerId === playerId || e.id === `init-player-${playerId}`)
    : null;

  // Player initiative roll
  const handlePlayerRollInitiative = () => {
    if (!playerId || !playerName) return;

    const roll = Math.floor(Math.random() * 20) + 1;

    const entry: InitiativeEntry = {
      id: `init-player-${playerId}`,
      name: playerName,
      initiative: roll,
      isNpc: false,
      isActive: false,
      playerId: playerId,
      maxHp: playerMaxHp,
      currentHp: playerMaxHp,
    };

    onAddEntry(entry);
  };

  // Toggle a condition on an entry
  const handleToggleCondition = (entryId: string, condition: Condition) => {
    const entry = initiative.find(e => e.id === entryId);
    if (!entry) return;

    const currentConditions = entry.conditions || [];
    const hasCondition = currentConditions.includes(condition);

    const newConditions = hasCondition
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];

    onUpdateEntry(entryId, { conditions: newConditions });
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

      {/* Player Initiative Roll (non-DM) */}
      {!isDm && playerId && (
        <div className="bg-dark-wood p-3 rounded border border-leather">
          {playerInInitiative ? (
            <div className="text-center">
              <span className="text-parchment">You rolled </span>
              <span className="text-gold font-bold text-lg">{playerInInitiative.initiative}</span>
              <span className="text-parchment"> for initiative</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handlePlayerRollInitiative}
              className="w-full"
              disabled={!playerName}
            >
              🎲 Roll Initiative
            </Button>
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
            const isDead = entry.currentHp !== undefined && entry.currentHp <= 0;

            return (
              <div
                key={entry.id}
                className={`p-2 rounded transition-all ${
                  isDead
                    ? 'bg-gray-800/50 border border-gray-600 opacity-50'
                    : entry.isActive
                      ? 'bg-gold/20 border-2 border-gold'
                      : 'bg-dark-wood border border-leather'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Position Number or Skull for dead */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isDead
                        ? 'bg-gray-600 text-gray-400'
                        : entry.isActive
                          ? 'bg-gold text-dark-wood'
                          : 'bg-leather text-parchment'
                    }`}
                  >
                    {isDead ? '💀' : index + 1}
                  </div>

                  {/* Name and Type */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medieval truncate ${
                      isDead
                        ? 'text-gray-500 line-through'
                        : entry.isActive
                          ? 'text-gold'
                          : 'text-parchment'
                    }`}>
                      {entry.name}
                      {isDead && <span className="ml-2 text-red-400 text-xs no-underline">(Dead)</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-parchment/50 text-xs">
                        {entry.isNpc ? 'NPC' : 'Player'}
                      </span>
                      {/* Condition Badges */}
                      {entry.conditions && entry.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {entry.conditions.map((condition) => (
                            <span
                              key={condition}
                              className={`text-xs px-1 rounded ${CONDITION_INFO[condition].color} text-white`}
                              title={`${condition}: ${CONDITION_INFO[condition].description}`}
                            >
                              {CONDITION_INFO[condition].icon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conditions Button (DM only) */}
                  {isDm && (
                    <button
                      onClick={() => setShowConditions(showConditions === entry.id ? null : entry.id)}
                      className={`px-1 text-sm flex-shrink-0 ${
                        showConditions === entry.id ? 'text-gold' : 'text-parchment/50 hover:text-parchment'
                      }`}
                      title="Conditions"
                    >
                      ⚡
                    </button>
                  )}

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
                    {/* HP Bar with +/- buttons */}
                    <div className="flex items-center gap-1">
                      {/* Minus button (damage) */}
                      {isDm && !isDead && (
                        <button
                          onClick={() => {
                            const delta = parseInt(hpDelta[entry.id] || '1', 10);
                            if (!isNaN(delta) && delta > 0 && entry.currentHp !== undefined) {
                              const newHp = Math.max(0, entry.currentHp - delta);
                              onUpdateEntry(entry.id, { currentHp: newHp });
                              setHpDelta(prev => ({ ...prev, [entry.id]: '' }));

                              // If creature dropped to 0 HP, remove their token from the map
                              if (newHp <= 0 && entry.tokenId && onRemoveToken) {
                                onRemoveToken(entry.tokenId);
                              }
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center text-sm bg-red-600 text-white rounded hover:bg-red-500 font-bold"
                          title="Deal damage"
                        >
                          −
                        </button>
                      )}

                      {/* HP Bar */}
                      <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden relative">
                        <div
                          className={`h-full transition-all ${
                            hpPercent > 0.5 ? 'bg-green-500' : hpPercent > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${hpPercent * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {entry.currentHp}/{entry.maxHp}
                        </span>
                      </div>

                      {/* Plus button (heal) - also allows reviving dead creatures */}
                      {isDm && (
                        <button
                          onClick={() => {
                            const delta = parseInt(hpDelta[entry.id] || '1', 10);
                            if (!isNaN(delta) && delta > 0 && entry.currentHp !== undefined) {
                              onUpdateEntry(entry.id, { currentHp: Math.min(entry.maxHp || 999, entry.currentHp + delta) });
                              setHpDelta(prev => ({ ...prev, [entry.id]: '' }));
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center text-sm bg-green-600 text-white rounded hover:bg-green-500 font-bold"
                          title={isDead ? "Revive" : "Heal"}
                        >
                          +
                        </button>
                      )}

                      {/* HP delta input */}
                      {isDm && !isDead && (
                        <input
                          type="number"
                          placeholder="1"
                          value={hpDelta[entry.id] || ''}
                          onChange={(e) => setHpDelta(prev => ({ ...prev, [entry.id]: e.target.value }))}
                          className="w-10 px-1 py-0.5 text-xs bg-parchment text-dark-wood rounded text-center"
                          min="1"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Monster Stats (if available) */}
                {entry.monsterStats && (
                  <div className="mt-2 p-2 bg-leather/20 rounded border border-leather/50 text-xs space-y-1">
                    {/* AC and Speed */}
                    <div className="flex gap-3 text-parchment/80">
                      {entry.monsterStats.ac && (
                        <span>
                          <span className="text-parchment/50">AC:</span>{' '}
                          <span className="text-white font-bold">{entry.monsterStats.ac}</span>
                          {entry.monsterStats.acType && <span className="text-parchment/40"> ({entry.monsterStats.acType})</span>}
                        </span>
                      )}
                      {entry.monsterStats.speed && (
                        <span>
                          <span className="text-parchment/50">Speed:</span> {entry.monsterStats.speed}
                        </span>
                      )}
                    </div>

                    {/* Attacks */}
                    {entry.monsterStats.attacks && entry.monsterStats.attacks.length > 0 && (
                      <div className="border-t border-leather/30 pt-1">
                        <span className="text-red-400 font-bold">Attacks:</span>
                        {entry.monsterStats.attacks.map((attack, idx) => (
                          <div key={idx} className="ml-2 text-parchment/80">
                            <span className="text-white">{attack.name}</span>
                            {': '}
                            <span className="text-yellow-400">+{attack.bonus}</span>
                            {' to hit, '}
                            <span className="text-red-300">{attack.damage}</span>
                            {' '}{attack.damageType}
                            {attack.notes && <span className="text-parchment/50"> ({attack.notes})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Spells */}
                    {entry.monsterStats.spells && entry.monsterStats.spells.length > 0 && (
                      <div className="border-t border-leather/30 pt-1">
                        <span className="text-purple-400 font-bold">Spells:</span>
                        {entry.monsterStats.spells.map((spell, idx) => (
                          <div key={idx} className="ml-2 text-parchment/80">
                            <span className="text-white">{spell.name}</span>
                            {spell.level > 0 && <span className="text-parchment/40"> (Lvl {spell.level})</span>}
                            {spell.damage && <span className="text-purple-300">: {spell.damage}</span>}
                            {spell.effect && <span>: {spell.effect}</span>}
                            {spell.save && <span className="text-yellow-400"> {spell.save}</span>}
                            {spell.attack && <span className="text-yellow-400"> {spell.attack}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Traits */}
                    {entry.monsterStats.traits && entry.monsterStats.traits.length > 0 && (
                      <div className="border-t border-leather/30 pt-1">
                        <span className="text-blue-400 font-bold">Traits:</span>
                        {entry.monsterStats.traits.map((trait, idx) => (
                          <div key={idx} className="ml-2 text-parchment/80">
                            <span className="text-white">{trait.name}:</span> {trait.description}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resistances/Immunities */}
                    {((entry.monsterStats.resistances && entry.monsterStats.resistances.length > 0) ||
                      (entry.monsterStats.immunities && entry.monsterStats.immunities.length > 0)) && (
                      <div className="border-t border-leather/30 pt-1 text-parchment/60">
                        {entry.monsterStats.resistances && entry.monsterStats.resistances.length > 0 && (
                          <div><span className="text-orange-400">Resist:</span> {entry.monsterStats.resistances.join(', ')}</div>
                        )}
                        {entry.monsterStats.immunities && entry.monsterStats.immunities.length > 0 && (
                          <div><span className="text-cyan-400">Immune:</span> {entry.monsterStats.immunities.join(', ')}</div>
                        )}
                      </div>
                    )}

                    {/* Legendary Actions */}
                    {entry.monsterStats.legendaryActions && entry.monsterStats.legendaryActions.length > 0 && (
                      <div className="border-t border-leather/30 pt-1">
                        <span className="text-gold font-bold">Legendary Actions ({entry.monsterStats.legendaryActionCount || 3}/round):</span>
                        {entry.monsterStats.legendaryActions.map((la, idx) => (
                          <div key={idx} className="ml-2 text-parchment/80">
                            <span className="text-gold">{la.name}</span>
                            {la.cost > 1 && <span className="text-parchment/50"> (Cost {la.cost})</span>}
                            {': '}{la.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conditions Picker (DM only) */}
                {isDm && showConditions === entry.id && (
                  <div className="mt-2 p-2 bg-leather/30 rounded border border-leather">
                    <div className="text-parchment/70 text-xs mb-2">Toggle Conditions:</div>
                    <div className="flex flex-wrap gap-1">
                      {ALL_CONDITIONS.map((condition) => {
                        const hasCondition = entry.conditions?.includes(condition);
                        const info = CONDITION_INFO[condition];
                        return (
                          <button
                            key={condition}
                            onClick={() => handleToggleCondition(entry.id, condition)}
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                              hasCondition
                                ? `${info.color} text-white`
                                : 'bg-dark-wood text-parchment/70 hover:text-parchment border border-leather'
                            }`}
                            title={info.description}
                          >
                            <span>{info.icon}</span>
                            <span className="capitalize">{condition}</span>
                          </button>
                        );
                      })}
                    </div>
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
