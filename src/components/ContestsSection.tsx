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
  Pencil,
} from 'lucide-react';

import ContestCreateDialog from '@/components/ContestCreateDialog';
import ContestUpdateDialog from '@/components/ContestUpdateDialog';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import type { Contest, UserRole } from '@/lib/types';

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

type ContestDateValue = Contest['startsAt'];

function isContestFinished(c: Contest): boolean {
  if (!c.startsAt || !c.endsAt) return false;

  const now = Date.now();
  const end = new Date(c.endsAt as unknown as string).getTime();

  if (Number.isNaN(end)) return false;

  return now > end;
}

function StatusPill({
  startsAt,
  endsAt,
}: {
  startsAt: ContestDateValue;
  endsAt: ContestDateValue;
}) {
  if (!startsAt || !endsAt) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs text-white/70">
        —
      </span>
    );
  }

  const now = new Date();
  const start = new Date(startsAt as unknown as string);
  const end = new Date(endsAt as unknown as string);

  let label = 'Activo';
  let classes =
    'bg-emerald-500/15 text-emerald-200 border-emerald-400/40';

  if (now < start) {
    label = 'Próximamente';
    classes = 'bg-amber-500/15 text-amber-200 border-amber-400/40';
  } else if (now > end) {
    label = 'Finalizado';
    classes = 'bg-slate-500/20 text-slate-200 border-slate-400/40';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

type SortKey = keyof Pick<
  Contest,
  'title' | 'platform' | 'difficulty' | 'format' | 'startsAt' | 'endsAt' | 'location' | 'season'
>;
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export default function ContestsSection() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const API_BASE_LOCAL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || API_BASE || '';

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'startsAt', dir: 'desc' });
  const [contests, setContests] = useState<Contest[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  const [openUpdate, setOpenUpdate] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load current user's role
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_LOCAL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) {
          if (!cancelled) {
            setAuthError('No hay sesión activa. Redirigiendo al login…');
            setTimeout(() => router.replace('/login'), 1);
          }
          return;
        }

        const data = await res.json();
        const role = data.user?.role as UserRole | undefined;
        if (!cancelled) {
          setUserRole(role ?? 'user');
        }
      } catch {
        if (!cancelled) {
          setAuthError('No hay sesión activa. Redirigiendo al login…');
          setTimeout(() => router.replace('/login'), 900);
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_BASE_LOCAL, router]);

  // Load contests from backend
  useEffect(() => {
    let cancelled = false;

    async function loadContests() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`${API_BASE_LOCAL}/contests`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('Failed to load contests:', res.status, text);
          if (!cancelled) {
            setLoadError('No se pudieron cargar los contests.');
            setContests([]);
          }
          return;
        }

        const json = await res.json();
        const items = (json.items ?? []) as Contest[];

        if (!cancelled) {
          setContests(items);
        }
      } catch (err) {
        console.error('Error fetching contests:', err);
        if (!cancelled) {
          setLoadError('Ocurrió un error al cargar los contests.');
          setContests([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContests();
    return () => {
      cancelled = true;
    };
  }, [API_BASE_LOCAL]);

  const canCreate = userRole === 'coach' || userRole === 'admin';
  const canEdit = canCreate; // same roles for now

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
          return (
            (new Date(a[sort.key] as unknown as string).getTime() -
              new Date(b[sort.key] as unknown as string).getTime()) * dir
          );
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
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
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
        {active ? (
          sort.dir === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : null}
      </button>
    );
  }

  function handleCreate() {
    setOpenCreate(false);
  }

  const defaultSeason = 'Fall 2025';

  if (checkingAuth) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-tr from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-white/90 backdrop-blur">
          Verificando sesión…
        </div>
      </div>
    );
  }
  if (authError) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-tr from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-amber-200 backdrop-blur">
          {authError}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="contests-title"
      className="relative min-h-[80dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400 opacity-90" />

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
                {loading
                  ? 'Cargando…'
                  : `${data.length} resultado${data.length === 1 ? '' : 's'}`}
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

          {loadError && <div className="px-4 pb-2 text-xs text-red-200">{loadError}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm text-white/90">
              <thead>
                <tr className="border-y border-white/10 bg-white/5 text-white">
                  {/* 1. Título */}
                  <th className="px-4 py-3 min-w-[280px]">
                    <SortButton k="title" label="Título" />
                  </th>
                  {/* 2. Status */}
                  <th className="px-4 py-3 w-36">Status</th>
                  {/* 3. URL */}
                  <th className="px-4 py-3 min-w-[140px]">URL</th>
                  {/* 4. Inicio */}
                  <th className="px-4 py-3 w-44">
                    <SortButton k="startsAt" label="Inicio" />
                  </th>
                  {/* 5. Fin */}
                  <th className="px-4 py-3 w-44">
                    <SortButton k="endsAt" label="Fin" />
                  </th>
                  {/* 6. Plataforma */}
                  <th className="px-4 py-3 w-40">
                    <SortButton k="platform" label="Plataforma" />
                  </th>
                  {/* 7. Sede */}
                  <th className="px-4 py-3 min-w-[180px]">
                    <SortButton k="location" label="Sede" />
                  </th>
                  {/* 8. Formato */}
                  <th className="px-4 py-3 w-28">
                    <SortButton k="format" label="Formato" />
                  </th>
                  {/* 9. Temporada */}
                  <th className="px-4 py-3 w-36">
                    <SortButton k="season" label="Temporada" />
                  </th>
                  {/* 10. Dificultad */}
                  <th className="px-4 py-3 w-32">
                    <SortButton k="difficulty" label="Dificultad" />
                  </th>
                  {/* 11. Tags */}
                  <th className="px-4 py-3 min-w-[200px]">Tags</th>
                  {/* 12. Notas */}
                  <th className="px-4 py-3 min-w-[220px]">Notas</th>
                  {/* 13. Acciones */}
                  <th className="px-4 py-3 w-28 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  data.map((c) => {
                    const finished = isContestFinished(c);

                    return (
                      <tr key={c.id} className="border-b border-white/10 hover:bg-white/5">
                        {/* 1. Título */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 font-medium text-white">
                            <Trophy className="h-4 w-4" />
                            {c.title}
                          </span>
                        </td>

                        {/* 2. Status */}
                        <td className="px-4 py-3">
                          <StatusPill startsAt={c.startsAt} endsAt={c.endsAt} />
                        </td>

                        {/* 3. URL */}
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

                        {/* 4. Inicio */}
                        <td className="px-4 py-3">
                          <time
                            className="inline-flex items-center gap-1 text-white/80"
                            dateTime={c.startsAt as unknown as string}
                            title={new Date(c.startsAt as unknown as string).toLocaleString()}
                          >
                            <Calendar className="h-4 w-4" />
                            {new Date(c.startsAt as unknown as string).toLocaleDateString()}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="ml-1 h-4 w-4" />
                              {new Date(c.startsAt as unknown as string).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </time>
                        </td>

                        {/* 5. Fin */}
                        <td className="px-4 py-3">
                          <time
                            className="inline-flex items-center gap-1 text-white/80"
                            dateTime={c.endsAt as unknown as string}
                            title={new Date(c.endsAt as unknown as string).toLocaleString()}
                          >
                            <Calendar className="h-4 w-4" />
                            {new Date(c.endsAt as unknown as string).toLocaleDateString()}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="ml-1 h-4 w-4" />
                              {new Date(c.endsAt as unknown as string).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </time>
                        </td>

                        {/* 6. Plataforma */}
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                            {c.platform}
                          </span>
                        </td>

                        {/* 7. Sede */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-white/90">
                            <MapPin className="h-4 w-4" />
                            {c.location}
                          </span>
                        </td>

                        {/* 8. Formato */}
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                            {c.format}
                          </span>
                        </td>

                        {/* 9. Temporada */}
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                            {c.season}
                          </span>
                        </td>

                        {/* 10. Dificultad */}
                        <td className="px-4 py-3">
                          {finished ? (
                            <Stars n={c.difficulty} />
                          ) : (
                            <span className="text-white/50 text-xs italic">
                              Oculto hasta finalizar
                            </span>
                          )}
                        </td>

                        {/* 11. Tags */}
                        <td className="px-4 py-3">
                          {finished ? (
                            c.tags.length > 0 ? (
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
                            ) : (
                              <span className="text-white/50">—</span>
                            )
                          ) : (
                            <span className="text-white/50 text-xs italic">
                              Oculto hasta finalizar
                            </span>
                          )}
                        </td>

                        {/* 12. Notas */}
                        <td className="px-4 py-3">
                          <span className="text-white/80">
                            {c.notes ? c.notes : <span className="text-white/50">—</span>}
                          </span>
                        </td>

                        {/* 13. Acciones */}
                        <td className="px-4 py-3 text-center">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingContest(c);
                                setOpenUpdate(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 transition"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                          ) : (
                            <span className="text-white/40 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && data.length === 0 && (
                    <tr>
                      <td colSpan={13} className="px-4 py-10 text-center text-white/70">
                        No se encontraron contests con “{query}”.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={13} className="px-4 py-10 text-center text-white/70">
                        Cargando contests…
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

      <ContestCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={handleCreate}
        defaultSeason={defaultSeason}
      />

      <ContestUpdateDialog
        open={openUpdate}
        contest={editingContest}
        onClose={() => setOpenUpdate(false)}
        onUpdated={(updated) => {
          setContests((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setOpenUpdate(false);
          setEditingContest(null);
        }}
        onDeleted={(id) => {
          setContests((prev) => prev.filter((c) => c.id !== id));
          setOpenUpdate(false);
          setEditingContest(null);
        }}
      />
    </section>
  );
}