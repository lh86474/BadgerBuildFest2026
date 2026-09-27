"use client";
import { useEffect, useState } from "react";
import { validateMedication, validateLab } from "../lib/tracking-validation";
import { MedicationInsights } from "./medication-insights";
import {
  HealthData,
  Log,
  Medication,
  Lab,
  dateKey,
  symptomGroups,
  validateLog,
  pretty,
  cycleHistory,
} from "../lib/health";
type Props = {
  data: HealthData;
  save: (data: HealthData) => boolean;
  onDirty?: (dirty: boolean) => void;
  onSave?: () => void;
};
export function DailyLogForm({
  data,
  save,
  onDirty,
  onSave,
  date: initial = dateKey(),
}: Props & { date?: string }) {
  const [date, setDate] = useState(initial);
  const existing = (d: string) =>
    data.logs.find((l) => l.date === d) || {
      id: d,
      userId: data.user.id,
      date: d,
      symptoms: [],
      doses: {},
      sideEffects: {},
    };
  const [log, setLog] = useState<Log>(() => existing(initial));
  const [status, setStatus] = useState("");
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (window.location.hash === "#cycle-bleeding") {
      const section = document.getElementById("cycle-bleeding");
      section?.scrollIntoView({ block: "start" });
      section?.focus({ preventScroll: true });
    }
  }, []);
  const field = <K extends keyof Log>(key: K, value: Log[K]) => {
    setLog({ ...log, [key]: value });
    setStatus("");
    onDirty?.(true);
    setChanged(true);
  };
  const toggleSymptom = (symptom: string) => {
    const removing = log.symptoms.includes(symptom);
    const medicationSymptoms = removing
      ? Object.fromEntries(
          Object.entries(log.medicationSymptoms ?? {}).map(
            ([medicationId, linked]) => [
              medicationId,
              linked.filter((item) => item !== symptom),
            ],
          ),
        )
      : log.medicationSymptoms;
    setLog({
      ...log,
      symptoms: removing
        ? log.symptoms.filter((item) => item !== symptom)
        : [...log.symptoms, symptom],
      medicationSymptoms,
      painScores: removing
        ? Object.fromEntries(Object.entries(log.painScores ?? {}).filter(([key]) => key !== symptom))
        : log.painScores,
    });
    setStatus("");
    onDirty?.(true);
    setChanged(true);
  };
  const linkMedicationSymptom = (medicationId: string, symptom: string) => {
    if (!symptom) return;
    const linked = log.medicationSymptoms?.[medicationId] ?? [];
    if (linked.includes(symptom)) return;
    field("medicationSymptoms", {
      ...log.medicationSymptoms,
      [medicationId]: [...linked, symptom],
    });
  };
  const unlinkMedicationSymptom = (medicationId: string, symptom: string) =>
    field("medicationSymptoms", {
      ...log.medicationSymptoms,
      [medicationId]: (log.medicationSymptoms?.[medicationId] ?? []).filter(
        (item) => item !== symptom,
      ),
    });
  return (
    <form
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        const error = validateLog(log);
        if (error) {
          setStatus(error);
          return;
        }
        if (
          save({
            ...data,
            logs: [...data.logs.filter((l) => l.date !== log.date), log],
          })
        ) {
          setChanged(false);
          onDirty?.(false);
          setStatus("Your entry is saved. You can edit it anytime.");
          onSave?.();
        } else
          setStatus(
            "Could not save. Your entry is still here. Please try again.",
          );
      }}
    >
      <div className="section-head">
        <div>
          <h2>A little check-in</h2>
          <p>Only record what feels useful. Every field is optional.</p>
        </div>
        <label>
          Date
          <input
            name="date"
            type="date"
            required
            max={dateKey()}
            value={date}
            onChange={(e) => {
              if (changed) {
                setNextDate(e.target.value);
                return;
              }
              setDate(e.target.value);
              setLog(existing(e.target.value));
              setStatus("");
              onDirty?.(false);
            }}
          />
        </label>
      </div>
      {nextDate !== null && (
        <div className="unsaved" role="alert">
          <p>Changing the date will discard this unsaved entry.</p>
          <div className="actions">
            <button type="button" onClick={() => setNextDate(null)}>
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                setDate(nextDate);
                setLog(existing(nextDate));
                setNextDate(null);
                setChanged(false);
                onDirty?.(false);
                setStatus("");
              }}
            >
              Discard and change date
            </button>
          </div>
        </div>
      )}
      <fieldset>
        <legend>How are you feeling?</legend>
        <p className="field-hint">Choose any that feel relevant today.</p>
        <div className="form-grid symptom-categories">
          {symptomGroups.filter((group) => group.label !== "Pain & body").map((group) => (
            <div key={group.label}>
              <label>
                {group.label}
                <select name={group.label} value="" onChange={(e) => { if (e.target.value) toggleSymptom(e.target.value); }}>
                  <option value="">Choose a symptom…</option>
                  {group.symptoms.map((symptom) => (
                    <option key={symptom} value={symptom} disabled={log.symptoms.includes(symptom)}>
                      {symptom}{log.symptoms.includes(symptom) ? " — selected" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {group.symptoms.some((symptom) => log.symptoms.includes(symptom)) && (
                <div className="selected-symptoms" aria-label={`Selected ${group.label.toLowerCase()} symptoms`}>
                  {group.symptoms.filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
                    <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} aria-label={`Remove ${symptom}`}>
                      {symptom} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Pain</legend>
        <p className="field-hint" id="pain-scale-help">
          Rate each selected symptom separately, from 0 to 10.
        </p>
        <div className="form-grid symptom-categories">
          {symptomGroups.filter((group) => group.label === "Pain & body").map((group) => (
            <div key={group.label}>
              <label>
                {group.label}
                <select name={group.label} value="" onChange={(e) => { if (e.target.value) toggleSymptom(e.target.value); }}>
                  <option value="">Choose a symptom…</option>
                  {group.symptoms.map((symptom) => (
                    <option key={symptom} value={symptom} disabled={log.symptoms.includes(symptom)}>
                      {symptom}{log.symptoms.includes(symptom) ? " — selected" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {group.symptoms.some((symptom) => log.symptoms.includes(symptom)) && (
                <div className="selected-symptoms" aria-label={`Selected ${group.label.toLowerCase()} symptoms`}>
                  {group.symptoms.filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
                    <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} aria-label={`Remove ${symptom}`}>
                      {symptom} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <label>
            Pain location or note
            <input name="painNote" maxLength={2000} value={log.painNote || ""} onChange={(e) => field("painNote", e.target.value)} />
          </label>
        </div>
        {symptomGroups.filter((group) => group.label === "Pain & body").flatMap((group) => group.symptoms)
          .filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
            <div className="pain-symptom-rating" key={symptom}>
              <h3>{symptom}</h3>
              <div className="chips pain-scale" role="group" aria-label={`${symptom} impact, 0 to 10`} aria-describedby="pain-scale-help">
                {Array.from({ length: 11 }, (_, n) => (
                  <div className="pain-scale-option" key={n}>
                  <button type="button"
                    aria-label={`${symptom}: ${n}${n === 0 ? " — No Impact" : n === 5 ? " — Moderate Impact" : n === 10 ? " — Incapacitating" : ""}`}
                    aria-pressed={log.painScores?.[symptom] === n}
                    onClick={() => {
                      const scores = { ...log.painScores };
                      if (scores[symptom] === n) delete scores[symptom];
                      else scores[symptom] = n;
                      field("painScores", scores);
                    }}>
                    {n}
                  </button>
                  {(n === 0 || n === 5 || n === 10) && (
                    <span className="pain-scale-caption" aria-hidden="true">
                      {n === 0 ? "No Impact" : n === 5 ? "Moderate Impact" : "Incapacitating"}
                    </span>
                  )}
                  </div>
                ))}
              </div>
              <p className="field-hint" role="status">
                {log.painScores?.[symptom] === undefined ? "Not recorded" : `Selected: ${log.painScores[symptom]}/10. Select again to clear.`}
              </p>
            </div>
          ))}
        {!symptomGroups.some((group) => group.label === "Pain & body" && group.symptoms.some((symptom) => log.symptoms.includes(symptom))) && (
          <p className="field-hint">Choose a pain symptom above to record its impact.</p>
        )}
        {log.pain !== undefined && (
          <p className="field-hint">Previously recorded overall pain: {log.pain}/10.</p>
        )}
      </fieldset>
      <fieldset id="cycle-bleeding" tabIndex={-1}>
        <legend>Cycle & bleeding</legend>
        <div className="chips">
          {["None", "Spotting", "Light", "Medium", "Heavy"].map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={log.bleeding === s}
              onClick={() =>
                field("bleeding", log.bleeding === s ? undefined : s)
              }
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-fields">
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!log.periodStart}
              onChange={(e) => field("periodStart", e.target.checked)}
            />
            Period started
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!log.periodEnd}
              onChange={(e) => field("periodEnd", e.target.checked)}
            />
            Period ended
          </label>
        </div>
      </fieldset>
      <details>
        <summary>
          More about your day <span>Energy, mood & sleep</span>
        </summary>
        <div className="form-grid">
          {(["energy", "mood"] as const).map((key) => (
            <label key={key}>
              {key === "energy" ? "Energy" : "Mood"}
              <select
                value={log[key] ?? ""}
                onChange={(e) =>
                  field(
                    key,
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              >
                <option value="">Not recorded</option>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <option value={n} key={n}>
                    {n}{n === 1 ? " — very low" : n === 5 ? " — very high" : ""}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Sleep hours
            <input
              type="number"
              min="0"
              max="24"
              step="1"
              value={
                log.sleepMinutes === undefined
                  ? ""
                  : Math.floor(log.sleepMinutes / 60)
              }
              onChange={(e) =>
                field(
                  "sleepMinutes",
                  e.target.value === ""
                    ? (log.sleepMinutes || 0) % 60 || undefined
                    : Number(e.target.value) * 60 +
                        ((log.sleepMinutes || 0) % 60),
                )
              }
            />
          </label>
          <label>
            Sleep minutes
            <input
              type="number"
              min="0"
              max="59"
              value={
                log.sleepMinutes === undefined ? "" : log.sleepMinutes % 60
              }
              onChange={(e) =>
                field(
                  "sleepMinutes",
                  e.target.value === ""
                    ? Math.floor((log.sleepMinutes || 0) / 60) * 60 || undefined
                    : Math.floor((log.sleepMinutes || 0) / 60) * 60 +
                        Number(e.target.value),
                )
              }
            />
          </label>
          <label>
            Sleep quality
            <select
              value={log.sleepQuality || ""}
              onChange={(e) => field("sleepQuality", e.target.value)}
            >
              <option value="">Not recorded</option>
              {["Restless", "Okay", "Restful"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </details>
      <fieldset>
        <legend>Medications</legend>
        {data.medications
          .filter(
            (m) =>
              (m.startedAt <= date && (!m.endedAt || m.endedAt >= date)) ||
              !!log.doses[m.id] ||
              !!log.sideEffects[m.id],
          )
          .map((m) => (
            <div className="med-log" key={m.id}>
              <div>
                <strong>{m.name}</strong>
                <small>
                  {m.dosage} {m.unit} · {m.frequency}
                </small>
              </div>
              <label>
                Dose
                <select
                  value={log.doses[m.id] || ""}
                  onChange={(e) =>
                    field("doses", { ...log.doses, [m.id]: e.target.value })
                  }
                >
                  <option value="">Not recorded</option>
                  <option>Taken</option>
                  <option>Missed</option>
                </select>
              </label>
              <div className="med-observations">
                <label>
                  Symptoms noticed after taking it
                  <select
                    name={`medicationSymptom-${m.id}`}
                    value=""
                    disabled={!log.symptoms.length}
                    aria-describedby={`medication-symptom-help-${m.id}`}
                    onChange={(event) => {
                      linkMedicationSymptom(m.id, event.target.value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">
                      {log.symptoms.length
                        ? "Link one of today's symptoms…"
                        : "Select a symptom above first"}
                    </option>
                    {log.symptoms.map((symptom) => (
                      <option
                        key={symptom}
                        value={symptom}
                        disabled={(log.medicationSymptoms?.[m.id] ?? []).includes(
                          symptom,
                        )}
                      >
                        {symptom}
                        {(log.medicationSymptoms?.[m.id] ?? []).includes(symptom)
                          ? " — linked"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {(log.medicationSymptoms?.[m.id] ?? []).length > 0 && (
                  <div
                    className="medication-symptom-links"
                    aria-label={`Symptoms linked to ${m.name}`}
                  >
                    {(log.medicationSymptoms?.[m.id] ?? []).map((symptom) => (
                      <button
                        type="button"
                        key={symptom}
                        onClick={() => unlinkMedicationSymptom(m.id, symptom)}
                        aria-label={`Remove ${symptom} from ${m.name}`}
                      >
                        {symptom} <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
                <small id={`medication-symptom-help-${m.id}`}>
                  This records a possible connection you noticed. Timing alone
                  does not show that a medication caused a symptom.
                </small>
                <label>
                  Other side-effect note
                  <input
                    name={`sideEffect-${m.id}`}
                    maxLength={2000}
                    placeholder="For example, began about an hour later…"
                    value={log.sideEffects[m.id] || ""}
                    onChange={(e) =>
                      field("sideEffects", {
                        ...log.sideEffects,
                        [m.id]: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        {!data.medications.some(
          (m) =>
            (m.startedAt <= date && (!m.endedAt || m.endedAt >= date)) ||
            !!log.doses[m.id] ||
            !!log.sideEffects[m.id],
        ) && (
          <p>
            No medications for this date. Add a medication in the Medications
            tab to log doses here.
          </p>
        )}
        {data.medications.length > 0 && (
          <MedicationInsights
            medicationName={data.medications.map(m => m.name).join(", ")}
            notes=""
            sideEffects=""
          />
        )}
      </fieldset>
      <label>
        Meals
        <textarea
          maxLength={2000}
          rows={2}
          placeholder="Anything you’d like to remember?"
          value={log.meals || ""}
          onChange={(e) => field("meals", e.target.value)}
        />
      </label>
      <label>
        Notes
        <textarea
          maxLength={2000}
          rows={3}
          placeholder="A little context for your future self…"
          value={log.notes || ""}
          onChange={(e) => field("notes", e.target.value)}
        />
      </label>
      <div className="save-bar">
        <button className="primary" type="submit">
          {data.logs.some((l) => l.date === date)
            ? "Save changes"
            : "Save entry"}
        </button>
        <span role="status">{status}</span>
      </div>
    </form>
  );
}
export function Medications({ data, save, onDirty }: Props) {
  const [edit, setEdit] = useState<Medication | null>(null);
  const [status, setStatus] = useState("");
  return (
    <>
      <div className="section-head">
        <h2>Your medications</h2>
        <button
          disabled={!!edit}
          className="primary"
          onClick={() => {
            setStatus("");
            setEdit({
              id: crypto.randomUUID(),
              userId: data.user.id,
              name: "",
              dosage: "",
              unit: "mg",
              frequency: "Once daily",
              startedAt: dateKey(),
              active: true,
              notes: "",
            });
          }}
        >
          Add medication
        </button>
      </div>
      {edit && (
        <form
          autoComplete="off"
          onChange={() => onDirty?.(true)}
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateMedication(edit);
            if (error) {
              setStatus(error);
              return;
            }
            if (
              save({
                ...data,
                medications: [
                  ...data.medications.filter((m) => m.id !== edit.id),
                  edit,
                ],
              })
            ) {
              setEdit(null);
              setStatus("Medication saved.");
              onDirty?.(false);
            } else
              setStatus(
                "Could not save. Your changes are still here. Please try again.",
              );
          }}
        >
          <div className="form-grid">
            {(
              [
                "name",
                "dosage",
                "unit",
                "frequency",
                "startedAt",
                "endedAt",
                "notes",
              ] as const
            ).map((k) => (
              <label key={k}>
                {
                  {
                    name: "Medication name",
                    dosage: "Dosage",
                    unit: "Unit",
                    frequency: "Frequency",
                    startedAt: "Start date",
                    endedAt: "End date (optional)",
                    notes: "Personal notes",
                  }[k]
                }
                <input
                  name={k}
                  required={[
                    "name",
                    "dosage",
                    "unit",
                    "frequency",
                    "startedAt",
                  ].includes(k)}
                  maxLength={2000}
                  max={k.endsWith("At") ? dateKey() : undefined}
                  type={
                    k.endsWith("At")
                      ? "date"
                      : k === "dosage"
                        ? "number"
                        : "text"
                  }
                  min={k === "dosage" ? "0.000001" : undefined}
                  step={k === "dosage" ? "any" : undefined}
                  value={edit[k] || ""}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={edit.active}
              onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
            />
            Currently active
          </label>
          <div className="actions">
            <button className="primary">Save medication</button>
            <button
              type="button"
              onClick={() => {
                setEdit(null);
                onDirty?.(false);
                setStatus("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{status}</p>
      {data.medications.map((m) => (
        <article className="record" key={m.id}>
          <div>
            <h3>
              {m.name}{" "}
              <span className="badge">{m.active ? "Active" : "Inactive"}</span>
            </h3>
            <p>
              {m.dosage} {m.unit} · {m.frequency}
            </p>
            <small>
              Started {pretty(m.startedAt)}
              {m.endedAt ? ` · Ended ${pretty(m.endedAt)}` : ""}
            </small>
            <p>{m.notes}</p>
          </div>
          <button
            disabled={!!edit}
            aria-label={`Edit ${m.name}`}
            onClick={() => {
              setStatus("");
              setEdit({ ...m });
            }}
          >
            Edit
          </button>
        </article>
      ))}
      {!data.medications.length && (
        <p>
          No medications recorded. Add one to keep doses and side effects
          together.
        </p>
      )}
    </>
  );
}
export function Labs({ data, save, onDirty }: Props) {
  const [edit, setEdit] = useState<Lab | null>(null);
  const [status, setStatus] = useState("");
  const fields = [
    ["name", "Test name"],
    ["value", "Value"],
    ["unit", "Unit"],
    ["date", "Test date"],
    ["low", "Reference low (optional)"],
    ["high", "Reference high (optional)"],
    ["source", "Laboratory (optional)"],
    ["notes", "Notes (optional)"],
  ] as const;
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Lab results</h2>
          <p>Keep the values and units from your laboratory report.</p>
        </div>
        <button
          disabled={!!edit}
          className="primary"
          onClick={() => {
            setStatus("");
            setEdit({
              id: crypto.randomUUID(),
              userId: data.user.id,
              name: "",
              value: "",
              unit: "",
              date: dateKey(),
              low: "",
              high: "",
              source: "",
              notes: "",
            });
          }}
        >
          Add result
        </button>
      </div>
      {edit && (
        <form
          autoComplete="off"
          onChange={() => onDirty?.(true)}
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateLab(edit);
            if (error) {
              setStatus(error);
              return;
            }
            if (
              save({
                ...data,
                labs: [...data.labs.filter((l) => l.id !== edit.id), edit],
              })
            ) {
              setEdit(null);
              onDirty?.(false);
              setStatus("Lab result saved.");
            } else
              setStatus(
                "Could not save. Your result is still here. Please try again.",
              );
          }}
        >
          <div className="form-grid">
            {fields.map(([k, label]) => (
              <label key={k}>
                {label}
                <input
                  name={k}
                  maxLength={2000}
                  required={["name", "value", "unit", "date"].includes(k)}
                  type={
                    k === "date"
                      ? "date"
                      : ["low", "high", "value"].includes(k)
                        ? "number"
                        : "text"
                  }
                  step="any"
                  max={k === "date" ? dateKey() : undefined}
                  value={edit[k]}
                  onChange={(e) => {
                    setEdit({ ...edit, [k]: e.target.value });
                    setStatus("");
                  }}
                />
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="primary">Save result</button>
            <button
              type="button"
              onClick={() => {
                setEdit(null);
                setStatus("");
                onDirty?.(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{status}</p>
      {[...data.labs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((l) => (
          <article className="record" key={l.id}>
            <div>
              <small>
                {pretty(l.date)}, {l.date.slice(0, 4)} ·{" "}
                {l.source || "Manually entered"}
              </small>
              <h3>{l.name}</h3>
              <strong>
                {l.value} {l.unit}
              </strong>
              <small>
                {l.low !== "" || l.high !== ""
                  ? `Lab reference: ${l.low !== "" ? l.low : "not provided"} – ${l.high !== "" ? l.high : "not provided"} ${l.unit}`
                  : "Reference range not provided"}
              </small>
              <p>{l.notes}</p>
            </div>
            <button
              disabled={!!edit}
              aria-label={`Edit ${l.name} result from ${l.date}`}
              onClick={() => {
                setEdit({ ...l });
                setStatus("");
              }}
            >
              Edit result
            </button>
          </article>
        ))}
      {!data.labs.length && (
        <p className="empty-state">
          No lab results yet. Add a result from your laboratory report.
        </p>
      )}
      <p className="muted">
        Reference ranges vary by laboratory and clinical context. Your clinician
        can help interpret results.
      </p>
    </>
  );
}
export function Cycles({
  data,
  onEdit,
}: Props & { onEdit?: (date: string) => void }) {
  const cycles = cycleHistory(data.logs);
  return (
    <>
      <div className="section-head">
        <h2>Your cycle history</h2>
        {onEdit && (
          <button className="primary" onClick={() => onEdit(dateKey())}>
            Record bleeding
          </button>
        )}
      </div>
      <p>Based on the period starts and ends you recorded.</p>
      {[...cycles].reverse().map((c) => (
        <div className="record" key={c.start}>
          <div>
            <h3>{pretty(c.start)}</h3>
            <p>
              {c.end
                ? `Period ended ${pretty(c.end)}`
                : "No period end recorded"}
            </p>
          </div>
          <strong>
            {c.length
              ? `${c.length} days between starts`
              : "No next start recorded"}
          </strong>
          {onEdit && (
            <button
              onClick={() => onEdit(c.start)}
              aria-label={`Edit cycle starting ${c.start}`}
            >
              Edit start
            </button>
          )}
          {onEdit && c.end && (
            <button onClick={() => onEdit(c.end!)}>Edit end</button>
          )}
        </div>
      ))}
      {!cycles.length && (
        <p>
          Record a period start in your daily check-in to begin your cycle
          history.
        </p>
      )}
    </>
  );
}
