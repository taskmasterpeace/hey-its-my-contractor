import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "./config.js";
import * as schema from "./schema.js";

const queryClient = postgres(config.databaseUrl, {
  prepare: false, // Supabase transaction pooler compatibility
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  fetch_types: false,
});

export const db = drizzle(queryClient, { schema, casing: "snake_case" });
export const client = queryClient;
export { schema };
