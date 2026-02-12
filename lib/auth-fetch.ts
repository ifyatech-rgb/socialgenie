/**
 * Auth-aware fetch for NextAuth apps.
 * Ensures credentials (cookies) are sent and adds dev fallback header when session exists.
 * Use for all API calls that require the current user (dashboard, generate video, etc.).
 */

import type { Session } from "next-auth";

export type AuthFetchSession = Pick<Session, "user"> | null | undefined;

/**
 * Fetch with credentials and optional session identity for API auth.
 * - Always sends credentials: "include" (so NextAuth session cookie is sent).
 * - When session?.user?.email is set, adds X-Dev-Email (dev-only fallback so API can identify user if cookie isn't read).
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  session?: AuthFetchSession
): Promise<Response> {
  const headers = new Headers(options.headers ?? {});
  // Do NOT set Content-Type for FormData - browser must set multipart/form-data with boundary
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  } else {
    headers.delete("Content-Type");
  }
  if (session?.user?.email) {
    headers.set("X-Dev-Email", session.user.email);
  }
  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
