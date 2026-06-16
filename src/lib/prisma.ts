import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma: PrismaClient = globalThis.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
