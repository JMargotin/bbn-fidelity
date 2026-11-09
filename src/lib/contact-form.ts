// Contact form → Codexa forms API. Pure helpers so the request/response
// contract is unit-tested independently of the React component.
//
// API contract: 201 received · 422 invalid fields (detail in `fields`) ·
// 429 rate limited (10 sends / 10 min / visitor).

export const CONTACT_FIELDS = ["name", "email", "phone", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Anti-bot trap (`_gotcha`): hidden from humans, must stay empty. */
  honeypot: string;
}

export type ContactPayload = Readonly<Record<string, string>>;

export type ContactResult =
  | { status: "sent" }
  | { status: "invalid"; message: string; fieldErrors: ContactFieldErrors }
  | { status: "rate_limited"; message: string }
  | { status: "failed"; message: string };

const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY_REQUESTS = 429;

const INVALID_MESSAGE = "Vérifie les champs signalés puis renvoie ton message.";
const INVALID_FIELD_MESSAGE = "Champ invalide.";
const RATE_LIMITED_MESSAGE = "Trop d'envois en peu de temps. Réessaie dans quelques minutes.";
const FAILED_MESSAGE = "L'envoi a échoué. Réessaie dans un instant.";

export const NETWORK_ERROR_RESULT: ContactResult = {
  status: "failed",
  message: "Envoi impossible. Vérifie ta connexion et réessaie.",
};

export function buildContactPayload(values: ContactFormValues, pageUrl: string): ContactPayload {
  const phone = values.phone.trim();
  const honeypot = values.honeypot.trim();
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    message: values.message.trim(),
    ...(phone ? { phone } : {}),
    ...(honeypot ? { _gotcha: honeypot } : {}),
    _page: pageUrl,
  };
}

export function interpretContactResponse(httpStatus: number, body: unknown): ContactResult {
  if (httpStatus >= 200 && httpStatus < 300) return { status: "sent" };
  if (httpStatus === HTTP_UNPROCESSABLE) {
    return { status: "invalid", message: INVALID_MESSAGE, fieldErrors: readFieldErrors(body) };
  }
  if (httpStatus === HTTP_TOO_MANY_REQUESTS) {
    return { status: "rate_limited", message: RATE_LIMITED_MESSAGE };
  }
  return { status: "failed", message: FAILED_MESSAGE };
}

function isContactField(key: unknown): key is ContactField {
  return typeof key === "string" && (CONTACT_FIELDS as readonly string[]).includes(key);
}

function describeFieldError(detail: unknown): string {
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && typeof detail[0] === "string" && detail[0]) return detail[0];
  return INVALID_FIELD_MESSAGE;
}

// The exact shape of `fields` isn't documented: accept a map
// `{ field: message | message[] }` or a plain list of field names, and drop
// anything that doesn't name one of our inputs.
function readFieldErrors(body: unknown): ContactFieldErrors {
  if (typeof body !== "object" || body === null || !("fields" in body)) return {};
  const { fields } = body;

  if (Array.isArray(fields)) {
    return Object.fromEntries(
      fields.filter(isContactField).map((field) => [field, INVALID_FIELD_MESSAGE]),
    );
  }
  if (typeof fields === "object" && fields !== null) {
    return Object.fromEntries(
      Object.entries(fields)
        .filter(([field]) => isContactField(field))
        .map(([field, detail]) => [field, describeFieldError(detail)]),
    );
  }
  return {};
}
