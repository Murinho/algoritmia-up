import { postJSON } from './api';
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

// 👇 adapt to your frontend `Contest` shape
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
