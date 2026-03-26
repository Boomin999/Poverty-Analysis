import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import type {
  DashboardRegionSnapshot,
  DashboardSupportMetric,
  DatasetPreviewResponse,
  DemographicBreakdown,
  Publication,
  RelativePovertyTrendPoint,
} from '../../../shared/api/index.ts';
import { env } from '../config/env.ts';
import { getDatabase } from './connection.ts';
import { getProcessedDataPath, getRawGeospatialPath, getRawSpreadsheetPath, getRawWorldBankPath } from '../utils/data-paths.utils.ts';
import { readJsonFile, readTextFile, readWorkbookRows } from '../utils/file.utils.ts';

type DatasetCatalogRow = {
  id: string;
  name: string;
  format: string;
  records: number;
  lastUpdated: string;
  source: string;
  description: string;
};

type RegressionObservationRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  GDP: number | null;
  Unemployment: number | null;
  Inflation: number | null;
  Gini: number | null;
};

type PredictionRow = {
  Year: string | null;
  Poverty_Rate: number | null;
  Trend_Change: number | null;
  Rolling_Avg: number | null;
};

type LongFormatRow = {
  Year: string | number | null;
  Category: string | null;
  Group: string | null;
  Value: number | null;
};

type DistrictRdiRow = {
  district_clean: string;
  rdi: string;
};

type RdiAreaRow = {
  area_name: string | null;
  area_type: string | null;
  rdi: number | null;
};

type RdiComparisonRow = {
  Area: string | null;
  'RDI 2022': number | null;
  'RDI 2011': number | null;
  Change: number | null;
};

const advancedWorkbookPath = getRawSpreadsheetPath('mauritius_poverty_ADVANCED.xlsx');
const rdiWorkbookPath = getRawSpreadsheetPath('rdi_2022_clean_final.xlsx');
const rdiComparisonWorkbookPath = getRawSpreadsheetPath('rdi_comparison_clean.xlsx');
const districtRdiCsvPath = getRawGeospatialPath('rdi_district_aggregated_mauritius_rodrigues.csv');

const publicationCatalog: Publication[] = [
  {
    id: 'poverty-2023',
    title: 'Poverty Analysis Report 2023',
    author: 'Statistics Mauritius',
    date: '2023-12-01',
    category: 'Official Report',
    excerpt: 'Latest survey-based update covering the 2023 relative poverty rate and the number of persons living in relative poverty.',
  },
  {
    id: 'poverty-2017',
    title: 'Poverty Analysis Report 2017',
    author: 'Statistics Mauritius',
    date: '2019-01-01',
    category: 'Official Report',
    excerpt: 'Reference report for the 2017 household survey and the pre-2023 peak in the relative poverty series.',
  },
  {
    id: 'rdi-2022',
    title: 'Relative Development Index 2022',
    author: 'Statistics Mauritius',
    date: '2022-12-01',
    category: 'Regional Index',
    excerpt: 'District, ward, and village council area measurements used to compare spatial development outcomes across Mauritius and Rodrigues.',
  },
  {
    id: 'poverty-2012',
    title: 'Poverty Analysis Report 2012',
    author: 'Statistics Mauritius',
    date: '2014-01-01',
    category: 'Official Report',
    excerpt: 'Historic benchmark for the rise in relative poverty before the 2017 and 2023 updates.',
  },
];

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function readPovertyTrendRows() {
  return readJsonFile<RelativePovertyTrendPoint[]>(getProcessedDataPath('poverty_trend.json'));
}

function readSupportMetrics(): DashboardSupportMetric[] {
  const rows = readWorkbookRows<{
    Year: number | null;
    'Relative poverty line per adult equivalent per month': number | null;
    'Estimated number of households in relative poverty': number | null;
    'Annual amount required to move people out of relative poverty(Rs Million)': number | null;
  }>(getRawSpreadsheetPath('data_indicators-of-relative-poverty-republic-of-mauritius.xlsx'));
  const latest = rows.at(-1);

  if (!latest || latest.Year === null) {
    return [];
  }

  return [
    {
      label: 'Relative poverty line',
      value: Number(latest['Relative poverty line per adult equivalent per month'] ?? 0),
      unit: 'Rs/month',
      year: Number(latest.Year),
      context: 'Per adult equivalent per month',
    },
    {
      label: 'Households in relative poverty',
      value: Number(latest['Estimated number of households in relative poverty'] ?? 0),
      unit: 'households',
      year: Number(latest.Year),
      context: 'Latest household count in the cleaned series',
    },
    {
      label: 'Annual amount needed',
      value: Number(latest['Annual amount required to move people out of relative poverty(Rs Million)'] ?? 0),
      unit: 'Rs Mn',
      year: Number(latest.Year),
      context: 'Estimated annual amount required to move people out of relative poverty',
    },
  ];
}

function readDemographicBreakdowns() {
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

function readRegressionSeries() {
  return readWorkbookRows<RegressionObservationRow>(advancedWorkbookPath, 'Regression_Dataset')
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

function readPredictionSeries() {
  return readWorkbookRows<PredictionRow>(advancedWorkbookPath, 'Prediction_Dataset')
    .filter((row) => row.Year && row.Poverty_Rate !== null && row.Rolling_Avg !== null)
    .map((row) => ({
      period: String(row.Year),
      povertyRate: Number(row.Poverty_Rate),
      rollingAverage: Number(Number(row.Rolling_Avg).toFixed(2)),
      trendChange: row.Trend_Change === null ? null : Number(Number(row.Trend_Change).toFixed(2)),
    }));
}

function readRegionalStats(): DashboardRegionSnapshot[] {
  const rows = parse(readTextFile(districtRdiCsvPath), {
    columns: true,
    skip_empty_lines: true,
  }) as DistrictRdiRow[];

  return rows
    .filter((row) => row.district_clean !== 'rodrigues')
    .map((row) => ({
      region: row.district_clean.replace(/\b\w/g, (character) => character.toUpperCase()),
      value: Number((Number(row.rdi) * 100).toFixed(1)),
      unit: 'RDI',
      year: 2022,
      note: 'District mean Relative Development Index',
      rank: 0,
    }))
    .sort((left, right) => right.value - left.value)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      region: row.region === 'Riviere Du Rempart' ? 'Riviere du Rempart' : row.region,
    }));
}

function readAreaHighlightRows() {
  const topAreas = readWorkbookRows<RdiAreaRow>(rdiWorkbookPath)
    .filter((row) => row.area_name && row.area_type && row.rdi !== null)
    .map((row) => ({
      highlightType: 'top',
      area: String(row.area_name),
      areaType: String(row.area_type),
      rdi2022: Number(Number(row.rdi).toFixed(4)),
      rdi2011: null,
      change: null,
    }))
    .sort((left, right) => right.rdi2022 - left.rdi2022)
    .slice(0, 8);

  const bottomAreas = readWorkbookRows<RdiAreaRow>(rdiWorkbookPath)
    .filter((row) => row.area_name && row.area_type && row.rdi !== null)
    .map((row) => ({
      highlightType: 'bottom',
      area: String(row.area_name),
      areaType: String(row.area_type),
      rdi2022: Number(Number(row.rdi).toFixed(4)),
      rdi2011: null,
      change: null,
    }))
    .sort((left, right) => left.rdi2022 - right.rdi2022)
    .slice(0, 8);

  const improvingAreas = readWorkbookRows<RdiComparisonRow>(rdiComparisonWorkbookPath)
    .filter((row) => row.Area && row['RDI 2022'] !== null)
    .map((row) => ({
      highlightType: 'improving',
      area: String(row.Area),
      areaType: String(row.Area).includes('Ward') ? 'Ward' : String(row.Area).includes('VCA') ? 'VCA' : 'Area',
      rdi2022: Number(Number(row['RDI 2022']).toFixed(4)),
      rdi2011: row['RDI 2011'] === null ? null : Number(Number(row['RDI 2011']).toFixed(4)),
      change: row.Change === null ? null : Number(Number(row.Change).toFixed(4)),
    }))
    .filter((row) => row.change !== null)
    .sort((left, right) => (right.change ?? 0) - (left.change ?? 0))
    .slice(0, 8);

  return [...topAreas, ...bottomAreas, ...improvingAreas];
}

function readDatasetPreviews(): DatasetPreviewResponse[] {
  const povertyTrend = readPovertyTrendRows();
  const worldBankCsvPath = getRawWorldBankPath('API_MUS_DS2_en_csv_v2_26053.csv');
  const worldBankRecords = parse(fs.readFileSync(worldBankCsvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;

  return [
    {
      dataset: {
        id: 'relative-poverty-series',
        name: 'Relative Poverty Time Series',
        format: 'json',
        description: 'Time series used on the dashboard chart.',
        source: 'Statistics Mauritius',
      },
      columns: [
        { key: 'period', label: 'Period', type: 'string' },
        { key: 'percentage', label: 'Percentage', type: 'number' },
        { key: 'number', label: 'Number (000)', type: 'number' },
      ],
      rows: povertyTrend.map((row) => ({
        period: row.period,
        percentage: row.percentage,
        number: row.number,
      })),
    },
    {
      dataset: {
        id: 'mauritius-poverty-dataset',
        name: 'Mauritius Poverty Dataset',
        format: 'xlsx',
        description: 'Workbook-backed summary view for poverty indicators.',
        source: 'Statistics Mauritius',
      },
      columns: [
        { key: 'period', label: 'Period', type: 'string' },
        { key: 'indicator', label: 'Indicator', type: 'string' },
        { key: 'value', label: 'Value', type: 'number' },
        { key: 'status', label: 'Status', type: 'string' },
      ],
      rows: povertyTrend.map((row) => ({
        period: row.period,
        indicator: 'Relative poverty rate',
        value: row.percentage,
        status: 'Verified',
      })),
    },
    {
      dataset: {
        id: 'poverty-analysis-2023',
        name: 'Poverty Analysis Report 2023',
        format: 'pdf',
        description: 'Structured summary extracted from the report for quick inspection.',
        source: 'Statistics Mauritius',
      },
      columns: [
        { key: 'section', label: 'Section', type: 'string' },
        { key: 'summary', label: 'Summary', type: 'string' },
      ],
      rows: [
        {
          section: 'Relative poverty',
          summary: 'Relative poverty rate decreased from 10.4% in 2017 to 8.4% in 2023.',
        },
        {
          section: 'Persons in poverty',
          summary: 'Estimated number of persons in relative poverty declined from 127.8 thousand in 2017 to 101.9 thousand in 2023.',
        },
        {
          section: 'Trend direction',
          summary: 'Recent trend is downward compared with the previous survey year.',
        },
        {
          section: 'Use in app',
          summary: 'This report supports the dashboard trend and chat explanations.',
        },
      ],
    },
    {
      dataset: {
        id: 'world-bank-indicators',
        name: 'World Bank Indicators for Mauritius',
        format: 'csv',
        description:
          'Preview of the exported indicator file using columns Country Name, Country Code, Indicator Name, Indicator Code, 2020, 2021, 2022, 2023, 2024.',
        source: 'World Bank',
      },
      columns: [
        { key: 'countryName', label: 'Country Name', type: 'string' },
        { key: 'countryCode', label: 'Country Code', type: 'string' },
        { key: 'indicatorName', label: 'Indicator Name', type: 'string' },
        { key: 'indicatorCode', label: 'Indicator Code', type: 'string' },
        { key: 'year2020', label: '2020', type: 'string' },
        { key: 'year2021', label: '2021', type: 'string' },
        { key: 'year2022', label: '2022', type: 'string' },
        { key: 'year2023', label: '2023', type: 'string' },
        { key: 'year2024', label: '2024', type: 'string' },
      ],
      rows: worldBankRecords.slice(0, 6).map((record) => ({
        countryName: record['Country Name'] ?? '',
        countryCode: record['Country Code'] ?? '',
        indicatorName: record['Indicator Name'] ?? '',
        indicatorCode: record['Indicator Code'] ?? '',
        year2020: record['2020'] || null,
        year2021: record['2021'] || null,
        year2022: record['2022'] || null,
        year2023: record['2023'] || null,
        year2024: record['2024'] || null,
      })),
    },
  ];
}

export function seedDatabase(force = false) {
  const db = getDatabase();
  const statementMap = {
    insertPovertyTrend: db.prepare('INSERT INTO poverty_trend (period, percentage, number, sort_order) VALUES (?, ?, ?, ?)'),
    insertSupportMetric: db.prepare('INSERT INTO support_metrics (label, value, unit, year, context, sort_order) VALUES (?, ?, ?, ?, ?, ?)'),
    insertDemographic: db.prepare('INSERT INTO demographic_breakdowns (category, year, group_name, value, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertRegionalStat: db.prepare('INSERT INTO regional_stats (region, value, unit, year, note, rank) VALUES (?, ?, ?, ?, ?, ?)'),
    insertPublication: db.prepare('INSERT INTO publications (id, title, author, date, category, excerpt) VALUES (?, ?, ?, ?, ?, ?)'),
    insertRegression: db.prepare('INSERT INTO regression_series (period, poverty_rate, gdp, unemployment, inflation, gini, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    insertPrediction: db.prepare('INSERT INTO prediction_series (period, poverty_rate, rolling_average, trend_change, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertDataset: db.prepare('INSERT INTO dataset_catalog (id, name, format, records, last_updated, source, description) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    insertDatasetPreviewColumn: db.prepare('INSERT INTO dataset_preview_columns (dataset_id, column_key, label, type, sort_order) VALUES (?, ?, ?, ?, ?)'),
    insertDatasetPreviewRow: db.prepare('INSERT INTO dataset_preview_rows (dataset_id, row_json, sort_order) VALUES (?, ?, ?)'),
    insertMapRegion: db.prepare('INSERT INTO map_regions (region, map_key, rdi, change, rank, year) VALUES (?, ?, ?, ?, ?, ?)'),
    insertMapArea: db.prepare('INSERT INTO map_area_highlights (highlight_type, area, area_type, rdi_2022, rdi_2011, change) VALUES (?, ?, ?, ?, ?, ?)'),
  };

  const datasetCatalog = readJsonFile<DatasetCatalogRow[]>(getProcessedDataPath('dataset_catalog.json'));
  const povertyTrend = readPovertyTrendRows();
  const supportMetrics = readSupportMetrics();
  const demographicBreakdowns = readDemographicBreakdowns();
  const regionalStats = readRegionalStats();
  const regressionSeries = readRegressionSeries();
  const predictionSeries = readPredictionSeries();
  const datasetPreviews = readDatasetPreviews();
  const mapAreaHighlights = readAreaHighlightRows();

  const seedAll = () => {
    db.exec('BEGIN');
    try {
    db.exec(`
      DELETE FROM poverty_trend;
      DELETE FROM support_metrics;
      DELETE FROM demographic_breakdowns;
      DELETE FROM regional_stats;
      DELETE FROM publications;
      DELETE FROM regression_series;
      DELETE FROM prediction_series;
      DELETE FROM dataset_catalog;
      DELETE FROM dataset_preview_columns;
      DELETE FROM dataset_preview_rows;
      DELETE FROM map_regions;
      DELETE FROM map_area_highlights;
    `);

    povertyTrend.forEach((row, index) => {
      statementMap.insertPovertyTrend.run(row.period, row.percentage, row.number, index + 1);
    });

    supportMetrics.forEach((row, index) => {
      statementMap.insertSupportMetric.run(row.label, row.value, row.unit, row.year, row.context, index + 1);
    });

    demographicBreakdowns.forEach((section) => {
      section.groups.forEach((group, index) => {
        statementMap.insertDemographic.run(section.category, section.year, group.group, group.value, index + 1);
      });
    });

    regionalStats.forEach((row) => {
      statementMap.insertRegionalStat.run(row.region, row.value, row.unit, row.year, row.note, row.rank);
      statementMap.insertMapRegion.run(row.region, normalizeName(row.region), Number((row.value / 100).toFixed(4)), null, row.rank, row.year);
    });

    publicationCatalog.forEach((row) => {
      statementMap.insertPublication.run(row.id, row.title, row.author, row.date, row.category, row.excerpt);
    });

    regressionSeries.forEach((row, index) => {
      statementMap.insertRegression.run(
        row.period,
        row.povertyRate,
        row.gdp,
        row.unemployment,
        row.inflation,
        row.gini,
        index + 1,
      );
    });

    predictionSeries.forEach((row, index) => {
      statementMap.insertPrediction.run(row.period, row.povertyRate, row.rollingAverage, row.trendChange, index + 1);
    });

    datasetCatalog.forEach((row) => {
      statementMap.insertDataset.run(row.id, row.name, row.format, row.records, row.lastUpdated, row.source, row.description);
    });

    datasetPreviews.forEach((preview) => {
      preview.columns.forEach((column, index) => {
        statementMap.insertDatasetPreviewColumn.run(
          preview.dataset.id,
          column.key,
          column.label,
          column.type,
          index + 1,
        );
      });

      preview.rows.forEach((row, index) => {
        statementMap.insertDatasetPreviewRow.run(preview.dataset.id, JSON.stringify(row), index + 1);
      });
    });

    mapAreaHighlights.forEach((row) => {
      statementMap.insertMapArea.run(row.highlightType, row.area, row.areaType, row.rdi2022, row.rdi2011, row.change);
    });
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const shouldSeed =
    !fs.existsSync(env.paths.sqlite) ||
    (db.prepare('SELECT COUNT(*) AS count FROM poverty_trend').get() as unknown as { count: number }).count === 0 ||
    (db.prepare('SELECT COUNT(*) AS count FROM dataset_preview_rows').get() as unknown as { count: number }).count === 0;

  if (force || shouldSeed) {
    seedAll();
  }
}
