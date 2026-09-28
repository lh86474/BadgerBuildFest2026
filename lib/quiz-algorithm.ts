import type {
  QuizAnswers,
  QuizResult,
  PMOSPhenotype,
  PCOSPhenotype,
  OvulatoryPillar,
  SecondaryPillar,
  DriverScores,
} from './quiz-types';

export function calculateQuizResult(answers: QuizAnswers): QuizResult {
  // 1. Metabolic & Insulin Resistance Index (0 - 100)
  let metabolicRaw = 0;
  const keySignals: string[] = [];

  if (answers.carbReaction === 'shaky_hypoglycemia') {
    metabolicRaw += 30;
    keySignals.push('Reactive hypoglycemia / post-meal shakiness');
  } else if (answers.carbReaction === 'severe_crash') {
    metabolicRaw += 25;
    keySignals.push('Post-prandial energy crash and cognitive fog');
  } else if (answers.carbReaction === 'hungry_craving') {
    metabolicRaw += 18;
  }

  const cravings = answers.cravingsIntensity ?? 0;
  metabolicRaw += Math.min(25, (cravings / 5) * 25);
  if (cravings >= 4) {
    keySignals.push('Intense late-day carbohydrate & sugar cravings');
  }

  if (answers.fatStorage === 'midsection') {
    metabolicRaw += 25;
    keySignals.push('Central / visceral fat distribution tendency');
  } else if (answers.fatStorage === 'hips_thighs') {
    metabolicRaw += 5;
  }

  const actualSkinMarkers = (answers.skinMarkers ?? []).filter((s) => s !== 'neither');
  if (actualSkinMarkers.includes('darkened_patches')) {
    metabolicRaw += 20;
    keySignals.push('Acanthosis Nigricans / darkened skin crease patches');
  }
  if (actualSkinMarkers.includes('skin_tags')) {
    metabolicRaw += 15;
    keySignals.push('Crease skin tags (insulin-mediated fibroblast activity)');
  }

  const metabolicScore = Math.min(100, Math.round(metabolicRaw));

  // 2. Androgenic Sensitivity & Excess Index (0 - 100)
  let androgenRaw = 0;
  if (answers.androgenOnset === 'early_puberty') {
    androgenRaw += 25;
    keySignals.push('Early pubertal onset of androgenic sensitivity');
  } else if (answers.androgenOnset === 'late_teens') {
    androgenRaw += 20;
  } else if (answers.androgenOnset === 'post_birth_control') {
    androgenRaw += 20;
  } else if (answers.androgenOnset === 'post_stress') {
    androgenRaw += 20;
  }

  const hirsutism = answers.hirsutismSites ?? [];
  if (hirsutism.includes('chin_jawline_lip')) {
    androgenRaw += 25;
    keySignals.push('Facial terminal hair pattern (chin/jawline/lip)');
  }
  if (hirsutism.includes('chest_back')) {
    androgenRaw += 25;
    keySignals.push('Midline torso hair growth (chest/upper back)');
  }
  if (hirsutism.includes('abdomen_thighs')) {
    androgenRaw += 20;
  }

  const acne = answers.acnePatterns ?? [];
  if (acne.includes('cystic_jawline')) {
    androgenRaw += 25;
    keySignals.push('Deep cystic breakouts localized to jawline/chin');
  }
  if (acne.includes('chest_back')) {
    androgenRaw += 15;
  }
  if (acne.includes('pre_bleed_flare')) {
    androgenRaw += 15;
  }

  const androgenScore = Math.min(100, Math.round(androgenRaw));

  // 3. Neuro-Adrenal & HPA-Axis Stress Index (0 - 100)
  let adrenalRaw = 0;
  if (answers.exerciseReaction === 'exhausted_24h') {
    adrenalRaw += 35;
    keySignals.push('Prolonged post-HIIT exhaustion / wired-but-tired fatigue');
  } else if (answers.exerciseReaction === 'intense_hunger_anxiety') {
    adrenalRaw += 20;
  }

  const sleepPatterns = answers.nervousSleepPatterns ?? [];
  if (sleepPatterns.includes('wired_but_tired')) {
    adrenalRaw += 20;
    keySignals.push('Nocturnal "wired but tired" circadian phase delay');
  }
  if (sleepPatterns.includes('wake_2am_4am')) {
    adrenalRaw += 25;
    keySignals.push('2 AM–4 AM autonomic arousal / cortisol spikes');
  }
  if (sleepPatterns.includes('caffeine_sensitivity')) {
    adrenalRaw += 15;
    keySignals.push('Elevated sympathetic caffeine sensitivity');
  }
  if (sleepPatterns.includes('unrefreshed_sleep')) {
    adrenalRaw += 15;
  }

  const stress = answers.stressLevel ?? 0;
  adrenalRaw += Math.min(30, (stress / 5) * 30);
  if (stress >= 4) {
    keySignals.push('Elevated chronic baseline stress / burnout load');
  }

  const adrenalScore = Math.min(100, Math.round(adrenalRaw));

  // 4. Inflammatory & Immune Driver Index (0 - 100)
  let inflammatoryRaw = 0;
  const inflameSymptoms = answers.inflammatorySymptoms ?? [];
  if (inflameSymptoms.includes('joint_fatigue')) {
    inflammatoryRaw += 25;
    keySignals.push('Systemic joint stiffness and inflammatory fatigue');
  }
  if (inflameSymptoms.includes('skin_flushing_histamine')) {
    inflammatoryRaw += 25;
    keySignals.push('Histamine / mast-cell flushing tendencies');
  }
  if (inflameSymptoms.includes('severe_bloating_post_meal')) {
    inflammatoryRaw += 25;
    keySignals.push('Rapid post-meal gut distention / microbiome disruption');
  }
  if (inflameSymptoms.includes('cycle_headaches')) {
    inflammatoryRaw += 20;
    keySignals.push('Neuro-inflammatory cycle migraines or headaches');
  }

  const conditions = answers.relatedConditions ?? [];
  if (conditions.includes('thyroid')) {
    inflammatoryRaw += 25;
    keySignals.push('Co-existing thyroid autoimmunity or under-function');
  }
  if (conditions.includes('endometriosis_adenomyosis')) {
    inflammatoryRaw += 25;
    keySignals.push('Pelvic inflammatory / endometriosis overlap');
  }
  if (conditions.includes('ibs_sibo')) {
    inflammatoryRaw += 25;
    keySignals.push('GI gut-barrier compromise (IBS/SIBO)');
  }
  if (conditions.includes('vitamin_deficiency')) {
    inflammatoryRaw += 15;
  }

  const inflammatoryScore = Math.min(100, Math.round(inflammatoryRaw));

  // 5. Ovulatory Disruption Calculation & Pillar Determination
  let ovulatoryRaw = 0;
  let haConfidence = 0;
  let postPillConfidence = 0;
  let trueAnovConfidence = 0;
  let regularOvConfidence = 0;

  // Cycle pattern analysis
  if (answers.cyclePattern === 'absent_6_plus_months') {
    ovulatoryRaw += 55;
    haConfidence += 45;
    trueAnovConfidence += 40;
  } else if (answers.cyclePattern === 'medication_only') {
    ovulatoryRaw += 50;
    trueAnovConfidence += 45;
  } else if (answers.cyclePattern === 'highly_irregular_46_90') {
    ovulatoryRaw += 40;
    trueAnovConfidence += 40;
  } else if (answers.cyclePattern === 'slightly_irregular_36_45') {
    ovulatoryRaw += 20;
    regularOvConfidence += 25;
  } else if (answers.cyclePattern === 'predictable_21_35') {
    ovulatoryRaw += 5;
    regularOvConfidence += 50;
  }

  // Fertile mucus analysis
  if (answers.fertileMucus === 'almost_never') {
    ovulatoryRaw += 25;
    trueAnovConfidence += 25;
    haConfidence += 25;
  } else if (answers.fertileMucus === 'occasionally_patches') {
    ovulatoryRaw += 15;
    trueAnovConfidence += 20;
  } else if (answers.fertileMucus === 'regularly_monthly') {
    regularOvConfidence += 40;
  }

  // Birth control timeline analysis
  if (answers.birthControlTimeline === 'less_than_3_months') {
    postPillConfidence += 60;
  } else if (answers.birthControlTimeline === '3_to_6_months') {
    postPillConfidence += 50;
  } else if (answers.birthControlTimeline === '6_to_12_months') {
    postPillConfidence += 30;
  } else if (answers.birthControlTimeline === 'currently_on') {
    postPillConfidence += 25;
  }

  if (answers.androgenOnset === 'post_birth_control') {
    postPillConfidence += 35;
  }

  // Hypothalamic Amenorrhea (HA) weighting: high stress + HIIT exhaustion + absent/delayed cycle + low visceral fat
  if (answers.exerciseReaction === 'exhausted_24h') {
    haConfidence += 25;
  }
  if (stress >= 3) {
    haConfidence += (stress / 5) * 25;
  }
  if (answers.fatStorage !== 'midsection' && actualSkinMarkers.length === 0) {
    haConfidence += 15;
  }

  const ovulatoryDisruptionScore = Math.min(100, Math.round(ovulatoryRaw));

  // Determine Primary Pillar
  let primaryPillar: OvulatoryPillar;
  let primaryPillarDescription: string;

  if (postPillConfidence >= 55 && answers.cyclePattern !== 'predictable_21_35') {
    primaryPillar = 'Post-Pill Synthetic Hormone Transition';
    primaryPillarDescription =
      'Your ovulatory signaling is actively recalibrating after recent hormonal contraceptive use. The communication between your brain and ovaries is gradually restarting natural follicle selection and progesterone production.';
  } else if (
    haConfidence >= 65 &&
    (answers.cyclePattern === 'absent_6_plus_months' || answers.cyclePattern === 'highly_irregular_46_90') &&
    metabolicScore < 45
  ) {
    primaryPillar = 'Hypothalamic Amenorrhea Pattern';
    primaryPillarDescription =
      'Your ovulatory pauses align with hypothalamic signaling conservation, where baseline stress, sympathetic overdrive, or high energy output temporarily suppresses GnRH pulsatility in the brain.';
  } else if (
    answers.cyclePattern === 'highly_irregular_46_90' ||
    answers.cyclePattern === 'absent_6_plus_months' ||
    answers.cyclePattern === 'medication_only' ||
    answers.fertileMucus === 'almost_never' ||
    answers.fertileMucus === 'occasionally_patches'
  ) {
    primaryPillar = 'True Anovulation Pattern';
    primaryPillarDescription =
      'Your cycles show signs of infrequent or halted ovulation (oligo-anovulation). Follicles often begin developing in waves without reaching final maturation and release, creating delayed or missed bleeds.';
  } else {
    primaryPillar = 'Preserved / Subtle Ovulatory Pattern';
    primaryPillarDescription =
      'Your natural menstrual cycles maintain regular or near-regular monthly rhythm, though follicular development or luteal phase stability may experience subtle cyclical or metabolic interference.';
  }

  // Determine Secondary Pillar
  let secondaryPillar: SecondaryPillar;
  let secondaryPillarDescription: string;

  if (primaryPillar !== 'Post-Pill Synthetic Hormone Transition' && postPillConfidence >= 30) {
    secondaryPillar = 'Post-Pill Synthetic Hormone Rebound';
    secondaryPillarDescription =
      'Residual synthetic hormone clearance or post-contraceptive androgen rebound is contributing secondary feedback noise to your cycle.';
  } else if (adrenalScore >= 50 && primaryPillar !== 'Hypothalamic Amenorrhea Pattern') {
    secondaryPillar = 'Neuro-Adrenal HPA Stress Driver';
    secondaryPillarDescription =
      'Heightened adrenal signaling and cortisol fluctuations are creating secondary stress feedback on your reproductive neuro-endocrine axis.';
  } else if (metabolicScore >= 45) {
    secondaryPillar = 'Metabolic Glycemic & Insulin Driver';
    secondaryPillarDescription =
      'Post-prandial glycemic swings and compensatory insulin release are acting as a secondary metabolic drag on ovarian theca cells.';
  } else if (inflammatoryScore >= 45) {
    secondaryPillar = 'Systemic Low-Grade Inflammatory Trigger';
    secondaryPillarDescription =
      'Underlying gut-immune flares or systemic inflammatory cytokines are amplifying cellular sensitivity and cyclical discomfort.';
  } else if (primaryPillar === 'Hypothalamic Amenorrhea Pattern') {
    secondaryPillar = 'Co-Occurring Neuro-Endocrine Axis Stress';
    secondaryPillarDescription =
      'Autonomic nervous system recovery and cellular nourishment are key concurrent factors in restoring predictable ovulatory signals.';
  } else {
    secondaryPillar = 'Subtle Luteal Phase Irregularity';
    secondaryPillarDescription =
      'Occasional fluctuations in post-ovulatory progesterone production or cycle timing subtly shape your monthly symptom rhythm.';
  }

  // 6. Assign 1 of 4 Rotterdam PMOS Phenotypes
  // Phenotype A: Hyperandrogenism + Ovulatory Dysfunction + Metabolic / PCOM Manifestations
  // Phenotype B: Hyperandrogenism + Ovulatory Dysfunction (without prominent metabolic insulin resistance)
  // Phenotype C: Hyperandrogenism + Preserved Ovulation
  // Phenotype D: Ovulatory Dysfunction + Metabolic / Inflammatory without significant clinical hyperandrogenism

  const hasHyperandrogenism = androgenScore >= 35;
  const hasOvulatoryDysfunction =
    answers.cyclePattern === 'highly_irregular_46_90' ||
    answers.cyclePattern === 'absent_6_plus_months' ||
    answers.cyclePattern === 'medication_only' ||
    ovulatoryDisruptionScore >= 40;
  const hasMetabolicMarkers = metabolicScore >= 40 || answers.fatStorage === 'midsection' || actualSkinMarkers.length > 0;

  let phenotype: PMOSPhenotype;
  let phenotypeTitle: string;
  let phenotypeSubtitle: string;
  let phenotypeDescription: string;

  if (hasHyperandrogenism && hasOvulatoryDysfunction && hasMetabolicMarkers) {
    phenotype = 'Phenotype A';
    phenotypeTitle = 'Phenotype A: Classic Hyperandrogenic';
    phenotypeSubtitle = 'Marked androgenic signs, ovulatory irregularity, and prominent metabolic sensitivity.';
    phenotypeDescription =
      'Phenotype A represents the classic presentation characterized by both ovulatory pauses and androgen sensitivity, frequently accompanied by glycemic or metabolic response patterns. This gives you a clear target: supporting daily blood glucose stability and ovarian signaling.';
  } else if (hasHyperandrogenism && hasOvulatoryDysfunction && !hasMetabolicMarkers) {
    phenotype = 'Phenotype B';
    phenotypeTitle = 'Phenotype B: Non-Metabolic Hyperandrogenic';
    phenotypeSubtitle = 'Marked androgenic signs and cycle delay with low-to-moderate metabolic markers.';
    phenotypeDescription =
      'Phenotype B features cycle irregularity and androgen sensitivity (such as facial hair or cystic skin changes), but without dominant insulin resistance. This pattern is frequently linked to neuro-adrenal signaling, DHEA-S production, or post-contraceptive transitions.';
  } else if (hasHyperandrogenism && !hasOvulatoryDysfunction) {
    phenotype = 'Phenotype C';
    phenotypeTitle = 'Phenotype C: Ovulatory Expression';
    phenotypeSubtitle = 'Preserved menstrual regularity alongside androgenic tissue sensitivity or cyclical flares.';
    phenotypeDescription =
      'Phenotype C is characterized by predictable or near-predictable bleeding intervals while still experiencing androgenic symptoms like jawline cystic breakouts, hirsutism, or follicle clustering. Maintaining ovulatory health while soothing tissue sensitivity is your primary ally.';
  } else {
    phenotype = 'Phenotype D';
    phenotypeTitle = 'Phenotype D: Normoandrogenic / Metabolic';
    phenotypeSubtitle = 'Ovulatory irregularity and metabolic or inflammatory signaling without overt androgen excess.';
    phenotypeDescription =
      'Phenotype D features cycle unpredictability or delayed ovulation alongside metabolic or inflammatory sensitivities, but with minimal coarse hair growth or severe androgenic flares. Your focus centers on metabolic steadiness and gut-immune harmony to encourage consistent ovulation.';
  }

  // 7. "A little why this matters part"
  // Friendly, calm, reassuring, educational, NOT scary:
  const whyThisMatters =
    `Your primary pillar (${primaryPillar.toLowerCase()}) and secondary pillar (${secondaryPillar.toLowerCase()}) reflect how your cycle communication and cellular energy are currently balancing, while ${phenotypeTitle} describes your unique blend of androgen and metabolic sensitivities. These are dynamic functional patterns that evolve with supportive care, giving you and your care team clear clarity rather than overwhelming guesswork.`;

  // 8. Personalized Actionable Recommendations
  const recommendations: { category: string; points: string[] }[] = [];

  if (metabolicScore >= 40) {
    recommendations.push({
      category: 'Metabolic & Meal Rhythm',
      points: [
        'Pair complex carbohydrates with protein (25–30g) and dietary fats to buffer post-prandial glucose surges and curb afternoon dips.',
        'Take a 10–15 minute gentle walk after higher-carbohydrate meals to stimulate non-insulin GLUT4 glucose uptake.',
        'Observe how different breakfast combinations influence your 3–5 PM cravings using the Daily Track tab.',
      ],
    });
  }

  if (adrenalScore >= 40) {
    recommendations.push({
      category: 'Nervous System & Recovery',
      points: [
        'Shift high-intensity HIIT or exhaustive cardio toward strength training, reformer Pilates, or steady-state walking to prevent prolonged cortisol elevation.',
        'Implement an evening wind-down routine with dim lighting 1 hour prior to sleep to ease "wired but tired" nocturnal surges.',
        'Consider spacing morning caffeine until 60–90 minutes after waking and after a balanced breakfast.',
      ],
    });
  }

  if (inflammatoryScore >= 40) {
    recommendations.push({
      category: 'Gut-Immune & Inflammatory Balance',
      points: [
        'Notice any correlations between post-meal bloating and cyclical headaches in your longitudinal symptom timeline.',
        'Incorporate omega-3 fatty acids, vibrant colorful polyphenols, and prebiotic fibers to support the gut microbiome barrier.',
      ],
    });
  }

  recommendations.push({
    category: 'Longitudinal Tracking in PHASE',
    points: [
      'Log fertile cervical mucus and bleeding patterns across the next 2–3 cycles to map your true ovulatory return.',
      'Track your daily energy, pain, and sleep scores alongside symptoms to reveal hidden correlations in the Insights tab.',
    ],
  });

  // 9. Clinician Discussion Prompts
  const questionsForClinician: string[] = [
    `Based on my ${phenotype} profile and ${primaryPillar.toLowerCase()}, what specific lab tests (such as fasting insulin, lipid profile, DHEA-S, or free testosterone) would give us the clearest baseline?`,
    'Are there specific cycle tracking markers or ultrasound evaluations you recommend to monitor my ovulatory status?',
    'How do you recommend we address my primary driver while supporting my overall energy and long-term metabolic health?',
  ];

  const scores: DriverScores = {
    metabolic: metabolicScore,
    adrenal: adrenalScore,
    inflammatory: inflammatoryScore,
    androgenic: androgenScore,
    ovulatoryDisruption: ovulatoryDisruptionScore,
  };

  return {
    phenotype,
    phenotypeTitle,
    phenotypeSubtitle,
    phenotypeDescription,
    primaryPillar,
    primaryPillarDescription,
    secondaryPillar,
    secondaryPillarDescription,
    whyThisMatters,
    scores,
    keySignals,
    recommendations,
    questionsForClinician,
    completedAt: new Date().toISOString(),
    answers,
  };
}
