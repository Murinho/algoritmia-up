// src/lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

export class HttpError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function postJSON<T>(
  path: string,
  payload: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: JSON.stringify(payload),
    // allow caller to override, but default to include cookies
    credentials: init?.credentials ?? "include",
    ...init,
  });

  // Read raw text first so we can handle both JSON and non-JSON bodies
  let raw: string | null = null;
  try {
    raw = await res.text();
  } catch {
    raw = null;
  }

  let data: unknown = null;
  if (raw && raw.length > 0) {
    try {
      data = JSON.parse(raw);
    } catch {
      // not JSON, keep the raw string
      data = raw;
    }
  }

  if (!res.ok) {
    let msg = res.statusText || "Request failed";

    if (data && typeof data === "object" && "detail" in data) {
      // FastAPI-style error: {"detail": "..."}
      msg = String((data as { detail: unknown }).detail);
    }

    throw new HttpError(res.status, msg, data);
  }

  // At this point, we **only** return the parsed data (or null if no body).
  return data as T;
}
