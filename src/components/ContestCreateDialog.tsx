// app/components/ContestCreateDialog.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Calendar, Link as LinkIcon, Tag as TagIcon, Star, MapPin, Trophy } from 'lucide-react';

export type Platform =
  | 'Codeforces'
  | 'Vjudge'
  | 'Kattis'
  | 'SPOJ'
  | 'Leetcode'
  | 'Atcoder'
  | 'CSES'
  | 'HackerRank'
  | 'Other';

export type ContestFormat = 'ICPC' | 'IOI';

export type Contest = {
  id: string;
  title: string;
  platform: Platform;
  url: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  format: ContestFormat;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  location: string;
  season: string;   // e.g. "Fall 2025"
};

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

// ——— Helpers ———
function localToISO(local: string) {
  // local should be "YYYY-MM-DDTHH:mm"
  if (!local) return '';
  const dt = new Date(local);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString();
}

function isoToLocal(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ——— Field Shell ———
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

// ——— Stars Input (with click-to-describe) ———
const DIFFICULTY_DESCRIPTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
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
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const hideRef = useRef<number | null>(null);

  function handleClick(v: 1 | 2 | 3 | 4 | 5) {
    onChange(v);
    // show the hint briefly
    setHintOpen(true);
    if (hideRef.current) window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => setHintOpen(false), 3000);
  }

  // cleanup on unmount
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

      {/* Floating hint */}
      <div
        className={`absolute left-1/2 top-[115%] -translate-x-1/2 transition-all duration-200
        ${hintOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
        aria-live="polite"
      >
        <div className="max-w-[22rem] rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-lg">
          <p className="text-xs text-zinc-200">
            <span className="font-medium">{value} {value === 1 ? 'Star' : 'Stars'}:</span>{' '}
            {DIFFICULTY_DESCRIPTIONS[value]}
          </p>
        </div>
      </div>
    </div>
  );
}


// ——— Tag Pills ———
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

// ——— Main Component ———
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
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [format, setFormat] = useState<ContestFormat>('ICPC');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState(defaultSeason);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // reset when open
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
    try {
      const contest: Contest = {
        id: genId(),
        title: title.trim(),
        platform,
        url: url.trim(),
        tags,
        difficulty,
        format,
        startsAt: localToISO(startsAtLocal),
        endsAt: localToISO(endsAtLocal),
        location: location.trim(),
        season: season.trim(),
      };
      onCreate(contest);
      onClose();
      // reset minimal fields for next open
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
      setError(null);
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[min(680px,92vw)] max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />
        <div className="relative bg-zinc-900">
          {/* Header */}
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

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto max-h-[76vh] space-y-5">
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
                      placeholder='Add a tag and press Enter (e.g., "graphs")'
                      className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTagFromInput}
                    className="px-3 py-2 rounded-xl border border-white/10 text-zinc-100 bg-white/5 hover:bg-white/10 transition"
                  >
                    Add
                  </button>
                </div>
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
                {submitting ? 'Creando…' : 'Create Concurso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
