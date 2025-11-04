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
  Image as ImageIcon,
} from 'lucide-react';

export type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string; // base64 or uploaded file URL
  status: 'Próximo' | 'Disponible' | 'Abierto';
  participants: string;
  href?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (event: EventItem) => void;
};

function genIdNumber() {
  return Date.now();
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

const STATUSES: Array<EventItem['status']> = ['Próximo', 'Disponible', 'Abierto'];

// ——— Small Upload Field Component ———
function ImageUploader({
  onChange,
  value,
}: {
  value?: string;
  onChange: (base64: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
          className="inline-flex items-center gap-2 rounded-xl bg-[#C5133D]/20 border border-[#C5133D]/40 px-3 py-2 text-sm text-white hover:brightness-110 transition"
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
            className="max-h-48 w-full object-cover rounded-lg"
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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [href, setHref] = useState('');
  const [status, setStatus] = useState<EventItem['status']>('Próximo');
  const [participants, setParticipants] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => initialFocusRef.current?.focus(), 20);
      setError(null);
    }
  }, [open]);

  function validate(): string | null {
    if (!title.trim()) return 'El título es obligatorio.';
    if (!date) return 'La fecha es obligatoria.';
    if (!time) return 'La hora es obligatoria.';
    if (!location.trim()) return 'La ubicación es obligatoria.';
    if (!description.trim()) return 'La descripción es obligatoria.';
    if (!image) return 'Debes subir una imagen para el evento.';
    if (href && !/^https?:\/\//i.test(href)) return 'El enlace (opcional) debe ser un URL válido.';
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
      const eventItem: EventItem = {
        id: genIdNumber(),
        title: title.trim(),
        date,
        time,
        location: location.trim(),
        description: description.trim(),
        image,
        status,
        participants: participants.trim(),
        href: href.trim() || undefined,
      };
      onCreate(eventItem);
      onClose();

      // Reset
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
      setImage('');
      setHref('');
      setStatus('Próximo');
      setParticipants('');
      setError(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[min(720px,94vw)] max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-pink-500/60 to-transparent" />
        <div className="relative bg-zinc-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-zinc-200" size={18} />
              <h2 className="text-zinc-100 font-semibold">Crear Evento</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Cerrar diálogo"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto max-h-[78vh] space-y-5">
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
                placeholder="Kickoff Algoritmia UP — Temporada 2025"
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Fecha">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>

              <Field label="Hora">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <Clock size={16} className="text-zinc-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
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

              <Field label="Estado">
                <div className="flex gap-2">
                  {['Próximo', 'Disponible', 'Abierto'].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setStatus(s as EventItem['status'])}
                      className={[
                        'px-3 py-2 rounded-xl border transition',
                        s === status
                          ? 'bg-[#C5133D]/20 border-[#C5133D]/50 text-zinc-100'
                          : 'bg-zinc-800 border-white/10 text-zinc-300 hover:bg-white/5',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Descripción">
              <div className="rounded-xl bg-zinc-800 border border-white/10 px-3">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-zinc-400 mt-2" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Presentación del club, dinámica del semestre y retos de programación en vivo."
                    rows={4}
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none resize-y"
                  />
                </div>
              </div>
            </Field>

            <Field label="Imagen del evento" hint="Sube una imagen en formato JPG o PNG">
              <ImageUploader value={image} onChange={setImage} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Enlace (opcional)" hint="http(s)://">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-zinc-800 border border-white/10 flex-1 flex items-center">
                    <span className="pl-3 pr-1 text-zinc-400">
                      <LinkIcon size={16} />
                    </span>
                    <input
                      value={href}
                      onChange={(e) => setHref(e.target.value)}
                      placeholder="https://algoritmia.up/evento/kickoff"
                      className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-2 py-2 focus:outline-none"
                    />
                  </div>
                </div>
              </Field>

              <Field label="Participantes" hint='Ej.: "30 registrados" o "25/50"'>
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-3">
                  <Users size={16} className="text-zinc-400" />
                  <input
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="30 registrados"
                    className="w-full bg-transparent text-zinc-100 py-2 focus:outline-none"
                  />
                </div>
              </Field>
            </div>

            {/* Footer */}
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
                {submitting ? 'Creando…' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
