# Ask integration

Open /ask after running the FastAPI backend and `npm run dev`. Personalization
starts off. Questions are independent, not a multi-turn conversation.

The reusable components/ask.tsx component accepts an optional HealthData prop.
A host application can supply its current records without a second store or
an invented localStorage key. A default-off checkbox asks the user to opt in
before the component creates and sends the minimized summary. Only the question
is sent when personalization is off.

POST /api/ask accepts `{ question, personalize, health_context? }`, forwards the
request to `RAG_API_URL` (default `http://localhost:8000`) and returns
`{ answer, citations, personalized }`. The browser sends only the minimized
90-day context when opted in; the route whitelists its fields and rejects raw
records. The summary contains distinct-day symptom counts, period starts,
overlapping medications, and dated lab values with units and reference ranges.
It excludes identity, notes, appointments, and saved questions.

Set `RAG_API_KEY` on both the Next.js server and FastAPI service for
server-to-server authorization. The key is never exposed to browser code. The
FastAPI service itself does not currently validate Clerk sessions; do not expose
its port publicly without an authenticated proxy or JWT verification.

## Databricks integration boundary

The Python backend uses Databricks Vector Search and ChatDatabricks. See
`rag-backend.md` for its Databricks settings, startup instructions, and Clerk
authentication placeholders.

Before enabling a real provider, implement authenticated server identity and
repository authorization, a curated research index with source provenance,
validated model outputs, request limits, cancellation/timeouts, and the
application's consent and retention policy. Model prompts must treat user
records and retrieved passages as untrusted data. Use the minimized
HealthContext, not raw HealthData, for model requests.

Use server-managed workload identity/OAuth or a server-only secret store.
Never use NEXT_PUBLIC variables for credentials, accept credentials from the
browser, return provider configuration in an API response, or log health
payloads. Bind real adapters only in the server factory after authentication
is implemented. These are integration interfaces, not a claim of a live
Databricks connection.

Checks: `npm run typecheck`, `npm run lint`, `npm run test:ask`.
