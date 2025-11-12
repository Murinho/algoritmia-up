// app/components/ResourceCreateDialog.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Tag as TagIcon,
  Star,
  BookOpen,
  User,
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
} from 'lucide-react';

// —— Types ——
export type ResourceType =
  | 'Notebook'
  | 'PDF'
  | 'Blog'
  | 'Video'
  | 'Book'
  | 'Cheatsheet'
  | 'Link'
  | 'Sheet'
  | 'Slideshow'
  | 'Repo'
  | 'Article'
  | 'Other';

export type Resource = {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  topic: string[]; // multiple tags
  difficulty: 1 | 2 | 3 | 4 | 5;
  addedBy: string;
  createdAt: string; // ISO string or formatted date
  notes?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (resource: Resource) => void;
  defaultAddedBy?: string;
  defaultCreatedAt?: string; // ISO, if omitted we use today
};

// —— Constants ——
const RESOURCE_TYPES: ResourceType[] = [
  'Notebook',
  'PDF',
  'Blog',
  'Video',
  'Book',
  'Link',
  'Sheet',
  'Slideshow',
  'Repo',
  'Article',
  'Other',
];

const DIFFICULTY_DESCRIPTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Intro: material for first contact with a topic; gentle pace and examples.',
  2: 'Easy–Medium: fundamentals with small twists; assumes basic CP familiarity.',
  3: 'Medium: solid training; classic patterns with multi-step reasoning.',
  4: 'Medium–Hard: deeper articles/notes; advanced techniques and tricky edge-cases.',
  5: 'Hard: expert-level resources; cutting-edge content or dense proofs.',
};

// —— Helpers ——
function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function isoDateOnly(iso?: string) {
  // returns YYYY-MM-DD for <input type="date">
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateOnlyToISO(dateOnly: string) {
  // interpret as local midnight
  if (!dateOnly) return '';
  const dt = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString();
}

// —— Field Shell ——
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

// —— Stars Input ——
function Stars({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const hideRef = useRef<number | null>(null);

  function handleClick(v: 1 | 2 | 3 | 4 | 5) {
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
            onClick={() => handleClick(i as 1 | 2 | 3 | 4 | 5)}
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

// —— Tag Pills ——
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

// —— Icon for type ——
function TypeIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case 'Notebook':
      return <NotebookIcon size={16} className="text-zinc-400" />;
    case 'PDF':
      return <FileText size={16} className="text-zinc-400" />;
    case 'Blog':
      return <Globe size={16} className="text-zinc-400" />;
    case 'Video':
      return <Video size={16} className="text-zinc-400" />;
    case 'Repo':
      return <FolderGit2 size={16} className="text-zinc-400" />;
    case 'Book':
      return <Book size={16} className="text-zinc-400" />;
    case 'Cheatsheet':
      return <SheetIcon size={16} className="text-zinc-400" />;
    case 'Link':
      return <LinkIcon size={16} className="text-zinc-400" />;
    case 'Slideshow':
      return <Presentation size={16} className="text-zinc-400" />;
    case 'Article':
      return <NewspaperIcon size={16} className="text-zinc-400" />;
    case 'Other':
      return <BringToFrontIcon size={16} className="text-zinc-400" />;
    default:
      return <BookOpen size={16} className="text-zinc-400" />;
  }
}

// —— Main ——
export default function ResourceCreateDialog({
  open,
  onClose,
  onCreate,
  defaultAddedBy = '',
  defaultCreatedAt,
}: Props) {
  const initialFocusRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<ResourceType>('Notebook');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [addedBy, setAddedBy] = useState(defaultAddedBy);
  const [createdAtDateOnly, setCreatedAtDateOnly] = useState(
    isoDateOnly(defaultCreatedAt || new Date().toISOString()),
  );
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // focus + reset errors when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => initialFocusRef.current?.focus(), 20);
      setError(null);
    }
  }, [open]);

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
    if (addedBy.trim().length === 0) return 'Added by is required.';
    if (!createdAtDateOnly) return 'Created date is required.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const resource: Resource = {
        id: genId(),
        type,
        title: title.trim(),
        url: url.trim(),
        topic: topics,
        difficulty,
        addedBy: addedBy.trim(),
        createdAt: dateOnlyToISO(createdAtDateOnly),
        notes: notes.trim() || undefined,
      };
      onCreate(resource);
      onClose();

      // minimal reset for next open
      setTitle('');
      setUrl('');
      setTopics([]);
      setTopicInput('');
      setNotes('');
      setDifficulty(3);
      setType('Notebook');
      setAddedBy(defaultAddedBy || '');
      setCreatedAtDateOnly(isoDateOnly(new Date().toISOString()));
      setError(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-[min(680px,92vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />

        <div className="relative bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="text-zinc-200" size={18} />
              <h2 className="text-zinc-100 font-semibold">Crear Recurso</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto max-h-[76vh] space-y-5">
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
                    <span>{t}</span>
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
              <Field label="Agregado por">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <User size={16} className="text-zinc-400" />
                  <input
                    value={addedBy}
                    onChange={(e) => setAddedBy(e.target.value)}
                    placeholder="Ana García"
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>

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

            {/* Footer */}
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-300 border border-white/10 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-white bg-[#C5133D] hover:brightness-110 disabled:opacity-60 transition"
              >
                {submitting ? 'Creando…' : 'Crear Recurso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
