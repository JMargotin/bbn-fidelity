import { verifyQrToken } from "@/lib/services/qr";

const SCHEME = "ApplePass ";

/**
 * Apple PassKit web service uses an `Authorization: ApplePass <token>` header
 * to authenticate device → server requests. The token is our QR JWT, which
 * already carries the customerId. We just verify it and return that id.
 */
export async function extractCustomerIdFromAuth(header: string | null): Promise<string | null> {
  if (!header || !header.startsWith(SCHEME)) return null;
  const token = header.slice(SCHEME.length).trim();
  if (!token) return null;
  try {
    const { customerId } = await verifyQrToken(token);
    return customerId;
  } catch {
    return null;
  }
}
