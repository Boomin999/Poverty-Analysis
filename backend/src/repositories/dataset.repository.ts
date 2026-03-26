import fs from 'node:fs';
import type { DatasetListItem, DatasetPreviewResponse } from '../../../shared/api/index.ts';
import { getDatabase } from '../db/connection.ts';
import {
  getProcessedDataPath,
  getRawPovertyReportPath,
  getRawSpreadsheetPath,
  getRawWorldBankPath,
} from '../utils/data-paths.utils.ts';

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
  const db = getDatabase();
  const catalog = db
    .prepare(
      'SELECT id, name, format, records, last_updated AS lastUpdated, source, description FROM dataset_catalog ORDER BY name',
    )
    .all() as Omit<DatasetListItem, 'size'>[];

  return catalog.map((dataset) => {
    const filePath = filePathByDatasetId[dataset.id];
    const size = filePath && fs.existsSync(filePath) ? formatSize(fs.statSync(filePath).size) : 'N/A';

    return {
      ...dataset,
      size,
    };
  });
}

function getDatabasePreview(datasetId: string): DatasetPreviewResponse | null {
  const db = getDatabase();
  const dataset = db
    .prepare(
      'SELECT id, name, format, description, source FROM dataset_catalog WHERE id = ?',
    )
    .get(datasetId) as
    | {
        id: string;
        name: string;
        format: string;
        description: string;
        source: string;
      }
    | undefined;

  if (!dataset) {
    return null;
  }

  const columns = db
    .prepare(
      'SELECT column_key AS key, label, type FROM dataset_preview_columns WHERE dataset_id = ? ORDER BY sort_order',
    )
    .all(datasetId) as unknown as DatasetPreviewResponse['columns'];
  const rows = db
    .prepare('SELECT row_json AS rowJson FROM dataset_preview_rows WHERE dataset_id = ? ORDER BY sort_order')
    .all(datasetId) as Array<{ rowJson: string }>;

  if (!columns.length && !rows.length) {
    return null;
  }

  return {
    dataset,
    columns,
    rows: rows.map((row) => JSON.parse(row.rowJson) as Record<string, string | number | null>),
  };
}

export function readDatasetPreview(datasetId: string) {
  return getDatabasePreview(datasetId);
}
