import { parsePhoneNumberWithError } from "libphonenumber-js";

const DEFAULT_COUNTRY = "FR" as const;

/**
 * Parse a user-supplied phone number (e.g. "06 12 34 56 78") and return its
 * E.164 canonical form ("+33612345678"). Throws ParseError-style errors from
 * libphonenumber-js when the input is not a valid phone — callers catch by
 * name/message (see customer route).
 */
export function normalizePhone(input: string): string {
  return parsePhoneNumberWithError(input, DEFAULT_COUNTRY).number;
}
