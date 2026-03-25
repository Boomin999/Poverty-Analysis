import type { RegionalStat } from './dashboard.ts';

export interface MapResponse {
  geo: {
    type: string;
    features: Array<Record<string, unknown>>;
  };
  regions: RegionalStat[];
}
