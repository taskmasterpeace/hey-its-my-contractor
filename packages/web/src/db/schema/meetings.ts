import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const meetingTypeEnum = pgEnum("meeting_type", [
  "consultation",
  "progress_review",
  "change_order",
  "walkthrough",
  "inspection",
]);

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  type: meetingTypeEnum("type").notNull(),
  participants: uuid("participants").array().default([]), // Array of user IDs
  tags: text("tags").array().default([]), // Array of tags (optional)
  externalProvider: varchar("external_provider", { length: 20 }), // zoom, meet, jitsi
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  consentGiven: boolean("consent_given").default(false),
  status: meetingStatusEnum("status").default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .references(() => meetings.id, { onDelete: "cascade" })
    .notNull(),
  provider: varchar("provider", { length: 50 }).default("assemblyai"),
  language: varchar("language", { length: 10 }).default("en"),
  text: text("text"),
  segments: jsonb("segments").default("[]"), // Array of transcript segments with timestamps
  summary: text("summary"),
  actionItems: text("action_items").array(),
  textEmbeddings: text("text_embeddings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledMessageStatusEnum = pgEnum("scheduled_message_status", ["idle", "scheduled", "sent", "failed",  "cancelled"]);

export const scheduledMessages = pgTable('scheduled_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  mobileNo: varchar('mobile_no', { length: 20 }).notNull(),
  task: text('task'),
  message: text('message'),
  dateAndTime: timestamp('date_and_time', {
    withTimezone: true,
    mode: 'string'
  }).notNull(),
  metadata: jsonb('metadata').default('{}').notNull(),
  status: scheduledMessageStatusEnum('status').default('idle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});