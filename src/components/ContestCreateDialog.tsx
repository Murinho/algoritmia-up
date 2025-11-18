'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Calendar, Link as LinkIcon, Tag as TagIcon, Star, MapPin, Trophy, StickyNote } from 'lucide-react';
import type { Contest, Platform, ContestFormat, Difficulty } from '@/lib/types';
import { createContest } from '@/lib/contests';
import { HttpError } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (contest: Contest) => void;
  defaultSeason?: string;
};

const PLATFORMS: Platform[] = [
  'Codeforces',
  'Vjudge',
  'Kattis',
  'SPOJ',
  'Leetcode',
  'Atcoder',
  'CSES',
  'HackerRank',
  'Other',
];

const FORMATS: ContestFormat[] = ['ICPC', 'IOI'];

function localToISO(local: string) {
  if (!local) return '';
  const dt = new Date(local);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString();
}

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

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  1: 'Intro: friendly on-ramp for new members; basics, easy implementation.',
  2: 'Easy–Medium: light CF Div. 4 vibe; straightforward ideas with small twists.',
  3: 'Medium: solid training (e.g., GPMX); classic topics, some multi-step reasoning.',
  4: 'Medium–Hard: big regional difficulty; harder constructions and tougher constraints.',
  5: 'Hard: World-Finals style; advanced techniques, rigorous problem-solving stamina.',
};

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
        className={`absolute left-1/2 top-[115%] -translate-x-1/2 transition-all duration-200 ${
          hintOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
        aria-live="polite"
      >
        <div className="max-w-[22rem] rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-lg">
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
        <span className="text-xs text-zinc-500">No hay tags aún, agrega algunos debajo.</span>
      )}
    </div>
  );
}

export default function ContestCreateDialog({
  open,
  onClose,
  onCreate,
  defaultSeason = '',
}: Props) {
  const initialFocusRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('Codeforces');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [format, setFormat] = useState<ContestFormat>('ICPC');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState(defaultSeason);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => initialFocusRef.current?.focus(), 20);
      setError(null);
    }
  }, [open]);

  function addTagFromInput() {
    const raw = tagInput.trim();
    if (!raw) return;
    if (tags.includes(raw)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, raw]);
    setTagInput('');
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function validate(): string | null {
    if (!title.trim()) return 'Title is required.';
    if (!url.trim() || !/^https?:\/\//i.test(url)) return 'Valid URL is required.';
    if (!startsAtLocal || !endsAtLocal) return 'Start and end times are required.';
    const s = new Date(startsAtLocal).getTime();
    const e = new Date(endsAtLocal).getTime();
    if (!(s < e)) return 'End time must be after start time.';
    if (!location.trim()) return 'Location is required.';
    if (!season.trim()) return 'Season is required (e.g., "Fall 2025").';
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
    setError(null);

    try {
      const created = await createContest({
        title: title.trim(),
        platform,
        url: url.trim(),
        tags,
        difficulty,
        format,
        start_at: localToISO(startsAtLocal),
        end_at: localToISO(endsAtLocal),
        location: location.trim(),
        season: season.trim(),
        notes
      });

      // Notify parent with the *server* version (id, etc.)
      onCreate(created);
      onClose();

      // reset form
      setTitle('');
      setUrl('');
      setTags([]);
      setTagInput('');
      setStartsAtLocal('');
      setEndsAtLocal('');
      setLocation('');
      setSeason(defaultSeason);
      setDifficulty(3);
      setPlatform('Codeforces');
      setFormat('ICPC');
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          setError('Debes iniciar sesión para crear concursos.');
        } else if (err.status === 403) {
          setError('Solo coaches y admins pueden crear concursos.');
        } else if (err.message) {
          setError(String(err.message));
        } else {
          setError('Ocurrió un error al crear el concurso.');
        }
      } else {
        setError('Ocurrió un error inesperado al crear el concurso.');
      }
    } finally {
      setSubmitting(false);
    }
  }


  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[min(680px,92vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />
        <div className="relative bg-zinc-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="text-zinc-200" size={18} />
              <h2 className="text-zinc-100 font-semibold">Crear Concurso</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-5 py-5 overflow-y-auto max-h-[76vh] space-y-5"
          >
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <Field label="Título">
              <input
                ref={initialFocusRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ICPC Algoritmia UP Selection contest"
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Plataforma">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full rounded-xl bg-zinc-800 text-zinc-100 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Formato">
                <div className="flex gap-2">
                  {FORMATS.map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setFormat(f)}
                      className={[
                        'px-3 py-2 rounded-xl border transition',
                        f === format
                          ? 'bg-[#C5133D]/20 border-[#C5133D]/50 text-zinc-100'
                          : 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-white/5',
                      ].join(' ')}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="URL" hint="Debe comenzar con: http(s)://">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-zinc-800 border border-white/10 flex-1 flex items-center">
                  <span className="pl-3 pr-1 text-zinc-400">
                    <LinkIcon size={16} />
                  </span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://codeforces.com/contest/1234"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Empieza" hint="Hora local">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <input
                    type="datetime-local"
                    value={startsAtLocal}
                    onChange={(e) => setStartsAtLocal(e.target.value)}
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>
              <Field label="Termina" hint="Hora local">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <input
                    type="datetime-local"
                    value={endsAtLocal}
                    onChange={(e) => setEndsAtLocal(e.target.value)}
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ubicación">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <MapPin size={16} className="text-zinc-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remoto / Campus UP / A-201"
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>
              <Field label="Temporada" hint='e.g., "Invierno 2025"'>
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="Fall 2025"
                  className="w-full rounded-xl bg-zinc-800 text-zinc-100 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
              </Field>
            </div>

            <Field label="Dificultad">
              <Stars value={difficulty} onChange={setDifficulty} />
            </Field>

            <Field label="Tags">
              <div className="space-y-2">
                <TagPills tags={tags} onRemove={removeTag} />
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3 flex-1">
                    <TagIcon size={16} className="text-zinc-400" />
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTagFromInput();
                        }
                      }}
                      placeholder='Agrega un tag y presiona Enter (e.g., "grafos")'
                      className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTagFromInput}
                    className="px-3 py-2 rounded-xl border border-white/10 text-zinc-100 bg-white/5 hover:bg-white/10 transition"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </Field>
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

            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
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
                {submitting ? 'Creando…' : 'Crear Concurso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
