import { SignJWT, jwtVerify } from "jose";

const ISSUER = "bbn-fidelity";

export class InvalidQrTokenError extends Error {
  constructor() {
    super("Invalid QR token");
    this.name = "InvalidQrTokenError";
  }
}

let cachedKey: Uint8Array | null = null;
function getSigningKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not set");
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signQrToken(payload: { customerId: string }): Promise<string> {
  return new SignJWT({ customerId: payload.customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .sign(getSigningKey());
}

export async function verifyQrToken(token: string): Promise<{ customerId: string }> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { issuer: ISSUER });
    if (typeof payload.customerId !== "string" || !payload.customerId) {
      throw new InvalidQrTokenError();
    }
    return { customerId: payload.customerId };
  } catch {
    throw new InvalidQrTokenError();
  }
}
