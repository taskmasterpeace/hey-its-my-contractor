import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
  date,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, users } from "./users";

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),

  // Project details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  status: projectStatusEnum("status").default("planning"),

  // Homeowner information (from meeting requirements)
  homeownerName: varchar("homeowner_name", { length: 255 }),
  homeownerEmail: varchar("homeowner_email", { length: 255 }),
  homeownerPhone: varchar("homeowner_phone", { length: 50 }),

  // Project financials
  budget: decimal("budget", { precision: 12, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),

  // Timeline
  startDate: date("start_date"),
  estimatedEndDate: date("estimated_end_date"),
  actualEndDate: date("actual_end_date"),

  // Progress tracking
  progressPercentage: integer("progress_percentage").default(0),

  // Project metadata
  metadata: jsonb("metadata").default("{}"),
  settings: jsonb("settings").default("{}"),

  // Audit fields
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project relations
export const projectRelations = relations(projects, ({ one }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
}));

// Type exports
export type InsertProject = typeof projects.$inferInsert;
export type SelectProject = typeof projects.$inferSelect;
