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
  const sessionHours = (request.sessionCount || 1) * 2.5; // Each session ~2.5 hours

  return `You are a master D&D 5e Dungeon Master creating a COMPLETE, READY-TO-RUN adventure module following classic three-act structure.

ADVENTURE PARAMETERS:
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Target Duration: ${sessionHours} hours (${request.sessionCount || 1} session${(request.sessionCount || 1) > 1 ? 's' : ''} of 2-3 hours each)
- Tone: ${request.tone || 'serious'}

Create an immersive adventure using the CLASSIC D&D THREE-ACT STRUCTURE. Return ONLY valid JSON:

\`\`\`json
{
  "title": "Evocative Adventure Title",
  "synopsis": "3-4 sentence dramatic overview. Establish the threat, the stakes, and why heroes are needed. Paint a vivid picture.",
  "hook": "The inciting incident that draws the party in. Include specific details: reward amount, urgent deadline, or personal connection.",
  "targetDuration": "${sessionHours} hours",
  "arc": {
    "beginning": "Brief Act 1 summary (1 sentence)",
    "middle": "Brief Act 2 summary (1 sentence)",
    "climax": "Brief Act 3 summary (1 sentence)",
    "resolution": "Brief epilogue summary (1 sentence)"
  },

  "overview": {
    "readAloud": "Opening narration (2-3 paragraphs): Set the scene with vivid sensory details. Describe the world, the atmosphere, recent events that created this situation. This is what the DM reads to start the adventure.",
    "backstory": "The true history behind the adventure. What happened to cause this threat? Who is the villain and what do they want? Information the DM needs but players must discover.",
    "themes": ["Primary theme", "Secondary theme"],
    "warnings": "Any content warnings or mature themes"
  },

  "act1": {
    "title": "Act 1 Title (e.g., 'The Village of Millbrook')",
    "estimatedDuration": "45-60 minutes",
    "overview": "What happens in Act 1 and its purpose in the story",

    "settingTheScene": {
      "readAloud": "Arrival description (2 paragraphs): What do players see, hear, smell as they arrive? What's the mood? Include specific sensory details that hint at the problem.",
      "dmNotes": "What's really happening behind the scenes"
    },

    "questGiver": {
      "name": "Quest Giver Name",
      "role": "Their position (Elder, Mayor, Priest, etc.)",
      "appearance": "Detailed physical description with age, clothing, distinguishing features",
      "personality": "How they speak and act. Include verbal tics or accent.",
      "dialogue": {
        "greeting": "Initial dialogue when party approaches",
        "questPitch": "How they explain the problem and ask for help",
        "persuaded": "Response if party negotiates (DC 15 Persuasion for better reward)",
        "ifQuestioned": "Responses to likely player questions"
      },
      "reward": {"offered": "Initial reward", "negotiated": "Better reward if persuaded", "secret": "Hidden bonus they might offer"},
      "keyInformation": ["Fact 1 they share freely", "Fact 2 (DC 12 Insight to notice they're hiding something)", "Fact 3 they only share if asked specifically"]
    },

    "keyNpcs": [
      {
        "name": "NPC Name",
        "role": "Innkeeper/Blacksmith/Priest/Local/etc.",
        "location": "Where found",
        "appearance": "Physical description",
        "personality": "Demeanor and speech pattern",
        "dialogue": {
          "greeting": "How they greet strangers",
          "gossip": "Local rumors they share",
          "ifBribed": "What DC 12 Persuasion or 5gp reveals"
        },
        "keyInformation": ["Useful fact with DC if needed"],
        "services": [{"item": "Service/Item", "cost": "Price"}]
      }
    ],

    "locations": [
      {
        "name": "Location Name (Tavern, Temple, Shop, etc.)",
        "readAloud": "Description for players (1-2 paragraphs with sensory details)",
        "features": ["Interactive element", "Notable detail"],
        "npcsPresent": ["NPC names found here"],
        "secrets": "Hidden information (with DC to discover)"
      }
    ],

    "services": {
      "inn": {"name": "Inn Name", "roomCost": "5sp/night", "mealCost": "2sp", "rumors": ["Rumor 1", "Rumor 2"]},
      "shops": [
        {"name": "Shop Name", "keeper": "Shopkeeper Name", "inventory": [{"item": "Item", "cost": "Price"}]}
      ],
      "temple": {"name": "Temple Name", "deity": "God served", "services": [{"service": "Healing", "cost": "Donation"}]}
    },

    "travelToDestination": {
      "description": "The journey from town to dungeon",
      "readAloud": "Travel narration (1-2 paragraphs describing the journey, changing landscape, growing danger)",
      "duration": "Travel time",
      "encounters": ["Potential travel encounter"]
    },

    "potentialConflicts": [
      {
        "name": "Conflict Name (Ambush, Suspicious Stranger, etc.)",
        "trigger": "What causes this to happen",
        "readAloud": "Scene description",
        "resolution": "How it can be resolved (combat, roleplay, skill checks)",
        "rewards": ["What players gain"],
        "skippable": true
      }
    ],

    "transitionToAct2": "Read-aloud text transitioning to Act 2 (the party arrives at the dungeon entrance...)"
  },

  "act2": {
    "title": "Act 2 Title (e.g., 'The Crimson Depths')",
    "estimatedDuration": "60-90 minutes",
    "overview": "The dungeon/adventure site and its dangers. MUST contain exactly 3 combat encounters.",

    "dungeonOverview": {
      "name": "Dungeon Name",
      "history": "Brief history of this place",
      "readAloud": "Entrance description (what players see approaching)",
      "atmosphere": "Overall mood and environmental details",
      "lightingConditions": "Bright/dim/dark light",
      "environmentalHazards": ["Hazard 1", "Hazard 2"]
    },

    "rooms": [
      {
        "id": "1",
        "name": "Room Name",
        "readAloud": "Detailed room description (2-3 paragraphs with sensory details). What do players see, hear, smell? What's immediately obvious vs. hidden?",
        "dimensions": "30ft x 40ft",
        "lighting": "Dim light from...",
        "exits": ["North: wooden door to Room 2", "East: collapsed tunnel"],
        "contents": {
          "obvious": ["What's immediately visible"],
          "hidden": ["What DC 15 Perception reveals", "What DC 12 Investigation finds"]
        },
        "encounter": {
          "type": "combat/trap/puzzle/roleplay/none",
          "description": "What happens here"
        },
        "treasure": [{"item": "Item", "location": "Where found", "value": "Worth"}],
        "connections": "How this room relates to the dungeon's story"
      }
    ],

    "encounters": [
      {
        "name": "Combat Encounter 1 - Entry/Guard Fight",
        "location": "Room number/area",
        "type": "combat",
        "readAloud": "What players see as combat begins",
        "enemies": [{"name": "Monster", "count": 2, "cr": "1/2", "hp": 22, "ac": 13}],
        "tactics": "How enemies fight: initial actions, fallback plans, morale",
        "terrain": "Combat-relevant terrain features",
        "dynamicElements": "What changes mid-fight (reinforcements, environmental shifts)",
        "difficulty": "easy",
        "rewards": {"xp": 100, "loot": ["Item (value)"]}
      },
      {
        "name": "Combat Encounter 2 - Mid-Dungeon Challenge",
        "location": "Room number/area",
        "type": "combat",
        "readAloud": "What players see as combat begins",
        "enemies": [{"name": "Monster", "count": 3, "cr": "1", "hp": 30, "ac": 14}],
        "tactics": "How enemies fight with more coordination",
        "terrain": "Terrain that affects tactics",
        "dynamicElements": "Environmental hazards or reinforcements",
        "difficulty": "medium",
        "rewards": {"xp": 200, "loot": ["Better loot"]}
      },
      {
        "name": "Combat Encounter 3 - Pre-Boss Minions",
        "location": "Room before boss",
        "type": "combat",
        "readAloud": "The villain's elite guards or lieutenants",
        "enemies": [{"name": "Elite Monster", "count": 2, "cr": "2", "hp": 45, "ac": 15}],
        "tactics": "Coordinated defense, may alert boss",
        "terrain": "Tactical terrain features",
        "dynamicElements": "May trigger alarm or boss awareness",
        "difficulty": "hard",
        "rewards": {"xp": 300, "loot": ["Valuable items", "Key or clue"]}
      }
    ],

    "traps": [
      {
        "name": "Trap Name",
        "location": "Where it is",
        "trigger": "What sets it off",
        "detection": "DC 14 Perception to notice",
        "effect": "What it does (damage, condition, alarm)",
        "disarm": "DC 12 Thieves' Tools or alternative solution",
        "ifTriggered": "Full description of trap activating"
      }
    ],

    "puzzles": [
      {
        "name": "Puzzle Name",
        "location": "Room number",
        "readAloud": "What players see (the puzzle elements, any inscriptions, the locked door/chest it guards)",
        "mechanics": "How it actually works",
        "hints": [
          {"method": "DC 12 Investigation", "reveal": "Hint 1"},
          {"method": "DC 15 Arcana", "reveal": "Hint 2"},
          {"method": "Inscription translation", "reveal": "Hint 3"}
        ],
        "solution": "The correct solution",
        "reward": "What solving it grants (access, treasure, information)",
        "failure": "Consequence of wrong answer (damage, alarm, lock permanently)"
      }
    ],

    "secrets": [
      {
        "name": "Secret Name",
        "location": "Where hidden",
        "discovery": "How to find it (DC or trigger)",
        "contents": "What's revealed",
        "significance": "Why it matters to the story"
      }
    ],

    "transitionToAct3": "Read-aloud text as party approaches the final chamber..."
  },

  "act3": {
    "title": "Act 3 Title (e.g., 'The Lord of Bones')",
    "estimatedDuration": "30-45 minutes",
    "overview": "The final confrontation",

    "approach": {
      "readAloud": "Description of the path to the boss chamber - building tension",
      "warnings": "Signs of danger ahead",
      "lastChance": "Final opportunity to rest, prepare, turn back"
    },

    "bossEncounter": {
      "chamberDescription": {
        "readAloud": "The boss chamber (2-3 paragraphs). Describe the space, the atmosphere, the villain's presence. Make it dramatic.",
        "dimensions": "Chamber size",
        "terrain": ["Terrain feature 1", "Terrain feature 2"],
        "hazards": ["Environmental hazard"],
        "interactables": ["Things players can use in combat"]
      },

      "villain": {
        "name": "Villain Name",
        "appearance": "Dramatic physical description",
        "stats": {"cr": "Appropriate CR", "hp": 0, "ac": 0},
        "motivation": "Why they're doing this - their twisted logic or tragic backstory",

        "dialogue": {
          "onSighting": "What villain says when party enters",
          "monologue": "Villain's speech revealing their plan/motivation",
          "duringCombat": ["Combat taunt 1", "Combat taunt 2"],
          "ifDefeated": "Final words",
          "ifVictorious": "What they say if party loses"
        },

        "tactics": {
          "phase1": "Opening tactics (first third of HP)",
          "phase2": "Desperate tactics (below half HP)",
          "phase3": "Final stand (below quarter HP)",
          "signature": "Their signature move or ability"
        },

        "weakness": "How clever players can gain advantage",
        "morale": "Will they flee, surrender, or fight to death?"
      },

      "minions": [{"name": "Minion type", "count": 0, "role": "What they do in the fight"}],

      "rewards": {
        "xp": 0,
        "gold": "Amount",
        "items": [{"name": "Item", "description": "What it is", "value": "Worth or magical properties"}],
        "villainLoot": "What's on the villain's body"
      }
    },

    "aftermath": {
      "readAloud": "Immediate aftermath of victory (1 paragraph)",
      "discoveries": "What party learns/finds after the battle",
      "timeLimit": "Any urgency to leave?"
    },

    "returnJourney": {
      "description": "The trip back to town",
      "changes": "How the environment has changed (curse lifted, monsters fled, etc.)",
      "encounters": "Any encounters on return (grateful survivors, scavengers, etc.)"
    }
  },

  "epilogue": {
    "title": "Epilogue",
    "estimatedDuration": "15-20 minutes",

    "returnToTown": {
      "readAloud": "Arrival back in town (how has word spread? how do people react?)",
      "questGiverReaction": "How the quest giver responds to success",
      "townReaction": "How common folk treat the heroes"
    },

    "rewards": {
      "promised": "The agreed-upon reward",
      "bonus": "Any additional rewards for exceptional performance",
      "reputation": "How their reputation has changed",
      "titles": "Any titles or honors bestowed"
    },

    "celebration": {
      "readAloud": "The celebration scene (feast, ceremony, quiet gratitude)",
      "npcInteractions": "Brief scenes with key NPCs thanking the party"
    },

    "looseEnds": [
      {
        "thread": "Unresolved plot point",
        "hint": "How it might come up again"
      }
    ],

    "sequelHooks": [
      {
        "name": "Hook Name",
        "setup": "The rumor or event that hints at future adventure",
        "connection": "How it connects to this adventure"
      }
    ],

    "closingNarration": "Final read-aloud text wrapping up the adventure"
  },

  "npcs": [
    {
      "name": "NPC Name",
      "race": "Race",
      "occupation": "Role",
      "personality": "Personality summary",
      "motivation": "What they want",
      "secret": "Hidden knowledge/agenda",
      "isAlly": true
    }
  ],

  "locations": [
    {
      "name": "Location",
      "type": "Type",
      "description": "Description",
      "features": ["Feature"]
    }
  ],

  "encounters": [
    {
      "name": "Encounter",
      "description": "Description",
      "difficulty": "medium",
      "monsters": [{"name": "Monster", "count": 1, "cr": "1"}],
      "tactics": "Tactics",
      "rewards": ["Reward"]
    }
  ],

  "sessionOutlines": [
    {
      "number": 1,
      "title": "Complete Adventure",
      "summary": "Full adventure in one session",
      "objectives": ["Complete Act 1", "Complete Act 2", "Complete Act 3", "Epilogue"]
    }
  ]
}
\`\`\`

CRITICAL REQUIREMENTS:
1. ALL "readAloud" fields must be evocative prose with sensory details (sights, sounds, smells, textures, atmosphere)
2. Include specific DC checks throughout (Perception, Investigation, Insight, Persuasion, etc.)
3. NPCs need distinct personalities with actual dialogue lines, not just descriptions
4. **ACT 2 MUST HAVE EXACTLY 3 COMBAT ENCOUNTERS** - an easy entry fight, medium mid-dungeon fight, and hard pre-boss fight
5. Combat encounters need tactical depth - terrain, enemy tactics, dynamic elements
6. Puzzles need multiple hint paths and clear solutions
7. Use D&D 5e SRD monsters with appropriate CR for level ${request.partyLevel}
8. Balance total XP for a party of ${request.partySize} level ${request.partyLevel} characters
9. Include specific gold values and item names for all treasure
10. Boss needs phases, dialogue, and a weakness clever players can exploit
11. Ensure the adventure can be completed in approximately ${sessionHours} hours`;
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

// Generate a detailed battle map image URL using Pollinations.ai (free, no API key needed)
// This is now a fallback - primary method is Gemini
export function generateBattleMapUrl(
  environment: string,
  theme: string,
  features: string[] = [],
  lighting: string = 'torchlit',
  narrativeDescription: string = ''
): string {
  // Build a detailed prompt optimized for top-down battle map generation
  const featureList = features.length > 0 ? features.join(', ') : 'detailed terrain';

  // Extract key visual elements from the narrative description if provided
  let narrativeElements = '';
  if (narrativeDescription) {
    // Take first 200 chars of narrative to include key visual details
    const cleanNarrative = narrativeDescription
      .replace(/["\n\r]/g, ' ')
      .substring(0, 200)
      .trim();
    narrativeElements = `, ${cleanNarrative}`;
  }

  const prompt = `top-down battle map for dungeons and dragons, ${environment}, ${theme} theme, ${lighting} lighting, ${featureList}${narrativeElements}, highly detailed, fantasy rpg style, gridded tactical map, painted illustration style, vibrant colors, no text, no labels, professional quality`;

  // Pollinations.ai is free and doesn't require an API key
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
}

// Generate image using Google Gemini API
async function generateImageWithGemini(prompt: string): Promise<string | null> {
  if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY not configured for image generation');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Use gemini-2.0-flash-exp with image generation capability
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any, // Type assertion needed as responseModalities isn't in the base types yet
    });

    const response = await model.generateContent(prompt);
    const result = response.response;

    // Extract image data from response
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          const imageData = (part as any).inlineData.data;
          const mimeType = (part as any).inlineData.mimeType || 'image/png';
          // Return as data URL
          return `data:${mimeType};base64,${imageData}`;
        }
      }
    }

    console.log('No image data in Gemini response');
    return null;
  } catch (error) {
    console.error('Gemini image generation error:', error);
    return null;
  }
}

// Build battle map prompt for Gemini
function buildBattleMapPrompt(
  environment: string,
  theme: string,
  features: string[] = [],
  lighting: string = 'torchlit',
  narrativeDescription: string = ''
): string {
  const featureList = features.length > 0 ? features.join(', ') : 'stone floors, walls';

  let narrativeElements = '';
  if (narrativeDescription) {
    const cleanNarrative = narrativeDescription
      .replace(/["\n\r]/g, ' ')
      .substring(0, 300)
      .trim();
    narrativeElements = ` The scene shows: ${cleanNarrative}`;
  }

  return `Generate a top-down battle map for Dungeons and Dragons.
Location: ${environment}
Theme: ${theme}
Lighting: ${lighting}
Features to include: ${featureList}
${narrativeElements}

Style requirements:
- Top-down aerial view perspective
- Include a subtle square grid overlay for tactical combat (5ft squares)
- Highly detailed fantasy RPG illustration style
- Rich, vibrant colors with good contrast
- Show walls, floors, furniture, and terrain features clearly
- Professional quality digital painting style
- No text, labels, or watermarks`;
}

// Build scene image prompt for Gemini
function buildScenePrompt(
  location: string,
  mood: string = 'vibrant and inviting',
  timeOfDay: string = 'golden hour sunset'
): string {
  return `Generate a beautiful fantasy scene illustration.
Location: ${location}
Mood: ${mood}
Time of day: ${timeOfDay}

Style requirements:
- Epic fantasy landscape/scene illustration
- Highly detailed digital painting
- Dramatic composition with depth
- Concept art quality, artstation trending style
- Rich colors and atmospheric lighting
- Wide cinematic aspect ratio composition
- No text, labels, or watermarks`;
}

// Generate a beautiful scene/landscape image URL for setting the scene
export function generateSceneImageUrl(
  location: string,
  style: string = 'fantasy medieval',
  mood: string = 'vibrant and inviting',
  timeOfDay: string = 'golden hour sunset'
): string {
  const prompt = `${location}, ${style} art style, ${mood}, ${timeOfDay} lighting, highly detailed digital painting, epic fantasy illustration, concept art, artstation trending, dramatic composition, beautiful scenery, no text, no watermark, 8k quality`;

  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true`;
}

// Scene image generation endpoint - uses Gemini with Pollinations fallback
export async function generateSceneImage(req: Request, res: Response) {
  try {
    const { location, style, mood, timeOfDay, name, useGemini = true } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location description is required' });
    }

    // Try Gemini first if enabled
    if (useGemini && process.env.GOOGLE_API_KEY) {
      const prompt = buildScenePrompt(
        location,
        mood || 'vibrant and inviting',
        timeOfDay || 'golden hour sunset'
      );

      const geminiImage = await generateImageWithGemini(prompt);
      if (geminiImage) {
        return res.json({
          name: name || 'Scene',
          imageUrl: geminiImage,
          location,
          style,
          mood,
          timeOfDay,
          source: 'gemini'
        });
      }
      console.log('Gemini scene generation failed, falling back to Pollinations');
    }

    // Fallback to Pollinations.ai
    const imageUrl = generateSceneImageUrl(
      location,
      style || 'fantasy medieval',
      mood || 'vibrant and inviting',
      timeOfDay || 'golden hour sunset'
    );

    res.json({
      name: name || 'Scene',
      imageUrl,
      location,
      style,
      mood,
      timeOfDay,
      source: 'pollinations'
    });
  } catch (error) {
    console.error('Scene image generation error:', error);
    res.status(500).json({ error: 'Failed to generate scene image', details: String(error) });
  }
}

// Battle map generation endpoint - uses Gemini with Pollinations fallback
export async function generateBattleMap(req: Request, res: Response) {
  try {
    const { environment, theme, features, lighting, roomName, description, useGemini = true } = req.body;

    if (!environment) {
      return res.status(400).json({ error: 'Environment is required' });
    }

    let imageUrl: string;

    // Try Gemini first if enabled
    if (useGemini && process.env.GOOGLE_API_KEY) {
      const prompt = buildBattleMapPrompt(
        environment,
        theme || 'fantasy dungeon',
        features || [],
        lighting || 'torchlit',
        description || ''
      );

      const geminiImage = await generateImageWithGemini(prompt);
      if (geminiImage) {
        return res.json({
          name: roomName || 'Battle Map',
          imageUrl: geminiImage,
          environment,
          theme,
          features,
          lighting,
          source: 'gemini'
        });
      }
      console.log('Gemini image generation failed, falling back to Pollinations');
    }

    // Fallback to Pollinations.ai
    imageUrl = generateBattleMapUrl(
      environment,
      theme || 'fantasy dungeon',
      features || [],
      lighting || 'torchlit',
      description || ''
    );

    res.json({
      name: roomName || 'Battle Map',
      imageUrl,
      environment,
      theme,
      features,
      lighting,
      source: 'pollinations'
    });
  } catch (error) {
    console.error('Battle map generation error:', error);
    res.status(500).json({ error: 'Failed to generate battle map', details: String(error) });
  }
}

// Generate battle maps for all rooms in an act - uses Gemini with Pollinations fallback
export async function generateActBattleMaps(req: Request, res: Response) {
  try {
    const { rooms, dungeonTheme, useGemini = true } = req.body;

    if (!rooms || !Array.isArray(rooms)) {
      return res.status(400).json({ error: 'Rooms array is required' });
    }

    const battleMaps: Array<{ roomId: string; roomName: string; imageUrl: string; source: string }> = [];

    // Generate maps sequentially to avoid rate limits
    for (const room of rooms) {
      const environment = room.name || 'dungeon room';
      const features = room.contents?.obvious || room.features || [];
      const lighting = room.lighting || 'torchlit';
      const description = room.readAloud || room.description || '';

      let imageUrl: string;
      let source = 'pollinations';

      // Try Gemini first
      if (useGemini && process.env.GOOGLE_API_KEY) {
        const prompt = buildBattleMapPrompt(
          environment,
          dungeonTheme || 'dark dungeon',
          features,
          lighting,
          description
        );

        const geminiImage = await generateImageWithGemini(prompt);
        if (geminiImage) {
          imageUrl = geminiImage;
          source = 'gemini';
        } else {
          // Fallback to Pollinations
          imageUrl = generateBattleMapUrl(environment, dungeonTheme || 'dark dungeon', features, lighting, description);
        }
      } else {
        imageUrl = generateBattleMapUrl(environment, dungeonTheme || 'dark dungeon', features, lighting, description);
      }

      battleMaps.push({
        roomId: room.id,
        roomName: room.name,
        imageUrl,
        source
      });
    }

    res.json({ battleMaps });
  } catch (error) {
    console.error('Act battle maps generation error:', error);
    res.status(500).json({ error: 'Failed to generate battle maps', details: String(error) });
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
