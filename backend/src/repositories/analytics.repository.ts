import type { DemographicBreakdown, PredictionPoint, RegressionObservation } from '../../../shared/api/index.ts';
import { getRawSpreadsheetPath } from '../utils/data-paths.utils.ts';
import { readWorkbookRows } from '../utils/file.utils.ts';

const advancedWorkbookPath = getRawSpreadsheetPath('mauritius_poverty_ADVANCED.xlsx');

type RegressionRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  GDP: number | null;
  Unemployment: number | null;
  Inflation: number | null;
  Gini: number | null;
};

type LongFormatRow = {
  Year: string | number | null;
  Category: string | null;
  Group: string | null;
  Value: number | null;
};

type PredictionRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  Trend_Change: number | null;
  Rolling_Avg: number | null;
};

export function readRegressionSeries(): RegressionObservation[] {
  return readWorkbookRows<RegressionRow>(advancedWorkbookPath, 'Regression_Dataset')
    .filter((row) => row.Year && row.Poverty_Rate !== null && row.GDP !== null && row.Unemployment !== null && row.Inflation !== null && row.Gini !== null)
    .map((row) => ({
      period: String(row.Year),
      povertyRate: Number(row.Poverty_Rate),
      gdp: Number(row.GDP),
      unemployment: Number(row.Unemployment),
      inflation: Number(row.Inflation),
      gini: Number(row.Gini),
    }));
}

export function readPredictionSeries(): PredictionPoint[] {
  return readWorkbookRows<PredictionRow>(advancedWorkbookPath, 'Prediction_Dataset')
    .filter((row) => row.Year && row.Poverty_Rate !== null && row.Rolling_Avg !== null)
    .map((row) => ({
      period: String(row.Year),
      povertyRate: Number(row.Poverty_Rate),
      rollingAverage: Number(Number(row.Rolling_Avg).toFixed(2)),
      trendChange: row.Trend_Change === null ? null : Number(Number(row.Trend_Change).toFixed(2)),
    }));
}

export function readDemographicBreakdowns(): DemographicBreakdown[] {
  const sections = new Map<string, DemographicBreakdown>();

  for (const row of readWorkbookRows<LongFormatRow>(advancedWorkbookPath, 'Long_Format')) {
    if (!row.Category || !row.Group || row.Year === null || row.Value === null) {
      continue;
    }

    const category = String(row.Category);
    if (!sections.has(category)) {
      sections.set(category, {
        category,
        year: Number(row.Year),
        groups: [],
      });
    }

    sections.get(category)?.groups.push({
      group: String(row.Group),
      value: Number(row.Value),
    });
  }

  return [...sections.values()];
}
