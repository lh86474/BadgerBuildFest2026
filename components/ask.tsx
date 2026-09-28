'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { Answer } from '../lib/ai';
import { type HealthData } from '../lib/health';
import { getInitialOrStoredHealthData, saveHealthDataLocally } from '../lib/health-storage';
import styles from '../app/ask/ask.module.css';
import { ScrollReveal, PhysicsInteractive, MagneticButton } from './motion';
import { ExpertReviewModal } from './expert-review-modal';

const starterSuggestions = [
  'What symptoms have I logged most frequently?',
  'What questions should I ask my doctor about irregular cycles?',
  'What should I discuss about medication changes and side effects?',
  'What snacks and meal patterns support PMOS blood sugar balance?',
];

function cleanDisplaySyntax(text: string): string {
  if (!text) return '';
  return text
    .replace(/^```(?:json|markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^\s*\{\s*["']?interpretation["']?\s*:\s*["']?/i, '')
    .replace(/["']?\s*,\s*["']?clinicianQuestions["']?\s*:\s*(?:\[|["'])?/i, '')
    .replace(/["'\}\]]+$/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .trim();
}

function parseClinicianQuestions(raw: string): string[] {
  if (!raw) return [];
  const cleaned = cleanDisplaySyntax(raw);
  const items = cleaned
    .split(/\n+|•|\*|-/)
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, '').trim())
    .filter((s) => s.length > 5);

  return items.length > 0 ? items : [cleaned];
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  question?: string;
  answer?: Answer;
  timestamp: string;
};

export default function Ask({
  data: initialPropData,
  initialQuery,
}: {
  data?: HealthData;
  initialQuery?: string;
} = {}) {
  const { isSignedIn, user } = useUser();
  const currentUserId = isSignedIn && user ? user.id : "local-user";

  const [activeData, setActiveData] = useState<HealthData | null>(initialPropData || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  // Expert feedback & correction state
  const [reviewTarget, setReviewTarget] = useState<{
    messageId: string;
    userQuestion: string;
    originalAIResponse: string;
  } | null>(null);
  const [reviewedMessages, setReviewedMessages] = useState<
    Record<string, { correctedText?: string; expertVerified: boolean }>
  >({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const latestResponseRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const userJustSubmitted = useRef(false);
  const agentJustResponded = useRef(false);

  const hasMounted = useRef(false);

  // Sync health data from isolated local storage and cloud Databricks
  useEffect(() => {
    const stored = getInitialOrStoredHealthData(currentUserId);
    setActiveData(stored);

    if (isSignedIn) {
      fetch('/api/user-data')
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (payload?.data && Array.isArray(payload.data.logs)) {
            setActiveData(payload.data);
            saveHealthDataLocally(payload.data, currentUserId);
          }
        })
        .catch(() => {});
    }
  }, [isSignedIn, currentUserId]);

  // Handle incoming initial query (e.g. from /search redirect)
  const initialHandled = useRef(false);
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !initialHandled.current) {
      initialHandled.current = true;
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  const scrollToPromptBox = (behavior: ScrollBehavior = 'smooth') => {
    if (!chatContainerRef.current) return;
    const containerRect = chatContainerRef.current.getBoundingClientRect();
    const targetY = containerRect.bottom + window.scrollY - window.innerHeight;
    const clampedTargetY = Math.max(0, targetY);

    if (Math.abs(window.scrollY - clampedTargetY) > 4) {
      window.scrollTo({
        top: clampedTargetY,
        behavior,
      });
    }
  };

  const scrollToLatestResponse = (behavior: ScrollBehavior = 'smooth') => {
    if (!latestResponseRef.current) return;
    const headerHeight = 84;
    const rect = latestResponseRef.current.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - headerHeight;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior,
    });
  };

  // Scroll logic:
  // 1. When agent responds: scroll to the prompt response
  // 2. When user submits a prompt: scroll to the prompt box
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (agentJustResponded.current) {
      agentJustResponded.current = false;
      const timer = setTimeout(() => {
        scrollToLatestResponse('smooth');
      }, 50);
      return () => clearTimeout(timer);
    }

    if (userJustSubmitted.current) {
      userJustSubmitted.current = false;
      const animFrame = requestAnimationFrame(() => {
        scrollToPromptBox('smooth');
      });
      return () => cancelAnimationFrame(animFrame);
    }
  }, [messages, pending]);

  function handleReviewSuccess(messageId: string, correctedText?: string) {
    setReviewedMessages((prev) => ({
      ...prev,
      [messageId]: { correctedText, expertVerified: true },
    }));

    if (correctedText) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || !msg.answer) return msg;
          const updatedAnswer = msg.answer.map((sec) =>
            sec.source === 'AI interpretation' ? { ...sec, text: correctedText } : sec
          );
          return { ...msg, answer: updatedAnswer };
        })
      );
    }
  }

  function getActiveHealthData(): HealthData {
    if (activeData && activeData.logs.length > 0) return activeData;
    if (initialPropData && initialPropData.logs.length > 0) return initialPropData;
    const stored = getInitialOrStoredHealthData(currentUserId);
    if (stored.logs.length > 0) return stored;
    // Fallback to local baseline logs if current account doesn't have logs yet
    const guestStored = getInitialOrStoredHealthData('local-user');
    return guestStored.logs.length > 0 ? guestStored : stored;
  }

  async function handleSend(textToSend?: string) {
    const rawQuestion = (textToSend ?? question).trim();
    if (busy.current) return;
    if (!rawQuestion || rawQuestion.length > 2000) {
      setError('Enter a question of up to 2,000 characters.');
      textareaRef.current?.focus();
      return;
    }

    const currentRecords = getActiveHealthData();
    const messageId = crypto.randomUUID();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const userMsg: Message = {
      id: `user-${messageId}`,
      role: 'user',
      question: rawQuestion,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setError('');
    busy.current = true;
    setPending(true);
    userJustSubmitted.current = true;

    try {
      const contextLogs = currentRecords.logs.length > 120
        ? currentRecords.logs.slice(-120)
        : currentRecords.logs;

      // Build conversational history payload (up to last 8 turns) for multi-turn context
      const historyPayload = messages.slice(-8).map((m) => {
        if (m.role === 'user') {
          return { role: 'user' as const, content: m.question || '' };
        }
        const text = m.answer?.find((s) => s.source === 'AI interpretation')?.text || '';
        return { role: 'assistant' as const, content: text };
      }).filter((m) => m.content.trim().length > 0);

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: rawQuestion,
          history: historyPayload,
          data: {
            ...currentRecords,
            logs: contextLogs,
            personalize: true, // Always personalize based on user's records!
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The assistant is unavailable. Try again.');
      if (!Array.isArray(result.answer)) throw new Error('The response could not be read. Try again.');

      const assistantMsg: Message = {
        id: `assistant-${messageId}`,
        role: 'assistant',
        question: rawQuestion,
        answer: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      agentJustResponded.current = true;
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== 'TimeoutError' && cause.name !== 'TypeError'
          ? cause.message
          : 'The assistant could not be reached. Check your connection and try again.'
      );
    } finally {
      busy.current = false;
      setPending(false);
      // Refocus input
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.page}>
      <div ref={chatContainerRef} className={styles.chatContainer}>
        {/* Top Header */}
        <ScrollReveal yOffset={20}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.headerTitles}>
                <h1 className={styles.headerTitle}>Make sense of your health history.</h1>
                <p className={styles.headerSubtitle}>
                  A conversational space to explore your symptoms, cycles, and doctor-ready questions.
                </p>
              </div>
              <div className={styles.headerActions}>
                <Link
                  href="/search"
                  className={styles.featureSearchButton}
                  aria-label="Search Symptoms & Evidence"
                >
                  <div className={styles.featureSearchIconBox} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <div className={styles.featureSearchText}>
                    <span className={styles.featureSearchTitle}>Search Symptoms &amp; Evidence</span>
                    <span className={styles.featureSearchSub}>Clinical literature &amp; Vector DB &rarr;</span>
                  </div>
                </Link>
              </div>
            </div>
          </header>
        </ScrollReveal>

        {/* Message History (Scrollable Conversation Area) */}
        <main className={styles.conversation} aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIconWrap}>
                <svg className={styles.sparkleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="var(--teal)" stroke="none" />
                </svg>
              </div>
              <h2 className={styles.welcomeTitle}>Welcome to your PMOS companion</h2>
              <p className={styles.welcomeText}>
                I can help synthesize your recorded symptoms, cycle patterns, and medications to help you prepare for discussions with your care team.
              </p>

              <div className={styles.suggestionsHeader}>Suggested questions:</div>
              <div className={styles.suggestionsGrid}>
                {starterSuggestions.map((suggestion) => (
                  <PhysicsInteractive key={suggestion} scaleOnTap={0.96} scaleOnHover={1.02}>
                    <button
                      type="button"
                      className={styles.suggestionChip}
                      onClick={() => handleSend(suggestion)}
                      disabled={pending}
                    >
                      <span>{suggestion}</span>
                      <svg className={styles.chipArrow} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </PhysicsInteractive>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className={styles.userRow}>
                  <div className={styles.userBubble}>
                    <p className={styles.userText}>{message.question}</p>
                    <span className={styles.messageTime}>{message.timestamp}</span>
                  </div>
                </div>
              );
            }

            // Assistant Message
            const answerSections = message.answer ?? [];
            const dataSection = answerSections.find((s) => s.source === 'Your data');
            const interpretationSection = answerSections.find((s) => s.source === 'AI interpretation');
            const clinicianSection = answerSections.find((s) => s.source === 'Questions for your clinician');
            const researchSection = answerSections.find((s) => s.source === 'Research');
            const tags = interpretationSection?.tags ?? dataSection?.tags ?? [];
            const isLatestAssistant =
              message.role === 'assistant' &&
              idx === messages.map((m) => m.role).lastIndexOf('assistant');

            return (
              <div
                key={message.id}
                ref={isLatestAssistant ? latestResponseRef : undefined}
                className={styles.assistantRow}
              >
                <div className={styles.assistantAvatar}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.assistantAvatarIcon}>
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                  </svg>
                </div>

                <div className={styles.assistantBody}>
                  <div className={styles.assistantHeader}>
                    <span className={styles.assistantName}>PMOS Companion</span>
                    <span className={styles.messageTime}>{message.timestamp}</span>
                  </div>

                  {/* Little tags referring to user records pulled */}
                  {tags && tags.length > 0 && (
                    <div className={styles.recordsTags} aria-label="Referenced records from your journal">
                      <span className={styles.tagsLabel}>Referenced records:</span>
                      <div className={styles.tagsPillList}>
                        {tags.map((tag) => (
                          <span key={tag} className={styles.recordTag}>
                            <span className={styles.recordTagDot} aria-hidden="true" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary conversational answer */}
                  {interpretationSection && (
                    <div className={styles.primaryText}>
                      {cleanDisplaySyntax(interpretationSection.text)
                        .split('\n\n')
                        .map((paragraph, pIdx) => {
                          const trimmedP = paragraph.trim();
                          if (/[•*-]\s+/.test(trimmedP)) {
                            const lines = trimmedP
                              .split('\n')
                              .map((l) => l.trim())
                              .filter(Boolean);
                            const intro = lines.find((l) => !/^[•*-]\s+/.test(l));
                            const items = lines.filter((l) => /^[•*-]\s+/.test(l));
                            if (items.length > 0) {
                              return (
                                <div key={pIdx} className={styles.paragraphBlock}>
                                  {intro && <p>{intro}</p>}
                                  <ul className={styles.bulletList}>
                                    {items.map((item, itemIdx) => (
                                      <li key={itemIdx}>{item.replace(/^[•*-]\s*/, '')}</li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                          }
                          return <p key={pIdx}>{trimmedP}</p>;
                        })}
                    </div>
                  )}

                  {/* Clinician Question (questions to bring to clinician) */}
                  {clinicianSection && clinicianSection.text && (
                    <div className={styles.doctorCard}>
                      <div className={styles.doctorCardHeader}>
                        <svg className={styles.doctorIcon} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className={styles.doctorCardTitle}>Questions to bring to your clinician</span>
                      </div>
                      <div className={styles.doctorQuestionList}>
                        {parseClinicianQuestions(clinicianSection.text).map((q, qIdx) => (
                          <div key={qIdx} className={styles.doctorQuestionItem}>
                            <span className={styles.doctorQuestionBullet}>•</span>
                            <p className={styles.doctorQuestionText}>{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Research Citations */}
                  {researchSection && researchSection.citations && researchSection.citations.length > 0 && (
                    <div className={styles.researchSection}>
                      <span className={styles.researchLabel}>Clinical references:</span>
                      <div className={styles.citationsList}>
                        {researchSection.citations.map((citation) => (
                          <div key={citation.id} className={styles.citationCard}>
                            <p className={styles.citationExcerpt}>&ldquo;{citation.excerpt}&rdquo;</p>
                            <div className={styles.citationMeta}>
                              {/^(https?):\/\//.test(citation.url) ? (
                                <a href={citation.url} target="_blank" rel="noopener noreferrer" className={styles.citationLink}>
                                  {citation.title} ↗
                                </a>
                              ) : (
                                <span className={styles.citationTitle}>{citation.title}</span>
                              )}
                              <span className={styles.citationPublisher}>{citation.publisher}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expert Review & Correction Action Bar */}
                  <div className={styles.expertActionBar}>
                    <div className={styles.expertActionLeft}>
                      {reviewedMessages[message.id]?.expertVerified ? (
                        <span className={styles.expertVerifiedBadge}>
                          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {reviewedMessages[message.id]?.correctedText
                              ? 'Clinician Corrected & Verified'
                              : 'Clinician Reviewed & Approved'}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.expertReviewButton}
                          onClick={() => {
                            const userQ = message.question || messages.slice(0, idx).reverse().find((m) => m.role === 'user')?.question || 'PMOS Inquiry';
                            const fullAIResponse = interpretationSection?.text || '';
                            setReviewTarget({
                              messageId: message.id,
                              userQuestion: userQ,
                              originalAIResponse: fullAIResponse,
                            });
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          <span>Expert Review & Fix</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.metaDisclaimer}>
                    Development assistant response · For reflection and doctor prep, not diagnosis.
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending Typing Indicator */}
          {pending && (
            <div className={styles.assistantRow}>
              <div className={styles.assistantAvatar}>
                <svg viewBox="0 0 24 24" fill="none" className={styles.assistantAvatarIcon}>
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.thinkingBubble}>
                <div className={styles.pulseDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.thinkingText}>Reviewing your journal records & clinical context…</span>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Sticky Prompt Box */}
        <div ref={composerRef} className={styles.bottomComposerArea}>
          <form className={styles.composerForm} onSubmit={onSubmit}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                id="health-question"
                name="question"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={2000}
                disabled={pending}
                placeholder="Ask about your symptoms, cycles, or care..."
                className={styles.chatInput}
                aria-label="Ask your PMOS companion a question"
              />

              <div className={styles.composerActions}>
                <span className={styles.characterCount}>
                  {question.length > 0 ? `${question.length}/2000` : ''}
                </span>

                <MagneticButton magneticStrength={0.22} innerStrength={0.12}>
                  <button
                    type="submit"
                    disabled={pending || !question.trim()}
                    className={styles.sendButton}
                    aria-label="Send question"
                    title="Send (Enter)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.sendIcon}>
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </MagneticButton>
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <p className={styles.disclaimerText}>
              For reflection and appointment preparation, not diagnosis or emergency care.
            </p>
          </form>
        </div>
      </div>

      {reviewTarget && (
        <ExpertReviewModal
          isOpen={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          messageId={reviewTarget.messageId}
          userQuestion={reviewTarget.userQuestion}
          originalAIResponse={reviewTarget.originalAIResponse}
          onSuccess={(correctedText) => handleReviewSuccess(reviewTarget.messageId, correctedText)}
        />
      )}
    </div>
  );
}
