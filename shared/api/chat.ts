export interface ChatRequest {
  question: string;
  datasetId?: string;
}

export interface ChatSource {
  title: string;
  file: string;
  page?: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  dataPoints?: Array<Record<string, string | number>>;
}
