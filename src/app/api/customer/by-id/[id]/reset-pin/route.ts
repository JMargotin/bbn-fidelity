import { NextResponse } from "next/server";
import { getApiSessionOrUnauthorized } from "@/lib/api-session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PIN } from "@/lib/services/customer-auth";

/**
 * Staff/owner action: reset a customer's PIN back to the default (1234) and
 * clear any lockout. Setting pinHash to null makes verifyPin accept DEFAULT_PIN.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.deletedAt) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await prisma.customer.update({
    where: { id },
    data: { pinHash: null, pinFailedAttempts: 0, pinLockedUntil: null },
  });

  return NextResponse.json({ ok: true, defaultPin: DEFAULT_PIN });
}
