import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const imageSourceEnum = pgEnum("image_source", [
  "upload",
  "search_result",
  "ai_generated",
  "field_photo",
]);

export const imageLibraryCategories = pgTable("image_library_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const imageLibrary = pgTable("image_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  categoryId: uuid("category_id").references(() => imageLibraryCategories.id, {
    onDelete: "set null",
  }),

  // Image details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url").notNull(), // Complete Supabase public URL
  storageKey: text("storage_key").notNull(), // Supabase storage key
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),

  // Image metadata
  source: imageSourceEnum("source").notNull(),
  originalUrl: text("original_url"), // For search results/external sources
  retailer: varchar("retailer", { length: 50 }), // homedepot, lowes, etc.
  tags: varchar("tags").array().default([]), // Array of tags
  metadata: jsonb("metadata").default("{}"), // width, height, camera info, etc.

  // AI generation info (if applicable)
  aiPrompt: text("ai_prompt"),
  aiModel: varchar("ai_model", { length: 50 }),
  referenceImages: uuid("reference_images").array().default([]), // Reference to other library images

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types
export type InsertImageLibraryCategory =
  typeof imageLibraryCategories.$inferInsert;
export type SelectImageLibraryCategory =
  typeof imageLibraryCategories.$inferSelect;
export type InsertImageLibrary = typeof imageLibrary.$inferInsert;
export type SelectImageLibrary = typeof imageLibrary.$inferSelect;
