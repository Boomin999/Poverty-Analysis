import type {
  AnalyticsResponse,
  CorrelationInsight,
  RegressionCoefficient,
  RegressionObservation,
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
  };
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

export function getAnalyticsSummary(): AnalyticsResponse {
  const regressionSeries = readRegressionSeries();
  const predictionSeries = readPredictionSeries();
  const demographicBreakdowns = readDemographicBreakdowns();
  const povertySeries = regressionSeries.map((row) => row.povertyRate);
  const variables: Array<keyof Omit<RegressionObservation, 'period' | 'povertyRate'>> = [
    'gdp',
    'unemployment',
    'inflation',
    'gini',
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

  return {
    title: 'Mauritius Poverty Regression and Demographic Analytics',
    summary:
      'Regression, prediction, and demographic comparison outputs are derived from the cleaned Mauritius poverty workbook, combining macroeconomic variables with the 2023 social breakdowns.',
    variables: ['GDP', 'Unemployment', 'Inflation', 'Gini'],
    modelScore: Number(regression.rSquared.toFixed(2)),
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
    demographicBreakdowns,
  };
}
