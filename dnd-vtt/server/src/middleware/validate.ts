import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validates data against a Zod schema
 * Returns the validated data or null if validation fails
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  eventName: string
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn(`Validation failed for ${eventName}`, { errors, data });
    return { success: false, error: `Validation failed: ${errors}` };
  }

  return { success: true, data: result.data };
}

/**
 * Creates a validated socket event handler
 * Automatically validates incoming data and calls the handler with validated data
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  eventName: string,
  handler: (validatedData: T, callback: (response: any) => void) => void
) {
  return (data: unknown, callback: (response: any) => void) => {
    const result = validateData(schema, data, eventName);

    if (!result.success) {
      callback({ success: false, error: result.error });
      return;
    }

    handler(result.data, callback);
  };
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Sanitizes an object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
