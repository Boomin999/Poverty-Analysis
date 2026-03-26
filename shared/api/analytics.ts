import type { DemographicBreakdown } from './dashboard.ts';

export interface CorrelationInsight {
  variable: string;
  correlation: number;
  direction: 'positive' | 'negative';
  strength: 'weak' | 'moderate' | 'strong';
}

export interface RegressionCoefficient {
  variable: string;
  coefficient: number;
}

export interface RegressionObservation {
  period: string;
  povertyRate: number;
  gdp: number;
  unemployment: number;
  inflation: number;
  gini: number;
}

export interface PredictionPoint {
  period: string;
  povertyRate: number;
  rollingAverage: number;
  trendChange: number | null;
}

export interface AnalyticsResponse {
  title: string;
  summary: string;
  variables: string[];
  modelScore: number;
  keyFindings: string[];
  correlations: CorrelationInsight[];
  coefficients: RegressionCoefficient[];
  regressionSeries: RegressionObservation[];
  predictionSeries: PredictionPoint[];
  demographicBreakdowns: DemographicBreakdown[];
}
