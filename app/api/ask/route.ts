import type { HealthContext } from '../../../lib/health-context';

const headers = { 'Cache-Control': 'no-store' };
const MAX_BODY_BYTES = 64_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type Citation = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt?: string;
};

type FastApiAnswer = {
  answer: string;
  citations: Citation[];
  personalized: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === 'string'
    && DATE_PATTERN.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function sanitizeHealthContext(value: unknown): HealthContext | undefined {
  if (!isRecord(value)) return undefined;
  const { start, end, loggedDays, symptoms, periodStarts, medications, labs } = value;
  if (
    !isDate(start)
    || !isDate(end)
    || (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 !== 89
    || typeof loggedDays !== 'number'
    || !Number.isInteger(loggedDays)
    || loggedDays < 0
    || loggedDays > 90
    || !Array.isArray(symptoms)
    || !Array.isArray(periodStarts)
    || !Array.isArray(medications)
    || !Array.isArray(labs)
  ) return undefined;

  const cleanSymptoms = symptoms.map((item) => {
    if (!isRecord(item) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 500
      || typeof item.days !== 'number' || !Number.isInteger(item.days) || item.days < 1 || item.days > loggedDays) return undefined;
    return { name: item.name, days: item.days };
  });
  const cleanMedications = medications.map((item) => {
    if (!isRecord(item) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 500
      || !isDate(item.startedAt) || (item.endedAt !== undefined && !isDate(item.endedAt))) return undefined;
    return { name: item.name, startedAt: item.startedAt, ...(item.endedAt ? { endedAt: item.endedAt } : {}) };
  });
  const cleanLabs = labs.map((item) => {
    if (!isRecord(item) || !isDate(item.date)) return undefined;
    const fields = ['name', 'value', 'unit', 'low', 'high'] as const;
    if (fields.some((field) => typeof item[field] !== 'string' || item[field].length > 500)) return undefined;
    return { name: item.name as string, value: item.value as string, unit: item.unit as string, date: item.date, low: item.low as string, high: item.high as string };
  });
  if (
    cleanSymptoms.some((item) => !item)
    || periodStarts.some((day) => !isDate(day) || day < start || day > end)
    || cleanMedications.some((item) => !item)
    || cleanLabs.some((item) => !item || item.date < start || item.date > end)
  ) return undefined;

  return {
    start,
    end,
    loggedDays,
    symptoms: cleanSymptoms as HealthContext['symptoms'],
    periodStarts: periodStarts as string[],
    medications: cleanMedications as HealthContext['medications'],
    labs: cleanLabs as HealthContext['labs'],
  };
}

function parseAnswer(value: unknown): FastApiAnswer | undefined {
  if (!isRecord(value) || typeof value.answer !== 'string' || !value.answer.trim()
    || !Array.isArray(value.citations) || typeof value.personalized !== 'boolean') return undefined;

  const citations = value.citations.map((item): Citation | undefined => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string'
      || typeof item.url !== 'string' || typeof item.publisher !== 'string'
      || (item.publishedAt !== undefined && typeof item.publishedAt !== 'string')) return undefined;
    return {
      id: item.id.slice(0, 500),
      title: item.title.slice(0, 500),
      url: item.url.slice(0, 2_000),
      publisher: item.publisher.slice(0, 500),
      ...(typeof item.publishedAt === 'string' ? { publishedAt: item.publishedAt.slice(0, 100) } : {}),
    };
  });
  if (citations.some((citation) => !citation)) return undefined;
  return {
    answer: value.answer.slice(0, 20_000),
    citations: citations as Citation[],
    personalized: value.personalized,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: 'The request is too large. Try asking without your journal summary.' }, { status: 413, headers });
    }
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'The question could not be read. Check it and try again.' }, { status: 400, headers });
  }

  if (!isRecord(body) || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 2_000
    || typeof body.personalize !== 'boolean') {
    return Response.json({ error: 'Enter a question of up to 2,000 characters.' }, { status: 400, headers });
  }

  let healthContext: HealthContext | undefined;
  if (body.personalize) {
    healthContext = sanitizeHealthContext(body.health_context);
    if (!healthContext) {
      return Response.json({ error: 'The journal summary could not be validated. Turn personalization off or try again.' }, { status: 400, headers });
    }
  } else if ('health_context' in body || 'data' in body || 'health_data' in body) {
    return Response.json({ error: 'Journal data was sent while personalization was off. Nothing was shared.' }, { status: 400, headers });
  }

  const baseUrl = process.env.RAG_API_URL || 'http://localhost:8000';
  const apiKey = process.env.RAG_API_KEY;
  if (process.env.NODE_ENV === 'production' && !apiKey) {
    return Response.json({ error: 'The research assistant is not configured. Try again shortly.' }, { status: 503, headers });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        question: body.question.trim(),
        personalize: body.personalize,
        ...(healthContext ? { health_context: healthContext } : {}),
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(55_000),
    });
    if (!upstream.ok) {
      return Response.json(
        { error: upstream.status >= 500 ? 'The research assistant is unavailable. Try again shortly.' : 'The question could not be processed. Check your settings and try again.' },
        { status: upstream.status >= 500 ? 503 : upstream.status, headers },
      );
    }

    const result = parseAnswer(await upstream.json());
    if (!result) {
      return Response.json({ error: 'The research assistant returned an unreadable response. Try again.' }, { status: 502, headers });
    }
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: 'The research assistant could not be reached. Check that the backend is running and try again.' }, { status: 503, headers });
  }
}
