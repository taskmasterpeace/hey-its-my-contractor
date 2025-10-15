import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local file
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  schemaFilter: ["public"], // Only manage public schema, not auth schema
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  // Production considerations
  breakpoints: true, // Enable safe migrations
  tablesFilter: ["!auth.*"], // Explicitly exclude auth schema tables
});
