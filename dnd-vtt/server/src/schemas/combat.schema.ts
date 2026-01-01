import { z } from 'zod';
import { IdSchema, ConditionSchema } from './common.schema';

// Initiative entry schema
export const InitiativeEntrySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  initiative: z.number().min(-10).max(50),
  isNpc: z.boolean(),
  isActive: z.boolean(),
  tokenId: IdSchema.optional(),
  playerId: z.string().max(100).optional(),
  maxHp: z.number().min(0).max(10000).optional(),
  currentHp: z.number().min(-100).max(10000).optional(),
  conditions: z.array(ConditionSchema).optional(),
});

// Add initiative request
export const AddInitiativeDataSchema = z.object({
  entry: InitiativeEntrySchema,
});

// Remove initiative request
export const RemoveInitiativeDataSchema = z.object({
  entryId: IdSchema,
});

// Dice roll schema
export const DiceRollSchema = z.object({
  id: IdSchema,
  playerId: z.string().max(100),
  playerName: z.string().min(1).max(50),
  notation: z.string().min(1).max(100),
  rolls: z.array(z.number().min(1).max(100)),
  modifier: z.number().min(-100).max(100),
  total: z.number().min(-1000).max(10000),
  timestamp: z.string(),
  isPrivate: z.boolean(),
});

// Roll dice request
export const RollDiceDataSchema = z.object({
  roll: DiceRollSchema,
});

// Chat message schema
export const ChatMessageSchema = z.object({
  id: IdSchema,
  senderId: z.string().max(100),
  senderName: z.string().min(1).max(50),
  content: z.string().min(1).max(2000),
  timestamp: z.string(),
  type: z.enum(['chat', 'roll', 'system']),
});

// Send chat request
export const SendChatDataSchema = z.object({
  message: ChatMessageSchema,
});
