'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { type HealthData } from '../lib/health';
import { assembleHealthContext } from '../lib/health-context';
import { getInitialOrStoredHealthData } from '../lib/health-storage';
import styles from '../app/ask/ask.module.css';
import { ScrollReveal, PhysicsInteractive, MagneticButton } from './motion';
import { SymptomSearch } from './SymptomSearch';

const starterSuggestions = [
  'What symptoms have I logged most frequently?',
  'What questions should I ask my doctor about irregular cycles?',
  'What should I discuss about medication changes and side effects?',
  'What snacks and meal patterns support PCOS blood sugar balance?',
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  question?: string;
  answer?: string;
  citations?: { id: string; title: string; url: string; publisher: string; publishedAt?: string }[];
  personalized?: boolean;
  timestamp: string;
};

export default function Ask({ data: initialPropData }: { data?: HealthData }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [personalize, setPersonalize] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const latestResponseRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const userJustSubmitted = useRef(false);
  const agentJustResponded = useRef(false);

  const hasMounted = useRef(false);

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

  function getActiveHealthData(): HealthData {
    if (initialPropData && initialPropData.logs.length > 0) return initialPropData;
    return getInitialOrStoredHealthData();
  }

  async function handleSend(textToSend?: string) {
    const rawQuestion = (textToSend ?? question).trim();
    if (busy.current) return;
    if (!rawQuestion || rawQuestion.length > 2000) {
      setError('Enter a question of up to 2,000 characters.');
      textareaRef.current?.focus();
      return;
    }

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
      const currentRecords = personalize ? getActiveHealthData() : undefined;
      const healthContext = currentRecords
        ? assembleHealthContext({ ...currentRecords, personalize: true })
        : undefined;
      if (personalize && !healthContext) {
        throw new Error('Your 90-day journal summary could not be prepared. Turn personalization off or try again.');
      }

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: rawQuestion,
          personalize,
          ...(healthContext ? { health_context: healthContext } : {}),
        }),
        signal: AbortSignal.timeout(60000),
      });

      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'The assistant is unavailable. Try again.';
        throw new Error(errorMessage);
      }
      if (!result || typeof result !== 'object' || !('answer' in result) || typeof result.answer !== 'string'
        || !('citations' in result) || !Array.isArray(result.citations)) {
        throw new Error('The response could not be read. Try again.');
      }

      const assistantMsg: Message = {
        id: `assistant-${messageId}`,
        role: 'assistant',
        question: rawQuestion,
        answer: result.answer,
        citations: result.citations,
        personalized: 'personalized' in result && result.personalized === true,
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
              <div>
                <p className="hero-badge">AI Clinical Companion</p>
                <h1 className={styles.headerTitle}>Make sense of your health history.</h1>
                <p className={styles.headerSubtitle}>
                  A Gemini-style conversational space to explore your symptoms, cycles, and doctor-ready questions.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowSearch((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    border: '1px solid var(--line)',
                    background: showSearch ? 'var(--teal)' : 'var(--surface)',
                    color: showSearch ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                  }}
                  aria-expanded={showSearch}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span>{showSearch ? 'Hide Vector Search' : 'Search Symptoms & Evidence'}</span>
                </button>
                <div className={styles.statusPill}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  <span>{personalize ? '90-day journal summary enabled' : 'Journal excluded by default'}</span>
                </div>
              </div>
            </div>
          </header>
        </ScrollReveal>

        {showSearch && (
          <ScrollReveal yOffset={10}>
            <SymptomSearch
              onSelectSymptom={(sym) => {
                handleSend(`What clinical insights and clinician questions should I know about ${sym} in PCOS?`);
              }}
            />
          </ScrollReveal>
        )}

        {/* Message History (Scrollable Conversation Area) */}
        <main className={styles.conversation} aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIconWrap}>
                <svg className={styles.sparkleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="var(--teal)" stroke="none" />
                </svg>
              </div>
              <h2 className={styles.welcomeTitle}>Welcome to your PCOS companion</h2>
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
                    <span className={styles.assistantName}>PCOS Companion</span>
                    <span className={styles.messageTime}>{message.timestamp}</span>
                  </div>

                  <div className={styles.primaryText}>
                    {(message.answer ?? '').split(/\n{2,}/).filter(Boolean).map((paragraph, paragraphIndex) => {
                      const lines = paragraph.split('\n').filter(Boolean);
                      const listItems = lines.filter((line) => /^\s*(?:[-*•])\s+/.test(line));
                      if (listItems.length === lines.length && listItems.length > 0) {
                        return (
                          <ul key={paragraphIndex} className={styles.bulletList}>
                            {listItems.map((item, itemIndex) => <li key={itemIndex}>{item.replace(/^\s*(?:[-*•])\s+/, '')}</li>)}
                          </ul>
                        );
                      }
                      return <p key={paragraphIndex}>{paragraph}</p>;
                    })}
                  </div>

                  {/* Research Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className={styles.researchSection}>
                      <span className={styles.researchLabel}>Research sources</span>
                      <div className={styles.citationsList}>
                        {message.citations.map((citation) => (
                          <div key={citation.id} className={styles.citationCard}>
                            <div className={styles.citationMeta}>
                              {/^(https?):\/\//.test(citation.url) ? (
                                <a href={citation.url} target="_blank" rel="noopener noreferrer" className={styles.citationLink}>
                                  {citation.title} ↗
                                </a>
                              ) : (
                                <span className={styles.citationTitle}>{citation.title}</span>
                              )}
                              <span className={styles.citationPublisher}>
                                {[citation.publisher, citation.publishedAt].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.metaDisclaimer}>
                    {message.personalized ? 'Included your 90-day journal summary · ' : 'Answered without journal data · '}
                    For reflection and appointment preparation, not diagnosis.
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
                <span className={styles.thinkingText}>Searching research and preparing a response…</span>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Sticky Prompt Box */}
        <div ref={composerRef} className={styles.bottomComposerArea}>
          <form className={styles.composerForm} onSubmit={onSubmit}>
            <label className={styles.personalizeToggle} htmlFor="personalize-journal">
              <input
                id="personalize-journal"
                type="checkbox"
                checked={personalize}
                onChange={(event) => setPersonalize(event.target.checked)}
                disabled={pending}
              />
              <span className={styles.toggleCopy}>
                <span className={styles.toggleTitle}>Include my 90-day journal summary</span>
                <span className={styles.toggleDescription}>
                  Off by default. When enabled, only symptom-day counts, period dates, medication names, and recent lab values are sent.
                </span>
              </span>
            </label>
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
                aria-label="Ask your PCOS companion a question"
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
    </div>
  );
}
