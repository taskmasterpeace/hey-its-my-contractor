import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { meetings } from "./meetings";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  assignees: uuid("assignees").array().default([]), // Array of user IDs
  sourceMeetingId: uuid("source_meeting_id").references(() => meetings.id),
  ackContractor: boolean("ack_contractor").default(false),
  ackClient: boolean("ack_client").default(false),
  status: taskStatusEnum("status").default("pending"),
  priority: taskPriorityEnum("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
