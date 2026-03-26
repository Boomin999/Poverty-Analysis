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

export interface AnalyticsChartAsset {
  title: string;
  imagePath: string;
  caption: string;
}

export interface RegressionOverview {
  specification: string;
  interpretation: string;
  strongestDriver: string;
}

export interface CorrelationMatrixCell {
  row: string;
  column: string;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  period: string;
}

export interface TrendLinePoint {
  x: number;
  y: number;
}

export interface ScatterSeries {
  variable: string;
  label: string;
  unit: string;
  points: ScatterPoint[];
  interpolatedPoints: ScatterPoint[];
  trendLine: TrendLinePoint[];
}

export interface ActualPredictedPoint {
  period: string;
  actual: number;
  predicted: number;
}

export interface AnalyticsResponse {
  title: string;
  summary: string;
  variables: string[];
  modelScore: number;
  regressionOverview: RegressionOverview;
  keyFindings: string[];
  correlations: CorrelationInsight[];
  coefficients: RegressionCoefficient[];
  regressionSeries: RegressionObservation[];
  predictionSeries: PredictionPoint[];
  actualPredictedSeries: ActualPredictedPoint[];
  correlationMatrix: CorrelationMatrixCell[];
  scatterSeries: ScatterSeries[];
  demographicBreakdowns: DemographicBreakdown[];
  legacyCharts: AnalyticsChartAsset[];
}
