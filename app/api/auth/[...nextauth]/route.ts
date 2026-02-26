import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

function withJsonError(
  fn: (req: Request, context: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>
) {
  return async (req: Request, context: { params: Promise<Record<string, string | string[]>> }) => {
    try {
      return await fn(req, context);
    } catch (err) {
      console.error("[next-auth] Route error:", err);
      return new Response(
        JSON.stringify({ error: "AuthError", message: "Authentication request failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}

export const GET = withJsonError(handler);
export const POST = withJsonError(handler);
