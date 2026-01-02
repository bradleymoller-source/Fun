import { z } from 'zod';
import { IdSchema } from './common.schema';

// Store item schema
export const StoreItemSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.string().min(1).max(50),
  quantity: z.number().min(-1).max(9999), // -1 = unlimited
  effect: z.string().max(500).optional(),
});

// Loot item schema
export const LootItemSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  value: z.string().max(50).optional(),
  quantity: z.number().min(1).max(9999),
  source: z.string().max(100).optional(),
});

// Socket event schemas
export const UpdateStoreDataSchema = z.object({
  items: z.array(StoreItemSchema),
});

export const AddStoreItemDataSchema = z.object({
  item: StoreItemSchema,
});

export const RemoveStoreItemDataSchema = z.object({
  itemId: IdSchema,
});

export const UpdateLootDataSchema = z.object({
  items: z.array(LootItemSchema),
});

export const AddLootItemDataSchema = z.object({
  item: LootItemSchema,
});

export const RemoveLootItemDataSchema = z.object({
  itemId: IdSchema,
});

export const DistributeItemDataSchema = z.object({
  lootItemId: IdSchema,
  playerId: z.string().min(1).max(100),
  playerName: z.string().min(1).max(50),
  quantity: z.number().min(1).max(9999),
});
