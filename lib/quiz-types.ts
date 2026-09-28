export type CyclePattern =
  | 'predictable_21_35'
  | 'slightly_irregular_36_45'
  | 'highly_irregular_46_90'
  | 'absent_6_plus_months'
  | 'medication_only';

export type BirthControlTimeline =
  | 'currently_on'
  | 'less_than_3_months'
  | '3_to_6_months'
  | '6_to_12_months'
  | 'more_than_12_months_or_never';

export type FertileMucus =
  | 'regularly_monthly'
  | 'occasionally_patches'
  | 'almost_never'
  | 'unsure';

export type CarbReaction =
  | 'energized'
  | 'severe_crash'
  | 'hungry_craving'
  | 'shaky_hypoglycemia';

export type FatStorage =
  | 'evenly'
  | 'midsection'
  | 'hips_thighs';

export type SkinMarker =
  | 'darkened_patches'
  | 'skin_tags'
  | 'neither';

export type AndrogenOnset =
  | 'early_puberty'
  | 'late_teens'
  | 'post_birth_control'
  | 'post_stress'
  | 'no_symptoms';

export type HirsutismSite =
  | 'chin_jawline_lip'
  | 'chest_back'
  | 'abdomen_thighs'
  | 'none_vellus';

export type AcnePattern =
  | 'cystic_jawline'
  | 'chest_back'
  | 't_zone'
  | 'pre_bleed_flare'
  | 'rarely_never';

export type ExerciseReaction =
  | 'energized_recovers'
  | 'exhausted_24h'
  | 'intense_hunger_anxiety';

export type NervousSleepPattern =
  | 'wired_but_tired'
  | 'wake_2am_4am'
  | 'unrefreshed_sleep'
  | 'caffeine_sensitivity';

export type InflammatorySymptom =
  | 'joint_fatigue'
  | 'skin_flushing_histamine'
  | 'severe_bloating_post_meal'
  | 'cycle_headaches'
  | 'none';

export type RelatedCondition =
  | 'thyroid'
  | 'endometriosis_adenomyosis'
  | 'ibs_sibo'
  | 'vitamin_deficiency';

export interface QuizAnswers {
  // Section 1
  cyclePattern?: CyclePattern;
  birthControlTimeline?: BirthControlTimeline;
  fertileMucus?: FertileMucus;

  // Section 2
  carbReaction?: CarbReaction;
  cravingsIntensity?: number; // 0 to 5
  fatStorage?: FatStorage;
  skinMarkers?: SkinMarker[];

  // Section 3
  androgenOnset?: AndrogenOnset;
  hirsutismSites?: HirsutismSite[];
  acnePatterns?: AcnePattern[];

  // Section 4
  exerciseReaction?: ExerciseReaction;
  nervousSleepPatterns?: NervousSleepPattern[];
  stressLevel?: number; // 0 to 5

  // Section 5
  inflammatorySymptoms?: InflammatorySymptom[];
  relatedConditions?: RelatedCondition[];

  // Section 6
  frustratingSymptom?: string;
  pastSupplements?: string;
}

export type PMOSPhenotype =
  | 'Phenotype A'
  | 'Phenotype B'
  | 'Phenotype C'
  | 'Phenotype D';

export type PCOSPhenotype = PMOSPhenotype;

export type OvulatoryPillar =
  | 'True Anovulation Pattern'
  | 'Hypothalamic Amenorrhea Pattern'
  | 'Post-Pill Synthetic Hormone Transition'
  | 'Preserved / Subtle Ovulatory Pattern';

export type SecondaryPillar =
  | 'Post-Pill Synthetic Hormone Rebound'
  | 'Neuro-Adrenal HPA Stress Driver'
  | 'Metabolic Glycemic & Insulin Driver'
  | 'Systemic Low-Grade Inflammatory Trigger'
  | 'Subtle Luteal Phase Irregularity'
  | 'Co-Occurring Neuro-Endocrine Axis Stress';

export interface DriverScores {
  metabolic: number; // 0 - 100
  adrenal: number; // 0 - 100
  inflammatory: number; // 0 - 100
  androgenic: number; // 0 - 100
  ovulatoryDisruption: number; // 0 - 100
}

export interface QuizResult {
  phenotype: PMOSPhenotype;
  phenotypeTitle: string;
  phenotypeSubtitle: string;
  phenotypeDescription: string;
  primaryPillar: OvulatoryPillar;
  primaryPillarDescription: string;
  secondaryPillar: SecondaryPillar;
  secondaryPillarDescription: string;
  whyThisMatters: string;
  scores: DriverScores;
  keySignals: string[];
  recommendations: {
    category: string;
    points: string[];
  }[];
  questionsForClinician: string[];
  completedAt: string;
  answers: QuizAnswers;
}
