import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MonsterStatBlock } from './MonsterStatBlock';
import { useSessionStore } from '../../stores/sessionStore';
import { MONSTER_PRESETS, AVAILABLE_CRS } from '../../data/monsterPresets';
import type { Monster, AbilityScores, DiceRoll, Token, TokenSize } from '../../types';

// Map monster size to token size
const MONSTER_SIZE_TO_TOKEN: Record<string, TokenSize> = {
  'Tiny': 'tiny',
  'Small': 'small',
  'Medium': 'medium',
  'Large': 'large',
  'Huge': 'huge',
  'Gargantuan': 'gargantuan',
};

// Monster token colors by type
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

interface MonsterPanelProps {
  onRollDice?: (roll: DiceRoll) => void;
  onAddToken?: (token: Token) => void;
  socketId?: string;
}

export function MonsterPanel({ onRollDice, onAddToken, socketId }: MonsterPanelProps) {
  const { monsters, activeMonster, addMonster, removeMonster, setActiveMonster } = useSessionStore();
  const [showCreator, setShowCreator] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCR, setSelectedCR] = useState<string>('all');

  // Quick create form state
  const [quickName, setQuickName] = useState('');
  const [quickAC, setQuickAC] = useState(10);
  const [quickHP, setQuickHP] = useState(10);
  const [quickCR, setQuickCR] = useState('1');

  // Helper to create a token from a monster
  const createMonsterToken = (monster: Monster): Token => {
    return {
      id: `token-monster-${monster.id}`,
      name: monster.name,
      x: Math.floor(Math.random() * 5) + 1, // Random position 1-5
      y: Math.floor(Math.random() * 5) + 1,
      size: MONSTER_SIZE_TO_TOKEN[monster.size] || 'medium',
      color: MONSTER_TYPE_COLORS[monster.type] || '#D35400',
      isHidden: false, // Monsters visible by default, DM can hide
      maxHp: monster.hitPoints,
      currentHp: monster.hitPoints,
    };
  };

  const handleQuickCreate = () => {
    if (!quickName.trim()) return;

    const newMonster: Monster = {
      id: `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: quickName,
      size: 'Medium',
      type: 'humanoid',
      alignment: 'Unaligned',
      armorClass: quickAC,
      hitPoints: quickHP,
      hitDice: `${Math.ceil(quickHP / 5)}d8`,
      speed: '30 ft.',
      abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      senses: 'passive Perception 10',
      languages: 'Common',
      challengeRating: quickCR,
      xp: getCRXP(quickCR),
      traits: [],
      actions: [
        { id: 'a1', name: 'Attack', description: 'Melee Weapon Attack.', attackBonus: 2, damage: '1d6 damage', reach: '5 ft.' },
      ],
      source: 'Custom',
    };

    addMonster(newMonster);

    // Auto-create token on map
    if (onAddToken) {
      const token = createMonsterToken(newMonster);
      onAddToken(token);
    }

    setQuickName('');
    setQuickAC(10);
    setQuickHP(10);
    setQuickCR('1');
    setShowCreator(false);
  };

  const handleAddPreset = (preset: Partial<Monster>) => {
    const newMonster: Monster = {
      ...preset,
      id: `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as Monster;
    addMonster(newMonster);

    // Auto-create token on map
    if (onAddToken) {
      const token = createMonsterToken(newMonster);
      onAddToken(token);
    }

    setShowPresets(false);
  };

  const handleRollAttack = (name: string, attackBonus: number, _damage: string) => {
    if (!onRollDice) return;

    // Roll attack
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackTotal = attackRoll + attackBonus;
    const isCrit = attackRoll === 20;
    const isFumble = attackRoll === 1;

    const roll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: socketId || 'dm',
      playerName: `${activeMonster?.name || 'Monster'} (${name})`,
      notation: isCrit ? '1d20 (CRIT!)' : isFumble ? '1d20 (MISS!)' : `1d20+${attackBonus}`,
      rolls: [attackRoll],
      modifier: attackBonus,
      total: attackTotal,
      timestamp: new Date().toISOString(),
      isPrivate: false,
    };

    onRollDice(roll);
  };

  const handleRollSave = (ability: keyof AbilityScores, modifier: number) => {
    if (!onRollDice) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + modifier;

    const abilityNames: Record<keyof AbilityScores, string> = {
      strength: 'STR',
      dexterity: 'DEX',
      constitution: 'CON',
      intelligence: 'INT',
      wisdom: 'WIS',
      charisma: 'CHA',
    };

    const diceRoll: DiceRoll = {
      id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: socketId || 'dm',
      playerName: `${activeMonster?.name || 'Monster'} (${abilityNames[ability]} Check)`,
      notation: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
      rolls: [roll],
      modifier,
      total,
      timestamp: new Date().toISOString(),
      isPrivate: false,
    };

    onRollDice(diceRoll);
  };

  const filteredMonsters = monsters.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPresets = MONSTER_PRESETS.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCR = selectedCR === 'all' || m.challengeRating === selectedCR;
    return matchesSearch && matchesCR;
  });

  return (
    <div className="space-y-4">
      {/* Active Monster Stat Block */}
      {activeMonster && (
        <MonsterStatBlock
          monster={activeMonster}
          onClose={() => setActiveMonster(null)}
          onRollAttack={handleRollAttack}
          onRollSave={handleRollSave}
        />
      )}

      {/* Monster Library */}
      {!activeMonster && (
        <>
          {/* Search & Quick Actions */}
          <div className="space-y-2">
            <Input
              placeholder="Search monsters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreator(!showCreator)}
                className="flex-1"
              >
                Quick Create
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPresets(!showPresets)}
                className="flex-1"
              >
                Presets
              </Button>
            </div>
          </div>

          {/* Quick Create Form */}
          {showCreator && (
            <div className="bg-dark-wood p-3 rounded-lg border border-leather space-y-2">
              <h4 className="text-sm font-semibold text-gold">Quick Create Monster</h4>
              <Input
                placeholder="Monster name"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-parchment/70">AC</label>
                  <Input
                    type="number"
                    value={quickAC}
                    onChange={(e) => setQuickAC(parseInt(e.target.value) || 10)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-parchment/70">HP</label>
                  <Input
                    type="number"
                    value={quickHP}
                    onChange={(e) => setQuickHP(parseInt(e.target.value) || 10)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-parchment/70">CR</label>
                  <Input
                    value={quickCR}
                    onChange={(e) => setQuickCR(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleQuickCreate} className="w-full" size="sm">
                Create
              </Button>
            </div>
          )}

          {/* Presets List */}
          {showPresets && (
            <div className="bg-dark-wood p-3 rounded-lg border border-leather">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gold">
                  Monster Presets ({filteredPresets.length})
                </h4>
                <select
                  value={selectedCR}
                  onChange={(e) => setSelectedCR(e.target.value)}
                  className="text-xs bg-leather border border-gold/30 rounded px-2 py-1 text-parchment"
                >
                  <option value="all">All CRs</option>
                  {AVAILABLE_CRS.map(cr => (
                    <option key={cr} value={cr}>CR {cr}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredPresets.length === 0 ? (
                  <p className="text-sm text-parchment/50 text-center py-2">No monsters match filters</p>
                ) : (
                  filteredPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddPreset(preset)}
                      className="w-full text-left p-2 rounded hover:bg-leather/50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <span className="text-parchment text-sm">{preset.name}</span>
                        <div className="text-xs text-parchment/50">
                          {preset.size} {preset.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gold">CR {preset.challengeRating}</span>
                        <div className="text-xs text-parchment/50">
                          HP {preset.hitPoints} | AC {preset.armorClass}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Monster List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-parchment/70">
              Your Monsters ({monsters.length})
            </h4>
            {filteredMonsters.length === 0 ? (
              <p className="text-sm text-parchment/50 text-center py-4">
                No monsters yet. Create or add from presets.
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredMonsters.map((monster) => (
                  <div
                    key={monster.id}
                    className="flex items-center justify-between p-2 rounded bg-dark-wood border border-leather hover:border-gold transition-colors"
                  >
                    <button
                      onClick={() => setActiveMonster(monster)}
                      className="flex-1 text-left"
                    >
                      <span className="text-parchment text-sm font-medium">{monster.name}</span>
                      <div className="flex gap-2 text-xs text-parchment/70">
                        <span>AC {monster.armorClass}</span>
                        <span>HP {monster.hitPoints}</span>
                        <span>CR {monster.challengeRating}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => removeMonster(monster.id)}
                      className="text-red-400 hover:text-red-300 px-2"
                      title="Remove monster"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get XP from CR
function getCRXP(cr: string): number {
  const xpByCR: Record<string, number> = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
    '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
    '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
    '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
    '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
    '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
  };
  return xpByCR[cr] || 0;
}
