import { describe, expect, it } from "vitest";
import {
  buildContactPayload,
  type ContactFormValues,
  interpretContactResponse,
} from "../contact-form";

const PAGE_URL = "https://burgerbynight72.fly.dev/contact";

function values(overrides: Partial<ContactFormValues> = {}): ContactFormValues {
  return {
    name: "Alex",
    email: "alex@example.com",
    phone: "",
    message: "Bonjour",
    honeypot: "",
    ...overrides,
  };
}

describe("buildContactPayload", () => {
  it("envoie les champs obligatoires et la page d'origine", () => {
    expect(buildContactPayload(values(), PAGE_URL)).toEqual({
      name: "Alex",
      email: "alex@example.com",
      message: "Bonjour",
      _page: PAGE_URL,
    });
  });

  it("retire les espaces superflus", () => {
    const payload = buildContactPayload(
      values({ name: "  Alex ", email: " alex@example.com ", message: "\n Salut \n" }),
      PAGE_URL,
    );
    expect(payload).toMatchObject({ name: "Alex", email: "alex@example.com", message: "Salut" });
  });

  it("n'envoie le téléphone que s'il est renseigné", () => {
    expect(buildContactPayload(values({ phone: "   " }), PAGE_URL)).not.toHaveProperty("phone");
    expect(buildContactPayload(values({ phone: "06 12 34 56 78" }), PAGE_URL)).toMatchObject({
      phone: "06 12 34 56 78",
    });
  });

  it("transmet le champ piège quand un robot l'a rempli", () => {
    expect(buildContactPayload(values(), PAGE_URL)).not.toHaveProperty("_gotcha");
    expect(buildContactPayload(values({ honeypot: "spam" }), PAGE_URL)).toMatchObject({
      _gotcha: "spam",
    });
  });

  it("ne modifie pas les valeurs reçues", () => {
    const input = values({ name: "  Alex  " });
    buildContactPayload(input, PAGE_URL);
    expect(input.name).toBe("  Alex  ");
  });
});

describe("interpretContactResponse", () => {
  it("considère 201 comme un envoi réussi", () => {
    expect(interpretContactResponse(201, {})).toEqual({ status: "sent" });
  });

  it("considère tout 2xx comme un envoi réussi", () => {
    expect(interpretContactResponse(200, null)).toEqual({ status: "sent" });
  });

  it("remonte les erreurs par champ d'un 422 (texte ou liste)", () => {
    const result = interpretContactResponse(422, {
      fields: { email: "Adresse e-mail invalide", message: ["Message trop court", "autre"] },
    });
    expect(result).toEqual({
      status: "invalid",
      message: expect.any(String),
      fieldErrors: { email: "Adresse e-mail invalide", message: "Message trop court" },
    });
  });

  it("accepte un 422 qui liste seulement les noms de champs", () => {
    const result = interpretContactResponse(422, { fields: ["name", "phone"] });
    expect(result).toMatchObject({
      status: "invalid",
      fieldErrors: { name: expect.any(String), phone: expect.any(String) },
    });
  });

  it("ignore les champs inconnus et les détails illisibles d'un 422", () => {
    expect(interpretContactResponse(422, { fields: { budget: "trop bas" } })).toMatchObject({
      status: "invalid",
      fieldErrors: {},
    });
    expect(interpretContactResponse(422, "pas du JSON")).toMatchObject({
      status: "invalid",
      fieldErrors: {},
    });
  });

  it("signale la limite d'envois sur un 429", () => {
    expect(interpretContactResponse(429, {})).toEqual({
      status: "rate_limited",
      message: expect.any(String),
    });
  });

  it("renvoie un échec générique pour les autres statuts", () => {
    expect(interpretContactResponse(500, { error: "boom" })).toEqual({
      status: "failed",
      message: expect.any(String),
    });
    expect(interpretContactResponse(403, null)).toMatchObject({ status: "failed" });
  });
});
