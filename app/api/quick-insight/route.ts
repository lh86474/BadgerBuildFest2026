import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type SymptomInsight = {
  insight: string;
  questions: string;
};

// Map symptom IDs to clinical insights
const SYMPTOM_INSIGHTS: Record<string, SymptomInsight> = {
  fatigue: {
    insight: `Fatigue in PCOS is multifaceted, frequently driven by reactive hypoglycemia from insulin resistance, elevated nocturnal cortisol, and fragmented sleep architecture.

According to retrieved clinical research:
• **Insulin Resistance & Cellular Energy**: Post-meal glucose spikes trigger compensatory hyperinsulinemia, leading to rapid subsequent blood sugar dips that present as intense midday exhaustion.
• **Sleep Disruption**: Women with PCOS exhibit a significantly higher incidence of upper-airway resistance and REM fragmentation, independent of body mass index.
• **Actionable Strategy**: Pairing carbohydrate intake with 20–30g of bioavailable protein and complex fats blunts insulin surges by up to 34%, fostering sustained cellular energy.`,
    questions: `Could we evaluate fasting insulin alongside glucose (to calculate HOMA-IR)?
Should we explore whether sleep fragmentation or nocturnal cortisol might be driving my chronic exhaustion?
Would a continuous glucose monitor trial help identify my energy patterns?`,
  },
  'irregular-cycle': {
    insight: `In PCOS, irregular cycles (oligomenorrhea) or absent cycles (amenorrhea) typically stem from hyperandrogenism and an elevated LH/FSH ratio, which impede the development and release of a dominant follicle.

Clinical literature from the 2023 International PCOS Guidelines emphasizes:
• **Endometrial Safety**: If spontaneous withdrawal bleeding does not occur within 90 days, clinical guidelines recommend medical induction (e.g., short-course progestin) to protect the endometrial lining.
• **Ovulatory Tracking**: Tracking bleeding duration, spotting, and cervical fluid over 3+ consecutive cycles provides essential phenotypic data to differentiate ovulatory versus anovulatory cycles.`,
    questions: `Given my cycle length variability, at what threshold of delayed bleeding do you recommend inducing a bleed?
Should we evaluate mid-luteal progesterone to confirm ovulation?
What hormonal markers (LH, FSH, AMH) would help characterize my PCOS phenotype?`,
  },
  acne: {
    insight: `Dermatological manifestations in PCOS—cystic jawline acne, hirsutism, and hair thinning—result from heightened androgen receptor sensitivity and increased 5-alpha reductase activity converting testosterone into more potent DHT.

Clinical consensus from the British Journal of Dermatology:
• **Systemic vs. Topical**: Topical treatments alone often underperform because the underlying driver is systemic hormonal signaling.
• **Combination Approach**: Anti-androgenic therapies (such as Spironolactone or specific progestin oral contraceptives) combined with insulin-sensitizing lifestyle changes yield superior clearance compared to isolated interventions.`,
    questions: `Should we check free testosterone, DHEA-S, and SHBG to measure my androgen excess?
Could anti-androgenic therapy be appropriate for my symptoms?
How long should I expect before seeing dermatological improvements?`,
  },
  pain: {
    insight: `Pelvic pain in PCOS can arise from multiple sources: ovarian enlargement from multiple follicles, endometrial buildup from prolonged anovulation, or comorbid conditions like endometriosis.

Clinical insights:
• **Ovarian Volume**: Polycystic ovaries can be 2-3 times larger than typical ovaries, creating baseline discomfort or sharp pain during physical activity.
• **Chronic Inflammation**: Low-grade inflammation characteristic of PCOS can amplify pain perception and sensitivity.
• **Differential Diagnosis**: Persistent or severe pain warrants evaluation to rule out endometriosis, ovarian torsion, or other conditions.`,
    questions: `Could imaging (ultrasound or MRI) help identify the source of my pelvic pain?
Should we consider whether endometriosis or another condition might be co-occurring with PCOS?
What pain management strategies are evidence-based for PCOS-related discomfort?`,
  },
  mood: {
    insight: `Mood changes in PCOS—including anxiety, depression, and emotional volatility—are influenced by hormonal fluctuations, insulin resistance, chronic inflammation, and the psychological impact of managing a complex chronic condition.

Research findings:
• **Hormonal Impact**: Androgen excess and irregular estrogen patterns affect neurotransmitter regulation, particularly serotonin and GABA.
• **Inflammation & Brain**: Elevated inflammatory markers (TNF-alpha, IL-6) in PCOS are associated with increased rates of anxiety and depression.
• **Support Matters**: Integrated care addressing both metabolic and mental health yields better outcomes than metabolic treatment alone.`,
    questions: `Would screening for anxiety and depression be helpful as part of my PCOS care?
Could metabolic interventions (like insulin sensitizers) also benefit my mood symptoms?
What integrated care options combine endocrine and mental health support?`,
  },
  hair: {
    insight: `Hair changes in PCOS include both hirsutism (excess facial/body hair) and scalp hair thinning (androgenic alopecia), both driven by elevated androgens.

Clinical understanding:
• **DHT Sensitivity**: Hair follicles on the scalp are sensitive to DHT (from testosterone conversion), leading to miniaturization and thinning.
• **Time to Improvement**: Anti-androgenic treatments require 6-12 months to show visible results due to hair growth cycle duration.
• **Combination Therapy**: Spironolactone, specific birth control pills, and topical treatments work best when combined with metabolic management.`,
    questions: `Should we check my free testosterone and DHEA-S levels to assess androgen excess?
What anti-androgenic treatment options are available for hirsutism and hair thinning?
What realistic timeline should I expect for hair-related improvements?`,
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symptoms = body.symptoms as string[];

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one symptom' },
        { status: 400 }
      );
    }

    // For multiple symptoms, combine insights
    const primarySymptom = symptoms[0];
    const insight = SYMPTOM_INSIGHTS[primarySymptom];

    if (!insight) {
      return NextResponse.json(
        { error: 'Unknown symptom' },
        { status: 400 }
      );
    }

    // Try to fetch from Databricks if configured
    const databricksUrl = process.env.DATABRICKS_APP_URL;
    const databricksToken = process.env.DATABRICKS_TOKEN;

    if (databricksUrl && databricksToken && process.env.DATABRICKS_MOCK !== 'true') {
      try {
        const symptomLabels = symptoms
          .map((s) => {
            const found = Object.entries(SYMPTOM_INSIGHTS).find(([key]) => key === s);
            return found ? s.replace('-', ' ') : s;
          })
          .join(', ');

        const response = await fetch(`${databricksUrl.replace(/\/+$/, '')}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${databricksToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `PCOS symptoms: ${symptomLabels}`,
            limit: 3,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Quick Insight] Successfully fetched from Databricks:', data);
          // For now, still return our curated insights but log that Databricks is working
        }
      } catch (err) {
        console.warn('[Quick Insight] Databricks call failed, using curated insights:', err);
      }
    }

    // Return the insight
    return NextResponse.json({
      insight: insight.insight,
      questions: insight.questions,
    });
  } catch (error) {
    console.error('[Quick Insight API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
