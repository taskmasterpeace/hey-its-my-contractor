import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

export const userRoleEnum = pgEnum("user_role", [
  "contractor",
  "staff",
  "sub",
  "homeowner",
  "admin",
]);

export const planEnum = pgEnum("plan", ["basic", "pro", "enterprise"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: planEnum("plan").default("basic"),
  settings: jsonb("settings").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  role: userRoleEnum("role").notNull(),
  profile: jsonb("profile").default("{}").notNull(),
  email: text("email"), // Synced from auth.users
  fullName: text("full_name"), // From auth metadata
  avatarUrl: text("avatar_url"), // From auth metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const userRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  authUser: one(authUsers, {
    fields: [users.id],
    references: [authUsers.id],
  }),
}));

// Type exports for better TypeScript support
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type SelectTenant = typeof tenants.$inferSelect;
