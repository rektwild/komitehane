import {defineConfig} from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/academic/db/schema.ts",
  out: "./drizzle/academic",
  dbCredentials: {url: process.env.ACADEMIC_MIGRATION_DATABASE_URL ?? ""},
});
