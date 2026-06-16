import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-component helpers that redirect on auth failure (vs. api-session.ts
 * which returns a 401 Response — different audiences, different behaviour).
 */

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function requireOwner() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin/scan");
  return session;
}
