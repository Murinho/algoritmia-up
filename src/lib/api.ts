// src/lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Helper type + function to read detail/message safely
type JsonLike = { [key: string]: unknown };

function extractErrorDetail(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const obj = body as JsonLike;
    const detail = obj["detail"];
    const message = obj["message"];

    if (typeof detail === "string") return detail;
    if (typeof message === "string") return message;
  }
  return `HTTP ${status}`;
}

export async function postJSON<TResponse, TPayload = unknown>(
  path: string,
  body: TPayload
): Promise<TResponse> {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore bad/non-JSON responses
  }

  if (!res.ok) {
    const detail = extractErrorDetail(data, res.status);
    throw new HttpError(res.status, detail, data);
  }

  // We trust the caller to pick the correct TResponse
  return data as TResponse;
}
