import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { env } from '../config/env';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface ErrorBody {
  error: { message: string; details?: unknown };
}

function body(message: string, details?: unknown): ErrorBody {
  return details === undefined ? { error: { message } } : { error: { message, details } };
}

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

function isBodyParseError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
}

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json(body(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(body(err.message, err.details));
    return;
  }
  if (err instanceof z.ZodError) {
    res.status(400).json(body('Validation failed', z.flattenError(err).fieldErrors));
    return;
  }
  if (isDuplicateKeyError(err)) {
    res.status(409).json(body('A record with these details already exists'));
    return;
  }
  if (isBodyParseError(err)) {
    res.status(400).json(body('Malformed JSON in request body'));
    return;
  }

  console.error(err);
  const message =
    env.NODE_ENV !== 'production' && err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json(body(message));
};
