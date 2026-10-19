import { NextResponse } from "next/server";
import { getApiSessionOrUnauthorized, isOwner } from "@/lib/api-session";
import { DrawNotAvailableError, runDraw } from "@/lib/services/contest";

/** Lance le tirage au sort. Réservé au gérant. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getApiSessionOrUnauthorized();
  if (!session.ok) return session.response;
  if (!isOwner(session.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    const draw = await runDraw(id);
    return NextResponse.json({
      draw: {
        id: draw.id,
        label: draw.label,
        drawnAt: draw.drawnAt,
        winningTicket: draw.winningTicket,
        totalTickets: draw.totalTickets,
        winnerTickets: draw.winnerTickets,
        winner: draw.winnerEntry
          ? {
              firstName: draw.winnerEntry.customer.firstName,
              phoneE164: draw.winnerEntry.customer.phoneE164,
            }
          : null,
      },
    });
  } catch (err) {
    if (err instanceof DrawNotAvailableError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Contest draw error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
