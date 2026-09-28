'use client';

import { useState } from 'react';
import styles from './expert-review-modal.module.css';

interface ExpertReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  userQuestion: string;
  originalAIResponse: string;
  onSuccess: (correctedText?: string) => void;
}

export function ExpertReviewModal({
  isOpen,
  onClose,
  messageId,
  userQuestion,
  originalAIResponse,
  onSuccess,
}: ExpertReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'original'>('editor');
  const [accuracy, setAccuracy] = useState<number>(5);
  const [groundedness, setGroundedness] = useState<number>(5);
  const [empathy, setEmpathy] = useState<number>(5);
  const [isSafe, setIsSafe] = useState<boolean>(true);
  const [comments, setComments] = useState<string>('');
  const [correctedResponse, setCorrectedResponse] = useState<string>(originalAIResponse);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/expert/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userQuestion,
          originalAIResponse,
          correctedResponse: correctedResponse.trim() !== originalAIResponse.trim() ? correctedResponse.trim() : undefined,
          ratingAccuracy: accuracy,
          ratingGroundedness: groundedness,
          ratingEmpathy: empathy,
          isClinicallySafe: isSafe,
          expertComments: comments.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      onSuccess(correctedResponse.trim() !== originalAIResponse.trim() ? correctedResponse.trim() : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.badge}>Databricks AI Evals & RLHF</span>
            <h2 className={styles.title}>Expert Review & Response Correction</h2>
            <p className={styles.subtitle}>
              Rate clinical accuracy, leave guidance notes, or rewrite the response to improve future Databricks AI answers.
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Question context */}
          <div className={styles.questionBox}>
            <span className={styles.questionLabel}>Patient Inquiry</span>
            &ldquo;{userQuestion}&rdquo;
          </div>

          {/* Rating rubrics */}
          <div className={styles.rubricsGrid}>
            <div className={styles.rubricItem}>
              <span className={styles.rubricLabel}>Clinical Accuracy (1–5)</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.starBtn} ${accuracy >= val ? styles.starBtnActive : ''}`}
                    onClick={() => setAccuracy(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.rubricItem}>
              <span className={styles.rubricLabel}>Grounded in Journal (1–5)</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.starBtn} ${groundedness >= val ? styles.starBtnActive : ''}`}
                    onClick={() => setGroundedness(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.rubricItem}>
              <span className={styles.rubricLabel}>Empathy & Tone (1–5)</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.starBtn} ${empathy >= val ? styles.starBtnActive : ''}`}
                    onClick={() => setEmpathy(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Safety flag */}
          <div className={styles.safetyToggleWrap}>
            <div>
              <div className={styles.safetyLabel}>Clinical Safety Check</div>
              <div className={styles.safetySub}>Is this response medically safe for a PMOS patient to read?</div>
            </div>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isSafe ? styles.toggleSafe : styles.toggleFlagged}`}
              onClick={() => setIsSafe((prev) => !prev)}
            >
              {isSafe ? '✓ Medically Safe' : '⚠ Flag Safety Concerns'}
            </button>
          </div>

          {/* Response Editor */}
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <div className={styles.editorTabs}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'editor' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('editor')}
                >
                  Edit / Correct Response
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'original' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  View Original AI Text
                </button>
              </div>
              <span className={styles.fieldHint}>Edits are saved to Delta Lake to fine-tune the model</span>
            </div>

            {activeTab === 'editor' ? (
              <textarea
                className={styles.textarea}
                value={correctedResponse}
                onChange={(e) => setCorrectedResponse(e.target.value)}
                rows={7}
                placeholder="Rewrite or refine any clinical explanations or questions for the doctor..."
              />
            ) : (
              <div className={styles.readOnlyPreview}>{originalAIResponse}</div>
            )}
          </div>

          {/* Feedback comments */}
          <div className={styles.commentsSection}>
            <label htmlFor="expert-comments" className={styles.rubricLabel}>
              Expert Commentary & Notes (Optional)
            </label>
            <textarea
              id="expert-comments"
              className={styles.commentInput}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Corrected timeline for Spironolactone efficacy. Emphasized checking fasting insulin."
              rows={2}
            />
          </div>

          {error && <div style={{ color: '#c62828', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving to Lakehouse...' : 'Submit & Improve Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
