'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ListChecks,
  ChevronUp,
  ChevronDown,
  Trophy,
  Plus,
} from 'lucide-react';

import ContestCreateDialog, {
  type Contest as DialogContest,
  type Platform as DialogPlatform,
  type ContestFormat as DialogContestFormat,
} from '@/components/ContestCreateDialog';

import { API_BASE } from '@/lib/api'; // ✅ reuse API base

// Keep local types in sync with the dialog to avoid TS union issues
type Platform = DialogPlatform;
type ContestFormat = DialogContestFormat;
type UserRole = 'user' | 'coach' | 'admin';

type Contest = {
  id: string;
  title: string;
  platform: Platform;
  url: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  format: ContestFormat;
  startsAt: string;
  endsAt: string;
  location: string;
  season: string;
};

const seedContests: Contest[] = [
  {
    id: 'c1',
    title: 'ICPC Algoritmia UP Selection contest',
    platform: 'Codeforces',
    url: 'https://codeforces.com/contest/0000',
    tags: ['graphs', 'dp', 'greedy'],
    difficulty: 4,
    format: 'ICPC',
    startsAt: '2025-10-05T15:00:00Z',
    endsAt: '2025-10-05T19:00:00Z',
    location: 'UP Bonaterra – Lab A',
    season: 'Fall 2025',
  },
  {
    id: 'c2',
    title: 'Training Round – Flow Focus',
    platform: 'Vjudge',
    url: 'https://vjudge.net/contest/123456',
    tags: ['flows', 'implementation'],
    difficulty: 5,
    format: 'ICPC',
    startsAt: '2025-09-21T16:00:00Z',
    endsAt: '2025-09-21T20:00:00Z',
    location: 'Remoto',
    season: 'Fall 2025',
  },
  {
    id: 'c3',
    title: 'IOI Prep: DP Marathon',
    platform: 'Kattis',
    url: 'https://open.kattis.com/',
    tags: ['dp', 'optimization'],
    difficulty: 5,
    format: 'IOI',
    startsAt: '2025-08-30T14:00:00Z',
    endsAt: '2025-08-30T22:00:00Z',
    location: 'UP – Sala de Cómputo',
    season: 'Summer 2025',
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="inline-flex" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-yellow-400/90 leading-none">
          {i < n ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

type SortKey = keyof Pick<
  Contest,
  'title' | 'platform' | 'difficulty' | 'format' | 'startsAt' | 'endsAt' | 'location' | 'season'
>;
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export default function ContestsSection() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'startsAt', dir: 'desc' });

  const [contests, setContests] = useState<Contest[]>(seedContests);
  const [openCreate, setOpenCreate] = useState(false);

  // ⬇️ Role state
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // ⬇️ Fetch current user role from /auth/me
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) setUserRole(null);
          return;
        }

        const data = await res.json();
        const role = data.user?.role as UserRole | undefined;
        if (!cancelled) {
          setUserRole(role ?? 'user');
        }
      } catch {
        if (!cancelled) setUserRole(null);
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = userRole === 'coach' || userRole === 'admin';

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = contests.filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.platform.toLowerCase().includes(q) ||
        c.tags.join(' ').toLowerCase().includes(q) ||
        c.format.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.season.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      switch (sort.key) {
        case 'difficulty':
          return (a.difficulty - b.difficulty) * dir;
        case 'startsAt':
        case 'endsAt':
          return (new Date(a[sort.key]).getTime() - new Date(b[sort.key]).getTime()) * dir;
        default: {
          const av = String(a[sort.key] ?? '').toLowerCase();
          const bv = String(b[sort.key] ?? '').toLowerCase();
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        }
      }
    });

    return sorted;
  }, [query, sort, contests]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }

  function SortButton({ k, label }: { k: SortKey; label: string }) {
    const active = sort.key === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:underline ${
          active ? 'text-white' : 'text-white/80'
        }`}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        {active ? (sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
      </button>
    );
  }

  function handleCreate(newContest: DialogContest) {
    setContests((prev) => [{ ...newContest }, ...prev]);
  }

  const defaultSeason = 'Fall 2025';

  return (
    <section
      aria-labelledby="contests-title"
      className="relative min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2
            id="contests-title"
            className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Contests
          </h2>
          <p className="mt-2 text-center text-white/80">
            Rondas de práctica y selectivos organizados por la comunidad.
          </p>
        </div>

        {/* Card shell */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400 opacity-90" />

          {/* Toolbar */}
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <ListChecks className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Buscar por título, plataforma, tag, formato, sede o temporada…"
                className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-white/80">
                {data.length} resultado{data.length === 1 ? '' : 's'}
              </div>

              {canCreate && (
                <button
                  onClick={() => setOpenCreate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C5133D] px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition"
                >
                  <Plus className="h-4 w-4" />
                  Crear Contest
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm text-white/90">
              <thead>
                <tr className="border-y border-white/10 bg-white/5 text-white">
                  <th className="px-4 py-3 min-w-[280px]">
                    <SortButton k="title" label="Título" />
                  </th>
                  <th className="px-4 py-3 w-40">
                    <SortButton k="platform" label="Plataforma" />
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">URL</th>
                  <th className="px-4 py-3 min-w-[200px]">Tags</th>
                  <th className="px-4 py-3 w-32">
                    <SortButton k="difficulty" label="Dificultad" />
                  </th>
                  <th className="px-4 py-3 w-28">
                    <SortButton k="format" label="Formato" />
                  </th>
                  <th className="px-4 py-3 w-44">
                    <SortButton k="startsAt" label="Inicio" />
                  </th>
                  <th className="px-4 py-3 w-44">
                    <SortButton k="endsAt" label="Fin" />
                  </th>
                  <th className="px-4 py-3 min-w-[180px]">
                    <SortButton k="location" label="Sede" />
                  </th>
                  <th className="px-4 py-3 w-36">
                    <SortButton k="season" label="Temporada" />
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-white/10 hover:bg-white/5">
                    {/* Title */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <Trophy className="h-4 w-4" />
                        {c.title}
                      </span>
                    </td>

                    {/* Platform */}
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                        {c.platform}
                      </span>
                    </td>

                    {/* URL */}
                    <td className="px-4 py-3">
                      {c.url ? (
                        <Link
                          href={c.url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-white/90 underline decoration-white/30 underline-offset-2 hover:decoration-white"
                        >
                          Abrir
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-3">
                      <Stars n={c.difficulty} />
                    </td>

                    {/* Format */}
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                        {c.format}
                      </span>
                    </td>

                    {/* Start */}
                    <td className="px-4 py-3">
                      <time
                        className="inline-flex items-center gap-1 text-white/80"
                        dateTime={c.startsAt}
                        title={new Date(c.startsAt).toLocaleString()}
                      >
                        <Calendar className="h-4 w-4" />
                        {new Date(c.startsAt).toLocaleDateString()}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="ml-1 h-4 w-4" />
                          {new Date(c.startsAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </time>
                    </td>

                    {/* End */}
                    <td className="px-4 py-3">
                      <time
                        className="inline-flex items-center gap-1 text-white/80"
                        dateTime={c.endsAt}
                        title={new Date(c.endsAt).toLocaleString()}
                      >
                        <Calendar className="h-4 w-4" />
                        {new Date(c.endsAt).toLocaleDateString()}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="ml-1 h-4 w-4" />
                          {new Date(c.endsAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </time>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-white/90">
                        <MapPin className="h-4 w-4" />
                        {c.location}
                      </span>
                    </td>

                    {/* Season */}
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                        {c.season}
                      </span>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-white/70">
                      No se encontraron contests con “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/70">
          Tip: prueba “ICPC”, “IOI”, “Codeforces”, “graphs”, “UP”, “Remoto”, “Fall 2025”, etc.
        </p>
      </div>

      {/* Create dialog (only opens if button is visible & clicked) */}
      <ContestCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={handleCreate}
        defaultSeason={defaultSeason}
      />
    </section>
  );
}
