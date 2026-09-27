"use client";

import { useState } from "react";
import { PhysicsInteractive } from "./motion";
import "./quick-checkin.css";

const SYMPTOMS = [
  { id: "fatigue", label: "Fatigue / Low Energy" },
  { id: "irregular-cycle", label: "Irregular Cycles" },
  { id: "acne", label: "Acne / Skin Issues" },
  { id: "pain", label: "Pain" },
  { id: "mood", label: "Mood Changes" },
  { id: "hair", label: "Hair Changes" },
];

type QuickInsightResponse = {
  insight: string;
  questions: string;
};

export function QuickCheckIn() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QuickInsightResponse | null>(null);
  const [error, setError] = useState("");

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
    // Clear previous response when selection changes
    setResponse(null);
    setError("");
  };

  const handleGetInsight = async () => {
    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/quick-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });

      if (!res.ok) {
        throw new Error("Failed to get insights");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Unable to get insights. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quick-checkin-section" aria-labelledby="quick-checkin-title">
      <div className="quick-checkin-header">
        <div>
          <h2 id="quick-checkin-title">Quick Daily Check-In</h2>
          <p className="quick-checkin-subtitle">
            Select what you're experiencing today for personalized insights.
          </p>
        </div>
      </div>

      <div className="quick-checkin-content">
        <div className="symptom-grid">
          {SYMPTOMS.map((symptom) => (
            <PhysicsInteractive key={symptom.id} scaleOnTap={0.98}>
              <button
                className={`symptom-checkbox ${
                  selectedSymptoms.includes(symptom.id) ? "is-checked" : ""
                }`}
                onClick={() => handleSymptomToggle(symptom.id)}
                aria-pressed={selectedSymptoms.includes(symptom.id)}
              >
                <div className="checkbox-box">
                  {selectedSymptoms.includes(symptom.id) && (
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>
                <span className="checkbox-label">{symptom.label}</span>
              </button>
            </PhysicsInteractive>
          ))}
        </div>

        <div className="quick-checkin-actions">
          <PhysicsInteractive scaleOnTap={0.96}>
            <button
              className="button button-primary get-insight-button"
              onClick={handleGetInsight}
              disabled={loading || selectedSymptoms.length === 0}
            >
              {loading ? (
                <>
                  <span className="loading-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>Getting insights...</span>
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  <span>Get Quick Insight</span>
                </>
              )}
            </button>
          </PhysicsInteractive>
        </div>

        {error && (
          <div className="quick-checkin-error" role="alert">
            {error}
          </div>
        )}

        {response && (
          <div className="response-cards">
            <div className="response-card insight-card">
              <div className="response-card-header">
                <svg
                  className="response-card-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <h3 className="response-card-title">What This Might Mean</h3>
              </div>
              <div className="response-card-content">
                {response.insight.split("\n\n").map((paragraph, idx) => {
                  if (paragraph.includes("• ")) {
                    const lines = paragraph.split("\n").filter(Boolean);
                    const intro = lines.find((l) => !l.startsWith("• "));
                    const items = lines.filter((l) => l.startsWith("• "));
                    return (
                      <div key={idx}>
                        {intro && <p>{intro}</p>}
                        <ul className="response-bullet-list">
                          {items.map((item, itemIdx) => (
                            <li key={itemIdx}>{item.replace(/^•\s*/, "")}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            </div>

            <div className="response-card questions-card">
              <div className="response-card-header">
                <svg
                  className="response-card-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="response-card-title">Questions for Your Doctor</h3>
              </div>
              <div className="response-card-content">
                {response.questions.split("\n").filter(Boolean).map((question, idx) => (
                  <div key={idx} className="doctor-question-item">
                    <span className="question-bullet">→</span>
                    <p>{question.replace(/^[•\-]\s*/, "")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
