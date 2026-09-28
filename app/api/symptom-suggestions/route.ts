import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type SymptomSuggestion = {
  treatment: string;
  lifestyle: string;
};

// Comprehensive symptom-specific suggestions
const SYMPTOM_SUGGESTIONS: Record<string, SymptomSuggestion> = {
  // Commonly tracked
  'Fatigue': {
    treatment: `Treatment approaches for PMOS-related fatigue:

• **Insulin Sensitizers**: Metformin (1500-2000mg/day) or Myo-Inositol (4g/day) can improve cellular energy by addressing insulin resistance
• **Iron Supplementation**: If ferritin levels are below 50 ng/mL, iron therapy may significantly reduce fatigue
• **Thyroid Evaluation**: Request TSH, Free T3, and Free T4 testing, as subclinical hypothyroidism is more common in PMOS
• **Sleep Study**: Consider evaluation for sleep apnea, which affects 30-40% of women with PMOS`,
    lifestyle: `✓ Pair complex carbs with 20-30g protein at each meal to prevent blood sugar crashes
✓ Aim for 7-9 hours of sleep in a cool, dark room
✓ Try 20-30 minutes of moderate movement daily (walking, yoga) to boost mitochondrial function
✓ Limit caffeine after 2 PM to protect sleep quality
✓ Stay hydrated with 8-10 glasses of water daily`,
  },
  'Pelvic pain': {
    treatment: `Treatment options for pelvic pain in PMOS:

• **Hormonal Management**: Birth control pills can reduce ovarian volume and stabilize endometrial buildup
• **Anti-inflammatory Medications**: NSAIDs during acute pain episodes
• **Imaging**: Pelvic ultrasound to rule out ovarian cysts, endometriosis, or other structural causes
• **Physical Therapy**: Pelvic floor PT can address muscular tension and dysfunction`,
    lifestyle: `✓ Apply heating pads to lower abdomen for 15-20 minutes during pain episodes
✓ Practice gentle stretching and yoga to reduce pelvic tension
✓ Reduce inflammatory foods (processed sugars, trans fats)
✓ Track pain patterns in relation to your cycle to identify triggers
✓ Try anti-inflammatory omega-3 rich foods (salmon, walnuts, chia seeds)`,
  },
  'Cravings': {
    treatment: `Managing cravings through metabolic approaches:

• **Insulin Sensitizers**: Metformin or Myo-Inositol can reduce reactive hypoglycemia-driven cravings
• **Chromium Supplementation**: 200-1000mcg daily may improve insulin sensitivity and reduce sugar cravings
• **GLP-1 Agonists**: In select cases, medications like semaglutide can modulate appetite signaling`,
    lifestyle: `✓ Eat balanced meals every 3-4 hours to prevent blood sugar dips
✓ Start meals with protein and vegetables before carbohydrates
✓ Keep healthy snacks available (nuts, Greek yogurt, cheese, veggies)
✓ Stay hydrated—thirst is often mistaken for hunger
✓ Get 7-8 hours of sleep, as sleep deprivation intensifies cravings`,
  },
  'Bloating': {
    treatment: `Addressing bloating in PMOS:

• **Digestive Enzymes**: May help with carbohydrate and protein digestion
• **Probiotics**: Lactobacillus and Bifidobacterium strains support gut microbiome balance
• **Low-FODMAP Trial**: Consider a 4-week elimination under dietitian guidance if bloating is severe`,
    lifestyle: `✓ Reduce portions of high-FODMAP foods (beans, onions, garlic, wheat)
✓ Chew food slowly and thoroughly to aid digestion
✓ Limit carbonated beverages and artificial sweeteners
✓ Walk for 10-15 minutes after meals to promote digestion
✓ Drink peppermint or ginger tea to soothe digestive discomfort`,
  },
  'Headache': {
    treatment: `Treatment for hormonal headaches in PMOS:

• **Magnesium Supplementation**: 400-600mg daily (glycinate form) can reduce headache frequency
• **Continuous Hormonal Contraception**: May stabilize hormone fluctuations that trigger migraines
• **Triptans**: For acute migraine episodes, prescribed by your doctor`,
    lifestyle: `✓ Identify triggers by tracking headaches alongside cycle, food, and stress
✓ Stay consistently hydrated throughout the day
✓ Practice stress-reduction techniques (deep breathing, meditation)
✓ Maintain regular sleep and meal schedules to avoid fluctuations
✓ Reduce screen time and blue light exposure in evenings`,
  },
  'Acne': {
    treatment: `Evidence-based acne treatment in PMOS:

• **Anti-Androgens**: Spironolactone (50-150mg daily) blocks androgen receptors in the skin
• **Combined Oral Contraceptives**: Specific formulations (drospirenone, norgestimate) reduce free testosterone
• **Topical Retinoids**: Tretinoin or adapalene to prevent pore clogging
• **Metformin**: Can improve acne by addressing insulin-driven androgen production`,
    lifestyle: `✓ Use gentle, non-comedogenic skincare products
✓ Avoid picking or squeezing breakouts to prevent scarring
✓ Reduce dairy intake, especially skim milk, which may worsen acne
✓ Change pillowcases frequently to reduce bacterial transfer
✓ Consider an anti-inflammatory diet rich in omega-3s and antioxidants`,
  },

  // Skin & hair
  'Oily skin': {
    treatment: `Managing oily skin driven by androgens:

• **Topical Retinoids**: Regulate sebum production
• **Anti-Androgen Therapy**: Spironolactone or specific birth control pills
• **Niacinamide**: Topical 4-5% formulations reduce sebum`,
    lifestyle: `✓ Use oil-free, non-comedogenic moisturizers and sunscreen
✓ Cleanse twice daily with a gentle foaming cleanser
✓ Avoid harsh scrubbing, which can worsen oil production
✓ Use blotting papers throughout the day instead of washing excessively
✓ Consider zinc-rich foods (pumpkin seeds, chickpeas) to support skin health`,
  },
  'Dry skin': {
    treatment: `Addressing dry skin in PMOS:

• **Thyroid Testing**: Rule out hypothyroidism
• **Ceramide-Based Moisturizers**: Repair skin barrier function
• **Prescription Emollients**: For severe cases`,
    lifestyle: `✓ Apply thick moisturizer immediately after bathing while skin is damp
✓ Use a humidifier in your bedroom during dry months
✓ Limit hot showers, which strip natural oils
✓ Drink adequate water throughout the day
✓ Include healthy fats in your diet (avocado, olive oil, nuts)`,
  },
  'Hair loss': {
    treatment: `Treatment for androgenic alopecia in PMOS:

• **Spironolactone**: 100-200mg daily to block DHT at hair follicles
• **Minoxidil 5%**: Topical application to stimulate hair regrowth
• **Finasteride**: Low-dose (2.5-5mg) in select cases, with contraception
• **Iron and Ferritin Optimization**: Target ferritin >70 ng/mL`,
    lifestyle: `✓ Be patient—hair regrowth takes 6-12 months minimum
✓ Use gentle, sulfate-free shampoos
✓ Avoid tight hairstyles that cause traction on follicles
✓ Reduce heat styling and chemical treatments
✓ Ensure adequate protein intake (1g per kg body weight)`,
  },
  'Increased facial/body hair': {
    treatment: `Managing hirsutism (excess hair growth):

• **Spironolactone**: 100-200mg daily, most effective anti-androgen for hirsutism
• **Combined Oral Contraceptives**: Suppress ovarian androgen production
• **Eflornithine Cream**: Slows facial hair growth
• **Laser Hair Removal**: Most effective long-term cosmetic option`,
    lifestyle: `✓ Expect 6-9 months of treatment before visible improvement
✓ Cosmetic removal options: threading, waxing, depilatory creams
✓ Reduce refined carbohydrates to lower insulin-driven androgens
✓ Track hair growth patterns to monitor treatment effectiveness
✓ Consider working with an endocrinologist specialized in PMOS`,
  },
  'Rash or itching': {
    treatment: `Addressing skin irritation:

• **Antihistamines**: For allergic-mediated itching
• **Topical Steroids**: Short courses for inflammatory rashes
• **Dermatology Referral**: For persistent or unexplained rashes`,
    lifestyle: `✓ Use fragrance-free, hypoallergenic soaps and detergents
✓ Wear breathable, natural fabrics (cotton, bamboo)
✓ Avoid known allergens and irritants
✓ Apply cool compresses to itchy areas
✓ Keep nails short to prevent skin damage from scratching`,
  },

  // Mood & thinking
  'Mood changes': {
    treatment: `Mood stabilization in PMOS:

• **SSRIs**: Sertraline or escitalopram for mood regulation
• **Hormonal Contraception**: Can stabilize mood swings caused by hormonal fluctuations
• **Inositol Supplementation**: May improve mood symptoms alongside metabolic markers
• **Therapy**: Cognitive-behavioral therapy (CBT) for coping strategies`,
    lifestyle: `✓ Exercise 30 minutes most days—proven mood enhancer
✓ Practice mindfulness or meditation daily
✓ Maintain consistent sleep schedule
✓ Limit alcohol, which can worsen mood instability
✓ Connect with supportive friends, family, or PMOS communities`,
  },
  'Anxiety or stress': {
    treatment: `Managing anxiety in PMOS:

• **SSRIs/SNRIs**: First-line medications for generalized anxiety
• **Therapy**: CBT or acceptance and commitment therapy (ACT)
• **Magnesium Glycinate**: 300-400mg before bed may reduce anxiety`,
    lifestyle: `✓ Practice deep breathing: 4-7-8 technique (inhale 4, hold 7, exhale 8)
✓ Limit caffeine, especially if anxiety-prone
✓ Regular exercise reduces stress hormones (cortisol, adrenaline)
✓ Journal thoughts and feelings to process emotions
✓ Establish calming bedtime routine to improve sleep`,
  },
  'Irritability': {
    treatment: `Addressing irritability:

• **Hormonal Stabilization**: Continuous birth control to reduce fluctuations
• **Mood Stabilizers**: In severe cases, under psychiatric care
• **Blood Sugar Management**: Reactive hypoglycemia can worsen irritability`,
    lifestyle: `✓ Eat regular, balanced meals to prevent blood sugar dips
✓ Practice stress-relief techniques when you notice irritability rising
✓ Communicate with loved ones about hormonal patterns
✓ Take short breaks during stressful situations
✓ Prioritize adequate sleep—irritability worsens with sleep deprivation`,
  },
  'Low mood': {
    treatment: `Treatment for depression symptoms in PMOS:

• **SSRIs**: Evidence-based first-line treatment
• **Bupropion**: May be preferred if fatigue is prominent
• **Therapy**: CBT or interpersonal therapy
• **Vitamin D**: Correct deficiency if levels <30 ng/mL`,
    lifestyle: `✓ Engage in activities you previously enjoyed, even if motivation is low
✓ Spend 15-20 minutes in morning sunlight daily
✓ Avoid isolating—maintain social connections
✓ Set small, achievable daily goals to build momentum
✓ Track mood patterns to identify triggers and improvements`,
  },
  'Brain fog': {
    treatment: `Improving cognitive clarity:

• **Insulin Sensitizers**: May improve brain fog by stabilizing blood sugar
• **Thyroid Optimization**: Ensure TSH is in optimal range (1-2.5 mIU/L)
• **B-Complex Vitamins**: Especially B12 if deficient`,
    lifestyle: `✓ Prioritize 7-9 hours of quality sleep
✓ Reduce multitasking; focus on one task at a time
✓ Stay mentally active with puzzles, reading, learning
✓ Reduce sugar intake to prevent glucose-related cognitive dips
✓ Take short movement breaks every hour to boost circulation`,
  },
  'Difficulty concentrating': {
    treatment: `Enhancing focus and attention:

• **ADHD Screening**: If symptoms are severe and longstanding
• **Blood Sugar Stabilization**: Continuous glucose monitoring may reveal patterns
• **Omega-3 Supplementation**: 1-2g EPA+DHA daily supports cognitive function`,
    lifestyle: `✓ Break tasks into smaller, manageable chunks
✓ Minimize distractions (phone notifications, background noise)
✓ Use time-blocking or Pomodoro technique (25 min focus, 5 min break)
✓ Eat protein-rich breakfast to fuel brain function
✓ Practice mindfulness to strengthen attention control`,
  },

  // Sleep & temperature
  'Sleep problems': {
    treatment: `Improving sleep in PMOS:

• **Sleep Study**: Screen for sleep apnea, common in PMOS
• **Melatonin**: 0.5-3mg, 30 minutes before bed
• **CBT for Insomnia (CBT-I)**: Evidence-based therapy for chronic sleep issues
• **Magnesium Glycinate**: 400mg before bed supports relaxation`,
    lifestyle: `✓ Maintain consistent sleep and wake times, even on weekends
✓ Keep bedroom cool (65-68°F), dark, and quiet
✓ Avoid screens 1 hour before bed (blue light disrupts melatonin)
✓ Limit caffeine to mornings only
✓ Create relaxing bedtime routine (reading, bath, gentle stretching)`,
  },
  'Night sweats': {
    treatment: `Managing night sweats:

• **Hormonal Contraception**: May stabilize temperature regulation
• **Rule Out Other Causes**: Thyroid dysfunction, infections, medications`,
    lifestyle: `✓ Use moisture-wicking sheets and sleepwear
✓ Keep bedroom temperature cool (65-68°F)
✓ Layer blankets for easy temperature adjustment
✓ Avoid alcohol and spicy foods in the evening
✓ Keep a cold pack or fan near the bed`,
  },
  'Hot flashes': {
    treatment: `Treatment for hot flashes:

• **Low-Dose SSRIs**: Paroxetine or venlafaxine can reduce frequency
• **Gabapentin**: May reduce severity and frequency
• **Hormonal Therapy**: Combination birth control in younger women`,
    lifestyle: `✓ Dress in layers for easy adjustment
✓ Carry a portable fan or cooling spray
✓ Avoid triggers: caffeine, alcohol, spicy foods, hot environments
✓ Practice slow, deep breathing when hot flash begins
✓ Keep bedroom cool and well-ventilated`,
  },

  // Digestive
  'Nausea': {
    treatment: `Managing nausea in PMOS:

• **Rule Out Pregnancy**: First step if menstruating
• **Metformin Side Effects**: If recently started, consider extended-release formulation
• **Anti-Nausea Medications**: Ondansetron or promethazine for persistent cases`,
    lifestyle: `✓ Eat small, frequent meals instead of large ones
✓ Avoid strong smells and greasy, spicy foods
✓ Sip ginger tea or chew ginger candy
✓ Stay hydrated with small sips throughout the day
✓ Try bland foods: crackers, toast, rice, bananas`,
  },
  'Vomiting': {
    treatment: `Addressing vomiting:

• **Medical Evaluation**: Rule out gastroenteritis, medication side effects, pregnancy
• **Anti-Emetics**: Ondansetron, promethazine
• **IV Fluids**: If unable to keep fluids down`,
    lifestyle: `✓ Sip clear fluids slowly (water, electrolyte solutions)
✓ Wait 30-60 minutes after vomiting before eating
✓ Start with bland, easy-to-digest foods (BRAT diet)
✓ Avoid lying flat immediately after eating
✓ Rest in a comfortable position`,
  },
  'Constipation': {
    treatment: `Relieving constipation:

• **Fiber Supplementation**: Psyllium husk or methylcellulose
• **Magnesium Citrate**: 200-400mg daily
• **Stool Softeners**: Docusate sodium
• **Thyroid Testing**: Rule out hypothyroidism`,
    lifestyle: `✓ Aim for 25-35g fiber daily from whole grains, vegetables, fruits
✓ Drink 8-10 glasses of water daily
✓ Exercise regularly to stimulate bowel motility
✓ Establish a regular bathroom routine (same time each day)
✓ Avoid delaying urge to have a bowel movement`,
  },
  'Diarrhea': {
    treatment: `Managing diarrhea:

• **Evaluate Medication Side Effects**: Particularly Metformin
• **Rule Out Infections**: If accompanied by fever or blood
• **Probiotics**: May help restore gut balance`,
    lifestyle: `✓ Stay hydrated with water and electrolyte solutions
✓ Follow BRAT diet temporarily (bananas, rice, applesauce, toast)
✓ Avoid dairy, caffeine, and high-fat foods until resolved
✓ Eat smaller, more frequent meals
✓ Consider a food diary to identify triggers`,
  },
  'Stomach pain': {
    treatment: `Addressing abdominal pain:

• **Evaluation**: Differentiate between gastritis, IBS, or PMOS-related causes
• **Antacids or PPIs**: For acid-related pain
• **Antispasmodics**: For cramping pain`,
    lifestyle: `✓ Avoid trigger foods (spicy, acidic, fatty)
✓ Eat slowly and chew thoroughly
✓ Avoid lying down immediately after meals
✓ Apply warm compress to abdomen
✓ Practice stress-reduction techniques`,
  },
  'Heartburn': {
    treatment: `Heartburn relief:

• **H2 Blockers**: Famotidine for symptom control
• **Proton Pump Inhibitors**: Omeprazole for frequent heartburn
• **Lifestyle Modifications**: First-line approach`,
    lifestyle: `✓ Avoid eating 2-3 hours before bedtime
✓ Elevate head of bed 6-8 inches
✓ Limit trigger foods: caffeine, chocolate, citrus, tomatoes, mint
✓ Eat smaller, more frequent meals
✓ Maintain healthy weight—obesity worsens reflux`,
  },

  // Pain & body
  'Migraine': {
    treatment: `Migraine management in PMOS:

• **Triptans**: Sumatriptan or rizatriptan for acute attacks
• **Preventive Medications**: Topiramate, propranolol, or amitriptyline
• **Continuous Hormonal Contraception**: Reduce menstrual-related migraines
• **Magnesium**: 400-600mg daily for prevention`,
    lifestyle: `✓ Identify and avoid personal triggers (certain foods, stress, sleep changes)
✓ Maintain regular sleep schedule
✓ Stay well-hydrated throughout the day
✓ Practice relaxation techniques (progressive muscle relaxation)
✓ Keep a migraine diary to identify patterns`,
  },
  'Back pain': {
    treatment: `Back pain relief:

• **Physical Therapy**: Core strengthening and posture correction
• **NSAIDs**: Ibuprofen or naproxen for pain management
• **Muscle Relaxants**: For severe spasms`,
    lifestyle: `✓ Practice good posture when sitting and standing
✓ Strengthen core muscles with targeted exercises
✓ Use ergonomic chair and workstation setup
✓ Apply heat or ice for 15-20 minutes several times daily
✓ Gentle stretching and yoga to maintain flexibility`,
  },
  'Joint pain': {
    treatment: `Managing joint pain:

• **Anti-Inflammatory Medications**: NSAIDs
• **Evaluate for Autoimmune Conditions**: Particularly if widespread
• **Omega-3 Supplementation**: 2-3g EPA+DHA daily`,
    lifestyle: `✓ Low-impact exercise: swimming, cycling, walking
✓ Maintain healthy weight to reduce joint stress
✓ Apply heat before activity, ice after for pain relief
✓ Consider anti-inflammatory diet rich in omega-3s
✓ Stay active but avoid overuse of painful joints`,
  },
  'Muscle aches': {
    treatment: `Relieving muscle pain:

• **Magnesium Supplementation**: 300-400mg daily
• **Vitamin D**: Correct deficiency if present
• **NSAIDs**: For acute pain`,
    lifestyle: `✓ Gentle stretching and foam rolling
✓ Warm baths with Epsom salts (magnesium sulfate)
✓ Adequate hydration before, during, and after exercise
✓ Ensure sufficient rest between workouts
✓ Consider massage therapy for persistent tension`,
  },
  'Breast tenderness': {
    treatment: `Managing breast tenderness:

• **Hormonal Contraception**: May reduce cyclical breast pain
• **Vitamin E**: 400 IU daily may help some women
• **Evening Primrose Oil**: 1-3g daily, though evidence is mixed`,
    lifestyle: `✓ Wear supportive, well-fitting bras (especially during exercise)
✓ Reduce caffeine intake, which may worsen breast pain
✓ Apply warm or cool compresses for comfort
✓ Limit salt intake in luteal phase to reduce fluid retention
✓ Track patterns to identify hormonal timing`,
  },
  'Dizziness': {
    treatment: `Addressing dizziness:

• **Blood Pressure Check**: Rule out hypotension or postural changes
• **Blood Sugar Monitoring**: Evaluate for hypoglycemia
• **Anemia Testing**: Check hemoglobin and ferritin`,
    lifestyle: `✓ Stand up slowly from sitting or lying positions
✓ Stay well-hydrated throughout the day
✓ Avoid skipping meals—eat regularly
✓ Limit alcohol and caffeine
✓ If dizzy, sit or lie down immediately and elevate legs`,
  },
  'Swelling': {
    treatment: `Managing edema/swelling:

• **Diuretics**: If severe and affecting quality of life
• **Evaluation**: Rule out kidney, heart, or liver issues
• **Compression Garments**: For leg swelling`,
    lifestyle: `✓ Reduce sodium intake (<2,300mg daily)
✓ Elevate legs above heart level when resting
✓ Stay active—movement promotes fluid circulation
✓ Avoid prolonged sitting or standing
✓ Drink adequate water (counterintuitively helps reduce retention)`,
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

    // Get suggestion for the first symptom (most important)
    const primarySymptom = symptoms[0];
    const suggestion = SYMPTOM_SUGGESTIONS[primarySymptom];

    if (!suggestion) {
      // Return generic suggestion if symptom not found
      return NextResponse.json({
        treatment: `Discuss this symptom with your healthcare provider to determine the most appropriate treatment approach for your specific situation.`,
        lifestyle: `✓ Track this symptom alongside your cycle, meals, and activities to identify patterns
✓ Maintain a balanced diet and regular sleep schedule
✓ Stay physically active with activities you enjoy
✓ Practice stress-management techniques
✓ Keep a journal to discuss patterns with your doctor`,
      });
    }

    // If multiple symptoms, mention them in the response
    if (symptoms.length > 1) {
      const additionalNote = `\n\nYou've also logged: ${symptoms.slice(1).join(', ')}. Each symptom can be addressed individually or as part of a comprehensive PMOS management plan.`;
      return NextResponse.json({
        treatment: suggestion.treatment + additionalNote,
        lifestyle: suggestion.lifestyle,
      });
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('[Symptom Suggestions API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
