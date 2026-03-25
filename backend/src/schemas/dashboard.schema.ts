import { z } from 'zod';

const trendDirectionSchema = z.enum(['up', 'down', 'stable']);

export const headlineMetricSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  delta: z.number(),
  trend: trendDirectionSchema,
  year: z.number().int(),
});

export const relativePovertyTrendPointSchema = z.object({
  period: z.string().min(1),
  percentage: z.number(),
  number: z.number(),
});

export const regionalStatSchema = z.object({
  region: z.string().min(1),
  index: z.number(),
  trend: trendDirectionSchema,
  population: z.string().min(1),
  year: z.number().int(),
});

export const publicationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  date: z.string().min(1),
  category: z.string().min(1),
  excerpt: z.string().min(1),
});

export const dashboardResponseSchema = z.object({
  headlineMetric: headlineMetricSchema,
  relativePovertyTrend: z.array(relativePovertyTrendPointSchema),
  regionalStats: z.array(regionalStatSchema),
  publications: z.array(publicationSchema),
});
