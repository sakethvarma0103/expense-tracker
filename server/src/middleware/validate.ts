import type { RequestHandler } from 'express';
import type { z } from 'zod';

// Parses req.body with the schema and replaces it with the parsed (trimmed, coerced) result.
// Zod errors are formatted by errorHandler.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
