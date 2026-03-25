import type { DashboardResponse } from '../../../shared/api/index.ts';
import { readPovertyTrend, readPublications, readRegionalStats } from '../repositories/dashboard.repository.ts';

export function getDashboardData(): DashboardResponse {
  const relativePovertyTrend = readPovertyTrend();
  const regionalStats = readRegionalStats();
  const publications = readPublications();

  const latestPoint = relativePovertyTrend[relativePovertyTrend.length - 1];
  const previousPoint = relativePovertyTrend[relativePovertyTrend.length - 2];

  return {
    headlineMetric: {
      label: 'Relative poverty rate',
      value: latestPoint.percentage,
      unit: '%',
      delta: Number((latestPoint.percentage - previousPoint.percentage).toFixed(1)),
      trend: latestPoint.percentage < previousPoint.percentage ? 'down' : latestPoint.percentage > previousPoint.percentage ? 'up' : 'stable',
      year: 2023,
    },
    relativePovertyTrend,
    regionalStats,
    publications,
  };
}
