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
}

interface CampaignGeneratorProps {
  onCampaignGenerated?: (campaign: GeneratedCampaign) => void;
  onDungeonGenerated?: (dungeon: DungeonMap) => void;
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

export function CampaignGenerator({ onCampaignGenerated, onDungeonGenerated }: CampaignGeneratorProps) {
  // Form state
  const [theme, setTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [customSetting, setCustomSetting] = useState('');
  const [partyLevel, setPartyLevel] = useState(1);
  const [partySize, setPartySize] = useState(4);
  const [sessionCount, setSessionCount] = useState(1);
  const [tone, setTone] = useState<'serious' | 'lighthearted' | 'horror' | 'epic'>('serious');
  const [includeMap, setIncludeMap] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'act1' | 'act2' | 'act3' | 'epilogue' | 'npcs' | 'locations' | 'encounters' | 'sessions' | 'map'>('overview');
  const [selectedRoom, setSelectedRoom] = useState<DungeonRoom | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/campaign/generate`, {
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
        <p className="text-xs text-yellow-400 mt-1"><strong>Treasure:</strong> {room.treasure.map((t: any) => `${t.item} (${t.value})`).join(', ')}</p>
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
            {campaign.targetDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.targetDuration}</p>}
            <p className="text-parchment">{campaign.synopsis}</p>

            <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/50">
              <h4 className="text-amber-400 text-sm font-bold mb-1">Adventure Hook</h4>
              <p className="text-parchment/90 text-sm">{campaign.hook}</p>
            </div>

            {campaign.overview?.readAloud && (
              <div>
                <h4 className="text-gold text-sm font-bold mb-2">Opening Narration</h4>
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
            <h3 className="text-xl font-medieval text-gold">{campaign.act1.title}</h3>
            {campaign.act1.estimatedDuration && <p className="text-parchment/50 text-xs">Duration: {campaign.act1.estimatedDuration}</p>}
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
                  <div key={i} className="mb-2">
                    <p className="text-blue-400 text-xs font-bold">{shop.name} ({shop.keeper})</p>
                    <div className="text-parchment/70 text-xs">
                      {shop.inventory?.map((item: any, j: number) => (
                        <span key={j} className="mr-2">{item.item}: {item.cost}</span>
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
                <h4 className="text-red-400 text-sm font-bold mb-2">Boss Encounter</h4>

                {campaign.act3.bossEncounter.chamberDescription?.readAloud && (
                  <div className="mb-3">{renderReadAloud(campaign.act3.bossEncounter.chamberDescription.readAloud)}</div>
                )}

                {campaign.act3.bossEncounter.villain && (
                  <div className="bg-dark-wood/50 p-2 rounded mb-2">
                    <p className="text-red-300 font-bold">{campaign.act3.bossEncounter.villain.name}</p>
                    <p className="text-parchment/70 text-sm">{campaign.act3.bossEncounter.villain.appearance}</p>
                    <p className="text-parchment/60 text-xs mt-1"><strong>Motivation:</strong> {campaign.act3.bossEncounter.villain.motivation}</p>

                    {campaign.act3.bossEncounter.villain.dialogue && (
                      <div className="mt-2 space-y-1">
                        {campaign.act3.bossEncounter.villain.dialogue.onSighting && (
                          <p className="text-amber-300 text-xs">"{campaign.act3.bossEncounter.villain.dialogue.onSighting}"</p>
                        )}
                        {campaign.act3.bossEncounter.villain.dialogue.monologue && (
                          <p className="text-amber-300 text-xs italic">"{campaign.act3.bossEncounter.villain.dialogue.monologue}"</p>
                        )}
                      </div>
                    )}

                    {campaign.act3.bossEncounter.villain.tactics && (
                      <div className="mt-2 text-xs">
                        <strong className="text-gold">Tactics:</strong>
                        <p className="text-parchment/70">Phase 1: {campaign.act3.bossEncounter.villain.tactics.phase1}</p>
                        <p className="text-parchment/70">Phase 2: {campaign.act3.bossEncounter.villain.tactics.phase2}</p>
                        <p className="text-parchment/70">Phase 3: {campaign.act3.bossEncounter.villain.tactics.phase3}</p>
                      </div>
                    )}

                    {campaign.act3.bossEncounter.villain.weakness && (
                      <p className="text-green-400 text-xs mt-2"><strong>Weakness:</strong> {campaign.act3.bossEncounter.villain.weakness}</p>
                    )}
                  </div>
                )}

                {campaign.act3.bossEncounter.rewards && (
                  <div className="mt-2">
                    <strong className="text-yellow-400 text-xs">Rewards:</strong>
                    <p className="text-parchment/70 text-xs">XP: {campaign.act3.bossEncounter.rewards.xp} | Gold: {campaign.act3.bossEncounter.rewards.gold}</p>
                    {campaign.act3.bossEncounter.rewards.items?.map((item: any, i: number) => (
                      <p key={i} className="text-yellow-300 text-xs">{item.name}: {item.description}</p>
                    ))}
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
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {campaign.npcs?.map((npc, i) => (
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

      case 'encounters':
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {campaign.encounters?.map((enc, i) => {
              const diffColors: Record<string, string> = {
                easy: 'bg-green-500/30 text-green-300',
                medium: 'bg-yellow-500/30 text-yellow-300',
                hard: 'bg-orange-500/30 text-orange-300',
                deadly: 'bg-red-500/30 text-red-300',
              };
              return (
                <div key={i} className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/50">
                  <div className="flex justify-between items-start">
                    <h4 className="text-gold font-medieval">{enc.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${diffColors[enc.difficulty] || 'bg-gray-500/30'}`}>
                      {enc.difficulty}
                    </span>
                  </div>
                  <p className="text-parchment/80 text-sm mt-1">{enc.description}</p>
                  <div className="mt-2 text-xs text-parchment/70">
                    <strong>Monsters:</strong> {enc.monsters?.map(m => `${m.count}x ${m.name} (CR ${m.cr})`).join(', ')}
                  </div>
                  <p className="text-parchment/60 text-xs mt-1"><strong>Tactics:</strong> {enc.tactics}</p>
                </div>
              );
            })}
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
