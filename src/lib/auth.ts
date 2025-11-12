import { postJSON } from "./api";
import type { LoginResponse } from "./types";

export async function loginLocal(email: string, password: string, remember = false): Promise<LoginResponse> {
  // FastAPI expects: { email, password, create_session, ttl_minutes }
  return postJSON<LoginResponse>("/auth/login", {
    email,
    password,
    create_session: true,
    ttl_minutes: remember ? 60 * 24 * 30 : 60 * 24, // 30d or 1d
  });
}
