import { useState } from 'react';
import type { Character, Condition, Token } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  CLASS_NAMES,
  SPECIES_NAMES,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  SPELL_SLOTS_BY_LEVEL,
  HALF_CASTER_SPELL_SLOTS,
  WARLOCK_SPELL_SLOTS,
  getCharacterResources,
} from '../data/dndData';
import type { CharacterClass } from '../types';

// Condition display info
const CONDITION_INFO: Record<Condition, { icon: string; color: string; short: string }> = {
  blinded: { icon: '👁️', color: 'bg-gray-700', short: 'BLD' },
  charmed: { icon: '💕', color: 'bg-pink-600', short: 'CHM' },
  deafened: { icon: '🔇', color: 'bg-blue-700', short: 'DEF' },
  frightened: { icon: '😨', color: 'bg-purple-700', short: 'FRT' },
  grappled: { icon: '🤝', color: 'bg-orange-500', short: 'GRP' },
  incapacitated: { icon: '❌', color: 'bg-red-700', short: 'INC' },
  invisible: { icon: '👻', color: 'bg-indigo-600', short: 'INV' },
  paralyzed: { icon: '⚡', color: 'bg-yellow-500', short: 'PAR' },
  petrified: { icon: '🗿', color: 'bg-stone-600', short: 'PTR' },
  poisoned: { icon: '🤢', color: 'bg-green-700', short: 'PSN' },
  prone: { icon: '🔻', color: 'bg-gray-600', short: 'PRN' },
  restrained: { icon: '🔗', color: 'bg-orange-600', short: 'RST' },
  stunned: { icon: '💫', color: 'bg-yellow-600', short: 'STN' },
  unconscious: { icon: '💤', color: 'bg-slate-700', short: 'UNC' },
  exhausted: { icon: '😫', color: 'bg-amber-700', short: 'EXH' },
  concentrating: { icon: '🔮', color: 'bg-blue-500', short: 'CON' },
};

interface PartyDashboardProps {
  characters: Character[];
  tokens: Token[];
  onUpdateCharacter: (characterId: string, updates: Partial<Character>) => void;
  onUpdateToken?: (tokenId: string, updates: Partial<Token>) => void;
  onAddDmNote?: (characterId: string, note: string) => void;
  dmNotes?: Record<string, string>;
}

export function PartyDashboard({
  characters,
  tokens,
  onUpdateCharacter,
  onUpdateToken,
  onAddDmNote,
  dmNotes = {},
}: PartyDashboardProps) {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [hpDelta, setHpDelta] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Get HP bar color based on percentage
  const getHpColor = (current: number, max: number): string => {
    const percent = (current / max) * 100;
    if (percent > 50) return 'bg-green-500';
    if (percent > 25) return 'bg-yellow-500';
    if (percent > 0) return 'bg-red-500';
    return 'bg-gray-500';
  };

  // Get spell slots for a character
  const getSpellSlots = (character: Character): number[] => {
    if (character.spellcasting?.spellSlots) {
      return character.spellcasting.spellSlots;
    }
    const fullCasters: CharacterClass[] = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
    if (fullCasters.includes(character.characterClass)) {
      return SPELL_SLOTS_BY_LEVEL[character.level] || [];
    }
    const halfCasters: CharacterClass[] = ['paladin', 'ranger'];
    if (halfCasters.includes(character.characterClass)) {
      return HALF_CASTER_SPELL_SLOTS[character.level] || [];
    }
    if (character.characterClass === 'warlock') {
      const warlockSlots = WARLOCK_SPELL_SLOTS[character.level];
      if (warlockSlots) {
        const slots = new Array(9).fill(0);
        slots[warlockSlots.level - 1] = warlockSlots.slots;
        return slots;
      }
    }
    return [];
  };

  // Get total remaining spell slots
  const getRemainingSlots = (character: Character): { used: number; total: number } => {
    const slots = getSpellSlots(character);
    const slotsUsed = character.spellSlotsUsed || character.spellcasting?.spellSlotsUsed || new Array(9).fill(0);
    const total = slots.reduce((sum, s) => sum + s, 0);
    const used = slotsUsed.reduce((sum: number, u: number) => sum + u, 0);
    return { used, total };
  };

  // Find token for a character
  const getCharacterToken = (character: Character): Token | undefined => {
    return tokens.find(t => t.name === character.name || t.ownerId === character.playerId);
  };

  // Handle HP change
  const handleHpChange = (character: Character, delta: number) => {
    const newHp = Math.max(0, Math.min(character.maxHitPoints, character.currentHitPoints + delta));
    onUpdateCharacter(character.id, { currentHitPoints: newHp });

    // Sync with token if exists
    const token = getCharacterToken(character);
    if (token && onUpdateToken) {
      onUpdateToken(token.id, { currentHp: newHp });
    }
  };

  // Handle condition toggle
  const handleConditionToggle = (character: Character, condition: Condition) => {
    const currentConditions = character.conditions || [];
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];
    onUpdateCharacter(character.id, { conditions: newConditions });

    // Sync with token
    const token = getCharacterToken(character);
    if (token && onUpdateToken) {
      onUpdateToken(token.id, { conditions: newConditions });
    }
  };

  // Handle temp HP change
  const handleTempHpChange = (character: Character, value: number) => {
    onUpdateCharacter(character.id, { temporaryHitPoints: Math.max(0, value) });
  };

  // Apply HP delta (damage or healing)
  const applyHpDelta = (character: Character) => {
    const deltaValue = parseInt(hpDelta[character.id] || '0');
    if (!isNaN(deltaValue) && deltaValue !== 0) {
      handleHpChange(character, deltaValue);
      setHpDelta(prev => ({ ...prev, [character.id]: '' }));
    }
  };

  // Save DM note
  const saveDmNote = (characterId: string) => {
    if (onAddDmNote) {
      onAddDmNote(characterId, noteText);
    }
    setEditingNote(null);
    setNoteText('');
  };

  // Start editing note
  const startEditingNote = (characterId: string) => {
    setEditingNote(characterId);
    setNoteText(dmNotes[characterId] || '');
  };

  if (characters.length === 0) {
    return (
      <div className="text-parchment/50 text-center py-4">
        <p>No player characters yet</p>
        <p className="text-sm mt-1">Characters will appear when players create them</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Overview */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-dark-wood p-2 rounded border border-leather">
          <div className="text-parchment/70">Party Size</div>
          <div className="text-gold text-lg font-bold">{characters.length}</div>
        </div>
        <div className="bg-dark-wood p-2 rounded border border-leather">
          <div className="text-parchment/70">Avg Level</div>
          <div className="text-gold text-lg font-bold">
            {Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)}
          </div>
        </div>
      </div>

      {/* Character Cards */}
      {characters.map(character => {
        const isExpanded = expandedCharacter === character.id;
        const hpPercent = (character.currentHitPoints / character.maxHitPoints) * 100;
        const conditions = character.conditions || [];
        const token = getCharacterToken(character);

        return (
          <div
            key={character.id}
            className="bg-dark-wood rounded-lg border border-leather overflow-hidden"
          >
            {/* Collapsed Header */}
            <div
              className="p-3 cursor-pointer hover:bg-leather/30 transition-colors"
              onClick={() => setExpandedCharacter(isExpanded ? null : character.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gold font-medieval">{character.name}</span>
                  <span className="text-parchment/50 text-xs">
                    Lv{character.level} {CLASS_NAMES[character.characterClass]}
                  </span>
                  {token && (
                    <span className="text-xs bg-blue-900/30 text-blue-300 px-1 rounded" title="Has token on map">
                      🎯
                    </span>
                  )}
                </div>
                <span className="text-parchment/50 text-sm">{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* HP Bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-parchment/70">HP</span>
                  <div className="flex items-center gap-2">
                    {/* Spell Slots (if caster) */}
                    {(() => {
                      const slotInfo = getRemainingSlots(character);
                      if (slotInfo.total > 0) {
                        const remaining = slotInfo.total - slotInfo.used;
                        return (
                          <span className="text-blue-400 text-[10px]" title={`${remaining}/${slotInfo.total} spell slots`}>
                            🔮 {remaining}/{slotInfo.total}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {/* Class Resources Summary */}
                    {(() => {
                      const featNames = character.features
                        ?.filter(f => f.source === 'Origin Feat' || f.source === 'Human Versatile' || f.source?.includes('Feat'))
                        .map(f => f.name) || [];
                      const resources = getCharacterResources(
                        character.characterClass,
                        character.species,
                        character.level,
                        character.abilityScores,
                        featNames
                      );
                      const resourceEntries = Object.entries(resources);
                      if (resourceEntries.length === 0) return null;

                      // Calculate total remaining resources
                      let totalRemaining = 0;
                      let totalMax = 0;
                      for (const [resourceId, resource] of resourceEntries) {
                        const used = character.featureUses?.[resourceId]?.used || 0;
                        totalRemaining += resource.max - used;
                        totalMax += resource.max;
                      }

                      return (
                        <span className="text-amber-400 text-[10px]" title={`${totalRemaining}/${totalMax} class resources`}>
                          ⚡ {totalRemaining}/{totalMax}
                        </span>
                      );
                    })()}
                    <span className={character.currentHitPoints <= 0 ? 'text-red-400' : 'text-parchment'}>
                      {character.currentHitPoints}/{character.maxHitPoints}
                      {character.temporaryHitPoints > 0 && (
                        <span className="text-cyan-400"> (+{character.temporaryHitPoints})</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-leather rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getHpColor(character.currentHitPoints, character.maxHitPoints)}`}
                    style={{ width: `${Math.min(100, hpPercent)}%` }}
                  />
                </div>
              </div>

              {/* Conditions (if any) */}
              {conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {conditions.map(condition => (
                    <span
                      key={condition}
                      className={`${CONDITION_INFO[condition].color} text-white px-1.5 py-0.5 rounded text-xs`}
                      title={condition}
                    >
                      {CONDITION_INFO[condition].icon}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-leather p-3 space-y-3">
                {/* Quick HP Controls */}
                <div>
                  <div className="text-parchment/70 text-xs mb-1">Quick HP Adjust</div>
                  <div className="flex flex-wrap items-center gap-1">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleHpChange(character, -5)}
                        className="px-2"
                      >
                        -5
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleHpChange(character, -1)}
                        className="px-2"
                      >
                        -1
                      </Button>
                    </div>
                    <div className="flex gap-1 flex-1 min-w-[80px]">
                      <Input
                        type="number"
                        placeholder="+/-"
                        value={hpDelta[character.id] || ''}
                        onChange={(e) => setHpDelta(prev => ({ ...prev, [character.id]: e.target.value }))}
                        className="text-xs text-center w-14"
                        onKeyDown={(e) => e.key === 'Enter' && applyHpDelta(character)}
                      />
                      <Button size="sm" onClick={() => applyHpDelta(character)} className="px-2">Go</Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleHpChange(character, 1)}
                        className="px-2"
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleHpChange(character, 5)}
                        className="px-2"
                      >
                        +5
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Temp HP */}
                <div className="flex items-center gap-2">
                  <span className="text-parchment/70 text-xs">Temp HP:</span>
                  <Input
                    type="number"
                    value={character.temporaryHitPoints}
                    onChange={(e) => handleTempHpChange(character, parseInt(e.target.value) || 0)}
                    className="w-16 text-xs text-center"
                    min="0"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onUpdateCharacter(character.id, {
                      currentHitPoints: character.maxHitPoints,
                      temporaryHitPoints: 0,
                    })}
                  >
                    Full Heal
                  </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div className="bg-leather/30 p-1 rounded">
                    <div className="text-parchment/50">AC</div>
                    <div className="text-gold font-bold">{character.armorClass}</div>
                  </div>
                  <div className="bg-leather/30 p-1 rounded">
                    <div className="text-parchment/50">Init</div>
                    <div className="text-gold font-bold">{formatModifier(character.initiative)}</div>
                  </div>
                  <div className="bg-leather/30 p-1 rounded">
                    <div className="text-parchment/50">Speed</div>
                    <div className="text-gold font-bold">{character.speed}ft</div>
                  </div>
                  <div className="bg-leather/30 p-1 rounded">
                    <div className="text-parchment/50">Prof</div>
                    <div className="text-gold font-bold">+{getProficiencyBonus(character.level)}</div>
                  </div>
                </div>

                {/* Spell Slots (if caster) */}
                {(() => {
                  const slots = getSpellSlots(character);
                  const slotsUsed = character.spellSlotsUsed || character.spellcasting?.spellSlotsUsed || new Array(9).fill(0);
                  const hasSlots = slots.some(s => s > 0);
                  if (!hasSlots) return null;

                  return (
                    <div>
                      <div className="text-parchment/70 text-xs mb-1">Spell Slots</div>
                      <div className="flex flex-wrap gap-1">
                        {slots.map((slotCount, idx) => {
                          if (slotCount === 0) return null;
                          const level = idx + 1;
                          const used = slotsUsed[idx] || 0;
                          const remaining = slotCount - used;
                          return (
                            <div key={idx} className="bg-leather/30 px-2 py-1 rounded text-center">
                              <div className="text-parchment/50 text-[10px]">Lv{level}</div>
                              <div className="flex gap-0.5 justify-center">
                                {Array.from({ length: slotCount }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                      i < remaining ? 'bg-blue-500' : 'bg-leather'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Class Resources (Ki, Rage, etc.) */}
                {(() => {
                  // Get feat names from features
                  const featNames = character.features
                    ?.filter(f => f.source === 'Origin Feat' || f.source === 'Human Versatile' || f.source?.includes('Feat'))
                    .map(f => f.name) || [];

                  const resources = getCharacterResources(
                    character.characterClass,
                    character.species,
                    character.level,
                    character.abilityScores,
                    featNames
                  );

                  const resourceEntries = Object.entries(resources);
                  if (resourceEntries.length === 0) return null;

                  return (
                    <div>
                      <div className="text-parchment/70 text-xs mb-1">Class Resources</div>
                      <div className="space-y-1">
                        {resourceEntries.map(([resourceId, resource]) => {
                          const featureUse = character.featureUses?.[resourceId];
                          const used = featureUse?.used || 0;
                          const max = resource.max;
                          const remaining = max - used;
                          const isSmallPool = max <= 6;

                          return (
                            <div
                              key={resourceId}
                              className="bg-leather/30 px-2 py-1 rounded"
                              title={resource.description}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="text-parchment text-xs font-medium">{resource.name}</span>
                                  <span className={`text-[9px] px-1 rounded ${
                                    resource.restoreOn === 'short'
                                      ? 'bg-green-900/50 text-green-300'
                                      : 'bg-blue-900/50 text-blue-300'
                                  }`}>
                                    {resource.restoreOn === 'short' ? 'SR' : 'LR'}
                                  </span>
                                </div>
                                {isSmallPool ? (
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: max }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                          i < remaining ? 'bg-amber-500' : 'bg-leather'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-amber-400 text-xs font-bold">
                                    {remaining}/{max}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Ability Scores */}
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ability => (
                    <div key={ability} className="bg-leather/20 p-1 rounded">
                      <div className="text-parchment/50 uppercase">{ability.slice(0, 3)}</div>
                      <div className="text-parchment font-bold">{character.abilityScores[ability]}</div>
                      <div className="text-gold text-[10px]">
                        {formatModifier(getAbilityModifier(character.abilityScores[ability]))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conditions Quick Toggle */}
                <div>
                  <div className="text-parchment/70 text-xs mb-1">Conditions</div>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(CONDITION_INFO) as Condition[]).slice(0, 10).map(condition => {
                      const isActive = conditions.includes(condition);
                      return (
                        <button
                          key={condition}
                          onClick={() => handleConditionToggle(character, condition)}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            isActive
                              ? `${CONDITION_INFO[condition].color} text-white`
                              : 'bg-leather/30 text-parchment/50 hover:bg-leather/50'
                          }`}
                          title={condition}
                        >
                          {CONDITION_INFO[condition].icon} {CONDITION_INFO[condition].short}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Object.keys(CONDITION_INFO) as Condition[]).slice(10).map(condition => {
                      const isActive = conditions.includes(condition);
                      return (
                        <button
                          key={condition}
                          onClick={() => handleConditionToggle(character, condition)}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            isActive
                              ? `${CONDITION_INFO[condition].color} text-white`
                              : 'bg-leather/30 text-parchment/50 hover:bg-leather/50'
                          }`}
                          title={condition}
                        >
                          {CONDITION_INFO[condition].icon} {CONDITION_INFO[condition].short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exhaustion */}
                <div className="flex items-center gap-2">
                  <span className="text-parchment/70 text-xs">Exhaustion:</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(level => (
                      <button
                        key={level}
                        onClick={() => onUpdateCharacter(character.id, { exhaustionLevel: level })}
                        className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                          (character.exhaustionLevel || 0) >= level && level > 0
                            ? 'bg-amber-700 text-white'
                            : 'bg-leather/30 text-parchment/50 hover:bg-leather/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  {(character.exhaustionLevel || 0) > 0 && (
                    <span className="text-amber-400 text-xs">
                      (-{(character.exhaustionLevel || 0) * 2} to d20s)
                    </span>
                  )}
                </div>

                {/* Inspiration */}
                <div className="flex items-center gap-2">
                  <span className="text-parchment/70 text-xs">Inspiration:</span>
                  <button
                    onClick={() => onUpdateCharacter(character.id, { inspiration: !character.inspiration })}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      character.inspiration
                        ? 'bg-gold text-dark-wood'
                        : 'bg-leather/30 text-parchment/50 hover:bg-leather/50'
                    }`}
                  >
                    {character.inspiration ? '★ Inspired' : 'Grant Inspiration'}
                  </button>
                </div>

                {/* DM Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-parchment/70 text-xs">DM Notes</span>
                    {editingNote !== character.id && (
                      <button
                        onClick={() => startEditingNote(character.id)}
                        className="text-xs text-gold hover:text-gold/70"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingNote === character.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full h-20 bg-leather/30 text-parchment text-xs p-2 rounded border border-leather focus:outline-none focus:border-gold"
                        placeholder="Private notes about this character..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveDmNote(character.id)}>Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingNote(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-parchment/70 text-xs bg-leather/20 p-2 rounded min-h-[2rem]">
                      {dmNotes[character.id] || <span className="italic">No notes</span>}
                    </div>
                  )}
                </div>

                {/* Character Details */}
                <div className="text-xs text-parchment/50 border-t border-leather pt-2">
                  <div>{SPECIES_NAMES[character.species]} • {character.background}</div>
                  {character.subclass && <div className="text-gold/70">{character.subclass}</div>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
