import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  creditPoints,
  CustomerNotFoundError,
  TooManyRecentTransactionsError,
} from "@/lib/services/credit";
import { InvalidAmountError } from "@/lib/points";

const CreditSchema = z.object({
  customerId: z.string().min(1),
  amountEurCents: z.number().int().positive(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: z.infer<typeof CreditSchema>;
  try {
    payload = CreditSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await creditPoints({
      customerId: payload.customerId,
      amountEurCents: payload.amountEurCents,
      employeeId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidAmountError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof CustomerNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof TooManyRecentTransactionsError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("Credit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
