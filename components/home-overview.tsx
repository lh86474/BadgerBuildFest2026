"use client";

import Link from "next/link";
import { CycleWheel } from "./cycle-wheel";
import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";
import {
  addDays,
  cycleHistory,
  pretty,
  scoped,
  type HealthData,
} from "../lib/health";
import { EmptyState, Icon, SectionHeading } from "./ui";
import { getInitialOrStoredHealthData, saveHealthDataLocally } from "../lib/health-storage";
import {
  MagneticButton,
  ScrollReveal,
  StaggerReveal,
  StaggerItem,
  TracingDivider,
  AmbientBackground,
  AnimatedFingerprintCycle,
} from "./motion";
import { PhenotypeSummaryCard } from "./quiz/phenotype-summary-card";
import { QuizModal } from "./quiz/quiz-modal";
import { useStoredQuizResult } from "../lib/quiz-storage";
import type { QuizResult } from "../lib/quiz-types";
import "./home-overview.css";

type Props = { data: HealthData; today: string };
const subscribe = () => () => {};

export function HomeOverview(props: Props) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return ready ? (
    <LoadedHomeOverview {...props} />
  ) : (
    <HomeOverviewContent {...props} personalData={null} />
  );
}

function LoadedHomeOverview(props: Props) {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = isSignedIn && user ? user.id : "local-user";
  const userName = user?.firstName || null;
  const quizResult = useStoredQuizResult(currentUserId);
  const [autoQuizOpen, setAutoQuizOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const alreadyAutoShown = typeof window !== 'undefined' && sessionStorage.getItem('pcos-quiz-auto-shown');
    if (!quizResult && !alreadyAutoShown) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pcos-quiz-auto-shown', 'true');
      }
      setAutoQuizOpen(true);
    }
  }, [isLoaded, isSignedIn, quizResult]);

  const [personalData, setPersonalData] = useState<HealthData | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const local = getInitialOrStoredHealthData(currentUserId);
    setPersonalData(local);

    if (isSignedIn) {
      fetch("/api/user-data")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (payload?.data && Array.isArray(payload.data.logs)) {
            setPersonalData(payload.data);
            saveHealthDataLocally(payload.data, currentUserId);
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn, currentUserId]);

  return (
    <HomeOverviewContent
      {...props}
      personalData={personalData}
      userName={userName}
      userId={currentUserId}
      quizResult={quizResult}
      autoQuizOpen={autoQuizOpen}
      setAutoQuizOpen={setAutoQuizOpen}
    />
  );
}

function HomeOverviewContent({
  data: emptyStateData,
  personalData,
  today,
  userName,
  userId,
  quizResult,
  autoQuizOpen,
  setAutoQuizOpen,
}: Props & {
  personalData: HealthData | null;
  userName?: string | null;
  userId?: string | null;
  quizResult?: QuizResult | null;
  autoQuizOpen?: boolean;
  setAutoQuizOpen?: (open: boolean) => void;
}) {
  const data = scoped(personalData ?? emptyStateData);
  const logs = [...data.logs]
    .filter((log) => log.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const cycles = cycleHistory(logs);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  // Determine the 2-3 items logged most frequently in the last two weeks
  const frequentLayers = useMemo(() => {
    const twoWeekLogs = logs.filter((entry) => dates.includes(entry.date));
    const counts = new Map<string, number>();

    const bleedingCount = twoWeekLogs.filter(
      (entry) => entry.bleeding && entry.bleeding !== "None"
    ).length;
    if (bleedingCount > 0) {
      counts.set("Bleeding", bleedingCount);
    }

    twoWeekLogs.forEach((entry) => {
      entry.symptoms.forEach((symptom) => {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      });
    });

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    if (sorted.length >= 2) {
      return sorted.slice(0, 3);
    }

    const fallback = ["Bleeding", "Bloating", "Fatigue"];
    const merged = Array.from(new Set([...sorted, ...fallback]));
    return merged.slice(0, 3);
  }, [logs, dates]);
  return (
    <>
      <section className="page-hero" aria-labelledby="home-hero-title">
        <AmbientBackground />
        <div className="page-hero-grid">
          <div className="hero-content">
            <StaggerReveal staggerDelay={0.09}>
              <StaggerItem>
                <div className="hero-headline-group">
                  <h1 id="home-hero-title">
                    {userName ? `Welcome to PHASE, ${userName}` : "Welcome to PHASE"}
                  </h1>
                  <div className="hero-tablet-emblem" aria-hidden="true">
                    <AnimatedFingerprintCycle size={120} />
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <p className="hero-subtitle">
                  Here is your recent health context, cycle patterns, and longitudinal journal.
                </p>
              </StaggerItem>
              <StaggerItem>
                <div className="hero-actions">
                  <MagneticButton magneticStrength={0.25} innerStrength={0.12}>
                    <Link className="button button-primary" href="/track">
                      <Icon name="track" />
                      <span>Go to Track</span>
                      <Icon name="arrow" />
                    </Link>
                  </MagneticButton>
                  <MagneticButton magneticStrength={0.2} innerStrength={0.1}>
                    <Link className="button button-quiet" href="/insights">
                      <Icon name="insights" />
                      <span>View Insights</span>
                    </Link>
                  </MagneticButton>
                </div>
              </StaggerItem>
            </StaggerReveal>
          </div>

          <div className="hero-visual-col">
            <div className="hero-visual-wrapper">
              <AnimatedFingerprintCycle size={300} />
            </div>
          </div>
        </div>
      </section>

      {/* SVG Path Tracing Divider */}
      <TracingDivider variant="wave" color="#66A3BF" />

      {/* Phenotype & Cycle Assessment Summary Card */}
      <ScrollReveal yOffset={24}>
        <PhenotypeSummaryCard
          quizResult={quizResult ?? null}
          userId={userId}
          userName={userName}
        />
      </ScrollReveal>

      <ScrollReveal yOffset={24}>
        <div className="home-summary-row">
        <CycleWheel cycles={cycles} today={today} />
        <section className="recent-context home-recent-entries" aria-labelledby="recent-entries-title" id="recent-entries">
          <div className="home-recent-entries-header">
            <div>
              <h2 id="recent-entries-title">Most recent entries</h2>
              <p>Your latest logged symptoms, bleeding flow, and daily observations.</p>
            </div>
            <Link className="button button-quiet header-action" href="/track">
              <Icon name="track" />
              <span>Log today</span>
            </Link>
          </div>

          {logs.length ? (
            <div className="recent-entry-list">
              {logs.slice(0, 3).map((log) => {
                const isToday = log.date === today;
                const isYesterday = log.date === addDays(today, -1);
                const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : pretty(log.date);

                return (
                  <article className="recent-entry-card" key={log.id}>
                    <div className="recent-entry-header">
                      <div className="recent-entry-date-group">
                        <time className="recent-entry-date" dateTime={log.date}>
                          {dateLabel}
                        </time>
                        {(isToday || isYesterday) && (
                          <span className="recent-entry-subdate">{pretty(log.date)}</span>
                        )}
                      </div>
                      <div className="recent-entry-badges">
                        {log.periodStart && (
                          <span className="entry-badge badge-period">Cycle Day 1</span>
                        )}
                        {log.bleeding && log.bleeding !== "None" && (
                          <span className={`entry-badge badge-flow badge-flow-${log.bleeding.toLowerCase()}`}>
                            Flow: {log.bleeding}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="recent-entry-body">
                      {log.symptoms.length ? (
                        <div className="symptom-tag-list">
                          {log.symptoms.map((s) => (
                            <span key={s} className="symptom-tag">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="recent-entry-no-symptoms">No symptoms recorded in this check-in</p>
                      )}

                      {(log.pain !== undefined || log.energy !== undefined || log.sleepMinutes !== undefined || log.weight !== undefined || log.notes) && (
                        <div className="recent-entry-meta">
                          {log.pain !== undefined && (
                            <span className="meta-pill">Pain: {log.pain}/10</span>
                          )}
                          {log.energy !== undefined && (
                            <span className="meta-pill">Energy: {log.energy}/5</span>
                          )}
                          {log.sleepMinutes !== undefined && (
                            <span className="meta-pill">
                              Sleep: {Math.floor(log.sleepMinutes / 60)}h {log.sleepMinutes % 60}m
                            </span>
                          )}
                          {log.weight !== undefined && (
                            <span className="meta-pill">
                              Weight: {log.weight} {log.weightUnit || "lbs"}
                            </span>
                          )}
                          {log.notes && (
                            <p className="recent-entry-note">&ldquo;{log.notes}&rdquo;</p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {logs.length < 3 && (
                <div className="recent-entry-summary-panel">
                  <div className="summary-panel-indicator" />
                  <div className="summary-panel-content">
                    <div className="summary-panel-title">
                      {logs.some((l) => l.date === today) ? "Logged for today" : "Today's check-in"}
                    </div>
                    <p className="summary-panel-desc">
                      {logs.some((l) => l.date === today)
                        ? "You have recorded your check-in for today. Continuous logging helps reveal subtle symptom correlations in Insights."
                        : "Logging each day—even when symptoms are mild—helps establish your personal baseline."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="recent-entry-empty">
              <div className="empty-icon-wrap">
                <Icon name="track" />
              </div>
              <h3>No check-ins recorded yet</h3>
              <p>Your saved check-ins will appear here. Start with what feels useful today—flow, symptoms, energy, or sleep.</p>
              <Link className="button button-primary" href="/track">
                <span>Record today&apos;s check-in</span>
                <Icon name="arrow" />
              </Link>
            </div>
          )}

          <div className="home-recent-entries-footer">
            <Link className="text-link" href="/track">
              {logs.length ? "Open full daily log & history" : "Add your first entry"} <Icon name="arrow" />
            </Link>
          </div>
        </section>
      </div>
      </ScrollReveal>

      {personalData ? (
        <ScrollReveal yOffset={24} delay={0.06}>
          <section className="history-surface" aria-labelledby="history-title">
            <SectionHeading
              title="The last two weeks"
              description={`${pretty(dates[0])} – ${pretty(today)} · Your recorded history`}
            >
              <span className="history-key">
                <span />
                Recorded
              </span>
            </SectionHeading>
            <h3 id="history-title" className="sr-only">
              Symptom and bleeding history
            </h3>
            <div
              className="history-scroll"
              role="region"
              aria-label="Two-week history, scroll horizontally for all dates"
              tabIndex={0}
            >
              <table className="history-table">
                <thead>
                  <tr>
                    <th scope="col">Recorded detail</th>
                    {dates.map((date) => (
                      <th key={date} scope="col">
                        <span>
                          {new Date(date + "T12:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "narrow" },
                          )}
                        </span>
                        <time dateTime={date}>{Number(date.slice(-2))}</time>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frequentLayers.map((layer) => (
                    <tr key={layer}>
                      <th scope="row">{layer}</th>
                      {dates.map((date) => {
                        const log = logs.find((entry) => entry.date === date);
                        const recorded =
                          layer === "Bleeding"
                            ? Boolean(log?.bleeding && log.bleeding !== "None")
                            : Boolean(log?.symptoms.includes(layer));
                        return (
                          <td key={date}>
                            <span
                              className={`history-mark${recorded ? " is-recorded" : ""}`}
                              aria-label={`${pretty(date)}: ${recorded ? "recorded" : log ? "not selected" : "no entry"}`}
                            >
                              {recorded ? "●" : "–"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="history-caption">
              A dot marks a recorded detail. A dash means no entry or not
              selected; it does not confirm the absence of a symptom.
            </p>
          </section>
        </ScrollReveal>
      ) : (
        <ScrollReveal yOffset={24}>
          <section className="history-surface">
            <EmptyState title="Begin with today">
              Record what feels useful—symptoms, your cycle, sleep, medications,
              or a note. Your history will take shape one entry at a time.
            </EmptyState>
            <div className="empty-actions">
              <MagneticButton magneticStrength={0.25} innerStrength={0.12}>
                <Link
                  className="button button-primary"
                  href="/track"
                >
                  Create your first entry
                  <Icon name="arrow" />
                </Link>
              </MagneticButton>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Auto-launching Onboarding Quiz Modal for new users */}
      <QuizModal
        isOpen={Boolean(autoQuizOpen)}
        onClose={() => setAutoQuizOpen?.(false)}
        userId={userId}
        initialResult={null}
      />
    </>
  );
}
