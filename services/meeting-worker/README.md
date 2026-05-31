# meeting-worker

Long-lived Node service that does the heavy meeting-intelligence work off the
Vercel web app. See `docs/MEETING-INTELLIGENCE-PLAN.md` for the full design.

## What it does

- `POST /process` `{ meetingId }` — chunk transcript → embed (gte-small, 384-dim)
  → upsert vectors to Qdrant → LLM summary + action items (OpenRouter) → write to
  Postgres. Acks `202` immediately and runs in the background. Idempotent.
- `POST /ask` `{ question, projectId?, meetingId?, topK? }` — RAG Q&A. Embeds the
  question, searches Qdrant, answers with citations. Synchronous.
- `POST /sweep` — process any `pending`/`failed` meetings (also runs on cron).
- `GET /health` — liveness (no auth).

All routes except `/health` require `Authorization: Bearer $WORKER_SHARED_SECRET`.

## Local dev

```bash
cp .env.example .env        # fill in DATABASE_URL + OPENROUTER_API_KEY
docker compose up --build   # starts qdrant + worker
# worker on http://localhost:8080, qdrant on http://localhost:6333
```

Then in the web app set:

```
WORKER_URL=http://localhost:8080
WORKER_SHARED_SECRET=dev-secret
```

Run without Docker (needs a reachable Qdrant + Postgres):

```bash
npm install
npm run dev
```

## Deploy (Fly)

Qdrant is a separate Fly app. See `fly.toml` header for the secret list, then
`fly deploy`.
