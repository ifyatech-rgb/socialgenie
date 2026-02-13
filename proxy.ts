import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/checkout-required"];

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Proxy runs before route handlers (Next.js 16). Same logic as former middleware:
 * Auth check and redirect for protected paths; payment check happens in dashboard layout.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  if (!token && isProtected(pathname)) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout-required"],
};
