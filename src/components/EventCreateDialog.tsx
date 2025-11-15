'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Users,
  FileText,
  CheckCircle,
  Upload,
} from 'lucide-react';
import type { EventItem } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (event: EventItem) => void;
};

function genIdNumber() {
  return Date.now();
}

type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, hint, children }: FieldProps) {
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

// ——— Small Upload Field Component ———
type ImageUploaderProps = {
  value?: string;
  onChange: (base64: string) => void;
};

function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#C5133D]/40 bg-[#C5133D]/20 px-3 py-2 text-sm text-white transition hover:brightness-110"
        >
          <Upload size={16} />
          Subir Imagen
        </button>
        {value && (
          <span className="text-xs text-zinc-400">
            {value.startsWith('data:') ? 'Imagen seleccionada' : value}
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-300">{error}</p>}

      {value && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Vista previa"
            className="max-h-48 w-full rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ——— Main Component ———
export default function EventCreateDialog({ open, onClose, onCreate }: Props) {
  const initialFocusRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState(''); // "YYYY-MM-DDTHH:MM"
  const [endsAtLocal, setEndsAtLocal] = useState('');   // "YYYY-MM-DDTHH:MM"
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [href, setHref] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => initialFocusRef.current?.focus(), 20);
      setError(null);
    }
  }, [open]);

  function resetForm() {
    setTitle('');
    setStartsAtLocal('');
    setEndsAtLocal('');
    setLocation('');
    setDescription('');
    setImage('');
    setHref('');
    setError(null);
  }

  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.';
    if (!startsAtLocal) return 'La fecha y hora de inicio son obligatorias.';
    if (!endsAtLocal) return 'La fecha y hora de fin son obligatorias.';

    const start = new Date(startsAtLocal);
    const end = new Date(endsAtLocal);

    if (Number.isNaN(start.getTime())) return 'La fecha/hora de inicio no es válida.';
    if (Number.isNaN(end.getTime())) return 'La fecha/hora de fin no es válida.';
    if (end <= start) return 'La fecha/hora de fin debe ser posterior a la de inicio.';

    if (!location.trim()) return 'La ubicación es obligatoria.';
    if (!description.trim()) return 'La descripción es obligatoria.';
    if (!image) return 'Debes subir una imagen para el evento.';
    if (href && !/^https?:\/\//i.test(href)) {
      return 'El enlace (opcional) debe ser un URL válido.';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const startsAt = new Date(startsAtLocal).toISOString();
    const endsAt = new Date(endsAtLocal).toISOString();

    setSubmitting(true);
    try {
      const eventItem: EventItem = {
        id: genIdNumber(),
        title: title.trim(),
        startsAt,
        endsAt,
        location: location.trim(),
        description: description.trim(),
        image,
        href: href.trim() || undefined,
      };

      onCreate(eventItem);
      onClose();
      resetForm();
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-[min(720px,94vw)] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />
        <div className="relative bg-zinc-900">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-zinc-200" size={18} />
              <h2 className="font-semibold text-zinc-100">Crear Evento</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
              aria-label="Cerrar diálogo"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[78vh] space-y-5 overflow-y-auto px-5 py-5"
          >
            {error && (
              <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <Field label="Título">
              <input
                ref={initialFocusRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kickoff Algoritmia UP — Temporada 2025"
                className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Fecha y hora de inicio">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800 px-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <input
                    type="datetime-local"
                    value={startsAtLocal}
                    onChange={(e) => setStartsAtLocal(e.target.value)}
                    className="w-full bg-transparent py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </Field>

              <Field label="Fecha y hora de fin">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800 px-3">
                  <Clock size={16} className="text-zinc-400" />
                  <input
                    type="datetime-local"
                    value={endsAtLocal}
                    onChange={(e) => setEndsAtLocal(e.target.value)}
                    className="w-full bg-transparent py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Ubicación">
                <div className="flex items-center gap-2 rounded-xl border border.white/10 bg-zinc-800 px-3">
                  <MapPin size={16} className="text-zinc-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remoto / Campus UP / A-201"
                    className="w-full bg-transparent py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </Field>

              <Field label="Enlace (opcional)" hint="http(s)://">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-zinc-800">
                    <span className="pl-3 pr-1 text-zinc-400">
                      <LinkIcon size={16} />
                    </span>
                    <input
                      value={href}
                      onChange={(e) => setHref(e.target.value)}
                      placeholder="https://algoritmia.up/evento/kickoff"
                      className="w-full bg-transparent px-2 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>
              </Field>
            </div>

            <Field label="Descripción">
              <div className="rounded-xl border border-white/10 bg-zinc-800 px-3">
                <div className="flex items.start gap-2">
                  <FileText size={16} className="mt-2 text-zinc-400" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Presentación del club, dinámica del semestre y retos de programación en vivo."
                    rows={4}
                    className="w-full resize-y bg-transparent py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>
            </Field>

            <Field
              label="Imagen del evento"
              hint="Sube una imagen en formato JPG o PNG"
            >
              <ImageUploader value={image} onChange={setImage} />
            </Field>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:bg.white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#C5133D] px-4 py-2 text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? 'Creando…' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
