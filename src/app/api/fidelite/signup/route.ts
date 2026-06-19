import { NextResponse } from "next/server";
import { z } from "zod";
import { setCustomerSessionCookie } from "@/lib/customer-session";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPin } from "@/lib/services/customer-auth";

const Schema = z.object({
  firstName: z.string().trim().min(1).max(50),
  phoneInput: z.string().min(1),
  pin: z.string().refine(isValidPin, "Le code PIN doit faire 4 chiffres"),
  rgpdAccepted: z.boolean().refine((v) => v === true, "Vous devez accepter les conditions RGPD"),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof Schema>;
  try {
    payload = Schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Code PIN à 4 chiffres et consentement requis" }, { status: 400 });
  }

  let phoneE164: string;
  try {
    phoneE164 = normalizePhone(payload.phoneInput);
  } catch {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { phoneE164 } });
  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { error: "Ce numéro a déjà un compte. Connecte-toi avec ton code PIN." },
      { status: 409 },
    );
  }

  const pinHash = await hashPin(payload.pin);

  // Reuse a soft-deleted row if the same phone signs up again.
  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          firstName: payload.firstName,
          pinHash,
          deletedAt: null,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
        },
      })
    : await prisma.customer.create({
        data: { firstName: payload.firstName, phoneE164, pinHash },
      });

  await setCustomerSessionCookie(customer.id);
  return NextResponse.json({ firstName: customer.firstName });
}
