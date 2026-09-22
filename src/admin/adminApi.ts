import { api, ApiError } from "@/lib/api";

export const SESSION_ENDED_EVENT = "admin-session-ended";

/**
 * Calls /api/admin/... If the console session has ended (timed out, or the admin role was removed)
 * the whole console drops back to the sign-in screen.
 */
export async function adminApi<T>(path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  try {
    return await api<T>(`/admin${path}`, options);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    }
    throw err;
  }
}

export function errorText(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
}

/** Path of a request's attached document, for <img src>, links and downloads. */
export function fileUrl(requestId: number, fileId: number, download = false): string {
  return `/api/admin/requests/${requestId}/files/${fileId}${download ? "?download=1" : ""}`;
}

/** Path of a document attached at sign-up, before the account had a request of its own. */
export function signupFileUrl(userId: number, fileId: number, download = false): string {
  return `/api/admin/pending-signups/${userId}/files/${fileId}${download ? "?download=1" : ""}`;
}
