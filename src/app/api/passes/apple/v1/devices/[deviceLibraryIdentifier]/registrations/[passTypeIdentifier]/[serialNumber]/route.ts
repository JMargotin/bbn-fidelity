import { prisma } from "@/lib/prisma";
import { extractCustomerIdFromAuth } from "@/lib/wallet/apple-pass-auth";

type Params = {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
};

/** Register a device for a pass. */
export async function POST(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  const customerId = await extractCustomerIdFromAuth(request.headers.get("authorization"));
  if (!customerId || customerId !== serialNumber) return new Response(null, { status: 401 });

  let body: { pushToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body.pushToken || typeof body.pushToken !== "string") {
    return new Response(null, { status: 400 });
  }

  const existing = await prisma.passDevice.findUnique({
    where: {
      deviceLibraryIdentifier_passTypeIdentifier_serialNumber: {
        deviceLibraryIdentifier,
        passTypeIdentifier,
        serialNumber,
      },
    },
  });

  if (existing) {
    if (existing.pushToken !== body.pushToken) {
      await prisma.passDevice.update({
        where: { id: existing.id },
        data: { pushToken: body.pushToken },
      });
    }
    return new Response(null, { status: 200 });
  }

  await prisma.passDevice.create({
    data: {
      customerId,
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken: body.pushToken,
    },
  });
  return new Response(null, { status: 201 });
}

/** Unregister a device for a pass. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  const customerId = await extractCustomerIdFromAuth(request.headers.get("authorization"));
  if (!customerId || customerId !== serialNumber) return new Response(null, { status: 401 });

  await prisma.passDevice.deleteMany({
    where: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
  });
  return new Response(null, { status: 200 });
}
