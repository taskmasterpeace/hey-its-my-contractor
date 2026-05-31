import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { config } from "./config.js";
import { embed } from "./embedding.js";
import { deleteMeetingPoints, upsertChunks } from "./qdrant.js";
import { summarizeTranscript } from "./llm.js";

const { meetings, transcripts } = schema;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 50,
});

async function chunkText(text: string): Promise<string[]> {
  const docs = await splitter.createDocuments([text]);
  return docs
    .map((d) => d.pageContent.trim())
    .filter((c) => c.length > 0);
}

export interface ProcessResult {
  meetingId: string;
  status: "done" | "skipped" | "failed";
  chunks?: number;
  reason?: string;
}

/**
 * Full pipeline for one meeting: chunk -> embed -> Qdrant -> LLM summary -> DB.
 * Idempotent: re-running deletes prior vectors and the prior transcript row first.
 */
export async function processMeeting(meetingId: string): Promise<ProcessResult> {
  const [meeting] = await db
    .select({
      id: meetings.id,
      projectId: meetings.projectId,
      transcript: meetings.transcript,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) {
    return { meetingId, status: "failed", reason: "meeting not found" };
  }

  const transcriptText = (meeting.transcript ?? "").trim();
  if (!transcriptText) {
    await db
      .update(meetings)
      .set({ transcriptStatus: "done" })
      .where(eq(meetings.id, meetingId));
    return { meetingId, status: "skipped", reason: "empty transcript" };
  }

  // Mark as processing.
  await db
    .update(meetings)
    .set({ transcriptStatus: "processing" })
    .where(eq(meetings.id, meetingId));

  try {
    const chunks = await chunkText(transcriptText);
    if (chunks.length === 0) {
      await db
        .update(meetings)
        .set({ transcriptStatus: "done" })
        .where(eq(meetings.id, meetingId));
      return { meetingId, status: "skipped", reason: "no chunks" };
    }

    // Embed every chunk.
    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embed(chunks[i]);
      points.push({
        vector,
        payload: {
          meetingId,
          projectId: meeting.projectId,
          chunkIndex: i,
          text: chunks[i],
        },
      });
    }

    // Idempotent vector write.
    await deleteMeetingPoints(meetingId);
    await upsertChunks(points);

    // Summary + action items.
    const { summary, actionItems } = await summarizeTranscript(transcriptText);

    // Idempotent transcript row: one row per meeting.
    await db.delete(transcripts).where(eq(transcripts.meetingId, meetingId));
    await db.insert(transcripts).values({
      meetingId,
      provider: "assemblyai",
      language: "en",
      text: transcriptText,
      summary,
      actionItems,
    });

    await db
      .update(meetings)
      .set({ transcriptStatus: "done", status: "completed" })
      .where(eq(meetings.id, meetingId));

    return { meetingId, status: "done", chunks: chunks.length };
  } catch (err) {
    await db
      .update(meetings)
      .set({
        transcriptStatus: "failed",
        processingAttempts: sql`${meetings.processingAttempts} + 1`,
      })
      .where(eq(meetings.id, meetingId));
    console.error(`[process] meeting ${meetingId} failed:`, err);
    return {
      meetingId,
      status: "failed",
      reason: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Cron backstop: find meetings that still need processing and run them.
 * Picks up anything whose enqueue never landed or that failed mid-run,
 * up to maxAttempts.
 */
export async function sweep(): Promise<ProcessResult[]> {
  const candidates = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(
      and(
        sql`${meetings.transcript} IS NOT NULL AND length(trim(${meetings.transcript})) > 0`,
        or(
          eq(meetings.transcriptStatus, "pending"),
          eq(meetings.transcriptStatus, "failed")
        ),
        lt(meetings.processingAttempts, config.maxAttempts)
      )
    )
    .limit(20);

  if (candidates.length === 0) return [];
  console.log(`[sweep] processing ${candidates.length} meeting(s)`);

  const results: ProcessResult[] = [];
  for (const c of candidates) {
    results.push(await processMeeting(c.id));
  }
  return results;
}
