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
