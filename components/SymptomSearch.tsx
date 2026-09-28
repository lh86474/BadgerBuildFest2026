'use client';

import { useState, type FormEvent } from 'react';
import type { SymptomSearchResult } from '../app/api/search/route';
import './symptom-search.css';

interface SymptomSearchProps {
  onSelectSymptom?: (symptom: string) => void;
  title?: string;
  subtitle?: string;
  defaultQuery?: string;
}

const POPULAR_PMOS_SYMPTOMS = [
  'Irregular or missed periods',
  'Insulin resistance & sugar cravings',
  'Facial hair growth (hirsutism)',
  'Cystic acne along jawline',
  'Midday fatigue & energy crashes',
  'Difficulty losing abdominal weight',
];

export function SymptomSearch({
  onSelectSymptom,
  title = 'PMOS Symptom & Literature Search',
  subtitle = 'Search symptoms and clinical evidence powered by Databricks Vector Search and Lakehouse index.',
  defaultQuery = '',
}: SymptomSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SymptomSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<{
    source?: string;
    index?: string;
    isLive?: boolean;
    notice?: string;
  }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function performSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, limit: 6 }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSourceInfo({
          source: data.source,
          index: data.index,
          isLive: data.source === 'databricks-vector-search' || data.source === 'databricks-app',
          notice: data.notice,
        });
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching symptom search:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    performSearch(query);
  }

  function handleChipClick(symptom: string) {
    setQuery(symptom);
    performSearch(symptom);
  }

  function handleCopy(result: SymptomSearchResult) {
    const text = `Symptom: ${result.symptom}\nContext: ${result.disease || 'PMOS'}\nClinical details: ${result.description}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(result.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <section className="symptom-search-container" aria-labelledby="symptom-search-heading">
      <div className="symptom-search-header">
        <h2 id="symptom-search-heading" className="symptom-search-title">
          {title}
        </h2>
        <p className="symptom-search-subtitle">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="symptom-search-form" role="search">
        <div className="symptom-search-input-wrapper">
          <input
            type="search"
            className="symptom-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symptoms, e.g. irregular cycles, fatigue, hirsutism..."
            aria-label="Search PMOS symptoms and clinical evidence"
          />
          {query && (
            <button
              type="button"
              className="symptom-search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="symptom-search-btn"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div>
        <div className="symptom-chips-label">Common topics to explore:</div>
        <div className="symptom-chips-list">
          {POPULAR_PMOS_SYMPTOMS.map((sym) => (
            <button
              key={sym}
              type="button"
              className="symptom-chip"
              onClick={() => handleChipClick(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {hasSearched && (
        <div className="symptom-search-status-bar">
          <div className="status-indicator">
            <span className={`status-dot ${sourceInfo.isLive ? '' : 'local'}`} />
            <span>
              {sourceInfo.isLive
                ? `Connected to Databricks Vector Search (${sourceInfo.index || 'Unity Catalog'})`
                : sourceInfo.notice || 'Curated Clinical Knowledge Base'}
            </span>
          </div>
          <span>{results.length} {results.length === 1 ? 'match' : 'matches'}</span>
        </div>
      )}

      {loading && (
        <div className="symptom-search-loading" aria-live="polite">
          <div className="spinner" />
          <p>Querying Databricks Vector Search index...</p>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="symptom-search-loading">
          <p>No matching clinical entries found. Try terms like &quot;cycle&quot;, &quot;insulin&quot;, or &quot;acne&quot;.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="symptom-results-grid" aria-live="polite">
          {results.map((item) => (
            <article key={item.id} className="symptom-result-card">
              <div className="result-card-header">
                {item.category && <span className="result-category-badge">{item.category}</span>}
                <h3 className="result-symptom-title">{item.symptom}</h3>
                {item.disease && <span className="result-disease-subtext">{item.disease}</span>}
              </div>

              <p className="result-description">{item.description}</p>

              <div className="result-card-footer">
                <button
                  type="button"
                  className="action-link"
                  onClick={() => handleCopy(item)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copiedId === item.id ? 'Copied to notes' : 'Copy details'}
                </button>

                {onSelectSymptom && (
                  <button
                    type="button"
                    className="action-link"
                    onClick={() => onSelectSymptom(item.symptom)}
                  >
                    Ask AI about this symptom →
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SymptomSearch;
