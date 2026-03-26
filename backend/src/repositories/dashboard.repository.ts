import { parse } from 'csv-parse/sync';
import type {
  DashboardRegionSnapshot,
  DashboardSupportMetric,
  DemographicBreakdown,
  Publication,
  RelativePovertyTrendPoint,
} from '../../../shared/api/index.ts';
import { getRawGeospatialPath, getRawSpreadsheetPath } from '../utils/data-paths.utils.ts';
import { readTextFile, readWorkbookRows } from '../utils/file.utils.ts';

const indicatorsWorkbookPath = getRawSpreadsheetPath('data_indicators-of-relative-poverty-republic-of-mauritius.xlsx');
const advancedWorkbookPath = getRawSpreadsheetPath('mauritius_poverty_ADVANCED.xlsx');
const districtRdiCsvPath = getRawGeospatialPath('rdi_district_aggregated_mauritius_rodrigues.csv');

type IndicatorWorkbookRow = {
  Year: number | null;
  'Relative poverty line per adult equivalent per month': number | null;
  'Estimated number of households in relative poverty': number | null;
  'Estimated number of persons in relative poverty': number | null;
  'Proportion of persons in relative poverty': number | null;
  'Annual amount required to move people out of relative poverty(Rs Million)': number | null;
};

type RegressionRow = {
  Year: string | null;
  Poverty_Rate: number | null;
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

function normalizeDistrictName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function readIndicatorRows() {
  return readWorkbookRows<IndicatorWorkbookRow>(indicatorsWorkbookPath);
}

function readRegressionRows() {
  return readWorkbookRows<RegressionRow>(advancedWorkbookPath, 'Regression_Dataset');
}

function readLongFormatRows() {
  return readWorkbookRows<LongFormatRow>(advancedWorkbookPath, 'Long_Format');
}

export function readPovertyTrend(): RelativePovertyTrendPoint[] {
  const indicatorRows = readIndicatorRows();
  const trend = indicatorRows
    .filter((row) => row.Year && row['Estimated number of persons in relative poverty'] !== null && row['Proportion of persons in relative poverty'] !== null)
    .map((row) => ({
      period: row.Year === 1997 ? '1996/97' : row.Year === 2002 ? '2001/02' : row.Year === 2007 ? '2006/07' : String(row.Year),
      percentage: Number(row['Proportion of persons in relative poverty']),
      number: Number((Number(row['Estimated number of persons in relative poverty']) / 1000).toFixed(1)),
    }));

  const latest2023Rate = readRegressionRows().find((row) => row.Year === '2023')?.Poverty_Rate;
  if (latest2023Rate !== null && latest2023Rate !== undefined) {
    trend.push({
      period: '2023',
      percentage: Number(latest2023Rate),
      number: 101.9,
    });
  }

  return trend;
}

export function readSupportingMetrics(): DashboardSupportMetric[] {
  const latestIndicatorRow = readIndicatorRows().at(-1);

  if (!latestIndicatorRow || latestIndicatorRow.Year === null) {
    return [];
  }

  return [
    {
      label: 'Relative poverty line',
      value: Number(latestIndicatorRow['Relative poverty line per adult equivalent per month'] ?? 0),
      unit: 'Rs/month',
      year: Number(latestIndicatorRow.Year),
      context: 'Per adult equivalent per month',
    },
    {
      label: 'Households in relative poverty',
      value: Number(latestIndicatorRow['Estimated number of households in relative poverty'] ?? 0),
      unit: 'households',
      year: Number(latestIndicatorRow.Year),
      context: 'Latest household count in the cleaned series',
    },
    {
      label: 'Annual amount needed',
      value: Number(latestIndicatorRow['Annual amount required to move people out of relative poverty(Rs Million)'] ?? 0),
      unit: 'Rs Mn',
      year: Number(latestIndicatorRow.Year),
      context: 'Estimated annual amount required to move people out of relative poverty',
    },
  ];
}

export function readDemographicHighlights(): DemographicBreakdown[] {
  const groupsByCategory = new Map<string, DemographicBreakdown>();

  for (const row of readLongFormatRows()) {
    if (!row.Category || !row.Group || row.Value === null || row.Year === null) {
      continue;
    }

    const category = String(row.Category);
    if (!groupsByCategory.has(category)) {
      groupsByCategory.set(category, {
        category,
        year: Number(row.Year),
        groups: [],
      });
    }

    groupsByCategory.get(category)?.groups.push({
      group: String(row.Group),
      value: Number(row.Value),
    });
  }

  return [...groupsByCategory.values()];
}

export function readRegionalStats(): DashboardRegionSnapshot[] {
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
    }))
    .slice(0, 6);
}

export function readPublications() {
  return publicationCatalog;
}

export function readKeyFindings() {
  const trend = readPovertyTrend();
  const ageBreakdown = readDemographicHighlights().find((section) => normalizeDistrictName(section.category) === 'age');
  const activityBreakdown = readDemographicHighlights().find((section) => normalizeDistrictName(section.category) === 'activity');
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const highestAgeGroup = ageBreakdown?.groups.reduce((best, current) => (current.value > best.value ? current : best));
  const highestActivityGroup = activityBreakdown?.groups.reduce((best, current) => (current.value > best.value ? current : best));

  return [
    latest && previous
      ? `Relative poverty fell by ${Math.abs(Number((latest.percentage - previous.percentage).toFixed(1)))} percentage points between ${previous.period} and ${latest.period}.`
      : 'Relative poverty remains the core indicator tracked across survey years.',
    highestAgeGroup ? `${highestAgeGroup.group} recorded the highest poverty rate among age groups in 2023 at ${highestAgeGroup.value}%.` : 'Age-group comparisons highlight unequal exposure to poverty.',
    highestActivityGroup ? `${highestActivityGroup.group} people recorded the highest poverty rate by activity status in 2023 at ${highestActivityGroup.value}%.` : 'Activity status remains a useful segmentation for poverty analysis.',
  ];
}
