import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MonsterStatBlock } from './MonsterStatBlock';
import { useSessionStore } from '../../stores/sessionStore';
import type { Monster, AbilityScores, DiceRoll } from '../../types';

// Common preset monsters for quick access
const PRESET_MONSTERS: Partial<Monster>[] = [
  {
    name: 'Goblin',
    size: 'Small',
    type: 'humanoid',
    alignment: 'Neutral Evil',
    armorClass: 15,
    armorType: 'leather armor, shield',
    hitPoints: 7,
    hitDice: '2d6',
    speed: '30 ft.',
    abilities: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
    skills: { Stealth: 6 },
    senses: 'darkvision 60 ft., passive Perception 9',
    languages: 'Common, Goblin',
    challengeRating: '1/4',
    xp: 50,
    traits: [{ id: 't1', name: 'Nimble Escape', description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }],
    actions: [
      { id: 'a1', name: 'Scimitar', description: 'Melee Weapon Attack. Hit: 5 (1d6+2) slashing damage.', attackBonus: 4, damage: '1d6+2 slashing', reach: '5 ft.' },
      { id: 'a2', name: 'Shortbow', description: 'Ranged Weapon Attack. Hit: 5 (1d6+2) piercing damage.', attackBonus: 4, damage: '1d6+2 piercing', reach: '80/320 ft.', isRanged: true },
    ],
    source: 'Basic Rules',
  },
  {
    name: 'Skeleton',
    size: 'Medium',
    type: 'undead',
    alignment: 'Lawful Evil',
    armorClass: 13,
    armorType: 'armor scraps',
    hitPoints: 13,
    hitDice: '2d8+4',
    speed: '30 ft.',
    abilities: { strength: 10, dexterity: 14, constitution: 15, intelligence: 6, wisdom: 8, charisma: 5 },
    damageVulnerabilities: ['bludgeoning'],
    damageImmunities: ['poison'],
    conditionImmunities: ['exhausted', 'poisoned'],
    senses: 'darkvision 60 ft., passive Perception 9',
    languages: 'understands languages it knew in life but can\'t speak',
    challengeRating: '1/4',
    xp: 50,
    traits: [],
    actions: [
      { id: 'a1', name: 'Shortsword', description: 'Melee Weapon Attack. Hit: 5 (1d6+2) piercing damage.', attackBonus: 4, damage: '1d6+2 piercing', reach: '5 ft.' },
      { id: 'a2', name: 'Shortbow', description: 'Ranged Weapon Attack. Hit: 5 (1d6+2) piercing damage.', attackBonus: 4, damage: '1d6+2 piercing', reach: '80/320 ft.', isRanged: true },
    ],
    source: 'Basic Rules',
  },
  {
    name: 'Zombie',
    size: 'Medium',
    type: 'undead',
    alignment: 'Neutral Evil',
    armorClass: 8,
    hitPoints: 22,
    hitDice: '3d8+9',
    speed: '20 ft.',
    abilities: { strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5 },
    savingThrows: { wisdom: 0 },
    damageImmunities: ['poison'],
    conditionImmunities: ['poisoned'],
    senses: 'darkvision 60 ft., passive Perception 8',
    languages: 'understands languages it knew in life but can\'t speak',
    challengeRating: '1/4',
    xp: 50,
    traits: [{ id: 't1', name: 'Undead Fortitude', description: 'If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead.' }],
    actions: [
      { id: 'a1', name: 'Slam', description: 'Melee Weapon Attack. Hit: 4 (1d6+1) bludgeoning damage.', attackBonus: 3, damage: '1d6+1 bludgeoning', reach: '5 ft.' },
    ],
    source: 'Basic Rules',
  },
  {
    name: 'Orc',
    size: 'Medium',
    type: 'humanoid',
    alignment: 'Chaotic Evil',
    armorClass: 13,
    armorType: 'hide armor',
    hitPoints: 15,
    hitDice: '2d8+6',
    speed: '30 ft.',
    abilities: { strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10 },
    skills: { Intimidation: 2 },
    senses: 'darkvision 60 ft., passive Perception 10',
    languages: 'Common, Orc',
    challengeRating: '1/2',
    xp: 100,
    traits: [{ id: 't1', name: 'Aggressive', description: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.' }],
    actions: [
      { id: 'a1', name: 'Greataxe', description: 'Melee Weapon Attack. Hit: 9 (1d12+3) slashing damage.', attackBonus: 5, damage: '1d12+3 slashing', reach: '5 ft.' },
      { id: 'a2', name: 'Javelin', description: 'Melee or Ranged Weapon Attack. Hit: 6 (1d6+3) piercing damage.', attackBonus: 5, damage: '1d6+3 piercing', reach: '30/120 ft.' },
    ],
    source: 'Basic Rules',
  },
  {
    name: 'Wolf',
    size: 'Medium',
    type: 'beast',
    alignment: 'Unaligned',
    armorClass: 13,
    armorType: 'natural armor',
    hitPoints: 11,
    hitDice: '2d8+2',
    speed: '40 ft.',
    abilities: { strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6 },
    skills: { Perception: 3, Stealth: 4 },
    senses: 'passive Perception 13',
    languages: '—',
    challengeRating: '1/4',
    xp: 50,
    traits: [
      { id: 't1', name: 'Keen Hearing and Smell', description: 'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.' },
      { id: 't2', name: 'Pack Tactics', description: 'The wolf has advantage on attack rolls against a creature if at least one of the wolf\'s allies is within 5 feet of the creature and the ally isn\'t incapacitated.' },
    ],
    actions: [
      { id: 'a1', name: 'Bite', description: 'Melee Weapon Attack. Hit: 4 (1d4+2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone.', attackBonus: 4, damage: '1d4+2 piercing', reach: '5 ft.' },
    ],
    source: 'Basic Rules',
  },
  {
    name: 'Bandit',
    size: 'Medium',
    type: 'humanoid',
    alignment: 'Any Non-Lawful',
    armorClass: 12,
    armorType: 'leather armor',
    hitPoints: 11,
    hitDice: '2d8+2',
    speed: '30 ft.',
    abilities: { strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
    senses: 'passive Perception 10',
    languages: 'Any one language (usually Common)',
    challengeRating: '1/8',
    xp: 25,
    traits: [],
    actions: [
      { id: 'a1', name: 'Scimitar', description: 'Melee Weapon Attack. Hit: 3 (1d6) slashing damage.', attackBonus: 3, damage: '1d6 slashing', reach: '5 ft.' },
      { id: 'a2', name: 'Light Crossbow', description: 'Ranged Weapon Attack. Hit: 3 (1d8) piercing damage.', attackBonus: 3, damage: '1d8 piercing', reach: '80/320 ft.', isRanged: true },
    ],
    source: 'Basic Rules',
  },
];

interface MonsterPanelProps {
  onRollDice?: (roll: DiceRoll) => void;
  socketId?: string;
}

export function MonsterPanel({ onRollDice, socketId }: MonsterPanelProps) {
  const { monsters, activeMonster, addMonster, removeMonster, setActiveMonster } = useSessionStore();
  const [showCreator, setShowCreator] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick create form state
  const [quickName, setQuickName] = useState('');
  const [quickAC, setQuickAC] = useState(10);
  const [quickHP, setQuickHP] = useState(10);
  const [quickCR, setQuickCR] = useState('1');

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

  const filteredPresets = PRESET_MONSTERS.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="bg-dark-wood p-3 rounded-lg border border-leather max-h-48 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gold mb-2">Common Monsters</h4>
              <div className="space-y-1">
                {filteredPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddPreset(preset)}
                    className="w-full text-left p-2 rounded hover:bg-leather/50 transition-colors flex justify-between items-center"
                  >
                    <span className="text-parchment text-sm">{preset.name}</span>
                    <span className="text-xs text-parchment/70">CR {preset.challengeRating}</span>
                  </button>
                ))}
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
