import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  sharedSecret: required("WORKER_SHARED_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  qdrant: {
    url: process.env.QDRANT_URL ?? "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY || undefined,
    collection: process.env.QDRANT_COLLECTION ?? "meeting_transcripts",
  },
  openrouter: {
    apiKey: required("OPENROUTER_API_KEY"),
    model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet",
  },
  sweep: {
    enabled: (process.env.SWEEP_ENABLED ?? "true") !== "false",
    cron: process.env.SWEEP_CRON ?? "*/5 * * * *",
  },
  // gte-small produces 384-dim vectors
  embeddingDim: 384,
  maxAttempts: 3,
};
