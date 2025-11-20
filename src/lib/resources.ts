import { postJSON } from './api';
import type { ResourceType, Difficulty, Resource } from './types';
import { API_BASE, HttpError } from '@/lib/api';

export type CreateResourcePayload = {
  type: ResourceType;
  title: string;
  url: string;
  tags: string[];
  difficulty: Difficulty;
  notes: string;
};

type ApiResourceRow = {
  id: number;
  title: string;
  type: string;
  url: string;
  tags: string[] | null;
  difficulty: number | null;
  added_by: string | null;
  notes: string | null;
  created_at: string | null;
};

function toUiResource(row: ApiResourceRow): Resource {
  return {
    id: String(row.id),
    title: row.title,
    type: row.type as ResourceType,
    url: row.url,
    tags: row.tags ?? [],
    difficulty: (row.difficulty ?? 3) as Difficulty,
    addedBy: row.added_by ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at ?? '',
  };
}

export async function createResource(payload: CreateResourcePayload): Promise<Resource> {
  const row = await postJSON<ApiResourceRow>('/resources', payload);
  return toUiResource(row);
}

export async function updateResource(
  resourceId: string,
  data: {
    title?: string;
    type?: string;
    url?: string;
    tags?: string[];
    difficulty?: Difficulty;
    notes?: string;
  }
): Promise<Resource> {
  const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // required for session cookie
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let detail = "No se pudo actualizar el recurso.";
    let errorBody: unknown = null;

    try {
      const json: unknown = await res.json();
      errorBody = json;

      if (json && typeof json === "object" && "detail" in json) {
        const withDetail = json as { detail?: unknown };
        if (typeof withDetail.detail === "string") {
          detail = withDetail.detail;
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    const err = new HttpError(res.status, detail, errorBody);
    throw err;
  }

  const json = (await res.json()) as ApiResourceRow;
  return toUiResource(json);
}

export async function deleteResource(resourceId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    let detail = "No se pudo eliminar el recurso.";
    let errorBody: unknown = null;

    try {
      const json: unknown = await res.json();
      errorBody = json;

      if (json && typeof json === "object" && "detail" in json) {
        const withDetail = json as { detail?: unknown };
        if (typeof withDetail.detail === "string") {
          detail = withDetail.detail;
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new HttpError(res.status, detail, errorBody);
  }

  return res.json(); // e.g. { deleted: true }
}
