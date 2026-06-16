import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";

type ApiSession = Awaited<ReturnType<typeof auth.api.getSession>>;

type ApiSessionResult =
  | { ok: true; session: NonNullable<ApiSession> }
  | { ok: false; response: Response };

export async function getApiSessionOrUnauthorized(): Promise<ApiSessionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    };
  }
  return { ok: true, session };
}

export function isOwner(role: Role): boolean {
  return role === "OWNER";
}
