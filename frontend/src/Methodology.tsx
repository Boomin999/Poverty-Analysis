import React from 'react';
import { Layout } from './components/Layout';
import { Headline, Card, Label } from './components/UI';
import {
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Database,
  Map,
  Workflow,
} from 'lucide-react';

const methodologyPillars = [
  {
    icon: Database,
    title: 'Data Sources',
    description:
      'The project combines official poverty reports from Statistics Mauritius with supporting indicators from World Bank datasets and locally prepared spreadsheets.',
    bullets: [
      'Statistics Mauritius poverty analysis reports',
      'Mauritius poverty dataset and RDI workbooks',
      'World Bank indicator time series for Mauritius',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytical Methods',
    description:
      'The study focuses on descriptive trend analysis, correlation review, regression modelling, and district-level Relative Development Index analysis to explain poverty patterns over time.',
    bullets: [
      'Relative poverty trend analysis',
      'Regression and predictor comparison',
      'District and RDI-based interpretation',
    ],
  },
  {
    icon: Map,
    title: 'Geospatial Layer',
    description:
      'District and regional files are cleaned and aligned with map boundaries so poverty-related indicators can be explored geographically, including Mauritius and Rodrigues outputs.',
    bullets: [
      'District name normalization',
      'GeoJSON mapping alignment',
      'Regional comparison and map outputs',
    ],
  },
  {
    icon: Workflow,
    title: 'System Architecture',
    description:
      'The final system separates frontend presentation, backend API handling, processed data files, and shared response contracts so the dashboard can grow beyond static mock pages.',
    bullets: [
      'Frontend dashboard and dataset explorer',
      'Backend API handlers and services',
      'Processed JSON and shared API contracts',
    ],
  },
];

const processSteps = [
  {
    title: 'Collect and Review Source Material',
    description:
      'Official reports, spreadsheets, and indicator files are gathered and inspected to identify the poverty variables, time periods, and district-level fields required for analysis.',
  },
  {
    title: 'Clean and Standardize the Data',
    description:
      'Variable names, district labels, and time-series fields are cleaned so data from different files can be compared consistently and reused in charts, analytics, and maps.',
  },
  {
    title: 'Run Statistical and District Analysis',
    description:
      'The project evaluates poverty trends, compares economic indicators, and studies district/RDI patterns to understand how poverty changes over time and across regions.',
  },
  {
    title: 'Prepare Application Data Products',
    description:
      'Processed outputs are shaped into dashboard-friendly and API-friendly payloads, making the frontend charts, previews, and chat responses easier to maintain.',
  },
  {
    title: 'Deliver Through Dashboard and API',
    description:
      'The final interface presents poverty trends, dataset previews, and explanation layers through the React frontend and backend endpoints rather than through raw files alone.',
  },
];

const Methodology = () => {
  return (
    <Layout>
      <div className="space-y-12 max-w-5xl mx-auto">
        <section className="text-center">
          <Label className="mb-4 block">Research Methodology</Label>
          <Headline level={1} className="mb-6">Methodology and System Design</Headline>
          <p className="text-lg text-on-surface/60 leading-relaxed max-w-3xl mx-auto">
            This project studies poverty in Mauritius by combining official reports, cleaned indicator datasets,
            regression-based analysis, district/RDI interpretation, geospatial mapping, and a dashboard/API delivery layer.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {methodologyPillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <Card key={pillar.title} className="p-8 border border-outline-variant hover:border-primary/20 transition-all">
                <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit mb-6">
                  <Icon size={24} />
                </div>
                <Headline level={3} className="mb-4">{pillar.title}</Headline>
                <p className="text-sm text-on-surface/60 leading-relaxed mb-6">
                  {pillar.description}
                </p>
                <ul className="space-y-3">
                  {pillar.bullets.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs font-bold text-on-surface/70">
                      <CheckCircle2 size={14} className="text-green-600" /> {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <section className="space-y-8">
          <Headline level={2}>Project Workflow</Headline>
          <div className="space-y-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-6 p-6 bg-surface-container-low rounded-2xl border border-outline-variant group hover:bg-surface-container transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-xs text-on-surface/50 leading-relaxed">{step.description}</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-on-surface/20 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </section>

        <Card variant="recessed" className="p-10 md:p-12">
          <Headline level={3} className="mb-3">Implementation Note</Headline>
          <p className="text-sm text-on-surface/60 leading-relaxed">
            The dashboard is designed as the presentation layer of the dissertation output. It sits on top of processed poverty
            data, backend API handlers, and shared schemas so the analytical work can be delivered in a structured, reusable,
            and transparent way rather than as disconnected files only.
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default Methodology;
