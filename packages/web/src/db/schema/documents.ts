import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  jsonb,
  bigint,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const documentTypeEnum = pgEnum("document_type", [
  "plan",
  "permit",
  "contract",
  "invoice",
  "photo",
  "other",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: documentTypeEnum("type").notNull(),
  version: integer("version").default(1),
  storageKey: text("storage_key").notNull(), // Key in Supabase Storage
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  annotations: jsonb("annotations").default("[]"),
  linkedTo: jsonb("linked_to"), // {meeting_id, task_id, change_order_id}
  expirationDate: date("expiration_date"), // For permits
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
