import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const projectSearchSites = pgTable("project_search_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Site details
  siteDomain: varchar("site_domain", { length: 255 }).notNull(), // e.g., "amazon.com", "pinterest.com"
  displayName: varchar("display_name", { length: 255 }).notNull(), // e.g., "Amazon", "Pinterest"
  description: text("description"), // Optional description

  // Audit fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type InsertProjectSearchSite = typeof projectSearchSites.$inferInsert;
export type SelectProjectSearchSite = typeof projectSearchSites.$inferSelect;
