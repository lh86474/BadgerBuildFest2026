"use client";
import { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import { DailyLogForm, Medications, Labs, Cycles } from "./tracking";
import { SymptomInsights } from "./symptom-insights";
import { dateKey, HealthData, pretty } from "../lib/health";
import {
  getInitialOrStoredHealthData,
  healthStorageKey,
} from "../lib/health-storage";
import { sampleHealthData } from "../lib/sample-data";
import { ScrollReveal, PhysicsInteractive } from "./motion";

const sections = [
  "Daily log",
  "Suggestions",
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
function readStorage(): { data: HealthData | null; error: string } {
  try {
    const data = getInitialOrStoredHealthData();
    return { data, error: "" };
  } catch {
    return {
      data: null,
      error:
        "Your saved records could not be loaded. Please reload and try again.",
    };
  }
}
function LoadedTrackingWorkspace() {
  const [initial] = useState(readStorage);
  const [data, setData] = useState(initial.data);
  const error = initial.error;
  const [sampleLoadedNotice, setSampleLoadedNotice] = useState("");
  const [section, setSection] = useState<Section>("Daily log");
  const [date, setDate] = useState(dateKey());
  const [dirty, setDirty] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logDateFilter, setLogDateFilter] = useState("");
  const [pending, setPending] = useState<{
    section: Section;
    date: string;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "saved" | "local_only">("idle");

  useEffect(() => {
    // Attempt to load latest records from Databricks Lakehouse if logged in
    fetch("/api/user-data")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data && Array.isArray(payload.data.logs) && payload.data.logs.length > 0) {
          setData(payload.data);
          try {
            localStorage.setItem(healthStorageKey, JSON.stringify(payload.data));
          } catch {}
          setSyncStatus("saved");
          setTimeout(() => setSyncStatus("idle"), 4000);
        }
      })
      .catch(() => {});
  }, []);

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
      localStorage.setItem(healthStorageKey, JSON.stringify(next));
      setData(next);
      setDirty(false);
      setSyncStatus("syncing");

      // Background sync to Databricks Delta Lake
      fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success || res.destination === "databricks-delta-lake") {
            setSyncStatus("saved");
            setTimeout(() => setSyncStatus("idle"), 4000);
          } else {
            setSyncStatus("local_only");
            setTimeout(() => setSyncStatus("idle"), 4000);
          }
        })
        .catch(() => {
          setSyncStatus("local_only");
          setTimeout(() => setSyncStatus("idle"), 4000);
        });

      return true;
    } catch {
      return false;
    }
  }

  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    let list = [...data.logs].sort((a, b) => b.date.localeCompare(a.date));

    if (logDateFilter) {
      list = list.filter((l) => l.date === logDateFilter);
    }

    const trimmedQuery = logSearchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
      list = list.filter((log) => {
        const { fullText, words } = getLogSearchData(log);
        return tokens.every((token) => tokenFuzzyMatch(token, fullText, words));
      });
    }

    return list;
  }, [data?.logs, logDateFilter, logSearchQuery]);
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
                if (window.confirm("Reload the 2-year sample dataset (731 daily logs, 20 cycles, medications, and labs)?")) {
                  save(sampleHealthData);
                  setSampleLoadedNotice("Loaded 2 years of sample records.");
                  setTimeout(() => setSampleLoadedNotice(""), 4500);
                }
              }}
            >
              Reload 2-Year Sample Data
            </button>
            {sampleLoadedNotice && (
              <span className="badge" role="status">
                {sampleLoadedNotice}
              </span>
            )}
            {syncStatus === "syncing" && (
              <span
                className="badge"
                role="status"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  background: "rgba(217, 119, 6, 0.1)",
                  color: "#d97706",
                  border: "1px solid rgba(217, 119, 6, 0.2)",
                  fontSize: "0.75rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#d97706",
                  }}
                />
                Syncing to Databricks…
              </span>
            )}
            {syncStatus === "saved" && (
              <span
                className="badge"
                role="status"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "#16a34a",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  fontSize: "0.75rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#16a34a",
                  }}
                />
                Saved to Databricks Delta Lake
              </span>
            )}
            {syncStatus === "local_only" && (
              <span
                className="badge"
                role="status"
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.8,
                }}
              >
                Saved locally
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

                <div className="date-filter-box">
                  <span className="date-filter-label">Date:</span>
                  <input
                    type="date"
                    className="logs-date-input"
                    value={logDateFilter}
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    aria-label="Filter logs by specific date"
                    title="Filter by exact date"
                  />
                  {logDateFilter && (
                    <button
                      type="button"
                      className="date-clear-action"
                      onClick={() => setLogDateFilter("")}
                      aria-label="Clear date filter"
                      title="Clear date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {(logSearchQuery || logDateFilter) && (
                <div className="search-status-bar">
                  <span>
                    Showing <strong>{filteredLogs.length}</strong> of {data?.logs?.length ?? 0} entries
                    {logDateFilter && <> on <strong>{pretty(logDateFilter)}</strong></>}
                    {logSearchQuery && <> matching &ldquo;<strong>{logSearchQuery}</strong>&rdquo;</>}
                  </span>
                  <button
                    type="button"
                    className="reset-filters-btn"
                    onClick={() => {
                      setLogSearchQuery("");
                      setLogDateFilter("");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}

              {filteredLogs.map((l) => (
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

              {data && data.logs.length > 0 && filteredLogs.length === 0 && (
                <div className="empty-search-state">
                  <p>No previous logs match your search or date filter.</p>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => {
                      setLogSearchQuery("");
                      setLogDateFilter("");
                    }}
                  >
                    Clear search & date filter
                  </button>
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
