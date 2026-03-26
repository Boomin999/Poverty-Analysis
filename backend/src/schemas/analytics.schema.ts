import { z } from 'zod';
import { demographicBreakdownSchema } from './dashboard.schema.ts';

export const analyticsResponseSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  variables: z.array(z.string().min(1)),
  modelScore: z.number(),
  keyFindings: z.array(z.string().min(1)),
  correlations: z.array(
    z.object({
      variable: z.string().min(1),
      correlation: z.number(),
      direction: z.enum(['positive', 'negative']),
      strength: z.enum(['weak', 'moderate', 'strong']),
    }),
  ),
  coefficients: z.array(
    z.object({
      variable: z.string().min(1),
      coefficient: z.number(),
    }),
  ),
  regressionSeries: z.array(
    z.object({
      period: z.string().min(1),
      povertyRate: z.number(),
      gdp: z.number(),
      unemployment: z.number(),
      inflation: z.number(),
      gini: z.number(),
    }),
  ),
  predictionSeries: z.array(
    z.object({
      period: z.string().min(1),
      povertyRate: z.number(),
      rollingAverage: z.number(),
      trendChange: z.number().nullable(),
    }),
  ),
  demographicBreakdowns: z.array(demographicBreakdownSchema),
});
