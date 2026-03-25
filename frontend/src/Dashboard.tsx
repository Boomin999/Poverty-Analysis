import React from 'react';
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
import { Headline, Card, Label, Button } from './components/UI';
import { Layout } from './components/Layout';

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
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <Label className="mb-4 block">Mauritius Poverty Insights</Label>
            <Headline level={1} className="mb-6">
              Poverty Intelligence Hub: <br />
              <span className="text-primary/60 italic">Evidence for Relative Poverty Analysis</span>
            </Headline>
            <p className="text-lg text-on-surface/70 leading-relaxed">
              Explore dashboard metrics, dataset previews, and guided answers built around poverty indicators and official Mauritius data sources.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <Label className="mb-1 block">{headlineMetric?.label ?? 'Loading metric'}</Label>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-primary">
                  {headlineMetric ? `${headlineMetric.value}${headlineMetric.unit}` : '--'}
                </span>
                {headlineMetric && (
                  <span className="text-xs font-semibold flex items-center gap-0.5 text-on-surface/70">
                    {headlineMetric.trend === 'down' && <TrendingDown size={12} className="text-green-600" />}
                    {headlineMetric.trend === 'up' && <TrendingUp size={12} className="text-error" />}
                    {headlineMetric.trend === 'stable' && <Minus size={12} className="text-on-surface/40" />}
                    {Math.abs(headlineMetric.delta)}
                    {headlineMetric.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <Card className="border border-error/30">
            <Headline level={3} className="mb-2">Dashboard data unavailable</Headline>
            <p className="text-sm text-on-surface/60">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 flex flex-col h-[450px]">
            <div className="mb-6">
              <Headline level={3}>Relative Poverty Trend in Mauritius</Headline>
              <p className="text-sm text-on-surface/50">
                Tracking the number of persons and share of the population in relative poverty from 1996/97 to 2023
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
                      name="Number"
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
                      name="Percentage"
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
            <Headline level={3} className="mb-6">Regional Indices</Headline>
            <div className="space-y-6 flex-1 overflow-y-auto">
              {data?.regionalStats.map((stat) => (
                <div key={stat.region} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{stat.region}</span>
                    <span className="text-sm font-display font-bold">{stat.index}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-1000 group-hover:bg-secondary"
                      style={{ width: `${stat.index}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-on-surface/40 uppercase font-bold tracking-wider">Pop: {stat.population}</span>
                    {stat.trend === 'down' && <TrendingDown size={14} className="text-green-600" />}
                    {stat.trend === 'up' && <TrendingUp size={14} className="text-error" />}
                    {stat.trend === 'stable' && <Minus size={14} className="text-on-surface/30" />}
                  </div>
                </div>
              ))}
              {!data && <p className="text-sm text-on-surface/50">Loading regional data...</p>}
            </div>
            <Button variant="secondary" className="w-full mt-8">View Detailed Map</Button>
          </Card>
        </div>

        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <Label className="mb-2 block">Research Archive</Label>
              <Headline level={2}>Recent Publications</Headline>
            </div>
            <Button variant="secondary">Browse Archive</Button>
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
                <p className="text-sm text-on-surface/60 mb-6 line-clamp-2">
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
