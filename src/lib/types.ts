export type Identity = {
  id: number;
  user_id: number;
  provider: string;
  provider_uid: string | null;
  email: string | null;
  created_at: string;
};

export type User = {
  id: number;
  full_name: string;
  email: string;
  codeforces_handle: string;
  birthdate: string;
  degree_program: string;
  entry_year: number;
  country: string;
  profile_image_url: string | null;
  created_at: string;
};

export type Session = {
  id: number;
  user_id: number;
  expires_at: string;
  created_at: string;
};

export type LoginResponse = {
  identity: Omit<Identity, "password_hash">;
  user: User;
  session?: Session;
};

export type SignUpPayload = {
  full_name: string;
  preferred_name: string;
  email: string;
  codeforces_handle: string;
  birthdate: string;
  degree_program: string;
  entry_year: number;
  entry_month: number;
  grad_year: number;
  grad_month: number;
  country: string;
  profile_image_url: string | null;
  password: string;
};

export type SignUpResponse = {
  user: User;
  identity: Identity;
  email_verification_sent: boolean;
};

export type Platform =
  | "Codeforces"
  | "Vjudge"
  | "Kattis"
  | "SPOJ"
  | "Leetcode"
  | "Atcoder"
  | "CSES"
  | "HackerRank"
  | "Other";

export type ContestFormat = "ICPC" | "IOI";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type UserRole = "user" | "coach" | "admin";

export type Contest = {
  id: string;
  title: string;
  platform: Platform;
  url: string;
  tags: string[];
  difficulty: Difficulty;
  format: ContestFormat;
  startsAt: string; // ISO
  endsAt: string; // ISO
  location: string;
  season: string; // e.g. "Fall 2025"
  notes?: string;
};

export type ResourceType =
  | "pdf"
  | "blog"
  | "notebook"
  | "link"
  | "sheet"
  | "slideshow"
  | "video"
  | "book"
  | "repo"
  | "article"
  | "other";

export type Resource = {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  tags: string[];
  difficulty: Difficulty;
  addedBy: string;
  createdAt: string; // ISO string
  notes?: string;
};

export type EventItem = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  image: string;
  videoCallLink?: string;
};
