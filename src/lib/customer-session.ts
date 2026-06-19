import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signCustomerSession,
  verifyCustomerSession,
} from "@/lib/services/customer-auth";

export type SessionCustomer = {
  id: string;
  firstName: string;
  phoneE164: string;
  pointsTotal: number;
};

/** Read + verify the session cookie and return the (fresh) customer, or null. */
export async function getCurrentCustomer(): Promise<SessionCustomer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifyCustomerSession(token);
  if (!session) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, firstName: true, phoneE164: true, pointsTotal: true, deletedAt: true },
  });
  if (!customer || customer.deletedAt) return null;

  const { deletedAt: _deletedAt, ...rest } = customer;
  return rest;
}

export async function setCustomerSessionCookie(customerId: string): Promise<void> {
  const token = await signCustomerSession(customerId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearCustomerSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
