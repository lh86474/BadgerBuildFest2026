# PHASE — Your Health, In Context

> A calm, intelligent clinical companion and longitudinal tracking platform designed to bridge the gap between patients managing Polycystic Ovary Syndrome (PMOS) and evidence-based clinical care. Built with Next.js, Databricks Mosaic AI, and Clerk.

---

## Overview

Polycystic Ovary Syndrome (PMOS) affects 8–13% of women of reproductive age worldwide, yet up to 70% remain undiagnosed and often face diagnostic delays of 2+ years. Patients juggle fragmented symptoms—irregular cycles, metabolic swings, fatigue, hyperandrogenism—while clinical visits are compressed into brief consultations.

**PHASE** provides an intelligent, private space to track daily health markers, discover personal patterns through clinical phenotypes, and receive medically grounded AI interpretations powered by the **Databricks Data Intelligence Platform**, backed by a continuous human-in-the-loop expert clinical review system.

---

## How We Use Databricks

Databricks serves as the central data intelligence, storage, and clinical AI backbone for PHASE. The platform is architected specifically to solve **Clinical & Organizational Knowledge Capture**: capturing expertise from scattered systems (daily patient logs, lab panels, and peer-reviewed consensus literature) and providing a **Human-in-the-Loop (HITL) feedback system where clinical experts can fix wrong answers so they stay fixed**.

---

### 1. Databricks Model Serving (Clinical LLM Generation)
* **File:** [`lib/server/databricks-ai.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/lib/server/databricks-ai.ts)
* **Endpoint:** `${DATABRICKS_HOST}/serving-endpoints/${DATABRICKS_SERVING_ENDPOINT}/invocations`
* **Default Model:** `databricks-meta-llama-3-3-70b-instruct`
* **What it does:**
  * Serves as the primary intelligence behind the `/ask` clinical companion.
  * Ingests the user’s de-identified 90-day tracking data (symptoms, cycle regularity, medications, lab values) alongside retrieved peer-reviewed medical citations from Databricks Vector Search.
  * Generates structured outputs: a grounded clinical **Interpretation** and targeted **Questions for your clinician** to take to upcoming appointments.
  * Dynamically conditions its autoregressive decoding on clinician-verified gold-standard responses retrieved from the Lakehouse as few-shot prompt examples to enforce clinical safety and rigor.

---

### 2. Databricks Vector Search (Clinical Literature RAG)
* **Files:** [`lib/server/databricks-research.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/lib/server/databricks-research.ts), [`app/api/search/route.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/app/api/search/route.ts)
* **Endpoint:** `${DATABRICKS_HOST}/api/2.0/vector-search/indexes/${DATABRICKS_VECTOR_INDEX}/query`
* **Index:** `pcos.vector_search.disease_symptoms_v2_vs_index` (or `health_lakehouse.pcos_research.curated_literature_index`)
* **What it does:**
  * Performs hybrid vector search across indexed peer-reviewed clinical literature (including the ESHRE/ASRM international PMOS consensus guidelines, *The Lancet Diabetes & Endocrinology*, and *The American Journal of Clinical Nutrition*).
  * Answers patient and clinician questions with verifiable sources, attaching exact study titles, publishers, DOIs, and excerpts to each interpretation.
  * Powers the real-time symptom and medical literature search bar in the user interface ([`components/SymptomSearch.tsx`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/components/SymptomSearch.tsx)).

---

### 3. Databricks SQL Warehouse for User Health Records (Delta Lake Storage)
* **Files:** [`lib/server/databricks-storage.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/lib/server/databricks-storage.ts), [`app/api/user-data/route.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/app/api/user-data/route.ts)
* **Delta Table:** `default.user_health_records`
* **What it does:**
  * Unifies scattered health records by persisting logged data (daily symptoms, cycle history, medications, and lab metrics) keyed by authenticated user ID directly to a managed Delta Lake table.
  * Executes automated table bootstrapping (`CREATE TABLE IF NOT EXISTS`), `MERGE INTO`, and `SELECT` queries through the Databricks SQL Statement Execution API (`/api/2.0/sql/statements`).

---

### 4. Clinician RLHF & Expert Review Loop: How an Expert Fixes a Wrong Answer So It Stays Fixed
* **Files:** [`lib/server/databricks-expert-reviews.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/lib/server/databricks-expert-reviews.ts), [`app/api/expert/review/route.ts`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/app/api/expert/review/route.ts)
* **Delta Table:** `default.expert_response_reviews`
* **Technical Mechanism:** **Human-in-the-Loop (HITL) Dynamic Few-Shot In-Context Learning (Dynamic Few-Shot ICL) via Lakehouse Feedback Retrieval**

Rather than relying on static model weights or requiring slow, expensive offline model fine-tuning cycles, PHASE uses a continuous Lakehouse feedback loop that conditions subsequent inference on expert clinical corrections:

1. **Structured Clinical Auditing (Write Path):**
   * Medical professionals (OB-GYNs, endocrinologists) can audit any AI interpretation directly in the UI.
   * Clinicians score the output across a 4-dimensional rubric:
     * **Accuracy (1–5):** Medical correctness of statements and lab interpretations.
     * **Groundedness (1–5):** Strict adherence to the patient's logged health entries without hallucination.
     * **Empathy (1–5):** Compassionate tone appropriate for chronic health management.
     * **Clinical Safety (Boolean):** Verification that the output contains no unauthorized prescriptive claims or dangerous advice.
   * The expert authors a **corrected gold-standard response** (`corrected_response`) and adds clinical guidance notes (`expert_comments`).
   * This audit record is committed to the Delta Lake table `default.expert_response_reviews` via the Databricks SQL Statement Execution REST API (`POST /api/2.0/sql/statements`).

2. **Query-Time Relevance Retrieval (Read Path):**
   * When any user asks a question on `/ask`, [`DatabricksAIService`](file:///Users/mikethedoge/Documents/Projects/BadgerBuildFest2026/lib/server/databricks-ai.ts#L160) calls `databricksExpertReviews.getTopVerifiedExamples(question, 1)`.
   * It queries the Delta Lake table, filtering for audits where `is_clinically_safe = true` and `rating_accuracy >= 4`, and scores past cases using semantic token overlap against the incoming question.

3. **In-Context Prompt Conditioning (Inference Path):**
   * The top-matching verified correction is formatted into a structured prompt injection block:
     ```text
     CLINICIAN-VERIFIED GOLD STANDARD REFERENCE EXAMPLE (Follow this clinical tone and rigor):
     Reference Question: "<user_question>"
     Expert-Approved Response: <corrected_response>
     Expert Feedback Note: <expert_comments>
     ```
   * This block is dynamically injected into the user prompt sent to **Databricks Model Serving** (`/serving-endpoints/databricks-meta-llama-3-3-70b-instruct/invocations`).
   * **Why the fix stays fixed:** The Llama 3.3 70B model conditions its autoregressive attention directly on the physician's verified response. The next time a similar clinical topic or symptom correlation is queried, the model follows the expert's verified correction, preventing hallucination or repetition of the previous error at query time.


---

## Core Application Features

### 1. Longitudinal Health Tracking (`/track`)
- **Daily Symptom Logging:** Track severity and notes for acne, fatigue, hirsutism, pelvic pain, mood changes, and sleep quality.
- **Interactive Cycle Wheel & History:** Visualize cycle length variability, follicular/luteal phases, and flow intensity.
- **Medications & Supplements:** Record dosages, start/end dates, adherence, and tracked side effects (e.g., Metformin, Inositol, Spironolactone).
- **Lab Panel Tracking:** Log hormone levels and metabolic markers (HbA1c, Fasting Insulin, Testosterone, DHEA-S, LH/FSH ratio, AMH) alongside reference ranges.
- **Cloud-Synced Lakehouse Storage:** Automatically saves entries to Databricks Delta Lake via SQL Warehouse statements when signed in.

### 2. Clinical AI Companion (`/ask`)
- **Grounded AI Synthesis:** Powered by Databricks Model Serving with Llama 3.3 70B Instruct.
- **Context-Aware Personalization:** Evaluates a sanitized 90-day window of the user's logged health metrics with consent.
- **Dual Clinical Outputs:**
  1. *Clinical Interpretation:* Empathetic, evidence-backed breakdown directly referencing logged symptom dates and patterns.
  2. *Questions for Your Clinician:* 1–3 high-yield questions for the patient's next appointment.
- **Curated Literature Citations:** Cites peer-reviewed medical journals retrieved via Databricks Vector Search.

### 3. PMOS Phenotype Discovery Quiz (`/quiz`)
- Multi-step clinical assessment mapping reported symptoms to established PMOS phenotypes:
  - *Insulin-Resistant PMOS*
  - *Inflammatory PMOS*
  - *Adrenal PMOS*
  - *Post-Pill PMOS*
- Delivers evidence-informed nutrition, exercise, supplement, and lab testing considerations tailored to each phenotype.

### 4. Insights & Clinician Visit Summary (`/insights`)
- Longitudinal correlation analysis (e.g., medication adherence vs. symptom reduction).
- Print-ready and exportable **Clinician Visit Summary** designed to save doctor time and accelerate diagnostic clarity during in-person visits.

---

## Architecture Diagram

```
                                  ┌───────────────────────────┐
                                  │      PHASE Web App        │
                                  │   (Next.js App Router)    │
                                  └─────────────┬─────────────┘
                                                │
                                    Authenticated Server API
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
      │   Databricks Model   │       │  Databricks Vector   │       │    Databricks SQL    │
      │       Serving        │       │        Search        │       │      Warehouse       │
      ├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
      │ Llama 3.3 70B        │       │ Unity Catalog Index  │       │ Delta Lake Tables:   │
      │ Instruct             │       │ Peer-reviewed PMOS   │       │ • user_health_records│
      │ Context grounding    │       │ clinical literature  │       │ • expert_reviews     │
      │ Few-shot RLHF prompts│       │ Hybrid vector query  │       │   (RLHF gold data)   │
      └──────────────────────┘       └──────────────────────┘       └──────────────────────┘
                 ▲                                                             │
                 │                                                             │
                 └────────────────── Few-Shot Examples ────────────────────────┘
```

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Frontend & UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), Vanilla CSS Modules
- **Animations & 3D:** [Framer Motion](https://www.framer.com/motion/), [Three.js](https://threejs.org/) / [@react-three/fiber](https://r3f.docs.pmnd.rs/), [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
- **Authentication:** [Clerk](https://clerk.com/)
- **Data & AI Layer:** Databricks Mosaic AI (Model Serving, Vector Search, SQL Statement API, Delta Lake)
- **Language & Tooling:** TypeScript 5, ESLint 9, Node.js Native Test Runner

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, pnpm, or yarn
- **Databricks Workspace** (Required for live AI & storage):
  - Personal Access Token (`DATABRICKS_TOKEN`)
  - Workspace Host URL (`DATABRICKS_HOST`)
  - Mosaic AI Model Serving Endpoint (`DATABRICKS_SERVING_ENDPOINT`)
  - Mosaic AI Vector Search Index in Unity Catalog (`DATABRICKS_VECTOR_INDEX`)
  - Serverless SQL Warehouse (`DATABRICKS_SQL_WAREHOUSE_ID`)
- **Clerk Account** (Required for user authentication & account-scoped logs)

> **Note on Offline Development:** The codebase includes built-in offline fallback drivers and an in-memory knowledge base (`CURATED_PMOS_LITERATURE`). Setting `DATABRICKS_MOCK=true` or omitting credentials enables an offline sandbox mode so UI features can still be developed locally without an active cloud connection.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/lh86474/BadgerBuildFest2026.git
cd BadgerBuildFest2026
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your environment settings for **Live Databricks Mode**:

```env
# AI Provider: 'databricks'
AI_PROVIDER=databricks

# Databricks Workspace Configuration (Server-side only)
DATABRICKS_HOST=https://<your-workspace-instance>.cloud.databricks.com
DATABRICKS_TOKEN=dapi...

# Mosaic AI Model Serving Endpoint (e.g. Llama 3.3 70B Instruct)
DATABRICKS_SERVING_ENDPOINT=databricks-meta-llama-3-3-70b-instruct

# Mosaic AI Vector Search Index (Unity Catalog full path)
DATABRICKS_VECTOR_INDEX=pcos.vector_search.disease_symptoms_v2_vs_index

# Databricks SQL Warehouse ID (for Delta Lake storage & clinician expert reviews)
DATABRICKS_SQL_WAREHOUSE_ID=your_warehouse_id

# Set to false for live Databricks execution (or true for offline sandbox testing)
DATABRICKS_MOCK=false

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Development** | `npm run dev` | Starts local Next.js dev server on port 3000 |
| **Production Build** | `npm run build` | Builds optimized production bundle |
| **Start Production** | `npm run start` | Runs built production server |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types across all files |
| **Lint** | `npm run lint` | Runs ESLint validation |
| **Test Suite** | `npm test` | Runs unit & integration tests (Node native test runner) |
| **Test Ask Service** | `npm run test:ask` | Tests AI context assembly, prompts, and normalization |

---

## Security & Privacy Guardrails

- **Zero Client-Side Credentials:** All Databricks tokens, endpoints, and SQL queries run strictly inside Server Components and API route handlers (`server-only`).
- **Context De-Identification:** Raw personal identifiers, notes, and full names are stripped before health metrics are assembled into 90-day temporal context for the LLM.
- **Consent-First Personalization:** Health history sharing with the AI assistant is strictly opt-in and toggleable per query.
- **Fail-Safe Design:** If external AI services encounter timeouts or HTTP errors, the system falls back to grounded clinical rule-based heuristics without service interruption.

---

## License

This project was developed for BadgerBuildFest 2026.
