import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import type { DatasetListItem, DatasetPreviewResponse } from '../../../shared/api/index.ts';
import {
  getProcessedDataPath,
  getRawPovertyReportPath,
  getRawSpreadsheetPath,
  getRawWorldBankPath,
} from '../utils/data-paths.utils.ts';
import { readJsonFile } from '../utils/file.utils.ts';

const worldBankCsvPath = getRawWorldBankPath('API_MUS_DS2_en_csv_v2_26053.csv');

const filePathByDatasetId: Record<string, string | null> = {
  'relative-poverty-series': getProcessedDataPath('poverty_trend.json'),
  'mauritius-poverty-dataset': getRawSpreadsheetPath('mauritius_poverty_dataset.xlsx'),
  'poverty-analysis-2023': getRawPovertyReportPath('Poverty_Analysis_Report _2023.pdf'),
  'world-bank-indicators': worldBankCsvPath,
};

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(1)} ${units[index]}`;
}

export function readDatasetCatalog(): DatasetListItem[] {
  const catalog = readJsonFile<Omit<DatasetListItem, 'size'>[]>(getProcessedDataPath('dataset_catalog.json'));

  return catalog.map((dataset) => {
    const filePath = filePathByDatasetId[dataset.id];
    const size = filePath && fs.existsSync(filePath) ? formatSize(fs.statSync(filePath).size) : 'N/A';

    return {
      ...dataset,
      size,
    };
  });
}

function getRelativePovertyPreview(): DatasetPreviewResponse {
  const rows = readJsonFile<Array<Record<string, string | number | null>>>(getProcessedDataPath('poverty_trend.json'));

  return {
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
    rows,
  };
}

function getWorkbookPreview(): DatasetPreviewResponse {
  const rows = readJsonFile<Array<{ period: string; percentage: number }>>(getProcessedDataPath('poverty_trend.json'));

  return {
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
    rows: rows.map((row) => ({
      period: row.period,
      indicator: 'Relative poverty rate',
      value: row.percentage,
      status: 'Verified',
    })),
  };
}

function getReportPreview(): DatasetPreviewResponse {
  return {
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
  };
}

function getWorldBankPreview(): DatasetPreviewResponse {
  const records = parse(fs.readFileSync(worldBankCsvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Array<Record<string, string>>;

  const importantHeaders = [
    'Country Name',
    'Country Code',
    'Indicator Name',
    'Indicator Code',
    '2020',
    '2021',
    '2022',
    '2023',
    '2024',
  ];

  const rows = records.slice(0, 6).map((record) => ({
    countryName: record['Country Name'] ?? '',
    countryCode: record['Country Code'] ?? '',
    indicatorName: record['Indicator Name'] ?? '',
    indicatorCode: record['Indicator Code'] ?? '',
    year2020: record['2020'] || null,
    year2021: record['2021'] || null,
    year2022: record['2022'] || null,
    year2023: record['2023'] || null,
    year2024: record['2024'] || null,
  }));

  return {
    dataset: {
      id: 'world-bank-indicators',
      name: 'World Bank Indicators for Mauritius',
      format: 'csv',
      description: `Preview of the exported indicator file using columns ${importantHeaders.join(', ')}.`,
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
    rows,
  };
}

export function readDatasetPreview(datasetId: string) {
  switch (datasetId) {
    case 'relative-poverty-series':
      return getRelativePovertyPreview();
    case 'mauritius-poverty-dataset':
      return getWorkbookPreview();
    case 'poverty-analysis-2023':
      return getReportPreview();
    case 'world-bank-indicators':
      return getWorldBankPreview();
    default:
      return null;
  }
}
