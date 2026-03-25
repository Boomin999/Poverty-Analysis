import type { MapResponse, RegionalStat } from '../../../shared/api/index.ts';
import { getProcessedDataPath } from '../utils/data-paths.utils.ts';
import { readJsonFile } from '../utils/file.utils.ts';

export function readMapData(): MapResponse {
  const geo = readJsonFile<MapResponse['geo']>(getProcessedDataPath('geo.json'));
  const regions = readJsonFile<RegionalStat[]>(getProcessedDataPath('district_rdi.json'));

  return { geo, regions };
}
