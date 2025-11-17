'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Video, MoreVertical } from 'lucide-react';

import CreateEventButton from './CreateEventButton';
import EventUpdateDialog from './EventUpdateDialog'; // ⬅️ make sure this path is correct
import type { EventItem, UserRole } from '@/lib/types';
import { API_BASE } from '@/lib/api';

function CardContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props;
  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-all hover:border-[#C5133D]/40 hover:shadow-xl ${className}`}
      {...rest}
    />
  );
}

// ---- Helpers for dates/times ----

function parseIso(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplayDate(event: EventItem): string {
  const d = parseIso(event.startsAt);
  if (!d) return '';
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDisplayTime(event: EventItem): string {
  const start = parseIso(event.startsAt);
  const end = parseIso(event.endsAt);
  if (!start || !end) return '';

  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };
  return `${start.toLocaleTimeString('es-MX', opts)} – ${end.toLocaleTimeString(
    'es-MX',
    opts,
  )}`;
}

function buildCalendarDates(event: EventItem): string | null {
  const start = parseIso(event.startsAt);
  const end = parseIso(event.endsAt);
  if (!start || !end) return null;

  const pad = (n: number) => `${n}`.padStart(2, '0');

  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
      d.getHours(),
    )}${pad(d.getMinutes())}00`;

  return `${fmt(start)}/${fmt(end)}`;
}

function buildGoogleCalendarUrl(event: EventItem) {
  const base = 'https://calendar.google.com/calendar/render';

  let details = event.description ?? '';
  if (event.videoCallLink) {
    details += `\n\nVideollamada: ${event.videoCallLink}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details,
    location: event.location,
  });

  const dates = buildCalendarDates(event);
  if (dates) {
    params.set('dates', dates);
  }

  return `${base}?${params.toString()}`;
}

// ---- Status label logic ----

type EventStatus = 'Ahora' | 'Hoy' | 'Próximamente';

function getEventStatus(event: EventItem): EventStatus {
  const now = new Date();
  const start = parseIso(event.startsAt);
  const end = parseIso(event.endsAt);

  if (!start || !end) return 'Próximamente';

  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  if (sameDay && now >= start && now <= end) {
    return 'Ahora';
  }

  if (sameDay) {
    return 'Hoy';
  }

  return 'Próximamente';
}

function statusClasses(status: EventStatus): string {
  switch (status) {
    case 'Ahora': // GREEN
      return (
        'bg-green-200 text-green-800 ' + // lighter fill + readable text
        'border border-green-600/40 ' + // darker outline
        'shadow-sm'
      );

    case 'Hoy': // YELLOW
      return (
        'bg-yellow-200 text-yellow-800 ' +
        'border border-yellow-600/40 ' +
        'shadow-sm'
      );

    case 'Próximamente': // RED
    default:
      return (
        'bg-red-200 text-red-800 ' +
        'border border-red-700/40 ' +
        'shadow-sm'
      );
  }
}

function EventCard({
  event,
  canEdit,
  onEdit,
}: {
  event: EventItem;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const calendarUrl = buildGoogleCalendarUrl(event);
  const status = getEventStatus(event);

  return (
    <CardContainer className="group">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Edit button (top-left) - only for coach/admin */}
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute left-3 top-3 inline-flex items-center justify-center rounded-full bg-black/60 p-1.5 text-white shadow-md hover:bg-black/80"
            aria-label="Editar o eliminar evento"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}

        {/* Status label in top-right corner */}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-md ${statusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="p-5">
        <h3 className="mb-2 text-xl font-semibold text-black transition-colors group-hover:text-[#C5133D]">
          {event.title}
        </h3>

        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          {event.description}
        </p>

        <div className="mb-5 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDisplayDate(event)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDisplayTime(event)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>

          {event.videoCallLink && (
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <a
                href={event.videoCallLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5133D] underline underline-offset-2 hover:text-[#a30f31]"
              >
                Videollamada
              </a>
            </div>
          )}
        </div>

        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group/button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C5133D] focus:outline-none focus:ring-2 focus:ring-[#C5133D]/40"
        >
          Agregar a Google Calendar
          <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
        </a>
      </div>
    </CardContainer>
  );
}

// Simple placeholder card for when there are fewer than 3 real events
function PlaceholderCard() {
  return (
    <CardContainer className="flex flex-col justify-between">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200" />
      <div className="p-5">
        <h3 className="mb-2 text-xl font-semibold text-gray-700">
          Próximamente eventos de Algoritmia UP
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          Algoritmia tendrá nuevos eventos en el futuro, ¡espéralos!
        </p>
        <p className="text-xs text-gray-400">
          Sigue atento a nuestras redes y al sitio para conocer las próximas actividades.
        </p>
      </div>
    </CardContainer>
  );
}

// Shape of the backend row as returned by /events
type EventRow = {
  id: number;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
  video_call_link: string | null;
  created_at: string;
};

function adaptEventRow(row: EventRow): EventItem {
  const startsAt = row.starts_at ?? row.created_at;
  const endsAt = row.ends_at ?? row.starts_at ?? row.created_at;

  let image = row.image_url ?? '';
  if (image && !image.startsWith('http')) {
    const base = API_BASE.replace(/\/$/, '');
    image = `${base}${image}`;
  }
  if (!image) {
    image =
      'https://images.unsplash.com/photo-1565687981296-535f09db714e?q=80&w=1170&auto=format&fit=crop';
  }

  return {
    id: row.id,
    title: row.title,
    startsAt,
    endsAt,
    location: row.location ?? 'Por confirmar',
    description: row.description ?? '',
    image,
    videoCallLink: row.video_call_link ?? undefined,
  };
}

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Load role
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });
        if (!res.ok) {
          if (!cancelled) setUserRole(null);
          return;
        }
        const data = await res.json();
        const role = data.user?.role as UserRole | undefined;
        if (!cancelled) {
          setUserRole(role ?? 'user');
        }
      } catch {
        if (!cancelled) setUserRole(null);
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load events from backend
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/events?upcoming_only=true`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('No se pudieron cargar los eventos.');
        }

        const data = await res.json();
        const rows = (data.items ?? []) as EventRow[];

        if (!cancelled) {
          const items = rows.map(adaptEventRow);

          // sort by earliest upcoming (ascending by startsAt)
          items.sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          );

          setEvents(items);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError('No se pudieron cargar los eventos.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = userRole === 'coach' || userRole === 'admin';
  const canEdit = canCreate;

  // Keep only the earliest 3 events
  const earliestThree = events.slice(0, 3);
  const placeholderCount = Math.max(0, 3 - earliestThree.length);

  return (
    <section id="events" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl">
            Eventos y <span className="text-[#C5133D]">Actividades</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
            Únete a nuestros eventos y desarrolla tus habilidades junto a la comunidad de
            programadores más activa de la Universidad Panamericana.
          </p>
        </div>

        {canCreate && (
          <div className="mb-10 flex justify-end">
            <CreateEventButton userRole={userRole} />
          </div>
        )}

        {loading && (
          <p className="text-center text-gray-500">Cargando eventos…</p>
        )}

        {loadError && !loading && (
          <p className="text-center text-sm text-red-500">{loadError}</p>
        )}

        {!loading && !loadError && (
          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {earliestThree.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                canEdit={canEdit}
                onEdit={() => {
                  setSelectedEvent(event);
                  setUpdateOpen(true);
                }}
              />
            ))}

            {Array.from({ length: placeholderCount }).map((_, idx) => (
              <PlaceholderCard key={`placeholder-${idx}`} />
            ))}
          </div>
        )}
      </div>

      {/* Update dialog for editing/deleting events */}
      <EventUpdateDialog
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        event={selectedEvent}
        onUpdated={(updated) => {
          setEvents((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e)),
          );
        }}
      />
    </section>
  );
}
