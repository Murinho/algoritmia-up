"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// --- Types
export type Member = {
  id: string;
  handle: string;
  name: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., "MX", "US", "BR")
  rating: number; // current CF rating
  maxRating?: number; // max CF rating
  contests?: number; // number of CF contests
  avatarUrl?: string; // optional future use
  lastOnline?: string; // ISO string
};

// --- Mock data (replace with API later)
const MOCK_MEMBERS: Member[] = [
  {
    id: "1",
    handle: "Murinho",
    name: "Adrián Muro",
    countryCode: "MX",
    rating: 2012,
    maxRating: 2087,
  },
  {
    id: "2",
    handle: "tiojuan",
    name: "Juan Marquina",
    countryCode: "MX",
    rating: 1875,
    maxRating: 1930,
  },
  {
    id: "3",
    handle: "erwinlh",
    name: "Erwin López",
    countryCode: "MX",
    rating: 1650,
    maxRating: 1712,
  },
  {
    id: "4",
    handle: "lomeliandres",
    name: "Andrés Lomelí",
    countryCode: "MX",
    rating: 1420,
    maxRating: 1506,
  },
  {
    id: "5",
    handle: "algoritmia_newbie",
    name: "María Rodríguez",
    countryCode: "CO",
    rating: 1180,
    maxRating: 1210,
  },
  {
    id: "6",
    handle: "silverMex",
    name: "Diego Ruiz",
    countryCode: "MX",
    rating: 2101,
    maxRating: 2233,
  },
  {
    id: "7",
    handle: "br_carioca",
    name: "Luiz Souza",
    countryCode: "BR",
    rating: 1590,
    maxRating: 1644,
  },
  {
    id: "8",
    handle: "grandmx",
    name: "Renata Pérez",
    countryCode: "MX",
    rating: 2620,
    maxRating: 2701,
  },
];

// --- Helpers
function countryCodeToFlag(code: string): string {
  const cc = code.toUpperCase();
  // Map A-Z to regional indicator symbols
  return cc
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function ratingColor(r: number): string {
  if (r >= 2600) return "text-red-500"; // red
  if (r >= 2100) return "text-orange-400"; // orange
  if (r >= 1900) return "text-purple-400"; // purple
  if (r >= 1600) return "text-blue-400"; // blue
  if (r >= 1400) return "text-cyan-400"; // cyan
  if (r >= 1200) return "text-green-700"; // dark green
  return "text-gray-400"; // gray
}

function ratingTitle(r: number): string {
  if (r >= 2600) return "Grandmaster";
  if (r >= 2100) return "Master";
  if (r >= 1900) return "Candidate Master";
  if (r >= 1600) return "Expert";
  if (r >= 1400) return "Specialist";
  if (r >= 1200) return "Pupil";
  return "Newbie";
}

function formatDateTime(dt: Date): string {
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate ranks with ties (1,2,2,4 ...)
function rankMembers(members: Member[]): Array<Member & { rank: number }> {
  const sorted = [...members].sort((a, b) => b.rating - a.rating);
  let rank = 0;
  let lastRating = Infinity;
  let count = 0;
  return sorted.map((m) => {
    count += 1;
    if (m.rating !== lastRating) {
      rank = count;
      lastRating = m.rating;
    }
    return { ...m, rank };
  });
}

// --- Component
export default function Leaderboard() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // In the future, plug Codeforces API here.
  // Example: fetch from your backend that caches CF user.ratedList
  // useEffect(() => {
  //   setLoading(true);
  //   fetch("/api/leaderboard")
  //     .then((r) => r.json())
  //     .then((data: Member[]) => setMembers(data))
  //     .catch(() => setMembers(MOCK_MEMBERS))
  //     .finally(() => setLoading(false));
  // }, []);

  // For now: use mock immediately
  useEffect(() => {
    setMembers(MOCK_MEMBERS);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rankMembers(members);
    if (!q) return base;
    return base.filter(
      (m) =>
        m.handle.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [members, query]);

  function handleRefresh() {
    // Hook this to a real sync later
    setLoading(true);
    setTimeout(() => {
      setLastSynced(new Date());
      setLoading(false);
    }, 500);
  }

  return (
    <section className="
        relative
        min-h-[100dvh]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
    ">
      {/* Background gradient that matches Algoritmia UP style */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Algoritmia UP – Codeforces Leaderboard
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Ranking basado en el rating actual de Codeforces (mock data; listo
              para conectar a API).
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por handle o nombre…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/60 outline-none ring-0 focus:border-white/20"
            />
          </div>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur">
          <table className="min-w-full table-fixed divide-y divide-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Rank
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Handle
                </th>
                <th className="w-56 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Nombre
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  País
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Rating
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Máximo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                  Título
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-semibold text-white/90">
                    {m.rank}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {/* small avatar fallback */}
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {m.handle.slice(0, 2).toUpperCase()}
                      </div>
                      <Link
                        href={`https://codeforces.com/profile/${m.handle}`}
                        target="_blank"
                        className={`font-medium underline-offset-2 hover:underline ${ratingColor(
                          m.rating
                        )}`}
                      >
                        <strong> 
                            {m.handle}
                        </strong>
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-white/90">{m.name}</td>

                  <td className="px-4 py-3 text-sm text-white/90">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-lg" title={m.countryCode}>
                        {countryCodeToFlag(m.countryCode)}
                      </span>
                      <span className="text-white/70">{m.countryCode}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-md bg-white/5 px-2 py-1 font-semibold ${ratingColor(
                      m.rating
                    )}`}>
                      {m.rating}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-white/80">{m.maxRating ?? "—"}</td>

                  <td className="px-4 py-3 text-sm text-white/90">
                    <span className={`font-medium ${ratingColor(m.rating)}`}>
                      {ratingTitle(m.rating)}
                    </span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-white/70"
                  >
                    No se encontraron miembros que coincidan con {query}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="mt-4 flex flex-col items-start justify-between gap-2 text-sm text-white/70 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              Última sincronización: {formatDateTime(lastSynced)}
            </span>
          </div>

          <p className="text-xs">
            Nota: Los colores del handle siguen los rangos pedidos: gris (0–1199),
            verde oscuro (1200–1399), cian (1400–1599), azul (1600–1899), morado
            (1900–2099), naranja (2100–2599), rojo (2600+).
          </p>
        </footer>
      </div>
    </section>
  );
}
