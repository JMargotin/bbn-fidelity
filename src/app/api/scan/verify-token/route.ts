import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionOrUnauthorized } from "@/lib/api-session";
import { verifyQrToken, InvalidQrTokenError } from "@/lib/services/qr";

const VerifyTokenSchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;

  let payload: z.infer<typeof VerifyTokenSchema>;
  try {
    payload = VerifyTokenSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { customerId } = await verifyQrToken(payload.token);
    return NextResponse.json({ customerId });
  } catch (err) {
    if (err instanceof InvalidQrTokenError) {
      return NextResponse.json({ error: "QR invalide ou expiré" }, { status: 401 });
    }
    throw err;
  }
}
