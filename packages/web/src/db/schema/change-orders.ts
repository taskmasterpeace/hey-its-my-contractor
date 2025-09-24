import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { meetings } from "./meetings";

export const changeOrderStatusEnum = pgEnum("change_order_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
  "implemented",
]);

export const changeOrders = pgTable("change_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: changeOrderStatusEnum("status").default("draft"),
  pdfKey: text("pdf_key"), // Storage key for generated PDF
  linkedMeetingId: uuid("linked_meeting_id").references(() => meetings.id),
  approvedByClient: uuid("approved_by_client").references(() => users.id),
  approvedByContractor: uuid("approved_by_contractor").references(
    () => users.id
  ),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
