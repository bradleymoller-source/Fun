import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Request, Response } from 'express';

// Initialize Google Generative AI client - uses GOOGLE_API_KEY env variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Types for campaign generation
export interface CampaignRequest {
  theme: string;
  setting: string;
  partyLevel: number;
  partySize: number;
  sessionCount?: number;
  tone?: 'serious' | 'lighthearted' | 'horror' | 'epic';
  includeMap?: boolean;
}

export interface GeneratedNPC {
  name: string;
  race: string;
  occupation: string;
  personality: string;
  motivation: string;
  secret?: string;
  isAlly: boolean;
}

export interface GeneratedLocation {
  name: string;
  type: string;
  description: string;
  features: string[];
  encounters?: string[];
  treasure?: string[];
}

export interface GeneratedEncounter {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  monsters: { name: string; count: number; cr: string }[];
  tactics: string;
  rewards: string[];
}

export interface GeneratedCampaign {
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

export interface DungeonRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'entrance' | 'corridor' | 'room' | 'boss' | 'treasure' | 'trap' | 'secret';
  name: string;
  description: string;
  connections: string[];
  encounter?: GeneratedEncounter;
  features?: string[];
}

export interface DungeonMap {
  name: string;
  width: number;
  height: number;
  rooms: DungeonRoom[];
  theme: string;
}

// Generate campaign using Google Gemini API
export async function generateCampaign(req: Request, res: Response) {
  try {
    const request: CampaignRequest = req.body;

    if (!request.theme || !request.setting) {
      return res.status(400).json({ error: 'Theme and setting are required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not configured. Add it in Render Environment Variables.' });
    }

    console.log('Starting campaign generation with theme:', request.theme, 'setting:', request.setting);

    const prompt = buildCampaignPrompt(request);

    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (modelError) {
      console.error('Failed to get Gemini model:', modelError);
      return res.status(500).json({
        error: 'Failed to initialize AI model',
        details: modelError instanceof Error ? modelError.message : String(modelError)
      });
    }

    console.log('Calling Gemini API...');

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError);
      const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
      return res.status(500).json({
        error: 'AI API call failed',
        details: errorMsg.includes('API_KEY') ? 'Invalid or expired API key' : errorMsg
      });
    }

    const response = result.response;
    const text = response.text();

    console.log('Gemini response received, length:', text.length);
    if (text.length < 100) {
      console.log('Short response content:', text);
    }

    // Try multiple patterns to extract JSON
    let jsonStr = '';

    // Pattern 1: ```json ... ```
    const jsonBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1];
      console.log('Extracted via json code block');
    } else {
      // Pattern 2: ``` ... ```
      const codeBlockMatch = text.match(/```\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
        console.log('Extracted via generic code block');
      } else {
        // Pattern 3: Direct JSON object
        const directMatch = text.match(/\{[\s\S]*\}/);
        if (directMatch) {
          jsonStr = directMatch[0];
          console.log('Extracted via direct JSON match');
        } else {
          jsonStr = text;
          console.log('Using raw response as JSON');
        }
      }
    }

    console.log('Extracted JSON length:', jsonStr.length);

    try {
      const campaign: GeneratedCampaign = JSON.parse(jsonStr);

      // Generate dungeon map if requested
      if (request.includeMap) {
        try {
          campaign.dungeonMap = await generateDungeonMap(request, campaign);
        } catch (mapError) {
          console.error('Dungeon map generation failed, using procedural:', mapError);
          campaign.dungeonMap = generateProceduralDungeon(request.theme);
        }
      }

      console.log('Campaign generated successfully:', campaign.title);
      return res.json(campaign);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('First 500 chars of attempted parse:', jsonStr.substring(0, 500));
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
        details: String(parseError),
        rawPreview: text.substring(0, 300)
      });
    }
  } catch (error) {
    console.error('Unexpected campaign generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Failed to generate campaign',
      details: errorMessage
    });
  }
}

// Generate a dungeon map based on campaign
async function generateDungeonMap(request: CampaignRequest, campaign: GeneratedCampaign): Promise<DungeonMap> {
  const prompt = `You are a dungeon designer for D&D 5e. Create a dungeon map layout as JSON for:
Theme: ${request.theme}
Setting: ${request.setting}
Party Level: ${request.partyLevel}
Campaign Title: ${campaign.title}

Generate a dungeon with 8-15 rooms. Return ONLY valid JSON in this format:
{
  "name": "Dungeon Name",
  "width": 20,
  "height": 20,
  "theme": "dungeon theme",
  "rooms": [
    {
      "id": "room-1",
      "x": 0,
      "y": 8,
      "width": 3,
      "height": 3,
      "type": "entrance",
      "name": "Dungeon Entrance",
      "description": "The entrance to the dungeon...",
      "connections": ["room-2"],
      "features": ["Stone doors", "Ancient runes"]
    }
  ]
}

Room types: entrance, corridor, room, boss, treasure, trap, secret
Ensure rooms connect logically and don't overlap. Place entrance at edge.
Use grid coordinates (0-19 for x and y).`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const mapJson = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(mapJson);
    }

    return generateProceduralDungeon(request.theme);
  } catch (error) {
    console.error('Dungeon map generation error:', error);
    return generateProceduralDungeon(request.theme);
  }
}

// Fallback procedural dungeon generator
function generateProceduralDungeon(theme: string): DungeonMap {
  const rooms: DungeonRoom[] = [];
  const roomCount = 8 + Math.floor(Math.random() * 8); // 8-15 rooms

  const roomTypes: DungeonRoom['type'][] = ['entrance', 'room', 'room', 'room', 'corridor', 'treasure', 'trap', 'boss', 'secret'];
  const roomNames: Record<DungeonRoom['type'], string[]> = {
    entrance: ['Grand Entrance', 'Dungeon Gate', 'Ancient Doorway', 'Cavern Mouth'],
    corridor: ['Dark Passage', 'Winding Tunnel', 'Narrow Hall', 'Carved Corridor'],
    room: ['Guard Room', 'Storage Chamber', 'Empty Hall', 'Ruined Study', 'Armory'],
    boss: ['Throne Room', 'Inner Sanctum', 'Dark Heart', 'Final Chamber'],
    treasure: ['Vault', 'Treasury', 'Hoard Room', 'Gold Chamber'],
    trap: ['Trapped Hall', 'Danger Room', 'Pit Chamber', 'Blade Gallery'],
    secret: ['Hidden Chamber', 'Secret Study', 'Concealed Vault', 'Mystery Room'],
  };

  // Place entrance
  rooms.push({
    id: 'room-1',
    x: 0,
    y: 8,
    width: 3,
    height: 3,
    type: 'entrance',
    name: 'Dungeon Entrance',
    description: `The entrance to this ${theme} dungeon.`,
    connections: ['room-2'],
    features: ['Heavy stone doors', 'Warning inscriptions'],
  });

  // Generate remaining rooms
  let currentX = 4;
  let currentY = 8;

  for (let i = 2; i <= roomCount; i++) {
    const type = i === roomCount ? 'boss' : roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const names = roomNames[type];
    const name = names[Math.floor(Math.random() * names.length)];

    const width = type === 'corridor' ? 1 : 2 + Math.floor(Math.random() * 3);
    const height = type === 'corridor' ? 3 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3);

    // Move position
    if (Math.random() > 0.5) {
      currentX += width + 1;
      if (currentX > 17) {
        currentX = 4;
        currentY += 4;
      }
    } else {
      currentY += height + 1;
      if (currentY > 17) {
        currentY = 2;
        currentX += 5;
      }
    }

    rooms.push({
      id: `room-${i}`,
      x: Math.min(currentX, 17),
      y: Math.min(currentY, 17),
      width,
      height,
      type,
      name,
      description: `A ${type} in the ${theme} dungeon.`,
      connections: i < roomCount ? [`room-${i + 1}`] : [],
      features: generateRoomFeatures(type),
    });
  }

  // Add connections from previous rooms
  for (let i = 1; i < rooms.length; i++) {
    if (!rooms[i - 1].connections.includes(rooms[i].id)) {
      rooms[i - 1].connections.push(rooms[i].id);
    }
  }

  return {
    name: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Dungeon`,
    width: 20,
    height: 20,
    rooms,
    theme,
  };
}

function generateRoomFeatures(type: DungeonRoom['type']): string[] {
  const features: Record<DungeonRoom['type'], string[][]> = {
    entrance: [['Heavy doors', 'Ancient carvings'], ['Broken statues', 'Dusty floor']],
    corridor: [['Torch sconces', 'Cobwebs'], ['Dripping water', 'Rat holes']],
    room: [['Broken furniture', 'Old tapestries'], ['Cracked pillars', 'Debris']],
    boss: [['Throne', 'Dark altar'], ['Treasure piles', 'Ritual circle']],
    treasure: [['Locked chests', 'Gold piles'], ['Magic items', 'Gems']],
    trap: [['Pressure plates', 'Dart holes'], ['Pit traps', 'Poison needles']],
    secret: [['Hidden door', 'Secret switch'], ['Concealed passage', 'False wall']],
  };

  const options = features[type];
  return options[Math.floor(Math.random() * options.length)];
}

function buildCampaignPrompt(request: CampaignRequest): string {
  return `You are an expert D&D 5e Dungeon Master. Create a complete campaign outline as JSON.

Campaign Request:
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Number of Sessions: ${request.sessionCount || 4}
- Tone: ${request.tone || 'balanced'}

Generate a campaign with the following structure. Return ONLY valid JSON:

\`\`\`json
{
  "title": "Campaign Title",
  "synopsis": "2-3 sentence campaign overview",
  "hook": "How the party gets involved",
  "arc": {
    "beginning": "Act 1 summary",
    "middle": "Act 2 summary",
    "climax": "Final confrontation",
    "resolution": "Epilogue possibilities"
  },
  "npcs": [
    {
      "name": "NPC Name",
      "race": "Race",
      "occupation": "Job/Role",
      "personality": "Brief personality",
      "motivation": "What they want",
      "secret": "Hidden agenda (optional)",
      "isAlly": true
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "type": "town/dungeon/wilderness/etc",
      "description": "2-3 sentences",
      "features": ["Notable feature 1", "Notable feature 2"],
      "encounters": ["Possible encounter 1"],
      "treasure": ["Possible loot"]
    }
  ],
  "encounters": [
    {
      "name": "Encounter Name",
      "description": "Setup and context",
      "difficulty": "medium",
      "monsters": [{"name": "Monster", "count": 2, "cr": "1"}],
      "tactics": "How enemies fight",
      "rewards": ["XP", "Loot"]
    }
  ],
  "sessionOutlines": [
    {
      "number": 1,
      "title": "Session Title",
      "summary": "What happens",
      "objectives": ["Goal 1", "Goal 2"]
    }
  ]
}
\`\`\`

Create 3-5 NPCs, 3-5 locations, 4-6 encounters appropriate for level ${request.partyLevel}, and ${request.sessionCount || 4} session outlines.
Use monsters from D&D 5e SRD. Ensure encounters are balanced for ${request.partySize} level ${request.partyLevel} characters.`;
}

// Generate just a dungeon map
export async function generateDungeonMapEndpoint(req: Request, res: Response) {
  try {
    const { theme, partyLevel } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    const dungeonMap = generateProceduralDungeon(theme);

    // Optionally enhance with Gemini
    if (req.body.enhance && process.env.GOOGLE_API_KEY) {
      const prompt = `Enhance this dungeon map with better descriptions. Theme: ${theme}, Party Level: ${partyLevel || 1}.
Current map: ${JSON.stringify(dungeonMap)}

Return the enhanced map as JSON with better room names, descriptions, and features. Keep the same structure.`;

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                          text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const enhanced = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          return res.json(enhanced);
        }
      } catch (enhanceError) {
        console.error('Enhancement failed, returning procedural map:', enhanceError);
      }
    }

    res.json(dungeonMap);
  } catch (error) {
    console.error('Dungeon map generation error:', error);
    res.status(500).json({ error: 'Failed to generate dungeon map', details: String(error) });
  }
}

// Quick encounter generation
export async function generateEncounter(req: Request, res: Response) {
  try {
    const { partyLevel, partySize, difficulty, environment, theme } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
    }

    const prompt = `Generate a D&D 5e encounter as JSON for:
- Party: ${partySize || 4} characters at level ${partyLevel || 1}
- Difficulty: ${difficulty || 'medium'}
- Environment: ${environment || 'dungeon'}
- Theme: ${theme || 'generic fantasy'}

Return ONLY valid JSON:
{
  "name": "Encounter Name",
  "description": "2-3 sentence setup",
  "difficulty": "${difficulty || 'medium'}",
  "monsters": [{"name": "SRD Monster Name", "count": 2, "cr": "1/2"}],
  "tactics": "How monsters fight",
  "rewards": ["XP total", "Possible loot"],
  "terrain": ["Terrain feature 1", "Terrain feature 2"],
  "complications": "Optional twist or complication"
}

Use only SRD monsters. Balance for the party.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      const encounter = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return res.json(encounter);
    }

    res.status(500).json({ error: 'Failed to parse encounter' });
  } catch (error) {
    console.error('Encounter generation error:', error);
    res.status(500).json({ error: 'Failed to generate encounter', details: String(error) });
  }
}
