# RAG Backend Setup

`rag_api.py` exposes `POST /ask` and `GET /healthz`. The service retrieves PCOS
research from Databricks Vector Search and generates an answer with
`ChatDatabricks`. The API returns an answer, source citations, and whether a
health summary was included.

## Privacy behavior

Personalization is off by default. The backend checks `personalize: true` before
reading supplied health records or opening the sample file. With consent, raw
records are reduced to the same identity-free 90-day summary used by the app:
logged days, symptom-day counts, period starts, overlapping medication names,
and dated lab values. It excludes names, identifiers, notes, appointments,
doses, and saved questions. Requests may instead include an already-minimized
`health_context` for the Next.js server route; raw records and a minimized
context cannot be sent together.

The repository's `public/sample-health-data.json` is only available when both
`personalize: true` and `use_sample_data: true` are explicitly set. Do not use
that demo option in production. The question alone is sent to Vector Search;
the model receives the question, minimized summary (if opted in), and retrieved
passages in separate labeled sections. The backend does not log request bodies.

## Install and run

Use Python 3.9 or newer from the repository root (3.10+ is recommended for
active upstream support):

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-rag.txt
uvicorn rag_api:app --host 127.0.0.1 --port 8000
```

Keep the service bound to localhost behind the Next.js API route. In local
development, `RAG_API_KEY` may be unset. Set it to a long random secret before
connecting the Next.js server; when `RAG_ENV=production`, the API rejects
requests unless this key is configured. The Next.js route should send it in an
`Authorization: Bearer ...` header. Never expose it to browser code.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABRICKS_HOST` | Yes | Workspace URL, for example `https://<workspace>.cloud.databricks.com`. |
| `DATABRICKS_TOKEN` | Yes | Server-only Databricks credential. Prefer workload identity/OAuth or a secret manager over a personal access token. |
| `DATABRICKS_VECTOR_SEARCH_ENDPOINT` | Yes | Existing Vector Search endpoint name. |
| `DATABRICKS_VECTOR_INDEX` | Yes | Fully qualified Unity Catalog Vector Search index name. |
| `DATABRICKS_SERVING_ENDPOINT` | No | Model Serving endpoint for `ChatDatabricks`; defaults to `databricks-meta-llama-3-3-70b-instruct`. |
| `RAG_API_KEY` | Required outside local development | Shared server-to-server bearer secret for the Next.js route and this API. |
| `RAG_ENV` | No | Set to `production` to require `RAG_API_KEY`; defaults to `development`. |
| `RAG_SAMPLE_DATA_PATH` | No | Override path for the local sample health JSON file. |
| `RAG_API_URL` | Next.js route | Base URL for the FastAPI service, such as `http://127.0.0.1:8000`. |

Put secrets in an untracked local environment file or deployment secret store.
Do not prefix backend credentials with `NEXT_PUBLIC_`.

## Clerk authentication placeholder

The FastAPI service currently uses only the optional `RAG_API_KEY`; it does not
validate Clerk sessions or JWTs. Configure the app's Clerk integration with
server-side `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` values,
then have the Next.js `/api/ask` route verify the signed-in user before
forwarding requests. The frontend may use a Clerk JWKS URL such as
`CLERK_JWKS_URL=https://<clerk-domain>/.well-known/jwks.json` when implementing
backend JWT verification. These are setup placeholders, not active
authentication in this Python service. Do not expose the FastAPI port publicly
until an authenticated proxy or JWT verification is in place.

## Request shape

```json
{
  "question": "What patterns should I discuss with my clinician?",
  "personalize": false
}
```

For opted-in requests, send either `health_data` (raw journal data, projected
by this backend) or `health_context` (the minimized context created by the
Next.js server), and set `personalize` to `true`. For a local sample-only test,
set both `personalize` and `use_sample_data` to `true`. The response shape is
`{ "answer": "...", "citations": [...], "personalized": false }`.