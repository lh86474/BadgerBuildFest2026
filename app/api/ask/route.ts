import { getAIService } from '../../../lib/server/services';
import { assembleHealthContext } from '../../../lib/health-context';
import type { HealthData } from '../../../lib/health';

const headers = { 'Cache-Control': 'no-store' };
export async function POST(request: Request) {
  let question: string;
  let data: HealthData | undefined;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 250000) return Response.json({ error: 'This history is too large. Ask without including your records.' }, { status: 413, headers });
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || !('question' in body) || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 2000) {
      return Response.json({ error: 'Enter a question of up to 2,000 characters.' }, { status: 400, headers });
    }
    question = body.question.trim();
    if ('data' in body && assembleHealthContext(body.data)) data = body.data as HealthData;

    let history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined;
    if ('history' in body && Array.isArray(body.history)) {
      history = body.history
        .filter((h) => h && typeof h === 'object' && ('role' in h) && ('content' in h) && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .map((h) => ({ role: h.role, content: h.content.trim() }));
    }

    const service = getAIService();
    const answer = await service.answerHealthQuestion(question, data, history);
    return Response.json(
      { answer, provider: process.env.AI_PROVIDER || 'development' },
      { headers }
    );
  } catch (err) {
    console.error('[API /api/ask Error]:', err);
    return Response.json({ error: 'The assistant is unavailable. Your question is still here; try again shortly.' }, { status: 503, headers });
  }
}
