import 'server-only';
import { DevelopmentAIService, type Answer, type AIService, type ChatHistoryMessage } from '../ai';
import type { HealthContext } from '../health-context';
import type { ResearchResult, ResearchRetriever } from '../research';

import { DatabricksAIService } from './databricks-ai';

/** Server-managed OAuth/workload identity only; never accept credentials from a browser. */
export interface DatabricksModelServing {
  answer(input: { question: string; context?: HealthContext; research: ResearchResult; history?: ChatHistoryMessage[] }, options?: { signal?: AbortSignal }): Promise<Answer>;
}
/** Curated Vector Search index adapter; sources must include provenance. */
export interface DatabricksResearchRetrieval extends ResearchRetriever {
  readonly provider: 'databricks-vector-search';
}
/** Queries must use authenticated server identity, never a client-supplied user ID. */
export interface HealthContextRepository {
  getContext(authenticatedUserId: string, range: { start: string; end: string }, options?: { signal?: AbortSignal }): Promise<HealthContext>;
}
export function getAIService(): AIService {
  const provider = process.env.AI_PROVIDER;

  // Support Databricks (live or mock fallback) and explicit databricks-mock
  if (provider === 'databricks' || provider === 'databricks-mock') {
    return new DatabricksAIService();
  }

  if (!provider || provider === 'development') {
    return new DevelopmentAIService();
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
