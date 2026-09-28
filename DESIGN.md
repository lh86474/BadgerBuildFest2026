# Product Design Language

## Product

This product is a private PMOS health companion designed to help users understand patterns in their symptoms over time.

The app helps users:

- track menstrual cycle data
- record symptoms such as pain, acne, hair changes, mood, and energy
- track sleep, movement, meals, and medications
- record medication side effects
- import or enter lab results
- identify patterns across their health history (through a chatbot)
- prepare more structured information for medical appointments
- ask evidence-informed questions using an AI assistant

The product should help users better understand and communicate their experiences.

It should not present itself as a diagnostic tool or replace professional medical care.

---

# Core Product Story

PMOS symptoms can look very different from person to person.

Symptoms such as irregular periods, acne, fatigue, hair changes, pain, mood changes, and weight changes may appear individually and may be attributed to unrelated causes.

This can make it difficult for someone to recognize a larger pattern.

It can also be difficult to clearly explain months of symptoms during a short medical appointment.

The product solves these problems by turning scattered daily experiences into a structured longitudinal health history.

The core experience is:

**Track → Discover patterns → Understand context → Prepare for care**

---

# Product Principles

## 1. Patterns over scores

The product should help users identify trends and relationships in their data.

Prefer:

- timelines
- symptom correlations
- cycle history
- trend lines
- medication periods
- before-and-after comparisons

Avoid reducing a user's health to a single score.

Do not create:

- PMOS probability scores
- overall health scores
- symptom grades
- gamified health rankings

---

## 2. Calm over alarming

Health information can create anxiety.

The interface should communicate information without making normal changes feel dangerous.

Use neutral language such as:

- "A pattern we noticed"
- "You've logged this more frequently recently"
- "This may be worth discussing with a clinician"

Avoid language such as:

- "Warning: abnormal"
- "You likely have PMOS"
- "Your symptoms indicate..."
- "Your health is getting worse"

unless the product is displaying a legitimate safety warning supported by the underlying system.

---

## 3. Evidence over certainty

The product should clearly distinguish between:

1. the user's own recorded data
2. information from medical research
4. AI-generated interpretation
5. questions worth discussing with a clinician

Do not combine these into a single authoritative statement.

---

## 4. Privacy should be visible

Health information is deeply personal.

Privacy should be communicated throughout the product rather than hidden in settings or legal pages.

The interface should make it clear when information is:

- private
- stored
- imported
- used for personalization
- shared
- contributed anonymously

Never claim security, encryption, or anonymity features that have not actually been implemented.

---

# Emotional Direction

The product should feel:

- calm
- trustworthy
- intelligent
- private
- respectful
- warm
- mature
- supportive
- medically credible
- non-judgmental

The product should not feel:

- childish
- overly feminine
- overly clinical
- sterile
- gamified
- trendy for the sake of being trendy
- like a generic wellness app
- like a fertility-only app
- like an AI chatbot wrapper

---

# Visual Direction

The visual language should combine:

**personal health journal × modern medical interface × editorial data visualization**

The interface should feel designed around someone's health history rather than around generic dashboard metrics.

The user's timeline and changing health patterns should be the most distinctive visual element of the product.

Prefer strong information hierarchy over decorative UI.

---

# Color

Use a warm, neutral foundation. Emphasize teal because it is the official color for PMOS awareness.
Please use #3368A0, #66A3BF, #C8DFDB, #F2EFE7. Please emphasize teal as the main color

Recommended visual structure:

- soft neutral page background
- slightly elevated surfaces
- dark high-contrast body text
- softer secondary text
- one restrained primary accent
- semantic colors used sparingly

Avoid:

- default pink women's-health branding
- bright magenta
- purple AI gradients
- neon colors
- excessive gradients
- overly saturated medical colors
- using red decoratively

Red should primarily communicate warnings, errors, or medically important information.

Green should not imply that a health metric is universally "good" unless that meaning is valid.

---

# Typography

Typography should feel human and highly readable.

Use:

- a distinctive but restrained heading font
- a highly legible interface/body font
- clear numerical typography for health data
- tabular numerals where useful for dates, measurements, and trends

Typography should establish hierarchy before cards, borders, or decoration do.

Pay particular attention to:

- headline wrapping
- line length
- line height
- font weights
- numerical readability
- labels and units
- mobile scaling

Avoid automatically using Inter for every visual role.

---

# Shape Language

Use moderate corner radii.

Surfaces should feel soft enough to be approachable but not playful or toy-like.

Avoid:

- pill-shaped containers everywhere
- excessive floating cards
- bubbles around every piece of information
- large shadows
- excessive glassmorphism

Use borders and surfaces primarily to communicate grouping and structure.

---

# Layout

The interface should prioritize longitudinal information.

Prefer:

- timelines
- full-width trend sections
- calendar views
- layered symptom charts
- structured health summaries
- clear side-by-side comparisons

Avoid turning every piece of information into an independent dashboard card.

Sections should have varied rhythm based on their purpose rather than identical spacing and dimensions.

---

# Primary Navigation

The MVP should use four primary sections:

## Home

A simple overview of the user's recent health history.

The page should answer:

**"What has been happening with me recently?"**

Home may include:

- current cycle information
- recent symptoms
- recent patterns
- medication changes
- reminders to log information
- relevant questions for the assistant

---

## Track

Tracking should be extremely fast.

The goal is to make daily logging possible in seconds rather than requiring a medical questionnaire.

Users may track:

- menstrual cycle
- bleeding
- pain
- acne
- hair changes
- mood
- energy
- sleep
- movement
- meals
- medication
- medication side effects
- notes
- lab results

Favor:

- toggles
- chips
- sliders
- compact selectors
- sensible defaults

Avoid long forms.

---

## Insights

Insights are descriptive observations derived from the user's recorded data.

Examples:

- cycle length trends
- symptoms appearing together
- symptom frequency
- changes before and after medication
- sleep and energy patterns
- changes over several cycles

Insights should describe observations rather than diagnose causes.

Prefer:

> "Acne and low-energy days were recorded together 7 times this month."

Avoid:

> "Insulin resistance is causing your acne and fatigue."

---

## Ask

The AI assistant should use the user's context when appropriate.

The experience should feel like part of the health product, not a generic chatbot embedded into it.

Suggested question types:

- "What questions should I ask my doctor about irregular cycles?"
- "Summarize what changed after I started this medication."
- "What are some snack ideas that may help me feel full longer?"
- "What should I know about this lab result?"
- "What symptoms have I been logging most frequently?"

Responses should visually distinguish:

### Your data

Observations from the user's recorded information.

### Research

General evidence-based health information.

### Community experiences

Experiences contributed by other users, when available.

### Questions for your clinician

Useful topics the user may want to bring to a medical professional.

---

# Signature Experience: Health Timeline

The longitudinal timeline is the core visual identity of the product.

It should allow users to understand how different parts of their health overlap over time.

Possible layers include:

- menstrual cycle
- bleeding
- pain
- acne
- hair symptoms
- mood
- energy
- sleep
- exercise
- medication
- medication changes
- side effects
- labs
- medical appointments
- notes

The timeline should make it possible to visually answer questions like:

- "Did this symptom begin before or after my medication changed?"
- "Do these symptoms tend to happen during the same part of my cycle?"
- "Has this symptom become more frequent?"
- "What changed over the last three months?"

The timeline should feel clearer than a spreadsheet and more informative than a calendar.

---

# Doctor Visit Summary

The product should help users turn their history into something easier to communicate during appointments.

A visit summary may include:

- cycle history
- frequently reported symptoms
- symptom trends
- medication timeline
- medication side effects
- relevant lab results
- major changes
- questions the user wants to ask

Keep summaries concise.

A clinician should be able to understand the important information quickly.

Avoid automatically presenting interpretations as medical conclusions.

---

# Motion

Motion should be subtle.

Use it to communicate:

- state changes
- navigation transitions
- timeline exploration
- chart filtering
- successful logging
- loading
- expanding detail

Avoid:

- dramatic scroll animations
- decorative floating objects
- constant movement
- attention-grabbing effects around health information

Respect reduced-motion preferences.

---

# Icons

Use one consistent icon family.

Icons should primarily communicate function.

Avoid decorative icons where typography would communicate more clearly.

Do not mix multiple icon libraries within the same interface.

---

# Data Visualization

Prefer:

- timelines
- line charts
- calendar heatmaps
- symptom overlays
- frequency views
- event markers
- medication periods
- before/after comparisons

Charts must always prioritize readability over visual novelty.

Always include:

- understandable labels
- appropriate units
- meaningful legends when necessary
- accessible contrast

Avoid:

- unnecessary 3D charts
- decorative graphs
- misleading scales
- excessive color coding
- unexplained medical metrics

---

# Responsive Design

Mobile is especially important because symptom logging may happen throughout the day.

Do not simply stack the desktop interface vertically.

On mobile:

- prioritize today's logging
- simplify charts without removing their meaning
- reduce visible controls
- prioritize touch targets
- allow deeper information to progressively reveal
- keep key actions within easy reach

Desktop can expose more longitudinal context and comparison tools.

Test at minimum:

- 1440px
- 1024px
- 768px
- 430px
- 390px

---

# Accessibility

The product should work well for users experiencing fatigue, pain, migraines, brain fog, or other symptoms that may make complex interfaces difficult to use.

Prioritize:

- strong contrast
- readable type
- simple navigation
- large touch targets
- keyboard navigation
- clear focus states
- useful form labels
- understandable error messages
- reduced-motion support
- avoiding color as the only method of communicating meaning

---

# Anti-Patterns

Do not default to:

- generic SaaS dashboards
- giant metric cards
- centered gradient hero sections
- pink fertility branding
- purple AI branding
- glassmorphism
- excessive pills
- AI sparkle icons everywhere
- chatbot-first product design
- giant empty whitespace
- gamification
- health streaks
- arbitrary scores
- excessive celebration animations
- overly cheerful medical copy

---

# Design Hierarchy

When visual instructions conflict, use this order:

1. user requirements
2. product safety and clarity
3. this DESIGN.md
4. existing components and design tokens
5. supplied references
6. design skills
7. generic design rules

The product's established visual identity should take priority over generic anti-pattern rules.

---

# Final Design Test

Before shipping a major page, ask:

1. Does this help the user understand their health history?
2. Does the interface communicate without judging the user?
3. Is the source of an insight clear?
4. Could any language accidentally imply a diagnosis?
5. Is private information treated with appropriate care?
6. Can the primary action be understood quickly?
7. Does the page feel specific to this product rather than like a template?
8. Does the interface work well on mobile?
9. Is the product visually calm without feeling empty?
10. Is data more prominent than decoration?

If the answer to several of these is no, revise the design before considering the page complete.
