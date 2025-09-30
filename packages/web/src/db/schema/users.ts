import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin", // Service provider admin
  "project_manager", // Company admin/PM who can invite contractors
  "contractor", // Invited by PMs, can access assigned projects
  "homeowner", // Associated with specific projects
]);

export const planEnum = pgEnum("plan", ["starter", "pro", "enterprise"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trial",
]);

// Companies table (renamed from tenants to match meeting requirements)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),

  // Billing and subscription info
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default(
    "trial"
  ),

  // Company settings and metadata
  settings: jsonb("settings").default("{}"),
  metadata: jsonb("metadata").default("{}"),

  // Audit fields
  createdBy: uuid("created_by").references(() => users.id), // Service provider who created
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company subscriptions for license management
export const companySubscriptions = pgTable("company_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  plan: planEnum("plan").notNull(),
  maxSeats: integer("max_seats").notNull(),
  usedSeats: integer("used_seats").default(0),
  price: decimal("price", { precision: 10, scale: 2 }),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"),

  // Billing details
  status: subscriptionStatusEnum("status").default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  externalInvoiceId: varchar("external_invoice_id", { length: 255 }),

  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  // System-wide role (from meeting: super_admin, project_manager, contractor, homeowner)
  systemRole: userRoleEnum("system_role").notNull(),

  // Profile information
  profile: jsonb("profile").default("{}").notNull(),
  email: text("email"), // Synced from auth.users
  fullName: text("full_name"), // From auth metadata
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"), // From auth metadata

  // Preferences and settings
  preferences: jsonb("preferences").default("{}"),
  isActive: boolean("is_active").default(true),

  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const companyRelations = relations(companies, ({ many, one }) => ({
  subscriptions: many(companySubscriptions),
  createdByUser: one(users, {
    fields: [companies.createdBy],
    references: [users.id],
  }),
}));

export const companySubscriptionRelations = relations(
  companySubscriptions,
  ({ one }) => ({
    company: one(companies, {
      fields: [companySubscriptions.companyId],
      references: [companies.id],
    }),
  })
);

export const userRelations = relations(users, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [users.id],
    references: [authUsers.id],
  }),
}));

// Type exports for better TypeScript support
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type SelectCompany = typeof companies.$inferSelect;
export type InsertCompanySubscription =
  typeof companySubscriptions.$inferInsert;
export type SelectCompanySubscription =
  typeof companySubscriptions.$inferSelect;

// Legacy aliases for backward compatibility during migration
export const tenants = companies;
export type InsertTenant = InsertCompany;
export type SelectTenant = SelectCompany;
