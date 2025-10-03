import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, companies } from "./users";
import { projects } from "./projects";

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
  "cancelled",
]);

export const companyRoleEnum = pgEnum("company_role", [
  "admin",
  "project_manager",
  "member",
]);

export const projectRoleEnum = pgEnum("project_role", [
  "project_manager",
  "contractor",
  "homeowner",
]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }).notNull(),
  invitedBy: uuid("invited_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Role assignments
  companyRole: companyRoleEnum("company_role").notNull(),
  projectRole: projectRoleEnum("project_role"),

  // Invitation details
  status: invitationStatusEnum("status").default("pending").notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  customMessage: text("custom_message"),
  metadata: jsonb("metadata").default("{}"),

  // Timestamps
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Company Users - Junction table for multi-company support
export const companyUsers = pgTable("company_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  companyRole: companyRoleEnum("company_role").notNull(),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Project Users - Junction table for project access
export const projectUsers = pgTable("project_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectRole: projectRoleEnum("project_role").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Relations
export const invitationRelations = relations(invitations, ({ one }) => ({
  company: one(companies, {
    fields: [invitations.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const companyUserRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.id],
  }),
}));

export const projectUserRelations = relations(projectUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUsers.userId],
    references: [users.id],
  }),
}));

// Type exports
export type InsertInvitation = typeof invitations.$inferInsert;
export type SelectInvitation = typeof invitations.$inferSelect;
export type InsertCompanyUser = typeof companyUsers.$inferInsert;
export type SelectCompanyUser = typeof companyUsers.$inferSelect;
export type InsertProjectUser = typeof projectUsers.$inferInsert;
export type SelectProjectUser = typeof projectUsers.$inferSelect;
