# Meeting Intelligence — Implementation Plan

**Scope of this plan:** in-person / local **web recording** (cross-browser), transcript
**processing** (chunk → embed → summarize), a **Qdrant** vector store, a **Fly.io** worker
that handles cron + processing, a **meeting history UI**, and **ask-questions-on-transcript**
(RAG Q&A).

**Out of scope for now:** remote meeting bots (Attendee.dev / Recall.ai), mobile (Expo) recording.

---

## 1. Target architecture

```
┌─ Vercel (Next.js web app) ──────────────┐      ┌─ Fly.io worker (one Docker image) ─────────┐
│ • Meeting UI + history + Q&A chat        │      │ Node service, model loaded once at startup  │
│ • AudioWorklet mic capture (cross-browser)│      │ • POST /process  chunk→embed→Qdrant + LLM   │
│ • AssemblyAI streaming token mint        │      │   summary/action-items → Postgres           │
│ • create / update / list / transcript    │─job─▶│ • POST /ask      embed Q → Qdrant search →   │
│ • /api/meetings/ask  → proxies to worker │◀ans──│   LLM answer with citations                 │
└──────────────┬───────────────────────────┘      │ • cron (Fly scheduled): sweep unprocessed   │
        mic    │                                   └───────────┬─────────────────────────────────┘
               ▼                                                │ upsert / search
        AssemblyAI v3 streaming (wss)                           ▼
                                                         Qdrant (separate Fly app, official image)

   Postgres (existing Supabase): meetings + transcripts metadata, summary, action items
   Audio files: existing Supabase Storage bucket (unchanged for now)
   LLM: OpenRouter (already wired via @openrouter/ai-sdk-provider)
   Embeddings: @xenova/transformers `Supabase/gte-small` (384-dim, runs in the worker)
```

**Why the worker owns embeddings + Q&A:** the local embedding model is heavy to load and a poor
fit for Vercel serverless cold starts. Loading it once in a long-lived Fly container keeps it warm
and gives us a single embedding code path for both indexing and querying. Vercel's `/api/meetings/ask`
is a thin proxy to the worker's `/ask`.

**"One Docker":** our **worker** is one image (cron + `/process` + `/ask`). **Qdrant** runs as its own
Fly app from the official `qdrant/qdrant` image — we don't rebuild it into our image, we just run it
and point the worker at it over Fly's private network.

---

## 2. Data model changes

Current state: `transcripts` table stores **one row per chunk** with embeddings as **text** — there is
no real vector search, and summary/action-items are never written.

Target:

- **Qdrant** holds the vectors. Collection `meeting_transcripts`, size **384**, distance **cosine**.
  Payload per point: `{ meetingId, projectId, chunkIndex, text }`. (Stop padding to 512 — use the
  model's native 384 dims.)
- **Postgres `transcripts`** becomes **one row per meeting**: `meetingId`, full `text`, `segments`,
  `summary`, `actionItems`. Drop the `textEmbeddings` column (vectors now live in Qdrant).
- `meetings` table unchanged.

Migration: `db:generate` a Drizzle migration for the `transcripts` reshape; backfill is not needed
(no real prod data yet — confirm before dropping).

---

## 3. Phases

### Phase 0 — Infrastructure (Fly worker + Qdrant)

- [ ] New package/dir `services/meeting-worker` (Node + TS). Single `Dockerfile`.
- [ ] Worker boots an HTTP server (Fastify/Express) and **loads gte-small once** at startup.
- [ ] `fly.toml` for the worker; deploy. Add `OPENROUTER_API_KEY`, `DATABASE_URL`, `QDRANT_URL`,
      `QDRANT_API_KEY`, `WORKER_SHARED_SECRET` as Fly secrets.
- [ ] Deploy **Qdrant** as a second Fly app (official image + a volume for persistence).
- [ ] Create the `meeting_transcripts` collection on worker startup if missing.
- [ ] Replace the dead Vercel-cron assumption: a **Fly scheduled machine** (cron) calls the worker's
      sweep, AND the web app enqueues a job on meeting-stop (belt + suspenders).

### Phase 1 — Cross-browser local recording

- [ ] Replace deprecated `ScriptProcessorNode` in `useRecorder.ts` with an **AudioWorklet**.
- [ ] Resample from the real `AudioContext` sample rate (44.1k/48k) **down to 16k** inside the
      worklet — do **not** rely on `new AudioContext({ sampleRate: 16000 })` (Safari ignores it).
- [ ] Handle Safari/iOS: require a user gesture, `audioContext.resume()`, and verify
      `getUserMedia` constraints degrade gracefully.
- [ ] Confirm `meeting-recording-service` mime fallback already covers Safari (mp4/aac) vs Chrome
      (webm/opus) — it does; add a test.
- [ ] Manual cross-browser test matrix: Chrome, Edge, Safari (macOS + iOS), Firefox.

### Phase 2 — Transcript processing (the intelligence)

- [ ] Worker `POST /process` (auth via `WORKER_SHARED_SECRET`): given a `meetingId`, - load transcript text from Postgres, - chunk (reuse `RecursiveCharacterTextSplitter`, 1000/50), - embed each chunk (gte-small, 384), **upsert to Qdrant** with payload, - call **OpenRouter** to produce a `summary` + `actionItems[]`, - write summary/action-items (and full text) into the `transcripts` row, mark meeting `completed`.
- [ ] Web app: on `stopRecording()`, after the final update, **enqueue** the process job
      (call worker `/process`, fire-and-forget with retry).
- [ ] Fly cron sweep: find `completed`-transcript meetings with no `transcripts` row and process them
      (covers any missed enqueue).
- [ ] _(Optional, later)_ run AssemblyAI **async API on the stored audio** for real diarized,
      speaker-labeled `segments` (replaces the hardcoded demo speakers in the UI).

### Phase 3 — Meeting history UI

- [ ] A polished **history list** page: all meetings for a project — date, title, type, status,
      duration, participant avatars, tags; with search + status/type filters. (Reuse / clean up
      existing `MeetingsList` / `MeetingCard`.)
- [ ] **Detail view**: audio player (real recording URL), transcript, summary, and action-items
      panel fed by **real** processed data (not demo data).
- [ ] Empty/loading/processing states ("transcript is being processed…").

### Phase 4 — Ask-questions-on-transcript (RAG Q&A)

- [ ] Worker `POST /ask`: `{ projectId, meetingId?, question }` →
      embed the question → Qdrant **search top-k** (filtered by `projectId`, optionally `meetingId`)
      → feed retrieved chunks to **OpenRouter** → return an **answer with citations**
      (which meeting + chunk each fact came from).
- [ ] Vercel `POST /api/meetings/ask` — thin authenticated proxy to the worker.
- [ ] UI: an **"Ask about your meetings"** chat box — scoped to one meeting (detail view) or across
      all project meetings (history page). Show citations as clickable links back to the transcript.

---

## 4. Environment / secrets to add

| Key                             | Where               | Notes                                                 |
| ------------------------------- | ------------------- | ----------------------------------------------------- |
| `ASSEMBLYAI_API_KEY`            | Vercel              | already used for streaming token; confirm set in prod |
| `OPENROUTER_API_KEY`            | Fly worker          | summary, action items, Q&A answers                    |
| `QDRANT_URL` / `QDRANT_API_KEY` | Fly worker          | private Fly network address of the Qdrant app         |
| `WORKER_URL`                    | Vercel              | worker base URL for enqueue + `/ask` proxy            |
| `WORKER_SHARED_SECRET`          | Vercel + Fly worker | auth between web app and worker                       |
| `DATABASE_URL`                  | Fly worker          | worker reads/writes Postgres directly                 |

---

## 5. Open questions to revisit

- Audio stays in **Supabase Storage** for now (unchanged). Revisit MinIO/R2 only if we drop Supabase.
- Diarized speaker segments (Phase 2 optional) — do we want them in v1 or ship single-stream text first?
- Embedding model: stay on local **gte-small (384)** vs a hosted embedding API — staying local for now
  (self-host bias, no per-call cost).

---

## 6. Build status

**Done (backend + infra):**

- `services/meeting-worker/` — standalone Node service (own deps, single Dockerfile).
  - `POST /process` (async, 202 ack + background), `POST /ask` (sync RAG), `POST /sweep`, `GET /health`.
  - Modules: `embedding` (gte-small, loaded once), `qdrant` (ensureCollection + idempotent
    upsert/delete + filtered search), `llm` (OpenRouter summary/action-items + cited answer),
    `retry` (exp backoff, 3 attempts), `process` (full pipeline + status tracking), `ask` (RAG).
  - `node-cron` sweep backstop; `docker-compose.yml` (worker + Qdrant) for local dev; `fly.toml`.
- **DB**: added `transcript_status` enum + `processing_attempts` to `meetings`; dropped
  `text_embeddings` from `transcripts`. Migration `0003_real_lady_bullseye.sql` generated
  (⚠️ **not yet applied** — run `db:migrate` against the DB when ready).
- **Web wiring**: `lib/services/meeting-worker-client.ts` (server-only), enqueue on
  `meetings/update` when status→completed, `POST /api/meetings/ask` proxy. Removed the dead
  `api/meetings/process-meeting` route (worker replaces it). Added `WORKER_URL` /
  `WORKER_SHARED_SECRET` to `.env.example`.

**Retry + delivery design (implemented):**

- Source of truth for "needs processing" is the DB `transcript_status` field, not the enqueue call.
- In-run retries (embed/Qdrant/LLM) via `withRetry`; cross-run retries via the cron sweep
  (`pending`/`failed` with `attempts < 3`). Idempotent re-processing (delete vectors + transcript row first).
- Result delivery: the meetings page **polls** the transcript every 4s while a meeting is
  `pending`/`processing` and updates in place when it lands (stops at `done`, 2-min cap). Chosen over
  Supabase Realtime because realtime isn't guaranteed to be enabled on the `transcripts` table.

**Done (frontend + recording):**

- Migration **applied** to Supabase (`db:migrate`).
- **Phase 1 — cross-browser recording**: replaced the deprecated `ScriptProcessorNode` +
  forced-16k AudioContext with an **AudioWorklet** (`public/pcm16-worklet.js`) that resamples the
  browser's native rate down to 16k Int16 PCM. Works in Chrome, Edge, Firefox, Safari 14.1+
  (with `audioContext.resume()` for the iOS/Safari gesture requirement).
- **Phase 3 — meeting UI**: rebuilt the meetings page on the app theme (shadcn `Button`/`Card`/`Badge`)
  with a page header + **Record a new meeting** button, a **history list**, a **detail** view, and a
  **wavesurfer.js** audio player. Mock/demo rendering removed.
- **Phase 4 UI**: `MeetingAsk` "Ask about your meetings" box (this-meeting / all-meetings scope) wired
  to `/api/meetings/ask`.

**Remaining (deferred — agreed for later):**

- [ ] **(2) Speaker diarization** — real recordings store plain transcript text with no per-speaker
  segments. Would come from running AssemblyAI's async API on the stored audio post-meeting.
- [ ] **(3) Completion notification** — worker inserts a `notifications` row on `done` and wire the
  existing `NotificationSystem` toast, for users who navigated away from the page.
- [ ] **(4) Deploy to Fly.io** — currently local Docker only. Deploy the worker + a separate Qdrant
  Fly app; set prod secrets (`WORKER_URL`/`WORKER_SHARED_SECRET` on Vercel, etc.).
- [ ] **(5) Stop/upload UX** — the recorder shows a single "Saving & uploading…" spinner while the
  audio file uploads to Supabase + the meeting is saved (the worker hand-off is fire-and-forget, so
  this is not waiting on processing). For large recordings we may want a clearer message or actual
  upload progress. Fine as-is for now.
- [x] **Config:** Supabase `recordings` bucket is **public** — audio playback confirmed working.
