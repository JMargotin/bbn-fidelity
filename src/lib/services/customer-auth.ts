import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";

const scryptAsync = promisify(scrypt);

/** PIN given to legacy customers (and after an admin reset). */
export const DEFAULT_PIN = "1234";

const SESSION_ISSUER = "bbn-fidelite";
export const SESSION_COOKIE = "bbn_fidelite_session";
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

// Brute-force protection: a 4-digit PIN is only 10 000 combinations.
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** scrypt hash, stored as "salt:hash" (both hex). */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(pin, salt, 32)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/**
 * Verify a PIN against a stored hash. A null hash means the customer still has
 * the default PIN (legacy / post-reset), so we compare against DEFAULT_PIN.
 */
export async function verifyPin(pin: string, storedHash: string | null): Promise<boolean> {
  if (storedHash === null) return pin === DEFAULT_PIN;

  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(pin, salt, expected.length)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function getSessionKey(): Uint8Array {
  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("CUSTOMER_SESSION_SECRET / BETTER_AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signCustomerSession(customerId: string): Promise<string> {
  return new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionKey());
}

export async function verifyCustomerSession(token: string): Promise<{ customerId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionKey(), { issuer: SESSION_ISSUER });
    if (typeof payload.customerId !== "string" || !payload.customerId) return null;
    return { customerId: payload.customerId };
  } catch {
    return null;
  }
}
