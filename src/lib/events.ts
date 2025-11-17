import { API_BASE, HttpError } from '@/lib/api';

export type EventCreatePayload = {
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  description: string;
  image_url: string;
  video_call_link?: string;
};

export type EventRow = {
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

export async function uploadEventBanner(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/events/upload-banner`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al subir la imagen");

  const data = await res.json();
  return data.url; // "/static/event_banners/xxx.jpg"
}

export async function createEvent(payload: EventCreatePayload): Promise<EventRow> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // so auth cookie is sent
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = 'No se pudo crear el evento.';
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore JSON parse error
    }
    throw new HttpError(res.status, detail);
  }

  return (await res.json()) as EventRow;
}

// ----------------------------
// Update an event (PATCH)
// ----------------------------
export async function updateEvent(
  eventId: string,
  data: {
    title?: string;
    starts_at?: string;
    ends_at?: string;
    location?: string;
    description?: string;
    image_url?: string;
    video_call_link?: string | undefined;
  }
) {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // required for session cookie
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let detail = 'No se pudo actualizar el evento.';
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {}
    throw new HttpError(res.status, detail);
  }

  return res.json();
}

// ----------------------------
// Delete an event (DELETE)
// ----------------------------
export async function deleteEvent(eventId: string) {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    let detail = 'No se pudo eliminar el evento.';
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {}
    throw new HttpError(res.status, detail);
  }

  return res.json(); // { deleted: true }
}
