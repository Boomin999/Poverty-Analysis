import { z } from 'zod';
import { demographicBreakdownSchema } from './dashboard.schema.ts';

export const analyticsResponseSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  variables: z.array(z.string().min(1)),
  modelScore: z.number(),
  regressionOverview: z.object({
    specification: z.string().min(1),
    interpretation: z.string().min(1),
    strongestDriver: z.string().min(1),
  }),
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
  actualPredictedSeries: z.array(
    z.object({
      period: z.string().min(1),
      actual: z.number(),
      predicted: z.number(),
    }),
  ),
  correlationMatrix: z.array(
    z.object({
      row: z.string().min(1),
      column: z.string().min(1),
      value: z.number(),
    }),
  ),
  scatterSeries: z.array(
    z.object({
      variable: z.string().min(1),
      label: z.string().min(1),
      unit: z.string().min(1),
      points: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          period: z.string().min(1),
        }),
      ),
      interpolatedPoints: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          period: z.string().min(1),
        }),
      ),
      trendLine: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
        }),
      ),
    }),
  ),
  demographicBreakdowns: z.array(demographicBreakdownSchema),
  legacyCharts: z.array(
    z.object({
      title: z.string().min(1),
      imagePath: z.string().min(1),
      caption: z.string().min(1),
    }),
  ),
});
