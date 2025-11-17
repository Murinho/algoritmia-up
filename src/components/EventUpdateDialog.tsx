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
  Trash2,
} from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { updateEvent, deleteEvent, uploadEventBanner } from '@/lib/events';
import { HttpError } from '@/lib/api';

type Props = {
  open: boolean;
  onClose: () => void;
  event: EventItem | null;
  onUpdated?: (event: EventItem) => void;
  onDeleted?: (id: string) => void;
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
  previewUrl,
  onChange,
}: {
  value?: File | null;
  previewUrl?: string | null;
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

  const localPreview = value ? URL.createObjectURL(value) : null;
  const effectivePreview = localPreview || previewUrl || null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#C5133D]/20 border border-[#C5133D]/40 px-3 py-2 text-sm text-white hover:brightness-110"
      >
        <Upload size={16} /> Cambiar imagen
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      {effectivePreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effectivePreview}
          alt="Vista previa"
          className="mt-2 max-h-48 w-full rounded-xl border border-white/10 object-cover"
        />
      )}
    </div>
  );
}

function toLocalInputValue(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EventUpdateDialog({
  open,
  onClose,
  event,
  onUpdated,
  onDeleted,
}: Props) {
  const initialRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [videoCallLink, setVideoCallLink] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Prefill when dialog opens or event changes
  useEffect(() => {
    if (open && event) {
      setTitle(event.title || '');
      setStartsAtLocal(toLocalInputValue(event.startsAt));
      setEndsAtLocal(toLocalInputValue(event.endsAt));
      setLocation(event.location || '');
      setDescription(event.description || '');
      setCurrentImageUrl(event.image || '');
      setImageFile(null);
      setVideoCallLink(event.videoCallLink || '');
      setError(null);

      setTimeout(() => initialRef.current?.focus(), 20);
    }
  }, [open, event]);

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
    if (!event) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);

    try{
      // 1) Upload new banner if user selected one, otherwise keep current image
      let imageUrl = currentImageUrl || '';
      if (imageFile) {
        imageUrl = await uploadEventBanner(imageFile);
      }

      // 2) Update event in API
      const updated = await updateEvent(event.id.toString(), {
        title: title.trim(),
        starts_at: new Date(startsAtLocal).toISOString(),
        ends_at: new Date(endsAtLocal).toISOString(),
        location: location.trim(),
        description: description.trim(),
        image_url: imageUrl,
        video_call_link: videoCallLink.trim() || undefined,
      });

      // 3) Adapt DB row → EventItem
      const updatedEvent: EventItem = {
        id: updated.id,
        title: updated.title,
        startsAt: updated.starts_at ?? new Date(startsAtLocal).toISOString(),
        endsAt: updated.ends_at ?? new Date(endsAtLocal).toISOString(),
        location: updated.location ?? '',
        description: updated.description ?? '',
        image: updated.image_url ?? '',
        videoCallLink: updated.video_call_link ?? undefined,
      };

      onUpdated?.(updatedEvent);
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al actualizar el evento.');
      } else {
        setError('Ocurrió un error al actualizar el evento.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.'
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteEvent(event.id.toString());
      onDeleted?.(event.id.toString());
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Ocurrió un error al eliminar el evento.');
      } else {
        setError('Ocurrió un error al eliminar el evento.');
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[min(720px,94vw)] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to.transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-zinc-100">
            <CheckCircle size={18} />
            <h2 className="font-semibold">Editar Evento</h2>
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

          <Field
            label="Imagen del evento"
            hint="Sube una nueva imagen si quieres cambiar el banner actual"
          >
            <ImageUploader
              value={imageFile}
              previewUrl={currentImageUrl}
              onChange={setImageFile}
            />
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

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60"
            >
              <Trash2 size={16} />
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="rounded-xl bg-[#C5133D] px-4 py-2 text-white hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Actualizar Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
