export type TrendDirection = 'up' | 'down' | 'stable';

export interface HeadlineMetric {
  label: string;
  value: number;
  unit: string;
  delta: number;
  trend: TrendDirection;
  year: number;
}

export interface RelativePovertyTrendPoint {
  period: string;
  percentage: number;
  number: number;
}

export interface RegionalStat {
  region: string;
  index: number;
  trend: TrendDirection;
  population: string;
  year: number;
}

export interface Publication {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
}

export interface DashboardResponse {
  headlineMetric: HeadlineMetric;
  relativePovertyTrend: RelativePovertyTrendPoint[];
  regionalStats: RegionalStat[];
  publications: Publication[];
}
