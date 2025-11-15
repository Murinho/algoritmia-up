'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';

import CreateEventButton from './CreateEventButton';
import type { EventItem, UserRole } from '@/lib/types';
import { API_BASE } from '@/lib/api';

type CardContainerProps = React.HTMLAttributes<HTMLDivElement>;

function CardContainer({ className = '', ...rest }: CardContainerProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-all duration-300 hover:border-[#C5133D]/40 hover:shadow-xl ${className}`}
      {...rest}
    />
  );
}

// ---- Helpers for dates/times based on startsAt/endsAt ----

function getDateFromIso(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplayDate(event: EventItem): string {
  const d = getDateFromIso(event.startsAt);
  if (d) {
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return ''
}

function formatDisplayTime(event: EventItem): string {
  const start = getDateFromIso(event.startsAt);
  const end = getDateFromIso(event.endsAt);

  if (start && end) {
    const opts: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };
    const startStr = start.toLocaleTimeString('es-MX', opts);
    const endStr = end.toLocaleTimeString('es-MX', opts);
    return `${startStr} – ${endStr}`;
  }

  if (start) {
    return start.toLocaleTimeString('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return ''
}

// Build Google Calendar dates param using startsAt/endsAt if possible
function buildCalendarDates(event: EventItem): string | null {
  let start = getDateFromIso(event.startsAt);
  let end = getDateFromIso(event.endsAt);

  // If there is no endsAt but we have a start, default to +2h
  if (start && !end) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  if (!start || !end) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const da = d.getDate();
    const h = d.getHours();
    const mi = d.getMinutes();
    return `${y}${pad(m)}${pad(da)}T${pad(h)}${pad(mi)}00`;
  };

  const startStr = formatLocal(start);
  const endStr = formatLocal(end);

  return `${startStr}/${endStr}`;
}

// Build the Google Calendar URL for an event
function buildGoogleCalendarUrl(event: EventItem) {
  const base = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details:
      event.description,
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
      {/* Image / badge / overlay */}
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

      {/* Body */}
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
        </div>

        {/* Open Google Calendar "create event" in a new tab */}
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
      title: 'Copa Algoritmia',
      startsAt: '2024-04-05T14:00:00',
      endsAt: '2024-04-05T17:00:00',
      location: 'Aula Byte C001',
      description:
        'Demuestra tus habilidades resolviendo problemas algorítmicos complejos.',
      image:
        'https://images.unsplash.com/photo-1565687981296-535f09db714e?q=80&w=1170&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Workshop: Segment Trees',
      startsAt: '2024-03-22T16:00:00',
      endsAt: '2024-03-22T19:00:00',
      location: 'Laboratorio de Sistemas',
      description:
        'Aprende los usos y aplicaciones de Segment Trees en programación competitiva.',
      image:
        'https://images.unsplash.com/photo-1750020113706-b2238de0f18f?q=80&w=1332&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Hackathon UP 2025',
      startsAt: '2024-03-15T09:00:00',
      endsAt: '2024-03-15T18:00:00',
      location: 'Centro de Innovación UP',
      description:
        '48 horas de programación intensiva donde desarrollarás soluciones innovadoras.',
      image:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1169&auto=format&fit=crop',
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
        {/* Header */}
        <div className="mb-10 text-center">
          <h2
            id="about-title"
            className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl"
          >
            Eventos y <span className="text-[#C5133D]">Actividades</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
            Únete a nuestros eventos y desarrolla tus habilidades junto a la
            comunidad de programadores más activa de la Universidad Panamericana.
          </p>
        </div>

        {/* Create Button — only for coach/admin */}
        {canCreate && (
          <div className="mb-10 flex justify-end">
            <CreateEventButton
              userRole={userRole}
              onCreate={(newEvent) => setEvents((prev) => [newEvent, ...prev])}
            />
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
