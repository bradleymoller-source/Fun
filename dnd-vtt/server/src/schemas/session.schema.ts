import { z } from 'zod';
import { RoomCodeSchema, DmKeySchema, PlayerNameSchema, PlayerIdSchema } from './common.schema';

// Join session request
export const JoinSessionDataSchema = z.object({
  roomCode: RoomCodeSchema,
  playerName: PlayerNameSchema,
});

// Reclaim session request
export const ReclaimSessionDataSchema = z.object({
  roomCode: RoomCodeSchema,
  dmKey: DmKeySchema,
});

// Kick player request
export const KickPlayerDataSchema = z.object({
  playerId: PlayerIdSchema,
});

// Get players request
export const GetPlayersDataSchema = z.object({
  roomCode: RoomCodeSchema,
});
