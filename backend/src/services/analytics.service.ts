import type {
  ActualPredictedPoint,
  AnalyticsResponse,
  AnalyticsChartAsset,
  CorrelationMatrixCell,
  CorrelationInsight,
  RegressionCoefficient,
  RegressionObservation,
  ScatterSeries,
} from '../../../shared/api/index.ts';
import {
  readDemographicBreakdowns,
  readPredictionSeries,
  readRegressionSeries,
} from '../repositories/analytics.repository.ts';

function pearsonCorrelation(left: number[], right: number[]) {
  const count = left.length;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / count;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / count;

  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (let index = 0; index < count; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }

  return numerator / Math.sqrt(leftVariance * rightVariance);
}

function invertMatrix(matrix: number[][]) {
  const size = matrix.length;
  const identity = matrix.map((row, rowIndex) =>
    row.map((_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
  );
  const working = matrix.map((row) => [...row]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let pivot = working[pivotIndex][pivotIndex];

    if (Math.abs(pivot) < 1e-10) {
      const swapIndex = working.findIndex(
        (row, rowIndex) => rowIndex > pivotIndex && Math.abs(row[pivotIndex]) > 1e-10,
      );

      if (swapIndex === -1) {
        throw new Error('Regression matrix is singular and cannot be inverted.');
      }

      [working[pivotIndex], working[swapIndex]] = [working[swapIndex], working[pivotIndex]];
      [identity[pivotIndex], identity[swapIndex]] = [identity[swapIndex], identity[pivotIndex]];
      pivot = working[pivotIndex][pivotIndex];
    }

    for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
      working[pivotIndex][columnIndex] /= pivot;
      identity[pivotIndex][columnIndex] /= pivot;
    }

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === pivotIndex) {
        continue;
      }

      const factor = working[rowIndex][pivotIndex];
      for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
        working[rowIndex][columnIndex] -= factor * working[pivotIndex][columnIndex];
        identity[rowIndex][columnIndex] -= factor * identity[pivotIndex][columnIndex];
      }
    }
  }

  return identity;
}

function multiplyMatrix(left: number[][], right: number[][]) {
  return left.map((row) =>
    right[0].map((_, columnIndex) =>
      row.reduce((sum, value, rowIndex) => sum + value * right[rowIndex][columnIndex], 0),
    ),
  );
}

function transpose(matrix: number[][]) {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
}

function runMultipleRegression(series: RegressionObservation[]) {
  const features = series.map((row) => [1, row.gdp, row.unemployment, row.inflation, row.gini]);
  const outcomes = series.map((row) => [row.povertyRate]);
  const featuresTranspose = transpose(features);
  const normalMatrix = multiplyMatrix(featuresTranspose, features);
  const inverted = invertMatrix(normalMatrix);
  const coefficients = multiplyMatrix(multiplyMatrix(inverted, featuresTranspose), outcomes).map(([value]) => value);
  const predicted = features.map((row) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const actual = series.map((row) => row.povertyRate);
  const actualMean = actual.reduce((sum, value) => sum + value, 0) / actual.length;
  const ssResidual = actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0);
  const ssTotal = actual.reduce((sum, value) => sum + (value - actualMean) ** 2, 0);
  const rSquared = 1 - ssResidual / ssTotal;

  return {
    coefficients,
    rSquared,
    predicted,
  };
}

function simpleLinearRegression(pairs: Array<{ x: number; y: number }>) {
  const xMean = pairs.reduce((sum, pair) => sum + pair.x, 0) / pairs.length;
  const yMean = pairs.reduce((sum, pair) => sum + pair.y, 0) / pairs.length;

  let numerator = 0;
  let denominator = 0;

  for (const pair of pairs) {
    numerator += (pair.x - xMean) * (pair.y - yMean);
    denominator += (pair.x - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

function sampleTrendLine(minValue: number, maxValue: number, slope: number, intercept: number) {
  const steps = 40;
  const span = maxValue - minValue || 1;

  return Array.from({ length: steps + 1 }, (_, index) => {
    const x = minValue + (span * index) / steps;
    return {
      x: Number(x.toFixed(3)),
      y: Number((intercept + slope * x).toFixed(3)),
    };
  });
}

function getPeriodStartYear(period: string) {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function buildInterpolatedPoints(points: Array<{ x: number; y: number; period: string }>) {
  const interpolated: Array<{ x: number; y: number; period: string }> = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    const leftYear = getPeriodStartYear(left.period);
    const rightYear = getPeriodStartYear(right.period);
    const steps = Math.max(Math.min((rightYear ?? index + 2) - (leftYear ?? index + 1), 6), 2);

    interpolated.push(left);

    for (let step = 1; step < steps; step += 1) {
      const ratio = step / steps;
      const estimatedYear =
        leftYear && rightYear
          ? `${Math.round(leftYear + (rightYear - leftYear) * ratio)} estimate`
          : `${left.period}-${right.period} estimate ${step}`;

      interpolated.push({
        x: Number((left.x + (right.x - left.x) * ratio).toFixed(3)),
        y: Number((left.y + (right.y - left.y) * ratio).toFixed(3)),
        period: estimatedYear,
      });
    }
  }

  interpolated.push(points.at(-1)!);

  return interpolated;
}

function getStrength(value: number): CorrelationInsight['strength'] {
  const absolute = Math.abs(value);

  if (absolute >= 0.7) {
    return 'strong';
  }

  if (absolute >= 0.4) {
    return 'moderate';
  }

  return 'weak';
}

const legacyCharts: AnalyticsChartAsset[] = [
  {
    title: 'Correlation Heatmap',
    imagePath: '/analytics-outputs/correlation_heatmap.png',
    caption: 'The original heatmap from the earlier Mauritius Poverty Project shows the full correlation matrix used to understand how poverty moved with GDP, unemployment, inflation, and inequality.',
  },
  {
    title: 'Actual vs Predicted Poverty',
    imagePath: '/analytics-outputs/actual_vs_predicted.png',
    caption: 'This plot compares the reduced regression model output against the observed poverty series, helping show how well the fitted values track the real trend.',
  },
  {
    title: 'Poverty vs GDP per Capita',
    imagePath: '/analytics-outputs/poverty_vs_GDP_pc.png',
    caption: 'Scatter plot with regression line from the earlier workflow, useful for visually inspecting the relationship between poverty and GDP per capita.',
  },
  {
    title: 'Poverty vs Unemployment',
    imagePath: '/analytics-outputs/poverty_vs_Unemployment.png',
    caption: 'Scatter plot used to inspect whether unemployment moved in the same direction as relative poverty across the observed years.',
  },
  {
    title: 'Poverty vs Inflation',
    imagePath: '/analytics-outputs/poverty_vs_Inflation.png',
    caption: 'Inflation comparison plot from the original project, included here as supporting evidence rather than only numerical output.',
  },
  {
    title: 'Poverty vs Gini',
    imagePath: '/analytics-outputs/poverty_vs_Gini.png',
    caption: 'This chart links poverty to inequality, reinforcing why Gini was kept in the regression discussion.',
  },
];

const variableConfig: Array<{
  variable: keyof Omit<RegressionObservation, 'period' | 'povertyRate'>;
  label: string;
  unit: string;
}> = [
  { variable: 'gdp', label: 'GDP per capita', unit: 'USD' },
  { variable: 'unemployment', label: 'Unemployment', unit: '%' },
  { variable: 'inflation', label: 'Inflation', unit: '%' },
  { variable: 'gini', label: 'Gini', unit: 'index' },
];

export function getAnalyticsSummary(): AnalyticsResponse {
  const regressionSeries = readRegressionSeries();
  const predictionSeries = readPredictionSeries();
  const demographicBreakdowns = readDemographicBreakdowns();
  const povertySeries = regressionSeries.map((row) => row.povertyRate);
  const variables = variableConfig.map((config) => config.variable);
  const matrixDimensions = [
    {
      key: 'povertyRate' as const,
      label: 'Poverty',
      values: povertySeries,
    },
    ...variableConfig.map((config) => ({
      key: config.variable,
      label: config.label,
      values: regressionSeries.map((row) => row[config.variable]),
    })),
  ];

  const correlations = variables.map((variable) => {
    const correlation = pearsonCorrelation(
      povertySeries,
      regressionSeries.map((row) => row[variable]),
    );

    return {
      variable: variable.toUpperCase(),
      correlation: Number(correlation.toFixed(3)),
      direction: correlation >= 0 ? 'positive' : 'negative',
      strength: getStrength(correlation),
    } satisfies CorrelationInsight;
  });

  const regression = runMultipleRegression(regressionSeries);
  const coefficients: RegressionCoefficient[] = [
    { variable: 'Intercept', coefficient: Number(regression.coefficients[0].toFixed(4)) },
    { variable: 'GDP', coefficient: Number(regression.coefficients[1].toFixed(6)) },
    { variable: 'Unemployment', coefficient: Number(regression.coefficients[2].toFixed(4)) },
    { variable: 'Inflation', coefficient: Number(regression.coefficients[3].toFixed(4)) },
    { variable: 'Gini', coefficient: Number(regression.coefficients[4].toFixed(4)) },
  ];

  const strongestCorrelation = [...correlations].sort(
    (left, right) => Math.abs(right.correlation) - Math.abs(left.correlation),
  )[0];
  const highestDemographicRisk = demographicBreakdowns
    .flatMap((section) => section.groups.map((group) => ({ category: section.category, ...group })))
    .sort((left, right) => right.value - left.value)[0];
  const actualPredictedSeries: ActualPredictedPoint[] = regressionSeries.map((row, index) => ({
    period: row.period,
    actual: row.povertyRate,
    predicted: Number(regression.predicted[index].toFixed(3)),
  }));
  const correlationMatrix: CorrelationMatrixCell[] = matrixDimensions.flatMap((rowDimension) =>
    matrixDimensions.map((columnDimension) => ({
      row: rowDimension.label,
      column: columnDimension.label,
      value: Number(
        (
          rowDimension.label === columnDimension.label
            ? 1
            : pearsonCorrelation(rowDimension.values, columnDimension.values)
        ).toFixed(3),
      ),
    })),
  );
  const scatterSeries: ScatterSeries[] = variableConfig.map((config) => {
    const points = regressionSeries.map((row) => ({
      x: row[config.variable],
      y: row.povertyRate,
      period: row.period,
    }));
    const { slope, intercept } = simpleLinearRegression(points);
    const xValues = points.map((point) => point.x);

    return {
      variable: config.variable.toUpperCase(),
      label: config.label,
      unit: config.unit,
      points,
      interpolatedPoints: buildInterpolatedPoints(points),
      trendLine: sampleTrendLine(Math.min(...xValues), Math.max(...xValues), slope, intercept),
    };
  });

  return {
    title: 'Mauritius Poverty Regression and Demographic Analytics',
    summary:
      'Regression, prediction, and demographic comparison outputs are derived from the cleaned Mauritius poverty workbook, combining macroeconomic variables with the 2023 social breakdowns.',
    variables: ['GDP', 'Unemployment', 'Inflation', 'Gini'],
    modelScore: Number(regression.rSquared.toFixed(2)),
    regressionOverview: {
      specification: 'Reduced multiple regression in the legacy workflow: Poverty ~ Gini + GDP per capita (scaled).',
      interpretation:
        'The older Python analysis first tested one predictor at a time, then kept a reduced model to avoid overloading a very small time series. In the current app, the broader regression block is shown alongside that original reduced-model logic for interpretation.',
      strongestDriver: strongestCorrelation
        ? `${strongestCorrelation.variable} had the largest absolute correlation with poverty in the available macro series.`
        : 'The available macro variables all contribute context for the poverty trend.',
    },
    keyFindings: [
      strongestCorrelation
        ? `${strongestCorrelation.variable} shows the strongest ${strongestCorrelation.direction} association with poverty in the regression dataset (r = ${strongestCorrelation.correlation}).`
        : 'The regression dataset links poverty to macroeconomic indicators across survey years.',
      highestDemographicRisk
        ? `${highestDemographicRisk.group} records the highest 2023 poverty rate in the demographic breakdown at ${highestDemographicRisk.value}%.`
        : 'Demographic differences remain visible in the 2023 poverty breakdown.',
      `The rolling average in the prediction series eased to ${predictionSeries.at(-1)?.rollingAverage ?? 'N/A'} by ${predictionSeries.at(-1)?.period ?? 'the latest year'}, reflecting the post-2017 decline in the headline poverty rate.`,
    ],
    correlations,
    coefficients,
    regressionSeries,
    predictionSeries,
    actualPredictedSeries,
    correlationMatrix,
    scatterSeries,
    demographicBreakdowns,
    legacyCharts,
  };
}
