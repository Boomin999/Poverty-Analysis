import React from 'react';
import { Activity, BarChart3, CheckCircle2, Sigma } from 'lucide-react';
import type { AnalyticsResponse } from '../../shared/api';
import { fetchAnalytics } from './lib/api';
import { Layout } from './components/Layout';
import { Card, Headline, Label } from './components/UI';

const Analytics = () => {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    fetchAnalytics()
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

  return (
    <Layout>
      <div className="space-y-10">
        <section className="max-w-3xl">
          <Label className="mb-3 block">Analytical Results</Label>
          <Headline level={1} className="mb-4">Regression and Indicator Analytics</Headline>
          <p className="text-on-surface/60 text-lg leading-relaxed">
            This section surfaces the backend analytics endpoint so the project shows not only data browsing, but also the summary outputs of the analytical work behind the dissertation.
          </p>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Analytics unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <BarChart3 size={20} />
                  <Label className="text-primary/70">Analysis Title</Label>
                </div>
                <Headline level={3}>{data.title}</Headline>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Sigma size={20} />
                  <Label className="text-primary/70">Model Score</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{data.modelScore.toFixed(2)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Activity size={20} />
                  <Label className="text-primary/70">Variables Used</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{data.variables.length}</p>
              </Card>
            </div>

            <Card className="p-8">
              <Headline level={2} className="mb-4">Summary</Headline>
              <p className="text-sm text-on-surface/60 leading-relaxed">{data.summary}</p>
            </Card>

            <Card className="p-8">
              <Headline level={2} className="mb-6">Model Variables</Headline>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.variables.map((variable) => (
                  <div key={variable} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-sm font-medium">{variable}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          !error && (
            <Card className="p-8">
              <p className="text-sm text-on-surface/50">Loading analytics results...</p>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
