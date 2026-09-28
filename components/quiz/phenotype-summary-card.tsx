'use client';

import React, { useState } from 'react';
import type { QuizResult } from '../../lib/quiz-types';
import { QuizModal } from './quiz-modal';
import styles from './quiz.module.css';

interface PhenotypeSummaryCardProps {
  quizResult: QuizResult | null;
  userId?: string | null;
  userName?: string | null;
}

export function PhenotypeSummaryCard({
  quizResult,
  userId,
  userName,
}: PhenotypeSummaryCardProps) {
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  if (!quizResult) {
    return (
      <>
        <div className={styles.onboardingCard}>
          <div>
            <h3 className={styles.dashboardTitle}>
              {userName ? `Welcome, ${userName}. Uncover your PCOS phenotype` : 'Uncover your PCOS phenotype & cycle mechanics'}
            </h3>
            <p className={styles.questionHint} style={{ maxWidth: 540, marginTop: 6, marginBottom: 0 }}>
              Complete the 6-part clinical questionnaire to identify your primary ovulatory pillar (true anovulation, hypothalamic amenorrhea, or post-pill transition) and discover your personalized profile.
            </p>
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setModalOpen(true)}
          >
            <span>Start 3-Min Quiz</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>

        <QuizModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={userId}
          initialResult={null}
        />
      </>
    );
  }

  return (
    <>
      <article className={styles.dashboardCard} aria-labelledby="phenotype-summary-title">
        <div className={styles.dashboardHeader}>
          <div>
            <h3 className={styles.dashboardTitle} id="phenotype-summary-title">
              {quizResult.phenotypeTitle}
            </h3>
          </div>
          <button
            type="button"
            className={styles.btnQuiet}
            onClick={() => setModalOpen(true)}
            title="Retake the 6-part phenotype assessment"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Retake Quiz</span>
          </button>
        </div>

        {/* Pillars Row */}
        <div className={styles.dashboardPillarsRow}>
          <div className={styles.dashboardPillarBadge}>
            <span className={styles.dashboardPillarLabel}>Primary Pillar:</span>
            <strong>{quizResult.primaryPillar}</strong>
          </div>
          <div className={styles.dashboardPillarBadge}>
            <span className={styles.dashboardPillarLabel}>Secondary Pillar:</span>
            <strong>{quizResult.secondaryPillar}</strong>
          </div>
        </div>

        {/* Calm "Why This Matters" Insight */}
        <p className={styles.dashboardWhy}>
          <strong>Why this matters:</strong> {quizResult.whyThisMatters}
        </p>

        {/* Dashboard Footer / Trigger */}
        <div className={styles.dashboardFooter}>
          <div className={styles.signalsChips}>
            <span className={styles.signalChip}>Metabolic: {quizResult.scores.metabolic}%</span>
            <span className={styles.signalChip}>Neuro-Adrenal: {quizResult.scores.adrenal}%</span>
            <span className={styles.signalChip}>Inflammatory: {quizResult.scores.inflammatory}%</span>
            <span className={styles.signalChip}>Androgenic: {quizResult.scores.androgenic}%</span>
          </div>

          <button
            type="button"
            className={styles.btnQuiet}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={() => setModalOpen(true)}
          >
            <span>View Full Clinical Breakdown</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>
      </article>

      <QuizModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        initialResult={quizResult}
      />
    </>
  );
}
