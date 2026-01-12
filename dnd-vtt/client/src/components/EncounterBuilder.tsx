import { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MONSTER_PRESETS, AVAILABLE_CRS } from '../data/monsterPresets';
import {
  CR_XP,
  calculateEncounter,
  getPartyThresholds,
  DIFFICULTY_COLORS,
  DIFFICULTY_BG_COLORS,
  ENVIRONMENT_TYPES,
  ENVIRONMENT_MONSTER_TYPES,
  type EncounterMonster,
  type DifficultyLevel,
  type EnvironmentType,
} from '../data/encounterData';
import type { Monster, Token, TokenSize } from '../types';

// Token size mapping
const MONSTER_SIZE_TO_TOKEN: Record<string, TokenSize> = {
  'Tiny': 'tiny',
  'Small': 'small',
  'Medium': 'medium',
  'Large': 'large',
  'Huge': 'huge',
  'Gargantuan': 'gargantuan',
};

// Monster type colors
const MONSTER_TYPE_COLORS: Record<string, string> = {
  aberration: '#9B59B6',
  beast: '#27AE60',
  celestial: '#F1C40F',
  construct: '#7F8C8D',
  dragon: '#E74C3C',
  elemental: '#3498DB',
  fey: '#1ABC9C',
  fiend: '#C0392B',
  giant: '#8B4513',
  humanoid: '#D35400',
  monstrosity: '#2C3E50',
  ooze: '#2ECC71',
  plant: '#16A085',
  undead: '#34495E',
};

interface EncounterBuilderProps {
  onAddMonsters?: (monsters: Monster[]) => void;
  onAddTokens?: (tokens: Token[]) => void;
  allCharacters?: { level: number }[];
}

export function EncounterBuilder({ onAddMonsters, onAddTokens, allCharacters = [] }: EncounterBuilderProps) {
  // Party configuration
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(1);
  const [useActualParty, setUseActualParty] = useState(false);

  // Monster selection
  const [selectedMonsters, setSelectedMonsters] = useState<EncounterMonster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [crFilter, setCrFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentType>('any');

  // UI state
  const [showMonsterList, setShowMonsterList] = useState(false);
  const [savedEncounters, setSavedEncounters] = useState<{ name: string; monsters: EncounterMonster[] }[]>([]);

  // Calculate party levels
  const partyLevels = useMemo(() => {
    if (useActualParty && allCharacters.length > 0) {
      return allCharacters.map(c => c.level);
    }
    return Array(partySize).fill(partyLevel);
  }, [useActualParty, allCharacters, partySize, partyLevel]);

  // Calculate thresholds
  const thresholds = useMemo(() => getPartyThresholds(partyLevels), [partyLevels]);

  // Calculate encounter
  const encounterCalc = useMemo(
    () => calculateEncounter(selectedMonsters, partyLevels),
    [selectedMonsters, partyLevels]
  );

  // Filter monsters
  const filteredMonsters = useMemo(() => {
    let monsters = MONSTER_PRESETS;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      monsters = monsters.filter(m =>
        m.name?.toLowerCase().includes(query) ||
        m.type?.toLowerCase().includes(query)
      );
    }

    // CR filter
    if (crFilter !== 'all') {
      monsters = monsters.filter(m => m.challengeRating === crFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      monsters = monsters.filter(m => m.type === typeFilter);
    }

    // Environment filter
    if (environmentFilter !== 'any') {
      const allowedTypes = ENVIRONMENT_MONSTER_TYPES[environmentFilter];
      monsters = monsters.filter(m => m.type && allowedTypes.includes(m.type));
    }

    return monsters;
  }, [searchQuery, crFilter, typeFilter, environmentFilter]);

  // Get unique monster types from presets
  const monsterTypes = useMemo(() => {
    const types = new Set<string>();
    MONSTER_PRESETS.forEach(m => {
      if (m.type) types.add(m.type);
    });
    return Array.from(types).sort();
  }, []);

  const addMonster = (monster: Partial<Monster>) => {
    const existing = selectedMonsters.find(m => m.name === monster.name);
    if (existing) {
      setSelectedMonsters(prev =>
        prev.map(m => m.name === monster.name ? { ...m, count: m.count + 1 } : m)
      );
    } else {
      setSelectedMonsters(prev => [...prev, {
        id: `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: monster.name || 'Unknown',
        cr: monster.challengeRating || '0',
        xp: monster.xp || CR_XP[monster.challengeRating || '0'] || 0,
        count: 1,
      }]);
    }
  };

  const removeMonster = (name: string) => {
    setSelectedMonsters(prev => {
      const existing = prev.find(m => m.name === name);
      if (existing && existing.count > 1) {
        return prev.map(m => m.name === name ? { ...m, count: m.count - 1 } : m);
      }
      return prev.filter(m => m.name !== name);
    });
  };

  const clearEncounter = () => {
    setSelectedMonsters([]);
  };

  const saveEncounter = () => {
    const name = prompt('Enter a name for this encounter:');
    if (name && selectedMonsters.length > 0) {
      setSavedEncounters(prev => [...prev, { name, monsters: [...selectedMonsters] }]);
    }
  };

  const loadEncounter = (encounter: { name: string; monsters: EncounterMonster[] }) => {
    setSelectedMonsters([...encounter.monsters]);
  };

  const runEncounter = () => {
    if (!onAddMonsters && !onAddTokens) return;

    // Convert encounter monsters to full monsters and tokens
    const monstersToAdd: Monster[] = [];
    const tokensToAdd: Token[] = [];

    for (const em of selectedMonsters) {
      const preset = MONSTER_PRESETS.find(p => p.name === em.name);
      if (!preset) continue;

      for (let i = 0; i < em.count; i++) {
        const monsterId = `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const monster: Monster = {
          id: monsterId,
          name: em.count > 1 ? `${preset.name} ${i + 1}` : preset.name!,
          size: preset.size || 'Medium',
          type: preset.type || 'humanoid',
          alignment: preset.alignment || 'Unaligned',
          armorClass: preset.armorClass || 10,
          armorType: preset.armorType,
          hitPoints: preset.hitPoints || 10,
          hitDice: preset.hitDice || '2d8',
          speed: preset.speed || '30 ft.',
          abilities: preset.abilities || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
          savingThrows: preset.savingThrows,
          skills: preset.skills,
          damageResistances: preset.damageResistances,
          damageImmunities: preset.damageImmunities,
          damageVulnerabilities: preset.damageVulnerabilities,
          conditionImmunities: preset.conditionImmunities,
          senses: preset.senses || 'passive Perception 10',
          languages: preset.languages || 'None',
          challengeRating: preset.challengeRating || '0',
          xp: preset.xp || 0,
          traits: preset.traits || [],
          actions: preset.actions || [],
          reactions: preset.reactions,
          legendaryActions: preset.legendaryActions,
          legendaryActionCount: preset.legendaryActionCount,
          source: preset.source || 'Custom',
        };
        monstersToAdd.push(monster);

        // Create token
        const token: Token = {
          id: `token-${monsterId}`,
          name: monster.name,
          x: Math.floor(Math.random() * 8) + 1,
          y: Math.floor(Math.random() * 8) + 1,
          size: MONSTER_SIZE_TO_TOKEN[monster.size] || 'medium',
          color: MONSTER_TYPE_COLORS[monster.type] || '#D35400',
          isHidden: false,
          maxHp: monster.hitPoints,
          currentHp: monster.hitPoints,
        };
        tokensToAdd.push(token);
      }
    }

    if (onAddMonsters) onAddMonsters(monstersToAdd);
    if (onAddTokens) tokensToAdd.forEach(t => onAddTokens([t]));
  };

  const generateRandomEncounter = (difficulty: DifficultyLevel) => {
    const targetXP = thresholds[difficulty === 'trivial' ? 'easy' : difficulty] * 0.8; // Aim for 80% of threshold
    const availableMonsters = filteredMonsters.filter(m => {
      const xp = m.xp || CR_XP[m.challengeRating || '0'] || 0;
      return xp <= targetXP && xp > 0;
    });

    if (availableMonsters.length === 0) return;

    const newEncounter: EncounterMonster[] = [];
    let currentXP = 0;
    const maxMonsters = difficulty === 'deadly' ? 3 : difficulty === 'hard' ? 5 : 8;

    while (currentXP < targetXP && newEncounter.length < maxMonsters) {
      const remainingXP = targetXP - currentXP;
      const eligibleMonsters = availableMonsters.filter(m => {
        const xp = m.xp || CR_XP[m.challengeRating || '0'] || 0;
        return xp <= remainingXP;
      });

      if (eligibleMonsters.length === 0) break;

      const randomMonster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
      const xp = randomMonster.xp || CR_XP[randomMonster.challengeRating || '0'] || 0;

      const existing = newEncounter.find(m => m.name === randomMonster.name);
      if (existing) {
        existing.count++;
      } else {
        newEncounter.push({
          id: `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: randomMonster.name || 'Unknown',
          cr: randomMonster.challengeRating || '0',
          xp,
          count: 1,
        });
      }
      currentXP += xp;
    }

    setSelectedMonsters(newEncounter);
  };

  const getDifficultyLabel = (diff: DifficultyLevel) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Party Configuration */}
      <div className="bg-dark-wood/50 p-3 rounded-lg border border-leather">
        <h3 className="text-gold font-medieval text-sm mb-2">Party Configuration</h3>

        {allCharacters.length > 0 && (
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={useActualParty}
              onChange={(e) => setUseActualParty(e.target.checked)}
              className="rounded"
            />
            <span className="text-parchment text-sm">Use actual party ({allCharacters.length} characters)</span>
          </label>
        )}

        {!useActualParty && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Party Size</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Average Level</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={partyLevel}
                onChange={(e) => setPartyLevel(Number(e.target.value))}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* XP Thresholds */}
        <div className="mt-3 grid grid-cols-4 gap-1 text-xs">
          <div className="text-center p-1 rounded bg-green-500/20 border border-green-500">
            <div className="text-green-400">Easy</div>
            <div className="text-parchment">{thresholds.easy} XP</div>
          </div>
          <div className="text-center p-1 rounded bg-yellow-500/20 border border-yellow-500">
            <div className="text-yellow-400">Medium</div>
            <div className="text-parchment">{thresholds.medium} XP</div>
          </div>
          <div className="text-center p-1 rounded bg-orange-500/20 border border-orange-500">
            <div className="text-orange-400">Hard</div>
            <div className="text-parchment">{thresholds.hard} XP</div>
          </div>
          <div className="text-center p-1 rounded bg-red-500/20 border border-red-500">
            <div className="text-red-500">Deadly</div>
            <div className="text-parchment">{thresholds.deadly} XP</div>
          </div>
        </div>
      </div>

      {/* Current Encounter */}
      <div className={`p-3 rounded-lg border ${DIFFICULTY_BG_COLORS[encounterCalc.difficulty]}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gold font-medieval text-sm">Current Encounter</h3>
          <span className={`text-sm font-bold ${DIFFICULTY_COLORS[encounterCalc.difficulty]}`}>
            {getDifficultyLabel(encounterCalc.difficulty)}
          </span>
        </div>

        {selectedMonsters.length === 0 ? (
          <p className="text-parchment/50 text-sm italic">No monsters selected</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedMonsters.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-dark-wood/30 px-2 py-1 rounded text-sm">
                <span className="text-parchment">
                  {m.count > 1 ? `${m.count}x ` : ''}{m.name}
                  <span className="text-parchment/50 ml-1">(CR {m.cr})</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-xs">{m.xp * m.count} XP</span>
                  <button
                    onClick={() => removeMonster(m.name)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* XP Summary */}
        {selectedMonsters.length > 0 && (
          <div className="mt-2 pt-2 border-t border-leather/50 text-xs">
            <div className="flex justify-between text-parchment/70">
              <span>Total XP:</span>
              <span>{encounterCalc.totalXP}</span>
            </div>
            {encounterCalc.multiplier > 1 && (
              <div className="flex justify-between text-parchment/70">
                <span>Multiplier:</span>
                <span>×{encounterCalc.multiplier}</span>
              </div>
            )}
            <div className="flex justify-between text-gold font-bold">
              <span>Adjusted XP:</span>
              <span>{encounterCalc.adjustedXP}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowMonsterList(!showMonsterList)}>
            {showMonsterList ? 'Hide Monsters' : 'Add Monsters'}
          </Button>
          <Button size="sm" variant="secondary" onClick={clearEncounter} disabled={selectedMonsters.length === 0}>
            Clear
          </Button>
          <Button size="sm" variant="secondary" onClick={saveEncounter} disabled={selectedMonsters.length === 0}>
            Save
          </Button>
          {(onAddMonsters || onAddTokens) && (
            <Button size="sm" variant="primary" onClick={runEncounter} disabled={selectedMonsters.length === 0}>
              Run Encounter
            </Button>
          )}
        </div>
      </div>

      {/* Random Encounter Buttons */}
      <div className="bg-dark-wood/50 p-3 rounded-lg border border-leather">
        <h3 className="text-gold font-medieval text-sm mb-2">Generate Random Encounter</h3>
        <div className="grid grid-cols-4 gap-1">
          <Button size="sm" variant="secondary" className="text-xs" onClick={() => generateRandomEncounter('easy')}>
            Easy
          </Button>
          <Button size="sm" variant="secondary" className="text-xs" onClick={() => generateRandomEncounter('medium')}>
            Medium
          </Button>
          <Button size="sm" variant="secondary" className="text-xs" onClick={() => generateRandomEncounter('hard')}>
            Hard
          </Button>
          <Button size="sm" variant="secondary" className="text-xs" onClick={() => generateRandomEncounter('deadly')}>
            Deadly
          </Button>
        </div>
      </div>

      {/* Monster Selection */}
      {showMonsterList && (
        <div className="bg-dark-wood/50 p-3 rounded-lg border border-leather">
          <h3 className="text-gold font-medieval text-sm mb-2">Monster Selection</h3>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              placeholder="Search monsters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <select
              value={crFilter}
              onChange={(e) => setCrFilter(e.target.value)}
              className="bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
            >
              <option value="all">All CRs</option>
              {AVAILABLE_CRS.map(cr => (
                <option key={cr} value={cr}>CR {cr}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
            >
              <option value="all">All Types</option>
              {monsterTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value as EnvironmentType)}
              className="bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
            >
              {ENVIRONMENT_TYPES.map(env => (
                <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Monster List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredMonsters.length === 0 ? (
              <p className="text-parchment/50 text-sm italic text-center py-2">No monsters match filters</p>
            ) : (
              filteredMonsters.slice(0, 50).map((monster, idx) => (
                <button
                  key={`${monster.name}-${idx}`}
                  onClick={() => addMonster(monster)}
                  className="w-full flex justify-between items-center bg-leather/30 hover:bg-leather/50 px-2 py-1 rounded text-sm transition-colors"
                >
                  <span className="text-parchment text-left">
                    {monster.name}
                    <span className="text-parchment/50 ml-1">({monster.type})</span>
                  </span>
                  <span className="text-gold text-xs">CR {monster.challengeRating}</span>
                </button>
              ))
            )}
            {filteredMonsters.length > 50 && (
              <p className="text-parchment/50 text-xs text-center py-1">
                Showing 50 of {filteredMonsters.length} monsters. Use filters to narrow results.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Saved Encounters */}
      {savedEncounters.length > 0 && (
        <div className="bg-dark-wood/50 p-3 rounded-lg border border-leather">
          <h3 className="text-gold font-medieval text-sm mb-2">Saved Encounters</h3>
          <div className="space-y-1">
            {savedEncounters.map((encounter, idx) => (
              <button
                key={idx}
                onClick={() => loadEncounter(encounter)}
                className="w-full flex justify-between items-center bg-leather/30 hover:bg-leather/50 px-2 py-1 rounded text-sm transition-colors"
              >
                <span className="text-parchment">{encounter.name}</span>
                <span className="text-parchment/50 text-xs">
                  {encounter.monsters.reduce((sum, m) => sum + m.count, 0)} monsters
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
