import { prisma } from "@/lib/prisma";

/**
 * "Get serial numbers for passes associated with a device" — Apple PassKit
 * polls this to learn which passes have been updated since the last sync.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const passesUpdatedSinceRaw = new URL(request.url).searchParams.get("passesUpdatedSince");

  const registrations = await prisma.passDevice.findMany({
    where: { deviceLibraryIdentifier, passTypeIdentifier },
    include: { customer: true },
  });

  const filtered = passesUpdatedSinceRaw
    ? registrations.filter(
        (r) => r.customer.updatedAt > new Date(Number(passesUpdatedSinceRaw)),
      )
    : registrations;

  if (filtered.length === 0) return new Response(null, { status: 204 });

  const lastUpdated = filtered.reduce(
    (max, r) => Math.max(max, r.customer.updatedAt.getTime()),
    0,
  );

  return Response.json({
    serialNumbers: filtered.map((r) => r.serialNumber),
    lastUpdated: String(lastUpdated),
  });
}
