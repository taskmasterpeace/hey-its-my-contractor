// Minimal Drizzle schema mirroring the web app's tables that the worker touches.
// Kept in sync with packages/web/src/db/schema/meetings.ts.
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

// Processing lifecycle for the transcript (separate from the meeting lifecycle).
export const transcriptStatusEnum = pgEnum("transcript_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  userId: uuid("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  transcript: text("transcript"),
  status: meetingStatusEnum("status").default("scheduled"),
  transcriptStatus: transcriptStatusEnum("transcript_status").default("pending"),
  processingAttempts: integer("processing_attempts").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").notNull(),
  provider: varchar("provider", { length: 50 }).default("assemblyai"),
  language: varchar("language", { length: 10 }).default("en"),
  text: text("text"),
  segments: jsonb("segments").default("[]"),
  summary: text("summary"),
  actionItems: text("action_items").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
