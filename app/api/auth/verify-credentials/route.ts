import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

/**
 * POST /api/auth/verify-credentials
 * Verify email + password. Returns ok + error message so client can show errors
 * or proceed to NextAuth callback to create session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email as string)?.trim()?.toLowerCase()
    const password = body.password as string

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password_hash: true },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No account found. Please sign up first." },
        { status: 401 }
      )
    }

    if (user.password_hash) {
      const valid = await compare(password, user.password_hash)
      if (!valid) {
        return NextResponse.json(
          { ok: false, error: "Incorrect password. Please try again." },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({ ok: true, email: user.email })
  } catch (e) {
    const code = (e as { code?: string })?.code
    const msg = e instanceof Error ? e.message : "Something went wrong. Please try again."
    console.error("[verify-credentials]", code ?? msg, e)
    const isDbError =
      msg.includes("connection") ||
      msg.includes("timeout") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      code?.startsWith?.("P")
    return NextResponse.json(
      {
        ok: false,
        error: isDbError ? "Database connection failed. Please try again later." : "Something went wrong. Please try again.",
      },
      { status: 500 }
    )
  }
}
