import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

// General rate limiter for most events
export const generalLimiter = new RateLimiterMemory({
  points: 100,      // 100 events
  duration: 60,     // per minute
});

// Stricter limiter for AI generation requests
export const aiGenerationLimiter = new RateLimiterMemory({
  points: 10,       // 10 AI generations
  duration: 60,     // per minute
});

// Chat message limiter
export const chatLimiter = new RateLimiterMemory({
  points: 30,       // 30 messages
  duration: 60,     // per minute
});

// Session creation limiter (prevent spam)
export const sessionCreationLimiter = new RateLimiterMemory({
  points: 5,        // 5 sessions
  duration: 300,    // per 5 minutes
});

// Join attempt limiter (prevent brute force)
export const joinAttemptLimiter = new RateLimiterMemory({
  points: 10,       // 10 attempts
  duration: 60,     // per minute
});

// Token movement limiter (can be frequent)
export const movementLimiter = new RateLimiterMemory({
  points: 200,      // 200 moves
  duration: 60,     // per minute
});

/**
 * Check rate limit for a given limiter and key
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string,
  eventName?: string
): Promise<boolean> {
  try {
    await limiter.consume(key);
    return true;
  } catch (error) {
    logger.warn('Rate limit exceeded', {
      key,
      eventName,
      retryAfter: (error as any).msBeforeNext,
    });
    return false;
  }
}

/**
 * Creates a rate-limited socket handler wrapper
 */
export function withRateLimit(
  limiter: RateLimiterMemory,
  getKey: (socketId: string, data: any) => string = (socketId) => socketId
) {
  return (
    handler: (data: any, callback: (response: any) => void) => void,
    eventName: string
  ) => {
    return async (
      socketId: string,
      data: any,
      callback: (response: any) => void
    ) => {
      const key = getKey(socketId, data);
      const allowed = await checkRateLimit(limiter, key, eventName);

      if (!allowed) {
        callback({
          success: false,
          error: 'Rate limit exceeded. Please slow down.',
        });
        return;
      }

      handler(data, callback);
    };
  };
}

/**
 * Socket middleware to check general rate limits
 */
export async function socketRateLimitMiddleware(
  socketId: string,
  eventName: string
): Promise<boolean> {
  // Use different limiters based on event type
  let limiter = generalLimiter;

  if (eventName === 'send-chat') {
    limiter = chatLimiter;
  } else if (eventName === 'move-token') {
    limiter = movementLimiter;
  } else if (eventName === 'create-session') {
    limiter = sessionCreationLimiter;
  } else if (eventName === 'join-session') {
    limiter = joinAttemptLimiter;
  }

  return checkRateLimit(limiter, socketId, eventName);
}
