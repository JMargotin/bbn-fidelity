import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSessionOrUnauthorized } from "@/lib/api-session";
import { normalizePhone } from "@/lib/phone";

export async function GET(request: Request) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const take = Math.min(Number.parseInt(url.searchParams.get("take") ?? "50", 10), 200);

  let normalized: string | null = null;
  try {
    normalized = normalizePhone(q);
  } catch {
    normalized = null;
  }

  const digits = q.replace(/\D/g, "");
  const orClauses = q
    ? [
        { firstName: { contains: q, mode: "insensitive" as const } },
        ...(normalized ? [{ phoneE164: normalized }] : []),
        ...(digits.length >= 4 ? [{ phoneE164: { contains: digits.slice(-9) } }] : []),
      ]
    : undefined;

  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, OR: orClauses },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      firstName: true,
      phoneE164: true,
      pointsTotal: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ customers });
}
