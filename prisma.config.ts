// Prisma 7 config file.
// Prisma 7 requires the DATABASE_URL to be passed through this config
// (it can no longer be referenced from `datasource` in schema.prisma).
//
// Next.js loads `.env.local` automatically at runtime, but Prisma CLI commands
// (`prisma migrate`, `prisma generate`, `prisma studio`, ...) do not — so we
// load it explicitly here via `dotenv`.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
