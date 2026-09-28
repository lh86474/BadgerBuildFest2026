'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SymptomSearch } from './SymptomSearch';
import { ScrollReveal, StaggerReveal, StaggerItem } from './motion';
import './search-client-view.css';

const CLINICAL_CATEGORIES = [
  {
    title: 'Metabolic & Glycemic Signatures',
    description: 'Insulin signaling, compensatory hyperinsulinemia, reactive hypoglycemia, and glucose balance.',
    queries: ['Insulin resistance & cravings', 'Acanthosis nigricans', 'Reactive hypoglycemia', 'Central adiposity'],
  },
  {
    title: 'Ovulatory & Cycle Mechanics',
    description: 'Hypothalamic-pituitary-ovarian signaling, follicular arrest, oligomenorrhea, and cycle regularity.',
    queries: ['Irregular or missed periods', 'Delayed ovulation', 'Follicle clustering', 'Luteal phase defect'],
  },
  {
    title: 'Androgenic & Dermatologic Flares',
    description: 'Tissue sensitivity to free testosterone and DHT, hirsutism, jawline breakouts, and follicle changes.',
    queries: ['Jawline cystic acne', 'Facial hair growth (hirsutism)', 'Androgenic hair thinning', 'Sebum upregulation'],
  },
  {
    title: 'Neuroendocrine & Sleep Axis',
    description: 'Cortisol diurnal rhythms, sleep architecture disruption, daytime energy drops, and chronic fatigue.',
    queries: ['Midday fatigue crashes', 'Sleep architecture disruption', 'Brain fog', 'Elevated nocturnal cortisol'],
  },
];

export function SearchClientView() {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState<string>('');

  const handleSelectSymptom = (symptom: string) => {
    const prompt = `What clinical insights and clinician questions should I know about ${symptom} in PCOS?`;
    router.push(`/ask?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="search-page-wrapper">
      <div className="search-page-container">
        {/* Breadcrumb Navigation */}
        <nav className="search-breadcrumb" aria-label="Breadcrumb">
          <Link href="/ask" className="breadcrumb-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Care Assistant</span>
          </Link>
          <span className="breadcrumb-separator" aria-hidden="true">/</span>
          <span className="breadcrumb-current">Symptoms &amp; Clinical Evidence</span>
        </nav>

        {/* Page Hero Header */}
        <ScrollReveal yOffset={20}>
          <header className="search-page-hero">
            <div className="search-hero-content">
              <span className="search-hero-tag">Clinical Knowledge Base</span>
              <h1 className="search-hero-title">Search Symptoms &amp; Evidence</h1>
              <p className="search-hero-subtitle">
                Explore evidence-informed PCOS research, symptom correlations, and clinical mechanisms powered by
                the Databricks Lakehouse Vector Search engine.
              </p>
            </div>
          </header>
        </ScrollReveal>

        {/* Main Search Component */}
        <div className="search-main-card">
          <SymptomSearch
            key={activePreset}
            defaultQuery={activePreset}
            title="PCOS Symptom & Literature Search"
            subtitle="Search symptoms and clinical evidence indexed with Databricks Unity Catalog and Vector Search."
            onSelectSymptom={handleSelectSymptom}
          />
        </div>

        {/* Category Exploration Grid */}
        <section className="clinical-domains-section" aria-labelledby="clinical-domains-heading">
          <div className="domains-header">
            <h2 id="clinical-domains-heading" className="domains-title">Browse Clinical Domains</h2>
            <p className="domains-subtitle">Select a clinical area to load symptom queries and evidence directly into the index:</p>
          </div>

          <StaggerReveal staggerDelay={0.08} className="domains-grid">
            {CLINICAL_CATEGORIES.map((cat) => (
              <StaggerItem key={cat.title}>
                <div className="domain-card">
                  <h3 className="domain-card-title">{cat.title}</h3>
                  <p className="domain-card-desc">{cat.description}</p>
                  <div className="domain-chips">
                    {cat.queries.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="domain-query-btn"
                        onClick={() => {
                          setActivePreset(q);
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                      >
                        <span>{q}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </section>

        {/* Clinical Transparency & Privacy Note */}
        <section className="search-evidence-footer-card">
          <div className="evidence-footer-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="evidence-footer-text">
            <h3>Evidence-Informed Care Preparation</h3>
            <p>
              This search space indexes peer-reviewed clinical research and consensus PCOS literature (such as the
              International Evidence-based Guideline for PCOS). It is designed to help you prepare clear, structured
              questions for medical appointments rather than providing a diagnostic conclusion.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SearchClientView;
