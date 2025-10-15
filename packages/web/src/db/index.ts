import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const connectionString = process.env.DATABASE_URL!;
const queryClient = postgres(connectionString, {
  prepare: false, // Disable prepared statements for Supabase Transaction pooler
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  fetch_types: false,
});
export const db = drizzle(queryClient, {
  casing: "snake_case",
});
export const client = queryClient;