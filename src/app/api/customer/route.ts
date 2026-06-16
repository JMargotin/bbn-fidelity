import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertCustomer } from "@/lib/services/customer";

const SignupSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  phoneInput: z.string().min(1),
  rgpdAccepted: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les conditions RGPD",
  }),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof SignupSchema>;
  try {
    payload = SignupSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const customer = await upsertCustomer({
      firstName: payload.firstName,
      phoneInput: payload.phoneInput,
    });
    return NextResponse.json({ customerId: customer.id, firstName: customer.firstName });
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (
        err.name === "ParseError" ||
        msg.includes("phone") ||
        msg.includes("not_a_number") ||
        msg.includes("too_short") ||
        msg.includes("too_long") ||
        msg.includes("invalid_country")
      ) {
        return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
      }
    }
    console.error("Customer signup error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
