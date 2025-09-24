import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// For Supabase connection pooling, disable prepared statements if using "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Disable prepared statements for Supabase compatibility
});

export const db = drizzle(client, {
  casing: "snake_case",
});

export { client };
