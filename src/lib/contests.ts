import { postJSON } from './api';
import { API_BASE, HttpError } from '@/lib/api';
import type { Platform, ContestFormat, Difficulty, Contest } from './types';

export type CreateContestPayload = {
  title: string;
  platform: Platform;
  url: string;
  tags: string[];
  difficulty: Difficulty;
  format: ContestFormat;
  start_at: string; // ISO string
  end_at: string;   // ISO string
  location: string;
  season: string;
  notes: string;
};

type ApiContestRow = {
  id: number;
  title: string;
  platform: string;
  url: string;
  tags: string[] | null;
  difficulty: number | null;
  added_by: number | null;
  format: string;
  start_at: string;
  end_at: string;
  location: string | null;
  season: string | null;
  notes: string | null;
};

function toUiContest(row: ApiContestRow): Contest {
  return {
    id: String(row.id),
    title: row.title,
    platform: row.platform as Platform,
    url: row.url,
    tags: row.tags ?? [],
    difficulty: (row.difficulty ?? 3) as Difficulty,
    format: row.format as ContestFormat,
    startsAt: row.start_at,
    endsAt: row.end_at,
    location: row.location ?? '',
    season: row.season ?? '',
  };
}

export async function createContest(payload: CreateContestPayload): Promise<Contest> {
  const row = await postJSON<ApiContestRow>('/contests', payload);
  return toUiContest(row);
}

export async function updateContest(
  contestId: string,
  data: {
    title?: string;
    platform?: Platform;
    url?: string;
    tags?: string[];
    difficulty?: Difficulty;
    format?: ContestFormat;
    start_at?: string; // ISO
    end_at?: string;   // ISO
    location?: string;
    season?: string;
    notes?: string;
  }
): Promise<Contest> {
  const res = await fetch(`${API_BASE}/contests/${contestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // required for session cookie
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let detail = 'No se pudo actualizar el concurso.';
    let errorBody: unknown = null;

    try {
      const json: unknown = await res.json();
      errorBody = json;
      if (json && typeof json === 'object' && 'detail' in json && typeof (json as any).detail === 'string') {
        detail = (json as any).detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new HttpError(res.status, detail, errorBody);
  }

  const json = (await res.json()) as ApiContestRow;
  return toUiContest(json);
}

export async function deleteContest(contestId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/contests/${contestId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    let detail = 'No se pudo eliminar el concurso.';
    let errorBody: unknown = null;

    try {
      const json: unknown = await res.json();
      errorBody = json;
      if (json && typeof json === 'object' && 'detail' in json && typeof (json as any).detail === 'string') {
        detail = (json as any).detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new HttpError(res.status, detail, errorBody);
  }

  return res.json(); // e.g. { deleted: true }
}
