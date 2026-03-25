import { z } from 'zod';

export const analyticsResponseSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  variables: z.array(z.string().min(1)),
  modelScore: z.number(),
});
