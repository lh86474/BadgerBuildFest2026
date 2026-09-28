"use client";
import { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import { DailyLogForm, Medications, Labs, Cycles, WeightManager } from "./tracking";
import { SymptomInsights } from "./symptom-insights";
import { dateKey, HealthData, pretty, addDays, emptyData } from "../lib/health";
import { useUser } from "@clerk/nextjs";
import {
  getInitialOrStoredHealthData,
  saveHealthDataLocally,
} from "../lib/health-storage";
import { ScrollReveal, PhysicsInteractive } from "./motion";

const sections = [
  "Daily log",
  "Suggestions",
  "Weight",
  "Cycles",
  "Medications",
  "Lab results",
  "Previous logs",
] as const;
type Section = (typeof sections)[number];
const subscribe = () => () => { };

// Levenshtein edit distance for fuzzy typo tolerance
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 999;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Subsequence check (e.g. "plvc" matches "pelvic")
function isSubsequence(pattern: string, text: string): boolean {
  let pIdx = 0;
  for (let tIdx = 0; tIdx < text.length && pIdx < pattern.length; tIdx++) {
    if (pattern[pIdx] === text[tIdx]) {
      pIdx++;
    }
  }
  return pIdx === pattern.length;
}

// Check if a query token fuzzy-matches any word or the full string
function tokenFuzzyMatch(token: string, fullText: string, words: string[]): boolean {
  if (!token) return true;
  if (fullText.includes(token)) return true;
  for (const word of words) {
    if (!word) continue;
    if (word.includes(token)) return true;
    if (token.length >= 3 && isSubsequence(token, word)) return true;
    if (token.length >= 4) {
      const maxDistance = token.length >= 7 ? 2 : 1;
      if (editDistance(token, word) <= maxDistance) return true;
    }
  }
  return false;
}

function getLogSearchData(log: HealthData["logs"][number]) {
  const [year, month, day] = log.date.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const mIdx = parseInt(month, 10) - 1;
  const mName = mIdx >= 0 && mIdx < 12 ? monthNames[mIdx] : "";
  const sName = mIdx >= 0 && mIdx < 12 ? shortMonths[mIdx] : "";
  const dayNum = parseInt(day, 10);

  const parts: string[] = [
    log.date,
    pretty(log.date),
    `${mName} ${dayNum}`,
    `${sName} ${dayNum}`,
    `${mName} ${dayNum}, ${year}`,
    `${sName} ${dayNum}, ${year}`,
    `${mIdx + 1}/${dayNum}`,
    `${mIdx + 1}/${dayNum}/${year}`,
    ...log.symptoms,
    log.bleeding ? `Bleeding ${log.bleeding} Flow` : "",
    log.periodStart ? "Period started cycle day 1" : "",
    log.periodEnd ? "Period ended" : "",
    log.weight !== undefined ? `Weight ${log.weight} ${log.weightUnit || "lbs"} ${log.weightNote || ""}` : "",
    log.notes || "",
    log.painNote || "",
    log.meals || "",
    log.movement || "",
    ...Object.values(log.sideEffects || {}),
  ];

  const fullText = parts.join(" ").toLowerCase();
  const words = fullText.split(/[\s,·\-_/]+/).filter(Boolean);
  return { fullText, words };
}
export function TrackingWorkspace() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return ready ? (
    <LoadedTrackingWorkspace />
  ) : (
    <div className="tracking">
      <p role="status">Loading your journal…</p>
    </div>
  );
}

function LoadedTrackingWorkspace() {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = isSignedIn && user ? user.id : "local-user";

  const [data, setData] = useState<HealthData | null>(null);
  const [error] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [section, setSection] = useState<Section>("Daily log");
  const [date, setDate] = useState(dateKey());
  const [dirty, setDirty] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [extraLogsCount, setExtraLogsCount] = useState(0);
  const [pending, setPending] = useState<{
    section: Section;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // Load locally saved data for this specific user
    const local = getInitialOrStoredHealthData(currentUserId);
    setData(local);

    // If signed in, query Databricks for this user's cloud records
    if (isSignedIn) {
      fetch("/api/user-data")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (payload?.data && Array.isArray(payload.data.logs)) {
            setData(payload.data);
            saveHealthDataLocally(payload.data, currentUserId);
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, isSignedIn, currentUserId]);

  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function navigate(next: Section, nextDate = dateKey()) {
    if (next === section) return;
    if (dirty) {
      setPending({ section: next, date: nextDate });
      return;
    }
    setSection(next);
    setDate(nextDate);
  }
  function save(next: HealthData) {
    try {
      const scopedNext: HealthData = {
        ...next,
        user: {
          id: currentUserId,
          name: user?.fullName || next.user?.name || "User",
        },
        logs: (next.logs || []).map((l) => ({ ...l, userId: currentUserId })),
        medications: (next.medications || []).map((m) => ({ ...m, userId: currentUserId })),
        labs: (next.labs || []).map((l) => ({ ...l, userId: currentUserId })),
      };

      saveHealthDataLocally(scopedNext, currentUserId);
      setData(scopedNext);
      setDirty(false);

      // Background sync to Databricks Delta Lake if signed in
      if (isSignedIn) {
        fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: scopedNext }),
        }).catch(() => {});
      }

      return true;
    } catch {
      return false;
    }
  }

  const twoWeeksAgo = useMemo(() => addDays(dateKey(), -14), []);

  const {
    displayLogs,
    hasOlderLogs,
    olderLogsCount,
    visibleOlderCount,
    remainingOlderCount,
    hasDateFilter,
    effectiveStart,
    effectiveEnd,
  } = useMemo(() => {
    if (!data?.logs) {
      return {
        displayLogs: [],
        hasOlderLogs: false,
        olderLogsCount: 0,
        visibleOlderCount: 0,
        remainingOlderCount: 0,
        hasDateFilter: false,
        effectiveStart: "",
        effectiveEnd: "",
      };
    }

    let list = [...data.logs].sort((a, b) => b.date.localeCompare(a.date));

    // Handle date range in either order gracefully
    let start = logStartDate;
    let end = logEndDate;
    if (start && end && start > end) {
      [start, end] = [end, start];
    }

    if (start) {
      list = list.filter((l) => l.date >= start);
    }
    if (end) {
      list = list.filter((l) => l.date <= end);
    }

    const trimmedQuery = logSearchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
      list = list.filter((log) => {
        const { fullText, words } = getLogSearchData(log);
        return tokens.every((token) => tokenFuzzyMatch(token, fullText, words));
      });
    }

    const isCustomDateRange = Boolean(logStartDate || logEndDate);

    // If explicit date range filter is active, show everything matching that range
    if (isCustomDateRange) {
      return {
        displayLogs: list,
        hasOlderLogs: false,
        olderLogsCount: 0,
        visibleOlderCount: 0,
        remainingOlderCount: 0,
        hasDateFilter: true,
        effectiveStart: start,
        effectiveEnd: end,
      };
    }

    // Default mode: past 2 weeks + 20 additional entries per "show more" click
    const recentLogs = list.filter((l) => l.date >= twoWeeksAgo);
    const olderLogs = list.filter((l) => l.date < twoWeeksAgo);
    const visibleOlder = olderLogs.slice(0, extraLogsCount);
    const remainingOlder = Math.max(0, olderLogs.length - extraLogsCount);

    return {
      displayLogs: [...recentLogs, ...visibleOlder],
      hasOlderLogs: olderLogs.length > 0,
      olderLogsCount: olderLogs.length,
      visibleOlderCount: visibleOlder.length,
      remainingOlderCount: remainingOlder,
      hasDateFilter: false,
      effectiveStart: "",
      effectiveEnd: "",
    };
  }, [data?.logs, logStartDate, logEndDate, logSearchQuery, extraLogsCount, twoWeeksAgo]);
  return (
    <div className="tracking">
      <a className="skip-link" href="#tracking-content">
        Skip to tracking form
      </a>
      <ScrollReveal yOffset={20}>
        <section className="page-hero" aria-labelledby="track-hero-title">
          <div className="hero-content">
            <p className="hero-badge">Your personal health journal</p>
            <h1 id="track-hero-title">Make room for how you feel.</h1>
            <p className="hero-subtitle">A few details today. A clearer record over time.</p>
          </div>
          <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button-quiet"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your journal records and start fresh?")) {
                  save(emptyData(currentUserId));
                  setResetNotice("Journal cleared and reset to fresh state.");
                  setTimeout(() => setResetNotice(""), 4500);
                }
              }}
            >
              Reset to fresh journal
            </button>
            {resetNotice && (
              <span className="badge" role="status">
                {resetNotice}
              </span>
            )}
          </div>
        </section>
      </ScrollReveal>
      <nav className="track-nav" aria-label="Tracking sections">
        {sections.map((s) => (
          <PhysicsInteractive key={s} className="inline-block" scaleOnTap={0.96}>
            <button
              aria-current={section === s ? "page" : undefined}
              onClick={() => navigate(s)}
            >
              {s}
            </button>
          </PhysicsInteractive>
        ))}
      </nav>
      {pending && (
        <div className="unsaved" role="alert">
          <p>
            You have unsaved changes. Keep editing or discard them to switch
            views.
          </p>
          <div className="actions">
            <button onClick={() => setPending(null)}>Keep editing</button>
            <button
              onClick={() => {
                setDirty(false);
                setSection(pending.section);
                setDate(pending.date);
                setPending(null);
              }}
            >
              Discard changes
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p role="status">Loading your journal…</p>
      ) : (
        <section
          id="tracking-content"
          tabIndex={-1}
          className="track-content"
          key={`${section}-${date}`}
          onChangeCapture={() => setDirty(true)}
        >
          {section === "Daily log" && (
            <DailyLogForm
              data={data}
              save={save}
              date={date}
              onDirty={setDirty}
              onSave={() => navigate("Suggestions")}
            />
          )}
          {section === "Suggestions" && (
            <>
              <h2>Personalized Suggestions</h2>
              <p>Based on your saved symptoms, here are personalized insights and recommendations.</p>
              {(() => {
                const mostRecentLog = [...data.logs].sort((a, b) => b.date.localeCompare(a.date))[0];
                return mostRecentLog && mostRecentLog.symptoms.length > 0 ? (
                  <SymptomInsights symptoms={mostRecentLog.symptoms} />
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                    <p>No symptoms recorded yet. Add symptoms in your Daily log and save to see personalized suggestions here.</p>
                  </div>
                );
              })()}
            </>
          )}
          {section === "Weight" && (
            <WeightManager
              data={data}
              save={save}
              onDirty={setDirty}
              onEditDate={(d) => navigate("Daily log", d)}
            />
          )}
          {section === "Cycles" && (
            <Cycles
              data={data}
              save={save}
              onEdit={(d) => navigate("Daily log", d)}
            />
          )}
          {section === "Medications" && (
            <Medications data={data} save={save} onDirty={setDirty} />
          )}
          {section === "Lab results" && (
            <Labs data={data} save={save} onDirty={setDirty} />
          )}
          {section === "Previous logs" && (
            <>
              <h2>Previous logs</h2>
              <p>Open an entry to update any detail.</p>

              <div className="previous-logs-toolbar">
                <div className="search-input-box">
                  <svg
                    className="search-input-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="logs-search-input"
                    placeholder="Search by symptom, flow, note, or date (e.g. 'bloating', 'Sep 24')..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    aria-label="Search previous logs with fuzzy matching"
                  />
                  {logSearchQuery && (
                    <button
                      type="button"
                      className="search-clear-action"
                      onClick={() => setLogSearchQuery("")}
                      aria-label="Clear search query"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="date-range-filter-box">
                  <span className="date-filter-label">Range:</span>
                  <div className="date-range-inputs">
                    <span className="date-sublabel">From</span>
                    <input
                      type="date"
                      className="logs-date-input"
                      value={logStartDate}
                      max={logEndDate || undefined}
                      onChange={(e) => {
                        setLogStartDate(e.target.value);
                        setExtraLogsCount(0);
                      }}
                      aria-label="Filter logs starting from date"
                      title="Start date"
                    />
                    <span className="date-range-separator" aria-hidden="true">–</span>
                    <span className="date-sublabel">To</span>
                    <input
                      type="date"
                      className="logs-date-input"
                      value={logEndDate}
                      min={logStartDate || undefined}
                      onChange={(e) => {
                        setLogEndDate(e.target.value);
                        setExtraLogsCount(0);
                      }}
                      aria-label="Filter logs up to end date"
                      title="End date"
                    />
                  </div>
                  {(logStartDate || logEndDate) && (
                    <button
                      type="button"
                      className="date-clear-action"
                      onClick={() => {
                        setLogStartDate("");
                        setLogEndDate("");
                        setExtraLogsCount(0);
                      }}
                      aria-label="Clear date range filter"
                      title="Clear date range"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {(logSearchQuery || hasDateFilter) ? (
                <div className="search-status-bar">
                  <span>
                    Showing <strong>{displayLogs.length}</strong> of {data?.logs?.length ?? 0} entries
                    {hasDateFilter && (
                      effectiveStart && effectiveEnd ? (
                        effectiveStart === effectiveEnd ? (
                          <> on <strong>{pretty(effectiveStart)}, {effectiveStart.slice(0, 4)}</strong></>
                        ) : (
                          <> from <strong>{pretty(effectiveStart)}{effectiveStart.slice(0, 4) !== effectiveEnd.slice(0, 4) ? `, ${effectiveStart.slice(0, 4)}` : ""}</strong> to <strong>{pretty(effectiveEnd)}, {effectiveEnd.slice(0, 4)}</strong></>
                        )
                      ) : effectiveStart ? (
                        <> from <strong>{pretty(effectiveStart)}, {effectiveStart.slice(0, 4)}</strong> onwards</>
                      ) : (
                        <> up to <strong>{pretty(effectiveEnd)}, {effectiveEnd.slice(0, 4)}</strong></>
                      )
                    )}
                    {logSearchQuery && <> matching &ldquo;<strong>{logSearchQuery}</strong>&rdquo;</>}
                  </span>
                  <button
                    type="button"
                    className="reset-filters-btn"
                    onClick={() => {
                      setLogSearchQuery("");
                      setLogStartDate("");
                      setLogEndDate("");
                      setExtraLogsCount(0);
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="search-status-bar logs-scope-bar">
                  <span>
                    {extraLogsCount > 0 ? (
                      <>Showing <strong>{displayLogs.length}</strong> entries (past 2 weeks + {visibleOlderCount} older)</>
                    ) : (
                      <>Showing past 2 weeks (<strong>{displayLogs.length}</strong> {displayLogs.length === 1 ? "entry" : "entries"})</>
                    )}
                  </span>
                  {hasOlderLogs && remainingOlderCount > 0 && (
                    <button
                      type="button"
                      className="reset-filters-btn"
                      onClick={() => setExtraLogsCount((prev) => prev + 20)}
                    >
                      Show 20 more ({remainingOlderCount} left)
                    </button>
                  )}
                </div>
              )}

              {displayLogs.map((l) => (
                <article className="record" key={l.id}>
                  <div>
                    <h3>
                      {pretty(l.date)}, {l.date.slice(0, 4)}
                    </h3>
                    <p>{l.symptoms.join(", ") || "No symptoms recorded"}</p>
                    <small>
                      {[
                        l.bleeding && `Bleeding: ${l.bleeding}`,
                        l.periodStart && "Period started",
                        l.periodEnd && "Period ended",
                        l.weight !== undefined && `Weight: ${l.weight} ${l.weightUnit || "lbs"}${l.weightNote ? ` (${l.weightNote})` : ""}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                  <button
                    aria-label={`Edit entry for ${l.date}`}
                    onClick={() => navigate("Daily log", l.date)}
                  >
                    Edit entry
                  </button>
                </article>
              ))}

              {!hasDateFilter && hasOlderLogs && (
                <div className="show-more-logs-wrap">
                  {remainingOlderCount > 0 ? (
                    <button
                      type="button"
                      className="show-more-logs-btn"
                      onClick={() => setExtraLogsCount((prev) => prev + 20)}
                    >
                      <span>Show more</span>
                      <span className="older-count-badge">
                        +{Math.min(20, remainingOlderCount)} more ({remainingOlderCount} older left)
                      </span>
                    </button>
                  ) : (
                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                      All {displayLogs.length} previous check-ins loaded
                    </span>
                  )}
                </div>
              )}

              {data && data.logs.length > 0 && displayLogs.length === 0 && (
                <div className="empty-search-state">
                  {!hasDateFilter && !logSearchQuery && extraLogsCount === 0 && hasOlderLogs ? (
                    <>
                      <p>No check-ins logged in the past 2 weeks.</p>
                      <div className="show-more-logs-wrap" style={{ borderTop: "none", margin: "16px 0 0" }}>
                        <button
                          type="button"
                          className="show-more-logs-btn"
                          onClick={() => setExtraLogsCount((prev) => prev + 20)}
                        >
                          <span>Show more</span>
                          <span className="older-count-badge">
                            Show first {Math.min(20, olderLogsCount)} of {olderLogsCount} older entries
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>No previous logs match your search or date range.</p>
                      <button
                        type="button"
                        className="button button-quiet"
                        onClick={() => {
                          setLogSearchQuery("");
                          setLogStartDate("");
                          setLogEndDate("");
                          setExtraLogsCount(0);
                        }}
                      >
                        Clear search & date range
                      </button>
                    </>
                  )}
                </div>
              )}

              {(!data || !data.logs.length) && (
                <p className="empty-state">
                  Your saved check-ins will appear here. Start with today, or
                  choose an earlier date in Daily log.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
