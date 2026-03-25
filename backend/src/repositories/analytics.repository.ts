import type { AnalyticsResponse } from '../../../shared/api/index.ts';
import { getProcessedDataPath } from '../utils/data-paths.utils.ts';
import { readJsonFile } from '../utils/file.utils.ts';

export function readAnalyticsSummary() {
  return readJsonFile<AnalyticsResponse>(getProcessedDataPath('regression_results.json'));
}
