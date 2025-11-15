'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Video } from 'lucide-react';

import CreateEventButton from './CreateEventButton';
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

function EventCard({ event }: { event: EventItem }) {
  const calendarUrl = buildGoogleCalendarUrl(event);

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

export default function EventsSection() {
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 1,
      title: 'Clase Inaugural Algoritmia UP',
      startsAt: '2024-04-05T14:00:00',
      endsAt: '2024-04-05T16:00:00',
      location: 'Aula Byte C001',
      description: 'Bienvenida oficial al semestre y dinámicas de integración.',
      image:
        'https://images.unsplash.com/photo-1565687981296-535f09db714e?q=80&w=1170&auto=format&fit=crop',
      videoCallLink: undefined,
    },
  ]);

  const [userRole, setUserRole] = useState<UserRole | null>(null);

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

  const canCreate = userRole === 'coach' || userRole === 'admin';

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
            <CreateEventButton
              userRole={userRole}
              onCreate={(newEvent) => setEvents((prev) => [newEvent, ...prev])}
            />
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
