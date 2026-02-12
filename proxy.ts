import type { NextRequest } from "next/server";
import nextAuthMiddleware from "next-auth/middleware";

/**
 * Proxy runs before route handlers (renamed from middleware in Next.js 16).
 * Protects dashboard routes with NextAuth.
 */
export function proxy(request: NextRequest) {
  return nextAuthMiddleware(request as Parameters<typeof nextAuthMiddleware>[0]);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
