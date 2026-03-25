import { z } from 'zod';

export const chatRequestSchema = z.object({
  question: z.string().trim().min(1),
  datasetId: z.string().trim().min(1).optional(),
});

export const chatSourceSchema = z.object({
  title: z.string().min(1),
  file: z.string().min(1),
  page: z.number().int().optional(),
});

export const chatResponseSchema = z.object({
  answer: z.string().min(1),
  sources: z.array(chatSourceSchema),
  dataPoints: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
});
