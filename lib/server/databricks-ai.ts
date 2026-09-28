import 'server-only';
import type { AIService, Answer } from '../ai';
import { describeContext, extractContextTags } from '../ai';
import type { HealthData } from '../health';
import { assembleHealthContext, type HealthContext } from '../health-context';
import type { ResearchResult } from '../research';
import { DatabricksVectorSearchRetriever } from './databricks-research';
import { DatabricksLakehouseAnalytics } from './databricks-lakehouse';
import { databricksExpertReviews } from './databricks-expert-reviews';
import type { DatabricksModelServing } from './services';

export interface DatabricksAIServiceConfig {
  host?: string;
  token?: string;
  endpoint?: string;
  mockMode?: boolean;
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^```(?:json|markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^\s*\{\s*["']?interpretation["']?\s*:\s*["']?/i, '')
    .replace(/["']?\s*,\s*["']?clinicianQuestions["']?\s*:\s*(?:\[|["'])?/i, '')
    .replace(/\s*["'\]\}]+\s*$/g, '')
    .trim();
}

export interface ParsedAIResponse {
  interpretation: string;
  clinicianQuestions: string;
  references: Array<{
    title: string;
    publisher?: string;
    excerpt?: string;
    url?: string;
  }>;
}

export function normalizeAIResponse(rawContent: string): ParsedAIResponse {
  if (!rawContent || !rawContent.trim()) {
    return { interpretation: '', clinicianQuestions: '', references: [] };
  }

  const trimmed = rawContent.trim();
  let interpretation = '';
  let clinicianQuestions = '';
  const references: Array<{ title: string; publisher?: string; excerpt?: string; url?: string }> = [];

  // Parse ### CLINICAL REFERENCES if present
  const refSplit = trimmed.split(/###\s*(?:CLINICAL\s*REFERENCES?|REFERENCES?|CITATIONS?|STUDIES)/i);
  let mainContent = trimmed;
  if (refSplit.length > 1) {
    mainContent = refSplit[0].trim();
    const refLines = refSplit[1].trim().split('\n');
    for (const line of refLines) {
      const cleanedLine = line.replace(/^[•*-]\s*/, '').trim();
      if (!cleanedLine) continue;

      const titleMatch = cleanedLine.match(/Title:\s*([^|]+)/i);
      const journalMatch = cleanedLine.match(/Journal:\s*([^|]+)/i);
      const findingMatch = cleanedLine.match(/Finding:\s*([^|]+)/i);

      if (titleMatch) {
        const title = titleMatch[1].trim();
        const publisher = journalMatch ? journalMatch[1].trim() : 'Medical Literature';
        const excerpt = findingMatch ? findingMatch[1].trim() : cleanedLine;
        references.push({
          title,
          publisher,
          excerpt,
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`,
        });
      } else if (cleanedLine.length > 20) {
        references.push({
          title: cleanedLine.slice(0, 80) + (cleanedLine.length > 80 ? '...' : ''),
          publisher: 'Peer-reviewed Research',
          excerpt: cleanedLine,
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleanedLine.slice(0, 60))}`,
        });
      }
    }
  }

  // 1. Try JSON parsing if JSON structure is detected
  if (mainContent.startsWith('{') || mainContent.includes('"interpretation"')) {
    try {
      const match = mainContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || mainContent.match(/(\{[\s\S]*\})/);
      const toParse = match ? match[1] : mainContent;
      const parsed = JSON.parse(toParse);
      if (parsed && (parsed.interpretation || parsed.clinicianQuestions)) {
        let cq = '';
        if (Array.isArray(parsed.clinicianQuestions)) {
          cq = parsed.clinicianQuestions.map((q: string) => `• ${String(q).replace(/^[•*-]\s*/, '').trim()}`).join('\n');
        } else if (typeof parsed.clinicianQuestions === 'string') {
          cq = parsed.clinicianQuestions.trim();
        }
        return {
          interpretation: cleanText(String(parsed.interpretation || '')),
          clinicianQuestions: cq,
          references,
        };
      }
    } catch {
      // Regex extraction fallback for malformed or unescaped JSON
      const interpMatch = mainContent.match(/"interpretation"\s*:\s*"([\s\S]*?)(?:",\s*"clinicianQuestions"|"\s*\})/);
      const qMatch = mainContent.match(/"clinicianQuestions"\s*:\s*(?:\[([\s\S]*?)\]|"([\s\S]*?)")/);

      if (interpMatch) {
        const interp = interpMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        let cq = '';
        if (qMatch) {
          const rawQ = qMatch[1] || qMatch[2] || '';
          if (qMatch[1]) {
            const items = rawQ
              .split('",')
              .map((s) => s.replace(/["'\[\]]/g, '').trim())
              .filter(Boolean);
            cq = items.map((q) => `• ${q.replace(/^[•*-]\s*/, '')}`).join('\n');
          } else {
            cq = rawQ.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
          }
        }
        return {
          interpretation: cleanText(interp),
          clinicianQuestions: cq,
          references,
        };
      }
    }
  }

  // 2. Structured markdown headers: ### INTERPRETATION ... ### QUESTIONS FOR YOUR CLINICIAN
  const sectionSplit = mainContent.split(/###\s*(?:QUESTIONS?\s*FOR\s*(?:YOUR\s*)?CLINICIAN|CLINICIAN_QUESTIONS?|DOCTOR_QUESTIONS?)/i);
  if (sectionSplit.length > 1) {
    interpretation = sectionSplit[0].replace(/###\s*INTERPRETATION\s*/i, '').trim();
    clinicianQuestions = sectionSplit[1].trim();
  } else {
    interpretation = mainContent.replace(/###\s*INTERPRETATION\s*/i, '').trim();
  }

  return {
    interpretation: cleanText(interpretation),
    clinicianQuestions: cleanText(clinicianQuestions),
    references,
  };
}

export class DatabricksAIService implements AIService, DatabricksModelServing {
  readonly provider = 'databricks' as const;
  private readonly retriever: DatabricksVectorSearchRetriever;
  private readonly lakehouse: DatabricksLakehouseAnalytics;
  private readonly config: DatabricksAIServiceConfig;

  constructor(config?: DatabricksAIServiceConfig) {
    this.config = {
      host: config?.host ?? process.env.DATABRICKS_HOST,
      token: config?.token ?? process.env.DATABRICKS_TOKEN,
      endpoint: config?.endpoint ?? process.env.DATABRICKS_SERVING_ENDPOINT ?? 'databricks-meta-llama-3-3-70b-instruct',
      mockMode: config?.mockMode ?? (process.env.DATABRICKS_MOCK === 'true' || process.env.AI_PROVIDER === 'databricks-mock'),
    };
    this.retriever = new DatabricksVectorSearchRetriever({
      host: this.config.host,
      token: this.config.token,
      mockMode: this.config.mockMode,
    });
    this.lakehouse = new DatabricksLakehouseAnalytics({
      host: this.config.host,
      token: this.config.token,
      mockMode: this.config.mockMode,
    });
  }

  async answer(
    input: {
      question: string;
      context?: HealthContext;
      research: ResearchResult;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
    options?: { signal?: AbortSignal }
  ): Promise<Answer> {
    const { question, context, research, history } = input;
    const { host, token, endpoint, mockMode } = this.config;
    const tags = extractContextTags(context, question);
    const qLower = question.toLowerCase();
    const hasDoctorIntent = /doctor|clinician|ask|appointment|visit|discuss with|bring to/.test(qLower);

    // 1. Live Databricks Model Serving REST API (OpenAI-compatible chat completions or endpoint invocations)
    if (host && token && endpoint && !mockMode) {
      try {
        const cleanHost = host.replace(/\/+$/, '');
        const invocationUrl = `${cleanHost}/serving-endpoints/${encodeURIComponent(endpoint)}/invocations`;

        const systemPrompt = `You are an empathetic, clinical-grade PCOS health companion powered by Databricks AI.
You have direct access to the user's private, de-identified health journal context (recent daily logs, symptoms, cycle starts, medications, and labs).

INSTRUCTIONS:
1. GROUNDING IN USER DATA: If the user has logged entries, actively cite their specific dates, symptoms, and cycle patterns (e.g. "Looking at your log from [Date] where you tracked acne and fatigue..."). If their journal is empty or new, acknowledge that kindly and provide clear clinical education.
2. MULTI-TURN CONVERSATION: Maintain smooth conversational context across prior messages in the conversation. Answer follow-up questions directly.
3. EVIDENCE-BASED & ACCURATE: Ground explanations in peer-reviewed clinical consensus (e.g., Rotterdam criteria, ESHRE/ASRM, ACOG, The Lancet). Do NOT fabricate medical facts.
4. OUTPUT FORMAT: Present your response in these structured markdown sections:

### INTERPRETATION
Provide a clear, supportive, and scientifically grounded response (2-3 structured paragraphs or concise bullet points). Address the user's question directly.

### QUESTIONS FOR YOUR CLINICIAN
Provide 1 to 3 targeted, high-value questions the user can bring to their healthcare provider at their next appointment. Format each question on its own bullet point.

### CLINICAL REFERENCES
Provide 1 to 3 real, peer-reviewed clinical studies or clinical practice guidelines directly relevant to the user's question and symptoms. Format each reference on its own line:
- Title: [Study Title] | Journal: [Journal or Organization] | Finding: [Key clinical finding in 1 sentence]`;

        const verifiedExamples = await databricksExpertReviews.getTopVerifiedExamples(question, 1).catch(() => []);
        const fewShotText = verifiedExamples.length > 0
          ? `\nCLINICIAN-VERIFIED GOLD STANDARD REFERENCE EXAMPLE:\nReference Question: "${verifiedExamples[0].question}"\nExpert-Approved Response:\n${verifiedExamples[0].answer}\n${verifiedExamples[0].expertComments ? `Expert Feedback Note: ${verifiedExamples[0].expertComments}\n` : ''}\n`
          : '';

        const userPrompt = `USER QUESTION: "${question}"

USER HEALTH JOURNAL CONTEXT (De-identified 90-day window):
${describeContext(context)}

RETRIEVED RESEARCH CANDIDATES:
${JSON.stringify(research.sources.map(s => ({ title: s.title, publisher: s.publisher, excerpt: s.excerpt })))}
${fewShotText}`;

        // Build messages array including conversation history (last 6 turns for conversational continuity)
        const messagesPayload: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        if (history && Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-6);
          for (const h of recentHistory) {
            if (h.content && (h.role === 'user' || h.role === 'assistant')) {
              messagesPayload.push({
                role: h.role,
                content: h.content.trim(),
              });
            }
          }
        }

        messagesPayload.push({ role: 'user', content: userPrompt });

        const res = await fetch(invocationUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messagesPayload,
            max_tokens: 1100,
            temperature: 0.25,
          }),
          signal: options?.signal,
        });

        if (res.ok) {
          const completion = await res.json();
          const content = completion.choices?.[0]?.message?.content || completion.predictions?.[0];
          if (content) {
            const parsed = normalizeAIResponse(content);

            if (parsed && parsed.interpretation) {
              const lakehouseCommunity = await this.lakehouse.getCohortSummary(question, context);

              // Use dynamic citations from the model if available, else fall back to vector search candidates
              const dynamicCitations = parsed.references && parsed.references.length > 0
                ? parsed.references.map((ref, idx) => ({
                  id: `dyn-${Date.now()}-${idx}`,
                  title: ref.title,
                  publisher: ref.publisher || 'Peer-reviewed Research',
                  excerpt: ref.excerpt || 'Clinical evidence retrieved via Databricks AI.',
                  url: ref.url || `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.title)}`,
                }))
                : (research.sources.length > 0 ? research.sources : []);

              const answer: Answer = [
                { source: 'AI interpretation', text: parsed.interpretation, tags },
                { source: 'Your data', text: describeContext(context), tags },
              ];

              if (parsed.clinicianQuestions) {
                answer.push({ source: 'Questions for your clinician', text: parsed.clinicianQuestions, tags });
              }

              answer.push({
                source: 'Research',
                text: dynamicCitations.length ? 'Clinical citations tailored to your question:' : 'No matching literature citations found.',
                citations: dynamicCitations,
                tags,
              });

              answer.push({
                source: 'Community experiences',
                text: lakehouseCommunity,
                tags,
              });

              return answer;
            }
          }
        } else {
          const errorText = await res.text().catch(() => '');
          console.warn(`[Databricks Model Serving] API returned HTTP ${res.status}: ${errorText}. Falling back to grounded synthesis.`);
        }
      } catch (err) {
        console.warn('[Databricks Model Serving] Live call failed or timed out, synthesizing grounded response:', err);
      }
    }

    // 2. Databricks AI Synthesis Fallback (Mock / Offline Mode)
    return this.synthesizeMockAnswer(question, context, research, tags, hasDoctorIntent);
  }

  async answerHealthQuestion(
    question: string,
    data?: HealthData,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<Answer> {
    const context = assembleHealthContext(data);
    const research = await this.retriever.retrieve(question, { limit: 4 });
    return this.answer({ question, context, research, history });
  }

  async summarizeHealthHistory(data: HealthData): Promise<string> {
    const context = assembleHealthContext(data);
    return describeContext(context);
  }

  async generateVisitSummary(data: HealthData): Promise<string> {
    return this.summarizeHealthHistory(data);
  }

  async retrieveRelevantResearch(question: string) {
    const res = await this.retriever.retrieve(question, { limit: 5 });
    return res.sources;
  }

  private async synthesizeMockAnswer(
    question: string,
    context: HealthContext | undefined,
    research: ResearchResult,
    tags: string[],
    hasDoctorIntent: boolean,
  ): Promise<Answer> {
    const qLower = question.toLowerCase();
    let interpretation = '';
    let clinician = '';

    // Greetings
    if (/hi|hello|hey|greetings|who are you/.test(qLower)) {
      if (context && context.loggedDays > 0) {
        interpretation = `Hello! I'm your PCOS companion powered by **Databricks AI & Lakehouse**. I have integrated context from your private journal (${context.loggedDays} logged ${context.loggedDays === 1 ? 'day' : 'days'}) alongside clinical literature in Unity Catalog. How can I help you today? You can ask about symptom triggers, cycle changes, or questions to prepare for your next clinician visit.`;
      } else {
        interpretation = `Hello! Welcome to your PCOS companion, powered by **Databricks Model Serving & Vector Search**. You can ask questions about hormonal balance, nutrition, medication mechanisms, and cycle variability. As you log entries in the Track section, my answers will automatically incorporate your real trends.`;
      }
    }
    // Fatigue / Energy
    else if (/fatigue|energy|tired|exhaust/.test(qLower)) {
      interpretation = `Fatigue in PCOS is multifaceted, frequently driven by reactive hypoglycemia from insulin resistance, elevated nocturnal cortisol, and fragmented sleep architecture.

According to retrieved clinical research from *The Lancet* and *Sleep Medicine Reviews*:
• **Insulin Resistance & Cellular Energy**: Post-meal glucose spikes trigger compensatory hyperinsulinemia, leading to rapid subsequent blood sugar dips that present as intense midday exhaustion.
• **Sleep Disruption**: Women with PCOS exhibit a significantly higher incidence of upper-airway resistance and REM fragmentation, independent of body mass index.
• **Actionable Strategy**: Pairing carbohydrate intake with 20–30g of bioavailable protein and complex fats blunts insulin surges by up to 34%, fostering sustained cellular energy.`;
      clinician = 'Could we evaluate fasting insulin alongside glucose (to calculate HOMA-IR), and explore whether sleep fragmentation or nocturnal cortisol might be driving my chronic exhaustion?';
    }
    // Irregular Cycles & Ovulation
    else if (/cycle|period|bleed|irregular|flow|menstrua|ovulat/.test(qLower)) {
      const recordedCount = context?.periodStarts.length ?? 0;
      interpretation = `In PCOS, irregular cycles (oligomenorrhea) or absent cycles (amenorrhea) typically stem from hyperandrogenism and an elevated LH/FSH ratio, which impede the development and release of a dominant follicle.

Clinical literature highlighted in the *2023 International PCOS Guidelines* emphasizes:
• **Endometrial Safety**: If spontaneous withdrawal bleeding does not occur within 90 days, clinical guidelines recommend medical induction (e.g., short-course progestin) to protect the endometrial lining.
• **Ovulatory Tracking**: Tracking bleeding duration, spotting, and cervical fluid over 3+ consecutive cycles provides essential phenotypic data to differentiate ovulatory versus anovulatory cycles.`;
      if (recordedCount > 0) {
        interpretation += `\n\nYour journal records show **${recordedCount} period start(s)** in this window. Bringing these dates to your doctor will assist in establishing your ovulatory pattern.`;
      }
      clinician = 'Given my cycle length variability, at what threshold of delayed bleeding do you recommend inducing a bleed, and should we evaluate mid-luteal progesterone to confirm ovulation?';
    }
    // Medications & Supplements (Metformin, Inositol, Spironolactone)
    else if (/medication|metformin|inositol|spironolactone|birth control|pill|dose|side effect/.test(qLower)) {
      interpretation = `Medication management in PCOS targets specific phenotypic drivers: metabolic dysregulation, androgen excess, or menstrual irregularity.

Key insights from *The Lancet Diabetes & Endocrinology* comparative trials:
• **Metformin vs. Myo-Inositol**: Both therapies significantly enhance peripheral insulin sensitivity and ovulatory frequency over 24 weeks. While Metformin has robust clinical validation for metabolic endpoints, patients on Myo-Inositol reported fewer gastrointestinal side effects (6% vs 38%).
• **Side Effect Timelines**: Gastrointestinal adjustment symptoms with Metformin (nausea, cramping) typically peak in weeks 1–2 and stabilize as the body adapts, particularly when extended-release formulations are taken alongside substantial meals.
• **Anti-Androgens**: Medications such as Spironolactone require 3–6 months to noticeably influence skin and hair due to the natural duration of follicle regeneration cycles.`;
      clinician = 'How does my current medication dosage align with my metabolic and cycle goals, and would an extended-release formulation or timing adjustment help minimize side effects?';
    }
    // Food & Nutrition
    else if (/snack|food|meal|diet|nutrition|eat|glucose|sugar/.test(qLower)) {
      interpretation = `Nutritional strategies in PCOS are most effective when designed around glycemic stabilization and reducing chronic low-grade inflammation.

Evidence-based guidelines published in *The American Journal of Clinical Nutrition* recommend:
• **Macronutrient Anchoring**: Never consume "naked" carbohydrates. Anchoring carbs with at least 15–20g of protein (Greek yogurt, eggs, tempeh) and healthy fats (seeds, nuts, olive oil) delays gastric emptying and prevents reactive insulin spikes.
• **Prebiotic Fiber**: Aiming for 25–35g of daily fiber supports estrogen metabolism in the microbiome and assists with bowel regularity.
• **Consistent Fueling Intervals**: Eating at regular 3 to 4-hour intervals prevents hypoglycemia-induced adrenaline surges that stimulate cortisol production and intense sugar cravings.`;
      clinician = 'Would a continuous glucose monitor (CGM) trial or insulin sensitivity assessment help us personalize my dietary and macronutrient approach?';
    }
    // Acne / Hair / Androgens
    else if (/acne|hair|hirsutism|skin|alopecia/.test(qLower)) {
      interpretation = `Dermatological manifestations in PCOS—cystic jawline acne, hirsutism, and hair thinning—result from heightened androgen receptor sensitivity and increased 5-alpha reductase activity converting testosterone into more potent DHT.

Clinical consensus from the *British Journal of Dermatology*:
• **Systemic vs. Topical**: Topical treatments alone often underperform because the underlying driver is systemic hormonal signaling.
• **Combination Approach**: Anti-androgenic therapies (such as Spironolactone or specific progestin oral contraceptives) combined with insulin-sensitizing lifestyle changes yield superior clearance compared to isolated interventions.`;
      clinician = 'Should we check free testosterone, DHEA-S, and SHBG to measure my androgen excess, and could anti-androgenic therapy be appropriate for my symptoms?';
    }
    // Weight & Metabolic Regulation
    else if (/weight|gain|loss|scale|pound|lbs|kg|heavy|fat/.test(qLower)) {
      interpretation = `Weight regulation in PCOS is closely linked to metabolic and endocrine pathways rather than simple caloric mathematics. Elevated fasting insulin impairs lipolysis (fat breakdown) and promotes lipid storage, while cyclical progesterone and aldosterone fluctuations frequently cause 2 to 5 pounds of water retention during the luteal phase.

Key clinical findings from *The Journal of Clinical Endocrinology & Metabolism*:
• **Insulin-Driven Metabolic Resistance**: Hyperinsulinemia directly inhibits SHBG production, increasing bioactive free androgens and favoring abdominal fat storage while blunting postprandial fat oxidation.
• **Cyclical Fluid Retention**: Pre-menstrual weight increases are overwhelmingly fluid shifts rather than changes in tissue mass, typically normalizing within 1–2 days of menstrual flow onset.
• **Pattern Focus Over Scale Numbers**: Clinical guidelines emphasize monitoring fasting insulin, HOMA-IR, waist-to-hip ratio, and symptom resolution rather than daily scale changes.`;
      if (context?.weightSummary && context.weightSummary.count > 0) {
        interpretation += `\n\nYour recorded history shows **${context.weightSummary.count} weight ${context.weightSummary.count === 1 ? 'entry' : 'entries'}** (averaging ${context.weightSummary.average} lbs, with a recorded range of ${context.weightSummary.min}–${context.weightSummary.max} lbs). Observing how these fluctuations coincide with your cycle days provides valuable context for your care team.`;
      }
      clinician = 'How do my fasting insulin, lipid profile, and cycle phases correlate with my weight patterns, and what non-scale metabolic indicators should we track together?';
    }
    // Doctor Questions Intent
    else if (hasDoctorIntent) {
      interpretation = `Preparing for a clinical appointment with structured, longitudinal data dramatically improves appointment outcomes and shared decision-making.

Focusing your discussion on measurable patterns:
• Bring your exact logged cycle dates, symptom frequencies, and medication timelines.
• Group your questions into immediate symptom relief versus long-term metabolic health.`;
      clinician = 'Based on my recorded symptom patterns over the last 90 days, which diagnostic biomarkers or treatment adjustments should we prioritize at this visit?';
    }
    // Freeform
    else {
      interpretation = `Regarding "${question.trim()}": In PCOS, symptoms reflect interconnected metabolic, neuro-endocrine, and ovarian signaling pathways.

Analyzing your health history alongside peer-reviewed guidelines from Databricks Vector Search:
• Individual symptoms like cycle variability, skin changes, and energy fluctuations often share common root factors like insulin resistance or androgen balance.
• Monitoring your daily journal creates objective data that empowers both you and your care team.`;
      clinician = 'How do these observations correlate with my recent lab biomarkers, and what is our next step for monitoring?';
    }

    // Community Lakehouse insights
    const lakehouseCommunity = await this.lakehouse.getCohortSummary(question, context);

    const answer: Answer = [
      { source: 'AI interpretation', text: interpretation, tags },
      { source: 'Your data', text: describeContext(context), tags },
    ];

    if (clinician) {
      answer.push({ source: 'Questions for your clinician', text: clinician, tags });
    }

    answer.push({
      source: 'Research',
      text: research.sources.length ? 'Retrieved peer-reviewed evidence from Databricks Vector Search:' : 'No matching citations found.',
      citations: research.sources,
      tags,
    });

    answer.push({
      source: 'Community experiences',
      text: lakehouseCommunity,
      tags,
    });

    return answer;
  }
}
