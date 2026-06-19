"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  firstName: string;
  phoneE164: string;
  pointsTotal: number;
  createdAt: string;
};

export function ClientsTable() {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setLoading(true);
    try {
      const url = new URL("/api/customer/search", window.location.origin);
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url.toString());
      const body = await res.json();
      setCustomers(body.customers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search("");
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    search(query);
  }

  async function resetPin(c: Customer) {
    if (!confirm(`Réinitialiser le code PIN de ${c.firstName} à 1234 ?`)) return;
    const res = await fetch(`/api/customer/by-id/${c.id}/reset-pin`, { method: "POST" });
    if (res.ok) {
      const { defaultPin } = await res.json();
      alert(`Code PIN de ${c.firstName} réinitialisé à ${defaultPin}.`);
    } else {
      alert("Échec de la réinitialisation du PIN.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (prénom ou téléphone)"
          className="field flex-1"
        />
        <button type="submit" className="btn-neon rounded-xl px-5">
          Rechercher
        </button>
      </form>

      {loading && <p className="text-sm text-lavender-dim">Chargement…</p>}

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-lavender-dim">
              <th className="px-4 py-3 font-semibold">Prénom</th>
              <th className="px-4 py-3 font-semibold">Téléphone</th>
              <th className="px-4 py-3 font-semibold">Points</th>
              <th className="px-4 py-3 font-semibold">Inscrit le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-medium text-cream">{c.firstName}</td>
                <td className="px-4 py-3 text-lavender">{c.phoneE164}</td>
                <td className="px-4 py-3 font-display text-lg text-grad">{c.pointsTotal}</td>
                <td className="px-4 py-3 text-lavender-dim">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => resetPin(c)}
                      className="btn-ghost rounded-full px-3 py-1.5 text-xs font-medium"
                    >
                      Reset PIN
                    </button>
                    <Link
                      href={`/admin/scan?id=${c.id}`}
                      className="btn-ghost rounded-full px-3 py-1.5 text-xs font-medium"
                    >
                      Scanner →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-lavender-dim">
                  Aucun client trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
