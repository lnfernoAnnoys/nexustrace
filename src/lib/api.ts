export class ApiError extends Error {
  status: number;
  data: { error?: string; restart?: boolean } | null;

  constructor(status: number, message: string, data: ApiError["data"] = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

/**
 * Calls the NexusTrace backend (proxied to /api in dev). The session lives in an HttpOnly cookie.
 * A FormData body is sent as a file upload; anything else is sent as JSON.
 */
export async function api<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const isUpload = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined || isUpload ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isUpload ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the NexusTrace server. Make sure it is running (npm run dev).");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    const parsed = data as ApiError["data"];
    const fallback =
      res.status >= 500 ? "The NexusTrace server isn't responding. Make sure it is running (npm run dev)." : "Request failed";
    throw new ApiError(res.status, parsed?.error ?? fallback, parsed);
  }
  return data as T;
}
