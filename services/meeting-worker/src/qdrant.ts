import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { withRetry } from "./retry.js";

export const qdrant = new QdrantClient({
  url: config.qdrant.url,
  apiKey: config.qdrant.apiKey,
});

const COLLECTION = config.qdrant.collection;

export interface ChunkPoint {
  meetingId: string;
  projectId: string;
  chunkIndex: number;
  text: string;
}

export interface SearchHit {
  score: number;
  meetingId: string;
  chunkIndex: number;
  text: string;
}

/** Create the collection if it doesn't exist. Called once at startup. */
export async function ensureCollection(): Promise<void> {
  const existing = await qdrant.getCollections();
  const found = existing.collections.some((c) => c.name === COLLECTION);
  if (found) return;

  await qdrant.createCollection(COLLECTION, {
    vectors: { size: config.embeddingDim, distance: "Cosine" },
  });
  // Payload indexes so we can filter searches by meeting/project efficiently.
  await qdrant.createPayloadIndex(COLLECTION, {
    field_name: "meetingId",
    field_schema: "keyword",
  });
  await qdrant.createPayloadIndex(COLLECTION, {
    field_name: "projectId",
    field_schema: "keyword",
  });
  console.log(`[qdrant] created collection "${COLLECTION}"`);
}

/** Delete all points for a meeting — makes re-processing idempotent. */
export async function deleteMeetingPoints(meetingId: string): Promise<void> {
  await withRetry(
    () =>
      qdrant.delete(COLLECTION, {
        filter: { must: [{ key: "meetingId", match: { value: meetingId } }] },
        wait: true,
      }),
    { label: "qdrant.delete" }
  );
}

/** Upsert chunk vectors for a meeting. */
export async function upsertChunks(
  points: Array<{ vector: number[]; payload: ChunkPoint }>
): Promise<void> {
  if (points.length === 0) return;
  await withRetry(
    () =>
      qdrant.upsert(COLLECTION, {
        wait: true,
        points: points.map((p) => ({
          id: randomUUID(),
          vector: p.vector,
          payload: { ...p.payload },
        })),
      }),
    { label: "qdrant.upsert" }
  );
}

/** Vector search, optionally scoped to a project and/or a single meeting. */
export async function search(
  vector: number[],
  opts: { projectId?: string; meetingId?: string; topK?: number }
): Promise<SearchHit[]> {
  const must: Array<Record<string, unknown>> = [];
  if (opts.projectId) must.push({ key: "projectId", match: { value: opts.projectId } });
  if (opts.meetingId) must.push({ key: "meetingId", match: { value: opts.meetingId } });

  const res = await withRetry(
    () =>
      qdrant.search(COLLECTION, {
        vector,
        limit: opts.topK ?? 6,
        filter: must.length ? { must } : undefined,
        with_payload: true,
      }),
    { label: "qdrant.search" }
  );

  return res.map((hit) => {
    const payload = (hit.payload ?? {}) as Partial<ChunkPoint>;
    return {
      score: hit.score,
      meetingId: payload.meetingId ?? "",
      chunkIndex: payload.chunkIndex ?? 0,
      text: payload.text ?? "",
    };
  });
}
