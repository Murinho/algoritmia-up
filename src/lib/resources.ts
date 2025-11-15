import { postJSON } from './api';
import type { ResourceType, Difficulty, Resource } from './types';

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
