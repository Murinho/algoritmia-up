'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Upload,
} from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { createEvent, uploadEventBanner } from '@/lib/events';
import { HttpError } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (event: EventItem) => void;
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
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ImageUploader({
  value,
  onChange,
}: {
  value?: File | null;
  onChange: (v: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }

    setError(null);
    onChange(file);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#C5133D]/20 border border-[#C5133D]/40 px-3 py-2 text-sm text-white hover:brightness-110"
      >
        <Upload size={16} /> Subir Imagen
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={URL.createObjectURL(value)}
          alt="Vista previa"
          className="mt-2 max-h-48 w-full rounded-xl border border-white/10 object-cover"
        />
      )}
    </div>
  );
}

export default function EventCreateDialog({ open, onClose, onCreate }: Props) {
  const initialRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoCallLink, setVideoCallLink] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => initialRef.current?.focus(), 20);
      setError(null);
    }
  }, [open]);

  function resetForm() {
    setTitle('');
    setStartsAtLocal('');
    setEndsAtLocal('');
    setLocation('');
    setDescription('');
    setImageFile(null);
    setVideoCallLink('');
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
    if (!imageFile) return 'Debes subir una imagen para el evento.';

    const link = videoCallLink.trim();
    if (link) {
      const isGoogleMeet = /^https:\/\/meet\.google\.com\/.+/i.test(link);
      const isZoom = /^https:\/\/[\w.-]*zoom\.us\/.+/i.test(link);
      if (!isGoogleMeet && !isZoom) {
        return 'El enlace de videollamada no es válido. Debe ser un link de Google Meet o Zoom.';
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    if (!imageFile) {
      setError('Debes subir una imagen para el evento.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Subir banner a /events/upload-banner
      const imageUrl = await uploadEventBanner(imageFile);

      // 2) Crear el evento en la API
      const created = await createEvent({
        title: title.trim(),
        starts_at: new Date(startsAtLocal).toISOString(),
        ends_at: new Date(endsAtLocal).toISOString(),
        location: location.trim(),
        description: description.trim(),
        image_url: imageUrl,
        video_call_link: videoCallLink.trim() || undefined,
      });

      // 3) Adaptar fila de DB → EventItem para el frontend
      const event: EventItem = {
        id: created.id,
        title: created.title,
        startsAt: created.starts_at ?? new Date(startsAtLocal).toISOString(),
        endsAt: created.ends_at ?? new Date(endsAtLocal).toISOString(),
        location: created.location ?? '',
        description: created.description ?? '',
        image: created.image_url ?? '',
        videoCallLink: created.video_call_link ?? undefined,
      };

      onCreate(event);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al crear el evento.');
      } else {
        setError('Ocurrió un error al crear el evento.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[min(720px,94vw)] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to.transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-zinc-100">
            <CheckCircle size={18} />
            <h2 className="font-semibold">Crear Evento</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            aria-label="Cerrar diálogo"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-5 py-5 max-h-[78vh] overflow-y-auto"
        >
          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <Field label="Título">
            <input
              ref={initialRef}
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

          <Field label="Ubicación">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800 px-3">
              <MapPin size={16} className="text-zinc-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remoto / Campus UP / A-201"
                className="w-full bg-transparent py-2 text-zinc-100 focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Descripción">
            <div className="rounded-xl border border-white/10 bg-zinc-800 px-3">
              <div className="flex items-start gap-2">
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

          <Field label="Imagen del evento" hint="Sube una imagen en formato JPG o PNG">
            <ImageUploader value={imageFile} onChange={setImageFile} />
          </Field>

          <Field
            label="Enlace de videollamada (opcional)"
            hint="Google Meet o Zoom"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-zinc-800">
                <span className="pl-3 pr-1 text-zinc-400">
                  <LinkIcon size={16} />
                </span>
                <input
                  value={videoCallLink}
                  onChange={(e) => setVideoCallLink(e.target.value)}
                  placeholder="https://meet.google.com/... o https://up.zoom.us/..."
                  className="w-full bg-transparent px-2 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </Field>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#C5133D] px-4 py-2 text-white hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? 'Creando…' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
