import { DatabricksAIService } from '../../../../lib/server/databricks-ai';
import { DatabricksVectorSearchRetriever } from '../../../../lib/server/databricks-research';
import { DatabricksLakehouseAnalytics } from '../../../../lib/server/databricks-lakehouse';
import type { HealthData } from '../../../../lib/health';
import type { ResearchSource } from '../../../../lib/research';
import type { Answer } from '../../../../lib/ai';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sampleQuery = url.searchParams.get('q') || 'What snacks and meal patterns support PMOS blood sugar balance?';
  const forceMock = url.searchParams.get('mock') === 'true';

  const startTime = Date.now();
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    query: sampleQuery,
    environment: {
      hasDatabricksHost: Boolean(process.env.DATABRICKS_HOST),
      hasDatabricksToken: Boolean(process.env.DATABRICKS_TOKEN),
      servingEndpoint: process.env.DATABRICKS_SERVING_ENDPOINT || 'databricks-meta-llama-3-3-70b-instruct (default)',
      vectorIndex: process.env.DATABRICKS_VECTOR_INDEX || 'health_lakehouse.pcos_research.curated_literature_index (default)',
      aiProviderConfig: process.env.AI_PROVIDER || 'not set',
      isOperatingInMockMode: forceMock || !process.env.DATABRICKS_TOKEN || process.env.DATABRICKS_MOCK === 'true',
    },
  };

  try {
    // 1. Test Vector Search
    const vStart = Date.now();
    const retriever = new DatabricksVectorSearchRetriever({ mockMode: forceMock });
    const vectorResult = await retriever.retrieve(sampleQuery, { limit: 3 });
    diagnostics.vectorSearch = {
      status: vectorResult.status,
      sourcesRetrieved: vectorResult.sources.length,
      latencyMs: Date.now() - vStart,
      topSources: vectorResult.sources.map((s: ResearchSource) => ({
        id: s.id,
        title: s.title,
        publisher: s.publisher,
        url: s.url,
      })),
    };

    // 2. Test Lakehouse Cohort Analytics
    const lStart = Date.now();
    const lakehouse = new DatabricksLakehouseAnalytics({ mockMode: forceMock });
    const cohortInsight = await lakehouse.getCohortSummary(sampleQuery);
    diagnostics.lakehouseCohortAnalytics = {
      latencyMs: Date.now() - lStart,
      insightSummary: cohortInsight,
    };

    // 3. Test Model Serving End-to-End
    const mStart = Date.now();
    const aiService = new DatabricksAIService({ mockMode: forceMock });

    // Mock patient records for testing
    const sampleHealthData: HealthData = {
      version: 1,
      user: { id: 'test-user', name: 'Alex' },
      personalize: true,
      logs: [
        {
          id: 'log-1',
          userId: 'test-user',
          date: '2026-09-20',
          symptoms: ['Fatigue', 'Bloating'],
          periodStart: true,
          energy: 3,
          sleepMinutes: 390,
          doses: {},
          sideEffects: {},
        },
        {
          id: 'log-2',
          userId: 'test-user',
          date: '2026-09-21',
          symptoms: ['Fatigue', 'Acne'],
          energy: 4,
          sleepMinutes: 420,
          doses: {},
          sideEffects: {},
        },
      ],
      medications: [
        {
          id: 'med-1',
          userId: 'test-user',
          name: 'Metformin',
          dosage: '500',
          unit: 'mg',
          frequency: 'twice daily',
          startedAt: '2026-08-01',
          active: true,
          notes: '',
        },
      ],
      labs: [
        {
          id: 'lab-1',
          userId: 'test-user',
          name: 'Fasting Glucose',
          value: '98',
          unit: 'mg/dL',
          low: '70',
          high: '99',
          date: '2026-08-15',
          source: 'LabCorp',
          notes: '',
        },
      ],
      questions: [],
      appointments: [],
    };

    const answer = await aiService.answerHealthQuestion(sampleQuery, sampleHealthData);
    diagnostics.modelServing = {
      latencyMs: Date.now() - mStart,
      sectionsCount: answer.length,
      sections: answer.map((a: Answer[number]) => ({
        source: a.source,
        textPreview: a.text.slice(0, 150) + (a.text.length > 150 ? '...' : ''),
        hasCitations: Boolean(a.citations?.length),
        tags: a.tags,
      })),
    };

    diagnostics.totalLatencyMs = Date.now() - startTime;
    diagnostics.overallStatus = 'OK';

    return Response.json(diagnostics, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    diagnostics.overallStatus = 'FAILED';
    diagnostics.error = error instanceof Error ? error.message : String(error);
    diagnostics.totalLatencyMs = Date.now() - startTime;
    return Response.json(diagnostics, { status: 500 });
  }
}
