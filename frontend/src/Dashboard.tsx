import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { DashboardResponse } from '../../shared/api';
import { fetchDashboard } from './lib/api';
import { Headline, Card, Label } from './components/UI';
import { Layout } from './components/Layout';

const compactNumber = new Intl.NumberFormat('en-MU', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatMetricValue = (value: number, unit: string) => {
  if (unit === 'households') {
    return `${compactNumber.format(value)} households`;
  }

  if (unit === 'Rs/month') {
    return `Rs ${value.toLocaleString('en-MU')}`;
  }

  if (unit === 'Rs Mn') {
    return `Rs ${value.toLocaleString('en-MU')} Mn`;
  }

  return `${value.toLocaleString('en-MU')} ${unit}`;
};

const Dashboard = () => {
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    fetchDashboard()
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

  const headlineMetric = data?.headlineMetric;

  return (
    <Layout>
      <div className="space-y-12">
        <section className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="max-w-3xl">
            <Label className="mb-4 block">Mauritius Poverty Insights</Label>
            <Headline level={1} className="mb-6">
              Relative Poverty in Mauritius
              <br />
              <span className="text-primary/60 italic">Cleaned indicators, demographic risk, and district development evidence</span>
            </Headline>
            <p className="text-lg text-on-surface/70 leading-relaxed">
              The dashboard now brings together Statistics Mauritius poverty indicators, 2023 demographic breakdowns, and district-level Relative Development Index data to support a more grounded national view.
            </p>
          </div>

          <Card className="border border-primary/10 bg-primary/5">
            <Label className="mb-2 block">{headlineMetric?.label ?? 'Loading metric'}</Label>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-display font-bold text-primary">
                {headlineMetric ? `${headlineMetric.value}${headlineMetric.unit}` : '--'}
              </span>
              {headlineMetric && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface/70">
                  {headlineMetric.trend === 'down' && <TrendingDown size={13} className="text-green-600" />}
                  {headlineMetric.trend === 'up' && <TrendingUp size={13} className="text-error" />}
                  {headlineMetric.trend === 'stable' && <Minus size={13} className="text-on-surface/40" />}
                  {Math.abs(headlineMetric.delta).toFixed(1)}
                  {headlineMetric.unit} vs previous survey
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-on-surface/60">
              Latest headline rate from the 2023 poverty update, compared with the previous survey point in 2017.
            </p>
          </Card>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Dashboard data unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.supportingMetrics.map((metric) => (
            <Card key={metric.label} className="p-6">
              <Label className="mb-3 block">{metric.label}</Label>
              <p className="text-3xl font-display font-bold text-primary">
                {formatMetricValue(metric.value, metric.unit)}
              </p>
              <p className="mt-3 text-sm text-on-surface/60">
                {metric.context} ({metric.year})
              </p>
            </Card>
          ))}
          {!data && !error && (
            <Card className="md:col-span-3 p-6">
              <p className="text-sm text-on-surface/50">Loading supporting indicators...</p>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-6">
            <Label className="mb-2 block">Analytical Highlights</Label>
            <Headline level={2}>Derived Insights</Headline>
            <p className="mt-2 text-sm text-on-surface/60">
              These headline figures summarize the long-run poverty movement and the current district development gap.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.derivedInsights?.map((insight) => (
              <Card key={insight.label} className="p-6">
                <Label className="mb-3 block">{insight.label}</Label>
                <p className="text-3xl font-display font-bold text-primary">{insight.value}</p>
                <p className="mt-3 text-sm text-on-surface/60">{insight.context}</p>
              </Card>
            ))}
            {data && !data.derivedInsights?.length && (
              <Card className="md:col-span-2 p-6">
                <p className="text-sm text-on-surface/50">Derived dashboard insights will appear after the backend refreshes.</p>
              </Card>
            )}
            {!data && !error && (
              <Card className="md:col-span-2 p-6">
                <p className="text-sm text-on-surface/50">Loading derived insights...</p>
              </Card>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.9fr] gap-8">
          <Card className="flex flex-col h-[470px]">
            <div className="mb-6">
              <Headline level={3}>Relative Poverty Trend in Mauritius</Headline>
              <p className="text-sm text-on-surface/50">
                Number of persons in relative poverty and the corresponding poverty rate from 1996/97 to 2023
              </p>
            </div>
            <div className="flex-1">
              {data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.relativePovertyTrend} margin={{ top: 24, right: 20, left: 4, bottom: 16 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" />
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--app-on-surface)', fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 12]}
                      ticks={[0, 2, 4, 6, 8, 10, 12]}
                      label={{ value: '% persons', angle: -90, position: 'insideLeft', style: { fill: 'var(--app-on-surface)', fontSize: 12, fontWeight: 700 } }}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--app-on-surface)', fontWeight: 700 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 140]}
                      ticks={[0, 20, 40, 60, 80, 100, 120, 140]}
                      label={{ value: 'No. of persons (000)', angle: 90, position: 'insideRight', style: { fill: 'var(--app-on-surface)', fontSize: 12, fontWeight: 700 } }}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--app-on-surface)', fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        backgroundColor: 'var(--app-surface-container-lowest)',
                        color: 'var(--app-on-surface)',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Bar
                      yAxisId="right"
                      dataKey="number"
                      name="Persons (000)"
                      fill="var(--app-primary-container)"
                      stroke="var(--app-on-surface)"
                      strokeWidth={1.5}
                      maxBarSize={38}
                    >
                      <LabelList dataKey="number" position="inside" angle={-90} fill="#ffffff" fontSize={12} fontWeight={700} />
                    </Bar>
                    <Line
                      yAxisId="left"
                      type="linear"
                      dataKey="percentage"
                      name="Poverty rate"
                      stroke="var(--app-secondary)"
                      strokeWidth={4}
                      dot={{ r: 4.5, fill: 'var(--app-secondary)', stroke: 'var(--app-on-surface)', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: 'var(--app-secondary)', stroke: 'var(--app-on-surface)', strokeWidth: 2 }}
                    />
                    <LabelList dataKey="percentage" position="top" offset={8} fill="var(--app-on-surface)" fontSize={12} fontWeight={700} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-on-surface/50">Loading chart data...</div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Headline level={3}>Key Findings</Headline>
                <p className="mt-2 text-sm text-on-surface/50">
                  Short evidence statements drawn from the cleaned poverty workbooks.
                </p>
              </div>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface/70 transition-colors hover:bg-surface-container-high"
              >
                Analytics
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {data?.keyFindings.map((finding) => (
                <div key={finding} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                  <p className="text-sm leading-relaxed text-on-surface/70">{finding}</p>
                </div>
              ))}
              {!data && !error && <p className="text-sm text-on-surface/50">Loading highlights...</p>}
            </div>
          </Card>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <Card className="p-8">
            <div className="mb-6">
              <Label className="mb-2 block">2023 Breakdown</Label>
              <Headline level={2}>Demographic Poverty Profiles</Headline>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {data?.demographicHighlights.map((section) => (
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

          <Card className="flex flex-col">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Headline level={3}>District Development Leaders</Headline>
                <p className="mt-2 text-sm text-on-surface/50">
                  Highest district mean RDI values from the 2022 regional dataset.
                </p>
              </div>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-container"
              >
                Open Map
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {data?.regionalStats.map((stat) => (
                <div key={stat.region} className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{stat.rank}. {stat.region}</span>
                    <span className="text-sm font-display font-bold text-primary">{stat.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${stat.value}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-on-surface/45">
                    {stat.note} ({stat.year})
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <Label className="mb-2 block">Research Archive</Label>
              <Headline level={2}>Source Publications</Headline>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data?.publications.map((publication) => (
              <Card key={publication.id} className="group hover:translate-y-[-4px] transition-transform">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {publication.category}
                  </span>
                  <ArrowUpRight size={20} className="text-on-surface/20 group-hover:text-primary transition-colors" />
                </div>
                <Headline level={3} className="mb-3 group-hover:text-primary transition-colors">
                  {publication.title}
                </Headline>
                <p className="text-sm text-on-surface/60 mb-6 line-clamp-3">
                  {publication.excerpt}
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-outline-variant">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest" />
                  <div>
                    <p className="text-xs font-bold">{publication.author}</p>
                    <p className="text-[10px] text-on-surface/40 font-semibold">{publication.date}</p>
                  </div>
                </div>
              </Card>
            ))}
            {!data && !error && <p className="text-sm text-on-surface/50">Loading publications...</p>}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
