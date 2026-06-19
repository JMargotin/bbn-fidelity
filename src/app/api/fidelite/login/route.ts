import { NextResponse } from "next/server";
import { z } from "zod";
import { setCustomerSessionCookie } from "@/lib/customer-session";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import {
  MAX_PIN_ATTEMPTS,
  PIN_LOCK_MINUTES,
  isValidPin,
  verifyPin,
} from "@/lib/services/customer-auth";

const Schema = z.object({
  phoneInput: z.string().min(1),
  pin: z.string().min(1),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof Schema>;
  try {
    payload = Schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Numéro ou code PIN manquant" }, { status: 400 });
  }

  let phoneE164: string;
  try {
    phoneE164 = normalizePhone(payload.phoneInput);
  } catch {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { phoneE164 } });
  if (!customer || customer.deletedAt) {
    return NextResponse.json({ error: "Numéro ou code PIN incorrect" }, { status: 401 });
  }

  // Lockout window still open?
  if (customer.pinLockedUntil && customer.pinLockedUntil > new Date()) {
    return NextResponse.json(
      { error: `Trop d'essais. Réessaie dans ${PIN_LOCK_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const ok = isValidPin(payload.pin) && (await verifyPin(payload.pin, customer.pinHash));
  if (!ok) {
    const attempts = customer.pinFailedAttempts + 1;
    const locked = attempts >= MAX_PIN_ATTEMPTS;
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        pinFailedAttempts: locked ? 0 : attempts,
        pinLockedUntil: locked
          ? new Date(Date.now() + PIN_LOCK_MINUTES * 60_000)
          : customer.pinLockedUntil,
      },
    });
    if (locked) {
      return NextResponse.json(
        { error: `Trop d'essais. Réessaie dans ${PIN_LOCK_MINUTES} minutes.` },
        { status: 429 },
      );
    }
    const remaining = MAX_PIN_ATTEMPTS - attempts;
    return NextResponse.json(
      { error: `Code PIN incorrect. ${remaining} essai(s) restant(s).` },
      { status: 401 },
    );
  }

  // Success — reset counters and open the session.
  if (customer.pinFailedAttempts !== 0 || customer.pinLockedUntil) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { pinFailedAttempts: 0, pinLockedUntil: null },
    });
  }
  await setCustomerSessionCookie(customer.id);
  return NextResponse.json({ firstName: customer.firstName });
}
