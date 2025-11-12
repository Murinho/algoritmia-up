export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export class HttpError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// helpers
function extractMessage(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const d = rec.detail;
    const m = rec.message;
    if (typeof d === "string") return d;
    if (typeof m === "string") return m;
  }
  return undefined;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    // handles JSON bodies; will throw on empty/non-JSON
    return await res.json();
  } catch {
    return null;
  }
}

export async function postJSON<T>(
  path: string,
  payload: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(payload),
    ...init,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg = extractMessage(data) ?? `HTTP ${res.status}`;
    throw new HttpError(res.status, msg, data);
  }

  // for 204 No Content (or empty body), return undefined as T
  if (res.status === 204 || data === null) {
    return undefined as T;
  }

  return data as T;
}
