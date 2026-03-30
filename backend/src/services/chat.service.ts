import { GoogleGenAI } from '@google/genai';
import type { ChatRequest, ChatResponse } from '../../../shared/api/index.ts';
import { env } from '../config/env.ts';
import {
  readDemographicHighlights,
  readPovertyTrend,
  readRegionalStats,
  readSupportingMetrics,
} from '../repositories/dashboard.repository.ts';

function buildDataContext(): string {
  const trend = readPovertyTrend();
  const metrics = readSupportingMetrics();
  const demographics = readDemographicHighlights();
  const regional = readRegionalStats();

  return JSON.stringify({ trend, metrics, demographics, regional }, null, 2);
}

const SYSTEM_INSTRUCTION = `You are a poverty data analyst assistant for the Poverty Analysis Portal — a dashboard built on official poverty statistics.

You have access to the following live dashboard data:

${buildDataContext()}

Rules:
- Answer questions about poverty trends, demographics, regional disparities, economic indicators, and social welfare topics.
- When answering from the data above, cite specific numbers, periods, and regions.
- If a question cannot be answered from the data alone, use Google Search to find relevant information (e.g. global poverty context, policy comparisons, economic research).
- Refuse questions that are completely unrelated to poverty, economics, or social welfare.
- Keep answers concise, factual, and grounded in evidence.`;

export async function answerQuestion(request: ChatRequest): Promise<ChatResponse> {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const history = (request.history ?? []).map((entry) => ({
    role: entry.role as 'user' | 'model',
    parts: [{ text: entry.content }],
  }));

  const contents = [...history, { role: 'user' as const, parts: [{ text: request.question }] }];

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`AI service error: ${message}`, { cause: err });
  }

  const answer = response.text ?? 'No response received.';

  const sources: ChatResponse['sources'] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title ?? chunk.web.uri, uri: chunk.web.uri });
      }
    }
  }

  return { answer, sources };
}
