import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildApplePass } from "@/lib/wallet/build-pass";
import { extractCustomerIdFromAuth } from "@/lib/wallet/apple-pass-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> },
) {
  const { serialNumber } = await params;

  const customerId = await extractCustomerIdFromAuth(request.headers.get("authorization"));
  if (!customerId || customerId !== serialNumber) {
    return new Response(null, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: serialNumber } });
  if (!customer || customer.deletedAt) return new Response(null, { status: 404 });

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const ts = Date.parse(ifModifiedSince);
    if (Number.isFinite(ts) && customer.updatedAt.getTime() <= ts) {
      return new Response(null, { status: 304 });
    }
  }

  try {
    const pkpass = await buildApplePass({
      id: customer.id,
      firstName: customer.firstName,
      pointsTotal: customer.pointsTotal,
    });
    return new Response(new Uint8Array(pkpass), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": customer.updatedAt.toUTCString(),
      },
    });
  } catch (err) {
    console.error("Apple pass refresh error:", err);
    return NextResponse.json({ error: "Pass generation failed" }, { status: 500 });
  }
}
