import type { HealthData } from './health';
import { assembleHealthContext, type HealthContext } from './health-context';
import { DevelopmentResearchRetriever, type ResearchRetriever, type ResearchSource } from './research';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type Answer = {
  source: 'Your data' | 'Research' | 'AI interpretation' | 'Community experiences' | 'Questions for your clinician';
  text: string;
  citations?: ResearchSource[];
  tags?: string[];
}[];
export interface AIService {
  answerHealthQuestion(question: string, data?: HealthData, history?: ChatHistoryMessage[]): Promise<Answer>;
  summarizeHealthHistory(data: HealthData): Promise<string>;
  generateVisitSummary(data: HealthData): Promise<string>;
  retrieveRelevantResearch(question: string): Promise<ResearchSource[]>;
}
export function extractContextTags(context?: HealthContext, question = ''): string[] {
  if (!context || (context.loggedDays === 0 && context.medications.length === 0 && context.labs.length === 0)) {
    return [];
  }
  const tags: string[] = [];
  const q = question.toLowerCase();

  // Logged days tag
  if (context.loggedDays > 0) {
    tags.push(`${context.loggedDays} ${context.loggedDays === 1 ? 'logged day' : 'logged days'}`);
  }

  // Symptoms tags
  if (context.symptoms.length > 0) {
    const mentionedSymptoms = context.symptoms.filter((s) => q.includes(s.name.toLowerCase()));
    if (mentionedSymptoms.length > 0) {
      for (const s of mentionedSymptoms) {
        if (tags.length < 5) tags.push(`${s.name} (${s.days}d)`);
      }
    } else {
      for (const s of context.symptoms.slice(0, 3)) {
        if (tags.length < 4) tags.push(`${s.name} (${s.days}d)`);
      }
    }
  }

  // Cycle tags
  if (context.periodStarts.length > 0 && (q.includes('cycle') || q.includes('period') || tags.length < 3)) {
    tags.push(`${context.periodStarts.length} ${context.periodStarts.length === 1 ? 'period start' : 'period starts'}`);
  }

  // Medications tags
  if (context.medications.length > 0) {
    for (const m of context.medications) {
      if (tags.length < 5) tags.push(m.name);
    }
  }

  // Labs tags
  if (context.labs.length > 0 && (q.includes('lab') || q.includes('test') || q.includes('blood') || tags.length < 4)) {
    for (const l of context.labs) {
      if (tags.length < 5) tags.push(`${l.name}: ${l.value} ${l.unit}`);
    }
  }

  // Weight tags
  if (context.weightSummary && context.weightSummary.count > 0 && (q.includes('weight') || q.includes('scale') || q.includes('pound') || q.includes('lbs') || q.includes('kg') || tags.length < 4)) {
    if (context.weightSummary.latest) {
      tags.push(`Weight: ${context.weightSummary.latest.value} ${context.weightSummary.latest.unit}`);
    }
  }

  return tags;
}

export function describeContext(context?: HealthContext): string {
  if (!context) return 'Personalization is off. Your health records were not included.';
  if (context.loggedDays === 0 && context.medications.length === 0 && context.labs.length === 0) {
    return 'Your journal is currently empty for the last 90 days. As you log symptoms, cycles, and medications in the Track section, your responses here will automatically reflect your private data.';
  }
  const symptoms = context.symptoms.slice(0, 5).map(s => `${s.name} (${s.days} logged ${s.days === 1 ? 'day' : 'days'})`).join(', ');
  const meds = context.medications.length > 0
    ? ` Active medications: ${context.medications.map(m => m.name).join(', ')}.`
    : '';
  const labs = context.labs.length > 0
    ? ` Recent labs: ${context.labs.map(l => `${l.name} (${l.value} ${l.unit})`).join(', ')}.`
    : '';
  const weight = context.weightSummary && context.weightSummary.count > 0
    ? ` Weight: ${context.weightSummary.count} ${context.weightSummary.count === 1 ? 'entry' : 'entries'} (latest ${context.weightSummary.latest?.value} ${context.weightSummary.latest?.unit}, range ${context.weightSummary.min}–${context.weightSummary.max}).`
    : '';

  let detailedLogs = '';
  if (context.recentLogs && context.recentLogs.length > 0) {
    const formattedRows = context.recentLogs.slice(-20).map(log => {
      const items: string[] = [`Date ${log.date}`];
      if (log.symptoms.length > 0) items.push(`Symptoms: ${log.symptoms.join(', ')}`);
      if (log.pain !== undefined && log.pain > 0) items.push(`Pain: ${log.pain}/5`);
      if (log.energy !== undefined) items.push(`Energy: ${log.energy}/5`);
      if (log.mood !== undefined) items.push(`Mood: ${log.mood}/5`);
      if (log.sleepMinutes !== undefined) items.push(`Sleep: ${Math.round(log.sleepMinutes / 60 * 10) / 10}h (${log.sleepQuality || 'Normal'})`);
      if (log.weight !== undefined) items.push(`Weight: ${log.weight} ${log.weightUnit || 'lbs'}${log.weightNote ? ` (${log.weightNote})` : ''}`);
      if (log.periodStart) items.push(`[Period Started]`);
      return `  - ${items.join(' | ')}`;
    });
    detailedLogs = `\n\nDETAILED USER JOURNAL ENTRIES (Reference these specific dates and trends directly):\n` + formattedRows.join('\n');
  }

  return `${context.loggedDays} distinct ${context.loggedDays === 1 ? 'day' : 'days'} logged from ${context.start} to ${context.end}. ${symptoms ? `Symptoms tracked: ${symptoms}.` : 'No symptoms recorded in this window.'} Period starts: ${context.periodStarts.length}.${meds}${labs}${weight}${detailedLogs}`;
}
export class DevelopmentAIService implements AIService {
  private readonly research: ResearchRetriever;
  constructor(research: ResearchRetriever = new DevelopmentResearchRetriever()) { this.research = research; }
  async answerHealthQuestion(question: string, data?: HealthData, history?: ChatHistoryMessage[]): Promise<Answer> {
    const context = assembleHealthContext(data);
    const q = question.toLowerCase();
    const tags = extractContextTags(context, question);
    const hasDoctorIntent = /doctor|clinician|ask|appointment|visit|discuss with|bring to/.test(q);

    let interpretation = '';
    let clinician = '';

    if (/hi|hello|hey|greetings|who are you/.test(q)) {
      if (context && context.loggedDays > 0) {
        const topSymptom = context.symptoms[0]?.name;
        interpretation = `Hello! I'm your PCOS companion, connected with your private journal (${context.loggedDays} ${context.loggedDays === 1 ? 'day' : 'days'} logged${topSymptom ? `, most frequently noting ${topSymptom.toLowerCase()}` : ''}). How can I help you today? You can ask about your symptoms, cycle patterns, or general PCOS management.`;
      } else {
        interpretation = 'Hello! Welcome to your PCOS health companion. I can answer questions about PCOS symptoms, cycle changes, nutrition, and health trends. As you log entries in the Track section, my answers will automatically reflect your personal data.';
      }
    } else if (hasDoctorIntent) {
      if (/cycle|period|irregular/.test(q)) {
        clinician = 'What cycle details would help our discussion, and when should we schedule follow-up hormonal testing?';
        interpretation = `When discussing irregular cycles with your doctor, having your logged cycle dates provides a strong clinical baseline. Here are recommended questions to explore:\n\n• "Given my cycle spacing, should we evaluate ovulatory status or luteal phase length with mid-luteal progesterone testing?"\n• "What threshold of missed periods or cycle length indicates we should induce a bleed to protect the endometrial lining?"\n• "Are there specific hormonal or ultrasound checks you recommend at this stage?"`;
      } else if (/medication|side effect|metformin|spironolactone/.test(q)) {
        clinician = 'Can we review the timing of my symptoms alongside my medication schedule?';
        interpretation = `When reviewing medications with your clinician, it helps to correlate start dates with how you feel. Questions to consider:\n\n• "Is my current dosage effectively addressing my metabolic or hormonal goals?"\n• "Are the symptoms I've logged common adjustment side effects, and when should they stabilize?"\n• "Would taking this with specific meals or adjusting release formulations help minimize discomfort?"`;
      } else if (/lab|test|blood|result/.test(q)) {
        clinician = 'How should we interpret this lab result alongside its units, reference range, and my clinical symptoms?';
        interpretation = `For laboratory discussions, bring the complete report including reference ranges. Key questions:\n\n• "How do these results correlate with my day-to-day symptoms?"\n• "Should we evaluate fasting insulin alongside glucose to calculate HOMA-IR?"\n• "When should we schedule follow-up blood work to monitor progress?"`;
      } else {
        clinician = 'Which changes in my recorded history would be useful to discuss at my next appointment?';
        interpretation = `Here are high-yield questions for your next medical review:\n\n• "What priority should we focus on first—symptom relief, metabolic health, or cycle regularity?"\n• "Looking at my logged history, what biomarkers or treatment adjustments make the most sense?"\n• "What warning signs or red flags should prompt me to follow up sooner?"`;
      }
    } else if (/symptom|frequent|often|feel|common|trend/.test(q)) {
      if (context && context.symptoms.length > 0) {
        const top = context.symptoms.slice(0, 4).map(s => `**${s.name}** (${s.days} ${s.days === 1 ? 'day' : 'days'})`).join(', ');
        interpretation = `Based on your recent logs, your most recorded symptoms are: ${top}.\n\nIn PCOS, tracking frequencies helps separate baseline chronic symptoms from cyclical flare-ups. For example, noting whether fatigue or bloating peaks in specific cycle phases helps determine whether metabolic factors or hormonal shifts are the primary driver.`;
      } else {
        interpretation = 'You have not logged any symptoms in the last 90 days yet. As you record your daily feelings in the Track section, I will automatically calculate your most frequent symptoms and highlight patterns.';
      }
    } else if (/fatigue|tired|exhaust|energy/.test(q)) {
      interpretation = 'Fatigue is one of the most common yet under-discussed PCOS symptoms. It often stems from multiple overlapping factors: insulin resistance causing rapid blood sugar crashes, chronic low-grade inflammation, or disrupted sleep architecture. Tracking your energy levels alongside meals and sleep quality helps identify specific triggers.';
    } else if (/cycle|period|bleed|irregular|flow|menstrua|ovulat/.test(q)) {
      if (context && context.periodStarts.length > 0) {
        interpretation = `You have recorded **${context.periodStarts.length} period start(s)** in this 90-day window (most recently on ${context.periodStarts[context.periodStarts.length - 1]}).\n\nIn PCOS, irregular cycles (oligomenorrhea) are primarily driven by delayed or absent ovulation caused by elevated androgens or LH/FSH ratios. Keeping an ongoing record of bleeding duration and flow intensity provides invaluable diagnostic context.`;
      } else {
        interpretation = 'No period starts are currently logged in your journal for this 90-day window. In PCOS, cycle variability is very common. Logging start dates, spotting, and flow levels provides a concrete timeline for your clinician to assess ovulatory patterns.';
      }
    } else if (/medication|metformin|pill|dose|supplement|spironolactone|birth control|side effect/.test(q)) {
      if (context && context.medications.length > 0) {
        const medList = context.medications.map(m => `**${m.name}** (started ${m.startedAt})`).join(', ');
        interpretation = `Your active medications in your journal: ${medList}.\n\nWhen starting or adjusting medications (such as Metformin for insulin sensitization or Spironolactone for androgen excess), monitoring changes in the first 2 to 4 weeks is key. Always discuss any dosage adjustments directly with your prescribing clinician.`;
      } else {
        interpretation = 'You do not have any active medications recorded in your journal yet. Common PCOS medications include insulin-sensitizing agents (like Metformin), oral contraceptives for cycle regulation, and anti-androgens (like Spironolactone). You can track prescriptions and supplements in the Track section.';
      }
    } else if (/lab|result|test|blood|hormone|a1c|glucose|testosterone|dhea|lipid/.test(q)) {
      if (context && context.labs.length > 0) {
        const labList = context.labs.map(l => `• **${l.name}**: ${l.value} ${l.unit} (reference range: ${l.low}–${l.high})`).join('\n');
        interpretation = `Here are the lab results recorded in your journal:\n\n${labList}\n\nClinical lab values in PCOS should always be interpreted as a panel alongside your clinical symptoms, rather than as isolated numbers.`;
      } else {
        interpretation = 'No lab results are currently recorded in your journal. Typical PCOS lab panels evaluate total and free testosterone, DHEA-S, fasting glucose and insulin, HbA1c, and lipid panels. You can log dated results in the Track section.';
      }
    } else if (/snack|food|meal|diet|nutrition|eat|glucose|sugar/.test(q)) {
      interpretation = 'Nutrition in PCOS is most effective when focused on blood sugar stabilization and reducing chronic inflammation:\n\n• **Pair carbohydrates with protein and fat**: Adding protein (eggs, Greek yogurt, tofu) and healthy fats (avocado, nuts) slows gastric emptying and prevents insulin spikes.\n• **Emphasize fiber**: Aim for 25–30g of daily fiber from vegetables, berries, and legumes to nourish the gut microbiome and help eliminate excess hormones.\n• **Consistent meal spacing**: Regular fueling prevents dramatic glucose dips that trigger fatigue and intense sugar cravings.';
    } else if (/acne|skin|hair|hirsutism/.test(q)) {
      interpretation = 'Dermatological symptoms in PCOS—such as cystic acne along the jawline, hirsutism (excess facial or body hair), and androgenic alopecia—are driven by elevated circulating androgens or increased 5-alpha reductase activity converting testosterone to DHT. Nutritional support for insulin sensitivity and targeted medical therapies (like Spironolactone or specific oral contraceptives) are common approaches to discuss with a dermatologist or endocrinologist.';
    } else {
      // Dynamic freeform response
      interpretation = `Regarding your question about "${question.trim()}":\n\nIn PCOS, bodily symptoms and endocrine signals are interconnected through hormonal, metabolic, and neuro-immune pathways.`;
      if (context && context.loggedDays > 0) {
        interpretation += `\n\nYour journal contains ${context.loggedDays} ${context.loggedDays === 1 ? 'day' : 'days'} of data${context.symptoms.length > 0 ? ` with symptoms including ${context.symptoms.map(s => s.name).join(', ')}` : ''}. Reviewing how your symptoms change alongside lifestyle shifts will provide clearer personal insight.`;
      } else {
        interpretation += `\n\nAs you continue logging in the Track section, you'll be able to spot patterns and correlations between your symptoms and daily routines.`;
      }
    }

    const research = await this.research.retrieve(question, { limit: 5 });
    const answer: Answer = [
      { source: 'AI interpretation', text: interpretation, tags },
      { source: 'Your data', text: describeContext(context), tags },
    ];

    if (hasDoctorIntent && clinician) {
      answer.push({ source: 'Questions for your clinician', text: clinician, tags });
    }

    answer.push({
      source: 'Research',
      text: research.status === 'not-connected' ? 'Research retrieval is not connected. No medical evidence was retrieved for this response.' : research.sources.length ? 'Retrieved source excerpts are provided for review; the development provider does not synthesize medical advice.' : 'No relevant sources were found.',
      citations: research.sources,
      tags,
    });

    answer.push({
      source: 'Community experiences',
      text: 'Not connected. No community stories or statistics are used.',
      tags,
    });

    return answer;
  }
  async summarizeHealthHistory(data: HealthData) { return describeContext(assembleHealthContext(data)); }
  async generateVisitSummary(data: HealthData) { return this.summarizeHealthHistory(data); }
  async retrieveRelevantResearch(question: string) { return (await this.research.retrieve(question, { limit: 5 })).sources; }
}
// Compatibility export. Real providers belong in lib/server.
export const aiService: AIService = new DevelopmentAIService();
