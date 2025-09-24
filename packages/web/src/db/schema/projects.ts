import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  boolean,
  pgEnum,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./users";

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  status: projectStatusEnum("status").default("planning"),
  clientUserId: uuid("client_user_id")
    .references(() => users.id)
    .notNull(),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  progressPercentage: integer("progress_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
