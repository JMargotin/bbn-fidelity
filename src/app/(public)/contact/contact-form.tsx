"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { CODEXA_FORM_URL, CONTACT_THANK_YOU_URL } from "@/lib/codexa";
import {
  buildContactPayload,
  CONTACT_FIELDS,
  type ContactField,
  type ContactFormValues,
  type ContactResult,
  interpretContactResponse,
  NETWORK_ERROR_RESULT,
} from "@/lib/contact-form";

type FormState = { status: "idle" } | { status: "sending" } | ContactResult;

const IDLE: FormState = { status: "idle" };

function readValues(form: HTMLFormElement): ContactFormValues {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "");
  return {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    message: text("message"),
    honeypot: text("_gotcha"),
  };
}

async function sendContact(values: ContactFormValues): Promise<ContactResult> {
  try {
    const response = await fetch(CODEXA_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildContactPayload(values, window.location.href)),
    });
    const body: unknown = await response.json().catch(() => null);
    return interpretContactResponse(response.status, body);
  } catch {
    // fetch only rejects on network/CORS failure: tell the visitor to retry.
    return NETWORK_ERROR_RESULT;
  }
}

const fieldId = (field: ContactField) => `contact-${field}`;
const errorId = (field: ContactField) => `contact-${field}-error`;

interface FieldProps {
  field: ContactField;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function Field({ field, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(field)} className="mb-1.5 block text-sm font-medium text-lavender">
        {label}
        {hint && <span className="font-normal text-lavender-dim"> {hint}</span>}
      </label>
      {children}
      {error && (
        <p id={errorId(field)} className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function SentMessage({ onReset }: { onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The submit button unmounts on success: move focus onto the confirmation so
  // keyboard and screen-reader users land on it instead of <body>.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="space-y-4 py-4 text-center">
      <h2 ref={headingRef} tabIndex={-1} className="arcade text-3xl outline-none">
        Message envoyé !
      </h2>
      <p className="text-lavender">Merci, on a bien reçu ton message. On te répond au plus vite.</p>
      <button
        type="button"
        onClick={onReset}
        className="btn-ghost rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        Envoyer un autre message
      </button>
    </div>
  );
}

// Progressive enhancement: with JavaScript the message is sent via fetch and
// the result shown inline; without it, the native POST goes to Codexa which
// redirects to /merci.
export function ContactForm() {
  const [state, setState] = useState<FormState>(IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  // Field to focus once the form has re-rendered: the first invalid one after
  // a 422, or the first field after "Envoyer un autre message".
  const focusAfterRender = useRef<ContactField | null>(null);

  useEffect(() => {
    const field = focusAfterRender.current;
    if (!field || state.status === "sending") return;
    focusAfterRender.current = null;
    const element = formRef.current?.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }, [state]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = readValues(event.currentTarget);
    setState({ status: "sending" });
    const result = await sendContact(values);
    if (result.status === "invalid") {
      focusAfterRender.current = CONTACT_FIELDS.find((field) => result.fieldErrors[field]) ?? null;
    }
    setState(result);
  }

  function startOver() {
    focusAfterRender.current = "name";
    setState(IDLE);
  }

  if (state.status === "sent") return <SentMessage onReset={startOver} />;

  const pending = state.status === "sending";
  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};
  const formError = "message" in state ? state.message : null;

  const a11y = (field: ContactField) => ({
    id: fieldId(field),
    name: field,
    "aria-invalid": fieldErrors[field] ? true : undefined,
    "aria-describedby": fieldErrors[field] ? errorId(field) : undefined,
  });

  return (
    <form
      ref={formRef}
      action={CODEXA_FORM_URL}
      method="POST"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <Field field="name" label="Nom" error={fieldErrors.name}>
        <input
          {...a11y("name")}
          required
          autoComplete="name"
          className="field"
          placeholder="Ton nom"
        />
      </Field>

      <Field field="email" label="E-mail" error={fieldErrors.email}>
        <input
          {...a11y("email")}
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="ton@email.fr"
        />
      </Field>

      <Field field="phone" label="Téléphone" hint="(facultatif)" error={fieldErrors.phone}>
        <input
          {...a11y("phone")}
          type="tel"
          autoComplete="tel"
          className="field"
          placeholder="06 12 34 56 78"
        />
      </Field>

      <Field field="message" label="Message" error={fieldErrors.message}>
        <textarea
          {...a11y("message")}
          required
          rows={5}
          className="field min-h-32 resize-y"
          placeholder="Ta question, ta demande d'événement…"
        />
      </Field>

      {/* Anti-bot trap: hidden from humans, must stay empty. */}
      <input name="_gotcha" tabIndex={-1} autoComplete="off" hidden aria-hidden="true" />
      <input type="hidden" name="_redirect" value={CONTACT_THANK_YOU_URL} />

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-neon w-full rounded-2xl px-6 py-4 text-lg"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
