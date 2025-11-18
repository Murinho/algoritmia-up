"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type AlgoritmiaUser = {
  id: number;
  full_name: string;
  codeforces_handle?: string | null;
  country: string;
  profile_image_url?: string | null;
};

export type Member = {
  id: string;
  handle: string;
  name: string;
  countryCode: string;
  rating: number;
  maxRating?: number;
  avatarUrl?: string | null;
};

type UsersResponse = {
  items: AlgoritmiaUser[];
};

// Shape of Codeforces response
type CodeforcesUser = {
  handle: string;
  rating?: number;
  maxRating?: number;
  country?: string;
};

type CodeforcesResponse = {
  status: "OK" | "FAILED";
  comment?: string;
  result?: CodeforcesUser[];
};

function ratingColor(r: number): string {
  if (r >= 4000) return "text-black"; // black (tourist black)
  if (r >= 2400) return "text-red-500"; // red
  if (r >= 2100) return "text-orange-400"; // orange
  if (r >= 1900) return "text-purple-400"; // purple
  if (r >= 1600) return "text-blue-400"; // blue
  if (r >= 1400) return "text-cyan-400"; // cyan
  if (r >= 1200) return "text-green-700"; // dark green
  if (r >= 1) return "text-gray-400"; // gray
  return "text-black"; 
}

function ratingTitle(r: number): string {
  if (r >= 4000) return "Tourist";
  if (r >= 3000) return "Legendary Grandmaster";
  if (r >= 2600) return "International Grandmaster";
  if (r >= 2400) return "Grandmaster;"
  if (r >= 2300) return "International Master"
  if (r >= 2100) return "Master";
  if (r >= 1900) return "Candidate Master";
  if (r >= 1600) return "Expert";
  if (r >= 1400) return "Specialist";
  if (r >= 1200) return "Pupil";
  if (r >= 1) return "Newbie";
  return "Unrated";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.user) {
          setCurrentUserId(String(data.user.id));
        }
      })
      .catch(() => {});
  }, []);


  // Fetch Algoritmia users + Codeforces info
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Get all Algoritmia UP users
        const res = await fetch(`${API_BASE}/users`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Error al obtener usuarios (${res.status})`);
        }
        const data: UsersResponse = await res.json();
        const users = data.items || [];

        // 2) Extract CF handles
        const handles = users
          .map((u) => u.codeforces_handle?.trim())
          .filter((h): h is string => !!h && h.length > 0);

        if (handles.length === 0) {
          if (!cancelled) {
            setMembers([]);
            setLastSynced(new Date());
          }
          return;
        }

        // 3) Build Codeforces API URL
        //    Example:
        //    https://codeforces.com/api/user.info?handles=DmitriyH;Fefer_Ivan&checkHistoricHandles=false
        const joinedHandles = handles.join(";");
        const cfUrl = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(
          joinedHandles
        )}&checkHistoricHandles=false`;

        const cfRes = await fetch(cfUrl);
        if (!cfRes.ok) {
          throw new Error(`Error al consultar Codeforces (${cfRes.status})`);
        }
        const cfData: CodeforcesResponse = await cfRes.json();

        if (cfData.status !== "OK" || !cfData.result) {
          throw new Error(
            cfData.comment || "Codeforces devolvió un estado de error"
          );
        }

        // 4) Map handle -> Codeforces user
        const cfByHandle = new Map<string, CodeforcesUser>();
        for (const u of cfData.result) {
          cfByHandle.set(u.handle.toLowerCase(), u);
        }

        // 5) Build Member[] from join (Algoritmia users + CF data)
        const builtMembers: Member[] = users.flatMap((u) => {
          const handle = u.codeforces_handle?.trim();
          if (!handle) return [];

          const cf = cfByHandle.get(handle.toLowerCase());
          if (!cf) return [];

          const rating = cf.rating ?? 0;
          const maxRating = cf.maxRating ?? undefined;

          const avatarUrl = u.profile_image_url
            ? u.profile_image_url.startsWith("http")
              ? u.profile_image_url
              : `${API_BASE}${u.profile_image_url}`
            : null;

          const countryCode =
            u.country && u.country.length === 2
              ? u.country.toUpperCase()
              : "XX";

          return [
            {
              id: String(u.id),
              handle,
              name: u.full_name,
              countryCode,
              rating,
              maxRating,
              avatarUrl,
            },
          ];
        });

        if (!cancelled) {
          setMembers(builtMembers);
          setLastSynced(new Date());
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("No se pudo sincronizar con Codeforces.");
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
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

  return (
    <section
      className="
        relative
        min-h-[100dvh]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
    "
    >
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
              Ranking basado en el rating actual de Codeforces para los miembros
              de Algoritmia UP.
            </p>
            {loading && (
              <p className="mt-1 text-xs text-white/50">
                Sincronizando con Codeforces…
              </p>
            )}
            {error && (
              <p className="mt-1 text-xs text-red-300">
                {error} (revisa tu conexión o intenta más tarde).
              </p>
            )}
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
              {loading && members.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-white/70"
                  >
                    Cargando datos del leaderboard…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-white/70"
                  >
                    {query
                      ? `No se encontraron miembros que coincidan con "${query}".`
                      : "No hay miembros con handle de Codeforces configurado todavía."}
                  </td>
                </tr>
              )}

              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-white/5 transition-colors ${
                    m.id === currentUserId ? "bg-white/15" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-white/90">
                    {m.rank}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {m.avatarUrl ? (
                        <Image
                          src={m.avatarUrl}
                          alt={m.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          {m.handle.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <Link
                        href={`https://codeforces.com/profile/${m.handle}`}
                        target="_blank"
                        className={`font-medium underline-offset-2 hover:underline ${ratingColor(
                          m.rating
                        )}`}
                      >
                        <strong>{m.handle}</strong>
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-white/90">{m.name}</td>

                  <td className="px-4 py-3 text-sm text-white/90">
                    <div className="flex items-center gap-2">
                      <Image
                        src={`https://flagcdn.com/24x18/${m.countryCode.toLowerCase()}.png`}
                        alt={m.countryCode}
                        width={24}
                        height={18}
                      />
                      <span className="text-white/70">{m.countryCode.toUpperCase()}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-md bg-white/5 px-2 py-1 font-semibold ${ratingColor(
                        m.rating
                      )}`}
                    >
                      {m.rating}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-white/80">
                    {m.maxRating ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-white/90">
                    <span className={`font-medium ${ratingColor(m.rating)}`}>
                      <strong>{ratingTitle(m.rating)}</strong>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-4 flex flex-col items-start justify-between gap-2 text-sm text-white/70 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              {lastSynced
                ? `Última sincronización: ${formatDateTime(lastSynced)}`
                : "Aún no se ha sincronizado con Codeforces."}
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}
