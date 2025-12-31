import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Request, Response } from 'express';

// Initialize Google Generative AI client - uses GOOGLE_API_KEY env variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Find the position of a JSON parse error
function findJsonErrorPosition(jsonStr: string): number {
  try {
    JSON.parse(jsonStr);
    return -1; // No error
  } catch (e) {
    const match = String(e).match(/position\s+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return -1;
  }
}

// Attempt to repair common JSON issues from AI-generated output
function repairJson(jsonStr: string): string {
  let repaired = jsonStr.trim();

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Balance braces
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;

  if (openBraces > closeBraces) {
    repaired = repaired + '}'.repeat(openBraces - closeBraces);
  }

  // Balance brackets
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  if (openBrackets > closeBrackets) {
    const lastBrace = repaired.lastIndexOf('}');
    repaired = repaired.substring(0, lastBrace) + ']'.repeat(openBrackets - closeBrackets) + repaired.substring(lastBrace);
  }

  return repaired;
}

// Try to fix JSON by removing problematic character at error position
function tryFixAtPosition(jsonStr: string, errorPos: number): string | null {
  // Look at characters around the error position
  const start = Math.max(0, errorPos - 50);
  const end = Math.min(jsonStr.length, errorPos + 50);
  const context = jsonStr.substring(start, end);
  console.log(`Error context around position ${errorPos}: ...${context}...`);

  // Common fixes for "Unexpected token }"
  // Check if there's an extra } that shouldn't be there
  const charAtError = jsonStr[errorPos];

  if (charAtError === '}') {
    // Try removing this brace
    const fixed = jsonStr.substring(0, errorPos) + jsonStr.substring(errorPos + 1);
    try {
      JSON.parse(fixed);
      console.log('Fixed by removing extra } at position ' + errorPos);
      return fixed;
    } catch {
      // Didn't work, try other fixes
    }
  }

  // Try removing characters one at a time around the error
  for (let offset = -5; offset <= 5; offset++) {
    const pos = errorPos + offset;
    if (pos >= 0 && pos < jsonStr.length) {
      const char = jsonStr[pos];
      if (char === '}' || char === ']' || char === ',') {
        const fixed = jsonStr.substring(0, pos) + jsonStr.substring(pos + 1);
        try {
          JSON.parse(fixed);
          console.log(`Fixed by removing '${char}' at position ${pos}`);
          return fixed;
        } catch {
          // Continue trying
        }
      }
    }
  }

  return null;
}

// Iteratively fix JSON errors
function iterativeJsonRepair(jsonStr: string, maxAttempts: number = 10): string {
  let current = jsonStr;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const errorPos = findJsonErrorPosition(current);
    if (errorPos === -1) {
      return current; // Valid JSON
    }

    console.log(`Repair attempt ${attempt + 1}: error at position ${errorPos}`);

    const fixed = tryFixAtPosition(current, errorPos);
    if (fixed) {
      current = fixed;
    } else {
      // If we can't fix at this position, try basic repair
      current = repairJson(current);
      break;
    }
  }

  return current;
}

// Try to parse JSON with multiple repair attempts
function parseJsonWithRepair(jsonStr: string): any {
  // First, try parsing as-is
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('Initial parse failed, attempting repair...');
  }

  // Try iterative repair (fixing errors one at a time)
  const iterativeFixed = iterativeJsonRepair(jsonStr);
  try {
    return JSON.parse(iterativeFixed);
  } catch (e) {
    console.log('Iterative repair failed, trying structural repair...');
  }

  // Try basic repair
  const basicRepaired = repairJson(jsonStr);
  try {
    return JSON.parse(basicRepaired);
  } catch (e) {
    console.log('Basic repair failed, trying to extract valid JSON...');
  }

  // Last resort: try to find the largest valid JSON substring
  // by finding balanced braces from the start
  const firstBrace = jsonStr.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found');

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let lastValidEnd = firstBrace;

  for (let i = firstBrace; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          lastValidEnd = i;
          break;
        }
      }
    }
  }

  let finalJson = jsonStr.substring(firstBrace, lastValidEnd + 1);

  // If still not balanced, add closing braces
  if (depth > 0) {
    console.log(`Adding ${depth} closing braces to complete JSON`);
    finalJson = jsonStr.substring(firstBrace) + '}'.repeat(depth);
  }

  // Final attempt with repairs
  const finalRepaired = repairJson(finalJson);
  return JSON.parse(finalRepaired);
}

// Types for campaign generation
export interface CampaignRequest {
  adventureType?: string;
  theme: string;
  setting: string;
  partyLevel: number;
  partySize: number;
  sessionCount?: number;
  tone?: 'serious' | 'lighthearted' | 'horror' | 'epic';
  stakes?: 'personal' | 'regional' | 'world';
  moralComplexity?: 'clear' | 'gray' | 'dark';
  timePressure?: 'relaxed' | 'moderate' | 'urgent' | 'critical';
  primaryPillar?: 'combat' | 'exploration' | 'social' | 'balanced';
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
      // Use repair function to handle malformed JSON from AI
      const campaign: GeneratedCampaign = parseJsonWithRepair(jsonStr);

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
      console.error('JSON parse error after repair attempts:', parseError);
      console.error('First 500 chars of attempted parse:', jsonStr.substring(0, 500));
      console.error('Last 500 chars:', jsonStr.substring(jsonStr.length - 500));
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

// Get adventure type-specific instructions
function getAdventureTypeInstructions(adventureType: string): string {
  const instructions: Record<string, string> = {
    'dungeon_crawl': `DUNGEON CRAWL: Classic exploration of dangerous underground/interior locations.
- Act 2 focuses on room-by-room exploration with 3+ combat encounters
- Include traps, puzzles, secrets, and environmental hazards
- Build toward a boss chamber in Act 3`,

    'heist': `HEIST & INFILTRATION: Planning phase followed by execution.
- Act 1: The Setup - meet the client, learn the target, case the joint, gather intel on security
- Act 2: The Planning - identify entry points, security measures, patrol schedules, escape routes. Include skill challenges.
- Act 3: The Execution - the heist itself with complications. Things WILL go wrong.
- Focus on: stealth, deception, timing, and creative problem-solving
- Include security measures: guards, magical wards, locks, alarms, patrols`,

    'siege': `SIEGE WARFARE: Defend or attack a fortified location over multiple phases.
- Act 1: Preparation - fortify defenses OR scout enemy positions, gather allies, plan assault
- Act 2: The Siege - multiple waves/phases with escalating difficulty. Include siege weapons, wall breaches, morale checks
- Act 3: The Turning Point - a critical mission to break the siege or breach the inner sanctum
- Include: siege engines, fortifications, NPC commanders, troop morale, supply concerns`,

    'monster_hunt': `MONSTER HUNT: Track a dangerous creature before the final confrontation.
- Act 1: The Contract - learn about the monster's attacks, interview witnesses, gather clues about its nature
- Act 2: The Hunt - track the creature through signs, scenes of carnage, survivor accounts. Build tension.
- Act 3: The Confrontation - corner the beast in its lair with advantages earned through successful tracking
- Include: tracking skill challenges, environmental clues, red herrings, creature lore`,

    'naval': `NAVAL ADVENTURE: Ship-based exploration with sea combat and islands.
- Act 1: The Voyage Begins - acquire ship/crew, learn destination, prepare for sea
- Act 2: On the Open Sea - naval encounters, island exploration, weather challenges, sea monsters
- Act 3: The Final Port - climactic confrontation at destination island or enemy vessel
- Include: ship stats, crew NPCs, naval combat rules, island locations, sea hazards`,

    'caravan': `CARAVAN ESCORT: Protect travelers through dangerous territory.
- Act 1: The Caravan - meet the merchants, other guards, assess cargo, learn the route dangers
- Act 2: The Journey - multiple travel encounters, moral dilemmas with refugees, supply management
- Act 3: The Ambush - major attack on the caravan requiring tactical defense
- Include: caravan NPCs, cargo value, route hazards, bandit factions`,

    'political': `POLITICAL INTRIGUE: Court drama, factions, and power struggles.
- Act 1: The Court - introduce factions, their leaders, their goals. Player characters become involved.
- Act 2: The Schemes - uncover plots, make alliances, attend events, gather evidence, navigate betrayals
- Act 3: The Confrontation - expose the conspiracy or make a play for power
- Include: faction relationships, evidence gathering, social encounters, spies, secret meetings`,

    'mystery': `MYSTERY INVESTIGATION: Gather clues, interview suspects, solve the puzzle.
- Act 1: The Crime - discover the incident, meet key suspects, establish the stakes
- Act 2: The Investigation - interview witnesses, examine evidence, follow leads, encounter red herrings
- Act 3: The Reveal - confront the culprit with evidence, final confrontation
- Include: clue nodes, suspect motivations, DC checks for evidence, timeline of events`,

    'city_raid': `CITY RAID: Urban combat with multiple objectives.
- Act 1: The Mission - receive orders, plan approach, identify targets and civilian concerns
- Act 2: Street by Street - urban combat encounters, civilian interactions, multiple objectives
- Act 3: The Primary Target - assault the main objective (castle, guild hall, temple)
- Include: urban terrain, vertical combat, civilian presence, multiple entry points`,

    'rescue': `RESCUE MISSION: Save hostages under time pressure.
- Act 1: The Disappearance - learn who was taken, by whom, and why. Gather intelligence.
- Act 2: The Infiltration - locate the prison, observe guards, find the prisoners
- Act 3: The Extraction - free the hostages and escape with them
- Include: stealth options, hostage conditions, guard patterns, escape routes, time limit`,

    'tournament': `TOURNAMENT/COMPETITION: Series of challenges testing various abilities.
- Act 1: Registration - enter the tournament, meet rivals, learn the rules and stakes
- Act 2: The Trials - multiple competition rounds (combat, puzzles, skill challenges)
- Act 3: The Finals - face the champion with a twist (cheating, kidnapping, monster attack)
- Include: rival competitors, tournament brackets, varied challenges, betting odds`,

    'survival': `WILDERNESS SURVIVAL: Environment as the primary adversary.
- Act 1: Stranded - how they got here, assess resources, identify threats
- Act 2: Survival - resource management, shelter, food/water, environmental hazards, wildlife
- Act 3: Escape/Rescue - find civilization or achieve rescue
- Include: survival checks, resource tracking, weather hazards, dangerous terrain`,
  };

  return instructions[adventureType] || instructions['dungeon_crawl'];
}

// Get stakes description
function getStakesDescription(stakes: string): string {
  const descriptions: Record<string, string> = {
    'personal': 'PERSONAL STAKES: The threat affects characters directly - their loved ones, their home, their reputation, or their past.',
    'regional': 'REGIONAL STAKES: A town, region, or kingdom is threatened. Many innocent lives hang in the balance.',
    'world': 'WORLD-ENDING STAKES: Apocalyptic threat. Failure means catastrophe for the entire world.',
  };
  return descriptions[stakes] || descriptions['regional'];
}

// Get moral complexity description
function getMoralDescription(complexity: string): string {
  const descriptions: Record<string, string> = {
    'clear': 'CLEAR MORALITY: Traditional heroic adventure. The villains are clearly evil, the heroes clearly good.',
    'gray': 'GRAY MORALITY: Nuanced villains with understandable motivations. No perfect choices. Allies may have hidden agendas.',
    'dark': 'DARK MORALITY: No good options. Every choice has a cost. The villain may even have a point.',
  };
  return descriptions[complexity] || descriptions['gray'];
}

// Get time pressure description
function getTimePressureDescription(pressure: string): string {
  const descriptions: Record<string, string> = {
    'relaxed': 'RELAXED PACING: No urgent deadline. Players can explore, rest, and investigate at their leisure.',
    'moderate': 'MODERATE PRESSURE: A deadline exists but there is flexibility. Encourage efficiency without panic.',
    'urgent': 'URGENT PRESSURE: Clear countdown. Include time-sensitive objectives and consequences for delay.',
    'critical': 'CRITICAL PRESSURE: Every moment counts. Include a visible countdown mechanic. Failure is imminent.',
  };
  return descriptions[pressure] || descriptions['moderate'];
}

// Get pillar focus description
function getPillarDescription(pillar: string): string {
  const descriptions: Record<string, string> = {
    'combat': 'COMBAT FOCUS: Tactical encounters are the centerpiece. Include varied terrain, enemy tactics, and multiple combat scenarios.',
    'exploration': 'EXPLORATION FOCUS: Discovery and environment are key. Include secrets, puzzles, hidden areas, and environmental storytelling.',
    'social': 'SOCIAL/RP FOCUS: NPCs and dialogue drive the story. Include complex characters, negotiations, and social challenges.',
    'balanced': 'BALANCED: Equal emphasis on combat, exploration, and social interaction. Vary the challenges.',
  };
  return descriptions[pillar] || descriptions['balanced'];
}

function buildCampaignPrompt(request: CampaignRequest): string {
  const sessionHours = (request.sessionCount || 1) * 2.5; // Each session ~2.5 hours
  const adventureType = request.adventureType || 'dungeon_crawl';

  const adventureInstructions = getAdventureTypeInstructions(adventureType);
  const stakesDesc = getStakesDescription(request.stakes || 'regional');
  const moralDesc = getMoralDescription(request.moralComplexity || 'gray');
  const timeDesc = getTimePressureDescription(request.timePressure || 'moderate');
  const pillarDesc = getPillarDescription(request.primaryPillar || 'balanced');

  return `You are a master D&D 5e Dungeon Master creating a COMPLETE, READY-TO-RUN adventure module.

ADVENTURE PARAMETERS:
- Adventure Type: ${adventureType.replace('_', ' ').toUpperCase()}
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Target Duration: ${sessionHours} hours (${request.sessionCount || 1} session${(request.sessionCount || 1) > 1 ? 's' : ''} of 2-3 hours each)
- Tone: ${request.tone || 'serious'}

STORY METRICS:
${stakesDesc}
${moralDesc}
${timeDesc}
${pillarDesc}

ADVENTURE TYPE INSTRUCTIONS:
${adventureInstructions}

Create an immersive adventure following these guidelines. Return ONLY valid JSON:

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
        "name": "Innkeeper Name",
        "role": "Innkeeper",
        "location": "The local tavern/inn",
        "appearance": "Physical description with age, build, distinctive features",
        "personality": "Friendly but business-minded, knows everyone's secrets",
        "attitude": "friendly/neutral/suspicious toward strangers",
        "dialogue": {
          "greeting": "Welcome to [Inn Name]! What can I get you?",
          "gossip": "Local rumors they share freely",
          "ifBribed": "Juicier information for DC 12 Persuasion or 5gp"
        },
        "keyInformation": ["Rumor about the quest", "Warning about dangers"],
        "services": [{"item": "Room", "cost": "5sp/night"}, {"item": "Meal", "cost": "2sp"}, {"item": "Ale", "cost": "4cp"}]
      },
      {
        "name": "Blacksmith Name",
        "role": "Blacksmith/Armorer",
        "location": "The forge/smithy",
        "appearance": "Strong build, burn scars, leather apron",
        "personality": "Gruff but fair, respects warriors",
        "attitude": "neutral - warms up if party shows respect for craft",
        "dialogue": {
          "greeting": "Looking to buy or sell?",
          "gossip": "Talk of recent attacks, monster sightings",
          "ifBribed": "Knows weak points of local creatures (grants advantage info)"
        },
        "keyInformation": ["Practical advice about local threats", "Knows the terrain"],
        "services": [{"item": "Weapon repair", "cost": "varies"}, {"item": "Silvered weapon", "cost": "+100gp"}, {"item": "Custom armor fitting", "cost": "50gp"}]
      },
      {
        "name": "Merchant Name",
        "role": "Traveling Merchant/Shopkeeper",
        "location": "Market square or general store",
        "appearance": "Well-dressed, calculating eyes, jingling coin purse",
        "personality": "Shrewd negotiator, always looking for opportunity",
        "attitude": "friendly to customers, will haggle",
        "dialogue": {
          "greeting": "Ah, adventurers! You look like you could use supplies.",
          "gossip": "Trade route news, economic gossip",
          "ifBribed": "Knows black market contacts or rare item locations"
        },
        "keyInformation": ["Sells useful adventuring gear", "May buy unusual loot"],
        "services": [{"item": "Adventuring gear", "cost": "PHB prices"}, {"item": "Potions", "cost": "50gp each"}, {"item": "Maps", "cost": "25gp"}]
      },
      {
        "name": "Priest/Healer Name",
        "role": "Temple Priest/Healer",
        "location": "Local temple or shrine",
        "appearance": "Robed, holy symbol, serene or troubled expression",
        "personality": "Compassionate but concerned about recent events",
        "attitude": "welcoming to those of good intent",
        "dialogue": {
          "greeting": "Blessings upon you, travelers. How may the [deity] help you?",
          "gossip": "Spiritual concerns, omens, dreams",
          "ifBribed": "Donations unlock blessings or prophecies"
        },
        "keyInformation": ["Knows about undead/fiends/celestials involved", "Can identify curses"],
        "services": [{"item": "Cure Wounds", "cost": "10gp donation"}, {"item": "Lesser Restoration", "cost": "40gp donation"}, {"item": "Bless (1 hour)", "cost": "25gp donation"}]
      },
      {
        "name": "Old Timer Name",
        "role": "Elder/Retired Adventurer/Local Historian",
        "location": "Tavern corner or town square bench",
        "appearance": "Weathered, old scars or missing fingers, distant look in eyes",
        "personality": "Nostalgic, loves to tell stories, surprisingly sharp",
        "attitude": "friendly to those who listen",
        "dialogue": {
          "greeting": "Sit down, sit down. You remind me of myself, years ago...",
          "gossip": "Ancient history of the area, old legends",
          "ifBribed": "Buy them a drink and they'll share detailed knowledge (no gold needed, just time)"
        },
        "keyInformation": ["Knows the dungeon's history", "Remembers previous adventurers who tried", "Secret entrance or weakness"],
        "services": []
      },
      {
        "name": "Mysterious Stranger Name",
        "role": "Enigmatic Figure/Potential Ally or Rival",
        "location": "Shadows of the tavern or chance encounter",
        "appearance": "Hooded, distinctive feature half-hidden, watching the party",
        "personality": "Cryptic, testing, may have hidden agenda",
        "attitude": "unknown - studying the party",
        "dialogue": {
          "greeting": "You seek [quest objective]. Interesting.",
          "gossip": "Cryptic hints about what lies ahead",
          "ifBribed": "Cannot be bribed - has own mysterious motives"
        },
        "keyInformation": ["Knows something crucial but shares it cryptically", "May appear again later"],
        "services": []
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
3. **CREATE AT LEAST 6 DISTINCT NPCs** in Act 1 - each with unique name, personality, dialogue, and purpose (innkeeper, blacksmith, merchant, priest, elder/historian, mysterious figure, etc.)
4. NPCs need distinct personalities with actual dialogue lines and useful information/services
5. **ACT 2 MUST HAVE EXACTLY 3 COMBAT ENCOUNTERS** - an easy entry fight, medium mid-dungeon fight, and hard pre-boss fight
6. Combat encounters need tactical depth - terrain, enemy tactics, dynamic elements
7. Puzzles need multiple hint paths and clear solutions
8. Use D&D 5e SRD monsters with appropriate CR for level ${request.partyLevel}
9. Balance total XP for a party of ${request.partySize} level ${request.partyLevel} characters
10. Include specific gold values and item names for all treasure
11. Boss needs phases, dialogue, and a weakness clever players can exploit
12. Ensure the adventure can be completed in approximately ${sessionHours} hours`;
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
