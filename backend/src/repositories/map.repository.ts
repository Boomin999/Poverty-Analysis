import { parse } from 'csv-parse/sync';
import type { MapAreaHighlight, MapRegion, MapResponse } from '../../../shared/api/index.ts';
import { getRawGeospatialPath, getRawSpreadsheetPath } from '../utils/data-paths.utils.ts';
import { readTextFile, readWorkbookRows } from '../utils/file.utils.ts';

const geoJsonPath = getRawGeospatialPath('mauritius_districts.geojson');
const districtRdiCsvPath = getRawGeospatialPath('rdi_district_aggregated_mauritius_rodrigues.csv');
const rdiWorkbookPath = getRawSpreadsheetPath('rdi_2022_clean_final.xlsx');
const rdiComparisonWorkbookPath = getRawSpreadsheetPath('rdi_comparison_clean.xlsx');

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

type GeoFeature = {
  type: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
};

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function readDistrictRegionRows(): MapRegion[] {
  const rows = parse(readTextFile(districtRdiCsvPath), {
    columns: true,
    skip_empty_lines: true,
  }) as DistrictRdiRow[];

  return rows
    .map((row) => ({
      region: titleCase(row.district_clean),
      mapKey: normalizeName(row.district_clean),
      rdi: Number(Number(row.rdi).toFixed(4)),
      change: null,
      rank: null,
      year: 2022,
    }))
    .sort((left, right) => (right.rdi ?? 0) - (left.rdi ?? 0))
    .map((row, index) => ({
      ...row,
      region: row.region === 'Riviere Du Rempart' ? 'Riviere du Rempart' : row.region,
      rank: index + 1,
    }));
}

function readAreaHighlights() {
  const rows = readWorkbookRows<RdiAreaRow>(rdiWorkbookPath);
  return rows
    .filter((row) => row.area_name && row.area_type && row.rdi !== null)
    .map((row) => ({
      area: String(row.area_name),
      areaType: String(row.area_type),
      rdi2022: Number(Number(row.rdi).toFixed(4)),
      rdi2011: null,
      change: null,
    }));
}

function readComparisonHighlights(): MapAreaHighlight[] {
  return readWorkbookRows<RdiComparisonRow>(rdiComparisonWorkbookPath)
    .filter((row) => row.Area && row['RDI 2022'] !== null)
    .map((row) => ({
      area: String(row.Area),
      areaType: String(row.Area).includes('Ward') ? 'Ward' : String(row.Area).includes('VCA') ? 'VCA' : 'Area',
      rdi2022: Number(Number(row['RDI 2022']).toFixed(4)),
      rdi2011: row['RDI 2011'] === null ? null : Number(Number(row['RDI 2011']).toFixed(4)),
      change: row.Change === null ? null : Number(Number(row.Change).toFixed(4)),
    }));
}

export function readMapData(): MapResponse {
  const geo = JSON.parse(readTextFile(geoJsonPath)) as { type: string; features: GeoFeature[] };
  const regions = readDistrictRegionRows();
  const regionByKey = new Map(regions.map((region) => [region.mapKey, region]));
  const rankedRegions = regions.filter((region) => region.rdi !== null && region.region !== 'Rodrigues');
  const topAreas = readAreaHighlights()
    .sort((left, right) => right.rdi2022 - left.rdi2022)
    .slice(0, 8);
  const bottomAreas = readAreaHighlights()
    .sort((left, right) => left.rdi2022 - right.rdi2022)
    .slice(0, 8);
  const improvingAreas = readComparisonHighlights()
    .filter((area) => area.change !== null)
    .sort((left, right) => (right.change ?? 0) - (left.change ?? 0))
    .slice(0, 8);

  return {
    geo: {
      type: geo.type,
      features: geo.features.map((feature) => {
        const shapeName = typeof feature.properties.shapeName === 'string' ? feature.properties.shapeName : '';
        const region = regionByKey.get(normalizeName(shapeName));

        return {
          ...feature,
          properties: {
            ...feature.properties,
            rdi: region?.rdi ?? null,
            rank: region?.rank ?? null,
            year: region?.year ?? 2022,
          },
        };
      }),
    },
    regions,
    topAreas,
    bottomAreas,
    improvingAreas,
    overview: {
      bestRegion: rankedRegions[0]?.region ?? 'Unavailable',
      bestRegionValue: rankedRegions[0]?.rdi ?? 0,
      lowestRegion: rankedRegions.at(-1)?.region ?? 'Unavailable',
      lowestRegionValue: rankedRegions.at(-1)?.rdi ?? 0,
      featureCount: geo.features.length,
    },
  };
}
