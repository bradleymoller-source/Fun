import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Request, Response } from 'express';
import { generateEncounterGuidelines, getRecommendedBossCR, getMonsterStats, CR_TO_XP } from './encounterScaling';

// Initialize Google Generative AI client - uses GOOGLE_API_KEY env variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// ============================================================================
// FUNCTION CALLING CAMPAIGN GENERATOR
// Instead of asking AI for one giant JSON blob, we have it call functions
// to build the campaign piece by piece - much more reliable!
// ============================================================================

// Campaign builder state - accumulates function calls
interface CampaignBuilder {
  title?: string;
  synopsis?: string;
  hook?: string;
  arc?: { beginning: string; middle: string; climax: string; resolution: string };
  overview?: {
    readAloud?: string;
    backstory?: string;
    themes?: string[];
    throughlines?: Array<{
      name: string;
      type: string;
      description: string;
      act1Hint: string;
      act2Discovery: string;
      act3Payoff: string;
    }>;
  };
  act1?: {
    title?: string;
    estimatedDuration?: string;
    overview?: string;
    settingTheScene?: { readAloud?: string; dmNotes?: string };
    questGiver?: any;
    keyNpcs?: any[];
    locations?: any[];
    services?: { inn?: any; shops?: any[]; temple?: any };
    potentialConflicts?: any[];
    travelToDestination?: { readAloud?: string; duration?: string };
    transitionToAct2?: string;
  };
  act2?: {
    title?: string;
    estimatedDuration?: string;
    overview?: string;
    dungeonOverview?: any;
    rooms?: any[];
    encounters?: any[];
    traps?: any[];
    puzzles?: any[];
    transitionToAct3?: string;
  };
  act3?: {
    title?: string;
    estimatedDuration?: string;
    overview?: string;
    bossEncounter?: any;
    aftermath?: any;
  };
  epilogue?: {
    immediateAftermath?: string;
    rewards?: any;
    futureHooks?: string[];
    characterMoments?: string[];
  };
}

// Function declarations for Gemini function calling
const campaignFunctionDeclarations = [
  {
    name: "setCampaignOverview",
    description: "Set the campaign title, synopsis, hook, and story arc. Call this first.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Evocative adventure title" },
        synopsis: { type: SchemaType.STRING, description: "3-4 sentence dramatic overview" },
        hook: { type: SchemaType.STRING, description: "The inciting incident with specific details" },
        arc: {
          type: SchemaType.OBJECT,
          properties: {
            beginning: { type: SchemaType.STRING, description: "Act 1 summary" },
            middle: { type: SchemaType.STRING, description: "Act 2 summary" },
            climax: { type: SchemaType.STRING, description: "Act 3 summary" },
            resolution: { type: SchemaType.STRING, description: "Epilogue summary" }
          },
          required: ["beginning", "middle", "climax", "resolution"]
        },
        readAloud: { type: SchemaType.STRING, description: "Opening narration (2 paragraphs)" },
        backstory: { type: SchemaType.STRING, description: "True history and villain motivation" },
        themes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "2-3 thematic elements" }
      },
      required: ["title", "synopsis", "hook", "arc", "readAloud", "backstory", "themes"]
    }
  },
  {
    name: "addThroughline",
    description: "Add a narrative throughline that connects all three acts. Add 2-3 throughlines.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Name of the throughline" },
        type: { type: SchemaType.STRING, description: "Type: secret, treasure, weakness, ally, or mystery" },
        description: { type: SchemaType.STRING, description: "What this throughline represents" },
        act1Hint: { type: SchemaType.STRING, description: "Clue or foreshadowing in Act 1" },
        act2Discovery: { type: SchemaType.STRING, description: "Evidence or partial reveal in Act 2" },
        act3Payoff: { type: SchemaType.STRING, description: "Full revelation in Act 3" }
      },
      required: ["name", "type", "description", "act1Hint", "act2Discovery", "act3Payoff"]
    }
  },
  {
    name: "setAct1Setup",
    description: "Set Act 1 title and setting the scene. Call after setCampaignOverview.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Act 1 title" },
        estimatedDuration: { type: SchemaType.STRING, description: "e.g. 45-60 minutes" },
        overview: { type: SchemaType.STRING, description: "What happens in Act 1" },
        settingReadAloud: { type: SchemaType.STRING, description: "Arrival description (2 paragraphs with sensory details)" },
        settingDmNotes: { type: SchemaType.STRING, description: "What's really happening behind the scenes" },
        transitionToAct2: { type: SchemaType.STRING, description: "Read-aloud text as party arrives at dungeon" }
      },
      required: ["title", "estimatedDuration", "overview", "settingReadAloud", "settingDmNotes", "transitionToAct2"]
    }
  },
  {
    name: "setQuestGiver",
    description: "Set the main quest giver NPC with full dialogue.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Quest giver's name" },
        role: { type: SchemaType.STRING, description: "Position (Elder, Mayor, etc.)" },
        appearance: { type: SchemaType.STRING, description: "Physical description" },
        personality: { type: SchemaType.STRING, description: "How they speak and act" },
        dialogueGreeting: { type: SchemaType.STRING, description: "Initial dialogue when meeting" },
        dialogueQuestPitch: { type: SchemaType.STRING, description: "How they explain the problem" },
        dialogueIfQuestioned: { type: SchemaType.STRING, description: "Responses to player questions" },
        dialogueIfRefused: { type: SchemaType.STRING, description: "Response if players initially refuse" },
        rewardOffered: { type: SchemaType.STRING, description: "Initial reward offered" },
        rewardNegotiated: { type: SchemaType.STRING, description: "Better reward if negotiated" },
        keyInformation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 key facts they share" },
        secret: { type: SchemaType.STRING, description: "Something they're hiding (optional)" }
      },
      required: ["name", "role", "appearance", "personality", "dialogueGreeting", "dialogueQuestPitch", "dialogueIfQuestioned", "rewardOffered", "keyInformation"]
    }
  },
  {
    name: "addNPC",
    description: "Add a key NPC to Act 1. Add 4-6 NPCs with full dialogue and skill checks.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "NPC's name" },
        role: { type: SchemaType.STRING, description: "Role (Innkeeper, Blacksmith, Merchant, Priest, Elder, Mysterious Stranger)" },
        location: { type: SchemaType.STRING, description: "Where they are found" },
        appearance: { type: SchemaType.STRING, description: "Physical description (2-3 sentences with distinctive features)" },
        personality: { type: SchemaType.STRING, description: "Character traits, mannerisms, speech patterns" },
        connectionToPlot: { type: SchemaType.STRING, description: "How this NPC connects to the main story or villain" },
        dialogueGreeting: { type: SchemaType.STRING, description: "How they greet the party (actual dialogue in quotes)" },
        dialogueGossip: { type: SchemaType.STRING, description: "Rumors and local information they freely share (actual dialogue)" },
        dialogueIfPressured: { type: SchemaType.STRING, description: "Response to intimidation - include what they reveal" },
        dialogueIfBribed: { type: SchemaType.STRING, description: "What they reveal for gold or favors" },
        skillChecks: {
          type: SchemaType.OBJECT,
          properties: {
            persuasion: { type: SchemaType.OBJECT, properties: {
              dc: { type: SchemaType.NUMBER, description: "DC for persuasion check" },
              reveals: { type: SchemaType.STRING, description: "What successful persuasion reveals about the story" }
            }},
            intimidation: { type: SchemaType.OBJECT, properties: {
              dc: { type: SchemaType.NUMBER, description: "DC for intimidation check" },
              reveals: { type: SchemaType.STRING, description: "What successful intimidation reveals" }
            }},
            insight: { type: SchemaType.OBJECT, properties: {
              dc: { type: SchemaType.NUMBER, description: "DC to sense if they're hiding something" },
              reveals: { type: SchemaType.STRING, description: "What insight reveals about their true feelings/secrets" }
            }},
            bribe: { type: SchemaType.OBJECT, properties: {
              cost: { type: SchemaType.STRING, description: "Amount of gold needed" },
              reveals: { type: SchemaType.STRING, description: "What information the bribe unlocks" }
            }}
          },
          description: "Skill checks for extracting information - make these story-relevant"
        },
        keyInformation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "2-3 useful facts they know that connect to the dungeon or villain" },
        secret: { type: SchemaType.STRING, description: "Something they know but won't reveal easily - ties to throughlines" },
        services: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING },
              cost: { type: SchemaType.STRING },
              effect: { type: SchemaType.STRING }
            }
          },
          description: "Services or items they offer with prices"
        }
      },
      required: ["name", "role", "location", "appearance", "personality", "connectionToPlot", "dialogueGreeting", "dialogueGossip", "keyInformation", "skillChecks"]
    }
  },
  {
    name: "addShop",
    description: "Add a shop to Act 1 with inventory. Add 1-2 shops.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Shop name" },
        keeper: { type: SchemaType.STRING, description: "Shopkeeper name" },
        shopType: { type: SchemaType.STRING, description: "general, blacksmith, apothecary, or magic" },
        inventory: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING, description: "Item name" },
              cost: { type: SchemaType.STRING, description: "Price (e.g. 50gp)" },
              type: { type: SchemaType.STRING, description: "weapon, armor, potion, scroll, gear" },
              effect: { type: SchemaType.STRING, description: "Mechanical effect" },
              rarity: { type: SchemaType.STRING, description: "common, uncommon, rare" }
            },
            required: ["item", "cost", "type", "effect"]
          },
          description: "3-6 items for sale"
        }
      },
      required: ["name", "keeper", "shopType", "inventory"]
    }
  },
  {
    name: "setInn",
    description: "Set the inn/tavern details for Act 1.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Inn name" },
        roomCost: { type: SchemaType.STRING, description: "Cost per night" },
        mealCost: { type: SchemaType.STRING, description: "Cost per meal" },
        rumors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "2-3 rumors heard at the inn" }
      },
      required: ["name", "roomCost", "mealCost", "rumors"]
    }
  },
  {
    name: "setTravelToDestination",
    description: "Set the travel sequence from town to dungeon.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        readAloud: { type: SchemaType.STRING, description: "Travel narration (1-2 paragraphs)" },
        duration: { type: SchemaType.STRING, description: "Travel time (e.g. 2 hours)" },
        encounters: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Potential travel encounters" }
      },
      required: ["readAloud", "duration"]
    }
  },
  {
    name: "setAct2Setup",
    description: "Set Act 2 title and dungeon overview.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Act 2 title" },
        estimatedDuration: { type: SchemaType.STRING, description: "e.g. 60-90 minutes" },
        overview: { type: SchemaType.STRING, description: "What happens in Act 2" },
        dungeonName: { type: SchemaType.STRING, description: "Dungeon name" },
        dungeonHistory: { type: SchemaType.STRING, description: "Brief history" },
        dungeonReadAloud: { type: SchemaType.STRING, description: "Entrance description" },
        dungeonAtmosphere: { type: SchemaType.STRING, description: "Overall mood" },
        lightingConditions: { type: SchemaType.STRING, description: "Bright, dim, or dark" },
        environmentalHazards: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Environmental dangers" },
        transitionToAct3: { type: SchemaType.STRING, description: "Read-aloud text approaching boss chamber" }
      },
      required: ["title", "estimatedDuration", "overview", "dungeonName", "dungeonHistory", "dungeonReadAloud", "dungeonAtmosphere", "transitionToAct3"]
    }
  },
  {
    name: "addRoom",
    description: "Add a dungeon room to Act 2 (NOT the boss room). Match room types from the dungeon structure above.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: "Room number (1, 2, 3, etc.) - match the room numbers from DUNGEON STRUCTURE" },
        name: { type: SchemaType.STRING, description: "Evocative room name matching the dungeon structure" },
        roomType: { type: SchemaType.STRING, description: "Type from structure: entrance, corridor, treasure, trap, secret, ritual, or standard" },
        readAloud: { type: SchemaType.STRING, description: "2-3 paragraph atmospheric description for players with sensory details (sight, sound, smell). Reference the dungeon's history and theme." },
        dimensions: { type: SchemaType.STRING, description: "Size (e.g. 30x40 feet)" },
        lighting: { type: SchemaType.STRING, description: "Light conditions (bright, dim, darkness) and light sources" },
        atmosphere: { type: SchemaType.STRING, description: "Mood, temperature, sounds, smells" },
        contentsObvious: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 visible things: furniture, bodies, equipment, decorations. Be specific." },
        contentsHidden: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "2-3 hidden things with DC to find. Include story clues that reference throughlines." },
        interactables: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Things players can interact with: levers, books, altars, etc." },
        storyConnection: { type: SchemaType.STRING, description: "How this room connects to the throughlines or reveals villain's plan" },
        exits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "All exits with descriptions: 'North: Heavy iron door (locked, DC 15) leads to Room 3'" },
        trap: {
          type: SchemaType.OBJECT,
          properties: {
            hasTrap: { type: SchemaType.BOOLEAN, description: "Does this room have a hidden trap?" },
            name: { type: SchemaType.STRING, description: "Trap name" },
            trigger: { type: SchemaType.STRING, description: "What triggers it (pressure plate, tripwire, opening chest, etc.)" },
            effect: { type: SchemaType.STRING, description: "What happens when triggered" },
            damage: { type: SchemaType.STRING, description: "Damage dealt (e.g. 2d6 piercing)" },
            saveDC: { type: SchemaType.NUMBER, description: "DC to avoid (usually DEX save)" },
            saveType: { type: SchemaType.STRING, description: "Save type: DEX, CON, WIS, etc." },
            detectDC: { type: SchemaType.NUMBER, description: "Perception/Investigation DC to notice" },
            disarmDC: { type: SchemaType.NUMBER, description: "Thieves' tools DC to disarm" },
            hint: { type: SchemaType.STRING, description: "Clue observant players might notice" }
          },
          description: "Hidden trap in this room. Include in 30-40% of rooms!"
        },
        treasure: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING, description: "Item name" },
              value: { type: SchemaType.STRING, description: "Gold value" },
              type: { type: SchemaType.STRING, description: "weapon, armor, potion, scroll, treasure, clue" },
              effect: { type: SchemaType.STRING, description: "Mechanical effect if any" },
              hidden: { type: SchemaType.BOOLEAN, description: "Is it hidden?" },
              findDC: { type: SchemaType.NUMBER, description: "DC to find if hidden" }
            }
          },
          description: "Treasure and loot. Include story-relevant items that connect to NPCs or throughlines."
        }
      },
      required: ["id", "name", "roomType", "readAloud", "dimensions", "lighting", "contentsObvious", "exits", "treasure"]
    }
  },
  {
    name: "addEncounter",
    description: "Add a combat encounter to Act 2. Add exactly 3 encounters with COMPLETE monster stats.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Encounter name" },
        location: { type: SchemaType.STRING, description: "Room number where it occurs" },
        readAloud: { type: SchemaType.STRING, description: "Scene description for players" },
        enemies: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Monster name (SRD)" },
              count: { type: SchemaType.NUMBER, description: "How many" },
              cr: { type: SchemaType.STRING, description: "Challenge rating" },
              hp: { type: SchemaType.NUMBER, description: "Hit points each" },
              ac: { type: SchemaType.NUMBER, description: "Armor class" },
              acType: { type: SchemaType.STRING, description: "Armor type (natural armor, leather, etc.)" },
              initiative: { type: SchemaType.NUMBER, description: "Initiative bonus (DEX modifier)" },
              speed: { type: SchemaType.STRING, description: "Speed (e.g. '30 ft., fly 60 ft.')" },
              attacks: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING, description: "Attack name (e.g. 'Longsword', 'Bite')" },
                    bonus: { type: SchemaType.NUMBER, description: "Attack bonus (e.g. 5 for +5)" },
                    damage: { type: SchemaType.STRING, description: "Damage dice (e.g. '1d8+3')" },
                    damageType: { type: SchemaType.STRING, description: "Damage type (slashing, piercing, fire, etc.)" },
                    notes: { type: SchemaType.STRING, description: "Special effects (e.g. 'reach 10 ft.')" }
                  },
                  required: ["name", "bonus", "damage", "damageType"]
                },
                description: "All attacks this creature can make"
              },
              spells: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING, description: "Spell name" },
                    level: { type: SchemaType.NUMBER, description: "Spell level (0 for cantrip)" },
                    damage: { type: SchemaType.STRING, description: "Damage if applicable" },
                    effect: { type: SchemaType.STRING, description: "Effect description" },
                    save: { type: SchemaType.STRING, description: "Save type and DC (e.g. 'DC 14 WIS')" }
                  },
                  required: ["name", "level"]
                },
                description: "Spells and cantrips (if spellcaster)"
              },
              traits: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING, description: "Trait name" },
                    description: { type: SchemaType.STRING, description: "What it does" }
                  },
                  required: ["name", "description"]
                },
                description: "Special traits (Pack Tactics, Keen Senses, etc.)"
              },
              resistances: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Damage resistances (e.g. ['fire', 'cold'])"
              },
              immunities: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Damage immunities (e.g. ['poison', 'psychic'])"
              }
            },
            required: ["name", "count", "cr", "hp", "ac", "initiative", "speed", "attacks"]
          },
          description: "Enemies with COMPLETE combat stats"
        },
        tactics: { type: SchemaType.STRING, description: "How enemies fight - be specific about focus targets and ability usage" },
        terrain: { type: SchemaType.STRING, description: "Combat-relevant terrain" },
        dynamicElements: { type: SchemaType.STRING, description: "What changes mid-fight" },
        difficulty: { type: SchemaType.STRING, description: "easy, medium, hard, or deadly" },
        rewardXP: { type: SchemaType.NUMBER, description: "XP reward" },
        rewardLoot: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING, description: "Item name" },
              value: { type: SchemaType.STRING, description: "Gold value (e.g. '25gp')" },
              type: { type: SchemaType.STRING, description: "Item type: weapon, armor, potion, scroll, wondrous, treasure" },
              effect: { type: SchemaType.STRING, description: "Mechanical effect if magical" }
            },
            required: ["item", "value", "type"]
          },
          description: "2-4 loot items. Include gold, potions, scrolls, weapons, or story items. Every encounter should have loot!"
        }
      },
      required: ["name", "location", "readAloud", "enemies", "tactics", "difficulty", "rewardXP", "rewardLoot"]
    }
  },
  {
    name: "addTrap",
    description: "Add a trap to Act 2. Add 1-2 traps.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Trap name" },
        location: { type: SchemaType.STRING, description: "Room number" },
        trigger: { type: SchemaType.STRING, description: "What triggers it" },
        effect: { type: SchemaType.STRING, description: "What it does" },
        damage: { type: SchemaType.STRING, description: "Damage dealt" },
        saveType: { type: SchemaType.STRING, description: "Save type (DEX, CON, etc.)" },
        saveDC: { type: SchemaType.NUMBER, description: "DC to avoid" },
        detectDC: { type: SchemaType.NUMBER, description: "DC to spot" },
        disarmDC: { type: SchemaType.NUMBER, description: "DC to disarm" },
        countermeasures: { type: SchemaType.STRING, description: "Ways to avoid or disable" }
      },
      required: ["name", "location", "trigger", "effect", "damage", "saveDC", "detectDC", "disarmDC"]
    }
  },
  {
    name: "setBossEncounter",
    description: "Set the boss encounter for Act 3. This must reference throughlines, NPCs, and earlier discoveries.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Act 3 title (evocative, references the villain)" },
        estimatedDuration: { type: SchemaType.STRING, description: "e.g. 45-60 minutes" },
        overview: { type: SchemaType.STRING, description: "Full summary of Act 3: approach, confrontation, resolution" },
        chamberReadAloud: { type: SchemaType.STRING, description: "2-3 paragraph boss chamber description with atmosphere, visible threats, and the villain's presence" },
        chamberFeatures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "3-5 tactical features: pillars, pits, altars, etc." },
        chamberDimensions: { type: SchemaType.STRING, description: "Size of the boss arena" },
        villainName: { type: SchemaType.STRING, description: "Boss name (should match earlier references)" },
        villainAppearance: { type: SchemaType.STRING, description: "Detailed physical description" },
        villainType: { type: SchemaType.STRING, description: "Monster type from SRD" },
        villainCR: { type: SchemaType.STRING, description: "Challenge rating balanced for party" },
        villainHP: { type: SchemaType.NUMBER, description: "Hit points" },
        villainAC: { type: SchemaType.NUMBER, description: "Armor class" },
        villainACType: { type: SchemaType.STRING, description: "Armor type (natural armor, mage armor, etc.)" },
        villainInitiative: { type: SchemaType.NUMBER, description: "Initiative bonus (DEX modifier)" },
        villainSpeed: { type: SchemaType.STRING, description: "Movement speed (e.g. '30 ft., fly 60 ft.')" },
        villainMotivation: { type: SchemaType.STRING, description: "Deep motivation - what drove them to villainy? Connect to backstory." },
        villainPersonality: { type: SchemaType.STRING, description: "How they act, speak, their demeanor" },
        villainDialogueOpening: { type: SchemaType.STRING, description: "What they say when party enters (actual dialogue, reference what they know about the party)" },
        villainDialogueMidFight: { type: SchemaType.STRING, description: "Taunts and threats during combat" },
        villainDialogueDefeat: { type: SchemaType.STRING, description: "Final words or revelation when defeated" },
        villainTactics: { type: SchemaType.STRING, description: "Detailed combat tactics: opening moves, preferred targets, use of terrain" },
        villainAttacks: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Attack name (e.g. 'Shadow Blade', 'Corrupting Touch')" },
              bonus: { type: SchemaType.NUMBER, description: "Attack bonus (e.g. 7 for +7)" },
              damage: { type: SchemaType.STRING, description: "Damage dice (e.g. '2d8+4')" },
              damageType: { type: SchemaType.STRING, description: "Damage type (slashing, necrotic, fire, etc.)" },
              range: { type: SchemaType.STRING, description: "Range (e.g. '5 ft.', '60 ft.', '30/120 ft.')" },
              notes: { type: SchemaType.STRING, description: "Special effects (e.g. 'target must make DC 14 CON save or be poisoned')" }
            },
            required: ["name", "bonus", "damage", "damageType"]
          },
          description: "2-4 attacks the villain can make with FULL combat stats"
        },
        villainSpells: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Spell name" },
              level: { type: SchemaType.NUMBER, description: "Spell level (0 for cantrip)" },
              damage: { type: SchemaType.STRING, description: "Damage if applicable (e.g. '3d10 fire')" },
              effect: { type: SchemaType.STRING, description: "Effect description" },
              save: { type: SchemaType.STRING, description: "Save type and DC (e.g. 'DC 15 WIS')" },
              range: { type: SchemaType.STRING, description: "Range (e.g. '120 ft.')" }
            },
            required: ["name", "level"]
          },
          description: "Spells and cantrips if villain is a spellcaster"
        },
        villainTraits: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Trait name" },
              description: { type: SchemaType.STRING, description: "What it does" }
            },
            required: ["name", "description"]
          },
          description: "Special traits (Magic Resistance, Regeneration, etc.)"
        },
        villainResistances: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Damage resistances (e.g. ['fire', 'cold'])" },
        villainImmunities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Damage immunities (e.g. ['poison', 'necrotic'])" },
        villainWeakness: { type: SchemaType.STRING, description: "Exploitable weakness that was foreshadowed in Act 1 or 2" },
        legendaryActions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Action name" },
              cost: { type: SchemaType.NUMBER, description: "How many legendary actions it costs (1-3)" },
              effect: { type: SchemaType.STRING, description: "What it does" }
            },
            required: ["name", "cost", "effect"]
          },
          description: "2-3 legendary actions with costs and effects"
        },
        phaseChanges: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "What changes at 75%, 50%, 25% HP - new abilities, terrain changes, minion spawns" },
        minions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Minion name" },
              count: { type: SchemaType.NUMBER, description: "How many" },
              cr: { type: SchemaType.STRING, description: "Challenge rating" },
              hp: { type: SchemaType.NUMBER, description: "Hit points each" },
              ac: { type: SchemaType.NUMBER, description: "Armor class" },
              initiative: { type: SchemaType.NUMBER, description: "Initiative bonus" },
              speed: { type: SchemaType.STRING, description: "Movement speed" },
              attacks: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    bonus: { type: SchemaType.NUMBER },
                    damage: { type: SchemaType.STRING },
                    damageType: { type: SchemaType.STRING }
                  }
                },
                description: "Minion attacks"
              },
              role: { type: SchemaType.STRING, description: "Tactical role: protect boss, harass casters, flank" }
            },
            required: ["name", "count", "hp", "ac", "initiative", "speed", "attacks", "role"]
          },
          description: "Minions with FULL combat stats"
        },
        summons: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Summoned creature name" },
              summonTrigger: { type: SchemaType.STRING, description: "When summoned (e.g. 'At 50% HP', 'Round 3')" },
              count: { type: SchemaType.NUMBER, description: "How many" },
              cr: { type: SchemaType.STRING, description: "Challenge rating" },
              hp: { type: SchemaType.NUMBER, description: "Hit points each" },
              ac: { type: SchemaType.NUMBER, description: "Armor class" },
              initiative: { type: SchemaType.NUMBER, description: "Initiative bonus" },
              speed: { type: SchemaType.STRING, description: "Movement speed" },
              attacks: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    bonus: { type: SchemaType.NUMBER },
                    damage: { type: SchemaType.STRING },
                    damageType: { type: SchemaType.STRING }
                  }
                },
                description: "Summon attacks"
              },
              traits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Special traits" }
            },
            required: ["name", "summonTrigger", "count", "hp", "ac", "initiative", "speed", "attacks"]
          },
          description: "Creatures summoned during the fight with FULL combat stats"
        },
        throughlinePayoffs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "How each throughline from Act 1 pays off in this fight" },
        rewardXP: { type: SchemaType.NUMBER, description: "Total XP for defeating boss and minions" },
        rewardGold: { type: SchemaType.STRING, description: "Gold and valuables in the chamber" },
        rewardItems: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Item name" },
              type: { type: SchemaType.STRING, description: "weapon, armor, wondrous, etc." },
              effect: { type: SchemaType.STRING, description: "Full mechanical description" },
              value: { type: SchemaType.STRING, description: "Gold value" },
              rarity: { type: SchemaType.STRING, description: "common, uncommon, rare, very rare" },
              attunement: { type: SchemaType.BOOLEAN, description: "Requires attunement?" },
              lore: { type: SchemaType.STRING, description: "History or significance of the item" }
            }
          },
          description: "2-3 magic items or special loot with full descriptions"
        },
        villainLoot: { type: SchemaType.STRING, description: "Everything on the villain's body: equipment, notes, keys, etc." }
      },
      required: ["title", "overview", "chamberReadAloud", "chamberFeatures", "chamberDimensions", "villainName", "villainAppearance", "villainType", "villainCR", "villainHP", "villainAC", "villainACType", "villainInitiative", "villainSpeed", "villainMotivation", "villainPersonality", "villainDialogueOpening", "villainDialogueMidFight", "villainDialogueDefeat", "villainTactics", "villainAttacks", "villainWeakness", "legendaryActions", "phaseChanges", "throughlinePayoffs", "rewardXP", "rewardGold", "rewardItems", "villainLoot"]
    }
  },
  {
    name: "setAftermath",
    description: "Set the aftermath and epilogue.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        aftermathReadAloud: { type: SchemaType.STRING, description: "Immediate aftermath description" },
        discoveries: { type: SchemaType.STRING, description: "What players discover" },
        immediateEffects: { type: SchemaType.STRING, description: "Immediate effects of victory" },
        epilogueNarration: { type: SchemaType.STRING, description: "Return to town narration" },
        townReaction: { type: SchemaType.STRING, description: "How the town reacts" },
        questGiverReward: { type: SchemaType.STRING, description: "Quest giver's reward scene" },
        futureHooks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "2-3 hooks for future adventures" },
        characterMoments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Prompts for character moments" }
      },
      required: ["aftermathReadAloud", "epilogueNarration", "townReaction", "questGiverReward", "futureHooks"]
    }
  },
  {
    name: "campaignComplete",
    description: "Signal that the campaign generation is complete. Call this last.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "Brief summary of the generated campaign" }
      },
      required: ["summary"]
    }
  }
];

// Process a function call and update the campaign builder
function processFunctionCall(builder: CampaignBuilder, functionName: string, args: any): void {
  console.log(`  -> ${functionName}(${args.name || args.title || args.id || ''})`);

  switch (functionName) {
    case 'setCampaignOverview':
      builder.title = args.title;
      builder.synopsis = args.synopsis;
      builder.hook = args.hook;
      builder.arc = args.arc;
      builder.overview = {
        readAloud: args.readAloud,
        backstory: args.backstory,
        themes: args.themes,
        throughlines: []
      };
      break;

    case 'addThroughline':
      if (!builder.overview) builder.overview = { throughlines: [] };
      if (!builder.overview.throughlines) builder.overview.throughlines = [];
      builder.overview.throughlines.push({
        name: args.name,
        type: args.type,
        description: args.description,
        act1Hint: args.act1Hint,
        act2Discovery: args.act2Discovery,
        act3Payoff: args.act3Payoff
      });
      break;

    case 'setAct1Setup':
      if (!builder.act1) builder.act1 = {};
      builder.act1.title = args.title;
      builder.act1.estimatedDuration = args.estimatedDuration;
      builder.act1.overview = args.overview;
      builder.act1.settingTheScene = {
        readAloud: args.settingReadAloud,
        dmNotes: args.settingDmNotes
      };
      builder.act1.transitionToAct2 = args.transitionToAct2;
      break;

    case 'setQuestGiver':
      if (!builder.act1) builder.act1 = {};
      builder.act1.questGiver = {
        name: args.name,
        role: args.role,
        appearance: args.appearance,
        personality: args.personality,
        dialogue: {
          greeting: args.dialogueGreeting,
          questPitch: args.dialogueQuestPitch,
          ifQuestioned: args.dialogueIfQuestioned,
          ifRefused: args.dialogueIfRefused
        },
        reward: {
          offered: args.rewardOffered,
          negotiated: args.rewardNegotiated
        },
        keyInformation: args.keyInformation,
        secret: args.secret
      };
      break;

    case 'addNPC':
      if (!builder.act1) builder.act1 = {};
      if (!builder.act1.keyNpcs) builder.act1.keyNpcs = [];
      builder.act1.keyNpcs.push({
        name: args.name,
        role: args.role,
        location: args.location,
        appearance: args.appearance,
        personality: args.personality,
        connectionToPlot: args.connectionToPlot,
        dialogue: {
          greeting: args.dialogueGreeting,
          gossip: args.dialogueGossip,
          ifPressured: args.dialogueIfPressured,
          ifBribed: args.dialogueIfBribed
        },
        skillChecks: args.skillChecks,
        keyInformation: args.keyInformation,
        secret: args.secret,
        services: args.services || []
      });
      break;

    case 'addShop':
      if (!builder.act1) builder.act1 = {};
      if (!builder.act1.services) builder.act1.services = {};
      if (!builder.act1.services.shops) builder.act1.services.shops = [];
      builder.act1.services.shops.push({
        name: args.name,
        keeper: args.keeper,
        shopType: args.shopType,
        inventory: args.inventory
      });
      break;

    case 'setInn':
      if (!builder.act1) builder.act1 = {};
      if (!builder.act1.services) builder.act1.services = {};
      builder.act1.services.inn = {
        name: args.name,
        roomCost: args.roomCost,
        mealCost: args.mealCost,
        rumors: args.rumors
      };
      break;

    case 'setTravelToDestination':
      if (!builder.act1) builder.act1 = {};
      builder.act1.travelToDestination = {
        readAloud: args.readAloud,
        duration: args.duration
      };
      break;

    case 'setAct2Setup':
      if (!builder.act2) builder.act2 = {};
      builder.act2.title = args.title;
      builder.act2.estimatedDuration = args.estimatedDuration;
      builder.act2.overview = args.overview;
      builder.act2.dungeonOverview = {
        name: args.dungeonName,
        history: args.dungeonHistory,
        readAloud: args.dungeonReadAloud,
        atmosphere: args.dungeonAtmosphere,
        lightingConditions: args.lightingConditions,
        environmentalHazards: args.environmentalHazards
      };
      builder.act2.transitionToAct3 = args.transitionToAct3;
      break;

    case 'addRoom':
      if (!builder.act2) builder.act2 = {};
      if (!builder.act2.rooms) builder.act2.rooms = [];
      builder.act2.rooms.push({
        id: args.id,
        name: args.name,
        roomType: args.roomType,
        readAloud: args.readAloud,
        dimensions: args.dimensions,
        lighting: args.lighting,
        atmosphere: args.atmosphere,
        contents: {
          obvious: args.contentsObvious,
          hidden: args.contentsHidden
        },
        interactables: args.interactables,
        storyConnection: args.storyConnection,
        exits: args.exits,
        trap: args.trap,
        treasure: args.treasure
      });
      break;

    case 'addEncounter':
      if (!builder.act2) builder.act2 = {};
      if (!builder.act2.encounters) builder.act2.encounters = [];
      // Deduplicate - check if encounter with same name already exists
      const existingEncounter = builder.act2.encounters.find(e => e.name === args.name);
      if (!existingEncounter) {
        builder.act2.encounters.push({
          name: args.name,
          location: args.location,
          readAloud: args.readAloud,
          type: 'combat',
          enemies: args.enemies,
          tactics: args.tactics,
          terrain: args.terrain,
          dynamicElements: args.dynamicElements,
          difficulty: args.difficulty,
          rewards: {
            xp: args.rewardXP,
            loot: args.rewardLoot || []
          }
        });
      } else {
        console.log(`  -> Skipping duplicate encounter: ${args.name}`);
      }
      break;

    case 'addTrap':
      if (!builder.act2) builder.act2 = {};
      if (!builder.act2.traps) builder.act2.traps = [];
      builder.act2.traps.push({
        name: args.name,
        location: args.location,
        trigger: args.trigger,
        effect: args.effect,
        damage: args.damage,
        save: { type: args.saveType, dc: args.saveDC },
        detectDC: args.detectDC,
        disarmDC: args.disarmDC,
        countermeasures: args.countermeasures
      });
      break;

    case 'setBossEncounter':
      if (!builder.act3) builder.act3 = {};
      builder.act3.title = args.title;
      builder.act3.estimatedDuration = args.estimatedDuration;
      builder.act3.overview = args.overview;
      builder.act3.bossEncounter = {
        readAloud: args.chamberReadAloud,
        chamberFeatures: args.chamberFeatures,
        chamberDimensions: args.chamberDimensions,
        villain: {
          name: args.villainName,
          appearance: args.villainAppearance,
          type: args.villainType,
          cr: args.villainCR,
          hp: args.villainHP,
          ac: args.villainAC,
          acType: args.villainACType,
          initiative: args.villainInitiative,
          speed: args.villainSpeed,
          motivation: args.villainMotivation,
          personality: args.villainPersonality,
          dialogue: {
            opening: args.villainDialogueOpening,
            midFight: args.villainDialogueMidFight,
            defeat: args.villainDialogueDefeat
          },
          tactics: args.villainTactics,
          attacks: args.villainAttacks,
          spells: args.villainSpells,
          traits: args.villainTraits,
          resistances: args.villainResistances,
          immunities: args.villainImmunities,
          weakness: args.villainWeakness,
          legendaryActions: args.legendaryActions
        },
        phaseChanges: args.phaseChanges,
        minions: args.minions,
        summons: args.summons,
        throughlinePayoffs: args.throughlinePayoffs,
        rewards: {
          xp: args.rewardXP,
          gold: args.rewardGold,
          items: args.rewardItems,
          villainLoot: args.villainLoot
        }
      };
      break;

    case 'setAftermath':
      if (!builder.act3) builder.act3 = {};
      builder.act3.aftermath = {
        readAloud: args.aftermathReadAloud,
        discoveries: args.discoveries,
        immediateEffects: args.immediateEffects
      };
      builder.epilogue = {
        immediateAftermath: args.epilogueNarration,
        rewards: { townReaction: args.townReaction, questGiverScene: args.questGiverReward },
        futureHooks: args.futureHooks,
        characterMoments: args.characterMoments
      };
      break;

    case 'campaignComplete':
      console.log(`Campaign generation complete: ${args.summary}`);
      break;

    default:
      console.log(`Unknown function: ${functionName}`);
  }
}

// Generate campaign using function calling
async function generateCampaignWithFunctions(request: CampaignRequest, dungeonMap: DungeonMap): Promise<GeneratedCampaign> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [{ functionDeclarations: campaignFunctionDeclarations as any }]
  });

  // Build room context from dungeon map - separate boss room from Act 2 rooms
  const act2Rooms: string[] = [];
  let bossRoom: string | null = null;

  dungeonMap.rooms.forEach((room, i) => {
    const flags = room.contentFlags || {};
    const types: string[] = [];

    // Room content types
    if (flags.hasBattle) types.push('COMBAT');
    if (flags.hasTrap) types.push('TRAP');
    if (flags.hasTreasure) types.push('TREASURE');
    if (flags.hasPuzzle) types.push('PUZZLE');
    if (flags.hasSecret) types.push('SECRET');
    if (flags.isRitual) types.push('RITUAL');
    if (flags.isOptional) types.push('OPTIONAL/SIDE PATH');

    // Room terrain type
    const terrain = room.type === 'corridor' ? 'Corridor' :
                    room.type === 'secret' ? 'Secret Room' :
                    room.type === 'treasure' ? 'Treasure Chamber' :
                    room.type === 'trap' ? 'Trapped Area' : 'Chamber';

    const pathType = room.pathType ? `[${room.pathType.toUpperCase()}]` : '';
    const accessReq = room.accessRequirement ? ` - REQUIRES: ${room.accessRequirement.description}` : '';
    const guardian = room.guardian ? ` - GUARDIAN: ${room.guardian.type} (${room.guardian.description})` : '';

    const roomDesc = `Room ${i + 1}: ${room.name} (${terrain}) ${pathType}
   Content: ${types.join(', ') || 'EXPLORATION'}${accessReq}${guardian}
   Outline: ${room.outline || 'Standard room'}`;

    if (flags.isBoss) {
      bossRoom = roomDesc;
    } else {
      act2Rooms.push(roomDesc);
    }
  });

  const prompt = `You are a master D&D 5e Dungeon Master creating an immersive, cohesive one-shot adventure. Every element you create must connect to the larger story.

PARAMETERS:
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Tone: ${request.tone || 'serious'}

=== NAMING REQUIREMENTS ===
IMPORTANT: Create UNIQUE, CREATIVE names. NEVER use generic fantasy names like:
- Oakhaven, Willowdale, Thornwood, Shadowfen, Misthollow, Ravencrest, etc.
Instead, create evocative names that match the theme and setting:
- For dark themes: Bleakmarrow, The Sunken Parish, Gallowsmere
- For mystical themes: Starfall Crossing, The Luminant Hollow, Crystalvein
- For corrupt themes: The Tainted Wells, Blightreach, Canker's Rest
Each town, dungeon, and NPC name should feel unique to THIS specific adventure.

=== DUNGEON STRUCTURE ===

ACT 2 ROOMS (generate these with addRoom):
${act2Rooms.join('\n\n')}

ACT 3 BOSS ROOM (generate this with setBossEncounter, NOT addRoom):
${bossRoom || 'Final chamber with boss encounter'}

=== CRITICAL STORY REQUIREMENTS ===

1. THROUGHLINES: Create 2-3 narrative threads in setCampaignOverview that weave through ALL acts:
   - Each throughline must have hints in Act 1, discoveries in Act 2, and payoffs in Act 3
   - NPCs should know fragments of these throughlines
   - Dungeon rooms should contain evidence of throughlines
   - The boss encounter must resolve all throughlines

2. NPC SKILL CHECKS - REQUIRED for ALL NPCs:
   EVERY NPC must have the skillChecks object with at least 2-3 checks:
   skillChecks: {
     persuasion: { dc: 13, reveals: "He mentions seeing cloaked figures at the old mill last week" },
     intimidation: { dc: 15, reveals: "Admits he sold supplies to the cultists out of fear" },
     insight: { dc: 12, reveals: "You notice he keeps glancing nervously at the back door" },
     bribe: { cost: "10gp", reveals: "Draws a rough map showing a secret entrance to the dungeon" }
   }
   The reveals should be STORY-RELEVANT and help players learn about the villain, dungeon, or plot.

3. SHOPS MUST HAVE INVENTORY - addShop requires inventory array:
   Blacksmiths sell: weapons, armor, shields, ammunition
   General stores sell: adventuring gear, rations, rope, torches
   Apothecaries sell: potions, antidotes, herbs
   Example inventory: [
     {item: "Longsword", cost: "15gp", type: "weapon", effect: "1d8 slashing, versatile (1d10)"},
     {item: "Potion of Healing", cost: "50gp", type: "potion", effect: "Heals 2d4+2 HP"},
     {item: "Chain Mail", cost: "75gp", type: "armor", effect: "AC 16, disadvantage on Stealth"}
   ]

4. ROOM TREASURE - REQUIRED for every room:
   Every room needs the treasure array with 1-4 items:
   treasure: [
     {item: "Silver candlesticks", value: "25gp", type: "treasure", hidden: false},
     {item: "Potion of Healing", value: "50gp", type: "potion", effect: "Heals 2d4+2 HP", hidden: true, findDC: 14},
     {item: "Ancient journal", value: "5gp", type: "clue", effect: "Mentions the villain's weakness"}
   ]
   Include: gold, gems, potions, scrolls, weapons, story clues, keys, maps.
   Some should be hidden (hidden: true, findDC: 12-16).

5. ROOM DESCRIPTIONS - Generate ALL rooms from ACT 2 ROOMS list above:
   - Match each room number and type from the dungeon structure
   - Include secret rooms, treasure rooms, ritual rooms, corridors - ALL of them
   - 2-3 paragraph read-aloud with sensory details
   - 3-5 obvious contents, 2-3 hidden contents with DCs
   - Story connections to throughlines

6. ENCOUNTERS - Add exactly 3 combat encounters with FULL MONSTER STATS:
   Each enemy needs COMPLETE statblock information:
   - name, count, cr, hp, ac, acType (natural armor, leather, etc.)
   - initiative: The creature's DEX modifier (e.g. 2 for a creature with 14 DEX)
   - speed: Movement speed (e.g. "30 ft." or "30 ft., fly 60 ft.")
   - attacks: REQUIRED array with at least one attack:
     [{name: "Claw", bonus: 4, damage: "1d6+2", damageType: "slashing"}]
   - spells: For casters, include cantrips (level 0) and spells
   - traits: Special abilities like Pack Tactics, Sunlight Sensitivity
   - resistances/immunities: Damage type arrays
   Example skeleton: {name: "Skeleton", count: 3, cr: "1/4", hp: 13, ac: 13,
     acType: "armor scraps", initiative: 2, speed: "30 ft.",
     attacks: [{name: "Shortsword", bonus: 4, damage: "1d6+2", damageType: "piercing"}],
     immunities: ["poison"], traits: [{name: "Undead", description: "Immune to exhaustion"}]}

   LOOT IS REQUIRED for every encounter! Include 2-4 items per encounter:
   rewardLoot: [
     {item: "50 gold pieces", value: "50gp", type: "treasure"},
     {item: "Potion of Healing", value: "50gp", type: "potion", effect: "Heals 2d4+2 HP"},
     {item: "Rusted Longsword", value: "10gp", type: "weapon"}
   ]

7. TRAPS - Include 2-4 hidden traps spread across different rooms:
   Use the trap field in addRoom (NOT separate addTrap calls):
   - trap.hasTrap: true
   - trap.name: "Poison Dart Trap"
   - trap.trigger: "Pressure plate in front of chest"
   - trap.effect: "Darts shoot from the wall"
   - trap.damage: "2d6 piercing + DC 12 CON save or poisoned"
   - trap.detectDC: 14 (Perception to notice)
   - trap.disarmDC: 13 (Thieves' tools)
   - trap.hint: "Tiny holes visible in the wall"

8. BOSS ENCOUNTER - setBossEncounter for Act 3 (NOT addRoom):
   THIS IS THE CLIMAX - FILL IN EVERY FIELD COMPLETELY WITH NO "?" VALUES:

   BOSS CHAMBER (this IS the Act 3 room - no separate addRoom needed):
   - chamberReadAloud: 2-3 FULL paragraphs describing the boss's lair
   - chamberDimensions: "60x80 feet with 30-foot vaulted ceiling"
   - chamberFeatures: 4-5 tactical terrain features

   VILLAIN COMBAT STATS (ALL REQUIRED - NO "?" ALLOWED):
   - villainName, villainAppearance, villainType
   - villainCR: "4" (Challenge Rating as string)
   - villainHP: 85 (number)
   - villainAC: 16 (number)
   - villainACType: "natural armor" or "chain mail" etc.
   - villainInitiative: 3 (DEX modifier as number)
   - villainSpeed: "30 ft." or "30 ft., fly 60 ft."

   VILLAIN ATTACKS - REQUIRED with FULL stats:
   villainAttacks: [
     {name: "Shadow Blade", bonus: 7, damage: "2d8+4", damageType: "necrotic", range: "5 ft.", notes: "On hit, target must make DC 14 CON save or be frightened"},
     {name: "Corrupting Touch", bonus: 7, damage: "3d6", damageType: "necrotic", range: "5 ft."},
     {name: "Dark Bolt", bonus: 6, damage: "2d10", damageType: "necrotic", range: "60 ft."}
   ]

   VILLAIN SPELLS (if spellcaster):
   villainSpells: [
     {name: "Fire Bolt", level: 0, damage: "2d10 fire", range: "120 ft."},
     {name: "Hold Person", level: 2, save: "DC 15 WIS", effect: "Paralyzed", range: "60 ft."}
   ]

   VILLAIN TRAITS, RESISTANCES, IMMUNITIES:
   villainTraits: [{name: "Magic Resistance", description: "Advantage on saves vs spells"}]
   villainResistances: ["cold", "fire"]
   villainImmunities: ["poison", "necrotic"]

   LEGENDARY ACTIONS (with cost and effect):
   legendaryActions: [
     {name: "Attack", cost: 1, effect: "Makes one Shadow Blade attack"},
     {name: "Dark Teleport", cost: 2, effect: "Teleports up to 30 feet to unoccupied space"}
   ]

   MINIONS - FULL COMBAT STATS REQUIRED:
   minions: [{
     name: "Shadow Cultist", count: 2, cr: "1/2", hp: 22, ac: 13,
     initiative: 2, speed: "30 ft.",
     attacks: [{name: "Dagger", bonus: 4, damage: "1d4+2", damageType: "piercing"}],
     role: "Harass spellcasters"
   }]

   SUMMONS (if villain summons creatures during fight):
   summons: [{
     name: "Shadow Demon", summonTrigger: "At 50% HP", count: 2,
     cr: "1", hp: 27, ac: 12, initiative: 3, speed: "30 ft., fly 30 ft.",
     attacks: [{name: "Claw", bonus: 5, damage: "2d6+3", damageType: "necrotic"}],
     traits: ["Shadow Stealth", "Incorporeal Movement"]
   }]

   OTHER REQUIRED FIELDS:
   - villainMotivation, villainPersonality, villainTactics, villainWeakness
   - villainDialogueOpening, villainDialogueMidFight, villainDialogueDefeat
   - phaseChanges: ["At 75% HP: ...", "At 50% HP: ...", "At 25% HP: ..."]
   - throughlinePayoffs: How story threads resolve

   REWARDS - ALL REQUIRED:
   - rewardXP: 1800 (number)
   - rewardGold: "450 gold pieces, 3 gems worth 50gp each"
   - villainLoot: "Ornate dagger, bloodstained journal, key to treasure vault"
   - rewardItems: [
       {name: "Staff of the Void", type: "staff", rarity: "rare", value: "2000gp",
        effect: "+1 to spell attack rolls. Can cast Darkness 1/day.", attunement: true}
     ]

=== GENERATION ORDER ===

1. setCampaignOverview - Title, synopsis, hook, arc. Establish the villain's name and goal.
2. addThroughline x2-3 - Narrative threads that will appear throughout
3. setAct1Setup - Town arrival, DM notes about what's really happening
4. setQuestGiver - Full dialogue including greeting, quest pitch, responses to questions
5. addNPC x4-6 - EVERY NPC must have skillChecks object:
   Each NPC needs 2-4 skill checks with DCs and story-relevant reveals:
   - skillChecks.persuasion: { dc: 13, reveals: "..." }
   - skillChecks.intimidation: { dc: 15, reveals: "..." }
   - skillChecks.insight: { dc: 12, reveals: "..." }
   - skillChecks.bribe: { cost: "10gp", reveals: "..." }
6. setInn - Rumors that foreshadow dungeon dangers
7. addShop x1-2 - MUST include inventory array with 4-6 items:
   Each item needs: {item, cost, type, effect}
   Blacksmith: weapons, armor. Apothecary: potions. General: gear.
8. setTravelToDestination - Journey with environmental storytelling
9. setAct2Setup - Dungeon overview referencing its history and the villain
10. addRoom for EACH room in ACT 2 ROOMS - include ALL rooms (corridors, secrets, treasures, rituals)
    - EVERY room MUST have treasure array with 1-4 items
    - 2-4 rooms should have trap field populated with full trap details
11. addEncounter x3 - COMPLETE MONSTER STATBLOCKS required for each enemy:
    - name, count, cr, hp, ac, acType (natural armor, etc.)
    - initiative: DEX modifier bonus (e.g. 2 for +2)
    - speed: "30 ft." or "30 ft., fly 60 ft."
    - attacks: Array of {name, bonus, damage, damageType, notes}
      Example: {name: "Longsword", bonus: 5, damage: "1d8+3", damageType: "slashing"}
    - spells: Array of {name, level, damage, effect, save} for casters
    - traits: Array of {name, description} for Pack Tactics, Keen Senses, etc.
    - resistances, immunities: Arrays of damage types
12. setBossEncounter - THE MOST IMPORTANT CALL. NO "?" VALUES ALLOWED:
    - villainHP, villainAC, villainACType, villainInitiative (number), villainSpeed
    - villainAttacks: Array of {name, bonus, damage, damageType, range, notes}
    - villainSpells: Array of {name, level, damage, effect, save, range} if caster
    - villainTraits, villainResistances, villainImmunities
    - legendaryActions: Array of {name, cost, effect}
    - minions: Array with FULL stats {name, count, cr, hp, ac, initiative, speed, attacks, role}
    - summons: If villain summons creatures, include full stats
    - rewardItems: 2-3 magic items with mechanical effects
13. setAftermath - Resolution referencing NPCs by name, throughline resolutions
14. campaignComplete

${generateEncounterGuidelines(request.partyLevel, request.partySize)}

Use only SRD monsters. All stats must follow the guidelines above - NO guessing or placeholder values.`;

  console.log('Starting function-calling campaign generation...');
  const builder: CampaignBuilder = {};

  // Start the conversation
  const chat = model.startChat();
  let response = await chat.sendMessage(prompt);
  let iterationCount = 0;
  const maxIterations = 50; // Safety limit

  // Process function calls until the model stops calling functions
  while (iterationCount < maxIterations) {
    iterationCount++;
    const candidate = response.response.candidates?.[0];

    if (!candidate?.content?.parts) {
      console.log('No more content from model');
      break;
    }

    // Check for function calls
    const functionCalls = candidate.content.parts.filter(part => part.functionCall);

    if (functionCalls.length === 0) {
      console.log('No more function calls');
      break;
    }

    // Process each function call
    const functionResponses: any[] = [];
    for (const part of functionCalls) {
      const fc = part.functionCall;
      if (fc) {
        try {
          processFunctionCall(builder, fc.name, fc.args);
          functionResponses.push({
            functionResponse: {
              name: fc.name,
              response: { success: true }
            }
          });
        } catch (error) {
          console.error(`Error in ${fc.name}:`, error);
          functionResponses.push({
            functionResponse: {
              name: fc.name,
              response: { success: false, error: String(error) }
            }
          });
        }
      }
    }

    // Check if we're done
    if (functionCalls.some(p => p.functionCall?.name === 'campaignComplete')) {
      console.log('Campaign marked as complete');
      break;
    }

    // Send function responses back to continue the conversation
    response = await chat.sendMessage(functionResponses);
  }

  console.log(`Function calling completed after ${iterationCount} iterations`);

  // Build the final campaign object
  const campaign: GeneratedCampaign = {
    title: builder.title || 'Untitled Adventure',
    synopsis: builder.synopsis || '',
    hook: builder.hook || '',
    arc: builder.arc || { beginning: '', middle: '', climax: '', resolution: '' },
    overview: builder.overview,
    act1: builder.act1,
    act2: builder.act2,
    act3: builder.act3,
    epilogue: builder.epilogue,
    npcs: [],
    locations: [],
    encounters: builder.act2?.encounters || [],
    sessionOutlines: [{
      number: 1,
      title: builder.title || 'Adventure',
      summary: builder.synopsis || '',
      objectives: ['Complete Act 1', 'Complete Act 2', 'Defeat the boss', 'Return victorious']
    }],
    dungeonMap: dungeonMap,
    _partial: false
  };

  // Check for missing parts
  const missingParts: string[] = [];
  if (!builder.act1?.questGiver) missingParts.push('Quest Giver');
  if (!builder.act2?.encounters?.length) missingParts.push('Encounters');
  if (!builder.act3?.bossEncounter) missingParts.push('Boss Encounter');

  if (missingParts.length > 0) {
    campaign._partial = true;
    campaign._error = `Some sections may be incomplete: ${missingParts.join(', ')}`;
  }

  return campaign;
}

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

// Extract a valid JSON object up to a certain depth by parsing character by character
function extractValidJsonUpToError(jsonStr: string): string | null {
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let lastValidClose = -1;
  let result = '';

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    result += char;

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
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          // Try parsing what we have so far
          try {
            JSON.parse(result);
            lastValidClose = i;
          } catch {
            // Not valid yet, continue
          }
        }
      }
    }
  }

  if (lastValidClose > 0) {
    return jsonStr.substring(0, lastValidClose + 1);
  }
  return null;
}

// Try to truncate JSON at the last complete section before an error
function truncateAtLastCompleteSection(jsonStr: string, errorPos: number): string | null {
  // Find the last complete property before the error position
  // Look for patterns like "},\n  \"" or "],\n  \"" which indicate section boundaries
  const beforeError = jsonStr.substring(0, errorPos);

  // Try to find the last complete top-level section
  const sectionPatterns = [
    /,\s*"epilogue"\s*:\s*\{[^]*$/,
    /,\s*"act3"\s*:\s*\{[^]*$/,
    /,\s*"act2"\s*:\s*\{[^]*$/,
    /,\s*"sessionOutlines"\s*:\s*\[[^]*$/,
    /,\s*"encounters"\s*:\s*\[[^]*$/,
    /,\s*"locations"\s*:\s*\[[^]*$/,
    /,\s*"npcs"\s*:\s*\[[^]*$/,
  ];

  for (const pattern of sectionPatterns) {
    const match = beforeError.match(pattern);
    if (match && match.index !== undefined) {
      // Remove this incomplete section and close the JSON
      const truncated = beforeError.substring(0, match.index) + '}';
      try {
        const result = JSON.parse(truncated);
        console.log(`Truncated JSON at incomplete section: ${pattern.source}`);
        return truncated;
      } catch {
        // Try adding more closing braces
        for (let i = 1; i <= 5; i++) {
          try {
            const withBraces = beforeError.substring(0, match.index) + '}'.repeat(i);
            JSON.parse(withBraces);
            console.log(`Truncated with ${i} closing braces`);
            return withBraces;
          } catch {
            continue;
          }
        }
      }
    }
  }

  return null;
}

// Build a minimal valid campaign from partial data
function buildMinimalCampaign(jsonStr: string): any {
  // Extract what we can from the broken JSON
  const extractField = (fieldName: string, isObject: boolean = false): any => {
    const pattern = isObject
      ? new RegExp(`"${fieldName}"\\s*:\\s*(\\{[^]*?\\})\\s*[,}]`)
      : new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"\\s*[,}]`);
    const match = jsonStr.match(pattern);
    if (match) {
      if (isObject) {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      }
      return match[1];
    }
    return null;
  };

  const title = extractField('title') || 'Generated Adventure';
  const synopsis = extractField('synopsis') || 'An epic adventure awaits...';
  const hook = extractField('hook') || 'Adventure begins when heroes are called to action.';

  // Try to extract arc
  let arc = extractField('arc', true);
  if (!arc) {
    arc = {
      beginning: 'The adventure begins...',
      middle: 'Challenges arise...',
      climax: 'The final confrontation...',
      resolution: 'Peace is restored.'
    };
  }

  console.log('Built minimal campaign from partial data');

  return {
    title,
    synopsis,
    hook,
    arc,
    npcs: [],
    locations: [],
    encounters: [],
    sessionOutlines: [{
      number: 1,
      title: 'Adventure',
      summary: synopsis,
      objectives: ['Complete the adventure']
    }],
    _partial: true,
    _error: 'Campaign was partially generated due to JSON parsing issues. Some sections may be missing.'
  };
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
    console.log('Iterative repair failed, trying other strategies...');
  }

  // Get the error position for targeted repair
  const errorPos = findJsonErrorPosition(jsonStr);
  console.log(`Error detected at position ${errorPos} of ${jsonStr.length}`);

  // Strategy 1: Truncate at the last complete section before the error
  if (errorPos > 0) {
    const truncatedAtSection = truncateAtLastCompleteSection(jsonStr, errorPos);
    if (truncatedAtSection) {
      try {
        return JSON.parse(truncatedAtSection);
      } catch {
        console.log('Section truncation failed');
      }
    }
  }

  // Strategy 2: Try truncating at known section boundaries (from end to start)
  const sectionMarkers = [
    /"epilogue"\s*:\s*\{/,
    /"act3"\s*:\s*\{/,
    /"act2"\s*:\s*\{/,
    /"sessionOutlines"\s*:\s*\[/,
    /"encounters"\s*:\s*\[/,
    /"npcs"\s*:\s*\[/,
    /"act1"\s*:\s*\{/,
  ];

  for (const marker of sectionMarkers) {
    const match = jsonStr.match(marker);
    if (match && match.index) {
      // Truncate before this section and close the JSON
      let truncated = jsonStr.substring(0, match.index).replace(/,\s*$/, '');

      // Count open braces to know how many to close
      const openBraces = (truncated.match(/{/g) || []).length;
      const closeBraces = (truncated.match(/}/g) || []).length;
      const neededBraces = openBraces - closeBraces;

      truncated += '}'.repeat(Math.max(1, neededBraces));

      try {
        const result = JSON.parse(truncated);
        console.log(`Successfully parsed by truncating before ${marker.source}`);
        return result;
      } catch {
        // Try next marker
      }
    }
  }

  // Strategy 3: Try basic brace balancing repair
  const basicRepaired = repairJson(jsonStr);
  try {
    return JSON.parse(basicRepaired);
  } catch (e) {
    console.log('Basic repair failed, trying character-level extraction...');
  }

  // Strategy 4: Extract valid JSON by parsing character by character
  const validExtract = extractValidJsonUpToError(jsonStr);
  if (validExtract) {
    try {
      return JSON.parse(validExtract);
    } catch {
      console.log('Character-level extraction failed');
    }
  }

  // Strategy 5: Find balanced braces from start
  const firstBrace = jsonStr.indexOf('{');
  if (firstBrace === -1) {
    console.log('No JSON object found, building minimal campaign');
    return buildMinimalCampaign(jsonStr);
  }

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
  try {
    return JSON.parse(finalRepaired);
  } catch (finalError) {
    console.log('All repair strategies failed, building minimal campaign from partial data');
    // Last resort: build a minimal valid campaign from whatever we can extract
    return buildMinimalCampaign(jsonStr);
  }
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
  // Enhanced room details for narrative generation
  exits?: string[];           // e.g., ["North door to Room 2", "East passage to Room 3"]
  contentFlags?: {            // What this room contains
    hasBattle?: boolean;
    hasTrap?: boolean;
    hasTreasure?: boolean;
    hasSecret?: boolean;
    hasPuzzle?: boolean;
    isBoss?: boolean;
    isRitual?: boolean;       // Ritual that affects boss if stopped
    isOptional?: boolean;     // Not on critical path
    isSecretEntrance?: boolean; // Alternative entrance to dungeon
    isCave?: boolean;         // Natural cavern terrain
  };
  outline?: string;           // Brief outline for narrative AI
  // Access requirements - what's needed to enter this room
  accessRequirement?: {
    type: 'none' | 'key' | 'puzzle' | 'secret' | 'passphrase' | 'boss_defeated' | 'ritual';
    keyId?: string;           // e.g., "iron_key", "skull_medallion"
    keyLocation?: string;     // Which room has the key
    description?: string;     // e.g., "Requires the Iron Key found in the Guard Room"
    dcCheck?: number;         // DC for secret door perception, puzzle solving, etc.
  };
  // For treasure rooms - what guards it
  guardian?: {
    type: 'combat' | 'trap' | 'puzzle' | 'guardian_spirit' | 'curse';
    description: string;
  };
  // For ritual rooms - effect on boss
  ritualEffect?: {
    description: string;      // What stopping the ritual does
    bossDebuff: string;       // e.g., "Boss loses legendary resistance", "Boss starts at half HP"
  };
  // Path classification
  pathType?: 'critical' | 'optional' | 'secret' | 'shortcut' | 'secret_entrance';
  // Terrain type
  terrain?: 'constructed' | 'cave' | 'mixed';
  // Environmental storytelling
  storyElement?: {
    type: 'dead_adventurer' | 'ancient_battle' | 'warning_signs' | 'previous_expedition' | 'natural_disaster' | 'ritual_aftermath';
    description: string;
    loot?: string[];
    clues?: string[];
  };
}

export interface DungeonMap {
  name: string;
  width: number;
  height: number;
  rooms: DungeonRoom[];
  theme: string;
  // Dungeon-wide metadata
  keys?: Array<{
    id: string;
    name: string;
    description: string;
    locationRoomId: string;
    unlocksRoomId: string;
    unlockType: string;       // 'key' | 'passphrase' | 'scroll' | 'medallion' | etc.
  }>;
  // Secret entrances (alternative ways into the dungeon)
  secretEntrances?: Array<{
    id: string;
    name: string;
    description: string;
    leadsToRoomId: string;    // Which room this entrance connects to
    discoveryMethods: Array<{
      type: 'tracks' | 'npc_info' | 'map' | 'research' | 'exploration';
      description: string;
      dcCheck?: number;        // DC for skill check if applicable
      skillCheck?: string;     // e.g., "Investigation", "Perception", "Persuasion"
      npcName?: string;        // NPC who knows about it
      cost?: string;           // Cost to buy map or info
    }>;
    advantages: string[];      // What benefits this entrance provides
  }>;
  // Environmental storytelling elements
  storyElements?: Array<{
    id: string;
    name: string;
    description: string;
    roomId: string;           // Which room contains this
    type: 'dead_adventurer' | 'ancient_battle' | 'warning_signs' | 'previous_expedition' | 'natural_disaster' | 'ritual_aftermath';
    loot?: string[];          // Items that can be found
    clues?: string[];         // Information revealed
    dcToNotice?: number;      // DC to spot if hidden
  }>;
  // Terrain features
  hasCaveSections?: boolean;   // Whether dungeon has organic cave areas
  ritualCount?: number;        // How many rituals can be stopped
  secretCount?: number;        // How many secret areas exist
  shortcutCount?: number;      // How many shortcuts exist
}

// Helper to extract JSON from AI response
function extractJsonFromResponse(text: string): string {
  // Pattern 1: ```json ... ```
  const jsonBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1];
  }

  // Pattern 2: ``` ... ```
  const codeBlockMatch = text.match(/```\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  // Pattern 3: Direct JSON object
  const directMatch = text.match(/\{[\s\S]*\}/);
  if (directMatch) {
    return directMatch[0];
  }

  return text;
}

// Helper to call Gemini API and parse response
async function callGeminiAndParse(prompt: string, partName: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  console.log(`Generating ${partName}...`);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log(`${partName} response length: ${text.length}`);

  const jsonStr = extractJsonFromResponse(text);
  return parseJsonWithRepair(jsonStr);
}

// Build prompt for Overview + Act 1
function buildOverviewAndAct1Prompt(request: CampaignRequest): string {
  const adventureType = request.adventureType || 'dungeon_crawl';
  const adventureInstructions = getAdventureTypeInstructions(adventureType);

  return `You are a master D&D 5e Dungeon Master. Create the OVERVIEW and ACT 1 for an adventure.

PARAMETERS:
- Adventure Type: ${adventureType.replace('_', ' ').toUpperCase()}
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}
- Tone: ${request.tone || 'serious'}

TYPE GUIDANCE:
${adventureInstructions}

Return ONLY valid JSON with this structure:

\`\`\`json
{
  "title": "Evocative Adventure Title",
  "synopsis": "3-4 sentence dramatic overview establishing threat, stakes, and why heroes are needed.",
  "hook": "The inciting incident with specific details: reward amount, deadline, or personal connection.",
  "arc": {
    "beginning": "Act 1 summary (1 sentence)",
    "middle": "Act 2 summary (1 sentence)",
    "climax": "Act 3 summary (1 sentence)",
    "resolution": "Epilogue summary (1 sentence)"
  },
  "overview": {
    "readAloud": "Opening narration (2 paragraphs with vivid sensory details)",
    "backstory": "True history - what caused this threat, who is the villain, what do they want",
    "themes": ["Primary theme", "Secondary theme"],
    "throughlines": [
      {
        "name": "The Hidden Secret",
        "type": "secret",
        "description": "A mystery or revelation that connects all acts (e.g., the villain's true identity)",
        "act1Hint": "Clue or foreshadowing in Act 1",
        "act2Discovery": "Evidence or partial reveal in Act 2",
        "act3Payoff": "Full revelation or confrontation in Act 3"
      },
      {
        "name": "The Lost Treasure",
        "type": "treasure",
        "description": "A valuable item or knowledge that appears throughout (e.g., pieces of a map, a legendary weapon)",
        "act1Hint": "First mention or sighting",
        "act2Discovery": "Find a piece or learn its location",
        "act3Payoff": "Obtain or use it against the villain"
      },
      {
        "name": "The Villain's Weakness",
        "type": "weakness",
        "description": "Something that can be exploited in the final battle",
        "act1Hint": "Rumor or legend about the weakness",
        "act2Discovery": "Proof or item needed to exploit it",
        "act3Payoff": "Use the weakness in the boss fight"
      }
    ]
  },
  "act1": {
    "title": "Act 1 Title",
    "estimatedDuration": "45-60 minutes",
    "overview": "What happens in Act 1",
    "settingTheScene": {
      "readAloud": "Arrival description (2 paragraphs with sensory details)",
      "dmNotes": "What's really happening behind the scenes"
    },
    "questGiver": {
      "name": "Quest Giver Name",
      "role": "Position (Elder, Mayor, etc.)",
      "appearance": "Physical description",
      "personality": "How they speak and act",
      "dialogue": {
        "greeting": "Initial dialogue",
        "questPitch": "How they explain the problem",
        "ifQuestioned": "Responses to questions"
      },
      "reward": {"offered": "Initial reward", "negotiated": "Better reward"},
      "keyInformation": ["Fact 1", "Fact 2", "Fact 3"]
    },
    "keyNpcs": [
      {
        "name": "NPC Name",
        "role": "Role (Innkeeper/Blacksmith/Merchant/Priest/etc.)",
        "location": "Where found",
        "personality": "Character traits",
        "gossip": "What they know about the adventure"
      }
    ],
    "services": {
      "inn": {"name": "Inn Name", "roomCost": "5sp/night", "mealCost": "2sp", "rumors": ["Rumor 1", "Rumor 2"]},
      "shops": [
        {
          "name": "Shop Name",
          "keeper": "Shopkeeper Name",
          "shopType": "general|blacksmith|apothecary|magic",
          "inventory": [
            {"item": "Item Name", "cost": "Price", "type": "weapon|armor|potion|gear", "effect": "Mechanical effect"}
          ]
        }
      ]
    },
    "travelToDestination": {
      "readAloud": "Travel narration (1-2 paragraphs)",
      "duration": "Travel time"
    },
    "transitionToAct2": "Read-aloud text as party arrives at the dungeon entrance"
  }
}
\`\`\`

REQUIREMENTS:
- Create 3-5 distinct NPCs with unique personalities and useful information (one entry per NPC in keyNpcs array)
- Include at least: Innkeeper, Merchant/Blacksmith, and one mysterious/knowledgeable figure
- Create 1-2 shops with 3-5 items each (include weapons, armor, potions, and gear with prices and effects)
- Make the quest giver compelling with clear motivation
- CRITICAL: Ensure the complete JSON structure is returned, especially the full act1 object with all sections`;
}

// Build prompt for Act 2 (Dungeon/Encounters)
function buildAct2Prompt(request: CampaignRequest, overviewData: any, dungeonMap?: DungeonMap): string {
  const adventureType = request.adventureType || 'dungeon_crawl';

  // Extract throughlines from Act 1
  const throughlines = overviewData.overview?.throughlines || [];
  const throughlineContext = throughlines.map((t: any) =>
    `- ${t.name} (${t.type}): ${t.description}. Act 1 established: "${t.act1Hint}". In Act 2 you must include: "${t.act2Discovery}"`
  ).join('\n');

  // Extract key NPCs and quest info from Act 1
  const questGiver = overviewData.act1?.questGiver;
  const questGiverContext = questGiver
    ? `Quest Giver: ${questGiver.name} (${questGiver.role}) - Key info shared: ${questGiver.keyInformation?.join(', ') || 'none'}`
    : '';

  const keyNpcs = overviewData.act1?.keyNpcs || [];
  const npcContext = keyNpcs.slice(0, 3).map((npc: any) =>
    `- ${npc.name} (${npc.role}): mentioned ${npc.keyInformation?.[0] || 'local rumors'}`
  ).join('\n');

  // Build detailed room structure from pre-generated dungeon map
  const roomStructure = dungeonMap ? dungeonMap.rooms.map((room, index) => {
    const roomNum = index + 1;
    const flags = room.contentFlags || {};
    const contentTypes: string[] = [];
    if (flags.hasBattle) contentTypes.push('COMBAT');
    if (flags.hasTrap) contentTypes.push('TRAP');
    if (flags.hasTreasure) contentTypes.push('TREASURE');
    if (flags.hasPuzzle) contentTypes.push('PUZZLE');
    if (flags.hasSecret) contentTypes.push('SECRET');
    if (flags.isRitual) contentTypes.push('RITUAL');
    if (flags.isBoss) contentTypes.push('BOSS FIGHT');
    if (flags.isOptional) contentTypes.push('OPTIONAL');

    const exitsStr = room.exits?.join('; ') || 'Standard exits';
    const contentStr = contentTypes.length > 0 ? contentTypes.join(', ') : 'Exploration/Roleplay';
    const pathStr = room.pathType ? `[${room.pathType.toUpperCase()} PATH]` : '';

    // Access requirements
    let accessStr = '';
    if (room.accessRequirement) {
      accessStr = `\n  - ACCESS: ${room.accessRequirement.description}`;
    }

    // Guardian info
    let guardianStr = '';
    if (room.guardian) {
      guardianStr = `\n  - GUARDIAN: ${room.guardian.description}`;
    }

    // Ritual effect
    let ritualStr = '';
    if (room.ritualEffect) {
      ritualStr = `\n  - RITUAL EFFECT: ${room.ritualEffect.description} → If stopped: ${room.ritualEffect.bossDebuff}`;
    }

    return `
ROOM ${roomNum}: "${room.name}" (${room.type}) ${pathStr}
  - Exits: ${exitsStr}
  - Content: ${contentStr}
  - Outline: ${room.outline || 'Standard room encounter'}
  - Features: ${room.features?.join(', ') || 'None specified'}${accessStr}${guardianStr}${ritualStr}`;
  }).join('\n') : '';

  // Key information
  const keysInfo = dungeonMap?.keys?.length ? `
KEYS AND LOCKS:
${dungeonMap.keys.map(k => `- ${k.name}: Found in ${k.locationRoomId}, unlocks ${k.unlocksRoomId}. ${k.description}`).join('\n')}
` : '';

  // Dungeon summary
  const dungeonSummary = dungeonMap ? `
DUNGEON SUMMARY:
- Rooms on critical path: ${dungeonMap.rooms.filter(r => r.pathType === 'critical').length}
- Optional side areas: ${dungeonMap.rooms.filter(r => r.pathType === 'optional').length}
- Secret areas: ${dungeonMap.secretCount || 0}
- Shortcuts/loops: ${dungeonMap.shortcutCount || 0}
- Rituals that weaken boss: ${dungeonMap.ritualCount || 0}
- Secret entrances: ${dungeonMap.secretEntrances?.length || 0}
- Environmental story elements: ${dungeonMap.storyElements?.length || 0}
- Has cave sections: ${dungeonMap.hasCaveSections ? 'Yes' : 'No'}
` : '';

  // Secret entrances info for Act 1 hints
  const secretEntrancesInfo = dungeonMap?.secretEntrances?.length ? `
SECRET ENTRANCES (for Act 1 foreshadowing and Act 2 discovery):
${dungeonMap.secretEntrances.map(se => `
${se.name}: ${se.description}
  - Leads to: ${se.leadsToRoomId}
  - Advantages: ${se.advantages.join(', ')}
  - Discovery methods:
${se.discoveryMethods.map(dm => `    * ${dm.type.toUpperCase()}: ${dm.description}`).join('\n')}
`).join('\n')}
` : '';

  // Story elements info
  const storyElementsInfo = dungeonMap?.storyElements?.length ? `
ENVIRONMENTAL STORYTELLING (describe these in the rooms):
${dungeonMap.storyElements.map(se => `
${se.name} (${se.roomId}): ${se.description}
  - Loot: ${se.loot?.join(', ') || 'None'}
  - Clues revealed: ${se.clues?.join('; ') || 'None'}
`).join('\n')}
` : '';

  const dungeonMapContext = dungeonMap ? `
DUNGEON MAP STRUCTURE - JAQUAYS-STYLE NON-LINEAR DUNGEON:
The dungeon "${dungeonMap.name}" has ${dungeonMap.rooms.length} rooms with branching paths, secrets, and meaningful choices.
${dungeonSummary}${keysInfo}${secretEntrancesInfo}${storyElementsInfo}
ROOM DETAILS:
${roomStructure}

IMPORTANT NARRATIVE INSTRUCTIONS:
- Your "rooms" array MUST match these room names and IDs exactly
- CRITICAL PATH rooms must be completed to reach the boss
- OPTIONAL rooms are side content - describe how players can find/access them
- SECRET rooms require perception checks (mention the DC in your narrative)
- LOCKED rooms require keys - the key location must be discoverable
- GUARDIAN encounters must be challenging - treasure is NEVER free
- RITUAL rooms: If players stop the ritual, note the boss debuff they earn
- Create a sense of exploration and meaningful choice
- Shortcuts should feel rewarding to discover but come with trade-offs

SECRET ENTRANCE NARRATIVE REQUIREMENTS:
- In Act 1, NPCs should hint at alternative ways into the dungeon (rumors, old maps, etc.)
- Secret entrances should feel rewarding to discover - players who investigate get advantages
- Each entrance has specific discovery methods - incorporate these into your narrative
- Describe the cave/tunnel terrain for secret entrance passages

ENVIRONMENTAL STORYTELLING REQUIREMENTS:
- Include the story elements in your room descriptions
- Dead adventurers, old campsites, etc. should provide clues and loot
- These elements should make the dungeon feel like it has history
- Clues can hint at boss weaknesses, secret entrances, or treasure locations
` : '';

  return `You are a master D&D 5e Dungeon Master. Create ACT 2 (the dungeon/adventure site) for this adventure:

ADVENTURE CONTEXT:
- Title: ${overviewData.title}
- Synopsis: ${overviewData.synopsis}
- Hook: ${overviewData.hook}
- Theme: ${request.theme}
- Setting: ${request.setting}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}

ACT 1 ESTABLISHED (must be referenced/continued in Act 2):
${questGiverContext}
NPCs the party met:
${npcContext}
Transition from Act 1: ${overviewData.act1?.transitionToAct2 || 'Party arrives at the dungeon'}

NARRATIVE THROUGHLINES (these MUST appear in Act 2):
${throughlineContext || 'No throughlines defined'}

CRITICAL: Each throughline must have its "act2Discovery" element somewhere in the dungeon - as a hidden item, NPC dialogue, room description, or treasure.
${dungeonMapContext}
Return ONLY valid JSON with this structure:

\`\`\`json
{
  "act2": {
    "title": "Act 2 Title (e.g., 'The Crimson Depths')",
    "estimatedDuration": "60-90 minutes",
    "overview": "The dungeon/adventure site and its dangers",
    "dungeonOverview": {
      "name": "Dungeon Name",
      "history": "Brief history of this place",
      "readAloud": "Entrance description (what players see approaching)",
      "atmosphere": "Overall mood",
      "lightingConditions": "Bright/dim/dark light",
      "environmentalHazards": ["Hazard 1", "Hazard 2"]
    },
    "rooms": [
      {
        "id": "1",
        "name": "Entrance Chamber",
        "readAloud": "Detailed description (2 paragraphs with sensory details)",
        "dimensions": "30ft x 40ft",
        "lighting": "Dim light",
        "exits": ["North: door to Room 2"],
        "contents": {
          "obvious": ["What's visible"],
          "hidden": ["DC 15 Perception reveals..."]
        },
        "treasure": []
      },
      {
        "id": "2",
        "name": "Guard Room",
        "readAloud": "Description with combat setup",
        "dimensions": "25ft x 25ft",
        "lighting": "Torchlight",
        "exits": ["South: Room 1", "East: Room 3"],
        "contents": {"obvious": ["Guards present"], "hidden": ["Hidden cache"]},
        "treasure": [{"item": "Gold pouch", "value": "15gp"}]
      },
      {
        "id": "3",
        "name": "Trap Corridor",
        "readAloud": "Long hallway description",
        "dimensions": "10ft x 60ft",
        "lighting": "Dark",
        "exits": ["West: Room 2", "East: Room 4"],
        "contents": {"obvious": ["Strange floor tiles"], "hidden": ["Trap mechanism"]},
        "treasure": []
      },
      {
        "id": "4",
        "name": "Central Chamber",
        "readAloud": "Large room description for major fight",
        "dimensions": "50ft x 50ft",
        "lighting": "Magical light",
        "exits": ["West: Room 3", "North: Room 5"],
        "contents": {"obvious": ["Enemies"], "hidden": ["Secret door"]},
        "treasure": [{"item": "Chest", "value": "50gp"}]
      },
      {
        "id": "5",
        "name": "Pre-Boss Chamber",
        "readAloud": "Tense description approaching final area",
        "dimensions": "35ft x 35ft",
        "lighting": "Dim",
        "exits": ["South: Room 4", "North: Boss Chamber"],
        "contents": {"obvious": ["Elite guards"], "hidden": ["Warning signs"]},
        "treasure": [{"item": "Key", "value": "opens boss door"}]
      }
    ],
    "encounters": [
      {
        "name": "Entry Guards",
        "location": "Room 2",
        "type": "combat",
        "readAloud": "Combat begins as guards spot intruders",
        "enemies": [
          {
            "name": "Guard",
            "count": 3,
            "cr": "1/8",
            "hp": 11,
            "ac": 16,
            "acType": "chain shirt, shield",
            "speed": "30 ft.",
            "size": "Medium",
            "type": "humanoid",
            "initiative": 1,
            "abilities": {"str": 13, "dex": 12, "con": 12, "int": 10, "wis": 11, "cha": 10},
            "savingThrows": [],
            "skills": ["Perception +2"],
            "resistances": [],
            "immunities": [],
            "senses": "passive Perception 12",
            "languages": "Common",
            "attacks": [
              {"name": "Spear", "type": "melee", "bonus": 3, "reach": "5 ft.", "damage": "1d6+1", "damageType": "piercing", "notes": "or 1d8+1 if two-handed"}
            ],
            "spells": [],
            "traits": [],
            "actions": []
          }
        ],
        "tactics": "Guards raise alarm, fight defensively near door",
        "terrain": "Tables for cover",
        "difficulty": "easy",
        "rewards": {"xp": 75, "loot": [{"item": "Spear", "value": "1gp", "type": "weapon", "effect": "1d6 piercing, thrown (20/60)"}]}
      },
      {
        "name": "Ambush",
        "location": "Room 4",
        "type": "combat",
        "readAloud": "Enemies spring from hiding behind pillars",
        "enemies": [
          {
            "name": "Cultist",
            "count": 4,
            "cr": "1/8",
            "hp": 9,
            "ac": 12,
            "acType": "leather armor",
            "speed": "30 ft.",
            "size": "Medium",
            "type": "humanoid",
            "initiative": 2,
            "abilities": {"str": 11, "dex": 12, "con": 10, "int": 10, "wis": 11, "cha": 10},
            "savingThrows": [],
            "skills": ["Deception +2", "Religion +2"],
            "resistances": [],
            "immunities": [],
            "senses": "passive Perception 10",
            "languages": "Common",
            "attacks": [
              {"name": "Scimitar", "type": "melee", "bonus": 3, "reach": "5 ft.", "damage": "1d6+1", "damageType": "slashing"}
            ],
            "spells": [],
            "traits": [
              {"name": "Dark Devotion", "description": "Advantage on saves vs charmed or frightened"}
            ],
            "actions": []
          },
          {
            "name": "Cult Fanatic",
            "count": 1,
            "cr": "2",
            "hp": 33,
            "ac": 13,
            "acType": "leather armor",
            "speed": "30 ft.",
            "size": "Medium",
            "type": "humanoid",
            "initiative": 4,
            "abilities": {"str": 11, "dex": 14, "con": 12, "int": 10, "wis": 13, "cha": 14},
            "savingThrows": [],
            "skills": ["Deception +4", "Persuasion +4", "Religion +2"],
            "resistances": [],
            "immunities": [],
            "senses": "passive Perception 11",
            "languages": "Common",
            "attacks": [
              {"name": "Dagger", "type": "melee", "bonus": 4, "reach": "5 ft.", "damage": "1d4+2", "damageType": "piercing"}
            ],
            "spells": [
              {"name": "Sacred Flame", "level": 0, "damage": "1d8 radiant", "save": "DC 12 Dex", "range": "60 ft."},
              {"name": "Command", "level": 1, "slots": 4, "effect": "Target obeys one-word command", "save": "DC 12 Wis"},
              {"name": "Inflict Wounds", "level": 1, "damage": "3d10 necrotic", "attack": "+4 melee spell"},
              {"name": "Hold Person", "level": 2, "slots": 3, "effect": "Target paralyzed", "save": "DC 12 Wis", "concentration": true}
            ],
            "traits": [
              {"name": "Dark Devotion", "description": "Advantage on saves vs charmed or frightened"},
              {"name": "Spellcasting", "description": "4th-level spellcaster. Spell save DC 12, +4 to hit with spell attacks. Has 4 1st-level and 3 2nd-level slots."}
            ],
            "actions": []
          }
        ],
        "tactics": "Fanatic casts Hold Person on armored target, then cultists swarm. Fanatic uses Inflict Wounds on restrained enemies.",
        "terrain": "Pillars for cover, raised platform gives +2 to hit for ranged",
        "difficulty": "medium",
        "rewards": {"xp": 250, "loot": [{"item": "Ritual Dagger", "value": "25gp", "type": "weapon", "effect": "1d4 piercing, light, finesse"}, {"item": "Spell Scroll of Shield", "value": "50gp", "type": "scroll", "effect": "Cast Shield as reaction (+5 AC until start of next turn)"}]}
      },
      {
        "name": "Elite Guard",
        "location": "Room 5",
        "type": "combat",
        "readAloud": "The villain's best warriors bar the way, weapons drawn",
        "enemies": [
          {
            "name": "Veteran",
            "count": 2,
            "cr": "3",
            "hp": 58,
            "ac": 17,
            "acType": "splint armor",
            "speed": "30 ft.",
            "size": "Medium",
            "type": "humanoid",
            "initiative": 1,
            "abilities": {"str": 16, "dex": 13, "con": 14, "int": 10, "wis": 11, "cha": 10},
            "savingThrows": [],
            "skills": ["Athletics +5", "Perception +2"],
            "resistances": [],
            "immunities": [],
            "senses": "passive Perception 12",
            "languages": "Common",
            "attacks": [
              {"name": "Longsword", "type": "melee", "bonus": 5, "reach": "5 ft.", "damage": "1d8+3", "damageType": "slashing", "notes": "Multiattack: 2 longsword attacks"},
              {"name": "Heavy Crossbow", "type": "ranged", "bonus": 3, "range": "100/400 ft.", "damage": "1d10+1", "damageType": "piercing"}
            ],
            "spells": [],
            "traits": [
              {"name": "Multiattack", "description": "Makes two longsword attacks. If has shortsword, can make a third attack with it."}
            ],
            "actions": []
          }
        ],
        "tactics": "One holds the chokepoint with longsword while other flanks or uses crossbow. They fight to the death.",
        "terrain": "Narrow doorway, weapon racks (improvised weapons)",
        "difficulty": "hard",
        "rewards": {"xp": 400, "loot": [{"item": "Longsword", "value": "15gp", "type": "weapon", "effect": "1d8 slashing, versatile (1d10)"}, {"item": "Splint Armor", "value": "200gp", "type": "armor", "effect": "AC 17, Disadvantage on Stealth"}, {"item": "Boss Chamber Key", "value": "-", "type": "gear", "effect": "Unlocks boss chamber door"}]}
      }
    ],
    "traps": [
      {
        "name": "Pressure Plate Darts",
        "location": "Room 3",
        "trigger": "Weight on tiles (20+ lbs)",
        "detection": "DC 14 Perception to notice",
        "effect": "2d6 piercing damage",
        "save": "DC 13 Dex save for half",
        "disarm": "DC 12 Thieves' Tools",
        "reset": "Resets after 1 round"
      }
    ],
    "puzzles": [
      {
        "name": "Door Riddle",
        "location": "Between Room 4 and 5",
        "readAloud": "An inscription on the door reads...",
        "solution": "The answer is...",
        "hints": [{"method": "DC 12 Investigation", "reveal": "First hint"}],
        "reward": "Door opens peacefully",
        "failure": "5d6 lightning damage, DC 14 Dex save for half"
      }
    ],
    "transitionToAct3": "Read-aloud text as party approaches the final chamber"
  }
}
\`\`\`

REQUIREMENTS:
- Include exactly 3 COMBAT encounters with DETAILED enemy stat blocks
- Each enemy MUST have: hp, ac, initiative, abilities, attacks (with bonus and damage), and relevant spells/traits
- Encounters should escalate: easy -> medium -> hard
- Include at least 1 trap and 1 puzzle
- Create 5-6 interconnected rooms
- Use SRD monsters appropriate for level ${request.partyLevel}
- Spellcasters must list their spells with damage/effects and save DCs`;
}

// Build prompt for Act 3 + Epilogue
function buildAct3AndEpiloguePrompt(request: CampaignRequest, overviewData: any, act2Data: any): string {
  // Extract throughlines from overview for final payoff
  const throughlines = overviewData.overview?.throughlines || [];
  const throughlineContext = throughlines.map((t: any) =>
    `- ${t.name} (${t.type}): ${t.description}.
      Act 1 established: "${t.act1Hint}"
      Act 2 revealed: "${t.act2Discovery}"
      Act 3 MUST include payoff: "${t.act3Payoff}"`
  ).join('\n');

  // Extract Act 1 context
  const questGiver = overviewData.act1?.questGiver;
  const act1Summary = `Quest Giver: ${questGiver?.name || 'Unknown'} sent party to ${overviewData.act1?.title || 'investigate'}`;

  // Extract Act 2 context - the dungeon and what was discovered
  const act2 = act2Data?.act2;
  const dungeonName = act2?.dungeonOverview?.name || 'the dungeon';
  const roomsSummary = act2?.rooms?.slice(0, 3).map((r: any) => r.name).join(', ') || 'various chambers';
  const encountersSummary = act2?.encounters?.map((e: any) => `${e.name} (${e.location})`).join(', ') || 'several encounters';
  const act2Transition = act2?.transitionToAct3 || 'Party approaches the final chamber';

  return `You are a master D&D 5e Dungeon Master. Create ACT 3 (boss fight) and EPILOGUE for this adventure:

ADVENTURE CONTEXT:
- Title: ${overviewData.title}
- Synopsis: ${overviewData.synopsis}
- Hook: ${overviewData.hook}
- Theme: ${request.theme}
- Party Level: ${request.partyLevel}
- Party Size: ${request.partySize}

STORY SO FAR (must be referenced):
ACT 1: ${act1Summary}
ACT 2: Party explored ${dungeonName}, passing through ${roomsSummary}. They faced ${encountersSummary}.
Transition: ${act2Transition}

NARRATIVE THROUGHLINES - FINAL PAYOFF (these MUST culminate in Act 3):
${throughlineContext || 'No throughlines defined'}

CRITICAL: The villain's dialogue and the boss fight MUST reference and pay off the throughlines established earlier. The weakness discovered should be usable in the fight.

Return ONLY valid JSON with this structure:

\`\`\`json
{
  "act3": {
    "title": "Act 3 Title",
    "estimatedDuration": "30-45 minutes",
    "overview": "The final confrontation",
    "approach": {
      "readAloud": "Description approaching boss chamber - building tension",
      "warnings": "Signs of danger ahead",
      "lastChance": "Final opportunity to prepare"
    },
    "bossEncounter": {
      "chamberDescription": {
        "readAloud": "Boss chamber description (2 paragraphs). Dramatic, atmospheric.",
        "dimensions": "60ft x 60ft",
        "terrain": ["Throne/altar", "Pillars", "Hazardous area"],
        "interactables": ["Chandelier to drop", "Braziers to kick over"]
      },
      "villain": {
        "name": "Villain Name",
        "appearance": "Dramatic physical description",
        "motivation": "Why they're doing this",
        "cr": "4",
        "hp": 85,
        "ac": 15,
        "acType": "natural armor or armor type",
        "speed": "30 ft.",
        "size": "Medium",
        "type": "humanoid/undead/fiend/etc",
        "initiative": 2,
        "abilities": {"str": 16, "dex": 14, "con": 16, "int": 12, "wis": 14, "cha": 16},
        "savingThrows": ["Str +6", "Con +6"],
        "skills": ["Perception +5", "Intimidation +6"],
        "resistances": ["necrotic"],
        "immunities": ["poison", "poisoned condition"],
        "senses": "darkvision 60 ft., passive Perception 15",
        "languages": "Common, one other",
        "attacks": [
          {"name": "Greatsword", "type": "melee", "bonus": 6, "reach": "5 ft.", "damage": "2d6+4", "damageType": "slashing", "notes": "Multiattack: 2 attacks"},
          {"name": "Dark Bolt", "type": "ranged spell", "bonus": 6, "range": "60 ft.", "damage": "2d8+3", "damageType": "necrotic"}
        ],
        "spells": [
          {"name": "Darkness", "level": 2, "slots": 2, "effect": "15ft radius magical darkness", "concentration": true},
          {"name": "Fear", "level": 3, "slots": 1, "effect": "30ft cone, targets frightened", "save": "DC 14 Wis"}
        ],
        "traits": [
          {"name": "Multiattack", "description": "Makes two melee attacks"},
          {"name": "Dark Resilience", "description": "Has advantage on saves vs spells"}
        ],
        "legendaryActions": [
          {"name": "Attack", "cost": 1, "description": "Makes one weapon attack"},
          {"name": "Dark Pulse", "cost": 2, "description": "All creatures within 10 ft take 2d6 necrotic, DC 14 Con save for half"}
        ],
        "legendaryActionCount": 2,
        "dialogue": {
          "onSighting": "What villain says when party enters",
          "monologue": "Brief villain speech revealing motivation",
          "duringCombat": ["Taunt when hitting", "Taunt when damaged"],
          "ifDefeated": "Final words"
        },
        "tactics": {
          "phase1": "Opening tactics at full HP",
          "phase2": "Desperate tactics below half HP",
          "signature": "Their go-to devastating move"
        },
        "weakness": "Exploitable weakness for clever players",
        "morale": "Fight to death or flee at X HP?"
      },
      "minions": [
        {
          "name": "Minion type",
          "count": 2,
          "cr": "1/2",
          "hp": 22,
          "ac": 13,
          "acType": "armor type",
          "speed": "30 ft.",
          "size": "Medium",
          "type": "humanoid",
          "initiative": 1,
          "abilities": {"str": 12, "dex": 12, "con": 12, "int": 10, "wis": 10, "cha": 10},
          "attacks": [
            {"name": "Weapon", "type": "melee", "bonus": 3, "reach": "5 ft.", "damage": "1d6+1", "damageType": "slashing"}
          ],
          "spells": [],
          "traits": [],
          "resistances": [],
          "immunities": []
        }
      ],
      "rewards": {
        "xp": 1100,
        "gold": "200gp",
        "items": [{"name": "Magic Item Name", "type": "weapon|armor|wondrous", "effect": "Mechanical effect (e.g., +1 to attack and damage)", "value": "Worth", "rarity": "uncommon", "attunement": false}],
        "villainLoot": "What's found on the villain's body"
      }
    },
    "aftermath": {
      "readAloud": "Immediate aftermath of victory",
      "discoveries": "What party learns after battle"
    }
  },
  "epilogue": {
    "title": "Epilogue",
    "estimatedDuration": "15-20 minutes",
    "returnToTown": {
      "readAloud": "Arrival back in town - how do people react?",
      "questGiverReaction": "How quest giver responds to success"
    },
    "rewards": {
      "promised": "The agreed reward",
      "bonus": "Extra rewards for exceptional performance",
      "reputation": "How their reputation changed"
    },
    "looseEnds": [
      {"thread": "Unresolved plot point", "hint": "Future hook"}
    ],
    "sequelHooks": [
      {"name": "Next Adventure Hook", "setup": "What hints at future"}
    ],
    "closingNarration": "Final read-aloud wrapping up the adventure"
  }
}
\`\`\`

REQUIREMENTS:
- Boss should be appropriate CR for level ${request.partyLevel} party of ${request.partySize}
- Villain MUST have FULL stat block: hp, ac, initiative, abilities, attacks (with bonus and damage), spells, traits
- If villain is a spellcaster, list ALL spells with damage, save DC, and effects
- Minions must also have full stat blocks
- Include villain dialogue and multiple combat phases (phase1/phase2 tactics)
- Include legendary actions if boss is CR 4+
- Create satisfying epilogue with closure and future hooks
- Include at least one magic item reward with description`;
}

// Generate campaign using Google Gemini API - SPLIT GENERATION
export async function generateCampaign(req: Request, res: Response) {
  try {
    const request: CampaignRequest = req.body;

    if (!request.theme || !request.setting) {
      return res.status(400).json({ error: 'Theme and setting are required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not configured. Add it in Render Environment Variables.' });
    }

    console.log('Starting FUNCTION-CALLING campaign generation with theme:', request.theme, 'setting:', request.setting);

    // FIRST: Generate detailed dungeon map with room outlines
    const dungeonMap = generateProceduralDungeon(request.theme);
    console.log('Pre-generated detailed dungeon map with', dungeonMap.rooms.length, 'rooms');

    // Use function calling to generate the campaign piece by piece
    // This is more reliable than asking for one giant JSON blob
    const campaign = await generateCampaignWithFunctions(request, dungeonMap);

    console.log('Campaign generated successfully:', campaign.title);
    console.log(`  - NPCs: ${campaign.act1?.keyNpcs?.length || 0}`);
    console.log(`  - Shops: ${campaign.act1?.services?.shops?.length || 0}`);
    console.log(`  - Rooms: ${campaign.act2?.rooms?.length || 0}`);
    console.log(`  - Encounters: ${campaign.act2?.encounters?.length || 0}`);

    return res.json(campaign);

  } catch (error) {
    console.error('Unexpected campaign generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Failed to generate campaign',
      details: errorMessage
    });
  }
}

// Legacy single-prompt generation (kept for reference)
export async function generateCampaignLegacy(req: Request, res: Response) {
  try {
    const request: CampaignRequest = req.body;

    if (!request.theme || !request.setting) {
      return res.status(400).json({ error: 'Theme and setting are required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY not configured. Add it in Render Environment Variables.' });
    }

    console.log('Starting LEGACY campaign generation with theme:', request.theme, 'setting:', request.setting);

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

    const jsonStr = extractJsonFromResponse(text);
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

// Jaquays-style procedural dungeon generator
// Creates non-linear dungeons with loops, branches, secrets, and meaningful choices
function generateProceduralDungeon(theme: string): DungeonMap {
  const rooms: DungeonRoom[] = [];
  const keys: DungeonMap['keys'] = [];

  // Utility functions
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const chance = (pct: number): boolean => Math.random() * 100 < pct;

  // Unlock mechanism templates - variety of ways to access locked areas
  const keyTemplates = [
    // Physical keys
    { id: 'iron_key', name: 'Iron Key', desc: 'A heavy iron key with arcane symbols etched into the bow', unlockType: 'key' },
    { id: 'bone_key', name: 'Bone Key', desc: 'A key carved from ancient bone, cold to the touch', unlockType: 'key' },
    { id: 'crystal_key', name: 'Crystal Key', desc: 'A translucent key that hums faintly with magic', unlockType: 'key' },

    // Passphrases and words of power
    { id: 'passphrase_note', name: 'Crumpled Note', desc: 'A note with a passphrase scrawled in blood: "By shadow I enter"', unlockType: 'passphrase' },
    { id: 'command_word', name: 'Guard\'s Orders', desc: 'A scroll listing guard rotations with the command word "Velkarn" circled', unlockType: 'passphrase' },
    { id: 'whispered_secret', name: 'Dying Words', desc: 'The guard captain whispers "Speak \'nightfall\' to the door" as he falls', unlockType: 'passphrase' },

    // Magical items
    { id: 'dispel_scroll', name: 'Dispelling Scroll', desc: 'A scroll of Dispel Magic - the only way to bypass the arcane lock', unlockType: 'scroll' },
    { id: 'ward_breaker', name: 'Enchanted Amulet', desc: 'An amulet that glows near magical wards and can suppress them briefly', unlockType: 'amulet' },
    { id: 'attunement_gem', name: 'Attunement Gem', desc: 'A gem that must be pressed into a matching socket to open the vault', unlockType: 'gem' },

    // Tokens and symbols
    { id: 'skull_medallion', name: 'Skull Medallion', desc: 'A medallion that must be worn to pass through the skeletal gate', unlockType: 'medallion' },
    { id: 'cult_sigil', name: 'Cult Signet Ring', desc: 'A ring bearing the cult\'s symbol - the door recognizes its wearer', unlockType: 'ring' },
    { id: 'blood_vial', name: 'Vial of Blood', desc: 'A vial of the cult leader\'s blood needed to anoint the door', unlockType: 'blood' },

    // Knowledge and patterns
    { id: 'combination_clue', name: 'Torn Journal Page', desc: 'A page showing a sequence of symbols that match the lock\'s dials', unlockType: 'combination' },
    { id: 'musical_notes', name: 'Sheet Music', desc: 'A melody that must be played on the enchanted door chimes', unlockType: 'music' },
    { id: 'rune_sequence', name: 'Rune Rubbing', desc: 'A rubbing of runes that must be traced on the sealed door', unlockType: 'runes' },
  ];

  // Guardian templates for treasure rooms
  const guardianTemplates = [
    { type: 'combat' as const, desc: 'Animated armor stands guard, attacking any who approach the treasure' },
    { type: 'combat' as const, desc: 'A bound elemental protects this hoard, attacking intruders on sight' },
    { type: 'trap' as const, desc: 'Poison gas fills the room when treasure is disturbed (DC 14 Con save)' },
    { type: 'trap' as const, desc: 'Floor tiles collapse into a spike pit when weight is removed from pedestals' },
    { type: 'puzzle' as const, desc: 'Treasure is sealed behind a combination lock - clues are hidden in previous rooms' },
    { type: 'puzzle' as const, desc: 'Three statues must be rotated to face the correct directions to unlock the vault' },
    { type: 'guardian_spirit' as const, desc: 'A spectral guardian demands proof of worth - answer its riddle or face combat' },
    { type: 'curse' as const, desc: 'The treasure is cursed - taking it without the blessing triggers a curse (DC 15 Wis save)' },
  ];

  // Ritual effect templates (weaken the boss)
  const ritualEffects = [
    { desc: 'Dark priests channel power to the boss', bossDebuff: 'Boss loses one Legendary Resistance' },
    { desc: 'A blood ritual strengthens the boss\'s defenses', bossDebuff: 'Boss AC reduced by 2' },
    { desc: 'Soul-binding ritual empowers the boss', bossDebuff: 'Boss starts combat with 75% HP instead of full' },
    { desc: 'Summoning circle calls reinforcements', bossDebuff: 'No additional minions spawn during boss fight' },
    { desc: 'Ward stones protect the inner sanctum', bossDebuff: 'Boss loses damage resistance' },
  ];

  // Secret entrance templates with discovery methods
  const secretEntranceTemplates = [
    {
      name: 'Collapsed Sewer Grate',
      desc: 'A forgotten sewer tunnel leads into the dungeon basement',
      leadsTo: 'hub', // connects to central hub area
      advantages: ['Bypasses main entrance guards', 'Surprise attack opportunity'],
      discoveryMethods: [
        { type: 'tracks' as const, desc: 'DC 14 Survival check near the dungeon reveals boot prints leading to a drainage ditch', dcCheck: 14, skillCheck: 'Survival' },
        { type: 'npc_info' as const, desc: 'A homeless beggar near the dungeon noticed cultists using a sewer grate - DC 12 Persuasion or 5gp', dcCheck: 12, skillCheck: 'Persuasion', cost: '5gp' },
        { type: 'map' as const, desc: 'Old city sewer maps can be found in the town archives or purchased from a shady dealer for 25gp', cost: '25gp' },
      ],
    },
    {
      name: 'Hidden Cave Entrance',
      desc: 'A natural cave system connects to the dungeon\'s lower levels',
      leadsTo: 'antechamber', // connects near boss area
      advantages: ['Skips most of dungeon', 'Natural cover', 'Element of surprise on boss'],
      discoveryMethods: [
        { type: 'tracks' as const, desc: 'DC 16 Perception check while circling the dungeon exterior reveals disturbed vegetation hiding a cave mouth', dcCheck: 16, skillCheck: 'Perception' },
        { type: 'npc_info' as const, desc: 'An old ranger/hunter knows of caves in the area - DC 15 Persuasion or doing them a favor', dcCheck: 15, skillCheck: 'Persuasion', npcName: 'Old Hunter' },
        { type: 'research' as const, desc: 'DC 14 Investigation in local library reveals geological surveys mentioning cave systems', dcCheck: 14, skillCheck: 'Investigation' },
      ],
    },
    {
      name: 'Thieves\' Tunnel',
      desc: 'A secret passage used by rogues and smugglers',
      leadsTo: 'treasure', // connects to treasure room
      advantages: ['Direct access to treasure', 'Avoids most combat', 'Known escape route'],
      discoveryMethods: [
        { type: 'npc_info' as const, desc: 'The local thieves\' guild knows the tunnel - DC 16 Persuasion, 50gp bribe, or completing a job for them', dcCheck: 16, skillCheck: 'Persuasion', cost: '50gp', npcName: 'Guild Contact' },
        { type: 'map' as const, desc: 'A treasure map/smuggler\'s chart can be pickpocketed (DC 15) or bought from a fence for 40gp', dcCheck: 15, skillCheck: 'Sleight of Hand', cost: '40gp' },
        { type: 'exploration' as const, desc: 'DC 18 Investigation in the slums reveals a hidden door in an abandoned building', dcCheck: 18, skillCheck: 'Investigation' },
      ],
    },
  ];

  // Environmental storytelling templates
  const storyElementTemplates = [
    {
      type: 'dead_adventurer' as const,
      name: 'Fallen Hero',
      desc: 'The skeletal remains of an adventurer slumped against the wall, hand still clutching a journal',
      loot: ['Tattered journal with dungeon notes', 'Potion of Healing', '15gp in a belt pouch'],
      clues: ['Journal describes trap in next room', 'Mentions "the ritual weakens him"', 'Drew partial map before dying'],
    },
    {
      type: 'dead_adventurer' as const,
      name: 'Trapped Explorer',
      desc: 'A body impaled by spikes, still wearing scorched adventuring gear',
      loot: ['Singed spellbook (1d4 random spells)', 'Ring of Protection (cracked, +1 AC until next long rest)'],
      clues: ['Burn marks suggest fire trap', 'Footprints show they were running from something'],
    },
    {
      type: 'previous_expedition' as const,
      name: 'Abandoned Camp',
      desc: 'A hastily abandoned campsite with scattered supplies and signs of struggle',
      loot: ['Rations (3 days)', 'Rope (50ft)', 'Lantern with oil'],
      clues: ['Camp log mentions "too many guards for a frontal assault"', 'Map fragment showing secret entrance', 'Note: "Meet Garrett at the Rusty Nail tavern if we fail"'],
    },
    {
      type: 'ancient_battle' as const,
      name: 'Old Battlefield',
      desc: 'Scorch marks, weapon gouges, and ancient bloodstains tell of a battle long past',
      loot: ['Ancient weapon (functional but worn)', 'Tarnished medal of valor'],
      clues: ['Carvings show this was once a holy site', 'The defenders made their last stand here against the current occupants'],
    },
    {
      type: 'warning_signs' as const,
      name: 'Desperate Warning',
      desc: 'Words scratched into the wall: "TURN BACK" and "IT KNOWS YOU\'RE HERE"',
      loot: [],
      clues: ['The boss has some form of awareness/scrying', 'Previous victims tried to warn others'],
    },
    {
      type: 'ritual_aftermath' as const,
      name: 'Failed Ritual Site',
      desc: 'A broken summoning circle with charred remains and shattered crystals',
      loot: ['Intact crystal worth 25gp', 'Ritual components (arcana check reveals purpose)'],
      clues: ['Someone tried to summon something and failed', 'The current ritual is a second attempt', 'Notes suggest the ritual needs to be stopped before midnight'],
    },
    {
      type: 'natural_disaster' as const,
      name: 'Cave-In Zone',
      desc: 'Collapsed ceiling with rubble, dust, and unstable rocks overhead',
      loot: ['Crushed supply crate with salvageable gear'],
      clues: ['Recent collapse suggests structural weakness', 'Could be used tactically in combat', 'Alternate route may be safer'],
    },
  ];

  // Cave room templates for natural sections
  const caveRoomTemplates = [
    { name: 'Fungal Grotto', features: ['Bioluminescent mushrooms', 'Spore clouds (DC 12 Con or poisoned)', 'Soft earth floor'] },
    { name: 'Underground Stream', features: ['Flowing water (difficult terrain)', 'Slippery rocks', 'Echo carries sound'] },
    { name: 'Crystal Cavern', features: ['Reflective crystals', 'Light sources create dazzling effect', 'Valuable gems (DC 15 to harvest)'] },
    { name: 'Bat Colony', features: ['Thousands of bats (can be startled)', 'Guano-covered floor (slippery)', 'High ceiling with stalactites'] },
    { name: 'Subterranean Lake', features: ['Dark still water', 'Unknown depth', 'Something moves beneath the surface'] },
  ];

  // === DUNGEON STRUCTURE ===
  // We'll build: Critical Path + Side Branches + Secret Areas + Shortcuts

  // CRITICAL PATH: Entrance -> Combat -> Challenge -> Antechamber -> Boss (4-5 rooms)
  // SIDE BRANCHES: 2-3 optional areas with guarded treasure, rituals, or secrets
  // SHORTCUTS: Hidden passages that skip rooms or loop back

  const criticalPath: Array<{
    type: DungeonRoom['type'];
    name: string;
    contentFlags: DungeonRoom['contentFlags'];
    outline: string;
    pathType: 'critical' | 'optional' | 'secret' | 'shortcut';
  }> = [
    {
      type: 'entrance',
      name: pick(['Grand Entrance', 'Dungeon Gate', 'Ancient Doorway', 'Cavern Mouth']),
      contentFlags: {},
      outline: 'Entry point. Environmental storytelling. Hints about dangers ahead and optional paths.',
      pathType: 'critical',
    },
    {
      type: 'room',
      name: pick(['Guard Post', 'Watchroom', 'Sentry Hall', 'Patrol Station']),
      contentFlags: { hasBattle: true },
      outline: 'First combat encounter. Guards/sentries. One guard carries a key to a locked side room.',
      pathType: 'critical',
    },
    {
      type: 'room',
      name: pick(['Central Hub', 'Crossroads Chamber', 'Great Hall', 'Junction Room']),
      contentFlags: { hasPuzzle: true },
      outline: 'Hub room with multiple exits. Puzzle or skill challenge. Visible locked door to optional area. Secret door (DC 15) to shortcut.',
      pathType: 'critical',
    },
    {
      type: 'room',
      name: pick(['Antechamber', 'Threshold', 'Gate Room', 'Final Passage']),
      contentFlags: { hasBattle: true, hasTrap: true },
      outline: 'Final challenge before boss. Elite guards or dangerous trap. Optional: ritual chamber accessible from here.',
      pathType: 'critical',
    },
    {
      type: 'boss',
      name: pick(['Throne Room', 'Inner Sanctum', 'Dark Heart', 'Final Chamber']),
      contentFlags: { isBoss: true, hasBattle: true, hasTreasure: true },
      outline: 'Boss encounter with lair actions. Treasure hoard. Difficulty may be reduced if rituals were stopped.',
      pathType: 'critical',
    },
  ];

  // SIDE BRANCHES (optional content - off the critical path)
  const sideBranches: typeof criticalPath = [
    {
      type: 'treasure',
      name: pick(['Locked Vault', 'Hidden Treasury', 'Sealed Hoard', 'Forgotten Cache']),
      contentFlags: { hasTreasure: true, isOptional: true },
      outline: 'LOCKED: Requires key from Guard Post. Guarded treasure - not free! Combat/trap/puzzle guardian.',
      pathType: 'optional',
    },
    {
      type: 'room',
      name: pick(['Ritual Chamber', 'Dark Shrine', 'Profane Altar', 'Summoning Circle']),
      contentFlags: { hasBattle: true, isRitual: true, isOptional: true },
      outline: 'RITUAL: Cultists performing dark rite. If stopped, boss is weakened. Combat encounter.',
      pathType: 'optional',
    },
    {
      type: 'secret',
      name: pick(['Hidden Armory', 'Secret Cache', 'Concealed Study', 'Lost Chamber']),
      contentFlags: { hasTreasure: true, hasSecret: true, isOptional: true },
      outline: 'SECRET: DC 18 Perception to find. Contains powerful magic item. Trapped entrance.',
      pathType: 'secret',
    },
  ];

  // SHORTCUTS (secret passages that create loops)
  const shortcuts: typeof criticalPath = [
    {
      type: 'corridor',
      name: pick(['Hidden Passage', 'Secret Tunnel', 'Concealed Route', 'Shadow Path']),
      contentFlags: { hasSecret: true, isOptional: true },
      outline: 'SHORTCUT: Secret passage from Central Hub directly to Antechamber. Bypasses some content but also some loot.',
      pathType: 'shortcut',
    },
  ];

  // === LAYOUT GENERATION ===
  // Grid-based layout with positions
  // Critical path goes roughly left-to-right
  // Branches go north/south from hub room
  // Shortcuts create diagonal connections

  interface RoomDef {
    template: typeof criticalPath[0];
    x: number;
    y: number;
    connections: string[];
    exits: string[];
  }

  const roomDefs: RoomDef[] = [];

  // Position critical path (horizontal, center of grid)
  const centerY = 2; // Middle of a 5-tall grid

  criticalPath.forEach((template, i) => {
    roomDefs.push({
      template,
      x: i * 1.2, // Slight offset to create visual interest
      y: centerY + (i % 2 === 0 ? 0 : (chance(50) ? -0.3 : 0.3)),
      connections: [],
      exits: [],
    });
  });

  // Connect critical path linearly
  for (let i = 0; i < roomDefs.length - 1; i++) {
    const currentId = `room-${i + 1}`;
    const nextId = `room-${i + 2}`;
    roomDefs[i].connections.push(nextId);
  }

  // Add side branches off the hub room (index 2)
  const hubIndex = 2;
  const hubRoom = roomDefs[hubIndex];

  // Locked treasure room (north of hub)
  const treasureRoom = sideBranches[0];
  const treasureIndex = roomDefs.length;
  roomDefs.push({
    template: treasureRoom,
    x: hubRoom.x + 0.5,
    y: hubRoom.y - 1.2,
    connections: [],
    exits: [],
  });

  // Connect hub to treasure (but it's locked!)
  const treasureRoomId = `room-${treasureIndex + 1}`;
  hubRoom.connections.push(treasureRoomId);

  // Create unlock mechanism for treasure room (found in guard room, index 1)
  const keyTemplate = pick(keyTemplates.filter(k => !keys.find(existing => existing.id === k.id)));
  keys.push({
    id: keyTemplate.id,
    name: keyTemplate.name,
    description: keyTemplate.desc,
    locationRoomId: 'room-2', // Guard room
    unlocksRoomId: treasureRoomId,
    unlockType: keyTemplate.unlockType,
  });

  // Ritual room (south of antechamber, index 3)
  const antechamberIndex = 3;
  const antechamber = roomDefs[antechamberIndex];
  const ritualRoom = sideBranches[1];
  const ritualIndex = roomDefs.length;
  roomDefs.push({
    template: ritualRoom,
    x: antechamber.x - 0.3,
    y: antechamber.y + 1.2,
    connections: [],
    exits: [],
  });

  // Connect antechamber to ritual room
  const ritualRoomId = `room-${ritualIndex + 1}`;
  antechamber.connections.push(ritualRoomId);

  // Secret room (off the guard room, but hidden)
  const guardIndex = 1;
  const guardRoom = roomDefs[guardIndex];
  const secretRoom = sideBranches[2];
  const secretIndex = roomDefs.length;
  roomDefs.push({
    template: secretRoom,
    x: guardRoom.x,
    y: guardRoom.y - 1,
    connections: [],
    exits: [],
  });

  // Secret connection (marked as secret)
  const secretRoomId = `room-${secretIndex + 1}`;
  guardRoom.connections.push(secretRoomId);

  // Shortcut passage (from hub to antechamber)
  const shortcut = shortcuts[0];
  const shortcutIndex = roomDefs.length;
  roomDefs.push({
    template: shortcut,
    x: (hubRoom.x + antechamber.x) / 2,
    y: centerY - 1,
    connections: [],
    exits: [],
  });

  const shortcutRoomId = `room-${shortcutIndex + 1}`;
  // Hub has secret exit to shortcut
  hubRoom.connections.push(shortcutRoomId);
  // Shortcut connects to antechamber
  roomDefs[shortcutIndex].connections.push(`room-${antechamberIndex + 1}`);

  // === CREATE FINAL ROOMS ===
  const directions = ['North', 'South', 'East', 'West'];
  const exitTypes = ['door', 'archway', 'passage', 'stairs', 'tunnel', 'gate'];

  function getDirection(from: RoomDef, to: RoomDef): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'East' : 'West';
    }
    return dy < 0 ? 'North' : 'South';
  }

  roomDefs.forEach((def, index) => {
    const roomIdStr = `room-${index + 1}`;
    const isTreasure = def.template.type === 'treasure';
    const isRitual = def.template.contentFlags?.isRitual;
    const isSecret = def.template.pathType === 'secret';
    const isShortcut = def.template.pathType === 'shortcut';

    // Build exits based on connections
    const exits: string[] = [];
    def.connections.forEach(targetId => {
      const targetIndex = parseInt(targetId.split('-')[1]) - 1;
      const targetDef = roomDefs[targetIndex];
      const dir = getDirection(def, targetDef);
      const exitType = pick(exitTypes);

      let exitDesc = `${dir} ${exitType} to ${targetDef.template.name} (${targetId})`;

      // Add access requirement notes with unlock-type-specific language
      if (targetDef.template.type === 'treasure' && keys.find(k => k.unlocksRoomId === targetId)) {
        const key = keys.find(k => k.unlocksRoomId === targetId)!;
        switch (key.unlockType) {
          case 'passphrase':
            exitDesc += ` [SEALED - responds to spoken passphrase]`;
            break;
          case 'scroll':
            exitDesc += ` [WARDED - arcane lock, requires dispelling]`;
            break;
          case 'medallion':
          case 'ring':
            exitDesc += ` [SEALED - requires bearing the correct symbol]`;
            break;
          case 'blood':
            exitDesc += ` [BLOOD SEALED - requires blood offering]`;
            break;
          case 'combination':
            exitDesc += ` [COMBINATION LOCK - needs correct sequence]`;
            break;
          case 'music':
            exitDesc += ` [CHIME LOCK - requires playing correct melody]`;
            break;
          case 'runes':
            exitDesc += ` [RUNE SEALED - glyphs must be traced correctly]`;
            break;
          default:
            exitDesc += ` [LOCKED - requires ${key.name}]`;
        }
      }
      if (targetDef.template.pathType === 'secret') {
        exitDesc += ` [SECRET - DC 18 Perception]`;
      }
      if (targetDef.template.pathType === 'shortcut') {
        exitDesc += ` [HIDDEN - DC 15 Investigation]`;
      }

      exits.push(exitDesc);
    });

    // Add back-connections for navigation
    roomDefs.forEach((otherDef, otherIndex) => {
      if (otherDef.connections.includes(roomIdStr) && !def.connections.includes(`room-${otherIndex + 1}`)) {
        const dir = getDirection(def, otherDef);
        exits.push(`${dir} back to ${otherDef.template.name} (room-${otherIndex + 1})`);
      }
    });

    // Build access requirements
    let accessRequirement: DungeonRoom['accessRequirement'] = undefined;

    if (isTreasure) {
      const key = keys.find(k => k.unlocksRoomId === roomIdStr);
      if (key) {
        const locationName = roomDefs[parseInt(key.locationRoomId.split('-')[1]) - 1].template.name;

        // Generate unlock-type-specific description
        let unlockDesc = '';
        switch (key.unlockType) {
          case 'passphrase':
            unlockDesc = `Sealed by magic - speaking the correct passphrase opens the door. ${key.name} in ${locationName} contains the words.`;
            break;
          case 'scroll':
            unlockDesc = `Protected by an arcane lock. ${key.name} from ${locationName} can dispel the ward.`;
            break;
          case 'medallion':
          case 'ring':
            unlockDesc = `The door only opens for those bearing the correct symbol. ${key.name} from ${locationName} grants passage.`;
            break;
          case 'blood':
            unlockDesc = `A blood seal protects this entrance. ${key.name} from ${locationName} can satisfy it.`;
            break;
          case 'gem':
          case 'amulet':
            unlockDesc = `A magical socket awaits the correct focus. ${key.name} from ${locationName} fits perfectly.`;
            break;
          case 'combination':
            unlockDesc = `A complex lock with multiple dials. ${key.name} from ${locationName} shows the correct sequence.`;
            break;
          case 'music':
            unlockDesc = `Enchanted chimes guard the entrance. ${key.name} from ${locationName} reveals the melody to play.`;
            break;
          case 'runes':
            unlockDesc = `Glowing runes seal the door. ${key.name} from ${locationName} shows how to trace them correctly.`;
            break;
          default: // 'key'
            unlockDesc = `A sturdy lock bars entry. ${key.name} from ${locationName} opens it.`;
        }

        accessRequirement = {
          type: 'key',
          keyId: key.id,
          keyLocation: key.locationRoomId,
          description: unlockDesc,
        };
      }
    }

    if (isSecret) {
      accessRequirement = {
        type: 'secret',
        dcCheck: 18,
        description: 'Hidden door - DC 18 Perception to notice the concealed entrance',
      };
    }

    if (isShortcut) {
      accessRequirement = {
        type: 'secret',
        dcCheck: 15,
        description: 'Secret passage - DC 15 Investigation to find the hidden mechanism',
      };
    }

    // Build guardian for treasure rooms
    let guardian: DungeonRoom['guardian'] = undefined;
    if (isTreasure) {
      const guardianTemplate = pick(guardianTemplates);
      guardian = {
        type: guardianTemplate.type,
        description: guardianTemplate.desc,
      };
    }

    // Build ritual effect
    let ritualEffect: DungeonRoom['ritualEffect'] = undefined;
    if (isRitual) {
      const effect = pick(ritualEffects);
      ritualEffect = {
        description: effect.desc,
        bossDebuff: effect.bossDebuff,
      };
    }

    // Enhanced outline based on room type
    let outline = def.template.outline;
    if (guardian) {
      outline += ` GUARDIAN: ${guardian.description}`;
    }
    if (ritualEffect) {
      outline += ` RITUAL EFFECT: If stopped - ${ritualEffect.bossDebuff}`;
    }
    if (accessRequirement) {
      outline += ` ACCESS: ${accessRequirement.description}`;
    }

    // Add unlock mechanism placement info to guard room
    if (index === 1) { // Guard room
      const placedKeys = keys.filter(k => k.locationRoomId === roomIdStr);
      if (placedKeys.length > 0) {
        const keyDescriptions = placedKeys.map(k => {
          switch (k.unlockType) {
            case 'passphrase':
              return `${k.name} (on guard captain's body or hidden in desk)`;
            case 'scroll':
              return `${k.name} (in guard captain's spell pouch)`;
            case 'medallion':
            case 'ring':
              return `${k.name} (worn by guard captain)`;
            case 'blood':
              return `${k.name} (in locked cabinet, DC 12 to pick)`;
            case 'combination':
              return `${k.name} (tucked in guard captain's logbook)`;
            case 'music':
              return `${k.name} (pinned to notice board)`;
            case 'runes':
              return `${k.name} (rolled up in map case)`;
            default:
              return `${k.name} (carried by guard captain)`;
          }
        });
        outline += ` UNLOCK MECHANISM HERE: ${keyDescriptions.join('; ')}`;
      }
    }

    rooms.push({
      id: roomIdStr,
      x: Math.round(def.x * 5),
      y: Math.round(def.y * 5),
      width: def.template.type === 'boss' ? 4 : def.template.type === 'corridor' ? 2 : 3,
      height: def.template.type === 'boss' ? 4 : def.template.type === 'corridor' ? 3 : 3,
      type: def.template.type,
      name: def.template.name,
      description: `A ${def.template.type} in the ${theme} dungeon.`,
      connections: def.connections,
      features: generateRoomFeatures(def.template.type),
      exits,
      contentFlags: { ...def.template.contentFlags },
      outline,
      pathType: def.template.pathType,
      accessRequirement,
      guardian,
      ritualEffect,
    });
  });

  // === ADD SECRET ENTRANCES ===
  // Pick 1-2 secret entrances based on dungeon size
  const numSecretEntrances = chance(60) ? 2 : 1;
  const selectedEntrances = [...secretEntranceTemplates]
    .sort(() => Math.random() - 0.5)
    .slice(0, numSecretEntrances);

  const secretEntrances: DungeonMap['secretEntrances'] = selectedEntrances.map((template, i) => {
    // Determine which room this entrance leads to
    let leadsToRoomId = 'room-3'; // Default to hub
    if (template.leadsTo === 'antechamber') {
      leadsToRoomId = 'room-4';
    } else if (template.leadsTo === 'treasure') {
      leadsToRoomId = 'room-6'; // Treasure room
    }

    // Add the secret entrance as a room
    const entranceRoomId = `room-${rooms.length + 1}`;
    const targetRoom = rooms.find(r => r.id === leadsToRoomId);

    // Create a cave passage room for this entrance
    const caveTemplate = pick(caveRoomTemplates);
    rooms.push({
      id: entranceRoomId,
      x: -4 - (i * 5), // Position off to the left
      y: 10 + (i * 3),
      width: 3,
      height: 3,
      type: 'secret',
      name: template.name,
      description: template.desc,
      connections: [leadsToRoomId],
      features: caveTemplate.features,
      exits: [`East passage to ${targetRoom?.name || 'dungeon interior'} (${leadsToRoomId})`],
      contentFlags: { isSecretEntrance: true, isCave: true, isOptional: true },
      outline: `SECRET ENTRANCE: ${template.desc}. ADVANTAGES: ${template.advantages.join(', ')}. This is a natural cave passage with ${caveTemplate.name.toLowerCase()} features.`,
      pathType: 'secret_entrance',
      terrain: 'cave',
    });

    // Add connection from target room back to this entrance
    if (targetRoom) {
      targetRoom.connections.push(entranceRoomId);
      targetRoom.exits = targetRoom.exits || [];
      targetRoom.exits.push(`West hidden passage to ${template.name} (${entranceRoomId}) [SECRET EXIT - DC 14 Perception]`);
    }

    return {
      id: `secret-entrance-${i + 1}`,
      name: template.name,
      description: template.desc,
      leadsToRoomId,
      discoveryMethods: template.discoveryMethods.map(dm => ({
        type: dm.type,
        description: dm.desc,
        dcCheck: (dm as { dcCheck?: number }).dcCheck,
        skillCheck: (dm as { skillCheck?: string }).skillCheck,
        npcName: (dm as { npcName?: string }).npcName,
        cost: (dm as { cost?: string }).cost,
      })),
      advantages: template.advantages,
    };
  });

  // === ADD ENVIRONMENTAL STORYTELLING ===
  // Add 2-3 story elements to existing rooms
  const numStoryElements = 2 + (chance(50) ? 1 : 0);
  const shuffledStoryElements = [...storyElementTemplates].sort(() => Math.random() - 0.5);
  const storyElements: DungeonMap['storyElements'] = [];

  // Rooms that can have story elements (not entrance or boss)
  const eligibleRooms = rooms.filter(r =>
    r.pathType === 'critical' &&
    r.type !== 'entrance' &&
    r.type !== 'boss' &&
    !r.storyElement
  );

  for (let i = 0; i < Math.min(numStoryElements, eligibleRooms.length, shuffledStoryElements.length); i++) {
    const storyTemplate = shuffledStoryElements[i];
    const targetRoom = eligibleRooms[i];

    // Add story element to the room
    targetRoom.storyElement = {
      type: storyTemplate.type,
      description: storyTemplate.desc,
      loot: storyTemplate.loot,
      clues: storyTemplate.clues,
    };

    // Update room outline
    targetRoom.outline += ` STORY ELEMENT: ${storyTemplate.name} - ${storyTemplate.desc}`;
    if (storyTemplate.clues.length > 0) {
      targetRoom.outline += ` CLUES: ${storyTemplate.clues.join('; ')}`;
    }

    storyElements.push({
      id: `story-${i + 1}`,
      name: storyTemplate.name,
      description: storyTemplate.desc,
      roomId: targetRoom.id,
      type: storyTemplate.type,
      loot: storyTemplate.loot,
      clues: storyTemplate.clues,
    });
  }

  // === ADD CAVE SECTION ===
  // 50% chance to have a natural cave area (if secret entrance with cave exists, guaranteed)
  const hasCaveSections = secretEntrances.length > 0 || chance(50);

  if (hasCaveSections) {
    // Mark the shortcut passage as a cave
    const shortcutRoom = rooms.find(r => r.pathType === 'shortcut');
    if (shortcutRoom) {
      const caveTemplate = pick(caveRoomTemplates);
      shortcutRoom.terrain = 'cave';
      shortcutRoom.contentFlags = { ...shortcutRoom.contentFlags, isCave: true };
      shortcutRoom.features = caveTemplate.features;
      shortcutRoom.name = caveTemplate.name;
      shortcutRoom.outline += ` TERRAIN: Natural cave with ${caveTemplate.features.join(', ')}.`;
    }
  }

  return {
    name: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Dungeon`,
    width: 30,
    height: 30,
    rooms,
    theme,
    keys,
    secretEntrances,
    storyElements,
    hasCaveSections,
    ritualCount: rooms.filter(r => r.ritualEffect).length,
    secretCount: rooms.filter(r => r.pathType === 'secret').length,
    shortcutCount: rooms.filter(r => r.pathType === 'shortcut').length,
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
        "keyInformation": ["SPECIFIC rumor about the villain or dungeon BY NAME", "SPECIFIC warning about a monster TYPE that appears in Act 2"],
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
        "keyInformation": ["SPECIFIC advice about fighting a monster type FROM Act 2 (e.g., 'Aim for the eyes' grants +1 to hit)", "Knows a shortcut or danger in the journey to the dungeon"],
        "services": [{"item": "Weapon repair", "cost": "5gp"}, {"item": "Silvered weapon coating", "cost": "100gp", "effect": "Weapon counts as silvered for 24 hours"}, {"item": "Armor fitting", "cost": "50gp", "effect": "+1 AC for 1 day"}]
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
        "keyInformation": ["Has a SPECIFIC item useful against the dungeon's hazards (name it)", "Heard traders talk about the dungeon's history (SPECIFIC detail)"],
        "services": [{"item": "Potion of Healing", "cost": "50gp", "effect": "Restores 2d4+2 HP"}, {"item": "Antitoxin", "cost": "50gp", "effect": "Advantage on poison saves for 1 hour"}, {"item": "Rope (50ft)", "cost": "1gp"}, {"item": "Torch (10)", "cost": "1gp"}]
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
        "keyInformation": ["SPECIFIC spiritual insight about the villain's nature or weakness", "Had a dream/vision about a SPECIFIC room or trap in the dungeon"],
        "services": [{"item": "Cure Wounds spell", "cost": "10gp donation", "effect": "Restores 1d8+3 HP"}, {"item": "Lesser Restoration spell", "cost": "40gp donation", "effect": "Cures one condition"}, {"item": "Bless scroll", "cost": "25gp donation", "effect": "1 hour of Bless spell"}]
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
        "keyInformation": ["Knows the dungeon's REAL NAME and who built it", "Remembers what killed the last adventurers (SPECIFIC monster from Act 2)", "Knows about a secret door or alternate path (SPECIFIC room number)"],
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
        "keyInformation": ["Cryptically hints at the villain's TRUE motivation (be specific)", "Knows about a hidden treasure in a SPECIFIC room number"],
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
        {
          "name": "Shop Name",
          "keeper": "Shopkeeper Name",
          "shopType": "general|blacksmith|apothecary|magic|weaponsmith|armorsmith",
          "inventory": [
            {
              "item": "Item Name",
              "cost": "Price (e.g., 50gp)",
              "type": "weapon|armor|potion|scroll|gear|tool|consumable|magic",
              "effect": "Mechanical effect if applicable (e.g., '1d8 slashing, versatile (1d10)' for weapon, '+2 AC' for armor, 'Restores 2d4+2 HP' for potion)",
              "rarity": "common|uncommon|rare",
              "description": "Brief description"
            }
          ]
        }
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
        "name": "Room Name (be descriptive: 'Flooded Entry Hall' not just 'Room 1')",
        "type": "entrance/corridor/combat/trap/puzzle/treasure/boss-antechamber",
        "readAloud": "Detailed room description (2-3 paragraphs). IMPORTANT: If this room has a trap or puzzle, describe the visible elements here (pressure plates, strange symbols, etc). If combat, describe signs of enemies.",
        "dimensions": "30ft x 40ft",
        "lighting": "Dim light from...",
        "exits": ["North: wooden door to Room 2", "East: collapsed tunnel (leads to Room 3)"],
        "contents": {
          "obvious": ["What's immediately visible - include trap/puzzle visual elements if applicable"],
          "hidden": ["What DC 15 Perception reveals", "What DC 12 Investigation finds"]
        },
        "trapOrPuzzle": "If this room has a trap or puzzle, describe it HERE and make sure readAloud mentions the visual clues. Otherwise set to null.",
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
        "rewards": {"xp": 100, "loot": [{"item": "Item Name", "value": "Price", "type": "weapon|armor|consumable|treasure|gear", "effect": "Mechanical effect if any"}]}
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
        "rewards": {"xp": 200, "loot": [{"item": "Item Name", "value": "Price", "type": "weapon|armor|consumable|treasure|gear", "effect": "Mechanical effect if any"}]}
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
        "rewards": {"xp": 300, "loot": [{"item": "Item Name", "value": "Price", "type": "weapon|armor|consumable|treasure|gear", "effect": "Mechanical effect if any"}]}
      }
    ],

    "traps": [
      {
        "name": "Trap Name",
        "roomId": "MUST match a room id from the rooms array above",
        "location": "Specific location within that room (e.g., 'the third flagstone from the door')",
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
        "roomId": "MUST match a room id from the rooms array above",
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
        "items": [{"name": "Item Name", "type": "weapon|armor|consumable|magic|treasure", "effect": "Mechanical effect (e.g., +1 to hit, 1d8+1 damage, restores 4d4+4 HP)", "value": "Worth", "rarity": "common|uncommon|rare", "attunement": false}],
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
12. Ensure the adventure can be completed in approximately ${sessionHours} hours

CONSISTENCY REQUIREMENTS (VERY IMPORTANT):
13. **NPC INFORMATION MUST BE REAL**: Every piece of "keyInformation" or "gossip" an NPC shares MUST reference actual elements from this adventure:
    - Mention the villain by name
    - Reference the dungeon/location by name
    - Describe threats that actually appear in Act 2
    - Share rumors that are TRUE within this adventure
    - If an NPC says "I know about X", you MUST include what X actually is
14. **ITEMS FOR SALE MUST BE SPECIFIC**: When an NPC offers items, potions, or gear:
    - Include the exact item name (e.g., "Potion of Healing" not "rare potion")
    - Include the price in gold pieces
    - Include what it does (e.g., "restores 2d4+2 HP")
    - If magical, describe the effect briefly
15. **ACT 2 ROOMS MUST BE SEQUENTIAL**: Number rooms 1, 2, 3, 4, 5, etc. in the order players encounter them. The first room is the entrance, the last is before the boss.
16. **ENCOUNTERS MATCH ROOMS**: Each encounter's "location" field must match an actual room id/number. Room 1 = Entry encounter, Room 3-4 = Mid-dungeon, Room 5+ = Pre-boss.
17. **TRAPS/PUZZLES IN ROOMS**: When a room contains a trap or puzzle, the room's "readAloud" description MUST describe the trap/puzzle elements. Don't have a "trap room" with a description of "empty corridor".
18. **ROOM TYPES MATCH CONTENT**: If you define a room as containing a trap, the trap details must be in that room's description. Same for puzzles and treasure.
19. **NO EMPTY PROMISES**: If an NPC says "I can help you with X" or "I have something that might aid you", you MUST specify exactly what that help/item is.`;
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
