import { NextResponse } from "next/server";
import { z } from "zod";
import { InvalidTicketQuantityError, NotEnoughPointsError } from "@/lib/contest";
import { getCurrentCustomer } from "@/lib/customer-session";
import {
  ContestNotOpenError,
  buyTickets,
  getActiveContest,
} from "@/lib/services/contest";

const Schema = z.object({
  quantity: z.number().int().positive(),
});

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Connecte-toi pour participer" }, { status: 401 });
  }

  let payload: z.infer<typeof Schema>;
  try {
    payload = Schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }

  const contest = await getActiveContest();
  if (!contest) {
    return NextResponse.json({ error: "Aucun concours en cours" }, { status: 404 });
  }

  try {
    const result = await buyTickets({
      contestId: contest.id,
      customerId: customer.id,
      quantity: payload.quantity,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof NotEnoughPointsError) {
      return NextResponse.json(
        {
          error: `Il te manque ${err.requiredPoints - err.currentPoints} points pour cet achat.`,
        },
        { status: 400 },
      );
    }
    if (err instanceof InvalidTicketQuantityError || err instanceof ContestNotOpenError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Contest ticket purchase error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
