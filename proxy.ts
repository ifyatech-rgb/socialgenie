import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/checkout-required"];

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Proxy runs before route handlers (Next.js 16). Replaces middleware.ts (Next only allows one).
 * - Protect /dashboard and /checkout-required (require auth)
 * - Redirect logged-in users from /auth/signin, /auth/signup to /dashboard
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  // Logged-in users on sign-in/sign-up → dashboard
  if (token && (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout-required", "/auth/signin", "/auth/signin/", "/auth/signup", "/auth/signup/"],
};
