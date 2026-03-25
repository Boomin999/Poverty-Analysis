import React from 'react';
import { Globe2, MapPinned, Map as MapIcon, Pin } from 'lucide-react';
import type { MapResponse } from '../../shared/api';
import { fetchMapData } from './lib/api';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';

const MapView = () => {
  const [data, setData] = React.useState<MapResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    fetchMapData()
      .then((response) => {
        if (isMounted) {
          setData(response);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setError(requestError.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const featureCount = data?.geo.features.length ?? 0;

  return (
    <Layout>
      <div className="space-y-10">
        <section className="max-w-3xl">
          <Label className="mb-3 block">Geospatial View</Label>
          <Headline level={1} className="mb-4">District and Regional Map Data</Headline>
          <p className="text-on-surface/60 text-lg leading-relaxed">
            This page exposes the backend map endpoint and the regional records prepared for geospatial poverty analysis across Mauritius and Rodrigues.
          </p>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Map data unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Globe2 size={20} />
                  <Label className="text-primary/70">GeoJSON Type</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{data.geo.type}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <MapPinned size={20} />
                  <Label className="text-primary/70">Map Features</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{featureCount}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Pin size={20} />
                  <Label className="text-primary/70">Regional Rows</Label>
                </div>
                <p className="text-2xl font-display font-bold text-primary">{data.regions.length}</p>
              </Card>
            </div>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <MapIcon size={20} />
                <Headline level={2}>Map Availability</Headline>
              </div>
              {featureCount > 0 ? (
                <p className="text-sm text-on-surface/60 leading-relaxed">
                  GeoJSON features are available from the backend and can be used for a choropleth or district interaction layer in a later UI pass.
                </p>
              ) : (
                <p className="text-sm text-on-surface/60 leading-relaxed">
                  The map endpoint is live and returning regional data, but the current processed GeoJSON is empty. This page still confirms that the frontend is consuming the backend map module correctly.
                </p>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                <Headline level={2}>Regional Data Preview</Headline>
                <p className="text-sm text-on-surface/50 mt-2">Backend records currently exposed by <code>/api/map</code>.</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container sticky top-0">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">Region</th>
                      <th className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">Index</th>
                      <th className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">Trend</th>
                      <th className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">Population</th>
                      <th className="p-4 font-bold uppercase tracking-wider border-b border-outline-variant">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.regions.map((region) => (
                      <tr key={region.region} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-4 font-medium">{region.region}</td>
                        <td className="p-4">{region.index}</td>
                        <td className="p-4 capitalize">{region.trend}</td>
                        <td className="p-4">{region.population}</td>
                        <td className="p-4">{region.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          !error && (
            <Card className="p-8">
              <p className="text-sm text-on-surface/50">Loading map data...</p>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
};

export default MapView;
