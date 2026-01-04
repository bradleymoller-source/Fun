import { z } from 'zod';
import { IdSchema } from './common.schema';

// Character stats schema
export const CharacterStatsSchema = z.object({
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
});

// Weapon schema
export const WeaponSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  attackBonus: z.number().min(-10).max(50),
  damage: z.string().min(1).max(50),
  properties: z.array(z.string().max(50)).optional(),
  equipped: z.boolean().optional(),
});

// Spell schema
export const SpellSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  level: z.number().min(0).max(9),
  school: z.string().max(50).optional(),
  castingTime: z.string().max(100).optional(),
  range: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  prepared: z.boolean().optional(),
});

// Inventory item schema
export const InventoryItemSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  quantity: z.number().min(0).max(10000),
  weight: z.number().min(0).max(10000).optional(),
  description: z.string().max(1000).optional(),
});

// Feature schema
export const FeatureSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  source: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  uses: z.number().min(0).max(100).optional(),
  maxUses: z.number().min(0).max(100).optional(),
  recharge: z.string().max(50).optional(),
});

// Full character schema
export const CharacterSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(50),
  subspecies: z.string().max(50).optional(),
  class: z.string().min(1).max(50),
  subclass: z.string().max(50).optional(),
  level: z.number().min(1).max(20),
  background: z.string().max(50).optional(),
  alignment: z.string().max(50).optional(),
  stats: CharacterStatsSchema,
  hp: z.number().min(0).max(10000),
  maxHp: z.number().min(1).max(10000),
  tempHp: z.number().min(0).max(10000).optional(),
  ac: z.number().min(0).max(50),
  speed: z.number().min(0).max(1000),
  proficiencyBonus: z.number().min(2).max(6),
  weapons: z.array(WeaponSchema).optional(),
  spells: z.array(SpellSchema).optional(),
  inventory: z.array(InventoryItemSchema).optional(),
  features: z.array(FeatureSchema).optional(),
  notes: z.string().max(10000).optional(),
  imageUrl: z.string().max(2000).optional(),
}).passthrough(); // Allow additional fields for flexibility

// Save character request
export const SaveCharacterDataSchema = z.object({
  character: CharacterSchema,
});

// DM update character request
export const DmUpdateCharacterDataSchema = z.object({
  characterId: IdSchema,
  updates: z.record(z.string(), z.unknown()), // Allow any updates, validated at application level
});
