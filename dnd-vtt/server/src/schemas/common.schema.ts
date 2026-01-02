import { z } from 'zod';

// Common validation schemas used across the application

export const RoomCodeSchema = z.string()
  .min(8, 'Room code must be at least 8 characters')
  .max(20, 'Room code must be at most 20 characters')
  .regex(/^[A-Z0-9]+$/i, 'Room code must be alphanumeric');

export const DmKeySchema = z.string()
  .min(10, 'DM key must be at least 10 characters')
  .max(100, 'DM key must be at most 100 characters');

export const PlayerNameSchema = z.string()
  .min(1, 'Player name is required')
  .max(50, 'Player name must be at most 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_']+$/, 'Player name contains invalid characters');

export const PlayerIdSchema = z.string()
  .min(1, 'Player ID is required')
  .max(100, 'Player ID must be at most 100 characters');

export const PositionSchema = z.object({
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
});

export const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color');

export const UrlSchema = z.string()
  .url('Must be a valid URL')
  .max(10000, 'URL must be at most 10000 characters')
  .optional();

// For map imageUrl which can be null
export const NullableUrlSchema = z.string()
  .url('Must be a valid URL')
  .max(10000, 'URL must be at most 10000 characters')
  .nullable();

export const IdSchema = z.string()
  .min(1, 'ID is required')
  .max(100, 'ID must be at most 100 characters');

// Token size validation
export const TokenSizeSchema = z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']);

// Condition validation
export const ConditionSchema = z.enum([
  'poisoned', 'stunned', 'prone', 'frightened', 'charmed',
  'paralyzed', 'restrained', 'blinded', 'deafened', 'invisible',
  'incapacitated', 'exhausted', 'concentrating'
]);
