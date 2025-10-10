import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { documents } from "./documents";

export const documentComments = pgTable("document_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const documentCommentRelations = relations(
  documentComments,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentComments.documentId],
      references: [documents.id],
    }),
    user: one(users, {
      fields: [documentComments.userId],
      references: [users.id],
    }),
  })
);

// Type exports
export type InsertDocumentComment = typeof documentComments.$inferInsert;
export type SelectDocumentComment = typeof documentComments.$inferSelect;
