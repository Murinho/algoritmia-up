'use client';

import Link from 'next/link';
import { JSX, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Newspaper,
  Notebook as NotebookIcon,
  Link2,
  Table as SheetIcon,
  Presentation,
  Video,
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Book,
  FolderGit2,
  NewspaperIcon,
  BringToFrontIcon,
} from 'lucide-react';

import ResourceCreateDialog from '@/components/ResourceCreateDialog';
import type { Resource, ResourceType, UserRole } from '@/lib/types';

const TYPE_ICON: Record<ResourceType, JSX.Element> = {
  pdf: <FileText className="h-4 w-4" />,
  blog: <Newspaper className="h-4 w-4" />,
  notebook: <NotebookIcon className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  sheet: <SheetIcon className="h-4 w-4" />,
  slideshow: <Presentation className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  book: <Book className="h-4 w-4" />,
  repo: <FolderGit2 className="h-4 w-4" />,
  article: <NewspaperIcon className="h-4 w-4" />,
  other: <BringToFrontIcon className="h-4 w-4" />,
};

const seedResources: Resource[] = [
  {
    id: 'r1',
    type: 'notebook',
    title: 'Heavy Light Decomposition Algorithm code c++',
    url: 'https://github.com/Murinho/CP-Notebook/blob/main/Code/Graphs/heavy_light_decomposition.cpp',
    tags: ['graphs', 'dp', 'team strategy'],
    difficulty: 4,
    addedBy: 'Adrián Muro',
    createdAt: '2025-09-28T14:31:00Z',
    notes: 'Template con lazy segtree y ejemplo de queries path.',
  },
  {
    id: 'r2',
    type: 'pdf',
    title: 'Dinic + Min-Cost Max-Flow Cheatsheet',
    url: 'https://cp-algorithms.com/graph/min_cost_flow.html',
    tags: ['graphs', 'flows'],
    difficulty: 5,
    addedBy: 'Juan Marquina',
    createdAt: '2025-09-18T10:02:00Z',
    notes: 'Incluye casos borde y tips de performance.',
  },
  {
    id: 'r3',
    type: 'blog',
    title: 'DP optimizations (Divide & Conquer, Knuth, CHT)',
    url: 'https://codeforces.com/blog/entry/8219',
    tags: ['dp', 'optimization'],
    difficulty: 5,
    addedBy: 'Erwin López',
    createdAt: '2025-08-30T20:00:00Z',
    notes: 'Resumen rápido con links a problemas clásicos.',
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

type SortKey = keyof Pick<Resource, 'type' | 'title' | 'difficulty' | 'addedBy' | 'createdAt'>;
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export default function ResourcesSection() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || '';

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [resources, setResources] = useState<Resource[]>(seedResources);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
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
  }, [API_BASE, router]);

  const canCreate = userRole === 'coach' || userRole === 'admin';

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = resources.filter((r) => {
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.addedBy.toLowerCase().includes(q) ||
        r.tags.join(' ').toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      switch (sort.key) {
        case 'difficulty':
          return (a.difficulty - b.difficulty) * dir;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
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
  }, [query, sort, resources]);

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
        {active ? (sort.dir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
      </button>
    );
  }

  function handleCreate(newResource: Resource) {
    setResources((prev) => [newResource, ...prev]);
  }

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
      aria-labelledby="resources-title"
      className="relative min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8">
          <h2
            id="resources-title"
            className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Recursos de Aprendizaje
          </h2>
          <p className="mt-2 text-center text-white/80">
            Colección curada por la comunidad de Algoritmia UP.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400 opacity-90" />

          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Buscar por título, autor, tema o tipo…"
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
                  Crear Recurso
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm text-white/90">
              <thead>
                <tr className="border-y border-white/10 bg-white/5 text-white">
                  <th className="px-4 py-3 w-28">
                    <SortButton k="type" label="Tipo" />
                  </th>
                  <th className="px-4 py-3 min-w-[260px]">
                    <SortButton k="title" label="Título" />
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">URL</th>
                  <th className="px-4 py-3 min-w-[200px]">Temas</th>
                  <th className="px-4 py-3 w-32">
                    <SortButton k="difficulty" label="Dificultad" />
                  </th>
                  <th className="px-4 py-3 w-40">
                    <SortButton k="addedBy" label="Agregado por" />
                  </th>
                  <th className="px-4 py-3 w-44">
                    <SortButton k="createdAt" label="Creado el" />
                  </th>
                  <th className="px-4 py-3 min-w-[220px]">Notas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs capitalize">
                        {TYPE_ICON[r.type]}
                        {r.type}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{r.title}</span>
                    </td>

                    <td className="px-4 py-3">
                      {r.url ? (
                        <Link
                          href={r.url}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-white/90 underline decoration-white/30 underline-offset-2 hover:decoration-white"
                        >
                          Abrir recurso
                          <span aria-hidden>↗</span>
                        </Link>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs text-white/90"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Stars n={r.difficulty} />
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-white/90">{r.addedBy}</span>
                    </td>

                    <td className="px-4 py-3">
                      <time
                        className="text-white/80"
                        dateTime={r.createdAt}
                        title={new Date(r.createdAt).toLocaleString()}
                      >
                        {new Date(r.createdAt).toLocaleDateString()}
                      </time>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-white/80">
                        {r.notes ? r.notes : <span className="text-white/50">—</span>}
                      </span>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-white/70">
                      No se encontraron recursos con “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/70">
          Tip: escribe “graphs”, “dp”, “video”, “pdf”, etc. en la búsqueda para filtrar rápido.
        </p>
      </div>

      <ResourceCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={handleCreate}
      />
    </section>
  );
}
