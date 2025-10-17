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
import { users } from "./users";
import { projects } from "./projects";

export const docusealEventEnum = pgEnum("docuseal_event", [
  // DocuSeal webhook events
  "template.created",
  "template.updated",
  "form.viewed",
  "form.started",
  "form.completed",
  "form.declined",
  "submission.created",
  "submission.completed",
  // DocuSeal Builder callback events (immediate tracking)
  "document.uploaded",
  "template.saved",
  "document.sent",
  "template.changed",
  "template.loaded",
]);

export const docusealTracking = pgTable("docuseal_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),

  // DocuSeal IDs
  templateId: integer("template_id"),
  submissionId: integer("submission_id"),
  templateSlug: varchar("template_slug", { length: 100 }),
  submissionSlug: varchar("submission_slug", { length: 100 }),

  // Event tracking
  eventType: docusealEventEnum("event_type").notNull(),
  eventData: jsonb("event_data").default("{}"),

  // Document info
  documentName: varchar("document_name", { length: 255 }),
  signedDocumentUrl: text("signed_document_url"),
  auditLogUrl: text("audit_log_url"),

  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
