import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildApplePass } from "@/lib/wallet/build-pass";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.deletedAt) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
        "Content-Disposition": `inline; filename="bbn-fidelity-${customer.id}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Apple pass build error:", err);
    return NextResponse.json({ error: "Pass generation failed" }, { status: 500 });
  }
}
