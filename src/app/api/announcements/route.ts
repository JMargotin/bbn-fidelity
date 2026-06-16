import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSessionOrUnauthorized, isOwner } from "@/lib/api-session";
import { broadcastPassUpdateToAll } from "@/lib/services/passkit-push";

const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(400),
});

async function getRecipientCounts() {
  const [devices, distinctCustomers] = await Promise.all([
    prisma.passDevice.count(),
    prisma.passDevice.findMany({
      distinct: ["customerId"],
      select: { customerId: true },
    }),
  ]);
  return { devices, customers: distinctCustomers.length };
}

export async function GET() {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;

  const [announcements, recipients] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getRecipientCounts(),
  ]);
  return NextResponse.json({ announcements, recipients });
}

export async function POST(request: Request) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;
  if (!isOwner(session.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof CreateAnnouncementSchema>;
  try {
    payload = CreateAnnouncementSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const created = await prisma.announcement.create({ data: payload });

  let broadcast = { devices: 0, ok: 0, failed: 0 };
  try {
    broadcast = await broadcastPassUpdateToAll();
  } catch (err) {
    console.error("Broadcast push error:", err);
  }

  const announcement = await prisma.announcement.update({
    where: { id: created.id },
    data: { deviceCount: broadcast.devices },
  });

  return NextResponse.json({ announcement, broadcast });
}
