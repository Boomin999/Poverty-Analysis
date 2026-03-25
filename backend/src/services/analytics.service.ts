import { readAnalyticsSummary } from '../repositories/analytics.repository.ts';

export function getAnalyticsSummary() {
  return readAnalyticsSummary();
}
