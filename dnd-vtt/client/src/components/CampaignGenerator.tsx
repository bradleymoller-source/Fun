import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSessionStore } from '../stores/sessionStore';
import type { Condition, InitiativeEntry, StoreItem, LootItem } from '../types';

interface GeneratedNPC {
  name: string;
  race: string;
  occupation: string;
  personality: string;
  motivation: string;
  secret?: string;
  isAlly: boolean;
}

interface GeneratedLocation {
  name: string;
  type: string;
  description: string;
  features: string[];
  encounters?: string[];
  treasure?: string[];
}

interface GeneratedEncounter {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  monsters: { name: string; count: number; cr: string }[];
  tactics: string;
  rewards: string[];
}

interface DungeonRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'entrance' | 'corridor' | 'room' | 'boss' | 'treasure' | 'trap' | 'secret';
  name: string;
  description: string;
  connections: string[];
  features?: string[];
  exits?: string[];
  contentFlags?: {
    hasBattle?: boolean;
    hasTrap?: boolean;
    hasTreasure?: boolean;
    hasSecret?: boolean;
    hasPuzzle?: boolean;
    isBoss?: boolean;
    isRitual?: boolean;
    isOptional?: boolean;
    isSecretEntrance?: boolean;
    isCave?: boolean;
  };
  outline?: string;
  accessRequirement?: {
    type: 'none' | 'key' | 'puzzle' | 'secret' | 'passphrase' | 'boss_defeated' | 'ritual';
    keyId?: string;
    keyLocation?: string;
    description?: string;
    dcCheck?: number;
  };
  guardian?: {
    type: 'combat' | 'trap' | 'puzzle' | 'guardian_spirit' | 'curse';
    description: string;
  };
  ritualEffect?: {
    description: string;
    bossDebuff: string;
  };
  pathType?: 'critical' | 'optional' | 'secret' | 'shortcut' | 'secret_entrance';
  terrain?: 'constructed' | 'cave' | 'mixed';
  storyElement?: {
    type: 'dead_adventurer' | 'ancient_battle' | 'warning_signs' | 'previous_expedition' | 'natural_disaster' | 'ritual_aftermath';
    description: string;
    loot?: string[];
    clues?: string[];
  };
}

interface DungeonMap {
  name: string;
  width: number;
  height: number;
  rooms: DungeonRoom[];
  theme: string;
  keys?: Array<{
    id: string;
    name: string;
    description: string;
    locationRoomId: string;
    unlocksRoomId: string;
    unlockType: string;
  }>;
  ritualCount?: number;
  secretCount?: number;
  shortcutCount?: number;
  secretEntrances?: Array<{
    id: string;
    name: string;
    description: string;
    leadsToRoomId: string;
    discoveryMethods: Array<{
      type: 'tracks' | 'npc_info' | 'map' | 'research' | 'exploration';
      description: string;
      dcCheck?: number;
      skillCheck?: string;
      npcName?: string;
      cost?: string;
    }>;
    advantages: string[];
  }>;
  storyElements?: Array<{
    id: string;
    name: string;
    description: string;
    roomId: string;
    type: 'dead_adventurer' | 'ancient_battle' | 'warning_signs' | 'previous_expedition' | 'natural_disaster' | 'ritual_aftermath';
    loot?: string[];
    clues?: string[];
    dcToNotice?: number;
  }>;
  hasCaveSections?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GeneratedCampaign {
  title: string;
  synopsis: string;
  hook: string;
  targetDuration?: string;
  arc: {
    beginning: string;
    middle: string;
    climax: string;
    resolution: string;
  };
  overview?: any;
  act1?: any;
  act2?: any;
  act3?: any;
  epilogue?: any;
  npcs: GeneratedNPC[];
  locations: GeneratedLocation[];
  encounters: GeneratedEncounter[];
  sessionOutlines: { number: number; title: string; summary: string; objectives: string[] }[];
  dungeonMap?: DungeonMap;
  _partial?: boolean;
  _error?: string;
}

interface CampaignGeneratorProps {
  onCampaignGenerated?: (campaign: GeneratedCampaign) => void;
  onDungeonGenerated?: (dungeon: DungeonMap) => void;
  // Socket functions passed from parent (DMView) to ensure same connection
  addInitiativeEntry: (entry: InitiativeEntry) => Promise<void>;
  startCombat: () => Promise<void>;
  addToken: (token: any) => Promise<void>;
  // Store/Loot functions
  addStoreItem: (item: StoreItem) => Promise<void>;
  addLootItem: (item: LootItem) => Promise<void>;
  distributeItem: (lootItemId: string, playerId: string, playerName: string, quantity: number) => Promise<void>;
}

// Adventure Types - the core structure of the adventure
const ADVENTURE_TYPES = [
  { value: 'dungeon_crawl', label: 'Dungeon Crawl', description: 'Classic exploration of dangerous underground locations' },
  { value: 'heist', label: 'Heist & Infiltration', description: 'Planning phase + execution with security obstacles' },
  { value: 'siege', label: 'Siege Warfare', description: 'Defend or attack a fortified location over multiple days' },
  { value: 'monster_hunt', label: 'Monster Hunt', description: 'Track a creature through clues before confrontation' },
  { value: 'naval', label: 'Naval Adventure', description: 'Ship-based exploration with sea combat and islands' },
  { value: 'caravan', label: 'Caravan Escort', description: 'Protect travelers with survival challenges and ambushes' },
  { value: 'political', label: 'Political Intrigue', description: 'Court drama, factions, espionage, power struggles' },
  { value: 'mystery', label: 'Mystery Investigation', description: 'Gather clues, interview suspects, solve puzzles' },
  { value: 'city_raid', label: 'City Raid', description: 'Urban combat with civilians, vertical terrain' },
  { value: 'rescue', label: 'Rescue Mission', description: 'Save hostages with time pressure and moral choices' },
  { value: 'tournament', label: 'Tournament', description: 'Competitions testing combat, wit, and skills' },
  { value: 'survival', label: 'Wilderness Survival', description: 'Environment as adversary, resource management' },
];

const THEMES = [
  'Classic Fantasy',
  'Dark Fantasy',
  'Gothic Horror',
  'Undead Apocalypse',
  'Dragon Tyranny',
  'Demon Invasion',
  'Ancient Ruins',
  'Celestial Conflict',
  'Time Travel',
  'Cult Investigation',
  'Fey Bargains',
  'Environmental Collapse',
  'Trade War',
  'Mythic Quest',
  'Planar Adventure',
];

const SETTINGS = [
  'Medieval Kingdom',
  'Coastal Town',
  'Mountain Fortress',
  'Underground Caverns',
  'Haunted Forest',
  'Desert Wasteland',
  'Frozen North',
  'Volcanic Islands',
  'Floating City',
  'Underdark',
  'Arctic Tundra',
  'Jungle Rainforest',
  'Ship at Sea',
  'Feywild',
  'Urban Metropolis',
  'War-torn Countryside',
  'Festival Grounds',
  'Airship Fleet',
];

const TONES = [
  { value: 'serious', label: 'Serious & Dark' },
  { value: 'lighthearted', label: 'Lighthearted & Fun' },
  { value: 'horror', label: 'Horror & Suspense' },
  { value: 'epic', label: 'Epic & Heroic' },
];

// Story metrics for more engaging campaigns
const STAKES_LEVELS = [
  { value: 'personal', label: 'Personal', description: 'Character goals and relationships' },
  { value: 'regional', label: 'Regional', description: 'Town or kingdom at risk' },
  { value: 'world', label: 'World-Ending', description: 'Apocalyptic consequences' },
];

const MORAL_COMPLEXITY = [
  { value: 'clear', label: 'Clear Good vs Evil', description: 'Traditional heroic adventure' },
  { value: 'gray', label: 'Gray Morality', description: 'No perfect choices, nuanced villains' },
  { value: 'dark', label: 'No Good Options', description: 'Choose the lesser evil' },
];

const TIME_PRESSURE = [
  { value: 'relaxed', label: 'Relaxed', description: 'No urgency, explore at will' },
  { value: 'moderate', label: 'Moderate', description: 'Deadlines but flexibility' },
  { value: 'urgent', label: 'Urgent', description: 'Clear countdown, tension throughout' },
  { value: 'critical', label: 'Critical', description: 'Every moment counts' },
];

const PRIMARY_PILLAR = [
  { value: 'combat', label: 'Combat-Heavy', description: 'Focus on tactical battles' },
  { value: 'exploration', label: 'Exploration', description: 'Discovery and environment' },
  { value: 'social', label: 'Social/RP', description: 'NPCs and dialogue-driven' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of all three' },
];

// Server URL - same as socket connection
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Room type colors for dungeon map
const ROOM_COLORS: Record<DungeonRoom['type'], string> = {
  entrance: '#4CAF50',
  corridor: '#9E9E9E',
  room: '#2196F3',
  boss: '#E91E63',
  treasure: '#FFD700',
  trap: '#FF5722',
  secret: '#9C27B0',
};

export function CampaignGenerator({ onCampaignGenerated, onDungeonGenerated, addInitiativeEntry, startCombat, addToken, addStoreItem, addLootItem, distributeItem }: CampaignGeneratorProps) {
  // Form state
  const [adventureType, setAdventureType] = useState(ADVENTURE_TYPES[0].value);
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [customSetting, setCustomSetting] = useState('');
  const [partyLevel, setPartyLevel] = useState(1);
  const [partySize, setPartySize] = useState(4);
  const [sessionCount, setSessionCount] = useState(1);
  const [tone, setTone] = useState<'serious' | 'lighthearted' | 'horror' | 'epic'>('serious');
  const [stakes, setStakes] = useState('regional');
  const [moralComplexity, setMoralComplexity] = useState('gray');
  const [timePressure, setTimePressure] = useState('moderate');
  const [primaryPillar, setPrimaryPillar] = useState('balanced');
  const [includeMap, setIncludeMap] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'act1' | 'act2' | 'act3' | 'epilogue' | 'npcs' | 'locations' | 'encounters' | 'sessions' | 'map' | 'battlemaps'>('overview');
  const [selectedRoom, setSelectedRoom] = useState<DungeonRoom | null>(null);

  // Battle map state
  const [battleMaps, setBattleMaps] = useState<Record<string, string>>({});
  const [generatingMapId, setGeneratingMapId] = useState<string | null>(null);

  // Scene image state
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);

  // Saved battle maps list
  const [savedMaps, setSavedMaps] = useState<Array<{ id: string; name: string; imageUrl: string; type: string }>>([]);

  // Track which maps were added to the game library
  const [addedToLibrary, setAddedToLibrary] = useState<Set<string>>(new Set());

  // Get session store for adding maps to the game's Map Library and local state
  const { addMapToLibrary, isInCombat, players } = useSessionStore();

  // State for giving items to players
  const [giveToPlayer, setGiveToPlayer] = useState<{ items: any[]; source: string } | null>(null);

  // Add shop inventory to store
  const handleAddShopToStore = async (shop: { name: string; inventory?: { item: string; cost: string; type?: string; effect?: string; rarity?: string; description?: string }[] }) => {
    if (!shop.inventory) return;

    for (const inventoryItem of shop.inventory) {
      const storeItem: StoreItem = {
        id: `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: inventoryItem.item,
        price: inventoryItem.cost,
        quantity: -1, // Unlimited for shops
        effect: inventoryItem.effect,
        description: inventoryItem.description || (inventoryItem.type ? `${inventoryItem.rarity || 'Common'} ${inventoryItem.type}` : undefined),
      };
      await addStoreItem(storeItem);
    }
  };

  // Add encounter/room loot to loot pool
  const handleAddToLoot = async (items: {
    item: string;
    value: string;
    type?: string;
    effect?: string;
    description?: string;  // Story description for clue items
    damage?: string;
    attackBonus?: number;
    armorClass?: number;
    armorType?: 'light' | 'medium' | 'heavy' | 'shield';
    rarity?: string;
    baseWeaponType?: string;
  }[], source: string) => {
    for (const lootEntry of items) {
      // For clue items, use description field; for other items, use effect or generate placeholder
      let itemDescription = lootEntry.description || lootEntry.effect;

      // If this is a clue item without a description, add a placeholder that indicates it needs DM input
      if (lootEntry.type === 'clue' && !itemDescription) {
        itemDescription = `[DM: Add story description for this clue - ${lootEntry.item}]`;
      }

      const lootItem: LootItem = {
        id: `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: lootEntry.item,
        value: lootEntry.value,
        quantity: 1,
        source: source,
        description: itemDescription,
        // Item type categorization
        itemType: lootEntry.type as LootItem['itemType'],
        // Weapon fields
        damage: lootEntry.damage,
        attackBonus: lootEntry.attackBonus,
        baseWeaponType: lootEntry.baseWeaponType,
        // Armor fields
        armorClass: lootEntry.armorClass,
        armorType: lootEntry.armorType,
        // Magic item info
        effect: lootEntry.effect,
        rarity: lootEntry.rarity,
      };
      await addLootItem(lootItem);
    }
  };

  // Give items directly to a player (creates loot then distributes)
  const handleGiveToPlayer = async (playerId: string, playerName: string) => {
    if (!giveToPlayer || !distributeItem) return;

    for (const lootEntry of giveToPlayer.items) {
      // First add to loot pool
      const lootItem: LootItem = {
        id: `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: lootEntry.item,
        value: lootEntry.value,
        quantity: 1,
        source: giveToPlayer.source,
        description: lootEntry.effect,
        itemType: lootEntry.type as LootItem['itemType'],
        damage: lootEntry.damage,
        attackBonus: lootEntry.attackBonus,
        armorClass: lootEntry.armorClass,
        armorType: lootEntry.armorType,
        effect: lootEntry.effect,
        rarity: lootEntry.rarity,
      };
      await addLootItem(lootItem);

      // Then distribute to player
      try {
        await distributeItem(lootItem.id, playerId, playerName, 1);
      } catch (err) {
        console.error('Failed to distribute item:', err);
      }
    }
    setGiveToPlayer(null);
  };

  // Monster colors for token differentiation
  const MONSTER_COLORS = [
    '#dc2626', // red
    '#ea580c', // orange
    '#ca8a04', // yellow
    '#16a34a', // green
    '#0891b2', // cyan
    '#2563eb', // blue
    '#7c3aed', // purple
    '#db2777', // pink
  ];

  // Helper to roll a d20
  const rollD20 = () => Math.floor(Math.random() * 20) + 1;

  // Helper to estimate CR modifier (simplified)
  const getCrModifier = (cr: string): number => {
    const crMap: Record<string, number> = {
      '0': -2, '1/8': -1, '1/4': 0, '1/2': 1,
      '1': 1, '2': 2, '3': 2, '4': 2, '5': 3,
      '6': 3, '7': 3, '8': 3, '9': 4, '10': 4,
      '11': 4, '12': 5, '13': 5, '14': 5, '15': 5,
    };
    return crMap[cr] || 0;
  };

  // Map monster size string to token size
  const getTokenSize = (size: string): 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' => {
    const sizeMap: Record<string, 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'> = {
      'tiny': 'tiny',
      'small': 'small',
      'medium': 'medium',
      'large': 'large',
      'huge': 'huge',
      'gargantuan': 'gargantuan',
    };
    return sizeMap[size?.toLowerCase()] || 'medium';
  };

  // Start an encounter - add monsters to tokens and combat tracker
  const handleStartEncounter = async (encounter: any) => {
    const monsters = encounter.enemies || encounter.monsters || [];
    if (monsters.length === 0) {
      alert('No monsters found in this encounter');
      return;
    }

    let tokenIndex = 0;
    const gridStartX = 10; // Starting grid position
    const gridStartY = 5;
    const tokensPerRow = 4;

    // Build summary of added monsters with their stats
    const addedMonsters: string[] = [];

    // Collect all tokens and initiative entries to add
    const tokensToAdd: Array<any> = [];
    const initiativeEntries: Array<{
      id: string;
      name: string;
      initiative: number;
      isNpc: boolean;
      isActive: boolean;
      tokenId: string;
      maxHp: number;
      currentHp: number;
      conditions: Condition[];
      monsterStats: any;
    }> = [];

    monsters.forEach((monster: any, monsterTypeIndex: number) => {
      const count = monster.count || 1;
      const color = MONSTER_COLORS[monsterTypeIndex % MONSTER_COLORS.length];

      // Use initiative modifier from monster data, or fall back to CR-based estimate
      const initMod = monster.initiative ?? getCrModifier(monster.cr || '1');

      // Get token size from monster data
      const tokenSize = getTokenSize(monster.size || 'medium');

      // Build stat summary for the alert
      const attackSummary = monster.attacks?.map((a: any) =>
        `${a.name}: +${a.bonus} (${a.damage} ${a.damageType})`
      ).join(', ') || 'No attacks listed';

      const spellSummary = monster.spells?.length > 0 ?
        monster.spells.map((s: any) =>
          `${s.name}${s.damage ? ` (${s.damage})` : ''}${s.save ? ` ${s.save}` : ''}`
        ).join(', ') : null;

      addedMonsters.push(
        `${count}x ${monster.name} - AC ${monster.ac || '?'}, HP ${monster.hp || '?'}, Init +${initMod}\n` +
        `  Attacks: ${attackSummary}` +
        (spellSummary ? `\n  Spells: ${spellSummary}` : '')
      );

      for (let i = 0; i < count; i++) {
        const tokenId = `enc-${Date.now()}-${tokenIndex}`;
        const initiativeId = `init-${Date.now()}-${tokenIndex}`;
        const name = count > 1 ? `${monster.name} ${i + 1}` : monster.name;

        // Calculate grid position (arrange in a grid pattern)
        // Larger creatures need more space
        const sizeMultiplier = tokenSize === 'large' ? 2 : tokenSize === 'huge' ? 3 : tokenSize === 'gargantuan' ? 4 : 1;
        const row = Math.floor(tokenIndex / tokensPerRow);
        const col = (tokenIndex % tokensPerRow) * sizeMultiplier;

        // Collect token to add later
        tokensToAdd.push({
          id: tokenId,
          name,
          x: gridStartX + col,
          y: gridStartY + row * sizeMultiplier,
          size: tokenSize,
          color,
          isHidden: false,
          maxHp: monster.hp || 20,
          currentHp: monster.hp || 20,
          conditions: [],
        });

        // Build monster stats object for initiative tracker
        const monsterStats = {
          cr: monster.cr,
          ac: monster.ac,
          acType: monster.acType,
          speed: monster.speed,
          size: monster.size,
          type: monster.type,
          abilities: monster.abilities,
          attacks: monster.attacks,
          spells: monster.spells,
          traits: monster.traits,
          resistances: monster.resistances,
          immunities: monster.immunities,
          savingThrows: monster.savingThrows,
          skills: monster.skills,
          senses: monster.senses,
          languages: monster.languages,
          legendaryActions: monster.legendaryActions,
          legendaryActionCount: monster.legendaryActionCount,
        };

        // Roll initiative using the monster's initiative modifier
        const initiativeRoll = rollD20() + initMod;
        initiativeEntries.push({
          id: initiativeId,
          name,
          initiative: initiativeRoll,
          isNpc: true,
          isActive: false,
          tokenId,
          maxHp: monster.hp || 20,
          currentHp: monster.hp || 20,
          conditions: [],
          monsterStats,
        });

        tokenIndex++;
      }
    });

    // Add all tokens and initiative entries to server
    try {
      // Add tokens first
      for (const token of tokensToAdd) {
        await addToken(token);
      }

      // Add initiative entries
      for (const entry of initiativeEntries) {
        await addInitiativeEntry(entry);
      }

      // Start combat if not already in combat
      if (!isInCombat) {
        await startCombat();
      }

      // Show summary alert with stats
      alert(
        `⚔️ Encounter Started!\n\n` +
        `Added ${tokenIndex} enemies to map and combat tracker:\n\n` +
        addedMonsters.join('\n\n')
      );
    } catch (error) {
      console.error('Failed to start encounter:', error);
      alert('Failed to start encounter. Make sure you are connected to a session.');
    }
  };

  // Save a battle map to the list AND add to Map Library
  const handleSaveMap = (id: string, name: string, imageUrl: string, type: string = 'dungeon') => {
    // Check if already saved locally
    if (!savedMaps.some(m => m.imageUrl === imageUrl)) {
      setSavedMaps(prev => [...prev, { id, name, imageUrl, type }]);
    }
    // Also add to the main Map Library so it appears in Map Controls
    if (!addedToLibrary.has(imageUrl)) {
      addMapToLibrary(name, imageUrl);
      setAddedToLibrary(prev => new Set(prev).add(imageUrl));
    }
  };

  // Remove a saved map
  const handleRemoveSavedMap = (imageUrl: string) => {
    setSavedMaps(prev => prev.filter(m => m.imageUrl !== imageUrl));
  };

  // Add a generated map to the game's Map Library
  const handleAddToGameLibrary = (name: string, imageUrl: string) => {
    addMapToLibrary(name, imageUrl);
    setAddedToLibrary(prev => new Set(prev).add(imageUrl));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adventureType,
          theme: customTheme || theme,
          setting: customSetting || setting,
          partyLevel,
          partySize,
          sessionCount,
          tone,
          stakes,
          moralComplexity,
          timePressure,
          primaryPillar,
          includeMap,
        }),
      });

      // Get response text first to handle non-JSON responses
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Response is not JSON - likely a server error or HTML error page
        console.error('Non-JSON response:', responseText.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate campaign');
      }

      setCampaign(data);
      if (onCampaignGenerated) onCampaignGenerated(data);
      if (data.dungeonMap && onDungeonGenerated) {
        onDungeonGenerated(data.dungeonMap);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Campaign generation error:', message);
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDungeon = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/dungeon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: customTheme || theme,
          partyLevel,
          enhance: true,
        }),
      });

      // Get response text first to handle non-JSON responses
      const responseText = await response.text();

      // Try to parse as JSON
      let dungeonMap;
      try {
        dungeonMap = JSON.parse(responseText);
      } catch {
        console.error('Non-JSON response:', responseText.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(dungeonMap.error || dungeonMap.details || 'Failed to generate dungeon');
      }

      if (campaign) {
        setCampaign({ ...campaign, dungeonMap });
      } else {
        setCampaign({
          title: `${dungeonMap.name}`,
          synopsis: 'A procedurally generated dungeon adventure.',
          hook: 'Explore the mysterious dungeon.',
          arc: { beginning: '', middle: '', climax: '', resolution: '' },
          npcs: [],
          locations: [],
          encounters: [],
          sessionOutlines: [],
          dungeonMap,
        });
      }
      if (onDungeonGenerated) onDungeonGenerated(dungeonMap);
      setActiveTab('map');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Dungeon generation error:', message);
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate a detailed battle map image for a specific location
  const handleGenerateBattleMap = async (
    id: string,
    environment: string,
    theme: string,
    features: string[] = [],
    lighting: string = 'torchlit',
    description: string = ''
  ) => {
    setGeneratingMapId(id);
    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/battlemap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, theme, features, lighting, roomName: environment, description }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setBattleMaps(prev => ({ ...prev, [id]: data.imageUrl }));
      }
    } catch (err) {
      console.error('Battle map generation error:', err);
    } finally {
      setGeneratingMapId(null);
    }
  };

  // Generate all battle maps for Act 2 rooms
  const handleGenerateAllBattleMaps = async () => {
    if (!campaign?.act2?.rooms) return;

    setGeneratingMapId('all');
    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/battlemaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rooms: campaign.act2.rooms,
          dungeonTheme: campaign.act2.dungeonOverview?.name || campaign.title
        }),
      });

      const data = await response.json();
      if (data.battleMaps) {
        const newMaps: Record<string, string> = {};
        data.battleMaps.forEach((map: any) => {
          newMaps[`room-${map.roomId}`] = map.imageUrl;
        });
        setBattleMaps(prev => ({ ...prev, ...newMaps }));
      }
    } catch (err) {
      console.error('Batch battle map generation error:', err);
    } finally {
      setGeneratingMapId(null);
    }
  };

  // Generate a beautiful scene image for a location
  const handleGenerateSceneImage = async (
    id: string,
    location: string,
    mood: string = 'vibrant and inviting',
    timeOfDay: string = 'golden hour sunset'
  ) => {
    setGeneratingSceneId(id);
    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/scene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, mood, timeOfDay, name: id }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setSceneImages(prev => ({ ...prev, [id]: data.imageUrl }));
      }
    } catch (err) {
      console.error('Scene image generation error:', err);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const renderDungeonMap = () => {
    if (!campaign?.dungeonMap) return null;

    const { dungeonMap } = campaign;
    const cellSize = 20;
    const width = dungeonMap.width * cellSize;
    const height = dungeonMap.height * cellSize;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-gold font-medieval">{dungeonMap.name}</h3>
          <Button size="sm" variant="secondary" onClick={handleGenerateDungeon}>
            Regenerate Map
          </Button>
        </div>

        {/* Map Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(ROOM_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-parchment/70 capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Map Canvas */}
        <div className="overflow-auto bg-dark-wood/50 p-2 rounded-lg border border-leather">
          <svg width={width} height={height} className="min-w-full">
            {/* Grid */}
            {Array.from({ length: dungeonMap.width }).map((_, x) =>
              Array.from({ length: dungeonMap.height }).map((_, y) => (
                <rect
                  key={`grid-${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="none"
                  stroke="#333"
                  strokeWidth={0.5}
                />
              ))
            )}

            {/* Rooms */}
            {dungeonMap.rooms.map((room) => (
              <g key={room.id}>
                <rect
                  x={room.x * cellSize}
                  y={room.y * cellSize}
                  width={room.width * cellSize}
                  height={room.height * cellSize}
                  fill={ROOM_COLORS[room.type]}
                  stroke={selectedRoom?.id === room.id ? '#FFD700' : '#000'}
                  strokeWidth={selectedRoom?.id === room.id ? 3 : 1}
                  rx={4}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedRoom(room)}
                />
                {/* Room label */}
                {room.width >= 2 && room.height >= 2 && (
                  <text
                    x={room.x * cellSize + (room.width * cellSize) / 2}
                    y={room.y * cellSize + (room.height * cellSize) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={10}
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {room.id.split('-')[1]}
                  </text>
                )}
              </g>
            ))}

            {/* Connections */}
            {dungeonMap.rooms.map((room) =>
              room.connections.map((connId) => {
                const connected = dungeonMap.rooms.find((r) => r.id === connId);
                if (!connected) return null;

                const x1 = (room.x + room.width / 2) * cellSize;
                const y1 = (room.y + room.height / 2) * cellSize;
                const x2 = (connected.x + connected.width / 2) * cellSize;
                const y2 = (connected.y + connected.height / 2) * cellSize;

                return (
                  <line
                    key={`${room.id}-${connId}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#666"
                    strokeWidth={2}
                    strokeDasharray="4,2"
                  />
                );
              })
            )}
          </svg>
        </div>

        {/* Selected Room Details */}
        {selectedRoom && (
          <div className="bg-leather/30 p-3 rounded-lg border border-gold/30">
            <div className="flex justify-between items-start">
              <h4 className="text-gold font-medieval">{selectedRoom.name}</h4>
              <span className="text-xs px-2 py-1 rounded capitalize"
                style={{ backgroundColor: ROOM_COLORS[selectedRoom.type], color: 'white' }}>
                {selectedRoom.type}
              </span>
            </div>
            <p className="text-parchment/80 text-sm mt-2">{selectedRoom.description}</p>
            {selectedRoom.features && selectedRoom.features.length > 0 && (
              <div className="mt-2">
                <span className="text-parchment/60 text-xs">Features:</span>
                <ul className="text-parchment/80 text-sm list-disc list-inside">
                  {selectedRoom.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRoom.connections.length > 0 && (
              <div className="mt-2 text-xs text-parchment/50">
                Connects to: {selectedRoom.connections.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Room List */}
        <div className="max-h-40 overflow-y-auto space-y-1">
          {dungeonMap.rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full text-left px-2 py-1 rounded text-sm flex justify-between items-center transition-colors ${
                selectedRoom?.id === room.id
                  ? 'bg-gold/20 border border-gold'
                  : 'bg-leather/20 hover:bg-leather/40'
              }`}
            >
              <span className="text-parchment">{room.name}</span>
              <span
                className="text-xs px-1 rounded capitalize"
                style={{ backgroundColor: ROOM_COLORS[room.type], color: 'white' }}
              >
                {room.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview' },
      ...(campaign?.act1 ? [{ id: 'act1', label: 'Act 1' }] : []),
      ...(campaign?.act2 ? [{ id: 'act2', label: 'Act 2' }] : []),
      ...(campaign?.act3 ? [{ id: 'act3', label: 'Act 3' }] : []),
      ...(campaign?.epilogue ? [{ id: 'epilogue', label: 'Epilogue' }] : []),
      { id: 'npcs', label: 'NPCs' },
      { id: 'encounters', label: 'Encounters' },
      ...(campaign?.dungeonMap ? [{ id: 'map', label: 'Overview Map' }] : []),
      { id: 'battlemaps', label: 'Battle Maps' },
    ];

    return (
      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-gold text-dark-wood font-bold'
                : 'bg-leather/50 text-parchment hover:bg-leather'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  // Helper to render read-aloud text boxes
  const renderReadAloud = (text: string) => (
    <div className="bg-amber-900/30 border-l-4 border-amber-500 p-3 rounded-r-lg italic text-parchment/90 text-sm whitespace-pre-wrap">
      {text}
    </div>
  );

  // Helper to render NPC with dialogue
  const renderNpcDetail = (npc: any, index: number) => (
    <div key={index} className="bg-dark-wood/50 p-3 rounded-lg border border-leather mb-3">
      <h4 className="text-gold font-medieval">{npc.name}</h4>
      {npc.role && <p className="text-amber-400 text-xs">{npc.role}</p>}
      {npc.appearance && <p className="text-parchment/70 text-sm mt-1">{npc.appearance}</p>}
      {npc.personality && <p className="text-parchment/80 text-sm mt-1">{npc.personality}</p>}
      {npc.dialogue && (
        <div className="mt-2 space-y-1">
          {npc.dialogue.greeting && <p className="text-blue-300 text-xs"><strong>Greeting:</strong> "{npc.dialogue.greeting}"</p>}
          {npc.dialogue.questPitch && <p className="text-green-300 text-xs"><strong>Quest:</strong> "{npc.dialogue.questPitch}"</p>}
          {npc.dialogue.gossip && <p className="text-purple-300 text-xs"><strong>Gossip:</strong> "{npc.dialogue.gossip}"</p>}
        </div>
      )}
      {npc.keyInformation && (
        <ul className="mt-2 text-xs text-parchment/70 list-disc list-inside">
          {npc.keyInformation.map((info: string, i: number) => <li key={i}>{info}</li>)}
        </ul>
      )}
      {npc.services && npc.services.length > 0 && (
        <div className="mt-2 text-xs">
          <strong className="text-gold">Services:</strong>
          {npc.services.map((s: any, i: number) => (
            <span key={i} className="ml-2 text-parchment/70">{s.item}: {s.cost}</span>
          ))}
        </div>
      )}
    </div>
  );

  // Helper to render room
  const renderRoom = (room: any, index: number) => (
    <div key={index} className="bg-dark-wood/50 p-3 rounded-lg border border-leather mb-3">
      <div className="flex justify-between items-start">
        <h4 className="text-gold font-medieval">Room {room.id}: {room.name}</h4>
        {room.dimensions && <span className="text-xs text-parchment/50">{room.dimensions}</span>}
      </div>
      {room.readAloud && <div className="mt-2">{renderReadAloud(room.readAloud)}</div>}
      {room.contents && (
        <div className="mt-2 text-xs">
          {room.contents.obvious && <p className="text-parchment/70"><strong>Visible:</strong> {room.contents.obvious.join(', ')}</p>}
          {room.contents.hidden && <p className="text-amber-400/70"><strong>Hidden:</strong> {room.contents.hidden.join(', ')}</p>}
        </div>
      )}
      {room.exits && <p className="text-xs text-blue-300 mt-1"><strong>Exits:</strong> {room.exits.join(' | ')}</p>}
      {room.treasure && room.treasure.length > 0 && (
        <div className="mt-2 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
          <div className="flex justify-between items-center">
            <strong className="text-yellow-400 text-xs">Treasure:</strong>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const lootItems = room.treasure.map((t: any) => ({
                    item: t.item,
                    value: t.value || '0gp',
                    type: t.type,
                    effect: t.effect,
                    description: t.description,  // Include clue description
                    damage: t.damage,
                    attackBonus: t.attackBonus,
                    baseWeaponType: t.baseWeaponType,
                    armorClass: t.armorClass,
                    armorType: t.armorType,
                  }));
                  setGiveToPlayer({ items: lootItems, source: `Room ${room.id}: ${room.name}` });
                }}
                className="text-xs py-0.5 px-2 bg-green-700/50 hover:bg-green-600/50"
              >
                Give
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const lootItems = room.treasure.map((t: any) => ({
                    item: t.item,
                    value: t.value || '0gp',
                    type: t.type,
                    effect: t.effect,
                    description: t.description,  // Include clue description
                    damage: t.damage,
                    attackBonus: t.attackBonus,
                    baseWeaponType: t.baseWeaponType,
                    armorClass: t.armorClass,
                    armorType: t.armorType,
                  }));
                  handleAddToLoot(lootItems, `Room ${room.id}: ${room.name}`);
                }}
                className="text-xs py-0.5 px-2"
              >
                + Loot
              </Button>
            </div>
          </div>
          {room.treasure.map((t: any, i: number) => (
            <div key={i} className={`text-yellow-300 text-xs pl-2 border-l mt-1 ${t.type === 'clue' ? 'border-amber-500/50 bg-amber-900/20 p-1 rounded-r' : 'border-yellow-500/30'}`}>
              <span className="font-medium">{t.item}</span>
              {t.value && <span className="text-parchment/50"> - {t.value}</span>}
              {t.type && <span className={`ml-1 ${t.type === 'clue' ? 'text-amber-400' : 'text-blue-300'}`}>({t.type})</span>}
              {t.effect && <p className="text-green-300/80 text-xs">{t.effect}</p>}
              {t.type === 'clue' && t.description && (
                <p className="text-amber-300/90 text-xs mt-0.5 italic">📜 {t.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (!campaign) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-medieval text-gold">{campaign.title}</h2>
            {campaign._partial && (
              <div className="bg-red-900/30 p-3 rounded-lg border border-red-500/50">
                <h4 className="text-red-400 text-sm font-bold mb-1">⚠️ Partial Generation</h4>
                <p className="text-parchment/80 text-sm">{campaign._error || 'Some sections may be missing due to generation issues. Try generating again for complete content.'}</p>
              </div>
            )}
            {campaign.targetDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.targetDuration}</p>}
            <p className="text-parchment">{campaign.synopsis}</p>

            <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/50">
              <h4 className="text-amber-400 text-sm font-bold mb-1">Adventure Hook</h4>
              <p className="text-parchment/90 text-sm">{campaign.hook}</p>
            </div>

            {campaign.overview?.readAloud && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gold text-sm font-bold">Opening Narration</h4>
                  {!sceneImages['opening-scene'] && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateSceneImage(
                        'opening-scene',
                        `${campaign.overview?.readAloud?.substring(0, 200) || 'fantasy adventure beginning scene'}, ${campaign.title || 'epic quest'}, cinematic wide shot`,
                        'dramatic and immersive, sense of adventure',
                        'atmospheric dramatic lighting'
                      )}
                      disabled={generatingSceneId === 'opening-scene'}
                    >
                      {generatingSceneId === 'opening-scene' ? '🎨 Generating...' : '🖼️ Generate Scene Visual'}
                    </Button>
                  )}
                </div>

                {/* Opening Scene Image */}
                {sceneImages['opening-scene'] && (
                  <div className="relative rounded-lg overflow-hidden border-2 border-gold/50 mb-3">
                    <img
                      src={sceneImages['opening-scene']}
                      alt="Opening scene"
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-gold font-medieval text-lg">Opening Scene: {campaign.title}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => handleAddToGameLibrary(`Scene: ${campaign.title || 'Opening'}`, sceneImages['opening-scene'])}
                        className={`text-xs px-2 py-1 rounded ${addedToLibrary.has(sceneImages['opening-scene']) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                        disabled={addedToLibrary.has(sceneImages['opening-scene'])}
                        title="Add to Map Library to show to players"
                      >
                        {addedToLibrary.has(sceneImages['opening-scene']) ? '✓ Added' : '📺 Show Players'}
                      </button>
                      <button
                        onClick={() => handleGenerateSceneImage(
                          'opening-scene',
                          `${campaign.overview?.readAloud?.substring(0, 200) || 'fantasy adventure beginning scene'}, ${campaign.title || 'epic quest'}, cinematic wide shot`,
                          'dramatic and immersive, sense of adventure',
                          'atmospheric dramatic lighting'
                        )}
                        disabled={generatingSceneId === 'opening-scene'}
                        className="bg-black/50 hover:bg-black/70 text-gold p-1 rounded text-xs"
                        title="Regenerate scene"
                      >
                        {generatingSceneId === 'opening-scene' ? '⏳' : '🔄'}
                      </button>
                    </div>
                  </div>
                )}

                {renderReadAloud(campaign.overview.readAloud)}
              </div>
            )}

            {campaign.overview?.backstory && (
              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/50">
                <h4 className="text-purple-400 text-sm font-bold mb-1">Backstory (DM Only)</h4>
                <p className="text-parchment/80 text-sm">{campaign.overview.backstory}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Act 1</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc?.beginning}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Act 2</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc?.middle}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Act 3</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc?.climax}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Epilogue</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc?.resolution}</p>
              </div>
            </div>
          </div>
        );

      case 'act1':
        if (!campaign.act1) return <p className="text-parchment/50">Act 1 data not available</p>;
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medieval text-gold">{campaign.act1.title}</h3>
                {campaign.act1.estimatedDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.act1.estimatedDuration}</p>}
              </div>
              {!sceneImages['act1-city'] && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGenerateSceneImage(
                    'act1-city',
                    `fantasy medieval ${campaign.act1?.title || 'village'} town square with market stalls, cobblestone streets, timber-framed buildings, adventurers, bustling crowd`,
                    'warm and inviting, busy marketplace atmosphere',
                    'golden hour morning light'
                  )}
                  disabled={generatingSceneId === 'act1-city'}
                >
                  {generatingSceneId === 'act1-city' ? 'Generating...' : 'Generate City Image'}
                </Button>
              )}
            </div>

            {/* Scene Setting Image */}
            {sceneImages['act1-city'] ? (
              <div className="relative rounded-lg overflow-hidden border-2 border-gold/50">
                <img
                  src={sceneImages['act1-city']}
                  alt={`${campaign.act1.title} scene`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-gold font-medieval text-lg">{campaign.act1.title}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleAddToGameLibrary(`Scene: ${campaign.act1?.title || 'Act 1'}`, sceneImages['act1-city'])}
                    className={`text-xs px-2 py-1 rounded ${addedToLibrary.has(sceneImages['act1-city']) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                    disabled={addedToLibrary.has(sceneImages['act1-city'])}
                    title="Add to Map Library to show to players"
                  >
                    {addedToLibrary.has(sceneImages['act1-city']) ? '✓ Added' : '📺 Show Players'}
                  </button>
                  <button
                    onClick={() => handleGenerateSceneImage(
                      'act1-city',
                      `fantasy medieval ${campaign.act1?.title || 'village'} town square with market stalls, cobblestone streets, timber-framed buildings, adventurers, bustling crowd`,
                      'warm and inviting, busy marketplace atmosphere',
                      'golden hour morning light'
                    )}
                    className="bg-dark-wood/80 text-gold text-xs px-2 py-1 rounded hover:bg-dark-wood"
                  >
                    🔄
                  </button>
                </div>
              </div>
            ) : generatingSceneId === 'act1-city' ? (
              <div className="h-48 bg-leather/20 rounded-lg flex items-center justify-center border-2 border-dashed border-gold/30">
                <div className="text-center">
                  <div className="animate-pulse text-gold">Generating city scene...</div>
                  <p className="text-parchment/50 text-xs mt-1">This may take a moment</p>
                </div>
              </div>
            ) : null}

            <p className="text-parchment/80 text-sm">{campaign.act1.overview}</p>

            {campaign.act1.settingTheScene?.readAloud && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Setting the Scene</h4>
                {renderReadAloud(campaign.act1.settingTheScene.readAloud)}
                {campaign.act1.settingTheScene.dmNotes && (
                  <p className="text-purple-400/70 text-xs mt-2 italic">DM Notes: {campaign.act1.settingTheScene.dmNotes}</p>
                )}
              </div>
            )}

            {campaign.act1.questGiver && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Quest Giver</h4>
                {renderNpcDetail(campaign.act1.questGiver, 0)}
              </div>
            )}

            {campaign.act1.keyNpcs && campaign.act1.keyNpcs.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Key NPCs</h4>
                {campaign.act1.keyNpcs.map((npc: any, i: number) => renderNpcDetail(npc, i))}
              </div>
            )}

            {campaign.act1.services && (
              <div className="bg-dark-wood/50 p-3 rounded-lg">
                <h4 className="text-gold text-sm font-bold mb-2">Services & Shops</h4>
                {campaign.act1.services.inn && (
                  <div className="mb-2">
                    <p className="text-amber-400 text-xs font-bold">{campaign.act1.services.inn.name}</p>
                    <p className="text-parchment/70 text-xs">Room: {campaign.act1.services.inn.roomCost} | Meal: {campaign.act1.services.inn.mealCost}</p>
                  </div>
                )}
                {campaign.act1.services.shops?.map((shop: any, i: number) => (
                  <div key={i} className="mb-3 bg-dark-wood/30 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-blue-400 text-xs font-bold">{shop.name} ({shop.keeper})</p>
                      {shop.inventory && shop.inventory.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddShopToStore(shop)}
                          className="text-xs py-0.5 px-2"
                        >
                          Add to Store
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {shop.inventory?.map((item: any, j: number) => (
                        <div key={j} className="text-parchment/70 text-xs pl-2 border-l border-gold/30">
                          <span className="text-amber-300 font-medium">{item.item}</span>
                          <span className="text-parchment/50"> - {item.cost}</span>
                          {item.type && <span className="text-blue-300 ml-1">({item.type})</span>}
                          {item.effect && <p className="text-green-300/80 text-xs ml-2">{item.effect}</p>}
                          {item.rarity && item.rarity !== 'common' && (
                            <span className={`ml-1 text-xs ${item.rarity === 'rare' ? 'text-purple-400' : 'text-green-400'}`}>
                              [{item.rarity}]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {campaign.act1.travelToDestination && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Travel to Destination</h4>
                {campaign.act1.travelToDestination.readAloud && renderReadAloud(campaign.act1.travelToDestination.readAloud)}
                <p className="text-parchment/50 text-xs mt-1">Duration: {campaign.act1.travelToDestination.duration}</p>
              </div>
            )}

            {campaign.act1.potentialConflicts && campaign.act1.potentialConflicts.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Potential Conflicts</h4>
                {campaign.act1.potentialConflicts.map((conflict: any, i: number) => (
                  <div key={i} className="bg-red-900/20 p-2 rounded border border-red-500/30 mb-2">
                    <p className="text-red-400 text-sm font-bold">{conflict.name}</p>
                    <p className="text-parchment/70 text-xs">{conflict.trigger}</p>
                    {conflict.readAloud && <div className="mt-1">{renderReadAloud(conflict.readAloud)}</div>}
                  </div>
                ))}
              </div>
            )}

            {campaign.act1.transitionToAct2 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Transition to Act 2</h4>
                {renderReadAloud(campaign.act1.transitionToAct2)}
              </div>
            )}
          </div>
        );

      case 'act2':
        if (!campaign.act2) return <p className="text-parchment/50">Act 2 data not available</p>;
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-medieval text-gold">{campaign.act2.title}</h3>
            {campaign.act2.estimatedDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.act2.estimatedDuration}</p>}
            <p className="text-parchment/80 text-sm">{campaign.act2.overview}</p>

            {campaign.act2.dungeonOverview && (
              <div className="bg-dark-wood/50 p-3 rounded-lg">
                <h4 className="text-gold text-sm font-bold">{campaign.act2.dungeonOverview.name}</h4>
                <p className="text-parchment/60 text-xs italic">{campaign.act2.dungeonOverview.history}</p>
                {campaign.act2.dungeonOverview.readAloud && <div className="mt-2">{renderReadAloud(campaign.act2.dungeonOverview.readAloud)}</div>}
                <p className="text-parchment/50 text-xs mt-1">Lighting: {campaign.act2.dungeonOverview.lightingConditions}</p>
              </div>
            )}

            {campaign.act2.rooms && campaign.act2.rooms.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Dungeon Rooms</h4>
                {campaign.act2.rooms.map((room: any, i: number) => renderRoom(room, i))}
              </div>
            )}

            {campaign.act2.traps && campaign.act2.traps.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Traps</h4>
                {campaign.act2.traps.map((trap: any, i: number) => (
                  <div key={i} className="bg-orange-900/20 p-2 rounded border border-orange-500/30 mb-2">
                    <p className="text-orange-400 text-sm font-bold">{trap.name}</p>
                    <p className="text-parchment/70 text-xs"><strong>Trigger:</strong> {trap.trigger}</p>
                    <p className="text-parchment/70 text-xs"><strong>Detect:</strong> {trap.detection}</p>
                    <p className="text-parchment/70 text-xs"><strong>Effect:</strong> {trap.effect}</p>
                    <p className="text-green-400/70 text-xs"><strong>Disarm:</strong> {trap.disarm}</p>
                  </div>
                ))}
              </div>
            )}

            {campaign.act2.puzzles && campaign.act2.puzzles.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Puzzles</h4>
                {campaign.act2.puzzles.map((puzzle: any, i: number) => (
                  <div key={i} className="bg-blue-900/20 p-3 rounded border border-blue-500/30 mb-2">
                    <p className="text-blue-400 text-sm font-bold">{puzzle.name}</p>
                    {puzzle.readAloud && <div className="mt-1">{renderReadAloud(puzzle.readAloud)}</div>}
                    <p className="text-parchment/70 text-xs mt-2"><strong>Mechanics:</strong> {puzzle.mechanics}</p>
                    {puzzle.hints && (
                      <div className="mt-1">
                        <strong className="text-xs text-amber-400">Hints:</strong>
                        <ul className="text-xs text-parchment/60 list-disc list-inside">
                          {puzzle.hints.map((hint: any, j: number) => (
                            <li key={j}>{hint.method}: {hint.reveal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-green-400/70 text-xs mt-1"><strong>Solution:</strong> {puzzle.solution}</p>
                  </div>
                ))}
              </div>
            )}

            {campaign.act2.transitionToAct3 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Transition to Act 3</h4>
                {renderReadAloud(campaign.act2.transitionToAct3)}
              </div>
            )}
          </div>
        );

      case 'act3':
        if (!campaign.act3) return <p className="text-parchment/50">Act 3 data not available</p>;
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-medieval text-gold">{campaign.act3.title}</h3>
            {campaign.act3.estimatedDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.act3.estimatedDuration}</p>}
            <p className="text-parchment/80 text-sm">{campaign.act3.overview}</p>

            {campaign.act3.approach && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">The Approach</h4>
                {campaign.act3.approach.readAloud && renderReadAloud(campaign.act3.approach.readAloud)}
                {campaign.act3.approach.warnings && (
                  <p className="text-orange-400/70 text-xs mt-1"><strong>Warning Signs:</strong> {campaign.act3.approach.warnings}</p>
                )}
              </div>
            )}

            {campaign.act3.bossEncounter && (
              <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/50">
                <h4 className="text-red-400 text-sm font-bold mb-2">Boss Chamber</h4>

                {/* Boss room description - check both possible locations */}
                {(campaign.act3.bossEncounter.readAloud || campaign.act3.bossEncounter.chamberDescription?.readAloud) && (
                  <div className="mb-3">
                    {renderReadAloud(campaign.act3.bossEncounter.readAloud || campaign.act3.bossEncounter.chamberDescription?.readAloud)}
                  </div>
                )}

                {/* Chamber dimensions and features */}
                {campaign.act3.bossEncounter.chamberDimensions && (
                  <p className="text-parchment/60 text-xs mb-2"><strong>Dimensions:</strong> {campaign.act3.bossEncounter.chamberDimensions}</p>
                )}
                {campaign.act3.bossEncounter.chamberFeatures && campaign.act3.bossEncounter.chamberFeatures.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-parchment/80 text-xs">Tactical Features:</strong>
                    <ul className="list-disc list-inside text-parchment/60 text-xs ml-2">
                      {campaign.act3.bossEncounter.chamberFeatures.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {campaign.act3.bossEncounter.villain && (
                  <div className="bg-dark-wood/50 p-2 rounded mb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-red-300 font-bold">{campaign.act3.bossEncounter.villain.name}</p>
                      <span className="text-parchment/50 text-xs">
                        {campaign.act3.bossEncounter.villain.type} CR {campaign.act3.bossEncounter.villain.cr}
                      </span>
                    </div>
                    <p className="text-parchment/70 text-sm">{campaign.act3.bossEncounter.villain.appearance}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <span className="text-parchment/60">HP: <span className="text-white">{campaign.act3.bossEncounter.villain.hp}</span></span>
                      <span className="text-parchment/60">AC: <span className="text-white">{campaign.act3.bossEncounter.villain.ac}</span></span>
                      <span className="text-parchment/60">CR: <span className="text-white">{campaign.act3.bossEncounter.villain.cr}</span></span>
                    </div>

                    <p className="text-parchment/60 text-xs mt-2"><strong>Motivation:</strong> {campaign.act3.bossEncounter.villain.motivation}</p>
                    {campaign.act3.bossEncounter.villain.personality && (
                      <p className="text-parchment/60 text-xs"><strong>Personality:</strong> {campaign.act3.bossEncounter.villain.personality}</p>
                    )}

                    {/* Dialogue - support both old and new formats */}
                    {campaign.act3.bossEncounter.villain.dialogue && (
                      <div className="mt-2 space-y-1 bg-amber-900/20 p-2 rounded">
                        <strong className="text-amber-400 text-xs">Dialogue:</strong>
                        {(campaign.act3.bossEncounter.villain.dialogue.opening || campaign.act3.bossEncounter.villain.dialogue.onSighting) && (
                          <p className="text-amber-300 text-xs">
                            <strong>Opening:</strong> "{campaign.act3.bossEncounter.villain.dialogue.opening || campaign.act3.bossEncounter.villain.dialogue.onSighting}"
                          </p>
                        )}
                        {(campaign.act3.bossEncounter.villain.dialogue.midFight || campaign.act3.bossEncounter.villain.dialogue.monologue) && (
                          <p className="text-amber-300 text-xs">
                            <strong>Mid-Fight:</strong> "{campaign.act3.bossEncounter.villain.dialogue.midFight || campaign.act3.bossEncounter.villain.dialogue.monologue}"
                          </p>
                        )}
                        {campaign.act3.bossEncounter.villain.dialogue.defeat && (
                          <p className="text-amber-300 text-xs">
                            <strong>Defeat:</strong> "{campaign.act3.bossEncounter.villain.dialogue.defeat}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tactics - support both string and object formats */}
                    {campaign.act3.bossEncounter.villain.tactics && (
                      <div className="mt-2 text-xs">
                        <strong className="text-gold">Tactics:</strong>
                        {typeof campaign.act3.bossEncounter.villain.tactics === 'string' ? (
                          <p className="text-parchment/70">{campaign.act3.bossEncounter.villain.tactics}</p>
                        ) : (
                          <>
                            <p className="text-parchment/70">Phase 1: {campaign.act3.bossEncounter.villain.tactics.phase1}</p>
                            <p className="text-parchment/70">Phase 2: {campaign.act3.bossEncounter.villain.tactics.phase2}</p>
                            <p className="text-parchment/70">Phase 3: {campaign.act3.bossEncounter.villain.tactics.phase3}</p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Abilities */}
                    {campaign.act3.bossEncounter.villain.abilities && campaign.act3.bossEncounter.villain.abilities.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong className="text-red-400">Abilities:</strong>
                        <ul className="list-disc list-inside text-parchment/70 ml-2">
                          {campaign.act3.bossEncounter.villain.abilities.map((a: string, idx: number) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Legendary Actions */}
                    {campaign.act3.bossEncounter.villain.legendaryActions && campaign.act3.bossEncounter.villain.legendaryActions.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong className="text-purple-400">Legendary Actions:</strong>
                        <ul className="list-disc list-inside text-parchment/70 ml-2">
                          {campaign.act3.bossEncounter.villain.legendaryActions.map((la: any, idx: number) => (
                            <li key={idx}>
                              <strong>{typeof la === 'string' ? la : la.name}</strong>
                              {la.cost && la.cost > 1 && <span className="text-purple-300"> (Costs {la.cost} Actions)</span>}
                              {(la.effect || la.description) && <span>: {la.effect || la.description}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {campaign.act3.bossEncounter.villain.weakness && (
                      <p className="text-green-400 text-xs mt-2"><strong>Weakness:</strong> {campaign.act3.bossEncounter.villain.weakness}</p>
                    )}
                  </div>
                )}

                {/* Phase Changes */}
                {campaign.act3.bossEncounter.phaseChanges && campaign.act3.bossEncounter.phaseChanges.length > 0 && (
                  <div className="mt-2 bg-orange-900/20 p-2 rounded border border-orange-500/30">
                    <strong className="text-orange-400 text-xs">Phase Changes:</strong>
                    <ul className="list-disc list-inside text-parchment/70 text-xs ml-2">
                      {campaign.act3.bossEncounter.phaseChanges.map((pc: string, idx: number) => (
                        <li key={idx}>{pc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Minions */}
                {campaign.act3.bossEncounter.minions && campaign.act3.bossEncounter.minions.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-parchment/80 text-xs">Minions:</strong>
                    <div className="space-y-1 mt-1">
                      {campaign.act3.bossEncounter.minions.map((m: any, idx: number) => (
                        <div key={idx} className="text-xs text-parchment/70 bg-dark-wood/30 p-1 rounded">
                          {m.count}x {m.name} (AC {m.ac}, HP {m.hp}) - {m.role}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Throughline Payoffs */}
                {campaign.act3.bossEncounter.throughlinePayoffs && campaign.act3.bossEncounter.throughlinePayoffs.length > 0 && (
                  <div className="mt-2 bg-blue-900/20 p-2 rounded border border-blue-500/30">
                    <strong className="text-blue-400 text-xs">Story Payoffs:</strong>
                    <ul className="list-disc list-inside text-parchment/70 text-xs ml-2">
                      {campaign.act3.bossEncounter.throughlinePayoffs.map((tp: string, idx: number) => (
                        <li key={idx}>{tp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {campaign.act3.bossEncounter.rewards && (
                  <div className="mt-2 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                    <div className="flex justify-between items-center">
                      <strong className="text-yellow-400 text-xs">Boss Rewards:</strong>
                      {campaign.act3.bossEncounter.rewards.items && campaign.act3.bossEncounter.rewards.items.length > 0 && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const lootItems = campaign.act3.bossEncounter.rewards.items.map((item: any) => ({
                                item: item.name,
                                value: item.value || '0gp',
                                type: item.type,
                                effect: item.effect || item.description,
                                damage: item.damage,
                                attackBonus: item.attackBonus,
                                baseWeaponType: item.baseWeaponType,
                                armorClass: item.armorClass,
                                armorType: item.armorType,
                                rarity: item.rarity,
                              }));
                              setGiveToPlayer({ items: lootItems, source: 'Boss Rewards' });
                            }}
                            className="text-xs py-0.5 px-2 bg-green-700/50 hover:bg-green-600/50"
                          >
                            Give
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const lootItems = campaign.act3.bossEncounter.rewards.items.map((item: any) => ({
                                item: item.name,
                                value: item.value || '0gp',
                                type: item.type,
                                effect: item.effect || item.description,
                                damage: item.damage,
                                attackBonus: item.attackBonus,
                                baseWeaponType: item.baseWeaponType,
                                armorClass: item.armorClass,
                                armorType: item.armorType,
                                rarity: item.rarity,
                              }));
                              handleAddToLoot(lootItems, 'Boss Encounter');
                            }}
                            className="text-xs py-0.5 px-2"
                          >
                            + Loot
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-parchment/70 text-xs">{campaign.act3.bossEncounter.rewards.xp} XP | {campaign.act3.bossEncounter.rewards.gold}</p>
                    {campaign.act3.bossEncounter.rewards.items?.map((item: any, i: number) => (
                      <div key={i} className="text-yellow-300 text-xs pl-2 border-l border-yellow-500/30 mt-1">
                        <span className="font-medium">{item.name}</span>
                        {item.value && <span className="text-parchment/50"> - {item.value}</span>}
                        {item.type && <span className="text-blue-300 ml-1">({item.type})</span>}
                        {item.rarity && item.rarity !== 'common' && (
                          <span className={`ml-1 ${item.rarity === 'rare' ? 'text-purple-400' : 'text-green-400'}`}>
                            [{item.rarity}]
                          </span>
                        )}
                        {(item.effect || item.description) && (
                          <p className="text-green-300/80 text-xs">{item.effect || item.description}</p>
                        )}
                        {item.attunement && <span className="text-red-400 text-xs ml-1">(Requires Attunement)</span>}
                      </div>
                    ))}
                    {campaign.act3.bossEncounter.rewards.villainLoot && (
                      <div className="mt-2 border-t border-yellow-500/20 pt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-amber-300 text-xs font-medium">Villain's Possessions:</span>
                          {Array.isArray(campaign.act3.bossEncounter.rewards.villainLoot) && campaign.act3.bossEncounter.rewards.villainLoot.length > 0 && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const lootItems = campaign.act3.bossEncounter.rewards.villainLoot.map((item: any) => ({
                                    item: item.name,
                                    value: item.value || '0gp',
                                    type: item.type,
                                    effect: item.description,
                                    damage: item.damage,
                                    attackBonus: item.attackBonus,
                                    baseWeaponType: item.baseWeaponType,
                                    armorClass: item.armorClass,
                                    armorType: item.armorType,
                                  }));
                                  setGiveToPlayer({ items: lootItems, source: 'Villain Loot' });
                                }}
                                className="text-xs py-0.5 px-2 bg-green-700 hover:bg-green-600"
                              >
                                Give
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const lootItems = campaign.act3.bossEncounter.rewards.villainLoot.map((item: any) => ({
                                    item: item.name,
                                    value: item.value || '0gp',
                                    type: item.type,
                                    effect: item.description,
                                    damage: item.damage,
                                    attackBonus: item.attackBonus,
                                    baseWeaponType: item.baseWeaponType,
                                    armorClass: item.armorClass,
                                    armorType: item.armorType,
                                  }));
                                  handleAddToLoot(lootItems, 'Villain Loot');
                                }}
                                className="text-xs py-0.5 px-2"
                              >
                                + Loot
                              </Button>
                            </div>
                          )}
                        </div>
                        {Array.isArray(campaign.act3.bossEncounter.rewards.villainLoot) ? (
                          campaign.act3.bossEncounter.rewards.villainLoot.map((item: any, i: number) => (
                            <div key={i} className="text-amber-200/80 text-xs pl-2 border-l border-amber-500/30 mt-1">
                              <span className="font-medium">{item.name}</span>
                              {item.value && item.value !== '0gp' && <span className="text-parchment/50"> - {item.value}</span>}
                              {item.type && <span className="text-orange-300/70 ml-1">({item.type})</span>}
                              {item.description && <p className="text-parchment/60 text-xs">{item.description}</p>}
                            </div>
                          ))
                        ) : (
                          <p className="text-amber-300/70 text-xs italic">{campaign.act3.bossEncounter.rewards.villainLoot}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {campaign.act3.aftermath && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Aftermath</h4>
                {campaign.act3.aftermath.readAloud && renderReadAloud(campaign.act3.aftermath.readAloud)}
                {campaign.act3.aftermath.discoveries && (
                  <p className="text-parchment/70 text-xs mt-1">{campaign.act3.aftermath.discoveries}</p>
                )}
              </div>
            )}

            {campaign.act3.returnJourney && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Return Journey</h4>
                <p className="text-parchment/70 text-sm">{campaign.act3.returnJourney.description}</p>
                {campaign.act3.returnJourney.changes && (
                  <p className="text-green-400/70 text-xs mt-1">{campaign.act3.returnJourney.changes}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'epilogue':
        if (!campaign.epilogue) return <p className="text-parchment/50">Epilogue data not available</p>;
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-medieval text-gold">{campaign.epilogue.title || 'Epilogue'}</h3>
            {campaign.epilogue.estimatedDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.epilogue.estimatedDuration}</p>}

            {campaign.epilogue.returnToTown && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Return to Town</h4>
                {campaign.epilogue.returnToTown.readAloud && renderReadAloud(campaign.epilogue.returnToTown.readAloud)}
                {campaign.epilogue.returnToTown.questGiverReaction && (
                  <p className="text-parchment/70 text-sm mt-2"><strong>Quest Giver:</strong> {campaign.epilogue.returnToTown.questGiverReaction}</p>
                )}
                {campaign.epilogue.returnToTown.townReaction && (
                  <p className="text-parchment/70 text-sm"><strong>Townfolk:</strong> {campaign.epilogue.returnToTown.townReaction}</p>
                )}
              </div>
            )}

            {campaign.epilogue.rewards && (
              <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/50">
                <h4 className="text-yellow-400 text-sm font-bold mb-2">Rewards</h4>
                <p className="text-parchment/70 text-sm"><strong>Promised:</strong> {campaign.epilogue.rewards.promised}</p>
                {campaign.epilogue.rewards.bonus && (
                  <p className="text-green-400 text-sm"><strong>Bonus:</strong> {campaign.epilogue.rewards.bonus}</p>
                )}
                {campaign.epilogue.rewards.reputation && (
                  <p className="text-blue-400 text-sm"><strong>Reputation:</strong> {campaign.epilogue.rewards.reputation}</p>
                )}
                {campaign.epilogue.rewards.titles && (
                  <p className="text-purple-400 text-sm"><strong>Titles:</strong> {campaign.epilogue.rewards.titles}</p>
                )}
              </div>
            )}

            {campaign.epilogue.celebration && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Celebration</h4>
                {campaign.epilogue.celebration.readAloud && renderReadAloud(campaign.epilogue.celebration.readAloud)}
              </div>
            )}

            {campaign.epilogue.sequelHooks && campaign.epilogue.sequelHooks.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Sequel Hooks</h4>
                {campaign.epilogue.sequelHooks.map((hook: any, i: number) => (
                  <div key={i} className="bg-purple-900/20 p-2 rounded border border-purple-500/30 mb-2">
                    <p className="text-purple-400 text-sm font-bold">{hook.name}</p>
                    <p className="text-parchment/70 text-xs">{hook.setup}</p>
                  </div>
                ))}
              </div>
            )}

            {campaign.epilogue.closingNarration && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Closing</h4>
                {renderReadAloud(campaign.epilogue.closingNarration)}
              </div>
            )}
          </div>
        );

      case 'npcs':
        // Gather NPCs from multiple sources
        const allNpcs: any[] = [];

        // Quest giver from Act 1
        if (campaign.act1?.questGiver) {
          allNpcs.push({ ...campaign.act1.questGiver, _type: 'questGiver' });
        }

        // Key NPCs from Act 1
        if (campaign.act1?.keyNpcs) {
          allNpcs.push(...campaign.act1.keyNpcs.map((npc: any) => ({ ...npc, _type: 'keyNpc' })));
        }

        // Legacy top-level NPCs
        if (campaign.npcs) {
          allNpcs.push(...campaign.npcs.map((npc: any) => ({ ...npc, _type: 'legacy' })));
        }

        // Boss villain from Act 3
        if (campaign.act3?.bossEncounter?.villain) {
          allNpcs.push({ ...campaign.act3.bossEncounter.villain, _type: 'villain' });
        }

        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allNpcs.length === 0 && (
              <p className="text-parchment/50 text-sm">No NPCs found in this campaign.</p>
            )}
            {allNpcs.map((npc, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                npc._type === 'villain' ? 'bg-red-900/20 border-red-500/50' :
                npc._type === 'questGiver' ? 'bg-blue-900/20 border-blue-500/50' :
                'bg-green-900/20 border-green-500/50'
              }`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-gold font-medieval">{npc.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    npc._type === 'villain' ? 'bg-red-500/30 text-red-300' :
                    npc._type === 'questGiver' ? 'bg-blue-500/30 text-blue-300' :
                    'bg-green-500/30 text-green-300'
                  }`}>
                    {npc._type === 'villain' ? 'Villain' :
                     npc._type === 'questGiver' ? 'Quest Giver' :
                     npc.role || 'NPC'}
                  </span>
                </div>
                {npc.appearance && <p className="text-parchment/70 text-xs mt-1">{npc.appearance}</p>}
                {npc.personality && <p className="text-parchment/80 text-sm mt-1">{npc.personality}</p>}
                {npc.attitude && <p className="text-parchment/60 text-xs mt-1"><strong>Attitude:</strong> {npc.attitude}</p>}
                {npc.motivation && <p className="text-parchment/60 text-xs mt-1"><strong>Motivation:</strong> {npc.motivation}</p>}
                {npc.dialogue?.greeting && (
                  <p className="text-blue-300 text-xs mt-2 italic">"{npc.dialogue.greeting}"</p>
                )}
                {npc.dialogue?.gossip && (
                  <p className="text-purple-300 text-xs mt-1"><strong>Gossip:</strong> {npc.dialogue.gossip}</p>
                )}
                {npc.keyInformation && npc.keyInformation.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-xs text-gold">Key Info:</strong>
                    <ul className="text-xs text-parchment/70 list-disc list-inside">
                      {npc.keyInformation.map((info: string, j: number) => <li key={j}>{info}</li>)}
                    </ul>
                  </div>
                )}
                {npc.skillChecks && (
                  <div className="mt-2 bg-indigo-900/20 p-2 rounded border border-indigo-500/30">
                    <strong className="text-xs text-indigo-300">Skill Checks to Learn More:</strong>
                    <div className="text-xs space-y-1 mt-1">
                      {npc.skillChecks.persuasion?.dc && (
                        <p className="text-green-300">
                          <span className="font-medium">DC {npc.skillChecks.persuasion.dc} Persuasion:</span>
                          <span className="text-parchment/70 ml-1">{npc.skillChecks.persuasion.reveals}</span>
                        </p>
                      )}
                      {npc.skillChecks.intimidation?.dc && (
                        <p className="text-red-300">
                          <span className="font-medium">DC {npc.skillChecks.intimidation.dc} Intimidation:</span>
                          <span className="text-parchment/70 ml-1">{npc.skillChecks.intimidation.reveals}</span>
                        </p>
                      )}
                      {npc.skillChecks.insight?.dc && (
                        <p className="text-blue-300">
                          <span className="font-medium">DC {npc.skillChecks.insight.dc} Insight:</span>
                          <span className="text-parchment/70 ml-1">{npc.skillChecks.insight.reveals}</span>
                        </p>
                      )}
                      {npc.skillChecks.bribe?.cost && (
                        <p className="text-yellow-300">
                          <span className="font-medium">Bribe ({npc.skillChecks.bribe.cost}):</span>
                          <span className="text-parchment/70 ml-1">{npc.skillChecks.bribe.reveals}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {npc.services && npc.services.length > 0 && (
                  <div className="mt-2 text-xs">
                    <strong className="text-gold">Services:</strong>
                    {npc.services.map((s: any, j: number) => (
                      <span key={j} className="ml-2 text-parchment/70">{s.item}: {s.cost}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'encounters':
        // Gather encounters from multiple sources
        const allEncounters: any[] = [];

        // Encounters from Act 2
        if (campaign.act2?.encounters) {
          allEncounters.push(...campaign.act2.encounters);
        }

        // Boss encounter from Act 3
        if (campaign.act3?.bossEncounter) {
          const boss = campaign.act3.bossEncounter;
          const villain = boss.villain || {};

          // Helper to normalize trait formats to {name, description}
          const normalizeTrait = (t: any): { name: string; description: string } => {
            if (typeof t === 'string') return { name: 'Trait', description: t };
            if (t.description) return { name: t.name || 'Trait', description: t.description };
            if (t.effect) return { name: t.name || 'Action', description: t.effect };
            return { name: t.name || 'Trait', description: JSON.stringify(t) };
          };

          // Build legendary actions as traits
          const legendaryTraits = villain.legendaryActions?.map((la: any) =>
            typeof la === 'string'
              ? { name: 'Legendary Action', description: la }
              : { name: `Legendary${la.cost > 1 ? ` (${la.cost})` : ''}`, description: `${la.name}: ${la.effect || la.description || ''}` }
          ) || [];

          // Build traits array - normalize all formats
          const villainTraits = [
            ...(villain.traits || []).map(normalizeTrait),
            ...(villain.weakness ? [{ name: 'Weakness', description: villain.weakness }] : []),
            ...legendaryTraits
          ];

          const bossEncounter = {
            name: `Boss: ${villain.name || 'Final Confrontation'}`,
            difficulty: 'boss',
            readAloud: boss.readAloud,
            location: 'Boss Chamber',
            tactics: villain.tactics,
            terrain: boss.chamberFeatures?.join(', '),
            enemies: [
              {
                name: villain.name || 'Boss',
                count: 1,
                cr: villain.cr,
                hp: villain.hp,
                ac: villain.ac,
                acType: villain.acType,
                initiative: villain.initiative,
                speed: villain.speed,
                attacks: villain.attacks || [],
                spells: villain.spells || [],
                traits: villainTraits,
                resistances: villain.resistances || [],
                immunities: villain.immunities || []
              },
              // Minions with full stats
              ...(boss.minions || []).map((m: any) => ({
                name: m.name,
                count: m.count,
                cr: m.cr || '?',
                hp: m.hp,
                ac: m.ac,
                initiative: m.initiative,
                speed: m.speed,
                attacks: m.attacks || [],
                role: m.role
              })),
              // Summons with full stats
              ...(boss.summons || []).map((s: any) => ({
                name: `[Summon] ${s.name}`,
                count: s.count,
                cr: s.cr || '?',
                hp: s.hp,
                ac: s.ac,
                initiative: s.initiative,
                speed: s.speed,
                attacks: s.attacks || [],
                traits: s.traits?.map((t: string) => ({ name: 'Trait', description: t })) || [],
                summonTrigger: s.summonTrigger
              }))
            ],
            rewards: boss.rewards,
            _type: 'boss'
          };
          allEncounters.push(bossEncounter);
        }

        // Potential conflicts from Act 1 - only include if they have combat data
        if (campaign.act1?.potentialConflicts) {
          allEncounters.push(...campaign.act1.potentialConflicts
            .filter((c: any) => c.enemies?.length > 0 || c.monsters?.length > 0)
            .map((c: any) => ({
              ...c,
              difficulty: 'optional',
              _type: 'conflict'
            })));
        }

        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allEncounters.length === 0 && (
              <p className="text-parchment/50 text-sm">No encounters found in this campaign.</p>
            )}
            {allEncounters.map((enc, i) => {
              const diffColors: Record<string, string> = {
                easy: 'bg-green-500/30 text-green-300',
                medium: 'bg-yellow-500/30 text-yellow-300',
                hard: 'bg-orange-500/30 text-orange-300',
                deadly: 'bg-red-500/30 text-red-300',
                boss: 'bg-red-700/50 text-red-200 border border-red-500',
                optional: 'bg-purple-500/30 text-purple-300',
              };
              return (
                <div key={i} className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/50">
                  <div className="flex justify-between items-start">
                    <h4 className="text-gold font-medieval">{enc.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${diffColors[enc.difficulty] || 'bg-gray-500/30'}`}>
                      {enc.difficulty}
                    </span>
                  </div>
                  {enc.readAloud && (
                    <div className="bg-amber-900/30 border-l-4 border-amber-500 p-2 rounded-r mt-2 text-xs italic text-parchment/90">
                      {enc.readAloud}
                    </div>
                  )}
                  {enc.description && <p className="text-parchment/80 text-sm mt-1">{enc.description}</p>}
                  {/* Detailed Enemy Stats */}
                  {(enc.enemies || enc.monsters) && (enc.enemies?.length > 0 || enc.monsters?.length > 0) && (
                    <div className="mt-2 space-y-2">
                      <strong className="text-parchment/80 text-xs">Enemies:</strong>
                      {(enc.enemies || enc.monsters).map((m: any, mIdx: number) => (
                        <div key={mIdx} className="bg-dark-wood/50 p-2 rounded text-xs border border-parchment/20">
                          <div className="flex justify-between items-start">
                            <span className="text-gold font-bold">{m.count}x {m.name}</span>
                            <span className="text-parchment/60">CR {m.cr}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-parchment/70">
                            <span>AC: <span className="text-white">{m.ac}</span> {m.acType && <span className="text-parchment/40">({m.acType})</span>}</span>
                            <span>HP: <span className="text-white">{m.hp}</span></span>
                            <span>Init: <span className="text-white">+{m.initiative ?? '?'}</span></span>
                          </div>
                          {m.speed && <div className="text-parchment/50 mt-1">Speed: {m.speed}</div>}

                          {/* Attacks */}
                          {m.attacks && m.attacks.length > 0 && (
                            <div className="mt-1 border-t border-parchment/10 pt-1">
                              <span className="text-red-400">Attacks:</span>
                              {m.attacks.map((a: any, aIdx: number) => (
                                <div key={aIdx} className="ml-2 text-parchment/70">
                                  <span className="text-white">{a.name}</span>: +{a.bonus} to hit, {a.damage} {a.damageType}
                                  {a.notes && <span className="text-parchment/40"> ({a.notes})</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Spells */}
                          {m.spells && m.spells.length > 0 && (
                            <div className="mt-1 border-t border-parchment/10 pt-1">
                              <span className="text-purple-400">Spells:</span>
                              {m.spells.map((s: any, sIdx: number) => (
                                <div key={sIdx} className="ml-2 text-parchment/70">
                                  <span className="text-white">{s.name}</span>
                                  {s.level > 0 && <span className="text-parchment/40"> (Lvl {s.level})</span>}
                                  {s.damage && <span>: {s.damage}</span>}
                                  {s.effect && <span>: {s.effect}</span>}
                                  {s.save && <span className="text-yellow-400"> {s.save}</span>}
                                  {s.attack && <span className="text-yellow-400"> {s.attack}</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Traits */}
                          {m.traits && m.traits.length > 0 && (
                            <div className="mt-1 border-t border-parchment/10 pt-1">
                              <span className="text-blue-400">Traits:</span>
                              {m.traits.map((t: any, tIdx: number) => {
                                // Handle various trait formats
                                const traitName = typeof t === 'string' ? 'Trait' : (t.name || 'Trait');
                                const traitDesc = typeof t === 'string' ? t : (t.description || t.effect || '');
                                return (
                                  <div key={tIdx} className="ml-2 text-parchment/70">
                                    <span className="text-white">{traitName}:</span> {traitDesc}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Resistances/Immunities */}
                          {((m.resistances && m.resistances.length > 0) || (m.immunities && m.immunities.length > 0)) && (
                            <div className="mt-1 border-t border-parchment/10 pt-1 text-parchment/60">
                              {m.resistances?.length > 0 && <div>Resist: {m.resistances.join(', ')}</div>}
                              {m.immunities?.length > 0 && <div>Immune: {m.immunities.join(', ')}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {enc.tactics && <p className="text-parchment/60 text-xs mt-1"><strong>Tactics:</strong> {enc.tactics}</p>}
                  {enc.terrain && <p className="text-parchment/60 text-xs mt-1"><strong>Terrain:</strong> {enc.terrain}</p>}
                  {enc.rewards && (
                    <div className="mt-2 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                      <div className="flex justify-between items-center">
                        <strong className="text-yellow-400 text-xs">Rewards:</strong>
                        {typeof enc.rewards === 'object' && enc.rewards.loot && enc.rewards.loot.length > 0 && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const lootItems = enc.rewards.loot.map((l: any) =>
                                  typeof l === 'string'
                                    ? { item: l, value: '0gp' }
                                    : {
                                        item: l.item,
                                        value: l.value || '0gp',
                                        type: l.type,
                                        effect: l.effect,
                                        description: l.description,  // Include clue description
                                        damage: l.damage,
                                        attackBonus: l.attackBonus,
                                        baseWeaponType: l.baseWeaponType,
                                        armorClass: l.armorClass,
                                        armorType: l.armorType,
                                      }
                                );
                                setGiveToPlayer({ items: lootItems, source: enc.name || 'Encounter' });
                              }}
                              className="text-xs py-0.5 px-2 bg-green-700 hover:bg-green-600"
                            >
                              Give
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const lootItems = enc.rewards.loot.map((l: any) =>
                                  typeof l === 'string'
                                    ? { item: l, value: '0gp' }
                                    : {
                                        item: l.item,
                                        value: l.value || '0gp',
                                        type: l.type,
                                        effect: l.effect,
                                        description: l.description,  // Include clue description
                                        damage: l.damage,
                                        attackBonus: l.attackBonus,
                                        baseWeaponType: l.baseWeaponType,
                                        armorClass: l.armorClass,
                                        armorType: l.armorType,
                                      }
                                );
                                handleAddToLoot(lootItems, enc.name || 'Encounter');
                              }}
                              className="text-xs py-0.5 px-2"
                            >
                              + Loot
                            </Button>
                          </div>
                        )}
                      </div>
                      {typeof enc.rewards === 'object' ? (
                        <>
                          <p className="text-parchment/70 text-xs">{enc.rewards.xp} XP</p>
                          {enc.rewards.loot?.map((l: any, i: number) => (
                            <div key={i} className={`text-yellow-300 text-xs pl-2 border-l mt-1 ${l.type === 'clue' ? 'border-amber-500/50 bg-amber-900/20 p-1 rounded-r' : 'border-yellow-500/30'}`}>
                              {typeof l === 'string' ? (
                                <span>{l}</span>
                              ) : (
                                <>
                                  <span className="font-medium">{l.item}</span>
                                  {l.value && <span className="text-parchment/50"> - {l.value}</span>}
                                  {l.type && <span className={`ml-1 ${l.type === 'clue' ? 'text-amber-400' : 'text-blue-300'}`}>({l.type})</span>}
                                  {l.effect && <p className="text-green-300/80 text-xs">{l.effect}</p>}
                                  {l.type === 'clue' && l.description && (
                                    <p className="text-amber-300/90 text-xs mt-0.5 italic">📜 {l.description}</p>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-parchment/70 text-xs">{enc.rewards}</p>
                      )}
                    </div>
                  )}

                  {/* Start Encounter Button - only show if there are monsters */}
                  {((enc.enemies && enc.enemies.length > 0) || (enc.monsters && enc.monsters.length > 0)) && (
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <Button
                        onClick={() => handleStartEncounter(enc)}
                        className="w-full bg-red-700 hover:bg-red-600 text-white text-sm py-1"
                      >
                        ⚔️ Start Encounter
                      </Button>
                      <p className="text-parchment/40 text-xs mt-1 text-center">
                        Adds enemies to map & combat tracker
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'map':
        return renderDungeonMap();

      case 'battlemaps':
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medieval text-gold">Detailed Battle Maps</h3>
              {campaign?.act2?.rooms && campaign.act2.rooms.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerateAllBattleMaps}
                  disabled={generatingMapId === 'all'}
                >
                  {generatingMapId === 'all' ? 'Generating...' : 'Generate All Room Maps'}
                </Button>
              )}
            </div>

            {/* Saved Maps Section */}
            {savedMaps.length > 0 && (
              <div className="bg-gold/10 p-3 rounded-lg border border-gold/50">
                <h4 className="text-gold text-sm font-bold mb-2">Saved Maps ({savedMaps.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {savedMaps.map((map, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={map.imageUrl}
                        alt={map.name}
                        className="w-full h-24 object-cover rounded border border-gold/30"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center gap-1">
                        <p className="text-gold text-xs font-bold text-center px-1">{map.name}</p>
                        <div className="flex gap-1">
                          <a
                            href={map.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gold/80 text-dark-wood text-xs px-2 py-0.5 rounded hover:bg-gold"
                          >
                            Open
                          </a>
                          <button
                            onClick={() => handleRemoveSavedMap(map.imageUrl)}
                            className="bg-red-500/80 text-white text-xs px-2 py-0.5 rounded hover:bg-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-parchment/60 text-sm">
              Generate detailed, illustrated battle maps for combat encounters. These AI-generated maps
              are designed for tactical play.
            </p>

            {/* Dungeon Rooms from Act 2 */}
            {campaign?.act2?.rooms && campaign.act2.rooms.length > 0 && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Dungeon Rooms</h4>
                <div className="flex flex-col gap-3">
                  {campaign.act2.rooms.map((room: any, index: number) => {
                    const mapId = `room-${room.id}`;
                    const hasMap = battleMaps[mapId];
                    const isSaved = !!hasMap && savedMaps.some(m => m.imageUrl === battleMaps[mapId]);
                    return (
                      <div key={index} className="bg-dark-wood/50 p-3 rounded-lg border border-leather">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-gold font-medieval text-sm">{room.name}</h5>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleGenerateBattleMap(
                              mapId,
                              room.name,
                              campaign.act2?.dungeonOverview?.name || 'dungeon',
                              room.contents?.obvious || [],
                              room.lighting || 'dim torchlight',
                              room.readAloud || ''
                            )}
                            disabled={generatingMapId === mapId}
                          >
                            {generatingMapId === mapId ? '...' : hasMap ? 'Regen' : 'Generate'}
                          </Button>
                        </div>
                        {hasMap ? (
                          <div className="relative">
                            <img
                              src={battleMaps[mapId]}
                              alt={`Battle map for ${room.name}`}
                              className="w-full rounded-lg border border-gold/30"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              <button
                                onClick={() => handleAddToGameLibrary(room.name, battleMaps[mapId])}
                                className={`text-xs px-2 py-1 rounded ${addedToLibrary.has(battleMaps[mapId]) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                disabled={addedToLibrary.has(battleMaps[mapId])}
                                title="Add to Map Library for use in game"
                              >
                                {addedToLibrary.has(battleMaps[mapId]) ? '✓ In Library' : 'Use in Game'}
                              </button>
                              <button
                                onClick={() => handleSaveMap(mapId, room.name, battleMaps[mapId], 'dungeon')}
                                className={`text-xs px-2 py-1 rounded ${isSaved ? 'bg-green-600 text-white' : 'bg-gold/80 text-dark-wood hover:bg-gold'}`}
                                disabled={isSaved}
                              >
                                {isSaved ? 'Saved' : 'Save'}
                              </button>
                              <a
                                href={battleMaps[mapId]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-dark-wood/80 text-gold text-xs px-2 py-1 rounded hover:bg-dark-wood"
                              >
                                Full Size
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 bg-leather/20 rounded flex items-center justify-center text-parchment/50 text-sm">
                            Click Generate to create battle map
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Boss Chamber from Act 3 */}
            {campaign?.act3?.bossEncounter?.chamberDescription && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Boss Chamber</h4>
                <div className="bg-dark-wood/50 p-3 rounded-lg border border-red-500/50">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-red-400 font-medieval text-sm">
                      {campaign.act3.bossEncounter.villain?.name || 'Boss'} Lair
                    </h5>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateBattleMap(
                        'boss-chamber',
                        `${campaign.act3?.bossEncounter?.villain?.name || 'Boss'} lair boss chamber`,
                        'dark ominous evil',
                        campaign.act3?.bossEncounter?.chamberDescription?.terrain || ['throne', 'pillars'],
                        'dramatic red lighting',
                        campaign.act3?.bossEncounter?.chamberDescription?.readAloud || ''
                      )}
                      disabled={generatingMapId === 'boss-chamber'}
                    >
                      {generatingMapId === 'boss-chamber' ? '...' : battleMaps['boss-chamber'] ? 'Regen' : 'Generate'}
                    </Button>
                  </div>
                  {battleMaps['boss-chamber'] ? (
                    <div className="relative">
                      <img
                        src={battleMaps['boss-chamber']}
                        alt="Boss chamber battle map"
                        className="w-full rounded-lg border border-red-500/30"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleAddToGameLibrary(`${campaign.act3?.bossEncounter?.villain?.name || 'Boss'} Lair`, battleMaps['boss-chamber'])}
                          className={`text-xs px-2 py-1 rounded ${addedToLibrary.has(battleMaps['boss-chamber']) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                          disabled={addedToLibrary.has(battleMaps['boss-chamber'])}
                          title="Add to Map Library for use in game"
                        >
                          {addedToLibrary.has(battleMaps['boss-chamber']) ? '✓ In Library' : 'Use in Game'}
                        </button>
                        <button
                          onClick={() => handleSaveMap('boss-chamber', `${campaign.act3?.bossEncounter?.villain?.name || 'Boss'} Lair`, battleMaps['boss-chamber'], 'boss')}
                          className={`text-xs px-2 py-1 rounded ${savedMaps.some(m => m.imageUrl === battleMaps['boss-chamber']) ? 'bg-green-600 text-white' : 'bg-gold/80 text-dark-wood hover:bg-gold'}`}
                          disabled={savedMaps.some(m => m.imageUrl === battleMaps['boss-chamber'])}
                        >
                          {savedMaps.some(m => m.imageUrl === battleMaps['boss-chamber']) ? 'Saved' : 'Save'}
                        </button>
                        <a
                          href={battleMaps['boss-chamber']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-dark-wood/80 text-gold text-xs px-2 py-1 rounded hover:bg-dark-wood"
                        >
                          Full Size
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-red-900/20 rounded flex items-center justify-center text-parchment/50 text-sm">
                      Click Generate to create boss battle map
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Travel/Wilderness Encounters */}
            {campaign?.act1?.travelToDestination && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Travel Encounter Map</h4>
                <div className="bg-dark-wood/50 p-3 rounded-lg border border-green-500/50">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-green-400 font-medieval text-sm">Wilderness Ambush Site</h5>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateBattleMap(
                        'travel-encounter',
                        'forest road ambush site wilderness',
                        'natural outdoor forest',
                        ['trees', 'rocks', 'path', 'bushes'],
                        'natural daylight',
                        campaign.act1?.travelToDestination?.readAloud || campaign.act1?.travelToDestination?.description || ''
                      )}
                      disabled={generatingMapId === 'travel-encounter'}
                    >
                      {generatingMapId === 'travel-encounter' ? '...' : battleMaps['travel-encounter'] ? 'Regen' : 'Generate'}
                    </Button>
                  </div>
                  {battleMaps['travel-encounter'] ? (
                    <div className="relative">
                      <img
                        src={battleMaps['travel-encounter']}
                        alt="Travel encounter battle map"
                        className="w-full rounded-lg border border-green-500/30"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleAddToGameLibrary('Wilderness Ambush Site', battleMaps['travel-encounter'])}
                          className={`text-xs px-2 py-1 rounded ${addedToLibrary.has(battleMaps['travel-encounter']) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                          disabled={addedToLibrary.has(battleMaps['travel-encounter'])}
                          title="Add to Map Library for use in game"
                        >
                          {addedToLibrary.has(battleMaps['travel-encounter']) ? '✓ In Library' : 'Use in Game'}
                        </button>
                        <button
                          onClick={() => handleSaveMap('travel-encounter', 'Wilderness Ambush Site', battleMaps['travel-encounter'], 'wilderness')}
                          className={`text-xs px-2 py-1 rounded ${savedMaps.some(m => m.imageUrl === battleMaps['travel-encounter']) ? 'bg-green-600 text-white' : 'bg-gold/80 text-dark-wood hover:bg-gold'}`}
                          disabled={savedMaps.some(m => m.imageUrl === battleMaps['travel-encounter'])}
                        >
                          {savedMaps.some(m => m.imageUrl === battleMaps['travel-encounter']) ? 'Saved' : 'Save'}
                        </button>
                        <a
                          href={battleMaps['travel-encounter']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-dark-wood/80 text-gold text-xs px-2 py-1 rounded hover:bg-dark-wood"
                        >
                          Full Size
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 bg-green-900/20 rounded flex items-center justify-center text-parchment/50 text-sm">
                      Click Generate to create travel map
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Battle Map Generator */}
            <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/50">
              <h4 className="text-purple-400 text-sm font-bold mb-2">Custom Battle Map</h4>
              <p className="text-parchment/60 text-xs mb-2">Generate a map for any location</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the location (e.g., 'ancient temple ruins')"
                  className="flex-1 text-sm"
                  id="custom-map-input"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const input = document.getElementById('custom-map-input') as HTMLInputElement;
                    if (input?.value) {
                      handleGenerateBattleMap(
                        `custom-${Date.now()}`,
                        input.value,
                        'fantasy',
                        [],
                        'atmospheric'
                      );
                    }
                  }}
                  disabled={generatingMapId?.startsWith('custom')}
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Player Selection Modal for Giving Items */}
      {giveToPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-wood p-4 rounded-lg border border-gold max-w-md w-full mx-4">
            <h3 className="text-gold font-medieval text-lg mb-3">Give Items to Player</h3>
            <p className="text-parchment/70 text-sm mb-3">
              {giveToPlayer.items.length} item(s) from: {giveToPlayer.source}
            </p>
            <div className="space-y-2 mb-4">
              {giveToPlayer.items.map((item, i) => (
                <div key={i} className="text-parchment text-sm bg-leather/30 p-2 rounded">
                  {item.item} {item.value && `(${item.value})`}
                </div>
              ))}
            </div>
            {players.length === 0 ? (
              <p className="text-red-400 text-sm">No players connected. Items will be added to loot pool instead.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-parchment/70 text-xs">Select a player:</p>
                {players.map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => handleGiveToPlayer(player.id, player.name)}
                    className="w-full justify-start"
                    variant="secondary"
                  >
                    Give to {player.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={async () => {
                  // Just add to loot pool without distributing
                  await handleAddToLoot(giveToPlayer.items, giveToPlayer.source);
                  setGiveToPlayer(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Add to Loot Pool
              </Button>
              <Button
                onClick={() => setGiveToPlayer(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Form */}
      {!campaign && (
        <div className="space-y-3">
          {/* Adventure Type - Full Width */}
          <div>
            <label className="block text-parchment/70 text-xs mb-1">Adventure Type</label>
            <select
              value={adventureType}
              onChange={(e) => setAdventureType(e.target.value)}
              className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
            >
              {ADVENTURE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-parchment/50 text-xs mt-1">
              {ADVENTURE_TYPES.find(t => t.value === adventureType)?.description}
            </p>
          </div>

          {/* Theme and Setting */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Input
                placeholder="Or custom theme..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Setting</label>
              <select
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {SETTINGS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                placeholder="Or custom setting..."
                value={customSetting}
                onChange={(e) => setCustomSetting(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Party Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Party Level</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={partyLevel}
                onChange={(e) => setPartyLevel(Number(e.target.value))}
                className="text-sm"
              />
            </div>
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
              <label className="block text-parchment/70 text-xs mb-1">Sessions</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={sessionCount}
                onChange={(e) => setSessionCount(Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof tone)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Metrics */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Stakes</label>
              <select
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {STAKES_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Morality</label>
              <select
                value={moralComplexity}
                onChange={(e) => setMoralComplexity(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {MORAL_COMPLEXITY.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Time Pressure</label>
              <select
                value={timePressure}
                onChange={(e) => setTimePressure(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {TIME_PRESSURE.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-parchment/70 text-xs mb-1">Focus</label>
              <select
                value={primaryPillar}
                onChange={(e) => setPrimaryPillar(e.target.value)}
                className="w-full bg-parchment text-dark-wood px-2 py-1 rounded text-sm"
              >
                {PRIMARY_PILLAR.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeMap}
              onChange={(e) => setIncludeMap(e.target.checked)}
              className="rounded"
            />
            <span className="text-parchment text-sm">Include Location Map</span>
          </label>

          {error && (
            <div className="bg-red-500/20 border border-red-500 p-2 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
              {isGenerating ? 'Generating Campaign...' : 'Generate Campaign'}
            </Button>
            <Button variant="secondary" onClick={handleGenerateDungeon} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Just Map'}
            </Button>
          </div>

          {isGenerating && (
            <div className="text-center text-parchment/70 text-sm">
              <div className="animate-pulse">Consulting the ancient tomes...</div>
              <div className="text-xs text-parchment/50 mt-1">
                Generating in 3 parts: Overview → Dungeon → Boss Fight
              </div>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Campaign */}
      {campaign && (
        <div>
          {/* Warning if campaign is partially generated */}
          {campaign._partial && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
              <p className="text-yellow-300 text-sm font-semibold">⚠️ Partial Campaign</p>
              <p className="text-yellow-200/80 text-xs mt-1">{campaign._error || 'Some sections may be missing. Try regenerating.'}</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <Button size="sm" variant="secondary" onClick={() => setCampaign(null)}>
              New Campaign
            </Button>
            {!campaign.dungeonMap && (
              <Button size="sm" variant="secondary" onClick={handleGenerateDungeon} disabled={isGenerating}>
                Add Map
              </Button>
            )}
          </div>

          {renderTabs()}
          {renderContent()}
        </div>
      )}
    </div>
  );
}
