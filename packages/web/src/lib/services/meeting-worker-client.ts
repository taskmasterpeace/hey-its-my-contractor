// Server-only client for the meeting-worker service (Fly.io / local Docker).
// The shared secret must never reach the browser — only call these from API
// routes / server actions.
import "server-only";

const WORKER_URL = process.env.WORKER_URL;
const WORKER_SHARED_SECRET = process.env.WORKER_SHARED_SECRET;

function workerConfigured(): boolean {
  if (!WORKER_URL || !WORKER_SHARED_SECRET) {
    console.warn(
      "[meeting-worker] WORKER_URL / WORKER_SHARED_SECRET not set — skipping worker call (cron sweep will pick it up)"
    );
    return false;
  }
  return true;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${WORKER_SHARED_SECRET}`,
  };
}

/**
 * Fire-and-forget enqueue of transcript processing. The worker acks 202 fast
 * and processes in the background; failures here are non-fatal because the
 * worker's cron sweep is the backstop. Times out quickly so it never blocks
 * the response.
 */
export async function enqueueProcess(meetingId: string): Promise<void> {
  if (!workerConfigured()) return;
  try {
    const res = await fetch(`${WORKER_URL}/process`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ meetingId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[meeting-worker] /process returned ${res.status} for ${meetingId}`);
    }
  } catch (err) {
    console.error("[meeting-worker] enqueueProcess failed (cron will retry):", err);
  }
}

export interface AskCitation {
  meetingId: string;
  chunkIndex: number;
  text: string;
}
export interface AskResponse {
  answer: string;
  citations: AskCitation[];
}

/** Synchronous RAG Q&A — proxied to the worker's /ask. */
export async function askWorker(params: {
  question: string;
  projectId?: string;
  meetingId?: string;
  topK?: number;
}): Promise<AskResponse> {
  if (!WORKER_URL || !WORKER_SHARED_SECRET) {
    throw new Error("Meeting worker not configured (WORKER_URL / WORKER_SHARED_SECRET)");
  }
  const res = await fetch(`${WORKER_URL}/ask`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Worker /ask failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as AskResponse;
}
