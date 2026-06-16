"use client";

// NOTE: this file was lost with the rest of `src/app/**` and is not present
// in the compiled bundle (it's a `'use client'` component with no SSR mirror).
// This is a best-effort reconstruction based on the API surface it interacts
// with (verify-token / by-id / credit / redemption) and the URL query support
// referenced by clients-table (`/admin/scan?id=...`). Re-check by hand.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Reward = {
  id: string;
  label: string;
  thresholdPoints: number;
  available: boolean;
  missing: number;
};

type Customer = {
  id: string;
  firstName: string;
  phoneE164: string;
  pointsTotal: number;
};

type CustomerResponse = { customer: Customer; rewards: Reward[] };

export function ScanForm() {
  const queryId = useSearchParams().get("id");
  const [manualId, setManualId] = useState("");
  const [data, setData] = useState<CustomerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [amount, setAmount] = useState("");

  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const loadCustomer = useCallback(async (id: string) => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch(`/api/customer/by-id/${id}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Erreur ${res.status}`);
        setData(null);
        return;
      }
      setData(body);
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    if (queryId) loadCustomer(queryId);
  }, [queryId, loadCustomer]);

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (manualId.trim()) await loadCustomer(manualId.trim());
  }

  async function startScan() {
    setError(null);
    setScanning(true);
    try {
      const mod = await import("html5-qrcode");
      const scanner = new mod.Html5Qrcode("qr-reader");
      scannerRef.current = { stop: () => scanner.stop().then(() => scanner.clear()) };
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          try {
            await scannerRef.current?.stop();
          } catch {}
          scannerRef.current = null;
          setScanning(false);
          await verifyScannedToken(decoded);
        },
        () => {
          // ignore per-frame decode errors
        },
      );
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Impossible de démarrer la caméra");
    }
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
    } catch {}
    scannerRef.current = null;
    setScanning(false);
  }

  async function verifyScannedToken(token: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/scan/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "QR invalide");
        return;
      }
      await loadCustomer(body.customerId);
    } finally {
      setPending(false);
    }
  }

  async function credit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    const euros = Number.parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(euros) || euros <= 0) {
      setError("Montant invalide");
      return;
    }
    const amountEurCents = Math.round(euros * 100);
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: data.customer.id, amountEurCents }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Erreur ${res.status}`);
        return;
      }
      setSuccess(`+${body.pointsCredit} points (nouveau total : ${body.newPointsTotal})`);
      setAmount("");
      await loadCustomer(data.customer.id);
    } finally {
      setPending(false);
    }
  }

  async function redeem(rewardId: string) {
    if (!data) return;
    if (!confirm("Confirmer l'utilisation de cette récompense ?")) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: data.customer.id, rewardId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Erreur ${res.status}`);
        return;
      }
      setSuccess(`Récompense utilisée (-${body.pointsDebit} pts)`);
      await loadCustomer(data.customer.id);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass space-y-4 rounded-3xl p-5">
        {!scanning ? (
          <button type="button" onClick={startScan} className="btn-neon w-full rounded-2xl px-6 py-4 text-lg">
            📷 Scanner le QR code
          </button>
        ) : (
          <>
            <div id="qr-reader" className="overflow-hidden rounded-2xl" />
            <button type="button" onClick={stopScan} className="btn-ghost w-full rounded-2xl px-4 py-2 text-sm">
              Arrêter la caméra
            </button>
          </>
        )}

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="ID client (manuel)"
            className="field flex-1"
          />
          <button type="submit" className="btn-ghost rounded-xl px-4">
            Charger
          </button>
        </form>
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </p>
      )}

      {data && (
        <div className="glass neon-frame space-y-5 rounded-3xl p-5">
          <header className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-lavender-dim">Client</p>
              <p className="font-display text-2xl text-cream">{data.customer.firstName}</p>
              <p className="text-xs text-lavender-dim">{data.customer.phoneE164}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-lavender-dim">Points</p>
              <p className="font-display text-grad text-4xl">{data.customer.pointsTotal}</p>
            </div>
          </header>

          <form onSubmit={credit} className="flex flex-wrap gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant en €"
              className="field flex-1"
            />
            <button type="submit" disabled={pending} className="btn-neon rounded-xl px-5">
              Créditer
            </button>
          </form>

          {data.rewards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-lavender-dim">Récompenses</p>
              {data.rewards.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  disabled={!r.available || pending}
                  onClick={() => redeem(r.id)}
                  className={
                    r.available
                      ? "flex w-full items-center justify-between rounded-2xl bg-magenta/15 px-4 py-3 ring-1 ring-magenta/40 transition hover:bg-magenta/25"
                      : "flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 opacity-60"
                  }
                >
                  <span className="text-left">
                    <span className="block font-medium text-cream">{r.label}</span>
                    <span className="text-xs text-lavender-dim">
                      {r.available ? `${r.thresholdPoints} pts` : `Encore ${r.missing} pts`}
                    </span>
                  </span>
                  {r.available ? <span className="text-magenta-soft">→</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
