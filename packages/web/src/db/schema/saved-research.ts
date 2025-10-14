import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { projects } from "./projects";

export const savedResearch = pgTable("saved_research", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),

  // Research content
  query: text("query").notNull(),
  answer: text("answer").notNull(),
  sources: jsonb("sources").default("[]").notNull(), // Array of source objects
  relatedQueries: text("related_queries").array().default([]), // Array of related questions

  // User organization
  title: varchar("title", { length: 255 }), // User-defined title, defaults to query
  tags: varchar("tags").array().default([]), // User tags for organization
  notes: text("notes"), // User's personal notes

  // Privacy & Sharing
  isPrivate: boolean("is_private").default(false).notNull(), // If true, only visible to the creator

  // Metadata
  confidence: varchar("confidence", { length: 10 }).default("0.95"), // AI confidence score

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const savedResearchRelations = relations(savedResearch, ({ one }) => ({
  user: one(users, {
    fields: [savedResearch.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [savedResearch.projectId],
    references: [projects.id],
  }),
}));

// Type exports
export type InsertSavedResearch = typeof savedResearch.$inferInsert;
export type SelectSavedResearch = typeof savedResearch.$inferSelect;
