import type { DashboardResponse } from '../../../shared/api/index.ts';
import {
  readDemographicHighlights,
  readKeyFindings,
  readPovertyTrend,
  readPublications,
  readRegionalStats,
  readSupportingMetrics,
} from '../repositories/dashboard.repository.ts';

export function getDashboardData(): DashboardResponse {
  const relativePovertyTrend = readPovertyTrend();
  const regionalStats = readRegionalStats();
  const supportingMetrics = readSupportingMetrics();
  const demographicHighlights = readDemographicHighlights();
  const publications = readPublications();
  const keyFindings = readKeyFindings();

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
    supportingMetrics,
    relativePovertyTrend,
    demographicHighlights,
    regionalStats,
    publications,
    keyFindings,
  };
}
