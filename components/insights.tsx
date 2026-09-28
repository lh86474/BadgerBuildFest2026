'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { addDays, dateKey, daysBetween, duration, pretty } from '../lib/health';
import type { HealthData } from '../lib/health';
import { summarize } from '../lib/insights';
import { getInitialOrStoredHealthData, saveHealthDataLocally } from '../lib/health-storage';
import HealthTimeline from './timeline';
import './insights.css';
import { ScrollReveal, MagneticButton, TracingDivider } from './motion';
import { PhenotypeSummaryCard } from './quiz/phenotype-summary-card';
import { useStoredQuizResult } from '../lib/quiz-storage';

export default function Insights({ data: propData, end }: {data:HealthData; end:string}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUserId = isSignedIn && user ? user.id : "local-user";
  const quizResult = useStoredQuizResult(currentUserId);

  const [data, setData] = useState<HealthData>(propData);

  useEffect(() => {
    if (!isLoaded) return;

    // Load from this user's isolated storage
    const stored = getInitialOrStoredHealthData(currentUserId);
    setData(stored);

    // If signed in, query Databricks for this user's cloud records
    if (isSignedIn) {
      fetch('/api/user-data')
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
  const [days,setDays]=useState(90);
  const start=addDays(end,1-days);
  const report=summarize(data,start,end);
  const sleepStart = start > addDays(end, -41) ? start : addDays(end, -41);
  const sleepReport = summarize(data, sleepStart, end);
  const [excluded,setExcluded]=useState<string[]>([]);
  const questions=[...new Set([...data.questions,'What additional details would be useful to record before our next visit?'])];
  const selectedQuestions=questions.filter(q=>!excluded.includes(q));
  return (
    <div className="insights-app">
      <ScrollReveal yOffset={24}>
        <section className="page-hero" aria-labelledby="insights-hero-title">
          <div className="hero-content">
            <h1 id="insights-hero-title">A clearer view of your history.</h1>
            <p className="hero-subtitle">Your cycles, symptoms, and daily rhythms, in context.</p>
            <div className="hero-actions">
              <MagneticButton magneticStrength={0.25} innerStrength={0.12}>
                <a className="button button-primary" href="#visit">
                  <span>Prepare for a visit</span>
                </a>
              </MagneticButton>
              <div className="range-selector-pill">
                <span>Time range:</span>
                <select
                  aria-label="Time range"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 180 days</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <TracingDivider variant="pulse" color="#66A3BF" className="insights-divider" />

      <div style={{ maxWidth: 1100, margin: '0 auto 24px', padding: '0 20px' }}>
        <PhenotypeSummaryCard
          quizResult={quizResult}
          userId={currentUserId}
          userName={user?.firstName}
        />
      </div>

      <div className="range-bar">
        <div>
          <strong>
            {pretty(start)} – {pretty(end)}, {end.slice(0, 4)}
          </strong>
          <p>
            {report.logs.length} of {report.totalDays} days have entries. Unlogged days are not counted as symptom-free.
          </p>
        </div>
      </div>

      <div id="history">
        <HealthTimeline data={data} start={start} end={end} />
      </div>

      <TracingDivider variant="pulse" color="#66A3BF" className="insights-divider" />

      <div className="insights-two-col">
        <section id="patterns" className="patterns-section card-surface">
          <div className="section-heading">
            <div>
              <h2>What your entries show</h2>
              <p>Descriptive observations from your records, not medical conclusions.</p>
            </div>
          </div>
          <div className="observations">
            {report.insights.map((text, i) => (
              <p key={text}>
                <span aria-hidden="true">{i === 0 ? "◯" : i === 1 ? "∩" : "—"}</span>
                {text}
              </p>
            ))}
          </div>
        </section>

        <section className="cycle-section card-surface" aria-labelledby="cycles-title">
          <div className="section-heading">
            <div>
              <h2 id="cycles-title">Cycle history</h2>
              <p>Days between recorded period starts. No predicted dates.</p>
            </div>
          </div>
          <div>
            {report.cycles.length ? (
              [...report.cycles].reverse().map((c) => {
                const currentCycleDay = Math.max(1, daysBetween(c.start, end || dateKey()) + 1);
                return (
                  <div className="cycle-row" key={c.start}>
                    <span>
                      {pretty(c.start)}
                      <small>{c.next ? `to ${pretty(c.next)}` : `Cycle is on day ${currentCycleDay}`}</small>
                    </span>
                    <div className="cycle-track" aria-hidden="true">
                      <span
                        className={c.length === null ? "incomplete" : ""}
                        style={{
                          width: `${((c.length ?? 0) / Math.max(60, ...report.cycles.map((x) => x.length ?? 0))) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{c.length === null ? "Incomplete" : `${c.length} days`}</strong>
                  </div>
                );
              })
            ) : (
              <p>No period starts recorded by the end of this range.</p>
            )}
            <p className="chart-note">Includes cycles overlapping this range. An incomplete cycle has no calculated length.</p>
          </div>
        </section>
      </div>

      <TracingDivider variant="pulse" color="#66A3BF" className="insights-divider" />

      <div className="trend-columns">
        <section className="card-surface">
          <h2>Symptom frequency</h2>
          <p>Top 5 symptoms by days selected, out of {report.logs.length} logged days.</p>
          {report.frequency.length ? (
            report.frequency.slice(0, 5).map(([name, count]) => (
              <div className="frequency-row" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>
                    {count} / {report.logs.length}
                  </strong>
                </div>
                <div className="frequency-track" aria-hidden="true">
                  <span style={{ width: `${(count / report.logs.length) * 100}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="empty-note">No symptoms selected in this range.</p>
          )}
        </section>

        <section className="card-surface">
          <h2>Sleep & energy</h2>
          <p>Weekly averages · {pretty(sleepStart)}–{pretty(end)} · up to six weeks. Gaps mean no entries.</p>
          <div className="average-line">
            <span>
              <strong>{duration(sleepReport.sleep.value === null ? null : Math.round(sleepReport.sleep.value))}</strong> average sleep · {sleepReport.sleep.count} entries
            </span>
            <span>
              <strong>{sleepReport.energy.value?.toFixed(1) ?? "—"} / 5</strong> average energy · {sleepReport.energy.count} entries
            </span>
          </div>
          <div className="weekly-chart">
            <div className="weekly-header">
              <span>Week of</span>
              <span>Sleep · 0–24 h</span>
              <span>Energy · 1–5</span>
            </div>
            {sleepReport.weeks.map((w) => (
              <div className="weekly-row" key={w.start}>
                <span>{pretty(w.start)}</span>
                {(["sleep", "energy"] as const).map((key) => (
                  <div key={key} className={`weekly-value ${key}`}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: `${w[key].value === null ? 0 : (w[key].value! / (key === "sleep" ? 1440 : 5)) * 100}%`,
                      }}
                    />
                    <b title={`${w[key].count} entries`}>
                      {w[key].value === null
                        ? "—"
                        : `${(w[key].value! / (key === "sleep" ? 60 : 1)).toFixed(1)}${key === "sleep" ? " h" : ""}`}
                    </b>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="card-surface weight-insight-card">
          <h2>Weight patterns</h2>
          <p>Longitudinal entries and fluctuations across this {days}-day period.</p>
          {report.weight && report.weight.count > 0 ? (
            <div>
              <div className="average-line">
                <span>
                  <strong>{report.weight.average} lbs</strong> average · {report.weight.count} entries
                </span>
                <span>
                  <strong>{report.weight.min} – {report.weight.max} lbs</strong> recorded range
                </span>
                {report.weight.netChange !== null && (
                  <span>
                    <strong>{report.weight.netChange > 0 ? "+" : ""}{report.weight.netChange} lbs</strong> net change
                  </span>
                )}
              </div>
              <p className="chart-note">
                Normal hormonal shifts commonly cause cyclical water retention across follicular and luteal phases.
              </p>
            </div>
          ) : (
            <p className="empty-note">No weight entries recorded in this range.</p>
          )}
        </section>
      </div>

      <TracingDivider variant="pulse" color="#66A3BF" className="insights-divider" />

      <div className="insights-two-col">
        <section className="symptom-trends card-surface">
          <h2>Symptom trends</h2>
          <p>
            Compare the earlier and later halves of this range. Counts use logged days, so different logging coverage can affect the comparison.
          </p>
          {report.symptomTrends.length ? (
            <div className="table-scroll">
              <table>
                <caption>
                  Earlier: {pretty(start)}–{pretty(addDays(report.midpoint, -1))}. Later: {pretty(report.midpoint)}–{pretty(end)}.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Symptom</th>
                    <th scope="col">Earlier · {report.earlierDays} logged days</th>
                    <th scope="col">Later · {report.recentDays} logged days</th>
                  </tr>
                </thead>
                <tbody>
                  {report.symptomTrends.map((t) => (
                    <tr key={t.name}>
                      <th scope="row">{t.name}</th>
                      <td>
                        {report.earlierDays
                          ? `${t.earlier} / ${report.earlierDays} (${Math.round((t.earlier / report.earlierDays) * 100)}%)`
                          : "No entries"}
                      </td>
                      <td>
                        {report.recentDays
                          ? `${t.recent} / ${report.recentDays} (${Math.round((t.recent / report.recentDays) * 100)}%)`
                          : "No entries"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-note">No symptom entries to compare.</p>
          )}
        </section>

        <section className="medication-section card-surface">
          <h2>Medication context</h2>
          <p>These are connections you recorded yourself. Timing does not show that a medication caused a symptom.</p>
          {report.medications.length ? (
            report.medications.map((m) => {
              const linked = report.medicationSymptoms.get(m.id) ?? [];
              return (
                <article className="medication-row" key={m.id}>
                  <div>
                    <h3>{m.name}</h3>
                    <p>
                      {m.dosage} {m.unit} · {m.frequency}
                    </p>
                  </div>
                  <div>
                    <p>
                      Started {pretty(m.startedAt)}
                      {m.endedAt ? ` · Ended ${pretty(m.endedAt)}` : " · No end recorded"}
                    </p>
                    <p>{report.logs.filter((l) => l.sideEffects[m.id]?.trim()).length} days with side-effect notes in this range</p>
                    {linked.length > 0 ? (
                      <p>
                        <strong>Symptoms you linked:</strong>{" "}
                        {linked.map(([symptom, count]) => `${symptom} (${count} ${count === 1 ? "day" : "days"})`).join(", ")}
                      </p>
                    ) : (
                      <p>No symptoms linked to this medication in this range.</p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p>No medication periods overlap this range.</p>
          )}
          {report.events.length > 0 && (
            <ul className="event-list">
              {report.events.map((e) => (
                <li key={e.date + e.text}>
                  <strong>{pretty(e.date)}</strong> {e.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <TracingDivider variant="pulse" color="#66A3BF" className="insights-divider" />

      <section id="visit" className="visit-section">
        <div className="section-heading">
          <div>
            <h2>Your next visit, prepared.</h2>
            <p>Review the summary and choose the questions you want to bring.</p>
          </div>
          <button className="primary" onClick={() => window.print()}>
            Print summary
          </button>
        </div>
        <div className="visit-layout">
          <article className="visit-summary">
            <h3>Visit summary</h3>
            <p>
              Recorded history · {start} to {end}
            </p>
            <p>
              {report.logs.length} of {report.totalDays} days logged. Missing entries are unknown.
            </p>
            <dl>
              <dt>Cycles</dt>
              <dd>
                {report.cycles
                  .filter((c) => c.length !== null)
                  .map((c) => `${c.length} days (${pretty(c.start)})`)
                  .join("; ") || "No completed cycles recorded."}{" "}
                {report.cycles.some((c) => c.length === null) ? "Latest recorded cycle is incomplete." : ""}
              </dd>
              <dt>Most selected symptoms</dt>
              <dd>
                {report.frequency.slice(0, 4).map(([s, n]) => `${s}: ${n}/${report.logs.length} logged days`).join("; ") ||
                  "None selected."}
              </dd>
              <dt>Symptom trends</dt>
              <dd>
                {report.symptomTrends
                  .slice(0, 4)
                  .map(
                    (t) =>
                      `${t.name}: ${t.earlier}/${report.earlierDays} earlier logged days; ${t.recent}/${report.recentDays} later logged days`,
                  )
                  .join("; ") || "No symptom entries to compare."}{" "}
                Earlier: {start} to {addDays(report.midpoint, -1)}. Later: {report.midpoint} to {end}. A zero denominator means no entries.
              </dd>
              <dt>Sleep & energy</dt>
              <dd>
                {duration(report.sleep.value === null ? null : Math.round(report.sleep.value))} average sleep ({report.sleep.count} entries);
                energy {report.energy.value?.toFixed(1) ?? "not recorded"} / 5 ({report.energy.count} entries).
              </dd>
              <dt>Weight patterns</dt>
              <dd>
                {report.weight && report.weight.count > 0
                  ? `${report.weight.count} entries logged · Average: ${report.weight.average} lbs (Range: ${report.weight.min}–${report.weight.max} lbs)${report.weight.netChange !== null ? ` · Net change: ${report.weight.netChange > 0 ? "+" : ""}${report.weight.netChange} lbs` : ""}.`
                  : "No weight entries recorded in this period."}
              </dd>
              <dt>Medications & reported side effects</dt>
              <dd>
                {report.medications.length
                  ? report.medications.map((m) => {
                      const linked = report.medicationSymptoms.get(m.id) ?? [];
                      return (
                        <p key={m.id}>
                          {m.name}, {m.dosage} {m.unit}, {m.frequency}. Started {m.startedAt}
                          {m.endedAt ? `, ended ${m.endedAt}` : ""}. Symptoms linked by you:{" "}
                          {linked.map(([symptom, count]) => `${symptom} (${count} ${count === 1 ? "day" : "days"})`).join(", ") ||
                            "none in this range"}
                          . Side-effect notes:{" "}
                          {report.logs
                            .filter((l) => l.sideEffects[m.id]?.trim())
                            .map((l) => `${pretty(l.date)}: ${l.sideEffects[m.id]}`)
                            .join("; ") || "none in this range"}
                          .
                        </p>
                      );
                    })
                  : "No medication periods recorded."}
              </dd>
            </dl>
            <div className="print-questions">
              <h3>Questions for my clinician</h3>
              {selectedQuestions.length ? (
                <ul>
                  {selectedQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p>No questions selected.</p>
              )}
            </div>
            <p className="chart-note">
              Descriptive summary of recorded data. No diagnosis, treatment recommendation, or causal conclusion is inferred.
            </p>
          </article>
          <div className="question-selector">
            <h3>Questions for your clinician</h3>
            <p>Selected questions appear in your printout.</p>
            {questions.map((q) => (
              <label key={q}>
                <input
                  type="checkbox"
                  checked={!excluded.includes(q)}
                  onChange={() =>
                    setExcluded((v) =>
                      v.includes(q) ? v.filter((x) => x !== q) : [...v, q],
                    )
                  }
                />
                <span>{q}</span>
              </label>
            ))}
            <p className="chart-note">
              Selections last for this visit to the page. Printing opens your browser’s print dialog; you choose whether to save or share it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
