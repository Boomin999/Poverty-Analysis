import { z } from 'zod';
import { regionalStatSchema } from './dashboard.schema.ts';

export const geoFeatureSchema = z.record(z.string(), z.unknown());

export const mapResponseSchema = z.object({
  geo: z.object({
    type: z.string().min(1),
    features: z.array(geoFeatureSchema),
  }),
  regions: z.array(regionalStatSchema),
});
