import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Sigma,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
        <section className="max-w-4xl">
          <Label className="mb-3 block">Analytical Results</Label>
          <Headline level={1} className="mb-4">Regression, Prediction, and Demographic Analytics</Headline>
          <p className="text-on-surface/60 text-lg leading-relaxed">
            This page now surfaces the cleaned regression workbook directly, combining macroeconomic variables, rolling trend signals, and 2023 demographic poverty breakdowns in one place.
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 md:col-span-2">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <BarChart3 size={20} />
                  <Label className="text-primary/70">Analysis Title</Label>
                </div>
                <Headline level={3}>{data.title}</Headline>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Sigma size={20} />
                  <Label className="text-primary/70">Model R²</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{data.modelScore.toFixed(2)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <Activity size={20} />
                  <Label className="text-primary/70">Observations</Label>
                </div>
                <p className="text-4xl font-display font-bold text-primary">{data.regressionSeries.length}</p>
              </Card>
            </div>

            <Card className="p-8">
              <Headline level={2} className="mb-4">Summary</Headline>
              <p className="text-sm text-on-surface/60 leading-relaxed">{data.summary}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {data.keyFindings.map((finding) => (
                  <div key={finding} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                    <p className="text-sm leading-relaxed text-on-surface/70">{finding}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="p-8 h-[420px]">
                <div className="mb-6">
                  <Headline level={2}>Correlation Profile</Headline>
                  <p className="mt-2 text-sm text-on-surface/50">
                    Pearson correlations between poverty rate and each explanatory variable.
                  </p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.correlations}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                    <XAxis dataKey="variable" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: 11 }} />
                    <YAxis domain={[-1, 1]} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => value.toFixed(3)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        backgroundColor: 'var(--app-surface-container-lowest)',
                      }}
                    />
                    <Bar dataKey="correlation" radius={[10, 10, 0, 0]}>
                      {data.correlations.map((entry) => (
                        <Cell key={entry.variable} fill={entry.direction === 'positive' ? 'var(--app-primary)' : '#b45309'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-8 h-[420px]">
                <div className="mb-6">
                  <Headline level={2}>Observed vs Rolling Average</Headline>
                  <p className="mt-2 text-sm text-on-surface/50">
                    Prediction-series smoothing helps show how the post-2017 drop stands out against the longer trend.
                  </p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.predictionSeries}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--app-on-surface)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        backgroundColor: 'var(--app-surface-container-lowest)',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="povertyRate" name="Observed rate" stroke="var(--app-primary)" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="rollingAverage" name="Rolling average" stroke="#b45309" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
              <Card className="p-8">
                <Headline level={2} className="mb-6">Regression Coefficients</Headline>
                <div className="space-y-3">
                  {data.coefficients.map((coefficient) => (
                    <div key={coefficient.variable} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <span className="text-sm font-medium">{coefficient.variable}</span>
                      <span className="text-sm font-display font-bold text-primary">{coefficient.coefficient}</span>
                    </div>
                  ))}
                </div>

                <Headline level={3} className="mt-8 mb-4">Variables Used</Headline>
                <div className="grid grid-cols-1 gap-3">
                  {data.variables.map((variable) => (
                    <div key={variable} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-medium">{variable}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <div className="mb-6 flex items-center gap-3 text-primary">
                  <TrendingUp size={20} />
                  <Headline level={2}>2023 Demographic Risk Snapshot</Headline>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {data.demographicBreakdowns.map((section) => (
                    <div key={section.category} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <Headline level={3} className="text-lg">{section.category}</Headline>
                        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface/40">{section.year}</span>
                      </div>
                      <div className="space-y-3">
                        {section.groups.map((group) => (
                          <div key={group.group}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium">{group.group}</span>
                              <span className="font-semibold text-primary">{group.value}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(group.value * 4, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
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
