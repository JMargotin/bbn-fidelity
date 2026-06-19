import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const Schema = z.object({ phoneInput: z.string().min(1) });

/** Tells the UI whether to show the PIN login (existing) or the signup form. */
export async function POST(request: Request) {
  let phoneInput: string;
  try {
    phoneInput = Schema.parse(await request.json()).phoneInput;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let phoneE164: string;
  try {
    phoneE164 = normalizePhone(phoneInput);
  } catch {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { phoneE164 },
    select: { id: true, firstName: true, deletedAt: true },
  });
  const exists = Boolean(customer && !customer.deletedAt);
  return NextResponse.json({ exists, firstName: exists ? customer?.firstName : null });
}
