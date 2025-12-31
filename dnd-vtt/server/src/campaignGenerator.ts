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
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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
  return `You are an expert D&D 5e Dungeon Master creating a DETAILED, READY-TO-RUN campaign module.

Campaign Request:
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Number of Sessions: ${request.sessionCount || 4}
- Tone: ${request.tone || 'serious'}

Create an immersive, narrative-rich campaign. Return ONLY valid JSON with this EXACT structure:

\`\`\`json
{
  "title": "Evocative Campaign Title",
  "synopsis": "3-4 sentence dramatic overview with vivid imagery. Set the stakes, describe the threat, hint at the adventure ahead.",
  "hook": "Compelling, detailed reason the party gets involved. Include specific details like reward amounts, NPC names, or urgent circumstances.",
  "arc": {
    "beginning": "Detailed Act 1 description (2-3 paragraphs). Include: opening scene with read-aloud text, key NPCs to meet, initial challenges, and how it transitions to Act 2.",
    "middle": "Detailed Act 2 description (2-3 paragraphs). Include: the journey/dungeon exploration, major revelations, escalating dangers, puzzles or challenges faced.",
    "climax": "Detailed Act 3 description (2-3 paragraphs). Include: the final confrontation setup, boss tactics and weaknesses, environmental hazards, victory conditions.",
    "resolution": "Epilogue possibilities (1-2 paragraphs). Include: rewards, how the world changes, NPC reactions, sequel hooks."
  },
  "npcs": [
    {
      "name": "Full NPC Name",
      "race": "Race",
      "occupation": "Role/Title",
      "personality": "Detailed personality: how they speak (accent, verbal tics), mannerisms, emotional state. Include a memorable quote they might say.",
      "motivation": "What they want and why. Include specific goals and what they'll do to achieve them.",
      "secret": "Hidden agenda or secret knowledge. Include DC check to discover (e.g., 'DC 15 Insight reveals they are lying about...')",
      "isAlly": true,
      "appearance": "Detailed physical description: age, height, clothing, distinguishing features, how they carry themselves.",
      "keyInfo": ["Important fact 1 (with DC if skill check needed)", "Important fact 2", "Quest-relevant detail with game mechanics"]
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "type": "town/dungeon/wilderness/building",
      "description": "Detailed description (2-3 sentences) with sensory details: sights, sounds, smells, atmosphere. This is read-aloud text.",
      "features": ["Interactive element 1 (with DC if applicable)", "Point of interest 2", "Environmental feature"],
      "encounters": ["Possible encounter with difficulty"],
      "treasure": ["Specific item (value in gp)", "Another item"],
      "secrets": "Hidden areas or information (DC to find)"
    }
  ],
  "encounters": [
    {
      "name": "Encounter Name",
      "description": "READ-ALOUD TEXT: 2-3 paragraphs describing what players see. Include atmospheric details, enemy positions, terrain features. This should be evocative prose the DM reads to players.",
      "difficulty": "easy/medium/hard/deadly",
      "monsters": [
        {"name": "Monster Name (from D&D 5e SRD)", "count": 2, "cr": "1/2"}
      ],
      "tactics": "Detailed combat tactics: How enemies fight, use terrain, coordinate attacks. Include fallback plans, morale breaks, and any dynamic events (reinforcements, environmental changes).",
      "rewards": ["XP total for encounter", "Specific loot items with gold values", "Any special rewards"],
      "terrain": "Terrain features: difficult terrain, cover positions, hazards, interactive elements players can use",
      "setup": "Tactical positioning: where enemies start, ambush opportunities, escape routes"
    }
  ],
  "sessionOutlines": [
    {
      "number": 1,
      "title": "Session Title",
      "summary": "Detailed session summary (2-3 paragraphs): What happens, key scenes, important NPCs, combat encounters, puzzles. Include estimated duration.",
      "objectives": ["Primary objective", "Secondary/optional objective", "Secret objective players might discover"],
      "readAloud": "Opening scene read-aloud text for this session (1-2 paragraphs of atmospheric prose)",
      "keyMoments": ["Dramatic moment 1", "Plot twist or revelation", "Cliffhanger ending"]
    }
  ],
  "puzzles": [
    {
      "name": "Puzzle Name",
      "location": "Where it appears",
      "description": "What players see (read-aloud text)",
      "mechanics": "How the puzzle works",
      "hints": ["Hint 1 (DC 12 Investigation)", "Hint 2 (DC 15 Arcana)", "Hint 3 (DC 10 History)"],
      "solution": "The actual solution",
      "reward": "What solving it grants",
      "failure": "What happens if failed or triggered wrong"
    }
  ],
  "boss": {
    "name": "Final Boss Name",
    "description": "Dramatic appearance description",
    "tactics": "Phase-by-phase combat tactics",
    "weakness": "How clever players can gain advantage",
    "monologue": "Villainous speech or dialogue during confrontation",
    "rewards": {"xp": 500, "gold": "100gp", "items": ["Magic item or special reward"]}
  },
  "shopServices": [
    {"item": "Healing Potion (2d4+2)", "cost": "50gp"},
    {"item": "Holy Water (vial)", "cost": "25gp"},
    {"item": "Rope, 50ft", "cost": "1gp"}
  ],
  "randomEncounters": [
    {"roll": "1-2", "encounter": "Description", "difficulty": "easy"},
    {"roll": "3-4", "encounter": "Description", "difficulty": "medium"}
  ]
}
\`\`\`

CRITICAL REQUIREMENTS:
1. The "description" field in encounters MUST be read-aloud text (evocative prose for the DM to read)
2. Include specific DC checks throughout (Investigation, Perception, Persuasion, etc.)
3. All monsters must be from D&D 5e SRD with correct CR ratings
4. Balance encounters for ${request.partySize} level ${request.partyLevel} characters
5. Create at least 4-6 detailed encounters (mix of combat and puzzles)
6. NPCs need memorable personalities with distinct speech patterns
7. Include specific treasure with gold piece values
8. Session outlines should have read-aloud opening scenes`;
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
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
