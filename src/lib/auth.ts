// src/lib/auth.ts
import { postJSON } from "./api";
import type { LoginResponse, SignUpPayload, SignUpResponse } from "./types";

export async function loginLocal(
  email: string,
  password: string,
  remember = false
): Promise<LoginResponse> {
  const ttl_minutes = remember ? 60 * 24 * 30 : 60 * 24;

  return postJSON<LoginResponse>(
    "/auth/login",
    {
      email,
      password,
      create_session: true,
      ttl_minutes,
    },
    {
      credentials: "include",
    }
  );
}

export async function signupLocal(
  payload: SignUpPayload
): Promise<SignUpResponse> {
  // no session expected or required here
  return postJSON<SignUpResponse>("/auth/signup", payload, {
    credentials: "include",
  });
}
