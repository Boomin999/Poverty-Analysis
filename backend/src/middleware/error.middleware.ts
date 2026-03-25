import type { NextFunction, Request, Response } from 'express';
import { createApiError } from '../utils/error.utils.ts';
import { logError } from '../utils/logger.utils.ts';
import { SchemaValidationError } from '../utils/validation.utils.ts';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof SchemaValidationError) {
    logError('Schema validation failed.', {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
    res.status(error.statusCode).json(createApiError(error.code, `${error.message} ${error.details.join(' | ')}`));
    return;
  }

  logError('Unhandled backend error.', error);

  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected backend error occurred.';

  res.status(500).json(createApiError('INTERNAL_SERVER_ERROR', message));
}
