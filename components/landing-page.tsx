"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Icon } from "./ui";
import {
  AmbientBackground,
  AnimatedFingerprintCycle,
  MagneticButton,
  ScrollReveal,
  StaggerReveal,
  StaggerItem,
} from "./motion";
import "./landing-page.css";

/* =========================================================================
 * 00. MAIN LANDING PAGE (Served on "/" when user is signed out)
 * ========================================================================= */
export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Signature Hero Banner */}
      <section className="page-hero landing-hero" aria-labelledby="landing-hero-title">
        <AmbientBackground />
        <div className="page-hero-grid">
          <div className="hero-content">
            <StaggerReveal staggerDelay={0.09}>
              <StaggerItem>
                <div className="hero-headline-group">
                  <h1 id="landing-hero-title">
                    A little more context.
                    <br />A clearer picture of you.
                  </h1>
                  <div className="hero-tablet-emblem" aria-hidden="true">
                    <AnimatedFingerprintCycle size={120} />
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <p className="hero-subtitle">
                  Bring the small details together, one day at a time, to understand your patterns and cycles.
                </p>
              </StaggerItem>
              <StaggerItem>
                <div className="hero-actions">
                  <MagneticButton magneticStrength={0.25} innerStrength={0.12}>
                    <SignUpButton mode="modal">
                      <button type="button" className="hero-cta-btn">
                        <span>Start your journal</span>
                        <Icon name="arrow" />
                      </button>
                    </SignUpButton>
                  </MagneticButton>
                  <MagneticButton magneticStrength={0.2} innerStrength={0.1}>
                    <Link href="/track" className="hero-explore-link">
                      <span>Explore features →</span>
                    </Link>
                  </MagneticButton>
                </div>
              </StaggerItem>
            </StaggerReveal>
          </div>

          <div className="hero-visual-col">
            <div className="hero-visual-wrapper">
              <AnimatedFingerprintCycle size={280} />
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Overview Section */}
      <section className="landing-section" aria-labelledby="overview-heading">
        <ScrollReveal>
          <div className="landing-header-centered">
            <h2 id="overview-heading">A health companion designed around your context</h2>
            <p>
              Explore how PHASE turns scattered daily sensations into a coherent health history.
            </p>
          </div>
        </ScrollReveal>

        <div className="home-features-overview">
          <div className="home-feature-card">
            <div className="home-feature-top">
              <div className="home-feature-icon">
                <Icon name="track" />
              </div>
              <h3>Daily Check-Ins</h3>
              <p>
                Log what matters in 30 seconds. Record bleeding flow, acne, pelvic pain, mood, and sleep without streak pressure or scores.
              </p>
            </div>
            <Link href="/track" className="home-feature-action">
              <span>Preview Track</span>
              <Icon name="arrow" />
            </Link>
          </div>

          <div className="home-feature-card">
            <div className="home-feature-top">
              <div className="home-feature-icon">
                <Icon name="insights" />
              </div>
              <h3>Longitudinal Patterns</h3>
              <p>
                Patterns over scores. Discover correlations across cycles and export clean, structured summaries for your doctor appointments.
              </p>
            </div>
            <Link href="/insights" className="home-feature-action">
              <span>Preview Insights</span>
              <Icon name="arrow" />
            </Link>
          </div>

          <div className="home-feature-card">
            <div className="home-feature-top">
              <div className="home-feature-icon">
                <Icon name="ask" />
              </div>
              <h3>Evidence-Informed Care</h3>
              <p>
                Ask questions grounded in your journal. Responses clearly separate your recorded logs, clinical literature, and questions for care.
              </p>
            </div>
            <Link href="/ask" className="home-feature-action">
              <span>Preview Ask</span>
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy & Principles Section */}
      <section className="landing-privacy-section" aria-labelledby="privacy-heading">
        <ScrollReveal>
          <div className="landing-header-centered">
            <h2 id="privacy-heading">Your health data belongs to you alone</h2>
            <p>
              A health journal is only useful if you trust it completely. PHASE is built on explicit privacy and patient ownership.
            </p>
          </div>
        </ScrollReveal>

        <div className="privacy-grid">
          <div className="privacy-card">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Never Sold to Advertisers
            </h4>
            <p>Your symptoms, cycle dates, and questions are strictly private. We never monetize or broker health data.</p>
          </div>

          <div className="privacy-card">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              Reflection, Not Diagnosis
            </h4>
            <p>We empower open conversations between you and your healthcare team, not opaque automated diagnoses.</p>
          </div>

          <div className="privacy-card">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Any Time
            </h4>
            <p>You can export your complete structured journal as appointment-ready summaries whenever you prepare for a visit.</p>
          </div>

          <div className="privacy-card">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Calm & Non-Judgmental
            </h4>
            <p>No streak punishments, no gamified badges, and no red alarms for normal physiological variation.</p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="landing-cta-banner" aria-labelledby="cta-heading">
        <ScrollReveal>
          <h2 id="cta-heading">Ready to see your health in context?</h2>
          <p>
            Start logging your symptoms, noticing meaningful patterns, and feeling prepared for your next medical appointment.
          </p>
          <div className="landing-cta-actions">
            <MagneticButton magneticStrength={0.25} innerStrength={0.15}>
              <SignUpButton mode="modal">
                <button type="button" className="hero-cta-btn">
                  <span>Begin Your Journal</span>
                  <Icon name="arrow" />
                </button>
              </SignUpButton>
            </MagneticButton>
            <MagneticButton magneticStrength={0.2} innerStrength={0.1}>
              <SignInButton mode="modal">
                <button type="button" className="hero-explore-link">
                  <span>Sign In to Existing Account</span>
                </button>
              </SignInButton>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

/* =========================================================================
 * 01. TRACK PREVIEW PAGE (Served on "/track" when user is signed out)
 * ========================================================================= */
export function TrackPreview() {
  const [selectedFlow, setSelectedFlow] = useState<string>("Light");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Mild cramping",
    "Steady energy",
  ]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  return (
    <div className="preview-page">
      <ScrollReveal>
        <div className="landing-header-centered">
          <h1>Log what matters in 30 seconds</h1>
          <p>
            A calm, flexible check-in designed around your symptoms. No rigid medical questionnaires, no streak pressure, and no arbitrary scores.
          </p>
        </div>
      </ScrollReveal>

      <div className="landing-feature-grid">
        <div className="feature-benefits-list">
          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Cycle & Flow in Context</h3>
              <p>Track spotting, flow level, and menstrual phases without intrusive questions. Context is preserved naturally over time.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Holistic Symptom Spectrum</h3>
              <p>Log acne, pelvic discomfort, hirsutism, mood changes, and fatigue with one-touch chips whenever you notice them.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Sleep, Movement & Medication</h3>
              <p>Record prescription changes, supplements, and side effects so you can evaluate what actually helps your routine.</p>
            </div>
          </div>
        </div>

        {/* Interactive Demo Logger Card */}
        <div className="feature-card-wrapper">
          <div className="card-header-bar">
            <div className="card-header-title">
              <Icon name="track" />
              <span>Interactive Logger Preview</span>
            </div>
          </div>

          <div className="demo-logger">
            <div>
              <span className="demo-group-label">Bleeding Flow</span>
              <div className="demo-chips">
                {["None", "Spotting", "Light", "Moderate"].map((flow) => (
                  <button
                    key={flow}
                    type="button"
                    className={`demo-chip ${selectedFlow === flow ? "is-selected" : ""}`}
                    onClick={() => setSelectedFlow(flow)}
                  >
                    {flow}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="demo-group-label">Today&apos;s Sensations</span>
              <div className="demo-chips">
                {[
                  "Mild cramping",
                  "Clear skin",
                  "Bloating",
                  "Steady energy",
                  "Brain fog",
                  "8h restorative sleep",
                ].map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      className={`demo-chip ${isSelected ? "is-selected" : ""}`}
                      onClick={() => toggleSymptom(sym)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="demo-status-banner">
              <div>
                <span className="demo-status-pulse" />
                <span>
                  Saved in <strong>15s</strong> • {selectedSymptoms.length + (selectedFlow !== "None" ? 1 : 0)} data points logged
                </span>
              </div>
              <small style={{ color: "var(--muted)" }}>No streak lost if skipped</small>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <section className="landing-cta-banner">
        <ScrollReveal>
          <h2>Start logging your symptoms today</h2>
          <p>Create your private journal to track daily sensations with zero friction.</p>
          <div className="landing-cta-actions">
            <SignUpButton mode="modal">
              <button type="button" className="hero-cta-btn">
                <span>Start Your Journal</span>
                <Icon name="arrow" />
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className="hero-explore-link">
                <span>Sign In</span>
              </button>
            </SignInButton>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

/* =========================================================================
 * 02. INSIGHTS PREVIEW PAGE (Served on "/insights" when user is signed out)
 * ========================================================================= */
export function InsightsPreview() {
  return (
    <div className="preview-page">
      <ScrollReveal>
        <div className="landing-header-centered">
          <h1>Patterns over scores. Context over guesswork.</h1>
          <p>
            Your health isn&apos;t a single score or a diagnostic algorithm. We surface meaningful relationships between your cycle phases, habits, and symptoms over months.
          </p>
        </div>
      </ScrollReveal>

      <div className="landing-feature-grid reverse">
        <div className="insights-stack">
          {/* Pattern Signal Card */}
          <div className="insight-signal-card">
            <span className="signal-badge">Observed Pattern</span>
            <p className="signal-text">
              &ldquo;Fatigue and acne flare-ups co-occurred 6 times in the late luteal phase across your last 3 cycles.&rdquo;
            </p>
            <span className="signal-meta">Based on 42 logged days • Longitudinal observation, not diagnosis</span>
          </div>

          {/* Doctor Visit Prep Card */}
          <div className="doctor-summary-preview">
            <div className="doctor-summary-header">
              <span>Doctor Visit Summary (Export Ready)</span>
            </div>
            <div className="doctor-data-row">
              <div className="doctor-stat">
                <span className="doctor-stat-val">34–42 Days</span>
                <span className="doctor-stat-lbl">Cycle Length Range</span>
              </div>
              <div className="doctor-stat">
                <span className="doctor-stat-val">Days 24–28</span>
                <span className="doctor-stat-lbl">Peak Symptom Days</span>
              </div>
              <div className="doctor-stat">
                <span className="doctor-stat-val">Metformin 500mg</span>
                <span className="doctor-stat-lbl">Active Protocol</span>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-benefits-list">
          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Correlations You Can Actually Verify</h3>
              <p>See whether fatigue spikes before your period, after poor sleep, or following a change in prescription.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Prepared for 15-Minute Doctor Visits</h3>
              <p>Never rely on memory when describing 6 months of irregular periods. Bring structured summaries that clinicians respect.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>No Alarming Red Alerts</h3>
              <p>We present variance neutrally without implying medical danger or prescribing cookie-cutter fixes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <section className="landing-cta-banner">
        <ScrollReveal>
          <h2>Discover patterns in your health history</h2>
          <p>Turn daily entries into longitudinal context for yourself and your doctor.</p>
          <div className="landing-cta-actions">
            <SignUpButton mode="modal">
              <button type="button" className="hero-cta-btn">
                <span>Start Your Journal</span>
                <Icon name="arrow" />
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className="hero-explore-link">
                <span>Sign In</span>
              </button>
            </SignInButton>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

/* =========================================================================
 * 03. ASK PREVIEW PAGE (Served on "/ask" when user is signed out)
 * ========================================================================= */
export function AskPreview() {
  return (
    <div className="preview-page">
      <ScrollReveal>
        <div className="landing-header-centered">
          <h1>
            Grounded in your logs.
            <br />Prepared for your doctor.
          </h1>
          <p>
            Ask questions with context from your actual journal. Responses visually separate your personal data, clinical research, and questions to ask your physician.
          </p>
        </div>
      </ScrollReveal>

      <div className="landing-feature-grid">
        <div className="feature-benefits-list">
          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Informed by Your Journal</h3>
              <p>Ask: &ldquo;What changed after I started my supplement?&rdquo; and receive an answer drawn directly from your logged timeline.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Tri-Part Clinical Transparency</h3>
              <p>Every response clearly demarcates what comes from your history, what comes from medical literature, and what to discuss with your doctor.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Better Questions, Better Appointments</h3>
              <p>Turn anxiety into constructive questions like &ldquo;Would a fasting insulin check be informative for my cycle patterns?&rdquo;</p>
            </div>
          </div>
        </div>

        {/* Ask Multi-Part Response Mock */}
        <div className="feature-card-wrapper">
          <div className="card-header-bar">
            <div className="card-header-title">
              <Icon name="ask" />
              <span>Assistant Conversation Mock</span>
            </div>
          </div>

          <div className="ask-mock-wrapper">
            <div className="ask-prompt-bubble">
              &ldquo;What patterns should I bring up to my clinician regarding my energy drops?&rdquo;
            </div>

            <div className="ask-response-block">
              <div className="ask-section data-sec">
                <span className="ask-section-tag">Your Journal Data</span>
                <p>You recorded moderate to severe fatigue on 11 of your last 14 luteal phase days, with 7 days coinciding with less than 6.5h sleep.</p>
              </div>

              <div className="ask-section clinical-sec">
                <span className="ask-section-tag">Clinical Research</span>
                <p>In PMOS literature, luteal phase fatigue frequently correlates with nocturnal insulin resistance and progesterone-driven sleep architecture changes.</p>
              </div>

              <div className="ask-section clinician-sec">
                <span className="ask-section-tag">Questions for Your Clinician</span>
                <p>&bull; &ldquo;Could we review if my fasting insulin or thyroid markers correlate with my luteal energy drops?&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <section className="landing-cta-banner">
        <ScrollReveal>
          <h2>Ask informed questions for your care team</h2>
          <p>Get evidence-based context grounded in your personal health journal.</p>
          <div className="landing-cta-actions">
            <SignUpButton mode="modal">
              <button type="button" className="hero-cta-btn">
                <span>Start Your Journal</span>
                <Icon name="arrow" />
              </button>
            </SignUpButton>
            <Link href="/search" className="hero-explore-link" style={{ textDecoration: 'none' }}>
              <span>Search PMOS Symptoms &amp; Evidence &rarr;</span>
            </Link>
            <SignInButton mode="modal">
              <button type="button" className="hero-explore-link">
                <span>Sign In</span>
              </button>
            </SignInButton>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

/* =========================================================================
 * 04. SEARCH & LITERATURE PREVIEW PAGE (Served on "/search" when user is signed out)
 * ========================================================================= */
export function SearchPreview() {
  const [selectedTopic, setSelectedTopic] = useState<string>("Insulin resistance & cravings");

  const sampleCardContent: Record<string, { category: string; title: string; desc: string; takeaway: string }> = {
    "Insulin resistance & cravings": {
      category: "Metabolic & Glycemic Signatures",
      title: "Insulin Resistance & Reactive Hypoglycemia",
      desc: "Impaired peripheral cellular sensitivity to insulin leads to compensatory hyperinsulinemia. In PMOS, excess circulating insulin acts synergistically with LH to stimulate ovarian theca cells to produce androgens, while decreasing hepatic SHBG synthesis.",
      takeaway: "Discuss fasting insulin, HbA1c, and continuous glucose monitoring patterns with your endocrinologist.",
    },
    "Irregular cycles & anovulation": {
      category: "Ovulatory & Cycle Mechanics",
      title: "Delayed Follicular Maturation & Oligomenorrhea",
      desc: "Disrupted hypothalamic-pituitary-ovarian signaling and persistent luteinizing hormone elevation can cause follicular arrest, resulting in lengthened cycles (>35 days) or absent menses (amenorrhea).",
      takeaway: "Tracking cycle length variations and basal body temperature helps your clinician evaluate ovulatory status.",
    },
    "Hirsutism & androgen excess": {
      category: "Androgenic & Dermatologic Flares",
      title: "Tissue Androgen Sensitivity & 5α-Reductase Activity",
      desc: "Elevated free testosterone and increased local conversion to dihydrotestosterone (DHT) within hair follicles can stimulate terminal hair growth along androgen-sensitive dermal zones.",
      takeaway: "Consider requesting a full androgen panel including Total & Free Testosterone, DHEA-S, and Androstenedione.",
    },
  };

  const activeContent = sampleCardContent[selectedTopic] || sampleCardContent["Insulin resistance & cravings"];

  return (
    <div className="preview-page">
      <ScrollReveal>
        <div className="landing-header-centered">
          <h1>Evidence-informed PMOS research &amp; literature</h1>
          <p>
            Explore peer-reviewed clinical studies, metabolic mechanisms, and ovulatory guidelines to turn complex symptoms into structured, doctor-ready conversations.
          </p>
        </div>
      </ScrollReveal>

      <div className="landing-feature-grid">
        <div className="feature-benefits-list">
          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Peer-Reviewed Consensus Literature</h3>
              <p>Index clinical guidelines from international endocrine societies, ASRM/ESHRE consensuses, and peer-reviewed journals without wading through paywalls or misinformation.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Biological Mechanisms Over Guesswork</h3>
              <p>Understand the root physiological drivers behind irregular cycles, fatigue spikes, insulin sensitivity, and androgenic flares rather than receiving generic tips.</p>
            </div>
          </div>

          <div className="feature-benefit-item">
            <div className="benefit-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <div className="benefit-content">
              <h3>Prepared for Doctor Appointments</h3>
              <p>Bridge the gap between your journal logs and clinical research. Formulate precise questions that respect clinical time and drive collaborative treatment plans.</p>
            </div>
          </div>
        </div>

        {/* Search Mock Preview */}
        <div className="feature-card-wrapper">
          <div className="card-header-bar">
            <div className="card-header-title">
              <Icon name="search" />
              <span>Evidence Search Preview</span>
            </div>
          </div>

          <div className="search-mock-preview-box">
            {/* Mock Search Bar */}
            <div className="search-mock-input-row">
              <div className="search-mock-input-field">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>{selectedTopic}</span>
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="search-mock-topic-chips">
              {Object.keys(sampleCardContent).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`search-mock-chip ${selectedTopic === topic ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Sample Search Result Card */}
            <div className="search-mock-card">
              <div className="search-mock-card-header">
                <span className="search-mock-category">{activeContent.category}</span>
              </div>
              <h4 className="search-mock-card-title">{activeContent.title}</h4>
              <p className="search-mock-card-desc">{activeContent.desc}</p>
              <div className="search-mock-card-takeaway">
                <span className="takeaway-label">Clinician Conversation Point:</span>
                <p>&ldquo;{activeContent.takeaway}&rdquo;</p>
              </div>
            </div>

            {/* Locked Gate Notice */}
            <div className="search-mock-lock-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Full literature search is reserved for signed-in members. Sign in or create an account to query the full clinical index.</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <section className="landing-cta-banner">
        <ScrollReveal>
          <h2>Unlock PMOS clinical literature and evidence search</h2>
          <p>Join to access peer-reviewed clinical research and connect evidence directly with your personal health journal.</p>
          <div className="landing-cta-actions">
            <SignUpButton mode="modal">
              <button type="button" className="hero-cta-btn">
                <span>Create Free Account</span>
                <Icon name="arrow" />
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className="hero-explore-link">
                <span>Sign In to Search</span>
              </button>
            </SignInButton>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
