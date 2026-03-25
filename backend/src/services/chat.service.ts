import type { ChatRequest, ChatResponse } from '../../../shared/api/index.ts';
import { readPovertyTrend } from '../repositories/dashboard.repository.ts';

function toDataPoint(point: { period: string; percentage: number; number: number }) {
  return {
    period: point.period,
    percentage: point.percentage,
    number: point.number,
  };
}

export function answerQuestion({ question }: ChatRequest): ChatResponse {
  const trend = readPovertyTrend();
  const normalizedQuestion = question.toLowerCase();
  const matchedPeriods = trend.map((point) => point.period).filter((period) => question.includes(period));
  const trendByPeriod = new Map(trend.map((point) => [point.period, point]));

  if (matchedPeriods.length >= 2) {
    const first = trendByPeriod.get(matchedPeriods[0]);
    const second = trendByPeriod.get(matchedPeriods[1]);

    if (first && second) {
      const delta = Number((second.percentage - first.percentage).toFixed(1));
      const direction = delta < 0 ? 'decreased' : delta > 0 ? 'increased' : 'stayed the same';

      return {
        answer: `Relative poverty ${direction} from ${first.percentage}% in ${first.period} to ${second.percentage}% in ${second.period}. The estimated number of persons moved from ${first.number} thousand to ${second.number} thousand over the same period.`,
        sources: [
          {
            title: 'Poverty Analysis Report 2023',
            file: 'backend/data/raw/poverty_reports/Poverty_Analysis_Report _2023.pdf',
          },
        ],
        dataPoints: [toDataPoint(first), toDataPoint(second)],
      };
    }
  }

  if (normalizedQuestion.includes('trend') || normalizedQuestion.includes('relative poverty')) {
    const latest = trend[trend.length - 1];
    const peak = trend.reduce((currentPeak, point) => point.percentage > currentPeak.percentage ? point : currentPeak, trend[0]);

    return {
      answer: `The latest point in the series is ${latest.percentage}% in ${latest.period}, representing ${latest.number} thousand persons. The highest relative poverty rate in the charted series is ${peak.percentage}% in ${peak.period}.`,
      sources: [
        {
          title: 'Relative Poverty Time Series',
          file: 'backend/data/processed/poverty_trend.json',
        },
        {
          title: 'Poverty Analysis Report 2023',
          file: 'backend/data/raw/poverty_reports/Poverty_Analysis_Report _2023.pdf',
        },
      ],
      dataPoints: [toDataPoint(latest), toDataPoint(peak)],
    };
  }

  return {
    answer: 'I can currently answer questions about the relative poverty trend, changes between survey years, the latest values, and the report references supporting the dashboard.',
    sources: [
      {
        title: 'Relative Poverty Time Series',
        file: 'backend/data/processed/poverty_trend.json',
      },
    ],
  };
}
