import type { Publication, RegionalStat, RelativePovertyTrendPoint } from '../../../shared/api/index.ts';
import { getProcessedDataPath } from '../utils/data-paths.utils.ts';
import { readJsonFile } from '../utils/file.utils.ts';

export function readPovertyTrend() {
  return readJsonFile<RelativePovertyTrendPoint[]>(getProcessedDataPath('poverty_trend.json'));
}

export function readRegionalStats() {
  return readJsonFile<RegionalStat[]>(getProcessedDataPath('district_rdi.json'));
}

export function readPublications() {
  return readJsonFile<Publication[]>(getProcessedDataPath('publications.json'));
}
