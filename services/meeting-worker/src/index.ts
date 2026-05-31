import express, { type NextFunction, type Request, type Response } from "express";
import cron from "node-cron";
import { config } from "./config.js";
import { warmEmbedder } from "./embedding.js";
import { ensureCollection } from "./qdrant.js";
import { processMeeting, sweep } from "./process.js";
import { ask } from "./ask.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

// --- auth ---
function requireSecret(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  if (header !== `Bearer ${config.sharedSecret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// --- health (no auth) ---
app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * Enqueue-style processing. The web app calls this fire-and-forget on meeting
 * stop. We ack immediately (202) and process in the background so the caller
 * never waits on the LLM.
 */
app.post("/process", requireSecret, (req, res) => {
  const meetingId = req.body?.meetingId;
  if (!meetingId || typeof meetingId !== "string") {
    return res.status(400).json({ error: "meetingId required" });
  }
  res.status(202).json({ accepted: true, meetingId });
  processMeeting(meetingId).catch((err) =>
    console.error("[/process] background error:", err)
  );
});

/** Manual sweep trigger (also runs on cron). */
app.post("/sweep", requireSecret, async (_req, res) => {
  try {
    const results = await sweep();
    res.json({ processed: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "sweep failed" });
  }
});

/** Synchronous RAG Q&A — the caller waits for the answer. */
app.post("/ask", requireSecret, async (req, res) => {
  const { question, projectId, meetingId, topK } = req.body ?? {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question required" });
  }
  try {
    const result = await ask({ question, projectId, meetingId, topK });
    res.json(result);
  } catch (err) {
    console.error("[/ask] error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "ask failed" });
  }
});

async function main() {
  console.log("[boot] ensuring Qdrant collection…");
  await ensureCollection();
  console.log("[boot] warming embedding model…");
  await warmEmbedder();

  if (config.sweep.enabled) {
    cron.schedule(config.sweep.cron, () => {
      sweep().catch((err) => console.error("[cron] sweep error:", err));
    });
    console.log(`[boot] cron sweep enabled (${config.sweep.cron})`);
  }

  app.listen(config.port, () => {
    console.log(`[boot] meeting-worker listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error("[boot] fatal:", err);
  process.exit(1);
});
