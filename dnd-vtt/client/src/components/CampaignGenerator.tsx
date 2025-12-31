import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
}

interface DungeonMap {
  name: string;
  width: number;
  height: number;
  rooms: DungeonRoom[];
  theme: string;
}

interface GeneratedCampaign {
  title: string;
  synopsis: string;
  hook: string;
  arc: {
    beginning: string;
    middle: string;
    climax: string;
    resolution: string;
  };
  npcs: GeneratedNPC[];
  locations: GeneratedLocation[];
  encounters: GeneratedEncounter[];
  sessionOutlines: { number: number; title: string; summary: string; objectives: string[] }[];
  dungeonMap?: DungeonMap;
}

interface CampaignGeneratorProps {
  onCampaignGenerated?: (campaign: GeneratedCampaign) => void;
  onDungeonGenerated?: (dungeon: DungeonMap) => void;
  serverUrl?: string;
}

const THEMES = [
  'Classic Fantasy',
  'Dark Fantasy',
  'Undead Apocalypse',
  'Dragon Tyranny',
  'Demon Invasion',
  'Ancient Ruins',
  'Political Intrigue',
  'Heist & Thieves',
  'Pirates & Sea',
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
];

const TONES = [
  { value: 'serious', label: 'Serious & Dark' },
  { value: 'lighthearted', label: 'Lighthearted & Fun' },
  { value: 'horror', label: 'Horror & Suspense' },
  { value: 'epic', label: 'Epic & Heroic' },
];

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

export function CampaignGenerator({ onCampaignGenerated, onDungeonGenerated, serverUrl = 'http://localhost:3001' }: CampaignGeneratorProps) {
  // Form state
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [customSetting, setCustomSetting] = useState('');
  const [partyLevel, setPartyLevel] = useState(1);
  const [partySize, setPartySize] = useState(4);
  const [sessionCount, setSessionCount] = useState(4);
  const [tone, setTone] = useState<'serious' | 'lighthearted' | 'horror' | 'epic'>('serious');
  const [includeMap, setIncludeMap] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'npcs' | 'locations' | 'encounters' | 'sessions' | 'map'>('overview');
  const [selectedRoom, setSelectedRoom] = useState<DungeonRoom | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/campaign/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: customTheme || theme,
          setting: customSetting || setting,
          partyLevel,
          partySize,
          sessionCount,
          tone,
          includeMap,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate campaign');
      }

      const generatedCampaign = await response.json();
      setCampaign(generatedCampaign);
      if (onCampaignGenerated) onCampaignGenerated(generatedCampaign);
      if (generatedCampaign.dungeonMap && onDungeonGenerated) {
        onDungeonGenerated(generatedCampaign.dungeonMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDungeon = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/api/campaign/dungeon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: customTheme || theme,
          partyLevel,
          enhance: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate dungeon');
      }

      const dungeonMap = await response.json();
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
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
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
      { id: 'npcs', label: 'NPCs' },
      { id: 'locations', label: 'Locations' },
      { id: 'encounters', label: 'Encounters' },
      { id: 'sessions', label: 'Sessions' },
      ...(campaign?.dungeonMap ? [{ id: 'map', label: 'Map' }] : []),
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

  const renderContent = () => {
    if (!campaign) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-medieval text-gold">{campaign.title}</h2>
            <p className="text-parchment">{campaign.synopsis}</p>
            <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/50">
              <h4 className="text-amber-400 text-sm font-bold mb-1">Adventure Hook</h4>
              <p className="text-parchment/90 text-sm">{campaign.hook}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Beginning</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc.beginning}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Middle</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc.middle}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Climax</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc.climax}</p>
              </div>
              <div className="bg-dark-wood/50 p-2 rounded">
                <h5 className="text-gold text-xs mb-1">Resolution</h5>
                <p className="text-parchment/80 text-xs">{campaign.arc.resolution}</p>
              </div>
            </div>
          </div>
        );

      case 'npcs':
        return (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campaign.npcs.map((npc, i) => (
              <div key={i} className={`p-3 rounded-lg border ${npc.isAlly ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-gold font-medieval">{npc.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${npc.isAlly ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                    {npc.isAlly ? 'Ally' : 'Enemy'}
                  </span>
                </div>
                <p className="text-parchment/70 text-xs">{npc.race} {npc.occupation}</p>
                <p className="text-parchment/80 text-sm mt-1">{npc.personality}</p>
                <p className="text-parchment/60 text-xs mt-1"><strong>Wants:</strong> {npc.motivation}</p>
                {npc.secret && (
                  <p className="text-amber-400/70 text-xs mt-1 italic"><strong>Secret:</strong> {npc.secret}</p>
                )}
              </div>
            ))}
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campaign.locations.map((loc, i) => (
              <div key={i} className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/50">
                <div className="flex justify-between items-start">
                  <h4 className="text-gold font-medieval">{loc.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 capitalize">
                    {loc.type}
                  </span>
                </div>
                <p className="text-parchment/80 text-sm mt-1">{loc.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {loc.features.map((f, j) => (
                    <span key={j} className="text-xs px-1 py-0.5 bg-leather/50 rounded text-parchment/70">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'encounters':
        return (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campaign.encounters.map((enc, i) => {
              const diffColors = {
                easy: 'bg-green-500/30 text-green-300',
                medium: 'bg-yellow-500/30 text-yellow-300',
                hard: 'bg-orange-500/30 text-orange-300',
                deadly: 'bg-red-500/30 text-red-300',
              };
              return (
                <div key={i} className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/50">
                  <div className="flex justify-between items-start">
                    <h4 className="text-gold font-medieval">{enc.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${diffColors[enc.difficulty]}`}>
                      {enc.difficulty}
                    </span>
                  </div>
                  <p className="text-parchment/80 text-sm mt-1">{enc.description}</p>
                  <div className="mt-2 text-xs text-parchment/70">
                    <strong>Monsters:</strong> {enc.monsters.map(m => `${m.count}x ${m.name} (CR ${m.cr})`).join(', ')}
                  </div>
                  <p className="text-parchment/60 text-xs mt-1"><strong>Tactics:</strong> {enc.tactics}</p>
                </div>
              );
            })}
          </div>
        );

      case 'sessions':
        return (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campaign.sessionOutlines.map((session) => (
              <div key={session.number} className="p-3 rounded-lg bg-dark-wood/50 border border-leather">
                <h4 className="text-gold font-medieval">Session {session.number}: {session.title}</h4>
                <p className="text-parchment/80 text-sm mt-1">{session.summary}</p>
                <div className="mt-2">
                  <span className="text-parchment/60 text-xs">Objectives:</span>
                  <ul className="text-parchment/70 text-xs list-disc list-inside">
                    {session.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        );

      case 'map':
        return renderDungeonMap();

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Generation Form */}
      {!campaign && (
        <div className="space-y-3">
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

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeMap}
              onChange={(e) => setIncludeMap(e.target.checked)}
              className="rounded"
            />
            <span className="text-parchment text-sm">Include Dungeon Map</span>
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
              <div className="text-xs text-parchment/50 mt-1">This may take 30-60 seconds</div>
            </div>
          )}
        </div>
      )}

      {/* Generated Campaign */}
      {campaign && (
        <div>
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
