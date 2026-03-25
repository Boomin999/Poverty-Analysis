import type { Request, Response } from 'express';
import { analyticsResponseSchema } from '../schemas/analytics.schema.ts';
import { getAnalyticsSummary } from '../services/analytics.service.ts';
import { validateResponse } from '../utils/validation.utils.ts';

export function getAnalyticsHandler(_req: Request, res: Response) {
  res.json(validateResponse(analyticsResponseSchema, getAnalyticsSummary(), 'INVALID_ANALYTICS_RESPONSE'));
}
