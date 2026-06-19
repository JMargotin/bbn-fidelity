import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function makeClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: ["error"] });
}

// Instantiate lazily on first real use. Merely importing this module must NOT
// throw — `next build` imports every route module to collect page data, and in
// that phase (and on the Docker builder) DATABASE_URL isn't available. The
// client is created on first property access, by which point we're at runtime
// with the env var set.
function getClient(): PrismaClient {
  if (!globalThis.prisma) globalThis.prisma = makeClient();
  return globalThis.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
