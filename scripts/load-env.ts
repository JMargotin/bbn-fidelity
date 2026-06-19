// Side-effect module: load environment variables for standalone tsx scripts.
//
// Import this FIRST (before any module that reads process.env at import time,
// e.g. src/lib/prisma.ts), because tsx hoists ESM imports above top-level code —
// so calling dotenv inline in a script runs *after* prisma has already read
// DATABASE_URL. Importing a side-effect module guarantees correct ordering.
//
// Loads .env.local if present, otherwise falls back to .env (earlier file wins).
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });
