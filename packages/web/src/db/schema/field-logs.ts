import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const dailyLogs = pgTable("daily_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  media: jsonb("media").default("[]"), // Array of media files
  weatherData: jsonb("weather_data"),
  location: jsonb("location"), // GPS coordinates
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
