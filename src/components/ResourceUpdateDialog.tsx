'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Tag as TagIcon,
  Star,
  BookOpen,
  StickyNote,
  FileText,
  Notebook as NotebookIcon,
  Globe,
  Video,
  FolderGit2,
  Book,
  SheetIcon,
  Presentation,
  NewspaperIcon,
  BringToFrontIcon,
  Trash2,
} from 'lucide-react';
import type { Resource, ResourceType, Difficulty } from '@/lib/types';
import { updateResource, deleteResource } from '@/lib/resources';
import { HttpError } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  resource: Resource | null;
  onUpdate: (resource: Resource) => void;
  onDelete: (id: string) => void;
};

const RESOURCE_TYPES: ResourceType[] = [
  'notebook',
  'pdf',
  'blog',
  'video',
  'book',
  'link',
  'sheet',
  'slideshow',
  'repo',
  'article',
  'other',
];

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  notebook: 'Notebook',
  pdf: 'PDF',
  blog: 'Blog',
  video: 'Video',
  book: 'Book',
  link: 'Link',
  sheet: 'Sheet',
  slideshow: 'Slideshow',
  repo: 'Repo',
  article: 'Article',
  other: 'Other',
};

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  1: 'Intro: material for first contact with a topic; gentle pace and examples.',
  2: 'Easy–Medium: fundamentals with small twists; assumes basic CP familiarity.',
  3: 'Medium: solid training; classic patterns with multi-step reasoning.',
  4: 'Medium–Hard: deeper articles/notes; advanced techniques and tricky edge-cases.',
  5: 'Hard: expert-level resources; cutting-edge content or dense proofs.',
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Stars({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (v: Difficulty) => void;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const hideRef = useRef<number | null>(null);

  function handleClick(v: Difficulty) {
    onChange(v);
    setHintOpen(true);
    if (hideRef.current) window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => setHintOpen(false), 3000);
  }

  useEffect(() => {
    return () => {
      if (hideRef.current) window.clearTimeout(hideRef.current);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <div className="flex gap-1" role="radiogroup" aria-label="Select difficulty">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            className="p-1 rounded hover:bg-white/5 transition outline-none focus:ring-2 focus:ring-[#C5133D]/60"
            aria-label={`${i} ${i === 1 ? 'star' : 'stars'}`}
            onClick={() => handleClick(i as Difficulty)}
          >
            <Star
              size={18}
              className={i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}
            />
          </button>
        ))}
      </div>

      <div
        className={`absolute left-1/2 top-[115%] -translate-x-1/2 transition-all duration-200
        ${hintOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
        aria-live="polite"
      >
        <div className="max-w-[24rem] rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-lg">
          <p className="text-xs text-zinc-200">
            <span className="font-medium">
              {value} {value === 1 ? 'Star' : 'Stars'}:
            </span>{' '}
            {DIFFICULTY_DESCRIPTIONS[value]}
          </p>
        </div>
      </div>
    </div>
  );
}

function TagPills({
  tags,
  onRemove,
}: {
  tags: string[];
  onRemove: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-zinc-200"
        >
          {t}
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-200"
            onClick={() => onRemove(t)}
            aria-label={`Remove tag ${t}`}
          >
            ×
          </button>
        </span>
      ))}
      {tags.length === 0 && (
        <span className="text-xs text-zinc-500">Aún no hay temas; agrega algunos debajo.</span>
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case 'notebook':
      return <NotebookIcon size={16} className="text-zinc-400" />;
    case 'pdf':
      return <FileText size={16} className="text-zinc-400" />;
    case 'blog':
      return <Globe size={16} className="text-zinc-400" />;
    case 'video':
      return <Video size={16} className="text-zinc-400" />;
    case 'repo':
      return <FolderGit2 size={16} className="text-zinc-400" />;
    case 'book':
      return <Book size={16} className="text-zinc-400" />;
    case 'sheet':
      return <SheetIcon size={16} className="text-zinc-400" />;
    case 'link':
      return <LinkIcon size={16} className="text-zinc-400" />;
    case 'slideshow':
      return <Presentation size={16} className="text-zinc-400" />;
    case 'article':
      return <NewspaperIcon size={16} className="text-zinc-400" />;
    case 'other':
      return <BringToFrontIcon size={16} className="text-zinc-400" />;
    default:
      return <BookOpen size={16} className="text-zinc-400" />;
  }
}

export default function ResourceUpdateDialog({
  open,
  onClose,
  resource,
  onUpdate,
  onDelete,
}: Props) {
  const initialFocusRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<ResourceType>('notebook');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill when dialog opens or resource changes
  useEffect(() => {
    if (open && resource) {
      setType(resource.type);
      setTitle(resource.title ?? '');
      setUrl(resource.url ?? '');
      setTopics(resource.tags ?? []);
      setDifficulty((resource.difficulty ?? 3) as Difficulty);
      setNotes(resource.notes ?? '');
      setTopicInput('');
      setError(null);

      setTimeout(() => initialFocusRef.current?.focus(), 20);
    }
  }, [open, resource]);

  function addTopic() {
    const raw = topicInput.trim();
    if (!raw) return;
    if (topics.includes(raw)) {
      setTopicInput('');
      return;
    }
    setTopics((prev) => [...prev, raw]);
    setTopicInput('');
  }

  function removeTopic(t: string) {
    setTopics((prev) => prev.filter((x) => x !== t));
  }

  function validate(): string | null {
    if (!title.trim()) return 'Title is required.';
    if (!/^https?:\/\//i.test(url.trim())) return 'Valid URL is required (http/https).';
    return null;
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!resource) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateResource(resource.id, {
        type,
        title: title.trim(),
        url: url.trim(),
        tags: topics,
        difficulty,
        notes: notes.trim(),
      });

      onUpdate(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        if (err.status === 403) {
          setError('Solo coaches o admins pueden actualizar recursos.');
        } else if (err.message) {
          setError(String(err.message));
        } else {
          setError('Error actualizando el recurso. Intenta de nuevo.');
        }
      } else {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!resource) return;

    // Simple confirm; you can swap to a nicer custom confirm later
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar este recurso? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteResource(resource.id);
      onDelete(resource.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        if (err.status === 403) {
          setError('Solo coaches o admins pueden eliminar recursos.');
        } else if (err.message) {
          setError(String(err.message));
        } else {
          setError('Error eliminando el recurso. Intenta de nuevo.');
        }
      } else {
        setError('Ocurrió un error inesperado al eliminar. Intenta de nuevo.');
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !resource) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[min(680px,92vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />

        <div className="relative bg-zinc-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="text-zinc-200" size={18} />
              <h2 className="text-zinc-100 font-semibold">Editar Recurso</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="px-5 py-5 overflow-y-auto max-h-[76vh] space-y-5">
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <Field label="Tipo">
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={[
                      'px-3 py-2 rounded-xl border transition inline-flex items-center gap-2',
                      t === type
                        ? 'bg-[#C5133D]/20 border-[#C5133D]/50 text-zinc-100'
                        : 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-white/5',
                    ].join(' ')}
                  >
                    <TypeIcon type={t} />
                    <span>{RESOURCE_TYPE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Título">
              <input
                ref={initialFocusRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Heavy Light Decomposition – Algoritmia code c++"
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
              />
            </Field>

            <Field label="URL" hint="Debe comenzar con: http(s)://">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-zinc-800 border border-white/10 flex-1 flex items-center">
                  <span className="pl-3 pr-1 text-zinc-400">
                    <LinkIcon size={16} />
                  </span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/resource"
                    className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-2 py-2 focus:outline-none"
                  />
                </div>
                <a
                  href={/^https?:\/\//.test(url) ? url : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
                >
                  Abrir
                </a>
              </div>
            </Field>

            <Field label="Temas">
              <div className="space-y-2">
                <TagPills tags={topics} onRemove={removeTopic} />
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3 flex-1">
                    <TagIcon size={16} className="text-zinc-400" />
                    <input
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTopic();
                        }
                      }}
                      placeholder='Add a topic and press Enter (e.g., "graphs")'
                      className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTopic}
                    className="px-3 py-2 rounded-xl border border-white/10 text-zinc-100 bg-white/5 hover:bg-white/10 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Dificultad">
                <Stars value={difficulty} onChange={setDifficulty} />
              </Field>
            </div>

            <Field label="Notas (opcional)">
              <div className="flex items-start gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                <StickyNote size={16} className="text-zinc-400 mt-2" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Resumen rápido, advertencias, qué cubre, etc."
                  rows={4}
                  className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none resize-y"
                />
              </div>
            </Field>

            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-red-200 border border-red-500/60 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 transition"
              >
                <Trash2 size={16} />
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-zinc-300 border border-white/10 hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#C5133D] hover:brightness-110 disabled:opacity-60 transition"
                >
                  {submitting ? 'Actualizando…' : 'Actualizar Recurso'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
