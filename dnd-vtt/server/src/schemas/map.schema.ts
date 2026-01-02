import { z } from 'zod';
import { IdSchema, TokenSizeSchema, ColorSchema, UrlSchema, NullableUrlSchema, ConditionSchema } from './common.schema';

// Token schema
export const TokenSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
  size: TokenSizeSchema,
  color: ColorSchema,
  imageUrl: UrlSchema,
  isHidden: z.boolean(),
  ownerId: z.string().max(100).optional(),
  // Combat stats (optional)
  maxHp: z.number().min(0).max(10000).optional(),
  currentHp: z.number().min(-1000).max(10000).optional(),
  conditions: z.array(ConditionSchema).optional(),
});

// Fog of war area schema
export const FogAreaSchema = z.object({
  id: IdSchema,
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
  width: z.number().min(1).max(10000),
  height: z.number().min(1).max(10000),
  isRevealed: z.boolean(),
});

// Map state schema
export const MapStateSchema = z.object({
  imageUrl: NullableUrlSchema,
  gridSize: z.number().min(10).max(500),
  gridOffsetX: z.number().min(-1000).max(1000),
  gridOffsetY: z.number().min(-1000).max(1000),
  showGrid: z.boolean(),
  tokens: z.array(TokenSchema),
  fogOfWar: z.array(FogAreaSchema),
});

// Partial map state for updates
export const PartialMapStateSchema = MapStateSchema.partial();

// Socket event schemas for map operations
export const UpdateMapDataSchema = z.object({
  mapState: PartialMapStateSchema,
});

export const AddTokenDataSchema = z.object({
  token: TokenSchema,
});

export const MoveTokenDataSchema = z.object({
  tokenId: IdSchema,
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
});

export const UpdateTokenDataSchema = z.object({
  tokenId: IdSchema,
  updates: TokenSchema.partial(),
});

export const RemoveTokenDataSchema = z.object({
  tokenId: IdSchema,
});

export const ShowMapToPlayersDataSchema = z.object({
  mapId: IdSchema,
  mapState: z.object({
    imageUrl: z.string().max(2000),
    gridSize: z.number().min(10).max(500),
    gridOffsetX: z.number().min(-1000).max(1000),
    gridOffsetY: z.number().min(-1000).max(1000),
    tokens: z.array(TokenSchema).optional(),
  }),
});
