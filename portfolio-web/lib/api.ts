/**
 * Typed fetch wrapper around the Go API.
 *
 * Two callers exist:
 *  - Server Components / SSG / ISR: call apiGet(path, { next }) — no cookies needed
 *    for public data; for gated reads pass a forwarded cookie header.
 *  - Client Components (admin, forms): call the api.* helpers with credentials:
 *    'include' so the httpOnly cookies ride along.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type FetchOpts = RequestInit & { next?: { revalidate?: number } };

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Server-side GET for public/ISR data. */
export function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  return request<T>(path, { method: "GET", ...opts });
}

/** Client-side helpers — always include credentials so cookies flow. */
export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: "GET", credentials: "include" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) =>
    request<T>(path, { method: "DELETE", credentials: "include" }),
  /** multipart upload (media) — no JSON content-type. */
  upload: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const b = await res.json();
        if (b?.error) msg = b.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, msg);
    }
    return (await res.json()) as T;
  },
};
