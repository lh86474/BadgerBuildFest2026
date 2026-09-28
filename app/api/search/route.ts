import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export interface SymptomSearchResult {
  id: string;
  disease?: string;
  symptom: string;
  description: string;
  score?: number;
  category?: string;
}

// Fallback curated symptom matches when token is missing or in mock mode
const CURATED_SYMPTOM_CORPUS: SymptomSearchResult[] = [
  {
    id: 'sym-1',
    disease: 'PMOS',
    symptom: 'Irregular Menstrual Cycles & Anovulation',
    description: 'Infrequent (oligomenorrhea) or absent (amenorrhea) menstrual bleeding caused by altered hypothalamic-pituitary-ovarian signaling and hyperandrogenism.',
    category: 'Reproductive & Hormonal',
  },
  {
    id: 'sym-2',
    disease: 'PMOS',
    symptom: 'Insulin Resistance & Reactive Hypoglycemia',
    description: 'Impaired cellular response to insulin leading to compensatory hyperinsulinemia, postprandial glucose swings, sweet cravings, and energy crashes.',
    category: 'Metabolic',
  },
  {
    id: 'sym-3',
    disease: 'PMOS',
    symptom: 'Hirsutism & Androgen Excess',
    description: 'Coarse dark hair growth in male-pattern distribution (chin, upper lip, chest, abdomen) driven by elevated free testosterone and DHT.',
    category: 'Dermatological & Androgenic',
  },
  {
    id: 'sym-4',
    disease: 'PMOS',
    symptom: 'Cystic Jawline Acne',
    description: 'Persistent inflammatory or cystic acne predominantly located on the lower third of the face, jawline, and neck, resistant to topical treatments.',
    category: 'Dermatological',
  },
  {
    id: 'sym-5',
    disease: 'PMOS',
    symptom: 'Chronic Fatigue & Sleep Architecture Disruption',
    description: 'Persistent daytime exhaustion resulting from fragmented REM sleep, high nocturnal cortisol, and blunted glucose utilization.',
    category: 'Neuro-Metabolic',
  },
  {
    id: 'sym-6',
    disease: 'PMOS',
    symptom: 'Acanthosis Nigricans & Skin Tags',
    description: 'Velvety, hyperpigmented skin patches in intertriginous flexural folds (neck, axillae, groin) directly correlating with severe hyperinsulinemia.',
    category: 'Metabolic & Skin',
  },
  {
    id: 'sym-7',
    disease: 'PMOS',
    symptom: 'Central Adiposity & Difficulty Losing Weight',
    description: 'Visceral abdominal fat distribution perpetuated by insulin resistance, chronic low-grade inflammation, and leptin resistance.',
    category: 'Metabolic',
  },
];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Literature & symptom search is reserved for signed-in users.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const limit = typeof body.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 20) : 6;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const host = process.env.DATABRICKS_HOST;
    const token = process.env.DATABRICKS_TOKEN;
    const indexName = process.env.DATABRICKS_VECTOR_INDEX || 'pcos.vector_search.disease_symptoms_v2_vs_index';
    const forceMock = process.env.DATABRICKS_MOCK === 'true';

    // 1. Try Live Databricks Vector Search if credentials are present
    if (host && token && !forceMock) {
      try {
        const cleanHost = host.replace(/\/+$/, '');
        const vectorUrl = `${cleanHost}/api/2.0/vector-search/indexes/${encodeURIComponent(indexName)}/query`;

        const vsRes = await fetch(vectorUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query_text: query,
            num_results: limit,
            query_type: 'hybrid',
          }),
        });

        if (vsRes.ok) {
          const json = await vsRes.json();
          const manifestColumns: { name: string }[] = json.manifest?.columns ?? [];
          const rows: unknown[][] = json.result?.data_array ?? [];

          // Map columns dynamically based on manifest
          const colMap = new Map<string, number>();
          manifestColumns.forEach((c, i) => colMap.set(c.name.toLowerCase(), i));

          const idIdx = colMap.get('id') ?? 0;
          const diseaseIdx = colMap.get('disease') ?? colMap.get('title') ?? 1;
          const symptomIdx = colMap.get('symptom') ?? colMap.get('name') ?? 2;
          const descIdx = colMap.get('description') ?? colMap.get('excerpt') ?? colMap.get('text') ?? 3;
          const catIdx = colMap.get('category') ?? colMap.get('publisher') ?? 4;

          const results: SymptomSearchResult[] = rows.map((row, idx) => ({
            id: String(row[idIdx] ?? `res-${idx}`),
            disease: row[diseaseIdx] ? String(row[diseaseIdx]) : 'PMOS Research',
            symptom: row[symptomIdx] ? String(row[symptomIdx]) : query,
            description: String(row[descIdx] ?? row[1] ?? ''),
            category: row[catIdx] ? String(row[catIdx]) : undefined,
          }));

          return NextResponse.json({
            source: 'databricks-vector-search',
            index: indexName,
            query,
            results,
          });
        } else {
          const errText = await vsRes.text().catch(() => '');
          console.warn(`[Search API] Vector Search API HTTP ${vsRes.status}: ${errText}`);
        }
      } catch (vsErr) {
        console.warn('[Search API] Vector Search API request error:', vsErr);
      }
    }

    // 2. Curated local semantic keyword scoring fallback
    const qLower = query.toLowerCase();
    const scored = CURATED_SYMPTOM_CORPUS.map((item) => {
      let score = 0;
      const text = `${item.symptom} ${item.description} ${item.category}`.toLowerCase();
      const terms = qLower.split(/\s+/).filter((t: string) => t.length > 2);

      for (const term of terms) {
        if (text.includes(term)) score += 3;
      }

      if (/cycle|period|flow|bleed|ovulat/.test(qLower) && /cycle|anovulation|menstrual/.test(text)) score += 5;
      if (/sugar|glucose|insulin|snack|fatigue|energy/.test(qLower) && /insulin|hypoglycemia|fatigue/.test(text)) score += 5;
      if (/hair|chin|hirsutism|facial|beard/.test(qLower) && /hirsutism|androgen/.test(text)) score += 5;
      if (/acne|skin|pimple|breakout/.test(qLower) && /acne|dermatological/.test(text)) score += 5;
      if (/tired|sleep|exhaust|fatigue/.test(qLower) && /fatigue|sleep/.test(text)) score += 5;
      if (/weight|gain|belly|belly fat/.test(qLower) && /adiposity|weight/.test(text)) score += 5;

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const filtered = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.item);
    const finalResults = filtered.length > 0 ? filtered : CURATED_SYMPTOM_CORPUS.slice(0, 3);

    return NextResponse.json({
      source: 'local-curated',
      isLiveConfigured: Boolean(host && token),
      notice: !token ? 'Databricks token not configured in .env.local; showing curated literature.' : undefined,
      query,
      results: finalResults,
    });
  } catch (error) {
    console.error('[Search API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while searching symptoms' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || 'irregular cycle';
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  }));
}
