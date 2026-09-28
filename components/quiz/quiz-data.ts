import type {
  CyclePattern,
  BirthControlTimeline,
  FertileMucus,
  CarbReaction,
  FatStorage,
  SkinMarker,
  AndrogenOnset,
  HirsutismSite,
  AcnePattern,
  ExerciseReaction,
  NervousSleepPattern,
  InflammatorySymptom,
  RelatedCondition,
} from '../../lib/quiz-types';

export interface QuizSectionConfig {
  id: number;
  title: string;
  subtitle: string;
  goal: string;
}

export const QUIZ_SECTIONS: QuizSectionConfig[] = [
  {
    id: 1,
    title: 'Cycle Mechanics & Ovulatory History',
    subtitle: 'Section 1 of 6',
    goal: 'Distinguish between true anovulation, hypothalamic amenorrhea, and post-pill synthetic hormone transitions and assign to 1 of 4 PMOS phenotypes.',
  },
  {
    id: 2,
    title: 'Metabolic & Post-Prandial (Glucose) Profiling',
    subtitle: 'Section 2 of 6',
    goal: 'Identify underlying Insulin Resistance and Glycemic Instability without requiring fasting insulin bloodwork.',
  },
  {
    id: 3,
    title: 'Androgenic Mapping & Tissue Sensitivity',
    subtitle: 'Section 3 of 6',
    goal: 'Differentiate systemic androgen excess (DHEA-S vs. Free Testosterone) and target tissue sensitivity.',
  },
  {
    id: 4,
    title: 'Neuro-Adrenal & Autonomic Stress Signaling',
    subtitle: 'Section 4 of 6',
    goal: 'Detect Adrenal PMOS / High DHEA-S drivers triggered by HPA-axis dysfunction.',
  },
  {
    id: 5,
    title: 'Inflammatory, Immune & Environmental Triggers',
    subtitle: 'Section 5 of 6',
    goal: 'Identify chronic low-grade systemic inflammation or histamine/gut-mediated drivers.',
  },
  {
    id: 6,
    title: 'Qualitative Nuance',
    subtitle: 'Section 6 of 6',
    goal: 'Capture your personal context, past interventions, and current priorities for PHASE.',
  },
];

export const CYCLE_PATTERN_OPTIONS: { value: CyclePattern; label: string; desc?: string }[] = [
  { value: 'predictable_21_35', label: 'Very predictable (21–35 days)' },
  { value: 'slightly_irregular_36_45', label: 'Slightly irregular (36–45 days)' },
  { value: 'highly_irregular_46_90', label: 'Highly irregular / unpredictable (46–90+ days)' },
  { value: 'absent_6_plus_months', label: 'Absent completely (No natural period in 6+ months)' },
  { value: 'medication_only', label: 'Only bleed when taking a medication (e.g., Provera) or on hormonal birth control' },
];

export const BIRTH_CONTROL_TIMELINE_OPTIONS: { value: BirthControlTimeline; label: string }[] = [
  { value: 'currently_on', label: 'I am currently on hormonal birth control' },
  { value: 'less_than_3_months', label: 'Less than 3 months ago' },
  { value: '3_to_6_months', label: '3–6 months ago' },
  { value: '6_to_12_months', label: '6–12 months ago' },
  { value: 'more_than_12_months_or_never', label: 'More than 12 months ago / Never used' },
];

export const FERTILE_MUCUS_OPTIONS: { value: FertileMucus; label: string }[] = [
  { value: 'regularly_monthly', label: 'Regularly once a month' },
  { value: 'occasionally_patches', label: 'Occasionally or in "patches" every few months' },
  { value: 'almost_never', label: "Almost never / I don't observe this" },
  { value: 'unsure', label: 'Unsure what to look for' },
];

export const CARB_REACTION_OPTIONS: { value: CarbReaction; label: string }[] = [
  { value: 'energized', label: 'Energized and satisfied' },
  { value: 'severe_crash', label: 'Severe energy crash / Sudden brain fog / Uncontrollable urge to nap' },
  { value: 'hungry_craving', label: 'Hungry again quickly or craving more sugar/carbs right away' },
  { value: 'shaky_hypoglycemia', label: 'Shaky, anxious, or lightheaded (reactive hypoglycemia)' },
];

export const FAT_STORAGE_OPTIONS: { value: FatStorage; label: string }[] = [
  { value: 'evenly', label: 'Evenly distributed throughout the body' },
  { value: 'midsection', label: 'Primarily around the midsection / visceral belly area' },
  { value: 'hips_thighs', label: 'Primarily around the hips, thighs, and buttocks' },
];

export const SKIN_MARKER_OPTIONS: { value: SkinMarker; label: string }[] = [
  { value: 'darkened_patches', label: 'Darkened skin patches around neck/underarms' },
  { value: 'skin_tags', label: 'Multiple small skin tags' },
  { value: 'neither', label: 'Neither' },
];

export const ANDROGEN_ONSET_OPTIONS: { value: AndrogenOnset; label: string }[] = [
  { value: 'early_puberty', label: 'Early puberty (ages 11–15)' },
  { value: 'late_teens', label: 'Late teens / Early adulthood (ages 18–22)' },
  { value: 'post_birth_control', label: 'Immediately after stopping hormonal birth control' },
  { value: 'post_stress', label: 'Following a period of major physical or emotional stress' },
  { value: 'no_symptoms', label: 'I do not experience these symptoms' },
];

export const HIRSUTISM_SITE_OPTIONS: { value: HirsutismSite; label: string }[] = [
  { value: 'chin_jawline_lip', label: 'Chin, jawline, or upper lip (coarse/dark hair)' },
  { value: 'chest_back', label: 'Chest, around nipples, or upper back' },
  { value: 'abdomen_thighs', label: 'Lower abdomen (navel to pubic area) or inner thighs' },
  { value: 'none_vellus', label: 'None / Fine vellus peach fuzz only' },
];

export const ACNE_PATTERN_OPTIONS: { value: AcnePattern; label: string }[] = [
  { value: 'cystic_jawline', label: 'Deep, painful cystic bumps along the jawline, chin, or neck' },
  { value: 'chest_back', label: 'Breakouts on the chest, shoulders, or upper back' },
  { value: 't_zone', label: 'Surface-level whiteheads/blackheads across the T-zone' },
  { value: 'pre_bleed_flare', label: 'Breakouts worsen significantly 1–2 weeks before a bleed' },
  { value: 'rarely_never', label: 'Rarely/Never get acne' },
];

export const EXERCISE_REACTION_OPTIONS: { value: ExerciseReaction; label: string }[] = [
  { value: 'energized_recovers', label: 'Energized and recovers quickly' },
  { value: 'exhausted_24h', label: 'Completely exhausted for 24+ hours, bloated, or feeling "wired but tired"' },
  { value: 'intense_hunger_anxiety', label: 'Triggers intense hunger or anxiety later in the day' },
];

export const NERVOUS_SLEEP_OPTIONS: { value: NervousSleepPattern; label: string }[] = [
  { value: 'wired_but_tired', label: '"Wired but tired" feeling around bedtime (body is exhausted, mind is racing)' },
  { value: 'wake_2am_4am', label: 'Waking up between 2 AM and 4 AM with a racing heart or temperature spike' },
  { value: 'unrefreshed_sleep', label: 'Feeling unrefreshed despite sleeping 7–8+ hours' },
  { value: 'caffeine_sensitivity', label: 'High sensitivity to caffeine (jitters, anxiety, rapid pulse)' },
];

export const INFLAMMATORY_SYMPTOM_OPTIONS: { value: InflammatorySymptom; label: string }[] = [
  { value: 'joint_fatigue', label: 'Frequent joint stiffness, muscle aches, or general body fatigue' },
  { value: 'skin_flushing_histamine', label: 'Skin flushing, hives, or unexplained allergies (Histamine flare)' },
  { value: 'severe_bloating_post_meal', label: 'Severe, painful abdominal bloating immediately after eating ("food baby")' },
  { value: 'cycle_headaches', label: 'Frequent headaches or migraines around cycle shifts' },
  { value: 'none', label: 'None of these' },
];

export const RELATED_CONDITION_OPTIONS: { value: RelatedCondition; label: string }[] = [
  { value: 'thyroid', label: "Thyroid condition (e.g., Hypothyroidism, Hashimoto's)" },
  { value: 'endometriosis_adenomyosis', label: 'Endometriosis or Adenomyosis' },
  { value: 'ibs_sibo', label: 'IBS (Irritable Bowel Syndrome) or SIBO' },
  { value: 'vitamin_deficiency', label: 'Vitamin D deficiency or B12 deficiency' },
];
